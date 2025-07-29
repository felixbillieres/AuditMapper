/**
 * Interface utilisateur pour la gestion des hôtes
 */

export class HostUI {
    constructor(hostManager) {
        this.hostManager = hostManager;
        this.editPanel = null;
        this.editHostForm = null;
        this.currentEditingHost = null;
        this.currentScreenshot = null;
        this.currentScreenshots = [];
    }

    initialize() {
        console.log(">>> HostUI.initialize: START");
        this.editPanel = document.getElementById('editPanel');
        this.editHostForm = document.getElementById('editHostForm');

        if (this.editHostForm) {
            this.editHostForm.addEventListener('submit', (e) => this.saveHost(e));
        }

        this.setupEventListeners();
        console.log(">>> HostUI.initialize: END");
    }

    setupEventListeners() {
        // Bouton fermer panneau
        const closePanelBtn = document.getElementById('closePanelBtn');
        if (closePanelBtn) {
            closePanelBtn.addEventListener('click', () => this.closeEditPanel());
        }

        // Bouton supprimer hôte
        const deleteHostBtn = document.getElementById('deleteHostFromPanelBtn');
        if (deleteHostBtn) {
            deleteHostBtn.addEventListener('click', () => this.deleteCurrentHost());
        }

        // Bouton agrandir panneau
        const toggleWidePanelBtn = document.getElementById('toggleWidePanelBtn');
        if (toggleWidePanelBtn) {
            toggleWidePanelBtn.addEventListener('click', () => this.toggleWidePanel());
        }

        // Bouton ajouter edge
        const addEdgeBtn = document.getElementById('addEdgeBtn');
        if (addEdgeBtn) {
            addEdgeBtn.addEventListener('click', () => this.addEdge());
        }

        // Bouton ajouter tag
        const addTagBtn = document.getElementById('addTagBtn');
        if (addTagBtn) {
            addTagBtn.addEventListener('click', () => this.addTag());
        }

        // Bouton ajouter credential
        const addCredentialBtn = document.getElementById('addCredentialBtn');
        if (addCredentialBtn) {
            addCredentialBtn.addEventListener('click', () => this.addCredential());
        }

        // Bouton ajouter étape d'exploitation
        const addExploitationStepBtn = document.getElementById('addExploitationStepBtn');
        if (addExploitationStepBtn) {
            addExploitationStepBtn.addEventListener('click', () => this.addExploitationStep());
        }

        // Bouton ajouter output
        const addOutputBtn = document.getElementById('addOutputBtn');
        if (addOutputBtn) {
            addOutputBtn.addEventListener('click', () => this.addOutput());
        }

        // Bouton ajouter vulnérabilité
        const addVulnerabilityBtn = document.getElementById('addVulnerabilityBtn');
        if (addVulnerabilityBtn) {
            addVulnerabilityBtn.addEventListener('click', () => this.addVulnerability());
        }

        // Bouton générer rapport
        const generateReportBtn = document.getElementById('generateReportBtn');
        if (generateReportBtn) {
            generateReportBtn.addEventListener('click', () => this.generateHostReport());
        }
    }

    addHost() {
        const activeCategory = this.hostManager.getActiveCategory();
        if (!activeCategory) {
            alert('Veuillez d\'abord sélectionner une catégorie.');
            return;
        }

        const hostId = prompt('Entrez l\'ID de l\'hôte:');
        if (!hostId || !hostId.trim()) return;

        const trimmedId = hostId.trim();
        const hostData = this.hostManager.getData();

        // Vérifier si l'hôte existe déjà
        for (const categoryName in hostData.categories) {
            if (hostData.categories[categoryName].hosts && hostData.categories[categoryName].hosts[trimmedId]) {
                alert('Un hôte avec cet ID existe déjà!');
                return;
            }
        }

        // Ajouter l'hôte
        if (!hostData.categories[activeCategory].hosts) {
            hostData.categories[activeCategory].hosts = {};
        }

        hostData.categories[activeCategory].hosts[trimmedId] = {
            system: '',
            role: '',
            zone: '',
            compromiseLevel: 'None',
            tags: [],
            notes: '',
            credentials: [],
            outputs: [],
            exploitationSteps: []
        };

        this.hostManager.updateData(hostData);
        
        // Ouvrir directement l'édition du nouvel hôte
        this.editHost(trimmedId);
    }

