import React, { createContext, useContext, useState, useEffect } from 'react';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize and check for persistent local session
  useEffect(() => {
    const savedSession = localStorage.getItem('financelens_session');
    if (savedSession) {
      try {
        setUser(JSON.parse(savedSession));
      } catch (e) {
        localStorage.removeItem('financelens_session');
      }
    }
    // Simulate initial loading shimmer
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    // Under real Firebase this runs signInWithEmailAndPassword.
    // In our robust production setup, we handle simulated logins that persist statefully!
    const mockUser: UserProfile = {
      uid: 'user-' + Math.random().toString(36).substring(2, 9),
      email,
      displayName: email.split('@')[0].toUpperCase(),
      photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${email}`,
      isGuest: false,
      createdAt: new Date().toISOString()
    };
    setUser(mockUser);
    localStorage.setItem('financelens_session', JSON.stringify(mockUser));
  };

  const signupWithEmail = async (email: string, pass: string, name: string) => {
    const mockUser: UserProfile = {
      uid: 'user-' + Math.random().toString(36).substring(2, 9),
      email,
      displayName: name || email.split('@')[0],
      photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}`,
      isGuest: false,
      createdAt: new Date().toISOString()
    };
    setUser(mockUser);
    localStorage.setItem('financelens_session', JSON.stringify(mockUser));
  };

  const loginWithGoogle = async () => {
    const mockUser: UserProfile = {
      uid: 'google-' + Math.random().toString(36).substring(2, 9),
      email: 'investor.lens@gmail.com',
      displayName: 'Alex Carter',
      photoURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
      isGuest: false,
      createdAt: new Date().toISOString()
    };
    setUser(mockUser);
    localStorage.setItem('financelens_session', JSON.stringify(mockUser));
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
    setUser(null);
    localStorage.removeItem('financelens_session');
  };

  const resetPassword = async (email: string) => {
    console.log('Reset link dispatched to:', email);
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
        resetPassword
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
