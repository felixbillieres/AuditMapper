document.addEventListener('DOMContentLoaded', function() {
    // Éléments du DOM
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    const mainHeader = document.getElementById('main-header');
    const mainFooter = document.querySelector('.main-footer');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    
    // Fonctions pour gérer la visibilité de la sidebar
    function showSidebar() {
        sidebar.classList.remove('sidebar-hidden');
        sidebar.classList.add('sidebar-visible');
        mainContent.classList.remove('full-width');
        mainHeader.classList.remove('full-width');
        if (mainFooter) mainFooter.classList.remove('full-width');
    }
    
    function hideSidebar() {
        sidebar.classList.add('sidebar-hidden');
        sidebar.classList.remove('sidebar-visible');
        mainContent.classList.add('full-width');
        mainHeader.classList.add('full-width');
        if (mainFooter) mainFooter.classList.add('full-width');
    }
    
    // Vérifier si la page est en mode mobile
    function isMobile() {
        return window.innerWidth <= 768;
    }
    
    // Initier l'état de la sidebar en fonction de la taille de l'écran
    function initSidebar() {
        if (isMobile()) {
            hideSidebar();
        } else {
            showSidebar();
        }
    }
    
    // Attacher les événements
    sidebarToggle.addEventListener('click', function() {
        if (sidebar.classList.contains('sidebar-hidden')) {
            showSidebar();
        } else {
            hideSidebar();
        }
    });
    
    // Fermer la sidebar lorsqu'on clique sur un lien (en mode mobile)
    const sidebarLinks = document.querySelectorAll('.sidebar-nav-link');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (isMobile()) {
                hideSidebar();
            }
        });
    });
    
    // Gérer le redimensionnement de la fenêtre
    window.addEventListener('resize', initSidebar);
    
    // Initialiser la sidebar au chargement de la page
    initSidebar();
    
    // Marquer le lien actif dans la sidebar
    const currentPath = window.location.pathname;
    sidebarLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
}); 