/**
 * Gestionnaire des données agrégées
 * Affiche tous les credentials de tous les nodes pour faciliter le password spraying
 */

export class AggregatedDataManager {
    constructor(hostManager) {
        this.hostManager = hostManager;
        this.showSources = false; // Par défaut : affichage brut sans sources
        this.cachedData = { usernames: new Set(), passwords: new Set(), hashes: new Set(), credentialsByHost: [] };
    }

    initialize() {
        console.log(">>> AggregatedDataManager.initialize: START");
        this.addToggleButton();
        this.setupEventListeners();
        this.updateAggregatedData();
        console.log(">>> AggregatedDataManager.initialize: END");
    }

    addToggleButton() {
        // Ajouter un bouton de toggle dans l'en-tête de la section
        const aggregatedSection = document.querySelector('.aggregated-data-section .card-header');
        if (aggregatedSection) {
            const toggleButton = document.createElement('button');
            toggleButton.className = 'btn btn-sm btn-outline-secondary ml-2';
            toggleButton.innerHTML = '👁️ Sources: OFF';
            toggleButton.title = 'Basculer entre affichage avec/sans sources';
            toggleButton.addEventListener('click', () => this.toggleSources());
            
            aggregatedSection.appendChild(toggleButton);
            this.toggleButton = toggleButton;
        }
    }

    toggleSources() {
        this.showSources = !this.showSources;
        this.updateToggleButton();
        this.refreshDisplay();
    }

    updateToggleButton() {
        if (this.toggleButton) {
            this.toggleButton.innerHTML = this.showSources ? '👁️ Sources: ON' : '👁️ Sources: OFF';
            this.toggleButton.className = this.showSources 
                ? 'btn btn-sm btn-info ml-2' 
                : 'btn btn-sm btn-outline-secondary ml-2';
        }
    }

    refreshDisplay() {
        // Rafraîchir l'affichage avec les données en cache
        this.updateUsernamesDisplay(this.cachedData.usernames, this.cachedData.credentialsByHost);
        this.updatePasswordsDisplay(this.cachedData.passwords, this.cachedData.credentialsByHost);
        this.updateHashesDisplay(this.cachedData.hashes, this.cachedData.credentialsByHost);
    }

    setupEventListeners() {
        // Ajouter les event listeners pour copier au clic
        const copyableElements = document.querySelectorAll('.copyable-data');
        copyableElements.forEach(element => {
            element.addEventListener('click', () => this.copyToClipboard(element));
        });
    }

    updateAggregatedData() {
        console.log(">>> updateAggregatedData: START");
        
        const allUsernames = new Set();
        const allPasswords = new Set();
        const allHashes = new Set();
        const credentialsByHost = [];

        // Parcourir toutes les catégories et tous les hosts
        for (const [categoryName, category] of Object.entries(this.hostManager.hostData.categories || {})) {
            for (const [hostId, host] of Object.entries(category.hosts || {})) {
                if (host.credentials && host.credentials.length > 0) {
                    host.credentials.forEach(cred => {
                        // Ajouter les credentials avec information sur l'host source
                        if (cred.username && cred.username.trim()) {
                            allUsernames.add(cred.username.trim());
                            credentialsByHost.push({
                                type: 'username',
                                value: cred.username.trim(),
                                host: hostId,
                                category: categoryName,
                                password: cred.password || '',
                                hash: cred.hash || ''
                            });
                        }
                        
                        if (cred.password && cred.password.trim()) {
                            allPasswords.add(cred.password.trim());
                            if (!cred.username) {
                                credentialsByHost.push({
                                    type: 'password',
                                    value: cred.password.trim(),
                                    host: hostId,
                                    category: categoryName
                                });
                            }
                        }
                        
                        if (cred.hash && cred.hash.trim()) {
                            allHashes.add(cred.hash.trim());
                            if (!cred.username && !cred.password) {
                                credentialsByHost.push({
                                    type: 'hash',
                                    value: cred.hash.trim(),
                                    host: hostId,
                                    category: categoryName
                                });
                            }
                        }
                    });
                }
            }
        }

        // Mettre en cache les données
        this.cachedData = { usernames: allUsernames, passwords: allPasswords, hashes: allHashes, credentialsByHost };

        // Mettre à jour l'affichage
        this.refreshDisplay();

        console.log(`>>> updateAggregatedData: ${allUsernames.size} usernames, ${allPasswords.size} passwords, ${allHashes.size} hashes`);
        console.log(">>> updateAggregatedData: END");
    }

    updateUsernamesDisplay(allUsernames, credentialsByHost) {
        const usernamesElement = document.getElementById('allUsernames');
        if (usernamesElement) {
            if (allUsernames.size === 0) {
                usernamesElement.textContent = 'Aucun nom d\'utilisateur trouvé.';
            } else {
                let displayText = '';
                const sortedUsernames = [...allUsernames].sort();
                
                if (this.showSources) {
                    // Mode avec sources
                    sortedUsernames.forEach(username => {
                        const hostsWithThisUser = credentialsByHost
                            .filter(c => c.type === 'username' && c.value === username)
                            .map(c => `${c.host} (${c.category})`)
                            .join(', ');
                        
                        displayText += `${username}\n`;
                        if (hostsWithThisUser) {
                            displayText += `  └─ Sources: ${hostsWithThisUser}\n`;
                        }
                    });
                } else {
                    // Mode brut - juste les usernames
                    displayText = sortedUsernames.join('\n');
                }
                
                usernamesElement.textContent = displayText;
            }
            
            const modeText = this.showSources ? ' (avec sources)' : ' (données brutes)';
            usernamesElement.title = `${allUsernames.size} usernames uniques trouvés${modeText}. Cliquer pour copier.`;
        }
    }

