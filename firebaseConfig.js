// firebase.js atau firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDvlHk3jZxZq-eznlBVDZYZEp_-VW2sOKI",
  authDomain: "jual-sc.firebaseapp.com",
  databaseURL: "https://jual-sc-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "jual-sc",
  storageBucket: "jual-sc.firebasestorage.app",
  messagingSenderId: "1021251795498",
  appId: "1:1021251795498:web:1b867769b3821ccfa36153",
  measurementId: "G-RJ3ZRGYYXF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services yang dibutuhkan
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
