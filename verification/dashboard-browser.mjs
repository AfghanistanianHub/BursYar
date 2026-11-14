import assert from 'node:assert/strict';
import {chromium, expect} from '@playwright/test';
import {createServer} from 'vite';
import {mkdtempSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {describeCapabilities} from '../engine/capabilities.js';
import {createScholarshipCatalog} from '../engine/deterministic.js';
import {localProgram} from './fixtures/local-program.mjs';
import {DocumentStore} from '../engine/documents.js';
import {createInferenceServer} from '../engine/http.js';

const server = await createServer({server:{host:'127.0.0.1',port:0}});
await server.listen();
const url = `http://127.0.0.1:${server.httpServer.address().port}`;
const directory = mkdtempSync(join(tmpdir(),'bursyar-dashboard-'));
const documents = new DocumentStore(join(directory,'documents.db'));
const student = 'dashboard-test-student';
const api = createInferenceServer({
  projectId:'demo-bursyar', origin:url, documents,
  catalog:createScholarshipCatalog([localProgram]),
  capabilities:describeCapabilities({documentsAvailable:true,familyGrantsPresent:false}),
  quota:{reserve(){throw Error('Inference forbidden in dashboard verification');}},
  infer:async()=>{throw Error('Inference forbidden in dashboard verification');},
  verify:async token=>({uid:token,aud:'demo-bursyar',
    iss:'https://securetoken.google.com/demo-bursyar',bursyarDemo:true})
});
let browser;
try {
  await new Promise(resolve=>api.listen(0,'127.0.0.1',resolve));
  const apiUrl = `http://127.0.0.1:${api.address().port}`;
  const upload = await fetch(apiUrl+'/api/documents',{
    method:'POST',
    headers:{authorization:'Bearer '+student,origin:url,'content-type':'application/json'},
    body:JSON.stringify({text:'SYNTHETIC DASHBOARD DOCUMENT\nGPA: 3.4/4',mime:'text/plain',consent:true})
  });
  assert.equal(upload.status,201);
  await documents.updateProfile(student,{consent:true,values:{degree:'bachelor',targetDegree:'master'}});
  browser = await chromium.launch({args:['--no-sandbox'],
    executablePath:process.env.CHROMIUM_PATH || undefined});
  const page = await browser.newPage({viewport:{width:1280,height:900}});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  let unavailable = false;
  let initialDocumentReads=0,initialProfileReads=0;
  let sourceImports=0,analysisRequests=0,profileWrites=0,exportRequests=0;
  await page.route('**/src/auth.js', route => route.fulfill({contentType:'text/javascript',body:`
    let user = null;
    const observers = new Set();
    function update(next){user = next;for(const observer of observers)observer(user);}
    export async function onAuthChange(observer){observers.add(observer);observer(user);return ()=>observers.delete(observer);}
    export async function signIn(){update({uid:${JSON.stringify(student)}});}
    export async function signOut(){update(null);}
    window.switchTestAccount=uid=>update({uid});
    export async function getInferenceToken(){if(window.holdAnalysisToken){window.heldTokenRequests=(window.heldTokenRequests??0)+1;await new Promise(resolve=>{window.releaseAnalysisToken=resolve;});}if(!user)throw Error('Sign in required');return user.uid;}
  `}));
  await page.route('**/health',async route=>{
    const response=await fetch(apiUrl+'/health');
    await route.fulfill({status:response.status,contentType:'application/json',body:await response.text()});
  });
  let holdEvaluation;
  let catalogUnavailable=false;
  let evaluationUnavailable=false;
  let evaluationRequests=0;
  await page.route('**/api/**',async route=>{
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if(path==='/api/export')exportRequests++;
    if(path==='/api/evaluate')evaluationRequests++;
    if(path==='/api/profile'&&request.method()==='PUT')profileWrites++;
    if(path==='/api/source/import')sourceImports++;
    if(path==='/api/analyze'){analysisRequests++;return route.abort();}
    const startupFailure=path==='/api/documents'&&request.method()==='GET'&&++initialDocumentReads===1;
    const profileStartupFailure=path==='/api/profile'&&request.method()==='GET'&&++initialProfileReads===1;
    if (startupFailure||profileStartupFailure||(unavailable&&path==='/api/documents')||
        (catalogUnavailable&&path==='/api/scholarships')||
        (evaluationUnavailable&&path==='/api/evaluate')) {
      return route.fulfill({status:503,json:{error:'unavailable'}});
    }
    const response = await fetch(apiUrl+path,{
      method:request.method(),
      headers:{authorization:request.headers().authorization,origin:url,'content-type':'application/json'},
      body:request.postData() ?? undefined
    });
    if(path==='/api/evaluate'&&holdEvaluation)await holdEvaluation();
    await route.fulfill({status:response.status,contentType:'application/json',body:await response.text()});
  });
  await page.goto(url+'/#dashboard/documents');
  await expect(page.locator('#top')).toBeVisible();
  await expect(page.locator('#documents-mount')).toBeHidden();
  await page.locator('.site .account summary').click();
  await page.locator('#account-controls button').first().click();
  const dashboard = page.locator('#student-dashboard');
  await expect(dashboard.getByRole('heading',{name:'Documents & profile',exact:true})).toBeVisible();
  await expect(dashboard.locator('#documents-mount')).toBeVisible();
  await expect(dashboard.locator('#documents-mount select option').filter({hasText:'Pending'})).toHaveCount(1);
  assert.equal(initialDocumentReads,2);

  await dashboard.getByRole('link',{name:'Dashboard',exact:true}).click();
  await expect(dashboard.getByRole('heading',{name:'My dashboard'})).toBeVisible();
  const summary=dashboard.locator('.dashboard-profile-summary');
  await expect(summary.locator('dd')).toHaveText(['Bachelor','Master']);
  assert.equal(initialProfileReads,2);
  await summary.getByRole('link',{name:'Edit profile'}).click();
  await expect(dashboard.locator('#profile h2')).toBeFocused();
  const academicHistory=dashboard.locator('#profile-academicHistory');
  await academicHistory.fill('Unsaved synthetic history');
  await page.evaluate(()=>document.dispatchEvent(new CustomEvent('bursyar:profile',{detail:{
    degree:{value:'bachelor',origin:'user_declared'},
    targetDegree:{value:'master',origin:'user_declared'},
    languages:{value:'Synthetic language update',origin:'user_declared'}
  }})));
  await expect(academicHistory).toHaveValue('Unsaved synthetic history');
  await expect(dashboard.locator('#profile-languages')).toHaveValue('Synthetic language update');
  await dashboard.getByRole('button',{name:'Load my saved profile'}).click();
  await expect(academicHistory).toHaveValue('');
  for(const [formId,inputId,value] of [
    ['profile-form','profile-targetDegree','doctorate'],
    ['academic-evidence','academic-academicScore','91']
  ]){
    const form=dashboard.locator('#'+formId);
    const input=form.locator('#'+inputId);
    if(formId==='profile-form')await input.selectOption(value);
    else await input.fill(value);
    await form.locator('input[type=checkbox]').check();
    await page.evaluate(()=>{window.releaseAnalysisToken=undefined;window.holdAnalysisToken=true;});
    await form.locator('button[type=submit]').click();
    await page.waitForFunction(()=>typeof window.releaseAnalysisToken==='function');
    const pendingTokens=await page.evaluate(()=>window.heldTokenRequests);
    await form.dispatchEvent('submit',{cancelable:true});
    assert.equal(await page.evaluate(()=>window.heldTokenRequests),pendingTokens);
    await dashboard.locator('#dashboard-language').selectOption('fa');
    await page.evaluate(async()=>{
      window.holdAnalysisToken=false;
      window.releaseAnalysisToken();
      await new Promise(resolve=>setTimeout(resolve,0));
    });
    await dashboard.locator('#dashboard-language').selectOption('en');
  }
  assert.equal(profileWrites,0);
  assert.equal(documents.profile(student).targetDegree.value,'master');
  assert.equal(documents.profile(student).academicScore,undefined);
  await documents.updateProfile(student,{consent:true,values:{languages:'Newer server value'}});
  const profileForm=dashboard.locator('#profile-form');
  await profileForm.locator('#profile-targetDegree').selectOption('bachelor');
  await profileForm.locator('#profile-targetDegree').selectOption('master');
  await profileForm.locator('#profile-academicHistory').fill('Saved synthetic history');
  await profileForm.locator('[name=consent]').check();
  const partialSave=page.waitForResponse(response=>
    new URL(response.url()).pathname==='/api/profile'&&response.request().method()==='PUT');
  await profileForm.locator('button[type=submit]').click();
  const savedProfileResponse=await partialSave;
  assert.equal(savedProfileResponse.status(),200);
  assert.deepEqual(savedProfileResponse.request().postDataJSON().values,{academicHistory:'Saved synthetic history'});
  await expect(profileForm.locator('#profile-languages')).toHaveValue('Newer server value');
  await documents.updateProfile(student,{consent:true,values:{academicScore:{score:80,scale:100}}});
  const scoreForm=dashboard.locator('#academic-evidence');
  await dashboard.getByRole('button',{name:'Reload saved scores'}).click();
  await expect(scoreForm.locator('#academic-academicScore')).toHaveValue('80');
  await documents.updateProfile(student,{consent:true,values:{academicScore:{score:90,scale:100}}});
  await scoreForm.locator('#academic-gpa').fill('3.5');
  const updatedProfile=documents.profile(student);
  await page.evaluate(detail=>document.dispatchEvent(new CustomEvent('bursyar:profile',{detail})),updatedProfile);
  await expect(scoreForm.locator('#academic-gpa')).toHaveValue('3.5');
  await expect(scoreForm.locator('#academic-academicScore')).toHaveValue('90');

  await scoreForm.locator('input[type=checkbox]').check();
  const pendingScoreSave=page.waitForResponse(response=>
    new URL(response.url()).pathname==='/api/profile'&&response.request().method()==='PUT');
  await scoreForm.locator('button[type=submit]').click();
  const scoreSave=await pendingScoreSave;
  assert.equal(scoreSave.status(),200);
  assert.deepEqual(scoreSave.request().postDataJSON().values,{gpa:{gpa:3.5,scale:4}});
  await expect(scoreForm.locator('#academic-academicScore')).toHaveValue('90');



  await dashboard.getByRole('link',{name:'Dashboard',exact:true}).click();
  await expect(dashboard.getByText('1 document to review',{exact:true})).toBeVisible();
  await dashboard.getByRole('link',{name:'Review extracted details'}).click();
  await expect(dashboard.locator('.document-source')).toContainText('GPA: 3.4/4');
  await dashboard.getByRole('combobox',{name:'Approve reviewed claims'}).selectOption('accept');
  await dashboard.getByRole('button',{name:'Approve reviewed claims',exact:true}).click();
  await expect.poll(()=>documents.list(student)[0]?.reviewed).toBe(true);
  assert.deepEqual(documents.profile(student).gpa?.value,{gpa:3.4,scale:4});
  await dashboard.getByRole('link',{name:'Dashboard',exact:true}).click();
  await expect(dashboard.getByText('1 saved document',{exact:true})).toBeVisible();
  await expect(dashboard.getByRole('link',{name:'Open assessments'})).toBeVisible();

  await dashboard.getByRole('link',{name:'Saved scholarships',exact:true}).click();
  await expect(dashboard.getByText('No saved scholarships yet',{exact:true})).toBeVisible();
  await dashboard.getByRole('link',{name:'Browse scholarships'}).click();
  await expect(page.locator('#research-explorer')).toBeVisible();
  await page.locator('[data-research-save]:not([data-research-save="eth-esop-2027"])').first().click();
  await page.locator('[data-research-save="eth-esop-2027"]').click();
  await page.locator('#dashboard-entry').click();
  await expect(dashboard.getByText('2 saved scholarships',{exact:true})).toBeVisible();
  await dashboard.getByRole('link',{name:'Saved scholarships',exact:true}).click();
  await expect(dashboard.locator('.dashboard-saved-list li')).toHaveCount(2);
  await expect(dashboard.locator('.dashboard-saved-deadline')).toHaveCount(2);
  await expect(dashboard.locator('.dashboard-saved-list li').filter({hasText:'ETH Zurich'}))
    .toContainText('2026-11-30');

  const healthResponse=page.waitForResponse(response=>new URL(response.url()).pathname==='/health');
  await dashboard.getByRole('link',{name:'Assessments',exact:true}).click();
  const health=await (await healthResponse).json();
  assert.equal(health.capabilities.familyAssessment.available,false);
  await expect(dashboard.locator('#local-scope')).toBeHidden();
  await expect(dashboard.locator('label[for="local-scope"]')).toBeHidden();
  const assessment=dashboard.locator('#local-assessment');
  await expect(assessment).toBeVisible();
  await dashboard.locator('#source-url').fill(localProgram.sourceUrl);
  const personalCatalog=page.waitForRequest(request=>new URL(request.url()).pathname==='/api/scholarships');
  await assessment.getByRole('button',{name:'Load reviewed scholarships'}).click();
  await personalCatalog;
  await expect(assessment.locator('#local-program')).toHaveValue(localProgram.id);
  await assessment.getByRole('button',{name:'Assess saved profile'}).click();
  await expect(dashboard.locator('.local-workflow blockquote')).toHaveText(localProgram.sourceText);
  evaluationUnavailable=true;
  await assessment.getByRole('button',{name:'Assess saved profile'}).click();
  await expect(dashboard.locator('#local-status')).toContainText('Unavailable');
  await expect(dashboard.locator('.local-workflow blockquote')).toHaveCount(0);
  evaluationUnavailable=false;

  catalogUnavailable=true;
  await assessment.getByRole('button',{name:'Load reviewed scholarships'}).click();
  await expect(dashboard.locator('#local-status')).toContainText('Unavailable');
  await expect(dashboard.locator('#local-source-info a')).toHaveCount(0);
  await expect(assessment.getByRole('button',{name:'Assess saved profile'})).toBeDisabled();
  catalogUnavailable=false;
  await assessment.getByRole('button',{name:'Load reviewed scholarships'}).click();
  await expect(assessment.locator('#local-program')).toHaveValue(localProgram.id);
  const degreeConsent=assessment.locator('#local-consent');
  await degreeConsent.check();
  let releaseEvaluation, evaluationReady;
  const heldEvaluation=new Promise(resolve=>{releaseEvaluation=resolve;});
  const evaluationStarted=new Promise(resolve=>{evaluationReady=resolve;});
  holdEvaluation=async()=>{
    evaluationReady();
    await heldEvaluation;
  };
  await assessment.getByRole('button',{name:'Assess saved profile'}).click();
  await Promise.race([evaluationStarted, page.waitForTimeout(5000).then(()=>{if(holdEvaluation)throw new Error('Evaluation did not reach API');})]);
  const evaluationsBeforeRepeat=evaluationRequests;
  await assessment.dispatchEvent('submit',{cancelable:true});
  await assessment.locator('#local-degree').evaluate(select=>{
    select.value='master';
    select.dispatchEvent(new Event('change',{bubbles:true}));
  });
  const obsoleteResponse=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/evaluate');
  releaseEvaluation();
  const obsolete=await obsoleteResponse;
  assert.equal(obsolete.status(),200);
  await obsolete.finished();
  await page.waitForFunction(()=>!document.querySelector('#local-assessment button[type=submit]').disabled);
  await expect(dashboard.locator('.local-workflow blockquote')).toHaveCount(0);
  holdEvaluation=undefined;
  assert.equal(evaluationRequests,evaluationsBeforeRepeat);
  await expect(degreeConsent).not.toBeChecked();
  const writesBeforeDegreeSave=profileWrites;
  await assessment.getByRole('button',{name:'Save degree in this scope'}).click();
  await degreeConsent.check();
  const reconfirmedSave=page.waitForResponse(response=>
    new URL(response.url()).pathname==='/api/profile'&&response.request().method()==='PUT');
  await assessment.getByRole('button',{name:'Save degree in this scope'}).click();
  assert.equal((await reconfirmedSave).status(),200);
  assert.equal(profileWrites,writesBeforeDegreeSave+1);
  await expect(dashboard.locator('#local-status')).toHaveText('Degree saved in the selected scope.');
  await expect(degreeConsent).not.toBeChecked();
  await dashboard.getByRole('link',{name:'Dashboard',exact:true}).click();
  await expect(dashboard.locator('.dashboard-profile-summary dd')).toHaveText(['Master','Master']);
  await dashboard.getByRole('link',{name:'Documents & profile',exact:true}).click();
  await expect(dashboard.locator('#profile-degree')).toHaveValue('master');
  await dashboard.getByRole('link',{name:'Assessments',exact:true}).click();


  await dashboard.locator('#manual-source').click();
  await dashboard.locator('#requirements').fill('Applicants must provide academic transcripts. Tuition fees are covered.');
  await dashboard.locator('#source-approved').check();
  await page.evaluate(()=>{window.holdAnalysisToken=true;});
  await dashboard.locator('#analyze-form button[type=submit]').click();
  await page.waitForFunction(()=>typeof window.releaseAnalysisToken==='function');
  await dashboard.locator('#dashboard-language').selectOption('fa');
  await page.evaluate(async()=>{
    window.holdAnalysisToken=false;
    window.releaseAnalysisToken();
    await new Promise(resolve=>setTimeout(resolve,0));
  });
  await expect(dashboard.locator('#analyze-form')).not.toHaveAttribute('aria-busy','true');
  await expect(dashboard.locator('#analysis-result')).toBeHidden();
  await dashboard.locator('#dashboard-language').selectOption('en');
  await dashboard.getByRole('link',{name:'Saved scholarships',exact:true}).click();
  await expect(dashboard.locator('.dashboard-saved-list li')).toHaveCount(2);

  await dashboard.getByRole('link',{name:'Dashboard',exact:true}).click();
  assert.equal(await dashboard.locator('h1').evaluate(el=>getComputedStyle(el).fontWeight),'500');
  for (const width of [320,390,1280]) {
    await page.setViewportSize({width,height:900});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  }
  for (const language of ['fa','ps','en']) {
    await dashboard.locator('select').selectOption(language);
    await expect(page.locator('html')).toHaveAttribute('dir',language==='en'?'ltr':'rtl');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  }

  await dashboard.getByRole('link',{name:'Documents & profile',exact:true}).click();
  await dashboard.getByRole('link',{name:'Assessments',exact:true}).click();
  await dashboard.locator('#source-url').fill(localProgram.sourceUrl);
  await page.evaluate(()=>{
    const original=File.prototype.arrayBuffer;
    File.prototype.arrayBuffer=function(){
      if(this.name!=='pending-source.txt')return original.call(this);
      return new Promise((resolve,reject)=>{
        window.rejectPendingSource=()=>reject(new Error('Synthetic file read failed'));
      });
    };
  });
  await dashboard.locator('#source-file').setInputFiles({
    name:'pending-source.txt',mimeType:'text/plain',buffer:Buffer.from(localProgram.sourceText)
  });
  await page.waitForFunction(()=>typeof window.rejectPendingSource==='function');
  await dashboard.getByRole('link',{name:'Documents & profile',exact:true}).click();
  const accountData=dashboard.locator('#account-data-mount');
  const downloadAccountData=async()=>{
    const pending=page.waitForEvent('download');
    await accountData.getByRole('button',{name:'Download profile and documents (JSON)',exact:true}).click();
    const download=await pending;
    assert.equal(download.suggestedFilename(),'BursYar-profile-and-documents.json');
    return JSON.parse(readFileSync(await download.path(),'utf8'));
  };
  const before=await downloadAccountData();
  assert.deepEqual(before,documents.export(student));
  assert.equal(before.documents.length,1);
  assert.equal(before.profile.targetDegree.value,'master');

  await accountData.getByRole('button',{name:'Delete stored profile and documents',exact:true}).click();
  await accountData.getByRole('button',{name:'Cancel',exact:true}).click();
  assert.equal(documents.list(student).length,1);
  await accountData.getByRole('button',{name:'Delete stored profile and documents',exact:true}).click();
  await accountData.getByRole('button',{name:'Permanently delete my stored profile and documents'}).click();
  await expect(accountData.getByRole('status')).toHaveText('Your stored profile and documents were deleted.');
  assert.deepEqual(documents.list(student),[]);
  assert.deepEqual(documents.profile(student),{});
  await dashboard.getByRole('link',{name:'Assessments',exact:true}).click();
  await expect(dashboard.locator('.local-workflow blockquote')).toHaveCount(0);
  await page.evaluate(async()=>{
    window.rejectPendingSource();
    await new Promise(resolve=>setTimeout(resolve,0));
  });
  await expect(dashboard.locator('#source-status')).toBeEmpty();
  await expect(dashboard.locator('#source-file')).toHaveValue('');
  assert.equal(sourceImports,0);
  await expect(dashboard.locator('#source-url')).toHaveValue('');
  await expect(dashboard.locator('#local-assessment button[type=submit]')).toBeDisabled();
  await dashboard.getByRole('link',{name:'Documents & profile',exact:true}).click();
  const after=await downloadAccountData();
  assert.deepEqual(after.profile,{});
  assert.deepEqual(after.documents,[]);
  await dashboard.getByRole('link',{name:'Dashboard',exact:true}).click();
  await expect(dashboard.getByRole('link',{name:'Add a document'})).toBeVisible();
  await expect(dashboard.locator('.dashboard-profile-summary dd')).toHaveText(['Unknown / not provided','Unknown / not provided']);
  await dashboard.getByRole('link',{name:'Add a document'}).click();
  unavailable = true;
  await dashboard.getByRole('button',{name:'Refresh list'}).click();
  await dashboard.getByRole('link',{name:'Dashboard',exact:true}).click();
  await expect(dashboard.getByText('Document status unavailable',{exact:true})).toBeVisible();

  await dashboard.getByRole('link',{name:'Assessments',exact:true}).click();
  await dashboard.locator('#source-url').fill(localProgram.sourceUrl);
  await dashboard.locator('#manual-source').click();
  await dashboard.locator('#requirements').fill(localProgram.sourceText);
  await dashboard.locator('#source-approved').check();
  await page.evaluate(()=>{window.releaseAnalysisToken=undefined;window.holdAnalysisToken=true;});
  await dashboard.locator('#analyze-form button[type=submit]').click();
  await page.waitForFunction(()=>typeof window.releaseAnalysisToken==='function');
  await page.evaluate(()=>{
    window.holdAnalysisToken=false;
    window.switchTestAccount('dashboard-other-student');
  });
  await expect(dashboard.locator('#analyze-form')).not.toHaveAttribute('aria-busy','true');
  await expect(dashboard.locator('#requirements')).toHaveValue('');
  await expect(dashboard.locator('#source-approved')).not.toBeChecked();
  await expect(dashboard.locator('#analysis-result')).toBeHidden();
  await page.evaluate(()=>window.releaseAnalysisToken());
  await expect(dashboard.locator('#source-url')).toHaveValue('');

  await dashboard.locator('#source-url').fill(localProgram.sourceUrl);
  await page.evaluate(()=>{window.releaseAnalysisToken=undefined;window.holdAnalysisToken=true;});
  await dashboard.locator('#fetch-source').click();
  await page.waitForFunction(()=>typeof window.releaseAnalysisToken==='function');
  await dashboard.locator('#source-url').fill('https://example.edu/another-award');
  await expect(dashboard.locator('#fetch-source')).toBeEnabled();
  await expect(dashboard.locator('#source-file')).toBeEnabled();
  await page.evaluate(()=>{
    window.holdAnalysisToken=false;
    window.releaseAnalysisToken();
  });
  await expect(dashboard.locator('#source-status')).toBeEmpty();

  await dashboard.getByRole('link',{name:'Documents & profile',exact:true}).click();
  const eraseData=accountData.getByRole('button',{name:'Delete stored profile and documents',exact:true});
  await eraseData.click();
  await expect(accountData.getByRole('dialog')).toBeVisible();
  await page.evaluate(()=>window.switchTestAccount('dashboard-third-student'));
  await expect(accountData.getByRole('dialog')).toBeHidden();

  await documents.updateProfile('dashboard-fourth-student',{consent:true,values:{degree:'doctorate'}});
  const exportsBeforeSwitch=exportRequests;
  const exportData=accountData.getByRole('button',{name:'Download profile and documents (JSON)',exact:true});
  await page.evaluate(()=>{window.releaseAnalysisToken=undefined;window.holdAnalysisToken=true;});
  await exportData.click();
  await page.waitForFunction(()=>typeof window.releaseAnalysisToken==='function');
  await expect(exportData).toBeDisabled();
  await page.evaluate(()=>{
    window.holdAnalysisToken=false;
    window.switchTestAccount('dashboard-fourth-student');
  });
  await expect(exportData).toBeEnabled();
  await page.evaluate(()=>window.releaseAnalysisToken());
  const currentAccountExport=await downloadAccountData();
  assert.deepEqual(currentAccountExport,documents.export('dashboard-fourth-student'));
  assert.equal(currentAccountExport.profile.degree.value,'doctorate');
  assert.equal(exportRequests,exportsBeforeSwitch+1);

  await dashboard.locator('.account summary').click();
  await dashboard.locator('#account-controls button').last().click();
  await expect(dashboard).toBeHidden();
  await expect(page.locator('#top')).toBeVisible();
  assert.equal(analysisRequests,0);
  assert.deepEqual(errors,[]);
  console.log('Dashboard browser checks passed');
} finally {
  await browser?.close();
  await server.close();
  if(api.listening)await new Promise(resolve=>api.close(resolve));
  documents.close();
  rmSync(directory,{recursive:true,force:true});
}
