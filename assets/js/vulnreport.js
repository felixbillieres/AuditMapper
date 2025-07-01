document.addEventListener('DOMContentLoaded', function() {
    // Éléments DOM - Onglets principaux
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Éléments DOM - Vulnérabilité unique
    const vulnTitleInput = document.getElementById('vulnTitle');
    const vulnSeveritySelect = document.getElementById('vulnSeverity');
    const vulnCVSSInput = document.getElementById('vulnCVSS');
    const customDescriptionInput = document.getElementById('customDescription');
    const generateVulnButton = document.getElementById('generateVuln');
    const clearFormButton = document.getElementById('clearForm');
    const vulnOutputSection = document.getElementById('vulnOutput');
    const copyVulnButton = document.getElementById('copyVuln');
    const downloadVulnButton = document.getElementById('downloadVuln');
    const vulnMarkdownContent = document.getElementById('vulnMarkdown');
    const vulnWordContent = document.getElementById('vulnWord');
    const vulnHtmlContent = document.getElementById('vulnHtml');
    
    // Éléments DOM - Captures d'écran
    const screenshotDropzone = document.getElementById('screenshotDropzone');
    const screenshotInput = document.getElementById('screenshotInput');
    const browseScreenshotsButton = document.getElementById('browseScreenshots');
    const screenshotPreview = document.getElementById('screenshotPreview');
    
    // Éléments DOM - Tableau de vulnérabilités
    const criticalCountInput = document.getElementById('criticalCount');
    const highCountInput = document.getElementById('highCount');
    const mediumCountInput = document.getElementById('mediumCount');
    const lowCountInput = document.getElementById('lowCount');
    const infoCountInput = document.getElementById('infoCount');
    const generateTableButton = document.getElementById('generateTable');
    const tableOutputSection = document.getElementById('tableOutput');
    const copyTableButton = document.getElementById('copyTable');
    const downloadTableButton = document.getElementById('downloadTable');
    const tableMarkdownContent = document.getElementById('tableMarkdown');
    const tableWordContent = document.getElementById('tableWord');
    const tableHtmlContent = document.getElementById('tableHtml');
    
    // Éléments DOM - Templates
    const templateItems = document.querySelectorAll('.template-item');
    const templateButtons = document.querySelectorAll('.template-item-btn');
    
    // Éléments DOM - Onglets de sortie
    const outputTabs = document.querySelectorAll('.output-tab');
    
    // Configuration des onglets principaux
    if (navTabs.length > 0 && tabContents.length > 0) {
        navTabs.forEach(button => {
            button.addEventListener('click', function() {
                // Désactiver tous les onglets
                navTabs.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Activer l'onglet cliqué
                this.classList.add('active');
                const tabId = this.getAttribute('data-tab');
                const targetTab = document.getElementById(tabId);
                if (targetTab) {
                    targetTab.classList.add('active');
                }
            });
        });
        
        // Activer le premier onglet par défaut
        if (navTabs.length > 0) {
            navTabs[0].classList.add('active');
            const firstTabId = navTabs[0].getAttribute('data-tab');
            const firstTabContent = document.getElementById(firstTabId);
            if (firstTabContent) {
                firstTabContent.classList.add('active');
            }
        }
    }
    
    // Configuration des onglets de sortie
    if (outputTabs.length > 0) {
        outputTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const parentSection = this.closest('.output-content');
                if (!parentSection) return;
                
                const outputTabs = parentSection.querySelectorAll('.output-tab');
                const outputAreas = parentSection.querySelectorAll('.output-content-area');
                
                // Désactiver tous les onglets et contenus
                outputTabs.forEach(t => t.classList.remove('active'));
                outputAreas.forEach(c => c.classList.remove('active'));
                
                // Activer l'onglet cliqué
                this.classList.add('active');
                const format = this.getAttribute('data-format');
                const targetArea = parentSection.querySelector(`.${format}-format`);
                if (targetArea) {
                    targetArea.classList.add('active');
                }
            });
        });
        
        // Activer le premier onglet de sortie par défaut dans chaque section
        document.querySelectorAll('.output-content').forEach(section => {
            const firstOutputTab = section.querySelector('.output-tab');
            const firstOutputArea = section.querySelector('.output-content-area');
            if (firstOutputTab && firstOutputArea) {
                firstOutputTab.classList.add('active');
                firstOutputArea.classList.add('active');
            }
        });
    }
    
    // Gestion des templates
    console.log('Nombre de boutons de templates trouvés:', templateButtons.length);
    if (templateButtons.length > 0) {
        templateButtons.forEach((button, index) => {
            console.log(`Attachement de l'événement au bouton ${index + 1}`);
            button.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Clic sur le bouton template détecté');
                const templateItem = this.closest('.template-item');
                const templateName = templateItem.getAttribute('data-template');
                console.log('Nom du template:', templateName);
                loadTemplate(templateName);
            });
        });
    } else {
        console.log('Aucun bouton de template trouvé');
    }
    
    // Gestion des captures d'écran
    let screenshots = [];
    
    if (browseScreenshotsButton && screenshotInput) {
        browseScreenshotsButton.addEventListener('click', function() {
            screenshotInput.click();
        });
        
        screenshotInput.addEventListener('change', handleScreenshots);
    }
    
    // Configuration du drag and drop
    if (screenshotDropzone) {
        screenshotDropzone.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('dragover');
        });
        
        screenshotDropzone.addEventListener('dragleave', function() {
            this.classList.remove('dragover');
        });
        
        screenshotDropzone.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
            
            if (e.dataTransfer.files.length > 0) {
                handleFiles(e.dataTransfer.files);
            } else if (e.dataTransfer.items) {
                // Gestion du copier-coller d'images
                Array.from(e.dataTransfer.items).forEach(item => {
                    if (item.type.indexOf('image') !== -1) {
                        const file = item.getAsFile();
                        processScreenshot(file);
                    }
                });
            }
        });
    }
    
    // Également permettre le copier-coller dans le document
    document.addEventListener('paste', function(e) {
        const items = e.clipboardData.items;
        
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                processScreenshot(file);
                break;
            }
        }
    });
    
    function handleScreenshots(e) {
        handleFiles(this.files);
    }
    
    function handleFiles(files) {
        Array.from(files).forEach(file => {
            if (file.type.match('image.*')) {
                processScreenshot(file);
            }
        });
    }
    
    function processScreenshot(file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            
            const screenshotData = {
                file: file,
                dataUrl: e.target.result,
                filename: file.name
            };
            
            screenshots.push(screenshotData);
            updateScreenshotPreview();
        };
        
        reader.readAsDataURL(file);
    }
    
    function updateScreenshotPreview() {
        if (!screenshotPreview) return;
        
        screenshotPreview.innerHTML = '';
        
        screenshots.forEach((screenshot, index) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            
            const img = document.createElement('img');
            img.src = screenshot.dataUrl;
            img.className = 'preview-image';
            
            const removeButton = document.createElement('button');
            removeButton.className = 'remove-button';
            removeButton.innerHTML = '&times;';
            removeButton.addEventListener('click', function() {
                screenshots.splice(index, 1);
                updateScreenshotPreview();
            });
            
            previewItem.appendChild(img);
            previewItem.appendChild(removeButton);
            screenshotPreview.appendChild(previewItem);
        });
    }
    
    // Gestion de la vulnérabilité unique
    if (generateVulnButton) {
        generateVulnButton.addEventListener('click', function() {
            const title = vulnTitleInput ? vulnTitleInput.value : '';
            const severity = vulnSeveritySelect ? vulnSeveritySelect.value : 'medium';
            const cvss = vulnCVSSInput ? vulnCVSSInput.value : '';
            const description = customDescriptionInput ? customDescriptionInput.value : '';
            
            if (!title.trim()) {
                alert('Veuillez saisir un titre pour la vulnérabilité');
                return;
            }
            
            // Générer les différents formats
            const markdown = generateVulnerabilityMarkdown(title, severity, cvss, description);
            const word = generateVulnerabilityWord(title, severity, cvss, description);
            const html = generateVulnerabilityHtml(title, severity, cvss, description);
            
            // Afficher les résultats
            if (vulnMarkdownContent) vulnMarkdownContent.textContent = markdown;
            if (vulnWordContent) vulnWordContent.textContent = word;
            if (vulnHtmlContent) vulnHtmlContent.innerHTML = html;
            
            // Afficher la section de sortie
            if (vulnOutputSection) {
                vulnOutputSection.style.display = 'block';
                vulnOutputSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    
    if (clearFormButton) {
        clearFormButton.addEventListener('click', function() {
            if (vulnTitleInput) vulnTitleInput.value = '';
            if (vulnSeveritySelect) vulnSeveritySelect.value = 'medium';
            if (vulnCVSSInput) vulnCVSSInput.value = '';
            if (customDescriptionInput) customDescriptionInput.value = '';
            screenshots = [];
            updateScreenshotPreview();
            
            if (vulnOutputSection) vulnOutputSection.style.display = 'none';
        });
    }
    
    if (copyVulnButton) {
        copyVulnButton.addEventListener('click', function() {
            const activeTab = vulnOutputSection.querySelector('.output-tab.active');
            if (activeTab) {
                const format = activeTab.getAttribute('data-format');
                const content = vulnOutputSection.querySelector(`.${format}-format`);
                if (content) {
                    copyToClipboard(content.textContent || content.innerHTML);
                    showCopySuccess(this);
                }
            }
        });
    }
    
    if (downloadVulnButton) {
        downloadVulnButton.addEventListener('click', function() {
            const activeTab = vulnOutputSection.querySelector('.output-tab.active');
            if (activeTab) {
                const format = activeTab.getAttribute('data-format');
                const content = vulnOutputSection.querySelector(`.${format}-format`);
                if (content) {
                    const filename = `vulnerabilite_${Date.now()}.${format === 'markdown' ? 'md' : format === 'word' ? 'docx' : 'html'}`;
                    downloadText(content.textContent || content.innerHTML, filename);
                }
            }
        });
    }
    
    // Gestion du tableau de vulnérabilités
    if (generateTableButton) {
        generateTableButton.addEventListener('click', function() {
            const critical = criticalCountInput ? parseInt(criticalCountInput.value) || 0 : 0;
            const high = highCountInput ? parseInt(highCountInput.value) || 0 : 0;
            const medium = mediumCountInput ? parseInt(mediumCountInput.value) || 0 : 0;
            const low = lowCountInput ? parseInt(lowCountInput.value) || 0 : 0;
            const info = infoCountInput ? parseInt(infoCountInput.value) || 0 : 0;
            
            // Générer les différents formats
            const markdown = generateVulnerabilityTable(critical, high, medium, low, info);
            const word = generateWordTable(critical, high, medium, low, info);
            const html = generateHtmlTable(critical, high, medium, low, info);
            
            // Afficher les résultats
            if (tableMarkdownContent) tableMarkdownContent.textContent = markdown;
            if (tableWordContent) tableWordContent.textContent = word;
            if (tableHtmlContent) tableHtmlContent.innerHTML = html;
            
            // Afficher la section de sortie
            if (tableOutputSection) {
                tableOutputSection.style.display = 'block';
                tableOutputSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    
    if (copyTableButton) {
        copyTableButton.addEventListener('click', function() {
            const activeTab = tableOutputSection.querySelector('.output-tab.active');
            if (activeTab) {
                const format = activeTab.getAttribute('data-format');
                const content = tableOutputSection.querySelector(`.${format}-format`);
                if (content) {
                    copyToClipboard(content.textContent || content.innerHTML);
                    showCopySuccess(this);
                }
            }
        });
    }
    
    if (downloadTableButton) {
        downloadTableButton.addEventListener('click', function() {
            const activeTab = tableOutputSection.querySelector('.output-tab.active');
            if (activeTab) {
                const format = activeTab.getAttribute('data-format');
                const content = tableOutputSection.querySelector(`.${format}-format`);
                if (content) {
                    const filename = `tableau_vulnerabilites_${Date.now()}.${format === 'markdown' ? 'md' : format === 'word' ? 'docx' : 'html'}`;
                    downloadText(content.textContent || content.innerHTML, filename);
                }
            }
        });
    }
    
    // Fonctions de génération de contenu
    function generateVulnerabilityMarkdown(title, severity, cvss, description) {
        const severityText = getSeverityText(severity);
        const severityColor = getSeverityColor(severity);
        
        let markdown = `# ${title}\n\n`;
        markdown += `**Sévérité:** ${severityText}\n`;
        if (cvss) markdown += `**CVSS:** ${cvss}\n`;
        markdown += `**Date de découverte:** ${new Date().toLocaleDateString('fr-FR')}\n\n`;
        
        markdown += `## Description\n\n`;
        markdown += description || getLoremIpsum(severity);
        markdown += `\n\n## Impact\n\n`;
        markdown += getImpactText(severity);
        markdown += `\n\n## Recommandations\n\n`;
        markdown += getRecommendationsText(severity);
        
        if (screenshots.length > 0) {
            markdown += `\n\n## Captures d'écran\n\n`;
            screenshots.forEach((screenshot, index) => {
                markdown += `![Capture ${index + 1}](${screenshot.filename})\n\n`;
            });
        }
        
        return markdown;
    }
    
    function generateVulnerabilityWord(title, severity, cvss, description) {
        const severityText = getSeverityText(severity);
        
        let word = `Titre: ${title}\n`;
        word += `Sévérité: ${severityText}\n`;
        if (cvss) word += `CVSS: ${cvss}\n`;
        word += `Date de découverte: ${new Date().toLocaleDateString('fr-FR')}\n\n`;
        
        word += `Description:\n`;
        word += description || getLoremIpsum(severity);
        word += `\n\nImpact:\n`;
        word += getImpactText(severity);
        word += `\n\nRecommandations:\n`;
        word += getRecommendationsText(severity);
        
        if (screenshots.length > 0) {
            word += `\n\nCaptures d'écran:\n`;
            screenshots.forEach((screenshot, index) => {
                word += `[Capture ${index + 1}] ${screenshot.filename}\n`;
            });
        }
        
        return word;
    }
    
    function generateVulnerabilityHtml(title, severity, cvss, description) {
        const severityText = getSeverityText(severity);
        const severityColor = getSeverityColor(severity);
        
        let html = `<h1>${title}</h1>`;
        html += `<p><strong>Sévérité:</strong> <span style="color: ${severityColor};">${severityText}</span></p>`;
        if (cvss) html += `<p><strong>CVSS:</strong> ${cvss}</p>`;
        html += `<p><strong>Date de découverte:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>`;
        
        html += `<h2>Description</h2>`;
        html += `<p>${description || getLoremIpsum(severity)}</p>`;
        
        html += `<h2>Impact</h2>`;
        html += `<p>${getImpactText(severity)}</p>`;
        
        html += `<h2>Recommandations</h2>`;
        html += `<p>${getRecommendationsText(severity)}</p>`;
        
        if (screenshots.length > 0) {
            html += `<h2>Captures d'écran</h2>`;
            screenshots.forEach((screenshot, index) => {
                html += `<div style="margin: 1rem 0;">`;
                html += `<img src="${screenshot.dataUrl}" alt="Capture ${index + 1}" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 8px;">`;
                html += `<p style="margin-top: 0.5rem; font-size: 0.9rem; color: #666;">${screenshot.filename}</p>`;
                html += `</div>`;
            });
        }
        
        return html;
    }
    
    function generateVulnerabilityTable(critical, high, medium, low, info) {
        const total = critical + high + medium + low + info;
        
        let markdown = `# Tableau Récapitulatif des Vulnérabilités\n\n`;
        markdown += `**Date du rapport:** ${new Date().toLocaleDateString('fr-FR')}\n\n`;
        
        if (total === 0) {
            markdown += `**Aucune vulnérabilité détectée**\n\n`;
            markdown += `**Total des vulnérabilités:** 0\n\n`;
            markdown += `**Score de risque global:** 0.00/4\n\n`;
            return markdown;
        }
        
        markdown += `| Sévérité | Nombre | Pourcentage |\n`;
        markdown += `|----------|--------|-------------|\n`;
        
        if (critical > 0) markdown += `| 🔴 Critique | ${critical} | ${((critical / total) * 100).toFixed(1)}% |\n`;
        if (high > 0) markdown += `| 🟠 Élevée | ${high} | ${((high / total) * 100).toFixed(1)}% |\n`;
        if (medium > 0) markdown += `| 🟡 Moyenne | ${medium} | ${((medium / total) * 100).toFixed(1)}% |\n`;
        if (low > 0) markdown += `| 🟢 Faible | ${low} | ${((low / total) * 100).toFixed(1)}% |\n`;
        if (info > 0) markdown += `| 🔵 Information | ${info} | ${((info / total) * 100).toFixed(1)}% |\n`;
        
        markdown += `\n**Total des vulnérabilités:** ${total}\n\n`;
        
        // Calcul du score de risque global
        const riskScore = (critical * 4 + high * 3 + medium * 2 + low * 1) / total;
        markdown += `**Score de risque global:** ${riskScore.toFixed(2)}/4\n\n`;
        
        return markdown;
    }
    
    function generateWordTable(critical, high, medium, low, info) {
        const total = critical + high + medium + low + info;
        
        let word = `Tableau Récapitulatif des Vulnérabilités\n`;
        word += `Date du rapport: ${new Date().toLocaleDateString('fr-FR')}\n\n`;
        
        if (total === 0) {
            word += `Aucune vulnérabilité détectée\n\n`;
            word += `Total des vulnérabilités: 0\n`;
            word += `Score de risque global: 0.00/4\n`;
            return word;
        }
        
        word += `Sévérité\tNombre\tPourcentage\n`;
        word += `--------\t------\t-----------\n`;
        
        if (critical > 0) word += `Critique\t${critical}\t${((critical / total) * 100).toFixed(1)}%\n`;
        if (high > 0) word += `Élevée\t${high}\t${((high / total) * 100).toFixed(1)}%\n`;
        if (medium > 0) word += `Moyenne\t${medium}\t${((medium / total) * 100).toFixed(1)}%\n`;
        if (low > 0) word += `Faible\t${low}\t${((low / total) * 100).toFixed(1)}%\n`;
        if (info > 0) word += `Information\t${info}\t${((info / total) * 100).toFixed(1)}%\n`;
        
        word += `\nTotal des vulnérabilités: ${total}\n`;
        
        const riskScore = (critical * 4 + high * 3 + medium * 2 + low * 1) / total;
        word += `Score de risque global: ${riskScore.toFixed(2)}/4\n`;
        
        return word;
    }
    
    function generateHtmlTable(critical, high, medium, low, info) {
        const total = critical + high + medium + low + info;
        
        let html = `<h1>Tableau Récapitulatif des Vulnérabilités</h1>`;
        html += `<p><strong>Date du rapport:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>`;
        
        if (total === 0) {
            html += `<p><strong>Aucune vulnérabilité détectée</strong></p>`;
            html += `<p><strong>Total des vulnérabilités:</strong> 0</p>`;
            html += `<p><strong>Score de risque global:</strong> 0.00/4</p>`;
            return html;
        }
        
        html += `<table border="1" style="border-collapse: collapse; width: 100%;">`;
        html += `<tr><th>Sévérité</th><th>Nombre</th><th>Pourcentage</th></tr>`;
        
        if (critical > 0) html += `<tr><td style="color: #dc3545;">🔴 Critique</td><td>${critical}</td><td>${((critical / total) * 100).toFixed(1)}%</td></tr>`;
        if (high > 0) html += `<tr><td style="color: #fd7e14;">🟠 Élevée</td><td>${high}</td><td>${((high / total) * 100).toFixed(1)}%</td></tr>`;
        if (medium > 0) html += `<tr><td style="color: #ffc107;">🟡 Moyenne</td><td>${medium}</td><td>${((medium / total) * 100).toFixed(1)}%</td></tr>`;
        if (low > 0) html += `<tr><td style="color: #28a745;">🟢 Faible</td><td>${low}</td><td>${((low / total) * 100).toFixed(1)}%</td></tr>`;
        if (info > 0) html += `<tr><td style="color: #17a2b8;">🔵 Information</td><td>${info}</td><td>${((info / total) * 100).toFixed(1)}%</td></tr>`;
        
        html += `</table>`;
        
        html += `<p><strong>Total des vulnérabilités:</strong> ${total}</p>`;
        
        const riskScore = (critical * 4 + high * 3 + medium * 2 + low * 1) / total;
        html += `<p><strong>Score de risque global:</strong> ${riskScore.toFixed(2)}/4</p>`;
        
        return html;
    }
    
    function loadTemplate(templateName) {
        console.log('Fonction loadTemplate appelée avec:', templateName);
        const templates = {
            'SQL Injection': {
                title: 'Injection SQL',
                severity: 'high',
                cvss: '8.5',
                description: 'Vulnérabilité d\'injection SQL permettant l\'exécution de requêtes malveillantes sur la base de données.'
            },
            'XSS Reflected': {
                title: 'Cross-Site Scripting (XSS) Reflected',
                severity: 'medium',
                cvss: '6.1',
                description: 'Vulnérabilité XSS permettant l\'injection de code JavaScript malveillant dans les pages web.'
            },
            'Weak Password Policy': {
                title: 'Politique de mots de passe faible',
                severity: 'medium',
                cvss: '5.3',
                description: 'La politique de mots de passe ne respecte pas les bonnes pratiques de sécurité.'
            },
            'Missing Security Headers': {
                title: 'En-têtes de sécurité manquants',
                severity: 'low',
                cvss: '3.1',
                description: 'Absence d\'en-têtes de sécurité HTTP essentiels pour la protection de l\'application.'
            },
            'Directory Traversal': {
                title: 'Directory Traversal',
                severity: 'high',
                cvss: '7.5',
                description: 'Vulnérabilité permettant d\'accéder à des fichiers en dehors du répertoire web autorisé.'
            },
            'CSRF': {
                title: 'Cross-Site Request Forgery (CSRF)',
                severity: 'medium',
                cvss: '6.5',
                description: 'Vulnérabilité permettant d\'exécuter des actions non autorisées au nom de l\'utilisateur authentifié.'
            }
        };
        
        console.log('Templates disponibles:', Object.keys(templates));
        const template = templates[templateName];
        if (template) {
            console.log('Template trouvé:', template);
            if (vulnTitleInput) vulnTitleInput.value = template.title;
            if (vulnSeveritySelect) vulnSeveritySelect.value = template.severity;
            if (vulnCVSSInput) vulnCVSSInput.value = template.cvss;
            if (customDescriptionInput) customDescriptionInput.value = template.description;
            
            // Basculer vers l'onglet vulnérabilité unique
            const vulnTab = document.querySelector('.nav-tab[data-tab="vulnTab"]');
            if (vulnTab) {
                navTabs.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                vulnTab.classList.add('active');
                const vulnTabContent = document.getElementById('vulnTab');
                if (vulnTabContent) {
                    vulnTabContent.classList.add('active');
                }
            }
            
            // Afficher un message de confirmation
            console.log(`Template "${templateName}" chargé avec succès`);
        } else {
            console.log(`Template "${templateName}" non trouvé`);
        }
    }
    
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(function() {
            console.log('Texte copié dans le presse-papiers');
        }).catch(function(err) {
            console.error('Erreur lors de la copie: ', err);
            // Fallback pour les navigateurs plus anciens
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        });
    }
    
    function showCopySuccess(button) {
        const originalText = button.textContent;
        button.textContent = '✅ Copié !';
        button.style.backgroundColor = '#28a745';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.backgroundColor = '';
        }, 2000);
    }
    
    function downloadText(text, filename) {
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    function getSeverityText(severity) {
        const severityMap = {
            'critical': '🔴 Critique',
            'high': '🟠 Élevée',
            'medium': '🟡 Moyenne',
            'low': '🟢 Faible',
            'info': '🔵 Information'
        };
        return severityMap[severity] || '🟡 Moyenne';
    }
    
    function getSeverityColor(severity) {
        const colorMap = {
            'critical': '#dc3545',
            'high': '#fd7e14',
            'medium': '#ffc107',
            'low': '#28a745',
            'info': '#17a2b8'
        };
        return colorMap[severity] || '#ffc107';
    }
    
    function getLoremIpsum(severity) {
        const descriptions = {
            'critical': 'Cette vulnérabilité critique représente un risque majeur pour la sécurité du système. Elle peut permettre un accès non autorisé complet ou une compromission totale des données.',
            'high': 'Cette vulnérabilité élevée présente un risque significatif pour la sécurité. Elle peut permettre un accès partiel non autorisé ou une compromission de données sensibles.',
            'medium': 'Cette vulnérabilité moyenne présente un risque modéré pour la sécurité. Elle peut permettre un accès limité non autorisé ou une fuite d\'informations.',
            'low': 'Cette vulnérabilité faible présente un risque limité pour la sécurité. Elle peut permettre une collecte d\'informations ou un accès très restreint.',
            'info': 'Cette vulnérabilité d\'information ne présente pas de risque direct mais peut révéler des informations utiles pour d\'autres attaques.'
        };
        return descriptions[severity] || descriptions['medium'];
    }
    
    function getImpactText(severity) {
        const impacts = {
            'critical': 'Impact critique : compromission totale du système, accès administrateur, vol de données sensibles.',
            'high': 'Impact élevé : accès non autorisé, compromission de données, déni de service.',
            'medium': 'Impact modéré : accès limité, fuite d\'informations, élévation de privilèges.',
            'low': 'Impact faible : collecte d\'informations, accès très restreint.',
            'info': 'Impact informationnel : divulgation d\'informations techniques.'
        };
        return impacts[severity] || impacts['medium'];
    }
    
    function getRecommendationsText(severity) {
        const recommendations = {
            'critical': 'Correction immédiate requise. Implémenter des contrôles d\'accès stricts, valider toutes les entrées, utiliser des mécanismes d\'authentification robustes.',
            'high': 'Correction prioritaire. Mettre en place des contrôles de sécurité appropriés, valider les entrées utilisateur, implémenter des logs de sécurité.',
            'medium': 'Correction recommandée. Améliorer la validation des entrées, mettre en place des contrôles d\'accès, surveiller les activités suspectes.',
            'low': 'Correction suggérée. Implémenter des bonnes pratiques de sécurité, améliorer la configuration.',
            'info': 'Amélioration suggérée. Réduire l\'exposition d\'informations techniques, implémenter des bonnes pratiques.'
        };
        return recommendations[severity] || recommendations['medium'];
    }
}); 