    editHost(hostId) {
        console.log(`>>> editHost called with hostId: ${hostId}`);
        
        const hostData = this.hostManager.getData();
        let foundHost = null;
        let foundCategory = null;

        // Chercher l'hôte dans toutes les catégories
        for (const categoryName in hostData.categories) {
            const category = hostData.categories[categoryName];
            if (category.hosts && category.hosts[hostId]) {
                foundHost = category.hosts[hostId];
                foundCategory = categoryName;
                console.log(`Host found in category: ${categoryName}`, foundHost);
                break;
            }
        }

        if (!foundHost) {
            console.error(`Host ${hostId} not found in any category`);
            alert(`Hôte "${hostId}" introuvable.`);
            return;
        }

        // Stocker les informations de l'hôte en cours d'édition
        this.currentEditingHost = {
            id: hostId,
            category: foundCategory,
            data: foundHost
        };

        // Définir le host en cours d'édition dans le ExploitationManager
        this.hostManager.modules.exploitation.setCurrentEditingHost(this.currentEditingHost);

        console.log(`Setting up edit panel for host: ${hostId}`);
        
        // IMPORTANT: Afficher le panneau ET créer le contenu AVANT de remplir le formulaire
        this.showEditPanel();
        
        // Attendre un petit délai pour s'assurer que le DOM est mis à jour
        setTimeout(() => {
            // Maintenant remplir le formulaire (après que les éléments DOM existent)
            this.populateHostForm(foundHost, hostId);
            console.log(`Edit panel should now be visible with data`);
        }, 100);
    }

    populateHostForm(host, hostId) {
        console.log(">>> populateHostForm called with:", hostId, host);

        // Remplir les champs de base
        document.getElementById('editHostId').value = hostId;
        document.getElementById('editSystem').value = host.system || '';
        document.getElementById('editRole').value = host.role || '';
        document.getElementById('editZone').value = host.zone || '';
        document.getElementById('editCompromiseLevel').value = host.compromiseLevel || 'None';
        document.getElementById('editNotes').value = host.notes || '';

        // Mise à jour des titres avec emojis
        const credentialsTitle = document.querySelector('#credentialsSection h6');
        if (credentialsTitle) {
            credentialsTitle.innerHTML = '<i class="fas fa-key"></i> 🔑 Identifiants';
        }

        const edgesTitle = document.querySelector('#edgesSection h6');
        if (edgesTitle) {
            edgesTitle.innerHTML = '<i class="fas fa-project-diagram"></i> 🔗 Connexions sortantes';
        }

        const exploitationTitle = document.querySelector('#exploitationStepsSection h6');
        if (exploitationTitle) {
            exploitationTitle.innerHTML = '<i class="fas fa-crosshairs"></i> ⚔️ Étapes d\'exploitation';
        }

        const outputsTitle = document.querySelector('#outputsSection h6');
        if (outputsTitle) {
            outputsTitle.innerHTML = '<i class="fas fa-terminal"></i> 📄 Sorties / Dumps';
        }

        // Remplir les sections
        this.populateTagsSection(host.tags || []);
        this.populateCredentialsSection(host.credentials || []);
        this.populateEdgesSection(this.getHostEdges(hostId));
        this.hostManager.modules.exploitation.populateExploitationStepsSection(host.exploitationSteps || []);
        this.populateOutputsSection(host.outputs || []);
        this.populateVulnerabilitiesSection(host.vulnerabilities || []);
    }

    populateTagsSection(tags) {
        console.log(`>>> populateTagsSection called with:`, tags);
        
        const container = document.getElementById('editTagsContainer');
        if (!container) {
            console.warn("editTagsContainer not found");
            return;
        }

        container.innerHTML = '';

        if (!tags || tags.length === 0) {
            container.innerHTML = '<p class="text-muted small">Aucun tag.</p>';
            return;
        }

        tags.forEach((tag, index) => {
            const tagElement = document.createElement('span');
            tagElement.className = 'badge badge-secondary mr-1 mb-1';
            tagElement.innerHTML = `
                ${tag}
                <button type="button" class="btn btn-sm ml-1 p-0" onclick="hostManager.modules.hostUI.removeTag(${index})" style="color: white; background: none; border: none;">×</button>
            `;
            container.appendChild(tagElement);
        });
    }

