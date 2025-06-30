/**
 * Générateurs Spécialisés de Rapports
 * Contient la logique spécifique pour chaque type de rapport
 */

export class ReportGenerators {
    constructor(hostManager, config, templateService) {
        this.hostManager = hostManager;
        this.config = config;
        this.templateService = templateService;
    }

    // ==================== RAPPORT EXÉCUTIF ====================
    async generateExecutiveReport() {
        const data = this.extractExecutiveData();
        let content = '';

        // En-tête du rapport
        content += this.generateReportHeader();
        
        if (this.config.includeTableOfContents) {
            content += this.generateTableOfContents(['executive-summary', 'risk-overview', 'key-findings', 'recommendations', 'conclusion']);
        }

        // Résumé exécutif
        content += `\n## ${this.templateService.getTemplate('executiveSummary')}\n\n`;
        content += this.generateExecutiveSummary(data);

        // Vue d'ensemble des risques
        content += `\n## Vue d'Ensemble des Risques\n\n`;
        content += this.generateRiskOverview(data);

        // Matrice de risques si demandée
        if (this.config.options.includeRiskMatrix) {
            content += `\n## Matrice de Risques\n\n`;
            content += this.generateRiskMatrix(data);
        }

        // Principales découvertes
        content += `\n## Principales Découvertes\n\n`;
        content += this.generateKeyFindings(data);

        // Recommandations prioritaires
        if (this.config.includeRecommendations) {
            content += `\n## ${this.templateService.getTemplate('recommendations')}\n\n`;
            content += this.generatePriorityRecommendations(data);
        }

        // Conclusion
        content += `\n## ${this.templateService.getTemplate('conclusion')}\n\n`;
        content += this.generateExecutiveConclusion(data);

        return content;
    }

    generateExecutiveSummary(data) {
        const { totalHosts, compromisedHosts, criticalVulns, totalCredentials } = data;
        const compromiseRate = ((compromisedHosts / totalHosts) * 100).toFixed(1);
        
        return `Cette évaluation de sécurité a porté sur **${totalHosts} systèmes** répartis dans ${data.totalCategories} zones réseau.

**Résultats clés :**
- **${compromisedHosts}/${totalHosts}** systèmes compromis (${compromiseRate}%)
- **${criticalVulns}** vulnérabilités critiques identifiées
- **${totalCredentials}** credentials récupérés
- **${data.totalExploitationSteps}** étapes d'exploitation documentées

Le niveau de risque global est évalué à **${this.calculateOverallRisk(data)}**.

### Impact Business
${this.generateBusinessImpact(data)}

### Actions Prioritaires
${this.generateImmediateActions(data)}`;
    }

    generateRiskOverview(data) {
        const riskCategories = this.categorizeRisks(data);
        
        let content = `| Niveau de Risque | Nombre | Systèmes Affectés | Impact |\n`;
        content += `|------------------|---------|-------------------|--------|\n`;
        
        ['Critique', 'Élevé', 'Moyen', 'Faible'].forEach(level => {
            const risks = riskCategories[level] || [];
            content += `| ${level} | ${risks.length} | ${risks.map(r => r.system).join(', ') || 'Aucun'} | ${this.getRiskImpact(level)} |\n`;
        });

        return content;
    }

    generateRiskMatrix(data) {
        return `\`\`\`
    Impact
      │   │   │ C │
    É ├───┼───┼───┤
    l │   │ M │ C │
    e ├───┼───┼───┤
    v │ F │ M │ É │
    é └───┴───┴───┘
        Probabilité →
    
Légende: F=Faible, M=Moyen, É=Élevé, C=Critique
\`\`\`

${this.generateRiskMatrixAnalysis(data)}`;
    }

    // ==================== RAPPORT TECHNIQUE ====================
    async generateTechnicalReport() {
        const data = this.extractTechnicalData();
        let content = '';

        content += this.generateReportHeader();
        
        if (this.config.includeTableOfContents) {
            content += this.generateTableOfContents(['methodology', 'scope', 'findings', 'exploitation', 'evidence']);
        }

        // Méthodologie
        content += `\n## Méthodologie\n\n`;
        content += this.generateMethodology();

        // Périmètre
        content += `\n## Périmètre de l'Audit\n\n`;
        content += this.generateScope(data);

        // Découvertes techniques détaillées
        content += `\n## Découvertes Techniques\n\n`;
        content += await this.generateDetailedFindings(data);

        // Exploitation et post-exploitation
        content += `\n## Chaîne d'Exploitation\n\n`;
        content += await this.generateExploitationChain(data);

        // Preuves techniques
        if (this.config.options.includeOutputs || this.config.options.includeScreenshots) {
            content += `\n## Preuves Techniques\n\n`;
            content += await this.generateTechnicalEvidence(data);
        }

        return content;
    }

    async generateDetailedFindings(data) {
        let content = '';

        for (const [categoryName, category] of Object.entries(data.categorizedData)) {
            content += `\n### ${categoryName}\n\n`;
            
            for (const host of Object.values(category.hosts)) {
                content += `#### ${host.ipName} - ${host.system || 'Système Non Spécifié'}\n\n`;
                
                // Informations du système
                content += `**Informations système :**\n`;
                content += `- **IP/Nom :** ${host.ipName}\n`;
                content += `- **OS/Type :** ${host.system || 'Non déterminé'}\n`;
                content += `- **Rôle :** ${host.role || 'Non spécifié'}\n`;
                content += `- **Zone :** ${host.zone || 'Non spécifiée'}\n`;
                content += `- **Niveau de compromission :** ${host.compromiseLevel || 'None'}\n\n`;

                // Services
                if (host.services) {
                    content += `**Services identifiés :**\n`;
                    host.services.split(',').forEach(service => {
                        content += `- ${service.trim()}\n`;
                    });
                    content += '\n';
                }

                // Vulnérabilités
                if (host.vulnerabilities && host.vulnerabilities.length > 0) {
                    content += `**Vulnérabilités :**\n`;
                    host.vulnerabilities.forEach(vuln => {
                        content += `- **${vuln}**\n`;
                    });
                    content += '\n';
                }

                // Techniques d'exploitation
                if (host.techniques && host.techniques.length > 0) {
                    content += `**Techniques d'exploitation :**\n`;
                    host.techniques.forEach(tech => {
                        content += `- ${tech}\n`;
                    });
                    content += '\n';
                }

                // Credentials trouvés
                if (host.credentials && host.credentials.length > 0) {
                    content += `**Credentials découverts :**\n`;
                    host.credentials.forEach(cred => {
                        content += `- **${cred.username}** (Type: ${cred.type || 'Non spécifié'})\n`;
                    });
                    content += '\n';
                }
            }
        }

        return content;
    }

    // ==================== RAPPORT KILL CHAIN ====================
    async generateKillChainReport() {
        const data = this.extractKillChainData();
        let content = '';

        content += this.generateReportHeader();
        
        if (this.config.includeTableOfContents) {
            content += this.generateTableOfContents(['kill-chain-overview', 'timeline', 'tactics', 'techniques', 'mitre-mapping']);
        }

        // Vue d'ensemble de la Kill Chain
        content += `\n## Vue d'Ensemble de la Kill Chain\n\n`;
        content += this.generateKillChainOverview(data);

        // Timeline des activités
        if (this.config.includeTimeline) {
            content += `\n## Timeline des Activités\n\n`;
            content += this.generateActivityTimeline(data);
        }

        // Analyse par phase MITRE ATT&CK
        if (this.config.options.mitreMapping) {
            content += `\n## Mapping MITRE ATT&CK\n\n`;
            content += this.generateMitreMapping(data);
        }

        // Chaîne d'exploitation détaillée
        content += `\n## Chaîne d'Exploitation Détaillée\n\n`;
        content += await this.generateDetailedExploitationChain(data);

        return content;
    }

    generateKillChainOverview(data) {
        const phases = ['Reconnaissance', 'Initial Access', 'Execution', 'Persistence', 'Privilege Escalation', 'Defense Evasion', 'Credential Access', 'Discovery', 'Lateral Movement', 'Collection', 'Exfiltration'];
        
        let content = `Cette section présente la chaîne d'attaque (Kill Chain) développée durant l'audit.\n\n`;
        content += `**Phases couvertes :** ${data.phasesUsed.length}/${phases.length}\n\n`;
        
        content += `| Phase | Techniques Utilisées | Systèmes Ciblés |\n`;
        content += `|-------|---------------------|------------------|\n`;
        
        phases.forEach(phase => {
            const phaseData = data.phaseBreakdown[phase] || {};
            content += `| ${phase} | ${phaseData.techniques?.length || 0} | ${phaseData.systems?.length || 0} |\n`;
        });

        return content;
    }

