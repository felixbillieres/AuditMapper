/**
 * Pivot Manager - Module UI Manager
 * Gestion de l'interface utilisateur et des interactions
 */

class UIManager {
    constructor(pivotMaster) {
        this.pivotMaster = pivotMaster;
        this.techniqueOptions = null;
        this.selectedTechnique = null;
    }

    async init() {
        console.log('🎨 Initialisation du UI Manager...');
        this.setupTechniqueSelection();
        this.setupCommandTabs();
        this.setupFilterEvents();
    }

    setupTechniqueSelection() {
        // Gérer la sélection des techniques
        this.techniqueOptions = document.querySelectorAll('.technique-option');
        
        this.techniqueOptions.forEach(option => {
            option.addEventListener('click', () => {
                const technique = option.dataset.technique;
                this.selectTechnique(technique, option);
            });
        });
    }

    selectTechnique(techniqueName, optionElement) {
        // Désélectionner toutes les techniques
        this.techniqueOptions.forEach(opt => {
            opt.classList.remove('selected');
        });

        // Sélectionner la technique actuelle
        optionElement.classList.add('selected');
        this.selectedTechnique = techniqueName;
        this.pivotMaster.selectedTechnique = techniqueName;

        // Mettre à jour l'affichage
        this.showTechniqueConfig(techniqueName);
        this.updateSelectedTechniqueName(techniqueName);
        this.generateRecommendations(techniqueName);

        // Notifier les autres modules
        if (this.pivotMaster.modules.techniqueManager) {
            this.pivotMaster.modules.techniqueManager.selectTechnique(techniqueName);
        }

        this.pivotMaster.showNotification(`Technique ${techniqueName.toUpperCase()} sélectionnée`, 'info');
    }

    showTechniqueConfig(techniqueName) {
        const configContainer = document.getElementById('techniqueConfig');
        const paramsContainer = document.getElementById('configParams');
        
        if (!configContainer || !paramsContainer) return;

        // Afficher le container de configuration
        configContainer.style.display = 'block';

        // Générer les paramètres spécifiques à la technique
        const params = this.getTechniqueParams(techniqueName);
        let paramsHtml = '';

        params.forEach(param => {
            paramsHtml += `
                <div class="form-row">
                    <label for="${param.id}">${param.label}</label>
                    <input type="${param.type}" 
                           id="${param.id}" 
                           placeholder="${param.placeholder || ''}"
                           value="${param.defaultValue || ''}"
                           ${param.required ? 'required' : ''}
                           onchange="pivotMaster.modules.uiManager.updateTechniqueParam('${param.id}', this.value)">
                    ${param.help ? `<small class="text-muted">${param.help}</small>` : ''}
                </div>
            `;
        });

        paramsContainer.innerHTML = paramsHtml;
    }

