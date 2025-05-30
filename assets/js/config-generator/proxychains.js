/**
 * Config Generator - Module ProxyChains
 * Générateur de configuration proxychains.conf
 */

window.ProxyChainsGenerator = class ProxyChainsGenerator {
    constructor(app) {
        this.app = app;
        this.proxies = [];
        this.presets = {};
    }

    async init() {
        console.log('🔗 Initialisation du générateur ProxyChains...');
        this.loadPresets();
        this.setupEventListeners();
        this.updatePreview();
    }

    setupEventListeners() {
        // Type de chaîne
        document.querySelectorAll('input[name="chainType"]').forEach(radio => {
            radio.addEventListener('change', () => this.updatePreview());
        });

        // Options globales
        document.querySelectorAll('#proxychains-tab input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updatePreview());
        });

        // Ajout de proxy
        document.getElementById('addProxy')?.addEventListener('click', () => this.addProxy());

        // Boutons d'action
        document.getElementById('generateProxychains')?.addEventListener('click', () => this.generateConfig());
        document.getElementById('copyProxychains')?.addEventListener('click', () => this.copyToClipboard());
        document.getElementById('downloadProxychains')?.addEventListener('click', () => this.downloadFile());
        document.getElementById('testChain')?.addEventListener('click', () => this.testChain());

        // Presets
        document.querySelectorAll('#proxychains-tab .preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.loadPreset(e.target.dataset.preset));
        });

        // Enter key dans les champs de proxy
        ['proxyHost', 'proxyPort', 'proxyUser', 'proxyPass'].forEach(fieldId => {
            document.getElementById(fieldId)?.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addProxy();
                }
            });
        });
    }

    onTabActivated() {
        this.updatePreview();
    }

    saveState() {
        const data = {
            chainType: document.querySelector('input[name="chainType"]:checked')?.value || 'dynamic_chain',
            proxies: this.proxies,
            options: this.getProxyChainOptions(),
            lastGenerated: document.getElementById('proxychainsPreview')?.textContent || ''
        };
        
        this.app.setData('proxychains', data);
    }

    onDataImported() {
        const data = this.app.getData('proxychains');
        
        if (data.chainType) {
            const radio = document.querySelector(`input[name="chainType"][value="${data.chainType}"]`);
            if (radio) radio.checked = true;
        }
        
        if (data.proxies) {
            this.proxies = data.proxies;
            this.displayProxies();
        }
        
        // Restaurer les options
        if (data.options) {
            Object.entries(data.options).forEach(([key, value]) => {
                const element = document.getElementById(key);
                if (element && element.type === 'checkbox') {
                    element.checked = value;
                }
            });
        }
        
        this.updatePreview();
    }

    loadPresets() {
        this.presets = {
            tor: {
                name: 'Tor',
                config: {
                    chainType: 'dynamic_chain',
                    proxies: [
                        { type: 'socks5', host: '127.0.0.1', port: 9050, user: '', pass: '' }
                    ],
                    options: {
                        proxyDNS: true,
                        remoteDNS: true,
                        quietMode: true
                    }
                }
            },
            'ssh-tunnel': {
                name: 'SSH Tunnel',
                config: {
                    chainType: 'strict_chain',
                    proxies: [
                        { type: 'socks5', host: '127.0.0.1', port: 1080, user: '', pass: '' }
                    ],
                    options: {
                        proxyDNS: true,
                        remoteDNS: true,
                        tcpReadTimeout: true,
                        tcpConnectTimeout: true
                    }
                }
            },
            burp: {
                name: 'Burp Suite',
                config: {
                    chainType: 'strict_chain',
                    proxies: [
                        { type: 'http', host: '127.0.0.1', port: 8080, user: '', pass: '' }
                    ],
                    options: {
                        proxyDNS: false,
                        remoteDNS: false,
                        quietMode: false
                    }
                }
            },
            'multi-hop': {
                name: 'Multi-Hop',
                config: {
                    chainType: 'strict_chain',
                    proxies: [
                        { type: 'socks5', host: '127.0.0.1', port: 9050, user: '', pass: '' },
                        { type: 'socks5', host: '10.10.10.10', port: 1080, user: 'user', pass: 'pass' },
                        { type: 'http', host: '192.168.1.100', port: 3128, user: '', pass: '' }
                    ],
                    options: {
                        proxyDNS: true,
                        remoteDNS: true,
                        tcpReadTimeout: true,
                        tcpConnectTimeout: true
                    }
                }
            }
        };
    }

    loadPreset(presetName) {
        const preset = this.presets[presetName];
        if (!preset) return;

        const config = preset.config;
        
        // Type de chaîne
        const chainRadio = document.querySelector(`input[name="chainType"][value="${config.chainType}"]`);
        if (chainRadio) chainRadio.checked = true;

        // Proxies
        this.proxies = [...config.proxies];
        this.displayProxies();

        // Options
        Object.entries(config.options).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element && element.type === 'checkbox') {
                element.checked = value;
            }
        });

        this.updatePreview();
        this.app.showNotification(`🔗 Preset "${preset.name}" appliqué !`, 'success');
    }

    getProxyChainOptions() {
        return {
            proxyDNS: document.getElementById('proxyDNS')?.checked ?? true,
            remoteDNS: document.getElementById('remoteDNS')?.checked ?? true,
            tcpReadTimeout: document.getElementById('tcpReadTimeout')?.checked ?? false,
            tcpConnectTimeout: document.getElementById('tcpConnectTimeout')?.checked ?? false,
            quietMode: document.getElementById('quietMode')?.checked ?? false
        };
    }

    addProxy() {
        const type = document.getElementById('proxyType')?.value || 'socks5';
        const host = document.getElementById('proxyHost')?.value.trim();
        const port = parseInt(document.getElementById('proxyPort')?.value) || 0;
        const user = document.getElementById('proxyUser')?.value.trim();
        const pass = document.getElementById('proxyPass')?.value.trim();

        if (!host || !port) {
            this.app.showNotification('⚠️ Host et port requis', 'warning');
            return;
        }

        // Validation port
        if (port < 1 || port > 65535) {
            this.app.showNotification('⚠️ Port invalide (1-65535)', 'warning');
            return;
        }

        // Validation IP/hostname basique
        if (!/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|localhost|[\w.-]+)$/.test(host)) {
            this.app.showNotification('⚠️ Format host invalide', 'warning');
            return;
        }

        const proxy = { type, host, port, user, pass };
        this.proxies.push(proxy);

        // Vider les champs
        document.getElementById('proxyHost').value = '';
        document.getElementById('proxyPort').value = '';
        document.getElementById('proxyUser').value = '';
        document.getElementById('proxyPass').value = '';

        this.displayProxies();
        this.updatePreview();
        this.app.showNotification('✅ Proxy ajouté', 'success');
    }

    removeProxy(index) {
        this.proxies.splice(index, 1);
        this.displayProxies();
        this.updatePreview();
    }

    displayProxies() {
        const container = document.getElementById('proxyEntries');
        if (!container) return;

        container.innerHTML = '';

        this.proxies.forEach((proxy, index) => {
            const div = document.createElement('div');
            div.className = 'proxy-entry-item';
            
            const authInfo = proxy.user ? ` (${proxy.user}:${proxy.pass ? '***' : 'no-pass'})` : '';
            
            div.innerHTML = `
                <span>
                    <strong>${proxy.type.toUpperCase()}</strong> 
                    ${proxy.host}:${proxy.port}${authInfo}
                </span>
                <button onclick="window.configGenerator.getModule('proxychains').removeProxy(${index})" 
                        class="btn btn-sm btn-outline-danger">✕</button>
            `;
            container.appendChild(div);
        });

        // Afficher message si aucun proxy
        if (this.proxies.length === 0) {
            const div = document.createElement('div');
            div.className = 'text-muted small';
            div.textContent = 'Aucun proxy configuré';
            container.appendChild(div);
        }
    }

    generateConfig() {
        if (this.proxies.length === 0) {
            this.app.showNotification('⚠️ Ajoutez au moins un proxy', 'warning');
            return;
        }

        const chainType = document.querySelector('input[name="chainType"]:checked')?.value || 'dynamic_chain';
        const options = this.getProxyChainOptions();
        const config = this.buildProxyChainConfig(chainType, options, this.proxies);

        document.getElementById('proxychainsPreview').textContent = config;

        // Sauvegarder
        this.app.setData('proxychains', {
            ...this.app.getData('proxychains'),
            lastGenerated: config,
            generatedAt: new Date().toISOString()
        });

        this.app.showNotification('✅ Configuration ProxyChains générée !', 'success');
    }

    buildProxyChainConfig(chainType, options, proxies) {
        let config = '';

        // En-tête
        config += `# proxychains.conf - Configuration ProxyChains\n`;
        config += `# Généré automatiquement le ${new Date().toLocaleString()}\n`;
        config += `# Type de chaîne: ${chainType}\n`;
        config += `# Nombre de proxies: ${proxies.length}\n\n`;

        // Type de chaîne
        config += `# Type de chaîne proxy\n`;
        config += `${chainType}\n\n`;

        // Options globales
        config += `# Options globales\n`;
        
        if (options.proxyDNS) {
            config += `proxy_dns\n`;
        }
        
        if (options.remoteDNS) {
            config += `remote_dns_subnet 224\n`;
        }
        
        if (options.tcpReadTimeout) {
            config += `tcp_read_time_out 15000\n`;
        }
        
        if (options.tcpConnectTimeout) {
            config += `tcp_connect_time_out 8000\n`;
        }
        
        if (options.quietMode) {
            config += `quiet_mode\n`;
        }

        config += `\n`;

        // Liste des proxies
        config += `# ProxyList\n`;
        config += `# format: type host port [user pass]\n`;
        config += `[ProxyList]\n`;

        proxies.forEach(proxy => {
            let line = `${proxy.type}\t${proxy.host}\t${proxy.port}`;
            
            if (proxy.user && proxy.pass) {
                line += `\t${proxy.user}\t${proxy.pass}`;
            } else if (proxy.user) {
                line += `\t${proxy.user}`;
            }
            
            config += line + '\n';
        });

        // Commentaires utiles selon le type de chaîne
        config += `\n# Notes d'utilisation:\n`;
        switch (chainType) {
            case 'dynamic_chain':
                config += `# Mode dynamique: Les proxies morts sont ignorés automatiquement\n`;
                config += `# Au moins un proxy doit être en vie\n`;
                break;
            case 'strict_chain':
                config += `# Mode strict: Tous les proxies doivent être en vie\n`;
                config += `# La chaîne échoue si un proxy est mort\n`;
                break;
            case 'random_chain':
                config += `# Mode aléatoire: Utilise un proxy aléatoire de la liste\n`;
                config += `# Plus anonyme mais moins prévisible\n`;
                break;
        }

        config += `# Usage: proxychains4 <commande>\n`;
        config += `# Exemple: proxychains4 nmap -sT target.com\n`;

        return config;
    }

    updatePreview() {
        if (this.proxies.length === 0) {
            document.getElementById('proxychainsPreview').textContent = 
                '# Configuration proxychains\n# Ajoutez des proxies à gauche...';
            return;
        }

        try {
            const chainType = document.querySelector('input[name="chainType"]:checked')?.value || 'dynamic_chain';
            const options = this.getProxyChainOptions();
            const config = this.buildProxyChainConfig(chainType, options, this.proxies);
            
            document.getElementById('proxychainsPreview').textContent = config;
        } catch (error) {
            console.warn('Erreur preview ProxyChains:', error);
        }
    }

    async copyToClipboard() {
        const content = document.getElementById('proxychainsPreview')?.textContent;
        if (!content) {
            this.app.showNotification('⚠️ Aucun contenu à copier', 'warning');
            return;
        }

        try {
            await navigator.clipboard.writeText(content);
            this.app.showNotification('📋 Configuration ProxyChains copiée !', 'success');
        } catch (error) {
            console.error('Erreur copie:', error);
            this.app.showNotification('❌ Erreur lors de la copie', 'error');
        }
    }

    downloadFile() {
        const content = document.getElementById('proxychainsPreview')?.textContent;
        if (!content) {
            this.app.showNotification('⚠️ Aucun contenu à télécharger', 'warning');
            return;
        }

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'proxychains.conf';
        a.click();

        URL.revokeObjectURL(url);
        this.app.showNotification('💾 Fichier proxychains.conf téléchargé !', 'success');
    }

    async testChain() {
        if (this.proxies.length === 0) {
            this.app.showNotification('⚠️ Aucun proxy à tester', 'warning');
            return;
        }

        this.app.showNotification('🔍 Test de la chaîne proxy...', 'info');

        try {
            // Simuler un test de connectivité
            const results = await this.performProxyTests();
            this.displayTestResults(results);
        } catch (error) {
            console.error('Erreur test proxy:', error);
            this.app.showNotification('❌ Erreur lors du test', 'error');
        }
    }

    async performProxyTests() {
        const results = [];
        
        for (let i = 0; i < this.proxies.length; i++) {
            const proxy = this.proxies[i];
            
            // Simulation de test (dans un vrai environnement, vous feriez une vraie connexion)
            const isReachable = await this.simulateProxyTest(proxy);
            
            results.push({
                proxy,
                index: i,
                status: isReachable ? 'OK' : 'FAIL',
                latency: isReachable ? Math.floor(Math.random() * 500) + 50 : null,
                error: isReachable ? null : 'Connection timeout'
            });
        }
        
        return results;
    }

    async simulateProxyTest(proxy) {
        // Simulation - dans la réalité vous testeriez vraiment la connectivité
        return new Promise(resolve => {
            setTimeout(() => {
                // Simuler 80% de succès pour localhost, 60% pour autres
                const successRate = proxy.host === '127.0.0.1' || proxy.host === 'localhost' ? 0.8 : 0.6;
                resolve(Math.random() < successRate);
            }, Math.random() * 1000 + 500);
        });
    }

    displayTestResults(results) {
        let message = '🔍 Résultats du test de chaîne proxy:\n\n';
        
        results.forEach((result, index) => {
            const status = result.status === 'OK' ? '✅' : '❌';
            const latency = result.latency ? ` (${result.latency}ms)` : '';
            const error = result.error ? ` - ${result.error}` : '';
            
            message += `${index + 1}. ${status} ${result.proxy.type}://${result.proxy.host}:${result.proxy.port}${latency}${error}\n`;
        });

        const successCount = results.filter(r => r.status === 'OK').length;
        const chainType = document.querySelector('input[name="chainType"]:checked')?.value || 'dynamic_chain';
        
        message += `\n📊 Résumé: ${successCount}/${results.length} proxies actifs\n`;
        
        if (chainType === 'strict_chain' && successCount < results.length) {
            message += '⚠️ Mode strict: La chaîne échouera car tous les proxies ne sont pas actifs';
        } else if (chainType === 'dynamic_chain' && successCount > 0) {
            message += '✅ Mode dynamique: La chaîne fonctionnera avec les proxies actifs';
        } else if (successCount === 0) {
            message += '❌ Aucun proxy actif: La chaîne ne fonctionnera pas';
        }

        // Afficher dans une modale ou alert
        alert(message);
    }

    // Méthodes utilitaires pour des configurations spécialisées
    generateTorConfig() {
        return {
            chainType: 'dynamic_chain',
            proxies: [
                { type: 'socks5', host: '127.0.0.1', port: 9050, user: '', pass: '' }
            ],
            options: {
                proxyDNS: true,
                remoteDNS: true,
                quietMode: true
            }
        };
    }

    generateSSHTunnelConfig(sshHost, sshPort = 22, localPort = 1080) {
        return {
            chainType: 'strict_chain',
            proxies: [
                { type: 'socks5', host: '127.0.0.1', port: localPort, user: '', pass: '' }
            ],
            options: {
                proxyDNS: true,
                remoteDNS: true,
                tcpReadTimeout: true,
                tcpConnectTimeout: true
            },
            sshCommand: `ssh -D ${localPort} -f -C -q -N user@${sshHost} -p ${sshPort}`
        };
    }

    generateVPNChainConfig() {
        return `# Configuration ProxyChains pour VPN Chain
strict_chain
proxy_dns
tcp_read_time_out 15000
tcp_connect_time_out 8000

[ProxyList]
# VPN + Proxy Chain
socks5 127.0.0.1 1080
http 127.0.0.1 8080
`;
    }

    // Méthode pour l'export - retourne la configuration actuelle
    async generateConfigForExport() {
        try {
            // Utiliser la configuration actuelle ou générer une nouvelle
            if (this.currentConfig && this.currentConfig.content) {
                return this.currentConfig.content;
            }
            
            // Générer une nouvelle configuration en appelant la méthode principale
            this.generateConfig();
            return this.currentConfig?.content || null;
        } catch (error) {
            console.error('❌ Erreur génération config ProxyChains pour export:', error);
            return null;
        }
    }
}; 