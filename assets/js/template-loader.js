document.addEventListener('DOMContentLoaded', function() {
    // Charge le template HTML de base
    fetch('/templates/template.html')
        .then(response => response.text())
        .then(template => {
            // Récupère les informations spécifiques à la page
            const pageInfo = window.pageInfo || {};
            const pageTitle = pageInfo.title || document.title;
            const headerTitle = pageInfo.headerTitle || pageTitle;
            
            // Remplace les variables du template par le contenu spécifique
            let processedTemplate = template
                .replace('{{PAGE_TITLE}}', pageTitle)
                .replace('{{HEADER_TITLE}}', headerTitle)
                .replace('{{MAIN_CONTENT}}', document.getElementById('page-content').innerHTML)
                .replace('{{ADDITIONAL_HEAD}}', pageInfo.additionalHead || '')
                .replace('{{ADDITIONAL_SCRIPTS}}', pageInfo.additionalScripts || '');
            
            // Gestion des liens actifs dans la sidebar
            const activePage = pageInfo.activePage || '';
            processedTemplate = processedTemplate
                .replace('{{ACTIVE_GENERATOR}}', activePage === 'generator' ? 'active' : '')
                .replace('{{ACTIVE_TOOLS}}', activePage === 'tools' ? 'active' : '')
                .replace('{{ACTIVE_PRIVESC}}', activePage === 'privesc' ? 'active' : '')
                .replace('{{ACTIVE_HOSTS}}', activePage === 'hostsmaker' ? 'active' : '')
                .replace('{{ACTIVE_GREP}}', activePage === 'grepmaster' ? 'active' : '')
                .replace('{{ACTIVE_VULN}}', activePage === 'vulnreport' ? 'active' : '')
                .replace('{{ACTIVE_GOAT}}', activePage === 'goat' ? 'active' : '');
            
            // Remplace le contenu de la page par le template traité
            document.open();
            document.write(processedTemplate);
            document.close();
        })
        .catch(error => {
            console.error('Erreur lors du chargement du template:', error);
        });
}); 