/**
 * Config Generator - Fichier Principal
 * Générateur de configurations pour pentest
 */

// Import des modules (si vous utilisez des modules ES6, sinon on chargera via script tags)
// import { ConfigCore } from './config-generator/core.js';
// import { HostsGenerator } from './config-generator/hosts.js';
// import { KerberosGenerator } from './config-generator/kerberos.js';
// import { ProxyChainsGenerator } from './config-generator/proxychains.js';
// import { ConfigParsers } from './config-generator/parsers.js';
// import { ConfigExporter } from './config-generator/export.js';

class ConfigGeneratorApp {
    constructor() {
        this.currentTab = 'hosts';
        this.data = {
            hosts: {
                entries: [],
                manualEntries: [],
                parsedData: null
            },
            kerberos: {
                domain: '',
                kdc: '',
                config: null
            },
            proxychains: {
                proxies: [],
                config: null
            },
            project: {
                name: '',
                created: new Date(),
                configs: {}
            }
        };
        
        this.modules = {};
        this.init();
    }

    async init() {
        console.log('🚀 Initialisation du Config Generator...');
        
        // Initialisation des modules
        this.modules.core = new window.ConfigCore(this);
        this.modules.hosts = new window.HostsGenerator(this);
        this.modules.kerberos = new window.KerberosGenerator(this);
        this.modules.proxychains = new window.ProxyChainsGenerator(this);
        this.modules.parsers = new window.ConfigParsers(this);
        this.modules.exporter = new window.ConfigExporter(this);

        // Setup des event listeners globaux
        this.setupEventListeners();
        
        // Initialisation des modules
        await this.initModules();
        
        // Mise à jour des statistiques
        this.updateStats();
        
        console.log('✅ Config Generator initialisé avec succès !');
    }

    async initModules() {
        for (const [name, module] of Object.entries(this.modules)) {
            try {
                if (module.init) {
                    await module.init();
                    console.log(`✅ Module ${name} initialisé`);
                }
            } catch (error) {
                console.error(`❌ Erreur initialisation module ${name}:`, error);
            }
        }
    }

    setupEventListeners() {
        // Navigation entre onglets
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Navigation input methods
        document.querySelectorAll('.input-tab').forEach(button => {
            button.addEventListener('click', (e) => this.switchInputMethod(e.target.dataset.input));
        });

        // Export global
        document.getElementById('exportAll')?.addEventListener('click', () => this.exportAll());
        document.getElementById('exportProject')?.addEventListener('click', () => this.exportProject());
        document.getElementById('importProject')?.addEventListener('click', () => this.importProject());

        // Auto-save des données
        window.addEventListener('beforeunload', () => this.saveToLocalStorage());
        
        // Chargement des données sauvegardées
        this.loadFromLocalStorage();
    }

