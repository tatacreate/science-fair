import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// CRITICAL: Must use firestoreDatabaseId from firebase-applet-config.json
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth(app);

// Google Auth Provider with Google Workspace Scopes
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
googleProvider.addScope('https://www.googleapis.com/auth/forms.body');
googleProvider.addScope('https://www.googleapis.com/auth/forms.responses.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');

// In-memory token storage (never localStorage for OAuth tokens)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Pre-warm GAPI iframes if available to prevent loadJS internal-error
export const prewarmGoogleApi = async (): Promise<void> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve();
    const gapi = (window as any).gapi;
    if (gapi?.iframes?.Iframe) {
      resolve();
    } else if (gapi?.load) {
      try {
        gapi.load('gapi.iframes', {
          callback: () => resolve(),
          ontimeout: () => resolve(),
          timeout: 4000,
        });
      } catch {
        resolve();
      }
    } else {
      resolve();
    }
  });
};

export const initAuthListener = (
  onUserChanged: (user: User | null, token: string | null) => void
) => {
  prewarmGoogleApi();
  return onAuthStateChanged(auth, (user) => {
    onUserChanged(user, cachedAccessToken);
  });
};

export const signInWithGoogle = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    await prewarmGoogleApi();

    let result;
    try {
      result = await signInWithPopup(auth, googleProvider);
    } catch (primaryErr: any) {
      console.warn('Initial Google Sign In attempt failed:', primaryErr?.code || primaryErr);

      // If internal-error or scope issue occurred, retry with clean standard Google Auth Provider
      if (
        primaryErr?.code === 'auth/internal-error' ||
        primaryErr?.code === 'auth/cancelled-popup-request' ||
        primaryErr?.message?.includes('internal-error')
      ) {
        console.info('Retrying with standard Google provider...');
        const coreProvider = new GoogleAuthProvider();
        coreProvider.setCustomParameters({ prompt: 'select_account' });
        result = await signInWithPopup(auth, coreProvider);
      } else {
        throw primaryErr;
      }
    }

    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken || null;
    return { user: result.user, accessToken: cachedAccessToken || '' };
  } catch (error: any) {
    console.error('Google Sign In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getCachedAccessToken = () => cachedAccessToken;

export const ensureAccessToken = async (): Promise<string> => {
  if (cachedAccessToken) {
    return cachedAccessToken;
  }
  const result = await signInWithGoogle();
  if (!result.accessToken) {
    throw new Error('Please sign in with Google to enable Workspace integrations.');
  }
  return result.accessToken;
};

export const logOut = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

// Validate connection to Firestore
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

// Structured error handling as mandated by Firebase skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
