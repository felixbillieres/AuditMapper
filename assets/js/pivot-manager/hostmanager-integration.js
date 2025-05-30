/**
 * Pivot Manager - Module d'Intégration Host Manager
 * Gestion de l'import et synchronisation avec Host Manager
 * Adapté pour la nouvelle interface Pivot Master
 */

class HostManagerIntegration {
    constructor(pivotMaster) {
        this.pivotMaster = pivotMaster;
        this.hostManagerData = null;
        this.lastSyncTime = null;
        this.syncEnabled = true;
        this.autoSyncInterval = null;
    }

    async init() {
        console.log('🔗 Initialisation de l\'intégration Host Manager...');
        await this.loadData();
        this.setupAutoSync();
    }

    async loadData() {
        console.log('📦 Création de données de test pour le pivot...');
        
        // Créer des données de test directement
        const testData = {
            "Lab HTB": {
                hosts: {
                    "host_001": {
                        ip: "10.10.10.15",
                        hostname: "dc01.htb.local",
                        services: ["53/tcp", "88/tcp", "135/tcp", "389/tcp", "445/tcp"],
                        notes: "Contrôleur de domaine Windows Server 2019",
                        tags: ["DC", "Windows", "Critical"],
                        compromise_level: "partial"
                    },
                    "host_002": {
                        ip: "10.10.10.25", 
                        hostname: "web01.htb.local",
                        services: ["80/tcp", "443/tcp", "22/tcp"],
                        notes: "Serveur web Ubuntu 20.04",
                        tags: ["Web", "Linux", "DMZ"],
                        compromise_level: "full"
                    },
                    "host_003": {
                        ip: "10.10.10.35",
                        hostname: "db01.htb.local", 
                        services: ["3306/tcp", "22/tcp"],
                        notes: "Base de données MySQL",
                        tags: ["Database", "Linux", "Internal"],
                        compromise_level: "initial"
                    },
                    "host_004": {
                        ip: "10.10.10.45",
                        hostname: "file01.htb.local",
                        services: ["445/tcp", "139/tcp", "22/tcp"],
                        notes: "Serveur de fichiers Windows",
                        tags: ["FileServer", "Windows", "Internal"],
                        compromise_level: "none"
                    }
                }
            },
            "Production": {
                hosts: {
                    "host_005": {
                        ip: "192.168.1.10",
                        hostname: "prod-web",
                        services: ["80/tcp", "443/tcp"],
                        notes: "Serveur web de production",
                        tags: ["Production", "Web", "Critical"],
                        compromise_level: "initial"
                    },
                    "host_006": {
                        ip: "192.168.1.20",
                        hostname: "prod-db",
                        services: ["5432/tcp", "22/tcp"],
                        notes: "Base PostgreSQL production",
                        tags: ["Production", "Database", "Critical"],
                        compromise_level: "none"
                    }
                }
            }
        };

        console.log('✅ Données de test créées:');
        
        // Afficher tous les nodes disponibles dans la console
        console.log('\n🎯 === NODES DISPONIBLES POUR PIVOT ===');
        let nodeIndex = 1;
        Object.entries(testData).forEach(([categoryName, categoryData]) => {
            console.log(`\n📁 Catégorie: ${categoryName}`);
            Object.entries(categoryData.hosts).forEach(([hostId, host]) => {
                const compromiseIcon = this.getCompromiseIcon(host.compromise_level);
                console.log(`  ${nodeIndex}. ${compromiseIcon} ${host.hostname || host.ip} (${host.ip}) - ${host.compromise_level}`);
                console.log(`     Services: ${host.services.join(', ')}`);
                console.log(`     Notes: ${host.notes}`);
                nodeIndex++;
            });
        });
        
        console.log('\n💡 Pour sélectionner un node, cliquez dessus dans l\'interface ou utilisez:');
        console.log('   window.pivotMaster.selectNodeForTesting("host_001")');
        console.log('\n📋 Nodes avec accès:');
        Object.entries(testData).forEach(([categoryName, categoryData]) => {
            Object.entries(categoryData.hosts).forEach(([hostId, host]) => {
                if (host.compromise_level !== 'none') {
                    console.log(`   ✅ ${hostId}: ${host.hostname} (${host.compromise_level})`);
                }
            });
        });

        this.hostManagerData = testData;
        return testData;
    }

