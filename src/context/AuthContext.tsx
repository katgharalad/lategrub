import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection,
  query, 
  where, 
  getDocs
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  userRole: string | null;
  loading: boolean;
  needsPasswordSetup: boolean;
  signup: (email: string, name: string, role: string) => Promise<void>;
  completeSignup: (email: string, password: string, name: string, role: string) => Promise<User>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isEmailLink: (link: string) => boolean;
  signInWithGoogle: (role: string) => Promise<void>;
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
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);

  const fetchUserRole = async (uid: string) => {
    console.log('Fetching user role for UID:', uid);
    const userDoc = await getDoc(doc(db, 'users', uid));
    console.log('User document exists:', userDoc.exists());
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('User data:', userData);
      console.log('Setting user role to:', userData.role);
      setUserRole(userData.role);
    } else {
      console.log('No user document found in Firestore');
      setUserRole(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user?.uid);
      setUser(user);
      if (user) {
        await fetchUserRole(user.uid);
        // Check if the user signed in with Google and hasn't set up a password
        const providerId = user.providerData[0]?.providerId;
        setNeedsPasswordSetup(providerId === 'google.com' && !user.providerData.some(p => p.providerId === 'password'));
      } else {
        setUserRole(null);
        setNeedsPasswordSetup(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (email: string, name: string, role: string) => {
    if (!email.toLowerCase().endsWith('@owu.edu')) {
      throw new Error('Only @owu.edu email addresses are allowed to register');
    }

    try {
      // Check if email is already registered
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email.toLowerCase()));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        throw new Error('This email is already registered');
      }

      // Store signup data in localStorage for later use
      localStorage.setItem('signupData', JSON.stringify({ email, name, role }));

      // Configure actionCodeSettings according to Firebase requirements
      const actionCodeSettings = {
        // URL you want to redirect back to. The domain (www.lategrub.shop) for this
        // URL must be in the authorized domains list in the Firebase Console.
        url: 'https://www.lategrub.shop/complete-signup',
        // This must be true for email link sign-in
        handleCodeInApp: true,
        // Don't specify dynamicLinkDomain as it's deprecated
      };

      // Send the sign-in link
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      console.log('Verification email sent to:', email);

      // Save the email locally so you don't need to ask the user for it again
      // if they open the link on the same device.
      window.localStorage.setItem('emailForSignIn', email);
    } catch (error: any) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const completeSignup = async (email: string, password: string, name: string, role: string) => {
    try {
      // Create the user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update user profile
      await updateProfile(userCredential.user, {
        displayName: name
      });

      // Create user document in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name,
        email: email.toLowerCase(),
        role,
        uid: userCredential.user.uid,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        phone: '',
        address: '',
        displayName: name
      });

      return userCredential.user;
    } catch (error: any) {
      console.error('Complete signup error:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Update user's emailVerified status in Firestore
      const userDoc = doc(db, 'users', userCredential.user.uid);
      await setDoc(userDoc, { emailVerified: true, updatedAt: new Date() }, { merge: true });

      console.log('Login successful, fetching user role...');
      await fetchUserRole(userCredential.user.uid);
      console.log('User role fetched successfully');
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  };

  const isEmailLink = (link: string) => {
    return isSignInWithEmailLink(auth, link);
  };

  const signInWithGoogle = async (role: string) => {
    try {
      console.log('Starting Google sign-in process...', { role });
      const provider = new GoogleAuthProvider();
      
      // Force account selection and restrict to OWU domain
      provider.setCustomParameters({
        prompt: 'select_account',
        hd: 'owu.edu'
      });

      console.log('Initiating Google sign-in popup...');
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log('Google sign-in successful:', user.email);

      // Verify email domain
      if (!user.email?.endsWith('@owu.edu')) {
        console.error('Non-OWU email detected:', user.email);
        await signOut(auth);
        throw new Error('Only @owu.edu email addresses are allowed');
      }

      // Check if user already exists in Firestore
      console.log('Checking if user exists in Firestore...');
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        console.log('Creating new user document in Firestore with role:', role);
        // Create new user document with the specified role
        await setDoc(doc(db, 'users', user.uid), {
          name: user.displayName,
          email: user.email.toLowerCase(),
          role, // Use the role passed from the signup page
          uid: user.uid,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          phone: '',
          address: '',
          displayName: user.displayName,
          photoURL: user.photoURL
        });
        console.log('User document created successfully');
        setUserRole(role);
        // Set needs password setup for new users
        setNeedsPasswordSetup(true);
      } else {
        // For existing users, get their role from Firestore
        const userData = userDoc.data();
        console.log('Existing user found with role:', userData.role);
        setUserRole(userData.role);
        // Check if existing user needs to set up password
        setNeedsPasswordSetup(!user.providerData.some(p => p.providerId === 'password'));
      }

      await fetchUserRole(user.uid);
      console.log('User role fetched successfully');
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
    userRole,
    loading,
    needsPasswordSetup,
    signup,
    completeSignup,
    login,
    logout,
    isEmailLink,
    signInWithGoogle
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 