import {chromium, expect} from '@playwright/test';
import {createServer} from 'vite';

const outcomes = [
  ['auth/popup-closed-by-user', ['cancelled', 'لغو شد', 'لغوه شول']],
  ['auth/cancelled-popup-request', ['cancelled', 'لغو شد', 'لغوه شول']],
  ['auth/popup-blocked', ['Allow pop-ups', 'پنجرهٔ جدید', 'نوې کړکۍ']],
  ['auth/operation-not-supported-in-this-environment', ['full browser', 'مرورگر دستگاه', 'براوزر']],
  ['auth/unauthorized-domain', ['site address', 'این نشانی', 'دې پته']],
  ['auth/operation-not-allowed', ['this version', 'این نسخه', 'دې نسخه']],
  ['missing-config', ['this version', 'این نسخه', 'دې نسخه']],
  ['auth/unexpected', ['try again', 'دوباره تلاش', 'بیا هڅه']],
];
const server = await createServer({server:{host:'127.0.0.1',port:0}});
let browser;
try {
  await server.listen();
  browser = await chromium.launch();
  const page = await browser.newPage();
  await page.route('**/src/auth.js', route => route.fulfill({
    contentType:'text/javascript',
    body:`
      export async function onAuthChange(callback) { callback(null); return () => {}; }
      export async function signOut() {}
      export async function getInferenceToken() { throw Error('Unexpected protected request'); }
      export async function signIn() {
        if (window.testAuthCode === 'missing-config') throw Error('Firebase sign-in is not configured');
        throw Object.assign(Error('sensitive-diagnostic-marker'), {code:window.testAuthCode});
      }`
  }));
  await page.goto('http://127.0.0.1:' + server.httpServer.address().port);
  const account = page.locator('details.account').filter({has:page.locator('#account-controls')});
  for (const [index, language] of ['en','fa','ps'].entries()) {
    await page.selectOption('#language', language);
    await account.locator('summary').click();
    const login = account.getByRole('button');
    const status = account.getByRole('status');
    for (const [code, messages] of outcomes) {
      await page.evaluate(value => { window.testAuthCode = value; }, code);
      await login.click();
      await expect(status).toContainText(messages[index]);
      await expect(status).not.toContainText(/sensitive-diagnostic-marker|auth\/|Firebase/);
      await expect(login).toBeEnabled();
    }
    await account.locator('summary').click();
  }
  console.log('24 localized sign-in feedback cases passed with simulated Firebase outcomes.');
} finally {
  await browser?.close();
  await server.close();
}
