import { auth, db, storage } from './firebaseConfig.js';

// Initialize Firebase
let currentUser = null;
let userTestimonials = [];
let userPurchases = 0;

// Inisialisasi Firebase sudah diimpor, hapus deklarasi ulang
// auth, db, dan storage sudah diimpor dari firebaseConfig.js

// DOM Elements
const authNavItem = document.getElementById('authNavItem');
const userName = document.getElementById('userName');
const userEmail = document.getElementById('userEmail');
const emailVerified = document.getElementById('emailVerified');
const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');
const totalPurchases = document.getElementById('totalPurchases');
const totalTestimonials = document.getElementById('totalTestimonials');
const joinDate = document.getElementById('joinDate');
const avatarContainer = document.getElementById('avatarContainer');
const avatarIcon = document.getElementById('avatarIcon');
const avatarImage = document.getElementById('avatarImage');
const avatarInput = document.getElementById('avatarInput');
const testimonialsHistory = document.getElementById('testimonialsHistory');
const loadingTestimonials = document.getElementById('loadingTestimonials');

// Edit Profile Elements
const editProfileBtn = document.getElementById('editProfileBtn');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const cancelProfileBtn = document.getElementById('cancelProfileBtn');
const editPasswordBtn = document.getElementById('editPasswordBtn');
const savePasswordBtn = document.getElementById('savePasswordBtn');
const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
const passwordForm = document.getElementById('passwordForm');

// Password toggle elements
const toggleCurrentPassword = document.getElementById('toggleCurrentPassword');
const toggleNewPassword = document.getElementById('toggleNewPassword');
const toggleConfirmNewPassword = document.getElementById('toggleConfirmNewPassword');

// Modal elements
const editTestimonialModal = document.getElementById('editTestimonialModal');
const closeTestimonialModal = document.getElementById('closeTestimonialModal');
const cancelEditTestimonial = document.getElementById('cancelEditTestimonial');
const editTestimonialForm = document.getElementById('editTestimonialForm');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuthState();
    setupEventListeners();
});

// Check authentication state
function checkAuthState() {
    if (!auth) return;
    
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            await loadUserData();
            await loadUserTestimonials();
            await loadUserPurchases();
            updateUIForLoggedInUser(user);
        } else {
            // Redirect to login if not authenticated
            window.location.href = 'login.html';
        }
    });
}

// Load user data
async function loadUserData() {
    if (!currentUser) return;
    
    // Display user info
    userName.textContent = currentUser.displayName || 'Pengguna';
    userEmail.textContent = currentUser.email;
    profileName.value = currentUser.displayName || '';
    profileEmail.value = currentUser.email;
    
    // Show email verified badge
    if (currentUser.emailVerified) {
        emailVerified.style.display = 'inline-flex';
    }
    
    // Load user avatar
    await loadUserAvatar();
    
    // Calculate join date
    const joinTimestamp = currentUser.metadata.creationTime;
    if (joinTimestamp) {
        const joinDateObj = new Date(joinTimestamp);
        joinDate.textContent = joinDateObj.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }
}

// Load user avatar
async function loadUserAvatar() {
    if (!currentUser) return;
    
    try {
        // Check if user has photoURL
        if (currentUser.photoURL) {
            avatarImage.src = currentUser.photoURL;
            avatarImage.style.display = 'block';
            avatarIcon.style.display = 'none';
        } else {
            // Check if avatar exists in storage
            const storageRef = storage.ref();
            const avatarRef = storageRef.child(`avatars/${currentUser.uid}.jpg`);
            
            try {
                const url = await avatarRef.getDownloadURL();
                avatarImage.src = url;
                avatarImage.style.display = 'block';
                avatarIcon.style.display = 'none';
            } catch (error) {
                // No avatar found, use default icon
                avatarImage.style.display = 'none';
                avatarIcon.style.display = 'block';
            }
        }
    } catch (error) {
        console.error("Error loading avatar:", error);
    }
}

