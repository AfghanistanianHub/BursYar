let session;
const KEEP_KEY='bursyar:keep-signed-in';
// A build without Firebase configuration is a supported state: deterministic and
// local features keep working and only sign-in is unavailable. Callers must be
// able to tell it apart from a real authentication failure so it is reported
// inline instead of as an unexpected client error.
// Session decision (BY-07): a reload, tab restore or phone lock must not sign
// the student out. The default is browser-session persistence, so the Firebase
// refresh token lives for this browser session only. "Keep me signed in on this
// device" is an explicit opt-in to local persistence and says so in the UI.
export function keepSignedIn(){try{return localStorage.getItem(KEEP_KEY)==='true';}catch{return false;}}
export function setKeepSignedIn(keep){try{keep?localStorage.setItem(KEEP_KEY,'true'):localStorage.removeItem(KEEP_KEY);}catch{/* blocked storage keeps the session default */}}
// Popups are blocked in iOS Safari and inside Telegram/Instagram/Facebook
// webviews; those environments must fall back to a full-page redirect.
const redirectErrors=new Set(['auth/popup-blocked','auth/operation-not-supported-in-this-environment']);
async function getSession(){
 if(!session)session=(async()=>{
  const apiKey=import.meta.env.VITE_FIREBASE_API_KEY,projectId=import.meta.env.VITE_FIREBASE_PROJECT_ID,authDomain=import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  if(!apiKey||!projectId||!authDomain)throw Error('Firebase sign-in is not configured');
  const [{initializeApp},sdk]=await Promise.all([import('firebase/app'),import('firebase/auth')]);
  const auth=sdk.getAuth(initializeApp({apiKey,projectId,authDomain}));
  // Local verification runs against the Firebase Auth emulator. The DEV guard
  // keeps this unreachable in a production build, so a shipped bundle can never
  // be redirected to a local emulator by an environment variable.
  if(import.meta.env.DEV&&import.meta.env.VITE_FIREBASE_AUTH_EMULATOR)
   sdk.connectAuthEmulator(auth,import.meta.env.VITE_FIREBASE_AUTH_EMULATOR,{disableWarnings:true});
  await sdk.setPersistence(auth,keepSignedIn()?sdk.localPersistence:sdk.browserSessionPersistence);
  // Consume the result of a redirect sign-in before anything reads the state.
  // A normal page load has no pending result, which is not an error.
  try{await sdk.getRedirectResult(auth);}catch{/* cancelled or expired redirect */} 
  await auth.authStateReady();
  return {auth,sdk};
 })().catch(error=>{session=undefined;throw error;});
 return session;
}
export async function signIn(){
 const {auth,sdk}=await getSession();
 try{await sdk.signInWithPopup(auth,new sdk.GoogleAuthProvider());return 'popup';}
 catch(error){
  if(redirectErrors.has(error?.code)){await sdk.signInWithRedirect(auth,new sdk.GoogleAuthProvider());return 'redirect';}
  throw error;
 }
}
export async function signOut(){const {auth,sdk}=await getSession();await sdk.signOut(auth);setKeepSignedIn(false);}
export async function onAuthChange(callback){const {auth,sdk}=await getSession();return sdk.onAuthStateChanged(auth,callback);}
export async function getInferenceToken(){
 const {auth}=await getSession();if(!auth.currentUser)throw Error('Sign in required');
 return auth.currentUser.getIdToken();
}
// Capability probe (BY-02). A valid Google identity is not the same as an
// enrolled pilot account; only the server decides, and this never authorises
// a private route by itself.
export async function getAccountCapability(){
 const {auth}=await getSession();
 if(!auth.currentUser)return {authenticated:false,enrolled:false,enrollment:'closed_pilot'};
 const token=await auth.currentUser.getIdToken();
 try{
  const response=await fetch('/api/me',{credentials:'omit',headers:{authorization:`Bearer ${token}`},signal:AbortSignal.timeout(20000)});
  if(!response.ok)return {authenticated:true,enrolled:false,enrollment:'unknown'};
  return await response.json();
 }catch{
  return {authenticated:true,enrolled:false,enrollment:'unreachable'};
 }
}
