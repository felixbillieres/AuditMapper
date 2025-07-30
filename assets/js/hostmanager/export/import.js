/**
 * Gestionnaire d'import pour les exports ZIP
 */

export class ImportManager {
    constructor(hostManager) {
        this.hostManager = hostManager;
    }

    initialize() {
        console.log(">>> ImportManager.initialize: START");
        this.setupEventListeners();
        console.log(">>> ImportManager.initialize: END");
    }

    setupEventListeners() {
        // Event listener pour le bouton d'import ZIP
        document.addEventListener('click', (e) => {
            if (e.target.id === 'importZipBtn') {
                this.showImportZipDialog();
            }
        });
        
        // Gérer l'import de session existant pour supporter les ZIP
        const importSessionInput = document.getElementById('importSessionInput');
        if (importSessionInput) {
            importSessionInput.addEventListener('change', (event) => this.handleFileImport(event));
        }
    }

    showImportZipDialog() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">📦 Import Archive ZIP</h5>
                        <button type="button" class="close" data-dismiss="modal">
                            <span>&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="zipFileInput">Sélectionner l'archive ZIP à importer :</label>
                            <input type="file" id="zipFileInput" class="form-control-file" accept=".zip">
                            <small class="form-text text-muted">
                                Sélectionnez une archive ZIP exportée depuis Host Manager
                            </small>
                        </div>
                        
                        <div id="importPreview" class="import-preview" style="display: none;">
                            <h6>📋 Contenu de l'archive :</h6>
                            <div id="importFileList" class="border p-3 bg-light" style="max-height: 300px; overflow-y: auto;">
                                <!-- Liste des fichiers sera générée ici -->
                            </div>
                            
                            <div class="form-group mt-3">
                                <label>Options d'import :</label>
                                <div class="form-check">
                                    <input type="checkbox" id="importHosts" class="form-check-input" checked>
                                    <label for="importHosts" class="form-check-label">Importer les systèmes et catégories</label>
                                </div>
                                <div class="form-check">
                                    <input type="checkbox" id="importCredentials" class="form-check-input" checked>
                                    <label for="importCredentials" class="form-check-label">Importer les credentials</label>
                                </div>
                                <div class="form-check">
                                    <input type="checkbox" id="importExploitation" class="form-check-input" checked>
                                    <label for="importExploitation" class="form-check-label">Importer les étapes d'exploitation</label>
                                </div>
                                <div class="form-check">
                                    <input type="checkbox" id="importOutputs" class="form-check-input" checked>
                                    <label for="importOutputs" class="form-check-label">Importer les outputs</label>
                                </div>
                                <div class="form-check">
                                    <input type="checkbox" id="importConnections" class="form-check-input" checked>
                                    <label for="importConnections" class="form-check-label">Importer les connexions réseau</label>
                                </div>
                            </div>
                            
                            <div class="alert alert-warning">
                                <strong>⚠️ Attention :</strong> L'import va remplacer toutes les données existantes. 
                                Pensez à exporter vos données actuelles avant d'importer.
                            </div>
                        </div>
                        
                        <div id="importProgress" class="progress" style="display: none;">
                            <div id="importProgressBar" class="progress-bar" role="progressbar" style="width: 0%"></div>
                        </div>
                        
                        <div id="importStatus" class="mt-3"></div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Annuler</button>
                        <button type="button" class="btn btn-success" id="confirmImportBtn" disabled>
                            📥 Importer l'Archive
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Afficher le modal avec Bootstrap vanilla JS
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();

        // Event listeners
        const zipFileInput = modal.querySelector('#zipFileInput');
        const confirmImportBtn = modal.querySelector('#confirmImportBtn');
        
        zipFileInput.addEventListener('change', (e) => this.analyzeZipFile(e, modal));
        confirmImportBtn.addEventListener('click', () => this.executeZipImport(modal));

