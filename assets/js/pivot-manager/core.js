/**
 * Pivot Manager - Module Principal
 * Orchestrateur principal pour la gestion des pivots
 */

class PivotManagerCore {
    constructor() {
        this.modules = {};
        this.config = {
            attackerIP: '',
            attackerInterface: 'tun0',
            defaultPort: 8080,
            timeout: 30,
            autoSave: true,
            debugMode: false
        };
        this.selectedNodes = [];
        this.activeSessions = [];
        this.savedConfigs = [];
        this.pivotPaths = [];
        this.hostManagerData = null;
        
        this.initialized = false;
    }

    async init() {
        try {
            console.log('🚀 Initialisation du Pivot Manager...');
            
            // Charger la configuration sauvegardée
            this.loadConfig();
            
            // Initialiser les modules
            await this.initializeModules();
            
            // Configurer les événements globaux
            this.setupGlobalEvents();
            
            // Charger les données Host Manager si disponibles
            await this.loadHostManagerData();
            
            // Mettre à jour l'interface
            this.updateUI();
            
            this.initialized = true;
            console.log('✅ Pivot Manager initialisé avec succès');
            
            this.showNotification('Pivot Manager prêt !', 'success');
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
            this.showNotification('Erreur d\'initialisation du Pivot Manager', 'error');
        }
    }

    async initializeModules() {
        const moduleConfigs = [
            { name: 'networkAnalyzer', file: 'network-analyzer.js', class: 'NetworkAnalyzer' },
            { name: 'techniqueManager', file: 'technique-manager.js', class: 'TechniqueManager' },
            { name: 'commandGenerator', file: 'command-generator.js', class: 'CommandGenerator' },
            { name: 'sessionManager', file: 'session-manager.js', class: 'SessionManager' },
            { name: 'hostManagerIntegration', file: 'hostmanager-integration.js', class: 'HostManagerIntegration' },
            { name: 'uiManager', file: 'ui-manager.js', class: 'UIManager' }
        ];

        for (const moduleConfig of moduleConfigs) {
            try {
                // Vérifier si la classe existe
                if (window[moduleConfig.class]) {
                    this.modules[moduleConfig.name] = new window[moduleConfig.class](this);
                    await this.modules[moduleConfig.name].init();
                    console.log(`✅ Module ${moduleConfig.name} initialisé`);
                } else {
                    console.warn(`⚠️ Module ${moduleConfig.class} non trouvé`);
                }
            } catch (error) {
                console.error(`❌ Erreur lors de l'initialisation du module ${moduleConfig.name}:`, error);
            }
        }
    }