    switchTab(tabName) {
        if (!tabName) return;
        
        // Sauvegarder l'état de l'onglet actuel
        this.saveCurrentTabState();
        
        // Mettre à jour l'onglet actuel
        this.currentTab = tabName;
        
        // Mise à jour de l'interface
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });

        // Notifier le module correspondant
        if (this.modules[tabName] && this.modules[tabName].onTabActivated) {
            this.modules[tabName].onTabActivated();
        }

        console.log(`📂 Onglet activé: ${tabName}`);
    }

    switchInputMethod(method) {
        if (!method) return;
        
        // Mettre à jour les onglets input
        document.querySelectorAll('.input-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.input === method);
        });
        
        // Mettre à jour les panneaux
        document.querySelectorAll('.input-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${method}-input`);
        });

        console.log(`🔄 Méthode d'input: ${method}`);
    }

    saveCurrentTabState() {
        const currentModule = this.modules[this.currentTab];
        if (currentModule && currentModule.saveState) {
            currentModule.saveState();
        }
    }

    updateStats() {
        // Compter les configurations disponibles
        const configTypes = ['hosts', 'kerberos', 'proxychains', 'ssh', 'responder', 'bloodhound', 'burp', 'tools'];
        const totalConfigs = configTypes.length;
        
        // Compter les parsers
        const parsers = this.modules.parsers ? this.modules.parsers.getAvailableParsers().length : 12;
        
        // Compter les templates
        const templates = 25; // Nombre statique pour l'instant
        
        // Mettre à jour l'affichage
        document.getElementById('totalConfigs').textContent = totalConfigs;
        document.getElementById('totalParsers').textContent = parsers;
        document.getElementById('totalTemplates').textContent = templates;
    }

    async exportAll() {
        try {
            console.log('📦 Export de toutes les configurations...');
            
            const selectedFormats = this.getSelectedExportFormats();
            if (selectedFormats.length === 0) {
                this.showNotification('⚠️ Sélectionnez au moins un format à exporter', 'warning');
                return;
            }

            await this.modules.exporter.createArchive(selectedFormats);
            this.showNotification('✅ Archive créée avec succès !', 'success');
            
        } catch (error) {
            console.error('❌ Erreur export:', error);
            this.showNotification('❌ Erreur lors de l\'export', 'error');
        }
    }

    getSelectedExportFormats() {
        const formats = [];
        if (document.getElementById('exportHosts')?.checked) formats.push('hosts');
        if (document.getElementById('exportKerberos')?.checked) formats.push('kerberos');
        if (document.getElementById('exportProxychains')?.checked) formats.push('proxychains');
        if (document.getElementById('exportReadme')?.checked) formats.push('readme');
        return formats;
    }

    async exportProject() {
        try {
            const projectData = {
                name: this.data.project.name || 'pentest-configs',
                created: this.data.project.created,
                version: '1.0.0',
                data: this.data,
                timestamp: new Date().toISOString()
            };

            const blob = new Blob([JSON.stringify(projectData, null, 2)], { 
                type: 'application/json' 
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${projectData.name}-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            this.showNotification('💾 Projet sauvegardé !', 'success');
            
        } catch (error) {
            console.error('❌ Erreur sauvegarde projet:', error);
            this.showNotification('❌ Erreur lors de la sauvegarde', 'error');
        }
    }

    async importProject() {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                const text = await file.text();
                const projectData = JSON.parse(text);
                
                // Validation basique
                if (!projectData.data) {
                    throw new Error('Format de projet invalide');
                }
                
                // Restaurer les données
                this.data = projectData.data;
                this.data.project.name = projectData.name || 'Projet importé';
                
                // Notifier les modules
                Object.values(this.modules).forEach(module => {
                    if (module.onDataImported) {
                        module.onDataImported();
                    }
                });
                
                this.showNotification('📁 Projet chargé avec succès !', 'success');
            };
            
            input.click();
            
        } catch (error) {
            console.error('❌ Erreur import projet:', error);
            this.showNotification('❌ Erreur lors du chargement', 'error');
        }
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem('configGenerator_data', JSON.stringify(this.data));
            localStorage.setItem('configGenerator_currentTab', this.currentTab);
        } catch (error) {
            console.warn('⚠️ Impossible de sauvegarder dans localStorage:', error);
        }
    }

    loadFromLocalStorage() {
        try {
            const savedData = localStorage.getItem('configGenerator_data');
            const savedTab = localStorage.getItem('configGenerator_currentTab');
            
            if (savedData) {
                this.data = { ...this.data, ...JSON.parse(savedData) };
                console.log('📋 Données restaurées depuis localStorage');
            }
            
            if (savedTab && savedTab !== this.currentTab) {
                // Attendre un peu que l'interface soit prête
                setTimeout(() => this.switchTab(savedTab), 100);
            }
            
        } catch (error) {
            console.warn('⚠️ Erreur chargement localStorage:', error);
        }
    }

    showNotification(message, type = 'info') {
        // Créer une notification toast
        const notification = document.createElement('div');
        notification.className = `notification-toast notification-${type}`;
        notification.textContent = message;
        
        // Styles inline pour être sûr que ça marche
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 1.5rem',
            borderRadius: '6px',
            color: 'white',
            fontWeight: '500',
            zIndex: '9999',
            maxWidth: '300px',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });

        // Couleurs selon le type
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(notification);

        // Animation d'entrée
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Auto-suppression
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // API publique pour les modules
    getData(module) {
        return this.data[module] || {};
    }

    setData(module, data) {
        this.data[module] = { ...this.data[module], ...data };
        this.saveToLocalStorage();
    }

    getCurrentTab() {
        return this.currentTab;
    }

    getModule(name) {
        return this.modules[name];
    }
}

// Initialisation automatique quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    // Créer l'instance globale
    window.configGenerator = new ConfigGeneratorApp();
}); 