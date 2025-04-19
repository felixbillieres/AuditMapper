document.addEventListener('DOMContentLoaded', () => {
    const osSourceSelect = document.getElementById('os-source');
    const osDestinationSelect = document.getElementById('os-destination');
    const transferTitle = document.getElementById('transfer-title');
    const transferGuideContent = document.getElementById('transfer-guide-content');
    const placeholderMessage = transferGuideContent.querySelector('.placeholder-message');

    // --- Fonction utilitaire pour échapper le HTML ---
    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
     }

    // --- Fonction pour générer le HTML d'une méthode dans une carte ---
    function renderMethod(title, description, prerequisites, steps, example) {
        // Génère les étapes HTML avec blocs de code et boutons copier
        const stepsHtml = steps.map(step => {
            const commandMatch = step.match(/`(.*?)`/s); // Trouve la commande entre backticks (mode 's' pour multiline)
            let stepContent = step.replace(/`(.*?)`/gs, ''); // Retire les backticks pour l'affichage
            let codeBlockHtml = '';

            if (commandMatch) {
                const command = commandMatch[1].trim(); // .trim() pour enlever les espaces/newlines autour
                // Utilise les classes CSS existantes pour le conteneur et le bouton
                // Note: Utilisation de btn-outline-secondary pour un style plus léger
                codeBlockHtml = `
                    <div class="code-block-container position-relative mt-2 mb-2">
                        <pre><code class="language-bash d-block p-2 rounded">${escapeHtml(command)}</code></pre>
                        <button class="btn btn-outline-secondary btn-sm copy-btn position-absolute" style="top: 5px; right: 5px;" data-clipboard-text="${escapeHtml(command)}" title="Copier la commande">
                            <i class="far fa-copy"></i>
                        </button>
                    </div>
                `;
            }
            // Ajoute un léger retrait pour les étapes sans code
            const paddingClass = !commandMatch ? 'pl-3' : '';
            return `<li class="${paddingClass}">${stepContent}${codeBlockHtml}</li>`;
        }).join('');

        // Génère l'exemple HTML s'il existe
        let exampleHtml = '';
        if (example && example.command) {
             const exampleCommand = example.command.trim();
             exampleHtml = `
                <h6 class="mt-3">Exemple :</h6>
                <p class="small text-muted">${example.text || ''}</p>
                <div class="code-block-container position-relative mt-2 mb-2">
                    <pre><code class="language-bash d-block p-2 rounded">${escapeHtml(exampleCommand)}</code></pre>
                    <button class="btn btn-outline-secondary btn-sm copy-btn position-absolute" style="top: 5px; right: 5px;" data-clipboard-text="${escapeHtml(exampleCommand)}" title="Copier l'exemple">
                         <i class="far fa-copy"></i>
                    </button>
                </div>`;
        } else if (example && example.text) {
             exampleHtml = `
                <h6 class="mt-3">Exemple :</h6>
                <p class="small text-muted">${example.text}</p>`;
        }

        // Utilisation de la structure card de Bootstrap/style existant
        // card-header utilise bg-light pour un fond subtil
        // h5 pour les titres de section dans la carte
        return `
            <div class="card mb-4 shadow-sm transfer-method">
                <div class="card-header bg-light py-2">
                    <h4 class="mb-0 h6 font-weight-bold">${title}</h4>
                </div>
                <div class="card-body">
                    <p class="card-text small">${description}</p>
                    <h5 class="mt-3">Prérequis :</h5>
                    <ul class="small">${prerequisites.map(req => `<li>${req}</li>`).join('')}</ul>
                    <h5 class="mt-3">Étapes :</h5>
                    <ol class="small">${stepsHtml}</ol>
                    ${exampleHtml}
                </div>
            </div>
        `;
    }

    // --- Contenu spécifique pour chaque combinaison OS ---

    function renderLinuxToLinuxGuide() {
        let html = '';
        // Méthode SCP
        html += renderMethod(
            'SCP (Secure Copy)',
            'Copie de fichiers sécurisée via SSH. Simple et largement disponible.',
            ['Serveur SSH fonctionnel sur la machine destination.', 'Client SCP (généralement inclus avec SSH) sur la machine source.', 'Accès réseau entre les machines (port 22/TCP par défaut).', 'Identifiants valides sur la machine destination.'],
            [
                'Copier un fichier de la source vers la destination :',
                '`scp <SOURCE_PATH> <USERNAME>@<TARGET_IP>:<DESTINATION_PATH>`',
                'Copier un dossier entier de la source vers la destination :',
                '`scp -r <SOURCE_FOLDER_PATH> <USERNAME>@<TARGET_IP>:<DESTINATION_PATH>`'
            ],
            {
                text: 'Copier `/tmp/data.zip` vers `/home/user/received/` sur `192.168.1.100` avec l\'utilisateur `user` :',
                command: 'scp /tmp/data.zip user@192.168.1.100:/home/user/received/'
            }
        );
        // Méthode Rsync
        html += renderMethod(
            'Rsync',
            'Synchronisation de fichiers efficace, idéale pour les transferts volumineux, répétitifs ou pour reprendre des transferts interrompus.',
             ['Serveur SSH fonctionnel sur la machine destination OU démon Rsync.', 'Client Rsync sur la machine source.', 'Accès réseau.', 'Identifiants valides (si via SSH).'],
            [
                'Synchroniser un dossier local vers un dossier distant via SSH (le `/` final sur la source est important) :',
                '`rsync -avz -e ssh --progress <SOURCE_FOLDER_PATH>/ <USERNAME>@<TARGET_IP>:<DESTINATION_FOLDER_PATH>`',
                'Options : `-a` (archive), `-v` (verbose), `-z` (compress), `-e ssh` (via SSH), `--progress` (barre de progression).'
            ],
            {
                text: 'Synchroniser `/data/project/` vers `/backup/project/` sur `192.168.1.100` :',
                command: 'rsync -avz -e ssh --progress /data/project/ user@192.168.1.100:/backup/project'
            }
        );
         // Méthode Python HTTP Server
        html += renderMethod(
            'Serveur HTTP Python (Simple & Rapide)',
            'Lance un serveur web temporaire pour télécharger des fichiers via `wget`/`curl`. Idéal pour des transferts rapides dans un réseau local.',
            ['Python 3 installé sur la machine source.', 'Accès réseau de la destination vers la source (sur le port choisi).', '`wget` ou `curl` sur la machine destination.'],
            [
                'Sur la machine source, naviguez dans le dossier contenant les fichiers :',
                '`cd /path/to/your/files`',
                'Lancez le serveur HTTP (Python 3) sur un port (ex: 8000) et une IP spécifique (ou 0.0.0.0 pour toutes) :',
                '`python3 -m http.server 8000 --bind 0.0.0.0`',
                'Notez l\'adresse IP de la machine source (ex: `ip a`).',
                'Sur la machine destination, utilisez `wget` :',
                '`wget http://<SOURCE_IP>:8000/<FILENAME>`',
                'Arrêtez le serveur sur la source avec Ctrl+C.'
            ],
            {
                text: 'Partager `tool.sh` depuis `192.168.1.50` et le télécharger sur la destination :',
                command: '# Sur Source (192.168.1.50):\ncd /share\npython3 -m http.server 8000 --bind 0.0.0.0\n\n# Sur Destination:\nwget http://192.168.1.50:8000/tool.sh'
            }
        );
        // Méthode Netcat / Ncat
        html += renderMethod(
            'Netcat (nc) / Ncat',
            'Transfert direct via TCP/UDP. Simple mais non chiffré et sans reprise.',
            ['`nc` ou `ncat` installé sur les deux machines.', 'Accès réseau direct sur le port choisi.'],
            [
                'Sur la machine destination (réception) :',
                '`nc -lp <PORT> > <OUTPUT_FILENAME>`',
                'Sur la machine source (envoi) :',
                '`nc <DESTINATION_IP> <PORT> < <INPUT_FILENAME>`',
                'Utiliser `ncat` est souvent préférable pour plus d\'options (ex: `--ssl` pour chiffrement basique).'
            ],
            {
                text: 'Transférer `archive.tar.gz` de la source vers la destination (192.168.1.100) sur le port 9001 :',
                command: '# Sur Destination (192.168.1.100):\nnc -lp 9001 > archive.tar.gz\n\n# Sur Source:\nnc 192.168.1.100 9001 < archive.tar.gz'
            }
        );
        // Méthode Socat
        html += renderMethod(
            'Socat',
            'Alternative puissante à Netcat, offrant plus de flexibilité et d\'options (chiffrement, etc.).',
            ['`socat` installé sur les deux machines.', 'Accès réseau direct sur le port choisi.'],
            [
                'Sur la machine destination (réception) :',
                '`socat TCP4-LISTEN:<PORT>,fork file:<OUTPUT_FILENAME>,create`',
                'Sur la machine source (envoi) :',
                '`socat TCP4:<DESTINATION_IP>:<PORT> file:<INPUT_FILENAME>`'
            ],
            {
                text: 'Transférer `data.bin` vers la destination (192.168.1.100) sur le port 9002 :',
                command: '# Sur Destination (192.168.1.100):\nsocat TCP4-LISTEN:9002,fork file:data.bin,create\n\n# Sur Source:\nsocat TCP4:192.168.1.100:9002 file:data.bin'
            }
        );
        return html;
    }

    function renderLinuxToWindowsGuide() {
        let html = '';
        // Méthode Python HTTP Server
        html += renderMethod(
            'Serveur HTTP Python (Source Linux) + CLI/Navigateur (Destination Windows)',
            'Lance un serveur web temporaire sur Linux. Téléchargement facile via PowerShell, CMD (certutil) ou navigateur sur Windows.',
            ['Python 3 installé sur la machine source (Linux).', 'Accès réseau de Windows vers Linux (sur le port choisi).', 'PowerShell v3+ OU `certutil.exe` OU Navigateur web sur la machine destination (Windows).'],
            [
                'Sur la machine source (Linux), naviguez dans le dossier :',
                '`cd /path/to/share/`',
                'Lancez le serveur HTTP :',
                '`python3 -m http.server 8000 --bind 0.0.0.0`',
                'Notez l\'adresse IP de la machine source Linux.',
                'Sur la machine destination (Windows) :',
                'Option A (PowerShell - Recommandé):',
                '`Invoke-WebRequest -Uri http://<LINUX_IP>:8000/<FILENAME> -OutFile C:\\path\\to\\save\\<FILENAME>`',
                'ou (BITS):',
                '`Start-BitsTransfer -Source http://<LINUX_IP>:8000/<FILENAME> -Destination C:\\path\\to\\save\\<FILENAME>`',
                'Option B (CMD - via certutil):',
                '`certutil -urlcache -split -f http://<LINUX_IP>:8000/<FILENAME> C:\\path\\to\\save\\<FILENAME>`',
                'Option C (Navigateur): Ouvrez `http://<LINUX_IP>:8000` et cliquez sur le fichier.',
                'Arrêtez le serveur sur Linux (Ctrl+C) quand c\'est fini.'
            ],
            {
                text: 'Partager `tool.sh` depuis Linux (`192.168.1.50`) et télécharger sur Windows via PowerShell ou CMD:',
                command: `# Sur Linux:\ncd /home/user/exports\npython3 -m http.server 8000 --bind 0.0.0.0\n\n# Sur Windows (PowerShell):\nInvoke-WebRequest -Uri http://192.168.1.50:8000/tool.sh -OutFile C:\\Temp\\tool.sh\n\n# Sur Windows (CMD):\ncertutil -urlcache -split -f http://192.168.1.50:8000/tool.sh C:\\Temp\\tool.sh`
            }
        );
        // Méthode SCP (si SSH Server sur Windows)
        html += renderMethod(
            'SCP (si serveur SSH sur Windows)',
            'Utilise SCP pour copier des fichiers vers Windows si un serveur SSH (comme OpenSSH Server) y est installé et configuré.',
            ['Client SCP sur la machine source (Linux).', 'Serveur SSH fonctionnel sur la machine destination (Windows).', 'Accès réseau (port 22/TCP par défaut).', 'Identifiants Windows valides.'],
            [
                'Copier un fichier de Linux vers Windows :',
                '`scp <SOURCE_PATH> <WINDOWS_USERNAME>@<WINDOWS_IP>:"C:\\path\\to\\destination\\<FILENAME>"`',
                'Copier un dossier entier :',
                '`scp -r <SOURCE_FOLDER_PATH> <WINDOWS_USERNAME>@<WINDOWS_IP>:"C:\\path\\to\\destination\\<FOLDERNAME>"`',
                'Note: Faites attention aux guillemets autour du chemin Windows.'
            ],
            {
                text: 'Copier `/opt/tools/exploit.py` vers `C:\\Temp\\` sur Windows (`192.168.1.102`) :',
                command: 'scp /opt/tools/exploit.py admin@192.168.1.102:"C:\\Temp\\exploit.py"'
            }
        );
        // Méthode Impacket smbserver.py
        html += renderMethod(
            'Impacket smbserver.py (Source Linux) + Explorateur/CLI (Destination Windows)',
            'Crée un partage SMB temporaire sur Linux. Accessible depuis Windows via l\'explorateur ou des commandes comme `copy`/`robocopy`.',
            ['Impacket installé sur Linux (`pip install impacket`).', 'Accès réseau de Windows vers Linux (port 445/TCP).', 'Permissions pour écouter sur le port 445 (souvent nécessite `sudo`).'],
            [
                'Sur Linux, lancez le serveur SMB dans le dossier à partager :',
                '`sudo impacket-smbserver <SHARE_NAME> $(pwd)`',
                ' `<SHARE_NAME>` est le nom que vous donnez au partage (ex: `myshare`).',
                ' `$(pwd)` indique que le dossier courant sera partagé.',
                'Notez l\'IP de la machine Linux.',
                'Sur Windows :',
                'Option A (Explorateur): Ouvrez `\\\\<LINUX_IP>\\<SHARE_NAME>` et copiez les fichiers.',
                'Option B (CMD/PowerShell):',
                '`copy \\\\<LINUX_IP>\\<SHARE_NAME>\\<FILENAME> C:\\path\\to\\save\\`',
                'ou pour un dossier :',
                '`robocopy \\\\<LINUX_IP>\\<SHARE_NAME>\\<FOLDERNAME> C:\\path\\to\\save\\<FOLDERNAME> /E`',
                'Arrêtez le serveur sur Linux (Ctrl+C).'
            ],
            {
                text: 'Partager le dossier `/data` comme `tempshare` depuis Linux (`192.168.1.50`) et copier `report.pdf` sur Windows :',
                command: '# Sur Linux:\ncd /data\nsudo impacket-smbserver tempshare $(pwd)\n\n# Sur Windows (CMD):\ncopy \\\\192.168.1.50\\tempshare\\report.pdf C:\\Temp\\'
            }
        );
        return html;
    }

    function renderWindowsToLinuxGuide() {
        let html = '';
         // Méthode Python HTTP Server (Source Windows) + Wget/Curl (Destination Linux)
        html += renderMethod(
            'Serveur HTTP Python (Source Windows) + wget/curl (Destination Linux)',
            'Lance un serveur web temporaire sur Windows. Téléchargement facile via `wget` ou `curl` sur Linux.',
            ['Python 3 installé sur Windows.', 'Accès réseau de Linux vers Windows (sur le port choisi).', '`wget` ou `curl` sur Linux.'],
            [
                'Sur Windows (cmd ou PowerShell), naviguez dans le dossier :',
                '`cd C:\\path\\to\\share`',
                'Lancez le serveur HTTP :',
                '`python -m http.server 8000`',
                'Notez l\'IP de Windows (`ipconfig`).',
                'Sur Linux, utilisez `wget` ou `curl` :',
                '`wget http://<WINDOWS_IP>:8000/<FILENAME>`',
                'ou',
                '`curl -O http://<WINDOWS_IP>:8000/<FILENAME>`',
                'Arrêtez le serveur sur Windows (Ctrl+C).'
            ],
            {
                text: 'Partager `backup.zip` depuis Windows (`192.168.1.101`) et le télécharger sur Linux :',
                command: '# Sur Windows (cmd):\ncd C:\\Temp\\share\npython -m http.server 8000\n\n# Sur Linux:\nwget http://192.168.1.101:8000/backup.zip'
            }
        );
        // Méthode PSCP (Client SCP pour Windows)
        html += renderMethod(
            'PSCP (Client SCP pour Windows)',
            'Utilise `pscp.exe` (de la suite PuTTY) pour copier des fichiers de Windows vers un serveur SSH sur Linux.',
            ['Serveur SSH fonctionnel sur Linux.', '`pscp.exe` disponible sur Windows.', 'Accès réseau de Windows vers Linux (port 22/TCP).', 'Identifiants valides sur Linux.'],
            [
                'Copier un fichier de Windows vers Linux :',
                '`pscp.exe -pw <PASSWORD> <SOURCE_PATH_WINDOWS> <USERNAME>@<LINUX_IP>:<DESTINATION_PATH_LINUX>`',
                'Copier un dossier entier :',
                '`pscp.exe -pw <PASSWORD> -r <SOURCE_FOLDER_WINDOWS> <USERNAME>@<LINUX_IP>:<DESTINATION_PATH_LINUX>`',
                'Alternative: utiliser une clé SSH avec `-i <path_to_key>` au lieu de `-pw`.'
            ],
            {
                text: 'Copier `C:\\Tools\\nc.exe` vers `/tmp/` sur Linux (`192.168.1.50`) avec user `elliot` et password `password123`:',
                command: 'pscp.exe -pw password123 C:\\Tools\\nc.exe elliot@192.168.1.50:/tmp/'
            }
        );
         // Méthode Partage SMB (si Samba sur Linux)
        html += renderMethod(
            'Partage Réseau Windows (vers Samba sur Linux)',
            'Monte un partage réseau hébergé par Samba sur Linux directement dans Windows.',
            ['Serveur Samba configuré et fonctionnel sur Linux.', 'Accès réseau de Windows vers Linux (ports 139/TCP, 445/TCP).', 'Identifiants valides pour le partage Samba.'],
            [
                'Option A (Explorateur): Ouvrez `\\\\<LINUX_IP>\\<SHARE_NAME>` et copiez/collez.',
                'Option B (`net use`):',
                '`net use Z: \\\\<LINUX_IP>\\<SHARE_NAME> /user:<USERNAME> <PASSWORD>`',
                'Copiez ensuite les fichiers vers `Z:`.',
                'Déconnecter : `net use Z: /delete`'
            ],
            {
                text: 'Connecter le partage `transfer` sur Linux (`192.168.1.50`) au lecteur X:',
                command: 'net use X: \\\\192.168.1.50\\transfer /user:shareuser sharepass'
            }
        );
        // Méthode Certutil (Windows Built-in pour télécharger depuis Linux)
        html += renderMethod(
            'Certutil (Téléchargement depuis Linux vers Windows)',
            'Utilise `certutil.exe` sur Windows pour télécharger un fichier hébergé sur un serveur web (ex: Python HTTP) sur Linux.',
            ['Serveur HTTP (ex: Python) actif sur Linux hébergeant le fichier.', 'Accès réseau de Windows vers Linux (port du serveur HTTP).', '`certutil.exe` disponible sur Windows.'],
            [
                'Sur Linux, démarrer le serveur HTTP dans le dossier du fichier (voir méthode Python HTTP dans Linux->Linux).',
                'Sur Windows (cmd):',
                '`certutil -urlcache -split -f http://<LINUX_IP>:<PORT>/<FILENAME> C:\\path\\to\\save\\<FILENAME>`'
            ],
            {
                text: 'Télécharger `linpeas.sh` hébergé sur Linux (`192.168.1.50:8000`) vers `C:\\Temp\\linpeas.sh` sur Windows :',
                command: '# Sur Linux (dans le dossier de linpeas.sh):\npython3 -m http.server 8000 --bind 0.0.0.0\n\n# Sur Windows (cmd):\ncertutil -urlcache -split -f http://192.168.1.50:8000/linpeas.sh C:\\Temp\\linpeas.sh'
            }
        );
        return html;
    }

    function renderWindowsToWindowsGuide() {
        let html = '';
        // Méthode Partage Réseau (SMB)
        html += renderMethod(
            'Partage Réseau Windows (SMB/CIFS)',
            'Méthode standard entre machines Windows via partages réseau.',
            ['Partage réseau configuré sur la destination (ou accès aux partages admin C$, ADMIN$).', 'Accès réseau (ports 139/TCP, 445/TCP).', 'Identifiants valides avec permissions.', 'Pare-feu autorisant le partage.'],
            [
                'Option A (Explorateur): Ouvrez `\\\\<TARGET_IP>\\<SHARE_NAME>` (ex: `\\\\TARGET\\C$`) et copiez/collez.',
                'Option B (`copy`/`xcopy` - cmd):',
                '`copy <SOURCE_PATH> \\\\<TARGET_IP>\\<SHARE_NAME>\\<DEST_PATH>`',
                '`xcopy <SOURCE_PATH> \\\\<TARGET_IP>\\<SHARE_NAME>\\<DEST_PATH> /E /I /H /Y`',
                'Option C (`robocopy` - cmd/PowerShell - robuste):',
                '`robocopy <SOURCE_FOLDER> \\\\<TARGET_IP>\\<SHARE_NAME>\\<DEST_FOLDER> /E /COPYALL /R:1 /W:1`'
            ],
            {
                text: 'Copier `C:\\MyProject` vers le partage `Data` sur `SRV-FILES` :',
                command: 'robocopy C:\\MyProject \\\\SRV-FILES\\Data\\MyProjectBackup /E'
            }
        );
         // Méthode Python HTTP Server
        html += renderMethod(
            'Serveur HTTP Python (Source Windows) + CLI/Navigateur (Destination Windows)',
            'Lance un serveur web temporaire sur la source pour télécharger via PowerShell, CMD (certutil) ou navigateur sur la destination.',
            ['Python 3 installé sur la source.', 'Accès réseau de la destination vers la source.', 'PowerShell v3+ OU `certutil.exe` OU Navigateur sur la destination.'],
            [
                'Sur la source (cmd/PowerShell), naviguez et lancez :',
                '`cd C:\\path\\to\\share`',
                '`python -m http.server 8000`',
                'Notez l\'IP source (`ipconfig`).',
                'Sur la destination :',
                'Option A (PowerShell - Recommandé):',
                '`Invoke-WebRequest -Uri http://<SOURCE_IP>:8000/<FILENAME> -OutFile C:\\path\\to\\save\\<FILENAME>`',
                'ou (BITS):',
                '`Start-BitsTransfer -Source http://<SOURCE_IP>:8000/<FILENAME> -Destination C:\\path\\to\\save\\<FILENAME>`',
                'Option B (CMD - via certutil):',
                '`certutil -urlcache -split -f http://<SOURCE_IP>:8000/<FILENAME> C:\\path\\to\\save\\<FILENAME>`',
                'Option C (Navigateur): Ouvrez `http://<SOURCE_IP>:8000`.',
                'Arrêtez le serveur sur la source (Ctrl+C).'
            ],
            {
                text: 'Partager `tool.exe` depuis `192.168.1.101` et télécharger sur `192.168.1.102` via PowerShell ou CMD:',
                command: `# Sur Source (192.168.1.101):\ncd C:\\ShareMe\npython -m http.server 8000\n\n# Sur Destination (192.168.1.102 - PowerShell):\nInvoke-WebRequest -Uri http://192.168.1.101:8000/tool.exe -OutFile C:\\Tools\\tool.exe\n\n# Sur Destination (192.168.1.102 - CMD):\ncertutil -urlcache -split -f http://192.168.1.101:8000/tool.exe C:\\Tools\\tool.exe`
            }
        );
        // Méthode PowerShell Remoting (si activé)
        html += renderMethod(
            'PowerShell Remoting (Copy-Item)',
            'Copie de fichiers via une session PowerShell distante (WinRM). Nécessite que PSRemoting soit configuré.',
            ['PowerShell Remoting (WinRM) activé et configuré sur les deux machines.', 'Accès réseau (port 5985/TCP par défaut).', 'Identifiants avec droits d\'administration sur la destination.', 'Exécution de scripts PowerShell autorisée.'],
            [
                'Établir une session PowerShell distante vers la destination :',
                '`$session = New-PSSession -ComputerName <TARGET_IP> -Credential (Get-Credential)`',
                'Copier un fichier de la source vers la destination via la session :',
                '`Copy-Item -Path <SOURCE_PATH> -Destination <DESTINATION_PATH_ON_TARGET> -ToSession $session`',
                'Copier un dossier entier :',
                '`Copy-Item -Path <SOURCE_FOLDER_PATH> -Destination <DESTINATION_PATH_ON_TARGET> -ToSession $session -Recurse`',
                'Fermer la session :',
                '`Remove-PSSession $session`'
            ],
            {
                text: 'Copier le dossier `C:\\Scripts` local vers `C:\\Temp\\Scripts` sur la machine distante `192.168.1.102` :',
                command: '$session = New-PSSession -ComputerName 192.168.1.102 -Credential (Get-Credential)\nCopy-Item -Path C:\\Scripts -Destination C:\\Temp\\Scripts -ToSession $session -Recurse\nRemove-PSSession $session'
            }
        );
        // Méthode Bitsadmin
        html += renderMethod(
            'Bitsadmin',
            'Utilitaire en ligne de commande pour gérer les transferts BITS. Utile pour les transferts en arrière-plan ou volumineux.',
            ['Service BITS fonctionnel sur les deux machines.', 'Accès réseau.', 'Permissions appropriées.'],
            [
                'Sur la machine source (pour initier le téléchargement depuis une URL ou un partage SMB) :',
                'Créer une tâche de téléchargement :',
                '`bitsadmin /create <JOB_NAME>`',
                'Ajouter un fichier à la tâche (depuis une URL ou un partage SMB) :',
                '`bitsadmin /addfile <JOB_NAME> <REMOTE_URL_OR_SMB_PATH> <LOCAL_DESTINATION_PATH>`',
                'Activer la tâche :',
                '`bitsadmin /resume <JOB_NAME>`',
                'Surveiller la progression (optionnel) :',
                '`bitsadmin /info <JOB_NAME> /verbose`',
                'Une fois terminé, marquer la tâche comme complète :',
                '`bitsadmin /complete <JOB_NAME>`'
            ],
            {
                text: 'Télécharger `largefile.zip` depuis un partage SMB `\\\\SRV\\Share` vers `C:\\Downloads` :',
                command: 'bitsadmin /create DownloadJob\nbitsadmin /addfile DownloadJob \\\\SRV\\Share\\largefile.zip C:\\Downloads\\largefile.zip\nbitsadmin /resume DownloadJob\n# Attendre la fin...\nbitsadmin /complete DownloadJob'
            }
        );
        return html;
    }

    // --- Fonction principale de mise à jour ---
    function updateGuide() {
        const sourceOS = osSourceSelect.value;
        const destOS = osDestinationSelect.value;

        // Met à jour le titre dans le header de la carte
        transferTitle.textContent = `Méthodes : ${sourceOS} vers ${destOS}`;
        transferGuideContent.innerHTML = ''; // Vider le contenu précédent
        if (placeholderMessage) placeholderMessage.style.display = 'none'; // Cacher le message placeholder

        let guideHtml = '';
        let foundMethods = false;

        if (sourceOS === 'Linux' && destOS === 'Linux') {
            guideHtml = renderLinuxToLinuxGuide();
            foundMethods = true;
        } else if (sourceOS === 'Linux' && destOS === 'Windows') {
            guideHtml = renderLinuxToWindowsGuide();
            foundMethods = true;
        } else if (sourceOS === 'Windows' && destOS === 'Linux') {
            guideHtml = renderWindowsToLinuxGuide();
            foundMethods = true;
        } else if (sourceOS === 'Windows' && destOS === 'Windows') {
            guideHtml = renderWindowsToWindowsGuide();
            foundMethods = true;
        }

        if (!foundMethods) {
             guideHtml = '<p class="text-muted small">Aucune méthode spécifique listée pour cette combinaison.</p>';
        }

        transferGuideContent.innerHTML = guideHtml;
    }

    // --- Gestionnaire d'événements pour les boutons Copier ---
    transferGuideContent.addEventListener('click', (event) => {
        const target = event.target.closest('.copy-btn');
        if (target) {
            const textToCopy = target.dataset.clipboardText;
            if (textToCopy) {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    const originalIcon = '<i class="far fa-copy"></i>'; // Icône originale
                    target.innerHTML = '<i class="fas fa-check text-success"></i>'; // Icône de succès
                    target.disabled = true;
                    // Changer la couleur du bouton temporairement
                    target.classList.remove('btn-outline-secondary');
                    target.classList.add('btn-outline-success');

                    setTimeout(() => {
                        target.innerHTML = originalIcon;
                        target.disabled = false;
                        target.classList.remove('btn-outline-success');
                        target.classList.add('btn-outline-secondary');
                    }, 1500);
                }).catch(err => {
                    console.error('Erreur lors de la copie :', err);
                    target.innerHTML = '<i class="fas fa-times text-danger"></i>'; // Icône d'erreur
                     setTimeout(() => {
                        target.innerHTML = '<i class="far fa-copy"></i>';
                    }, 1500);
                });
            }
        }
    });

    // --- Initialisation et écouteurs d'événements ---
    osSourceSelect.addEventListener('change', updateGuide);
    osDestinationSelect.addEventListener('change', updateGuide);

    // Appel initial pour afficher le guide par défaut (ou le placeholder)
    updateGuide();

}); 