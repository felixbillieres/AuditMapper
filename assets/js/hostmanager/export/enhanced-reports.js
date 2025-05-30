/**
 * Générateur de Rapports Avancés
 * Gère la nouvelle interface de rapports avec types multiples et personnalisation
 */

export class EnhancedReportGenerator {
    constructor(hostManager) {
        this.hostManager = hostManager;
        this.selectedReportType = null;
        this.reportConfig = {};
        this.currentReportData = '';
        this.reportStyles = this.initializeStyles();
        this.languageTemplates = this.initializeLanguageTemplates();
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
            
            let reportContent = '';
            
            switch(this.selectedReportType) {
                case 'executive':
                    reportContent = await this.generateExecutiveReport();
                    break;
                case 'technical':
                    reportContent = await this.generateTechnicalReport();
                    break;
                case 'killchain':
                    reportContent = await this.generateKillChainReport();
                    break;
                case 'credentials':
                    reportContent = await this.generateCredentialsReport();
                    break;
                case 'infrastructure':
                    reportContent = await this.generateInfrastructureReport();
                    break;
                case 'compliance':
                    reportContent = await this.generateComplianceReport();
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
            const lines = content.split('\n').slice(0, 10);
            const previewText = lines.join('\n') + (content.split('\n').length > 10 ? '\n...' : '');
            
            previewContainer.innerHTML = `
                <div class="preview-content p-2">
                    <pre style="font-size: 0.7rem; margin: 0; white-space: pre-wrap;">${previewText}</pre>
                </div>
            `;
        }
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
                // ... plus de traductions
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
                // ... more translations
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
                // ... más traducciones
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

    // Les méthodes de génération spécifiques seront implémentées dans la prochaine partie
    async generateExecutiveReport() {
        // À implémenter
        return "# Executive Report\n\nRapport exécutif à implémenter...";
    }

    async generateTechnicalReport() {
        // À implémenter  
        return "# Technical Report\n\nRapport technique à implémenter...";
    }

    async generateKillChainReport() {
        // À implémenter
        return "# Kill Chain Report\n\nRapport kill chain à implémenter...";
    }

    async generateCredentialsReport() {
        // À implémenter
        return "# Credentials Report\n\nRapport credentials à implémenter...";
    }

    async generateInfrastructureReport() {
        // À implémenter
        return "# Infrastructure Report\n\nRapport infrastructure à implémenter...";
    }

    async generateComplianceReport() {
        // À implémenter
        return "# Compliance Report\n\nRapport conformité à implémenter...";
    }

    // Méthodes d'export et d'aperçu à implémenter
    exportReport(format) {
        console.log(`Export rapport en format: ${format}`);
        // À implémenter
    }

    showFullPreview() {
        console.log('Affichage aperçu complet');
        // À implémenter
    }

    showManualEditor() {
        console.log('Affichage éditeur manuel');
        // À implémenter
    }
} 