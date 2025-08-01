/**
 * Carte réseau interactive avancée avec vis.js
 */

export class NetworkMap {
    constructor(hostManager) {
        this.hostManager = hostManager;
        this.network = null;
        this.nodes = null;
        this.edges = null;
        this.container = null;
        this.isFullscreen = false;
        this.selectedNode = null;
        this.searchTerm = '';
        this.isPhysicsEnabled = true;
        this.isHierarchical = false;
        this.isClustered = false;
        
        // Configuration des icônes par type (plus petites pour les nodes)
        this.nodeIcons = {
            'windows': '🖥',
            'linux': '🐧', 
            'web': '🌐',
            'dc': '🏛',
            'database': '🗄',
            'router': '📡',
            'switch': '🔀',
            'firewall': '🛡',
            'server': '💻',
            'workstation': '💻',
            'mobile': '📱',
            'iot': '📟',
            'printer': '🖨',
            'camera': '📹',
            'unknown': '❓'
        };
        
        // Couleurs par catégorie (style Bloodhound)
        this.categoryColors = [
            '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
            '#1abc9c', '#34495e', '#e67e22', '#95a5a6', '#f1c40f',
            '#8e44ad', '#16a085', '#27ae60', '#2980b9', '#c0392b'
        ];
        
        // Configuration des couleurs par niveau de compromission (pour les bordures)
        this.compromiseColors = {
            'None': '#95a5a6',      // Gris
            'Low': '#f1c40f',       // Jaune
            'Medium': '#e67e22',    // Orange
            'High': '#e74c3c',      // Rouge
            'Critical': '#8e44ad',  // Violet
            'Full': '#2c3e50'       // Noir
        };

        // Configuration avancée pour vis.js
        this.networkOptions = {
            nodes: {
                shape: 'dot',
                size: 30,
                font: {
                    size: 16,
                    color: '#ffffff',
                    face: 'Arial',
                    strokeWidth: 2,
                    strokeColor: '#000000'
                },
                borderWidth: 4,
                shadow: {
                    enabled: true,
                    color: 'rgba(0,0,0,0.3)',
                    size: 8,
                    x: 2,
                    y: 2
                }
            },
            edges: {
                width: 3,
                color: '#7f8c8d',
                arrows: {
                    to: { enabled: true, scaleFactor: 1.2 }
                },
                smooth: {
                    enabled: true,
                    type: 'dynamic'
                },
                shadow: true
            },
            physics: {
                enabled: true,
                stabilization: { iterations: 100 },
                barnesHut: {
                    gravitationalConstant: -8000,
                    centralGravity: 0.3,
                    springLength: 200,
                    springConstant: 0.04,
                    damping: 0.09
                }
            },
            interaction: {
                hover: true,
                selectConnectedEdges: false,
                tooltipDelay: 200
            }
        };
    }