    generateMitreMapping(data) {
        let content = `### Techniques MITRE ATT&CK Utilisées\n\n`;
        
        const mitreMap = this.buildMitreMapping(data);
        
        for (const [tactic, techniques] of Object.entries(mitreMap)) {
            content += `#### ${tactic}\n\n`;
            techniques.forEach(tech => {
                content += `- **${tech.id}** - ${tech.name}\n`;
                content += `  - Systèmes: ${tech.systems.join(', ')}\n`;
                content += `  - Succès: ${tech.success ? '✅' : '❌'}\n\n`;
            });
        }

        return content;
    }

    // ==================== RAPPORT CREDENTIALS ====================
    async generateCredentialsReport() {
        const data = this.extractCredentialsData();
        let content = '';

        content += this.generateReportHeader();
        
        if (this.config.includeTableOfContents) {
            content += this.generateTableOfContents(['credentials-summary', 'password-analysis', 'reuse-analysis', 'recommendations']);
        }

        // Résumé des credentials
        content += `\n## Résumé des Credentials\n\n`;
        content += this.generateCredentialsSummary(data);

        // Analyse des mots de passe
        if (this.config.options.passwordAnalysis) {
            content += `\n## Analyse des Mots de Passe\n\n`;
            content += this.generatePasswordAnalysis(data);
        }

        // Analyse de réutilisation
        content += `\n## Analyse de Réutilisation\n\n`;
        content += this.generateReuseAnalysis(data);

        // Recommandations spécifiques
        content += `\n## Recommandations Spécifiques\n\n`;
        content += this.generateCredentialsRecommendations(data);

        return content;
    }

    generateCredentialsSummary(data) {
        let content = `**Total des credentials découverts :** ${data.totalCredentials}\n\n`;
        
        content += `| Type | Nombre | Pourcentage |\n`;
        content += `|------|--------|--------------|\n`;
        
        for (const [type, count] of Object.entries(data.credentialsByType)) {
            const percentage = ((count / data.totalCredentials) * 100).toFixed(1);
            content += `| ${type} | ${count} | ${percentage}% |\n`;
        }

        content += `\n**Sources principales :**\n`;
        for (const [source, count] of Object.entries(data.credentialsBySources)) {
            content += `- ${source}: ${count} credentials\n`;
        }

        return content;
    }

    generatePasswordAnalysis(data) {
        let content = `### Analyse de Complexité\n\n`;
        
        content += `| Critère | Nombre | Pourcentage |\n`;
        content += `|---------|--------|--------------|\n`;
        content += `| Mots de passe faibles | ${data.weakPasswords} | ${((data.weakPasswords / data.totalPasswords) * 100).toFixed(1)}% |\n`;
        content += `| Mots de passe par défaut | ${data.defaultPasswords} | ${((data.defaultPasswords / data.totalPasswords) * 100).toFixed(1)}% |\n`;
        content += `| Mots de passe réutilisés | ${data.reusedPasswords} | ${((data.reusedPasswords / data.totalPasswords) * 100).toFixed(1)}% |\n`;

        content += `\n### Motifs Identifiés\n\n`;
        data.passwordPatterns.forEach(pattern => {
            content += `- **${pattern.pattern}**: ${pattern.count} occurrences\n`;
        });

        return content;
    }

    // ==================== RAPPORT INFRASTRUCTURE ====================
    async generateInfrastructureReport() {
        const data = this.extractInfrastructureData();
        let content = '';

        content += this.generateReportHeader();
        
        if (this.config.includeTableOfContents) {
            content += this.generateTableOfContents(['network-topology', 'systems-inventory', 'connectivity', 'zones-analysis']);
        }

        // Topologie réseau
        content += `\n## Topologie Réseau\n\n`;
        content += this.generateNetworkTopology(data);

        // Inventaire des systèmes
        content += `\n## Inventaire des Systèmes\n\n`;
        content += this.generateSystemsInventory(data);

        // Analyse de connectivité
        content += `\n## Analyse de Connectivité\n\n`;
        content += this.generateConnectivityAnalysis(data);

        // Diagramme réseau si demandé
        if (this.config.options.networkDiagram) {
            content += `\n## Diagramme Réseau\n\n`;
            content += this.generateNetworkDiagram(data);
        }

        return content;
    }

    // ==================== RAPPORT CONFORMITÉ ====================
    async generateComplianceReport() {
        const data = this.extractComplianceData();
        let content = '';

        content += this.generateReportHeader();
        
        if (this.config.includeTableOfContents) {
            content += this.generateTableOfContents(['compliance-overview', 'controls-assessment', 'gaps-analysis', 'remediation-plan']);
        }

        // Vue d'ensemble de conformité
        content += `\n## Vue d'Ensemble de Conformité\n\n`;
        content += this.generateComplianceOverview(data);

        // Évaluation des contrôles
        content += `\n## Évaluation des Contrôles\n\n`;
        content += this.generateControlsAssessment(data);

        // Analyse des écarts
        content += `\n## Analyse des Écarts\n\n`;
        content += this.generateGapsAnalysis(data);

        // Plan de remédiation
        content += `\n## Plan de Remédiation\n\n`;
        content += this.generateRemediationPlan(data);

        return content;
    }

    // ==================== MÉTHODES UTILITAIRES ====================
    generateReportHeader() {
        const now = new Date();
        const dateStr = now.toLocaleDateString(this.config.language === 'en' ? 'en-US' : 'fr-FR');
        
        return `# ${this.config.title}

**Client :** ${this.config.client}  
**Auteur(s) :** ${this.config.author}  
**Date :** ${dateStr}  
**Type :** ${this.getReportTypeLabel()}  
**Version :** 1.0  

---

`;
    }

    generateTableOfContents(sections) {
        let content = `\n## ${this.templateService.getTemplate('tableOfContents')}\n\n`;
        
        sections.forEach((section, index) => {
            content += `${index + 1}. [${this.getSectionTitle(section)}](#${section})\n`;
        });
        
        return content + '\n';
    }

    getReportTypeLabel() {
        // Toujours retourner le label du rapport technique
        return 'Rapport Technique';
    }

    // ==================== EXTRACTION DE DONNÉES ====================
    extractExecutiveData() {
        const hostData = this.hostManager.hostData;
        const selectedCategories = this.config.selectedCategories;
        
        let totalHosts = 0;
        let compromisedHosts = 0;
        let criticalVulns = 0;
        let totalCredentials = 0;
        let totalExploitationSteps = 0;

        for (const [categoryName, category] of Object.entries(hostData.categories || {})) {
            if (selectedCategories.length === 0 || selectedCategories.includes(categoryName)) {
                const hosts = Object.values(category.hosts || {});
                totalHosts += hosts.length;
                
                hosts.forEach(host => {
                    if (host.compromiseLevel && host.compromiseLevel !== 'None') {
                        compromisedHosts++;
                    }
                    if (host.vulnerabilities) {
                        criticalVulns += host.vulnerabilities.filter(v => 
                            v.toLowerCase().includes('critical') || 
                            v.toLowerCase().includes('critique')
                        ).length;
                    }
                    if (host.credentials) totalCredentials += host.credentials.length;
                    if (host.exploitationSteps) totalExploitationSteps += host.exploitationSteps.length;
                });
            }
        }

        return {
            totalHosts,
            compromisedHosts,
            criticalVulns,
            totalCredentials,
            totalExploitationSteps,
            totalCategories: selectedCategories.length || Object.keys(hostData.categories || {}).length
        };
    }

    extractTechnicalData() {
        const hostData = this.hostManager.hostData;
        const selectedCategories = this.config.selectedCategories;
        
        const categorizedData = {};
        
        for (const [categoryName, category] of Object.entries(hostData.categories || {})) {
            if (selectedCategories.length === 0 || selectedCategories.includes(categoryName)) {
                categorizedData[categoryName] = category;
            }
        }

        return { categorizedData };
    }

    extractKillChainData() {
        // Logique d'extraction pour kill chain
        return this.extractTechnicalData();
    }

