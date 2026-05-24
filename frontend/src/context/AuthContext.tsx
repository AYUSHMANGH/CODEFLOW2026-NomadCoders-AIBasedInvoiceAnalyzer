import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  EmailAuthProvider,
  deleteUser
} from 'firebase/auth';
import { auth } from '../firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  isGuest: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  deleteAccount: (password?: string) => Promise<void>;
  isGoogleUser: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapFirebaseUser = (firebaseUser: any, isGuest = false): UserProfile => {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
    photoURL: firebaseUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${firebaseUser.email || 'user'}`,
    isGuest,
    createdAt: firebaseUser.metadata.creationTime || new Date().toISOString()
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize and check for persistent Firebase auth session or Guest fallback
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const profile = mapFirebaseUser(firebaseUser, false);
        setUser(profile);
        localStorage.setItem('financelens_session', JSON.stringify(profile));
      } else {
        const savedSession = localStorage.getItem('financelens_session');
        if (savedSession) {
          try {
            const parsed = JSON.parse(savedSession);
            if (parsed.isGuest) {
              setUser(parsed);
            } else {
              setUser(null);
            }
          } catch (e) {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const profile = mapFirebaseUser(userCredential.user, false);
    setUser(profile);
    localStorage.setItem('financelens_session', JSON.stringify(profile));
  };

  const signupWithEmail = async (email: string, pass: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(userCredential.user, {
      displayName: name
    });
    // Force refresh the user object so it gets the newly set displayName
    if (auth.currentUser) {
      const profile = mapFirebaseUser(auth.currentUser, false);
      setUser(profile);
      localStorage.setItem('financelens_session', JSON.stringify(profile));
    }
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const profile = mapFirebaseUser(userCredential.user, false);
    setUser(profile);
    localStorage.setItem('financelens_session', JSON.stringify(profile));
  };

  const loginAsGuest = () => {
    const guestUser: UserProfile = {
      uid: 'guest-' + Math.random().toString(36).substring(2, 9),
      email: 'guest@financelens.ai',
      displayName: 'Guest Analyst',
      photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=guest',
      isGuest: true,
      createdAt: new Date().toISOString()
    };
    setUser(guestUser);
    localStorage.setItem('financelens_session', JSON.stringify(guestUser));
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    localStorage.removeItem('financelens_session');
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
    console.log('Reset link dispatched to:', email);
  };

  // Returns true if the current Firebase user signed in with Google
  const isGoogleUser = (): boolean => {
    if (!auth.currentUser) return false;
    return auth.currentUser.providerData.some(
      (provider) => provider.providerId === 'google.com'
    );
  };

  /**
   * Permanently deletes the authenticated user's account.
   * - For email/password users: re-authenticates using the provided password first.
   * - For Google users: re-authenticates via Google popup.
   * - Then calls Firebase deleteUser(), clears localStorage, resets state.
   */
  const deleteAccount = async (password?: string): Promise<void> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No authenticated user found.');
    }

    // Re-authenticate before deletion (Firebase requires recent auth)
    if (isGoogleUser()) {
      const provider = new GoogleAuthProvider();
      await reauthenticateWithPopup(currentUser, provider);
    } else {
      if (!password) {
        throw new Error('Password is required to delete your account.');
      }
      const credential = EmailAuthProvider.credential(currentUser.email!, password);
      await reauthenticateWithCredential(currentUser, credential);
    }

    // Delete the Firebase Auth account
    await deleteUser(currentUser);

    // Clean up local state
    setUser(null);
    localStorage.removeItem('financelens_session');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithEmail,
        signupWithEmail,
        loginWithGoogle,
        loginAsGuest,
        logout,
        resetPassword,
        deleteAccount,
        isGoogleUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be called within AuthProvider');
  }
  return context;
};
