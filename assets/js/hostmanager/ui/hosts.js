/**
 * Interface utilisateur pour la gestion des hôtes
 */

export class HostUI {
    constructor(hostManager) {
        this.hostManager = hostManager;
        this.editPanel = null;
        this.editHostForm = null;
        this.currentEditingHost = null;
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

        console.log(`Setting up edit panel for host: ${hostId}`);
        
        // IMPORTANT: Afficher le panneau ET créer le contenu AVANT de remplir le formulaire
        this.showEditPanel();
        
        // Attendre un petit délai pour s'assurer que le DOM est mis à jour
        setTimeout(() => {
            // Maintenant remplir le formulaire (après que les éléments DOM existent)
            this.populateEditForm(hostId, foundHost, foundCategory);
            console.log(`Edit panel should now be visible with data`);
        }, 100);
    }

    populateEditForm(hostId, host, categoryName) {
        console.log(`>>> populateEditForm for ${hostId}`, host);
        
        // Vérifier d'abord que tous les éléments existent
        const elements = {
            hostId: document.getElementById('editHostId'),
            system: document.getElementById('editSystem'),
            role: document.getElementById('editRole'),
            zone: document.getElementById('editZone'),
            compromiseLevel: document.getElementById('editCompromiseLevel'),
            notes: document.getElementById('editNotes'),
            panelTitle: document.getElementById('editPanelTitle'),
            tagsContainer: document.getElementById('editTagsContainer'),
            edgesContainer: document.getElementById('editEdgesContainer')
        };

        // Logger tous les éléments trouvés/manquants
        console.log("=== DOM Elements Check ===");
        for (const [name, element] of Object.entries(elements)) {
            if (element) {
                console.log(`✅ ${name}: Found`);
            } else {
                console.error(`❌ ${name}: NOT FOUND - ID: ${name === 'hostId' ? 'editHostId' : name === 'panelTitle' ? 'editPanelTitle' : 'edit' + name.charAt(0).toUpperCase() + name.slice(1)}`);
            }
        }

        // Remplir les champs de base avec vérification
        if (elements.hostId) {
            elements.hostId.value = hostId;
            console.log(`Set hostId: ${hostId}`);
        }

        if (elements.system) {
            elements.system.value = host.system || '';
            console.log(`Set system: ${host.system || ''}`);
        }

        if (elements.role) {
            elements.role.value = host.role || '';
            console.log(`Set role: ${host.role || ''}`);
        }

        if (elements.zone) {
            elements.zone.value = host.zone || '';
            console.log(`Set zone: ${host.zone || ''}`);
        }

        if (elements.compromiseLevel) {
            elements.compromiseLevel.value = host.compromiseLevel || 'None';
            console.log(`Set compromiseLevel: ${host.compromiseLevel || 'None'}`);
        }

        if (elements.notes) {
            elements.notes.value = host.notes || '';
            console.log(`Set notes: ${host.notes || ''}`);
        }

        // Mettre à jour le titre du panneau
        if (elements.panelTitle) {
            elements.panelTitle.textContent = `Édition: ${hostId} (${categoryName})`;
            console.log(`Set panel title: Édition: ${hostId} (${categoryName})`);
        }

        // Remplir les sections spécialisées
        this.populateTagsSection(host.tags || []);
        this.populateEdgesSection(hostId);
        
        // Remplir les modules de fonctionnalités avec vérification des méthodes
        if (this.hostManager.modules.credentials && 
            typeof this.hostManager.modules.credentials.populateCredentialsSection === 'function') {
            this.hostManager.modules.credentials.populateCredentialsSection(host.credentials || []);
        }
        
        if (this.hostManager.modules.outputs && 
            typeof this.hostManager.modules.outputs.populateOutputsSection === 'function') {
            this.hostManager.modules.outputs.populateOutputsSection(host.outputs || []);
        }
        
        if (this.hostManager.modules.exploitation && 
            typeof this.hostManager.modules.exploitation.populateExploitationStepsSection === 'function') {
            this.hostManager.modules.exploitation.populateExploitationStepsSection(host.exploitationSteps || []);
        } else if (this.hostManager.modules.exploitation && 
                   typeof this.hostManager.modules.exploitation.populateExploitationSteps === 'function') {
            // Fallback au cas où la méthode aurait un nom différent
            this.hostManager.modules.exploitation.populateExploitationSteps(host.exploitationSteps || []);
        }
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

    populateEdgesSection(hostId) {
        console.log(`>>> populateEdgesSection called for hostId: ${hostId}`);
        
        const container = document.getElementById('editEdgesContainer');
        if (!container) {
            console.warn("editEdgesContainer not found");
            return;
        }

        const hostData = this.hostManager.getData();
        const outgoingEdges = hostData.edges.filter(edge => edge.from === hostId);

        container.innerHTML = '';

        if (outgoingEdges.length === 0) {
            container.innerHTML = '<p class="text-muted small">Aucune connexion sortante.</p>';
            return;
        }

        outgoingEdges.forEach((edge, index) => {
            const edgeElement = document.createElement('div');
            edgeElement.className = 'edge-item mb-2 p-2 border rounded';
            edgeElement.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${edge.to}</strong>
                        ${edge.label ? `<span class="text-muted">- ${edge.label}</span>` : ''}
                    </div>
                    <button type="button" class="btn btn-outline-danger btn-sm" onclick="hostManager.modules.hostUI.removeEdge(${index})">
                        <i class="fas fa-trash"></i>
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
        this.populateEdgesSection(sourceHostId);
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

    removeEdge(edgeIndex) {
        if (!this.currentEditingHost) return;

        const hostData = this.hostManager.getData();
        const { id: hostId } = this.currentEditingHost;
        
        const outgoingEdges = hostData.edges.filter(edge => edge.from === hostId);
        if (edgeIndex >= 0 && edgeIndex < outgoingEdges.length) {
            const edgeToRemove = outgoingEdges[edgeIndex];
            hostData.edges = hostData.edges.filter(edge => 
                !(edge.from === edgeToRemove.from && edge.to === edgeToRemove.to && edge.label === edgeToRemove.label)
            );
            
            this.hostManager.updateData(hostData);
            this.populateEdgesSection(hostId);
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
                            <div id="editEdgesContainer" class="mb-2"></div>
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
            
            // Sauvegarder immédiatement
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
        const container = document.getElementById('credentialsList');
        if (!container) return;

        // Garder le formulaire d'ajout s'il existe
        const addForm = container.querySelector('.credential-add-form');
        container.innerHTML = '';
        
        if (addForm) {
            container.appendChild(addForm);
        }

        if (!credentials || credentials.length === 0) {
            const emptyMsg = document.createElement('p');
            emptyMsg.className = 'text-muted small';
            emptyMsg.textContent = 'Aucun identifiant enregistré.';
            container.appendChild(emptyMsg);
            return;
        }

        credentials.forEach((credential, index) => {
            const credElement = document.createElement('div');
            credElement.className = 'credential-item mb-2 p-2 border rounded';
            credElement.innerHTML = `
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center mb-1">
                            <strong class="mr-2">${credential.username || 'N/A'}</strong>
                            <span class="badge badge-info badge-sm">${credential.type}</span>
                        </div>
                        <div class="text-muted small">
                            ${credential.password ? `🔑 ••••••••` : '🔑 Pas de mot de passe'}
                        </div>
                        ${credential.notes ? `<div class="text-muted small mt-1">${credential.notes}</div>` : ''}
                    </div>
                    <div class="btn-group btn-group-sm">
                        <button type="button" class="btn btn-outline-secondary" onclick="hostManager.modules.hostUI.editCredential(${index})" title="Éditer">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger" onclick="hostManager.modules.hostUI.removeCredential(${index})" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(credElement);
        });
    }

    addExploitationStep() {
        if (!this.currentEditingHost) return;

        // Créer et afficher le modal pour l'étape d'exploitation
        this.showExploitationStepModal();
    }

    showExploitationStepModal(stepIndex = null) {
        // Supprimer le modal existant s'il y en a un
        const existingModal = document.getElementById('exploitationStepModal');
        if (existingModal) {
            existingModal.remove();
        }

        const isEdit = stepIndex !== null;
        const step = isEdit ? this.currentEditingHost.data.exploitationSteps[stepIndex] : null;

        const modal = document.createElement('div');
        modal.id = 'exploitationStepModal';
        modal.className = 'modal fade show';
        modal.style.display = 'block';
        modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
        
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-crosshairs"></i> 
                            ${isEdit ? 'Modifier l\'étape d\'exploitation' : 'Nouvelle étape d\'exploitation'}
                        </h5>
                        <button type="button" class="close" onclick="hostManager.modules.hostUI.closeExploitationStepModal()">
                            <span>&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="exploitationStepForm">
                            <div class="row">
                                <div class="col-md-8">
                                    <div class="form-group">
                                        <label for="stepTitle">Titre de l'étape *</label>
                                        <input type="text" id="stepTitle" class="form-control" 
                                               value="${step?.title || ''}" 
                                               placeholder="ex: Exploitation Shellshock, Privilege Escalation">
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group">
                                        <label for="stepSeverity">Sévérité</label>
                                        <select id="stepSeverity" class="form-control">
                                            <option value="Low" ${step?.severity === 'Low' ? 'selected' : ''}>🟢 Low</option>
                                            <option value="Medium" ${step?.severity === 'Medium' ? 'selected' : ''}>🟡 Medium</option>
                                            <option value="High" ${step?.severity === 'High' ? 'selected' : ''}>🟠 High</option>
                                            <option value="Critical" ${step?.severity === 'Critical' ? 'selected' : ''}>🔴 Critical</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="stepDescription">Description</label>
                                <textarea id="stepDescription" class="form-control" rows="3" 
                                          placeholder="Description détaillée de l'étape...">${step?.description || ''}</textarea>
                            </div>

                            <div class="form-group">
                                <label for="stepCommand">Commande/Payload</label>
                                <textarea id="stepCommand" class="form-control" rows="2" 
                                          placeholder="Commande utilisée, payload, etc...">${step?.command || ''}</textarea>
                            </div>

                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label for="stepTool">Outil utilisé</label>
                                        <input type="text" id="stepTool" class="form-control" 
                                               value="${step?.tool || ''}" 
                                               placeholder="ex: Metasploit, Burp Suite, Custom">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label for="stepCVE">CVE (optionnel)</label>
                                        <input type="text" id="stepCVE" class="form-control" 
                                               value="${step?.cve || ''}" 
                                               placeholder="ex: CVE-2014-6271">
                                    </div>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="stepScreenshot">Screenshot/Preuve</label>
                                <input type="url" id="stepScreenshot" class="form-control" 
                                       value="${step?.screenshot || ''}" 
                                       placeholder="URL vers une image ou chemin local">
                                <small class="form-text text-muted">
                                    Vous pouvez coller une URL d'image ou un chemin vers un fichier local
                                </small>
                            </div>

                            <div id="screenshotPreview" class="mt-2"></div>

                            <div class="form-group">
                                <label for="stepOutput">Sortie/Résultat</label>
                                <textarea id="stepOutput" class="form-control" rows="4" 
                                          placeholder="Sortie de la commande, résultat obtenu...">${step?.output || ''}</textarea>
                            </div>

                            <div class="form-group">
                                <label for="stepNotes">Notes additionnelles</label>
                                <textarea id="stepNotes" class="form-control" rows="2" 
                                          placeholder="Notes, observations, recommandations...">${step?.notes || ''}</textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="hostManager.modules.hostUI.closeExploitationStepModal()">
                            Annuler
                        </button>
                        <button type="button" class="btn btn-primary" onclick="hostManager.modules.hostUI.saveExploitationStep(${stepIndex})">
                            <i class="fas fa-save"></i> ${isEdit ? 'Modifier' : 'Ajouter'}
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Ajouter l'événement pour la prévisualisation du screenshot
        const screenshotInput = document.getElementById('stepScreenshot');
        screenshotInput.addEventListener('input', () => {
            this.updateScreenshotPreview(screenshotInput.value);
        });

        // Prévisualiser le screenshot existant si en mode édition
        if (step?.screenshot) {
            this.updateScreenshotPreview(step.screenshot);
        }

        // Focus sur le titre
        document.getElementById('stepTitle').focus();
    }

    updateScreenshotPreview(url) {
        const preview = document.getElementById('screenshotPreview');
        if (!preview) return;

        preview.innerHTML = '';
        
        if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/'))) {
            const img = document.createElement('img');
            img.src = url;
            img.style.maxWidth = '100%';
            img.style.maxHeight = '200px';
            img.style.border = '1px solid #ddd';
            img.style.borderRadius = '4px';
            img.alt = 'Aperçu screenshot';
            img.onerror = () => {
                preview.innerHTML = '<p class="text-danger small">❌ Impossible de charger l\'image</p>';
            };
            preview.appendChild(img);
        } else if (url) {
            preview.innerHTML = '<p class="text-muted small">📁 Fichier local (aperçu non disponible)</p>';
        }
    }

    saveExploitationStep(editIndex = null) {
        const title = document.getElementById('stepTitle')?.value.trim() || '';
        const description = document.getElementById('stepDescription')?.value.trim() || '';
        const command = document.getElementById('stepCommand')?.value.trim() || '';
        const tool = document.getElementById('stepTool')?.value.trim() || '';
        const cve = document.getElementById('stepCVE')?.value.trim() || '';
        const screenshot = document.getElementById('stepScreenshot')?.value.trim() || '';
        const output = document.getElementById('stepOutput')?.value.trim() || '';
        const notes = document.getElementById('stepNotes')?.value.trim() || '';
        const severity = document.getElementById('stepSeverity')?.value || 'Medium';

        if (!title) {
            alert('Le titre est obligatoire.');
            return;
        }

        const stepData = {
            title,
            description,
            command,
            tool,
            cve,
            screenshot,
            output,
            notes,
            severity,
            timestamp: new Date().toISOString(),
            order: editIndex !== null ? this.currentEditingHost.data.exploitationSteps[editIndex].order : 
                   (this.currentEditingHost.data.exploitationSteps?.length || 0) + 1
        };

        if (!this.currentEditingHost.data.exploitationSteps) {
            this.currentEditingHost.data.exploitationSteps = [];
        }

        if (editIndex !== null) {
            // Mode édition
            this.currentEditingHost.data.exploitationSteps[editIndex] = stepData;
        } else {
            // Mode ajout
            this.currentEditingHost.data.exploitationSteps.push(stepData);
        }

        // Sauvegarder immédiatement
        this.saveCurrentHostData();

        this.closeExploitationStepModal();
        this.populateExploitationStepsSection(this.currentEditingHost.data.exploitationSteps);
    }

    closeExploitationStepModal() {
        const modal = document.getElementById('exploitationStepModal');
        if (modal) {
            modal.remove();
        }
    }

    editExploitationStep(index) {
        this.showExploitationStepModal(index);
    }

    populateExploitationStepsSection(steps) {
        const container = document.getElementById('exploitationStepsList');
        if (!container) return;

        container.innerHTML = '';

        if (!steps || steps.length === 0) {
            container.innerHTML = '<p class="text-muted small">Aucune étape d\'exploitation enregistrée.</p>';
            return;
        }

        // Trier par ordre
        const sortedSteps = [...steps].sort((a, b) => (a.order || 0) - (b.order || 0));

        sortedSteps.forEach((step, index) => {
            const severityIcon = {
                'Low': '🟢',
                'Medium': '🟡',
                'High': '🟠',
                'Critical': '🔴'
            }[step.severity] || '⚪';

            const stepElement = document.createElement('div');
            stepElement.className = 'exploitation-step-item mb-3 p-3 border rounded';
            stepElement.innerHTML = `
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div class="flex-grow-1">
                        <h6 class="mb-1">
                            ${severityIcon} ${step.title}
                            ${step.cve ? `<span class="badge badge-warning ml-2">${step.cve}</span>` : ''}
                        </h6>
                        ${step.tool ? `<small class="text-info">🔧 ${step.tool}</small>` : ''}
                    </div>
                    <div class="btn-group btn-group-sm">
                        <button type="button" class="btn btn-outline-secondary" onclick="hostManager.modules.hostUI.editExploitationStep(${steps.indexOf(step)})" title="Éditer">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger" onclick="hostManager.modules.hostUI.removeExploitationStep(${steps.indexOf(step)})" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                ${step.description ? `<p class="mb-2 text-muted small">${step.description}</p>` : ''}
                
                ${step.command ? `
                    <div class="mb-2">
                        <small class="text-muted">Commande:</small>
                        <code class="d-block small bg-light p-2 rounded">${step.command}</code>
                    </div>
                ` : ''}
                
                ${step.screenshot ? `
                    <div class="mb-2">
                        <small class="text-muted">Screenshot:</small><br>
                        <img src="${step.screenshot}" alt="Screenshot" style="max-width: 100%; max-height: 150px; border: 1px solid #ddd; border-radius: 4px;" 
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                        <p class="text-danger small" style="display: none;">❌ Image non disponible</p>
                    </div>
                ` : ''}
                
                ${step.output ? `
                    <div class="mb-2">
                        <small class="text-muted">Résultat:</small>
                        <pre class="small bg-light p-2 rounded" style="max-height: 100px; overflow-y: auto;">${step.output}</pre>
                    </div>
                ` : ''}
                
                ${step.notes ? `<div class="text-muted small">📝 ${step.notes}</div>` : ''}
            `;
            container.appendChild(stepElement);
        });
    }

    removeExploitationStep(index) {
        if (!this.currentEditingHost || !this.currentEditingHost.data.exploitationSteps) return;

        if (confirm('Supprimer cette étape d\'exploitation ?')) {
            this.currentEditingHost.data.exploitationSteps.splice(index, 1);
            
            // Sauvegarder immédiatement
            this.saveCurrentHostData();
            
            this.populateExploitationStepsSection(this.currentEditingHost.data.exploitationSteps);
        }
    }

    addOutput() {
        if (!this.currentEditingHost) return;

        // Créer un formulaire inline dans la sidebar
        const container = document.getElementById('outputsList');
        if (!container) return;

        // Vérifier s'il y a déjà un formulaire d'ajout ouvert
        if (container.querySelector('.output-add-form')) {
            return; // Un formulaire est déjà ouvert
        }

        const addForm = document.createElement('div');
        addForm.className = 'output-add-form mb-3 p-3 border rounded bg-light';
        addForm.innerHTML = `
            <h6 class="mb-3"><i class="fas fa-plus"></i> Nouvelle sortie/Output</h6>
            <div class="form-group">
                <label for="newOutputTitle">Titre:</label>
                <input type="text" id="newOutputTitle" class="form-control form-control-sm" placeholder="ex: nmap scan, sqlmap dump, etc.">
            </div>
            <div class="form-group">
                <label for="newOutputType">Type:</label>
                <select id="newOutputType" class="form-control form-control-sm">
                    <option value="scan">Scan réseau</option>
                    <option value="enumeration">Énumération</option>
                    <option value="exploit">Exploitation</option>
                    <option value="dump">Dump de données</option>
                    <option value="shell">Shell/Command</option>
                    <option value="file">Fichier récupéré</option>
                    <option value="other">Autre</option>
                </select>
            </div>
            <div class="form-group">
                <label for="newOutputCommand">Commande utilisée:</label>
                <input type="text" id="newOutputCommand" class="form-control form-control-sm" placeholder="ex: nmap -sV -sC target">
            </div>
            <div class="form-group">
                <label for="newOutputContent">Contenu/Résultat:</label>
                <textarea id="newOutputContent" class="form-control form-control-sm" rows="8" placeholder="Collez ici le résultat de votre commande, dump, ou toute sortie..."></textarea>
            </div>
            <div class="form-group">
                <label for="newOutputNotes">Notes:</label>
                <textarea id="newOutputNotes" class="form-control form-control-sm" rows="2" placeholder="Notes additionnelles sur cette sortie..."></textarea>
            </div>
            <div class="d-flex justify-content-end">
                <button type="button" class="btn btn-secondary btn-sm mr-2" onclick="hostManager.modules.hostUI.cancelAddOutput()">
                    Annuler
                </button>
                <button type="button" class="btn btn-primary btn-sm" onclick="hostManager.modules.hostUI.saveNewOutput()">
                    <i class="fas fa-save"></i> Sauvegarder
                </button>
            </div>
        `;

        container.insertBefore(addForm, container.firstChild);
        document.getElementById('newOutputTitle').focus();
    }

    saveNewOutput() {
        const title = document.getElementById('newOutputTitle')?.value.trim() || '';
        const type = document.getElementById('newOutputType')?.value || 'other';
        const command = document.getElementById('newOutputCommand')?.value.trim() || '';
        const content = document.getElementById('newOutputContent')?.value.trim() || '';
        const notes = document.getElementById('newOutputNotes')?.value.trim() || '';

        if (!title && !content) {
            alert('Veuillez entrer au moins un titre ou du contenu.');
            return;
        }

        const newOutput = {
            title: title || 'Output sans titre',
            type,
            command,
            content,
            notes,
            timestamp: new Date().toISOString()
        };

        if (!this.currentEditingHost.data.outputs) {
            this.currentEditingHost.data.outputs = [];
        }

        this.currentEditingHost.data.outputs.push(newOutput);
        
        // Sauvegarder immédiatement
        this.saveCurrentHostData();
        
        this.cancelAddOutput();
        this.populateOutputsSection(this.currentEditingHost.data.outputs);
    }

    cancelAddOutput() {
        const form = document.querySelector('.output-add-form');
        if (form) {
            form.remove();
        }
    }

    removeOutput(index) {
        if (!this.currentEditingHost || !this.currentEditingHost.data.outputs) return;

        if (confirm('Supprimer cette sortie ?')) {
            this.currentEditingHost.data.outputs.splice(index, 1);
            
            // Sauvegarder immédiatement
            this.saveCurrentHostData();
            
            this.populateOutputsSection(this.currentEditingHost.data.outputs);
        }
    }

    populateOutputsSection(outputs) {
        const container = document.getElementById('outputsList');
        if (!container) return;

        // Garder le formulaire d'ajout s'il existe
        const addForm = container.querySelector('.output-add-form');
        container.innerHTML = '';
        
        if (addForm) {
            container.appendChild(addForm);
        }

        if (!outputs || outputs.length === 0) {
            const emptyMsg = document.createElement('p');
            emptyMsg.className = 'text-muted small';
            emptyMsg.textContent = 'Aucune sortie enregistrée.';
            container.appendChild(emptyMsg);
            return;
        }

        outputs.forEach((output, index) => {
            const typeIcon = {
                'scan': '🔍',
                'enumeration': '📋',
                'exploit': '💥',
                'dump': '📊',
                'shell': '💻',
                'file': '📄',
                'other': '📝'
            }[output.type] || '📝';

            const outputElement = document.createElement('div');
            outputElement.className = 'output-item mb-3 p-3 border rounded';
            outputElement.innerHTML = `
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div class="flex-grow-1">
                        <h6 class="mb-1">
                            ${typeIcon} ${output.title}
                            <span class="badge badge-info ml-2">${output.type}</span>
                        </h6>
                        ${output.command ? `<small class="text-muted">💻 ${output.command}</small>` : ''}
                    </div>
                    <div class="btn-group btn-group-sm">
                        <button type="button" class="btn btn-outline-secondary" onclick="hostManager.modules.hostUI.viewOutput(${index})" title="Voir en détail">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger" onclick="hostManager.modules.hostUI.removeOutput(${index})" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                ${output.content ? `
                    <div class="mb-2">
                        <pre class="small bg-light p-2 rounded" style="max-height: 120px; overflow-y: auto; white-space: pre-wrap;">${output.content.substring(0, 500)}${output.content.length > 500 ? '...' : ''}</pre>
                    </div>
                ` : ''}
                
                ${output.notes ? `<div class="text-muted small">📝 ${output.notes}</div>` : ''}
                
                <small class="text-muted">🕒 ${new Date(output.timestamp).toLocaleString()}</small>
            `;
            container.appendChild(outputElement);
        });
    }

    viewOutput(index) {
        if (!this.currentEditingHost || !this.currentEditingHost.data.outputs) return;
        
        const output = this.currentEditingHost.data.outputs[index];
        if (!output) return;

        // Créer une modal pour afficher le contenu complet
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'outputViewModal';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${output.title}</h5>
                        <button type="button" class="close" onclick="hostManager.modules.hostUI.closeOutputModal()">
                            <span>&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <strong>Type:</strong> <span class="badge badge-info">${output.type}</span>
                            ${output.command ? `<br><strong>Commande:</strong> <code>${output.command}</code>` : ''}
                        </div>
                        
                        ${output.content ? `
                            <div class="mb-3">
                                <strong>Contenu:</strong>
                                <pre class="bg-light p-3 rounded" style="max-height: 400px; overflow-y: auto; white-space: pre-wrap;">${output.content}</pre>
                            </div>
                        ` : ''}
                        
                        ${output.notes ? `
                            <div class="mb-3">
                                <strong>Notes:</strong>
                                <p>${output.notes}</p>
                            </div>
                        ` : ''}
                        
                        <small class="text-muted">Créé le: ${new Date(output.timestamp).toLocaleString()}</small>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="hostManager.modules.hostUI.closeOutputModal()">Fermer</button>
                        <button type="button" class="btn btn-primary" onclick="hostManager.modules.hostUI.copyOutputContent(${index})">
                            <i class="fas fa-copy"></i> Copier le contenu
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Afficher la modal (utilise Bootstrap si disponible)
        if (window.$ && $.fn.modal) {
            $(modal).modal('show');
        } else {
            modal.style.display = 'block';
            modal.classList.add('show');
        }
    }

    closeOutputModal() {
        const modal = document.getElementById('outputViewModal');
        if (modal) {
            modal.remove();
        }
    }

    copyOutputContent(index) {
        if (!this.currentEditingHost || !this.currentEditingHost.data.outputs) return;
        
        const output = this.currentEditingHost.data.outputs[index];
        if (output && output.content) {
            navigator.clipboard.writeText(output.content).then(() => {
                alert('Contenu copié dans le presse-papiers !');
            }).catch(() => {
                // Fallback pour les navigateurs plus anciens
                const textArea = document.createElement('textarea');
                textArea.value = output.content;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                alert('Contenu copié dans le presse-papiers !');
            });
        }
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
            container.innerHTML = '<p class="text-muted small">Aucune vulnérabilité enregistrée.</p>';
            return;
        }

        vulnerabilities.forEach((vuln, index) => {
            const severityClass = {
                'Low': 'success',
                'Medium': 'warning', 
                'High': 'danger',
                'Critical': 'dark'
            }[vuln.severity] || 'secondary';

            const vulnElement = document.createElement('div');
            vulnElement.className = 'vulnerability-item mb-2 p-2 border rounded';
            vulnElement.innerHTML = `
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${vuln.name}</h6>
                        <span class="badge badge-${severityClass}">${vuln.severity}</span>
                        ${vuln.description ? `<p class="mb-0 mt-1 text-muted small">${vuln.description}</p>` : ''}
                    </div>
                    <button type="button" class="btn btn-outline-danger btn-sm" onclick="hostManager.modules.hostUI.removeVulnerability(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            container.appendChild(vulnElement);
        });
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
}