// Gestion du thème (clair/sombre)
document.addEventListener('DOMContentLoaded', function() {
    const toggleThemeBtn = document.getElementById('toggleTheme');
    const body = document.body;
    
    // Vérifier si une préférence est déjà stockée
    const currentTheme = localStorage.getItem('theme');
    
    // Appliquer le thème sauvegardé ou détecter la préférence du système
    if (currentTheme) {
        body.classList.add(currentTheme);
        updateThemeIcon(currentTheme === 'dark-theme');
    } else {
        // Détecter la préférence du système
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            body.classList.add('dark-theme');
            updateThemeIcon(true);
        }
    }
    
    // Gestionnaire de clic pour basculer le thème
    if (toggleThemeBtn) {
        toggleThemeBtn.addEventListener('click', function() {
            const isDarkTheme = body.classList.toggle('dark-theme');
            
            // Sauvegarder la préférence
            localStorage.setItem('theme', isDarkTheme ? 'dark-theme' : '');
            
            // Mettre à jour l'icône
            updateThemeIcon(isDarkTheme);
        });
    }
    
    // Fonction pour mettre à jour l'icône du bouton
    function updateThemeIcon(isDarkTheme) {
        const iconElement = toggleThemeBtn ? toggleThemeBtn.querySelector('.icon-theme') : null;
        if (iconElement) {
            iconElement.textContent = isDarkTheme ? '☀️' : '🌙';
        }
    }
}); 