// marked est déjà disponible globalement via le CDN

// Configuration de marked pour rendre le code plus joli
marked.setOptions({
  highlight: function(code, lang) {
    return code;
  }
});

// Fonction pour charger un fichier Markdown
async function loadMarkdown(filePath) {
    try {
        console.log(`Chargement du fichier: ${filePath}`);
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Erreur de chargement du fichier: ${filePath}`);
        }
        const text = await response.text();
        return text; // Return raw markdown text
    } catch (error) {
        console.error(`Erreur lors du chargement de ${filePath}:`, error);
        return `Erreur lors du chargement du fichier: ${filePath}`;
    }
}

// Fonction pour générer le template markdown
async function generateTemplate(boxName, ipAddress, serviceCheckboxes) {
    console.log("Génération du template pour:", boxName, ipAddress);
    console.log("Services sélectionnés:", 
        Array.from(serviceCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.dataset.service)
    );
    
    let servicesContent = '';
    for (const checkbox of serviceCheckboxes) {
        if (checkbox.checked) {
            const service = checkbox.dataset.service.toUpperCase();
            console.log(`Chargement du service: ${service}`);
            try {
                const markdownContent = await loadMarkdown(`/exploitationDetails/${service}.md`);
                servicesContent += `${markdownContent}\n\n`;
            } catch (error) {
                console.error(`Erreur avec le service ${service}:`, error);
                servicesContent += `## ${service} Checklist\n**Erreur lors du chargement du contenu**\n\n`;
            }
        }
    }

    const template = `
# Rapport de Pentest pour ${boxName}

## Informations de base
- **Nom de la box**: ${boxName}
- **Adresse IP**: ${ipAddress}
- **Date**: ${new Date().toLocaleDateString()}

## Phases de Pentest

### 1. Reconnaissance
- Scan Nmap initial: \`nmap -sC -sV -oA initial ${ipAddress}\`
- Scan complet: \`nmap -p- --min-rate 10000 -oA full ${ipAddress}\`
- Vérification des versions des services découverts

### 2. Énumération
- Énumération des utilisateurs, groupes, et autres informations pertinentes
- Recherche de vulnérabilités connues pour les services identifiés

### 3. Exploitation
- Tentatives d'exploitation des vulnérabilités découvertes
- Obtention d'un premier accès à la cible

### 4. Post-Exploitation
- Maintien de l'accès
- Élévation de privilèges
- Extraction de données sensibles

### 5. Nettoyage
- Suppression des traces laissées sur la cible
- Documentation des vulnérabilités et méthodes d'exploitation

## Services Détailés

${servicesContent}
    `;
    
    console.log("Template généré avec succès");
    return template;
}

