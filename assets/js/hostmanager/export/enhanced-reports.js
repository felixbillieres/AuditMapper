/**
 * Générateur de Rapports Avancés
 * Gère la nouvelle interface de rapports avec types multiples et personnalisation
 */

import { ReportGenerators } from './report-generators.js';

export class EnhancedReportGenerator {
    constructor(hostManager) {
        this.hostManager = hostManager;
        this.selectedReportType = null;
        this.reportConfig = {};
        this.currentReportData = '';
        this.reportStyles = this.initializeStyles();
        this.languageTemplates = this.initializeLanguageTemplates();
        this.templateService = {
            getTemplate: (key) => this.getTemplate(key)
        };
    }

    initialize() {
        console.log(">>> EnhancedReportGenerator.initialize: START");
        this.setupEventListeners();
        this.populateCategoryFilters();
        this.updateReportStats();
        console.log(">>> EnhancedReportGenerator.initialize: END");
    }

    setupEventListeners() {
        // Sélection des cartes de types de rapports
        const reportCards = document.querySelectorAll('.report-type-card');
        reportCards.forEach(card => {
            card.addEventListener('click', (e) => {
                this.selectReportType(card.dataset.type);
            });
        });

        // Bouton de génération principal
        const generateBtn = document.getElementById('generateSelectedReport');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateReport());
        }

        // Options qui déclenchent la mise à jour des stats
        const configInputs = document.querySelectorAll('#reportTitle, #reportAuthor, #reportClient, #reportStyle, #reportLanguage, #reportDetailLevel');
        configInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.updateReportConfig();
                this.updateReportStats();
            });
        });

        // Filtres de catégories
        document.addEventListener('change', (e) => {
            if (e.target.matches('.category-filter-checkbox')) {
                this.updateReportStats();
            }
        });

        // Boutons d'export
        document.getElementById('exportReportPdf')?.addEventListener('click', () => this.exportReport('pdf'));
        document.getElementById('exportReportMd')?.addEventListener('click', () => this.exportReport('markdown'));
        document.getElementById('exportReportHtml')?.addEventListener('click', () => this.exportReport('html'));
        document.getElementById('exportReportDocx')?.addEventListener('click', () => this.exportReport('docx'));

        // Aperçu et édition
        document.getElementById('previewFullReport')?.addEventListener('click', () => this.showFullPreview());
        document.getElementById('editReportManually')?.addEventListener('click', () => this.showManualEditor());
    }

    selectReportType(type) {
        // Désélectionner les autres cartes
        document.querySelectorAll('.report-type-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Sélectionner la carte actuelle
        const selectedCard = document.querySelector(`[data-type="${type}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }

        this.selectedReportType = type;
        this.updateReportConfig();
        this.updateReportStats();
        this.enableGenerationButtons();

        console.log(`Rapport sélectionné: ${type}`);
    }

    updateReportConfig() {
        this.reportConfig = {
            type: this.selectedReportType,
            title: document.getElementById('reportTitle')?.value || 'Rapport de Sécurité',
            author: document.getElementById('reportAuthor')?.value || 'Équipe Pentest',
            client: document.getElementById('reportClient')?.value || 'Client',
            style: document.getElementById('reportStyle')?.value || 'professional',
            language: document.getElementById('reportLanguage')?.value || 'fr',
            format: document.querySelector('input[name="reportFormat"]:checked')?.value || 'markdown',
            detailLevel: document.getElementById('reportDetailLevel')?.value || 'detailed',
            
            // Options spécifiques par type
            options: this.getTypeSpecificOptions(),
            
            // Options avancées
            includeTableOfContents: document.getElementById('includeTableOfContents')?.checked ?? true,
            includeExecutiveSummary: document.getElementById('includeExecutiveSummary')?.checked ?? true,
            includeRecommendations: document.getElementById('includeRecommendations')?.checked ?? true,
            includeTimeline: document.getElementById('includeTimeline')?.checked ?? false,
            includeMetrics: document.getElementById('includeMetrics')?.checked ?? true,
            includeAppendices: document.getElementById('includeAppendices')?.checked ?? false,
            
            // Catégories sélectionnées
            selectedCategories: this.getSelectedCategories()
        };
    }

    getTypeSpecificOptions() {
        const options = {};
        
        switch(this.selectedReportType) {
            case 'executive':
                options.includeRiskMatrix = document.querySelector('.risk-matrix-option[data-type="executive"]')?.checked ?? false;
                break;
            case 'technical':
                options.includeOutputs = document.querySelector('.include-outputs-option[data-type="technical"]')?.checked ?? true;
                options.includeScreenshots = document.querySelector('.include-screenshots-option[data-type="technical"]')?.checked ?? true;
                break;
            case 'killchain':
                options.mitreMapping = document.querySelector('.mitre-mapping-option[data-type="killchain"]')?.checked ?? true;
                break;
            case 'credentials':
                options.passwordAnalysis = document.querySelector('.password-analysis-option[data-type="credentials"]')?.checked ?? true;
                break;
            case 'infrastructure':
                options.networkDiagram = document.querySelector('.network-diagram-option[data-type="infrastructure"]')?.checked ?? true;
                break;
            case 'compliance':
                options.standard = document.querySelector('.compliance-standard-select[data-type="compliance"]')?.value ?? 'iso27001';
                break;
        }
        
        return options;
    }

    getSelectedCategories() {
        const checkboxes = document.querySelectorAll('.category-filter-checkbox:checked');
        return Array.from(checkboxes).map(cb => cb.value);
    }

    populateCategoryFilters() {
        const container = document.getElementById('reportCategoryFilters');
        if (!container) return;

        const categories = Object.keys(this.hostManager.hostData.categories || {});
        
        if (categories.length === 0) {
            container.innerHTML = '<p class="text-muted small">Aucune catégorie disponible</p>';
            return;
        }

        let html = '';
        categories.forEach(categoryName => {
            html += `
                <div class="category-filter-item">
                    <label class="form-check-label">
                        <input type="checkbox" class="category-filter-checkbox form-check-input" value="${categoryName}" checked>
                        ${categoryName}
                    </label>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    updateReportStats() {
        const stats = this.calculateReportStats();
        
        document.getElementById('reportStatsHosts').textContent = stats.totalHosts;
        document.getElementById('reportStatsVulns').textContent = stats.totalVulnerabilities;
        document.getElementById('reportStatsCreds').textContent = stats.totalCredentials;
        document.getElementById('reportStatsPages').textContent = stats.estimatedPages;
    }

    calculateReportStats() {
        const hostData = this.hostManager.hostData;
        const selectedCategories = this.getSelectedCategories();
        
        let totalHosts = 0;
        let totalVulnerabilities = 0;
        let totalCredentials = 0;
        let totalExploitationSteps = 0;

        for (const [categoryName, category] of Object.entries(hostData.categories || {})) {
            if (selectedCategories.length === 0 || selectedCategories.includes(categoryName)) {
                const hosts = Object.values(category.hosts || {});
                totalHosts += hosts.length;
                
                hosts.forEach(host => {
                    if (host.vulnerabilities) totalVulnerabilities += host.vulnerabilities.length;
                    if (host.credentials) totalCredentials += host.credentials.length;
                    if (host.exploitationSteps) totalExploitationSteps += host.exploitationSteps.length;
                });
            }
        }

        // Estimation du nombre de pages selon le type de rapport
        let estimatedPages = 2; // Base : page de titre + résumé
        
        switch(this.selectedReportType) {
            case 'executive':
                estimatedPages += Math.ceil(totalHosts / 5) + 2; // Vue d'ensemble + conclusions
                break;
            case 'technical':
                estimatedPages += totalHosts + Math.ceil(totalVulnerabilities / 2) + Math.ceil(totalExploitationSteps / 3);
                break;
            case 'killchain':
                estimatedPages += Math.ceil(totalExploitationSteps / 4) + 3; // Timeline + analyse
                break;
            case 'credentials':
                estimatedPages += Math.ceil(totalCredentials / 10) + 2; // Analyse + recommandations
                break;
            case 'infrastructure':
                estimatedPages += Math.ceil(totalHosts / 3) + 2; // Cartographie détaillée
                break;
            case 'compliance':
                estimatedPages += Math.ceil(totalHosts / 4) + 4; // Conformité détaillée
                break;
            default:
                estimatedPages += Math.ceil(totalHosts / 4) + 3;
        }

        return {
            totalHosts,
            totalVulnerabilities,
            totalCredentials,
            totalExploitationSteps,
            estimatedPages
        };
    }

    enableGenerationButtons() {
        const buttons = ['generateSelectedReport', 'previewFullReport', 'editReportManually', 
                        'exportReportPdf', 'exportReportMd', 'exportReportHtml', 'exportReportDocx'];
        
        buttons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.disabled = false;
            }
        });
    }

    async generateReport() {
        if (!this.selectedReportType) {
            alert('Veuillez sélectionner un type de rapport');
            return;
        }

        this.updateReportConfig();
        
        try {
            console.log('Génération du rapport:', this.reportConfig);
            
            // Afficher un indicateur de chargement
            this.showLoadingIndicator(true);
            
            // Créer l'instance du générateur spécialisé
            const generators = new ReportGenerators(this.hostManager, this.reportConfig, this.templateService);
            
            let reportContent = '';
            
            switch(this.selectedReportType) {
                case 'executive':
                    reportContent = await generators.generateExecutiveReport();
                    break;
                case 'technical':
                    reportContent = await generators.generateTechnicalReport();
                    break;
                case 'killchain':
                    reportContent = await generators.generateKillChainReport();
                    break;
                case 'credentials':
                    reportContent = await generators.generateCredentialsReport();
                    break;
                case 'infrastructure':
                    reportContent = await generators.generateInfrastructureReport();
                    break;
                case 'compliance':
                    reportContent = await generators.generateComplianceReport();
                    break;
                default:
                    throw new Error(`Type de rapport non supporté: ${this.selectedReportType}`);
            }
            
            this.currentReportData = reportContent;
            this.updatePreview(reportContent);
            
            console.log('Rapport généré avec succès');
            
        } catch (error) {
            console.error('Erreur lors de la génération du rapport:', error);
            alert('Erreur lors de la génération du rapport: ' + error.message);
        } finally {
            this.showLoadingIndicator(false);
        }
    }

    showLoadingIndicator(show) {
        const generateBtn = document.getElementById('generateSelectedReport');
        if (generateBtn) {
            if (show) {
                generateBtn.innerHTML = '⏳ Génération...';
                generateBtn.disabled = true;
            } else {
                generateBtn.innerHTML = '🚀 Générer le Rapport';
                generateBtn.disabled = false;
            }
        }
    }

    updatePreview(content) {
        const previewContainer = document.getElementById('reportPreviewMini');
        if (previewContainer) {
            // Afficher un aperçu tronqué
            const lines = content.split('\n').slice(0, 15);
            const previewText = lines.join('\n') + (content.split('\n').length > 15 ? '\n\n... (rapport complet disponible)' : '');
            
            previewContainer.innerHTML = `
                <div class="preview-content p-2">
                    <div class="text-center mb-2">
                        <small class="text-success">✅ Rapport généré avec succès</small>
                    </div>
                    <pre style="font-size: 0.7rem; margin: 0; white-space: pre-wrap; max-height: 200px; overflow-y: auto;">${this.escapeHtml(previewText)}</pre>
                </div>
            `;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ==================== EXPORT ET APERÇU ====================
    exportReport(format) {
        if (!this.currentReportData) {
            alert('Veuillez d\'abord générer un rapport');
            return;
        }

        const filename = this.generateFilename(format);
        
        try {
            switch(format) {
                case 'markdown':
                case 'md':
                    this.downloadAsFile(this.currentReportData, filename + '.md', 'text/markdown');
                    break;
                case 'html':
                    const htmlContent = this.convertMarkdownToHtml(this.currentReportData);
                    this.downloadAsFile(htmlContent, filename + '.html', 'text/html');
                    break;
                case 'pdf':
                    this.exportToPdf();
                    break;
                case 'docx':
                    alert('Export Word en cours de développement');
                    break;
                default:
                    console.error('Format non supporté:', format);
            }
        } catch (error) {
            console.error('Erreur lors de l\'export:', error);
            alert('Erreur lors de l\'export: ' + error.message);
        }
    }

    generateFilename(format) {
        const client = this.reportConfig.client.replace(/[^a-zA-Z0-9]/g, '_');
        const type = this.reportConfig.type;
        const date = new Date().toISOString().split('T')[0];
        return `${client}_${type}_report_${date}`;
    }

    downloadAsFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    convertMarkdownToHtml(markdown) {
        // Utiliser marked.js si disponible, sinon conversion basique
        if (typeof marked !== 'undefined') {
            const styleConfig = this.getStyleConfig();
            const customCss = this.generateCustomCss(styleConfig);
            
            return `<!DOCTYPE html>
<html lang="${this.reportConfig.language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.reportConfig.title}</title>
    <style>
        ${customCss}
    </style>
</head>
<body>
    ${marked.parse(markdown)}
</body>
</html>`;
        } else {
            // Conversion basique
            return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${this.reportConfig.title}</title>
</head>
<body>
    <pre>${this.escapeHtml(markdown)}</pre>
</body>
</html>`;
        }
    }

    generateCustomCss(styleConfig) {
        return `
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
            }
            h1, h2, h3, h4, h5, h6 {
                color: ${styleConfig.primaryColor};
                border-bottom: 2px solid ${styleConfig.primaryColor};
                padding-bottom: 5px;
            }
            table {
                border-collapse: collapse;
                width: 100%;
                margin: 20px 0;
            }
            th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
            }
            th {
                background-color: ${styleConfig.primaryColor};
                color: white;
            }
            code {
                background-color: #f4f4f4;
                padding: 2px 4px;
                border-radius: 3px;
            }
            pre {
                background-color: #f4f4f4;
                padding: 10px;
                border-radius: 5px;
                overflow-x: auto;
            }
            .risk-critical { color: ${styleConfig.dangerColor}; font-weight: bold; }
            .risk-high { color: #ff6b35; font-weight: bold; }
            .risk-medium { color: #ffa500; font-weight: bold; }
            .risk-low { color: ${styleConfig.accentColor}; font-weight: bold; }
        `;
    }

    exportToPdf() {
        if (typeof html2pdf === 'undefined') {
            alert('Bibliothèque PDF non disponible');
            return;
        }

        const htmlContent = this.convertMarkdownToHtml(this.currentReportData);
        const filename = this.generateFilename('pdf') + '.pdf';
        
        const opt = {
            margin: 1,
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(htmlContent).save();
    }

    showFullPreview() {
        // Si aucun rapport n'est généré, générer automatiquement
        if (!this.currentReportData && this.selectedReportType) {
            console.log('Génération automatique du rapport pour l\'aperçu...');
            this.generateReport().then(() => {
                if (this.currentReportData) {
                    this.showReportInModal();
                } else {
                    alert('Erreur lors de la génération automatique du rapport');
                }
            });
            return;
        }
        
        if (!this.currentReportData) {
            alert('Veuillez d\'abord sélectionner un type de rapport');
            return;
        }

        // Utiliser la modale existante ou créer une nouvelle fenêtre
        this.showReportInModal();
    }

    showReportInModal() {
        // Créer ou réutiliser la modale de rapport
        let modal = document.getElementById('fullReportModal');
        if (!modal) {
            modal = this.createReportModal();
        } else {
            // Mettre à jour le titre si la modale existe déjà
            const modalTitle = modal.querySelector('.modal-title');
            if (modalTitle) {
                modalTitle.textContent = `📊 Aperçu du Rapport - ${this.getReportTypeDisplayName()}`;
            }
        }

        // Mettre à jour le contenu
        const editorTextarea = modal.querySelector('#reportEditor');
        const previewDiv = modal.querySelector('#renderedPreview');
        
        if (editorTextarea) editorTextarea.value = this.currentReportData;
        if (previewDiv && typeof marked !== 'undefined') {
            // Appliquer le style personnalisé
            const styleConfig = this.getStyleConfig();
            const styledContent = this.applyStylesToContent(marked.parse(this.currentReportData), styleConfig);
            previewDiv.innerHTML = styledContent;
        } else if (previewDiv) {
            // Fallback sans marked.js
            previewDiv.innerHTML = `<pre style="white-space: pre-wrap; font-family: monospace;">${this.escapeHtml(this.currentReportData)}</pre>`;
        }

        // Afficher la modale
        if (typeof $ !== 'undefined' && $.fn.modal) {
            $(modal).modal('show');
        } else {
            // Fallback Bootstrap 5 ou vanilla JS
            modal.style.display = 'block';
            modal.classList.add('show');
            document.body.classList.add('modal-open');
        }
    }

    applyStylesToContent(htmlContent, styleConfig) {
        // Créer un conteneur avec les styles appliqués
        return `
            <div style="
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                padding: 20px;
            ">
                <style>
                    #renderedPreview h1, #renderedPreview h2, #renderedPreview h3, 
                    #renderedPreview h4, #renderedPreview h5, #renderedPreview h6 {
                        color: ${styleConfig.primaryColor} !important;
                        border-bottom: 2px solid ${styleConfig.primaryColor} !important;
                        padding-bottom: 5px !important;
                    }
                    #renderedPreview table {
                        border-collapse: collapse !important;
                        width: 100% !important;
                        margin: 20px 0 !important;
                    }
                    #renderedPreview th, #renderedPreview td {
                        border: 1px solid #ddd !important;
                        padding: 8px !important;
                        text-align: left !important;
                    }
                    #renderedPreview th {
                        background-color: ${styleConfig.primaryColor} !important;
                        color: white !important;
                    }
                    #renderedPreview code {
                        background-color: #f4f4f4 !important;
                        padding: 2px 4px !important;
                        border-radius: 3px !important;
                        color: ${styleConfig.secondaryColor} !important;
                    }
                    #renderedPreview pre {
                        background-color: #f4f4f4 !important;
                        padding: 10px !important;
                        border-radius: 5px !important;
                        overflow-x: auto !important;
                        border-left: 4px solid ${styleConfig.primaryColor} !important;
                    }
                    #renderedPreview .risk-critical { color: ${styleConfig.dangerColor} !important; font-weight: bold !important; }
                    #renderedPreview .risk-high { color: #ff6b35 !important; font-weight: bold !important; }
                    #renderedPreview .risk-medium { color: #ffa500 !important; font-weight: bold !important; }
                    #renderedPreview .risk-low { color: ${styleConfig.accentColor} !important; font-weight: bold !important; }
                    #renderedPreview strong { color: ${styleConfig.primaryColor} !important; }
                    #renderedPreview blockquote {
                        border-left: 4px solid ${styleConfig.accentColor} !important;
                        margin: 0 !important;
                        padding-left: 16px !important;
                        color: ${styleConfig.secondaryColor} !important;
                    }
                </style>
                ${htmlContent}
            </div>
        `;
    }

    getReportTypeDisplayName() {
        const names = {
            executive: 'Exécutif',
            technical: 'Technique',
            killchain: 'Kill Chain',
            credentials: 'Credentials',
            infrastructure: 'Infrastructure',
            compliance: 'Conformité'
        };
        return names[this.selectedReportType] || this.selectedReportType;
    }

    createReportModal() {
        const reportTypeDisplayName = this.getReportTypeDisplayName();
        
        const modalHtml = `
            <div class="modal fade" id="fullReportModal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">📊 Aperçu du Rapport - ${reportTypeDisplayName}</h5>
                            <div class="btn-group ml-auto mr-3">
                                <button type="button" id="modalExportPdf" class="btn btn-success btn-sm">📄 Export PDF</button>
                                <button type="button" id="modalExportMd" class="btn btn-info btn-sm">📝 Export MD</button>
                                <button type="button" id="modalExportHtml" class="btn btn-warning btn-sm">🌐 Export HTML</button>
                            </div>
                            <button type="button" class="close" data-dismiss="modal">
                                <span>&times;</span>
                            </button>
                        </div>
                        <div class="modal-body p-0">
                            <ul class="nav nav-tabs">
                                <li class="nav-item">
                                    <a class="nav-link" id="modalEditorTab" href="#">✏️ Éditeur</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link active" id="modalPreviewTab" href="#">👁️ Aperçu</a>
                                </li>
                            </ul>
                            
                            <div class="tab-content">
                                <textarea id="reportEditor" class="form-control" 
                                          style="display: none; height: 70vh; border: none; border-radius: 0; resize: none; font-family: 'Courier New', monospace;"
                                          placeholder="Le rapport sera affiché ici..."></textarea>
                                
                                <div id="renderedPreview" 
                                     style="height: 70vh; overflow-y: auto; border: none; background: white; padding: 0;">
                                    <div class="text-center text-muted p-5">
                                        <i class="fas fa-file-alt fa-3x mb-3"></i>
                                        <p>Chargement de l'aperçu...</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = document.getElementById('fullReportModal');

        // Ajouter les event listeners pour la modale
        this.setupModalEventListeners(modal);

        return modal;
    }

    setupModalEventListeners(modal) {
        // Onglets
        const editorTab = modal.querySelector('#modalEditorTab');
        const previewTab = modal.querySelector('#modalPreviewTab');
        const editorTextarea = modal.querySelector('#reportEditor');
        const previewDiv = modal.querySelector('#renderedPreview');

        editorTab?.addEventListener('click', (e) => {
            e.preventDefault();
            editorTab.classList.add('active');
            previewTab.classList.remove('active');
            editorTextarea.style.display = 'block';
            previewDiv.style.display = 'none';
        });

        previewTab?.addEventListener('click', (e) => {
            e.preventDefault();
            previewTab.classList.add('active');
            editorTab.classList.remove('active');
            previewDiv.style.display = 'block';
            editorTextarea.style.display = 'none';
        });

        // Boutons d'export dans la modale
        modal.querySelector('#modalExportPdf')?.addEventListener('click', () => this.exportReport('pdf'));
        modal.querySelector('#modalExportMd')?.addEventListener('click', () => this.exportReport('markdown'));
        modal.querySelector('#modalExportHtml')?.addEventListener('click', () => this.exportReport('html'));
    }

    showManualEditor() {
        // Si aucun rapport n'est généré, générer automatiquement
        if (!this.currentReportData && this.selectedReportType) {
            console.log('Génération automatique du rapport pour l\'éditeur...');
            this.generateReport().then(() => {
                if (this.currentReportData) {
                    this.showReportInModal();
                    // Basculer automatiquement vers l'onglet éditeur
                    setTimeout(() => {
                        const modal = document.getElementById('fullReportModal');
                        if (modal) {
                            const editorTab = modal.querySelector('#modalEditorTab');
                            if (editorTab) {
                                editorTab.click();
                            }
                        }
                    }, 100);
                } else {
                    alert('Erreur lors de la génération automatique du rapport');
                }
            });
            return;
        }

        if (!this.currentReportData) {
            alert('Veuillez d\'abord sélectionner un type de rapport');
            return;
        }

        this.showReportInModal();
        
        // Basculer automatiquement vers l'onglet éditeur
        setTimeout(() => {
            const modal = document.getElementById('fullReportModal');
            if (modal) {
                const editorTab = modal.querySelector('#modalEditorTab');
                if (editorTab) {
                    editorTab.click();
                }
            }
        }, 100);
    }

    initializeStyles() {
        return {
            professional: {
                primaryColor: '#007bff',
                secondaryColor: '#6c757d',
                accentColor: '#28a745',
                dangerColor: '#dc3545',
                headerStyle: 'professional'
            },
            security: {
                primaryColor: '#dc3545',
                secondaryColor: '#343a40',
                accentColor: '#ffc107',
                dangerColor: '#ff4444',
                headerStyle: 'security'
            },
            minimal: {
                primaryColor: '#000000',
                secondaryColor: '#666666',
                accentColor: '#333333',
                dangerColor: '#ff0000',
                headerStyle: 'minimal'
            },
            corporate: {
                primaryColor: '#28a745',
                secondaryColor: '#007bff',
                accentColor: '#17a2b8',
                dangerColor: '#dc3545',
                headerStyle: 'corporate'
            },
            cyberpunk: {
                primaryColor: '#8b5cf6',
                secondaryColor: '#10b981',
                accentColor: '#f59e0b',
                dangerColor: '#ef4444',
                headerStyle: 'cyberpunk'
            }
        };
    }

    initializeLanguageTemplates() {
        return {
            fr: {
                reportTitle: 'Rapport de Test d\'Intrusion',
                executiveSummary: 'Résumé Exécutif',
                technicalDetails: 'Détails Techniques',
                vulnerabilities: 'Vulnérabilités',
                recommendations: 'Recommandations',
                conclusion: 'Conclusion',
                tableOfContents: 'Table des Matières',
                riskLevel: 'Niveau de Risque',
                high: 'Élevé',
                medium: 'Moyen',
                low: 'Faible',
                critical: 'Critique',
                compromised: 'Compromis',
            },
            en: {
                reportTitle: 'Penetration Testing Report',
                executiveSummary: 'Executive Summary',
                technicalDetails: 'Technical Details',
                vulnerabilities: 'Vulnerabilities',
                recommendations: 'Recommendations',
                conclusion: 'Conclusion',
                tableOfContents: 'Table of Contents',
                riskLevel: 'Risk Level',
                high: 'High',
                medium: 'Medium',
                low: 'Low',
                critical: 'Critical',
                compromised: 'Compromised',
            },
            es: {
                reportTitle: 'Informe de Pruebas de Penetración',
                executiveSummary: 'Resumen Ejecutivo',
                technicalDetails: 'Detalles Técnicos',
                vulnerabilities: 'Vulnerabilidades',
                recommendations: 'Recomendaciones',
                conclusion: 'Conclusión',
                tableOfContents: 'Índice',
                riskLevel: 'Nivel de Riesgo',
                high: 'Alto',
                medium: 'Medio',
                low: 'Bajo',
                critical: 'Crítico',
                compromised: 'Comprometido',
            }
        };
    }

    getTemplate(key) {
        const lang = this.reportConfig.language || 'fr';
        return this.languageTemplates[lang][key] || this.languageTemplates['fr'][key] || key;
    }

    getStyleConfig() {
        return this.reportStyles[this.reportConfig.style] || this.reportStyles.professional;
    }
} 