document.addEventListener('DOMContentLoaded', function() {
    // Éléments DOM - Onglets
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Éléments DOM - Vulnérabilité unique
    const vulnTitleInput = document.getElementById('vulnTitle');
    const vulnSeveritySelect = document.getElementById('vulnSeverity');
    const vulnCVSSInput = document.getElementById('vulnCVSS');
    const customDescriptionInput = document.getElementById('customDescription');
    const generateVulnButton = document.getElementById('generateVuln');
    const vulnOutputSection = document.getElementById('vulnOutput');
    const copyVulnButton = document.getElementById('copyVuln');
    const downloadVulnButton = document.getElementById('downloadVuln');
    const vulnMarkdownContent = document.getElementById('vulnMarkdown');
    const vulnWordContent = document.getElementById('vulnWord');
    
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
    
    // Éléments DOM - Onglets de sortie
    const outputTabs = document.querySelectorAll('.output-tab');
    
    // Configuration des onglets principaux
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Désactiver tous les onglets
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Activer l'onglet cliqué
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Configuration des onglets de sortie
    outputTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const parentSection = this.closest('.form-section');
            const outputTabs = parentSection.querySelectorAll('.output-tab');
            const vulnContents = parentSection.querySelectorAll('.vuln-content');
            
            // Désactiver tous les onglets et contenus
            outputTabs.forEach(t => t.classList.remove('active'));
            vulnContents.forEach(c => c.classList.remove('active'));
            
            // Activer l'onglet cliqué
            this.classList.add('active');
            const format = this.getAttribute('data-format');
            parentSection.querySelector(`.${format}-format`).classList.add('active');
        });
    });
    
    // Gestion des captures d'écran
    let screenshots = [];
    
    browseScreenshotsButton.addEventListener('click', function() {
        screenshotInput.click();
    });
    
    screenshotInput.addEventListener('change', handleScreenshots);
    
    // Configuration du drag and drop
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
    
    // Génération de vulnérabilité unique
    generateVulnButton.addEventListener('click', function() {
        const title = vulnTitleInput.value || 'Vulnérabilité non spécifiée';
        const severity = vulnSeveritySelect.value;
        const cvss = vulnCVSSInput.value;
        const customDescription = customDescriptionInput.value;
        
        // Générer la description en Markdown
        let markdown = `## ${title}\n\n`;
        markdown += `**Criticité:** ${getSeverityText(severity)}\n`;
        
        if (cvss) {
            markdown += `**Score CVSS:** ${cvss}\n`;
        }
        
        markdown += '\n';
        
        // Ajouter la description
        if (customDescription) {
            markdown += `${customDescription}\n\n`;
        } else {
            markdown += getLoremIpsum(severity) + '\n\n';
        }
        
        // Ajouter les captures d'écran
        if (screenshots.length > 0) {
            markdown += '### Preuves\n\n';
            screenshots.forEach((screenshot, index) => {
                markdown += `![Capture d'écran ${index + 1}](${screenshot.dataUrl})\n\n`;
                markdown += `*Figure ${index + 1}: ${screenshot.filename}*\n\n`;
            });
        }
        
        // Afficher le résultat
        vulnMarkdownContent.textContent = markdown;
        
        // Générer la version Word (HTML formaté)
        let wordHtml = `<h2>${title}</h2>`;
        wordHtml += `<p><strong>Criticité:</strong> ${getSeverityText(severity)}</p>`;
        
        if (cvss) {
            wordHtml += `<p><strong>Score CVSS:</strong> ${cvss}</p>`;
        }
        
        if (customDescription) {
            wordHtml += `<p>${customDescription.replace(/\n/g, '<br>')}</p>`;
        } else {
            wordHtml += `<p>${getLoremIpsum(severity).replace(/\n/g, '<br>')}</p>`;
        }
        
        if (screenshots.length > 0) {
            wordHtml += '<h3>Preuves</h3>';
            screenshots.forEach((screenshot, index) => {
                wordHtml += `<div class="screenshot-container">`;
                wordHtml += `<img src="${screenshot.dataUrl}" style="max-width: 100%; height: auto;" />`;
                wordHtml += `<p style="font-style: italic;">Figure ${index + 1}: ${screenshot.filename}</p>`;
                wordHtml += `</div>`;
            });
        }
        
        vulnWordContent.innerHTML = wordHtml;
        vulnOutputSection.style.display = 'block';
    });
    
    // Génération de tableau de vulnérabilités
    generateTableButton.addEventListener('click', function() {
        const criticalCount = parseInt(criticalCountInput.value) || 0;
        const highCount = parseInt(highCountInput.value) || 0;
        const mediumCount = parseInt(mediumCountInput.value) || 0;
        const lowCount = parseInt(lowCountInput.value) || 0;
        const infoCount = parseInt(infoCountInput.value) || 0;
        
        // Générer le tableau Markdown
        let markdown = '# Synthèse des vulnérabilités\n\n';
        markdown += '| ID | Vulnérabilité | Criticité | Score CVSS |\n';
        markdown += '|:---|:-------------|:----------|:-----------:|\n';
        
        let vulnId = 1;
        
        // Ajouter les vulnérabilités critiques
        for (let i = 0; i < criticalCount; i++) {
            markdown += `| VULN-${vulnId} | [Vulnérabilité critique ${i+1}] | Critique | [N/A] |\n`;
            vulnId++;
        }
        
        // Ajouter les vulnérabilités élevées
        for (let i = 0; i < highCount; i++) {
            markdown += `| VULN-${vulnId} | [Vulnérabilité élevée ${i+1}] | Élevée | [N/A] |\n`;
            vulnId++;
        }
        
        // Ajouter les vulnérabilités moyennes
        for (let i = 0; i < mediumCount; i++) {
            markdown += `| VULN-${vulnId} | [Vulnérabilité moyenne ${i+1}] | Moyenne | [N/A] |\n`;
            vulnId++;
        }
        
        // Ajouter les vulnérabilités faibles
        for (let i = 0; i < lowCount; i++) {
            markdown += `| VULN-${vulnId} | [Vulnérabilité faible ${i+1}] | Faible | [N/A] |\n`;
            vulnId++;
        }
        
        // Ajouter les vulnérabilités informatives
        for (let i = 0; i < infoCount; i++) {
            markdown += `| VULN-${vulnId} | [Note informative ${i+1}] | Informative | [N/A] |\n`;
            vulnId++;
        }
        
        // Afficher le résultat Markdown
        tableMarkdownContent.textContent = markdown;
        
        // Générer la version HTML pour Word
        let wordHtml = '<h1>Synthèse des vulnérabilités</h1>';
        wordHtml += `<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
            <tr style="background-color: #f2f2f2;">
                <th style="text-align: left;">ID</th>
                <th style="text-align: left;">Vulnérabilité</th>
                <th style="text-align: left;">Criticité</th>
                <th style="text-align: center;">Score CVSS</th>
            </tr>`;
            
        vulnId = 1;
        
        // Ajouter les vulnérabilités critiques
        for (let i = 0; i < criticalCount; i++) {
            wordHtml += `<tr style="background-color: #ffdddd;">
                <td>VULN-${vulnId}</td>
                <td>[Vulnérabilité critique ${i+1}]</td>
                <td>Critique</td>
                <td style="text-align: center;">[N/A]</td>
            </tr>`;
            vulnId++;
        }
        
        // Ajouter les vulnérabilités élevées
        for (let i = 0; i < highCount; i++) {
            wordHtml += `<tr style="background-color: #ffeecc;">
                <td>VULN-${vulnId}</td>
                <td>[Vulnérabilité élevée ${i+1}]</td>
                <td>Élevée</td>
                <td style="text-align: center;">[N/A]</td>
            </tr>`;
            vulnId++;
        }
        
        // Ajouter les vulnérabilités moyennes
        for (let i = 0; i < mediumCount; i++) {
            wordHtml += `<tr style="background-color: #ffffcc;">
                <td>VULN-${vulnId}</td>
                <td>[Vulnérabilité moyenne ${i+1}]</td>
                <td>Moyenne</td>
                <td style="text-align: center;">[N/A]</td>
            </tr>`;
            vulnId++;
        }
        
        // Ajouter les vulnérabilités faibles
        for (let i = 0; i < lowCount; i++) {
            wordHtml += `<tr style="background-color: #e6ffe6;">
                <td>VULN-${vulnId}</td>
                <td>[Vulnérabilité faible ${i+1}]</td>
                <td>Faible</td>
                <td style="text-align: center;">[N/A]</td>
            </tr>`;
            vulnId++;
        }
        
        // Ajouter les vulnérabilités informatives
        for (let i = 0; i < infoCount; i++) {
            wordHtml += `<tr style="background-color: #e6f2ff;">
                <td>VULN-${vulnId}</td>
                <td>[Note informative ${i+1}]</td>
                <td>Informative</td>
                <td style="text-align: center;">[N/A]</td>
            </tr>`;
            vulnId++;
        }
        
        wordHtml += '</table>';
        
        // Afficher le résultat Word
        tableWordContent.innerHTML = wordHtml;
        tableOutputSection.style.display = 'block';
    });
    
    // Fonctions utilitaires pour copier et télécharger
    copyVulnButton.addEventListener('click', function() {
        const activeFormat = vulnOutputSection.querySelector('.vuln-content.active');
        if (activeFormat.classList.contains('markdown-format')) {
            copyToClipboard(activeFormat.textContent);
        } else {
            copyHtmlToClipboard(activeFormat.innerHTML);
        }
        showCopySuccess(this);
    });
    
    downloadVulnButton.addEventListener('click', function() {
        const activeFormat = vulnOutputSection.querySelector('.vuln-content.active');
        const title = vulnTitleInput.value || 'vulnerability';
        const formattedTitle = title.toLowerCase().replace(/\s+/g, '-');
        
        if (activeFormat.classList.contains('markdown-format')) {
            downloadText(activeFormat.textContent, `${formattedTitle}.md`);
        } else {
            downloadHtml(activeFormat.innerHTML, `${formattedTitle}.html`);
        }
    });
    
    copyTableButton.addEventListener('click', function() {
        const activeFormat = tableOutputSection.querySelector('.vuln-content.active');
        if (activeFormat.classList.contains('markdown-format')) {
            copyToClipboard(activeFormat.textContent);
        } else {
            copyHtmlToClipboard(activeFormat.innerHTML);
        }
        showCopySuccess(this);
    });
    
    downloadTableButton.addEventListener('click', function() {
        const activeFormat = tableOutputSection.querySelector('.vuln-content.active');
        
        if (activeFormat.classList.contains('markdown-format')) {
            downloadText(activeFormat.textContent, 'vulnerabilities-table.md');
        } else {
            downloadHtml(activeFormat.innerHTML, 'vulnerabilities-table.html');
        }
    });
    
    function copyToClipboard(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
    
    function copyHtmlToClipboard(html) {
        const listener = function(e) {
            e.clipboardData.setData('text/html', html);
            e.clipboardData.setData('text/plain', html);
            e.preventDefault();
        };
        
        document.addEventListener('copy', listener);
        document.execCommand('copy');
        document.removeEventListener('copy', listener);
    }
    
    function showCopySuccess(button) {
        const originalText = button.textContent;
        button.textContent = 'Copié !';
        setTimeout(() => {
            button.textContent = originalText;
        }, 1500);
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
    
    function downloadHtml(html, filename) {
        const fullHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${filename}</title>
</head>
<body>
    ${html}
</body>
</html>`;
        
        const blob = new Blob([fullHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // Fonctions d'assistance
    function getSeverityText(severity) {
        const severityMap = {
            critical: 'Critique',
            high: 'Élevée',
            medium: 'Moyenne',
            low: 'Faible',
            info: 'Informative'
        };
        
        return severityMap[severity] || severity;
    }
    
    function getLoremIpsum(severity) {
        let base = "Une vulnérabilité a été identifiée qui pourrait ";
        
        switch (severity) {
            case 'critical':
                return base + "compromettre entièrement le système et permettre l'exécution de code arbitraire à distance sans authentification. Cette vulnérabilité doit être corrigée immédiatement car elle représente un risque critique pour l'intégrité, la confidentialité et la disponibilité des données et systèmes.";
                
            case 'high':
                return base + "permettre à un attaquant authentifié d'élever ses privilèges ou d'accéder à des informations sensibles. Cette vulnérabilité représente un risque important pour la sécurité du système et devrait être corrigée dans les plus brefs délais.";
                
            case 'medium':
                return base + "permettre à un attaquant d'accéder à certaines informations non critiques ou de perturber partiellement le service. Cette vulnérabilité représente un risque modéré pour le système et devrait être corrigée lors du prochain cycle de maintenance.";
                
            case 'low':
                return base + "faciliter l'exploitation d'autres vulnérabilités ou fournir des informations non essentielles à un attaquant. Cette vulnérabilité présente un risque faible et peut être corrigée lors d'une maintenance régulière.";
                
            case 'info':
                return "Cette note informative souligne une configuration ou une pratique qui, bien que non vulnérable en soi, pourrait être améliorée pour renforcer la posture de sécurité globale du système. Aucune action immédiate n'est requise.";
                
            default:
                return "Une vulnérabilité a été identifiée dans le système qui pourrait être exploitée par un attaquant pour compromettre la sécurité du système. Une correction devrait être implémentée selon le niveau de risque associé.";
        }
    }
}); 