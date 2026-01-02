// firebase.js - Inisialisasi Firebase
let auth, db, storage;

function initializeFirebase() {
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        auth = firebase.auth();
        db = firebase.firestore();
        storage = firebase.storage();
        console.log("Firebase initialized");
        return { auth, db, storage };
    } catch (error) {
        console.error("Firebase initialization error:", error);
        return null;
    }
}

// Panggil inisialisasi
const firebaseApp = initializeFirebase();

// Export jika perlu
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { auth, db, storage, firebase };
}