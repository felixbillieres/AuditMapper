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

console.log("====== DÉBUT DE L'INITIALISATION ======");

// Test de base pour vérifier que les événements fonctionnent
document.addEventListener('click', function() {
    console.log("Document clicked - événements de base OK");
});

// Récupération et vérification explicite des éléments
const assumedBreachCheckbox = document.getElementById('assumedBreach');
console.log("Élément assumedBreachCheckbox trouvé:", !!assumedBreachCheckbox);

const breachCredentials = document.getElementById('breachCredentials');
console.log("Élément breachCredentials trouvé:", !!breachCredentials);

const exegolModeCheckbox = document.getElementById('exegolMode');
console.log("Élément exegolModeCheckbox trouvé:", !!exegolModeCheckbox);

const exegolOutput = document.getElementById('exegolOutput');
console.log("Élément exegolOutput trouvé:", !!exegolOutput);

// Réimplémentation directe des gestionnaires d'événements
if (assumedBreachCheckbox) {
    console.log("Attachement de l'événement change à assumedBreachCheckbox");
    
    // Test d'événement direct avec inline function
    assumedBreachCheckbox.onclick = function() {
        console.log("CLICK sur assumedBreach détecté!");
    };
    
    // Utiliser addEventListener pour change
    assumedBreachCheckbox.addEventListener('change', function(event) {
        console.log("CHANGE sur assumedBreach détecté! Nouvelle valeur:", this.checked);
        
        if (breachCredentials) {
            breachCredentials.style.display = this.checked ? 'block' : 'none';
            console.log("breachCredentials display set to:", breachCredentials.style.display);
        } else {
            console.error("breachCredentials n'est pas trouvé!");
        }
    });
}

if (exegolModeCheckbox) {
    console.log("Attachement de l'événement change à exegolModeCheckbox");
    
    exegolModeCheckbox.onclick = function() {
        console.log("CLICK sur exegolMode détecté!");
    };
    
    exegolModeCheckbox.addEventListener('change', function(event) {
        console.log("CHANGE sur exegolMode détecté! Nouvelle valeur:", this.checked);
        
        // Mise à jour simplifiée pour déboguer
        if (exegolOutput) {
            exegolOutput.style.display = (this.checked && assumedBreachCheckbox && assumedBreachCheckbox.checked) ? 'block' : 'none';
            console.log("exegolOutput display set to:", exegolOutput.style.display);
        } else {
            console.error("exegolOutput n'est pas trouvé!");
        }
    });
}

console.log("====== FIN DE L'INITIALISATION ======");

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
    
    // Éléments pour Assumed Breach et Exegol Mode
    const oneLinerElement = document.getElementById('oneLiner');
    const copyOneLinerBtn = document.getElementById('copyOneLiner');
    
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
    
    // Mise à jour du one-liner quand les champs changent
    const usernameInput = document.getElementById('breachUsername');
    const passwordInput = document.getElementById('breachPassword');
    const domainInput = document.getElementById('breachDomain');

    if (usernameInput) usernameInput.addEventListener('input', updateExegolOutput);
    if (passwordInput) passwordInput.addEventListener('input', updateExegolOutput);
    if (domainInput) domainInput.addEventListener('input', updateExegolOutput);

    // Fonction pour afficher/masquer le mot de passe
    const togglePasswordBtn = document.getElementById('togglePassword');
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePasswordBtn.textContent = type === 'password' ? '👁️' : '🔒';
        });
    }

    // Fonction pour générer et afficher le one-liner Exegol
    function updateExegolOutput() {
        if (!assumedBreachCheckbox || !exegolModeCheckbox || !exegolOutput || !oneLinerElement) return;
        
        const isAssumedBreach = assumedBreachCheckbox.checked;
        const isExegolMode = exegolModeCheckbox.checked;
        
        if (isAssumedBreach && isExegolMode) {
            const username = usernameInput ? usernameInput.value.trim() : '';
            const password = passwordInput ? passwordInput.value.trim() : '';
            const domain = domainInput ? domainInput.value.trim() : '';
            
            if (username && password) {
                // Générer le one-liner
                let oneLinerText = `export USER="${username}" PASSWORD="${password}"`;
                
                if (domain) {
                    oneLinerText += ` DOMAIN="${domain}"`;
                }
                
                // Ajouter des variables supplémentaires utiles pour Exegol
                const ipAddress = ipAddressInput ? ipAddressInput.value.trim() : '';
                if (ipAddress) {
                    oneLinerText += ` IP="${ipAddress}"`;
                }
                
                // Afficher le one-liner
                oneLinerElement.textContent = oneLinerText;
                exegolOutput.style.display = 'block';
            } else {
                exegolOutput.style.display = 'none';
            }
        } else {
            exegolOutput.style.display = 'none';
        }
    }

    // Copier le one-liner dans le presse-papier
    if (copyOneLinerBtn) {
        copyOneLinerBtn.addEventListener('click', function() {
            const oneLinerText = oneLinerElement.textContent;
            
            navigator.clipboard.writeText(oneLinerText)
                .then(() => {
                    alert('One-liner copié dans le presse-papier !');
                })
                .catch(err => {
                    console.error('Erreur lors de la copie:', err);
                    // Alternative pour les navigateurs qui ne supportent pas clipboard API
                    const textarea = document.createElement('textarea');
                    textarea.value = oneLinerText;
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                    alert('One-liner copié dans le presse-papier !');
                });
        });
    }
    
    console.log("Initialisation terminée");

    // Ajouter ceci à la fin de votre fonction DOMContentLoaded
    console.log("État des éléments au chargement:");
    console.log("- assumedBreachCheckbox:", assumedBreachCheckbox);
    console.log("- breachCredentials:", breachCredentials);
    console.log("- exegolModeCheckbox:", exegolModeCheckbox);
    console.log("- exegolOutput:", exegolOutput);

    // Test forcé de l'affichage (temporaire pour débugger)
    if (breachCredentials) {
        console.log("Test: forcer l'affichage des credentials");
        breachCredentials.style.display = 'block';
        setTimeout(() => {
            console.log("Test: revenir à l'état normal");
            breachCredentials.style.display = assumedBreachCheckbox && assumedBreachCheckbox.checked ? 'block' : 'none';
        }, 3000);
    }
});

