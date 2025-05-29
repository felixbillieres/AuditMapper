/**
 * Gestionnaire de génération de rapports
 */

export class ReportGenerator {
    constructor(hostManager) {
        this.hostManager = hostManager;
    }

    initialize() {
        console.log(">>> ReportGenerator.initialize: START");
        this.setupEventListeners();
        console.log(">>> ReportGenerator.initialize: END");
    }

    setupEventListeners() {
        const generateKillchainBtn = document.getElementById('generateKillchainBtn');
        if (generateKillchainBtn) {
            generateKillchainBtn.addEventListener('click', () => this.generateKillchainReport());
        }

        // Événement pour mettre à jour l'aperçu quand on modifie l'éditeur
        const reportEditor = document.getElementById('reportEditor');
        if (reportEditor) {
            reportEditor.addEventListener('input', () => {
                this.updateReportPreview();
            });
        }

        // Boutons d'export
        const exportPdfBtn = document.getElementById('exportPdfBtn');
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', () => this.exportToPDF());
        }

        const exportMdBtn = document.getElementById('exportMdBtn');
        if (exportMdBtn) {
            exportMdBtn.addEventListener('click', () => this.exportToMarkdown());
        }

        // Onglets éditeur/aperçu
        const editorTab = document.getElementById('editorTab');
        const previewTab = document.getElementById('previewTab');
        
        if (editorTab) {
            editorTab.addEventListener('click', () => this.showEditorTab());
        }
        