    extractCredentialsData() {
        const hostData = this.hostManager.hostData;
        const selectedCategories = this.config.selectedCategories;
        
        let allCredentials = [];
        const credentialsByType = {};
        const credentialsBySources = {};

        for (const [categoryName, category] of Object.entries(hostData.categories || {})) {
            if (selectedCategories.length === 0 || selectedCategories.includes(categoryName)) {
                for (const host of Object.values(category.hosts || {})) {
                    if (host.credentials) {
                        host.credentials.forEach(cred => {
                            allCredentials.push({
                                ...cred,
                                source: host.ipName,
                                category: categoryName
                            });
                            
                            credentialsByType[cred.type || 'Unknown'] = (credentialsByType[cred.type || 'Unknown'] || 0) + 1;
                            credentialsBySources[host.ipName] = (credentialsBySources[host.ipName] || 0) + 1;
                        });
                    }
                }
            }
        }

        // Analyse des mots de passe
        const passwords = allCredentials.filter(c => c.password).map(c => c.password);
        const weakPasswords = passwords.filter(p => this.isWeakPassword(p)).length;
        const defaultPasswords = passwords.filter(p => this.isDefaultPassword(p)).length;
        const reusedPasswords = this.countReusedPasswords(passwords);
        const passwordPatterns = this.analyzePasswordPatterns(passwords);

        return {
            totalCredentials: allCredentials.length,
            credentialsByType,
            credentialsBySources,
            totalPasswords: passwords.length,
            weakPasswords,
            defaultPasswords,
            reusedPasswords,
            passwordPatterns,
            allCredentials
        };
    }

    extractInfrastructureData() {
        return this.extractTechnicalData();
    }

    extractComplianceData() {
        const standard = this.config.options.standard;
        // Logique spécifique selon le standard (ISO 27001, NIST, etc.)
        return this.extractTechnicalData();
    }

    // ==================== MÉTHODES D'ANALYSE ====================
    calculateOverallRisk(data) {
        const riskScore = (data.compromisedHosts / data.totalHosts) * 0.4 + 
                         (data.criticalVulns / data.totalHosts) * 0.6;
        
        if (riskScore > 0.8) return 'Critique';
        if (riskScore > 0.6) return 'Élevé';
        if (riskScore > 0.3) return 'Moyen';
        return 'Faible';
    }

    isWeakPassword(password) {
        return password.length < 8 || 
               !/[A-Z]/.test(password) || 
               !/[a-z]/.test(password) || 
               !/[0-9]/.test(password);
    }

    isDefaultPassword(password) {
        const defaultPasswords = ['password', 'admin', '123456', 'password123', 'administrator'];
        return defaultPasswords.includes(password.toLowerCase());
    }

    countReusedPasswords(passwords) {
        const passwordCounts = {};
        passwords.forEach(p => {
            passwordCounts[p] = (passwordCounts[p] || 0) + 1;
        });
        return Object.values(passwordCounts).filter(count => count > 1).length;
    }

    analyzePasswordPatterns(passwords) {
        const patterns = [];
        // Logique d'analyse des motifs de mots de passe
        return patterns;
    }

    // Autres méthodes utilitaires...
    generateBusinessImpact(data) {
        return "L'impact business inclut les risques d'exfiltration de données, d'interruption de service et de compromission de l'intégrité système.";
    }

    generateImmediateActions(data) {
        return "1. Correction des vulnérabilités critiques\n2. Révocation des credentials compromis\n3. Renforcement de la surveillance";
    }

    categorizeRisks(data) {
        // Logique de catégorisation des risques
        return { 'Critique': [], 'Élevé': [], 'Moyen': [], 'Faible': [] };
    }

    getRiskImpact(level) {
        const impacts = {
            'Critique': 'Impact majeur sur l\'activité',
            'Élevé': 'Impact significatif',
            'Moyen': 'Impact modéré',
            'Faible': 'Impact limité'
        };
        return impacts[level] || 'Impact à déterminer';
    }

    generateRiskMatrixAnalysis(data) {
        return "La matrice de risques ci-dessus positionne les vulnérabilités selon leur probabilité d'exploitation et leur impact potentiel.";
    }

    getSectionTitle(section) {
        const titles = {
            'executive-summary': 'Résumé Exécutif',
            'risk-overview': 'Vue d\'Ensemble des Risques',
            'key-findings': 'Principales Découvertes',
            'recommendations': 'Recommandations',
            'conclusion': 'Conclusion',
            'methodology': 'Méthodologie',
            'scope': 'Périmètre',
            'findings': 'Découvertes',
            'exploitation': 'Exploitation',
            'evidence': 'Preuves'
        };
        return titles[section] || section;
    }

    // Méthodes à compléter selon les besoins...
    generateKeyFindings(data) {
        let content = '';
        
        const findings = this.extractKeyFindings(data);
        
        content += `### 🔍 Vulnérabilités Critiques\n\n`;
        if (findings.criticalVulns.length > 0) {
            findings.criticalVulns.forEach((vuln, index) => {
                content += `${index + 1}. **${vuln.vulnerability}** - ${vuln.host}\n`;
                content += `   - Niveau: Critique\n`;
                content += `   - Impact: ${vuln.impact}\n\n`;
            });
        } else {
            content += `Aucune vulnérabilité critique identifiée.\n\n`;
        }

        content += `### 🚨 Systèmes Hautement Compromis\n\n`;
        if (findings.highCompromiseSystems.length > 0) {
            findings.highCompromiseSystems.forEach((system, index) => {
                content += `${index + 1}. **${system.host}** (${system.level})\n`;
                content += `   - Catégorie: ${system.category}\n`;
                content += `   - Techniques: ${system.techniques.join(', ')}\n\n`;
            });
        } else {
            content += `Aucun système hautement compromis.\n\n`;
        }

        content += `### 🔑 Credentials Sensibles\n\n`;
        if (findings.sensitiveCredentials.length > 0) {
            findings.sensitiveCredentials.forEach((cred, index) => {
                content += `${index + 1}. **${cred.username}** - ${cred.source}\n`;
                content += `   - Type: ${cred.type}\n`;
                content += `   - Criticité: ${cred.criticality}\n\n`;
            });
        } else {
            content += `Aucun credential particulièrement sensible identifié.\n\n`;
        }

        return content;
    }

    generatePriorityRecommendations(data) {
        const recommendations = this.generateSmartRecommendations(data);
        
        let content = `### 🏆 Recommandations Prioritaires (TOP 5)\n\n`;
        
        recommendations.slice(0, 5).forEach((rec, index) => {
            content += `#### ${index + 1}. ${rec.title}\n\n`;
            content += `**Priorité:** ${rec.priority}\n`;
            content += `**Effort:** ${rec.effort}\n`;
            content += `**Impact:** ${rec.impact}\n\n`;
            content += `${rec.description}\n\n`;
            
            if (rec.steps && rec.steps.length > 0) {
                content += `**Étapes d'implémentation :**\n`;
                rec.steps.forEach((step, stepIndex) => {
                    content += `${stepIndex + 1}. ${step}\n`;
                });
                content += '\n';
            }
        });

        return content;
    }

    generateExecutiveConclusion(data) {
        const riskLevel = this.calculateOverallRisk(data);
        const { totalHosts, compromisedHosts, criticalVulns, totalCredentials } = data;
        
        let content = `### Synthèse de l'Évaluation\n\n`;
        
        content += `L'audit de sécurité révèle un niveau de risque **${riskLevel}** pour l'infrastructure évaluée. `;
        
        if (riskLevel === 'Critique' || riskLevel === 'Élevé') {
            content += `Des actions correctives immédiates sont nécessaires pour réduire l'exposition aux cybermenaces.\n\n`;
        } else if (riskLevel === 'Moyen') {
            content += `Des améliorations significatives de la posture de sécurité sont recommandées.\n\n`;
        } else {
            content += `La posture de sécurité est globalement satisfaisante avec quelques points d'amélioration.\n\n`;
        }

        content += `### Points d'Attention Majeurs\n\n`;
        
        if (compromisedHosts > 0) {
            content += `- **Compromission système :** ${compromisedHosts} système(s) compromis nécessitent une investigation approfondie\n`;
        }
        
        if (criticalVulns > 0) {
            content += `- **Vulnérabilités critiques :** ${criticalVulns} vulnérabilité(s) à corriger en priorité\n`;
        }
        
        if (totalCredentials > 10) {
            content += `- **Exposition credentials :** ${totalCredentials} credentials découverts indiquent une fuite potentielle\n`;
        }

        content += `\n### Prochaines Étapes\n\n`;
        content += `1. **Immédiat (0-7 jours) :** Correction des vulnérabilités critiques et révocation des credentials compromis\n`;
        content += `2. **Court terme (1-4 semaines) :** Implémentation des recommandations de sécurité prioritaires\n`;
        content += `3. **Moyen terme (1-3 mois) :** Renforcement de l'architecture de sécurité et formation des équipes\n`;
        content += `4. **Long terme (3-6 mois) :** Mise en place d'un programme de sécurité continu et d'audit régulier\n\n`;

        return content;
    }