    getTechniqueParams(technique) {
        const paramTemplates = {
            'ssh': [
                { id: 'sshUser', label: '👤 Utilisateur SSH', type: 'text', placeholder: 'root', defaultValue: 'root', required: true },
                { id: 'sshKey', label: '🔑 Clé SSH (optionnel)', type: 'text', placeholder: 'id_rsa' },
                { id: 'localPort', label: '🔌 Port Local', type: 'number', defaultValue: '8080', required: true },
                { id: 'remotePort', label: '🎯 Port Distant', type: 'number', defaultValue: '80', required: true },
                { id: 'sshOptions', label: '⚙️ Options SSH', type: 'text', placeholder: '-o StrictHostKeyChecking=no' }
            ],
            'chisel': [
                { id: 'chiselMode', label: '🔀 Mode', type: 'select', options: ['client', 'server'], defaultValue: 'client', required: true },
                { id: 'chiselPort', label: '🔌 Port Chisel', type: 'number', defaultValue: '8000', required: true },
                { id: 'targetPort', label: '🎯 Port Cible', type: 'number', defaultValue: '80', required: true },
                { id: 'chiselAuth', label: '🔐 Authentification', type: 'text', placeholder: 'user:pass' }
            ],
            'ligolo': [
                { id: 'ligoloInterface', label: '🌐 Interface', type: 'text', defaultValue: 'ligolo', required: true },
                { id: 'ligoloPort', label: '🔌 Port Agent', type: 'number', defaultValue: '11601', required: true },
                { id: 'tunnelName', label: '🏷️ Nom du Tunnel', type: 'text', defaultValue: 'pivot1', required: true }
            ],
            'sshuttle': [
                { id: 'targetNetwork', label: '🌐 Réseau Cible', type: 'text', placeholder: '192.168.1.0/24', required: true },
                { id: 'sshuttleUser', label: '👤 Utilisateur SSH', type: 'text', defaultValue: 'root', required: true },
                { id: 'excludeNets', label: '🚫 Réseaux Exclus', type: 'text', placeholder: '192.168.1.1/32' }
            ],
            'socat': [
                { id: 'socatType', label: '🔀 Type', type: 'select', options: ['TCP-LISTEN', 'TCP4-LISTEN'], defaultValue: 'TCP-LISTEN', required: true },
                { id: 'socatLocalPort', label: '🔌 Port Local', type: 'number', defaultValue: '8080', required: true },
                { id: 'socatTargetPort', label: '🎯 Port Cible', type: 'number', defaultValue: '80', required: true }
            ],
            'metasploit': [
                { id: 'msfSession', label: '💀 Session ID', type: 'number', placeholder: '1', required: true },
                { id: 'msfRoute', label: '🛣️ Route', type: 'text', placeholder: '192.168.1.0/24', required: true },
                { id: 'msfInterface', label: '🌐 Interface', type: 'text', defaultValue: 'eth0' }
            ]
        };

        return paramTemplates[technique] || [];
    }

    updateSelectedTechniqueName(techniqueName) {
        const nameElement = document.getElementById('selectedTechniqueName');
        if (nameElement) {
            nameElement.textContent = techniqueName.toUpperCase();
        }
    }

    generateRecommendations(selectedTechnique) {
        const recommendationsContainer = document.getElementById('recommendations');
        if (!recommendationsContainer) return;

        const recommendations = this.getTechniqueRecommendations(selectedTechnique);
        let html = '';

        recommendations.forEach(rec => {
            html += `
                <div class="recommendation-item">
                    <div class="d-flex align-items-center mb-2">
                        <span class="me-2">${rec.icon}</span>
                        <strong>${rec.title}</strong>
                    </div>
                    <p class="mb-0">${rec.description}</p>
                </div>
            `;
        });

        recommendationsContainer.innerHTML = html;
    }

    getTechniqueRecommendations(technique) {
        const recommendations = {
            'ssh': [
                { icon: '💡', title: 'Configuration recommandée', description: 'Utilisez des clés SSH plutôt que des mots de passe pour plus de sécurité.' },
                { icon: '⚡', title: 'Performance', description: 'SSH tunneling est stable mais peut être plus lent que d\'autres techniques.' }
            ],
            'chisel': [
                { icon: '🚀', title: 'Rapidité', description: 'Chisel est très rapide et fonctionne bien à travers les proxies HTTP.' },
                { icon: '🔧', title: 'Flexibilité', description: 'Idéal quand SSH n\'est pas disponible sur la cible.' }
            ],
            'ligolo': [
                { icon: '🌟', title: 'Modernité', description: 'Ligolo-ng est l\'outil le plus moderne avec une interface TUN transparente.' },
                { icon: '🔄', title: 'Multi-agents', description: 'Permet de gérer plusieurs agents simultanément.' }
            ],
            'sshuttle': [
                { icon: '🎯', title: 'Simplicité', description: 'SSHuttle configure automatiquement les routes, très simple d\'utilisation.' },
                { icon: '🌐', title: 'Transparent', description: 'Fonctionne comme un VPN transparent pour tout le trafic.' }
            ],
            'socat': [
                { icon: '🔧', title: 'Flexibilité', description: 'SOCAT est très flexible pour le port forwarding bidirectionnel.' },
                { icon: '⚙️', title: 'Protocoles', description: 'Supporte de nombreux protocoles (TCP, UDP, Unix sockets).' }
            ],
            'metasploit': [
                { icon: '💀', title: 'Intégration', description: 'Parfaitement intégré avec Metasploit Framework.' },
                { icon: '🎯', title: 'Routing', description: 'Routing automatique une fois la session Meterpreter établie.' }
            ]
        };

        return recommendations[technique] || [
            { icon: '❓', title: 'Technique sélectionnée', description: 'Consultez la documentation pour cette technique.' }
        ];
    }

