/**
 * Module de parsing automatique des outputs de balayage réseau
 */

export class AutoParser {
    constructor(hostManager) {
        this.hostManager = hostManager;
        this.parsedHosts = [];
    }

    initialize() {
        console.log(">>> AutoParser.initialize: START");
        this.setupEventListeners();
        this.populateCategorySelect();
        console.log(">>> AutoParser.initialize: END");
    }

    setupEventListeners() {
        // Bouton de parsing
        document.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'parseOutputBtn') {
                e.preventDefault();
                this.parseOutput();
            }
            
            if (e.target && e.target.id === 'createHostsBtn') {
                e.preventDefault();
                this.createHosts();
            }
            
            if (e.target && e.target.id === 'clearParseBtn') {
                e.preventDefault();
                this.clearParse();
            }
        });

        // Mise à jour de l'aperçu quand le type change
        document.addEventListener('change', (e) => {
            if (e.target && e.target.id === 'autoParseType') {
                this.updatePlaceholder();
            }
        });
    }

    populateCategorySelect() {
        const select = document.getElementById('autoParseCategory');
        if (!select) return;

        select.innerHTML = '<option value="">Sélectionnez une catégorie...</option>';
        
        const categories = this.hostManager.getData().categories || {};
        Object.keys(categories).forEach(categoryName => {
            const option = document.createElement('option');
            option.value = categoryName;
            option.textContent = categoryName;
            select.appendChild(option);
        });
    }

    updatePlaceholder() {
        const textarea = document.getElementById('autoParseInput');
        const type = document.getElementById('autoParseType').value;
        
        const placeholders = {
            'fping': `Collez ici votre output fping...

Exemple:
fping -agq 192.168.110.0/24
192.168.110.1
192.168.110.51
192.168.110.52
192.168.110.53`,

            'netexec': `Collez ici votre output Netexec/SMB...

Exemple:
SMB         192.168.1.101    445    DC2012A          [*] Windows Server 2012 R2 Standard 9600 x64 (name:DC2012A) (domain:OCEAN) (signing:True) (SMBv1:True)
SMB         192.168.1.102    445    DC2012B          [*] Windows Server 2012 R2 Standard 9600 x64 (name:DC2012B) (domain:EARTH) (signing:True) (SMBv1:True)
SMB         192.168.1.110    445    DC2016A          [*] Windows Server 2016 Standard Evaluation 14393 x64 (name:DC2016A) (domain:OCEAN) (signing:True) (SMBv1:True)`,

            'nmap': `Collez ici votre output Nmap...

Exemple:
Nmap scan report for 192.168.1.1
Host is up (0.0005s latency).
Not shown: 998 closed ports
PORT      STATE SERVICE
22/tcp    open  ssh
80/tcp    open  http
443/tcp   open  https`,

            'custom': `Collez ici votre output personnalisé...

Format attendu: IP [nom] [système] [notes]
Exemple:
192.168.1.1 router Linux
192.168.1.10 webserver Windows IIS
192.168.1.100 workstation Windows 10`
        };

        textarea.placeholder = placeholders[type] || placeholders['custom'];
    }

    parseOutput() {
        const input = document.getElementById('autoParseInput').value.trim();
        const type = document.getElementById('autoParseType').value;
        const category = document.getElementById('autoParseCategory').value;
        const zone = document.getElementById('autoParseZone').value || 'LAN';
        const system = document.getElementById('autoParseSystem').value;

        if (!input) {
            alert('Veuillez coller un output à parser.');
            return;
        }

        if (!category) {
            alert('Veuillez sélectionner une catégorie cible.');
            return;
        }

        console.log('Parsing output:', { type, category, zone, system });

        try {
            switch (type) {
                case 'fping':
                    this.parsedHosts = this.parseFpingOutput(input, zone, system);
                    break;
                case 'netexec':
                    this.parsedHosts = this.parseNetexecOutput(input, zone, system);
                    break;
                case 'nmap':
                    this.parsedHosts = this.parseNmapOutput(input, zone, system);
                    break;
                case 'custom':
                    this.parsedHosts = this.parseCustomOutput(input, zone, system);
                    break;
                default:
                    throw new Error('Type de parsing non supporté');
            }

            this.showPreview();
        } catch (error) {
            console.error('Erreur lors du parsing:', error);
            alert(`Erreur lors du parsing: ${error.message}`);
        }
    }

    parseFpingOutput(input, zone, system) {
        const lines = input.split('\n').filter(line => line.trim());
        const hosts = [];

        lines.forEach(line => {
            const trimmedLine = line.trim();
            // Ignorer les lignes de commande
            if (trimmedLine.startsWith('fping') || trimmedLine.includes('/')) {
                return;
            }

            // Parser les IPs
            const ipMatch = trimmedLine.match(/^(\d+\.\d+\.\d+\.\d+)$/);
            if (ipMatch) {
                const ip = ipMatch[1];
                hosts.push({
                    id: this.generateHostId(ip),
                    ip: ip,
                    name: this.generateHostName(ip),
                    system: system,
                    zone: zone,
                    role: 'Unknown',
                    compromiseLevel: 'None',
                    notes: 'Parsé automatiquement depuis fping',
                    tags: ['auto-parsed', 'fping'],
                    timestamp: new Date().toISOString()
                });
            }
        });

        return hosts;
    }

    parseNetexecOutput(input, zone, system) {
        const lines = input.split('\n').filter(line => line.trim());
        const hosts = [];

        lines.forEach(line => {
            const trimmedLine = line.trim();
            
            // Parser le format Netexec/SMB
            const match = trimmedLine.match(/^SMB\s+(\d+\.\d+\.\d+\.\d+)\s+\d+\s+(\S+)\s+\[.*?\]\s+(.+)$/);
            if (match) {
                const [, ip, name, details] = match;
                
                // Détecter le système d'exploitation
                let detectedSystem = system;
                if (details.includes('Windows')) {
                    detectedSystem = 'Windows';
                } else if (details.includes('Linux')) {
                    detectedSystem = 'Linux';
                }

                // Détecter le rôle
                let role = 'Unknown';
                if (name.toUpperCase().includes('DC') || details.includes('Server')) {
                    role = 'Domain Controller';
                } else if (details.includes('Server')) {
                    role = 'Server';
                } else if (details.includes('WIN10') || details.includes('WIN11')) {
                    role = 'Workstation';
                }

                hosts.push({
                    id: this.generateHostId(ip),
                    ip: ip,
                    name: this.generateHostName(ip, name),
                    system: detectedSystem,
                    zone: zone,
                    role: role,
                    compromiseLevel: 'None',
                    notes: `Parsé automatiquement depuis Netexec: ${details}`,
                    tags: ['auto-parsed', 'netexec', 'smb'],
                    timestamp: new Date().toISOString()
                });
            }
        });

        return hosts;
    }

    parseNmapOutput(input, zone, system) {
        const lines = input.split('\n').filter(line => line.trim());
        const hosts = [];
        let currentHost = null;

        lines.forEach(line => {
            const trimmedLine = line.trim();
            
            // Détecter une nouvelle ligne d'hôte
            const hostMatch = trimmedLine.match(/^Nmap scan report for (.+)$/);
            if (hostMatch) {
                if (currentHost) {
                    hosts.push(currentHost);
                }
                
                const hostInfo = hostMatch[1];
                const ipMatch = hostInfo.match(/^(\d+\.\d+\.\d+\.\d+)$/);
                const nameMatch = hostInfo.match(/^(.+?) \((\d+\.\d+\.\d+\.\d+)\)$/);
                
                let ip, name;
                if (ipMatch) {
                    ip = ipMatch[1];
                    name = ip;
                } else if (nameMatch) {
                    name = nameMatch[1];
                    ip = nameMatch[2];
                } else {
                    ip = hostInfo;
                    name = hostInfo;
                }

                currentHost = {
                    id: this.generateHostId(ip),
                    ip: ip,
                    name: this.generateHostName(ip, name),
                    system: system,
                    zone: zone,
                    role: 'Unknown',
                    compromiseLevel: 'None',
                    notes: 'Parsé automatiquement depuis Nmap',
                    tags: ['auto-parsed', 'nmap'],
                    timestamp: new Date().toISOString()
                };
            }
        });

        if (currentHost) {
            hosts.push(currentHost);
        }

        return hosts;
    }

    parseCustomOutput(input, zone, system) {
        const lines = input.split('\n').filter(line => line.trim());
        const hosts = [];

        lines.forEach(line => {
            const trimmedLine = line.trim();
            const parts = trimmedLine.split(/\s+/);
            
            if (parts.length >= 1) {
                const ip = parts[0];
                const ipMatch = ip.match(/^(\d+\.\d+\.\d+\.\d+)$/);
                
                if (ipMatch) {
                    const name = parts[1] || ip;
                    const detectedSystem = parts[2] || system;
                    const notes = parts.slice(3).join(' ') || 'Parsé automatiquement';

                    hosts.push({
                        id: this.generateHostId(ip),
                        ip: ip,
                        name: this.generateHostName(ip, name),
                        system: detectedSystem,
                        zone: zone,
                        role: 'Unknown',
                        compromiseLevel: 'None',
                        notes: notes,
                        tags: ['auto-parsed', 'custom'],
                        timestamp: new Date().toISOString()
                    });
                }
            }
        });

        return hosts;
    }

    showPreview() {
        const container = document.getElementById('parsePreviewContainer');
        const list = document.getElementById('parsePreviewList');
        const createBtn = document.getElementById('createHostsBtn');

        if (!container || !list) return;

        if (this.parsedHosts.length === 0) {
            list.innerHTML = '<p class="text-muted">Aucun host détecté dans l\'output.</p>';
            createBtn.style.display = 'none';
        } else {
            list.innerHTML = '';
            
            this.parsedHosts.forEach((host, index) => {
                const hostDiv = document.createElement('div');
                hostDiv.className = 'border-bottom pb-2 mb-2';
                hostDiv.innerHTML = `
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <strong>${host.name}</strong>
                            <br>
                            <small class="text-muted">
                                Système: ${host.system} | Zone: ${host.zone} | Rôle: ${host.role}
                            </small>
                        </div>
                        <span class="badge badge-info">${index + 1}</span>
                    </div>
                `;
                list.appendChild(hostDiv);
            });

            createBtn.style.display = 'inline-block';
        }

        container.style.display = 'block';
    }

    createHosts() {
        if (this.parsedHosts.length === 0) {
            alert('Aucun host à créer.');
            return;
        }

        const category = document.getElementById('autoParseCategory').value;
        const hostData = this.hostManager.getData();

        if (!hostData.categories[category]) {
            hostData.categories[category] = { hosts: {} };
        }

        let createdCount = 0;
        this.parsedHosts.forEach(host => {
            if (!hostData.categories[category].hosts[host.id]) {
                hostData.categories[category].hosts[host.id] = host;
                createdCount++;
            }
        });

        // Sauvegarder les données
        this.hostManager.updateData(hostData);

        // Afficher une notification
        alert(`${createdCount} host(s) créé(s) dans la catégorie "${category}" !`);

        // Réinitialiser l'interface
        this.clearParse();

        // Rafraîchir l'affichage
        this.hostManager.modules.categoryUI.renderCategories();
        if (this.hostManager.getActiveCategory() === category) {
            this.hostManager.modules.categoryUI.renderActiveCategoryContent();
        }
    }

    clearParse() {
        document.getElementById('autoParseInput').value = '';
        document.getElementById('parsePreviewContainer').style.display = 'none';
        document.getElementById('createHostsBtn').style.display = 'none';
        this.parsedHosts = [];
    }

    generateHostId(ip) {
        // Utiliser simplement l'IP comme ID pour éviter les noms bizarres
        return ip;
    }

    generateHostName(ip, detectedName = null) {
        // Si on a un nom détecté (comme DC2012B), on l'utilise
        if (detectedName && detectedName !== ip) {
            return detectedName;
        }
        
        // Sinon, on utilise l'IP comme nom
        return ip;
    }
} 