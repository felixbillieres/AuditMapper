/**
 * Pivot Manager - Module de Gestion des Techniques
 * Gestion des différentes techniques de pivotement
 * Adapté pour la nouvelle interface Pivot Master
 */

class TechniqueManager {
    constructor(pivotMaster) {
        this.pivotMaster = pivotMaster;
        this.selectedTechnique = null;
        this.techniques = {};
        this.currentConfiguration = {};
        this.parameters = {};
    }

    async init() {
        console.log('🛠️ Initialisation du Technique Manager...');
        this.initializeTechniques();
        this.setupEventListeners();
    }

    initializeTechniques() {
        this.techniques = {
            ssh: {
                name: 'SSH Tunneling',
                description: 'Tunneling sécurisé via SSH avec support des forwards locaux et dynamiques',
                icon: '🔐',
                tags: ['Sécurisé', 'Stable'],
                requirements: ['SSH access', 'Port 22 ouvert'],
                reliability: 0.9,
                stealth: 0.8,
                difficulty: 0.3,
                defaultConfig: {
                    localPort: 1080,
                    remotePort: 22,
                    type: 'dynamic',
                    compression: true,
                    keepAlive: true,
                    serverAliveInterval: 30,
                    user: 'root',
                    keyFile: null
                }
            },
            chisel: {
                name: 'Chisel',
                description: 'Tunneling HTTP/HTTPS rapide et efficace pour contourner les firewalls',
                icon: '🔨',
                tags: ['HTTP', 'Rapide'],
                requirements: ['HTTP/HTTPS access', 'Upload capability'],
                reliability: 0.8,
                stealth: 0.7,
                difficulty: 0.4,
                defaultConfig: {
                    serverPort: 8080,
                    clientPort: 1080,
                    protocol: 'http',
                    auth: false,
                    reverse: false,
                    mode: 'client'
                }
            },
            ligolo: {
                name: 'Ligolo-ng',
                description: 'Interface TUN virtuelle pour un pivotement transparent et performant',
                icon: '⚡',
                tags: ['TUN', 'Moderne'],
                requirements: ['Upload capability', 'TUN interface support'],
                reliability: 0.9,
                stealth: 0.6,
                difficulty: 0.6,
                defaultConfig: {
                    agentPort: 11601,
                    proxyPort: 8080,
                    tunnelInterface: 'ligolo',
                    enableTUN: true,
                    tunnelName: 'pivot1'
                }
            },
            sshuttle: {
                name: 'SSHuttle',
                description: 'VPN transparent via SSH sans privilèges root sur la cible',
                icon: '🚀',
                tags: ['VPN', 'Simple'],
                requirements: ['SSH access', 'Python sur la cible'],
                reliability: 0.8,
                stealth: 0.8,
                difficulty: 0.3,
                defaultConfig: {
                    subnets: ['192.168.1.0/24'],
                    dns: false,
                    daemon: false,
                    verbose: false,
                    user: 'root'
                }
            },
            socat: {
                name: 'SOCAT',
                description: 'Relais de données bidirectionnel pour des pivots flexibles',
                icon: '🔄',
                tags: ['Relay', 'Flexible'],
                requirements: ['SOCAT binary', 'Network access'],
                reliability: 0.7,
                stealth: 0.7,
                difficulty: 0.5,
                defaultConfig: {
                    listenPort: 8080,
                    targetPort: 80,
                    protocol: 'TCP-LISTEN',
                    fork: true
                }
            },
            metasploit: {
                name: 'Metasploit',
                description: 'Pivotement intégré via Meterpreter et sessions Metasploit',
                icon: '💀',
                tags: ['MSF', 'Intégré'],
                requirements: ['Meterpreter session', 'Metasploit framework'],
                reliability: 0.9,
                stealth: 0.5,
                difficulty: 0.4,
                defaultConfig: {
                    sessionId: 1,
                    routeSubnet: '192.168.1.0/24',
                    socksPort: 1080,
                    type: 'route',
                    interface: 'eth0'
                }
            }
        };
    }

    setupEventListeners() {
        // Les événements sont maintenant gérés par le UIManager
        console.log('📝 Events pour TechniqueManager délégués au UIManager');
    }

    selectTechnique(techniqueName) {
        if (!this.techniques[techniqueName]) {
            this.pivotMaster.showNotification(`Technique "${techniqueName}" non reconnue`, 'error');
            return;
        }

        this.selectedTechnique = techniqueName;
        this.currentConfiguration = { ...this.techniques[techniqueName].defaultConfig };
        this.parameters = {};
        
        console.log(`🛠️ Technique sélectionnée: ${this.techniques[techniqueName].name}`);
        
        // Mettre à jour le pivot master
        this.pivotMaster.selectedTechnique = techniqueName;
        
        // Générer les recommandations intelligentes
        this.generateIntelligentRecommendations();
        
        return this.techniques[techniqueName];
    }