        // Nettoyer après fermeture
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }

    async analyzeZipFile(event, modal) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            this.updateImportStatus(modal, 'Analyse de l\'archive...', 'info');
            
            if (typeof JSZip === 'undefined') {
                throw new Error('JSZip n\'est pas chargé');
            }

            const zip = new JSZip();
            const zipContent = await zip.loadAsync(file);
            
            // Analyser la structure
            const fileList = modal.querySelector('#importFileList');
            const importPreview = modal.querySelector('#importPreview');
            const confirmImportBtn = modal.querySelector('#confirmImportBtn');
            
            let fileListHtml = '<ul class="list-unstyled">';
            const foundFiles = {
                sessionData: false,
                hosts: 0,
                credentials: 0,
                reports: 0,
                outputs: 0,
                screenshots: 0
            };

            zipContent.forEach((relativePath, zipEntry) => {
                if (!zipEntry.dir) {
                    fileListHtml += `<li>📄 ${relativePath}</li>`;
                    
                    // Analyser les types de fichiers
                    if (relativePath.includes('session_data.json')) {
                        foundFiles.sessionData = true;
                    } else if (relativePath.includes('/hosts/')) {
                        foundFiles.hosts++;
                    } else if (relativePath.includes('/credentials/')) {
                        foundFiles.credentials++;
                    } else if (relativePath.includes('/reports/')) {
                        foundFiles.reports++;
                    } else if (relativePath.includes('/outputs/')) {
                        foundFiles.outputs++;
                    } else if (relativePath.includes('/screenshots/')) {
                        foundFiles.screenshots++;
                    }
                } else {
                    fileListHtml += `<li>📁 ${relativePath}</li>`;
                }
            });
            
            fileListHtml += '</ul>';
            
            // Ajouter un résumé
            fileListHtml += `<div class="mt-3 p-2 bg-info text-white rounded">
                <strong>📊 Résumé de l'archive :</strong><br>
                • Session data : ${foundFiles.sessionData ? '✅' : '❌'}<br>
                • Fichiers hosts : ${foundFiles.hosts}<br>
                • Fichiers credentials : ${foundFiles.credentials}<br>
                • Rapports : ${foundFiles.reports}<br>
                • Outputs : ${foundFiles.outputs}<br>
                • Screenshots : ${foundFiles.screenshots}
            </div>`;
            
            fileList.innerHTML = fileListHtml;
            importPreview.style.display = 'block';
            
            // Activer le bouton d'import si on a trouvé des données
            if (foundFiles.sessionData || foundFiles.hosts > 0) {
                confirmImportBtn.disabled = false;
                this.updateImportStatus(modal, 'Archive analysée avec succès. Prêt à importer.', 'success');
            } else {
                confirmImportBtn.disabled = true;
                this.updateImportStatus(modal, 'Archive non reconnue. Assurez-vous qu\'il s\'agit d\'un export Host Manager.', 'warning');
            }
            
            // Stocker le zip pour l'import
            this.currentZip = zipContent;
            
        } catch (error) {
            console.error('Erreur analyse ZIP:', error);
            this.updateImportStatus(modal, 'Erreur lors de l\'analyse de l\'archive: ' + error.message, 'danger');
        }
    }

    async executeZipImport(modal) {
        if (!this.currentZip) return;

        try {
            this.showImportProgress(modal, 0);
            this.updateImportStatus(modal, 'Import en cours...', 'info');

            const options = this.getImportOptions(modal);
            let importedData = { categories: {}, edges: [] };
            
            // 1. Tenter d'importer le session_data.json complet
            if (options.importHosts) {
                try {
                    const sessionDataFile = this.currentZip.file(/session_data\.json$/)[0];
                    if (sessionDataFile) {
                        const sessionContent = await sessionDataFile.async('string');
                        const sessionData = JSON.parse(sessionContent);
                        
                        importedData = sessionData;
                        this.showImportProgress(modal, 50);
                        this.updateImportStatus(modal, 'Session data importée...', 'info');
                    }
                } catch (error) {
                    console.warn('Erreur import session data:', error);
                }
            }

            // 2. Si pas de session data, tenter de reconstruire depuis les fichiers individuels
            if (!importedData.categories || Object.keys(importedData.categories).length === 0) {
                importedData = await this.reconstructDataFromFiles(this.currentZip, options);
            }

            this.showImportProgress(modal, 80);

            // 3. Appliquer les filtres d'import
            importedData = this.filterImportData(importedData, options);

            // 4. Importer dans Host Manager
            this.hostManager.updateData(importedData);
            
            this.showImportProgress(modal, 100);
            this.updateImportStatus(modal, 'Import terminé avec succès !', 'success');

            // Fermer la modal après 2 secondes
            setTimeout(() => {
                $(modal).modal('hide');
            }, 2000);

        } catch (error) {
            console.error('Erreur import ZIP:', error);
            this.updateImportStatus(modal, 'Erreur lors de l\'import: ' + error.message, 'danger');
        }
    }

    async reconstructDataFromFiles(zip, options) {
        const reconstructedData = { categories: {}, edges: [] };
        
        // Parcourir les fichiers hosts pour reconstruire la structure
        const hostFiles = zip.file(/\/hosts\/.*\.md$/);
        
        for (const hostFile of hostFiles) {
            try {
                const content = await hostFile.async('string');
                const pathParts = hostFile.name.split('/');
                const categoryName = pathParts[pathParts.length - 2]; // Dossier parent
                const hostId = pathParts[pathParts.length - 1].replace('.md', '');
                
                if (!reconstructedData.categories[categoryName]) {
                    reconstructedData.categories[categoryName] = { hosts: {} };
                }
                
                const hostData = this.parseHostMarkdown(content);
                
                // Importer les screenshots si l'option est activée
                if (options.importExploitation) {
                    await this.importScreenshotsForHost(zip, categoryName, hostId, hostData);
                }
                
                reconstructedData.categories[categoryName].hosts[hostId] = hostData;
                
            } catch (error) {
                console.warn(`Erreur parsing host file ${hostFile.name}:`, error);
            }
        }
        
        // Importer les connexions si disponibles
        if (options.importConnections) {
            try {
                const connectionsFile = zip.file(/network\/connections\.json$/)[0];
                if (connectionsFile) {
                    const connectionsContent = await connectionsFile.async('string');
                    reconstructedData.edges = JSON.parse(connectionsContent);
                }
            } catch (error) {
                console.warn('Erreur import connexions:', error);
            }
        }
        
        return reconstructedData;
    }

    async importScreenshotsForHost(zip, categoryName, hostId, hostData) {
        try {
            // Chercher les screenshots dans le dossier screenshots du host
            const screenshotFiles = zip.file(new RegExp(`hosts/${categoryName}/${hostId}/screenshots/.*\\.png$`));
            
            if (screenshotFiles.length > 0) {
                // Organiser les screenshots par étape d'exploitation
                const screenshotsByStep = {};
                
                for (const screenshotFile of screenshotFiles) {
                    const fileName = screenshotFile.name;
                    const match = fileName.match(/step_(\d+)_screenshot_(\d+)\.png$/);
                    
                    if (match) {
                        const stepIndex = parseInt(match[1]) - 1;
                        const screenshotIndex = parseInt(match[2]) - 1;
                        
                        if (!screenshotsByStep[stepIndex]) {
                            screenshotsByStep[stepIndex] = [];
                        }
                        
                        // Convertir le fichier PNG en base64
                        const arrayBuffer = await screenshotFile.async('arraybuffer');
                        const base64 = this.arrayBufferToBase64(arrayBuffer);
                        const dataUrl = `data:image/png;base64,${base64}`;
                        
                        screenshotsByStep[stepIndex][screenshotIndex] = dataUrl;
                    }
                }
                
                // Appliquer les screenshots aux étapes d'exploitation
                if (hostData.exploitationSteps) {
                    hostData.exploitationSteps.forEach((step, stepIndex) => {
                        if (screenshotsByStep[stepIndex]) {
                            // Filtrer les éléments undefined et trier par index
                            step.screenshots = screenshotsByStep[stepIndex]
                                .filter(screenshot => screenshot !== undefined)
                                .sort((a, b) => {
                                    const aIndex = screenshotsByStep[stepIndex].indexOf(a);
                                    const bIndex = screenshotsByStep[stepIndex].indexOf(b);
                                    return aIndex - bIndex;
                                });
                        }
                    });
                }
            }
        } catch (error) {
            console.warn(`Erreur import screenshots pour ${categoryName}/${hostId}:`, error);
        }
    }

    arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    parseHostMarkdown(markdown) {
        const host = {
            ip: '',
            system: '',
            role: '',
            zone: '',
            compromiseLevel: 'None',
            services: [],
            tags: [],
            notes: '',
            credentials: [],
            exploitationSteps: [],
            outputs: [],
            vulnerabilities: []
        };

        const lines = markdown.split('\n');
        let currentSection = '';
        let notesContent = [];
        let inNotesSection = false;
        
        // Parser les métadonnées de base
        lines.forEach((line, index) => {
            if (line.startsWith('**IP/Nom :**')) {
                host.ip = line.replace('**IP/Nom :**', '').trim();
            } else if (line.startsWith('**Système :**')) {
                host.system = line.replace('**Système :**', '').trim();
            } else if (line.startsWith('**Rôle :**')) {
                host.role = line.replace('**Rôle :**', '').trim();
            } else if (line.startsWith('**Zone :**')) {
                host.zone = line.replace('**Zone :**', '').trim();
            } else if (line.startsWith('**Niveau de compromission :**')) {
                host.compromiseLevel = line.replace('**Niveau de compromission :**', '').trim();
            } else if (line.startsWith('**Services :**')) {
                const services = line.replace('**Services :**', '').trim();
                if (services !== 'N/A') {
                    host.services = services.split(',').map(s => s.trim());
                }
            } else if (line.startsWith('**Tags :**')) {
                const tags = line.replace('**Tags :**', '').trim();
                if (tags !== 'Aucun') {
                    host.tags = tags.split(',').map(t => t.trim());
                }
            }
            
            // Détecter le début de la section Notes
            if (line.startsWith('## 📝 Notes')) {
                inNotesSection = true;
                notesContent = [];
            } else if (inNotesSection && line.startsWith('## ')) {
                // Détecter la fin de la section Notes (début d'une autre section)
                inNotesSection = false;
            } else if (inNotesSection && line !== '## 📝 Notes') {
                // Collecter le contenu des notes
                notesContent.push(line);
            }
            

        });

        // Joindre le contenu des notes
        if (notesContent.length > 0) {
            host.notes = notesContent.join('\n').trim();
        }
        
        return host;
    }

    getImportOptions(modal) {
        return {
            importHosts: modal.querySelector('#importHosts').checked,
            importCredentials: modal.querySelector('#importCredentials').checked,
            importExploitation: modal.querySelector('#importExploitation').checked,
            importOutputs: modal.querySelector('#importOutputs').checked,
            importConnections: modal.querySelector('#importConnections').checked
        };
    }

    filterImportData(data, options) {
        const filteredData = { categories: {}, edges: [] };

        if (options.importHosts) {
            filteredData.categories = data.categories || {};
        }

        if (options.importConnections) {
            filteredData.edges = data.edges || [];
        }

        // Filtrer les données spécifiques dans chaque host
        for (const [categoryName, category] of Object.entries(filteredData.categories)) {
            for (const [hostId, host] of Object.entries(category.hosts || {})) {
                if (!options.importCredentials) {
                    delete host.credentials;
                }
                if (!options.importExploitation) {
                    delete host.exploitationSteps;
                }
                if (!options.importOutputs) {
                    delete host.outputs;
                }
            }
        }

        return filteredData;
    }

    showImportProgress(modal, percentage) {
        const progressContainer = modal.querySelector('#importProgress');
        const progressBar = modal.querySelector('#importProgressBar');
        
        progressContainer.style.display = 'block';
        progressBar.style.width = percentage + '%';
        progressBar.textContent = Math.round(percentage) + '%';
    }

    updateImportStatus(modal, message, type) {
        const statusDiv = modal.querySelector('#importStatus');
        const alertClass = {
            'info': 'alert-info',
            'success': 'alert-success',
            'warning': 'alert-warning',
            'danger': 'alert-danger'
        };
        
        statusDiv.innerHTML = `<div class="alert ${alertClass[type] || 'alert-info'}">${message}</div>`;
    }

    // Gérer l'import de fichiers existant (JSON)
    async handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Si c'est un ZIP, utiliser le nouveau système
        if (file.name.endsWith('.zip')) {
            this.showImportZipDialog();
            // Simuler la sélection du fichier dans la modal
            setTimeout(() => {
                const zipInput = document.querySelector('#zipFileInput');
                if (zipInput) {
                    zipInput.files = event.target.files;
                    zipInput.dispatchEvent(new Event('change'));
                }
            }, 500);
            return;
        }

        // Sinon, laisser le système existant gérer (JSON)
        if (this.hostManager.modules.storage) {
            try {
                await this.hostManager.modules.storage.importSession(file);
            } catch (error) {
                console.error('Erreur import session:', error);
                alert('Erreur lors de l\'import: ' + error.message);
            }
        }
    }
} 