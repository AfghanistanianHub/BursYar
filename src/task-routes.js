// BY-09: the three first-entry tasks get real routes instead of one long page.
// A route only names an existing section and the disclosure that must be open
// for it to be visible; no student data is ever placed in the URL.
export const taskRoutes=Object.freeze({
 find:{hash:'#/find',target:'research-explorer-mount',disclosure:'.resources'},
 check:{hash:'#/check',target:'assistant',disclosure:null},
 prepare:{hash:'#/prepare',target:'profile-mount',disclosure:'.workspace'}
});
export function resolveTaskRoute(hash){
 if(typeof hash!=='string'||!hash.startsWith('#/'))return null;
 // Exact route only: no sub-paths, queries or traversal-shaped hashes.
 const name=hash.slice(2).replace(/\/$/,'');
 if(name.includes('/')||name.includes('?')||name.includes('#'))return null;
 return Object.prototype.hasOwnProperty.call(taskRoutes,name)?{name,...taskRoutes[name]}:null;
}
export function taskRouteHref(name){
 return Object.prototype.hasOwnProperty.call(taskRoutes,name)?taskRoutes[name].hash:'#getting-started';
}
// Reveals the destination and marks the matching navigation link. Returns the
// resolved route (or null) so callers can keep anchor handling separate.
export function applyTaskRoute(hash=(typeof location==='undefined'?'':location.hash),{focus=true}={}){
 const route=resolveTaskRoute(hash);
 if(typeof document==='undefined')return route;
 for(const link of document.querySelectorAll('[data-task-route]'))link.removeAttribute('aria-current');
 if(!route)return null;
 for(const link of document.querySelectorAll(`[data-task-route="${route.name}"]`))link.setAttribute('aria-current','page');
 const target=document.getElementById(route.target);
 if(!target)return route;
 const holder=route.disclosure?document.querySelector(route.disclosure):null;
 if(holder)holder.open=true;
 target.scrollIntoView({block:'start'});
 if(focus){
  if(!target.hasAttribute('tabindex'))target.setAttribute('tabindex','-1');
  target.focus({preventScroll:true});
 }
 return route;
}