    generateMethodology() {
        return `### Approche Méthodologique\n\n` +
        `L'audit de sécurité a été conduit selon une approche structurée en plusieurs phases :\n\n` +
        `#### 1. Reconnaissance Passive\n` +
        `- Collecte d'informations publiques\n` +
        `- Analyse de la surface d'attaque\n` +
        `- Identification des technologies utilisées\n\n` +
        
        `#### 2. Découverte Active\n` +
        `- Scan de ports et services\n` +
        `- Énumération des services exposés\n` +
        `- Identification des versions logicielles\n\n` +
        
        `#### 3. Analyse de Vulnérabilités\n` +
        `- Scan automatisé des vulnérabilités\n` +
        `- Tests manuels spécialisés\n` +
        `- Validation des faux positifs\n\n` +
        
        `#### 4. Exploitation Contrôlée\n` +
        `- Exploitation des vulnérabilités validées\n` +
        `- Élévation de privilèges\n` +
        `- Mouvement latéral\n\n` +
        
        `#### 5. Post-Exploitation\n` +
        `- Collecte de credentials\n` +
        `- Analyse de la persistance\n` +
        `- Documentation des preuves\n\n` +
        
        `#### 6. Reporting\n` +
        `- Analyse des risques\n` +
        `- Recommandations de remédiation\n` +
        `- Présentation des résultats\n\n`;
    }

    generateScope(data) {
        const categories = Object.keys(data.categorizedData);
        const totalHosts = Object.values(data.categorizedData).reduce((sum, cat) => sum + Object.keys(cat.hosts || {}).length, 0);
        
        let content = `### Périmètre de l'Audit\n\n`;
        
        content += `**Systèmes évalués :** ${totalHosts} systèmes\n`;
        content += `**Zones réseau :** ${categories.length} zones\n\n`;
        
        content += `#### Répartition par Zone\n\n`;
        content += `| Zone | Nombre de Systèmes | Types Principaux |\n`;
        content += `|------|--------------------|-----------------|\n`;
        
        categories.forEach(categoryName => {
            const category = data.categorizedData[categoryName];
            const hosts = Object.values(category.hosts || {});
            const hostCount = hosts.length;
            const systems = [...new Set(hosts.map(h => h.system).filter(Boolean))];
            
            content += `| ${categoryName} | ${hostCount} | ${systems.join(', ') || 'Non spécifié'} |\n`;
        });

        content += `\n#### Services Principaux Identifiés\n\n`;
        const allServices = new Set();
        Object.values(data.categorizedData).forEach(category => {
            Object.values(category.hosts || {}).forEach(host => {
                if (host.services) {
                    host.services.split(',').forEach(service => {
                        allServices.add(service.trim());
                    });
                }
            });
        });

        Array.from(allServices).slice(0, 15).forEach(service => {
            content += `- ${service}\n`;
        });

        return content;
    }

    async generateExploitationChain(data) {
        let content = `### Chaîne d'Exploitation Globale\n\n`;
        
        const exploitationFlow = this.buildExploitationFlow(data);
        
        content += `#### Flux d'Attaque Principal\n\n`;
        exploitationFlow.forEach((step, index) => {
            content += `**Étape ${index + 1}: ${step.phase}**\n`;
            content += `- **Système ciblé:** ${step.target}\n`;
            content += `- **Technique:** ${step.technique}\n`;
            content += `- **Résultat:** ${step.result}\n`;
            content += `- **Impact:** ${step.impact}\n\n`;
        });

        content += `#### Analyse de la Progression\n\n`;
        content += `L'analyse de la chaîne d'exploitation révèle ${exploitationFlow.length} étapes principales. `;
        content += `Cette progression démontre la capacité d'un attaquant à :\n\n`;
        content += `- Obtenir un accès initial au réseau\n`;
        content += `- Escalader ses privilèges\n`;
        content += `- Se déplacer latéralement\n`;
        content += `- Accéder à des ressources sensibles\n\n`;

        return content;
    }

    async generateTechnicalEvidence(data) {
        let content = `### Preuves Techniques\n\n`;
        
        if (this.config.options.includeScreenshots) {
            content += `#### Screenshots\n\n`;
            content += `Les captures d'écran suivantes documentent les vulnérabilités identifiées et leur exploitation :\n\n`;
            
            // Collecter tous les screenshots des étapes d'exploitation
            const screenshots = this.collectScreenshots(data);
            screenshots.forEach((screenshot, index) => {
                content += `**Figure ${index + 1}:** ${screenshot.description}\n`;
                content += `- **Système:** ${screenshot.host}\n`;
                content += `- **Fichier:** ${screenshot.filename}\n\n`;
            });
        }

        if (this.config.options.includeOutputs) {
            content += `#### Outputs Bruts\n\n`;
            content += `Les outputs suivants présentent les résultats détaillés des outils utilisés :\n\n`;
            
            const outputs = this.collectOutputs(data);
            outputs.forEach((output, index) => {
                content += `##### ${output.host} - ${output.type}\n\n`;
                content += `\`\`\`\n${output.content.substring(0, 1000)}${output.content.length > 1000 ? '\n... (tronqué)' : ''}\n\`\`\`\n\n`;
            });
        }

        return content;
    }

    generateActivityTimeline(data) {
        let content = `### Timeline des Activités d'Audit\n\n`;
        
        const timeline = this.buildTimeline(data);
        
        content += `| Timestamp | Phase | Activité | Système | Résultat |\n`;
        content += `|-----------|-------|----------|---------|----------|\n`;
        
        timeline.forEach(event => {
            content += `| ${event.timestamp} | ${event.phase} | ${event.activity} | ${event.system} | ${event.result} |\n`;
        });

        content += `\n#### Analyse Temporelle\n\n`;
        content += `L'audit s'est déroulé sur une période de ${this.calculateAuditDuration(timeline)}. `;
        content += `Les phases les plus productives correspondent aux périodes de découverte active et d'exploitation.\n\n`;

        return content;
    }

    async generateDetailedExploitationChain(data) {
        let content = `### Chaîne d'Exploitation Détaillée\n\n`;
        
        const allSteps = this.collectAllExploitationSteps(data);
        
        if (allSteps.length === 0) {
            return `Aucune étape d'exploitation documentée.\n\n`;
        }

        // Grouper par système
        const stepsByHost = {};
        allSteps.forEach(step => {
            if (!stepsByHost[step.host]) {
                stepsByHost[step.host] = [];
            }
            stepsByHost[step.host].push(step);
        });

        for (const [host, steps] of Object.entries(stepsByHost)) {
            content += `#### ${host}\n\n`;
            
            // Trier par ordre
            steps.sort((a, b) => (a.order || 0) - (b.order || 0));
            
            steps.forEach((step, index) => {
                content += `**${index + 1}. ${step.title}**\n\n`;
                content += `${step.content}\n\n`;
                
                if (step.screenshotUrl) {
                    content += `*Capture d'écran: ${step.screenshotUrl}*\n\n`;
                }
            });
        }

        return content;
    }

    buildMitreMapping(data) {
        const mitreMap = {};
        
        // Analyser les techniques utilisées et les mapper aux tactiques MITRE
        Object.values(data.categorizedData || {}).forEach(category => {
            Object.values(category.hosts || {}).forEach(host => {
                if (host.techniques) {
                    host.techniques.forEach(tech => {
                        const tactic = this.mapTechniqueToMitreTactic(tech);
                        if (!mitreMap[tactic]) {
                            mitreMap[tactic] = [];
                        }
                        
                        const existingTech = mitreMap[tactic].find(t => t.name === tech);
                        if (existingTech) {
                            existingTech.systems.push(host.ipName);
                        } else {
                            mitreMap[tactic].push({
                                id: this.getTechniqueId(tech),
                                name: tech,
                                systems: [host.ipName],
                                success: host.compromiseLevel !== 'None'
                            });
                        }
                    });
                }
            });
        });

        return mitreMap;
    }

