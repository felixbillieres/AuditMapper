// Configuration globale
let currentResults = [];
let extractionHistory = JSON.parse(localStorage.getItem('grepHistory')) || [];
let currentExtractionType = '';

// Patterns de détection automatique améliorés
const detectionPatterns = {
    secretsdump: /^[^:]+:\d+:[a-fA-F0-9]{32}:[a-fA-F0-9]{32}:::/m,
    mimikatz: /Authentication Id\s*:\s*0\s*;\s*\d+|Username\s*:\s*\w+.*Domain\s*:\s*\w+/mi,
    sam: /^[^:]+:\d+:[a-fA-F0-9]{32}:[a-fA-F0-9]{32}:::/m,
    lsass: /Authentication Id\s*:\s*0\s*;\s*\d+.*Session\s*:\s*\w+.*User Name\s*:\s*\w+/mi,
    rpcclient: /user:\[[^\]]+\]\s+rid:\[0x[a-fA-F0-9]+\]/mi,
    ldap: /sAMAccountName:\s*\w+|uid=\w+/mi,
    passwd: /^[^:]+:x:\d+:\d+:[^:]*:[^:]*:[^:]*$/m,
    shadow: /^[^:]+:\$\d+\$[^:]+:/m,
    nmap: /Nmap scan report|PORT\s+STATE\s+SERVICE/mi,
    bloodhound: /"ObjectIdentifier"|"Properties"/mi,
    crackmapexec: /SMB\s+\d+\.\d+\.\d+\.\d+|MSSQL\s+\d+\.\d+\.\d+\.\d+/mi
};

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadHistory();
    updateStats();
    updateExtractionCounts();
});

// Event listeners
function initializeEventListeners() {
    // Input textarea
    const rawOutput = document.getElementById('rawOutput');
    if (rawOutput) {
        rawOutput.addEventListener('input', debounce(handleInputChange, 300));
        rawOutput.addEventListener('paste', handlePaste);
    }
    
    // Boutons de contrôle
    const clearBtn = document.getElementById('clearInput');
    if (clearBtn) clearBtn.addEventListener('click', clearInput);
    
    const loadBtn = document.getElementById('loadSample');
    if (loadBtn) loadBtn.addEventListener('click', loadSample);
    
    // Bouton Analyser principal
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) analyzeBtn.addEventListener('click', forceRefreshAnalysis);
    
    // Sélecteur de type d'output
    const outputTypeSelect = document.getElementById('outputType');
    if (outputTypeSelect) outputTypeSelect.addEventListener('change', handleOutputTypeChange);
    
    // Boutons d'extraction rapide
    const extractBtns = [
        { id: 'extractUsers', type: 'users' },
        { id: 'extractHashes', type: 'hashes' },
        { id: 'extractPasswords', type: 'passwords' },
        { id: 'extractDomains', type: 'domains' },
        { id: 'extractIps', type: 'ips' },
        { id: 'extractEmails', type: 'emails' }
    ];
    
    extractBtns.forEach(btn => {
        const element = document.getElementById(btn.id);
        if (element) element.addEventListener('click', () => extractData(btn.type));
    });
    
    // Boutons d'extraction avancée
    const advancedBtns = [
        { id: 'extractCredentials', type: 'credentials' },
        { id: 'extractKerberos', type: 'kerberos' },
        { id: 'extractSecrets', type: 'secrets' },
        { id: 'extractMachineAccounts', type: 'machineAccounts' },
        { id: 'extractServices', type: 'services' },
        { id: 'extractPorts', type: 'ports' }
    ];
    
    advancedBtns.forEach(btn => {
        const element = document.getElementById(btn.id);
        if (element) element.addEventListener('click', () => extractData(btn.type));
    });
    
    // Contrôles des résultats
    const copyBtn = document.getElementById('copyResults');
    if (copyBtn) copyBtn.addEventListener('click', copyResults);
    
    const saveBtn = document.getElementById('saveResults');
    if (saveBtn) saveBtn.addEventListener('click', saveResults);
    
    const clearResultsBtn = document.getElementById('clearResults');
    if (clearResultsBtn) clearResultsBtn.addEventListener('click', clearResults);
    
    const outputFormatSelect = document.getElementById('outputFormat');
    if (outputFormatSelect) outputFormatSelect.addEventListener('change', updateResultsDisplay);
    
    // Onglets
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', switchTab);
    });
    
    // Historique
    const clearHistoryBtn = document.getElementById('clearHistory');
    if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', clearHistory);
    
    const exportHistoryBtn = document.getElementById('exportHistory');
    if (exportHistoryBtn) exportHistoryBtn.addEventListener('click', exportHistory);
}

