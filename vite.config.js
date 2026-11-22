import {defineConfig} from 'vite';
import {execFileSync} from 'node:child_process';

// Stamp every build with the commit it came from. Vercel and GitHub Actions
// export the commit being deployed; a local build falls back to the checkout.
// Writing it into the HTML lets release-smoke compare the deployed frontend with
// the backend's /health commit instead of trusting a dashboard, which is what
// BY-04 requires. An unknown commit stamps "unknown" and fails the smoke check
// rather than being silently reported as a match.
function buildCommit(){
 const published=(process.env.VERCEL_GIT_COMMIT_SHA??process.env.GITHUB_SHA??'').trim().toLowerCase();
 if(/^[0-9a-f]{7,40}$/.test(published))return published;
 try{
  const local=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim().toLowerCase();
  return /^[0-9a-f]{7,40}$/.test(local)?local:'unknown';
 }catch{
  return 'unknown';
 }
}
const commit=buildCommit();

export default defineConfig({
 server:{proxy:{'/api':{target:'http://127.0.0.1:8080',changeOrigin:false}}},
 plugins:[{
  name:'bursyar-build-stamp',
  transformIndexHtml(html){return html.replace('</head>',`<meta name="bursyar-build" content="${commit}"/></head>`);}
 }]
});