// Load user testimonials
async function loadUserTestimonials() {
    if (!db || !currentUser) return;
    
    try {
        loadingTestimonials.style.display = 'block';
        
        const testimonialsRef = db.collection('testimonials');
        const query = testimonialsRef.where('userId', '==', currentUser.uid).orderBy('date', 'desc');
        const snapshot = await query.get();
        
        userTestimonials = [];
        snapshot.forEach(doc => {
            userTestimonials.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Update total testimonials count
        totalTestimonials.textContent = userTestimonials.length.toString(); // PERBAIKAN: Convert number ke string
        
        // Render testimonials
        renderUserTestimonials();
        
    } catch (error) {
        console.error("Error loading testimonials:", error);
        showError("Gagal memuat testimoni");
    } finally {
        loadingTestimonials.style.display = 'none';
    }
}

// Load user purchases (example - you need to implement based on your data structure)
async function loadUserPurchases() {
    if (!db || !currentUser) return;
    
    try {
        // Example: Count purchases from 'orders' collection
        const ordersRef = db.collection('orders');
        const query = ordersRef.where('userId', '==', currentUser.uid).where('status', '==', 'completed');
        const snapshot = await query.get();
        
        userPurchases = snapshot.size;
        totalPurchases.textContent = userPurchases.toString(); // PERBAIKAN: Convert number ke string
        
    } catch (error) {
        console.error("Error loading purchases:", error);
        // If no orders collection exists, use testimonials as proxy
        totalPurchases.textContent = userTestimonials.length.toString(); // PERBAIKAN: Convert number ke string
    }
}

// Render user testimonials
function renderUserTestimonials() {
    if (!testimonialsHistory) return;
    
    if (userTestimonials.length === 0) {
        testimonialsHistory.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-comment-slash"></i>
                <p>Belum ada testimoni</p>
                <p style="font-size: 0.9rem; margin-top: 10px;">Testimoni yang Anda buat akan muncul di sini</p>
            </div>
        `;
        return;
    }
    
    let testimonialsHTML = '';
    
    userTestimonials.forEach(testimonial => {
        const date = testimonial.date?.toDate ? testimonial.date.toDate() : new Date(testimonial.date || Date.now());
        const dateStr = date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        // Create stars HTML
        let starsHTML = '';
        const rating = testimonial.rating || 5;
        for (let i = 1; i <= 5; i++) {
            starsHTML += i <= rating 
                ? '<i class="fas fa-star"></i>'
                : '<i class="far fa-star"></i>';
        }
        
        testimonialsHTML += `
            <div class="testimonial-item fade-in" data-id="${testimonial.id}">
                <div class="testimonial-header">
                    <div class="testimonial-product">
                        <i class="fas fa-shopping-bag"></i> ${testimonial.productName || 'Produk Digital'}
                    </div>
                    <div class="testimonial-actions">
                        <button class="action-btn edit-testimonial" onclick="openEditTestimonial('${testimonial.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-testimonial" onclick="deleteTestimonial('${testimonial.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="testimonial-rating">
                    ${starsHTML}
                </div>
                <p class="testimonial-text">"${testimonial.text}"</p>
                <div class="testimonial-date">
                    <i class="far fa-clock"></i> ${dateStr}
                </div>
            </div>
        `;
    });
    
    testimonialsHistory.innerHTML = testimonialsHTML;
}

// Setup event listeners
function setupEventListeners() {
    // Avatar upload
    avatarInput.addEventListener('change', handleAvatarUpload);
    
    // Edit profile
    editProfileBtn.addEventListener('click', () => {
        profileName.disabled = false;
        editProfileBtn.style.display = 'none';
        saveProfileBtn.style.display = 'flex';
        cancelProfileBtn.style.display = 'flex';
    });
    
    saveProfileBtn.addEventListener('click', saveProfile);
    cancelProfileBtn.addEventListener('click', cancelEditProfile);
    
    // Change password
    editPasswordBtn.addEventListener('click', () => {
        passwordForm.style.display = 'block';
        editPasswordBtn.style.display = 'none';
        savePasswordBtn.style.display = 'flex';
        cancelPasswordBtn.style.display = 'flex';
    });
    
    savePasswordBtn.addEventListener('click', changePassword);
    cancelPasswordBtn.addEventListener('click', cancelChangePassword);
    
    // Password toggle
    toggleCurrentPassword.addEventListener('click', () => togglePasswordVisibility('currentPassword', toggleCurrentPassword));
    toggleNewPassword.addEventListener('click', () => togglePasswordVisibility('newPassword', toggleNewPassword));
    toggleConfirmNewPassword.addEventListener('click', () => togglePasswordVisibility('confirmNewPassword', toggleConfirmNewPassword));
    
    // Modal events
    closeTestimonialModal.addEventListener('click', () => editTestimonialModal.style.display = 'none');
    cancelEditTestimonial.addEventListener('click', () => editTestimonialModal.style.display = 'none');
    
    // Edit testimonial form
    editTestimonialForm.addEventListener('submit', saveTestimonialChanges);
    
    // Rating stars
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('rating-star')) {
            const value = parseInt(e.target.dataset.value);
            setRating(value);
        }
    });
}

// Handle avatar upload
async function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file || !currentUser) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showError('File harus berupa gambar');
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showError('Ukuran gambar maksimal 5MB');
        return;
    }
    
    try {
        showSuccess('Mengupload foto...');
        
        // Upload to Firebase Storage
        const storageRef = storage.ref();
        const avatarRef = storageRef.child(`avatars/${currentUser.uid}.jpg`);
        await avatarRef.put(file);
        
        // Get download URL
        const downloadURL = await avatarRef.getDownloadURL();
        
        // Update user profile
        await currentUser.updateProfile({
            photoURL: downloadURL
        });
        
        // Update UI
        avatarImage.src = downloadURL;
        avatarImage.style.display = 'block';
        avatarIcon.style.display = 'none';
        
        showSuccess('Foto profil berhasil diubah');
        
        // Update local storage
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        userData.photoURL = downloadURL;
        localStorage.setItem('user', JSON.stringify(userData));
        
    } catch (error) {
        console.error("Error uploading avatar:", error);
        showError('Gagal mengupload foto');
    }
}

// Save profile changes
async function saveProfile() {
    const newName = profileName.value.trim();
    
    if (!newName) {
        showError('Nama tidak boleh kosong');
        return;
    }
    
    try {
        showSuccess('Menyimpan perubahan...');
        
        // Update profile
        await currentUser.updateProfile({
            displayName: newName
        });
        
        // Update UI
        userName.textContent = newName;
        profileName.disabled = true;
        editProfileBtn.style.display = 'flex';
        saveProfileBtn.style.display = 'none';
        cancelProfileBtn.style.display = 'none';
        
        showSuccess('Profil berhasil diperbarui');
        
        // Update local storage
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        userData.displayName = newName;
        localStorage.setItem('user', JSON.stringify(userData));
        
    } catch (error) {
        console.error("Error updating profile:", error);
        showError('Gagal memperbarui profil');
    }
}

// Cancel edit profile
function cancelEditProfile() {
    profileName.value = currentUser.displayName || '';
    profileName.disabled = true;
    editProfileBtn.style.display = 'flex';
    saveProfileBtn.style.display = 'none';
    cancelProfileBtn.style.display = 'none';
}

// Change password
async function changePassword() {
    const currentPass = document.getElementById('currentPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmNewPassword').value;
    
    // Validation
    if (!currentPass || !newPass || !confirmPass) {
        showError('Semua field harus diisi');
        return;
    }
    
    if (newPass.length < 6) {
        showError('Password baru minimal 6 karakter');
        return;
    }
    
    if (newPass !== confirmPass) {
        showError('Password baru dan konfirmasi tidak sama');
        return;
    }
    
    try {
        showSuccess('Mengubah password...');
        
        // Re-authenticate user
        const credential = firebase.auth.EmailAuthProvider.credential(
            currentUser.email,
            currentPass
        );
        
        await currentUser.reauthenticateWithCredential(credential);
        
        // Update password
        await currentUser.updatePassword(newPass);
        
        // Reset form
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmNewPassword').value = '';
        
        passwordForm.style.display = 'none';
        editPasswordBtn.style.display = 'flex';
        savePasswordBtn.style.display = 'none';
        cancelPasswordBtn.style.display = 'none';
        
        showSuccess('Password berhasil diubah');
        
    } catch (error) {
        console.error("Error changing password:", error);
        
        let message = 'Gagal mengubah password';
        switch (error.code) {
            case 'auth/wrong-password':
                message = 'Password saat ini salah';
                break;
            case 'auth/weak-password':
                message = 'Password terlalu lemah';
                break;
            case 'auth/requires-recent-login':
                message = 'Silakan login ulang untuk mengubah password';
                break;
        }
        
        showError(message);
    }
}

// Cancel change password
function cancelChangePassword() {
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmNewPassword').value = '';
    passwordForm.style.display = 'none';
    editPasswordBtn.style.display = 'flex';
    savePasswordBtn.style.display = 'none';
    cancelPasswordBtn.style.display = 'none';
}

// Toggle password visibility
function togglePasswordVisibility(inputId, toggleBtn) {
    const input = document.getElementById(inputId);
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
    const icon = toggleBtn.querySelector('i');
    icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
}

// Open edit testimonial modal
function openEditTestimonial(testimonialId) {
    const testimonial = userTestimonials.find(t => t.id === testimonialId);
    if (!testimonial) return;
    
    // Fill form
    document.getElementById('editTestimonialId').value = testimonialId;
    document.getElementById('editTestimonialText').value = testimonial.text;
    setRating(testimonial.rating || 5);
    
    // Show modal
    editTestimonialModal.style.display = 'flex';
}

// Set rating stars
function setRating(rating) {
    document.getElementById('editTestimonialRating').value = rating.toString(); // PERBAIKAN: Convert number ke string
    
    const stars = document.querySelectorAll('.rating-star');
    stars.forEach(star => {
        const value = parseInt(star.dataset.value);
        star.style.color = value <= rating ? 'var(--warning)' : 'var(--gray)';
    });
}

// Save testimonial changes
async function saveTestimonialChanges(e) {
    e.preventDefault();
    
    const testimonialId = document.getElementById('editTestimonialId').value;
    const newText = document.getElementById('editTestimonialText').value.trim();
    const newRating = parseInt(document.getElementById('editTestimonialRating').value);
    
    if (!newText) {
        showError('Testimoni tidak boleh kosong');
        return;
    }
    
    try {
        showSuccess('Menyimpan testimoni...');
        
        // Update in Firestore
        await db.collection('testimonials').doc(testimonialId).update({
            text: newText,
            rating: newRating,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Update local data
        const testimonialIndex = userTestimonials.findIndex(t => t.id === testimonialId);
        if (testimonialIndex !== -1) {
            userTestimonials[testimonialIndex].text = newText;
            userTestimonials[testimonialIndex].rating = newRating;
        }
        
        // Re-render testimonials
        renderUserTestimonials();
        
        // Close modal
        editTestimonialModal.style.display = 'none';
        
        showSuccess('Testimoni berhasil diperbarui');
        
    } catch (error) {
        console.error("Error updating testimonial:", error);
        showError('Gagal memperbarui testimoni');
    }
}

// Delete testimonial
async function deleteTestimonial(testimonialId) {
    if (!confirm('Apakah Anda yakin ingin menghapus testimoni ini?')) {
        return;
    }
    
    try {
        showSuccess('Menghapus testimoni...');
        
        // Delete from Firestore
        await db.collection('testimonials').doc(testimonialId).delete();
        
        // Update local data
        userTestimonials = userTestimonials.filter(t => t.id !== testimonialId);
        
        // Update count
        totalTestimonials.textContent = userTestimonials.length.toString(); // PERBAIKAN: Convert number ke string
        
        // Re-render testimonials
        renderUserTestimonials();
        
        showSuccess('Testimoni berhasil dihapus');
        
    } catch (error) {
        console.error("Error deleting testimonial:", error);
        showError('Gagal menghapus testimoni');
    }
}

// Update UI for logged in user
function updateUIForLoggedInUser(user) {
    // Update navigation
    authNavItem.innerHTML = `
        <li>
            <a href="profile.html" class="nav-link" style="color: var(--primary);">
                <i class="fas fa-user-circle"></i> ${user.displayName || user.email.split('@')[0]}
            </a>
        </li>
        <li>
            <a href="#" class="logout-btn" id="logoutBtn">
                <i class="fas fa-sign-out-alt"></i> Logout
            </a>
        </li>
    `;
    
    // Add logout event listener
    document.getElementById('logoutBtn').addEventListener('click', logout);
}

// Logout function
function logout() {
    auth.signOut().then(() => {
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }).catch((error) => {
        console.error('Logout error:', error);
        showError('Gagal logout');
    });
}

// Show success message
function showSuccess(message) {
    const successAlert = document.getElementById('successAlert');
    const successMessage = document.getElementById('successMessage');
    
    successMessage.textContent = message;
    successAlert.style.display = 'flex';
    
    setTimeout(() => {
        successAlert.style.display = 'none';
    }, 5000);
}

// Show error message
function showError(message) {
    const errorAlert = document.getElementById('errorAlert');
    const errorMessage = document.getElementById('errorMessage');
    
    errorMessage.textContent = message;
    errorAlert.style.display = 'flex';
    
    setTimeout(() => {
        errorAlert.style.display = 'none';
    }, 5000);
}