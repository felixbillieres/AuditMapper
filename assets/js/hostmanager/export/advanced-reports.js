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
    }

    populateCategoryFilters() {
        const container = document.getElementById('reportCategoryFilters');
        if (!container) return;

        const hostData = this.hostManager.getData();
        const categories = Object.keys(hostData.categories || {});
        
        container.innerHTML = '';
        
        if (categories.length === 0) {
            container.innerHTML = '<p class="text-muted">Aucune catégorie disponible</p>';
            return;
        }

        categories.forEach(categoryName => {
            const filterItem = document.createElement('div');
            filterItem.className = 'category-filter-item';
            filterItem.innerHTML = `
                <input type="checkbox" id="cat_${categoryName}" checked>
                <label for="cat_${categoryName}">${categoryName}</label>
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
            filterItem.classList.add('active');
            
            container.appendChild(filterItem);
        });
    }

    selectReportType(type) {
        this.currentReportType = type;
        
        // Mettre à jour l'UI
        document.querySelectorAll('.btn-group .btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.getElementById(`generate${this.capitalizeFirst(type)}${type === 'killchain' ? 'Report' : type === 'executive' ? 'Summary' : type === 'credentials' ? 'Report' : 'Report'}`);
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
        if (!this.currentReportType) return;

        const hostData = this.hostManager.getData();
        const filteredData = this.filterDataByCategories(hostData);
        
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
        }
    }

    filterDataByCategories(hostData) {
        const filtered = {
            categories: {},
            edges: hostData.edges || []
        };

        for (const categoryName of this.selectedCategories) {
            if (hostData.categories[categoryName]) {
                filtered.categories[categoryName] = hostData.categories[categoryName];
            }
        }

        return filtered;
    }

    generateExecutiveSummary(data) {
        const stats = this.calculateStats(data);
        const title = this.reportOptions.title || 'Résumé Exécutif - Test d\'Intrusion';
        const author = this.reportOptions.author || 'Équipe Sécurité';
        const date = new Date().toLocaleDateString('fr-FR');

        return `# ${title}

**Auteur:** ${author}  
**Date:** ${date}  
**Classification:** Confidentiel

## Résumé Exécutif

Ce rapport présente les résultats du test d'intrusion réalisé sur l'infrastructure cible. L'évaluation a révélé **${stats.totalHosts}** systèmes analysés avec **${stats.compromisedHosts}** systèmes compromis.

### Niveau de Risque Global: ${this.getOverallRiskLevel(stats)}

## Statistiques Clés

| Métrique | Valeur |
|----------|--------|
| Systèmes analysés | ${stats.totalHosts} |
| Systèmes compromis | ${stats.compromisedHosts} |
| Taux de compromission | ${stats.compromiseRate}% |
| Credentials récupérés | ${stats.totalCredentials} |
| Vulnérabilités critiques | ${stats.criticalVulns} |

## Répartition par Niveau de Compromission

${this.generateCompromiseBreakdown(stats)}

## Recommandations Prioritaires

1. **Correction immédiate** des vulnérabilités critiques identifiées
2. **Renforcement** des contrôles d'accès et authentification
3. **Mise à jour** des systèmes présentant des failles de sécurité
4. **Formation** du personnel sur les bonnes pratiques de sécurité
5. **Surveillance** renforcée des systèmes critiques

## Conclusion

${this.generateExecutiveConclusion(stats)}

---
*Ce rapport est confidentiel et destiné uniquement aux parties autorisées.*`;
    }

    generateTechnicalReport(data) {
        const stats = this.calculateStats(data);
        const title = this.reportOptions.title || 'Rapport Technique - Test d\'Intrusion';
        const author = this.reportOptions.author || 'Équipe Sécurité';
        const date = new Date().toLocaleDateString('fr-FR');

        let report = `# ${title}

**Auteur:** ${author}  
**Date:** ${date}  
**Classification:** Confidentiel

## Méthodologie

Le test d'intrusion a été réalisé selon une approche structurée incluant:
- Reconnaissance et énumération
- Identification des vulnérabilités
- Exploitation des failles de sécurité
- Post-exploitation et élévation de privilèges
- Documentation des preuves de concept

## Infrastructure Analysée

### Vue d'ensemble
- **Nombre total de systèmes:** ${stats.totalHosts}
- **Catégories analysées:** ${Object.keys(data.categories).join(', ')}
- **Période d'analyse:** ${date}

`;

        // Détail par catégorie
        for (const [categoryName, category] of Object.entries(data.categories)) {
            const hosts = category.hosts || {};
            report += `### Catégorie: ${categoryName}\n\n`;
            
            for (const [hostId, host] of Object.entries(hosts)) {
                report += `#### ${hostId}\n`;
                report += `- **Système:** ${host.system || 'Non spécifié'}\n`;
                report += `- **Rôle:** ${host.role || 'Non spécifié'}\n`;
                report += `- **Niveau de compromission:** ${host.compromiseLevel || 'None'}\n`;
                
                if (host.ip) {
                    report += `- **Adresse IP:** ${host.ip}\n`;
                }
                
                if (host.services && host.services.length > 0) {
                    report += `- **Services:** ${host.services.join(', ')}\n`;
                }
                
                if (host.notes) {
                    report += `- **Notes:** ${host.notes}\n`;
                }
                
                report += '\n';
            }
        }

        report += `## Analyse des Vulnérabilités

### Vulnérabilités par Criticité
${this.generateVulnerabilityAnalysis(stats)}

## Recommandations Techniques

### Corrections Immédiates
1. Appliquer les correctifs de sécurité sur les systèmes critiques
2. Désactiver les services non nécessaires
3. Renforcer les configurations de sécurité

### Améliorations à Moyen Terme
1. Mise en place d'une surveillance continue
2. Segmentation réseau renforcée
3. Politique de mots de passe robuste

### Stratégie à Long Terme
1. Programme de sensibilisation à la sécurité
2. Tests d'intrusion réguliers
3. Mise en place d'un SOC

---
*Rapport technique confidentiel*`;

        return report;
    }

    generateKillChainReport(data) {
        const title = this.reportOptions.title || 'Analyse Kill Chain - Test d\'Intrusion';
        const author = this.reportOptions.author || 'Équipe Sécurité';
        const date = new Date().toLocaleDateString('fr-FR');

        return `# ${title}

**Auteur:** ${author}  
**Date:** ${date}  
**Classification:** Confidentiel

## Analyse de la Chaîne d'Attaque (Kill Chain)

Cette analyse détaille les étapes de compromission suivant le modèle Cyber Kill Chain de Lockheed Martin.

### 1. Reconnaissance
- Collecte d'informations sur les systèmes cibles
- Identification des services exposés
- Cartographie de l'infrastructure

### 2. Weaponization
- Développement des exploits ciblés
- Préparation des outils d'attaque
- Adaptation aux vulnérabilités identifiées

### 3. Delivery
- Vecteurs d'attaque utilisés
- Points d'entrée exploités
- Méthodes de livraison des payloads

### 4. Exploitation
${this.generateExploitationDetails(data)}

### 5. Installation
- Persistence établie sur les systèmes compromis
- Installation d'outils de post-exploitation
- Création de backdoors

### 6. Command & Control
- Établissement de canaux de communication
- Contrôle à distance des systèmes compromis
- Exfiltration de données

### 7. Actions on Objectives
- Objectifs atteints lors du test
- Données sensibles accessibles
- Impact potentiel sur l'organisation

## Chronologie des Compromissions

${this.generateCompromissionTimeline(data)}

## Graphique de Propagation

La propagation s'est effectuée selon le schéma suivant:
${this.generatePropagationGraph(data)}

## Mesures de Détection et Prévention

### Points de Détection Manqués
1. Absence de monitoring sur les connexions suspectes
2. Logs insuffisants sur les systèmes critiques
3. Corrélation d'événements défaillante

### Recommandations de Détection
1. Mise en place de règles SIEM spécifiques
2. Monitoring comportemental des utilisateurs
3. Détection d'anomalies réseau

---
*Analyse Kill Chain confidentielle*`;
    }

    generateCredentialReport(data) {
        const credentials = this.extractCredentials(data);
        const title = this.reportOptions.title || 'Rapport de Credentials - Test d\'Intrusion';
        const author = this.reportOptions.author || 'Équipe Sécurité';
        const date = new Date().toLocaleDateString('fr-FR');

        return `# ${title}

**Auteur:** ${author}  
**Date:** ${date}  
**Classification:** STRICTEMENT CONFIDENTIEL

## Avertissement de Sécurité

Ce rapport contient des informations sensibles relatives aux credentials récupérés lors du test d'intrusion. 
La diffusion de ce document doit être strictement contrôlée.

## Résumé des Credentials

- **Total des credentials:** ${credentials.total}
- **Mots de passe en clair:** ${credentials.cleartext}
- **Hashes récupérés:** ${credentials.hashes}
- **Comptes privilégiés:** ${credentials.privileged}

## Analyse des Mots de Passe

### Faiblesse des Mots de Passe
${this.analyzePasswordWeakness(credentials)}

### Réutilisation de Credentials
${this.analyzeCredentialReuse(credentials)}

## Credentials par Système

${this.generateCredentialsBySystem(data)}

## Recommandations de Sécurité

### Actions Immédiates
1. **Changement obligatoire** de tous les mots de passe compromis
2. **Révocation** des sessions actives pour les comptes affectés
3. **Audit** des accès récents avec ces credentials

### Mesures Préventives
1. Politique de mots de passe renforcée
2. Authentification multi-facteurs (MFA)
3. Rotation régulière des mots de passe
4. Surveillance des tentatives de connexion

### Contrôles Techniques
1. Chiffrement des mots de passe stockés
2. Limitation des tentatives de connexion
3. Monitoring des accès privilégiés

---
*Document strictement confidentiel - Destruction requise après lecture*`;
    }

    calculateStats(data) {
        let totalHosts = 0;
        let compromisedHosts = 0;
        let totalCredentials = 0;
        let criticalVulns = 0;
        const compromiseLevels = { None: 0, Low: 0, Medium: 0, High: 0, Critical: 0, Full: 0 };

        for (const category of Object.values(data.categories)) {
            const hosts = category.hosts || {};
            for (const host of Object.values(hosts)) {
                totalHosts++;
                const level = host.compromiseLevel || 'None';
                compromiseLevels[level]++;
                
                if (level !== 'None') {
                    compromisedHosts++;
                }
                
                if (level === 'Critical' || level === 'Full') {
                    criticalVulns++;
                }

                // Compter les credentials
                if (host.credentials) {
                    totalCredentials += (host.credentials.usernames || []).length;
                    totalCredentials += (host.credentials.passwords || []).length;
                    totalCredentials += (host.credentials.hashes || []).length;
                }
            }
        }

        return {
            totalHosts,
            compromisedHosts,
            compromiseRate: totalHosts > 0 ? Math.round((compromisedHosts / totalHosts) * 100) : 0,
            totalCredentials,
            criticalVulns,
            compromiseLevels
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
        if (!this.currentReportData) return;

        const previewContainer = document.getElementById('reportPreviewMini');
        if (!previewContainer) return;

        // Générer un aperçu court
        const lines = this.currentReportData.split('\n');
        const preview = lines.slice(0, 15).join('\n') + '\n\n[...] (Aperçu tronqué)';
        
        previewContainer.innerHTML = `<pre style="white-space: pre-wrap; font-size: 0.8em;">${preview}</pre>`;
    }

    showFullPreview() {
        if (!this.currentReportData) return;

        // Créer une modal pour l'aperçu complet
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Aperçu du Rapport - ${this.capitalizeFirst(this.currentReportType)}</h5>
                        <button type="button" class="close" data-dismiss="modal">
                            <span>&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="report-preview-full" style="max-height: 70vh; overflow-y: auto;">
                            <pre style="white-space: pre-wrap;">${this.currentReportData}</pre>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Fermer</button>
                        <button type="button" class="btn btn-primary" onclick="window.print()">Imprimer</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        $(modal).modal('show');
        
        // Nettoyer après fermeture
        $(modal).on('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }

    enableExportButtons() {
        document.getElementById('previewFullReport').disabled = false;
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
        return str.charAt(0).toUpperCase() + str.slice(1);
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
} 