// Inisialisasi partikel animasi
        function createParticles() {
            const particlesContainer = document.getElementById('particles');
            const particleCount = 50;
            
            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                particle.classList.add('particle');
                
                // Ukuran acak antara 2px dan 6px
                const size = Math.random() * 4 + 2;
                particle.style.width = `${size}px`;
                particle.style.height = `${size}px`;
                
                // Posisi acak
                particle.style.left = `${Math.random() * 100}%`;
                particle.style.top = `${Math.random() * 100}%`;
                
                // Warna acak (ungu, oranye, atau hijau)
                const colors = [
                    'rgba(139, 92, 246, 0.5)',
                    'rgba(165, 180, 252, 0.4)',
                    'rgba(245, 158, 11, 0.5)',
                    'rgba(251, 191, 36, 0.4)',
                    'rgba(16, 185, 129, 0.5)',
                    'rgba(52, 211, 153, 0.4)'
                ];
                const color = colors[Math.floor(Math.random() * colors.length)];
                particle.style.background = color;
                
                // Animasi
                const duration = Math.random() * 20 + 10;
                const delay = Math.random() * 5;
                particle.style.animation = `pulse ${duration}s infinite ${delay}s`;
                
                particlesContainer.appendChild(particle);
            }
        }

        // Kontrol video
        const video = document.getElementById('bg-video');
        const muteBtn = document.getElementById('mute-btn');
        const pauseBtn = document.getElementById('pause-btn');
        
        // Mute/unmute video
        muteBtn.addEventListener('click', () => {
            if (video.muted) {
                video.muted = false;
                muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            } else {
                video.muted = true;
                muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
            }
        });
        
        // Play/pause video
        pauseBtn.addEventListener('click', () => {
            if (video.paused) {
                video.play();
                pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            } else {
                video.pause();
                pauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            }
        });

        // Fungsi untuk menangani error video
        function handleVideoError() {
            console.log('Video utama tidak dapat dimuat, mencoba fallback...');
            // Ganti ke video fallback jika ada
            const videoSources = video.querySelectorAll('source');
            if (videoSources.length > 1) {
                // Coba sumber video kedua
                videoSources[0].style.display = 'none';
                video.load(); // Muat ulang video dengan sumber baru
                video.play().catch(e => {
                    console.log('Fallback video juga tidak dapat dimuat:', e);
                    // Jika fallback juga gagal, sembunyikan video background
                    document.querySelector('.video-background').style.display = 'none';
                });
            } else {
                // Jika hanya ada satu sumber, sembunyikan video background
                document.querySelector('.video-background').style.display = 'none';
            }
        }

        // Tambahkan event listener untuk error video
        video.addEventListener('error', handleVideoError);

        // Scroll animations
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

        // Observe all fade-in elements
        document.querySelectorAll('.fade-in').forEach(el => {
            observer.observe(el);
        });

        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Header background on scroll
        window.addEventListener('scroll', () => {
            const header = document.querySelector('header');
            if (window.scrollY > 100) {
                header.style.background = 'rgba(15, 15, 35, 0.95)';
                header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.4)';
            } else {
                header.style.background = 'rgba(15, 15, 35, 0.9)';
                header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
            }
        });

        // Add glow effect to cards on hover
        document.querySelectorAll('.package-card, .vps-card, .bot-card, .feature-card').forEach(card => {
            card.addEventListener('mouseenter', function() {
                if (this.classList.contains('bot-card')) {
                    this.style.boxShadow = '0 20px 40px rgba(245, 158, 11, 0.2)';
                } else if (this.classList.contains('vps-card')) {
                    this.style.boxShadow = '0 20px 40px rgba(16, 185, 129, 0.2)';
                } else {
                    this.style.boxShadow = '0 20px 40px rgba(139, 92, 246, 0.2)';
                }
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.boxShadow = '';
            });
        });

        // Inisialisasi partikel saat halaman dimuat
        window.addEventListener('DOMContentLoaded', () => {
            createParticles();
            
            // Coba putar video dengan timeout untuk menghindari autoplay block
            setTimeout(() => {
                video.play().catch(e => {
                    console.log('Autoplay diblokir, menunggu interaksi pengguna:', e);
                    // Tampilkan pesan atau tombol untuk memutar video
                });
            }, 1000);
        });

        // Coba putar video saat ada interaksi pengguna
        document.addEventListener('click', function initVideo() {
            video.play().then(() => {
                console.log('Video berhasil diputar setelah interaksi pengguna');
            }).catch(e => {
                console.log('Video masih tidak dapat diputar:', e);
            });
            // Hapus event listener setelah dicoba
            document.removeEventListener('click', initVideo);
        });
