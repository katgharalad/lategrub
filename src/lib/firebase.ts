import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, addDoc, collection, updateDoc, doc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;

// Auth types
export type UserRole = 'customer' | 'delivery';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

// Order types
export type OrderStatus = 'ordered' | 'waiting' | 'got_food' | 'walking' | 'delivered';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id?: string;
  customerId: string;
  deliveryPersonId: string | null;
  status: OrderStatus;
  items?: {
    id: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  total?: number;
  deliveryAddress?: string;
  paymentMethod?: 'cash' | 'barter';
  paymentDetails?: string;
  createdAt: any; // Using any for serverTimestamp
}

// Chat types
export interface Message {
  id: string;
  orderId: string;
  text: string;
  timestamp: Date;
  sender: {
    id: string;
    role: UserRole;
  };
  recipientId: string;
  read: boolean;
}

// Helper functions
export const uploadProfilePhoto = async (file: File, userId: string): Promise<string> => {
  const storageRef = ref(storage, `profile_photos/${userId}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};

export const createUserProfile = async (
  uid: string,
  email: string,
  displayName: string,
  role: UserRole,
  photoURL?: string
): Promise<UserProfile> => {
  const now = new Date();
  const profile: UserProfile = {
    uid,
    email,
    displayName,
    role,
    createdAt: now,
    updatedAt: now,
    ...(photoURL && { photoURL })
  };

  await setDoc(doc(db, 'users', uid), profile);
  return profile;
};

export const createOrder = async (order: Omit<Order, 'id'>): Promise<string> => {
  try {
    console.log('Creating order in Firebase:', order);
    const ordersRef = collection(db, 'orders');
    const docRef = await addDoc(ordersRef, order);
    console.log('Order created successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

export const updateOrderStatus = async (
  orderId: string,
  status: OrderStatus,
  deliveryPersonId?: string
): Promise<void> => {
  const updates: Partial<Order> = {
    status,
    ...(deliveryPersonId && { deliveryPersonId }),
  };

  await updateDoc(doc(db, 'orders', orderId), updates);
};

export const sendMessage = async (
  orderId: string,
  text: string,
  senderId: string,
  senderRole: UserRole,
  recipientId: string
): Promise<string> => {
  const now = new Date();
  const message: Omit<Message, 'id'> = {
    orderId,
    text,
    sender: {
      id: senderId,
      role: senderRole,
    },
    timestamp: now,
    recipientId,
    read: false
  };

  const messagesRef = collection(db, 'messages');
  const docRef = await addDoc(messagesRef, message);
  return docRef.id;
}; 