    populateEdgesSection(edges) {
        const container = document.getElementById('edgesList');
        if (!container) return;

        container.innerHTML = '';

        if (!edges || edges.length === 0) {
            container.innerHTML = '<p class="text-muted">🔗 Aucune connexion sortante.</p>';
            return;
        }

        edges.forEach((edge, index) => {
            const edgeElement = document.createElement('div');
            edgeElement.className = 'edge-item mb-2 p-2 border rounded';
            edgeElement.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div class="flex-grow-1">
                        <span class="text-muted small">🔗 Connexion vers:</span><br>
                        <strong>${edge.to}</strong>
                        ${edge.type ? `<span class="badge badge-info ml-2">${edge.type}</span>` : ''}
                    </div>
                    <button type="button" class="btn btn-outline-danger btn-sm" onclick="hostManager.modules.hostUI.removeEdge('${edge.to}')" title="Supprimer cette connexion">
                        🗑️
                    </button>
                </div>
            `;
            container.appendChild(edgeElement);
        });
    }

    saveHost(event) {
        if (event) {
            event.preventDefault();
        }

        if (!this.currentEditingHost) {
            console.warn("No current editing host to save");
            return;
        }

        console.log(`>>> saveHost called for ${this.currentEditingHost.id}`);

        // Récupérer les valeurs du formulaire
        const hostIdInput = document.getElementById('editHostId');
        const systemInput = document.getElementById('editSystem');
        const roleInput = document.getElementById('editRole');
        const zoneInput = document.getElementById('editZone');
        const compromiseLevelSelect = document.getElementById('editCompromiseLevel');
        const notesTextarea = document.getElementById('editNotes');

        // Mettre à jour les données de l'hôte
        if (systemInput) this.currentEditingHost.data.system = systemInput.value.trim();
        if (roleInput) this.currentEditingHost.data.role = roleInput.value.trim();
        if (zoneInput) this.currentEditingHost.data.zone = zoneInput.value.trim();
        if (compromiseLevelSelect) this.currentEditingHost.data.compromiseLevel = compromiseLevelSelect.value;
        if (notesTextarea) this.currentEditingHost.data.notes = notesTextarea.value.trim();

        // Sauvegarder dans le storage
        const hostData = this.hostManager.getData();
        if (hostData.categories[this.currentEditingHost.category] && 
            hostData.categories[this.currentEditingHost.category].hosts) {
            hostData.categories[this.currentEditingHost.category].hosts[this.currentEditingHost.id] = this.currentEditingHost.data;
        }

        this.hostManager.updateData(hostData);
        
        console.log(`Host ${this.currentEditingHost.id} saved successfully`);
        
        // Optionnel : fermer le panneau après sauvegarde
        // this.closeEditPanel();
    }

    getTagsData() {
        const container = document.getElementById('editTagsContainer');
        if (!container) return [];

        const tags = [];
        const tagInputs = container.querySelectorAll('.tag-input');
        
        tagInputs.forEach(input => {
            const value = input.value.trim();
            if (value) {
                tags.push(value);
            }
        });

        return tags;
    }

    addTag() {
        const tagInput = document.getElementById('newTagInput');
        if (!tagInput) {
            console.warn("newTagInput not found");
            return;
        }

        const tagValue = tagInput.value.trim();
        if (!tagValue) {
            alert('Veuillez entrer un tag.');
            return;
        }

        if (!this.currentEditingHost) {
            console.warn("No current editing host");
            return;
        }

        // Ajouter le tag aux données de l'hôte
        if (!this.currentEditingHost.data.tags) {
            this.currentEditingHost.data.tags = [];
        }

        if (!this.currentEditingHost.data.tags.includes(tagValue)) {
            this.currentEditingHost.data.tags.push(tagValue);
            this.populateTagsSection(this.currentEditingHost.data.tags);
            tagInput.value = '';
        } else {
            alert('Ce tag existe déjà.');
        }
    }

    removeTag(index) {
        if (!this.currentEditingHost || !this.currentEditingHost.data.tags) {
            return;
        }

        this.currentEditingHost.data.tags.splice(index, 1);
        this.populateTagsSection(this.currentEditingHost.data.tags);
    }

    addEdge() {
        if (!this.currentEditingHost) return;

        const targetHostId = prompt('Entrez l\'ID de l\'hôte de destination:');
        if (!targetHostId || !targetHostId.trim()) return;

        const label = prompt('Entrez le label de la connexion (optionnel):') || '';

        const hostData = this.hostManager.getData();
        const { id: sourceHostId } = this.currentEditingHost;

        // Vérifier que l'hôte de destination existe
        let targetExists = false;
        for (const categoryName in hostData.categories) {
            if (hostData.categories[categoryName].hosts && hostData.categories[categoryName].hosts[targetHostId.trim()]) {
                targetExists = true;
                break;
            }
        }

        if (!targetExists) {
            alert('L\'hôte de destination n\'existe pas!');
            return;
        }

        // Ajouter l'edge
        hostData.edges.push({
            from: sourceHostId,
            to: targetHostId.trim(),
            label: label.trim()
        });

        this.hostManager.updateData(hostData);
        this.populateEdgesSection(hostData.edges);
    }

    deleteHost(hostId) {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer l'hôte "${hostId}" ?`)) {
            return;
        }

        const hostData = this.hostManager.getData();
        
        // Trouver et supprimer l'hôte
        for (const categoryName in hostData.categories) {
            const category = hostData.categories[categoryName];
            if (category.hosts && category.hosts[hostId]) {
                delete category.hosts[hostId];
                break;
            }
        }

        // Supprimer les edges liés
        hostData.edges = hostData.edges.filter(edge => 
            edge.from !== hostId && edge.to !== hostId
        );

        this.hostManager.updateData(hostData);
        this.closeEditPanel();
    }

