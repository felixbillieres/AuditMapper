/**
 * Générateur de rapports avancés
 */

export class AdvancedReportGenerator {
    constructor(hostManager) {
        this.hostManager = hostManager;
        this.currentReportType = null;
        this.currentReportData = null;
        this.selectedCategories = new Set();
        this.reportOptions = {
            title: '',
            author: '',
            includeScreenshots: true,
            includeCredentials: true,
            includeTimeline: true
        };
    }

    initialize() {
        console.log(">>> AdvancedReportGenerator.initialize: START");
        
        // Vérifier que les éléments existent
        const elements = [
            'generateExecutiveSummary',
            'generateTechnicalReport', 
            'generateKillChainReport',
            'generateCredentialReport',
            'reportPreviewMini',
            'reportCategoryFilters'
        ];
        
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (!element) {
                console.warn(`Element with ID '${id}' not found`);
            } else {
                console.log(`Element '${id}' found`);
            }
        });
        
        this.setupEventListeners();
        this.populateCategoryFilters();
        
        console.log(">>> AdvancedReportGenerator.initialize: END");
    }

    setupEventListeners() {
        // Boutons de type de rapport
        document.getElementById('generateExecutiveSummary')?.addEventListener('click', () => {
            this.selectReportType('executive');
        });
        
        document.getElementById('generateTechnicalReport')?.addEventListener('click', () => {
            this.selectReportType('technical');
        });
        
        document.getElementById('generateKillChainReport')?.addEventListener('click', () => {
            this.selectReportType('killchain');
        });
        
        document.getElementById('generateCredentialReport')?.addEventListener('click', () => {
            this.selectReportType('credentials');
        });

        // Aperçu complet
        document.getElementById('previewFullReport')?.addEventListener('click', () => {
            this.showFullPreview();
        });

        // Exports
        document.getElementById('exportReportPdf')?.addEventListener('click', () => {
            this.exportReport('pdf');
        });
        
        document.getElementById('exportReportMd')?.addEventListener('click', () => {
            this.exportReport('markdown');
        });
        
        document.getElementById('exportReportHtml')?.addEventListener('click', () => {
            this.exportReport('html');
        });

        // Options de rapport
        document.getElementById('reportTitle')?.addEventListener('input', (e) => {
            this.reportOptions.title = e.target.value;
            this.updatePreview();
        });
        
        document.getElementById('reportAuthor')?.addEventListener('input', (e) => {
            this.reportOptions.author = e.target.value;
            this.updatePreview();
        });

        // Édition manuelle
        document.getElementById('editReportManually')?.addEventListener('click', () => {
            this.showManualEditor();
        });
    }

    populateCategoryFilters() {
        const container = document.getElementById('reportCategoryFilters');
        if (!container) {
            console.warn('reportCategoryFilters container not found');
            return;
        }

        const hostData = this.hostManager.getData();
        console.log('Full host data:', hostData);
        
        const categories = Object.keys(hostData.categories || {});
        console.log('Available categories:', categories);
        
        container.innerHTML = '';
        
        if (categories.length === 0) {
            container.innerHTML = '<p class="text-muted">Aucune catégorie disponible - Ajoutez des hosts d\'abord</p>';
            return;
        }

        // Réinitialiser les catégories sélectionnées
        this.selectedCategories.clear();

        categories.forEach(categoryName => {
            const filterItem = document.createElement('div');
            filterItem.className = 'category-filter-item active';
            filterItem.innerHTML = `
                <input type="checkbox" id="cat_${categoryName.replace(/\s+/g, '_')}" checked>
                <label for="cat_${categoryName.replace(/\s+/g, '_')}">${categoryName}</label>
            `;
            
            const checkbox = filterItem.querySelector('input');
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.selectedCategories.add(categoryName);
                    filterItem.classList.add('active');
                } else {
                    this.selectedCategories.delete(categoryName);
                    filterItem.classList.remove('active');
                }
                this.updatePreview();
            });
            
            // Sélectionner par défaut
            this.selectedCategories.add(categoryName);
            
            container.appendChild(filterItem);
        });
        
        console.log('Selected categories:', this.selectedCategories);
    }

    selectReportType(type) {
        this.currentReportType = type;
        
        // Mettre à jour l'UI - corriger les IDs des boutons
        document.querySelectorAll('.btn-group .btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Corriger les IDs des boutons
        let activeBtn;
        switch(type) {
            case 'executive':
                activeBtn = document.getElementById('generateExecutiveSummary');
                break;
            case 'technical':
                activeBtn = document.getElementById('generateTechnicalReport');
                break;
            case 'killchain':
                activeBtn = document.getElementById('generateKillChainReport');
                break;
            case 'credentials':
                activeBtn = document.getElementById('generateCredentialReport');
                break;
        }
        
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        // Générer l'aperçu
        this.generateReport();
        this.updatePreview();
        
        // Activer les boutons d'export
        this.enableExportButtons();
    }

    generateReport() {
        if (!this.currentReportType) {
            console.warn('No report type selected');
            return;
        }

        console.log(`Generating ${this.currentReportType} report...`);
        
        const hostData = this.hostManager.getData();
        console.log('Host data:', hostData);
        
        const filteredData = this.filterDataByCategories(hostData);
        console.log('Filtered data:', filteredData);
        
        try {
            switch (this.currentReportType) {
                case 'executive':
                    this.currentReportData = this.generateExecutiveSummary(filteredData);
                    break;
                case 'technical':
                    this.currentReportData = this.generateTechnicalReport(filteredData);
                    break;
                case 'killchain':
                    this.currentReportData = this.generateKillChainReport(filteredData);
                    break;
                case 'credentials':
                    this.currentReportData = this.generateCredentialReport(filteredData);
                    break;
                default:
                    console.error('Unknown report type:', this.currentReportType);
                    return;
            }
            
            console.log('Generated report data:', this.currentReportData);
            
        } catch (error) {
            console.error('Error generating report:', error);
            this.currentReportData = `# Erreur de génération\n\nUne erreur s'est produite lors de la génération du rapport: ${error.message}`;
        }
    }

    filterDataByCategories(hostData) {
        if (this.selectedCategories.size === 0) {
            return hostData; // Retourner toutes les données si aucune catégorie sélectionnée
        }

        const filtered = {
            categories: {},
            edges: hostData.edges || []
        };

        // Filtrer les catégories sélectionnées
        for (const categoryName of this.selectedCategories) {
            if (hostData.categories[categoryName]) {
                filtered.categories[categoryName] = hostData.categories[categoryName];
            }
        }

        return filtered;
    }

    generateExecutiveSummary(data) {
        const stats = this.calculateStats(data);
        const title = this.reportOptions.title || 'Rapport Exécutif - Test d\'Intrusion';
        const author = this.reportOptions.author || 'Équipe Sécurité';
        const date = new Date().toLocaleDateString('fr-FR');

        return `# ${title}

**Auteur:** ${author}  
**Date:** ${date}  
**Scope:** ${stats.totalCategories} catégories, ${stats.totalHosts} systèmes

## Résumé Exécutif

Ce rapport présente les résultats du test d'intrusion réalisé sur l'infrastructure cible. L'évaluation a révélé **${stats.compromisedHosts}** systèmes compromis sur **${stats.totalHosts}** systèmes analysés.

## Synthèse des Vulnérabilités

${this.generateVulnerabilityAnalysis(stats)}

## Systèmes Compromis par Catégorie

${this.generateCategoryBreakdown(data)}

## Credentials Récupérés

${this.generateCredentialsSummaryText(data)}

## Recommandations Prioritaires

1. **Correction immédiate** des vulnérabilités critiques identifiées
2. **Renforcement** des politiques de mots de passe
3. **Segmentation réseau** pour limiter la propagation
4. **Monitoring** renforcé des systèmes sensibles
5. **Formation** du personnel sur les bonnes pratiques de sécurité

## Impact Business

- **${stats.compromisedHosts}** systèmes potentiellement compromis
- **${stats.totalCredentials}** credentials exposés
- Risque de propagation latérale élevé
- Exposition potentielle de données sensibles

---
*Rapport généré automatiquement le ${date}*`;
    }

    generateTechnicalReport(data) {
        const stats = this.calculateStats(data);
        const title = this.reportOptions.title || 'Rapport Technique - Test d\'Intrusion';
        const author = this.reportOptions.author || 'Équipe Technique';
        const date = new Date().toLocaleDateString('fr-FR');

        return `# ${title}

**Auteur:** ${author}  
**Date:** ${date}  
**Méthodologie:** OWASP Testing Guide, NIST SP 800-115

## Vue d'Ensemble Technique

### Infrastructure Analysée
${this.generateInfrastructureOverviewText(data)}

### Méthodologie d'Évaluation
1. **Reconnaissance passive** - Collecte d'informations publiques
2. **Énumération active** - Scan de ports et services
3. **Analyse de vulnérabilités** - Identification des failles
4. **Exploitation** - Validation des vulnérabilités
5. **Post-exploitation** - Évaluation de l'impact

## Détail des Systèmes Compromis

${this.generateDetailedHostAnalysis(data)}

## Analyse des Vecteurs d'Attaque

${this.generateAttackVectorsText(data)}

## Propagation et Mouvement Latéral

${this.generateLateralMovementText(data)}

## Analyse des Services Exposés

${this.generateServiceAnalysisText(data)}

## Recommandations Techniques

${this.generateTechnicalRecommendationsText(data)}

---
*Analyse technique complétée le ${date}*`;
    }

    generateKillChainReport(data) {
        const stats = this.calculateStats(data);
        const title = this.reportOptions.title || 'Rapport Kill Chain - Analyse d\'Attaque';
        const author = this.reportOptions.author || 'Équipe Red Team';
        const date = new Date().toLocaleDateString('fr-FR');

        return `# ${title}

**Auteur:** ${author}  
**Date:** ${date}  
**Framework:** Lockheed Martin Cyber Kill Chain

## Vue d'Ensemble de l'Attaque

Cette analyse présente la progression de l'attaque selon le modèle Cyber Kill Chain, démontrant comment un attaquant pourrait compromettre l'infrastructure cible.

## Phases de la Kill Chain

### 1. Reconnaissance
- **Objectif:** Collecte d'informations sur les cibles
- **Systèmes identifiés:** ${stats.totalHosts} systèmes dans ${stats.totalCategories} catégories
- **Méthodes:** Scan réseau, énumération de services, OSINT

### 2. Weaponization
- **Objectif:** Création d'exploits ciblés
- **Vulnérabilités identifiées:** ${stats.compromisedHosts} systèmes vulnérables
- **Vecteurs d'attaque:** Services exposés, configurations faibles

### 3. Delivery
- **Objectif:** Transmission des exploits vers les cibles
- **Méthodes:** Exploitation directe, ingénierie sociale, phishing

### 4. Exploitation
${this.generateDetailedHostAnalysis(data)}

### 5. Installation
- **Objectif:** Installation de backdoors et persistence
- **Systèmes compromis:** ${stats.compromisedHosts}/${stats.totalHosts}

### 6. Command & Control
- **Objectif:** Établissement de communications avec les systèmes compromis
- **Infrastructure:** ${this.generateC2AnalysisText(data)}

### 7. Actions on Objectives
- **Credentials récupérés:** ${stats.totalCredentials}
- **Données exfiltrées:** Analyse en cours
- **Impact:** ${this.generateImpactAnalysisText(data)}

## Graphique de Propagation

${this.generatePropagationGraphText(data)}

## Recommandations de Défense

1. **Détection précoce** - Monitoring des phases initiales
2. **Segmentation** - Limitation de la propagation latérale
3. **Endpoint Protection** - Prévention de l'installation
4. **Network Monitoring** - Détection des communications C2
5. **Incident Response** - Procédures de réponse rapide

---
*Analyse Kill Chain complétée le ${date}*`;
    }

    generateCredentialReport(data) {
        const credentials = this.extractAllCredentials(data);
        const title = this.reportOptions.title || 'Rapport Credentials - Analyse des Accès';
        const author = this.reportOptions.author || 'Équipe Sécurité';
        const date = new Date().toLocaleDateString('fr-FR');

        return `# ${title}

**Auteur:** ${author}  
**Date:** ${date}  
**Scope:** Analyse des credentials récupérés

## Synthèse des Credentials

### Statistiques Globales
- **Total credentials:** ${credentials.total}
- **Usernames:** ${credentials.usernames}
- **Passwords en clair:** ${credentials.passwords}
- **Hashes:** ${credentials.hashes}
- **Comptes privilégiés:** ${credentials.privileged}

### Analyse de Sécurité
- **Taux de mots de passe faibles:** Analyse en cours
- **Réutilisation de mots de passe:** ${this.analyzePasswordReuseText(credentials)}
- **Comptes à privilèges élevés:** ${credentials.privileged} identifiés

## Credentials par Système

${this.generateCredentialsBySystemDetailed(data)}

## Analyse des Patterns

### Faiblesse des Mots de Passe
${this.analyzePasswordWeaknessText(credentials)}

### Réutilisation de Credentials
${this.analyzeCredentialReuseText(credentials)}

### Comptes de Service
${this.analyzeServiceAccountsText(data)}

## Recommandations

1. **Politique de mots de passe renforcée**
   - Longueur minimale de 12 caractères
   - Complexité obligatoire
   - Rotation régulière

2. **Gestion des comptes privilégiés**
   - Séparation des comptes administrateurs
   - Authentification multi-facteurs
   - Monitoring des accès privilégiés

3. **Détection des compromissions**
   - Monitoring des authentifications anormales
   - Détection de réutilisation de credentials
   - Alertes sur les accès privilégiés

4. **Formation utilisateurs**
   - Sensibilisation aux bonnes pratiques
   - Gestion sécurisée des mots de passe
   - Reconnaissance des tentatives de phishing

---
*Analyse des credentials complétée le ${date}*`;
    }

    calculateStats(data) {
        let totalHosts = 0;
        let compromisedHosts = 0;
        let totalCredentials = 0;
        const compromiseLevels = {};
        const categories = Object.keys(data.categories || {});

        for (const category of Object.values(data.categories || {})) {
            const hosts = category.hosts || {};
            totalHosts += Object.keys(hosts).length;

            for (const host of Object.values(hosts)) {
                // Compter les niveaux de compromission
                const level = host.compromiseLevel || 'None';
                compromiseLevels[level] = (compromiseLevels[level] || 0) + 1;
                
                if (level !== 'None') {
                    compromisedHosts++;
                }

                // Compter les credentials
                if (host.credentials) {
                    const creds = host.credentials;
                    totalCredentials += (creds.usernames || []).length;
                    totalCredentials += (creds.passwords || []).length;
                    totalCredentials += (creds.hashes || []).length;
                }
            }
        }

        return {
            totalHosts,
            compromisedHosts,
            totalCredentials,
            compromiseLevels,
            totalCategories: categories.length
        };
    }

    getOverallRiskLevel(stats) {
        if (stats.criticalVulns > 0) return 'CRITIQUE';
        if (stats.compromiseRate > 70) return 'ÉLEVÉ';
        if (stats.compromiseRate > 30) return 'MOYEN';
        return 'FAIBLE';
    }

    generateCompromiseBreakdown(stats) {
        let breakdown = '';
        for (const [level, count] of Object.entries(stats.compromiseLevels)) {
            if (count > 0) {
                breakdown += `- **${level}:** ${count} système(s)\n`;
            }
        }
        return breakdown || '- Aucune compromission détectée';
    }

    generateExecutiveConclusion(stats) {
        if (stats.criticalVulns > 0) {
            return 'L\'infrastructure présente des vulnérabilités critiques nécessitant une action immédiate. Une stratégie de remédiation doit être mise en place rapidement.';
        } else if (stats.compromiseRate > 50) {
            return 'Le niveau de sécurité nécessite des améliorations significatives. Les recommandations doivent être appliquées dans les meilleurs délais.';
        } else {
            return 'L\'infrastructure présente un niveau de sécurité acceptable avec quelques points d\'amélioration identifiés.';
        }
    }

    updatePreview() {
        const previewContainer = document.getElementById('reportPreviewMini');
        if (!previewContainer) return;

        if (!this.currentReportData) {
            previewContainer.innerHTML = `
                <div class="text-center text-muted p-3">
                    <i class="fas fa-file-alt fa-2x mb-2"></i>
                    <p>Sélectionnez un type de rapport pour voir l'aperçu</p>
                </div>
            `;
            return;
        }

        // Convertir le markdown en HTML pour l'aperçu
        const htmlContent = this.convertMarkdownToPreviewHtml(this.currentReportData);
        previewContainer.innerHTML = htmlContent;
    }

    convertMarkdownToPreviewHtml(markdown) {
        if (!markdown) return '';
        
        // Conversion markdown vers HTML améliorée
        let html = markdown
            // Headers avec IDs pour la navigation
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
            
            // Gras et italique
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            
            // Code inline
            .replace(/`(.*?)`/g, '<code>$1</code>')
            
            // Lignes horizontales
            .replace(/^---$/gm, '<hr>')
            
            // Listes à puces
            .replace(/^- (.*$)/gm, '<li>$1</li>')
            
            // Tableaux
            .replace(/^\| (.*) \|$/gm, (match, content) => {
                const cells = content.split(' | ').map(cell => {
                    const trimmed = cell.trim();
                    // Détecter les headers (lignes avec des tirets)
                    if (trimmed.match(/^-+$/)) {
                        return '<th></th>';
                    }
                    return `<td>${trimmed}</td>`;
                }).join('');
                return `<tr>${cells}</tr>`;
            });

        // Post-traitement pour les structures
        html = html
            // Envelopper les listes consécutives
            .replace(/(<li>.*?<\/li>)(\s*<li>.*?<\/li>)*/gs, '<ul>$&</ul>')
            
            // Envelopper les tableaux
            .replace(/(<tr>.*?<\/tr>)(\s*<tr>.*?<\/tr>)*/gs, '<table>$&</table>')
            
            // Convertir les sauts de ligne en paragraphes
            .split('\n\n')
            .map(paragraph => {
                paragraph = paragraph.trim();
                if (!paragraph) return '';
                if (paragraph.startsWith('<h') || paragraph.startsWith('<ul') || 
                    paragraph.startsWith('<table') || paragraph.startsWith('<hr')) {
                    return paragraph;
                }
                return `<p>${paragraph.replace(/\n/g, '<br>')}</p>`;
            })
            .join('\n');

        return `<div class="markdown-preview">${html}</div>`;
    }

    showFullPreview() {
        if (!this.currentReportData) {
            alert('Aucun rapport généré. Sélectionnez d\'abord un type de rapport.');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-xl">
                <div class="modal-content" style="background: #2c3e50; color: #ecf0f1;">
                    <div class="modal-header" style="border-bottom: 1px solid #34495e;">
                        <h5 class="modal-title" style="color: #3498db;">
                            Aperçu Complet - ${this.capitalizeFirst(this.currentReportType)}
                        </h5>
                        <button type="button" class="close" data-dismiss="modal" style="color: #ecf0f1;">
                            <span>&times;</span>
                        </button>
                    </div>
                    <div class="modal-body" style="max-height: 70vh; overflow-y: auto; padding: 20px;">
                        ${this.convertMarkdownToPreviewHtml(this.currentReportData)}
                    </div>
                    <div class="modal-footer" style="border-top: 1px solid #34495e;">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Fermer</button>
                        <button type="button" class="btn btn-primary" id="editFromPreview">Modifier</button>
                        <button type="button" class="btn btn-success" id="exportFromPreview">Exporter</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        $(modal).modal('show');

        // Événements pour les boutons
        modal.querySelector('#editFromPreview').addEventListener('click', () => {
            $(modal).modal('hide');
            this.showManualEditor();
        });

        modal.querySelector('#exportFromPreview').addEventListener('click', () => {
            this.exportReport('markdown');
        });

        // Nettoyer après fermeture
        $(modal).on('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }

    showManualEditor() {
        if (!this.currentReportData) return;

        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Éditeur Manuel - ${this.capitalizeFirst(this.currentReportType)}</h5>
                        <button type="button" class="close" data-dismiss="modal">
                            <span>&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Édition Markdown</h6>
                                <textarea id="manualReportEditor" class="form-control" rows="25" style="font-family: monospace;">${this.currentReportData}</textarea>
                            </div>
                            <div class="col-md-6">
                                <h6>Aperçu</h6>
                                <div id="manualReportPreview" class="border p-3" style="height: 600px; overflow-y: auto; background: #f8f9fa;">
                                    ${this.convertMarkdownToPreviewHtml(this.currentReportData)}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Annuler</button>
                        <button type="button" class="btn btn-primary" id="saveManualChanges">Sauvegarder</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        $(modal).modal('show');

        // Mise à jour en temps réel de l'aperçu
        const editor = modal.querySelector('#manualReportEditor');
        const preview = modal.querySelector('#manualReportPreview');
        
        editor.addEventListener('input', () => {
            preview.innerHTML = this.convertMarkdownToPreviewHtml(editor.value);
        });

        // Sauvegarder les modifications
        modal.querySelector('#saveManualChanges').addEventListener('click', () => {
            this.currentReportData = editor.value;
            this.updatePreview();
            $(modal).modal('hide');
        });

        // Nettoyer après fermeture
        $(modal).on('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }

    enableExportButtons() {
        document.getElementById('previewFullReport').disabled = false;
        document.getElementById('editReportManually').disabled = false;
        document.getElementById('exportReportPdf').disabled = false;
        document.getElementById('exportReportMd').disabled = false;
        document.getElementById('exportReportHtml').disabled = false;
    }

    exportReport(format) {
        if (!this.currentReportData) return;

        const filename = `rapport_${this.currentReportType}_${new Date().toISOString().split('T')[0]}`;
        
        switch (format) {
            case 'markdown':
                this.downloadFile(this.currentReportData, `${filename}.md`, 'text/markdown');
                break;
            case 'html':
                const html = this.convertMarkdownToHtml(this.currentReportData);
                this.downloadFile(html, `${filename}.html`, 'text/html');
                break;
            case 'pdf':
                this.exportToPdf();
                break;
        }
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    convertMarkdownToHtml(markdown) {
        // Conversion basique markdown vers HTML
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Rapport de Test d'Intrusion</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1, h2, h3 { color: #2c3e50; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 4px; }
    </style>
</head>
<body>
    <pre style="white-space: pre-wrap;">${markdown}</pre>
</body>
</html>`;
    }

    exportToPdf() {
        // Utiliser html2pdf si disponible
        if (typeof html2pdf !== 'undefined') {
            const element = document.createElement('div');
            element.innerHTML = `<pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${this.currentReportData}</pre>`;
            
            html2pdf().from(element).save(`rapport_${this.currentReportType}_${new Date().toISOString().split('T')[0]}.pdf`);
        } else {
            alert('Export PDF non disponible. Utilisez l\'aperçu complet et imprimez en PDF.');
        }
    }

    capitalizeFirst(str) {
        const names = {
            'executive': 'Rapport Exécutif',
            'technical': 'Rapport Technique', 
            'killchain': 'Rapport Kill Chain',
            'credentials': 'Rapport Credentials'
        };
        return names[str] || str;
    }

    // Méthodes utilitaires pour les rapports spécialisés
    generateExploitationDetails(data) {
        let details = '';
        for (const [categoryName, category] of Object.entries(data.categories)) {
            const hosts = category.hosts || {};
            for (const [hostId, host] of Object.entries(hosts)) {
                if (host.compromiseLevel && host.compromiseLevel !== 'None') {
                    details += `#### ${hostId} (${categoryName})\n`;
                    details += `- **Niveau:** ${host.compromiseLevel}\n`;
                    if (host.exploitationSteps && host.exploitationSteps.length > 0) {
                        details += '- **Étapes d\'exploitation:**\n';
                        host.exploitationSteps.forEach((step, index) => {
                            details += `  ${index + 1}. ${step.description}\n`;
                        });
                    }
                    details += '\n';
                }
            }
        }
        return details || 'Aucune exploitation documentée.';
    }

    generateCompromissionTimeline(data) {
        // Simuler une timeline basée sur les données
        return `1. **Phase initiale:** Reconnaissance et énumération
2. **Compromission initiale:** Premier point d'entrée établi
3. **Élévation de privilèges:** Obtention d'accès administrateur
4. **Mouvement latéral:** Propagation vers d'autres systèmes
5. **Persistence:** Établissement de backdoors
6. **Exfiltration:** Récupération des données sensibles`;
    }

    generatePropagationGraph(data) {
        const edges = data.edges || [];
        if (edges.length === 0) {
            return 'Aucune connexion documentée entre les systèmes.';
        }
        
        let graph = 'Connexions identifiées:\n';
        edges.forEach(edge => {
            graph += `- ${edge.from} → ${edge.to}`;
            if (edge.label) graph += ` (${edge.label})`;
            graph += '\n';
        });
        return graph;
    }

    extractCredentials(data) {
        let total = 0, cleartext = 0, hashes = 0, privileged = 0;
        
        for (const category of Object.values(data.categories)) {
            const hosts = category.hosts || {};
            for (const host of Object.values(hosts)) {
                if (host.credentials) {
                    const creds = host.credentials;
                    total += (creds.usernames || []).length;
                    total += (creds.passwords || []).length;
                    cleartext += (creds.passwords || []).length;
                    total += (creds.hashes || []).length;
                    hashes += (creds.hashes || []).length;
                    
                    // Détecter les comptes privilégiés
                    (creds.usernames || []).forEach(username => {
                        if (username.toLowerCase().includes('admin') || 
                            username.toLowerCase().includes('root') ||
                            username.toLowerCase().includes('administrator')) {
                            privileged++;
                        }
                    });
                }
            }
        }
        
        return { total, cleartext, hashes, privileged };
    }

    analyzePasswordWeakness(credentials) {
        return `Analyse en cours des ${credentials.cleartext} mots de passe récupérés:
- Mots de passe faibles détectés
- Patterns communs identifiés
- Recommandations de complexité`;
    }

    analyzeCredentialReuse(credentials) {
        return `Analyse de réutilisation sur ${credentials.total} credentials:
- Comptes avec mots de passe identiques
- Patterns de réutilisation inter-systèmes`;
    }

    generateCredentialsBySystem(data) {
        let report = '';
        for (const [categoryName, category] of Object.entries(data.categories)) {
            const hosts = category.hosts || {};
            for (const [hostId, host] of Object.entries(hosts)) {
                if (host.credentials) {
                    report += `### ${hostId} (${categoryName})\n`;
                    const creds = host.credentials;
                    if (creds.usernames && creds.usernames.length > 0) {
                        report += `- **Usernames:** ${creds.usernames.length} récupérés\n`;
                    }
                    if (creds.passwords && creds.passwords.length > 0) {
                        report += `- **Passwords:** ${creds.passwords.length} en clair\n`;
                    }
                    if (creds.hashes && creds.hashes.length > 0) {
                        report += `- **Hashes:** ${creds.hashes.length} récupérés\n`;
                    }
                    report += '\n';
                }
            }
        }
        return report || 'Aucun credential documenté.';
    }

    generateVulnerabilityAnalysis(stats) {
        return `| Niveau | Nombre | Pourcentage |
|--------|--------|-------------|
| Critique | ${stats.compromiseLevels.Critical || 0} | ${Math.round(((stats.compromiseLevels.Critical || 0) / stats.totalHosts) * 100)}% |
| Élevé | ${stats.compromiseLevels.High || 0} | ${Math.round(((stats.compromiseLevels.High || 0) / stats.totalHosts) * 100)}% |
| Moyen | ${stats.compromiseLevels.Medium || 0} | ${Math.round(((stats.compromiseLevels.Medium || 0) / stats.totalHosts) * 100)}% |
| Faible | ${stats.compromiseLevels.Low || 0} | ${Math.round(((stats.compromiseLevels.Low || 0) / stats.totalHosts) * 100)}% |`;
    }

    generateCategoryBreakdown(data) {
        let breakdown = '';
        for (const [categoryName, category] of Object.entries(data.categories)) {
            const hosts = category.hosts || {};
            const hostCount = Object.keys(hosts).length;
            const compromisedCount = Object.values(hosts).filter(h => h.compromiseLevel && h.compromiseLevel !== 'None').length;
            
            breakdown += `### ${categoryName}\n`;
            breakdown += `- **Total systèmes:** ${hostCount}\n`;
            breakdown += `- **Systèmes compromis:** ${compromisedCount}\n`;
            breakdown += `- **Taux de compromission:** ${Math.round((compromisedCount / hostCount) * 100)}%\n\n`;
            
            // Détail des systèmes compromis
            if (compromisedCount > 0) {
                breakdown += '**Systèmes affectés:**\n';
                for (const [hostId, host] of Object.entries(hosts)) {
                    if (host.compromiseLevel && host.compromiseLevel !== 'None') {
                        breakdown += `- ${hostId} (${host.compromiseLevel})`;
                        if (host.ip) breakdown += ` - ${host.ip}`;
                        breakdown += '\n';
                    }
                }
                breakdown += '\n';
            }
        }
        return breakdown || 'Aucune catégorie analysée.';
    }

    generateDetailedHostAnalysis(data) {
        let analysis = '';
        for (const [categoryName, category] of Object.entries(data.categories)) {
            const hosts = category.hosts || {};
            
            for (const [hostId, host] of Object.entries(hosts)) {
                if (host.compromiseLevel && host.compromiseLevel !== 'None') {
                    analysis += `### ${hostId} (${categoryName})\n\n`;
                    analysis += `**Informations système:**\n`;
                    analysis += `- IP: ${host.ip || 'Non spécifiée'}\n`;
                    analysis += `- Système: ${host.system || 'Non identifié'}\n`;
                    analysis += `- Niveau de compromission: ${host.compromiseLevel}\n`;
                    
                    if (host.services) {
                        if (typeof host.services === 'string') {
                            analysis += `- Services: ${host.services}\n`;
                        } else if (Array.isArray(host.services) && host.services.length > 0) {
                            analysis += `- Services: ${host.services.join(', ')}\n`;
                        }
                    }
                    
                    if (host.tags) {
                        if (typeof host.tags === 'string') {
                            analysis += `- Tags: ${host.tags}\n`;
                        } else if (Array.isArray(host.tags) && host.tags.length > 0) {
                            analysis += `- Tags: ${host.tags.join(', ')}\n`;
                        }
                    }
                    
                    analysis += '\n**Vulnérabilités identifiées:**\n';
                    if (host.vulnerabilities && host.vulnerabilities.length > 0) {
                        host.vulnerabilities.forEach((vuln, index) => {
                            analysis += `${index + 1}. ${vuln.title || 'Vulnérabilité'}\n`;
                            if (vuln.description) analysis += `   - ${vuln.description}\n`;
                            if (vuln.severity) analysis += `   - Sévérité: ${vuln.severity}\n`;
                        });
                    } else {
                        analysis += 'Détails à documenter.\n';
                    }
                    
                    if (host.exploitationSteps && host.exploitationSteps.length > 0) {
                        analysis += '\n**Étapes d\'exploitation:**\n';
                        host.exploitationSteps.forEach((step, index) => {
                            analysis += `${index + 1}. ${step.description || step}\n`;
                        });
                    }
                    
                    if (host.notes) {
                        analysis += `\n**Notes:** ${host.notes}\n`;
                    }
                    
                    analysis += '\n---\n\n';
                }
            }
        }
        return analysis || 'Aucun système compromis documenté.';
    }

    extractAllCredentials(data) {
        let usernames = 0, passwords = 0, hashes = 0, privileged = 0;
        
        for (const category of Object.values(data.categories)) {
            const hosts = category.hosts || {};
            for (const host of Object.values(hosts)) {
                if (host.credentials) {
                    const creds = host.credentials;
                    usernames += (creds.usernames || []).length;
                    passwords += (creds.passwords || []).length;
                    hashes += (creds.hashes || []).length;
                    
                    // Détecter les comptes privilégiés
                    (creds.usernames || []).forEach(username => {
                        if (username.toLowerCase().includes('admin') || 
                            username.toLowerCase().includes('root') ||
                            username.toLowerCase().includes('administrator')) {
                            privileged++;
                        }
                    });
                }
            }
        }
        
        return { 
            total: usernames + passwords + hashes, 
            usernames, 
            passwords, 
            hashes, 
            privileged 
        };
    }

    // Méthodes utilitaires manquantes
    generateCredentialsSummaryText(data) {
        const credentials = this.extractAllCredentials(data);
        return `**Total:** ${credentials.total} credentials récupérés
- **Usernames:** ${credentials.usernames}
- **Passwords:** ${credentials.passwords} 
- **Hashes:** ${credentials.hashes}
- **Comptes privilégiés:** ${credentials.privileged}`;
    }

    generateInfrastructureOverviewText(data) {
        const stats = this.calculateStats(data);
        let overview = `**Périmètre d'analyse:**\n`;
        overview += `- ${stats.totalCategories} catégories de systèmes\n`;
        overview += `- ${stats.totalHosts} systèmes au total\n`;
        overview += `- ${stats.compromisedHosts} systèmes compromis\n\n`;
        
        overview += `**Répartition par catégorie:**\n`;
        for (const [categoryName, category] of Object.entries(data.categories)) {
            const hostCount = Object.keys(category.hosts || {}).length;
            overview += `- ${categoryName}: ${hostCount} systèmes\n`;
        }
        
        return overview;
    }

    generateAttackVectorsText(data) {
        let vectors = `**Vecteurs d'attaque identifiés:**\n`;
        vectors += `- Services réseau exposés\n`;
        vectors += `- Configurations par défaut\n`;
        vectors += `- Vulnérabilités applicatives\n`;
        vectors += `- Credentials faibles\n\n`;
        
        vectors += `**Analyse détaillée:**\n`;
        for (const [categoryName, category] of Object.entries(data.categories)) {
            const hosts = category.hosts || {};
            for (const [hostId, host] of Object.entries(hosts)) {
                if (host.services && host.services.length > 0) {
                    vectors += `- ${hostId}: ${host.services.join(', ')}\n`;
                }
            }
        }
        
        return vectors;
    }

    generateLateralMovementText(data) {
        const edges = data.edges || [];
        let movement = `**Possibilités de mouvement latéral:**\n`;
        
        if (edges.length > 0) {
            movement += `${edges.length} connexions identifiées entre systèmes:\n`;
            edges.forEach(edge => {
                movement += `- ${edge.from} → ${edge.to}`;
                if (edge.label) movement += ` (${edge.label})`;
                movement += '\n';
            });
        } else {
            movement += `Aucune connexion documentée entre les systèmes.\n`;
        }
        
        return movement;
    }

    generateServiceAnalysisText(data) {
        let analysis = `**Services exposés par système:**\n`;
        
        for (const [categoryName, category] of Object.entries(data.categories)) {
            const hosts = category.hosts || {};
            for (const [hostId, host] of Object.entries(hosts)) {
                if (host.services) {
                    if (typeof host.services === 'string') {
                        analysis += `- **${hostId}:** ${host.services}\n`;
                    } else if (Array.isArray(host.services) && host.services.length > 0) {
                        analysis += `- **${hostId}:** ${host.services.join(', ')}\n`;
                    }
                }
            }
        }
        
        return analysis || 'Aucun service documenté.';
    }

    generateTechnicalRecommendationsText(data) {
        const stats = this.calculateStats(data);
        return `**Recommandations par priorité:**

1. **Critique** - ${stats.compromiseLevels.Critical || 0} systèmes
   - Correction immédiate des vulnérabilités critiques
   - Isolation des systèmes compromis

2. **Élevé** - ${stats.compromiseLevels.High || 0} systèmes
   - Mise à jour des systèmes vulnérables
   - Renforcement des configurations

3. **Moyen** - ${stats.compromiseLevels.Medium || 0} systèmes
   - Application des correctifs de sécurité
   - Amélioration du monitoring

4. **Général**
   - Segmentation réseau
   - Politique de mots de passe
   - Formation des utilisateurs`;
    }

    generateC2AnalysisText(data) {
        return `Analyse des communications Command & Control:
- Protocoles utilisés: HTTP/HTTPS, DNS
- Fréquence des communications: Variable
- Détection: Monitoring réseau recommandé`;
    }

    generateImpactAnalysisText(data) {
        const stats = this.calculateStats(data);
        return `Impact potentiel de l'attaque:
- ${stats.compromisedHosts} systèmes compromis
- ${stats.totalCredentials} credentials exposés
- Risque de propagation: Élevé
- Confidentialité: Compromise
- Intégrité: À risque
- Disponibilité: Menacée`;
    }

    generatePropagationGraphText(data) {
        const edges = data.edges || [];
        if (edges.length === 0) {
            return 'Aucune connexion documentée entre les systèmes.';
        }
        
        let graph = 'Connexions identifiées:\n';
        edges.forEach(edge => {
            graph += `- ${edge.from} → ${edge.to}`;
            if (edge.label) graph += ` (${edge.label})`;
            graph += '\n';
        });
        return graph;
    }

    generateCredentialsBySystemDetailed(data) {
        let report = '';
        for (const [categoryName, category] of Object.entries(data.categories)) {
            const hosts = category.hosts || {};
            
            for (const [hostId, host] of Object.entries(hosts)) {
                if (host.credentials) {
                    const creds = host.credentials;
                    report += `### ${hostId} (${categoryName})\n\n`;
                    
                    if (creds.usernames && creds.usernames.length > 0) {
                        report += '**Usernames récupérés:**\n';
                        creds.usernames.forEach(username => {
                            report += `- ${username}\n`;
                        });
                        report += '\n';
                    }
                    
                    if (creds.passwords && creds.passwords.length > 0) {
                        report += '**Passwords en clair:**\n';
                        creds.passwords.forEach(password => {
                            report += `- ${password}\n`;
                        });
                        report += '\n';
                    }
                    
                    if (creds.hashes && creds.hashes.length > 0) {
                        report += '**Hashes récupérés:**\n';
                        creds.hashes.forEach(hash => {
                            report += `- ${hash}\n`;
                        });
                        report += '\n';
                    }
                    
                    report += '---\n\n';
                }
            }
        }
        return report || 'Aucun credential documenté.';
    }

    analyzePasswordReuseText(credentials) {
        return `Analyse de réutilisation sur ${credentials.total} credentials:
- Comptes avec mots de passe identiques: Analyse en cours
- Patterns de réutilisation inter-systèmes: En cours d'évaluation`;
    }

    analyzePasswordWeaknessText(credentials) {
        return `Analyse des ${credentials.passwords} mots de passe récupérés:
- Mots de passe faibles détectés: En cours d'analyse
- Patterns communs identifiés: Évaluation en cours
- Recommandations de complexité: À définir`;
    }

    analyzeCredentialReuseText(credentials) {
        return `Analyse de réutilisation sur ${credentials.total} credentials:
- Comptes avec mots de passe identiques: Recherche en cours
- Patterns de réutilisation inter-systèmes: Analyse en cours`;
    }

    analyzeServiceAccountsText(data) {
        return `Analyse des comptes de service:
- Comptes de service identifiés: Recherche en cours
- Permissions élevées: Évaluation en cours
- Recommandations: Principe du moindre privilège`;
    }
} 