// Ajouter cette fonction pour agréger les credentials
function aggregateCredentials() {
    const hostData = hostManager.getData();
    const allCredentials = [];
    
    // Parcourir toutes les catégories et tous les hôtes
    for (const categoryName in hostData.categories) {
        const category = hostData.categories[categoryName];
        if (category.hosts) {
            for (const hostId in category.hosts) {
                const host = category.hosts[hostId];
                if (host.credentials && host.credentials.length > 0) {
                    host.credentials.forEach(cred => {
                        allCredentials.push({
                            ...cred,
                            hostId: hostId,
                            category: categoryName
                        });
                    });
                }
            }
        }
    }
    
    return allCredentials;
}

// Modifier la fonction updateAggregatedData existante
function updateAggregatedData() {
    const hostData = hostManager.getData();
    const aggregatedDataDiv = document.getElementById('aggregatedData');
    
    if (!aggregatedDataDiv) return;

    let totalHosts = 0;
    let compromisedHosts = 0;
    const allTags = new Set();
    const allCredentials = aggregateCredentials();

    // Compter les hôtes et tags
    for (const categoryName in hostData.categories) {
        const category = hostData.categories[categoryName];
        if (category.hosts) {
            for (const hostId in category.hosts) {
                totalHosts++;
                const host = category.hosts[hostId];
                
                if (host.compromiseLevel && host.compromiseLevel !== 'None') {
                    compromisedHosts++;
                }
                
                if (host.tags) {
                    host.tags.forEach(tag => allTags.add(tag));
                }
            }
        }
    }

    // Créer le contenu agrégé avec les credentials
    let credentialsHtml = '';
    if (allCredentials.length > 0) {
        // Grouper par type
        const credsByType = {};
        allCredentials.forEach(cred => {
            if (!credsByType[cred.type]) {
                credsByType[cred.type] = [];
            }
            credsByType[cred.type].push(cred);
        });

        credentialsHtml = `
            <div class="mb-3">
                <h6><i class="fas fa-key"></i> Identifiants trouvés (${allCredentials.length})</h6>
                <div class="credentials-aggregate">
        `;

        for (const [type, creds] of Object.entries(credsByType)) {
            credentialsHtml += `
                <div class="credential-type-group mb-2">
                    <strong class="text-primary">${type.toUpperCase()}:</strong>
                    <div class="ml-3">
            `;
            
            creds.forEach(cred => {
                const credText = `${cred.username}${cred.password ? ':' + cred.password : ''} (${cred.hostId})`;
                credentialsHtml += `
                    <div class="credential-item-aggregate" onclick="copyToClipboard('${credText.replace(/'/g, "\\'")}')">
                        <code>${cred.username}${cred.password ? ':••••••••' : ''}</code>
                        <small class="text-muted ml-2">@ ${cred.hostId}</small>
                        <i class="fas fa-copy ml-1" title="Cliquer pour copier"></i>
                    </div>
                `;
            });
            
            credentialsHtml += `
                    </div>
                </div>
            `;
        }

        credentialsHtml += `
                </div>
            </div>
        `;
    }

    aggregatedDataDiv.innerHTML = `
        <h5>📊 Données Agrégées (Cliquer pour copier)</h5>
        
        <div class="mb-3">
            <h6><i class="fas fa-server"></i> Statistiques</h6>
            <div onclick="copyToClipboard('Total: ${totalHosts} hôtes, Compromis: ${compromisedHosts}')" class="clickable-data">
                <strong>Total:</strong> ${totalHosts} hôtes | <strong>Compromis:</strong> ${compromisedHosts}
                <i class="fas fa-copy ml-1"></i>
            </div>
        </div>

        ${credentialsHtml}

        <div class="mb-3">
            <h6><i class="fas fa-tags"></i> Tags utilisés (${allTags.size})</h6>
            <div onclick="copyToClipboard('${Array.from(allTags).join(', ')}')" class="clickable-data">
                ${Array.from(allTags).map(tag => `<span class="badge badge-secondary mr-1">${tag}</span>`).join('')}
                <i class="fas fa-copy ml-1"></i>
            </div>
        </div>
    `;
}

// Fonction pour copier dans le presse-papiers
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Afficher une notification temporaire
        showNotification('Copié dans le presse-papiers !', 'success');
    }).catch(() => {
        // Fallback pour les navigateurs plus anciens
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Copié dans le presse-papiers !', 'success');
    });
}

// Fonction pour afficher des notifications
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} notification-toast`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 250px;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 2000);
} 