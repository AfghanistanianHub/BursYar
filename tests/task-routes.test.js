import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {taskRoutes,resolveTaskRoute,taskRouteHref} from '../src/task-routes.js';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');

test('the three first-entry tasks have real routes with unique destinations',()=>{
 assert.deepEqual(Object.keys(taskRoutes).sort(),['check','find','prepare']);
 const routes=Object.values(taskRoutes);
 assert.deepEqual(routes.map(route=>route.hash).sort(),['#/check','#/find','#/prepare']);
 assert.equal(new Set(routes.map(route=>route.target)).size,routes.length);
 for(const route of routes){
  assert.match(route.target,/^[a-z-]+$/);
  assert.ok(main.includes(`id="${route.target}"`),`missing mount point #${route.target}`);
 }
 assert.equal(taskRoutes.find.disclosure,'.resources');
 assert.equal(taskRoutes.prepare.disclosure,'.workspace');
 assert.equal(taskRoutes.check.disclosure,null);
});

test('route resolution accepts only the published task hashes',()=>{
 assert.equal(resolveTaskRoute('#/find').name,'find');
 assert.equal(resolveTaskRoute('#/check').name,'check');
 assert.equal(resolveTaskRoute('#/prepare').name,'prepare');
 assert.equal(resolveTaskRoute('#/prepare/').name,'prepare');
 for(const hash of ['#/unknown','#/','#/find/../../admin','#/prepare/step-2','#research-explorer','#geting-started','',null,undefined])assert.equal(resolveTaskRoute(hash),null,`unexpected route for ${String(hash)}`);
 assert.equal(taskRouteHref('find'),'#/find');
 assert.equal(taskRouteHref('missing'),'#getting-started');
});

test('landing navigation and the guided entry use the task routes, not bare anchors',()=>{
 for(const name of ['find','check','prepare'])assert.match(main,new RegExp(`href="\\$\\{taskRouteHref\\('${name}'\\)\\}"[^>]*data-task-route="${name}"`));
 assert.match(main,/applyTaskRoute\(\)/);
 assert.match(main,/applyTaskRoute\(location\.hash,\{focus:false\}\)/);
 // The old duplicate destinations must not come back as the primary task links.
 assert.doesNotMatch(main,/guided-option[^>]*href="#research-explorer"/);
 assert.doesNotMatch(main,/guided-option[^>]*href="#profile-mount"/);
});
