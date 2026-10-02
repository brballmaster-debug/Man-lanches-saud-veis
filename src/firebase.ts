import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signInAnonymously as firebaseSignInAnonymously
} from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  getFirestore,
  Firestore,
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Inicialização segura do App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const firestoreDbId = (firebaseConfig as any)?.firestoreDatabaseId;

// Inicializa o Firestore com cache persistente multi-abas no IndexedDB:
export const db: Firestore = (() => {
  try {
    return firestoreDbId
      ? initializeFirestore(
          app,
          {
            localCache: persistentLocalCache({
              tabManager: persistentMultipleTabManager()
            })
          },
          firestoreDbId
        )
      : initializeFirestore(app, {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager()
          })
        });
  } catch (_error) {
    // Fallback caso a instância já tenha sido inicializada anteriormente
    return firestoreDbId ? getFirestore(app, firestoreDbId) : getFirestore(app);
  }
})();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const MASTER_ADMIN_EMAILS = ['brballmaster@gmail.com'];

export const isMasterAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return MASTER_ADMIN_EMAILS.some(e => e.toLowerCase() === email.trim().toLowerCase());
};

/**
 * Sincroniza o usuário no Firestore mantendo PROTEÇÃO ESTRITA de cargo (role).
 * - Se o documento já existe: JAMAIS sobrescreve o campo role ou permissões concedidas.
 *   Atualiza apenas metadados neutros (lastLoginAt, name, email) usando { merge: true }.
 * - Se for Master Admin: garante role: 'admin'.
 * - Se for novo cadastro: cria com role padrão ('admin' para master ou 'client' para demais).
 */
export const syncUserProfile = async (user: any, additionalData?: { name?: string; source?: string }) => {
  if (!user || !user.uid) return null;

  try {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    const isMaster = isMasterAdminEmail(user.email);

    if (!userSnap.exists()) {
      const initialData: any = {
        uid: user.uid,
        name: additionalData?.name || user.displayName || (user.isAnonymous ? 'Cliente Visitante' : ''),
        email: user.email || '',
        role: isMaster ? 'admin' : 'client',
        isAnonymous: Boolean(user.isAnonymous),
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      };
      if (additionalData?.source) {
        initialData.source = additionalData.source;
      }
      await setDoc(userRef, initialData);
      return initialData;
    } else {
      const existingData = userSnap.data() || {};
      const updates: any = {
        lastLoginAt: serverTimestamp()
      };

      if (user.email && existingData.email !== user.email) {
        updates.email = user.email;
      }
      if (additionalData?.name && (!existingData.name || existingData.name === 'Cliente Visitante')) {
        updates.name = additionalData.name;
      } else if (user.displayName && (!existingData.name || existingData.name === 'Cliente Visitante')) {
        updates.name = user.displayName;
      }
      if (additionalData?.source && !existingData.source) {
        updates.source = additionalData.source;
      }
      // Trava de segurança para Master Admin
      if (isMaster && existingData.role !== 'admin') {
        updates.role = 'admin';
      }

      await setDoc(userRef, updates, { merge: true });
      return { ...existingData, ...updates };
    }
  } catch (error) {
    console.error("Erro ao sincronizar perfil do usuário:", error);
    return null;
  }
};

export const signInAnonymously = async (source?: string) => {
  // If already logged in, don't try to sign in again
  if (auth.currentUser) return auth.currentUser;

  try {
    const result = await firebaseSignInAnonymously(auth);
    const user = result.user;
    await syncUserProfile(user, { source });
    return user;
  } catch (error: any) {
    // If anonymous auth is disabled in console, we catch it here
    if (error.code === 'auth/admin-restricted-operation' || error.code === 'auth/operation-not-allowed') {
      console.warn("Anonymous auth is not enabled in Firebase Console. Falling back to guest mode.");
      return null;
    }
    console.error("Error signing in anonymously", error);
    throw error;
  }
};

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    await syncUserProfile(user);
    return user;
  } catch (error: any) {
    if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
      // User closed the popup, ignore
      return null;
    }
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const signUpWithEmail = async (name: string, email: string, password: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;
    
    if (name) {
      await updateProfile(user, { displayName: name }).catch(() => {});
    }
    
    await syncUserProfile(user, { name });
    return user;
  } catch (error) {
    console.error("Error signing up with email", error);
    throw error;
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = result.user;
    await syncUserProfile(user);
    return user;
  } catch (error) {
    console.error("Error signing in with email", error);
    throw error;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
  }
};