// Fonction manquante handleInputChange
function handleInputChange() {
    updateStats();
    detectOutputType();
    updateExtractionCounts();
}

// Nouvelle fonction de rafraîchissement forcé
function forceRefreshAnalysis() {
    const rawOutput = document.getElementById('rawOutput');
    if (!rawOutput || !rawOutput.value.trim()) {
        showNotification('Aucune donnée à analyser', 'warning');
        return;
    }
    
    // Animation du bouton
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) {
        analyzeBtn.innerHTML = '<span class="btn-icon">⏳</span>Analyse...';
        analyzeBtn.disabled = true;
    }
    
    setTimeout(() => {
        updateStats();
        detectOutputType();
        updateExtractionCounts();
        
        if (analyzeBtn) {
            analyzeBtn.innerHTML = '<span class="btn-icon">🔍</span>Analyser';
            analyzeBtn.disabled = false;
        }
        
        showNotification('Analyse terminée!', 'success');
    }, 500);
}

// Fonction debounce pour éviter trop d'appels
function debounce(func, wait) {
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

// Gestion améliorée du paste
function handlePaste(event) {
    // Petite animation pour indiquer que quelque chose se passe
    const textarea = event.target;
    textarea.style.borderColor = 'var(--grep-primary)';
    
    setTimeout(() => {
        updateStats();
        detectOutputType();
        updateExtractionCounts();
        
        textarea.style.borderColor = '';
        showNotification('Données collées et analysées!', 'info');
    }, 200);
}

// Gestion du changement de type d'output
function handleOutputTypeChange() {
    const outputType = document.getElementById('outputType').value;
    const detectedElement = document.getElementById('detectedType');
    
    if (outputType === 'auto') {
        detectOutputType();
    } else {
        if (detectedElement) detectedElement.textContent = outputType;
    }
    
    updateExtractionCounts();
}

// Détection automatique améliorée
function detectOutputType() {
    const rawOutput = document.getElementById('rawOutput');
    const outputTypeSelect = document.getElementById('outputType');
    const detectedElement = document.getElementById('detectedType');
    if (!rawOutput || !outputTypeSelect || !detectedElement) return;
    if (outputTypeSelect.value !== 'auto') {
        detectedElement.textContent = outputTypeSelect.value;
        detectedElement.style.opacity = 1;
        return;
    }
    let detectedType = 'generic';
    let confidence = 0;
    const detectionTests = [
        { type: 'secretsdump', pattern: /^[^:]+:\d+:[a-fA-F0-9]{32}:[a-fA-F0-9]{32}:::/m, score: 3 },
        { type: 'mimikatz', pattern: /Authentication Id\s*:\s*0\s*;\s*\d+|Username\s*:\s*\w+.*Domain\s*:\s*\w+/mi, score: 3 },
        { type: 'sam', pattern: /^[^:]+:\d+:[a-fA-F0-9]{32}:[a-fA-F0-9]{32}:::/m, score: 2 },
        { type: 'lsass', pattern: /Authentication Id\s*:\s*0\s*;\s*\d+.*Session\s*:\s*\w+.*User Name\s*:\s*\w+/mi, score: 2 },
        { type: 'rpcclient', pattern: /user:\[[^\]]+\]\s+rid:\[0x[a-fA-F0-9]+\]/mi, score: 2 },
        { type: 'ldap', pattern: /sAMAccountName:\s*\w+|uid=\w+/mi, score: 2 },
        { type: 'passwd', pattern: /^[^:]+:x:\d+:\d+:[^:]*:[^:]*:[^:]*$/m, score: 2 },
        { type: 'shadow', pattern: /^[^:]+:\$\d+\$[^:]+:/m, score: 2 },
        { type: 'nmap', pattern: /Nmap scan report|PORT\s+STATE\s+SERVICE/mi, score: 2 },
        { type: 'generic', pattern: /./, score: 1 }
    ];
    detectionTests.forEach(test => {
        if (test.pattern.test(rawOutput.value)) {
            if (test.score > confidence) {
                detectedType = test.type;
                confidence = test.score;
            }
        }
    });
    detectedElement.textContent = detectedType;
    detectedElement.style.opacity = 1;
}

// Mise à jour des statistiques
function updateStats() {
    const rawOutput = document.getElementById('rawOutput');
    const lineCountElement = document.getElementById('lineCount');
    const charCountElement = document.getElementById('charCount');
    
    if (!rawOutput || !lineCountElement || !charCountElement) return;
    
    const lines = rawOutput.value.split('\n').filter(line => line.trim()).length;
    const chars = rawOutput.value.length;
    
    lineCountElement.textContent = lines;
    charCountElement.textContent = chars.toLocaleString();
}