    updatePasswordsDisplay(allPasswords, credentialsByHost) {
        const passwordsElement = document.getElementById('allPasswords');
        if (passwordsElement) {
            if (allPasswords.size === 0) {
                passwordsElement.textContent = 'Aucun mot de passe trouvé.';
            } else {
                let displayText = '';
                const sortedPasswords = [...allPasswords].sort();
                
                if (this.showSources) {
                    // Mode avec sources
                    sortedPasswords.forEach(password => {
                        const hostsWithThisPassword = credentialsByHost
                            .filter(c => c.value === password || c.password === password)
                            .map(c => `${c.host} (${c.category})`)
                            .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
                            .join(', ');
                        
                        displayText += `${password}\n`;
                        if (hostsWithThisPassword) {
                            displayText += `  └─ Sources: ${hostsWithThisPassword}\n`;
                        }
                    });
                } else {
                    // Mode brut - juste les passwords
                    displayText = sortedPasswords.join('\n');
                }
                
                passwordsElement.textContent = displayText;
            }
            
            const modeText = this.showSources ? ' (avec sources)' : ' (données brutes)';
            passwordsElement.title = `${allPasswords.size} mots de passe uniques trouvés${modeText}. Cliquer pour copier.`;
        }
    }

    updateHashesDisplay(allHashes, credentialsByHost) {
        const hashesElement = document.getElementById('allHashes');
        if (hashesElement) {
            if (allHashes.size === 0) {
                hashesElement.textContent = 'Aucun hash trouvé.';
            } else {
                let displayText = '';
                const sortedHashes = [...allHashes].sort();
                
                if (this.showSources) {
                    // Mode avec sources
                    sortedHashes.forEach(hash => {
                        const hostsWithThisHash = credentialsByHost
                            .filter(c => c.value === hash || c.hash === hash)
                            .map(c => `${c.host} (${c.category})`)
                            .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
                            .join(', ');
                        
                        // Affichage tronqué du hash pour la lisibilité
                        const displayHash = hash.length > 50 ? hash.substring(0, 47) + '...' : hash;
                        displayText += `${displayHash}\n`;
                        if (hostsWithThisHash) {
                            displayText += `  └─ Sources: ${hostsWithThisHash}\n`;
                        }
                    });
                } else {
                    // Mode brut - juste les hashes complets
                    displayText = sortedHashes.join('\n');
                }
                
                hashesElement.textContent = displayText;
            }
            
            const modeText = this.showSources ? ' (avec sources)' : ' (données brutes)';
            hashesElement.title = `${allHashes.size} hashes uniques trouvés${modeText}. Cliquer pour copier.`;
        }
    }

    copyToClipboard(element) {
        try {
            // En mode brut, copier directement le contenu
            // En mode sources, nettoyer le texte pour enlever les sources
            let textToCopy = element.textContent;
            
            if (this.showSources && textToCopy.includes('└─ Sources:')) {
                const lines = textToCopy.split('\n');
                const cleanedLines = lines.filter(line => 
                    line.trim() && !line.includes('└─ Sources:')
                );
                textToCopy = cleanedLines.join('\n');
            }
            
            navigator.clipboard.writeText(textToCopy).then(() => {
                // Visual feedback
                const originalBg = element.style.backgroundColor;
                element.style.backgroundColor = '#d4edda';
                
                // Show notification
                this.showCopyNotification(element);
                
                setTimeout(() => {
                    element.style.backgroundColor = originalBg;
                }, 1000);
            }).catch(err => {
                console.error('Erreur copie dans le presse-papiers:', err);
                // Fallback pour anciens navigateurs
                this.fallbackCopyToClipboard(textToCopy);
            });
        } catch (error) {
            console.error('Erreur lors de la copie:', error);
        }
    }

    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            console.log('Copie réussie avec fallback');
        } catch (err) {
            console.error('Échec de la copie avec fallback:', err);
        }
        
        document.body.removeChild(textArea);
    }

    showCopyNotification(element) {
        const notification = document.createElement('div');
        notification.textContent = '✓ Copié!';
        notification.style.cssText = `
            position: absolute;
            background: #28a745;
            color: white;
            padding: 5px 10px;
            border-radius: 3px;
            font-size: 12px;
            z-index: 1000;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        // Position relative à l'élément
        const rect = element.getBoundingClientRect();
        notification.style.left = rect.left + 'px';
        notification.style.top = (rect.top - 30) + 'px';
        
        document.body.appendChild(notification);
        
        // Animation
        setTimeout(() => notification.style.opacity = '1', 10);
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 1500);
    }
} 