    initialize() {
        console.log(">>> NetworkMap.initialize: START");
        
        // Attendre que le DOM soit prêt
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeNetwork();
            });
        } else {
            this.initializeNetwork();
        }
        
        console.log(">>> NetworkMap.initialize: END");
    }

    initializeNetwork() {
        this.container = document.getElementById('networkContainer');
        
        if (!this.container) {
            console.warn("Network container not found, will retry later");
            setTimeout(() => {
                this.container = document.getElementById('networkContainer');
                if (this.container) {
                    this.setupEventListeners();
                    this.updateNetwork();
                }
            }, 1000);
            return;
        }

        this.setupEventListeners();
        this.updateNetwork();
        this.updateFilterOptions(); // Initialiser les options de filtres
        
        // Ajouter la fonction toggle globale
        window.toggleNetworkLegend = () => this.toggleLegend();
    }

    setupEventListeners() {
        // Boutons de contrôle
        const zoomInBtn = document.getElementById('networkZoomIn');
        const zoomOutBtn = document.getElementById('networkZoomOut');
        const fitBtn = document.getElementById('networkFit');
        const centerBtn = document.getElementById('networkCenter');
        const physicsBtn = document.getElementById('networkPhysics');
        const hierarchyBtn = document.getElementById('networkHierarchy');
        const clusterBtn = document.getElementById('networkClustering');
        const fullscreenBtn = document.getElementById('networkFullscreenBtn');
        const searchInput = document.getElementById('networkSearch');
        const clearSearchBtn = document.getElementById('networkClearSearch');
        const closeInfoBtn = document.getElementById('closeNodeInfo');

        // Filtres intégrés
        const filterCategory = document.getElementById('filterCategory');
        const filterTag = document.getElementById('filterTag');
        const applyFiltersBtn = document.getElementById('applyFiltersBtn');
        const clearFiltersBtn = document.getElementById('clearFiltersBtn');

        if (zoomInBtn) zoomInBtn.addEventListener('click', () => this.zoomIn());
        if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => this.zoomOut());
        if (fitBtn) fitBtn.addEventListener('click', () => this.fitNetwork());
        if (centerBtn) centerBtn.addEventListener('click', () => this.centerNetwork());
        if (physicsBtn) physicsBtn.addEventListener('click', () => this.togglePhysics());
        if (hierarchyBtn) hierarchyBtn.addEventListener('click', () => this.toggleHierarchy());
        if (clusterBtn) clusterBtn.addEventListener('click', () => this.toggleClustering());
        if (fullscreenBtn) fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        if (searchInput) searchInput.addEventListener('input', (e) => this.searchNodes(e.target.value));
        if (clearSearchBtn) clearSearchBtn.addEventListener('click', () => this.clearSearch());
        if (closeInfoBtn) closeInfoBtn.addEventListener('click', () => this.hideNodeInfo());

        // Event listeners pour les filtres
        if (applyFiltersBtn) applyFiltersBtn.addEventListener('click', () => this.applyFilters());
        if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        if (filterCategory) filterCategory.addEventListener('change', () => this.updateFilterOptions());

        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            switch(e.key.toLowerCase()) {
                case 'f': this.fitNetwork(); break;
                case 'c': this.centerNetwork(); break;
                case 'p': this.togglePhysics(); break;
                case 'h': this.toggleHierarchy(); break;
                case 'escape': 
                    if (this.isFullscreen) this.toggleFullscreen();
                    break;
            }
            
            if (e.ctrlKey) {
                if (e.key === '=' || e.key === '+') {
                    e.preventDefault();
                    this.zoomIn();
                } else if (e.key === '-') {
                    e.preventDefault();
                    this.zoomOut();
                }
            }
        });
    }

    updateNetwork() {
        console.log(">>> NetworkMap.updateNetwork: START");
        
        // Vérifier que vis.js est disponible
        if (typeof vis === 'undefined') {
            console.warn("vis.js not loaded, skipping network update");
            return;
        }
        
        // Vérifier que le container existe
        if (!this.container) {
            this.container = document.getElementById('networkContainer');
            if (!this.container) {
                console.warn("Container networkContainer not found, skipping network update");
                return;
            }
        }

        const hostData = this.hostManager.getData();
        
        // Vérifier que les données existent
        if (!hostData || !hostData.categories) {
            console.warn("No host data available, skipping network update");
            return;
        }
        
        // Créer les nodes avec couleurs par catégorie
        const nodesArray = [];
        const edgesArray = [];
        
        for (const categoryName in hostData.categories) {
            const category = hostData.categories[categoryName];
            const hosts = category.hosts || {};
            const categoryColor = this.getCategoryColor(categoryName);
            
            for (const hostId in hosts) {
                const host = hosts[hostId];
                const nodeIcon = this.getNodeIcon(host);
                const compromiseLevel = host.compromiseLevel || 'None';
                const compromiseBorderColor = this.compromiseColors[compromiseLevel];
                
                nodesArray.push({
                    id: hostId,
                    label: `${nodeIcon}\n${hostId}`,
                    color: {
                        background: categoryColor,
                        border: compromiseBorderColor,
                        highlight: {
                            background: this.lightenColor(categoryColor, 0.2),
                            border: this.darkenColor(compromiseBorderColor, 0.3)
                        },
                        hover: {
                            background: this.lightenColor(categoryColor, 0.1),
                            border: compromiseBorderColor
                        }
                    },
                    categoryName: categoryName,
                    hostData: host,
                    size: this.getNodeSize(host),
                    mass: this.getNodeMass(host),
                    borderWidth: this.getBorderWidth(compromiseLevel)
                });
            }
        }
        
        // Créer les edges depuis les données
        if (hostData.edges && Array.isArray(hostData.edges)) {
            hostData.edges.forEach(edge => {
                if (edge.from && edge.to) {
                    edgesArray.push({
                        from: edge.from,
                        to: edge.to,
                        label: edge.label || '',
                        color: {
                            color: '#7f8c8d',
                            highlight: '#3498db',
                            hover: '#2980b9'
                        }
                    });
                }
            });
        }
        
        try {
            // Créer les DataSets
            this.nodes = new vis.DataSet(nodesArray);
            this.edges = new vis.DataSet(edgesArray);
            
            // Créer ou mettre à jour le réseau seulement si le container existe
            if (this.container) {
                const data = { nodes: this.nodes, edges: this.edges };
                
                if (!this.network) {
                    this.network = new vis.Network(this.container, data, this.networkOptions);
                    this.setupNetworkEvents();
                } else {
                    this.network.setData(data);
                }
                
                // Ajuster la vue
                setTimeout(() => {
                    if (this.network) {
                        this.network.fit({ animation: true });
                    }
                }, 100);
            }
        } catch (error) {
            console.error("Error creating network:", error);
        }
        
        console.log(">>> NetworkMap.updateNetwork: END");
    }

    setupNetworkEvents() {
        if (!this.network) return;

        // Double-clic pour éditer un host (ouvrir la sidebar)
        this.network.on('doubleClick', (params) => {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                const nodeData = this.nodes.get(nodeId);
                console.log(`Double-click on node: ${nodeId}`);
                
                // Ouvrir la sidebar d'édition
                if (this.hostManager.modules.hostUI) {
                    this.hostManager.modules.hostUI.editHost(nodeId);
                }
                
                // Optionnel : fermer le panneau d'info
                this.hideNodeInfo();
            }
        });

        // Clic simple pour sélectionner et afficher les infos
        this.network.on('click', (params) => {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                this.selectedNode = nodeId;
                this.showNodeInfo(nodeId);
            } else {
                this.selectedNode = null;
                this.hideNodeInfo();
            }
        });

        // Clic droit pour menu contextuel
        this.network.on('oncontext', (params) => {
            params.event.preventDefault();
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                this.showContextMenu(params.pointer.DOM.x, params.pointer.DOM.y, nodeId);
            }
        });

        // Hover effects
        this.network.on('hoverNode', (params) => {
            this.container.style.cursor = 'pointer';
            if (this.highlightConnectedNodes) {
                this.highlightConnectedNodes(params.node);
            }
        });

        this.network.on('blurNode', (params) => {
            this.container.style.cursor = 'default';
            if (this.resetHighlight) {
                this.resetHighlight();
            }
        });
    }

    // Méthodes de contrôle
    zoomIn() {
        if (this.network) {
            const scale = this.network.getScale() * 1.2;
            this.network.moveTo({ scale: scale });
        }
    }

    zoomOut() {
        if (this.network) {
            const scale = this.network.getScale() * 0.8;
            this.network.moveTo({ scale: scale });
        }
    }

    fitNetwork() {
        if (this.network) {
            this.network.fit({ animation: true });
        }
    }

    centerNetwork() {
        if (this.network) {
            this.network.moveTo({ position: {x: 0, y: 0}, animation: true });
        }
    }

    togglePhysics() {
        this.isPhysicsEnabled = !this.isPhysicsEnabled;
        if (this.network) {
            this.network.setOptions({ physics: { enabled: this.isPhysicsEnabled } });
        }
        
        const btn = document.getElementById('networkPhysics');
        if (btn) {
            btn.classList.toggle('active', this.isPhysicsEnabled);
            btn.textContent = this.isPhysicsEnabled ? '⚡ Physique' : '⚡ Statique';
        }
    }

    toggleHierarchy() {
        this.isHierarchical = !this.isHierarchical;
        
        if (this.network) {
            if (this.isHierarchical) {
                this.network.setOptions({
                    layout: {
                        hierarchical: {
                            enabled: true,
                            direction: 'UD',
                            sortMethod: 'directed'
                        }
                    },
                    physics: { enabled: false }
                });
            } else {
                this.network.setOptions({
                    layout: { hierarchical: { enabled: false } },
                    physics: { enabled: this.isPhysicsEnabled }
                });
            }
        }
        
        const btn = document.getElementById('networkHierarchy');
        if (btn) {
            btn.classList.toggle('active', this.isHierarchical);
        }
    }

    toggleClustering() {
        this.isClustered = !this.isClustered;
        
        const btn = document.getElementById('networkClustering');
        if (btn) {
            btn.classList.toggle('active', this.isClustered);
        }
        
        // Implémentation améliorée du clustering avec expansion/réduction
        if (this.network && this.isClustered) {
            // Grouper par catégorie
            const categories = {};
            this.nodes.forEach(node => {
                const category = node.categoryName;
                if (!categories[category]) {
                    categories[category] = [];
                }
                categories[category].push(node.id);
            });
            
            // Créer des clusters avec gestion des événements
            Object.keys(categories).forEach(category => {
                if (categories[category].length > 1) {
                    this.network.cluster({
                        joinCondition: (nodeOptions) => {
                            return nodeOptions.categoryName === category;
                        },
                        clusterNodeProperties: {
                            id: `cluster_${category}`,
                            label: `📁 ${category} (${categories[category].length})`,
                            color: '#6c757d',
                            size: 40,
                            font: {
                                size: 14,
                                color: '#ffffff',
                                face: 'Arial'
                            },
                            borderWidth: 2,
                            borderColor: '#495057'
                        }
                    });
                }
            });
            
            // Ajouter un gestionnaire d'événements pour les clusters
            this.network.on('click', (params) => {
                if (params.nodes.length > 0) {
                    const nodeId = params.nodes[0];
                    if (nodeId.startsWith('cluster_')) {
                        // C'est un cluster, l'ouvrir
                        this.network.openCluster(nodeId, {
                            releaseFunction: (clusterPosition, containedNodesPositions) => {
                                return containedNodesPositions;
                            }
                        });
                        
                        // Mettre à jour le bouton pour indiquer qu'on peut réduire
                        if (btn) {
                            btn.innerHTML = '🔗 Cluster (Réduire)';
                            btn.title = 'Réduire les clusters';
                        }
                    }
                }
            });
            
        } else if (this.network && !this.isClustered) {
            // Réduire tous les clusters
            this.network.openCluster('cluster_*');
            
            // Remettre le bouton en état normal
            if (btn) {
                btn.innerHTML = '🔗 Cluster';
                btn.title = 'Regroupement automatique des systèmes similaires';
            }
        }
    }

    toggleFullscreen() {
        const networkSection = document.querySelector('.network-section');
        const networkControls = document.querySelector('.network-controls');
        const networkHelp = document.querySelector('.network-help-section');
        const networkLegend = document.querySelector('.network-legend-integrated');
        
        if (!this.isFullscreen) {
            // Entrer en plein écran - masquer les contrôles et garder seulement la carte
            networkSection.classList.add('network-fullscreen');
            
            // Masquer les éléments d'interface
            if (networkControls) networkControls.style.display = 'none';
            if (networkHelp) networkHelp.style.display = 'none';
            if (networkLegend) networkLegend.style.display = 'none';
            
            // Ajuster la hauteur du container
            this.container.style.height = 'calc(100vh - 60px)';
            this.container.style.width = '100%';
            
            this.isFullscreen = true;
            
            // Mettre à jour le bouton
            const fullscreenBtn = document.getElementById('networkFullscreenBtn');
            if (fullscreenBtn) {
                fullscreenBtn.innerHTML = '🔲 Quitter';
                fullscreenBtn.title = 'Quitter le plein écran (Échap)';
            }
            
            // Ajouter un bouton de sortie visible en mode plein écran
            this.createFullscreenExitButton();
            
            // Ajouter un overlay avec instructions
            this.createFullscreenOverlay();
            
        } else {
            // Quitter le plein écran - restaurer l'interface
            networkSection.classList.remove('network-fullscreen');
            
            // Restaurer les éléments d'interface
            if (networkControls) networkControls.style.display = '';
            if (networkHelp) networkHelp.style.display = '';
            if (networkLegend) networkLegend.style.display = '';
            
            // Restaurer les dimensions
            this.container.style.height = '600px';
            this.container.style.width = '';
            
            this.isFullscreen = false;
            
            // Mettre à jour le bouton
            const fullscreenBtn = document.getElementById('networkFullscreenBtn');
            if (fullscreenBtn) {
                fullscreenBtn.innerHTML = '🔲 Plein écran';
                fullscreenBtn.title = 'Plein écran (F11)';
            }
            
            // Supprimer les éléments de plein écran
            this.removeFullscreenExitButton();
            this.removeFullscreenOverlay();
        }
        
        // Redimensionner le réseau
        setTimeout(() => {
            if (this.network) {
                this.network.redraw();
                this.network.fit({ animation: true });
            }
        }, 300);
    }

    createFullscreenExitButton() {
        // Supprimer le bouton existant s'il y en a un
        this.removeFullscreenExitButton();
        
        const exitBtn = document.createElement('button');
        exitBtn.id = 'fullscreen-exit-btn';
        exitBtn.innerHTML = '❌ Quitter le plein écran';
        exitBtn.title = 'Quitter le mode plein écran';
        exitBtn.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(220, 53, 69, 0.9);
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: bold;
            z-index: 10001;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        `;
        
        // Effet hover
        exitBtn.addEventListener('mouseenter', () => {
            exitBtn.style.background = 'rgba(220, 53, 69, 1)';
            exitBtn.style.transform = 'scale(1.05)';
        });
        
        exitBtn.addEventListener('mouseleave', () => {
            exitBtn.style.background = 'rgba(220, 53, 69, 0.9)';
            exitBtn.style.transform = 'scale(1)';
        });
        
        // Event listener pour quitter
        exitBtn.addEventListener('click', () => {
            this.toggleFullscreen();
        });
        
        document.body.appendChild(exitBtn);
    }

    removeFullscreenExitButton() {
        const exitBtn = document.getElementById('fullscreen-exit-btn');
        if (exitBtn && exitBtn.parentNode) {
            exitBtn.parentNode.removeChild(exitBtn);
        }
    }

    createFullscreenOverlay() {
        // Supprimer l'overlay existant s'il y en a un
        this.removeFullscreenOverlay();
        
        const overlay = document.createElement('div');
        overlay.id = 'fullscreen-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 15px;
            border-radius: 8px;
            font-size: 12px;
            z-index: 10000;
            pointer-events: none;
            transition: opacity 0.3s;
        `;
        
        overlay.innerHTML = `
            <div style="margin-bottom: 5px;"><strong>Mode Plein Écran</strong></div>
            <div>• Clic sur un node pour l'éditer</div>
            <div>• Échap pour quitter</div>
        `;
        
        document.body.appendChild(overlay);
        
        // Faire disparaître l'overlay après 3 secondes
        setTimeout(() => {
            if (overlay) {
                overlay.style.opacity = '0';
                setTimeout(() => {
                    if (overlay && overlay.parentNode) {
                        overlay.parentNode.removeChild(overlay);
                    }
                }, 300);
            }
        }, 3000);
    }

    removeFullscreenOverlay() {
        const overlay = document.getElementById('fullscreen-overlay');
        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
    }

    searchNodes(term) {
        this.searchTerm = term.toLowerCase();
        
        if (!this.nodes) return;
        
        const allNodes = this.nodes.get();
        const updatedNodes = allNodes.map(node => {
            const isMatch = !term || 
                           node.id.toLowerCase().includes(this.searchTerm) ||
                           node.label.toLowerCase().includes(this.searchTerm) ||
                           node.categoryName.toLowerCase().includes(this.searchTerm);
            
            return {
                ...node,
                hidden: !isMatch,
                color: isMatch && term ? {
                    ...node.color,
                    border: '#FF5722'
                } : node.color
            };
        });
        
        this.nodes.update(updatedNodes);
    }

    clearSearch() {
        const searchInput = document.getElementById('networkSearch');
        if (searchInput) {
            searchInput.value = '';
            this.searchNodes('');
        }
    }

    showContextMenu(x, y, nodeId) {
        // Supprimer le menu existant
        const existingMenu = document.querySelector('.network-context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
        
        // Créer le nouveau menu
        const menu = document.createElement('div');
        menu.className = 'network-context-menu';
        menu.style.position = 'absolute';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.style.zIndex = '10000';
        
        menu.innerHTML = `
            <div class="context-menu-item" onclick="window.hostManager.modules.networkMap.focusNode('${nodeId}')">
                🎯 Centrer sur ce node
            </div>
            <div class="context-menu-item" onclick="window.hostManager.modules.networkMap.showConnections('${nodeId}')">
                🔗 Voir les connexions
            </div>
            <div class="context-menu-item" onclick="window.hostManager.modules.hostUI.editHost('${nodeId}')">
                ✏️ Éditer
            </div>
            <div class="context-menu-item" onclick="window.hostManager.modules.networkMap.isolateNode('${nodeId}')">
                🔍 Isoler
            </div>
            <div class="context-menu-item" onclick="window.hostManager.modules.networkMap.exportNodeData('${nodeId}')">
                💾 Exporter
            </div>
        `;
        
        document.body.appendChild(menu);
        
        // Supprimer le menu au clic ailleurs
        setTimeout(() => {
            document.addEventListener('click', function removeMenu() {
                menu.remove();
                document.removeEventListener('click', removeMenu);
            });
        }, 100);
    }

    focusNode(nodeId) {
        if (this.network) {
            this.network.focus(nodeId, { 
                scale: 2, 
                animation: { duration: 1000 }
            });
            this.network.selectNodes([nodeId]);
        }
    }

    showConnections(nodeId) {
        if (!this.network) return;
        
        const connectedNodes = this.network.getConnectedNodes(nodeId);
        const nodeData = this.nodes.get(nodeId);
        
        let message = `🔗 Connexions de ${nodeData.label}:\n\n`;
        
        if (connectedNodes.length === 0) {
            message += 'Aucune connexion trouvée.';
        } else {
            connectedNodes.forEach(connectedId => {
                const connectedNode = this.nodes.get(connectedId);
                message += `• ${connectedNode.label}\n`;
            });
        }
        
        alert(message);
    }

    isolateNode(nodeId) {
        if (!this.network) return;
        
        const connectedNodes = this.network.getConnectedNodes(nodeId);
        const nodesToShow = [nodeId, ...connectedNodes];
        
        const allNodes = this.nodes.get();
        const updatedNodes = allNodes.map(node => ({
            ...node,
            hidden: !nodesToShow.includes(node.id)
        }));
        
        this.nodes.update(updatedNodes);
        
        const allEdges = this.edges.get();
        const updatedEdges = allEdges.map(edge => ({
            ...edge,
            hidden: !nodesToShow.includes(edge.from) || !nodesToShow.includes(edge.to)
        }));
        
        this.edges.update(updatedEdges);
        
        setTimeout(() => {
            this.network.fit({ animation: true });
        }, 100);
    }

    exportNodeData(nodeId) {
        const nodeData = this.nodes.get(nodeId);
        if (nodeData) {
            const exportData = {
                id: nodeData.id,
                label: nodeData.label,
                category: nodeData.categoryName,
                hostData: nodeData.hostData,
                connections: this.network ? this.network.getConnectedNodes(nodeId) : [],
                exportDate: new Date().toISOString()
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${nodeId}-network-data.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
    }

    showNodeInfo(nodeId) {
        const nodeData = this.nodes.get(nodeId);
        const panel = document.getElementById('nodeInfoPanel');
        const title = document.getElementById('nodeInfoTitle');
        const content = document.getElementById('nodeInfoContent');
        
        if (panel && title && content && nodeData) {
            const host = nodeData.hostData;
            const compromiseLevel = host.compromiseLevel || 'None';
            
            title.textContent = `${nodeData.label}`;
            
            content.innerHTML = `
                <div class="node-info-item">
                    <div class="node-info-label">Catégorie</div>
                    <div class="node-info-value">${nodeData.categoryName}</div>
                </div>
                
                <div class="node-info-item">
                    <div class="node-info-label">Système</div>
                    <div class="node-info-value">${host.system || 'Non spécifié'}</div>
                </div>
                
                <div class="node-info-item">
                    <div class="node-info-label">Rôle</div>
                    <div class="node-info-value">${host.role || 'Non spécifié'}</div>
                </div>
                
                <div class="node-info-item">
                    <div class="node-info-label">Zone</div>
                    <div class="node-info-value">${host.zone || 'Non spécifiée'}</div>
                </div>
                
                <div class="node-info-item">
                    <div class="node-info-label">Compromission</div>
                    <div class="node-info-value">
                        <span class="compromise-badge compromise-${compromiseLevel.toLowerCase()}">
                            ${this.getCompromiseEmoji(compromiseLevel)} ${compromiseLevel}
                        </span>
                    </div>
                </div>
                
                ${host.ip ? `
                <div class="node-info-item">
                    <div class="node-info-label">Adresse IP</div>
                    <div class="node-info-value" style="font-family: monospace;">${host.ip}</div>
                </div>
                ` : ''}
                
                ${host.tags && host.tags.length > 0 ? `
                <div class="node-info-item">
                    <div class="node-info-label">Tags</div>
                    <div class="node-info-value">${host.tags.join(', ')}</div>
                </div>
                ` : ''}
                
                <div class="node-info-item">
                    <div class="node-info-label">Connexions</div>
                    <div class="node-info-value">${this.network ? this.network.getConnectedNodes(nodeId).length : 0} connexion(s)</div>
                </div>
            `;
            
            panel.style.display = 'block';
        }
    }

    hideNodeInfo() {
        const panel = document.getElementById('nodeInfoPanel');
        if (panel) {
            panel.style.display = 'none';
        }
    }

    toggleLegend() {
        const content = document.getElementById('legendContent');
        const icon = document.getElementById('legendToggleIcon');
        
        if (content && icon) {
            const isCollapsed = content.classList.contains('collapsed');
            
            if (isCollapsed) {
                content.classList.remove('collapsed');
                icon.classList.remove('collapsed');
                icon.textContent = '▼';
            } else {
                content.classList.add('collapsed');
                icon.classList.add('collapsed');
                icon.textContent = '▶';
            }
        }
    }

    // Méthodes utilitaires
    getNodeIcon(host) {
        if (!host) return this.nodeIcons.unknown;
        
        const system = (host.system || '').toLowerCase();
        const role = (host.role || '').toLowerCase();
        const tags = (host.tags || []).map(tag => tag.toLowerCase());
        
        if (system.includes('windows') || role.includes('windows')) return this.nodeIcons.windows;
        if (system.includes('linux') || role.includes('linux')) return this.nodeIcons.linux;
        if (role.includes('dc') || role.includes('domain controller') || tags.includes('dc')) return this.nodeIcons.dc;
        if (role.includes('web') || role.includes('http') || tags.includes('web')) return this.nodeIcons.web;
        if (role.includes('database') || role.includes('db') || tags.includes('database')) return this.nodeIcons.database;
        if (role.includes('router') || tags.includes('router')) return this.nodeIcons.router;
        if (role.includes('switch') || tags.includes('switch')) return this.nodeIcons.switch;
        if (role.includes('firewall') || tags.includes('firewall')) return this.nodeIcons.firewall;
        if (role.includes('server') || tags.includes('server')) return this.nodeIcons.server;
        if (role.includes('workstation') || tags.includes('workstation')) return this.nodeIcons.workstation;
        
        return this.nodeIcons.unknown;
    }

    getNodeSize(host) {
        if (!host) return 25;
        
        const compromiseLevel = host.compromiseLevel || 'None';
        const sizes = {
            'None': 25, 'Low': 30, 'Medium': 35, 
            'High': 40, 'Critical': 45, 'Full': 50
        };
        return sizes[compromiseLevel] || 25;
    }

    getNodeMass(host) {
        if (!host) return 1;
        
        const compromiseLevel = host.compromiseLevel || 'None';
        const masses = {
            'None': 1, 'Low': 1.2, 'Medium': 1.5, 
            'High': 2, 'Critical': 2.5, 'Full': 3
        };
        return masses[compromiseLevel] || 1;
    }

    generateNodeTooltip(hostId, host, categoryName) {
        if (!host) return `<div>Node: ${hostId}</div>`;
        
        const compromiseLevel = host.compromiseLevel || 'None';
        const compromiseColor = this.compromiseColors[compromiseLevel] || this.compromiseColors['None'];
        const nodeIcon = this.getNodeIcon(host);
        
        return `
            <div style="font-family: Arial; max-width: 300px; padding: 10px;">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 20px; margin-right: 8px;">${nodeIcon}</span>
                    <strong style="color: #2c3e50; font-size: 16px;">${hostId}</strong>
                </div>
                <hr style="margin: 8px 0; border: 1px solid #eee;">
                
                <div style="margin-bottom: 6px;">
                    <strong>📁 Catégorie:</strong> 
                    <span style="color: #007bff;">${categoryName}</span>
                </div>
                
                <div style="margin-bottom: 6px;">
                    <strong>💻 Système:</strong> 
                    <span>${host.system || 'Non spécifié'}</span>
                </div>
                
                <div style="margin-bottom: 6px;">
                    <strong>🎯 Compromission:</strong> 
                    <span style="color: ${compromiseColor}; font-weight: bold;">
                        ${this.getCompromiseEmoji(compromiseLevel)} ${compromiseLevel}
                    </span>
                </div>
                
                <hr style="margin: 8px 0; border: 1px solid #eee;">
                <div style="text-align: center;">
                    <em style="color: #6c757d; font-size: 12px;">
                        💡 Clic droit pour plus d'options<br>
                        Double-clic pour éditer
                    </em>
                </div>
            </div>
        `;
    }

    getCompromiseEmoji(compromiseLevel) {
        const emojis = {
            'None': '🎯', 'Low': '🟡', 'Medium': '🟠', 
            'High': '🔴', 'Critical': '🟣', 'Full': '👑'
        };
        return emojis[compromiseLevel] || emojis['None'];
    }

    // Utilitaires de couleur avec protection
    lightenColor(color, amount) {
        if (!color || typeof color !== 'string') return '#28a745';
        
        try {
            const usePound = color[0] === '#';
            const col = usePound ? color.slice(1) : color;
            const num = parseInt(col, 16);
            
            if (isNaN(num)) return color;
            
            let r = (num >> 16) + amount * 255;
            let g = (num >> 8 & 0x00FF) + amount * 255;
            let b = (num & 0x0000FF) + amount * 255;
            
            r = Math.max(0, Math.min(255, r));
            g = Math.max(0, Math.min(255, g));
            b = Math.max(0, Math.min(255, b));
            
            return (usePound ? '#' : '') + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
        } catch (error) {
            console.warn('Error lightening color:', color, error);
            return color;
        }
    }

    darkenColor(color, amount) {
        return this.lightenColor(color, -amount);
    }

    getCategoryColor(categoryName) {
        // Générer une couleur consistante basée sur le nom de la catégorie
        let hash = 0;
        for (let i = 0; i < categoryName.length; i++) {
            hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % this.categoryColors.length;
        return this.categoryColors[index];
    }

    getBorderWidth(compromiseLevel) {
        const widths = {
            'None': 3,
            'Low': 4,
            'Medium': 5,
            'High': 6,
            'Critical': 7,
            'Full': 8
        };
        return widths[compromiseLevel] || 3;
    }

    highlightConnectedNodes(nodeId) {
        if (!this.network || !this.nodes || !this.edges) return;
        
        try {
            const connectedNodes = this.network.getConnectedNodes(nodeId);
            const connectedEdges = this.network.getConnectedEdges(nodeId);
            
            // Réinitialiser tous les nodes
            const allNodes = this.nodes.get();
            const updatedNodes = allNodes.map(node => {
                if (node.id === nodeId) {
                    // Node survolé - plus lumineux
                    return {
                        ...node,
                        color: {
                            ...node.color,
                            background: this.lightenColor(node.color.background, 0.3)
                        }
                    };
                } else if (connectedNodes.includes(node.id)) {
                    // Nodes connectés - légèrement mis en évidence
                    return {
                        ...node,
                        color: {
                            ...node.color,
                            background: this.lightenColor(node.color.background, 0.1)
                        }
                    };
                } else {
                    // Autres nodes - plus sombres
                    return {
                        ...node,
                        color: {
                            ...node.color,
                            background: this.darkenColor(node.color.background, 0.3)
                        }
                    };
                }
            });
            
            this.nodes.update(updatedNodes);
        } catch (error) {
            console.warn('Error in highlightConnectedNodes:', error);
        }
    }

    resetHighlight() {
        if (!this.nodes) return;
        
        const allNodes = this.nodes.get();
        const updatedNodes = allNodes.map(node => ({
            ...node,
            color: {
                ...node.color,
                border: this.compromiseColors[node.hostData?.compromiseLevel || 'None']
            }
        }));
        
        this.nodes.update(updatedNodes);
    }

    // Méthodes pour les filtres intégrés
    applyFilters() {
        const categoryFilter = document.getElementById('filterCategory')?.value || '';
        const tagFilter = document.getElementById('filterTag')?.value || '';
        
        console.log('Applying filters:', { categoryFilter, tagFilter });
        
        if (!this.nodes) {
            console.warn('No nodes available for filtering');
            return;
        }
        
        const allNodes = this.nodes.get();
        console.log('Total nodes before filtering:', allNodes.length);
        
        const updatedNodes = allNodes.map(node => {
            const hostData = node.hostData;
            let isVisible = true;
            
            // Filtre par catégorie
            if (categoryFilter && node.categoryName !== categoryFilter) {
                console.log(`Hiding node ${node.id} - category mismatch: ${node.categoryName} vs ${categoryFilter}`);
                isVisible = false;
            }
            
            // Filtre par tag
            if (tagFilter && isVisible && hostData.tags) {
                const tags = Array.isArray(hostData.tags) ? hostData.tags : [hostData.tags];
                const tagMatch = tags.some(tag => 
                    tag && tag.toLowerCase().includes(tagFilter.toLowerCase())
                );
                if (!tagMatch) {
                    console.log(`Hiding node ${node.id} - no tag match for: ${tagFilter}`);
                    isVisible = false;
                }
            }
            
            return {
                ...node,
                hidden: !isVisible
            };
        });
        
        const visibleNodes = updatedNodes.filter(node => !node.hidden);
        console.log('Visible nodes after filtering:', visibleNodes.length);
        
        this.nodes.update(updatedNodes);
        
        // Ajuster la vue après filtrage
        setTimeout(() => {
            if (this.network) {
                this.network.fit({ animation: true });
            }
        }, 100);
    }

    clearFilters() {
        const categorySelect = document.getElementById('filterCategory');
        const tagInput = document.getElementById('filterTag');
        
        if (categorySelect) categorySelect.value = '';
        if (tagInput) tagInput.value = '';
        
        // Afficher tous les nodes
        if (this.nodes) {
            const allNodes = this.nodes.get();
            const updatedNodes = allNodes.map(node => ({
                ...node,
                hidden: false
            }));
            this.nodes.update(updatedNodes);
        }
        
        // Ajuster la vue
        setTimeout(() => {
            if (this.network) {
                this.network.fit({ animation: true });
            }
        }, 100);
    }

    updateFilterOptions() {
        const categorySelect = document.getElementById('filterCategory');
        if (!categorySelect) return;
        
        const hostData = this.hostManager.getData();
        if (!hostData || !hostData.categories) return;
        
        // Vider les options existantes sauf "Toutes les catégories"
        categorySelect.innerHTML = '<option value="">Toutes les catégories</option>';
        
        // Ajouter les catégories disponibles
        Object.keys(hostData.categories).forEach(categoryName => {
            const option = document.createElement('option');
            option.value = categoryName;
            option.textContent = categoryName;
            categorySelect.appendChild(option);
        });
    }

    // Méthode de test pour vérifier les filtres
    testFilters() {
        console.log('🧪 Test des filtres...');
        
        // Vérifier que les éléments existent
        const categorySelect = document.getElementById('filterCategory');
        const tagInput = document.getElementById('filterTag');
        const applyBtn = document.getElementById('applyFiltersBtn');
        const clearBtn = document.getElementById('clearFiltersBtn');
        
        console.log('Éléments trouvés:', {
            categorySelect: !!categorySelect,
            tagInput: !!tagInput,
            applyBtn: !!applyBtn,
            clearBtn: !!clearBtn
        });
        
        // Vérifier les données
        const hostData = this.hostManager.getData();
        console.log('Données disponibles:', {
            categories: Object.keys(hostData?.categories || {}),
            totalHosts: Object.values(hostData?.categories || {}).reduce((acc, cat) => 
                acc + Object.keys(cat.hosts || {}).length, 0
            )
        });
        
        // Tester un filtre par catégorie
        if (categorySelect && Object.keys(hostData?.categories || {}).length > 0) {
            const firstCategory = Object.keys(hostData.categories)[0];
            categorySelect.value = firstCategory;
            console.log(`Test filtre catégorie: ${firstCategory}`);
            this.applyFilters();
        }
        
        // Tester le filtre par tag
        if (tagInput) {
            tagInput.value = 'test';
            console.log('Test filtre tag: test');
            this.applyFilters();
        }
        
        // Nettoyer
        setTimeout(() => {
            this.clearFilters();
            console.log('✅ Test des filtres terminé');
        }, 2000);
    }
} 