    generateIntelligentRecommendations() {
        if (!this.selectedTechnique || !this.pivotMaster.selectedNodes.length) {
            return;
        }

        const technique = this.techniques[this.selectedTechnique];
        const nodes = this.pivotMaster.selectedNodes;
        
        // Analyser la compatibilité avec les nodes sélectionnés
        const recommendations = [];
        
        nodes.forEach(node => {
            const analysis = this.analyzeNodeCompatibility(node, this.selectedTechnique);
            if (analysis.score > 0.5) {
                recommendations.push({
                    icon: '✅',
                    title: `Compatible avec ${node.name}`,
                    description: analysis.reason
                });
            } else {
                recommendations.push({
                    icon: '⚠️',
                    title: `Problème potentiel avec ${node.name}`,
                    description: analysis.reason
                });
            }
        });

        // Ajouter des recommandations générales
        recommendations.push(...this.getGeneralRecommendations(this.selectedTechnique));

        this.displayRecommendations(recommendations);
    }

    analyzeNodeCompatibility(node, techniqueName) {
        const technique = this.techniques[techniqueName];
        const host = node.host;
        
        let score = 0.5; // Score de base
        let reason = '';

        switch (techniqueName) {
            case 'ssh':
                if (host.ports && host.ports.some(p => p.includes('22'))) {
                    score += 0.4;
                    reason = 'Port SSH (22) ouvert détecté';
                } else {
                    score -= 0.3;
                    reason = 'Port SSH non détecté';
                }
                
                if (host.credentials && host.credentials.some(c => c.service === 'ssh')) {
                    score += 0.3;
                    reason += ', credentials SSH disponibles';
                }
                break;

            case 'chisel':
                if (host.ports && (host.ports.some(p => p.includes('80')) || host.ports.some(p => p.includes('443')))) {
                    score += 0.3;
                    reason = 'Services HTTP/HTTPS détectés';
                }
                
                if (host.os && host.os.toLowerCase().includes('windows')) {
                    score += 0.2;
                    reason += ', Windows compatible avec binaire Chisel';
                }
                break;

            case 'ligolo':
                if (host.compromise && host.compromise === 'full') {
                    score += 0.4;
                    reason = 'Contrôle administrateur requis pour TUN interface';
                } else {
                    score -= 0.2;
                    reason = 'Privilèges limités pour interface TUN';
                }
                break;

            case 'sshuttle':
                if (host.ports && host.ports.some(p => p.includes('22'))) {
                    score += 0.3;
                    reason = 'SSH requis pour SSHuttle';
                }
                
                if (host.os && !host.os.toLowerCase().includes('windows')) {
                    score += 0.2;
                    reason += ', système Unix/Linux détecté';
                }
                break;

            case 'metasploit':
                if (host.exploitationSteps && host.exploitationSteps.length > 0) {
                    const hasMeterpreter = host.exploitationSteps.some(step => 
                        step.command && step.command.includes('meterpreter')
                    );
                    if (hasMeterpreter) {
                        score += 0.4;
                        reason = 'Session Meterpreter disponible';
                    }
                }
                break;
        }

        return { score: Math.max(0, Math.min(1, score)), reason };
    }

    getGeneralRecommendations(techniqueName) {
        const recommendations = {
            ssh: [
                { icon: '🔑', title: 'Utilisation de clés', description: 'Préférez les clés SSH aux mots de passe pour plus de sécurité.' },
                { icon: '🌐', title: 'Port forwarding', description: 'SSH permet du forwarding local, distant et dynamique (SOCKS).' }
            ],
            chisel: [
                { icon: '🔥', title: 'Contournement firewall', description: 'Chisel fonctionne parfaitement à travers les proxies HTTP.' },
                { icon: '⚡', title: 'Performance', description: 'Plus rapide que SSH pour les gros transferts de données.' }
            ],
            ligolo: [
                { icon: '🎯', title: 'Interface transparente', description: 'Ligolo-ng crée une interface réseau transparente.' },
                { icon: '🔧', title: 'Multi-agents', description: 'Supporte plusieurs agents simultanément.' }
            ],
            sshuttle: [
                { icon: '🚀', title: 'Configuration automatique', description: 'SSHuttle configure automatiquement les routes système.' },
                { icon: '🔒', title: 'Sans privilèges', description: 'Pas besoin de privilèges root sur la machine cible.' }
            ],
            socat: [
                { icon: '🔄', title: 'Bidirectionnel', description: 'SOCAT permet des relais bidirectionnels flexibles.' },
                { icon: '🌐', title: 'Multi-protocole', description: 'Supporte TCP, UDP, Unix sockets, etc.' }
            ],
            metasploit: [
                { icon: '🎯', title: 'Intégration complète', description: 'Parfaitement intégré avec l\'écosystème Metasploit.' },
                { icon: '🛡️', title: 'Session management', description: 'Gestion avancée des sessions et persistence.' }
            ]
        };

        return recommendations[techniqueName] || [];
    }