    deleteCurrentHost() {
        if (this.currentEditingHost) {
            this.deleteHost(this.currentEditingHost.id);
        }
    }

    showEditPanel() {
        console.log(`>>> showEditPanel called`);
        
        if (!this.editPanel) {
            console.error("Edit panel element not found!");
            this.editPanel = document.getElementById('editPanel');
        }
        
        if (this.editPanel) {
            // S'assurer que le contenu existe AVANT d'afficher
            this.ensureSidebarContent();
            
            console.log("Adding 'active' class to edit panel");
            this.editPanel.classList.add('active');
            
            // Vérifier que la classe a bien été ajoutée
            setTimeout(() => {
                const hasActiveClass = this.editPanel.classList.contains('active');
                console.log(`Edit panel has 'active' class: ${hasActiveClass}`);
                
                // Vérifier les styles CSS
                const computedStyle = window.getComputedStyle(this.editPanel);
                console.log(`Edit panel right position: ${computedStyle.right}`);
            }, 100);
        } else {
            console.error("Edit panel element still not found after retry!");
        }
    }

    closeEditPanel() {
        if (this.editPanel) {
            this.editPanel.classList.remove('active');
        }
        this.currentEditingHost = null;
    }

    toggleWidePanel() {
        if (this.editPanel) {
            this.editPanel.classList.toggle('wide');
        }
    }

    removeEdge(targetHostId) {
        if (!this.currentEditingHost) return;
        
        if (confirm(`Supprimer la connexion vers ${targetHostId} ?`)) {
            const hostData = this.hostManager.getData();
            
            // Supprimer l'edge de la liste globale
            hostData.edges = hostData.edges.filter(edge => 
                !(edge.from === this.currentEditingHost.id && edge.to === targetHostId)
            );
            
            // Sauvegarder
            this.hostManager.updateData(hostData);
            
            // Mettre à jour l'affichage
            this.populateEdgesSection(this.getHostEdges(this.currentEditingHost.id));
        }
    }

