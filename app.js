// app.js
import { auth, db } from './firebase-config.js';

// Contoh penggunaan
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log('User logged in:', user.email);
  } else {
    console.log('No user logged in');
  }
});

// Contoh baca data Firestore
async function getProducts() {
  const querySnapshot = await getDocs(collection(db, "products"));
  querySnapshot.forEach((doc) => {
    console.log(doc.id, " => ", doc.data());
  });
}