    setupGlobalEvents() {
        // Sauvegarde automatique
        if (this.config.autoSave) {
            setInterval(() => {
                this.saveConfig();
            }, 30000); // Toutes les 30 secondes
        }

        // Sauvegarde avant fermeture
        window.addEventListener('beforeunload', () => {
            this.saveConfig();
        });

        // Gestion des raccourcis clavier
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        this.saveConfig();
                        this.showNotification('Configuration sauvegardée', 'success');
                        break;
                    case 'r':
                        e.preventDefault();
                        this.refreshAll();
                        break;
                    case 'n':
                        e.preventDefault();
                        this.showNodeSelector();
                        break;
                }
            }
        });

        // Événements de configuration
        document.getElementById('attackerIP')?.addEventListener('change', (e) => {
            this.config.attackerIP = e.target.value;
            this.saveConfig();
        });

        document.getElementById('attackerInterface')?.addEventListener('change', (e) => {
            this.config.attackerInterface = e.target.value;
            this.saveConfig();
        });

        document.getElementById('defaultPort')?.addEventListener('change', (e) => {
            this.config.defaultPort = parseInt(e.target.value);
            this.saveConfig();
        });

        document.getElementById('timeout')?.addEventListener('change', (e) => {
            this.config.timeout = parseInt(e.target.value);
            this.saveConfig();
        });
    }

    async loadHostManagerData() {
        try {
            if (this.modules.hostManagerIntegration) {
                this.hostManagerData = await this.modules.hostManagerIntegration.loadData();
                this.updateStats();
            }
        } catch (error) {
            console.warn('⚠️ Impossible de charger les données Host Manager:', error);
        }
    }

    updateUI() {
        this.updateStats();
        this.updateConfig();
        
        if (this.modules.uiManager) {
            this.modules.uiManager.refresh();
        }
    }

    updateStats() {
        const stats = {
            activeSessions: this.activeSessions.length,
            availableNodes: this.hostManagerData ? Object.keys(this.hostManagerData).length : 0,
            activeTunnels: this.getActiveTunnelsCount(),
            savedConfigs: this.savedConfigs.length
        };

        document.getElementById('activeSessionsCount').textContent = stats.activeSessions;
        document.getElementById('availableNodesCount').textContent = stats.availableNodes;
        document.getElementById('activeTunnelsCount').textContent = stats.activeTunnels;
        document.getElementById('savedConfigsCount').textContent = stats.savedConfigs;
    }

    updateConfig() {
        document.getElementById('attackerIP').value = this.config.attackerIP;
        document.getElementById('attackerInterface').value = this.config.attackerInterface;
        document.getElementById('defaultPort').value = this.config.defaultPort;
        document.getElementById('timeout').value = this.config.timeout;
    }

    getActiveTunnelsCount() {
        return this.activeSessions.filter(session => session.status === 'active').length;
    }

    // Actions rapides
    async importFromHostManager() {
        try {
            if (this.modules.hostManagerIntegration) {
                await this.modules.hostManagerIntegration.importData();
                this.showNotification('Données Host Manager importées', 'success');
            }
        } catch (error) {
            this.showNotification('Erreur lors de l\'import des données', 'error');
        }
    }

    async quickSSH() {
        if (!this.config.attackerIP) {
            this.showNotification('Veuillez configurer votre IP d\'attaquant', 'warning');
            return;
        }

        if (this.modules.techniqueManager) {
            this.modules.techniqueManager.selectTechnique('ssh');
            this.modules.techniqueManager.showQuickSetup();
        }
    }

    async testConnectivity() {
        if (this.modules.networkAnalyzer) {
            await this.modules.networkAnalyzer.testConnectivity();
        }
    }

    async exportConfig() {
        try {
            const config = {
                timestamp: new Date().toISOString(),
                config: this.config,
                selectedNodes: this.selectedNodes,
                activeSessions: this.activeSessions,
                savedConfigs: this.savedConfigs
            };

            const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pivot-manager-config-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);

            this.showNotification('Configuration exportée', 'success');
        } catch (error) {
            this.showNotification('Erreur lors de l\'export', 'error');
        }
    }

    showNodeSelector() {
        const modal = document.getElementById('nodeSelectionModal');
        if (modal) {
            $(modal).modal('show');
            
            if (this.modules.hostManagerIntegration) {
                this.modules.hostManagerIntegration.populateAvailableHosts();
            }
        }
    }

    selectTechnique(technique) {
        if (this.modules.techniqueManager) {
            this.modules.techniqueManager.selectTechnique(technique);
        }
    }

    generateTopology() {
        if (this.modules.networkAnalyzer) {
            this.modules.networkAnalyzer.generateTopology();
        }
    }

    autoDetectPath() {
        if (this.modules.networkAnalyzer && this.selectedNodes.length >= 2) {
            this.modules.networkAnalyzer.calculateOptimalPath(this.selectedNodes);
        } else {
            this.showNotification('Sélectionnez au moins 2 nodes pour la détection automatique', 'warning');
        }
    }

    exportTopology() {
        if (this.modules.networkAnalyzer) {
            this.modules.networkAnalyzer.exportTopology();
        }
    }

    generateCommands() {
        if (this.modules.commandGenerator) {
            this.modules.commandGenerator.generate();
        }
    }

    startPivot() {
        if (this.modules.sessionManager) {
            this.modules.sessionManager.startSession();
        }
    }

    testConfiguration() {
        if (this.modules.techniqueManager) {
            this.modules.techniqueManager.testCurrentConfiguration();
        }
    }

    showCommands(target) {
        if (this.modules.commandGenerator) {
            this.modules.commandGenerator.showCommands(target);
        }
    }

    copyAllCommands() {
        if (this.modules.commandGenerator) {
            this.modules.commandGenerator.copyAll();
        }
    }

    exportScript() {
        if (this.modules.commandGenerator) {
            this.modules.commandGenerator.exportScript();
        }
    }

    refreshSessions() {
        if (this.modules.sessionManager) {
            this.modules.sessionManager.refresh();
        }
    }

    importHostManager() {
        if (this.modules.hostManagerIntegration) {
            this.modules.hostManagerIntegration.importData();
        }
    }

    confirmNodeSelection() {
        const modal = document.getElementById('nodeSelectionModal');
        if (modal) {
            $(modal).modal('hide');
            this.updateSelectedNodes();
        }
    }

    updateSelectedNodes() {
        const nodeSelector = document.getElementById('nodeSelector');
        const display = document.getElementById('selectedNodesDisplay');
        
        if (this.selectedNodes.length > 0) {
            nodeSelector.classList.add('has-selection');
            display.innerHTML = this.generateSelectedNodesHtml();
            
            // Calculer automatiquement le chemin de pivot
            if (this.modules.networkAnalyzer && this.selectedNodes.length >= 2) {
                this.modules.networkAnalyzer.calculateOptimalPath(this.selectedNodes);
            }
        } else {
            nodeSelector.classList.remove('has-selection');
            display.innerHTML = '';
        }
        
        this.updateStats();
    }

    generateSelectedNodesHtml() {
        return this.selectedNodes.map(node => 
            `<span class="badge badge-primary mr-2 mb-2">
                <i class="fas fa-server"></i> ${node.name} (${node.ip})
                <button class="btn btn-sm ml-1" onclick="pivotManager.removeSelectedNode('${node.id}')" style="background: none; border: none; color: white;">
                    <i class="fas fa-times"></i>
                </button>
            </span>`
        ).join('');
    }

    removeSelectedNode(nodeId) {
        this.selectedNodes = this.selectedNodes.filter(node => node.id !== nodeId);
        this.updateSelectedNodes();
    }

    addSelectedNode(node) {
        if (!this.selectedNodes.find(n => n.id === node.id)) {
            this.selectedNodes.push(node);
            this.updateSelectedNodes();
        }
    }

    refreshAll() {
        this.loadHostManagerData();
        this.updateUI();
        
        if (this.modules.sessionManager) {
            this.modules.sessionManager.refresh();
        }
        
        this.showNotification('Interface rafraîchie', 'info');
    }

    // Gestion de la configuration
    saveConfig() {
        try {
            const configData = {
                config: this.config,
                selectedNodes: this.selectedNodes,
                savedConfigs: this.savedConfigs,
                lastSaved: new Date().toISOString()
            };
            
            localStorage.setItem('pivot-manager-config', JSON.stringify(configData));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
        }
    }

    loadConfig() {
        try {
            const saved = localStorage.getItem('pivot-manager-config');
            if (saved) {
                const configData = JSON.parse(saved);
                this.config = { ...this.config, ...configData.config };
                this.selectedNodes = configData.selectedNodes || [];
                this.savedConfigs = configData.savedConfigs || [];
            }
        } catch (error) {
            console.error('Erreur lors du chargement de la configuration:', error);
        }
    }

    // Gestion des notifications
    showNotification(message, type = 'info', duration = 4000) {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        notification.innerHTML = `
            <i class="${icons[type] || icons.info}"></i>
            <strong>${message}</strong>
            <button type="button" class="close" onclick="this.parentElement.remove()">
                <span>&times;</span>
            </button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, duration);
    }

    // Utilitaires
    validateIP(ip) {
        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return ipRegex.test(ip);
    }

    validatePort(port) {
        const portNum = parseInt(port);
        return !isNaN(portNum) && portNum > 0 && portNum <= 65535;
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatTime(date) {
        return new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }
}

// Instance globale
window.pivotManager = new PivotManagerCore();

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    window.pivotManager.init();
}); 