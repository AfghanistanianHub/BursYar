import {initializeApp, applicationDefault} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';

export function createFirebaseVerifier({projectId, credential=applicationDefault()} = {}) {
  if (!projectId || !/^[a-z][a-z0-9-]{4,62}$/.test(projectId)) throw new Error('Firebase project ID required');
  // Admin SDK accepts emulator unsigned tokens; this executable must never use that mode.
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) throw new Error('Auth emulator forbidden in inference server');
  const app=initializeApp({projectId,credential},'bursyar-inference');
  const auth=getAuth(app);
  return async token => auth.verifyIdToken(token,true);
}
export async function authenticate(header, verify, projectId) {
  if (typeof header!=='string' || header.length>8192 || !/^Bearer [^\s]+$/.test(header)) throw new Error('Unauthorized');
  let user;
  try {user=await verify(header.slice(7));} catch {throw new Error('Unauthorized');}
  if (!user || typeof user.uid!=='string' || !user.uid || user.uid.length>128 || user.aud!==projectId || user.iss!==`https://securetoken.google.com/${projectId}` || user.bursyarDemo!==true || user.firebase?.sign_in_provider==='anonymous') throw new Error('Unauthorized');
  return user.uid;
}
