// Verification-only bridge. It signs the browser tab in against the local
// Firebase Auth emulator with the real Firebase SDK, so the application's own
// persistence + restore path produces the session. Nothing here is imported by
// the application; it is served by the Vite dev server for the visual harness.
import {getApps, initializeApp} from 'firebase/app';
import {
  GoogleAuthProvider, browserSessionPersistence, connectAuthEmulator, getAuth,
  setPersistence, signInWithCredential, signOut
} from 'firebase/auth';

export async function signInWithEmulator({apiKey, projectId, authDomain, emulatorUrl, idToken}) {
  if (!getApps().length) initializeApp({apiKey, projectId, authDomain});
  const auth = getAuth();
  connectAuthEmulator(auth, emulatorUrl, {disableWarnings: true});
  // The application defaults to browser-session persistence; match it so the
  // session it restores after reload is the one this sign-in created.
  await setPersistence(auth, browserSessionPersistence);
  try { await signOut(auth); } catch { /* no session to clear */ }
  const result = await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
  return {uid: result.user.uid, email: result.user.email, provider: result.providerId};
}
