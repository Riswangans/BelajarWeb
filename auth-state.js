// auth.js
// Logika Autentikasi Firebase

// Import firebaseConfig jika diperlukan
// const { auth, db } = require('./firebaseConfig.js');

// Cek status login
function checkAuthState() {
    return new Promise((resolve, reject) => {
        auth.onAuthStateChanged((user) => {
            if (user) {
                resolve(user);
            } else {
                resolve(null);
            }
        }, (error) => {
            reject(error);
        });
    });
}

// Login dengan email dan password
async function loginUser(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        return {
            success: true,
            user: userCredential.user
        };
    } catch (error) {
        return {
            success: false,
            error: getErrorMessage(error.code)
        };
    }
}

// Register dengan email dan password
async function registerUser(email, password, userData) {
    try {
        // Buat user di Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        // Simpan data tambahan ke Firestore
        await db.collection('users').doc(userCredential.user.uid).set({
            email: email,
            fullName: userData.fullName,
            phone: userData.phone || '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        return {
            success: true,
            user: userCredential.user
        };
    } catch (error) {
        return {
            success: false,
            error: getErrorMessage(error.code)
        };
    }
}

// Logout user
async function logoutUser() {
    try {
        await auth.signOut();
        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// Update profile user
async function updateUserProfile(userId, userData) {
    try {
        await db.collection('users').doc(userId).update({
            ...userData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// Get user data dari Firestore
async function getUserData(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
            return {
                success: true,
                data: userDoc.data()
            };
        } else {
            return {
                success: false,
                error: 'User data not found'
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// Reset password
async function resetPassword(email) {
    try {
        await auth.sendPasswordResetEmail(email);
        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: getErrorMessage(error.code)
        };
    }
}

// Ubah password
async function changePassword(newPassword) {
    try {
        const user = auth.currentUser;
        if (user) {
            await user.updatePassword(newPassword);
            return { success: true };
        } else {
            return {
                success: false,
                error: 'No user logged in'
            };
        }
    } catch (error) {
        return {
            success: false,
            error: getErrorMessage(error.code)
        };
    }
}

// Helper: Convert error code ke pesan user-friendly
function getErrorMessage(errorCode) {
    const errorMessages = {
        'auth/invalid-email': 'Email tidak valid',
        'auth/user-disabled': 'Akun ini dinonaktifkan',
        'auth/user-not-found': 'Akun tidak ditemukan',
        'auth/wrong-password': 'Password salah',
        'auth/email-already-in-use': 'Email sudah digunakan',
        'auth/operation-not-allowed': 'Operasi tidak diizinkan',
        'auth/weak-password': 'Password terlalu lemah, minimal 6 karakter',
        'auth/too-many-requests': 'Terlalu banyak percobaan, coba lagi nanti',
        'auth/requires-recent-login': 'Silakan login ulang untuk melakukan ini'
    };
    
    return errorMessages[errorCode] || `Error: ${errorCode}`;
}

// Export functions untuk digunakan di file lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        checkAuthState,
        loginUser,
        registerUser,
        logoutUser,
        updateUserProfile,
        getUserData,
        resetPassword,
        changePassword
    };
}