/**
 * Config Generator - Module Core
 * Fonctionnalités de base et navigation
 */

window.ConfigCore = class ConfigCore {
    constructor(app) {
        this.app = app;
        this.notifications = [];
        this.currentTheme = 'dark';
    }

    async init() {
        console.log('⚙️ Initialisation du module Core...');
        this.setupNavigation();
        this.setupNotifications();
        this.setupTheme();
        this.setupGlobalEvents();
        this.loadStoredData();
    }

    setupNavigation() {
        // Navigation entre onglets
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const tabId = e.target.dataset.tab;
                this.switchTab(tabId);
            });
        });

        // Navigation clavier
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case '1':
                        e.preventDefault();
                        this.switchTab('hosts');
                        break;
                    case '2':
                        e.preventDefault();
                        this.switchTab('kerberos');
                        break;
                    case '3':
                        e.preventDefault();
                        this.switchTab('proxychains');
                        break;
                    case '4':
                        e.preventDefault();
                        this.switchTab('tools');
                        break;
                    case 's':
                        e.preventDefault();
                        this.saveAllData();
                        break;
                    case 'e':
                        e.preventDefault();
                        this.exportAllConfigs();
                        break;
                }
            }
        });

        // Raccourcis dans la sidebar
        this.addKeyboardHints();
    }

    switchTab(tabId) {
        // Sauvegarder l'état de l'onglet actuel
        this.saveCurrentTabData();

        // Masquer tous les onglets
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.style.display = 'none';
        });

        // Désactiver tous les boutons
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });

        // Activer le nouvel onglet
        const targetTab = document.getElementById(`${tabId}-tab`);
        const targetButton = document.querySelector(`[data-tab="${tabId}"]`);

        if (targetTab && targetButton) {
            targetTab.style.display = 'block';
            targetButton.classList.add('active');
            this.app.currentTab = tabId;

            // Notifier le module correspondant
            const module = this.app.getModule(tabId);
            if (module && typeof module.onTabActivated === 'function') {
                module.onTabActivated();
            }

            // Mettre à jour l'URL sans recharger
            const url = new URL(window.location);
            url.searchParams.set('tab', tabId);
            window.history.replaceState({}, '', url);
        }
    }

    addKeyboardHints() {
        const hints = document.createElement('div');
        hints.className = 'keyboard-hints';
        hints.innerHTML = `
            <h4>🎯 Raccourcis clavier</h4>
            <div class="shortcuts-grid">
                <div><kbd>Ctrl+1</kbd> /etc/hosts</div>
                <div><kbd>Ctrl+2</kbd> Kerberos</div>
                <div><kbd>Ctrl+3</kbd> ProxyChains</div>
                <div><kbd>Ctrl+4</kbd> Outils</div>
                <div><kbd>Ctrl+S</kbd> Sauvegarder</div>
                <div><kbd>Ctrl+E</kbd> Exporter tout</div>
            </div>
        `;

        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.appendChild(hints);
        }
    }

    setupNotifications() {
        // Créer le conteneur de notifications s'il n'existe pas
        if (!document.getElementById('notifications-container')) {
            const container = document.createElement('div');
            container.id = 'notifications-container';
            container.className = 'notifications-container';
            document.body.appendChild(container);
        }
    }

    showNotification(message, type = 'info', duration = 4000) {
        const notification = {
            id: Date.now(),
            message,
            type,
            timestamp: new Date()
        };

        this.notifications.push(notification);

        // Créer l'élément DOM
        const notifElement = this.createNotificationElement(notification);
        const container = document.getElementById('notifications-container');
        
        if (container) {
            container.appendChild(notifElement);

            // Animation d'entrée
            setTimeout(() => {
                notifElement.classList.add('show');
            }, 100);

            // Auto-suppression
            setTimeout(() => {
                this.removeNotification(notification.id);
            }, duration);
        }

        // Limiter le nombre de notifications
        if (this.notifications.length > 5) {
            const oldestId = this.notifications[0].id;
            this.removeNotification(oldestId);
        }

        console.log(`[${type.toUpperCase()}] ${message}`);
    }

    createNotificationElement(notification) {
        const div = document.createElement('div');
        div.className = `notification notification-${notification.type}`;
        div.dataset.id = notification.id;

        const icon = this.getNotificationIcon(notification.type);
        
        div.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${icon}</span>
                <span class="notification-message">${notification.message}</span>
                <button class="notification-close" onclick="window.configGenerator.getModule('core').removeNotification(${notification.id})">×</button>
            </div>
        `;

        return div;
    }

    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    removeNotification(id) {
        const element = document.querySelector(`[data-id="${id}"]`);
        if (element) {
            element.classList.add('hide');
            setTimeout(() => {
                element.remove();
            }, 300);
        }

        this.notifications = this.notifications.filter(n => n.id !== id);
    }

    setupTheme() {
        // Détecter le thème stocké ou préféré
        const storedTheme = localStorage.getItem('config-generator-theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        this.currentTheme = storedTheme || (prefersDark ? 'dark' : 'light');
        this.applyTheme(this.currentTheme);

        // Bouton de basculement de thème
        this.createThemeToggle();

        // Écouter les changements de préférence système
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('config-generator-theme')) {
                this.currentTheme = e.matches ? 'dark' : 'light';
                this.applyTheme(this.currentTheme);
            }
        });
    }

    createThemeToggle() {
        const themeToggle = document.createElement('button');
        themeToggle.className = 'theme-toggle';
        themeToggle.innerHTML = this.currentTheme === 'dark' ? '🌙' : '☀️';
        themeToggle.title = 'Basculer le thème';
        
        themeToggle.addEventListener('click', () => {
            this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
            this.applyTheme(this.currentTheme);
            localStorage.setItem('config-generator-theme', this.currentTheme);
        });

        // Ajouter au header ou sidebar
        const header = document.querySelector('.intro-card') || document.querySelector('header');
        if (header) {
            header.appendChild(themeToggle);
        }
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.innerHTML = theme === 'dark' ? '🌙' : '☀️';
        }
    }

    setupGlobalEvents() {
        // Sauvegarde automatique
        setInterval(() => {
            this.autoSave();
        }, 30000); // Toutes les 30 secondes

        // Sauvegarde avant fermeture
        window.addEventListener('beforeunload', (e) => {
            this.saveAllData();
        });

        // Gestion des erreurs globales
        window.addEventListener('error', (e) => {
            console.error('Erreur globale:', e.error);
            this.showNotification('❌ Une erreur inattendue s\'est produite', 'error');
        });

        // Gestion responsive
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Focus/blur pour optimiser les performances
        window.addEventListener('focus', () => {
            this.onWindowFocus();
        });

        window.addEventListener('blur', () => {
            this.onWindowBlur();
        });
    }

    handleResize() {
        // Ajustements responsive si nécessaire
        const sidebar = document.getElementById('sidebar');
        const isMobile = window.innerWidth < 768;
        
        if (sidebar) {
            if (isMobile) {
                sidebar.classList.add('mobile');
            } else {
                sidebar.classList.remove('mobile');
            }
        }
    }

    onWindowFocus() {
        // Reprendre les timers/animations si nécessaire
        console.log('Application refocalisée');
    }

    onWindowBlur() {
        // Pausser les timers/animations pour économiser les ressources
        this.saveAllData();
    }

    loadStoredData() {
        try {
            const storedData = localStorage.getItem('config-generator-data');
            if (storedData) {
                const data = JSON.parse(storedData);
                this.app.data = { ...this.app.data, ...data };
                console.log('📁 Données restaurées depuis localStorage');
            }
        } catch (error) {
            console.warn('Erreur chargement données:', error);
        }

        // Charger l'onglet depuis l'URL
        const urlParams = new URLSearchParams(window.location.search);
        const tabFromUrl = urlParams.get('tab');
        if (tabFromUrl && ['hosts', 'kerberos', 'proxychains', 'tools'].includes(tabFromUrl)) {
            this.switchTab(tabFromUrl);
        } else {
            this.switchTab('hosts'); // Onglet par défaut
        }
    }

    saveCurrentTabData() {
        const currentModule = this.app.getModule(this.app.currentTab);
        if (currentModule && typeof currentModule.saveState === 'function') {
            currentModule.saveState();
        }
    }

    saveAllData() {
        try {
            // Sauvegarder l'état de tous les modules
            ['hosts', 'kerberos', 'proxychains'].forEach(tabId => {
                const module = this.app.getModule(tabId);
                if (module && typeof module.saveState === 'function') {
                    module.saveState();
                }
            });

            // Sauvegarder en localStorage
            localStorage.setItem('config-generator-data', JSON.stringify(this.app.data));
            console.log('💾 Données sauvegardées');
            
        } catch (error) {
            console.error('Erreur sauvegarde:', error);
            this.showNotification('❌ Erreur lors de la sauvegarde', 'error');
        }
    }

    autoSave() {
        this.saveAllData();
        // this.showNotification('💾 Sauvegarde automatique', 'info', 1000);
    }

    exportAllConfigs() {
        try {
            const allConfigs = {};
            const timestamp = new Date().toISOString().split('T')[0];

            // Collecter toutes les configurations
            ['hosts', 'kerberos', 'proxychains'].forEach(type => {
                const data = this.app.getData(type);
                if (data.lastGenerated) {
                    allConfigs[type] = {
                        content: data.lastGenerated,
                        generatedAt: data.generatedAt || new Date().toISOString(),
                        metadata: this.getConfigMetadata(type, data)
                    };
                }
            });

            if (Object.keys(allConfigs).length === 0) {
                this.showNotification('⚠️ Aucune configuration à exporter', 'warning');
                return;
            }

            // Créer un ZIP ou fichier combiné
            this.createConfigPackage(allConfigs, timestamp);
            
        } catch (error) {
            console.error('Erreur export:', error);
            this.showNotification('❌ Erreur lors de l\'export', 'error');
        }
    }

    getConfigMetadata(type, data) {
        const metadata = {
            type,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };

        switch (type) {
            case 'hosts':
                metadata.entries = data.entries?.length || 0;
                metadata.domains = [...new Set(data.entries?.map(e => e.domain).filter(Boolean))].length || 0;
                break;
            case 'kerberos':
                metadata.domain = data.domain || 'N/A';
                metadata.kdc = data.kdc || 'N/A';
                break;
            case 'proxychains':
                metadata.proxies = data.proxies?.length || 0;
                metadata.chainType = data.chainType || 'N/A';
                break;
        }

        return metadata;
    }

    createConfigPackage(allConfigs, timestamp) {
        // Créer un fichier texte avec toutes les configurations
        let packageContent = `# Configuration Package - Generated on ${new Date().toLocaleString()}\n`;
        packageContent += `# Config Generator v1.0\n\n`;

        Object.entries(allConfigs).forEach(([type, config]) => {
            const separator = '='.repeat(60);
            packageContent += `${separator}\n`;
            packageContent += `# ${type.toUpperCase()} CONFIGURATION\n`;
            packageContent += `# Generated: ${new Date(config.generatedAt).toLocaleString()}\n`;
            packageContent += `# Metadata: ${JSON.stringify(config.metadata, null, 2)}\n`;
            packageContent += `${separator}\n\n`;
            packageContent += config.content;
            packageContent += `\n\n`;
        });

        // Télécharger le package
        const blob = new Blob([packageContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `config-package-${timestamp}.txt`;
        a.click();

        URL.revokeObjectURL(url);
        this.showNotification('📦 Package de configuration téléchargé !', 'success');
    }

    // Méthodes utilitaires
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatTime(date) {
        return new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Validation et utilitaires
    validateIP(ip) {
        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return ipRegex.test(ip);
    }

    validateDomain(domain) {
        const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
        return domainRegex.test(domain);
    }

    validatePort(port) {
        const portNum = parseInt(port);
        return !isNaN(portNum) && portNum > 0 && portNum <= 65535;
    }

    // Diagnostic et debug
    getDiagnostics() {
        const diag = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            theme: this.currentTheme,
            currentTab: this.app.currentTab,
            dataSize: JSON.stringify(this.app.data).length,
            notifications: this.notifications.length,
            modules: {}
        };

        // État des modules
        ['hosts', 'kerberos', 'proxychains'].forEach(moduleId => {
            const module = this.app.getModule(moduleId);
            diag.modules[moduleId] = {
                loaded: !!module,
                hasData: !!this.app.getData(moduleId).lastGenerated
            };
        });

        return diag;
    }

    exportDiagnostics() {
        const diag = this.getDiagnostics();
        const blob = new Blob([JSON.stringify(diag, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `config-generator-diagnostics-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}; 