    generateReuseAnalysis(data) {
        let content = `### Analyse de Réutilisation des Credentials\n\n`;
        
        const reuseAnalysis = this.analyzeCredentialReuse(data.allCredentials);
        
        content += `#### Credentials Réutilisés\n\n`;
        if (reuseAnalysis.reusedCredentials.length > 0) {
            content += `| Username | Password | Systèmes | Risque |\n`;
            content += `|----------|----------|----------|--------|\n`;
            
            reuseAnalysis.reusedCredentials.forEach(cred => {
                const riskLevel = cred.systems.length > 3 ? 'Critique' : cred.systems.length > 1 ? 'Élevé' : 'Moyen';
                content += `| ${cred.username} | ${cred.password.replace(/./g, '*')} | ${cred.systems.length} | ${riskLevel} |\n`;
            });
        } else {
            content += `Aucune réutilisation de credentials détectée.\n`;
        }

        content += `\n#### Analyse des Motifs\n\n`;
        content += `- **Credentials uniques:** ${reuseAnalysis.uniqueCredentials}\n`;
        content += `- **Credentials réutilisés:** ${reuseAnalysis.reusedCount}\n`;
        content += `- **Taux de réutilisation:** ${reuseAnalysis.reuseRate}%\n\n`;

        if (reuseAnalysis.recommendations.length > 0) {
            content += `#### Recommandations\n\n`;
            reuseAnalysis.recommendations.forEach((rec, index) => {
                content += `${index + 1}. ${rec}\n`;
            });
        }

        return content;
    }

    generateCredentialsRecommendations(data) {
        let content = `### Recommandations pour la Gestion des Credentials\n\n`;
        
        const weaknessAnalysis = this.analyzeCredentialWeaknesses(data);
        
        content += `#### Recommandations Prioritaires\n\n`;
        
        if (weaknessAnalysis.hasWeakPasswords) {
            content += `**1. Renforcement des Mots de Passe**\n`;
            content += `- Imposer une politique de mots de passe robuste (12+ caractères, complexité)\n`;
            content += `- Éliminer les mots de passe par défaut identifiés\n`;
            content += `- Implémenter une rotation régulière des mots de passe\n\n`;
        }

        if (weaknessAnalysis.hasReusedPasswords) {
            content += `**2. Élimination de la Réutilisation**\n`;
            content += `- Auditer tous les comptes pour identifier les doublons\n`;
            content += `- Mettre en place des contrôles pour empêcher la réutilisation\n`;
            content += `- Former les utilisateurs sur les risques de la réutilisation\n\n`;
        }

        content += `**3. Authentification Multi-Facteurs (MFA)**\n`;
        content += `- Déployer MFA sur tous les comptes administrateurs\n`;
        content += `- Étendre MFA aux comptes utilisateurs sensibles\n`;
        content += `- Implémenter des solutions d'authentification sans mot de passe\n\n`;

        content += `**4. Gestion Centralisée des Identités**\n`;
        content += `- Déployer une solution de gestion des identités (IAM)\n`;
        content += `- Centraliser l'authentification via Active Directory ou équivalent\n`;
        content += `- Implémenter la révocation automatique des accès\n\n`;

        content += `**5. Surveillance et Audit**\n`;
        content += `- Monitorer les tentatives d'authentification suspectes\n`;
        content += `- Auditer régulièrement les privilèges accordés\n`;
        content += `- Mettre en place des alertes sur les comportements anormaux\n\n`;

        return content;
    }

    generateNetworkTopology(data) {
        let content = `### Topologie Réseau Identifiée\n\n`;
        
        const topology = this.analyzeNetworkTopology(data);
        
        content += `#### Zones Réseau\n\n`;
        content += `| Zone | Nombre de Systèmes | Niveau de Sécurité | Connectivité |\n`;
        content += `|------|--------------------|--------------------|---------------|\n`;
        
        topology.zones.forEach(zone => {
            content += `| ${zone.name} | ${zone.hostCount} | ${zone.securityLevel} | ${zone.connectivity} |\n`;
        });

        content += `\n#### Analyse de Segmentation\n\n`;
        content += `${topology.segmentationAnalysis}\n\n`;

        content += `#### Flux Réseau Critiques\n\n`;
        topology.criticalFlows.forEach((flow, index) => {
            content += `${index + 1}. **${flow.source} → ${flow.destination}**\n`;
            content += `   - Protocol: ${flow.protocol}\n`;
            content += `   - Risk: ${flow.risk}\n\n`;
        });

        return content;
    }

    generateSystemsInventory(data) {
        let content = `### Inventaire Détaillé des Systèmes\n\n`;
        
        const inventory = this.buildSystemsInventory(data);
        
        content += `#### Résumé par Type de Système\n\n`;
        content += `| Type | Nombre | Pourcentage |\n`;
        content += `|------|--------|--------------|\n`;
        
        Object.entries(inventory.byType).forEach(([type, count]) => {
            const percentage = ((count / inventory.total) * 100).toFixed(1);
            content += `| ${type} | ${count} | ${percentage}% |\n`;
        });

        content += `\n#### Systèmes par Zone\n\n`;
        Object.entries(inventory.byZone).forEach(([zone, systems]) => {
            content += `##### ${zone}\n\n`;
            content += `| Système | Type/OS | Services | Statut |\n`;
            content += `|---------|---------|----------|---------|\n`;
            
            systems.forEach(system => {
                content += `| ${system.ip} | ${system.type} | ${system.services} | ${system.status} |\n`;
            });
            content += '\n';
        });

        return content;
    }

    generateConnectivityAnalysis(data) {
        let content = `### Analyse de Connectivité\n\n`;
        
        const connectivity = this.analyzeConnectivity(data);
        
        content += `#### Matrice de Connectivité\n\n`;
        content += `${connectivity.matrix}\n\n`;
        
        content += `#### Points de Pivot Identifiés\n\n`;
        connectivity.pivotPoints.forEach((pivot, index) => {
            content += `${index + 1}. **${pivot.system}**\n`;
            content += `   - Connexions sortantes: ${pivot.outbound}\n`;
            content += `   - Connexions entrantes: ${pivot.inbound}\n`;
            content += `   - Criticité: ${pivot.criticality}\n\n`;
        });

        content += `#### Recommandations de Segmentation\n\n`;
        connectivity.recommendations.forEach((rec, index) => {
            content += `${index + 1}. ${rec}\n`;
        });

        return content;
    }

    generateNetworkDiagram(data) {
        return `### Diagramme Réseau\n\n` +
        `\`\`\`\n` +
        this.generateAsciiNetworkDiagram(data) +
        `\n\`\`\`\n\n` +
        `*Note: Ce diagramme représente la topologie réseau identifiée durant l'audit.*\n\n`;
    }

    generateComplianceOverview(data) {
        const standard = this.config.options.standard;
        let content = `### Vue d'Ensemble de Conformité - ${this.getStandardName(standard)}\n\n`;
        
        const compliance = this.assessCompliance(data, standard);
        
        content += `#### Score Global de Conformité\n\n`;
        content += `**Score:** ${compliance.overallScore}% (${compliance.overallLevel})\n\n`;
        
        content += `#### Répartition par Domaine\n\n`;
        content += `| Domaine | Score | Statut | Priorité |\n`;
        content += `|---------|-------|--------|---------|\n`;
        
        compliance.domains.forEach(domain => {
            content += `| ${domain.name} | ${domain.score}% | ${domain.status} | ${domain.priority} |\n`;
        });

        content += `\n#### Analyse des Écarts\n\n`;
        content += `${compliance.gapAnalysis}\n\n`;

        return content;
    }

    generateControlsAssessment(data) {
        const standard = this.config.options.standard;
        const assessment = this.assessControls(data, standard);
        
        let content = `### Évaluation Détaillée des Contrôles\n\n`;
        
        assessment.controls.forEach((control, index) => {
            content += `#### ${control.id} - ${control.name}\n\n`;
            content += `**Statut:** ${control.status}\n`;
            content += `**Score:** ${control.score}%\n`;
            content += `**Criticité:** ${control.criticality}\n\n`;
            content += `**Description:** ${control.description}\n\n`;
            
            if (control.findings.length > 0) {
                content += `**Observations:**\n`;
                control.findings.forEach(finding => {
                    content += `- ${finding}\n`;
                });
                content += '\n';
            }
            
            if (control.recommendations.length > 0) {
                content += `**Recommandations:**\n`;
                control.recommendations.forEach(rec => {
                    content += `- ${rec}\n`;
                });
                content += '\n';
            }
        });

        return content;
    }

    generateGapsAnalysis(data) {
        const standard = this.config.options.standard;
        const gaps = this.identifyComplianceGaps(data, standard);
        
        let content = `### Analyse Détaillée des Écarts\n\n`;
        
        content += `#### Écarts Critiques\n\n`;
        gaps.critical.forEach((gap, index) => {
            content += `${index + 1}. **${gap.control}**\n`;
            content += `   - Impact: ${gap.impact}\n`;
            content += `   - Effort: ${gap.effort}\n`;
            content += `   - Recommandation: ${gap.recommendation}\n\n`;
        });

        content += `#### Écarts Majeurs\n\n`;
        gaps.major.forEach((gap, index) => {
            content += `${index + 1}. **${gap.control}**\n`;
            content += `   - Impact: ${gap.impact}\n`;
            content += `   - Effort: ${gap.effort}\n`;
            content += `   - Recommandation: ${gap.recommendation}\n\n`;
        });

        return content;
    }