// Mise à jour des compteurs d'extraction
function updateExtractionCounts() {
    const rawOutput = document.getElementById('rawOutput').value;
    const outputType = document.getElementById('outputType').value;
    const types = ['users', 'hashes', 'passwords', 'domains', 'ips', 'emails'];

    if (!rawOutput.trim()) {
        types.forEach(type => {
            const countSpan = document.getElementById(type + 'Count');
            const badge = document.getElementById(type + 'Badge');
            if (countSpan) countSpan.textContent = '0';
            if (badge) {
                badge.textContent = '0';
                badge.style.display = 'none';
            }
        });
        return;
    }

    const counts = {
        users: countUsers(rawOutput, outputType),
        hashes: countHashes(rawOutput, outputType),
        passwords: countPasswords(rawOutput, outputType),
        domains: countDomains(rawOutput, outputType),
        ips: countIps(rawOutput, outputType),
        emails: countEmails(rawOutput, outputType)
    };

    types.forEach(type => {
        const countSpan = document.getElementById(type + 'Count');
        const badge = document.getElementById(type + 'Badge');
        if (countSpan) countSpan.textContent = counts[type];
        if (badge) {
            badge.textContent = counts[type];
            badge.style.display = counts[type] > 0 ? 'flex' : 'none';
        }
    });
}

// Fonctions de comptage simplifiées
function countUsers(text, outputType) {
    const users = new Set();
    
    // Patterns selon le type
    switch (outputType) {
        case 'secretsdump':
        case 'sam':
            const samMatches = text.match(/^([^:]+):\d+:/gm);
            if (samMatches) {
                samMatches.forEach(match => {
                    const user = match.split(':')[0];
                    if (user && user !== 'Guest') users.add(user);
                });
            }
            break;
            
        case 'mimikatz':
        case 'lsass':
            const mimikatzUsers = text.match(/\*\s*Username\s*:\s*([^\r\n]+)/gi);
            if (mimikatzUsers) {
                mimikatzUsers.forEach(match => {
                    const user = match.replace(/\*\s*Username\s*:\s*/i, '').trim();
                    if (user && user !== '(null)' && user !== 'SYSTEM') users.add(user);
                });
            }
            break;
            
        case 'rpcclient':
            const rpcUsers = text.match(/user:\[([^\]]+)\]/gi);
            if (rpcUsers) {
                rpcUsers.forEach(match => {
                    const user = match.match(/user:\[([^\]]+)\]/i)[1];
                    if (user) users.add(user);
                });
            }
            break;
            
        case 'passwd':
            const passwdUsers = text.match(/^([^:]+):x:/gm);
            if (passwdUsers) {
                passwdUsers.forEach(match => {
                    const user = match.split(':')[0];
                    if (user && !user.startsWith('_') && user !== 'nobody') users.add(user);
                });
            }
            break;
            
        case 'shadow':
            const shadowUsers = text.match(/^([^:]+):\$/gm);
            if (shadowUsers) {
                shadowUsers.forEach(match => {
                    const user = match.split(':')[0];
                    if (user) users.add(user);
                });
            }
            break;
            
        default:
            // Détection générique
            const genericUsers = text.match(/(?:user|username|login)[\s:=]+([a-zA-Z0-9_.-]+)/gi);
            if (genericUsers) {
                genericUsers.forEach(match => {
                    const user = match.split(/[\s:=]+/)[1];
                    if (user && user.length > 2) users.add(user);
                });
            }
    }
    
    return users.size;
}

function countHashes(text, outputType) {
    const hashes = new Set();
    
    // NTLM hashes (32 caractères)
    const ntlmMatches = text.match(/[a-fA-F0-9]{32}/g);
    if (ntlmMatches) {
        ntlmMatches.forEach(hash => {
            if (hash !== 'aad3b435b51404eeaad3b435b51404ee' && hash !== '31d6cfe0d16ae931b73c59d7e0c089c0') {
                hashes.add(hash);
            }
        });
    }
    
    // SHA1 hashes (40 caractères)
    const sha1Matches = text.match(/[a-fA-F0-9]{40}/g);
    if (sha1Matches) {
        sha1Matches.forEach(hash => {
            if (hash !== 'da39a3ee5e6b4b0d3255bfef95601890afd80709') {
                hashes.add(hash);
            }
        });
    }
    
    // Unix hashes
    const unixHashes = text.match(/\$\d+\$[^:$\s]+/g);
    if (unixHashes) {
        unixHashes.forEach(hash => hashes.add(hash));
    }
    
    return hashes.size;
}

