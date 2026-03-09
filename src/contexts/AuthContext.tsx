'use client';

import * as React from 'react';
import { 
  createContext, 
  useContext, 
  useEffect, 
  useState 
} from 'react';
import { 
  onAuthStateChanged, 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  deleteUser,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  EmailAuthProvider,
  updatePassword
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { deleteAllUserData } from '@/lib/firestore';
import { useKineticStore } from '@/store/useKineticStore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: (password?: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  reauthenticate: (password?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await useKineticStore.getState().fetchFromCloud(true);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, pass: string) => {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    if (!result.user.emailVerified) {
      await sendEmailVerification(result.user);
      console.warn('Email not verified - verification email sent. Consider enforcing verification for new accounts.');
    }
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    await sendEmailVerification(result.user);
  };

  const isMobile = () => typeof navigator !== 'undefined' && /iPhone|iPad|Android/i.test(navigator.userAgent);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    if (isMobile()) {
      await signInWithRedirect(auth, provider);
    } else {
      await signInWithPopup(auth, provider);
    }
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const deleteAccount = async (password?: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error('No user signed in');

    if (user.providerData[0]?.providerId === 'password') {
      if (!password) throw new Error('Password required');
      const credential = EmailAuthProvider.credential(user.email!, password);
      await reauthenticateWithCredential(user, credential);
    } else if (user.providerData[0]?.providerId === 'google.com') {
      const provider = new GoogleAuthProvider();
      await reauthenticateWithPopup(user, provider);
    }

    await deleteAllUserData(user.uid);
    await deleteUser(user);
    await useKineticStore.getState().clearAllData();
  };

  const reauthenticate = async (password?: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error('No user signed in');

    if (user.providerData[0]?.providerId === 'password') {
      if (!password) throw new Error('Password required');
      const credential = EmailAuthProvider.credential(user.email!, password);
      await reauthenticateWithCredential(user, credential);
    } else if (user.providerData[0]?.providerId === 'google.com') {
      const provider = new GoogleAuthProvider();
      await reauthenticateWithPopup(user, provider);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const user = auth.currentUser;
    if (!user || user.providerData[0]?.providerId !== 'password') {
      throw new Error('Password change is only available for email/password accounts');
    }
    await reauthenticate(currentPassword);
    await updatePassword(user, newPassword);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signInWithEmail, 
      signUpWithEmail, 
      signInWithGoogle, 
      sendPasswordReset, 
      signOut,
      deleteAccount,
      changePassword,
      reauthenticate
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
