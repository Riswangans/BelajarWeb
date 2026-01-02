// ============================================
// firebase.js - Inisialisasi Firebase Global
// ============================================

// Deklarasi variabel global
let auth, db, storage;
let isFirebaseInitialized = false;

// Fungsi untuk menginisialisasi Firebase
function initializeFirebase() {
    try {
        console.log("Initializing Firebase...");
        
        // Cek apakah Firebase sudah diinisialisasi
        if (firebase.apps.length === 0) {
            // Inisialisasi Firebase dengan config
            firebase.initializeApp(firebaseConfig);
            console.log("Firebase app initialized");
        } else {
            console.log("Firebase app already initialized");
        }
        
        // Inisialisasi services
        auth = firebase.auth();
        db = firebase.firestore();
        storage = firebase.storage();
        
        isFirebaseInitialized = true;
        
        console.log("✅ Firebase initialized successfully!");
        console.log("✅ Auth:", !!auth);
        console.log("✅ Firestore:", !!db);
        console.log("✅ Storage:", !!storage);
        
        return { auth, db, storage };
        
    } catch (error) {
        console.error("❌ Firebase initialization error:", error);
        isFirebaseInitialized = false;
        return null;
    }
}

// Fungsi untuk mengecek status Firebase
function getFirebaseStatus() {
    return {
        initialized: isFirebaseInitialized,
        auth: !!auth,
        db: !!db,
        storage: !!storage
    };
}

// Panggil inisialisasi otomatis
// Tapi dengan setTimeout agar firebaseConfig sudah terload
setTimeout(() => {
    if (typeof firebaseConfig !== 'undefined') {
        initializeFirebase();
    } else {
        console.warn("⚠️ firebaseConfig belum didefinisikan");
    }
}, 100);