function countPasswords(text, outputType) {
    const passwords = new Set();
    
    // Mimikatz passwords
    const mimikatzPasswords = text.match(/\*\s*Password\s*:\s*([^\r\n]+)/gi);
    if (mimikatzPasswords) {
        mimikatzPasswords.forEach(match => {
            const password = match.replace(/\*\s*Password\s*:\s*/i, '').trim();
            if (password && password !== '(null)' && password.length > 3) {
                passwords.add(password);
            }
        });
    }
    
    return passwords.size;
}

function countDomains(text, outputType) {
    const domains = new Set();
    
    // Mimikatz domains
    const mimikatzDomains = text.match(/\*\s*Domain\s*:\s*([^\r\n]+)/gi);
    if (mimikatzDomains) {
        mimikatzDomains.forEach(match => {
            const domain = match.replace(/\*\s*Domain\s*:\s*/i, '').trim();
            if (domain && domain !== '(null)' && domain !== 'NT AUTHORITY') {
                domains.add(domain);
            }
        });
    }
    
    return domains.size;
}

function countIps(text, outputType) {
    const ips = new Set();
    const ipMatches = text.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g);
    if (ipMatches) {
        ipMatches.forEach(ip => ips.add(ip));
    }
    return ips.size;
}

function countEmails(text, outputType) {
    const emails = new Set();
    const emailMatches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    if (emailMatches) {
        emailMatches.forEach(email => emails.add(email));
    }
    return emails.size;
}

// Fonction d'extraction principale corrigée
function extractData(type) {
    const rawOutput = document.getElementById('rawOutput').value;
    
    if (!rawOutput.trim()) {
        showNotification('Aucune donnée à analyser', 'warning');
        return;
    }
    
    let results = [];
    const outputType = document.getElementById('outputType').value;
    
    try {
        switch (type) {
            case 'users':
                results = extractUsers(rawOutput, outputType);
                break;
            case 'hashes':
                results = extractHashes(rawOutput, outputType);
                break;
            case 'passwords':
                results = extractPasswords(rawOutput, outputType);
                break;
            case 'domains':
                results = extractDomains(rawOutput, outputType);
                break;
            case 'ips':
                results = extractIps(rawOutput, outputType);
                break;
            case 'emails':
                results = extractEmails(rawOutput, outputType);
                break;
            case 'credentials':
                results = extractCredentials(rawOutput, outputType);
                break;
            case 'kerberos':
                results = extractKerberos(rawOutput, outputType);
                break;
            case 'secrets':
                results = extractSecrets(rawOutput, outputType);
                break;
            case 'machineAccounts':
                results = extractMachineAccounts(rawOutput, outputType);
                break;
            case 'services':
                results = extractServices(rawOutput, outputType);
                break;
            case 'ports':
                results = extractPorts(rawOutput, outputType);
                break;
            default:
                showNotification('Type d\'extraction non supporté', 'error');
                return;
        }
        
        if (results.length === 0) {
            showNotification(`Aucun ${type} trouvé`, 'warning');
            return;
        }
        
        currentResults = [...new Set(results)]; // Supprimer les doublons
        currentExtractionType = type;
        
        displayResults(type, currentResults);
        addToHistory(type, currentResults.length, currentResults);
        
        showNotification(`${currentResults.length} ${type} extraits!`, 'success');
        
    } catch (error) {
        console.error('Erreur lors de l\'extraction:', error);
        showNotification('Erreur lors de l\'extraction', 'error');
    }
}

