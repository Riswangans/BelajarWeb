// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-storage.js";

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
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Export untuk digunakan di file lain
export { app, analytics, auth, db, storage };