    getCompromiseIcon(level) {
        switch(level) {
            case 'full': return '🔴';
            case 'partial': return '🟡'; 
            case 'initial': return '🟢';
            default: return '⚪';
        }
    }

    isValidHostManagerData(data) {
        // Vérifier si les données ressemblent à un format Host Manager valide
        if (!data || typeof data !== 'object') return false;
        
        // Format attendu: { categoryName: { hosts: { hostId: hostData, ... }, ... }, ... }
        for (const [categoryName, categoryData] of Object.entries(data)) {
            if (categoryData && typeof categoryData === 'object') {
                // Vérifier s'il y a une propriété 'hosts'
                if (categoryData.hosts && typeof categoryData.hosts === 'object') {
                    return true; // Format valide trouvé
                }
                // Sinon, vérifier si c'est un ancien format où les hosts sont directement sous la catégorie
                if (Object.values(categoryData).some(item => 
                    item && typeof item === 'object' && (item.ip || item.hostname))) {
                    return true; // Ancien format trouvé
                }
            }
        }
        
        return false;
    }

    updateImportStatus(status, categoryCount = 0) {
        const statusContainer = document.getElementById('importStatus');
        const summaryContainer = document.getElementById('importSummary');
        
        if (!statusContainer) return;

        switch (status) {
            case 'success':
                statusContainer.innerHTML = `
                    <div class="status-message">
                        <i>✅</i>
                        <p>Données Host Manager chargées avec succès</p>
                    </div>
                `;
                
                if (summaryContainer) {
                    const hostCount = this.getTotalHostsCount();
                    const compromisedCount = this.getCompromisedHostsCount();
                    
                    summaryContainer.style.display = 'flex';
                    summaryContainer.innerHTML = `
                        <div class="summary-item">
                            <span class="summary-number" id="totalHosts">${hostCount}</span>
                            <span class="summary-label">Hosts disponibles</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-number" id="compromisedHosts">${compromisedCount}</span>
                            <span class="summary-label">Hosts compromis</span>
                        </div>
                    `;
                }
                break;
                
            case 'empty':
                statusContainer.innerHTML = `
                    <div class="status-message">
                        <i>⚠️</i>
                        <p>Aucune donnée Host Manager trouvée</p>
                        <small>Assurez-vous d'avoir des données dans Host Manager</small>
                    </div>
                `;
                if (summaryContainer) summaryContainer.style.display = 'none';
                break;
                
            case 'error':
                statusContainer.innerHTML = `
                    <div class="status-message">
                        <i>❌</i>
                        <p>Erreur lors du chargement des données</p>
                        <small>Vérifiez la configuration de Host Manager</small>
                    </div>
                `;
                if (summaryContainer) summaryContainer.style.display = 'none';
                break;
                
            default:
                statusContainer.innerHTML = `
                    <div class="status-message">
                        <i>⏳</i>
                        <p>En attente de synchronisation...</p>
                    </div>
                `;
                if (summaryContainer) summaryContainer.style.display = 'none';
        }
    }

    getTotalHostsCount() {
        if (!this.hostManagerData) return 0;
        
        let count = 0;
        Object.values(this.hostManagerData).forEach(categoryData => {
            if (categoryData.hosts) {
                count += Object.keys(categoryData.hosts).length;
            }
        });
        return count;
    }

    getCompromisedHostsCount() {
        if (!this.hostManagerData) return 0;
        
        let count = 0;
        Object.values(this.hostManagerData).forEach(categoryData => {
            if (categoryData.hosts) {
                Object.values(categoryData.hosts).forEach(host => {
                    if (host.credentials && host.credentials.length > 0) {
                        count++;
                    }
                });
            }
        });
        return count;
    }