// Fonctions d'extraction corrigées
function extractUsers(text, outputType) {
    const users = new Set();
    
    switch (outputType) {
        case 'secretsdump':
        case 'sam':
            // Format: DOMAIN\username:RID:LMhash:NThash:::
            const secretsdumpMatches = text.match(/^([^\\:]+\\)?([^:]+):\d+:[a-fA-F0-9]{32}:[a-fA-F0-9]{32}:::/gm);
            if (secretsdumpMatches) {
                secretsdumpMatches.forEach(match => {
                    const parts = match.split(':');
                    if (parts.length >= 2) {
                        const userPart = parts[0];
                        const username = userPart.includes('\\') ? userPart.split('\\')[1] : userPart;
                        if (username && username !== 'Guest' && username !== 'DefaultAccount') {
                            users.add(username);
                        }
                    }
                });
            }
            break;
            
        case 'mimikatz':
        case 'lsass':
            // Format: * Username : username
            const mimikatzUsers = text.match(/\*\s*Username\s*:\s*([^\r\n]+)/gi);
            if (mimikatzUsers) {
                mimikatzUsers.forEach(match => {
                    const username = match.replace(/\*\s*Username\s*:\s*/i, '').trim();
                    if (username && username !== '(null)' && username !== 'SYSTEM') {
                        users.add(username);
                    }
                });
            }
            break;
            
        case 'rpcclient':
            // Format: user:[username] rid:[0x...]
            const rpcMatches = text.match(/user:\[([^\]]+)\]/gi);
            if (rpcMatches) {
                rpcMatches.forEach(match => {
                    const username = match.match(/user:\[([^\]]+)\]/i)[1];
                    if (username && username !== 'Guest') {
                        users.add(username);
                    }
                });
            }
            break;
            
        case 'passwd':
            // Format: username:x:uid:gid:...
            const passwdMatches = text.match(/^([^:]+):x:\d+:\d+:/gm);
            if (passwdMatches) {
                passwdMatches.forEach(match => {
                    const username = match.split(':')[0];
                    if (username && !username.startsWith('_') && username !== 'nobody') {
                        users.add(username);
                    }
                });
            }
            break;
            
        case 'shadow':
            // Format: username:$hash$...
            const shadowMatches = text.match(/^([^:]+):\$\d+\$/gm);
            if (shadowMatches) {
                shadowMatches.forEach(match => {
                    const username = match.split(':')[0];
                    if (username) {
                        users.add(username);
                    }
                });
            }
            break;
            
        default:
            // Détection générique
            const genericUsers = text.match(/(?:user|username|login|account)[\s:=]+([a-zA-Z0-9_\-\.]+)/gi);
            if (genericUsers) {
                genericUsers.forEach(match => {
                    const username = match.split(/[\s:=]+/)[1];
                    if (username && username.length > 2) {
                        users.add(username);
                    }
                });
            }
    }
    
    return Array.from(users);
}

function extractHashes(text, outputType) {
    const hashes = new Set();
    
    switch (outputType) {
        case 'secretsdump':
        case 'sam':
            // Format: username:RID:LMhash:NThash:::
            const ntlmMatches = text.match(/^[^:]+:\d+:[a-fA-F0-9]{32}:([a-fA-F0-9]{32}):::/gm);
            if (ntlmMatches) {
                ntlmMatches.forEach(match => {
                    const parts = match.split(':');
                    const ntlmHash = parts[3];
                    if (ntlmHash && ntlmHash !== '31d6cfe0d16ae931b73c59d7e0c089c0') {
                        hashes.add(ntlmHash);
                    }
                });
            }
            break;
            
        case 'mimikatz':
        case 'lsass':
            // Format: * NTLM : hash
            const mimikatzNtlm = text.match(/\*\s*NTLM\s*:\s*([a-fA-F0-9]{32})/gi);
            if (mimikatzNtlm) {
                mimikatzNtlm.forEach(match => {
                    const hash = match.replace(/\*\s*NTLM\s*:\s*/i, '');
                    if (hash !== '31d6cfe0d16ae931b73c59d7e0c089c0') {
                        hashes.add(hash);
                    }
                });
            }
            break;
            
        case 'shadow':
            // Format: username:$type$salt$hash
            const shadowHashes = text.match(/^[^:]+:(\$\d+\$[^:]+)/gm);
            if (shadowHashes) {
                shadowHashes.forEach(match => {
                    const hash = match.split(':')[1];
                    if (hash && hash.startsWith('$')) {
                        hashes.add(hash);
                    }
                });
            }
            break;
            
        default:
            // Détection générique de hashes
            const genericHashes = text.match(/[a-fA-F0-9]{32,}/g);
            if (genericHashes) {
                genericHashes.forEach(hash => {
                    if (hash.length === 32 || hash.length === 40 || hash.length === 64) {
                        hashes.add(hash);
                    }
                });
            }
    }
    
    return Array.from(hashes);
}

function extractPasswords(text, outputType) {
    const passwords = new Set();
    
    switch (outputType) {
        case 'mimikatz':
        case 'lsass':
            // Format: * Password : password
            const mimikatzPasswords = text.match(/\*\s*Password\s*:\s*([^\r\n]+)/gi);
            if (mimikatzPasswords) {
                mimikatzPasswords.forEach(match => {
                    const password = match.replace(/\*\s*Password\s*:\s*/i, '').trim();
                    if (password && password !== '(null)' && password !== '') {
                        passwords.add(password);
                    }
                });
            }
            break;
            
        default:
            // Détection générique
            const genericPasswords = text.match(/(?:password|pass|pwd)[\s:=]+([^\s\r\n]+)/gi);
            if (genericPasswords) {
                genericPasswords.forEach(match => {
                    const password = match.split(/[\s:=]+/)[1];
                    if (password && password.length > 3) {
                        passwords.add(password);
                    }
                });
            }
    }
    
    return Array.from(passwords);
}

