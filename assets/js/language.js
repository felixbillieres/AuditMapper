document.addEventListener('DOMContentLoaded', function() {
    // Éléments DOM
    const languageDropdown = document.getElementById('languageDropdown');
    const languageMenu = document.getElementById('languageMenu');
    const languageOptions = document.querySelectorAll('.language-option');
    const currentLanguageText = document.getElementById('currentLanguage');
    
    // Ouvrir/fermer le menu déroulant
    languageDropdown.addEventListener('click', function() {
        languageMenu.classList.toggle('show');
    });
    
    // Fermer le menu si on clique ailleurs
    document.addEventListener('click', function(event) {
        if (!languageDropdown.contains(event.target)) {
            languageMenu.classList.remove('show');
        }
    });
    
    // Sélection d'une langue
    languageOptions.forEach(option => {
        option.addEventListener('click', function() {
            const lang = this.getAttribute('data-lang');
            const langName = this.textContent;
            
            // Mettre à jour l'affichage
            currentLanguageText.textContent = langName;
            
            // Sauvegarder la préférence dans localStorage
            localStorage.setItem('preferredLanguage', lang);
            
            // Charger les traductions et appliquer à la page
            loadTranslations(lang);
            
            // Fermer le menu
            languageMenu.classList.remove('show');
        });
    });
    
    // Charger la langue préférée au chargement de la page
    function initLanguage() {
        const savedLang = localStorage.getItem('preferredLanguage') || 'fr';
        
        // Trouver l'option correspondante et simuler un clic
        const selectedOption = document.querySelector(`.language-option[data-lang="${savedLang}"]`);
        if (selectedOption) {
            currentLanguageText.textContent = selectedOption.textContent;
            loadTranslations(savedLang);
        }
    }
    
    // Cette fonction devra être implémentée pour charger les traductions
    function loadTranslations(lang) {
        console.log(`Loading translations for: ${lang}`);
        // Pour l'instant, c'est juste un placeholder
        // Dans une version future, cela chargerait les traductions depuis un fichier JSON
        // et mettrait à jour tous les textes de la page
        
        // Exemple d'utilisation:
        // fetch(`/assets/translations/${lang}.json`)
        //     .then(response => response.json())
        //     .then(translations => {
        //         document.querySelectorAll('[data-i18n]').forEach(element => {
        //             const key = element.getAttribute('data-i18n');
        //             if (translations[key]) {
        //                 element.textContent = translations[key];
        //             }
        //         });
        //     });
    }
    
    // Initialiser la langue au chargement
    initLanguage();
}); 