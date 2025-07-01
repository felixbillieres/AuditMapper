/**
 * Gestionnaire d'export ZIP complet
 */

export class ZipExporter {
    constructor(hostManager) {
        this.hostManager = hostManager;
        this.exportName = '';
    }

    initialize() {
        console.log(">>> ZipExporter.initialize: START");
        this.setupEventListeners();
        console.log(">>> ZipExporter.initialize: END");
    }

    setupEventListeners() {
        const executeNodeExportZipBtn = document.getElementById('executeNodeExportZipBtn');
        if (executeNodeExportZipBtn) {
            executeNodeExportZipBtn.addEventListener('click', () => this.showExportDialog());
        }
    }

    showExportDialog() {
        // Créer une modal pour demander le nom de l'export
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">📦 Export Complet - Archive ZIP</h5>
                        <button type="button" class="close" data-dismiss="modal">
                            <span>&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="exportName">Nom de l'export :</label>
                            <input type="text" id="exportName" class="form-control" 
                                   placeholder="Ex: Audit_Client_2024, Pentest_DMZ, RedTeam_Infrastructure..." 
                                   value="Pentest_Export_${new Date().toISOString().slice(0, 10)}">
                            <small class="form-text text-muted">
                                Ce nom sera utilisé pour le fichier ZIP et l'arborescence interne
                            </small>
                        </div>
                        
                        <div class="export-preview">
                            <h6>📁 Structure de l'archive :</h6>
                            <div class="border p-3 bg-light" style="font-family: monospace; font-size: 0.85em;">
                                <div id="exportStructurePreview">
                                    <!-- Structure sera générée ici -->
                                </div>
                            </div>
                        </div>
                        
                        <div class="export-stats mt-3">
                            <h6>📊 Contenu à exporter :</h6>
                            <div id="exportStats" class="row">
                                <!-- Stats seront générées ici -->
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Annuler</button>
                        <button type="button" class="btn btn-success" id="confirmExportBtn">
                            📦 Générer l'Archive ZIP
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        $(modal).modal('show');

        // Pré-remplir la prévisualisation
        this.updateExportPreview();

        // Mettre à jour la prévisualisation quand le nom change
        const exportNameInput = modal.querySelector('#exportName');
        exportNameInput.addEventListener('input', () => this.updateExportPreview());

        // Bouton de confirmation
        modal.querySelector('#confirmExportBtn').addEventListener('click', () => {
            this.exportName = exportNameInput.value.trim() || 'Pentest_Export';
            $(modal).modal('hide');
            this.executeZipExport();
        });

        // Nettoyer après fermeture
        $(modal).on('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }

    updateExportPreview() {
        const exportNameInput = document.getElementById('exportName');
        const previewDiv = document.getElementById('exportStructurePreview');
        const statsDiv = document.getElementById('exportStats');
        
        if (!exportNameInput || !previewDiv || !statsDiv) return;

        const exportName = exportNameInput.value.trim() || 'Pentest_Export';
        const hostData = this.hostManager.getData();
        
        // Générer la structure
        let structure = `${exportName}/\n`;
        structure += `├── 📄 session_data.json\n`;
        structure += `├── 📄 README.md\n`;
        structure += `├── 📊 reports/\n`;
        structure += `│   ├── executive_summary.md\n`;
        structure += `│   ├── technical_report.md\n`;
        structure += `│   ├── killchain_analysis.md\n`;
        structure += `│   └── credentials_report.md\n`;
        structure += `├── 🗂️ hosts/\n`;
        
        const categories = Object.keys(hostData.categories || {});
        categories.forEach((categoryName, index) => {
            const isLast = index === categories.length - 1;
            const prefix = isLast ? '└──' : '├──';
            const subPrefix = isLast ? '    ' : '│   ';
            
            structure += `${prefix} 📁 ${categoryName}/\n`;
            
            const hosts = Object.keys(hostData.categories[categoryName].hosts || {});
            hosts.forEach((hostId, hostIndex) => {
                const isLastHost = hostIndex === hosts.length - 1;
                const hostPrefix = isLastHost ? '└──' : '├──';
                structure += `${subPrefix}${hostPrefix} 📄 ${hostId}.md\n`;
                structure += `${subPrefix}${isLastHost ? '    ' : '│   '}    └── 📁 screenshots/\n`;
                structure += `${subPrefix}${isLastHost ? '    ' : '│   '}        └── (screenshots des étapes)\n`;
            });
        });
        
        structure += `├── 🔑 credentials/\n`;
        structure += `│   ├── all_usernames.txt\n`;
        structure += `│   ├── all_passwords.txt\n`;
        structure += `│   ├── all_hashes.txt\n`;
        structure += `│   └── credentials_by_host.csv\n`;
        structure += `├── 🖼️ screenshots/\n`;
        structure += `│   └── (organisés par host dans leurs dossiers respectifs)\n`;
        structure += `├── 📁 outputs/\n`;
        structure += `│   └── (outputs bruts par catégorie/host)\n`;
        structure += `└── 🔗 network/\n`;
        structure += `    ├── connections.json\n`;
        structure += `    ├── network_graph.dot\n`;
        structure += `    └── pivot_analysis.md\n`;

        previewDiv.textContent = structure;

        // Générer les stats
        const stats = this.calculateExportStats(hostData);
        statsDiv.innerHTML = `
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body text-center">
                        <h5 class="card-title text-primary">${stats.totalCategories}</h5>
                        <p class="card-text">Catégories</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body text-center">
                        <h5 class="card-title text-success">${stats.totalHosts}</h5>
                        <p class="card-text">Systèmes</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body text-center">
                        <h5 class="card-title text-warning">${stats.totalCredentials}</h5>
                        <p class="card-text">Credentials</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body text-center">
                        <h5 class="card-title text-info">${stats.totalExploitationSteps}</h5>
                        <p class="card-text">Étapes d'Exploitation</p>
                    </div>
                </div>
            </div>
        `;
    }

    calculateExportStats(hostData) {
        let totalCategories = 0;
        let totalHosts = 0;
        let totalCredentials = 0;
        let totalExploitationSteps = 0;
        let totalOutputs = 0;
        let totalConnections = 0;

        totalCategories = Object.keys(hostData.categories || {}).length;
        totalConnections = (hostData.edges || []).length;

        for (const category of Object.values(hostData.categories || {})) {
            const hosts = category.hosts || {};
            totalHosts += Object.keys(hosts).length;

            for (const host of Object.values(hosts)) {
                if (host.credentials) {
                    totalCredentials += (host.credentials || []).length;
                }
                if (host.exploitationSteps) {
                    totalExploitationSteps += (host.exploitationSteps || []).length;
                }
                if (host.outputs) {
                    totalOutputs += (host.outputs || []).length;
                }
            }
        }

        return {
            totalCategories,
            totalHosts,
            totalCredentials,
            totalExploitationSteps,
            totalOutputs,
            totalConnections
        };
    }

    async executeZipExport() {
        try {
            const statusMsg = document.getElementById('nodeExportStatusMsg');
            if (statusMsg) {
                statusMsg.textContent = 'Génération de l\'archive ZIP complète...';
                statusMsg.className = 'mt-3 d-block small text-info';
            }

            if (typeof JSZip === 'undefined') {
                throw new Error('JSZip n\'est pas chargé');
            }

            const zip = new JSZip();
            const hostData = this.hostManager.getData();
            const exportName = this.exportName || 'Pentest_Export';

            // Créer le dossier racine
            const rootFolder = zip.folder(exportName);

            // 1. Session data complète (JSON)
            rootFolder.file('session_data.json', JSON.stringify(hostData, null, 2));

            // 2. README avec informations d'export
            const readme = this.generateReadme(hostData, exportName);
            rootFolder.file('README.md', readme);

            // 3. Rapports automatiques
            await this.addReportsToZip(rootFolder, hostData);

            // 4. Hosts détaillés par catégorie
            const hostsFolder = rootFolder.folder('hosts');
            await this.addHostsToZip(hostsFolder, hostData);

            // 5. Credentials agrégés
            const credentialsFolder = rootFolder.folder('credentials');
            await this.addCredentialsToZip(credentialsFolder, hostData);

            // 6. Screenshots et outputs
            const screenshotsFolder = rootFolder.folder('screenshots');
            const outputsFolder = rootFolder.folder('outputs');
            await this.addScreenshotsAndOutputsToZip(screenshotsFolder, outputsFolder, hostData);

            // 7. Analyse réseau
            const networkFolder = rootFolder.folder('network');
            await this.addNetworkAnalysisToZip(networkFolder, hostData);

            // Générer et télécharger
            const zipBlob = await zip.generateAsync({ 
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 }
            });
            
            const fileName = `${exportName}.zip`;
            
            if (typeof saveAs !== 'undefined') {
                saveAs(zipBlob, fileName);
            } else {
                // Fallback si FileSaver.js n'est pas disponible
                const url = URL.createObjectURL(zipBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }

            if (statusMsg) {
                statusMsg.textContent = `Archive "${fileName}" générée et téléchargée avec succès!`;
                statusMsg.className = 'mt-3 d-block small text-success';
            }

        } catch (error) {
            console.error('Erreur lors de la génération ZIP:', error);
            const statusMsg = document.getElementById('nodeExportStatusMsg');
            if (statusMsg) {
                statusMsg.textContent = 'Erreur lors de la génération ZIP: ' + error.message;
                statusMsg.className = 'mt-3 d-block small text-danger';
            }
        }
    }

    generateReadme(hostData, exportName) {
        const stats = this.calculateExportStats(hostData);
        const exportDate = new Date().toLocaleString('fr-FR');
        
        return `# ${exportName}

**Export généré le :** ${exportDate}  
**Outil :** AuditMapper - Host Manager  

## 📊 Statistiques de l'Export

- **Catégories :** ${stats.totalCategories}
- **Systèmes :** ${stats.totalHosts}
- **Credentials :** ${stats.totalCredentials}
- **Étapes d'exploitation :** ${stats.totalExploitationSteps}
- **Outputs :** ${stats.totalOutputs}
- **Connexions réseau :** ${stats.totalConnections}

## 📁 Structure de l'Archive

### 🗂️ hosts/
Contient tous les systèmes organisés par catégorie avec leurs informations détaillées :
- Informations système (OS, rôle, zone)
- Niveau de compromission
- Services identifiés
- Vulnérabilités découvertes
- Étapes d'exploitation documentées
- Credentials récupérés
- Outputs bruts

### 📊 reports/
Rapports automatiquement générés :
- **executive_summary.md** - Résumé exécutif
- **technical_report.md** - Rapport technique détaillé
- **killchain_analysis.md** - Analyse de la chaîne d'attaque
- **credentials_report.md** - Analyse des credentials

### 🔑 credentials/
Credentials agrégés et analysés :
- **all_usernames.txt** - Tous les noms d'utilisateur
- **all_passwords.txt** - Tous les mots de passe
- **all_hashes.txt** - Tous les hashes
- **credentials_by_host.csv** - Credentials par système

### 🖼️ screenshots/
Captures d'écran des étapes d'exploitation organisées par système (vue globale)

### 📁 outputs/
Outputs bruts des outils organisés par catégorie et système.
Chaque dossier host contient également un sous-dossier **screenshots/** 
pour une organisation locale des captures d'écran avec les notes.

**Structure détaillée :**
\`\`\`
outputs/
├── [Catégorie]/
│   └── [Host]/
│       ├── screenshots/          # Screenshots spécifiques à ce host
│       │   └── step_N_screenshot.txt
│       └── [tool]_N.txt         # Outputs des outils
\`\`\`

### 🔗 network/
Analyse du réseau et des connexions :
- **connections.json** - Connexions entre systèmes
- **network_graph.dot** - Graphe réseau au format DOT
- **pivot_analysis.md** - Analyse des possibilités de pivot

## 🔄 Re-import

Pour re-importer cet export dans Host Manager :
1. Utilisez le fichier \`session_data.json\` dans la fonction "Importer Session"
2. Ou explorez manuellement les dossiers pour récupérer des informations spécifiques

## ⚙️ Compatibilité

Cet export est compatible avec :
- Host Manager (re-import complet)
- Outils d'analyse externes (formats standards)
- Rapports de pentest (formats Markdown/CSV)

---
*Généré automatiquement par AuditMapper Host Manager*`;
    }

    async addReportsToZip(reportsFolder, hostData) {
        // Utiliser le générateur de rapports existant si disponible
        if (this.hostManager.modules && this.hostManager.modules.advancedReports) {
            const reportGenerator = this.hostManager.modules.advancedReports;
            
            // Générer chaque type de rapport
            const reportTypes = ['technical'];
            
            for (const type of reportTypes) {
                try {
                    reportGenerator.currentReportType = type;
                    reportGenerator.selectedCategories = new Set(Object.keys(hostData.categories || {}));
                    reportGenerator.generateReport();
                    
                    if (reportGenerator.currentReportData) {
                        const fileName = `${type === 'executive' ? 'executive_summary' : 
                                           type === 'technical' ? 'technical_report' :
                                           type === 'killchain' ? 'killchain_analysis' :
                                           'credentials_report'}.md`;
                        reportsFolder.file(fileName, reportGenerator.currentReportData);
                    }
                } catch (error) {
                    console.warn(`Erreur génération rapport ${type}:`, error);
                }
            }
        } else {
            // Rapport basique si le générateur avancé n'est pas disponible
            const basicReport = this.generateBasicReport(hostData);
            reportsFolder.file('basic_report.md', basicReport);
        }
    }

    async addHostsToZip(hostsFolder, hostData) {
        for (const [categoryName, category] of Object.entries(hostData.categories || {})) {
            const categoryFolder = hostsFolder.folder(categoryName);
            
            for (const [hostId, host] of Object.entries(category.hosts || {})) {
                const hostContent = this.generateDetailedHostMarkdown(host, hostId, categoryName);
                categoryFolder.file(`${hostId}.md`, hostContent);
            }
        }
    }

    async addCredentialsToZip(credentialsFolder, hostData) {
        const allUsernames = [];
        const allPasswords = [];
        const allHashes = [];
        const credentialsByHost = [];

        // En-tête CSV
        credentialsByHost.push('Système,Catégorie,Username,Password,Hash,Type');

        for (const [categoryName, category] of Object.entries(hostData.categories || {})) {
            for (const [hostId, host] of Object.entries(category.hosts || {})) {
                if (host.credentials && host.credentials.length > 0) {
                    host.credentials.forEach(cred => {
                        if (cred.username) {
                            allUsernames.push(cred.username);
                            credentialsByHost.push(`${hostId},${categoryName},${cred.username},${cred.password || ''},${cred.hash || ''},Username`);
                        }
                        if (cred.password) {
                            allPasswords.push(cred.password);
                            if (!cred.username) {
                                credentialsByHost.push(`${hostId},${categoryName},,${cred.password},,Password`);
                            }
                        }
                        if (cred.hash) {
                            allHashes.push(cred.hash);
                            if (!cred.username && !cred.password) {
                                credentialsByHost.push(`${hostId},${categoryName},,,${cred.hash},Hash`);
                            }
                        }
                    });
                }
            }
        }

        // Supprimer les doublons
        const uniqueUsernames = [...new Set(allUsernames)];
        const uniquePasswords = [...new Set(allPasswords)];
        const uniqueHashes = [...new Set(allHashes)];

        credentialsFolder.file('all_usernames.txt', uniqueUsernames.join('\n'));
        credentialsFolder.file('all_passwords.txt', uniquePasswords.join('\n'));
        credentialsFolder.file('all_hashes.txt', uniqueHashes.join('\n'));
        credentialsFolder.file('credentials_by_host.csv', credentialsByHost.join('\n'));
    }

    async addScreenshotsAndOutputsToZip(screenshotsFolder, outputsFolder, hostData) {
        for (const [categoryName, category] of Object.entries(hostData.categories || {})) {
            const categoryOutputFolder = outputsFolder.folder(categoryName);
            
            for (const [hostId, host] of Object.entries(category.hosts || {})) {
                const hostOutputFolder = categoryOutputFolder.folder(hostId);
                
                // Screenshots des étapes d'exploitation - organisés dans le dossier du host
                if (host.exploitationSteps && host.exploitationSteps.length > 0) {
                    // Dossier screenshots dans le dossier du host (à côté du fichier .md)
                    const hostScreenshotFolder = hostOutputFolder.folder('screenshots');
                    
                    host.exploitationSteps.forEach((step, index) => {
                        if (step.screenshots && Array.isArray(step.screenshots) && step.screenshots.length > 0) {
                            // Gérer les screenshots multiples
                            step.screenshots.forEach((screenshot, screenshotIndex) => {
                                const fileName = `step_${index + 1}_screenshot_${screenshotIndex + 1}.png`;
                                
                                // Vérifier si c'est une image base64
                                if (screenshot.startsWith('data:image/')) {
                                    try {
                                        // Extraire les données base64
                                        const base64Data = screenshot.split(',')[1];
                                        const binaryData = atob(base64Data);
                                        const bytes = new Uint8Array(binaryData.length);
                                        for (let i = 0; i < binaryData.length; i++) {
                                            bytes[i] = binaryData.charCodeAt(i);
                                        }
                                        
                                        // Ajouter l'image dans le dossier screenshots du host
                                        hostScreenshotFolder.file(fileName, bytes);
                                        
                                        // Créer un fichier de métadonnées
                                        const metadata = {
                                            step: step.title || step.description || `Étape ${index + 1}`,
                                            screenshotIndex: screenshotIndex + 1,
                                            fileName: fileName,
                                            timestamp: new Date().toISOString()
                                        };
                                        hostScreenshotFolder.file(`${fileName}.json`, JSON.stringify(metadata, null, 2));
                                        
                                    } catch (error) {
                                        console.warn(`Erreur lors du traitement du screenshot ${fileName}:`, error);
                                        // Fallback: sauvegarder l'URL comme texte
                                        hostScreenshotFolder.file(`${fileName}.txt`, `Screenshot URL: ${screenshot}\nStep: ${step.title || step.description}`);
                                    }
                                } else if (step.screenshotUrl) {
                                    // Ancien format (compatibilité)
                                    const screenshotInfo = `Screenshot URL: ${step.screenshotUrl}\nStep: ${step.title || step.description}`;
                                    hostScreenshotFolder.file(fileName.replace('.png', '.txt'), screenshotInfo);
                                }
                            });
                        } else if (step.screenshotUrl) {
                            // Ancien format (compatibilité)
                            const fileName = `step_${index + 1}_screenshot.txt`;
                            const screenshotInfo = `Screenshot URL: ${step.screenshotUrl}\nStep: ${step.title || step.description}`;
                            hostScreenshotFolder.file(fileName, screenshotInfo);
                        }
                    });
                }

                // Outputs bruts
                if (host.outputs && host.outputs.length > 0) {
                    host.outputs.forEach((output, index) => {
                        const fileName = `${output.type || 'output'}_${index + 1}.txt`;
                        let content = `Type: ${output.type || 'N/A'}\n`;
                        if (output.subType) content += `Sous-type: ${output.subType}\n`;
                        content += `\n${output.content || ''}`;
                        
                        hostOutputFolder.file(fileName, content);
                    });
                }
            }
        }
    }

    async addNetworkAnalysisToZip(networkFolder, hostData) {
        // Connexions JSON
        const connections = hostData.edges || [];
        networkFolder.file('connections.json', JSON.stringify(connections, null, 2));

        // Graphe DOT
        const dotGraph = this.generateDotGraph(hostData);
        networkFolder.file('network_graph.dot', dotGraph);

        // Analyse des pivots
        const pivotAnalysis = this.generatePivotAnalysis(hostData);
        networkFolder.file('pivot_analysis.md', pivotAnalysis);
    }

    generateDetailedHostMarkdown(host, hostId, categoryName) {
        let content = `# ${hostId}\n\n`;
        content += `**Catégorie :** ${categoryName}\n`;
        content += `**IP/Nom :** ${host.ip || 'N/A'}\n`;
        content += `**Système :** ${host.system || 'N/A'}\n`;
        content += `**Rôle :** ${host.role || 'N/A'}\n`;
        content += `**Zone :** ${host.zone || 'N/A'}\n`;
        content += `**Niveau de compromission :** ${host.compromiseLevel || 'None'}\n`;
        content += `**Services :** ${Array.isArray(host.services) ? host.services.join(', ') : (host.services || 'N/A')}\n`;
        content += `**Tags :** ${Array.isArray(host.tags) ? host.tags.join(', ') : 'Aucun'}\n\n`;

        if (host.notes) {
            content += `## 📝 Notes\n\n${host.notes}\n\n`;
        }

        if (host.vulnerabilities && host.vulnerabilities.length > 0) {
            content += `## 🔍 Vulnérabilités\n\n`;
            host.vulnerabilities.forEach((vuln, index) => {
                content += `### ${index + 1}. ${vuln.title || 'Vulnérabilité'}\n`;
                content += `- **Sévérité :** ${vuln.severity || 'N/A'}\n`;
                if (vuln.description) content += `- **Description :** ${vuln.description}\n`;
                if (vuln.impact) content += `- **Impact :** ${vuln.impact}\n`;
                if (vuln.remediation) content += `- **Remédiation :** ${vuln.remediation}\n`;
                content += '\n';
            });
        }

        if (host.exploitationSteps && host.exploitationSteps.length > 0) {
            content += `## ⚔️ Étapes d'Exploitation\n\n`;
            host.exploitationSteps
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .forEach((step, index) => {
                    content += `### Étape ${step.order || index + 1}: ${step.title || step.description}\n`;
                    content += `${step.content || step.description || ''}\n`;
                    if (step.screenshotUrl) {
                        content += `\n**Screenshot :** ${step.screenshotUrl}\n`;
                    }
                    content += '\n---\n\n';
                });
        }

        if (host.credentials && host.credentials.length > 0) {
            content += `## 🔑 Credentials\n\n`;
            host.credentials.forEach((cred, index) => {
                content += `### Credential ${index + 1}\n`;
                content += `- **Username :** ${cred.username || 'N/A'}\n`;
                content += `- **Password :** ${cred.password || 'N/A'}\n`;
                content += `- **Hash :** ${cred.hash || 'N/A'}\n\n`;
            });
        }

        if (host.outputs && host.outputs.length > 0) {
            content += `## 📄 Outputs\n\n`;
            host.outputs.forEach((output, index) => {
                content += `### Output ${index + 1} - ${output.type || 'Unknown'}\n`;
                if (output.subType) content += `**Sous-type :** ${output.subType}\n\n`;
                content += '```\n';
                content += `${output.content || ''}\n`;
                content += '```\n\n';
            });
        }

        return content;
    }

    generateBasicReport(hostData) {
        const stats = this.calculateExportStats(hostData);
        
        return `# Rapport d'Export

## Statistiques
- Catégories : ${stats.totalCategories}
- Systèmes : ${stats.totalHosts}
- Credentials : ${stats.totalCredentials}
- Étapes d'exploitation : ${stats.totalExploitationSteps}

## Détails par catégorie

${Object.entries(hostData.categories || {}).map(([categoryName, category]) => {
    const hosts = Object.keys(category.hosts || {});
    return `### ${categoryName}
- Systèmes : ${hosts.length}
- Hosts : ${hosts.join(', ')}`;
}).join('\n\n')}`;
    }

    generateDotGraph(hostData) {
        let dot = 'digraph Network {\n';
        dot += '  rankdir=LR;\n';
        dot += '  node [shape=box, style=filled];\n\n';

        // Nodes
        for (const [categoryName, category] of Object.entries(hostData.categories || {})) {
            for (const [hostId, host] of Object.entries(category.hosts || {})) {
                const color = this.getCompromiseColor(host.compromiseLevel);
                dot += `  "${hostId}" [label="${hostId}\\n${categoryName}", fillcolor="${color}"];\n`;
            }
        }

        // Edges
        const edges = hostData.edges || [];
        edges.forEach(edge => {
            dot += `  "${edge.from}" -> "${edge.to}"`;
            if (edge.label) {
                dot += ` [label="${edge.label}"]`;
            }
            dot += ';\n';
        });

        dot += '}';
        return dot;
    }

    getCompromiseColor(level) {
        const colors = {
            'None': 'lightgray',
            'Initial Access': 'yellow',
            'User': 'orange',
            'Admin/Root': 'red',
            'Domain Admin': 'darkred'
        };
        return colors[level] || 'lightgray';
    }

    generatePivotAnalysis(hostData) {
        let analysis = `# Analyse des Possibilités de Pivot\n\n`;
        
        const edges = hostData.edges || [];
        if (edges.length === 0) {
            analysis += 'Aucune connexion documentée entre les systèmes.\n';
            return analysis;
        }

        analysis += `## Connexions Identifiées (${edges.length})\n\n`;
        edges.forEach((edge, index) => {
            analysis += `${index + 1}. **${edge.from}** → **${edge.to}**`;
            if (edge.label) analysis += ` (${edge.label})`;
            analysis += '\n';
        });

        // Analyser les points de pivot potentiels
        const pivotPoints = {};
        edges.forEach(edge => {
            pivotPoints[edge.from] = (pivotPoints[edge.from] || 0) + 1;
        });

        const majorPivots = Object.entries(pivotPoints)
            .filter(([host, count]) => count > 1)
            .sort(([,a], [,b]) => b - a);

        if (majorPivots.length > 0) {
            analysis += `\n## Points de Pivot Majeurs\n\n`;
            majorPivots.forEach(([host, count]) => {
                analysis += `- **${host}** : ${count} connexions sortantes\n`;
            });
        }

        return analysis;
    }

    // Fonction de test pour vérifier l'export avec screenshots
    async testExportWithScreenshots() {
        console.log("🧪 Test d'export avec screenshots...");
        
        // Créer des données de test avec screenshots
        const testData = {
            categories: {
                "Domain Controllers": {
                    hosts: {
                        "DC01.vulncorp.local": {
                            ip: "192.168.1.10",
                            system: "Windows Server 2019",
                            role: "Domain Controller",
                            zone: "DMZ",
                            compromiseLevel: "High",
                            services: ["LDAP", "DNS", "Kerberos"],
                            tags: ["critical", "dc"],
                            notes: "Contrôleur de domaine principal",
                            credentials: [
                                {
                                    username: "Administrator",
                                    password: "P@ssw0rd123!",
                                    hash: "aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0"
                                }
                            ],
                            exploitationSteps: [
                                {
                                    title: "Découverte du service LDAP",
                                    description: "Scan des ports LDAP",
                                    content: "Nmap scan révèle le port 389 ouvert",
                                    order: 1,
                                    screenshots: [
                                        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" // 1x1 pixel transparent
                                    ]
                                },
                                {
                                    title: "Exploitation via Kerberoasting",
                                    description: "Attaque Kerberoasting réussie",
                                    content: "Récupération de tickets TGS",
                                    order: 2,
                                    screenshots: [
                                        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
                                        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                                    ]
                                }
                            ],
                            outputs: [
                                {
                                    type: "nmap",
                                    subType: "port_scan",
                                    content: "Starting Nmap 7.80 ( https://nmap.org )\nNmap scan report for 192.168.1.10\nHost is up (0.00047s latency).\n\nPORT    STATE SERVICE\n389/tcp open  ldap\n636/tcp open  ldaps\n"
                                }
                            ]
                        }
                    }
                },
                "Workstations": {
                    hosts: {
                        "WS01.vulncorp.local": {
                            ip: "192.168.1.20",
                            system: "Windows 10",
                            role: "Workstation",
                            zone: "Internal",
                            compromiseLevel: "Medium",
                            services: ["SMB", "RDP"],
                            tags: ["workstation", "user"],
                            notes: "Poste de travail utilisateur",
                            exploitationSteps: [
                                {
                                    title: "Accès via SMB",
                                    description: "Connexion SMB réussie",
                                    content: "Accès au partage C$",
                                    order: 1,
                                    screenshots: [
                                        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                                    ]
                                }
                            ]
                        }
                    }
                }
            },
            edges: [
                { from: "DC01.vulncorp.local", to: "WS01.vulncorp.local", label: "LDAP" }
            ]
        };
        
        // Simuler l'export avec ces données
        this.hostManager.updateData(testData);
        this.exportName = "Test_Export_Screenshots";
        await this.executeZipExport();
        
        console.log("✅ Test d'export terminé");
    }
} 