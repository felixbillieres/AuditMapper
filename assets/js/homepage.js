// Homepage JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Animation des cartes au scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observer les cartes d'outils
    document.querySelectorAll('.tool-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });

    // Observer les éléments de fonctionnalités
    document.querySelectorAll('.feature-item').forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(30px)';
        item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(item);
    });

    // Gestion du menu langue
    const languageDropdown = document.getElementById('languageDropdown');
    const languageMenu = document.getElementById('languageMenu');

    if (languageDropdown && languageMenu) {
        languageDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            languageMenu.style.display = languageMenu.style.display === 'block' ? 'none' : 'block';
        });

        // Fermer le menu si on clique ailleurs
        document.addEventListener('click', () => {
            languageMenu.style.display = 'none';
        });

        // Gestion de la sélection de langue
        document.querySelectorAll('.language-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const lang = e.currentTarget.dataset.lang;
                const currentLanguage = document.getElementById('currentLanguage');
                
                if (lang === 'fr') {
                    currentLanguage.textContent = 'Français';
                } else if (lang === 'en') {
                    currentLanguage.textContent = 'English';
                }
                
                languageMenu.style.display = 'none';
                
                // Ici vous pouvez ajouter la logique de changement de langue
                console.log('Langue sélectionnée:', lang);
            });
        });
    }

    // Animation du logo principal
    const mainLogo = document.querySelector('.main-logo');
    if (mainLogo) {
        mainLogo.addEventListener('mouseenter', () => {
            mainLogo.style.transform = 'scale(1.1) rotate(5deg)';
        });

        mainLogo.addEventListener('mouseleave', () => {
            mainLogo.style.transform = 'scale(1) rotate(0deg)';
        });
    }

    // Effet parallax léger sur le hero
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const heroContent = document.querySelector('.hero-content');
        
        if (heroContent && scrolled < window.innerHeight) {
            heroContent.style.transform = `translateY(${scrolled * 0.3}px)`;
        }
    });

    // Animation des statistiques
    const statNumbers = document.querySelectorAll('.stat-number');
    const animateStats = () => {
        statNumbers.forEach(stat => {
            const finalValue = stat.textContent;
            const numericValue = parseInt(finalValue.replace(/\D/g, ''));
            
            if (numericValue) {
                let currentValue = 0;
                const increment = numericValue / 30;
                const timer = setInterval(() => {
                    currentValue += increment;
                    if (currentValue >= numericValue) {
                        stat.textContent = finalValue;
                        clearInterval(timer);
                    } else {
                        stat.textContent = Math.floor(currentValue).toString();
                    }
                }, 50);
            }
        });
    };

    // Déclencher l'animation des stats quand elles sont visibles
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateStats();
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) {
        statsObserver.observe(heroStats);
    }

    // Smooth scroll pour les liens internes
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

    // Effet de typing pour le titre (optionnel)
    const titleMain = document.querySelector('.title-main');
    if (titleMain) {
        const text = titleMain.textContent;
        titleMain.textContent = '';
        titleMain.style.borderRight = '2px solid white';
        
        let i = 0;
        const typeWriter = () => {
            if (i < text.length) {
                titleMain.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 100);
            } else {
                setTimeout(() => {
                    titleMain.style.borderRight = 'none';
                }, 1000);
            }
        };
        
        // Démarrer l'effet après un petit délai
        setTimeout(typeWriter, 1000);
    }

    // Gestion des cartes d'outils - effet hover amélioré
    document.querySelectorAll('.tool-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-8px) scale(1.02)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Préchargement des images pour une meilleure performance
    const preloadImages = () => {
        const images = [
            '/assets/images/logo.png'
        ];
        
        images.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    };

    preloadImages();

    console.log('🚀 PwnB4lunch Homepage loaded successfully!');
});

// Fonction utilitaire pour débouncer les événements
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Optimisation du scroll avec debounce
const optimizedScroll = debounce(() => {
    const scrolled = window.pageYOffset;
    const heroContent = document.querySelector('.hero-content');
    
    if (heroContent && scrolled < window.innerHeight) {
        heroContent.style.transform = `translateY(${scrolled * 0.3}px)`;
    }
}, 10);

window.addEventListener('scroll', optimizedScroll);

// Gestion du redimensionnement de fenêtre
const optimizedResize = debounce(() => {
    // Recalculer les animations si nécessaire
    console.log('Window resized');
}, 250);

window.addEventListener('resize', optimizedResize);

// Fonction pour créer des particules flottantes (effet décoratif)
function createFloatingParticles() {
    const heroHeader = document.querySelector('.hero-header');
    if (!heroHeader) return;

    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'floating-particle';
        particle.style.cssText = `
            position: absolute;
            width: 4px;
            height: 4px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            pointer-events: none;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: float-particle ${5 + Math.random() * 10}s infinite linear;
        `;
        heroHeader.appendChild(particle);
    }

    // Ajouter l'animation CSS pour les particules
    const style = document.createElement('style');
    style.textContent = `
        @keyframes float-particle {
            0% {
                transform: translateY(100vh) rotate(0deg);
                opacity: 0;
            }
            10% {
                opacity: 1;
            }
            90% {
                opacity: 1;
            }
            100% {
                transform: translateY(-100vh) rotate(360deg);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// Activer les particules flottantes après le chargement
setTimeout(createFloatingParticles, 2000);

// Gestion des raccourcis clavier
document.addEventListener('keydown', (e) => {
    // Ctrl + K pour ouvrir la recherche rapide (futur feature)
    if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        console.log('Quick search shortcut activated');
        // Ici vous pourriez ouvrir un modal de recherche
    }
    
    // Échap pour fermer les menus ouverts
    if (e.key === 'Escape') {
        const languageMenu = document.getElementById('languageMenu');
        if (languageMenu) {
            languageMenu.style.display = 'none';
        }
    }
});

// Analytics et tracking (placeholder)
function trackToolAccess(toolName) {
    console.log(`Tool accessed: ${toolName}`);
    // Ici vous pourriez ajouter Google Analytics ou autre
}

// Ajouter le tracking aux liens des outils
document.querySelectorAll('.tool-card a').forEach(link => {
    link.addEventListener('click', (e) => {
        const toolName = e.target.closest('.tool-card').querySelector('h3').textContent;
        trackToolAccess(toolName);
    });
}); 