    async importData() {
        console.log('🔄 Import manuel des données Host Manager...');
        const data = await this.loadData();
        if (data) {
            this.pivotMaster.hostManagerData = data;
            this.populateAvailableHosts();
            this.pivotMaster.populateCategoryFilters();
            this.pivotMaster.updateHostManagerStatus('Connecté');
            this.pivotMaster.showNotification('Données Host Manager importées avec succès', 'success');
            
            // Générer automatiquement la topologie si l'analyseur réseau est disponible
            if (this.pivotMaster.modules.networkAnalyzer) {
                setTimeout(() => {
                    this.pivotMaster.modules.networkAnalyzer.generateTopology();
                }, 500);
            }
            
            console.log('✅ Import terminé avec succès');
            return true;
        } else {
            this.pivotMaster.updateHostManagerStatus('Erreur');
            this.pivotMaster.showNotification('Aucune donnée trouvée. Ouvrez Host Manager d\'abord.', 'warning');
            console.log('❌ Import échoué');
            return false;
        }
    }

    setupAutoSync() {
        if (this.autoSyncInterval) {
            clearInterval(this.autoSyncInterval);
        }

        // Vérifier les changements toutes les 5 secondes
        this.autoSyncInterval = setInterval(async () => {
            if (this.syncEnabled) {
                await this.checkForUpdates();
            }
        }, 5000);
    }

    async checkForUpdates() {
        try {
            const currentData = localStorage.getItem('hostManagerData') || localStorage.getItem('hostManager-data');
            if (currentData) {
                const newData = JSON.parse(currentData);
                if (this.hasDataChanged(newData)) {
                    console.log('🔄 Changements détectés dans Host Manager, mise à jour...');
                    await this.importData();
                }
            }
        } catch (error) {
            console.warn('Erreur lors de la vérification des mises à jour:', error);
        }
    }

    hasDataChanged(newData) {
        if (!this.hostManagerData) return true;
        
        try {
            return JSON.stringify(this.hostManagerData) !== JSON.stringify(newData);
        } catch (error) {
            return true;
        }
    }

