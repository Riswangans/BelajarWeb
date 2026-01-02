import { firebaseConfig } from './firebaseConfig.js';

// Inisialisasi Firebase
let auth, db, storage;

try {
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    storage = firebase.storage();
    console.log("Firebase initialized successfully");
} catch (error) {
    console.log("Firebase initialization error:", error);
}

// DOM Elements
const registerForm = document.getElementById('register-form');
const firstNameInput = document.getElementById('firstName');
const lastNameInput = document.getElementById('lastName');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const togglePasswordBtn = document.getElementById('toggle-password');
const toggleConfirmPasswordBtn = document.getElementById('toggle-confirm-password');
const termsCheckbox = document.getElementById('terms');
const googleRegisterBtn = document.getElementById('google-register');
const loadingElement = document.getElementById('loading');
const successAlert = document.getElementById('success-alert');
const errorAlert = document.getElementById('error-alert');
const successMessage = document.getElementById('success-message');
const errorMessage = document.getElementById('error-message');
const strengthBar = document.getElementById('strength-bar');
const passwordHints = document.getElementById('password-hints').querySelectorAll('li');

// Password strength checker
function checkPasswordStrength(password) {
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 1;
    
    // Uppercase check
    if (/[A-Z]/.test(password)) strength += 1;
    
    // Lowercase check
    if (/[a-z]/.test(password)) strength += 1;
    
    // Number check
    if (/[0-9]/.test(password)) strength += 1;
    
    // Special character check
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    return strength;
}

// Update password strength indicator
function updatePasswordStrength() {
    const password = passwordInput.value;
    const strength = checkPasswordStrength(password);
    
    // Update strength bar
    strengthBar.className = 'strength-bar';
    if (strength <= 1) {
        strengthBar.classList.add('strength-weak');
    } else if (strength === 2) {
        strengthBar.classList.add('strength-fair');
    } else if (strength === 3) {
        strengthBar.classList.add('strength-good');
    } else {
        strengthBar.classList.add('strength-strong');
    }
    
    // Update password hints
    const checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password)
    };
    
    passwordHints.forEach(hint => {
        const checkType = hint.dataset.check;
        if (checks[checkType]) {
            hint.classList.add('valid');
        } else {
            hint.classList.remove('valid');
        }
    });
}

// Show/Hide Password
function setupPasswordToggle(input, toggleBtn) {
    toggleBtn.addEventListener('click', () => {
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        const icon = toggleBtn.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });
}

// Show Alert Functions
function showSuccess(message) {
    successMessage.textContent = message;
    successAlert.style.display = 'flex';
    errorAlert.style.display = 'none';
}

function showError(message) {
    errorMessage.textContent = message;
    errorAlert.style.display = 'flex';
    successAlert.style.display = 'none';
}

function hideAlerts() {
    successAlert.style.display = 'none';
    errorAlert.style.display = 'none';
}

// Show/Hide Loading
function showLoading() {
    loadingElement.style.display = 'block';
}

function hideLoading() {
    loadingElement.style.display = 'none';
}

// Email validation
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Name validation
function isValidName(name) {
    return name.length >= 2 && /^[a-zA-Z\s]+$/.test(name);
}

// Register with email/password
async function registerWithEmail(email, password, firstName, lastName) {
    try {
        if (!auth) {
            throw new Error("Firebase tidak terinisialisasi");
        }

        // Check if email already exists
        const usersRef = db.collection('users');
        const querySnapshot = await usersRef.where('email', '==', email).get();
        
        if (!querySnapshot.empty) {
            throw new Error("Email sudah terdaftar");
        }

        // Create user in Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Create user document in Firestore
        const userData = {
            firstName: firstName,
            lastName: lastName,
            fullName: `${firstName} ${lastName}`,
            email: email,
            role: 'user',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
            emailVerified: false,
            status: 'active',
            balance: 0,
            purchases: 0
        };
        
        await db.collection('users').doc(user.uid).set(userData);
        
        // Send email verification
        await user.sendEmailVerification();
        
        // Save user data to localStorage
        localStorage.setItem('userData', JSON.stringify({
            uid: user.uid,
            email: user.email,
            name: `${firstName} ${lastName}`,
            role: 'user'
        }));
        
        return { success: true, user: user };
        
    } catch (error) {
        console.error("Registration error:", error);
        
        // Handle specific errors
        switch (error.code || error.message) {
            case 'auth/email-already-in-use':
            case 'Email sudah terdaftar':
                throw new Error("Email sudah terdaftar. Silakan gunakan email lain.");
            case 'auth/invalid-email':
                throw new Error("Format email tidak valid.");
            case 'auth/weak-password':
                throw new Error("Password terlalu lemah. Gunakan password yang lebih kuat.");
            case 'auth/operation-not-allowed':
                throw new Error("Registrasi dengan email/password tidak diizinkan.");
            default:
                throw new Error("Registrasi gagal: " + error.message);
        }
    }
}

