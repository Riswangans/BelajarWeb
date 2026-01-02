import { db } from './firebase-config.js';
import { auth } from './firebase-config.js';
import { storage } from './firebase-config.js';

// Firebase Authentication State Listener
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        console.log('User is signed in:', user.email);
        
        // Update user last seen
        if (user.uid) {
            db.collection('users').doc(user.uid).update({
                lastSeen: firebase.firestore.FieldValue.serverTimestamp()
            }).catch(console.error);
        }
        
        // Store user data in localStorage
        const userData = {
            uid: user.uid,
            email: user.email,
            emailVerified: user.emailVerified,
            displayName: user.displayName,
            photoURL: user.photoURL,
            providerData: user.providerData
        };
        
        localStorage.setItem('currentUser', JSON.stringify(userData));
        
    } else {
        // User is signed out
        console.log('User is signed out');
        localStorage.removeItem('currentUser');
    }
});

// Helper Functions for Authentication

/**
 * Register new user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {Object} userData - Additional user data
 * @returns {Promise} - Promise with user credential
 */
async function registerUser(email, password, userData = {}) {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Update user profile if displayName provided
        if (userData.displayName) {
            await user.updateProfile({
                displayName: userData.displayName
            });
        }
        
        // Create user document in Firestore
        await db.collection('users').doc(user.uid).set({
            email: email,
            displayName: userData.displayName || '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
            emailVerified: false,
            role: 'user',
            status: 'active',
            ...userData
        });
        
        // Send email verification
        await user.sendEmailVerification();
        
        return { success: true, user: user };
        
    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Login user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise} - Promise with user credential
 */
async function loginUser(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Update last login time
        await db.collection('users').doc(user.uid).update({
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        return { success: true, user: user };
        
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Login with Google
 * @returns {Promise} - Promise with user credential
 */
async function loginWithGoogle() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
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
                displayName: user.displayName,
                photoURL: user.photoURL,
                provider: 'google',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                emailVerified: user.emailVerified,
                role: 'user',
                status: 'active'
            });
        } else {
            // Update last login
            await db.collection('users').doc(user.uid).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        return { success: true, user: user };
        
    } catch (error) {
        console.error('Google login error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Logout current user
 * @returns {Promise} - Promise of logout
 */
async function logoutUser() {
    try {
        await auth.signOut();
        localStorage.removeItem('currentUser');
        return { success: true };
    } catch (error) {
        console.error('Logout error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send password reset email
 * @param {string} email - User email
 * @returns {Promise} - Promise of reset email sent
 */
async function sendPasswordResetEmail(email) {
    try {
        await auth.sendPasswordResetEmail(email);
        return { success: true };
    } catch (error) {
        console.error('Password reset error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get current user data
 * @returns {Object|null} - Current user data or null
 */
function getCurrentUser() {
    const user = auth.currentUser;
    if (user) {
        return {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            emailVerified: user.emailVerified,
            photoURL: user.photoURL
        };
    }
    return null;
}

/**
 * Check if user is authenticated
 * @returns {boolean} - True if user is authenticated
 */
function isAuthenticated() {
    return auth.currentUser !== null;
}

/**
 * Get user document from Firestore
 * @param {string} userId - User ID
 * @returns {Promise} - Promise with user document
 */
async function getUserDocument(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
            return { success: true, data: userDoc.data() };
        } else {
            return { success: false, error: 'User not found' };
        }
    } catch (error) {
        console.error('Get user document error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update
 * @returns {Promise} - Promise of update
 */
async function updateUserProfile(userId, updates) {
    try {
        await db.collection('users').doc(userId).update(updates);
        
        // Also update Firebase Auth profile if displayName or photoURL
        const user = auth.currentUser;
        if (user && user.uid === userId) {
            const authUpdates = {};
            if (updates.displayName) authUpdates.displayName = updates.displayName;
            if (updates.photoURL) authUpdates.photoURL = updates.photoURL;
            
            if (Object.keys(authUpdates).length > 0) {
                await user.updateProfile(authUpdates);
            }
        }
        
        return { success: true };
    } catch (error) {
        console.error('Update user profile error:', error);
        return { success: false, error: error.message };
    }
}

// Export functions and services
window.firebaseAuth = {
    auth,
    db,
    storage,
    registerUser,
    loginUser,
    loginWithGoogle,
    logoutUser,
    sendPasswordResetEmail,
    getCurrentUser,
    isAuthenticated,
    getUserDocument,
    updateUserProfile
};

console.log('Firebase config loaded successfully');