function extractDomains(text, outputType) {
    const domains = new Set();
    
    switch (outputType) {
        case 'mimikatz':
        case 'lsass':
            // Format: * Domain : domain
            const mimikatzDomains = text.match(/\*\s*Domain\s*:\s*([^\r\n]+)/gi);
            if (mimikatzDomains) {
                mimikatzDomains.forEach(match => {
                    const domain = match.replace(/\*\s*Domain\s*:\s*/i, '').trim();
                    if (domain && domain !== '(null)' && domain !== 'NT AUTHORITY') {
                        domains.add(domain);
                    }
                });
            }
            break;
            
        case 'secretsdump':
        case 'sam':
            // Format: DOMAIN\username
            const domainMatches = text.match(/^([^\\:]+)\\[^:]+:/gm);
            if (domainMatches) {
                domainMatches.forEach(match => {
                    const domain = match.split('\\')[0];
                    if (domain) {
                        domains.add(domain);
                    }
                });
            }
            break;
            
        default:
            // Détection générique
            const genericDomains = text.match(/(?:domain|realm)[\s:=]+([a-zA-Z0-9\-\.]+)/gi);
            if (genericDomains) {
                genericDomains.forEach(match => {
                    const domain = match.split(/[\s:=]+/)[1];
                    if (domain && domain.length > 2) {
                        domains.add(domain);
                    }
                });
            }
    }
    
    return Array.from(domains);
}

function extractIps(text, outputType) {
    const ips = new Set();
    
    // Pattern IP générique
    const ipPattern = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;
    const ipMatches = text.match(ipPattern);
    
    if (ipMatches) {
        ipMatches.forEach(ip => {
            // Exclure les IPs privées communes
            if (!ip.startsWith('127.') && !ip.startsWith('0.')) {
                ips.add(ip);
            }
        });
    }
    
    return Array.from(ips);
}

function extractEmails(text, outputType) {
    const emails = new Set();
    
    // Pattern email générique
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emailMatches = text.match(emailPattern);
    
    if (emailMatches) {
        emailMatches.forEach(email => {
            emails.add(email.toLowerCase());
        });
    }
    
    return Array.from(emails);
}

// Fonctions d'extraction avancées (simplifiées pour l'instant)
function extractCredentials(text, outputType) {
    const credentials = [];
    const users = extractUsers(text, outputType);
    const hashes = extractHashes(text, outputType);
    
    // Essayer de matcher users et hashes
    users.forEach(user => {
        credentials.push(`${user}:<hash_needed>`);
    });
    
    return credentials;
}

function extractKerberos(text, outputType) {
    const tickets = new Set();
    
    // Recherche de tickets Kerberos
    const ticketMatches = text.match(/\$krb5\w+\$[^\s]+/gi);
    if (ticketMatches) {
        ticketMatches.forEach(ticket => {
            tickets.add(ticket);
        });
    }
    
    return Array.from(tickets);
}

function extractSecrets(text, outputType) {
    const secrets = new Set();
    
    // Recherche de secrets LSA, DPAPI, etc.
    const secretMatches = text.match(/(?:secret|lsa|dpapi)[\s:=]+([^\r\n]+)/gi);
    if (secretMatches) {
        secretMatches.forEach(match => {
            const secret = match.split(/[\s:=]+/).slice(1).join(' ');
            if (secret && secret.length > 5) {
                secrets.add(secret);
            }
        });
    }
    
    return Array.from(secrets);
}

function extractMachineAccounts(text, outputType) {
    const machines = new Set();
    
    // Recherche de comptes machine (se terminent par $)
    const machineMatches = text.match(/([a-zA-Z0-9\-]+\$)/g);
    if (machineMatches) {
        machineMatches.forEach(machine => {
            machines.add(machine);
        });
    }
    
    return Array.from(machines);
}

function extractServices(text, outputType) {
    const services = new Set();
    
    // Recherche de comptes de service
    const serviceMatches = text.match(/(?:svc|service)[\w\-_]*[:\s]+([^\r\n]+)/gi);
    if (serviceMatches) {
        serviceMatches.forEach(match => {
            const service = match.split(/[\s:]+/)[1];
            if (service) {
                services.add(service);
            }
        });
    }
    
    return Array.from(services);
}