// Register with Google
async function registerWithGoogle() {
    try {
        if (!auth) {
            throw new Error("Firebase tidak terinisialisasi");
        }

        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        
        // Check if user already exists
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (!userDoc.exists) {
            // Create new user document
            const nameParts = user.displayName ? user.displayName.split(' ') : ['Pengguna', 'Google'];
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ') || 'Google';
            
            const userData = {
                firstName: firstName,
                lastName: lastName,
                fullName: user.displayName || user.email.split('@')[0],
                email: user.email,
                photoURL: user.photoURL || '',
                provider: 'google',
                role: 'user',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                emailVerified: true,
                status: 'active',
                balance: 0,
                purchases: 0
            };
            
            await db.collection('users').doc(user.uid).set(userData);
        }
        
        // Save user data
        localStorage.setItem('userData', JSON.stringify({
            uid: user.uid,
            email: user.email,
            name: user.displayName || user.email.split('@')[0],
            photoURL: user.photoURL || '',
            role: 'user',
            provider: 'google'
        }));
        
        return { success: true, user: user };
        
    } catch (error) {
        console.error("Google registration error:", error);
        throw new Error("Registrasi dengan Google gagal: " + error.message);
    }
}

// Form validation
function validateForm() {
    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    // Reset errors
    hideAlerts();
    
    // Validate names
    if (!isValidName(firstName)) {
        showError("Nama depan minimal 2 karakter dan hanya boleh huruf");
        firstNameInput.focus();
        return false;
    }
    
    if (!isValidName(lastName)) {
        showError("Nama belakang minimal 2 karakter dan hanya boleh huruf");
        lastNameInput.focus();
        return false;
    }
    
    // Validate email
    if (!isValidEmail(email)) {
        showError("Format email tidak valid");
        emailInput.focus();
        return false;
    }
    
    // Validate password
    if (password.length < 8) {
        showError("Password minimal 8 karakter");
        passwordInput.focus();
        return false;
    }
    
    const strength = checkPasswordStrength(password);
    if (strength < 3) {
        showError("Password terlalu lemah. Gunakan kombinasi huruf besar, kecil, angka, dan simbol");
        passwordInput.focus();
        return false;
    }
    
    // Validate confirm password
    if (password !== confirmPassword) {
        showError("Password tidak sama");
        confirmPasswordInput.focus();
        return false;
    }
    
    // Validate terms agreement
    if (!termsCheckbox.checked) {
        showError("Anda harus menyetujui Syarat & Ketentuan");
        return false;
    }
    
    return true;
}

// Form submission
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
        return;
    }
    
    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    showLoading();
    
    try {
        const result = await registerWithEmail(email, password, firstName, lastName);
        
        if (result.success) {
            showSuccess("Registrasi berhasil! Cek email untuk verifikasi. Mengalihkan...");
            
            // Clear form - PERBAIKAN: Reset form dengan cara yang benar
            if (registerForm instanceof HTMLFormElement) {
                registerForm.reset();
            } else {
                // Fallback untuk mereset form secara manual
                firstNameInput.value = '';
                lastNameInput.value = '';
                emailInput.value = '';
                passwordInput.value = '';
                confirmPasswordInput.value = '';
                if (termsCheckbox) termsCheckbox.checked = false;
                updatePasswordStrength(); // Reset strength bar
            }
            
            // Redirect to dashboard after 3 seconds
            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 3000);
        }
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
});

// Google registration button
googleRegisterBtn.addEventListener('click', async () => {
    hideAlerts();
    showLoading();
    
    try {
        const result = await registerWithGoogle();
        
        if (result.success) {
            showSuccess("Registrasi dengan Google berhasil! Mengalihkan...");
            
            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 2000);
        }
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
});

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Setup password toggles
    setupPasswordToggle(passwordInput, togglePasswordBtn);
    setupPasswordToggle(confirmPasswordInput, toggleConfirmPasswordBtn);
    
    // Password strength real-time update
    passwordInput.addEventListener('input', updatePasswordStrength);
    
    // Auto focus first name input
    setTimeout(() => {
        if (firstNameInput) firstNameInput.focus();
    }, 100);
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl + Enter to submit form
    if (e.ctrlKey && e.key === 'Enter') {
        const submitEvent = new Event('submit', {
            bubbles: true,
            cancelable: true
        });
        registerForm.dispatchEvent(submitEvent);
    }
});