    generateRemediationPlan(data) {
        const standard = this.config.options.standard;
        const plan = this.buildRemediationPlan(data, standard);
        
        let content = `### Plan de Remédiation\n\n`;
        
        content += `#### Phase 1: Actions Immédiates (0-30 jours)\n\n`;
        plan.phase1.forEach((action, index) => {
            content += `${index + 1}. **${action.title}**\n`;
            content += `   - Priorité: ${action.priority}\n`;
            content += `   - Effort: ${action.effort}\n`;
            content += `   - Responsable: ${action.owner}\n`;
            content += `   - Description: ${action.description}\n\n`;
        });

        content += `#### Phase 2: Améliorations (1-6 mois)\n\n`;
        plan.phase2.forEach((action, index) => {
            content += `${index + 1}. **${action.title}**\n`;
            content += `   - Priorité: ${action.priority}\n`;
            content += `   - Effort: ${action.effort}\n`;
            content += `   - Responsable: ${action.owner}\n`;
            content += `   - Description: ${action.description}\n\n`;
        });

        content += `#### Phase 3: Optimisation (6-12 mois)\n\n`;
        plan.phase3.forEach((action, index) => {
            content += `${index + 1}. **${action.title}**\n`;
            content += `   - Priorité: ${action.priority}\n`;
            content += `   - Effort: ${action.effort}\n`;
            content += `   - Responsable: ${action.owner}\n`;
            content += `   - Description: ${action.description}\n\n`;
        });

        return content;
    }

    // ==================== MÉTHODES D'ANALYSE ET UTILITAIRES ====================

    extractKeyFindings(data) {
        const findings = {
            criticalVulns: [],
            highCompromiseSystems: [],
            sensitiveCredentials: []
        };

        // Analyser les vulnérabilités critiques
        Object.values(data.categorizedData || {}).forEach(category => {
            Object.entries(category.hosts || {}).forEach(([hostId, host]) => {
                if (host.vulnerabilities) {
                    host.vulnerabilities.forEach(vuln => {
                        if (vuln.toLowerCase().includes('critical') || vuln.toLowerCase().includes('critique') || 
                            vuln.toLowerCase().includes('cve-') && vuln.match(/cvss.*([89]\.|10)/i)) {
                            findings.criticalVulns.push({
                                vulnerability: vuln,
                                host: host.ipName,
                                impact: this.assessVulnerabilityImpact(vuln)
                            });
                        }
                    });
                }

                // Systèmes hautement compromis
                if (host.compromiseLevel && ['Admin/Root', 'Domain Admin'].includes(host.compromiseLevel)) {
                    findings.highCompromiseSystems.push({
                        host: host.ipName,
                        level: host.compromiseLevel,
                        category: Object.keys(data.categorizedData).find(cat => data.categorizedData[cat].hosts[hostId]),
                        techniques: host.techniques || []
                    });
                }

                // Credentials sensibles
                if (host.credentials) {
                    host.credentials.forEach(cred => {
                        if (this.isSensitiveCredential(cred)) {
                            findings.sensitiveCredentials.push({
                                username: cred.username,
                                type: cred.type,
                                source: host.ipName,
                                criticality: this.assessCredentialCriticality(cred)
                            });
                        }
                    });
                }
            });
        });

        return findings;
    }