    ensureSidebarContent() {
        if (!this.editPanel) return;

        // Vérifier si les éléments critiques existent vraiment
        const criticalElements = [
            'editHostId', 'editSystem', 'editRole', 'editZone', 
            'editCompromiseLevel', 'editNotes', 'editPanelTitle'
        ];
        
        let allElementsExist = true;
        for (const elementId of criticalElements) {
            if (!document.getElementById(elementId)) {
                allElementsExist = false;
                console.log(`Missing critical element: ${elementId}`);
                break;
            }
        }

        // Si tous les éléments existent, pas besoin de recréer
        if (allElementsExist) {
            console.log("All sidebar elements exist, no need to recreate");
            return;
        }

        console.log("Creating/recreating sidebar content dynamically");
        
        // Créer le contenu de la sidebar (forcer la recréation)
        this.editPanel.innerHTML = `
            <div class="edit-panel-header">
                <button id="closePanelBtn" class="close-panel-btn" title="Fermer">&times;</button>
                <button id="toggleWidePanelBtn" class="btn btn-sm btn-outline-secondary" title="Agrandir/Réduire">
                    <i class="fas fa-expand-arrows-alt"></i>
                </button>
                <h3 id="editPanelTitle">Édition d'hôte</h3>
            </div>
            
            <div class="edit-panel-content">
                <form id="editHostForm">
                    <!-- Informations de base -->
                    <div class="card mb-3">
                        <div class="card-header">
                            <h5 class="mb-0"><i class="fas fa-server"></i> Informations de base</h5>
                        </div>
                        <div class="card-body">
                            <div class="form-group">
                                <label for="editHostId">ID de l'hôte:</label>
                                <input type="text" id="editHostId" class="form-control" readonly>
                            </div>
                            
                            <div class="form-group">
                                <label for="editSystem">Système:</label>
                                <input type="text" id="editSystem" class="form-control" placeholder="ex: Windows Server 2019">
                            </div>
                            
                            <div class="form-group">
                                <label for="editRole">Rôle:</label>
                                <input type="text" id="editRole" class="form-control" placeholder="ex: Domain Controller">
                            </div>
                            
                            <div class="form-group">
                                <label for="editZone">Zone:</label>
                                <input type="text" id="editZone" class="form-control" placeholder="ex: DMZ, Internal">
                            </div>
                            
                            <div class="form-group">
                                <label for="editCompromiseLevel">Niveau de compromission:</label>
                                <select id="editCompromiseLevel" class="form-control">
                                    <option value="None">🎯 Non compromis</option>
                                    <option value="Initial">🦶 Foothold initial</option>
                                    <option value="Partial">🔓 Accès partiel</option>
                                    <option value="Full">👑 Accès root/admin</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="editNotes">Notes:</label>
                                <textarea id="editNotes" class="form-control" rows="3" placeholder="Notes sur cet hôte..."></textarea>
                            </div>
                        </div>
                    </div>

                    <!-- Tags -->
                    <div class="card mb-3">
                        <div class="card-header">
                            <h5 class="mb-0"><i class="fas fa-tags"></i> Tags</h5>
                        </div>
                        <div class="card-body">
                            <div id="editTagsContainer" class="mb-2"></div>
                            <div class="input-group">
                                <input type="text" id="newTagInput" class="form-control" placeholder="Nouveau tag">
                                <div class="input-group-append">
                                    <button type="button" id="addTagBtn" class="btn btn-outline-primary">
                                        <i class="fas fa-plus"></i> Ajouter
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Connexions réseau -->
                    <div class="card mb-3">
                        <div class="card-header">
                            <h5 class="mb-0"><i class="fas fa-network-wired"></i> Connexions sortantes</h5>
                        </div>
                        <div class="card-body">
                            <div id="edgesList" class="mb-2"></div>
                            <button type="button" id="addEdgeBtn" class="btn btn-outline-primary btn-sm">
                                <i class="fas fa-plus"></i> Ajouter connexion
                            </button>
                        </div>
                    </div>

                    <!-- Identifiants -->
                    <div class="card mb-3">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0"><i class="fas fa-key"></i> Identifiants</h5>
                            <button type="button" id="addCredentialBtn" class="btn btn-outline-primary btn-sm">
                                <i class="fas fa-plus"></i> Ajouter
                            </button>
                        </div>
                        <div class="card-body">
                            <div id="credentialsList"></div>
                        </div>
                    </div>

                    <!-- Étapes d'exploitation -->
                    <div class="card mb-3">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0"><i class="fas fa-crosshairs"></i> Étapes d'exploitation</h5>
                            <button type="button" id="addExploitationStepBtn" class="btn btn-outline-primary btn-sm">
                                <i class="fas fa-plus"></i> Ajouter étape
                            </button>
                        </div>
                        <div class="card-body">
                            <div id="exploitationStepsList"></div>
                        </div>
                    </div>

                    <!-- Sorties/Outputs -->
                    <div class="card mb-3">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0"><i class="fas fa-terminal"></i> Sorties/Outputs</h5>
                            <button type="button" id="addOutputBtn" class="btn btn-outline-primary btn-sm">
                                <i class="fas fa-plus"></i> Ajouter output
                            </button>
                        </div>
                        <div class="card-body">
                            <div id="outputsList"></div>
                        </div>
                    </div>

                    <!-- Vulnérabilités -->
                    <div class="card mb-3">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0"><i class="fas fa-bug"></i> Vulnérabilités</h5>
                            <button type="button" id="addVulnerabilityBtn" class="btn btn-outline-warning btn-sm">
                                <i class="fas fa-plus"></i> Ajouter vulnérabilité
                            </button>
                        </div>
                        <div class="card-body">
                            <div id="vulnerabilitiesList"></div>
                        </div>
                    </div>

                    <!-- Services -->
                    <div class="card mb-3">
                        <div class="card-header">
                            <h5 class="mb-0"><i class="fas fa-cogs"></i> Services</h5>
                        </div>
                        <div class="card-body">
                            <div class="form-group">
                                <label for="editServices">Services détectés:</label>
                                <textarea id="editServices" class="form-control" rows="2" placeholder="ex: 80/tcp (HTTP), 443/tcp (HTTPS)"></textarea>
                            </div>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="card">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-save"></i> Sauvegarder
                                </button>
                                <div>
                                    <button type="button" id="generateReportBtn" class="btn btn-info mr-2">
                                        <i class="fas fa-file-alt"></i> Rapport
                                    </button>
                                    <button type="button" id="deleteHostFromPanelBtn" class="btn btn-danger">
                                        <i class="fas fa-trash"></i> Supprimer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        `;

        // Réattacher les événements après création du contenu
        this.setupEventListeners();
        
        // Vérifier que les éléments ont bien été créés
        setTimeout(() => {
            const testElement = document.getElementById('editSystem');
            if (testElement) {
                console.log("✅ Sidebar content created successfully - elements are accessible");
            } else {
                console.error("❌ Failed to create sidebar content - elements still not found");
            }
        }, 50);
    }