function extractPorts(text, outputType) {
    const ports = new Set();
    
    if (outputType === 'nmap') {
        // Format Nmap: 80/tcp open http
        const portMatches = text.match(/(\d+)\/(?:tcp|udp)\s+open/gi);
        if (portMatches) {
            portMatches.forEach(match => {
                const port = match.match(/(\d+)/)[1];
                ports.add(port);
            });
        }
    } else {
        // Détection générique de ports
        const genericPorts = text.match(/(?:port|:\s*)(\d{1,5})/gi);
        if (genericPorts) {
            genericPorts.forEach(match => {
                const port = match.match(/(\d+)/)[1];
                const portNum = parseInt(port);
                if (portNum > 0 && portNum <= 65535) {
                    ports.add(port);
                }
            });
        }
    }
    
    return Array.from(ports);
}

// Affichage des résultats
function displayResults(results, type) {
    const resultsSection = document.getElementById('resultsSection');
    const resultsTitle = document.getElementById('resultsTitle');
    const resultsCount = document.getElementById('resultsCount');
    const resultsType = document.getElementById('resultsType');
    
    if (!resultsSection || !resultsTitle || !resultsCount || !resultsType) return;
    
    // Titre simplifié
    const typeNames = {
        users: '👤 Utilisateurs',
        hashes: '🔐 Hashes',
        passwords: '🔑 Mots de passe',
        domains: '🌐 Domaines',
        ips: '🌍 IPs',
        emails: '📧 Emails',
        credentials: '🎯 Credentials',
        kerberos: '🎫 Kerberos',
        secrets: '🔒 Secrets',
        machineaccounts: '🖥️ Comptes Machine',
        services: '⚙️ Services',
        ports: '🚪 Ports'
    };
    
    resultsTitle.textContent = typeNames[type] || type;
    resultsCount.textContent = `${results.length} éléments`;
    resultsType.textContent = type;
    
    resultsSection.style.display = 'block';
    
    updateResultsDisplay();
}

function updateResultsDisplay() {
    const format = document.getElementById('outputFormat')?.value || 'list';
    const formattedResults = document.getElementById('formattedResults');
    const rawResults = document.getElementById('rawResults');
    
    if (!formattedResults || !rawResults) return;
    
    let formattedContent = '';
    let rawContent = '';
    
    switch (format) {
        case 'list':
            formattedContent = currentResults.map(item => 
                typeof item === 'object' ? `${item.username}:${item.hash}` : item
            ).join('\n');
            rawContent = formattedContent;
            break;
            
        case 'hashcat':
            if (currentExtractionType === 'hashes') {
                formattedContent = currentResults.join('\n');
                rawContent = formattedContent;
            }
            break;
            
        case 'csv':
            if (currentExtractionType === 'credentials') {
                formattedContent = 'Username,Domain,Hash,Type\n' + 
                    currentResults.map(item => `${item.username},${item.domain},${item.hash},${item.type}`).join('\n');
            } else {
                formattedContent = currentResults.join('\n');
            }
            rawContent = formattedContent;
            break;
            
        case 'json':
            formattedContent = JSON.stringify(currentResults, null, 2);
            rawContent = formattedContent;
            break;
            
        default:
            formattedContent = currentResults.join('\n');
            rawContent = formattedContent;
    }
    
    formattedResults.innerHTML = `<pre>${escapeHtml(formattedContent)}</pre>`;
    rawResults.value = rawContent;
}

// Fonctions utilitaires
function clearInput() {
    const rawOutput = document.getElementById('rawOutput');
    if (rawOutput) {
        rawOutput.value = '';
        updateStats();
        updateExtractionCounts();
        showNotification('Données effacées', 'info');
    }
}

function loadSample() {
    const sampleData = `Administrator:500:aad3b435b51404eeaad3b435b51404ee:c0ffeecafe0b1c2d3e4f5a6b7c8d9e0f:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
user1:1001:aad3b435b51404eeaad3b435b51404ee:8846f7eaee8fb117ad06bdd830b7586c:::`;
    
    const rawOutput = document.getElementById('rawOutput');
    if (rawOutput) {
        rawOutput.value = sampleData;
        updateStats();
        detectOutputType();
        updateExtractionCounts();
        showNotification('Exemple chargé!', 'success');
    }
}

function switchTab(event) {
    const tabName = event.target.dataset.tab;
    
    // Désactiver tous les onglets
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    
    // Activer l'onglet sélectionné
    event.target.classList.add('active');
    const targetPane = document.getElementById(`${tabName}Tab`);
    if (targetPane) targetPane.classList.add('active');
}

function copyResults() {
    const rawResults = document.getElementById('rawResults');
    if (rawResults && rawResults.value) {
        navigator.clipboard.writeText(rawResults.value).then(() => {
            showNotification('Résultats copiés!', 'success');
        }).catch(() => {
            showNotification('Erreur lors de la copie', 'error');
        });
    }
}

