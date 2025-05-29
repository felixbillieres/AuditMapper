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
            this.highlightConnectedNodes(params.node);
        });

        this.network.on('blurNode', (params) => {
            this.container.style.cursor = 'default';
            this.resetHighlight();
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
        
        // Implémentation basique du clustering
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
            
            // Créer des clusters
            Object.keys(categories).forEach(category => {
                if (categories[category].length > 1) {
                    this.network.cluster({
                        joinCondition: (nodeOptions) => {
                            return nodeOptions.categoryName === category;
                        },
                        clusterNodeProperties: {
                            id: `cluster_${category}`,
                            label: `📁 ${category}`,
                            color: '#6c757d',
                            size: 40
                        }
                    });
                }
            });
        } else if (this.network && !this.isClustered) {
            this.network.openCluster('cluster_*');
        }
    }

    toggleFullscreen() {
        const networkSection = document.querySelector('.network-section');
        
        if (!this.isFullscreen) {
            // Entrer en plein écran
            networkSection.classList.add('network-fullscreen');
            this.container.style.height = 'calc(100vh - 120px)';
            this.isFullscreen = true;
            
            // Mettre à jour le bouton
            const fullscreenBtn = document.getElementById('networkFullscreenBtn');
            if (fullscreenBtn) {
                fullscreenBtn.innerHTML = '🔲 Quitter';
                fullscreenBtn.title = 'Quitter le plein écran (Échap)';
            }
        } else {
            // Quitter le plein écran
            networkSection.classList.remove('network-fullscreen');
            this.container.style.height = '600px';
            this.isFullscreen = false;
            
            // Mettre à jour le bouton
            const fullscreenBtn = document.getElementById('networkFullscreenBtn');
            if (fullscreenBtn) {
                fullscreenBtn.innerHTML = '🔲 Plein écran';
                fullscreenBtn.title = 'Plein écran (F11)';
            }
        }
        
        // Redimensionner le réseau
        setTimeout(() => {
            if (this.network) {
                this.network.redraw();
                this.network.fit({ animation: true });
            }
        }, 300);
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
} 