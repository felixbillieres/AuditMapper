/**
 * Config Generator - Module Kerberos
 * Générateur de configuration krb5.conf
 */

window.KerberosGenerator = class KerberosGenerator {
    constructor(app) {
        this.app = app;
        this.presets = {};
    }

    async init() {
        console.log('🎫 Initialisation du générateur Kerberos...');
        this.loadPresets();
        this.setupEventListeners();
        this.updatePreview();
    }

    setupEventListeners() {
        // Champs de configuration
        document.getElementById('krbDomain')?.addEventListener('input', () => this.updatePreview());
        document.getElementById('krbDC')?.addEventListener('input', () => this.updatePreview());
        document.getElementById('krbKDC')?.addEventListener('input', () => this.updatePreview());
        document.getElementById('krbAdminServer')?.addEventListener('input', () => this.updatePreview());

        // Options avancées
        document.querySelectorAll('#kerberos-tab input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updatePreview());
        });

        // Boutons d'action
        document.getElementById('generateKerberos')?.addEventListener('click', () => this.generateConfig());
        document.getElementById('copyKerberos')?.addEventListener('click', () => this.copyToClipboard());
        document.getElementById('downloadKerberos')?.addEventListener('click', () => this.downloadFile());

        // Presets
        document.querySelectorAll('#kerberos-tab .preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.loadPreset(e.target.dataset.preset));
        });
    }

    onTabActivated() {
        this.updatePreview();
    }

    saveState() {
        const data = {
            domain: document.getElementById('krbDomain')?.value || '',
            dc: document.getElementById('krbDC')?.value || '',
            kdc: document.getElementById('krbKDC')?.value || '',
            adminServer: document.getElementById('krbAdminServer')?.value || '',
            options: this.getKerberosOptions(),
            lastGenerated: document.getElementById('kerberosPreview')?.textContent || ''
        };
        
        this.app.setData('kerberos', data);
    }

    onDataImported() {
        const data = this.app.getData('kerberos');
        if (data.domain) document.getElementById('krbDomain').value = data.domain;
        if (data.dc) document.getElementById('krbDC').value = data.dc;
        if (data.kdc) document.getElementById('krbKDC').value = data.kdc;
        if (data.adminServer) document.getElementById('krbAdminServer').value = data.adminServer;
        
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
            standard: {
                name: 'Standard AD',
                config: {
                    domain: 'CONTOSO.LOCAL',
                    dc: 'dc01.contoso.local',
                    kdc: '192.168.1.10',
                    adminServer: 'dc01.contoso.local:749',
                    options: {
                        krbEncTypes: true,
                        krbTicketLifetime: true,
                        krbRenewLifetime: true,
                        krbForwardable: true,
                        krbProxiable: false
                    }
                }
            },
            attack: {
                name: 'Mode Attaque',
                config: {
                    domain: 'TARGET.LOCAL',
                    dc: 'dc.target.local',
                    kdc: '10.10.10.10',
                    adminServer: 'dc.target.local:749',
                    options: {
                        krbEncTypes: false, // Utiliser des algos plus faibles
                        krbTicketLifetime: false, // Tickets plus longs
                        krbRenewLifetime: false,
                        krbForwardable: true,
                        krbProxiable: true
                    }
                }
            },
            stealth: {
                name: 'Mode Furtif',
                config: {
                    domain: 'DOMAIN.LOCAL',
                    dc: 'primary-dc.domain.local',
                    kdc: '172.16.1.5',
                    adminServer: 'primary-dc.domain.local:749',
                    options: {
                        krbEncTypes: true,
                        krbTicketLifetime: true,
                        krbRenewLifetime: true,
                        krbForwardable: false, // Moins de logs
                        krbProxiable: false
                    }
                }
            },
            debug: {
                name: 'Debug/Verbose',
                config: {
                    domain: 'DEBUG.LOCAL',
                    dc: 'dc-debug.debug.local',
                    kdc: '192.168.100.10',
                    adminServer: 'dc-debug.debug.local:749',
                    options: {
                        krbEncTypes: true,
                        krbTicketLifetime: true,
                        krbRenewLifetime: true,
                        krbForwardable: true,
                        krbProxiable: true,
                        debug: true,
                        verbose: true
                    }
                }
            }
        };
    }

    loadPreset(presetName) {
        const preset = this.presets[presetName];
        if (!preset) return;

        const config = preset.config;
        
        // Remplir les champs
        document.getElementById('krbDomain').value = config.domain;
        document.getElementById('krbDC').value = config.dc;
        document.getElementById('krbKDC').value = config.kdc;
        document.getElementById('krbAdminServer').value = config.adminServer;

        // Appliquer les options
        Object.entries(config.options).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element && element.type === 'checkbox') {
                element.checked = value;
            }
        });

        this.updatePreview();
        this.app.showNotification(`🎫 Preset "${preset.name}" appliqué !`, 'success');
    }

    getKerberosOptions() {
        return {
            krbEncTypes: document.getElementById('krbEncTypes')?.checked ?? true,
            krbTicketLifetime: document.getElementById('krbTicketLifetime')?.checked ?? true,
            krbRenewLifetime: document.getElementById('krbRenewLifetime')?.checked ?? true,
            krbForwardable: document.getElementById('krbForwardable')?.checked ?? true,
            krbProxiable: document.getElementById('krbProxiable')?.checked ?? false
        };
    }

    generateConfig() {
        const domain = document.getElementById('krbDomain')?.value.trim();
        const dc = document.getElementById('krbDC')?.value.trim();
        const kdc = document.getElementById('krbKDC')?.value.trim();
        const adminServer = document.getElementById('krbAdminServer')?.value.trim();

        if (!domain || !kdc) {
            this.app.showNotification('⚠️ Domaine et KDC requis', 'warning');
            return;
        }

        const options = this.getKerberosOptions();
        const config = this.buildKerberosConfig(domain, dc, kdc, adminServer, options);

        document.getElementById('kerberosPreview').textContent = config;

        // Sauvegarder
        this.app.setData('kerberos', {
            ...this.app.getData('kerberos'),
            lastGenerated: config,
            generatedAt: new Date().toISOString()
        });

        this.app.showNotification('✅ Configuration Kerberos générée !', 'success');
    }

    buildKerberosConfig(domain, dc, kdc, adminServer, options) {
        const domainUpper = domain.toUpperCase();
        const domainLower = domain.toLowerCase();
        
        let config = '';

        // En-tête
        config += `# krb5.conf - Configuration Kerberos\n`;
        config += `# Généré automatiquement le ${new Date().toLocaleString()}\n`;
        config += `# Domaine: ${domainUpper}\n`;
        config += `# KDC: ${kdc}\n\n`;

        // Section [libdefaults]
        config += `[libdefaults]\n`;
        config += `    default_realm = ${domainUpper}\n`;
        
        if (options.krbTicketLifetime) {
            config += `    ticket_lifetime = 24h\n`;
        }
        
        if (options.krbRenewLifetime) {
            config += `    renew_lifetime = 7d\n`;
        }
        
        if (options.krbForwardable) {
            config += `    forwardable = true\n`;
        }
        
        if (options.krbProxiable) {
            config += `    proxiable = true\n`;
        }

        // Types de chiffrement
        if (options.krbEncTypes) {
            config += `    default_tgs_enctypes = aes256-cts-hmac-sha1-96 aes128-cts-hmac-sha1-96 rc4-hmac\n`;
            config += `    default_tkt_enctypes = aes256-cts-hmac-sha1-96 aes128-cts-hmac-sha1-96 rc4-hmac\n`;
            config += `    permitted_enctypes = aes256-cts-hmac-sha1-96 aes128-cts-hmac-sha1-96 rc4-hmac\n`;
        } else {
            // Mode attaque - algorithmes plus faibles
            config += `    default_tgs_enctypes = rc4-hmac des-cbc-crc des-cbc-md5\n`;
            config += `    default_tkt_enctypes = rc4-hmac des-cbc-crc des-cbc-md5\n`;
            config += `    permitted_enctypes = rc4-hmac des-cbc-crc des-cbc-md5\n`;
        }

        config += `    dns_lookup_realm = false\n`;
        config += `    dns_lookup_kdc = false\n\n`;

        // Section [realms]
        config += `[realms]\n`;
        config += `    ${domainUpper} = {\n`;
        config += `        kdc = ${kdc}:88\n`;
        
        if (adminServer) {
            config += `        admin_server = ${adminServer}\n`;
        }
        
        if (dc) {
            config += `        default_domain = ${domainLower}\n`;
        }
        
        config += `    }\n\n`;

        // Section [domain_realm]
        config += `[domain_realm]\n`;
        config += `    .${domainLower} = ${domainUpper}\n`;
        config += `    ${domainLower} = ${domainUpper}\n`;
        
        // Ajouter des variations communes
        if (domainLower.includes('.local')) {
            const shortDomain = domainLower.replace('.local', '');
            config += `    .${shortDomain} = ${domainUpper}\n`;
            config += `    ${shortDomain} = ${domainUpper}\n`;
        }
        
        config += `\n`;

        // Section [appdefaults] pour des outils spécifiques
        config += `[appdefaults]\n`;
        config += `    pam = {\n`;
        config += `        debug = false\n`;
        config += `        ticket_lifetime = 36000\n`;
        config += `        renew_lifetime = 36000\n`;
        config += `        forwardable = true\n`;
        config += `        krb4_convert = false\n`;
        config += `    }\n\n`;

        // Section pour les outils de pentest
        config += `# Configuration pour outils de pentest\n`;
        config += `[realms]\n`;
        config += `    ${domainUpper} = {\n`;
        config += `        # Pour impacket et autres outils\n`;
        config += `        kdc = ${kdc}\n`;
        config += `        # Pour kerberoasting\n`;
        config += `        default_tgs_enctypes = rc4-hmac\n`;
        config += `        # Pour ASREPRoasting\n`;
        config += `        default_tkt_enctypes = rc4-hmac\n`;
        config += `    }\n`;

        return config;
    }

    updatePreview() {
        const domain = document.getElementById('krbDomain')?.value.trim();
        const dc = document.getElementById('krbDC')?.value.trim();
        const kdc = document.getElementById('krbKDC')?.value.trim();
        const adminServer = document.getElementById('krbAdminServer')?.value.trim();

        if (!domain && !kdc) {
            document.getElementById('kerberosPreview').textContent = '# Configuration krb5.conf\n# Configurez les paramètres à gauche...';
            return;
        }

        try {
            const options = this.getKerberosOptions();
            const config = this.buildKerberosConfig(
                domain || 'DOMAIN.LOCAL',
                dc || 'dc01.domain.local',
                kdc || '192.168.1.10',
                adminServer || 'dc01.domain.local:749',
                options
            );
            
            document.getElementById('kerberosPreview').textContent = config;
        } catch (error) {
            console.warn('Erreur preview Kerberos:', error);
        }
    }

    async copyToClipboard() {
        const content = document.getElementById('kerberosPreview')?.textContent;
        if (!content) {
            this.app.showNotification('⚠️ Aucun contenu à copier', 'warning');
            return;
        }

        try {
            await navigator.clipboard.writeText(content);
            this.app.showNotification('📋 Configuration Kerberos copiée !', 'success');
        } catch (error) {
            console.error('Erreur copie:', error);
            this.app.showNotification('❌ Erreur lors de la copie', 'error');
        }
    }

    downloadFile() {
        const content = document.getElementById('kerberosPreview')?.textContent;
        if (!content) {
            this.app.showNotification('⚠️ Aucun contenu à télécharger', 'warning');
            return;
        }

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `krb5.conf`;
        a.click();

        URL.revokeObjectURL(url);
        this.app.showNotification('💾 Fichier krb5.conf téléchargé !', 'success');
    }

    // Méthodes utilitaires pour les attaques Kerberos
    generateAttackConfig(attackType) {
        const baseConfig = this.app.getData('kerberos');
        let specialConfig = '';

        switch (attackType) {
            case 'kerberoasting':
                specialConfig = this.generateKerberoastingConfig(baseConfig);
                break;
            case 'asreproasting':
                specialConfig = this.generateASREPRoastingConfig(baseConfig);
                break;
            case 'golden_ticket':
                specialConfig = this.generateGoldenTicketConfig(baseConfig);
                break;
            case 'silver_ticket':
                specialConfig = this.generateSilverTicketConfig(baseConfig);
                break;
        }

        return specialConfig;
    }

    generateKerberoastingConfig(baseConfig) {
        return `# Configuration optimisée pour Kerberoasting
# Utilise RC4-HMAC pour forcer des hashes plus faibles

[libdefaults]
    default_realm = ${baseConfig.domain || 'TARGET.LOCAL'}
    default_tgs_enctypes = rc4-hmac
    default_tkt_enctypes = rc4-hmac
    permitted_enctypes = rc4-hmac
    dns_lookup_realm = false
    dns_lookup_kdc = false

[realms]
    ${baseConfig.domain || 'TARGET.LOCAL'} = {
        kdc = ${baseConfig.kdc || '192.168.1.10'}:88
        admin_server = ${baseConfig.adminServer || baseConfig.kdc + ':749'}
        default_tgs_enctypes = rc4-hmac
    }
`;
    }

    generateASREPRoastingConfig(baseConfig) {
        return `# Configuration pour ASREPRoasting
# Optimisée pour les comptes sans pré-authentification

[libdefaults]
    default_realm = ${baseConfig.domain || 'TARGET.LOCAL'}
    default_tkt_enctypes = rc4-hmac
    permitted_enctypes = rc4-hmac
    dns_lookup_realm = false
    dns_lookup_kdc = false
    # Désactiver la pré-authentification pour les tests
    preauth = false

[realms]
    ${baseConfig.domain || 'TARGET.LOCAL'} = {
        kdc = ${baseConfig.kdc || '192.168.1.10'}:88
        admin_server = ${baseConfig.adminServer || baseConfig.kdc + ':749'}
    }
`;
    }

    generateGoldenTicketConfig(baseConfig) {
        return `# Configuration pour Golden Ticket attacks
# Nécessite le hash KRBTGT

[libdefaults]
    default_realm = ${baseConfig.domain || 'TARGET.LOCAL'}
    forwardable = true
    proxiable = true
    renewable = true
    dns_lookup_realm = false
    dns_lookup_kdc = false

[realms]
    ${baseConfig.domain || 'TARGET.LOCAL'} = {
        kdc = ${baseConfig.kdc || '192.168.1.10'}:88
        admin_server = ${baseConfig.adminServer || baseConfig.kdc + ':749'}
        # Golden ticket configuration
        default_domain = ${baseConfig.domain?.toLowerCase() || 'target.local'}
    }

# Commandes pour Golden Ticket:
# python ticketer.py -nthash <KRBTGT_HASH> -domain-sid <DOMAIN_SID> -domain ${baseConfig.domain?.toLowerCase() || 'target.local'} Administrator
`;
    }

    generateSilverTicketConfig(baseConfig) {
        return baseConfig + `

# Configuration optimisée pour Silver Ticket
[libdefaults]
    # Désactiver la vérification PKINIT pour les tickets forgés
    pkinit_require_crl_checking = false
    pkinit_require_hostname_match = false
    
    # Optimisations pour l'injection de tickets
    verify_ap_req_nofail = false
    
# Configuration pour l'injection de tickets service
[realms]
    ${this.currentConfig.domain} = {
        # KDC secondaire pour backup
        kdc = ${this.currentConfig.kdc}:88
        kdc = ${this.currentConfig.dc}:88
        master_kdc = ${this.currentConfig.kdc}:88
        
        # Services cibles pour Silver Tickets
        default_domain = ${this.currentConfig.domain.toLowerCase()}
    }
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
            console.error('❌ Erreur génération config Kerberos pour export:', error);
            return null;
        }
    }
}; 