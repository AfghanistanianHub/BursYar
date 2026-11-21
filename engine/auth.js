import {createFirebaseAccountCheck} from './firebase-account-check.js';
import {initializeApp, applicationDefault, getApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';

export function createFirebaseVerifier({projectId, credential=applicationDefault(), webApiKey, accountFetch} = {}) {
  if (!projectId || !/^[a-z][a-z0-9-]{4,62}$/.test(projectId)) throw new Error('Firebase project ID required');
  // Admin SDK accepts emulator unsigned tokens; this executable must never use that mode.
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) throw new Error('Auth emulator forbidden in inference server');
  let app=null;
  try{app=getApp('bursyar-inference');}catch{/* No existing instance; initialize below. */}
  if(app){if(app.options?.projectId!==projectId)throw new Error('Firebase project mismatch in inference server');}
  else app=initializeApp({projectId,credential},'bursyar-inference');
  const auth=getAuth(app);
  if(webApiKey===undefined)return async token => auth.verifyIdToken(token,true);
  const checkAccount=createFirebaseAccountCheck({projectId,webApiKey,...(accountFetch?{fetchImpl:accountFetch}:{})});
  return async token => {
    const decoded=await auth.verifyIdToken(token,false);
    await checkAccount(token,decoded); // Mandatory disabled/revoked/account checks.
    return decoded;
  };
}

// Two distinct failures must stay distinct for the client:
//   401 unauthorized       — no valid Firebase identity (sign in again)
//   403 account_not_enrolled — valid identity, but the closed pilot has not
//                              enrolled it yet (request access; do not sign in again)
// Both keep the same message text so no account existence is leaked.
export class AuthError extends Error {
  constructor(status, code) { super('Unauthorized'); this.status = status; this.code = code; }
}

/** Verify identity only. Used by the capability probe, never to authorise data. */
export async function identify(header, verify, projectId) {
  if (typeof header !== 'string' || header.length > 8192 || !/^Bearer [^\s]+$/.test(header)) throw new AuthError(401, 'unauthorized');
  let user;
  try { user = await verify(header.slice(7)); } catch { throw new AuthError(401, 'unauthorized'); }
  if (!user || typeof user.uid !== 'string' || !user.uid || user.uid.length > 128 || user.aud !== projectId || user.iss !== `https://securetoken.google.com/${projectId}` || user.firebase?.sign_in_provider === 'anonymous') throw new AuthError(401, 'unauthorized');
  return { uid: user.uid, enrolled: user.bursyarDemo === true };
}

export async function authenticate(header, verify, projectId) {
  const identity = await identify(header, verify, projectId);
  // Closed pilot: the demo claim is still required for every private route.
  if (!identity.enrolled) throw new AuthError(403, 'account_not_enrolled');
  return identity.uid;
}
