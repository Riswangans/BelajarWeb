// auth-state.js

/**
 * Authentication State Management
 * Handles user authentication state across the application
 */

class AuthState {
    constructor() {
        this.user = null;
        this.isLoading = true;
        this.listeners = [];
        this.init();
    }

    /**
     * Initialize auth state listener
     */
    init() {
        // Check localStorage for saved user data
        const savedUser = localStorage.getItem('userData');
        if (savedUser) {
            try {
                this.user = JSON.parse(savedUser);
            } catch (error) {
                console.error('Error parsing saved user data:', error);
                localStorage.removeItem('userData');
            }
        }

        // Listen to Firebase auth state changes
        if (firebase.auth) {
            firebase.auth().onAuthStateChanged((firebaseUser) => {
                this.isLoading = false;
                
                if (firebaseUser) {
                    // User is signed in
                    this.syncUserWithFirebase(firebaseUser);
                } else {
                    // User is signed out
                    this.user = null;
                    localStorage.removeItem('userData');
                }
                
                this.notifyListeners();
            });
        } else {
            this.isLoading = false;
            this.notifyListeners();
        }
    }

    /**
     * Sync local user data with Firebase user
     * @param {Object} firebaseUser - Firebase user object
     */
    async syncUserWithFirebase(firebaseUser) {
        try {
            // Get additional user data from Firestore
            const userDoc = await firebase.firestore()
                .collection('users')
                .doc(firebaseUser.uid)
                .get();

            const userData = userDoc.exists ? userDoc.data() : {};

            this.user = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                emailVerified: firebaseUser.emailVerified,
                displayName: firebaseUser.displayName || userData.displayName || '',
                photoURL: firebaseUser.photoURL || userData.photoURL || '',
                role: userData.role || 'user',
                createdAt: userData.createdAt || '',
                lastLogin: userData.lastLogin || '',
                balance: userData.balance || 0,
                purchases: userData.purchases || 0,
                ...userData
            };

            // Save to localStorage
            localStorage.setItem('userData', JSON.stringify(this.user));

        } catch (error) {
            console.error('Error syncing user data:', error);
            // Fallback to basic Firebase user data
            this.user = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                emailVerified: firebaseUser.emailVerified,
                displayName: firebaseUser.displayName || '',
                photoURL: firebaseUser.photoURL || '',
                role: 'user'
            };
        }
    }

    /**
     * Get current user
     * @returns {Object|null} Current user or null
     */
    getCurrentUser() {
        return this.user;
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} True if user is authenticated
     */
    isAuthenticated() {
        return this.user !== null;
    }

    /**
     * Check if user has specific role
     * @param {string} role - Role to check
     * @returns {boolean} True if user has the role
     */
    hasRole(role) {
        return this.user && this.user.role === role;
    }

    /**
     * Check if user email is verified
     * @returns {boolean} True if email is verified
     */
    isEmailVerified() {
        return this.user && this.user.emailVerified;
    }

    /**
     * Get user's display name
     * @returns {string} Display name or email
     */
    getDisplayName() {
        if (!this.user) return '';
        return this.user.displayName || this.user.email.split('@')[0];
    }

    /**
     * Get user's initial for avatar
     * @returns {string} User's initial
     */
    getUserInitial() {
        if (!this.user) return '?';
        
        const name = this.user.displayName || this.user.email;
        return name.charAt(0).toUpperCase();
    }

    /**
     * Get user's avatar URL or generate initials
     * @returns {string} Avatar URL or initials
     */
    getAvatar() {
        if (!this.user) return '';
        
        if (this.user.photoURL) {
            return this.user.photoURL;
        }
        
        // Return initials for avatar
        const name = this.user.displayName || this.user.email;
        const initials = name.split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
        
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4361ee&color=fff&size=128`;
    }

    /**
     * Update user data
     * @param {Object} updates - Data to update
     */
    async updateUser(updates) {
        if (!this.user) return;

        try {
            // Update in Firestore
            await firebase.firestore()
                .collection('users')
                .doc(this.user.uid)
                .update(updates);

            // Update local state
            this.user = { ...this.user, ...updates };
            localStorage.setItem('userData', JSON.stringify(this.user));
            
            this.notifyListeners();
            return { success: true };

        } catch (error) {
            console.error('Error updating user:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Add auth state change listener
     * @param {Function} callback - Callback function
     */
    addListener(callback) {
        this.listeners.push(callback);
        
        // Immediately call with current state
        callback({
            user: this.user,
            isLoading: this.isLoading,
            isAuthenticated: this.isAuthenticated()
        });
    }

    /**
     * Remove auth state change listener
     * @param {Function} callback - Callback function to remove
     */
    removeListener(callback) {
        this.listeners = this.listeners.filter(listener => listener !== callback);
    }

    /**
     * Notify all listeners of state change
     */
    notifyListeners() {
        const state = {
            user: this.user,
            isLoading: this.isLoading,
            isAuthenticated: this.isAuthenticated(),
            isEmailVerified: this.isEmailVerified()
        };

        this.listeners.forEach(listener => {
            try {
                listener(state);
            } catch (error) {
                console.error('Error in auth state listener:', error);
            }
        });
    }

    /**
     * Login user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise} Login result
     */
    async login(email, password) {
        try {
            const result = await firebase.auth().signInWithEmailAndPassword(email, password);
            return { success: true, user: result.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Register new user
     * @param {string} email - User email
     * @param {string} password - User password
     * @param {Object} userData - Additional user data
     * @returns {Promise} Registration result
     */
    async register(email, password, userData = {}) {
        try {
            const result = await firebase.auth().createUserWithEmailAndPassword(email, password);
            const user = result.user;

            // Update profile if displayName provided
            if (userData.displayName) {
                await user.updateProfile({
                    displayName: userData.displayName
                });
            }

            // Create user document in Firestore
            await firebase.firestore()
                .collection('users')
                .doc(user.uid)
                .set({
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
            return { success: false, error: error.message };
        }
    }

    /**
     * Login with Google
     * @returns {Promise} Login result
     */
    async loginWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('profile');
            provider.addScope('email');

            const result = await firebase.auth().signInWithPopup(provider);
            return { success: true, user: result.user };

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Logout user
     * @returns {Promise} Logout result
     */
    async logout() {
        try {
            await firebase.auth().signOut();
            this.user = null;
            localStorage.removeItem('userData');
            this.notifyListeners();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Send password reset email
     * @param {string} email - User email
     * @returns {Promise} Reset email result
     */
    async sendPasswordResetEmail(email) {
        try {
            await firebase.auth().sendPasswordResetEmail(email);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Verify password reset code
     * @param {string} code - Reset code
     * @returns {Promise} Verification result
     */
    async verifyPasswordResetCode(code) {
        try {
            const email = await firebase.auth().verifyPasswordResetCode(code);
            return { success: true, email };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Confirm password reset
     * @param {string} code - Reset code
     * @param {string} newPassword - New password
     * @returns {Promise} Reset result
     */
    async confirmPasswordReset(code, newPassword) {
        try {
            await firebase.auth().confirmPasswordReset(code, newPassword);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

// Create global auth state instance
window.authState = new AuthState();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.authState;
}