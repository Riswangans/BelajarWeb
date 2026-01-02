// HAPUS import { auth, db, storage } dari baris ini
// Tidak perlu import karena kita akan inisialisasi langsung

// Inisialisasi Firebase
let auth, db, storage;

try {
    // Pastikan firebaseConfig didefinisikan di sini atau di firebaseConfig.js yang di-load sebelumnya
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    storage = firebase.storage();
    console.log("Firebase initialized successfully");
} catch (error) {
    console.log("Firebase initialization error:", error);
    // Fallback to mock data if Firebase fails
}

// DOM Elements
const header = document.getElementById('header');
const mobileToggle = document.getElementById('mobile-toggle');
const mobileMenu = document.getElementById('mobile-menu');
const testimonialGrid = document.getElementById('testimonial-grid');
const totalTestimonials = document.getElementById('total-testimonials');
const averageRating = document.getElementById('averageRating');
const ratingValue = document.getElementById('rating-value');
const reviewCount = document.getElementById('review-count');
const totalProducts = document.getElementById('total-products');

// Product categories mapping
const productCategories = {
    'script': {
        name: 'Script Premium',
        icon: 'fas fa-code',
        badgeClass: 'product-badge-script'
    },
    'panel': {
        name: 'Panel Pterodactyl',
        icon: 'fas fa-server',
        badgeClass: 'product-badge-panel'
    },
    'nokos': {
        name: 'Nokos',
        icon: 'fas fa-phone',
        badgeClass: 'product-badge-nokos'
    },
    'suntik': {
        name: 'Suntik Medsos',
        icon: 'fas fa-users',
        badgeClass: 'product-badge-suntik'
    },
    'bot': {
        name: 'Sewa Bot WhatsApp',
        icon: 'fab fa-whatsapp',
        badgeClass: 'product-badge-bot'
    }
};

// Scroll variables for header hide/show
let lastScrollTop = 0;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadTestimonials();
    setupScrollAnimations();
    setupHeaderScroll();
});

// Setup event listeners
function setupEventListeners() {
    if (!mobileToggle || !mobileMenu) return;
    
    // Mobile menu toggle
    mobileToggle.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
        const icon = mobileToggle.querySelector('i');
        if (icon) {
            if (mobileMenu.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        }
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        const target = e.target;
        
        // Gunakan @ts-ignore untuk menghindari error TypeScript di editor
        // @ts-ignore
        if (!mobileToggle.contains(target) && !mobileMenu.contains(target)) {
            mobileMenu.classList.remove('active');
            const icon = mobileToggle.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        }
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                // Close mobile menu if open
                mobileMenu.classList.remove('active');
                const icon = mobileToggle.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
                
                // Scroll to target
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Load testimonials from Firestore
async function loadTestimonials() {
    try {
        // Try to load from Firestore if available
        if (db) {
            const testimonialsRef = db.collection('testimonials');
            const snapshot = await testimonialsRef.orderBy('date', 'desc').limit(20).get();
            
            if (snapshot.empty) {
                console.log("No testimonials found in Firestore, using default");
                updateTestimonialStats(1, 5.0, 1); // Default stats
                return;
            }
            
            let totalRating = 0;
            const testimonials = [];
            const uniqueProducts = new Set();
            
            snapshot.forEach(doc => {
                const data = doc.data();
                testimonials.push({
                    id: doc.id,
                    ...data
                });
                if (data.rating) totalRating += data.rating;
                if (data.productType) uniqueProducts.add(data.productType);
            });
            
            // Update stats
            const avgRating = testimonials.length > 0 ? totalRating / testimonials.length : 5.0;
            updateTestimonialStats(testimonials.length, avgRating, uniqueProducts.size);
            
            // Render testimonials
            renderTestimonials(testimonials);
        } else {
            // Fallback to default testimonial
            console.log("Using default testimonial data");
            updateTestimonialStats(1, 5.0, 1);
        }
    } catch (error) {
        console.error("Error loading testimonials:", error);
        // Fallback to default
        updateTestimonialStats(1, 5.0, 1);
    }
}

// Render testimonials to the grid
function renderTestimonials(testimonials) {
    if (!testimonialGrid) return;
    
    testimonialGrid.innerHTML = '';
    
    // Add default testimonial if no testimonials
    if (testimonials.length === 0) {
        const defaultCard = createTestimonialCard({
            name: "Jordan Developer",
            rating: 5,
            text: "Script PHP yang saya beli sangat berkualitas. Dokumentasi lengkap dan support responsif.",
            productType: "script",
            productName: "E-Commerce Script Pro",
            date: new Date()
        });
        testimonialGrid.appendChild(defaultCard);
    } else {
        testimonials.forEach(testimonial => {
            const testimonialCard = createTestimonialCard(testimonial);
            testimonialGrid.appendChild(testimonialCard);
        });
    }
    
    // Re-initialize fade-in animations for new elements
    setupScrollAnimations();
}

// Create testimonial card element
function createTestimonialCard(testimonial) {
    const card = document.createElement('div');
    card.className = 'testimonial-card fade-in';
    
    // Format date
    let dateStr = 'Tanggal tidak tersedia';
    if (testimonial.date) {
        const date = testimonial.date.toDate ? testimonial.date.toDate() : new Date(testimonial.date);
        dateStr = date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }
    
    // Get product info
    const productType = testimonial.productType || 'script';
    const productInfo = productCategories[productType] || productCategories['script'];
    const productName = testimonial.productName || 'Produk Digital';
    
    // Create stars HTML
    let starsHTML = '';
    const rating = testimonial.rating || 5;
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(rating)) {
            starsHTML += '<i class="fas fa-star"></i>';
        } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
            starsHTML += '<i class="fas fa-star-half-alt"></i>';
        } else {
            starsHTML += '<i class="far fa-star"></i>';
        }
    }
    
    // Get initials for avatar
    const name = testimonial.name || 'Pelanggan';
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    
    card.innerHTML = `
        <div class="testimonial-product ${productInfo.badgeClass}">
            <i class="${productInfo.icon}"></i> ${productInfo.name}
        </div>
        <div class="testimonial-header">
            <div class="testimonial-avatar">${initials}</div>
            <div class="testimonial-info">
                <h4>${name}</h4>
                <div class="testimonial-date">${dateStr}</div>
            </div>
        </div>
        <div class="testimonial-rating">
            ${starsHTML}
        </div>
        <p class="testimonial-text">"${testimonial.text || 'Testimoni tidak tersedia.'}"</p>
        <div class="testimonial-product-name">
            <i class="fas fa-shopping-bag"></i> Membeli: <strong>${productName}</strong>
        </div>
    `;
    
    return card;
}

