// Sandbox-only helper (not part of the application): installs the shared
// libraries Chromium needs into a user-writable prefix without root, by reading
// Ubuntu's Packages index, fetching .deb files and unpacking them.
//
// Usage:  node scripts/dev/install-browser-libs.mjs
//         source /tmp/chrome-libs.env     # sets LD_LIBRARY_PATH
//
// Playwright's own `install-deps` needs root, which this environment does not
// grant. Run the browser suites with the exported LD_LIBRARY_PATH.
import {execFileSync} from 'node:child_process';
import {existsSync,mkdirSync,readdirSync,writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';

const MIRROR='http://archive.ubuntu.com/ubuntu';
const LIBS='/tmp/chrome-libs';
const CACHE='/tmp/deb-cache';
const CHROME=process.env.CHROME_BINARY??`${process.env.HOME}/.cache/ms-playwright/chromium-1194/chrome-linux/chrome`;
mkdirSync(CACHE,{recursive:true});
mkdirSync(LIBS,{recursive:true});

// Direct dependencies first; transitive sonames are resolved from the index.
const seed=[
 'libnspr4','libnss3','libatk1.0-0t64','libatk-bridge2.0-0t64','libcups2t64',
 'libxkbcommon0','libatspi2.0-0t64','libxcomposite1','libxdamage1','libxfixes3',
 'libxrandr2','libcairo2','libpango-1.0-0','libasound2t64','libgbm1','libdrm2',
 'libxshmfence1','libxcb1','libxi6','libxtst6','libpangoft2-1.0-0','libx11-6','libxext6'
];

const index={};
for(const pocket of ['main','universe']){
 const url=`${MIRROR}/dists/noble/${pocket}/binary-amd64/Packages.gz`;
 const body=execFileSync('curl',['-sL','-m','240',url],{maxBuffer:512*1024*1024});
 for(const stanza of gunzipSync(body).toString('utf8').split('\n\n')){
  const name=/^Package: (.+)$/m.exec(stanza)?.[1];
  const file=/^Filename: (.+)$/m.exec(stanza)?.[1];
  if(name&&file&&!index[name])index[name]={file};
 }
}
console.log(`index entries: ${Object.keys(index).length}`);

const installed=new Set();
function install(name){
 if(installed.has(name))return true;
 if(!index[name])return false;
 const deb=`${CACHE}/${name}.deb`;
 if(!existsSync(deb))execFileSync('curl',['-sL','-m','180','-o',deb,`${MIRROR}/${index[name].file}`]);
 execFileSync('dpkg-deb',['-x',deb,LIBS]);
 installed.add(name);
 return true;
}
for(const name of seed)if(!install(name))console.log(`skip (not in index): ${name}`);

const libDir=`${LIBS}/usr/lib/x86_64-linux-gnu`;
writeFileSync('/tmp/chrome-libs.env',`export LD_LIBRARY_PATH=${libDir}\n`);
const env={...process.env,LD_LIBRARY_PATH:libDir};

function missing(){
 const out=execFileSync('ldd',[CHROME],{encoding:'utf8',env:env.LD_LIBRARY_PATH?env:process.env});
 return [...new Set(out.split('\n').filter(line=>line.includes('not found')).map(line=>line.trim().split(' ')[0]))];
}
// packages.ubuntu.com contents search maps a soname to its binary package.
function packageFor(soname){
 const url=`https://packages.ubuntu.com/search?searchon=contents&keywords=${encodeURIComponent(soname)}&mode=exactfilename&suite=noble&arch=amd64`;
 const html=execFileSync('curl',['-sL','-m','60',url],{encoding:'utf8',maxBuffer:32*1024*1024});
 const match=/<a href="\/noble\/([^"/]+)"/.exec(html);
 return match?.[1]??null;
}

for(let round=1;round<=5;round++){
 const gaps=missing();
 console.log(`round ${round}: ${gaps.length} unresolved -> ${gaps.join(' ')||'none'}`);
 if(!gaps.length)break;
 let progress=false;
 for(const soname of gaps){
  const name=packageFor(soname);
  if(name&&install(name)){console.log(`  ${soname} <- ${name}`);progress=true;}
  else console.log(`  ${soname}: no package found`);
 }
 if(!progress)break;
}
const final=missing();
console.log(final.length?`STILL MISSING: ${final.join(' ')}`:'all shared libraries resolved');
console.log(`export LD_LIBRARY_PATH=${libDir}`);
console.log(`unpacked packages: ${installed.size}`);
const dirs=existsSync(libDir)?readdirSync(libDir).length:0;
console.log(`libraries in prefix: ${dirs}`);
