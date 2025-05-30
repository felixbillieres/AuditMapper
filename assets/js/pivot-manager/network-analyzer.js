/**
 * Pivot Manager - Module d'Analyse Réseau
 * Calcul des chemins optimaux et topologie réseau
 */

class NetworkAnalyzer {
    constructor(core) {
        this.core = core;
        this.networkGraph = null;
        this.networkData = {
            nodes: [],
            edges: []
        };
        this.reachabilityMatrix = {};
        this.pivotPaths = [];
    }

    async init() {
        console.log('🔍 Initialisation du Network Analyzer...');
        this.setupNetworkVisualization();
    }

    setupNetworkVisualization() {
        const container = document.getElementById('networkTopology');
        if (container && window.vis) {
            const options = {
                nodes: {
                    shape: 'box',
                    margin: 10,
                    font: { color: '#333', size: 12 },
                    borderWidth: 2,
                    borderWidthSelected: 3
                },
                edges: {
                    arrows: { to: { enabled: true, scaleFactor: 1 } },
                    color: { color: '#848484', highlight: '#3366cc' },
                    smooth: { type: 'continuous' }
                },
                physics: {
                    stabilization: { iterations: 100 },
                    barnesHut: { gravitationalConstant: -8000, springConstant: 0.001 }
                },
                interaction: {
                    selectConnectedEdges: false,
                    hover: true
                }
            };

            this.networkGraph = new vis.Network(container, this.networkData, options);
            this.setupNetworkEvents();
        }
    }

    setupNetworkEvents() {
        if (this.networkGraph) {
            this.networkGraph.on('click', (params) => {
                if (params.nodes.length > 0) {
                    this.selectNodeForPath(params.nodes[0]);
                }
            });

            this.networkGraph.on('hoverNode', (params) => {
                this.showNodeInfo(params.node);
            });
        }
    }

    generateTopology() {
        if (!this.core.hostManagerData) {
            this.core.showNotification('Aucune donnée Host Manager disponible', 'warning');
            return;
        }

        this.analyzeNetworkStructure();
        this.buildNetworkGraph();
        this.calculateReachability();
        this.updateVisualization();
    }

    analyzeNetworkStructure() {
        const nodes = [];
        const edges = [];
        const hostData = this.core.hostManagerData;

        // Créer les nodes à partir des données Host Manager
        Object.entries(hostData).forEach(([categoryName, categoryData]) => {
            if (categoryData.hosts) {
                Object.entries(categoryData.hosts).forEach(([hostId, host]) => {
                    const node = {
                        id: hostId,
                        label: `${host.hostname || host.ip}\n${host.ip}`,
                        title: this.generateNodeTooltip(host),
                        color: this.getNodeColor(host),
                        category: categoryName,
                        host: host,
                        reachable: this.isHostReachable(host),
                        compromised: this.getCompromiseLevel(host)
                    };
                    nodes.push(node);
                });
            }
        });

        // Créer les edges à partir des connexions définies dans Host Manager
        this.buildEdgesFromConnections(nodes, edges, hostData);

        // Ajouter l'attaquant comme node source
        if (this.core.config.attackerIP) {
            nodes.unshift({
                id: 'attacker',
                label: `Attaquant\n${this.core.config.attackerIP}`,
                title: 'Machine de l\'attaquant',
                color: { background: '#ff4444', border: '#cc0000' },
                category: 'attacker',
                reachable: true,
                compromised: 'full'
            });
        }

        this.networkData.nodes = nodes;
        this.networkData.edges = edges;
    }

