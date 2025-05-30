/**
 * Config Generator - Module /etc/hosts
 * Générateur avancé de fichiers /etc/hosts
 */

window.HostsGenerator = class HostsGenerator {
    constructor(app) {
        this.app = app;
        this.currentInputMethod = 'scan';
        this.previewTimeout = null;
        this.manualEntries = [];
    }

    async init() {
        console.log('🌐 Initialisation du générateur /etc/hosts...');
        this.setupEventListeners();
        this.loadPresets();
        this.updatePreview();
    }

    setupEventListeners() {
        // Boutons de génération
        document.getElementById('generateHosts')?.addEventListener('click', () => this.generateHosts());
        document.getElementById('copyHosts')?.addEventListener('click', () => this.copyToClipboard());
        document.getElementById('downloadHosts')?.addEventListener('click', () => this.downloadFile());
        document.getElementById('exportToTools')?.addEventListener('click', () => this.exportToTools());

        // Input en temps réel
        document.getElementById('scanOutput')?.addEventListener('input', () => this.debouncePreview());
        
        // Options de génération
        document.querySelectorAll('#hosts-tab input[type="checkbox"], #hosts-tab input[type="text"], #hosts-tab select').forEach(element => {
            element.addEventListener('change', () => this.updatePreview());
        });

        // Ajout manuel d'entrées
        document.getElementById('addManualEntry')?.addEventListener('click', () => this.addManualEntry());

        // File drop zone
        this.setupFileDropZone();

        // Presets
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.loadPreset(e.target.dataset.preset));
        });
    }

    onTabActivated() {
        // Appelé quand l'onglet /etc/hosts est activé
        this.updatePreview();
        this.updateStats();
    }

    saveState() {
        const data = {
            inputMethod: this.currentInputMethod,
            scanOutput: document.getElementById('scanOutput')?.value || '',
            manualEntries: this.manualEntries,
            options: this.getGenerationOptions()
        };
        
        this.app.setData('hosts', data);
    }

    onDataImported() {
        const data = this.app.getData('hosts');
        if (data.scanOutput) {
            document.getElementById('scanOutput').value = data.scanOutput;
        }
        if (data.manualEntries) {
            this.manualEntries = data.manualEntries;
            this.displayManualEntries();
        }
        this.updatePreview();
    }

    debouncePreview() {
        clearTimeout(this.previewTimeout);
        this.previewTimeout = setTimeout(() => this.updatePreview(), 300);
    }

    async generateHosts() {
        try {
            const options = this.getGenerationOptions();
            const scanTool = document.getElementById('scanTool')?.value;
            const scanOutput = document.getElementById('scanOutput')?.value || '';
            
            console.log('🔄 Génération du fichier /etc/hosts...');
            
            let entries = [];
            
            // Parser les données scannées
            if (scanOutput.trim() && scanTool) {
                try {
                    const parsedData = this.app.getModule('parsers').parseOutput(scanTool, scanOutput);
                    entries = parsedData.entries || [];
                    console.log(`✅ ${entries.length} entrées parsées depuis ${scanTool}`);
                } catch (error) {
                    console.warn('⚠️ Erreur parsing:', error);
                    this.app.showNotification('⚠️ Erreur lors du parsing des données', 'warning');
                }
            }

            // Ajouter les entrées manuelles
            entries = entries.concat(this.manualEntries);

            // Appliquer les filtres
            entries = this.applyFilters(entries, options);

            // Générer le contenu du fichier
            const hostsContent = this.generateHostsContent(entries, options);

            // Afficher dans l'aperçu
            document.getElementById('hostsPreview').textContent = hostsContent;

            // Sauvegarder dans les données de l'app
            this.app.setData('hosts', {
                ...this.app.getData('hosts'),
                entries,
                lastGenerated: hostsContent,
                generatedAt: new Date().toISOString()
            });

            this.updateStats(entries);
            this.app.showNotification('✅ Fichier /etc/hosts généré !', 'success');
            
        } catch (error) {
            console.error('❌ Erreur génération /etc/hosts:', error);
            this.app.showNotification('❌ Erreur lors de la génération', 'error');
        }
    }

    generateHostsContent(entries, options) {
        let content = '';
        
        // En-tête
        if (options.includeHeader) {
            content += '# /etc/hosts - Généré automatiquement\n';
            content += `# Date: ${new Date().toLocaleString()}\n`;
            content += `# Générateur: Config Generator v1.0\n`;
            content += `# Total entrées: ${entries.length}\n\n`;
            
            if (options.includeComments) {
                content += '# Format: IP_ADDRESS FQDN HOSTNAME [ALIASES]\n';
                content += '# Les lignes commençant par # sont des commentaires\n\n';
            }
        }

        // Entrées par défaut du système (optionnel)
        if (options.includeSystemEntries) {
            content += '# Entrées système standard\n';
            content += '127.0.0.1\tlocalhost\n';
            content += '127.0.1.1\t' + (options.localHostname || 'kali') + '\n';
            content += '::1\t\tlocalhost ip6-localhost ip6-loopback\n';
            content += 'ff02::1\t\tip6-allnodes\n';
            content += 'ff02::2\t\tip6-allrouters\n\n';
        }

        // Grouper par domaine si demandé
        if (options.groupByDomain) {
            const domains = this.groupEntriesByDomain(entries);
            
            for (const [domain, domainEntries] of Object.entries(domains)) {
                if (domain !== 'undefined' && domain !== 'null') {
                    content += `# ===== Domaine: ${domain} =====\n`;
                }
                content += this.formatEntries(domainEntries, options);
                content += '\n';
            }
        } else {
            // Trier si demandé
            if (options.sortEntries) {
                entries.sort((a, b) => this.compareIPs(a.ip, b.ip));
            }
            
            content += this.formatEntries(entries, options);
        }

        // Ajouter des entrées de domaine seules
        if (options.includeDomainOnly) {
            const domains = [...new Set(entries.map(e => e.domain).filter(Boolean))];
            if (domains.length > 0) {
                content += '\n# Entrées domaines seuls\n';
                domains.forEach(domain => {
                    const firstEntry = entries.find(e => e.domain === domain);
                    if (firstEntry && firstEntry.ip) {
                        content += `${firstEntry.ip}\t${domain.toLowerCase()}\n`;
                    }
                });
            }
        }

        return content;
    }

    formatEntries(entries, options) {
        let content = '';
        
        for (const entry of entries) {
            if (!entry.ip) continue;
            
            // Commentaire détaillé si demandé
            if (options.includeComments && entry.osInfo) {
                content += `# ${entry.hostname || entry.ip} - ${entry.osInfo}\n`;
                if (entry.services && entry.services.length > 0) {
                    content += `# Services: ${entry.services.join(', ')}\n`;
                }
            }
            
            // Ligne principale
            let line = entry.ip;
            
            // FQDN en premier si disponible
            if (options.includeFQDN && entry.fqdn) {
                line += `\t${entry.fqdn}`;
            } else if (options.includeFQDN && entry.hostname && entry.domain) {
                line += `\t${entry.hostname}.${entry.domain.toLowerCase()}`;
            }
            
            // Hostname
            if (entry.hostname) {
                line += `\t${entry.hostname}`;
            }
            
            // Noms courts supplémentaires
            if (options.includeShortNames && entry.hostnames) {
                const shortNames = entry.hostnames
                    .filter(name => name !== entry.hostname)
                    .slice(0, 3); // Limiter à 3 alias max
                if (shortNames.length > 0) {
                    line += ` ${shortNames.join(' ')}`;
                }
            }
            
            content += line + '\n';
        }
        
        return content;
    }

    groupEntriesByDomain(entries) {
        const grouped = {};
        
        for (const entry of entries) {
            const domain = entry.domain || 'Sans domaine';
            if (!grouped[domain]) {
                grouped[domain] = [];
            }
            grouped[domain].push(entry);
        }
        
        return grouped;
    }

    applyFilters(entries, options) {
        let filtered = [...entries];
        
        // Filtre par plage IP
        if (options.ipFilter) {
            filtered = filtered.filter(entry => 
                this.app.getModule('parsers').validateIPRange(entry.ip, options.ipFilter)
            );
        }
        
        // Exclure des IPs spécifiques
        if (options.excludeIPs) {
            const excludeList = options.excludeIPs.split(',').map(ip => ip.trim());
            filtered = filtered.filter(entry => !excludeList.includes(entry.ip));
        }
        
        // Filtrer par services requis
        if (options.requiredServices) {
            const requiredServices = options.requiredServices.split(',').map(s => s.trim().toLowerCase());
            filtered = filtered.filter(entry => {
                if (!entry.services) return false;
                return requiredServices.some(required => 
                    entry.services.some(service => 
                        service.toLowerCase().includes(required)
                    )
                );
            });
        }
        
        // Supprimer les doublons
        if (options.removeDuplicates) {
            const seen = new Set();
            filtered = filtered.filter(entry => {
                const key = `${entry.ip}-${entry.hostname}`;
                if (seen.has(key)) {
                    return false;
                }
                seen.add(key);
                return true;
            });
        }
        
        // Auto-détecter les contrôleurs de domaine
        if (options.autoDetectDC) {
            filtered = this.markDomainControllers(filtered);
        }
        
        return filtered;
    }

    markDomainControllers(entries) {
        return entries.map(entry => {
            // Heuristiques pour détecter les DC
            const isDC = 
                (entry.hostname && /^dc\d*$/i.test(entry.hostname)) ||
                (entry.services && entry.services.some(s => 
                    /kerberos|ldap|dns|389|88|53/i.test(s)
                )) ||
                (entry.osInfo && /domain controller|active directory/i.test(entry.osInfo));
            
            if (isDC) {
                entry.isDomainController = true;
                if (!entry.services) entry.services = [];
                if (!entry.services.includes('DC')) entry.services.push('DC');
            }
            
            return entry;
        });
    }

    getGenerationOptions() {
        return {
            includeHeader: document.getElementById('includeHeader')?.checked ?? true,
            includeComments: document.getElementById('includeComments')?.checked ?? true,
            sortEntries: document.getElementById('sortEntries')?.checked ?? true,
            removeDuplicates: document.getElementById('removeDuplicates')?.checked ?? true,
            includeDomainOnly: document.getElementById('includeDomainOnly')?.checked ?? false,
            includeShortNames: document.getElementById('includeShortNames')?.checked ?? true,
            includeFQDN: document.getElementById('includeFQDN')?.checked ?? true,
            autoDetectDC: document.getElementById('autoDetectDC')?.checked ?? false,
            includeSystemEntries: document.getElementById('includeSystemEntries')?.checked ?? false,
            groupByDomain: document.getElementById('groupByDomain')?.checked ?? false,
            ipFilter: document.getElementById('ipFilter')?.value || '',
            excludeIPs: document.getElementById('excludeIPs')?.value || '',
            requiredServices: document.getElementById('requiredServices')?.value || '',
            localHostname: document.getElementById('localHostname')?.value || 'kali'
        };
    }

    updatePreview() {
        try {
            const options = this.getGenerationOptions();
            const scanTool = document.getElementById('scanTool')?.value;
            const scanOutput = document.getElementById('scanOutput')?.value || '';
            
            let entries = [];
            
            // Parser les données si disponibles
            if (scanOutput.trim() && scanTool) {
                try {
                    const parsedData = this.app.getModule('parsers').parseOutput(scanTool, scanOutput);
                    entries = parsedData.entries || [];
                } catch (error) {
                    // Ignorer les erreurs de parsing dans l'aperçu
                }
            }
            
            // Ajouter les entrées manuelles
            entries = entries.concat(this.manualEntries);
            
            // Appliquer les filtres
            entries = this.applyFilters(entries, options);
            
            // Générer l'aperçu (limité)
            const previewEntries = entries.slice(0, 20); // Limiter à 20 entrées
            let previewContent = this.generateHostsContent(previewEntries, options);
            
            if (entries.length > 20) {
                previewContent += `\n# ... et ${entries.length - 20} entrées supplémentaires\n`;
            }
            
            document.getElementById('hostsPreview').textContent = previewContent;
            this.updateStats(entries);
            
        } catch (error) {
            console.warn('Erreur mise à jour aperçu:', error);
        }
    }

    updateStats(entries = []) {
        const domains = [...new Set(entries.map(e => e.domain).filter(Boolean))];
        
        document.getElementById('entriesCount').textContent = `${entries.length} entrées`;
        document.getElementById('domainsCount').textContent = `${domains.length} domaines`;
    }

    // ==================== GESTION MANUELLE ====================

    addManualEntry() {
        const ip = document.getElementById('manualIP')?.value.trim();
        const hostname = document.getElementById('manualHostname')?.value.trim();
        const domain = document.getElementById('manualDomain')?.value.trim();
        
        if (!ip || !hostname) {
            this.app.showNotification('⚠️ IP et hostname requis', 'warning');
            return;
        }
        
        // Validation IP basique
        if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
            this.app.showNotification('⚠️ Format IP invalide', 'warning');
            return;
        }
        
        const entry = {
            ip,
            hostname,
            domain: domain || null,
            fqdn: domain ? `${hostname}.${domain}` : null,
            source: 'manual',
            addedAt: new Date().toISOString()
        };
        
        this.manualEntries.push(entry);
        this.displayManualEntries();
        
        // Vider les champs
        document.getElementById('manualIP').value = '';
        document.getElementById('manualHostname').value = '';
        document.getElementById('manualDomain').value = '';
        
        this.updatePreview();
        this.app.showNotification('✅ Entrée ajoutée', 'success');
    }

    displayManualEntries() {
        const container = document.getElementById('manualEntries');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.manualEntries.forEach((entry, index) => {
            const div = document.createElement('div');
            div.className = 'manual-entry-item';
            div.innerHTML = `
                <span><strong>${entry.ip}</strong> → ${entry.hostname}${entry.domain ? '.' + entry.domain : ''}</span>
                <button onclick="window.configGenerator.getModule('hosts').removeManualEntry(${index})" 
                        class="btn btn-sm btn-outline-danger">✕</button>
            `;
            container.appendChild(div);
        });
    }

    removeManualEntry(index) {
        this.manualEntries.splice(index, 1);
        this.displayManualEntries();
        this.updatePreview();
    }

    // ==================== PRESETS ====================

    loadPresets() {
        this.presets = {
            ad: {
                name: 'Active Directory',
                data: [
                    { ip: '192.168.1.10', hostname: 'dc01', domain: 'contoso.local' },
                    { ip: '192.168.1.11', hostname: 'dc02', domain: 'contoso.local' },
                    { ip: '192.168.1.20', hostname: 'fs01', domain: 'contoso.local' },
                    { ip: '192.168.1.21', hostname: 'sql01', domain: 'contoso.local' }
                ]
            },
            lab: {
                name: 'Lab HTB/THM',
                data: [
                    { ip: '10.10.10.100', hostname: 'target', domain: null },
                    { ip: '10.10.10.101', hostname: 'web', domain: null },
                    { ip: '10.10.10.102', hostname: 'db', domain: null }
                ]
            },
            corporate: {
                name: 'Corporate Network',
                data: [
                    { ip: '172.16.1.10', hostname: 'mail', domain: 'corp.local' },
                    { ip: '172.16.1.20', hostname: 'web', domain: 'corp.local' },
                    { ip: '172.16.1.30', hostname: 'db', domain: 'corp.local' }
                ]
            },
            cloud: {
                name: 'Cloud AWS/Azure',
                data: [
                    { ip: '10.0.1.10', hostname: 'web-01', domain: 'internal.cloud' },
                    { ip: '10.0.1.11', hostname: 'web-02', domain: 'internal.cloud' },
                    { ip: '10.0.2.10', hostname: 'db-01', domain: 'internal.cloud' }
                ]
            }
        };
    }

    loadPreset(presetName) {
        const preset = this.presets[presetName];
        if (!preset) return;
        
        // Ajouter les données du preset aux entrées manuelles
        this.manualEntries = this.manualEntries.concat(preset.data.map(entry => ({
            ...entry,
            source: `preset-${presetName}`,
            addedAt: new Date().toISOString()
        })));
        
        this.displayManualEntries();
        this.updatePreview();
        
        this.app.showNotification(`📋 Preset "${preset.name}" chargé !`, 'success');
    }

    // ==================== FILE HANDLING ====================

    setupFileDropZone() {
        const dropZone = document.getElementById('fileDropZone');
        const fileInput = document.getElementById('importFile');
        
        if (!dropZone) return;
        
        dropZone.addEventListener('click', () => fileInput?.click());
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileImport(files[0]);
            }
        });
        
        fileInput?.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileImport(e.target.files[0]);
            }
        });
    }

    async handleFileImport(file) {
        try {
            const text = await file.text();
            const extension = file.name.split('.').pop().toLowerCase();
            
            let importedEntries = [];
            
            switch (extension) {
                case 'txt':
                    importedEntries = this.parseTextFile(text);
                    break;
                case 'csv':
                    importedEntries = this.parseCsvFile(text);
                    break;
                case 'json':
                    importedEntries = this.parseJsonFile(text);
                    break;
                case 'xml':
                    importedEntries = this.parseXmlFile(text);
                    break;
                default:
                    throw new Error('Format de fichier non supporté');
            }
            
            this.manualEntries = this.manualEntries.concat(importedEntries);
            this.displayManualEntries();
            this.updatePreview();
            
            this.app.showNotification(`📁 ${importedEntries.length} entrées importées depuis ${file.name}`, 'success');
            
        } catch (error) {
            console.error('Erreur import fichier:', error);
            this.app.showNotification('❌ Erreur lors de l\'import du fichier', 'error');
        }
    }

    parseTextFile(text) {
        const entries = [];
        const lines = text.split('\n');
        
        for (const line of lines) {
            if (line.trim() && !line.startsWith('#')) {
                // Format: IP hostname [domain]
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 2) {
                    entries.push({
                        ip: parts[0],
                        hostname: parts[1],
                        domain: parts[2] || null,
                        source: 'file-import'
                    });
                }
            }
        }
        
        return entries;
    }

    parseCsvFile(text) {
        const entries = [];
        const lines = text.split('\n');
        
        // Ignorer l'en-tête si présent
        const startIndex = lines[0]?.toLowerCase().includes('ip') ? 1 : 0;
        
        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const parts = line.split(',').map(part => part.trim().replace(/"/g, ''));
            if (parts.length >= 2) {
                entries.push({
                    ip: parts[0],
                    hostname: parts[1],
                    domain: parts[2] || null,
                    source: 'csv-import'
                });
            }
        }
        
        return entries;
    }

    parseJsonFile(text) {
        const data = JSON.parse(text);
        const entries = [];
        
        if (Array.isArray(data)) {
            data.forEach(item => {
                if (item.ip && item.hostname) {
                    entries.push({
                        ip: item.ip,
                        hostname: item.hostname,
                        domain: item.domain || null,
                        source: 'json-import'
                    });
                }
            });
        }
        
        return entries;
    }

    parseXmlFile(text) {
        // Parser XML basique (pour Nmap XML par exemple)
        const entries = [];
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, 'text/xml');
        
        const hosts = xmlDoc.querySelectorAll('host');
        hosts.forEach(host => {
            const address = host.querySelector('address[@addrtype="ipv4"]')?.getAttribute('addr');
            const hostname = host.querySelector('hostname')?.getAttribute('name');
            
            if (address) {
                entries.push({
                    ip: address,
                    hostname: hostname || address,
                    source: 'xml-import'
                });
            }
        });
        
        return entries;
    }

    // ==================== EXPORT FUNCTIONS ====================

    async copyToClipboard() {
        const content = document.getElementById('hostsPreview')?.textContent;
        if (!content) {
            this.app.showNotification('⚠️ Aucun contenu à copier', 'warning');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(content);
            this.app.showNotification('📋 Contenu copié dans le presse-papier !', 'success');
        } catch (error) {
            console.error('Erreur copie:', error);
            this.app.showNotification('❌ Erreur lors de la copie', 'error');
        }
    }

    downloadFile() {
        const content = document.getElementById('hostsPreview')?.textContent;
        if (!content) {
            this.app.showNotification('⚠️ Aucun contenu à télécharger', 'warning');
            return;
        }
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hosts-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.app.showNotification('💾 Fichier /etc/hosts téléchargé !', 'success');
    }

    exportToTools() {
        // Export vers d'autres outils de l'application
        const data = this.app.getData('hosts');
        
        // Export vers Host Manager
        if (window.hostManager) {
            // Code pour intégrer avec Host Manager
            this.app.showNotification('🔗 Export vers Host Manager (à implémenter)', 'info');
        } else {
            this.app.showNotification('🔗 Fonctionnalité d\'export vers outils à venir', 'info');
        }
    }

    compareIPs(ip1, ip2) {
        const num1 = this.ipToNumber(ip1);
        const num2 = this.ipToNumber(ip2);
        return num1 - num2;
    }

    // Méthode pour l'export - retourne la configuration actuelle
    async generateConfigForExport() {
        try {
            const data = this.app.getData('hosts');
            const options = this.getGenerationOptions();
            
            if (data.entries && data.entries.length > 0) {
                return this.generateHostsContent(data.entries, options);
            }
            
            // Si pas d'entrées parsées, essayer de générer depuis l'input actuel
            await this.generateHosts();
            const newData = this.app.getData('hosts');
            
            if (newData.entries && newData.entries.length > 0) {
                return this.generateHostsContent(newData.entries, options);
            }
            
            return null;
        } catch (error) {
            console.error('❌ Erreur génération config pour export:', error);
            return null;
        }
    }

    ipToNumber(ip) {
        return ip.split('.').reduce((acc, part) => acc * 256 + parseInt(part, 10), 0);
    }
}; 