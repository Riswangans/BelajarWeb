import { auth, db, storage } from './firebaseConfig.js';

// Initialize Firebase
// auth dan db sudah diimpor dari firebaseConfig.js, hapus deklarasi ulang
        
try {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully");
} catch (error) {
    console.error("Firebase initialization error:", error);
}

// DOM Elements
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const togglePasswordBtn = document.getElementById('toggle-password');
const rememberMeCheckbox = document.getElementById('remember-me');
const googleLoginBtn = document.getElementById('google-login');
const loadingElement = document.getElementById('loading');
const successAlert = document.getElementById('success-alert');
const errorAlert = document.getElementById('error-alert');
const warningAlert = document.getElementById('warning-alert');
const successMessage = document.getElementById('success-message');
const errorMessage = document.getElementById('error-message');
const warningMessage = document.getElementById('warning-message');

// Check if user is already logged in
function checkAuthState() {
    if (auth) {
        auth.onAuthStateChanged((user) => {
            if (user) {
                // User is already logged in, redirect to dashboard
                showSuccess("Anda sudah login. Mengalihkan...");
                setTimeout(() => {
                    window.location.href = "dashboard.html";
                }, 2000);
            }
        });
    }
}

// Show/Hide Password
if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        const icon = togglePasswordBtn.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        }
    });
}

// Show Alert Functions
function showSuccess(message) {
    if (successMessage) successMessage.textContent = message;
    if (successAlert) successAlert.style.display = 'flex';
    if (errorAlert) errorAlert.style.display = 'none';
    if (warningAlert) warningAlert.style.display = 'none';
}

function showError(message) {
    if (errorMessage) errorMessage.textContent = message;
    if (errorAlert) errorAlert.style.display = 'flex';
    if (successAlert) successAlert.style.display = 'none';
    if (warningAlert) warningAlert.style.display = 'none';
}

function showWarning(message) {
    if (warningMessage) warningMessage.textContent = message;
    if (warningAlert) warningAlert.style.display = 'flex';
    if (successAlert) successAlert.style.display = 'none';
    if (errorAlert) errorAlert.style.display = 'none';
}

function hideAlerts() {
    if (successAlert) successAlert.style.display = 'none';
    if (errorAlert) errorAlert.style.display = 'none';
    if (warningAlert) warningAlert.style.display = 'none';
}

// Show/Hide Loading
function showLoading() {
    if (loadingElement) loadingElement.style.display = 'block';
}

function hideLoading() {
    if (loadingElement) loadingElement.style.display = 'none';
}

// Save email to localStorage if remember me is checked
function saveEmailToLocalStorage() {
    if (rememberMeCheckbox && emailInput) {
        if (rememberMeCheckbox.checked) {
            localStorage.setItem('rememberedEmail', emailInput.value);
        } else {
            localStorage.removeItem('rememberedEmail');
        }
    }
}

// Load remembered email on page load
function loadRememberedEmail() {
    if (emailInput && rememberMeCheckbox) {
        const rememberedEmail = localStorage.getItem('rememberedEmail');
        if (rememberedEmail) {
            emailInput.value = rememberedEmail;
            rememberMeCheckbox.checked = true;
        }
    }
}

