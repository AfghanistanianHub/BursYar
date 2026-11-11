import assert from 'node:assert/strict';
import {chromium, expect} from '@playwright/test';
import {createServer} from 'vite';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
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
  const transcript = await upload.json();
  browser = await chromium.launch({args:['--no-sandbox'],
    executablePath:process.env.CHROMIUM_PATH || undefined});
  const page = await browser.newPage({viewport:{width:1280,height:900}});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  let unavailable = false;
  await page.route('**/src/auth.js', route => route.fulfill({contentType:'text/javascript',body:`
    let user = null;
    const observers = new Set();
    function update(next){user = next;for(const observer of observers)observer(user);}
    export async function onAuthChange(observer){observers.add(observer);observer(user);return ()=>observers.delete(observer);}
    export async function signIn(){update({uid:${JSON.stringify(student)}});}
    export async function signOut(){update(null);}
    export async function getInferenceToken(){if(!user)throw Error('Sign in required');return user.uid;}
  `}));
  await page.route('**/api/**',async route=>{
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path==='/api/analyze') throw Error('Inference forbidden');
    if (unavailable && path==='/api/documents') {
      return route.fulfill({status:503,json:{error:'unavailable'}});
    }
    const response = await fetch(apiUrl+path,{
      method:request.method(),
      headers:{authorization:request.headers().authorization,origin:url,'content-type':'application/json'},
      body:request.postData() ?? undefined
    });
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

  await dashboard.getByRole('link',{name:'Dashboard',exact:true}).click();
  await expect(dashboard.getByRole('heading',{name:'My dashboard'})).toBeVisible();
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
  await page.locator('[data-research-save]').first().click();
  await page.locator('#dashboard-entry').click();
  await expect(dashboard.getByText('1 saved scholarship',{exact:true})).toBeVisible();
  await dashboard.getByRole('link',{name:'Saved scholarships',exact:true}).click();
  await expect(dashboard.locator('.dashboard-saved-list li')).toHaveCount(1);

  await dashboard.getByRole('link',{name:'Assessments',exact:true}).click();
  await expect(dashboard.locator('#local-assessment')).toBeVisible();
  await page.goBack();
  await expect(dashboard.locator('.dashboard-saved-list li')).toHaveCount(1);

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
  const deletion = await fetch(apiUrl+'/api/documents/'+transcript.id,{
    method:'DELETE',headers:{authorization:'Bearer '+student,origin:url}
  });
  assert.equal(deletion.status,200);
  await dashboard.getByRole('button',{name:'Refresh list'}).click();
  await dashboard.getByRole('link',{name:'Dashboard',exact:true}).click();
  await expect(dashboard.getByRole('link',{name:'Add a document'})).toBeVisible();
  await dashboard.getByRole('link',{name:'Add a document'}).click();
  unavailable = true;
  await dashboard.getByRole('button',{name:'Refresh list'}).click();
  await dashboard.getByRole('link',{name:'Dashboard',exact:true}).click();
  await expect(dashboard.getByText('Document status unavailable',{exact:true})).toBeVisible();

  await dashboard.locator('.account summary').click();
  await dashboard.locator('#account-controls button').last().click();
  await expect(dashboard).toBeHidden();
  await expect(page.locator('#top')).toBeVisible();
  assert.deepEqual(errors,[]);
  console.log('Dashboard browser checks passed');
} finally {
  await browser?.close();
  await server.close();
  if(api.listening)await new Promise(resolve=>api.close(resolve));
  documents.close();
  rmSync(directory,{recursive:true,force:true});
}