function saveResults() {
    const rawResults = document.getElementById('rawResults');
    if (!rawResults || !rawResults.value) {
        showNotification('Aucun résultat à sauvegarder', 'warning');
        return;
    }
    
    const format = document.getElementById('outputFormat')?.value || 'list';
    const type = currentExtractionType;
    
    const extensions = {
        list: 'txt',
        hashcat: 'txt',
        john: 'txt',
        csv: 'csv',
        json: 'json'
    };
    
    const filename = `${type}_${new Date().toISOString().split('T')[0]}.${extensions[format] || 'txt'}`;
    
    const blob = new Blob([rawResults.value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Résultats sauvegardés!', 'success');
}

function clearResults() {
    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
        resultsSection.style.display = 'none';
    }
    currentResults = [];
    currentExtractionType = '';
}

// Gestion de l'historique
function addToHistory(type, count, results = []) {
    const historyItem = {
        id: Date.now(),
        type: type,
        count: count,
        timestamp: new Date().toLocaleString(),
        outputType: document.getElementById('outputType')?.value || 'auto',
        results: results.slice(0, 10), // Garder seulement les 10 premiers résultats
        fullResults: results // Sauvegarder tous les résultats
    };
    
    extractionHistory.unshift(historyItem);
    
    // Garder seulement les 50 dernières extractions
    if (extractionHistory.length > 50) {
        extractionHistory = extractionHistory.slice(0, 50);
    }
    
    localStorage.setItem('grepHistory', JSON.stringify(extractionHistory));
    updateHistoryDisplay();
}

function loadHistory() {
    updateHistoryDisplay();
}

function updateHistoryDisplay() {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;
    
    if (extractionHistory.length === 0) {
        historyList.innerHTML = `
            <div class="history-empty">
                <span class="empty-icon">📝</span>
                <p>Aucune extraction pour le moment</p>
            </div>
        `;
        return;
    }
    
    const typeNames = {
        users: '👤 Utilisateurs',
        hashes: '🔐 Hashes',
        passwords: '🔑 Mots de passe',
        domains: '🌐 Domaines',
        ips: '🌍 IPs',
        emails: '📧 Emails',
        credentials: '🎯 Credentials',
        kerberos: '🎫 Kerberos',
        secrets: '🔒 Secrets',
        machineaccounts: '🖥️ Comptes Machine',
        services: '⚙️ Services',
        ports: '🚪 Ports'
    };
    
    historyList.innerHTML = extractionHistory.map(item => `
        <div class="history-item">
            <div class="history-content">
                <div class="history-title">${typeNames[item.type] || item.type}</div>
                <div class="history-meta">
                    ${item.count} éléments • ${item.timestamp} • ${item.outputType}
                </div>
            </div>
            <div class="history-actions">
                <button class="btn btn-sm btn-primary" onclick="viewHistoryItem(${item.id})">
                    👁️ Voir
                </button>
                <button class="btn btn-sm btn-secondary" onclick="deleteHistoryItem(${item.id})">
                    🗑️
                </button>
            </div>
        </div>
    `).join('');
}

function deleteHistoryItem(id) {
    extractionHistory = extractionHistory.filter(item => item.id !== id);
    localStorage.setItem('grepHistory', JSON.stringify(extractionHistory));
    updateHistoryDisplay();
}

function clearHistory() {
    if (confirm('Êtes-vous sûr de vouloir vider l\'historique ?')) {
        extractionHistory = [];
        localStorage.removeItem('grepHistory');
        updateHistoryDisplay();
        showNotification('Historique vidé!', 'success');
    }
}

function exportHistory() {
    if (extractionHistory.length === 0) {
        showNotification('Aucun historique à exporter', 'warning');
        return;
    }
    
    const exportData = {
        exported_at: new Date().toISOString(),
        total_extractions: extractionHistory.length,
        history: extractionHistory
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grepmaster-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Historique exporté!', 'success');
}

// Fonction globale pour afficher une extraction de l'historique
window.showHistoryExtraction = function(id) {
    const item = extractionHistory.find(h => h.id === id);
    if (!item) return;
    // Restaurer les résultats
    currentResults = item.fullResults || item.results || [];
    currentExtractionType = item.type;
    
    // Afficher les résultats
    displayResults(currentResults, item.type);
    
    // Restaurer le type de sortie
    const outputType = document.getElementById('outputType');
    if (outputType) {
        outputType.value = item.outputType;
    }
    
    showNotification(`Résultats restaurés: ${item.count} éléments`, 'success');
};

// Utilitaires
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

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
`;
document.head.appendChild(style);