// Email validation
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Login with email/password
async function loginWithEmail(email, password) {
    try {
        if (!auth) {
            throw new Error("Firebase tidak terinisialisasi");
        }

        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Get additional user data from Firestore
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            
            // Save user data to localStorage/sessionStorage
            const userSessionData = {
                uid: user.uid,
                email: user.email,
                name: userData.name || user.email.split('@')[0],
                photoURL: userData.photoURL || '',
                role: userData.role || 'user',
                createdAt: userData.createdAt || new Date().toISOString()
            };
            
            if (rememberMeCheckbox && rememberMeCheckbox.checked) {
                localStorage.setItem('userData', JSON.stringify(userSessionData));
            } else {
                sessionStorage.setItem('userData', JSON.stringify(userSessionData));
            }
            
            // Update last login time
            await db.collection('users').doc(user.uid).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            showSuccess("Login berhasil! Mengalihkan...");
            
            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 2000);
            
            return true;
        } else {
            // Create user document if it doesn't exist
            await db.collection('users').doc(user.uid).set({
                email: user.email,
                name: user.email.split('@')[0],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                role: 'user'
            });
            
            showSuccess("Login berhasil! Mengalihkan...");
            
            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 2000);
            
            return true;
        }
        
    } catch (error) {
        console.error("Login error:", error);
        
        // Handle specific errors
        switch (error.code) {
            case 'auth/user-not-found':
                showError("Email tidak terdaftar. Silakan daftar terlebih dahulu.");
                break;
            case 'auth/wrong-password':
                showError("Password salah. Silakan coba lagi.");
                break;
            case 'auth/invalid-email':
                showError("Format email tidak valid.");
                break;
            case 'auth/user-disabled':
                showError("Akun ini telah dinonaktifkan.");
                break;
            case 'auth/too-many-requests':
                showError("Terlalu banyak percobaan gagal. Coba lagi nanti.");
                break;
            default:
                showError("Login gagal: " + error.message);
        }
        return false;
    }
}

// Login with Google
async function loginWithGoogle() {
    try {
        if (!auth) {
            throw new Error("Firebase tidak terinisialisasi");
        }

        const provider = new firebase.auth.GoogleAuthProvider();
        
        // Add scopes if needed
        provider.addScope('profile');
        provider.addScope('email');
        
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        
        // Check if user exists in Firestore
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (!userDoc.exists) {
            // Create new user document
            await db.collection('users').doc(user.uid).set({
                email: user.email,
                name: user.displayName || user.email.split('@')[0],
                photoURL: user.photoURL || '',
                provider: 'google',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                role: 'user'
            });
        } else {
            // Update last login
            await db.collection('users').doc(user.uid).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        // Save user data
        const userData = {
            uid: user.uid,
            email: user.email,
            name: user.displayName || user.email.split('@')[0],
            photoURL: user.photoURL || '',
            role: 'user',
            provider: 'google'
        };
        
        localStorage.setItem('userData', JSON.stringify(userData));
        
        showSuccess("Login dengan Google berhasil! Mengalihkan...");
        
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 2000);
        
    } catch (error) {
        console.error("Google login error:", error);
        showError("Login dengan Google gagal: " + error.message);
    }
}

// Form submission
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlerts();
        
        if (!emailInput || !passwordInput) return;
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        // Validation
        if (!email || !password) {
            showError("Harap isi email dan password");
            return;
        }
        
        if (!isValidEmail(email)) {
            showError("Format email tidak valid");
            return;
        }
        
        if (password.length < 6) {
            showError("Password minimal 6 karakter");
            return;
        }
        
        showLoading();
        saveEmailToLocalStorage();
        
        const success = await loginWithEmail(email, password);
        
        hideLoading();
        if (!success && passwordInput) {
            // Clear password field on failed login
            passwordInput.value = '';
        }
    });
}

// Google login button
if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', async () => {
        hideAlerts();
        showLoading();
        await loginWithGoogle();
        hideLoading();
    });
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    checkAuthState();
    loadRememberedEmail();
    
    // Auto focus email input
    setTimeout(() => {
        if (emailInput) emailInput.focus();
    }, 100);
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl + Enter to submit form
    if (e.ctrlKey && e.key === 'Enter' && loginForm) {
        loginForm.dispatchEvent(new Event('submit'));
    }
    
    // Escape to clear form
    if (e.key === 'Escape' && loginForm) {
        // PERBAIKAN: Reset form dengan cara yang benar
        if (loginForm instanceof HTMLFormElement) {
            loginForm.reset();
        } else if (emailInput && passwordInput) {
            // Fallback reset manual
            emailInput.value = '';
            passwordInput.value = '';
            if (rememberMeCheckbox) {
                rememberMeCheckbox.checked = false;
            }
        }
        hideAlerts();
    }
});