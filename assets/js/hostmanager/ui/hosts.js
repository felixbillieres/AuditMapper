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
            <button id="closePanelBtn" class="close-panel-btn" title="Fermer">&times;</button>
            <h3 id="editPanelTitle">Édition d'hôte</h3>
            
            <form id="editHostForm">
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
                        <option value="None">Non compromis</option>
                        <option value="Initial">Foothold initial</option>
                        <option value="Partial">Accès partiel</option>
                        <option value="Full">Accès root/admin</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="editNotes">Notes:</label>
                    <textarea id="editNotes" class="form-control" rows="3" placeholder="Notes sur cet hôte..."></textarea>
                </div>
                
                <div class="form-group">
                    <label>Tags:</label>
                    <div id="editTagsContainer" class="mb-2"></div>
                    <div class="input-group">
                        <input type="text" id="newTagInput" class="form-control" placeholder="Nouveau tag">
                        <div class="input-group-append">
                            <button type="button" id="addTagBtn" class="btn btn-outline-secondary">Ajouter</button>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Connexions sortantes:</label>
                    <div id="editEdgesContainer" class="mb-2"></div>
                    <button type="button" id="addEdgeBtn" class="btn btn-outline-primary btn-sm">Ajouter connexion</button>
                </div>
                
                <div class="form-group">
                    <label>Identifiants:</label>
                    <div id="credentialsList"></div>
                </div>
                
                <div class="form-group">
                    <label>Sorties/Outputs:</label>
                    <div id="outputsList"></div>
                </div>
                
                <div class="form-group">
                    <label>Étapes d'exploitation:</label>
                    <div id="exploitationStepsList"></div>
                </div>
                
                <div class="form-group mt-4">
                    <button type="submit" class="btn btn-primary">Sauvegarder</button>
                    <button type="button" id="deleteHostFromPanelBtn" class="btn btn-danger ml-2">Supprimer</button>
                    <button type="button" id="toggleWidePanelBtn" class="btn btn-secondary ml-2">Agrandir</button>
                </div>
            </form>
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
}