    addCredential() {
        if (!this.currentEditingHost) return;

        // Créer un formulaire inline dans la sidebar
        const container = document.getElementById('credentialsList');
        if (!container) return;

        // Vérifier s'il y a déjà un formulaire d'ajout ouvert
        if (container.querySelector('.credential-add-form')) {
            return; // Un formulaire est déjà ouvert
        }

        const addForm = document.createElement('div');
        addForm.className = 'credential-add-form mb-3 p-3 border rounded bg-light';
        addForm.innerHTML = `
            <h6 class="mb-3"><i class="fas fa-plus"></i> Nouvel identifiant</h6>
            <div class="form-group">
                <label for="newCredUsername">Nom d'utilisateur:</label>
                <input type="text" id="newCredUsername" class="form-control form-control-sm" placeholder="ex: admin, user@domain.com">
            </div>
            <div class="form-group">
                <label for="newCredPassword">Mot de passe:</label>
                <input type="text" id="newCredPassword" class="form-control form-control-sm" placeholder="Optionnel">
            </div>
            <div class="form-group">
                <label for="newCredType">Type:</label>
                <select id="newCredType" class="form-control form-control-sm">
                    <option value="local">Local</option>
                    <option value="domain">Domaine</option>
                    <option value="service">Service</option>
                    <option value="database">Base de données</option>
                    <option value="ssh">SSH</option>
                    <option value="other">Autre</option>
                </select>
            </div>
            <div class="form-group">
                <label for="newCredNotes">Notes:</label>
                <textarea id="newCredNotes" class="form-control form-control-sm" rows="2" placeholder="Notes additionnelles..."></textarea>
            </div>
            <div class="d-flex justify-content-end">
                <button type="button" class="btn btn-secondary btn-sm mr-2" onclick="hostManager.modules.hostUI.cancelAddCredential()">
                    Annuler
                </button>
                <button type="button" class="btn btn-primary btn-sm" onclick="hostManager.modules.hostUI.saveNewCredential()">
                    <i class="fas fa-save"></i> Sauvegarder
                </button>
            </div>
        `;

        container.insertBefore(addForm, container.firstChild);
        document.getElementById('newCredUsername').focus();
    }

    saveNewCredential() {
        const username = document.getElementById('newCredUsername')?.value.trim() || '';
        const password = document.getElementById('newCredPassword')?.value.trim() || '';
        const type = document.getElementById('newCredType')?.value || 'local';
        const notes = document.getElementById('newCredNotes')?.value.trim() || '';

        if (!username && !password) {
            alert('Veuillez entrer au moins un nom d\'utilisateur ou un mot de passe.');
            return;
        }

        const newCredential = {
            username,
            password,
            type,
            notes,
            timestamp: new Date().toISOString()
        };

        if (!this.currentEditingHost.data.credentials) {
            this.currentEditingHost.data.credentials = [];
        }

        this.currentEditingHost.data.credentials.push(newCredential);
        
        // IMPORTANT: Sauvegarder immédiatement dans le storage
        this.saveCurrentHostData();
        
        this.cancelAddCredential();
        this.populateCredentialsSection(this.currentEditingHost.data.credentials);
    }

    removeCredential(index) {
        if (!this.currentEditingHost || !this.currentEditingHost.data.credentials) return;
        
        if (confirm('Supprimer cet identifiant ?')) {
            this.currentEditingHost.data.credentials.splice(index, 1);
            this.saveCurrentHostData();
            this.populateCredentialsSection(this.currentEditingHost.data.credentials);
        }
    }

    // Nouvelle méthode pour sauvegarder automatiquement
    saveCurrentHostData() {
        if (!this.currentEditingHost) return;

        const hostData = this.hostManager.getData();
        if (hostData.categories[this.currentEditingHost.category] && 
            hostData.categories[this.currentEditingHost.category].hosts) {
            
            hostData.categories[this.currentEditingHost.category].hosts[this.currentEditingHost.id] = this.currentEditingHost.data;
            this.hostManager.updateData(hostData);
            
            console.log(`Auto-saved data for host: ${this.currentEditingHost.id}`);
        }
    }

    cancelAddCredential() {
        const form = document.querySelector('.credential-add-form');
        if (form) {
            form.remove();
        }
    }

    populateCredentialsSection(credentials) {
        console.log(">>> populateCredentialsSection called with:", credentials);
        
        const container = document.getElementById('credentialsList');
        if (!container) {
            console.warn("Credentials container not found");
            return;
        }

        container.innerHTML = '';

        if (!credentials || credentials.length === 0) {
            container.innerHTML = '<p class="text-muted">🔑 Aucun identifiant enregistré.</p>';
            return;
        }

        credentials.forEach((credential, index) => {
            const credElement = this.createCredentialElement(credential, index);
            container.appendChild(credElement);
        });
    }