    generateSmartRecommendations(data) {
        const recommendations = [];
        const { totalHosts, compromisedHosts, criticalVulns, totalCredentials } = data;

        // Recommandation basée sur le taux de compromission
        if (compromisedHosts / totalHosts > 0.3) {
            recommendations.push({
                title: "Révision Complète de l'Architecture de Sécurité",
                priority: "Critique",
                effort: "Élevé",
                impact: "Très élevé",
                description: "Le taux de compromission élevé nécessite une refonte de l'architecture de sécurité.",
                steps: [
                    "Audit complet des configurations de sécurité",
                    "Mise en place de segmentation réseau avancée",
                    "Déploiement d'outils de détection avancés",
                    "Formation des équipes IT"
                ]
            });
        }

        // Recommandation basée sur les vulnérabilités critiques
        if (criticalVulns > 5) {
            recommendations.push({
                title: "Programme de Gestion des Vulnérabilités",
                priority: "Élevé",
                effort: "Moyen",
                impact: "Élevé",
                description: "Mettre en place un processus systématique de gestion des vulnérabilités.",
                steps: [
                    "Inventaire complet des assets",
                    "Scanning automatisé régulier",
                    "Processus de patching accéléré",
                    "Métriques et reporting"
                ]
            });
        }

        // Recommandation basée sur les credentials
        if (totalCredentials > 20) {
            recommendations.push({
                title: "Renforcement de la Gestion des Identités",
                priority: "Élevé",
                effort: "Moyen",
                impact: "Élevé",
                description: "Le nombre important de credentials découverts nécessite un renforcement IAM.",
                steps: [
                    "Audit des comptes et privilèges",
                    "Implémentation MFA généralisée",
                    "Politique de mots de passe renforcée",
                    "Monitoring des accès"
                ]
            });
        }

        // Recommandations générales
        recommendations.push({
            title: "Surveillance et Détection Avancée",
            priority: "Moyen",
            effort: "Moyen",
            impact: "Élevé",
            description: "Implémenter des capacités de détection et de réponse aux incidents.",
            steps: [
                "Déploiement SIEM/SOAR",
                "Règles de détection customisées",
                "Playbooks de réponse aux incidents",
                "Formation SOC"
            ]
        });

        recommendations.push({
            title: "Formation et Sensibilisation",
            priority: "Moyen",
            effort: "Faible",
            impact: "Moyen",
            description: "Renforcer la sensibilisation sécurité des utilisateurs.",
            steps: [
                "Programme de sensibilisation",
                "Tests de phishing simulés",
                "Formation technique pour les IT",
                "Mise à jour des politiques"
            ]
        });

        return recommendations.sort((a, b) => {
            const priorityOrder = { 'Critique': 3, 'Élevé': 2, 'Moyen': 1, 'Faible': 0 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    buildExploitationFlow(data) {
        const flow = [];
        const allSteps = this.collectAllExploitationSteps(data);

        // Construire un flux logique basé sur les étapes documentées
        const phases = {
            'Reconnaissance': [],
            'Initial Access': [],
            'Execution': [],
            'Privilege Escalation': [],
            'Lateral Movement': [],
            'Collection': []
        };

        allSteps.forEach(step => {
            const phase = this.categorizeExploitationStep(step);
            if (phases[phase]) {
                phases[phase].push(step);
            }
        });

        // Construire le flux chronologique
        Object.entries(phases).forEach(([phase, steps]) => {
            if (steps.length > 0) {
                const mainStep = steps[0]; // Prendre la première étape comme représentative
                flow.push({
                    phase: phase,
                    target: mainStep.host,
                    technique: this.extractMainTechnique(mainStep),
                    result: this.extractResult(mainStep),
                    impact: this.assessStepImpact(mainStep)
                });
            }
        });

        return flow;
    }

    collectScreenshots(data) {
        const screenshots = [];
        
        Object.values(data.categorizedData || {}).forEach(category => {
            Object.values(category.hosts || {}).forEach(host => {
                if (host.exploitationSteps) {
                    host.exploitationSteps.forEach(step => {
                        if (step.screenshotUrl) {
                            screenshots.push({
                                description: step.title || 'Screenshot',
                                host: host.ipName,
                                filename: step.screenshotUrl
                            });
                        }
                    });
                }
            });
        });

        return screenshots;
    }

    collectOutputs(data) {
        const outputs = [];
        
        Object.values(data.categorizedData || {}).forEach(category => {
            Object.values(category.hosts || {}).forEach(host => {
                if (host.outputs) {
                    host.outputs.forEach(output => {
                        outputs.push({
                            host: host.ipName,
                            type: output.type || 'Raw',
                            content: output.content || ''
                        });
                    });
                }
            });
        });

        return outputs;
    }

    buildTimeline(data) {
        const timeline = [];
        const now = new Date();
        
        // Simuler une timeline basée sur les étapes d'exploitation
        Object.values(data.categorizedData || {}).forEach(category => {
            Object.values(category.hosts || {}).forEach(host => {
                if (host.exploitationSteps) {
                    host.exploitationSteps.forEach((step, index) => {
                        const stepTime = new Date(now.getTime() - (host.exploitationSteps.length - index) * 3600000);
                        timeline.push({
                            timestamp: stepTime.toISOString().substring(0, 16).replace('T', ' '),
                            phase: this.categorizeExploitationStep(step),
                            activity: step.title || 'Exploitation Step',
                            system: host.ipName,
                            result: step.content ? 'Succès' : 'En cours'
                        });
                    });
                }
            });
        });

        return timeline.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    }

    calculateAuditDuration(timeline) {
        if (timeline.length < 2) return "N/A";
        
        const start = new Date(timeline[0].timestamp);
        const end = new Date(timeline[timeline.length - 1].timestamp);
        const diffHours = Math.abs(end - start) / 36e5;
        
        if (diffHours < 24) {
            return `${Math.round(diffHours)} heures`;
        } else {
            return `${Math.round(diffHours / 24)} jours`;
        }
    }

    collectAllExploitationSteps(data) {
        const allSteps = [];
        
        Object.values(data.categorizedData || {}).forEach(category => {
            Object.values(category.hosts || {}).forEach(host => {
                if (host.exploitationSteps) {
                    host.exploitationSteps.forEach(step => {
                        allSteps.push({
                            ...step,
                            host: host.ipName
                        });
                    });
                }
            });
        });

        return allSteps;
    }

    mapTechniqueToMitreTactic(technique) {
        const mapping = {
            'pass-the-hash': 'Credential Access',
            'smb relay': 'Lateral Movement',
            'sqlinjection': 'Initial Access',
            'privilege escalation': 'Privilege Escalation',
            'lateral movement': 'Lateral Movement',
            'reconnaissance': 'Reconnaissance',
            'phishing': 'Initial Access',
            'persistence': 'Persistence',
            'defense evasion': 'Defense Evasion'
        };

        const lowerTech = technique.toLowerCase();
        for (const [key, tactic] of Object.entries(mapping)) {
            if (lowerTech.includes(key)) {
                return tactic;
            }
        }
        
        return 'Execution'; // Défaut
    }

    getTechniqueId(technique) {
        // Mapping basique vers des IDs MITRE fictifs
        const ids = {
            'pass-the-hash': 'T1550.002',
            'smb relay': 'T1557.001',
            'sqlinjection': 'T1190',
            'privilege escalation': 'T1068',
            'lateral movement': 'T1021',
            'reconnaissance': 'T1595'
        };

        const lowerTech = technique.toLowerCase();
        for (const [key, id] of Object.entries(ids)) {
            if (lowerTech.includes(key)) {
                return id;
            }
        }
        
        return 'T1059'; // Défaut
    }

    analyzeCredentialReuse(allCredentials) {
        const passwordMap = {};
        const usernameMap = {};
        
        allCredentials.forEach(cred => {
            if (cred.password) {
                if (!passwordMap[cred.password]) {
                    passwordMap[cred.password] = [];
                }
                passwordMap[cred.password].push(cred);
            }
            
            if (cred.username) {
                if (!usernameMap[cred.username]) {
                    usernameMap[cred.username] = [];
                }
                usernameMap[cred.username].push(cred);
            }
        });

        const reusedCredentials = Object.entries(passwordMap)
            .filter(([password, creds]) => creds.length > 1)
            .map(([password, creds]) => ({
                username: creds[0].username,
                password: password,
                systems: creds.map(c => c.source)
            }));

        const uniqueCredentials = Object.keys(passwordMap).length;
        const reusedCount = reusedCredentials.length;
        const reuseRate = uniqueCredentials > 0 ? ((reusedCount / uniqueCredentials) * 100).toFixed(1) : 0;

        const recommendations = [];
        if (reusedCount > 0) {
            recommendations.push("Implémenter une politique interdisant la réutilisation de mots de passe");
            recommendations.push("Utiliser un gestionnaire de mots de passe centralisé");
            recommendations.push("Mettre en place des contrôles automatiques de détection");
        }

        return {
            reusedCredentials,
            uniqueCredentials,
            reusedCount,
            reuseRate,
            recommendations
        };
    }

    analyzeCredentialWeaknesses(data) {
        let hasWeakPasswords = false;
        let hasReusedPasswords = false;
        
        data.allCredentials.forEach(cred => {
            if (cred.password && this.isWeakPassword(cred.password)) {
                hasWeakPasswords = true;
            }
        });

        const reuseAnalysis = this.analyzeCredentialReuse(data.allCredentials);
        hasReusedPasswords = reuseAnalysis.reusedCount > 0;

        return {
            hasWeakPasswords,
            hasReusedPasswords
        };
    }

    analyzeNetworkTopology(data) {
        const zones = [];
        const criticalFlows = [];
        
        Object.entries(data.categorizedData || {}).forEach(([zoneName, category]) => {
            const hosts = Object.values(category.hosts || {});
            const compromisedCount = hosts.filter(h => h.compromiseLevel && h.compromiseLevel !== 'None').length;
            
            zones.push({
                name: zoneName,
                hostCount: hosts.length,
                securityLevel: compromisedCount / hosts.length > 0.5 ? 'Faible' : 'Moyen',
                connectivity: this.analyzeZoneConnectivity(hosts)
            });
        });

        const segmentationAnalysis = zones.length > 1 ? 
            "Segmentation réseau présente mais nécessite renforcement" : 
            "Réseau plat détecté - segmentation critique nécessaire";

        return {
            zones,
            segmentationAnalysis,
            criticalFlows
        };
    }

    buildSystemsInventory(data) {
        const inventory = {
            total: 0,
            byType: {},
            byZone: {}
        };

        Object.entries(data.categorizedData || {}).forEach(([zoneName, category]) => {
            inventory.byZone[zoneName] = [];
            
            Object.values(category.hosts || {}).forEach(host => {
                inventory.total++;
                
                const systemType = host.system || 'Unknown';
                inventory.byType[systemType] = (inventory.byType[systemType] || 0) + 1;
                
                inventory.byZone[zoneName].push({
                    ip: host.ipName,
                    type: systemType,
                    services: host.services || 'N/A',
                    status: host.compromiseLevel !== 'None' ? 'Compromis' : 'Normal'
                });
            });
        });

        return inventory;
    }

    analyzeConnectivity(data) {
        const connections = [];
        const pivotPoints = [];
        
        // Analyser les connexions réseau
        Object.values(data.categorizedData || {}).forEach(category => {
            Object.values(category.hosts || {}).forEach(host => {
                if (host.edges) {
                    host.edges.forEach(edge => {
                        connections.push({
                            source: host.ipName,
                            destination: edge.to,
                            protocol: edge.label || 'Unknown'
                        });
                    });
                }
            });
        });

        // Identifier les points de pivot
        const connectionCount = {};
        connections.forEach(conn => {
            connectionCount[conn.source] = (connectionCount[conn.source] || 0) + 1;
        });

        Object.entries(connectionCount).forEach(([system, count]) => {
            if (count > 2) {
                pivotPoints.push({
                    system,
                    outbound: count,
                    inbound: connections.filter(c => c.destination === system).length,
                    criticality: count > 5 ? 'Élevée' : 'Moyenne'
                });
            }
        });

        const recommendations = [
            "Implémenter une segmentation par micro-zones",
            "Restreindre les communications inter-zones",
            "Surveiller les flux réseau anormaux",
            "Déployer des firewalls internes"
        ];

        return {
            matrix: this.generateConnectivityMatrix(connections),
            pivotPoints,
            recommendations
        };
    }

    generateAsciiNetworkDiagram(data) {
        // Génération d'un diagramme ASCII basique
        const zones = Object.keys(data.categorizedData || {});
        
        let diagram = "Network Topology:\n\n";
        diagram += "┌─────────────────────────────────────┐\n";
        diagram += "│              Internet               │\n";
        diagram += "└─────────────┬───────────────────────┘\n";
        diagram += "              │\n";
        diagram += "       ┌──────▼──────┐\n";
        diagram += "       │   Firewall  │\n";
        diagram += "       └──────┬──────┘\n";
        diagram += "              │\n";
        
        zones.forEach((zone, index) => {
            diagram += `         ┌────▼────┐\n`;
            diagram += `         │ ${zone.padEnd(8)} │\n`;
            diagram += `         └─────────┘\n`;
            if (index < zones.length - 1) {
                diagram += "              │\n";
            }
        });

        return diagram;
    }

    // Méthodes d'évaluation de conformité
    getStandardName(standard) {
        const names = {
            'iso27001': 'ISO 27001:2013',
            'nist': 'NIST Cybersecurity Framework',
            'pci': 'PCI DSS',
            'gdpr': 'RGPD/GDPR'
        };
        return names[standard] || standard;
    }

    assessCompliance(data, standard) {
        const domains = this.getComplianceDomains(standard);
        const assessment = domains.map(domain => ({
            name: domain.name,
            score: this.calculateDomainScore(data, domain),
            status: this.getDomainStatus(domain.score),
            priority: this.getDomainPriority(domain.score)
        }));

        const overallScore = assessment.reduce((sum, d) => sum + d.score, 0) / assessment.length;
        const overallLevel = this.getComplianceLevel(overallScore);

        return {
            overallScore: Math.round(overallScore),
            overallLevel,
            domains: assessment,
            gapAnalysis: this.generateComplianceGapAnalysis(assessment)
        };
    }

    getComplianceDomains(standard) {
        const domains = {
            'iso27001': [
                { name: 'Information Security Policies', weight: 0.1 },
                { name: 'Access Control', weight: 0.2 },
                { name: 'Cryptography', weight: 0.15 },
                { name: 'Operations Security', weight: 0.2 },
                { name: 'Incident Management', weight: 0.15 },
                { name: 'Compliance', weight: 0.2 }
            ],
            'nist': [
                { name: 'Identify', weight: 0.2 },
                { name: 'Protect', weight: 0.25 },
                { name: 'Detect', weight: 0.2 },
                { name: 'Respond', weight: 0.175 },
                { name: 'Recover', weight: 0.175 }
            ]
        };
        
        return domains[standard] || domains['iso27001'];
    }

    // Méthodes utilitaires diverses
    assessVulnerabilityImpact(vuln) {
        if (vuln.toLowerCase().includes('rce') || vuln.toLowerCase().includes('remote code')) {
            return 'Exécution de code distant';
        }
        if (vuln.toLowerCase().includes('privilege') || vuln.toLowerCase().includes('escalation')) {
            return 'Élévation de privilèges';
        }
        if (vuln.toLowerCase().includes('disclosure') || vuln.toLowerCase().includes('leak')) {
            return 'Fuite d\'informations';
        }
        return 'Impact à déterminer';
    }

    isSensitiveCredential(cred) {
        const sensitiveUsers = ['admin', 'administrator', 'root', 'sa', 'domain admin'];
        const sensitiveTypes = ['Domain Admin', 'Local Admin', 'Service Account'];
        
        return sensitiveUsers.some(user => cred.username.toLowerCase().includes(user)) ||
               sensitiveTypes.includes(cred.type);
    }

    assessCredentialCriticality(cred) {
        if (cred.type === 'Domain Admin' || cred.username.toLowerCase().includes('admin')) {
            return 'Critique';
        }
        if (cred.type === 'Service Account') {
            return 'Élevée';
        }
        return 'Moyenne';
    }

    categorizeExploitationStep(step) {
        const content = (step.content || step.title || '').toLowerCase();
        
        if (content.includes('reconnaissance') || content.includes('scan')) return 'Reconnaissance';
        if (content.includes('initial') || content.includes('exploit')) return 'Initial Access';
        if (content.includes('privilege') || content.includes('escalation')) return 'Privilege Escalation';
        if (content.includes('lateral') || content.includes('movement')) return 'Lateral Movement';
        if (content.includes('credential') || content.includes('password')) return 'Collection';
        
        return 'Execution';
    }

    extractMainTechnique(step) {
        const techniques = ['Pass-the-Hash', 'SMB Relay', 'SQL Injection', 'Privilege Escalation', 'Lateral Movement'];
        const content = (step.content || step.title || '').toLowerCase();
        
        for (const tech of techniques) {
            if (content.includes(tech.toLowerCase())) {
                return tech;
            }
        }
        
        return 'Technique d\'exploitation';
    }

    extractResult(step) {
        const content = step.content || '';
        if (content.includes('success') || content.includes('succès')) return 'Accès obtenu';
        if (content.includes('shell') || content.includes('session')) return 'Shell interactif';
        if (content.includes('credential') || content.includes('password')) return 'Credentials récupérés';
        
        return 'Exploitation réussie';
    }

    assessStepImpact(step) {
        const content = (step.content || '').toLowerCase();
        if (content.includes('admin') || content.includes('root')) return 'Compromission totale';
        if (content.includes('credential')) return 'Exposition de credentials';
        if (content.includes('access')) return 'Accès non autorisé';
        
        return 'Impact système';
    }

    analyzeZoneConnectivity(hosts) {
        const totalConnections = hosts.reduce((sum, host) => sum + (host.edges ? host.edges.length : 0), 0);
        return totalConnections > hosts.length ? 'Élevée' : 'Modérée';
    }

    generateConnectivityMatrix(connections) {
        if (connections.length === 0) return "Aucune connexion documentée";
        
        let matrix = "Matrice de connectivité simplifiée:\n\n";
        connections.slice(0, 10).forEach(conn => {
            matrix += `${conn.source} → ${conn.destination} (${conn.protocol})\n`;
        });
        
        if (connections.length > 10) {
            matrix += `... et ${connections.length - 10} autres connexions`;
        }
        
        return matrix;
    }

    calculateDomainScore(data, domain) {
        // Score basique basé sur le taux de compromission
        const totalHosts = Object.values(data.categorizedData || {}).reduce((sum, cat) => sum + Object.keys(cat.hosts || {}).length, 0);
        const compromisedHosts = Object.values(data.categorizedData || {}).reduce((sum, cat) => {
            return sum + Object.values(cat.hosts || {}).filter(h => h.compromiseLevel && h.compromiseLevel !== 'None').length;
        }, 0);
        
        const compromiseRate = totalHosts > 0 ? compromisedHosts / totalHosts : 0;
        return Math.max(0, Math.min(100, 100 - (compromiseRate * 100)));
    }

    getDomainStatus(score) {
        if (score >= 80) return 'Conforme';
        if (score >= 60) return 'Partiellement conforme';
        return 'Non conforme';
    }

    getDomainPriority(score) {
        if (score < 40) return 'Critique';
        if (score < 70) return 'Élevée';
        return 'Moyenne';
    }

    getComplianceLevel(score) {
        if (score >= 90) return 'Excellent';
        if (score >= 75) return 'Bon';
        if (score >= 60) return 'Satisfaisant';
        if (score >= 40) return 'Insuffisant';
        return 'Critique';
    }

    generateComplianceGapAnalysis(assessment) {
        const nonCompliantDomains = assessment.filter(d => d.score < 80);
        if (nonCompliantDomains.length === 0) {
            return "Aucun écart majeur de conformité identifié.";
        }
        
        return `${nonCompliantDomains.length} domaine(s) nécessitent des améliorations pour atteindre la conformité.`;
    }

    assessControls(data, standard) {
        // Retourner des contrôles fictifs pour démonstration
        return {
            controls: [
                {
                    id: 'A.9.1.1',
                    name: 'Politique de contrôle d\'accès',
                    status: 'Partiellement implémenté',
                    score: 65,
                    criticality: 'Élevée',
                    description: 'Politique de contrôle d\'accès aux informations et systèmes',
                    findings: ['Politique existante mais incomplète', 'Manque de révision régulière'],
                    recommendations: ['Mettre à jour la politique', 'Planifier des révisions trimestrielles']
                }
            ]
        };
    }

    identifyComplianceGaps(data, standard) {
        return {
            critical: [
                {
                    control: 'Contrôle d\'accès',
                    impact: 'Élevé',
                    effort: 'Moyen',
                    recommendation: 'Implémenter une matrice de droits formelle'
                }
            ],
            major: [
                {
                    control: 'Chiffrement des données',
                    impact: 'Moyen',
                    effort: 'Élevé',
                    recommendation: 'Déployer le chiffrement sur tous les systèmes critiques'
                }
            ]
        };
    }

    buildRemediationPlan(data, standard) {
        return {
            phase1: [
                {
                    title: 'Correction des vulnérabilités critiques',
                    priority: 'Critique',
                    effort: 'Élevé',
                    owner: 'Équipe IT',
                    description: 'Appliquer les correctifs de sécurité critiques identifiés'
                }
            ],
            phase2: [
                {
                    title: 'Implémentation du contrôle d\'accès',
                    priority: 'Élevé',
                    effort: 'Moyen',
                    owner: 'Équipe Sécurité',
                    description: 'Déployer une solution IAM centralisée'
                }
            ],
            phase3: [
                {
                    title: 'Programme de sensibilisation',
                    priority: 'Moyen',
                    effort: 'Faible',
                    owner: 'RH + Sécurité',
                    description: 'Lancer un programme de formation sécurité'
                }
            ]
        };
    }
} 