    populateAvailableHosts() {
        const container = document.getElementById('hostsList');
        if (!container) {
            console.warn('⚠️ Container hostsList non trouvé');
            return;
        }

        if (!this.hostManagerData) {
            console.log('📦 Aucune donnée Host Manager disponible');
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i>⚠️</i><br>
                    <p>Aucune donnée Host Manager disponible</p>
                    <small>Synchronisez avec Host Manager ou créez des données de test</small>
                    <br><br>
                    <button class="btn btn-sm btn-primary mt-2" onclick="syncFromHostManager()">
                        🔄 Sync Temps Réel
                    </button>
                    <button class="btn btn-sm btn-secondary mt-2 ml-2" onclick="openHostManager()">
                        🖥️ Ouvrir Host Manager
                    </button>
                    <button class="btn btn-sm btn-info mt-2 ml-2" onclick="pivotMaster.modules.hostManager.createTestData()">
                        🧪 Créer Données de Test
                    </button>
                </div>
            `;
            return;
        }

        console.log('🔄 Génération de la liste des hosts...');
        let html = '';
        let hostCount = 0;
        
        Object.entries(this.hostManagerData).forEach(([categoryName, categoryData]) => {
            if (categoryData.hosts && Object.keys(categoryData.hosts).length > 0) {
                console.log(`📂 Catégorie ${categoryName}:`, Object.keys(categoryData.hosts).length, 'hosts');
                
                Object.entries(categoryData.hosts).forEach(([hostId, host]) => {
                    const isSelected = this.pivotMaster.selectedNodes.some(n => n.id === hostId);
                    const compromiseLevel = this.getCompromiseLevel(host);
                    
                    html += `
                        <div class="host-item ${isSelected ? 'selected' : ''}" 
                             data-host-id="${hostId}" 
                             data-category="${categoryName}"
                             onclick="pivotMaster.toggleHostSelection('${hostId}')">
                            <div class="host-header">
                                <div class="host-name">${host.hostname || host.ip}</div>
                                <div class="host-ip">${host.ip}</div>
                            </div>
                            <div class="host-details">
                                <span class="compromise-level compromise-${compromiseLevel}">
                                    ${this.getCompromiseBadge(compromiseLevel)}
                                </span>
                                <span class="category-name">${categoryName}</span>
                                ${this.getServicesBadges(host)}
                            </div>
                        </div>
                    `;
                    hostCount++;
                });
            } else {
                console.log(`📂 Catégorie ${categoryName}: aucun host`);
            }
        });
        
        if (hostCount === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i>📦</i><br>
                    <p>Aucun host disponible</p>
                    <small>Importez vos données Host Manager</small>
                    <br><br>
                    <button class="btn btn-sm btn-primary mt-2" onclick="syncFromHostManager()">
                        🔄 Sync LocalStorage
                    </button>
                    <button class="btn btn-sm btn-secondary mt-2 ml-2" onclick="importJSONFile()">
                        📁 Import JSON
                    </button>
                    <button class="btn btn-sm btn-info mt-2 ml-2" onclick="importFromClipboard()">
                        📋 Coller JSON
                    </button>
                    <br>
                    <button class="btn btn-sm btn-success mt-2" onclick="openHostManager()">
                        🖥️ Ouvrir Host Manager
                    </button>
                    <button class="btn btn-sm btn-warning mt-2 ml-2" onclick="pivotMaster.modules.hostManager.createTestData()">
                        🧪 Données de Test
                    </button>
                </div>
            `;
            return;
        } else {
            container.innerHTML = html;
        }

        // Mettre à jour le compteur
        const countElement = document.getElementById('filteredHostCount');
        if (countElement) {
            countElement.textContent = `${hostCount} hosts`;
        }
        
        console.log(`✅ Affichage de ${hostCount} hosts terminé`);
    }

    getCompromiseLevel(host) {
        // Analyser le niveau de compromission basé sur les credentials et exploitations
        if (host.credentials && host.credentials.length > 0) {
            const adminCreds = host.credentials.some(cred => 
                cred.username && (
                    cred.username.toLowerCase().includes('admin') ||
                    cred.username.toLowerCase().includes('root') ||
                    cred.username === 'administrator' ||
                    cred.username.toLowerCase().includes('system')
                )
            );
            
            // Vérifier aussi les étapes d'exploitation
            if (host.exploitationSteps && host.exploitationSteps.length > 0) {
                const hasPrivEsc = host.exploitationSteps.some(step => 
                    step.description && (
                        step.description.toLowerCase().includes('privilege') ||
                        step.description.toLowerCase().includes('admin') ||
                        step.description.toLowerCase().includes('root')
                    )
                );
                if (hasPrivEsc || adminCreds) return 'full';
            }
            
            return adminCreds ? 'full' : 'partial';
        }
        
        // Si pas de credentials mais des étapes d'exploitation
        if (host.exploitationSteps && host.exploitationSteps.length > 0) {
            return 'initial';
        }
        
        return 'none';
    }

    getCompromiseBadge(level) {
        const badges = {
            'full': '🔴 Contrôle Total',
            'partial': '🟡 Accès Partiel', 
            'initial': '🟢 Accès Initial',
            'none': '⚪ Non Compromis'
        };
        return badges[level] || '❓ Inconnu';
    }

    getServicesBadges(host) {
        if (!host.ports || host.ports.length === 0) return '';
        
        const importantPorts = host.ports.filter(port => {
            const portNum = parseInt(port.split('/')[0]);
            return [22, 23, 53, 80, 88, 135, 139, 389, 443, 445, 993, 995, 3389, 5985, 5986].includes(portNum);
        });

        if (importantPorts.length === 0) return '';

        const badges = importantPorts.slice(0, 3).map(port => {
            const portNum = parseInt(port.split('/')[0]);
            const serviceIcon = this.getServiceIcon(portNum);
            return `<span class="service-badge" title="${port}">${serviceIcon}</span>`;
        }).join('');

        const extraCount = importantPorts.length > 3 ? `<span class="service-badge">+${importantPorts.length - 3}</span>` : '';
        
        return `<div class="services-badges">${badges}${extraCount}</div>`;
    }

