// File terpisah untuk konfigurasi
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

// Inisialisasi Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Export untuk digunakan di file lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { auth, db };
}