    setupCommandTabs() {
        const tabs = document.querySelectorAll('.cmd-tab');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Désactiver tous les tabs
                tabs.forEach(t => t.classList.remove('active'));
                
                // Activer le tab cliqué
                tab.classList.add('active');
                
                // Afficher le contenu correspondant
                const target = tab.dataset.target;
                this.showCommandsForTarget(target);
            });
        });
    }

    showCommandsForTarget(target) {
        const commandsContainer = document.getElementById('commandsContent');
        if (!commandsContainer) return;

        // Générer les commandes via le CommandGenerator
        if (this.pivotMaster.modules.commandGenerator) {
            this.pivotMaster.modules.commandGenerator.showCommands(target);
        } else {
            commandsContainer.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i>⏳</i>
                    <p>Générateur de commandes non disponible</p>
                    <small>Configurez d'abord votre technique et vos nodes</small>
                </div>
            `;
        }
    }

    setupFilterEvents() {
        // Filtres de niveau de compromis
        document.querySelectorAll('.checkbox-group input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.applyFilters();
            });
        });

        // Filtre de services
        const serviceFilter = document.getElementById('serviceFilter');
        if (serviceFilter) {
            serviceFilter.addEventListener('input', () => {
                this.applyFilters();
            });
        }
    }

    applyFilters() {
        if (this.pivotMaster.modules.hostManager) {
            this.pivotMaster.modules.hostManager.populateAvailableHosts();
        }
    }

    updateTechniqueParam(paramId, value) {
        // Mettre à jour un paramètre de technique
        if (!this.techniqueParams) {
            this.techniqueParams = {};
        }
        
        this.techniqueParams[paramId] = value;
        
        // Notifier le gestionnaire de techniques
        if (this.pivotMaster.modules.techniqueManager) {
            this.pivotMaster.modules.techniqueManager.updateParameter(paramId, value);
        }
    }

    // Méthodes pour les actions de l'interface
    copyCommand(command) {
        navigator.clipboard.writeText(command).then(() => {
            this.pivotMaster.showNotification('Commande copiée', 'success');
        }).catch(() => {
            this.pivotMaster.showNotification('Erreur lors de la copie', 'error');
        });
    }

    copyAllCommands() {
        if (this.pivotMaster.modules.commandGenerator) {
            this.pivotMaster.modules.commandGenerator.copyAll();
        }
    }

    exportScript() {
        if (this.pivotMaster.modules.commandGenerator) {
            this.pivotMaster.modules.commandGenerator.exportScript();
        }
    }

    // Validation des formulaires
    validateConfigurationForm() {
        const requiredFields = document.querySelectorAll('#techniqueConfig input[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('is-invalid');
                isValid = false;
            } else {
                field.classList.remove('is-invalid');
            }
        });

        return isValid;
    }

    // Mise à jour de l'interface
    refresh() {
        // Rafraîchir l'affichage des hosts
        if (this.pivotMaster.modules.hostManager) {
            this.pivotMaster.modules.hostManager.populateAvailableHosts();
        }

        // Rafraîchir l'affichage des techniques
        if (this.selectedTechnique) {
            this.showTechniqueConfig(this.selectedTechnique);
        }
    }

    // Nettoyage
    destroy() {
        // Nettoyer les événements si nécessaire
        console.log('UI Manager nettoyé');
    }
}

// Assurer la disponibilité globale de la classe
window.UIManager = UIManager; 