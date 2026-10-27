let session;
async function getSession(){
 if(!session)session=(async()=>{
  const apiKey=import.meta.env.VITE_FIREBASE_API_KEY,projectId=import.meta.env.VITE_FIREBASE_PROJECT_ID,authDomain=import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  if(!apiKey||!projectId||!authDomain)throw Error('Firebase sign-in is not configured');
  const [{initializeApp},sdk]=await Promise.all([import('firebase/app'),import('firebase/auth')]);
  const auth=sdk.getAuth(initializeApp({apiKey,projectId,authDomain}));
  await sdk.setPersistence(auth,sdk.inMemoryPersistence);
  await auth.authStateReady();
  return {auth,sdk};
 })().catch(error=>{session=undefined;throw error;});
 return session;
}
export async function signIn(){const {auth,sdk}=await getSession();await sdk.signInWithPopup(auth,new sdk.GoogleAuthProvider());}
export async function signOut(){const {auth,sdk}=await getSession();await sdk.signOut(auth);}
export async function getInferenceToken(){
 const {auth}=await getSession();if(!auth.currentUser)throw Error('Sign in required');
 return auth.currentUser.getIdToken();
}