    getServiceIcon(port) {
        const iconMap = {
            22: '🔐', 23: '📟', 53: '🌐', 80: '🌍', 88: '🎫',
            135: '⚙️', 139: '📂', 389: '📋', 443: '🔒', 445: '📁',
            993: '📧', 995: '📮', 3389: '🖥️', 5985: '⚡', 5986: '🔹'
        };
        return iconMap[port] || '🔌';
    }

    findHostById(hostId) {
        if (!this.hostManagerData) return null;

        for (const categoryData of Object.values(this.hostManagerData)) {
            if (categoryData.hosts && categoryData.hosts[hostId]) {
                return categoryData.hosts[hostId];
            }
        }
        return null;
    }

    getHostsByCategory(categoryName) {
        if (!this.hostManagerData || !this.hostManagerData[categoryName]) {
            return {};
        }
        return this.hostManagerData[categoryName].hosts || {};
    }

    getAllHosts() {
        if (!this.hostManagerData) return {};
        
        let allHosts = {};
        Object.values(this.hostManagerData).forEach(categoryData => {
            if (categoryData.hosts) {
                allHosts = { ...allHosts, ...categoryData.hosts };
            }
        });
        return allHosts;
    }

    getNetworkStatistics() {
        if (!this.hostManagerData) {
            return {
                totalHosts: 0,
                compromisedHosts: 0,
                categories: 0,
                networks: []
            };
        }

        const stats = {
            totalHosts: 0,
            compromisedHosts: 0,
            categories: Object.keys(this.hostManagerData).length,
            networks: new Set()
        };

        Object.values(this.hostManagerData).forEach(categoryData => {
            if (categoryData.hosts) {
                stats.totalHosts += Object.keys(categoryData.hosts).length;
                
                Object.values(categoryData.hosts).forEach(host => {
                    // Compter les hosts compromis
                    if (host.credentials && host.credentials.length > 0) {
                        stats.compromisedHosts++;
                    }
                    
                    // Extraire les réseaux
                    if (host.ip) {
                        const network = this.getNetworkFromIP(host.ip);
                        stats.networks.add(network);
                    }
                });
            }
        });

        stats.networks = Array.from(stats.networks);
        return stats;
    }

    getNetworkFromIP(ip) {
        const parts = ip.split('.');
        if (parts.length === 4) {
            return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
        }
        return ip;
    }

    searchHosts(query) {
        if (!this.hostManagerData || !query) {
            return this.getAllHosts();
        }

        const searchTerm = query.toLowerCase();
        const results = {};

        Object.values(this.hostManagerData).forEach(categoryData => {
            if (categoryData.hosts) {
                Object.entries(categoryData.hosts).forEach(([hostId, host]) => {
                    const searchFields = [
                        host.ip,
                        host.hostname,
                        host.description,
                        ...(host.ports || []),
                        ...(host.credentials || []).map(c => c.username),
                        ...(host.tags || [])
                    ].filter(Boolean);

                    const matchScore = this.calculateMatchScore(searchTerm, searchFields);
                    if (matchScore > 0) {
                        results[hostId] = { ...host, matchScore };
                    }
                });
            }
        });

        return results;
    }

    calculateMatchScore(searchTerm, fields) {
        let score = 0;
        fields.forEach(field => {
            if (field && field.toString().toLowerCase().includes(searchTerm)) {
                score += field.toString().toLowerCase() === searchTerm ? 100 : 10;
            }
        });
        return score;
    }

    enableAutoSync() {
        this.syncEnabled = true;
        this.setupAutoSync();
        this.pivotMaster.showNotification('Synchronisation automatique activée', 'info');
    }

