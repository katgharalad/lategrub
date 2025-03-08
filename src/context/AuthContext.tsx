import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, addDoc, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  userRole: string | null;
  loading: boolean;
  signup: (email: string, password: string, name: string, role: string, photoURL?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyEmailCode: (email: string, code: string) => Promise<boolean>;
  sendVerificationCode: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const sendVerificationCode = async (email: string) => {
    if (!email.toLowerCase().endsWith('@owu.edu')) {
      throw new Error('Only @owu.edu email addresses are allowed to register');
    }

    // Check if email is already registered
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email.toLowerCase()));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      throw new Error('This email is already registered');
    }

    // Generate and store verification code
    const code = generateVerificationCode();
    const verificationRef = collection(db, 'email_verifications');
    
    // Delete any existing verification codes for this email
    const existingCodes = await getDocs(query(verificationRef, where('email', '==', email.toLowerCase())));
    for (const doc of existingCodes.docs) {
      await deleteDoc(doc.ref);
    }

    // Store new verification code
    await addDoc(verificationRef, {
      email: email.toLowerCase(),
      code,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes expiration
    });

    // In a real application, you would send this code via email
    // For development, we'll log it to console
    console.log('Verification code for', email, ':', code);
  };

  const verifyEmailCode = async (email: string, code: string) => {
    const verificationRef = collection(db, 'email_verifications');
    const q = query(
      verificationRef,
      where('email', '==', email.toLowerCase()),
      where('code', '==', code)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return false;
    }

    const verification = querySnapshot.docs[0].data();
    if (new Date() > verification.expiresAt.toDate()) {
      await deleteDoc(querySnapshot.docs[0].ref);
      return false;
    }

    await deleteDoc(querySnapshot.docs[0].ref);
    return true;
  };

  const signup = async (email: string, password: string, name: string, role: string, photoURL?: string) => {
    if (!email.toLowerCase().endsWith('@owu.edu')) {
      throw new Error('Only @owu.edu email addresses are allowed to register');
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update user profile with name and photo
      await updateProfile(userCredential.user, {
        displayName: name,
        ...(photoURL && { photoURL })
      });

      // Send email verification
      await sendEmailVerification(userCredential.user);

      // Create user document in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name,
        email: email.toLowerCase(),
        role,
        uid: userCredential.user.uid,
        ...(photoURL && { photoURL })
      });
    } catch (error) {
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login with email:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful, fetching user role...');
      await fetchUserRole(userCredential.user.uid);
      console.log('User role fetched successfully');
    } catch (error: any) {
      console.error('Login error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
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

  const value = {
    user,
    userRole,
    loading,
    signup,
    login,
    logout,
    verifyEmailCode,
    sendVerificationCode
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 