        if (previewTab) {
            previewTab.addEventListener('click', () => this.showPreviewTab());
        }
    }

    showEditorTab() {
        document.getElementById('editorTab').classList.add('active');
        document.getElementById('previewTab').classList.remove('active');
        document.getElementById('reportEditor').style.display = 'block';
        document.getElementById('renderedPreview').style.display = 'none';
    }

    showPreviewTab() {
        document.getElementById('editorTab').classList.remove('active');
        document.getElementById('previewTab').classList.add('active');
        document.getElementById('reportEditor').style.display = 'none';
        document.getElementById('renderedPreview').style.display = 'block';
        
        // Mettre à jour l'aperçu
        this.updateReportPreview();
    }

    generateKillchainReport() {
        console.log(">>> generateKillchainReport: START");
        
        const hostData = this.hostManager.getData();
        let report = "# 🎯 Rapport d'Analyse Cyber Kill Chain\n\n";
        
        // Date et informations du rapport
        const now = new Date();
        report += `**Date du rapport :** ${now.toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })}\n\n`;
        report += `**Heure de génération :** ${now.toLocaleTimeString('fr-FR')}\n\n`;
        
        // Sommaire
        report += this.generateTableOfContents(hostData);
        
        // 1. Résumé Exécutif
        report += this.generateExecutiveSummary(hostData);
        
        // 2. Vue d'ensemble de la Kill Chain
        report += this.generateKillChainOverview(hostData);
        
        // 3. Analyse par catégorie et host
        report += this.generateHostAnalysis(hostData);
        
        // 4. Analyse détaillée par phase
        report += this.generateDetailedPhaseAnalysis(hostData);
        
        // 5. Découverte des identifiants
        report += this.generateCredentialsDiscovery(hostData);
        
        // 6. Cartographie des connexions
        report += this.generateNetworkMapping(hostData);
        
        // 7. Recommandations
        report += this.generateRecommendations(hostData);
        
        // 8. Annexes
        report += this.generateAnnexes(hostData);
        
        this.displayReport(report);
        console.log(">>> generateKillchainReport: END");
    }

    generateTableOfContents(hostData) {
        const totalHosts = this.getTotalHostsCount(hostData);
        const compromisedHosts = this.getCompromisedHostsCount(hostData);
        
        return `<div class="toc">

### 📋 Sommaire du Rapport

1. **📊 Résumé Exécutif**
   - Synthèse de l'attaque
   - Impacts identifiés
   - Niveau de risque global

2. **🔗 Vue d'ensemble de la Cyber Kill Chain**
   - Flux d'exploitation identifié
   - Phases identifiées

3. **🏢 Analyse par Infrastructure**
   - Systèmes par catégorie (${Object.keys(hostData.categories || {}).length} catégories)
   - Détail des ${totalHosts} systèmes analysés
   - ${compromisedHosts} systèmes compromis

4. **🔍 Analyse Détaillée par Phase**
   - Phase 1: Reconnaissance
   - Phase 2: Exploitation
   - Phase 3: Post-Exploitation
   - Phase 4: Objectifs

5. **🔑 Découverte des Identifiants**
   - ${this.getTotalCredentialsCount(hostData)} comptes découverts
   - Analyse des mots de passe
   - Recommandations

6. **🗺️ Cartographie des Connexions**
   - Diagramme de flux d'attaque
   - Points de pivot identifiés
   - Mouvement latéral

7. **✅ Recommandations**
   - Recommandations immédiates
   - Recommandations stratégiques

8. **📎 Annexes**
   - Liste complète des systèmes
   - Outils utilisés
   - Timeline des activités

</div>

---

`;
    }

    generateHostAnalysis(hostData) {
        let analysis = `## 🏢 Analyse par Infrastructure\n\n`;
        
        // Analyser chaque catégorie
        for (const categoryName in hostData.categories) {
            const category = hostData.categories[categoryName];
            const hosts = category.hosts || {};
            const hostCount = Object.keys(hosts).length;
            
            if (hostCount === 0) continue;
            
            analysis += `### 📁 Catégorie: ${categoryName}\n\n`;
            analysis += `**Nombre de systèmes :** ${hostCount}\n\n`;
            
            // Analyser chaque host de cette catégorie
            for (const hostId in hosts) {
                const host = hosts[hostId];
                analysis += this.generateSingleHostAnalysis(hostId, host, categoryName);
            }
            
            analysis += `---\n\n`;
        }
        
        return analysis;
    }

    generateSingleHostAnalysis(hostId, host, categoryName) {
        let analysis = `#### 💻 ${hostId}\n\n`;
        
        // Informations de base
        analysis += `**Catégorie :** ${categoryName}\n`;
        analysis += `**Système :** ${host.system || 'Non spécifié'}\n`;
        analysis += `**Rôle :** ${host.role || 'Non spécifié'}\n`;
        analysis += `**Zone :** ${host.zone || 'Non spécifiée'}\n`;
        
        // Niveau de compromission avec style
        const compromiseLevel = host.compromiseLevel || 'None';
        const compromiseIcon = {
            'None': '🟢',
            'Low': '🟡',
            'Medium': '🟠',
            'High': '🔴',
            'Critical': '⚫',
            'Full': '⚫'
        }[compromiseLevel] || '⚪';
        
        analysis += `**Niveau de compromission :** ${compromiseIcon} ${compromiseLevel}\n\n`;
        
        // Étapes d'exploitation pour ce host
        if (host.exploitationSteps && host.exploitationSteps.length > 0) {
            analysis += `**🛠️ Étapes d'exploitation (${host.exploitationSteps.length}) :**\n\n`;
            
            host.exploitationSteps
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .forEach((step, index) => {
                    analysis += `${index + 1}. **${step.title}**\n`;
                    if (step.tool) analysis += `   - 🔧 Outil: \`${step.tool}\`\n`;
                    if (step.cve) analysis += `   - 🚨 CVE: ${step.cve}\n`;
                    if (step.severity) {
                        const severityIcon = {
                            'Low': '🟢',
                            'Medium': '🟡',
                            'High': '🟠',
                            'Critical': '🔴'
                        }[step.severity] || '⚪';
                        analysis += `   - ${severityIcon} Sévérité: ${step.severity}\n`;
                    }
                    if (step.description) analysis += `   - 📝 ${step.description}\n`;
                    
                    // Ajouter les screenshots s'il y en a
                    if (step.screenshots && step.screenshots.length > 0) {
                        analysis += `   - 📸 Screenshots: ${step.screenshots.length} capture(s)\n`;
                        step.screenshots.forEach((screenshot, screenshotIndex) => {
                            analysis += `     ![Screenshot ${screenshotIndex + 1} - ${step.title}](${screenshot})\n`;
                        });
                    }
                    analysis += `\n`;
                });
        }
        
        // Identifiants découverts
        if (host.credentials && host.credentials.length > 0) {
            analysis += `**🔑 Identifiants découverts (${host.credentials.length}) :**\n\n`;
            host.credentials.forEach((cred, index) => {
                analysis += `${index + 1}. `;
                if (cred.username) analysis += `👤 **${cred.username}**`;
                if (cred.password) analysis += ` / 🔒 \`${cred.password}\``;
                if (cred.hash) analysis += ` / 🔐 Hash disponible`;
                if (cred.type) analysis += ` (${cred.type})`;
                analysis += `\n`;
            });
            analysis += `\n`;
        }
        
        // Notes
        if (host.notes) {
            analysis += `**📋 Notes :**\n${host.notes}\n\n`;
        }
        
        return analysis;
    }

    generateExecutiveSummary(hostData) {
        const totalHosts = this.getTotalHostsCount(hostData);
        const compromisedHosts = this.getCompromisedHostsCount(hostData);
        const totalCredentials = this.getTotalCredentialsCount(hostData);
        const criticalAssets = this.getCriticalAssetsCount(hostData);
        
        return `## 📊 Résumé Exécutif

### Synthèse de l'Attaque

Cette analyse présente la reconstitution complète d'une **Cyber Kill Chain** identifiée lors de l'évaluation de sécurité. L'attaque a permis de compromettre **${compromisedHosts}** systèmes sur **${totalHosts}** analysés, révélant des vulnérabilités critiques dans l'infrastructure.

### Impacts Identifiés

- **🎯 Systèmes compromis :** ${compromisedHosts}/${totalHosts}
- **🔑 Identifiants découverts :** ${totalCredentials} comptes uniques
- **⚠️ Actifs critiques affectés :** ${criticalAssets}
- **🔗 Vecteurs de mouvement latéral :** ${this.getLateralMovementCount(hostData)}

### Niveau de Risque Global : ${this.calculateOverallRisk(hostData)}

---

`;
    }

    generateKillChainOverview(hostData) {
        return `## 🔗 Vue d'ensemble de la Cyber Kill Chain

### Flux d'Exploitation Identifié

\`\`\`
🎯 RECONNAISSANCE → 🛠️ ARMEMENT → 📤 LIVRAISON → 💥 EXPLOITATION 
        ↓
🔧 INSTALLATION → 📡 C2 → 🎯 OBJECTIFS ATTEINTS
\`\`\`

### Phases Identifiées

${this.generatePhasesSummary(hostData)}

---

`;
    }

    generateDetailedPhaseAnalysis(hostData) {
        let analysis = `## 🔍 Analyse Détaillée par Phase de la Kill Chain\n\n`;
        
        // Organiser les données par phases
        const phases = this.organizeDataByPhases(hostData);
        
        phases.forEach((phase, index) => {
            analysis += `### Phase ${index + 1}: ${phase.name}\n\n`;
            analysis += `**Objectif :** ${phase.objective}\n\n`;
            
            if (phase.exploitationSteps && phase.exploitationSteps.length > 0) {
                analysis += `#### 🛠️ Étapes d'Exploitation\n\n`;
                phase.exploitationSteps.forEach((step, stepIndex) => {
                    analysis += this.formatExploitationStep(step, stepIndex + 1);
                });
            }
            
            if (phase.credentials && phase.credentials.length > 0) {
                analysis += `#### 🔑 Identifiants Découverts\n\n`;
                analysis += this.formatCredentialsTable(phase.credentials);
            }
            
            if (phase.connections && phase.connections.length > 0) {
                analysis += `#### 🔗 Connexions Établies\n\n`;
                phase.connections.forEach(conn => {
                    analysis += `- **${conn.from}** → **${conn.to}** ${conn.type ? `(${conn.type})` : ''}\n`;
                });
                analysis += '\n';
            }
            
            analysis += `---\n\n`;
        });
        
        return analysis;
    }

    formatExploitationStep(step, stepNumber) {
        let stepText = `**${stepNumber}. ${step.title}**\n\n`;
        
        if (step.description) {
            stepText += `*Description :* ${step.description}\n\n`;
        }
        
        if (step.tool) {
            stepText += `🔧 **Outil utilisé :** \`${step.tool}\`\n\n`;
        }
        
        if (step.command) {
            stepText += `💻 **Commande exécutée :**\n\`\`\`bash\n${step.command}\n\`\`\`\n\n`;
        }
        
        if (step.cve) {
            stepText += `🚨 **CVE exploitée :** ${step.cve}\n\n`;
        }
        
        if (step.severity) {
            const severityIcon = {
                'Low': '🟢',
                'Medium': '🟡', 
                'High': '🟠',
                'Critical': '🔴'
            }[step.severity] || '⚪';
            stepText += `${severityIcon} **Sévérité :** ${step.severity}\n\n`;
        }
        
        if (step.output) {
            stepText += `📄 **Résultat :**\n\`\`\`\n${step.output.substring(0, 500)}${step.output.length > 500 ? '...' : ''}\n\`\`\`\n\n`;
        }
        
        // Ajouter les screenshots s'ils existent
        if (step.screenshots && step.screenshots.length > 0) {
            stepText += `📸 **Captures d'écran :**\n\n`;
            step.screenshots.forEach((screenshot, index) => {
                stepText += `![Screenshot ${index + 1}](${screenshot})\n\n`;
            });
        } else if (step.screenshot) {
            stepText += `📸 **Capture d'écran :**\n\n![Screenshot](${step.screenshot})\n\n`;
        }
        
        if (step.notes) {
            stepText += `📝 **Notes :** ${step.notes}\n\n`;
        }
        
        stepText += `*Source :* ${step.host}\n\n`;
        
        return stepText;
    }

    generateCredentialsDiscovery(hostData) {
        let section = `## 🔑 Découverte des Identifiants\n\n`;
        
        const allCredentials = this.extractAllCredentials(hostData);
        
        if (allCredentials.length === 0) {
            section += `*Aucun identifiant découvert lors de cette analyse.*\n\n`;
            return section + `---\n\n`;
        }
        
        section += `### Synthèse des Identifiants\n\n`;
        section += `**Total des comptes découverts :** ${allCredentials.length}\n\n`;
        
        // Grouper par type
        const credentialsByType = this.groupCredentialsByType(allCredentials);
        
        Object.entries(credentialsByType).forEach(([type, creds]) => {
            const typeIcon = {
                'local': '👤',
                'domain': '🏢',
                'service': '⚙️', 
                'database': '🗄️',
                'ssh': '🔑',
                'ftp': '📁',
                'web': '🌐'
            }[type] || '🔑';
            
            section += `#### ${typeIcon} ${type || 'Général'} (${creds.length} comptes)\n\n`;
            section += `| Username | Password | Hash | Type | Source |\n`;
            section += `|----------|----------|------|------|--------|\n`;
            
            creds.forEach(cred => {
                const password = cred.password ? '🔒 [Disponible]' : '❌';
                const hash = cred.hash ? '🔐 [Disponible]' : '❌';
                const type = cred.type || 'N/A';
                section += `| \`${cred.username || 'N/A'}\` | ${password} | ${hash} | ${type} | ${cred.source || 'N/A'} |\n`;
            });
            
            section += `\n`;
        });
        
        return section + `---\n\n`;
    }

    generateNetworkMapping(hostData) {
        let section = `## 🗺️ Cartographie des Connexions et du Mouvement Latéral\n\n`;
        
        section += `### Diagramme de Flux d'Attaque\n\n`;
        section += `\`\`\`\n`;
        section += this.generateAsciiNetworkDiagram(hostData);
        section += `\`\`\`\n\n`;
        
        section += `### Analyse du Mouvement Latéral\n\n`;
        
        const connections = hostData.edges || [];
        if (connections.length > 0) {
            section += `#### 🔗 Connexions Identifiées\n\n`;
            connections.forEach((conn, index) => {
                section += `${index + 1}. **${conn.from}** → **${conn.to}**`;
                if (conn.type) section += ` (${conn.type})`;
                section += `\n`;
            });
            section += `\n`;
            
            // Identifier les pivots
            const pivots = this.identifyPivotPoints(hostData);
            if (pivots.length > 0) {
                section += `#### 🎯 Points de Pivot Identifiés\n\n`;
                pivots.forEach(pivot => {
                    section += `- **${pivot.host}** : ${pivot.inbound} connexions entrantes, ${pivot.outbound} connexions sortantes\n`;
                });
                section += `\n`;
            }
        } else {
            section += `*Aucune connexion latérale documentée.*\n\n`;
        }
        
        return section + `---\n\n`;
    }

    generateRecommendations(hostData) {
        let section = `## ✅ Recommandations\n\n`;
        
        const recommendations = this.generateSmartRecommendations(hostData);
        
        section += `### Recommandations Immédiates (Priorité Haute)\n\n`;
        recommendations.immediate.forEach((rec, index) => {
            section += `${index + 1}. **${rec.title}**\n`;
            section += `   - *Problème :* ${rec.issue}\n`;
            section += `   - *Solution :* ${rec.solution}\n`;
            section += `   - *Impact :* ${rec.impact}\n\n`;
        });
        
        section += `### Recommandations Stratégiques (Moyen Terme)\n\n`;
        recommendations.strategic.forEach((rec, index) => {
            section += `${index + 1}. **${rec.title}**\n`;
            section += `   - *Description :* ${rec.description}\n`;
            section += `   - *Bénéfice :* ${rec.benefit}\n\n`;
        });
        
        return section + `---\n\n`;
    }

    generateAnnexes(hostData) {
        let section = `## 📎 Annexes\n\n`;
        
        section += `### Annexe A : Liste Complète des Systèmes Analysés\n\n`;
        section += this.generateSystemsList(hostData);
        
        section += `### Annexe B : Outils Utilisés\n\n`;
        section += this.generateToolsList(hostData);
        
        section += `### Annexe C : Timeline des Activités\n\n`;
        section += this.generateTimeline(hostData);
        
        return section;
    }

    displayReport(report) {
        console.log(">>> displayReport: START");
        
        // Stocker le rapport pour l'export
        this.currentReport = report;
        
        // Afficher dans l'éditeur
        const reportEditor = document.getElementById('reportEditor');
        if (reportEditor) {
            reportEditor.value = report;
        }
        
        // Générer l'aperçu rendu immédiatement
        this.updateReportPreview();
        
        // Commencer par afficher l'aperçu par défaut
        this.showPreviewTab();
        
        // Afficher la modal
        const modal = document.getElementById('reportModal');
        if (modal) {
            if (window.$ && $.fn.modal) {
                $(modal).modal('show');
            } else {
                modal.style.display = 'block';
                modal.classList.add('show');
            }
        }
        
        console.log(">>> displayReport: END");
    }

    updateReportPreview() {
        const reportEditor = document.getElementById('reportEditor');
        const renderedPreview = document.getElementById('renderedPreview');
        
        if (reportEditor && renderedPreview) {
            let markdownContent = reportEditor.value;
            
            // Utiliser marked.js pour convertir le markdown en HTML
            let htmlContent;
            if (typeof marked !== 'undefined') {
                htmlContent = marked.parse(markdownContent);
            } else {
                // Fallback simple si marked n'est pas disponible
                htmlContent = this.simpleMarkdownToHtml(markdownContent);
            }
            
            // Améliorer le rendu des images pour les screenshots
            htmlContent = this.enhanceScreenshotRendering(htmlContent);
            
            // Ajouter des styles professionnels
            htmlContent = this.addProfessionalStyling(htmlContent);
            
            // Nettoyer le HTML si DOMPurify est disponible
            if (typeof DOMPurify !== 'undefined') {
                htmlContent = DOMPurify.sanitize(htmlContent);
            }
            
            // Injecter le contenu dans l'aperçu
            renderedPreview.innerHTML = htmlContent;
            
            // IMPORTANT: Rendre l'aperçu complètement non-éditable
            this.makePreviewReadOnly(renderedPreview);
        }
    }

    makePreviewReadOnly(previewElement) {
        // Désactiver toute interaction
        previewElement.style.pointerEvents = 'auto'; // Permettre le scroll et la sélection
        previewElement.style.userSelect = 'text'; // Permettre la sélection de texte
        previewElement.contentEditable = 'false'; // Empêcher l'édition
        
        // Désactiver l'édition sur tous les éléments enfants
        const allElements = previewElement.querySelectorAll('*');
        allElements.forEach(element => {
            element.contentEditable = 'false';
            element.style.outline = 'none';
            
            // Supprimer les événements d'édition
            element.removeAttribute('contenteditable');
            element.addEventListener('keydown', (e) => {
                e.preventDefault();
                return false;
            });
            element.addEventListener('input', (e) => {
                e.preventDefault();
                return false;
            });
        });
        
        // Empêcher le collage
        previewElement.addEventListener('paste', (e) => {
            e.preventDefault();
            return false;
        });
        
        // Empêcher les modifications par clavier
        previewElement.addEventListener('keydown', (e) => {
            // Permettre seulement la navigation et la sélection
            const allowedKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'];
            if (!allowedKeys.includes(e.key) && !e.ctrlKey) {
                e.preventDefault();
                return false;
            }
        });
    }

    simpleMarkdownToHtml(markdown) {
        return markdown
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
            .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*)\*/gim, '<em>$1</em>')
            .replace(/!\[([^\]]*)\]\(([^)]*)\)/gim, '<img alt="$1" src="$2">')
            .replace(/\[([^\]]*)\]\(([^)]*)\)/gim, '<a href="$2">$1</a>')
            .replace(/```([^`]*)```/gim, '<pre><code>$1</code></pre>')
            .replace(/`([^`]*)`/gim, '<code>$1</code>')
            .replace(/^\- (.*$)/gim, '<li>$1</li>')
            .replace(/\n/gim, '<br>');
    }

    enhanceScreenshotRendering(htmlContent) {
        // Remplacer les images par des éléments plus riches avec boutons fonctionnels
        htmlContent = htmlContent.replace(
            /<img ([^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*)>/g,
            (match, attrs, alt, src) => {
                return `
                    <div class="screenshot-container">
                        <div class="screenshot-header">
                            <span class="screenshot-title">📸 ${alt}</span>
                            <button type="button" class="screenshot-expand" onclick="hostManager.modules.reports.viewFullScreenshot('${src.replace(/'/g, "\\'")}')">
                                🔍 Agrandir
                            </button>
                        </div>
                        <img src="${src}" alt="${alt}" class="screenshot-image" onclick="hostManager.modules.reports.viewFullScreenshot('${src.replace(/'/g, "\\'")}')">
                    </div>
                `;
            }
        );
        
        return htmlContent;
    }

    addProfessionalStyling(htmlContent) {
        const styledContent = `
            <div class="killchain-report">
                <style>
                    .killchain-report {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #2c3e50 !important;
                        max-width: 100%;
                        margin: 0 auto;
                        background: white !important;
                        padding: 30px;
                        box-sizing: border-box;
                    }
                    
                    .killchain-report * {
                        color: inherit !important;
                    }
                    
                    .killchain-report h1 {
                        color: #2c3e50 !important;
                        border-bottom: 4px solid #e74c3c;
                        padding-bottom: 15px;
                        margin-bottom: 40px;
                        font-size: 2.5em;
                        font-weight: 700;
                        text-align: center;
                        page-break-after: avoid;
                    }
                    
                    .killchain-report h2 {
                        color: #34495e !important;
                        border-left: 5px solid #3498db;
                        padding-left: 20px;
                        margin-top: 40px;
                        margin-bottom: 25px;
                        font-size: 1.8em;
                        font-weight: 600;
                        page-break-after: avoid;
                        background: linear-gradient(90deg, #f8f9fa 0%, transparent 100%);
                        padding: 15px 20px;
                        border-radius: 0 8px 8px 0;
                    }
                    
                    .killchain-report h3 {
                        color: #2c3e50 !important;
                        margin-top: 30px;
                        margin-bottom: 20px;
                        font-size: 1.4em;
                        font-weight: 600;
                        border-bottom: 2px solid #ecf0f1;
                        padding-bottom: 8px;
                        page-break-after: avoid;
                    }
                    
                    .killchain-report h4 {
                        color: #34495e !important;
                        margin-top: 25px;
                        margin-bottom: 15px;
                        font-size: 1.2em;
                        font-weight: 600;
                        page-break-after: avoid;
                    }
                    
                    .killchain-report p {
                        color: #2c3e50 !important;
                        margin-bottom: 15px;
                        text-align: justify;
                        line-height: 1.7;
                    }
                    
                    .killchain-report table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                        background: white !important;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                        border-radius: 8px;
                        overflow: hidden;
                        page-break-inside: avoid;
                    }
                    
                    .killchain-report th {
                        background: #34495e !important;
                        color: white !important;
                        padding: 15px 12px;
                        text-align: left;
                        font-weight: 600;
                        border: none;
                    }
                    
                    .killchain-report td {
                        padding: 12px;
                        border-bottom: 1px solid #ecf0f1;
                        color: #2c3e50 !important;
                        vertical-align: top;
                    }
                    
                    .killchain-report tr:nth-child(even) {
                        background: #f8f9fa !important;
                    }
                    
                    .killchain-report tr:hover {
                        background: #e3f2fd !important;
                    }
                    
                    .killchain-report pre {
                        background: #2c3e50 !important;
                        color: #ecf0f1 !important;
                        border: 1px solid #34495e;
                        border-radius: 8px;
                        padding: 20px;
                        overflow-x: auto;
                        font-family: 'Courier New', monospace;
                        font-size: 0.9em;
                        line-height: 1.4;
                        page-break-inside: avoid;
                        margin: 20px 0;
                    }
                    
                    .killchain-report code {
                        background: #f1f3f4 !important;
                        color: #e74c3c !important;
                        padding: 3px 8px;
                        border-radius: 4px;
                        font-family: 'Courier New', monospace;
                        font-size: 0.9em;
                        font-weight: 600;
                    }
                    
                    .killchain-report blockquote {
                        border-left: 5px solid #f39c12;
                        background: #fef9e7 !important;
                        color: #2c3e50 !important;
                        padding: 20px 25px;
                        margin: 25px 0;
                        border-radius: 0 8px 8px 0;
                        font-style: italic;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    
                    .killchain-report .toc {
                        background: #f8f9fa !important;
                        border: 2px solid #dee2e6;
                        border-radius: 10px;
                        padding: 25px;
                        margin: 30px 0;
                        page-break-inside: avoid;
                    }
                    
                    .killchain-report .toc h3 {
                        color: #2c3e50 !important;
                        margin-top: 0;
                        text-align: center;
                        border-bottom: 2px solid #3498db;
                        padding-bottom: 10px;
                    }
                    
                    .killchain-report .toc ul {
                        list-style: none;
                        padding-left: 0;
                    }
                    
                    .killchain-report .toc li {
                        padding: 8px 0;
                        border-bottom: 1px dotted #bdc3c7;
                        display: flex;
                        justify-content: space-between;
                    }
                    
                    .killchain-report .toc li:last-child {
                        border-bottom: none;
                    }
                    
                    .killchain-report .toc a {
                        color: #3498db !important;
                        text-decoration: none;
                        font-weight: 500;
                    }
                    
                    .killchain-report .toc a:hover {
                        color: #2980b9 !important;
                        text-decoration: underline;
                    }
                    
                    .killchain-report .screenshot-container {
                        margin: 25px 0;
                        border: 2px solid #bdc3c7;
                        border-radius: 10px;
                        overflow: hidden;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                        page-break-inside: avoid;
                        background: white !important;
                    }
                    
                    .killchain-report .screenshot-header {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                        color: white !important;
                        padding: 15px 20px;
                        border-bottom: none;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    
                    .killchain-report .screenshot-title {
                        font-weight: 600;
                        color: white !important;
                        font-size: 1.1em;
                    }
                    
                    .killchain-report .screenshot-expand {
                        background: rgba(255,255,255,0.2) !important;
                        color: white !important;
                        border: 1px solid rgba(255,255,255,0.3);
                        padding: 8px 15px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 0.9em;
                        transition: all 0.3s ease;
                        font-weight: 500;
                    }
                    
                    .killchain-report .screenshot-expand:hover {
                        background: rgba(255,255,255,0.3) !important;
                        transform: translateY(-1px);
                    }
                    
                    .killchain-report .screenshot-image {
                        width: 100%;
                        max-width: 100%;
                        height: auto;
                        display: block;
                        cursor: pointer;
                        transition: opacity 0.3s ease;
                    }
                    
                    .killchain-report .screenshot-image:hover {
                        opacity: 0.95;
                    }
                    
                    .killchain-report ul, .killchain-report ol {
                        padding-left: 30px;
                        margin: 20px 0;
                    }
                    
                    .killchain-report li {
                        margin: 10px 0;
                        line-height: 1.6;
                        color: #2c3e50 !important;
                    }
                    
                    .killchain-report strong {
                        color: #2c3e50 !important;
                        font-weight: 700;
                    }
                    
                    .killchain-report em {
                        color: #7f8c8d !important;
                        font-style: italic;
                    }
                    
                    .killchain-report hr {
                        border: none;
                        height: 3px;
                        background: linear-gradient(to right, #3498db, #e74c3c, transparent);
                        margin: 40px 0;
                        border-radius: 2px;
                    }
                    
                    .killchain-report .risk-high {
                        background: #ffebee !important;
                        border-left: 5px solid #f44336;
                        padding: 15px;
                        margin: 15px 0;
                        border-radius: 0 8px 8px 0;
                    }
                    
                    .killchain-report .risk-medium {
                        background: #fff3e0 !important;
                        border-left: 5px solid #ff9800;
                        padding: 15px;
                        margin: 15px 0;
                        border-radius: 0 8px 8px 0;
                    }
                    
                    .killchain-report .risk-low {
                        background: #e8f5e8 !important;
                        border-left: 5px solid #4caf50;
                        padding: 15px;
                        margin: 15px 0;
                        border-radius: 0 8px 8px 0;
                    }
                    
                    /* Styles pour l'impression PDF */
                    @media print {
                        .killchain-report {
                            padding: 20px !important;
                            max-height: none !important;
                            overflow: visible !important;
                            background: white !important;
                            color: #2c3e50 !important;
                        }
                        
                        .killchain-report .screenshot-expand {
                            display: none !important;
                        }
                        
                        .killchain-report h1, .killchain-report h2, .killchain-report h3 {
                            page-break-after: avoid !important;
                        }
                        
                        .killchain-report .screenshot-container,
                        .killchain-report table,
                        .killchain-report .toc {
                            page-break-inside: avoid !important;
                        }
                        
                        .killchain-report pre {
                            page-break-inside: avoid !important;
                        }
                    }
                </style>
                ${htmlContent}
            </div>
        `;

        return styledContent;
    }

    viewFullScreenshot(imageSrc) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'screenshotViewModal';
        modal.innerHTML = `
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">📸 Capture d'écran</h5>
                        <button type="button" class="close" onclick="hostManager.modules.reports.closeScreenshotModal()">
                            <span>&times;</span>
                        </button>
                    </div>
                    <div class="modal-body text-center">
                        <img src="${imageSrc}" alt="Screenshot" style="max-width: 100%; max-height: 80vh; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="hostManager.modules.reports.closeScreenshotModal()">
                            Fermer
                        </button>
                        <a href="${imageSrc}" download class="btn btn-primary">
                            <i class="fas fa-download"></i> Télécharger
                        </a>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        if (window.$ && $.fn.modal) {
            $(modal).modal('show');
        } else {
            modal.style.display = 'block';
            modal.classList.add('show');
        }
    }

    closeScreenshotModal() {
        const modal = document.getElementById('screenshotViewModal');
        if (modal) {
            if (window.$ && $.fn.modal) {
                $(modal).modal('hide');
                $(modal).on('hidden.bs.modal', function() {
                    modal.remove();
                });
            } else {
                modal.remove();
            }
        }
    }

    exportToPDF() {
        if (!this.currentReport) {
            alert('Aucun rapport à exporter. Veuillez d\'abord générer un rapport.');
            return;
        }

        // Utiliser html2pdf si disponible
        if (typeof html2pdf !== 'undefined') {
            const renderedPreview = document.getElementById('renderedPreview');
            if (renderedPreview) {
                const opt = {
                    margin: [15, 15, 15, 15],
                    filename: `killchain-report-${new Date().toISOString().split('T')[0]}.pdf`,
                    image: { 
                        type: 'jpeg', 
                        quality: 0.95 
                    },
                    html2canvas: { 
                        scale: 1.5,
                        useCORS: true,
                        allowTaint: true,
                        scrollX: 0,
                        scrollY: 0,
                        letterRendering: true,
                        logging: false
                    },
                    jsPDF: { 
                        unit: 'mm', 
                        format: 'a4', 
                        orientation: 'portrait',
                        compress: true
                    },
                    pagebreak: { 
                        mode: ['avoid-all', 'css', 'legacy'],
                        before: '.page-break-before',
                        after: '.page-break-after',
                        avoid: ['h1', 'h2', 'h3', '.screenshot-container', 'table', '.toc']
                    }
                };

                // Cloner le contenu pour l'export
                const exportContent = renderedPreview.cloneNode(true);
                
                // Optimiser pour l'impression
                exportContent.style.pointerEvents = 'none';
                exportContent.style.height = 'auto';
                exportContent.style.maxHeight = 'none';
                exportContent.style.overflow = 'visible';
                
                // Masquer les boutons d'agrandissement
                exportContent.querySelectorAll('.screenshot-expand').forEach(btn => {
                    btn.style.display = 'none';
                });

                // Ajouter des sauts de page avant les sections principales
                exportContent.querySelectorAll('h2').forEach(h2 => {
                    h2.style.pageBreakBefore = 'always';
                    h2.style.marginTop = '0';
                });

                // Première section sans saut de page
                const firstH2 = exportContent.querySelector('h2');
                if (firstH2) {
                    firstH2.style.pageBreakBefore = 'auto';
                }

                html2pdf().set(opt).from(exportContent).save().then(() => {
                    console.log('PDF généré avec succès');
                }).catch(error => {
                    console.error('Erreur lors de la génération PDF:', error);
                    alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
                });
            }
        } else {
            alert('La bibliothèque html2pdf n\'est pas disponible. Veuillez recharger la page.');
        }
    }

    exportToMarkdown() {
        if (!this.currentReport) {
            alert('Aucun rapport à exporter. Veuillez d\'abord générer un rapport.');
            return;
        }

        const blob = new Blob([this.currentReport], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `killchain-report-${new Date().toISOString().split('T')[0]}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Méthodes utilitaires pour le calcul des métriques

    getTotalHostsCount(hostData) {
        let count = 0;
        for (const category in hostData.categories) {
            count += Object.keys(hostData.categories[category].hosts || {}).length;
        }
        return count;
    }

    getCompromisedHostsCount(hostData) {
        let count = 0;
        for (const category in hostData.categories) {
            const hosts = hostData.categories[category].hosts || {};
            for (const hostId in hosts) {
                const host = hosts[hostId];
                if (host.compromiseLevel && host.compromiseLevel !== 'None') {
                    count++;
                }
            }
        }
        return count;
    }

    getTotalCredentialsCount(hostData) {
        let count = 0;
        for (const category in hostData.categories) {
            const hosts = hostData.categories[category].hosts || {};
            for (const hostId in hosts) {
                const host = hosts[hostId];
                count += (host.credentials || []).length;
            }
        }
        return count;
    }

    extractAllCredentials(hostData) {
        const allCredentials = [];
        for (const category in hostData.categories) {
            const hosts = hostData.categories[category].hosts || {};
            for (const hostId in hosts) {
                const host = hosts[hostId];
                if (host.credentials) {
                    host.credentials.forEach(cred => {
                        allCredentials.push({
                            ...cred,
                            source: hostId
                        });
                    });
                }
            }
        }
        return allCredentials;
    }

    organizeDataByPhases(hostData) {
        const phases = [
            { name: 'Reconnaissance', objective: 'Collecte d\'informations sur les cibles', exploitationSteps: [], credentials: [], connections: [] },
            { name: 'Exploitation', objective: 'Exploitation des vulnérabilités identifiées', exploitationSteps: [], credentials: [], connections: [] },
            { name: 'Post-Exploitation', objective: 'Maintien de l\'accès et mouvement latéral', exploitationSteps: [], credentials: [], connections: [] },
            { name: 'Objectifs', objective: 'Atteinte des objectifs finaux', exploitationSteps: [], credentials: [], connections: [] }
        ];

        // Organiser les étapes d'exploitation par phase basée sur les outils et techniques
        for (const category in hostData.categories) {
            const hosts = hostData.categories[category].hosts || {};
            for (const hostId in hosts) {
                const host = hosts[hostId];
                
                if (host.exploitationSteps) {
                    host.exploitationSteps.forEach(step => {
                        const phase = this.categorizeExploitationStep(step);
                        phases[phase].exploitationSteps.push({
                            ...step,
                            host: hostId
                        });
                    });
                }
                
                if (host.credentials) {
                    // Les credentials sont généralement découverts en post-exploitation
                    phases[2].credentials.push(...host.credentials.map(cred => ({
                        ...cred,
                        source: hostId
                    })));
                }
            }
        }

        // Ajouter les connexions
        if (hostData.edges) {
            hostData.edges.forEach(edge => {
                phases[2].connections.push(edge); // Mouvement latéral = post-exploitation
            });
        }

        return phases.filter(phase => 
            phase.exploitationSteps.length > 0 || 
            phase.credentials.length > 0 || 
            phase.connections.length > 0
        );
    }

    categorizeExploitationStep(step) {
        const tool = (step.tool || '').toLowerCase();
        const title = (step.title || '').toLowerCase();
        const command = (step.command || '').toLowerCase();
        
        // Reconnaissance
        if (tool.includes('nmap') || tool.includes('enum') || title.includes('scan') || title.includes('recon')) {
            return 0;
        }
        
        // Post-exploitation
        if (tool.includes('mimikatz') || tool.includes('bloodhound') || title.includes('lateral') || title.includes('persistence')) {
            return 2;
        }
        
        // Objectifs
        if (title.includes('exfiltration') || title.includes('dump') || title.includes('backup')) {
            return 3;
        }
        
        // Par défaut : Exploitation
        return 1;
    }

    generateAsciiNetworkDiagram(hostData) {
        let diagram = 'INFRASTRUCTURE COMPROMISE FLOW:\n\n';
        
        // Identifier le point d'entrée (système le moins compromis ou externe)
        const entryPoint = this.identifyEntryPoint(hostData);
        if (entryPoint) {
            diagram += `[INTERNET] --> [${entryPoint}] (Point d'entrée)\n`;
        }
        
        // Ajouter les connexions
        if (hostData.edges) {
            hostData.edges.forEach(edge => {
                diagram += `[${edge.from}] --> [${edge.to}]\n`;
            });
        }
        
        return diagram;
    }

    generateSmartRecommendations(hostData) {
        const immediate = [];
        const strategic = [];
        
        // Analyser les vulnérabilités et générer des recommandations intelligentes
        const issues = this.analyzeSecurityIssues(hostData);
        
        if (issues.weakCredentials > 0) {
            immediate.push({
                title: 'Renforcement de la Politique de Mots de Passe',
                issue: `${issues.weakCredentials} comptes avec des mots de passe faibles détectés`,
                solution: 'Implémenter une politique de mots de passe complexes et MFA',
                impact: 'Réduction significative du risque de compromission'
            });
        }
        
        if (issues.lateralMovement > 0) {
            immediate.push({
                title: 'Segmentation Réseau',
                issue: `${issues.lateralMovement} chemins de mouvement latéral identifiés`,
                solution: 'Implémenter une segmentation réseau et des contrôles d\'accès stricts',
                impact: 'Limitation de la propagation des attaques'
            });
        }
        
        strategic.push({
            title: 'Programme de Surveillance Continue',
            description: 'Mise en place d\'un SOC et d\'outils de détection avancés',
            benefit: 'Détection précoce des tentatives d\'intrusion'
        });
        
        return { immediate, strategic };
    }

    // Méthodes utilitaires manquantes

    getCriticalAssetsCount(hostData) {
        let count = 0;
        for (const category in hostData.categories) {
            const hosts = hostData.categories[category].hosts || {};
            for (const hostId in hosts) {
                const host = hosts[hostId];
                // Considérer comme critique si compromis à un niveau élevé ou rôle critique
                if ((host.compromiseLevel && ['High', 'Critical', 'Full'].includes(host.compromiseLevel)) ||
                    (host.role && ['DC', 'Server', 'Database', 'Critical'].some(role => 
                        host.role.toLowerCase().includes(role.toLowerCase())))) {
                    count++;
                }
            }
        }
        return count;
    }

    getLateralMovementCount(hostData) {
        return (hostData.edges || []).length;
    }

    calculateOverallRisk(hostData) {
        const compromisedHosts = this.getCompromisedHostsCount(hostData);
        const totalHosts = this.getTotalHostsCount(hostData);
        const criticalAssets = this.getCriticalAssetsCount(hostData);
        const lateralMovement = this.getLateralMovementCount(hostData);
        
        if (criticalAssets > 0 || compromisedHosts / totalHosts > 0.7) {
            return '🔴 **CRITIQUE**';
        } else if (compromisedHosts / totalHosts > 0.3 || lateralMovement > 3) {
            return '🟠 **ÉLEVÉ**';
        } else if (compromisedHosts > 0) {
            return '🟡 **MOYEN**';
        }
        return '🟢 **FAIBLE**';
    }

    generatePhasesSummary(hostData) {
        const phases = this.organizeDataByPhases(hostData);
        let summary = '';
        
        phases.forEach((phase, index) => {
            const stepCount = phase.exploitationSteps.length;
            const credCount = phase.credentials.length;
            const connCount = phase.connections.length;
            
            summary += `**${index + 1}. ${phase.name}**\n`;
            summary += `- ${stepCount} étapes d'exploitation\n`;
            summary += `- ${credCount} identifiants découverts\n`;
            summary += `- ${connCount} connexions établies\n\n`;
        });
        
        return summary;
    }

    formatCredentialsTable(credentials) {
        if (!credentials || credentials.length === 0) {
            return '*Aucun identifiant découvert dans cette phase.*\n\n';
        }
        
        let table = `| Username | Password | Hash | Type | Source |\n`;
        table += `|----------|----------|------|------|--------|\n`;
        
        credentials.forEach(cred => {
            const password = cred.password ? '🔒 [Disponible]' : '❌';
            const hash = cred.hash ? '🔐 [Disponible]' : '❌';
            const type = cred.type || 'N/A';
            
            table += `| \`${cred.username || 'N/A'}\` | ${password} | ${hash} | ${type} | ${cred.source || 'N/A'} |\n`;
        });
        
        return table + '\n';
    }

    groupCredentialsByType(credentials) {
        const grouped = {};
        
        credentials.forEach(cred => {
            const type = cred.type || 'general';
            if (!grouped[type]) {
                grouped[type] = [];
            }
            grouped[type].push(cred);
        });
        
        return grouped;
    }

    identifyPivotPoints(hostData) {
        const pivots = [];
        const connectionCounts = {};
        
        // Compter les connexions entrantes et sortantes pour chaque host
        if (hostData.edges) {
            hostData.edges.forEach(edge => {
                // Connexions sortantes
                if (!connectionCounts[edge.from]) {
                    connectionCounts[edge.from] = { inbound: 0, outbound: 0 };
                }
                connectionCounts[edge.from].outbound++;
                
                // Connexions entrantes
                if (!connectionCounts[edge.to]) {
                    connectionCounts[edge.to] = { inbound: 0, outbound: 0 };
                }
                connectionCounts[edge.to].inbound++;
            });
        }
        
        // Identifier les pivots (hosts avec plusieurs connexions)
        Object.entries(connectionCounts).forEach(([host, counts]) => {
            if (counts.inbound + counts.outbound > 1) {
                pivots.push({
                    host,
                    inbound: counts.inbound,
                    outbound: counts.outbound
                });
            }
        });
        
        return pivots.sort((a, b) => (b.inbound + b.outbound) - (a.inbound + a.outbound));
    }

    identifyEntryPoint(hostData) {
        // Chercher un host avec des connexions sortantes mais peu/pas de connexions entrantes
        const connectionCounts = {};
        
        if (hostData.edges) {
            hostData.edges.forEach(edge => {
                if (!connectionCounts[edge.from]) {
                    connectionCounts[edge.from] = { inbound: 0, outbound: 0 };
                }
                if (!connectionCounts[edge.to]) {
                    connectionCounts[edge.to] = { inbound: 0, outbound: 0 };
                }
                
                connectionCounts[edge.from].outbound++;
                connectionCounts[edge.to].inbound++;
            });
            
            // Trouver le host avec le plus de connexions sortantes et le moins d'entrantes
            let entryPoint = null;
            let bestScore = -1;
            
            Object.entries(connectionCounts).forEach(([host, counts]) => {
                const score = counts.outbound - counts.inbound;
                if (score > bestScore) {
                    bestScore = score;
                    entryPoint = host;
                }
            });
            
            return entryPoint;
        }
        
        // Fallback: retourner le premier host trouvé
        for (const category in hostData.categories) {
            const hosts = hostData.categories[category].hosts || {};
            const hostIds = Object.keys(hosts);
            if (hostIds.length > 0) {
                return hostIds[0];
            }
        }
        
        return null;
    }

    analyzeSecurityIssues(hostData) {
        const issues = {
            weakCredentials: 0,
            lateralMovement: 0,
            unpatched: 0,
            privilegeEscalation: 0
        };
        
        // Analyser les credentials faibles
        for (const category in hostData.categories) {
            const hosts = hostData.categories[category].hosts || {};
            for (const hostId in hosts) {
                const host = hosts[hostId];
                if (host.credentials) {
                    host.credentials.forEach(cred => {
                        if (cred.password && (
                            cred.password.length < 8 ||
                            ['password', '123456', 'admin', 'root'].includes(cred.password.toLowerCase())
                        )) {
                            issues.weakCredentials++;
                        }
                    });
                }
                
                // Analyser les étapes d'exploitation pour identifier les problèmes
                if (host.exploitationSteps) {
                    host.exploitationSteps.forEach(step => {
                        if (step.title.toLowerCase().includes('lateral') || 
                            step.tool && step.tool.toLowerCase().includes('psexec')) {
                            issues.lateralMovement++;
                        }
                        
                        if (step.cve) {
                            issues.unpatched++;
                        }
                        
                        if (step.title.toLowerCase().includes('privilege') || 
                            step.tool && step.tool.toLowerCase().includes('mimikatz')) {
                            issues.privilegeEscalation++;
                        }
                    });
                }
            }
        }
        
        return issues;
    }

    generateSystemsList(hostData) {
        let list = `| Système | Catégorie | Rôle | Niveau de Compromission | Identifiants | Étapes |\n`;
        list += `|---------|-----------|------|------------------------|--------------|--------|\n`;
        
        for (const category in hostData.categories) {
            const hosts = hostData.categories[category].hosts || {};
            for (const hostId in hosts) {
                const host = hosts[hostId];
                const credCount = (host.credentials || []).length;
                const stepCount = (host.exploitationSteps || []).length;
                const compromiseIcon = {
                    'None': '🟢',
                    'Low': '🟡',
                    'Medium': '🟠',
                    'High': '🔴',
                    'Critical': '⚫',
                    'Full': '⚫'
                }[host.compromiseLevel] || '⚪';
                
                list += `| ${hostId} | ${category} | ${host.role || 'N/A'} | ${compromiseIcon} ${host.compromiseLevel || 'None'} | ${credCount} | ${stepCount} |\n`;
            }
        }
        
        return list + '\n';
    }

    generateToolsList(hostData) {
        const tools = new Set();
        
        for (const category in hostData.categories) {
            const hosts = hostData.categories[category].hosts || {};
            for (const hostId in hosts) {
                const host = hosts[hostId];
                if (host.exploitationSteps) {
                    host.exploitationSteps.forEach(step => {
                        if (step.tool) {
                            tools.add(step.tool);
                        }
                    });
                }
            }
        }
        
        let list = '';
        Array.from(tools).sort().forEach((tool, index) => {
            list += `${index + 1}. **${tool}**\n`;
        });
        
        return list + '\n';
    }

    generateTimeline(hostData) {
        const events = [];
        
        for (const category in hostData.categories) {
            const hosts = hostData.categories[category].hosts || {};
            for (const hostId in hosts) {
                const host = hosts[hostId];
                if (host.exploitationSteps) {
                    host.exploitationSteps.forEach(step => {
                        if (step.timestamp) {
                            events.push({
                                timestamp: step.timestamp,
                                host: hostId,
                                action: step.title,
                                tool: step.tool
                            });
                        }
                    });
                }
            }
        }
        
        // Trier par timestamp
        events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        let timeline = '';
        events.forEach((event, index) => {
            const date = new Date(event.timestamp).toLocaleString('fr-FR');
            timeline += `${index + 1}. **${date}** - ${event.host}: ${event.action}`;
            if (event.tool) timeline += ` (${event.tool})`;
            timeline += '\n';
        });
        
        return timeline || '*Aucune donnée de timeline disponible.*\n';
    }
} 