    disableAutoSync() {
        this.syncEnabled = false;
        if (this.autoSyncInterval) {
            clearInterval(this.autoSyncInterval);
            this.autoSyncInterval = null;
        }
        this.pivotMaster.showNotification('Synchronisation automatique désactivée', 'info');
    }

    validateHostManagerData() {
        if (!this.hostManagerData) {
            return { valid: false, error: 'Aucune donnée Host Manager disponible' };
        }

        try {
            let totalHosts = 0;
            const errors = [];

            Object.entries(this.hostManagerData).forEach(([categoryName, categoryData]) => {
                if (!categoryData.hosts) {
                    errors.push(`Catégorie ${categoryName}: pas de hosts`);
                    return;
                }

                Object.entries(categoryData.hosts).forEach(([hostId, host]) => {
                    totalHosts++;
                    if (!host.ip) {
                        errors.push(`Host ${hostId}: IP manquante`);
                    }
                });
            });

            return {
                valid: errors.length === 0,
                totalHosts,
                errors
            };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    destroy() {
        if (this.autoSyncInterval) {
            clearInterval(this.autoSyncInterval);
        }
    }

    createTestData() {
        console.log('🧪 Création de données de test...');
        
        const testData = {
            "Lab HTB": {
                hosts: {
                    "host_001": {
                        ip: "10.10.10.15",
                        hostname: "dc01.htb.local",
                        services: ["53/tcp", "88/tcp", "135/tcp", "139/tcp", "389/tcp", "445/tcp", "464/tcp", "593/tcp", "636/tcp", "3268/tcp", "3269/tcp"],
                        notes: "Contrôleur de domaine Windows Server 2019",
                        tags: ["DC", "Windows", "Critical"],
                        system: "Active Directory",
                        role: "Domain Controller",
                        zone: "Internal",
                        compromiseLevel: "Admin/Root",
                        credentials: [
                            {
                                type: "username/password",
                                username: "administrator",
                                password: "P@ssw0rd123!",
                                domain: "HTB.LOCAL",
                                notes: "Compte admin du domaine"
                            }
                        ]
                    },
                    "host_002": {
                        ip: "10.10.10.25",
                        hostname: "web01.htb.local",
                        services: ["22/tcp", "80/tcp", "443/tcp"],
                        notes: "Serveur web Apache Ubuntu 20.04",
                        tags: ["Web", "Linux", "DMZ"],
                        system: "Linux",
                        role: "Web Server",
                        zone: "DMZ",
                        compromiseLevel: "User",
                        credentials: [
                            {
                                type: "username/password",
                                username: "www-data",
                                password: "",
                                domain: "",
                                notes: "Accès initial via RCE"
                            }
                        ]
                    }
                }
            },
            "Corporate Network": {
                hosts: {
                    "host_003": {
                        ip: "192.168.1.10",
                        hostname: "file01.corp.local",
                        services: ["135/tcp", "139/tcp", "445/tcp"],
                        notes: "Serveur de fichiers Windows Server 2016",
                        tags: ["FileServer", "Windows", "Internal"],
                        system: "Windows",
                        role: "File Server",
                        zone: "Internal",
                        compromiseLevel: "Initial Access",
                        credentials: []
                    },
                    "host_004": {
                        ip: "192.168.1.20",
                        hostname: "db01.corp.local",
                        services: ["1433/tcp", "3389/tcp"],
                        notes: "Serveur base de données SQL Server",
                        tags: ["Database", "Windows", "Critical"],
                        system: "Windows",
                        role: "Database Server",
                        zone: "Internal",
                        compromiseLevel: "None",
                        credentials: []
                    }
                }
            }
        };
        
        // Sauvegarder dans localStorage avec la clé standard
        localStorage.setItem('hostManagerData', JSON.stringify(testData));
        
        // Mettre à jour les données locales
        this.hostManagerData = testData;
        this.lastSyncTime = new Date();
        
        // Rafraîchir l'interface
        this.updateImportStatus('success', Object.keys(testData).length);
        this.populateAvailableHosts();
        
        // Notifier l'utilisateur
        if (this.pivotMaster && this.pivotMaster.showNotification) {
            this.pivotMaster.showNotification('Données de test créées avec succès !', 'success');
        }
        
        console.log('✅ Données de test créées:', Object.keys(testData).length, 'catégories');
    }

    // Nouvelle méthode pour synchronisation en temps réel
    async syncWithHostManager() {
        console.log('🔄 Synchronisation avec Host Manager...');
        const data = await this.loadData();
        
        if (data) {
            this.pivotMaster.hostManagerData = data;
            this.populateAvailableHosts();
            this.pivotMaster.populateCategoryFilters();
            this.pivotMaster.updateHostManagerStatus('Connecté');
            this.pivotMaster.showNotification('Données synchronisées !', 'success');
            return true;
        } else {
            this.pivotMaster.updateHostManagerStatus('Aucune donnée');
            this.pivotMaster.showNotification('Aucune donnée trouvée. Utilisez l\'import JSON.', 'warning');
            return false;
        }
    }

    // Import JSON direct
    importFromJSON() {
        // Créer un input file temporaire
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (event) => {
            const file = event.target.files[0];
            if (file) {
                this.readJSONFile(file);
            }
        };
        input.click();
    }

    // Lire le fichier JSON
    async readJSONFile(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            console.log('📁 Fichier JSON lu:', file.name);
            console.log('📊 Données:', data);
            
            if (this.isValidHostManagerData(data)) {
                console.log('✅ Fichier JSON valide !');
                this.hostManagerData = data.categories || data;
                this.pivotMaster.hostManagerData = this.hostManagerData;
                
                this.populateAvailableHosts();
                this.pivotMaster.populateCategoryFilters();
                this.pivotMaster.updateHostManagerStatus('Importé JSON');
                this.pivotMaster.showNotification(`Données importées depuis ${file.name}`, 'success');
                
                // Sauvegarder dans localStorage pour la prochaine fois
                localStorage.setItem('hostManagerData', JSON.stringify(data));
                
            } else {
                console.log('❌ Format JSON non valide');
                this.pivotMaster.showNotification('Format JSON non reconnu', 'error');
            }
            
        } catch (error) {
            console.error('❌ Erreur lecture JSON:', error);
            this.pivotMaster.showNotification('Erreur lors de la lecture du fichier', 'error');
        }
    }

    // Import depuis le presse-papier
    async importFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            const data = JSON.parse(text);
            
            console.log('📋 Données du presse-papier:', data);
            
            if (this.isValidHostManagerData(data)) {
                console.log('✅ Données du presse-papier valides !');
                this.hostManagerData = data.categories || data;
                this.pivotMaster.hostManagerData = this.hostManagerData;
                
                this.populateAvailableHosts();
                this.pivotMaster.populateCategoryFilters();
                this.pivotMaster.updateHostManagerStatus('Importé Clipboard');
                this.pivotMaster.showNotification('Données importées depuis le presse-papier', 'success');
                
                // Sauvegarder dans localStorage
                localStorage.setItem('hostManagerData', JSON.stringify(data));
                
            } else {
                console.log('❌ Format JSON non valide dans le presse-papier');
                this.pivotMaster.showNotification('Format JSON non reconnu dans le presse-papier', 'error');
            }
            
        } catch (error) {
            console.error('❌ Erreur import presse-papier:', error);
            this.pivotMaster.showNotification('Erreur: ' + error.message, 'error');
        }
    }

    // Ouvrir Host Manager dans un nouvel onglet (sans popup)
    openHostManager() {
        // Simple lien vers Host Manager
        const link = document.createElement('a');
        link.href = '/pages/hostmanager.html';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.click();
        
        this.pivotMaster.showNotification('Host Manager ouvert. Revenez ici après avoir ajouté vos hosts.', 'info');
    }
}

// Assurer la disponibilité globale de la classe
window.HostManagerIntegration = HostManagerIntegration; 