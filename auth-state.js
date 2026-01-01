// auth-state.js
document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in
    const user = await checkAuthState();
    
    if (user) {
        // User is logged in
        updateUIForLoggedInUser(user);
    } else {
        // User is not logged in
        updateUIForLoggedOutUser();
    }
});

// Check authentication state
async function checkAuthState() {
    try {
        // Check Firebase auth state
        return new Promise((resolve) => {
            firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    // Store user data in localStorage
                    localStorage.setItem('user', JSON.stringify({
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName,
                        photoURL: user.photoURL,
                        emailVerified: user.emailVerified
                    }));
                    resolve(user);
                } else {
                    localStorage.removeItem('user');
                    resolve(null);
                }
            });
        });
    } catch (error) {
        console.error('Error checking auth state:', error);
        return null;
    }
}

// Update UI for logged in user
function updateUIForLoggedInUser(user) {
    // Update navigation
    const loginLink = document.querySelector('a[href="#login"], a[href="login.html"]');
    if (loginLink) {
        loginLink.textContent = user.displayName || user.email;
        loginLink.href = '#profile';
        loginLink.innerHTML = `
            <i class="fas fa-user-circle"></i> 
            ${user.displayName || user.email.split('@')[0]}
        `;
        
        // Add logout option
        const logoutItem = document.createElement('li');
        logoutItem.innerHTML = `
            <a href="#" id="logoutBtn" style="color: var(--accent);">
                <i class="fas fa-sign-out-alt"></i> Logout
            </a>
        `;
        
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu) {
            navMenu.appendChild(logoutItem);
            
            // Add logout event listener
            document.getElementById('logoutBtn').addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        }
    }
    
    // Show protected content
    const protectedElements = document.querySelectorAll('.protected');
    protectedElements.forEach(el => {
        el.style.display = 'block';
    });
}

// Update UI for logged out user
function updateUIForLoggedOutUser() {
    // Hide protected content
    const protectedElements = document.querySelectorAll('.protected');
    protectedElements.forEach(el => {
        el.style.display = 'none';
    });
}

// Logout function
function logout() {
    firebase.auth().signOut().then(() => {
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }).catch((error) => {
        console.error('Logout error:', error);
    });
}

// Get current user
function getCurrentUser() {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
}

// Check if user is authenticated
function isAuthenticated() {
    return getCurrentUser() !== null;
}

// Export functions
window.authState = {
    checkAuthState,
    getCurrentUser,
    isAuthenticated,
    logout,
    updateUIForLoggedInUser,
    updateUIForLoggedOutUser
};