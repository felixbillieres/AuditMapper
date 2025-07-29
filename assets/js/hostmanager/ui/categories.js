/**
 * Interface utilisateur pour la gestion des catégories
 */

export class CategoryUI {
    constructor(hostManager) {
        this.hostManager = hostManager;
        this.categoryTabs = null;
        this.categoryContentContainer = null;
        this.addCategoryBtn = null;
    }

    initialize() {
        console.log(">>> CategoryUI.initialize: START");
        this.categoryTabs = document.getElementById('categoryTabs');
        this.categoryContentContainer = document.getElementById('categoryContentContainer');
        this.addCategoryBtn = document.getElementById('addCategoryBtn');

        if (this.addCategoryBtn) {
            this.addCategoryBtn.addEventListener('click', () => this.addCategory());
        }

        this.renderCategories();
        console.log(">>> CategoryUI.initialize: END");
    }

    renderCategories() {
        console.log(">>> renderCategories: START");
        if (!this.categoryTabs) return;

        // Vider les onglets existants
        this.categoryTabs.innerHTML = '';

        const hostData = this.hostManager.getData();
        const categoryNames = Object.keys(hostData.categories);

        // Créer les onglets pour chaque catégorie
        categoryNames.forEach(categoryName => {
            const tab = document.createElement('button');
            tab.className = 'category-tab';
            tab.textContent = categoryName;
            tab.addEventListener('click', () => this.selectCategory(categoryName));

            // Bouton d'édition
            const editBtn = document.createElement('span');
            editBtn.className = 'edit-category-btn';
            editBtn.innerHTML = '✏️';
            editBtn.title = 'Modifier le nom de la catégorie';
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.editCategory(categoryName);
            });

            // Bouton de suppression
            const deleteBtn = document.createElement('span');
            deleteBtn.className = 'delete-category-btn';
            deleteBtn.innerHTML = '×';
            deleteBtn.title = 'Supprimer la catégorie';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteCategory(categoryName);
            });

            tab.appendChild(editBtn);
            tab.appendChild(deleteBtn);
            this.categoryTabs.appendChild(tab);
        });

        // Sélectionner la première catégorie si aucune n'est active
        if (categoryNames.length > 0 && !this.hostManager.getActiveCategory()) {
            this.selectCategory(categoryNames[0]);
        }

        console.log(">>> renderCategories: END");
    }

    selectCategory(categoryName) {
        console.log(">>> selectCategory: START", categoryName);
        
        // Mettre à jour l'état actif
        this.hostManager.setActiveCategory(categoryName);
        
        // Mettre à jour l'apparence des onglets
        const tabs = this.categoryTabs?.querySelectorAll('.category-tab');
        tabs?.forEach(tab => {
            tab.classList.remove('active');
            if (tab.textContent.replace('×', '').trim() === categoryName) {
                tab.classList.add('active');
            }
        });

        // Rendre le contenu de la catégorie
        this.renderActiveCategoryContent();
        
        console.log(">>> selectCategory: END");
    }

    renderActiveCategoryContent() {
        console.log(">>> renderActiveCategoryContent: START");
        
        if (!this.categoryContentContainer) return;

        const activeCategory = this.hostManager.getActiveCategory();
        if (!activeCategory) {
            this.categoryContentContainer.innerHTML = '<p class="text-muted">Aucune catégorie sélectionnée.</p>';
            return;
        }

        const hostData = this.hostManager.getData();
        const category = hostData.categories[activeCategory];
        
        if (!category || !category.hosts) {
            this.categoryContentContainer.innerHTML = `
                <div class="category-content">
                    <h4>${activeCategory}</h4>
                    <p class="text-muted">Aucun hôte dans cette catégorie.</p>
                    <button class="btn btn-primary btn-sm" onclick="hostManager.addHost()">Ajouter un hôte</button>
                </div>
            `;
            return;
        }

        const hostIds = Object.keys(category.hosts);
        let content = `
            <div class="category-content">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h4>${activeCategory}</h4>
                    <button class="btn btn-primary btn-sm" onclick="hostManager.addHost()">Ajouter un hôte</button>
                </div>
        `;

        if (hostIds.length === 0) {
            content += '<p class="text-muted">Aucun hôte dans cette catégorie.</p>';
        } else {
            content += '<div class="hosts-grid">';
            hostIds.forEach(hostId => {
                const host = category.hosts[hostId];
                content += `
                    <div class="host-card" onclick="hostManager.editHost('${hostId}')">
                        <div class="host-card-header">
                            <h6>${hostId}</h6>
                            <span class="compromise-badge compromise-${(host.compromiseLevel || 'None').toLowerCase()}">${host.compromiseLevel || 'None'}</span>
                        </div>
                        <div class="host-card-body">
                            <p><strong>Système:</strong> ${host.system || 'N/A'}</p>
                            <p><strong>Rôle:</strong> ${host.role || 'N/A'}</p>
                            <p><strong>Zone:</strong> ${host.zone || 'N/A'}</p>
                            ${host.tags && host.tags.length > 0 ? `<p><strong>Tags:</strong> ${host.tags.join(', ')}</p>` : ''}
                        </div>
                    </div>
                `;
            });
            content += '</div>';
        }

        content += '</div>';
        this.categoryContentContainer.innerHTML = content;
        
        console.log(">>> renderActiveCategoryContent: END");
    }

    addCategory() {
        const categoryName = prompt('Entrez le nom de la nouvelle catégorie:');
        if (!categoryName || !categoryName.trim()) return;

        const trimmedName = categoryName.trim();
        const hostData = this.hostManager.getData();

        if (hostData.categories[trimmedName]) {
            alert("Cette catégorie existe déjà!");
            return;
        }

        hostData.categories[trimmedName] = { hosts: {} };
        this.hostManager.updateData(hostData);
        this.renderCategories();
        this.selectCategory(trimmedName);
    }

    editCategory(categoryName) {
        const newName = prompt(`Modifier le nom de la catégorie "${categoryName}":`, categoryName);
        
        if (newName && newName.trim() && newName.trim() !== categoryName) {
            const hostData = this.hostManager.getData();
            
            // Vérifier que le nouveau nom n'existe pas déjà
            if (hostData.categories[newName.trim()]) {
                alert('Une catégorie avec ce nom existe déjà.');
                return;
            }
            
            // Déplacer la catégorie avec le nouveau nom
            hostData.categories[newName.trim()] = hostData.categories[categoryName];
            delete hostData.categories[categoryName];
            
            this.hostManager.updateData(hostData);
            
            // Si c'était la catégorie active, mettre à jour
            if (this.hostManager.getActiveCategory() === categoryName) {
                this.hostManager.setActiveCategory(newName.trim());
            }
            
            this.renderCategories();
        }
    }

    deleteCategory(categoryName) {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${categoryName}" et tous ses hôtes?`)) {
            return;
        }

        const hostData = this.hostManager.getData();
        
        // Récupérer les IDs des hôtes à supprimer pour nettoyer les edges
        const hostsToRemove = Object.keys(hostData.categories[categoryName]?.hosts || {});
        
        // Supprimer la catégorie
        delete hostData.categories[categoryName];

        // Supprimer les edges liés aux hôtes de cette catégorie
        hostData.edges = hostData.edges.filter(edge => 
            !hostsToRemove.includes(edge.from) && !hostsToRemove.includes(edge.to)
        );

        this.hostManager.updateData(hostData);
        
        // Si la catégorie supprimée était active, sélectionner une autre
        if (this.hostManager.getActiveCategory() === categoryName) {
            const remainingCategories = Object.keys(hostData.categories);
            this.hostManager.setActiveCategory(remainingCategories.length > 0 ? remainingCategories[0] : null);
        }

        this.renderCategories();
    }
}