    buildEdgesFromConnections(nodes, edges, hostData) {
        // Analyser les connexions explicites définies dans Host Manager
        Object.entries(hostData).forEach(([categoryName, categoryData]) => {
            if (categoryData.hosts) {
                Object.entries(categoryData.hosts).forEach(([hostId, host]) => {
                    // Connexions explicites (edges définies dans Host Manager)
                    if (host.edges && Array.isArray(host.edges)) {
                        host.edges.forEach(edge => {
                            if (typeof edge === 'object' && edge.targetHostId) {
                                edges.push({
                                    id: `${hostId}-${edge.targetHostId}`,
                                    from: hostId,
                                    to: edge.targetHostId,
                                    label: edge.label || 'Connexion',
                                    title: `${edge.description || 'Connexion réseau'}`,
                                    color: '#2196F3',
                                    width: 2
                                });
                            }
                        });
                    }

                    // Analyser les connexions implicites basées sur les sous-réseaux
                    this.findImplicitConnections(hostId, host, nodes, edges);
                });
            }
        });

        // Ajouter les connexions depuis l'attaquant vers les hosts compromis
        this.addAttackerConnections(nodes, edges);
    }

    findImplicitConnections(hostId, host, nodes, edges) {
        if (!host.ip) return;

        const hostNetwork = this.getNetworkFromIP(host.ip);
        
        nodes.forEach(node => {
            if (node.id !== hostId && node.host && node.host.ip) {
                const nodeNetwork = this.getNetworkFromIP(node.host.ip);
                
                // Si les hosts sont sur le même réseau, créer une connexion potentielle
                if (hostNetwork === nodeNetwork) {
                    const existingEdge = edges.find(e => 
                        (e.from === hostId && e.to === node.id) || 
                        (e.from === node.id && e.to === hostId)
                    );
                    
                    if (!existingEdge) {
                        edges.push({
                            id: `${hostId}-${node.id}-implicit`,
                            from: hostId,
                            to: node.id,
                            label: 'Réseau local',
                            title: `Connexion réseau implicite (${hostNetwork})`,
                            color: '#FFC107',
                            width: 1,
                            dashes: true,
                            implicit: true
                        });
                    }
                }
            }
        });
    }

    addAttackerConnections(nodes, edges) {
        if (!this.core.config.attackerIP) return;

        nodes.forEach(node => {
            if (node.id !== 'attacker' && node.compromised && node.compromised !== 'none') {
                edges.push({
                    id: `attacker-${node.id}`,
                    from: 'attacker',
                    to: node.id,
                    label: 'Accès compromis',
                    title: `Accès via compromission (${node.compromised})`,
                    color: '#E91E63',
                    width: 3
                });
            }
        });
    }

    getNetworkFromIP(ip) {
        const parts = ip.split('.');
        if (parts.length === 4) {
            // Supposer un masque /24 par défaut
            return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
        }
        return null;
    }

    getNodeColor(host) {
        const compromiseLevel = this.getCompromiseLevel(host);
        const reachable = this.isHostReachable(host);
        
        const colors = {
            'full': { background: '#f44336', border: '#d32f2f' },
            'partial': { background: '#ff9800', border: '#f57c00' },
            'initial': { background: '#ffeb3b', border: '#fbc02d' },
            'none': reachable ? 
                { background: '#4caf50', border: '#388e3c' } : 
                { background: '#9e9e9e', border: '#616161' }
        };
        
        return colors[compromiseLevel] || colors.none;
    }

    getCompromiseLevel(host) {
        // Analyser le niveau de compromission basé sur les credentials et exploitation steps
        if (host.credentials && host.credentials.length > 0) {
            const adminCreds = host.credentials.some(cred => 
                cred.username && (
                    cred.username.toLowerCase().includes('admin') ||
                    cred.username.toLowerCase().includes('root') ||
                    cred.username === 'administrator'
                )
            );
            return adminCreds ? 'full' : 'partial';
        }
        
        if (host.exploitationSteps && host.exploitationSteps.length > 0) {
            const hasShell = host.exploitationSteps.some(step => 
                step.command && (
                    step.command.includes('shell') ||
                    step.command.includes('meterpreter') ||
                    step.command.includes('nc ') ||
                    step.command.includes('bash')
                )
            );
            return hasShell ? 'initial' : 'none';
        }
        
        return 'none';
    }

    isHostReachable(host) {
        // Vérifier si le host est potentiellement accessible
        // Basé sur les ports ouverts, services, etc.
        if (host.services && host.services.length > 0) {
            return host.services.some(service => 
                service.port && (
                    service.port === '22' ||  // SSH
                    service.port === '80' ||  // HTTP
                    service.port === '443' || // HTTPS
                    service.port === '3389'   // RDP
                )
            );
        }
        return false;
    }

