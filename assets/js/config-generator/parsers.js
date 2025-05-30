/**
 * Config Generator - Module Parsers
 * Analyse et parse les outputs des outils de pentest
 */

window.ConfigParsers = class ConfigParsers {
    constructor(app) {
        this.app = app;
        this.parsers = {};
        this.initParsers();
    }

    async init() {
        console.log('🔍 Initialisation des parsers...');
        this.setupAutoDetection();
    }

    initParsers() {
        // Parsers pour /etc/hosts generation
        this.parsers = {
            nxc: this.parseNxcOutput.bind(this),
            crackmapexec: this.parseCrackMapExecOutput.bind(this),
            nmap: this.parseNmapOutput.bind(this),
            masscan: this.parseMasscanOutput.bind(this),
            rustscan: this.parseRustScanOutput.bind(this),
            enum4linux: this.parseEnum4LinuxOutput.bind(this),
            nbtscan: this.parseNbtScanOutput.bind(this),
            responder: this.parseResponderOutput.bind(this),
            bloodhound: this.parseBloodHoundOutput.bind(this),
            ldapsearch: this.parseLdapSearchOutput.bind(this),
            smbclient: this.parseSmbClientOutput.bind(this),
            rpcclient: this.parseRpcClientOutput.bind(this)
        };
    }

    getAvailableParsers() {
        return Object.keys(this.parsers);
    }

    setupAutoDetection() {
        const scanOutput = document.getElementById('scanOutput');
        const autoDetectBtn = document.getElementById('autoDetectTool');
        const detectedInfo = document.getElementById('detectedTool');

        if (autoDetectBtn) {
            autoDetectBtn.addEventListener('click', () => {
                const output = scanOutput?.value || '';
                const detected = this.detectTool(output);
                
                if (detected) {
                    document.getElementById('scanTool').value = detected.tool;
                    detectedInfo.textContent = `✅ ${detected.tool.toUpperCase()} détecté (${detected.confidence}% confiance)`;
                    this.app.showNotification(`🔍 Outil détecté: ${detected.tool}`, 'success');
                } else {
                    detectedInfo.textContent = '❌ Outil non reconnu';
                    this.app.showNotification('❌ Impossible de détecter l\'outil', 'warning');
                }
            });
        }

        // Auto-détection en temps réel
        if (scanOutput) {
            scanOutput.addEventListener('input', () => {
                const detected = this.detectTool(scanOutput.value);
                if (detected && detected.confidence > 80) {
                    document.getElementById('scanTool').value = detected.tool;
                    detectedInfo.textContent = `✅ ${detected.tool.toUpperCase()} (auto-détecté)`;
                }
            });
        }
    }

    detectTool(output) {
        if (!output.trim()) return null;

        const patterns = {
            nxc: [
                /SMB\s+\d+\.\d+\.\d+\.\d+\s+445\s+\w+\s+\[\*\]/i,
                /NetExec/i,
                /nxc\s+(smb|rdp|ssh|winrm)/i
            ],
            crackmapexec: [
                /SMB\s+\d+\.\d+\.\d+\.\d+\s+445\s+\w+\s+\[\*\]/i,
                /crackmapexec/i,
                /Completed after/i
            ],
            nmap: [
                /Nmap scan report for/i,
                /PORT\s+STATE\s+SERVICE/i,
                /Host is up/i,
                /^Starting Nmap/i
            ],
            masscan: [
                /Discovered open port/i,
                /rate:\s*\d+/i,
                /Starting masscan/i
            ],
            rustscan: [
                /rustscan/i,
                /Open \d+\.\d+\.\d+\.\d+:\d+/i,
                /PORT\s+STATE/i
            ],
            enum4linux: [
                /enum4linux/i,
                /\[E\] Can't find workgroup\/domain/i,
                /Target Information/i
            ],
            nbtscan: [
                /Doing NBT name scan/i,
                /NetBIOS Name Table/i,
                /IP address\s+NetBIOS Name/i
            ],
            responder: [
                /NBT-NS & LLMNR Responder/i,
                /Responder\.py/i,
                /\[SMB\] NTLMv/i
            ]
        };

        let bestMatch = null;
        let maxScore = 0;

        for (const [tool, toolPatterns] of Object.entries(patterns)) {
            let score = 0;
            for (const pattern of toolPatterns) {
                if (pattern.test(output)) {
                    score += 25; // Chaque pattern qui match donne 25 points
                }
            }

            if (score > maxScore) {
                maxScore = score;
                bestMatch = { tool, confidence: Math.min(score, 100) };
            }
        }

        return bestMatch && bestMatch.confidence >= 25 ? bestMatch : null;
    }

    parseOutput(tool, output) {
        const parser = this.parsers[tool.toLowerCase()];
        if (!parser) {
            throw new Error(`Parser non disponible pour: ${tool}`);
        }

        return parser(output);
    }

    // ==================== PARSERS SPÉCIFIQUES ====================

    parseNxcOutput(output) {
        const entries = [];
        const lines = output.split('\n');
        
        for (const line of lines) {
            // Format: SMB 192.168.1.101 445 DC2012A [*] Windows Server 2012 R2 Standard 9600 x64 (name:DC2012A) (domain:OCEAN) (signing:True) (SMBv1:True)
            const smbMatch = line.match(/SMB\s+(\d+\.\d+\.\d+\.\d+)\s+445\s+(\S+)\s+\[\*\]([^(]+)\(name:([^)]+)\)\s*\(domain:([^)]+)\)/i);
            
            if (smbMatch) {
                const [, ip, hostname, osInfo, nameInfo, domain] = smbMatch;
                
                entries.push({
                    ip: ip.trim(),
                    hostname: hostname.trim(),
                    domain: domain.trim().toUpperCase(),
                    fqdn: `${hostname.trim()}.${domain.trim()}`,
                    osInfo: osInfo.trim(),
                    services: ['SMB'],
                    source: 'nxc'
                });
            }

            // Autres protocoles (RDP, WinRM, etc.)
            const protocolMatch = line.match(/(RDP|WINRM|SSH)\s+(\d+\.\d+\.\d+\.\d+)\s+(\d+)\s+(\S+)/i);
            if (protocolMatch) {
                const [, protocol, ip, port, hostname] = protocolMatch;
                
                entries.push({
                    ip: ip.trim(),
                    hostname: hostname.trim(),
                    services: [protocol.toUpperCase()],
                    port: parseInt(port),
                    source: 'nxc'
                });
            }
        }

        return {
            entries,
            stats: {
                total: entries.length,
                domains: [...new Set(entries.map(e => e.domain).filter(Boolean))],
                services: [...new Set(entries.flatMap(e => e.services || []))]
            }
        };
    }

    parseCrackMapExecOutput(output) {
        // Très similaire à nxc, mais avec de légères différences
        return this.parseNxcOutput(output);
    }

    parseNmapOutput(output) {
        const entries = [];
        const lines = output.split('\n');
        let currentIP = null;
        let currentHostname = null;
        let currentServices = [];

        for (const line of lines) {
            // Nmap scan report for hostname (IP)
            const hostMatch = line.match(/Nmap scan report for\s+(.+?)(?:\s+\((\d+\.\d+\.\d+\.\d+)\))?/i);
            if (hostMatch) {
                // Sauvegarder l'entrée précédente
                if (currentIP) {
                    entries.push({
                        ip: currentIP,
                        hostname: currentHostname,
                        services: [...currentServices],
                        source: 'nmap'
                    });
                }

                // Nouvelle entrée
                if (hostMatch[2]) {
                    // Format: hostname (IP)
                    currentHostname = hostMatch[1].trim();
                    currentIP = hostMatch[2];
                } else {
                    // Format: IP seulement
                    currentIP = hostMatch[1].trim();
                    currentHostname = null;
                }
                currentServices = [];
                continue;
            }

            // Ports ouverts
            const portMatch = line.match(/(\d+)\/(tcp|udp)\s+(open|filtered)\s+(.+)/i);
            if (portMatch && currentIP) {
                const [, port, protocol, state, service] = portMatch;
                if (state === 'open') {
                    currentServices.push(`${service.trim()}/${port}`);
                }
            }
        }

        // Ajouter la dernière entrée
        if (currentIP) {
            entries.push({
                ip: currentIP,
                hostname: currentHostname,
                services: [...currentServices],
                source: 'nmap'
            });
        }

        return {
            entries,
            stats: {
                total: entries.length,
                services: [...new Set(entries.flatMap(e => e.services || []))]
            }
        };
    }

    parseMasscanOutput(output) {
        const entries = new Map();
        const lines = output.split('\n');

        for (const line of lines) {
            // Format: Discovered open port 80/tcp on 192.168.1.100
            const portMatch = line.match(/Discovered open port\s+(\d+)\/(tcp|udp)\s+on\s+(\d+\.\d+\.\d+\.\d+)/i);
            
            if (portMatch) {
                const [, port, protocol, ip] = portMatch;
                
                if (!entries.has(ip)) {
                    entries.set(ip, {
                        ip,
                        services: [],
                        source: 'masscan'
                    });
                }
                
                entries.get(ip).services.push(`${port}/${protocol}`);
            }
        }

        return {
            entries: Array.from(entries.values()),
            stats: {
                total: entries.size,
                services: [...new Set(Array.from(entries.values()).flatMap(e => e.services))]
            }
        };
    }

    parseRustScanOutput(output) {
        const entries = new Map();
        const lines = output.split('\n');

        for (const line of lines) {
            // Format: Open 192.168.1.100:80
            const portMatch = line.match(/Open\s+(\d+\.\d+\.\d+\.\d+):(\d+)/i);
            
            if (portMatch) {
                const [, ip, port] = portMatch;
                
                if (!entries.has(ip)) {
                    entries.set(ip, {
                        ip,
                        services: [],
                        source: 'rustscan'
                    });
                }
                
                entries.get(ip).services.push(port);
            }
        }

        return {
            entries: Array.from(entries.values()),
            stats: {
                total: entries.size,
                services: [...new Set(Array.from(entries.values()).flatMap(e => e.services))]
            }
        };
    }

    parseEnum4LinuxOutput(output) {
        const entries = [];
        const lines = output.split('\n');
        let currentIP = null;
        let domain = null;
        let workgroup = null;

        for (const line of lines) {
            // Extraire l'IP target
            const targetMatch = line.match(/Target Information.*?(\d+\.\d+\.\d+\.\d+)/i);
            if (targetMatch) {
                currentIP = targetMatch[1];
            }

            // Extraire domain/workgroup info
            const domainMatch = line.match(/Domain Name:\s*(.+)/i);
            if (domainMatch) {
                domain = domainMatch[1].trim();
            }

            const workgroupMatch = line.match(/Workgroup:\s*(.+)/i);
            if (workgroupMatch) {
                workgroup = workgroupMatch[1].trim();
            }

            // Noms NetBIOS
            const netbiosMatch = line.match(/(\S+)\s+<\d+>\s+-\s+[BHM]\s+<ACTIVE>/i);
            if (netbiosMatch && currentIP) {
                const hostname = netbiosMatch[1];
                
                entries.push({
                    ip: currentIP,
                    hostname: hostname,
                    domain: domain || workgroup,
                    services: ['NetBIOS', 'SMB'],
                    source: 'enum4linux'
                });
            }
        }

        return {
            entries,
            stats: {
                total: entries.length,
                domains: domain ? [domain] : [],
                workgroups: workgroup ? [workgroup] : []
            }
        };
    }

    parseNbtScanOutput(output) {
        const entries = [];
        const lines = output.split('\n');

        for (const line of lines) {
            // Format typique: 192.168.1.100    WORKSTATION      <00>  UNIQUE
            const match = line.match(/(\d+\.\d+\.\d+\.\d+)\s+(\S+)\s+<(\w+)>\s+(\w+)/i);
            
            if (match) {
                const [, ip, hostname, code, type] = match;
                
                entries.push({
                    ip,
                    hostname,
                    netbiosCode: code,
                    netbiosType: type,
                    services: ['NetBIOS'],
                    source: 'nbtscan'
                });
            }
        }

        return {
            entries,
            stats: {
                total: entries.length
            }
        };
    }

    parseResponderOutput(output) {
        const entries = [];
        const lines = output.split('\n');

        for (const line of lines) {
            // Extraire les requêtes capturées
            const requestMatch = line.match(/\[(\w+)\]\s+.*?from\s+(\d+\.\d+\.\d+\.\d+)/i);
            
            if (requestMatch) {
                const [, protocol, ip] = requestMatch;
                
                entries.push({
                    ip,
                    protocol,
                    captured: true,
                    source: 'responder'
                });
            }

            // Hashes capturés
            const hashMatch = line.match(/(\w+)::\w+:.*?:(\d+\.\d+\.\d+\.\d+)/i);
            if (hashMatch) {
                const [, username, ip] = hashMatch;
                
                entries.push({
                    ip,
                    username,
                    hashCaptured: true,
                    source: 'responder'
                });
            }
        }

        return {
            entries,
            stats: {
                total: entries.length,
                protocols: [...new Set(entries.map(e => e.protocol).filter(Boolean))]
            }
        };
    }

    parseBloodHoundOutput(output) {
        // Parser pour les données BloodHound (JSON généralement)
        try {
            const data = JSON.parse(output);
            const entries = [];

            if (data.computers) {
                data.computers.forEach(computer => {
                    entries.push({
                        hostname: computer.name,
                        domain: computer.domain,
                        os: computer.operatingsystem,
                        enabled: computer.enabled,
                        source: 'bloodhound'
                    });
                });
            }

            return {
                entries,
                stats: {
                    total: entries.length,
                    domains: [...new Set(entries.map(e => e.domain).filter(Boolean))]
                }
            };
        } catch (error) {
            console.warn('Erreur parsing BloodHound JSON:', error);
            return { entries: [], stats: { total: 0 } };
        }
    }

    parseLdapSearchOutput(output) {
        const entries = [];
        const lines = output.split('\n');
        let currentEntry = {};

        for (const line of lines) {
            if (line.startsWith('#') || !line.trim()) continue;

            const attrMatch = line.match(/^(\w+):\s*(.+)$/);
            if (attrMatch) {
                const [, attr, value] = attrMatch;
                
                if (attr === 'dn' && Object.keys(currentEntry).length > 0) {
                    // Nouvelle entrée, sauvegarder la précédente
                    entries.push({...currentEntry});
                    currentEntry = {};
                }
                
                currentEntry[attr.toLowerCase()] = value.trim();
            }
        }

        // Ajouter la dernière entrée
        if (Object.keys(currentEntry).length > 0) {
            entries.push(currentEntry);
        }

        return {
            entries,
            stats: {
                total: entries.length
            }
        };
    }

    parseSmbClientOutput(output) {
        const entries = [];
        const lines = output.split('\n');

        for (const line of lines) {
            // Partages découverts
            const shareMatch = line.match(/(\S+)\s+(Disk|IPC|Printer)\s+(.+)/i);
            if (shareMatch) {
                const [, shareName, shareType, comment] = shareMatch;
                
                entries.push({
                    shareName,
                    shareType,
                    comment: comment.trim(),
                    source: 'smbclient'
                });
            }
        }

        return {
            entries,
            stats: {
                total: entries.length,
                shareTypes: [...new Set(entries.map(e => e.shareType))]
            }
        };
    }

    parseRpcClientOutput(output) {
        const entries = [];
        const lines = output.split('\n');

        for (const line of lines) {
            // Utilisateurs énumérés
            const userMatch = line.match(/user:\[([^\]]+)\]\s+rid:\[([^\]]+)\]/i);
            if (userMatch) {
                const [, username, rid] = userMatch;
                
                entries.push({
                    username,
                    rid,
                    type: 'user',
                    source: 'rpcclient'
                });
            }

            // Groupes énumérés
            const groupMatch = line.match(/group:\[([^\]]+)\]\s+rid:\[([^\]]+)\]/i);
            if (groupMatch) {
                const [, groupname, rid] = groupMatch;
                
                entries.push({
                    groupname,
                    rid,
                    type: 'group',
                    source: 'rpcclient'
                });
            }
        }

        return {
            entries,
            stats: {
                total: entries.length,
                users: entries.filter(e => e.type === 'user').length,
                groups: entries.filter(e => e.type === 'group').length
            }
        };
    }

    // ==================== MÉTHODES UTILITAIRES ====================

    mergeEntries(entriesList) {
        const merged = new Map();

        entriesList.forEach(({entries}) => {
            entries.forEach(entry => {
                const key = entry.ip || entry.hostname;
                if (!key) return;

                if (merged.has(key)) {
                    const existing = merged.get(key);
                    // Fusionner les données
                    existing.services = [...new Set([...(existing.services || []), ...(entry.services || [])])];
                    existing.hostnames = [...new Set([...(existing.hostnames || [existing.hostname]), entry.hostname].filter(Boolean))];
                    existing.sources = [...new Set([...(existing.sources || [existing.source]), entry.source])];
                    
                    // Prendre les informations les plus complètes
                    if (entry.domain && !existing.domain) existing.domain = entry.domain;
                    if (entry.osInfo && !existing.osInfo) existing.osInfo = entry.osInfo;
                } else {
                    merged.set(key, {
                        ...entry,
                        hostnames: entry.hostname ? [entry.hostname] : [],
                        sources: [entry.source]
                    });
                }
            });
        });

        return Array.from(merged.values());
    }

    validateIPRange(ip, range) {
        if (!range) return true;
        
        try {
            // Simple validation pour CIDR (ex: 192.168.1.0/24)
            const [network, prefix] = range.split('/');
            if (!prefix) return ip.startsWith(network);
            
            const ipNum = this.ipToNumber(ip);
            const networkNum = this.ipToNumber(network);
            const mask = ~(Math.pow(2, 32 - parseInt(prefix)) - 1);
            
            return (ipNum & mask) === (networkNum & mask);
        } catch (error) {
            console.warn('Erreur validation IP range:', error);
            return true;
        }
    }

    ipToNumber(ip) {
        return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
    }
}; 