// Update testimonial statistics
function updateTestimonialStats(count, rating, productCount) {
    if (totalTestimonials) totalTestimonials.textContent = count.toString();
    if (averageRating) averageRating.textContent = rating.toFixed(1);
    if (ratingValue) ratingValue.textContent = rating.toFixed(1);
    if (reviewCount) reviewCount.textContent = count.toString();
    if (totalProducts) totalProducts.textContent = productCount.toString();
    
    // Update stars display based on rating
    const starsContainer = document.querySelector('.rating-stars');
    if (starsContainer) {
        starsContainer.innerHTML = '';
        
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        
        for (let i = 0; i < 5; i++) {
            const star = document.createElement('i');
            if (i < fullStars) {
                star.className = 'fas fa-star';
            } else if (i === fullStars && hasHalfStar) {
                star.className = 'fas fa-star-half-alt';
            } else {
                star.className = 'far fa-star';
            }
            starsContainer.appendChild(star);
        }
    }
}

// Setup scroll animations
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });
}

// Header hide/show on scroll
function setupHeaderScroll() {
    if (!header) return;
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling down - hide header
            header.classList.add('hide');
        } else {
            // Scrolling up - show header
            header.classList.remove('hide');
        }
        
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    });
}

// Add sample testimonials function (for testing)
async function addSampleTestimonials() {
    if (!db) {
        console.log("Firebase not available, cannot add testimonials");
        return;
    }
    
    try {
        const sampleTestimonials = [
            {
                name: "Rizky Pratama",
                rating: 4.5,
                text: "Panel hosting yang sangat stabil dan support responsif. Sangat membantu untuk mengelola server game Minecraft saya.",
                productType: "panel",
                productName: "Panel Pterodactyl 8GB",
                date: firebase.firestore.FieldValue.serverTimestamp()
            },
            {
                name: "Siti Aisyah",
                rating: 5,
                text: "Nomor kosong yang saya beli berhasil digunakan untuk verifikasi akun baru. Proses cepat dan nomor aktif sampai 24 jam.",
                productType: "nokos",
                productName: "Paket Nokos 10 Nomor",
                date: firebase.firestore.FieldValue.serverTimestamp()
            },
            {
                name: "Budi Santoso",
                rating: 4,
                text: "Script bot WhatsApp sangat membantu otomasi bisnis. Fitur auto-reply dan broadcast pesan bekerja dengan baik.",
                productType: "bot",
                productName: "Bot WhatsApp Business",
                date: firebase.firestore.FieldValue.serverTimestamp()
            },
            {
                name: "Dewi Anggraini",
                rating: 4.8,
                text: "Layanan suntik followers Instagram aman dan natural. Dalam 3 hari followers bertambah 5K tanpa ada masalah dengan akun.",
                productType: "suntik",
                productName: "Suntik Instagram Premium",
                date: firebase.firestore.FieldValue.serverTimestamp()
            }
        ];
        
        const batch = db.batch();
        
        sampleTestimonials.forEach((testimonial, index) => {
            const testimonialRef = db.collection('testimonials').doc();
            batch.set(testimonialRef, testimonial);
        });
        
        await batch.commit();
        console.log("Sample testimonials added");
        loadTestimonials(); // Reload testimonials
    } catch (error) {
        console.error("Error adding testimonials:", error);
    }
}

// Expose function for testing (remove in production)
window.addSampleTestimonials = addSampleTestimonials;