    generateNodeTooltip(host) {
        let tooltip = `<strong>${host.hostname || host.ip}</strong><br>`;
        tooltip += `IP: ${host.ip}<br>`;
        
        if (host.os) {
            tooltip += `OS: ${host.os}<br>`;
        }
        
        if (host.credentials && host.credentials.length > 0) {
            tooltip += `Credentials: ${host.credentials.length}<br>`;
        }
        
        if (host.services && host.services.length > 0) {
            tooltip += `Services: ${host.services.slice(0, 3).map(s => s.name || s.port).join(', ')}`;
            if (host.services.length > 3) tooltip += '...';
        }
        
        return tooltip;
    }

    calculateReachability() {
        const nodes = this.networkData.nodes;
        const edges = this.networkData.edges;
        
        // Initialiser la matrice de reachabilité
        this.reachabilityMatrix = {};
        nodes.forEach(node => {
            this.reachabilityMatrix[node.id] = {};
            nodes.forEach(targetNode => {
                this.reachabilityMatrix[node.id][targetNode.id] = {
                    reachable: false,
                    path: [],
                    cost: Infinity,
                    method: null
                };
            });
            this.reachabilityMatrix[node.id][node.id] = {
                reachable: true,
                path: [node.id],
                cost: 0,
                method: 'direct'
            };
        });

        // Appliquer l'algorithme de Floyd-Warshall modifié
        this.calculateShortestPaths(nodes, edges);
    }

    calculateShortestPaths(nodes, edges) {
        const nodeIds = nodes.map(n => n.id);
        
        // Initialiser les connexions directes
        edges.forEach(edge => {
            const cost = this.getConnectionCost(edge);
            this.reachabilityMatrix[edge.from][edge.to] = {
                reachable: true,
                path: [edge.from, edge.to],
                cost: cost,
                method: edge.implicit ? 'network' : 'direct'
            };
        });

        // Floyd-Warshall pour trouver tous les chemins les plus courts
        for (const k of nodeIds) {
            for (const i of nodeIds) {
                for (const j of nodeIds) {
                    const throughK = this.reachabilityMatrix[i][k].cost + this.reachabilityMatrix[k][j].cost;
                    if (throughK < this.reachabilityMatrix[i][j].cost) {
                        this.reachabilityMatrix[i][j] = {
                            reachable: true,
                            path: [...this.reachabilityMatrix[i][k].path.slice(0, -1), ...this.reachabilityMatrix[k][j].path],
                            cost: throughK,
                            method: 'pivot'
                        };
                    }
                }
            }
        }
    }

    getConnectionCost(edge) {
        // Calculer le coût d'une connexion basé sur plusieurs facteurs
        let cost = 1;
        
        if (edge.implicit) cost += 2; // Connexion implicite plus coûteuse
        if (edge.color === '#E91E63') cost += 0.5; // Connexion compromise moins coûteuse
        
        return cost;
    }

    calculateOptimalPath(selectedNodes) {
        if (selectedNodes.length < 2) {
            this.core.showNotification('Sélectionnez au moins 2 nodes pour calculer un chemin', 'warning');
            return;
        }

        const source = selectedNodes[0];
        const targets = selectedNodes.slice(1);
        
        this.pivotPaths = [];

        targets.forEach(target => {
            const path = this.findOptimalPivotPath(source.id, target.id);
            if (path) {
                this.pivotPaths.push({
                    source: source,
                    target: target,
                    path: path,
                    techniques: this.suggestTechniques(path)
                });
            }
        });

        this.displayPivotPaths();
        this.updateVisualization();
    }

    findOptimalPivotPath(sourceId, targetId) {
        if (!this.reachabilityMatrix[sourceId] || !this.reachabilityMatrix[sourceId][targetId]) {
            return null;
        }

        const reachability = this.reachabilityMatrix[sourceId][targetId];
        if (!reachability.reachable) {
            return null;
        }

        return {
            nodes: reachability.path,
            cost: reachability.cost,
            method: reachability.method,
            hops: reachability.path.length - 1
        };
    }

