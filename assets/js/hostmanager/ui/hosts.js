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
        console.log(">>> editHost: START", hostId);
        
        const hostData = this.hostManager.getData();
        let foundHost = null;
        let foundCategory = null;

        // Trouver l'hôte dans toutes les catégories
        for (const categoryName in hostData.categories) {
            const category = hostData.categories[categoryName];
            if (category.hosts && category.hosts[hostId]) {
                foundHost = category.hosts[hostId];
                foundCategory = categoryName;
                break;
            }
        }

        if (!foundHost) {
            console.error("Host not found:", hostId);
            return;
        }

        this.currentEditingHost = {
            id: hostId,
            category: foundCategory,
            data: foundHost
        };

        this.populateEditForm(hostId, foundHost, foundCategory);
        this.showEditPanel();
        
        console.log(">>> editHost: END");
    }

    populateEditForm(hostId, host, categoryName) {
        console.log(">>> populateEditForm: START");

        // Remplir les champs de base
        const editHostId = document.getElementById('editHostId');
        const editHostSystem = document.getElementById('editHostSystem');
        const editHostRole = document.getElementById('editHostRole');
        const editHostZone = document.getElementById('editHostZone');
        const editHostCompromiseLevel = document.getElementById('editHostCompromiseLevel');
        const editHostNotes = document.getElementById('editHostNotes');

        if (editHostId) editHostId.value = hostId;
        if (editHostSystem) editHostSystem.value = host.system || '';
        if (editHostRole) editHostRole.value = host.role || '';
        if (editHostZone) editHostZone.value = host.zone || '';
        if (editHostCompromiseLevel) editHostCompromiseLevel.value = host.compromiseLevel || 'None';
        if (editHostNotes) editHostNotes.value = host.notes || '';

        // Mettre à jour le titre du panneau
        const panelTitle = document.getElementById('editPanelTitle');
        if (panelTitle) {
            panelTitle.textContent = `Édition: ${hostId} (${categoryName})`;
        }

        // Peupler les sections
        this.populateTagsSection(host.tags || []);
        this.populateEdgesSection(hostId);
        
        // Peupler les modules features
        this.hostManager.modules.credentials.populateCredentialsSection(host.credentials || []);
        this.hostManager.modules.outputs.populateOutputsSection(host.outputs || []);
        this.hostManager.modules.exploitation.populateExploitationSteps(host.exploitationSteps || []);

        console.log(">>> populateEditForm: END");
    }

    populateTagsSection(tags) {
        const container = document.getElementById('editTagsContainer');
        if (!container) return;

        container.innerHTML = '';

        if (tags.length === 0) {
            container.innerHTML = '<p class="text-muted small">Aucun tag.</p>';
            return;
        }

        tags.forEach((tag, index) => {
            const tagDiv = document.createElement('div');
            tagDiv.className = 'tag-item d-flex align-items-center mb-2';
            tagDiv.innerHTML = `
                <input type="text" class="form-control form-control-sm tag-input" value="${tag}" data-index="${index}">
                <button type="button" class="btn btn-danger btn-sm ml-2" onclick="hostManager.modules.hostUI.removeTag(${index})">×</button>
            `;
            container.appendChild(tagDiv);
        });
    }

    populateEdgesSection(hostId) {
        const container = document.getElementById('editEdgesContainer');
        if (!container) return;

        const hostData = this.hostManager.getData();
        const outgoingEdges = hostData.edges.filter(edge => edge.from === hostId);

        container.innerHTML = '';

        if (outgoingEdges.length === 0) {
            container.innerHTML = '<p class="text-muted small">Aucune connexion sortante.</p>';
            return;
        }

        outgoingEdges.forEach((edge, index) => {
            const edgeDiv = document.createElement('div');
            edgeDiv.className = 'edge-item d-flex align-items-center mb-2';
            edgeDiv.innerHTML = `
                <span class="form-control-plaintext">${edge.from} → ${edge.to}</span>
                ${edge.label ? `<span class="badge badge-info ml-2">${edge.label}</span>` : ''}
                <button type="button" class="btn btn-danger btn-sm ml-auto" onclick="hostManager.modules.hostUI.removeEdge(${index})">×</button>
            `;
            container.appendChild(edgeDiv);
        });
    }

    saveHost(event) {
        event.preventDefault();
        console.log(">>> saveHost: START");

        if (!this.currentEditingHost) {
            console.error("No host being edited");
            return;
        }

        const hostData = this.hostManager.getData();
        const { id: hostId, category: categoryName } = this.currentEditingHost;

        // Récupérer les données du formulaire
        const editHostSystem = document.getElementById('editHostSystem');
        const editHostRole = document.getElementById('editHostRole');
        const editHostZone = document.getElementById('editHostZone');
        const editHostCompromiseLevel = document.getElementById('editHostCompromiseLevel');
        const editHostNotes = document.getElementById('editHostNotes');

        // Récupérer les tags
        const tags = this.getTagsData();

        // Récupérer les données des modules features
        const credentials = this.hostManager.modules.credentials.getCredentialsData();
        const outputs = this.hostManager.modules.outputs.getOutputsData();
        const exploitationSteps = this.hostManager.modules.exploitation.getExploitationStepsData();

        // Mettre à jour l'hôte
        const updatedHost = {
            system: editHostSystem?.value || '',
            role: editHostRole?.value || '',
            zone: editHostZone?.value || '',
            compromiseLevel: editHostCompromiseLevel?.value || 'None',
            notes: editHostNotes?.value || '',
            tags: tags,
            credentials: credentials,
            outputs: outputs,
            exploitationSteps: exploitationSteps
        };

        hostData.categories[categoryName].hosts[hostId] = updatedHost;
        this.hostManager.updateData(hostData);

        console.log("Host saved:", hostId);
        console.log(">>> saveHost: END");
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
        const newTag = prompt('Entrez le nouveau tag:');
        if (!newTag || !newTag.trim()) return;

        const container = document.getElementById('editTagsContainer');
        if (!container) return;

        // Si c'est le premier tag, vider le message "Aucun tag"
        if (container.querySelector('.text-muted')) {
            container.innerHTML = '';
        }

        const tagIndex = container.querySelectorAll('.tag-item').length;
        const tagDiv = document.createElement('div');
        tagDiv.className = 'tag-item d-flex align-items-center mb-2';
        tagDiv.innerHTML = `
            <input type="text" class="form-control form-control-sm tag-input" value="${newTag.trim()}" data-index="${tagIndex}">
            <button type="button" class="btn btn-danger btn-sm ml-2" onclick="hostManager.modules.hostUI.removeTag(${tagIndex})">×</button>
        `;
        container.appendChild(tagDiv);
    }

    removeTag(index) {
        const container = document.getElementById('editTagsContainer');
        if (!container) return;

        const tagItems = container.querySelectorAll('.tag-item');
        if (tagItems[index]) {
            tagItems[index].remove();
        }

        // Si plus de tags, afficher le message
        if (container.querySelectorAll('.tag-item').length === 0) {
            container.innerHTML = '<p class="text-muted small">Aucun tag.</p>';
        }
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
        if (this.editPanel) {
            this.editPanel.classList.add('active');
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
}