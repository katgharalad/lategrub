import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendSignInLinkToEmail,
  isSignInWithEmailLink
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { 
  doc, 
  getDoc, 
  setDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  sessionRole: string | null;
  loading: boolean;
  needsPasswordSetup: boolean;
  signup: (email: string, name: string, selectedRole: string) => Promise<void>;
  completeSignup: (email: string, password: string, name: string, selectedRole: string) => Promise<User>;
  login: (email: string, password: string, selectedRole: string) => Promise<void>;
  logout: () => Promise<void>;
  isEmailLink: (link: string) => boolean;
  signInWithGoogle: (selectedRole: string) => Promise<void>;
  setSessionRole: (role: 'customer' | 'delivery') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [sessionRole, setSessionRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);

  const fetchUserData = async (uid: string) => {
    console.log('Fetching user data for UID:', uid);
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      // Set the session role from the stored role if not already set
      if (!sessionRole && userData.role) {
        setSessionRole(userData.role);
      }
    } else {
      console.log('No user document found in Firestore');
    }
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user?.uid);
      setUser(user);
      if (user) {
        await fetchUserData(user.uid);
      } else {
        setSessionRole(null);
        setNeedsPasswordSetup(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (email: string, name: string, selectedRole: string) => {
    if (!email.toLowerCase().endsWith('@owu.edu')) {
      throw new Error('Only @owu.edu email addresses are allowed to register');
    }

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email.toLowerCase()));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        throw new Error('This email is already registered');
      }

      localStorage.setItem('signupData', JSON.stringify({ email, name, selectedRole }));

      const actionCodeSettings = {
        url: 'https://www.lategrub.shop/complete-signup',
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      console.log('Verification email sent to:', email);

      window.localStorage.setItem('emailForSignIn', email);
    } catch (error: any) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const completeSignup = async (email: string, password: string, name: string, selectedRole: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      await updateProfile(userCredential.user, {
        displayName: name
      });

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name,
        email: email.toLowerCase(),
        uid: userCredential.user.uid,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        phone: '',
        address: '',
        displayName: name
      });

      setSessionRole(selectedRole);
      return userCredential.user;
    } catch (error: any) {
      console.error('Complete signup error:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string, selectedRole: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Update user's emailVerified status in Firestore
      const userDoc = doc(db, 'users', userCredential.user.uid);
      await setDoc(userDoc, { emailVerified: true, updatedAt: new Date() }, { merge: true });

      setSessionRole(selectedRole);
      await fetchUserData(userCredential.user.uid);
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setSessionRole(null); // Clear session role before signing out
      await signOut(auth);
      window.location.href = '/'; // Force redirect to landing page
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const isEmailLink = (link: string) => {
    return isSignInWithEmailLink(auth, link);
  };

  const signInWithGoogle = async (selectedRole: string) => {
    try {
      console.log('Starting Google sign-in process...');
      const provider = new GoogleAuthProvider();
      
      provider.setCustomParameters({
        prompt: 'select_account',
        hd: 'owu.edu'
      });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user.email?.endsWith('@owu.edu')) {
        await signOut(auth);
        throw new Error('Only @owu.edu email addresses are allowed');
      }

      // Set session role first
      setSessionRole(selectedRole);

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (!userDoc.exists()) {
          // Create new user document with the selected role
          await setDoc(doc(db, 'users', user.uid), {
            name: user.displayName,
            email: user.email.toLowerCase(),
            uid: user.uid,
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            phone: '',
            address: '',
            displayName: user.displayName,
            photoURL: user.photoURL,
            role: selectedRole // Store the selected role
          });
        } else {
          // Update the existing user's role
          await setDoc(doc(db, 'users', user.uid), {
            role: selectedRole,
            updatedAt: new Date()
          }, { merge: true });
        }
      } catch (firestoreError) {
        console.error('Firestore operation failed:', firestoreError);
        throw new Error('Failed to update user profile');
      }

      await fetchUserData(user.uid);
    } catch (error: any) {
      console.error('Google sign in error:', error);
      if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Google sign-in is not enabled. Please contact support.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign in cancelled by user');
      } else if (error.code === 'auth/cancelled-popup-request') {
        throw new Error('Another sign in popup is already open');
      } else {
        throw new Error(error.message || 'Failed to sign in with Google');
      }
    }
  };

  const value = {
    user,
    sessionRole,
    loading,
    needsPasswordSetup,
    signup,
    completeSignup,
    login,
    logout,
    isEmailLink,
    signInWithGoogle,
    setSessionRole
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 