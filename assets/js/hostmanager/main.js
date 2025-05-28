/**
 * Host Manager v2 - Point d'entrée principal
 * Initialise tous les modules et gère la coordination globale
 */

// Import des modules
import { StorageManager } from './core/storage.js';
import { NetworkManager } from './core/network.js';
import { FilterManager } from './core/filters.js';
import { CategoryUI } from './ui/categories.js';
import { HostUI } from './ui/hosts.js';
import { PanelUI } from './ui/panels.js';
import { OutputManager } from './features/outputs.js';
import { ExploitationManager } from './features/exploitation.js';
import { CredentialManager } from './features/credentials.js';
import { FileSystemExporter } from './export/filesystem.js';
import { ZipExporter } from './export/zip.js';
import { ReportGenerator } from './export/reports.js';

class HostManager {
    constructor() {
        this.modules = {};
        this.hostData = { categories: {}, edges: [] };
        this.activeCategory = null;
        this.currentFilters = { category: '', tag: '' };
        this.selectedDirectoryHandle = null;
        
        this.initializeModules();
        this.setupEventListeners();
    }

    initializeModules() {
        // Initialisation des modules core
        this.modules.storage = new StorageManager(this);
        this.modules.network = new NetworkManager(this);
        this.modules.filters = new FilterManager(this);
        
        // Initialisation des modules UI
        this.modules.categoryUI = new CategoryUI(this);
        this.modules.hostUI = new HostUI(this);
        this.modules.panelUI = new PanelUI(this);
        
        // Initialisation des modules features
        this.modules.outputs = new OutputManager(this);
        this.modules.exploitation = new ExploitationManager(this);
        this.modules.credentials = new CredentialManager(this);
        
        // Initialisation des modules export
        this.modules.fileSystemExporter = new FileSystemExporter(this);
        this.modules.zipExporter = new ZipExporter(this);
        this.modules.reportGenerator = new ReportGenerator(this);
    }

    setupEventListeners() {
        // Délégation des événements aux modules appropriés
        document.addEventListener('DOMContentLoaded', () => {
            console.log("Host Manager V2 Initializing...");
            
            // Charger les données
            this.modules.storage.loadData();
            
            // Initialiser les modules UI
            this.modules.categoryUI.initialize();
            this.modules.hostUI.initialize();
            this.modules.panelUI.initialize();
            
            // Initialiser les modules features
            this.modules.outputs.initialize();
            this.modules.exploitation.initialize();
            this.modules.credentials.initialize();
            
            // Initialiser les modules export
            this.modules.fileSystemExporter.initialize();
            this.modules.zipExporter.initialize();
            this.modules.reportGenerator.initialize();
            
            // Initialiser le réseau et les filtres
            this.modules.network.initialize();
            this.modules.filters.initialize();
            
            console.log("Host Manager V2 Ready.");
        });
    }

    // Méthodes publiques pour la communication inter-modules
    updateData(newData) {
        this.hostData = newData;
        this.modules.storage.saveData();
        this.modules.network.updateNetwork();
        this.modules.categoryUI.renderCategories();
        this.modules.filters.populateFilterOptions();
    }

    setActiveCategory(categoryName) {
        this.activeCategory = categoryName;
        this.modules.categoryUI.renderActiveCategoryContent();
    }

    // Getters pour l'accès aux données
    getData() {
        return this.hostData;
    }

    getActiveCategory() {
        return this.activeCategory;
    }

    // Méthodes utilitaires pour la compatibilité
    addHost() {
        this.modules.hostUI.addHost();
    }

    editHost(hostId) {
        this.modules.hostUI.editHost(hostId);
    }

    deleteHost(hostId) {
        this.modules.hostUI.deleteHost(hostId);
    }
}

// Initialisation globale
window.hostManager = new HostManager();