    createCredentialElement(credential, index) {
        const div = document.createElement('div');
        div.className = 'credential-item mb-2 p-2 border rounded';
        
        const typeIcon = {
            'local': '👤',
            'domain': '🏢', 
            'service': '⚙️',
            'database': '🗄️',
            'ssh': '🔑',
            'ftp': '📁',
            'web': '🌐'
        }[credential.type] || '🔑';
        
        div.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                    <div class="mb-1">
                        <span class="text-muted small">${typeIcon} ${credential.type || 'Identifiant'}:</span>
                    </div>
                    <strong>👤 ${credential.username || 'N/A'}</strong>
                    <span class="text-muted">: ${credential.password ? '🔒 ••••••••' : '❌ Pas de mot de passe'}</span>
                    ${credential.hash ? `<br><small class="text-info">🔐 Hash: ${credential.hash.substring(0, 20)}...</small>` : ''}
                    ${credential.notes ? `<br><small class="text-muted">📝 ${credential.notes}</small>` : ''}
                </div>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-secondary btn-sm" onclick="hostManager.modules.hostUI.editCredential(${index})" title="Éditer">
                        ✏️
                    </button>
                    <button class="btn btn-outline-info btn-sm" onclick="hostManager.modules.hostUI.copyCredential(${index})" title="Copier">
                        📋
                    </button>
                    <button class="btn btn-outline-danger btn-sm" onclick="hostManager.modules.hostUI.removeCredential(${index})" title="Supprimer">
                        🗑️
                    </button>
                </div>
            </div>
        `;

        return div;
    }

    copyCredential(index) {
        if (!this.currentEditingHost || !this.currentEditingHost.data.credentials) return;
        
        const credential = this.currentEditingHost.data.credentials[index];
        if (credential) {
            let credText = `Username: ${credential.username || 'N/A'}\n`;
            credText += `Password: ${credential.password || 'N/A'}\n`;
            if (credential.hash) credText += `Hash: ${credential.hash}\n`;
            if (credential.type) credText += `Type: ${credential.type}\n`;
            if (credential.notes) credText += `Notes: ${credential.notes}\n`;
            
            navigator.clipboard.writeText(credText).then(() => {
                this.showNotification('🔑 Identifiant copié dans le presse-papiers !', 'success');
            }).catch(() => {
                // Fallback
                const textArea = document.createElement('textarea');
                textArea.value = credText;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                this.showNotification('🔑 Identifiant copié dans le presse-papiers !', 'success');
            });
        }
    }

    addExploitationStep() {
        if (!this.currentEditingHost) return;
        
        this.hostManager.modules.exploitation.addExploitationStep();
    }

    addOutput() {
        if (!this.currentEditingHost) return;
        
        // Utiliser le module OutputManager pour gérer les outputs
        this.hostManager.modules.outputs.showOutputTypeSelection();
    }







    editExploitationStep(index) {
        if (!this.currentEditingHost?.data.exploitationSteps || !this.currentEditingHost.data.exploitationSteps[index]) {
            return;
        }

        this.hostManager.modules.exploitation.editExploitationStep(index);
    }

    removeExploitationStep(index) {
        if (!this.currentEditingHost || !this.currentEditingHost.data.exploitationSteps) return;

        this.hostManager.modules.exploitation.removeExploitationStep(index);
    }



    getSeverityColor(severity) {
        const colors = {
            'Low': 'success',
            'Medium': 'warning', 
            'High': 'danger',
            'Critical': 'dark'
        };
        return colors[severity] || 'secondary';
    }





    addVulnerability() {
        if (!this.currentEditingHost) return;

        const name = prompt('Nom de la vulnérabilité:');
        if (!name) return;

        const severity = prompt('Sévérité (Low/Medium/High/Critical):') || 'Medium';
        const description = prompt('Description:') || '';

        const newVuln = {
            name: name.trim(),
            severity: severity.trim(),
            description: description.trim(),
            timestamp: new Date().toISOString()
        };

        if (!this.currentEditingHost.data.vulnerabilities) {
            this.currentEditingHost.data.vulnerabilities = [];
        }

        this.currentEditingHost.data.vulnerabilities.push(newVuln);
        this.populateVulnerabilitiesSection(this.currentEditingHost.data.vulnerabilities);
    }

    removeVulnerability(index) {
        if (!this.currentEditingHost || !this.currentEditingHost.data.vulnerabilities) return;
        
        if (confirm('Supprimer cette vulnérabilité ?')) {
            this.currentEditingHost.data.vulnerabilities.splice(index, 1);
            this.populateVulnerabilitiesSection(this.currentEditingHost.data.vulnerabilities);
        }
    }

    populateVulnerabilitiesSection(vulnerabilities) {
        const container = document.getElementById('vulnerabilitiesList');
        if (!container) return;

        container.innerHTML = '';

        if (!vulnerabilities || vulnerabilities.length === 0) {
            container.innerHTML = '<p class="text-muted">🛡️ Aucune vulnérabilité documentée.</p>';
            return;
        }

        vulnerabilities.forEach((vuln, index) => {
            const severityIcon = {
                'Low': '🟢',
                'Medium': '🟡', 
                'High': '🟠',
                'Critical': '🔴'
            }[vuln.severity] || '⚪';

            const vulnElement = document.createElement('div');
            vulnElement.className = 'vulnerability-item mb-2 p-2 border rounded';
            vulnElement.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div class="flex-grow-1">
                        <span class="text-muted small">🛡️ Vulnérabilité:</span><br>
                        <strong>${vuln.title || `Vulnérabilité ${index + 1}`}</strong>
                        ${vuln.cve ? `<span class="badge badge-warning ml-2">${vuln.cve}</span>` : ''}
                        <span class="badge badge-${this.getSeverityBadgeClass(vuln.severity)} ml-2">${severityIcon} ${vuln.severity || 'Unknown'}</span>
                        ${vuln.description ? `<br><small class="text-muted">${vuln.description}</small>` : ''}
                    </div>
                    <button type="button" class="btn btn-outline-danger btn-sm" onclick="hostManager.modules.hostUI.removeVulnerability(${index})" title="Supprimer">
                        🗑️
                    </button>
                </div>
            `;
            container.appendChild(vulnElement);
        });
    }

    getSeverityBadgeClass(severity) {
        const classes = {
            'Low': 'success',
            'Medium': 'warning', 
            'High': 'danger',
            'Critical': 'dark'
        };
        return classes[severity] || 'secondary';
    }

    generateHostReport() {
        if (!this.currentEditingHost) return;

        // Intégration avec le système de rapports existant
        if (this.hostManager.modules.reports) {
            this.hostManager.modules.reports.generateHostReport(this.currentEditingHost.id);
        } else {
            alert('Module de rapports non disponible');
        }
    }



    getHostEdges(hostId) {
        const hostData = this.hostManager.getData();
        if (!hostData.edges) return [];
        
        // Retourner toutes les connexions sortantes de ce host
        return hostData.edges.filter(edge => edge.from === hostId);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} notification-toast`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 250px;
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 2000);
    }

    editCredential(index) {
        console.log(`Editing credential ${index}`);
        // TODO: Implémenter l'édition des credentials
        alert('Fonctionnalité d\'édition des credentials à implémenter');
    }

    populateOutputsSection(outputs) {
        const container = document.getElementById('outputsList');
        if (!container) return;

        container.innerHTML = '';

        if (!outputs || outputs.length === 0) {
            container.innerHTML = '<p class="text-muted">📄 Aucune sortie/dump enregistré.</p>';
            return;
        }

        outputs.forEach((output, index) => {
            const outputElement = document.createElement('div');
            outputElement.className = 'output-item mb-3 p-3 border rounded';
            outputElement.innerHTML = `
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div class="flex-grow-1">
                        <h6 class="mb-1">📄 ${output.title || `Sortie ${index + 1}`}</h6>
                        ${output.description ? `<small class="text-muted">${output.description}</small>` : ''}
                    </div>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-info btn-sm" onclick="hostManager.modules.hostUI.copyOutput(${index})" title="Copier le contenu">
                            📋
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="hostManager.modules.hostUI.removeOutput(${index})" title="Supprimer">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="output-content">
                    <pre class="bg-light p-2 rounded" style="max-height: 200px; overflow-y: auto; font-size: 0.85em;">${output.content || ''}</pre>
                </div>
            `;
            container.appendChild(outputElement);
        });
    }

    removeOutput(index) {
        if (!this.currentEditingHost || !this.currentEditingHost.data.outputs) return;
        
        if (confirm('Supprimer cette sortie ?')) {
            this.currentEditingHost.data.outputs.splice(index, 1);
            this.saveCurrentHostData();
            this.populateOutputsSection(this.currentEditingHost.data.outputs);
        }
    }

    copyOutput(index) {
        if (!this.currentEditingHost || !this.currentEditingHost.data.outputs) return;
        
        const output = this.currentEditingHost.data.outputs[index];
        if (output && output.content) {
            navigator.clipboard.writeText(output.content).then(() => {
                this.showNotification('📄 Contenu copié dans le presse-papiers !', 'success');
            }).catch(() => {
                // Fallback pour les navigateurs plus anciens
                const textArea = document.createElement('textarea');
                textArea.value = output.content;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                this.showNotification('📄 Contenu copié dans le presse-papiers !', 'success');
            });
        }
    }
}