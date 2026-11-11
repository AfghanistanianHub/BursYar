import assert from 'node:assert/strict';
import {chromium, expect} from '@playwright/test';
import {createServer} from 'vite';

const server = await createServer({server:{host:'127.0.0.1',port:0}});
await server.listen();
let browser;
try {
  browser = await chromium.launch({args:['--no-sandbox'],
    executablePath:process.env.CHROMIUM_PATH || undefined});
  const url = `http://127.0.0.1:${server.httpServer.address().port}`;
  const page = await browser.newPage({viewport:{width:1280,height:900}});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  let unavailable = false;
  let documents = [{id:'transcript',uploadedAt:'2026-11-10T00:00:00Z',reviewed:false}];
  await page.route('**/src/auth.js', route => route.fulfill({contentType:'text/javascript',body:`
    let user = null;
    const observers = new Set();
    function update(next){user = next;for(const observer of observers)observer(user);}
    export async function onAuthChange(observer){observers.add(observer);observer(user);return ()=>observers.delete(observer);}
    export async function signIn(){update({uid:'student'});}
    export async function signOut(){update(null);}
    export async function getInferenceToken(){if(!user)throw Error('Sign in required');return 'test-token';}
  `}));
  await page.route('**/api/documents', route => unavailable
    ? route.fulfill({status:503,json:{error:'unavailable'}})
    : route.fulfill({json:documents}));
  await page.route('**/api/documents/transcript', route => route.fulfill({json:{
    id:'transcript',text:'GPA: 3.4/4',pending:[],reviewedAt:null
  }}));
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
  await expect(dashboard.getByText('GPA: 3.4/4',{exact:true}).last()).toBeVisible();

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
  documents = [];
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
}