// Fonction pour mettre à jour la prévisualisation
async function updatePreview(boxName, ipAddress, serviceCheckboxes) {
    if (!boxName || !ipAddress) return;
    
    const template = await generateTemplate(boxName, ipAddress, serviceCheckboxes);
    
    // Afficher la section de prévisualisation
    document.getElementById('templatePreviewSection').style.display = 'block';
    
    // Mettre à jour la prévisualisation avec le contenu Markdown formaté
    const markdownPreview = document.getElementById('markdownPreview');
    markdownPreview.innerHTML = marked.parse(template);
    
    // Stocker le template brut pour la copie/téléchargement
    markdownPreview.setAttribute('data-raw-markdown', template);
}

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM chargé, initialisation de l'application");
    
    // Récupération des éléments du DOM
    const boxNameInput = document.getElementById('boxName');
    const ipAddressInput = document.getElementById('ipAddress');
    const generateTemplateBtn = document.getElementById('generateTemplate');
    const updateReportBtn = document.getElementById('updateReport');
    const serviceCheckboxes = document.querySelectorAll('.service-checkbox');
    const copyMarkdownBtn = document.getElementById('copyMarkdown');
    const downloadMarkdownBtn = document.getElementById('downloadMarkdown');
    
    // Événement pour le bouton "Générer le template"
    generateTemplateBtn.addEventListener('click', async function() {
        console.log("Clic sur Générer le template");
        const boxName = boxNameInput.value.trim();
        const ipAddress = ipAddressInput.value.trim();

        if (!boxName || !ipAddress) {
            alert('Veuillez entrer le nom de la box et son adresse IP.');
            return;
        }

        // Afficher la section des services
        document.getElementById('serviceSection').style.display = 'block';
        
        // Mettre à jour la prévisualisation
        await updatePreview(boxName, ipAddress, serviceCheckboxes);
    });

    // Événement pour le bouton "Mettre à jour le rapport"
    updateReportBtn.addEventListener('click', async function() {
        console.log("Clic sur Mettre à jour le rapport");
        const boxName = boxNameInput.value.trim();
        const ipAddress = ipAddressInput.value.trim();

        if (!boxName || !ipAddress) {
            alert('Veuillez entrer le nom de la box et son adresse IP.');
            return;
        }

        // Mettre à jour la prévisualisation
        await updatePreview(boxName, ipAddress, serviceCheckboxes);
    });
    
    // Ajouter des écouteurs d'événements sur les checkboxes pour mise à jour automatique
    serviceCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', async function() {
            console.log(`Service ${this.dataset.service} ${this.checked ? 'coché' : 'décoché'}`);
            const boxName = boxNameInput.value.trim();
            const ipAddress = ipAddressInput.value.trim();
            
            if (boxName && ipAddress) {
                await updatePreview(boxName, ipAddress, serviceCheckboxes);
            }
        });
    });
    
    // Fonction pour copier le Markdown
    if (copyMarkdownBtn) {
        copyMarkdownBtn.addEventListener('click', function() {
            const markdownPreview = document.getElementById('markdownPreview');
            const rawMarkdown = markdownPreview.getAttribute('data-raw-markdown');
            if (rawMarkdown) {
                navigator.clipboard.writeText(rawMarkdown)
                    .then(() => {
                        alert('Markdown copié dans le presse-papier !');
                    })
                    .catch(err => {
                        console.error('Erreur lors de la copie:', err);
                        // Alternative pour les navigateurs qui ne supportent pas clipboard API
                        const textarea = document.createElement('textarea');
                        textarea.value = rawMarkdown;
                        document.body.appendChild(textarea);
                        textarea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textarea);
                        alert('Markdown copié dans le presse-papier !');
                    });
            }
        });
    }

    // Fonction pour télécharger le Markdown
    if (downloadMarkdownBtn) {
        downloadMarkdownBtn.addEventListener('click', function() {
            const markdownPreview = document.getElementById('markdownPreview');
            const rawMarkdown = markdownPreview.getAttribute('data-raw-markdown');
            if (rawMarkdown) {
                const boxName = boxNameInput.value.trim();
                const fileName = `${boxName.replace(/\s+/g, '_')}_pentest_template.md`;
                
                const blob = new Blob([rawMarkdown], { type: 'text/markdown' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        });
    }
    
    // Bouton de test pour vérifier le chargement
    const testButton = document.getElementById('testMarkdown');
    const testOutput = document.getElementById('testOutput');

    if (testButton) {
        testButton.addEventListener('click', async function() {
            console.log("Test de chargement Markdown");
            try {
                const content = await loadMarkdown('/exploitationDetails/SMB.md');
                testOutput.innerHTML = marked.parse(content);
                console.log("Chargement réussi");
            } catch (error) {
                console.error("Erreur de test:", error);
                testOutput.innerHTML = "Erreur: " + error.message;
            }
        });
    }
    
    // Fonction pour copier le Markdown pour Obsidian
    const copyObsidianBtn = document.getElementById('copyObsidian');
    if (copyObsidianBtn) {
        copyObsidianBtn.addEventListener('click', function() {
            const markdownPreview = document.getElementById('markdownPreview');
            const rawMarkdown = markdownPreview.getAttribute('data-raw-markdown');
            if (rawMarkdown) {
                // On pourrait faire des modifications spécifiques à Obsidian ici si nécessaire
                // Par exemple, adapter la syntaxe pour les liens internes d'Obsidian
                const obsidianMarkdown = rawMarkdown;
                
                navigator.clipboard.writeText(obsidianMarkdown)
                    .then(() => {
                        alert('Template copié pour Obsidian !');
                    })
                    .catch(err => {
                        console.error('Erreur lors de la copie:', err);
                        // Alternative pour les navigateurs qui ne supportent pas clipboard API
                        const textarea = document.createElement('textarea');
                        textarea.value = obsidianMarkdown;
                        document.body.appendChild(textarea);
                        textarea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textarea);
                        alert('Template copié pour Obsidian !');
                    });
            }
        });
    }
    
    console.log("Initialisation terminée");
}); 