    suggestTechniques(path) {
        if (!path || path.hops === 0) return [];

        const techniques = [];
        const pathNodes = path.nodes.map(nodeId => 
            this.networkData.nodes.find(n => n.id === nodeId)
        );

        // Analyser chaque saut pour suggérer des techniques
        for (let i = 0; i < pathNodes.length - 1; i++) {
            const currentNode = pathNodes[i];
            const nextNode = pathNodes[i + 1];
            
            const suggestedTechnique = this.suggestTechniqueForHop(currentNode, nextNode);
            if (suggestedTechnique) {
                techniques.push(suggestedTechnique);
            }
        }

        return techniques;
    }

    suggestTechniqueForHop(fromNode, toNode) {
        // Analyser les capabilities des nodes pour suggérer la meilleure technique
        const fromHost = fromNode.host;
        const toHost = toNode.host;

        // Si SSH est disponible, le privilégier
        if (this.hasSSHAccess(fromHost)) {
            return {
                technique: 'ssh',
                reason: 'SSH disponible sur le pivot',
                confidence: 0.9
            };
        }

        // Si on a des credentials, SSH est possible
        if (fromHost && fromHost.credentials && fromHost.credentials.length > 0) {
            return {
                technique: 'ssh',
                reason: 'Credentials disponibles pour SSH',
                confidence: 0.8
            };
        }

        // Chisel comme alternative HTTP
        if (this.hasWebAccess(fromHost)) {
            return {
                technique: 'chisel',
                reason: 'Service web disponible pour Chisel',
                confidence: 0.7
            };
        }

        // SOCAT pour les connexions basiques
        return {
            technique: 'socat',
            reason: 'Technique de base pour relay',
            confidence: 0.5
        };
    }

    hasSSHAccess(host) {
        if (!host || !host.services) return false;
        return host.services.some(service => service.port === '22');
    }

    hasWebAccess(host) {
        if (!host || !host.services) return false;
        return host.services.some(service => 
            service.port === '80' || service.port === '443' || service.port === '8080'
        );
    }