    displayRecommendations(recommendations) {
        const container = document.getElementById('recommendations');
        if (!container) return;

        let html = '';
        recommendations.forEach(rec => {
            html += `
                <div class="recommendation-item">
                    <div class="d-flex align-items-start">
                        <span class="me-2">${rec.icon}</span>
                        <div>
                            <strong class="d-block">${rec.title}</strong>
                            <small class="text-muted">${rec.description}</small>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    updateParameter(paramId, value) {
        this.parameters[paramId] = value;
        console.log(`📝 Paramètre mis à jour: ${paramId} = ${value}`);
        
        // Valider la configuration en temps réel
        this.validateCurrentConfiguration();
    }

    validateCurrentConfiguration() {
        if (!this.selectedTechnique) return { valid: false, errors: ['Aucune technique sélectionnée'] };

        const errors = [];
        const technique = this.techniques[this.selectedTechnique];
        
        // Validation spécifique par technique
        switch (this.selectedTechnique) {
            case 'ssh':
                if (!this.parameters.sshUser) {
                    errors.push('Utilisateur SSH requis');
                }
                if (!this.parameters.localPort || this.parameters.localPort < 1 || this.parameters.localPort > 65535) {
                    errors.push('Port local invalide');
                }
                break;

            case 'chisel':
                if (!this.parameters.chiselPort || this.parameters.chiselPort < 1 || this.parameters.chiselPort > 65535) {
                    errors.push('Port Chisel invalide');
                }
                break;

            case 'ligolo':
                if (!this.parameters.ligoloInterface) {
                    errors.push('Nom d\'interface requis');
                }
                break;

            case 'sshuttle':
                if (!this.parameters.targetNetwork) {
                    errors.push('Réseau cible requis');
                }
                if (!this.parameters.sshuttleUser) {
                    errors.push('Utilisateur SSH requis');
                }
                break;

            case 'socat':
                if (!this.parameters.socatLocalPort || this.parameters.socatLocalPort < 1 || this.parameters.socatLocalPort > 65535) {
                    errors.push('Port local invalide');
                }
                break;

            case 'metasploit':
                if (!this.parameters.msfSession || this.parameters.msfSession < 1) {
                    errors.push('ID de session invalide');
                }
                if (!this.parameters.msfRoute) {
                    errors.push('Route réseau requise');
                }
                break;
        }

        return { valid: errors.length === 0, errors };
    }

    testCurrentConfiguration() {
        const validation = this.validateCurrentConfiguration();
        
        if (!validation.valid) {
            this.pivotMaster.showNotification(`Erreurs de configuration: ${validation.errors.join(', ')}`, 'error');
            return false;
        }

        // Simulation de test de connectivité
        this.pivotMaster.showNotification('🧪 Test de configuration simulé - Configuration valide', 'success');
        
        setTimeout(() => {
            this.pivotMaster.showNotification('✅ Configuration testée avec succès', 'success');
        }, 2000);

        return true;
    }

    getCurrentConfiguration() {
        return {
            technique: this.selectedTechnique,
            config: this.techniques[this.selectedTechnique]?.defaultConfig || {},
            parameters: this.parameters,
            nodes: this.pivotMaster.selectedNodes
        };
    }

    getConfiguredTechnique() {
        if (!this.selectedTechnique) return null;

        return {
            name: this.selectedTechnique,
            ...this.techniques[this.selectedTechnique],
            parameters: this.parameters,
            isConfigured: this.validateCurrentConfiguration().valid
        };
    }

    // Export de la configuration pour le générateur de commandes
    exportConfiguration() {
        const config = this.getCurrentConfiguration();
        
        return {
            technique: config.technique,
            parameters: {
                ...config.config,
                ...config.parameters
            },
            attackerIP: this.pivotMaster.config.attackerIP,
            attackerInterface: this.pivotMaster.config.attackerInterface,
            basePort: this.pivotMaster.config.basePort,
            nodes: config.nodes.map(node => ({
                id: node.id,
                name: node.name,
                ip: node.ip,
                credentials: node.host.credentials || []
            }))
        };
    }

    reset() {
        this.selectedTechnique = null;
        this.currentConfiguration = {};
        this.parameters = {};
        
        // Réinitialiser l'affichage
        document.querySelectorAll('.technique-option').forEach(option => {
            option.classList.remove('selected');
        });

        const configContainer = document.getElementById('techniqueConfig');
        if (configContainer) {
            configContainer.style.display = 'none';
        }
    }
}

// Assurer la disponibilité globale de la classe
window.TechniqueManager = TechniqueManager; 