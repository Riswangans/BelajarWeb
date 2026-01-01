// auth-state.js - State management untuk user
import { auth, onAuthStateChanged } from './firebase-config.js';

// Global user state
let currentUser = null;

// Subscribe ke perubahan auth state
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  
  // Update UI di semua halaman
  updateAuthUI(user);
  
  // Simpan ke localStorage untuk persistency
  if (user) {
    localStorage.setItem('user', JSON.stringify({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    }));
  } else {
    localStorage.removeItem('user');
  }
  
  console.log('Auth state changed:', user ? user.email : 'No user');
});

// Fungsi untuk update UI berdasarkan auth state
function updateAuthUI(user) {
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const userMenu = document.getElementById('userMenu');
  const userName = document.getElementById('userName');
  
  if (user) {
    // User sudah login
    if (loginBtn) loginBtn.style.display = 'none';
    if (registerBtn) registerBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'block';
    if (userMenu) userMenu.style.display = 'flex';
    if (userName) userName.textContent = user.displayName || user.email;
  } else {
    // User belum login
    if (loginBtn) loginBtn.style.display = 'block';
    if (registerBtn) registerBtn.style.display = 'block';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (userMenu) userMenu.style.display = 'none';
  }
}

// Fungsi untuk mendapatkan current user
export function getCurrentUser() {
  return currentUser || JSON.parse(localStorage.getItem('user'));
}

// Fungsi untuk logout
export async function logoutUser() {
  try {
    await signOut(auth);
    window.location.href = '/';
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// Cek auth state saat pertama load
export function checkAuthState() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}