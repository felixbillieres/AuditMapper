/**
 * Gestionnaire du réseau Vis.js
 */

export class NetworkManager {
    constructor(hostManager) {
        this.hostManager = hostManager;
        this.network = null;
        this.container = null;
        this.categoryColors = {};
    }

    initialize() {
        console.log(">>> NetworkManager.initialize: START");
        this.container = document.getElementById('network-map');
        if (!this.container) {
            console.error("Network container not found!");
            return;
        }
        this.generateCategoryColors();
        this.updateNetwork();
        console.log(">>> NetworkManager.initialize: END");
    }

    generateCategoryColors() {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
            '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
        ];
        
        const hostData = this.hostManager.getData();
        const categories = Object.keys(hostData.categories);
        
        categories.forEach((category, index) => {
            this.categoryColors[category] = colors[index % colors.length];
        });
    }

    updateNetwork() {
        console.log(">>> updateNetwork: START");
        this.generateCategoryColors();
        const { nodes, edges } = this.prepareNetworkData();
        
        const data = { nodes, edges };
        const options = this.getNetworkOptions();
        
        if (this.network) {
            this.network.destroy();
        }
        
        this.network = new vis.Network(this.container, data, options);
        this.setupNetworkEvents();
        console.log(">>> updateNetwork: END");
    }

    prepareNetworkData() {
        const nodes = [];
        const edges = [];
        const hostData = this.hostManager.getData();

        // Créer les nœuds à partir des hôtes
        for (const categoryName in hostData.categories) {
            const category = hostData.categories[categoryName];
            if (!category.hosts) continue;

            for (const hostId in category.hosts) {
                const host = category.hosts[hostId];
                const categoryColor = this.categoryColors[categoryName] || '#6c757d';
                
                nodes.push({
                    id: hostId,
                    label: this.getNodeLabel(hostId, host.compromiseLevel),
                    group: categoryName,
                    title: this.generateNodeTooltip(host, hostId, categoryName),
                    color: {
                        background: categoryColor,
                        border: this.getBorderColor(host.compromiseLevel),
                        highlight: {
                            background: this.lightenColor(categoryColor, 20),
                            border: this.getBorderColor(host.compromiseLevel)
                        }
                    },
                    font: { 
                        color: '#000000',
                        size: 14,
                        face: 'Arial',
                        strokeWidth: 2,
                        strokeColor: '#ffffff'
                    },
                    size: this.getNodeSize(host.compromiseLevel),
                    borderWidth: 3
                });
            }
        }

        // Ajouter les edges avec des couleurs selon le type
        hostData.edges.forEach(edge => {
            edges.push({
                from: edge.from,
                to: edge.to,
                label: edge.label || '',
                color: {
                    color: '#2c3e50',
                    highlight: '#e74c3c'
                },
                width: 2,
                arrows: {
                    to: { enabled: true, scaleFactor: 1.2, type: 'arrow' }
                }
            });
        });

        return { nodes, edges };
    }

    getNodeLabel(hostId, compromiseLevel) {
        const emoji = this.getCompromiseEmoji(compromiseLevel);
        return `${emoji} ${hostId}`;
    }

    getCompromiseEmoji(compromiseLevel) {
        const emojis = {
            'Full': '👑',      // Couronne pour root/admin
            'Partial': '🔓',   // Cadenas ouvert pour accès partiel
            'Initial': '🦶',   // Pied pour foothold
            'None': '🎯'       // Cible pour non compromis
        };
        return emojis[compromiseLevel] || emojis['None'];
    }

    getNodeSize(compromiseLevel) {
        const sizes = {
            'Full': 35,
            'Partial': 30,
            'Initial': 25,
            'None': 20
        };
        return sizes[compromiseLevel] || sizes['None'];
    }

    getBorderColor(compromiseLevel) {
        const colors = {
            'Full': '#c0392b',      // Rouge foncé pour full
            'Partial': '#e67e22',   // Orange foncé pour partial
            'Initial': '#27ae60',   // Vert foncé pour initial
            'None': '#7f8c8d'       // Gris pour none
        };
        return colors[compromiseLevel] || colors['None'];
    }

    lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    generateNodeTooltip(host, hostId, categoryName) {
        return `
            <div style="font-family: Arial; max-width: 250px;">
                <strong style="color: #2c3e50; font-size: 16px;">${hostId}</strong><br>
                <hr style="margin: 5px 0;">
                <strong>Catégorie:</strong> <span style="color: ${this.categoryColors[categoryName]};">${categoryName}</span><br>
                <strong>Système:</strong> ${host.system || 'N/A'}<br>
                <strong>Rôle:</strong> ${host.role || 'N/A'}<br>
                <strong>Zone:</strong> ${host.zone || 'N/A'}<br>
                <strong>Compromission:</strong> <span style="color: ${this.getBorderColor(host.compromiseLevel)};">${this.getCompromiseEmoji(host.compromiseLevel)} ${host.compromiseLevel || 'None'}</span><br>
                <strong>Tags:</strong> ${host.tags?.join(', ') || 'Aucun'}<br>
                <em style="color: #7f8c8d; font-size: 12px;">Double-clic pour éditer</em>
            </div>
        `;
    }

    getNetworkOptions() {
        return {
            nodes: {
                shape: 'dot',
                font: { 
                    size: 14,
                    color: '#000000',
                    face: 'Arial',
                    strokeWidth: 2,
                    strokeColor: '#ffffff'
                },
                borderWidth: 3,
                shadow: {
                    enabled: true,
                    color: 'rgba(0,0,0,0.3)',
                    size: 8,
                    x: 3,
                    y: 3
                }
            },
            edges: {
                width: 2,
                color: { color: '#2c3e50' },
                smooth: { 
                    type: 'continuous',
                    roundness: 0.3
                },
                arrows: {
                    to: { enabled: true, scaleFactor: 1.2, type: 'arrow' }
                },
                font: {
                    color: '#2c3e50',
                    size: 12,
                    strokeWidth: 2,
                    strokeColor: '#ffffff'
                }
            },
            physics: {
                enabled: true,
                stabilization: { iterations: 150 },
                barnesHut: {
                    gravitationalConstant: -3000,
                    centralGravity: 0.3,
                    springLength: 120,
                    springConstant: 0.04,
                    damping: 0.09,
                    avoidOverlap: 0.2
                }
            },
            interaction: {
                hover: true,
                tooltipDelay: 300,
                selectConnectedEdges: false,
                hoverConnectedEdges: true
            },
            layout: {
                improvedLayout: true,
                clusterThreshold: 150
            },
            groups: this.generateGroupStyles()
        };
    }

    generateGroupStyles() {
        const groups = {};
        for (const [category, color] of Object.entries(this.categoryColors)) {
            groups[category] = {
                color: {
                    background: color,
                    border: this.darkenColor(color, 20)
                }
            };
        }
        return groups;
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
            (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
            (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
    }

    setupNetworkEvents() {
        // Double-clic pour éditer
        this.network.on('doubleClick', (params) => {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                console.log(`Double-click on node: ${nodeId}`);
                this.hostManager.modules.hostUI.editHost(nodeId);
            }
        });

        // Clic simple pour sélectionner et ouvrir la sidebar
        this.network.on('click', (params) => {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                console.log(`Single click on node: ${nodeId} - Opening sidebar`);
                
                // Vérifier que le module hostUI existe
                if (this.hostManager.modules.hostUI) {
                    console.log("HostUI module found, calling editHost");
                    this.hostManager.modules.hostUI.editHost(nodeId);
                } else {
                    console.error("HostUI module not found!");
                }
            } else {
                console.log("No node clicked");
            }
        });

        // Curseur pointer sur hover
        this.network.on('hoverNode', (params) => {
            this.container.style.cursor = 'pointer';
        });

        this.network.on('blurNode', (params) => {
            this.container.style.cursor = 'default';
        });
    }
}