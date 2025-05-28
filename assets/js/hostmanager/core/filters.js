/**
 * Gestionnaire des filtres et recherche
 */

export class FilterManager {
    constructor(hostManager) {
        this.hostManager = hostManager;
        this.filterCategory = null;
        this.filterTag = null;
        this.applyFiltersBtn = null;
    }

    initialize() {
        console.log(">>> FilterManager.initialize: START");
        this.filterCategory = document.getElementById('filterCategory');
        this.filterTag = document.getElementById('filterTag');
        this.applyFiltersBtn = document.getElementById('applyFiltersBtn');

        if (this.applyFiltersBtn) {
            this.applyFiltersBtn.addEventListener('click', () => this.applyFilters());
        }

        this.populateFilterOptions();
        console.log(">>> FilterManager.initialize: END");
    }

    populateFilterOptions() {
        if (!this.filterCategory) return;

        // Vider les options existantes
        this.filterCategory.innerHTML = '<option value="">Toutes</option>';

        // Ajouter les catégories
        const hostData = this.hostManager.getData();
        for (const categoryName in hostData.categories) {
            const option = document.createElement('option');
            option.value = categoryName;
            option.textContent = categoryName;
            this.filterCategory.appendChild(option);
        }
    }

    applyFilters() {
        console.log(">>> applyFilters: START");
        
        const categoryFilter = this.filterCategory?.value || '';
        const tagFilter = this.filterTag?.value.toLowerCase().trim() || '';

        this.hostManager.currentFilters = {
            category: categoryFilter,
            tag: tagFilter
        };

        // Appliquer les filtres au réseau
        this.filterNetwork(categoryFilter, tagFilter);
        
        console.log("Filters applied:", this.hostManager.currentFilters);
        console.log(">>> applyFilters: END");
    }

    filterNetwork(categoryFilter, tagFilter) {
        if (!this.hostManager.modules.network.network) return;

        const hostData = this.hostManager.getData();
        const visibleNodes = [];

        for (const categoryName in hostData.categories) {
            // Filtrer par catégorie
            if (categoryFilter && categoryName !== categoryFilter) continue;

            const category = hostData.categories[categoryName];
            if (!category.hosts) continue;

            for (const hostId in category.hosts) {
                const host = category.hosts[hostId];
                
                // Filtrer par tag
                if (tagFilter) {
                    const hostTags = (host.tags || []).map(tag => tag.toLowerCase());
                    const hasMatchingTag = hostTags.some(tag => tag.includes(tagFilter));
                    if (!hasMatchingTag) continue;
                }

                visibleNodes.push(hostId);
            }
        }

        // Mettre à jour la visibilité des nœuds
        const allNodes = this.hostManager.modules.network.network.body.data.nodes.get();
        const updatedNodes = allNodes.map(node => ({
            ...node,
            hidden: !visibleNodes.includes(node.id)
        }));

        this.hostManager.modules.network.network.setData({
            nodes: updatedNodes,
            edges: this.hostManager.modules.network.network.body.data.edges.get()
        });
    }

    clearFilters() {
        if (this.filterCategory) this.filterCategory.value = '';
        if (this.filterTag) this.filterTag.value = '';
        this.hostManager.currentFilters = { category: '', tag: '' };
        this.applyFilters();
    }
}