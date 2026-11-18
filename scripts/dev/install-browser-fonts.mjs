// Sandbox-only helper (not part of the application): gives headless Chromium a
// usable font configuration. This runner has no /etc/fonts and no system fonts,
// so Skia aborts with "SkFontMgr_FontConfigInterface Not implemented" as soon as
// a page loads a web font.
//
// Usage:  node scripts/dev/install-browser-fonts.mjs
//         source /tmp/chrome-fonts.env
//
// Unpacks fonts-dejavu-core from the Ubuntu archive (no root) and writes a
// minimal fontconfig file under /tmp.
import {execFileSync} from 'node:child_process';
import {copyFileSync,existsSync,mkdirSync,readdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {gunzipSync} from 'node:zlib';

const MIRROR='http://archive.ubuntu.com/ubuntu';
const OUT='/tmp/fonts';
const FILES=join(OUT,'files');
const CACHE='/tmp/deb-cache';
mkdirSync(FILES,{recursive:true});
mkdirSync(join(OUT,'cache'),{recursive:true});
mkdirSync(CACHE,{recursive:true});

const wanted=['fonts-dejavu-core'];
const index={};
for(const pocket of ['main','universe']){
 const body=execFileSync('curl',['-sL','-m','240',`${MIRROR}/dists/noble/${pocket}/binary-amd64/Packages.gz`],{maxBuffer:512*1024*1024});
 for(const stanza of gunzipSync(body).toString('utf8').split('\n\n')){
  const name=/^Package: (.+)$/m.exec(stanza)?.[1];
  const file=/^Filename: (.+)$/m.exec(stanza)?.[1];
  if(name&&file&&!index[name])index[name]={file};
 }
}
for(const name of wanted){
 const entry=index[name];
 if(!entry)throw Error(`${name} is not in the Ubuntu index`);
 const deb=join(CACHE,`${name}.deb`);
 if(!existsSync(deb))execFileSync('curl',['-sL','-m','180','-o',deb,`${MIRROR}/${entry.file}`]);
 const unpacked=join(OUT,'unpacked',name);
 mkdirSync(unpacked,{recursive:true});
 execFileSync('dpkg-deb',['-x',deb,unpacked]);
 const sourceDir=join(unpacked,'usr/share/fonts/truetype/dejavu');
 let copied=0;
 if(existsSync(sourceDir)){
  for(const file of readdirSync(sourceDir))if(/\.ttf$/i.test(file)){copyFileSync(join(sourceDir,file),join(FILES,file));copied++;}
 }
 console.log(`${name}: ${copied} font files`);
}
const conf=`<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>${FILES}</dir>
  <cachedir>${join(OUT,'cache')}</cachedir>
  <match target="pattern"><edit name="dpi" mode="assign"><double>96</double></edit></match>
</fontconfig>
`;
writeFileSync(join(OUT,'fonts.conf'),conf);
writeFileSync('/tmp/chrome-fonts.env',`export FONTCONFIG_FILE=${join(OUT,'fonts.conf')}\n`);
console.log(`fonts available: ${readdirSync(FILES).length}`);
console.log(`export FONTCONFIG_FILE=${join(OUT,'fonts.conf')}`);