    displayPivotPaths() {
        const container = document.getElementById('pivotPathContainer');
        const pathDisplay = document.getElementById('pivotPath');
        
        if (!container || !pathDisplay) return;

        if (this.pivotPaths.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        
        let pathHtml = '';
        this.pivotPaths.forEach((pivotPath, index) => {
            pathHtml += this.generatePathHtml(pivotPath, index);
        });
        
        pathDisplay.innerHTML = pathHtml;
    }

    generatePathHtml(pivotPath, index) {
        const pathNodes = pivotPath.path.nodes.map(nodeId => {
            const node = this.networkData.nodes.find(n => n.id === nodeId);
            return node ? { id: nodeId, label: node.label.split('\n')[0] } : { id: nodeId, label: nodeId };
        });

        let html = `<div class="pivot-path-item mb-3">`;
        html += `<h6><i class="fas fa-route"></i> Chemin ${index + 1}: ${pivotPath.source.name} → ${pivotPath.target.name}</h6>`;
        html += `<div class="d-flex align-items-center mb-2">`;
        
        pathNodes.forEach((node, i) => {
            html += `<span class="pivot-node">${node.label}</span>`;
            if (i < pathNodes.length - 1) {
                html += `<i class="fas fa-arrow-right pivot-arrow mx-2"></i>`;
            }
        });
        
        html += `</div>`;
        html += `<small class="text-muted">`;
        html += `<i class="fas fa-info-circle"></i> `;
        html += `${pivotPath.path.hops} saut(s), Coût: ${pivotPath.path.cost.toFixed(1)}`;
        
        if (pivotPath.techniques.length > 0) {
            const bestTechnique = pivotPath.techniques[0];
            html += ` | Technique recommandée: <strong>${bestTechnique.technique.toUpperCase()}</strong>`;
        }
        
        html += `</small></div>`;
        
        return html;
    }

    updateVisualization() {
        if (this.networkGraph) {
            this.networkGraph.setData(this.networkData);
            
            // Highlight pivot paths if any
            if (this.pivotPaths.length > 0) {
                this.highlightPivotPaths();
            }
        }
    }

    highlightPivotPaths() {
        // Mettre en évidence les chemins de pivot sur le graphique
        const edgeUpdates = [];
        
        this.pivotPaths.forEach((pivotPath, pathIndex) => {
            const pathNodes = pivotPath.path.nodes;
            const color = this.getPivotPathColor(pathIndex);
            
            for (let i = 0; i < pathNodes.length - 1; i++) {
                const from = pathNodes[i];
                const to = pathNodes[i + 1];
                
                // Trouver l'edge correspondant et le mettre en évidence
                const edgeId = this.networkData.edges.find(e => 
                    (e.from === from && e.to === to) || (e.from === to && e.to === from)
                )?.id;
                
                if (edgeId) {
                    edgeUpdates.push({
                        id: edgeId,
                        color: color,
                        width: 4
                    });
                }
            }
        });
        
        if (edgeUpdates.length > 0) {
            this.networkGraph.updateCluster
        }
    }

    getPivotPathColor(index) {
        const colors = ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff', '#44ffff'];
        return colors[index % colors.length];
    }

    selectNodeForPath(nodeId) {
        const node = this.networkData.nodes.find(n => n.id === nodeId);
        if (node) {
            // Ajouter le node aux nodes sélectionnés
            const nodeForSelection = {
                id: nodeId,
                name: node.label.split('\n')[0],
                ip: node.host ? node.host.ip : node.label.split('\n')[1]
            };
            
            this.core.addSelectedNode(nodeForSelection);
        }
    }

    showNodeInfo(nodeId) {
        const node = this.networkData.nodes.find(n => n.id === nodeId);
        if (node && node.title) {
            // Afficher les informations dans une tooltip ou un panel
            console.log('Node info:', node.title);
        }
    }

    async testConnectivity() {
        if (this.core.selectedNodes.length === 0) {
            this.core.showNotification('Sélectionnez des nodes pour tester la connectivité', 'warning');
            return;
        }

        this.core.showNotification('Test de connectivité en cours...', 'info');
        
        // Simuler des tests de connectivité
        const results = [];
        for (const node of this.core.selectedNodes) {
            const result = await this.simulateConnectivityTest(node);
            results.push(result);
        }
        
        this.displayConnectivityResults(results);
    }

    async simulateConnectivityTest(node) {
        // Simuler un délai de test
        await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
        
        return {
            node: node,
            reachable: Math.random() > 0.3, // 70% de chance d'être accessible
            latency: Math.floor(Math.random() * 100) + 10,
            services: Math.random() > 0.5 ? ['SSH', 'HTTP'] : ['HTTP']
        };
    }

    displayConnectivityResults(results) {
        const statusContainer = document.getElementById('connectionStatus');
        if (!statusContainer) return;

        let html = '<div class="connectivity-results">';
        results.forEach(result => {
            const status = result.reachable ? 'success' : 'danger';
            const icon = result.reachable ? 'fa-check-circle' : 'fa-times-circle';
            
            html += `<div class="connectivity-item d-flex justify-content-between align-items-center mb-2">`;
            html += `<span><i class="fas ${icon} text-${status}"></i> ${result.node.name}</span>`;
            if (result.reachable) {
                html += `<small class="text-muted">${result.latency}ms | ${result.services.join(', ')}</small>`;
            } else {
                html += `<small class="text-danger">Inatteignable</small>`;
            }
            html += `</div>`;
        });
        html += '</div>';
        
        statusContainer.innerHTML = html;
    }

    exportTopology() {
        try {
            const exportData = {
                timestamp: new Date().toISOString(),
                networkData: this.networkData,
                reachabilityMatrix: this.reachabilityMatrix,
                pivotPaths: this.pivotPaths,
                config: this.core.config
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `network-topology-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);

            this.core.showNotification('Topologie exportée', 'success');
        } catch (error) {
            this.core.showNotification('Erreur lors de l\'export de la topologie', 'error');
        }
    }
}

// Rendre la classe disponible globalement
window.NetworkAnalyzer = NetworkAnalyzer; 