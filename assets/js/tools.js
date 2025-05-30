// Base de données des outils (restaurée et étendue)
const toolsDatabase = [
    // Reconnaissance
    {
        id: 'nmap',
        name: 'Nmap',
        category: 'reconnaissance',
        platform: 'linux',
        description: 'Scanner de ports et découverte de services réseau le plus populaire au monde.',
        features: [
            'Scan de ports TCP/UDP',
            'Détection d\'OS et de services',
            'Scripts NSE intégrés',
            'Scan de vulnérabilités',
            'Cartographie réseau'
        ],
        installation: {
            debian: 'apt-get install nmap',
            redhat: 'yum install nmap',
            arch: 'pacman -S nmap',
            macos: 'brew install nmap',
            windows: 'winget install nmap'
        },
        usage: 'nmap -sS -sV -O target.com',
        links: {
            official: 'https://nmap.org',
            github: 'https://github.com/nmap/nmap',
            docs: 'https://nmap.org/book/'
        },
        icon: '🔍'
    },
    {
        id: 'masscan',
        name: 'Masscan',
        category: 'reconnaissance',
        platform: 'linux',
        description: 'Scanner de ports ultra-rapide capable de scanner l\'Internet entier.',
        features: [
            'Scan ultra-rapide',
            'Support IPv6',
            'Output personnalisable',
            'Bannergrabbing',
            'Scan de plages massives'
        ],
        installation: {
            debian: 'apt-get install masscan',
            redhat: 'yum install masscan',
            arch: 'pacman -S masscan',
            macos: 'brew install masscan',
            windows: 'Compilation manuelle requise'
        },
        usage: 'masscan -p1-65535 10.0.0.0/8 --rate=1000',
        links: {
            official: 'https://github.com/robertdavidgraham/masscan',
            github: 'https://github.com/robertdavidgraham/masscan',
            docs: 'https://github.com/robertdavidgraham/masscan/blob/master/README.md'
        },
        icon: '⚡'
    },
    {
        id: 'rustscan',
        name: 'RustScan',
        category: 'reconnaissance',
        platform: 'linux',
        description: 'Scanner de ports moderne écrit en Rust, ultra-rapide.',
        features: [
            'Scan extrêmement rapide',
            'Intégration avec Nmap',
            'Interface moderne',
            'Support IPv6',
            'Scripts personnalisés'
        ],
        installation: {
            debian: 'wget -qO- https://github.com/RustScan/RustScan/releases/download/2.0.1/rustscan_2.0.1_amd64.deb',
            redhat: 'cargo install rustscan',
            arch: 'pacman -S rustscan',
            macos: 'brew install rustscan',
            windows: 'cargo install rustscan'
        },
        usage: 'rustscan -a 127.0.0.1 -- -A -sC',
        links: {
            official: 'https://rustscan.github.io/RustScan/',
            github: 'https://github.com/RustScan/RustScan',
            docs: 'https://rustscan.github.io/RustScan/'
        },
        icon: '🦀'
    },
    {
        id: 'gobuster',
        name: 'Gobuster',
        category: 'reconnaissance',
        platform: 'web',
        description: 'Outil de brute force pour découvrir des répertoires et fichiers cachés.',
        features: [
            'Brute force de répertoires',
            'Brute force de sous-domaines',
            'Support de multiples modes',
            'Threads configurables',
            'Filtres avancés'
        ],
        installation: {
            debian: 'apt-get install gobuster',
            redhat: 'yum install gobuster',
            arch: 'pacman -S gobuster',
            macos: 'brew install gobuster',
            windows: 'go install github.com/OJ/gobuster/v3@latest'
        },
        usage: 'gobuster dir -u http://target.com -w /usr/share/wordlists/dirb/common.txt',
        links: {
            official: 'https://github.com/OJ/gobuster',
            github: 'https://github.com/OJ/gobuster',
            docs: 'https://github.com/OJ/gobuster/blob/master/README.md'
        },
        icon: '🔎'
    },
    {
        id: 'ffuf',
        name: 'ffuf',
        category: 'reconnaissance',
        platform: 'web',
        description: 'Fuzzer web rapide écrit en Go.',
        features: [
            'Fuzzing de paramètres',
            'Fuzzing de répertoires',
            'Fuzzing de sous-domaines',
            'Filtres avancés',
            'Output JSON/CSV'
        ],
        installation: {
            debian: 'apt-get install ffuf',
            redhat: 'yum install ffuf',
            arch: 'pacman -S ffuf',
            macos: 'brew install ffuf',
            windows: 'go install github.com/ffuf/ffuf@latest'
        },
        usage: 'ffuf -w wordlist.txt -u http://target.com/FUZZ',
        links: {
            official: 'https://github.com/ffuf/ffuf',
            github: 'https://github.com/ffuf/ffuf',
            docs: 'https://github.com/ffuf/ffuf/wiki'
        },
        icon: '🎯'
    },
    {
        id: 'dirsearch',
        name: 'dirsearch',
        category: 'reconnaissance',
        platform: 'web',
        description: 'Scanner de répertoires et fichiers web avancé.',
        features: [
            'Wordlists intégrées',
            'Détection de technologies',
            'Filtres par codes de statut',
            'Support de proxies',
            'Threads multiples'
        ],
        installation: {
            debian: 'git clone https://github.com/maurosoria/dirsearch.git',
            redhat: 'git clone https://github.com/maurosoria/dirsearch.git',
            arch: 'git clone https://github.com/maurosoria/dirsearch.git',
            macos: 'git clone https://github.com/maurosoria/dirsearch.git',
            windows: 'git clone https://github.com/maurosoria/dirsearch.git'
        },
        usage: 'python3 dirsearch.py -u http://target.com',
        links: {
            official: 'https://github.com/maurosoria/dirsearch',
            github: 'https://github.com/maurosoria/dirsearch',
            docs: 'https://github.com/maurosoria/dirsearch/wiki'
        },
        icon: '📂'
    },
    {
        id: 'subfinder',
        name: 'Subfinder',
        category: 'reconnaissance',
        platform: 'web',
        description: 'Outil de découverte de sous-domaines passif.',
        features: [
            'Sources multiples',
            'API intégrées',
            'Résolution DNS',
            'Output personnalisable',
            'Filtres avancés'
        ],
        installation: {
            debian: 'go install -v github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest',
            redhat: 'go install -v github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest',
            arch: 'go install -v github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest',
            macos: 'go install -v github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest',
            windows: 'go install -v github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest'
        },
        usage: 'subfinder -d target.com',
        links: {
            official: 'https://github.com/projectdiscovery/subfinder',
            github: 'https://github.com/projectdiscovery/subfinder',
            docs: 'https://docs.projectdiscovery.io/tools/subfinder'
        },
        icon: '🌐'
    },
    {
        id: 'amass',
        name: 'Amass',
        category: 'reconnaissance',
        platform: 'linux',
        description: 'Suite complète de reconnaissance de surface d\'attaque.',
        features: [
            'Énumération de sous-domaines',
            'Cartographie réseau',
            'Sources OSINT',
            'Visualisation graphique',
            'Base de données intégrée'
        ],
        installation: {
            debian: 'apt-get install amass',
            redhat: 'yum install amass',
            arch: 'pacman -S amass',
            macos: 'brew install amass',
            windows: 'go install -v github.com/OWASP/Amass/v3/...@master'
        },
        usage: 'amass enum -d target.com',
        links: {
            official: 'https://github.com/OWASP/Amass',
            github: 'https://github.com/OWASP/Amass',
            docs: 'https://github.com/OWASP/Amass/blob/master/doc/user_guide.md'
        },
        icon: '🕸️'
    },

    // Exploitation
    {
        id: 'metasploit',
        name: 'Metasploit Framework',
        category: 'exploitation',
        platform: 'linux',
        description: 'Framework de test de pénétration le plus avancé au monde.',
        features: [
            'Base de données d\'exploits',
            'Payloads personnalisables',
            'Post-exploitation',
            'Evasion d\'antivirus',
            'Interface web et console'
        ],
        installation: {
            debian: 'curl https://raw.githubusercontent.com/rapid7/metasploit-omnibus/master/config/templates/metasploit-framework-wrappers/msfupdate.erb > msfinstall && chmod 755 msfinstall',
            redhat: 'curl https://raw.githubusercontent.com/rapid7/metasploit-omnibus/master/config/templates/metasploit-framework-wrappers/msfupdate.erb > msfinstall && chmod 755 msfinstall',
            arch: 'yay -S metasploit',
            macos: 'brew install metasploit',
            windows: 'Télécharger depuis https://www.metasploit.com/'
        },
        usage: 'msfconsole',
        links: {
            official: 'https://www.metasploit.com',
            github: 'https://github.com/rapid7/metasploit-framework',
            docs: 'https://docs.metasploit.com'
        },
        icon: '💥'
    },
    {
        id: 'sqlmap',
        name: 'SQLMap',
        category: 'exploitation',
        platform: 'web',
        description: 'Outil automatique de détection et d\'exploitation d\'injections SQL.',
        features: [
            'Détection automatique d\'injections SQL',
            'Support de nombreuses bases de données',
            'Extraction de données',
            'Accès au système de fichiers',
            'Exécution de commandes'
        ],
        installation: {
            debian: 'apt-get install sqlmap',
            redhat: 'yum install sqlmap',
            arch: 'pacman -S sqlmap',
            macos: 'brew install sqlmap',
            windows: 'pip install sqlmap'
        },
        usage: 'sqlmap -u "http://target.com/page.php?id=1" --dbs',
        links: {
            official: 'https://sqlmap.org',
            github: 'https://github.com/sqlmapproject/sqlmap',
            docs: 'https://github.com/sqlmapproject/sqlmap/wiki'
        },
        icon: '💉'
    },
    {
        id: 'nuclei',
        name: 'Nuclei',
        category: 'exploitation',
        platform: 'web',
        description: 'Scanner de vulnérabilités rapide et personnalisable.',
        features: [
            'Templates YAML',
            'Scan de vulnérabilités',
            'Communauté active',
            'Intégrations CI/CD',
            'Output personnalisable'
        ],
        installation: {
            debian: 'go install -v github.com/projectdiscovery/nuclei/v2/cmd/nuclei@latest',
            redhat: 'go install -v github.com/projectdiscovery/nuclei/v2/cmd/nuclei@latest',
            arch: 'go install -v github.com/projectdiscovery/nuclei/v2/cmd/nuclei@latest',
            macos: 'go install -v github.com/projectdiscovery/nuclei/v2/cmd/nuclei@latest',
            windows: 'go install -v github.com/projectdiscovery/nuclei/v2/cmd/nuclei@latest'
        },
        usage: 'nuclei -u http://target.com',
        links: {
            official: 'https://nuclei.projectdiscovery.io',
            github: 'https://github.com/projectdiscovery/nuclei',
            docs: 'https://docs.projectdiscovery.io/tools/nuclei'
        },
        icon: '⚛️'
    },

    // Web Application Testing
    {
        id: 'burpsuite',
        name: 'Burp Suite',
        category: 'web-testing',
        platform: 'web',
        description: 'Plateforme intégrée pour tester la sécurité des applications web.',
        features: [
            'Proxy intercepteur',
            'Scanner de vulnérabilités',
            'Intruder pour les attaques',
            'Repeater pour les tests',
            'Extensions communautaires'
        ],
        installation: {
            debian: 'apt-get install burpsuite',
            redhat: 'Télécharger depuis PortSwigger',
            arch: 'yay -S burpsuite',
            macos: 'Télécharger depuis PortSwigger',
            windows: 'Télécharger depuis PortSwigger'
        },
        usage: 'burpsuite',
        links: {
            official: 'https://portswigger.net/burp',
            github: 'https://github.com/PortSwigger',
            docs: 'https://portswigger.net/burp/documentation'
        },
        icon: '🕷️'
    },
    {
        id: 'owasp-zap',
        name: 'OWASP ZAP',
        category: 'web-testing',
        platform: 'web',
        description: 'Proxy de sécurité pour applications web open source.',
        features: [
            'Proxy intercepteur',
            'Scanner automatique',
            'Fuzzing intégré',
            'API REST',
            'Extensions multiples'
        ],
        installation: {
            debian: 'apt-get install zaproxy',
            redhat: 'yum install zaproxy',
            arch: 'pacman -S zaproxy',
            macos: 'brew install zaproxy',
            windows: 'Télécharger depuis OWASP'
        },
        usage: 'zaproxy',
        links: {
            official: 'https://www.zaproxy.org',
            github: 'https://github.com/zaproxy/zaproxy',
            docs: 'https://www.zaproxy.org/docs/'
        },
        icon: '🛡️'
    },

    // Network Analysis
    {
        id: 'wireshark',
        name: 'Wireshark',
        category: 'network-analysis',
        platform: 'network',
        description: 'Analyseur de protocole réseau le plus populaire au monde.',
        features: [
            'Capture de paquets en temps réel',
            'Analyse de centaines de protocoles',
            'Interface graphique intuitive',
            'Filtres avancés',
            'Export dans de nombreux formats'
        ],
        installation: {
            debian: 'apt-get install wireshark',
            redhat: 'yum install wireshark',
            arch: 'pacman -S wireshark-qt',
            macos: 'brew install wireshark',
            windows: 'winget install wireshark'
        },
        usage: 'wireshark',
        links: {
            official: 'https://www.wireshark.org',
            github: 'https://github.com/wireshark/wireshark',
            docs: 'https://www.wireshark.org/docs/'
        },
        icon: '📡'
    },
    {
        id: 'tcpdump',
        name: 'tcpdump',
        category: 'network-analysis',
        platform: 'linux',
        description: 'Analyseur de paquets en ligne de commande.',
        features: [
            'Capture en ligne de commande',
            'Filtres BPF',
            'Output personnalisable',
            'Analyse en temps réel',
            'Léger et rapide'
        ],
        installation: {
            debian: 'apt-get install tcpdump',
            redhat: 'yum install tcpdump',
            arch: 'pacman -S tcpdump',
            macos: 'brew install tcpdump',
            windows: 'Utiliser WinDump'
        },
        usage: 'tcpdump -i eth0 -w capture.pcap',
        links: {
            official: 'https://www.tcpdump.org',
            github: 'https://github.com/the-tcpdump-group/tcpdump',
            docs: 'https://www.tcpdump.org/manpages/'
        },
        icon: '📊'
    },

    // Password Attacks
    {
        id: 'john',
        name: 'John the Ripper',
        category: 'password-attacks',
        platform: 'linux',
        description: 'Outil de craquage de mots de passe rapide et flexible.',
        features: [
            'Support de nombreux formats de hash',
            'Attaques par dictionnaire',
            'Attaques par force brute',
            'Règles personnalisables',
            'Mode distribué'
        ],
        installation: {
            debian: 'apt-get install john',
            redhat: 'yum install john',
            arch: 'pacman -S john',
            macos: 'brew install john',
            windows: 'Télécharger depuis openwall.com'
        },
        usage: 'john --wordlist=rockyou.txt hashes.txt',
        links: {
            official: 'https://www.openwall.com/john/',
            github: 'https://github.com/openwall/john',
            docs: 'https://www.openwall.com/john/doc/'
        },
        icon: '🔑'
    },
    {
        id: 'hashcat',
        name: 'Hashcat',
        category: 'password-attacks',
        platform: 'linux',
        description: 'Outil de récupération de mots de passe le plus rapide au monde.',
        features: [
            'Support GPU/CPU',
            'Plus de 300 types de hash',
            'Attaques hybrides',
            'Règles avancées',
            'Mode distribué'
        ],
        installation: {
            debian: 'apt-get install hashcat',
            redhat: 'yum install hashcat',
            arch: 'pacman -S hashcat',
            macos: 'brew install hashcat',
            windows: 'winget install hashcat'
        },
        usage: 'hashcat -m 1000 -a 0 hashes.txt wordlist.txt',
        links: {
            official: 'https://hashcat.net/hashcat/',
            github: 'https://github.com/hashcat/hashcat',
            docs: 'https://hashcat.net/wiki/'
        },
        icon: '⚡'
    },
    {
        id: 'hydra',
        name: 'Hydra',
        category: 'password-attacks',
        platform: 'linux',
        description: 'Outil de brute force pour services réseau.',
        features: [
            'Support de nombreux protocoles',
            'Attaques parallèles',
            'Listes de mots personnalisées',
            'Modules extensibles',
            'Interface graphique disponible'
        ],
        installation: {
            debian: 'apt-get install hydra',
            redhat: 'yum install hydra',
            arch: 'pacman -S hydra',
            macos: 'brew install hydra',
            windows: 'Compilation manuelle'
        },
        usage: 'hydra -l admin -P passwords.txt ssh://target.com',
        links: {
            official: 'https://github.com/vanhauser-thc/thc-hydra',
            github: 'https://github.com/vanhauser-thc/thc-hydra',
            docs: 'https://github.com/vanhauser-thc/thc-hydra/blob/master/README'
        },
        icon: '🐉'
    },

    // Wireless
    {
        id: 'aircrack',
        name: 'Aircrack-ng',
        category: 'wireless',
        platform: 'linux',
        description: 'Suite complète d\'outils pour auditer les réseaux WiFi.',
        features: [
            'Capture de paquets WiFi',
            'Craquage de clés WEP/WPA',
            'Attaques de déauthentification',
            'Injection de paquets',
            'Analyse de trafic'
        ],
        installation: {
            debian: 'apt-get install aircrack-ng',
            redhat: 'yum install aircrack-ng',
            arch: 'pacman -S aircrack-ng',
            macos: 'brew install aircrack-ng',
            windows: 'Télécharger depuis aircrack-ng.org'
        },
        usage: 'airmon-ng start wlan0',
        links: {
            official: 'https://www.aircrack-ng.org',
            github: 'https://github.com/aircrack-ng/aircrack-ng',
            docs: 'https://www.aircrack-ng.org/doku.php'
        },
        icon: '📶'
    },
    {
        id: 'kismet',
        name: 'Kismet',
        category: 'wireless',
        platform: 'linux',
        description: 'Détecteur de réseaux sans fil, sniffer et système de détection d\'intrusion.',
        features: [
            'Détection passive',
            'Support multi-protocoles',
            'Interface web',
            'Logging avancé',
            'Plugins extensibles'
        ],
        installation: {
            debian: 'apt-get install kismet',
            redhat: 'yum install kismet',
            arch: 'pacman -S kismet',
            macos: 'brew install kismet',
            windows: 'Non supporté nativement'
        },
        usage: 'kismet',
        links: {
            official: 'https://www.kismetwireless.net',
            github: 'https://github.com/kismetwireless/kismet',
            docs: 'https://www.kismetwireless.net/docs/'
        },
        icon: '📻'
    },

    // Utilities
    {
        id: 'netcat',
        name: 'Netcat',
        category: 'utilities',
        platform: 'linux',
        description: 'Couteau suisse TCP/IP pour la lecture et l\'écriture de connexions réseau.',
        features: [
            'Client/Serveur TCP/UDP',
            'Port scanning',
            'Transfert de fichiers',
            'Backdoor simple',
            'Tunneling'
        ],
        installation: {
            debian: 'apt-get install netcat-openbsd',
            redhat: 'yum install nc',
            arch: 'pacman -S openbsd-netcat',
            macos: 'brew install netcat',
            windows: 'Télécharger ncat'
        },
        usage: 'nc -lvp 4444',
        links: {
            official: 'http://netcat.sourceforge.net',
            github: 'https://github.com/diegocr/netcat',
            docs: 'https://linux.die.net/man/1/nc'
        },
        icon: '🔌'
    },
    {
        id: 'socat',
        name: 'Socat',
        category: 'utilities',
        platform: 'linux',
        description: 'Relais de données bidirectionnel entre deux canaux de données indépendants.',
        features: [
            'Tunneling avancé',
            'Support SSL/TLS',
            'Redirection de ports',
            'Proxy SOCKS',
            'Transfert de fichiers'
        ],
        installation: {
            debian: 'apt-get install socat',
            redhat: 'yum install socat',
            arch: 'pacman -S socat',
            macos: 'brew install socat',
            windows: 'Compilation manuelle'
        },
        usage: 'socat TCP-LISTEN:8080,fork TCP:target.com:80',
        links: {
            official: 'http://www.dest-unreach.org/socat/',
            github: 'https://github.com/3ndG4me/socat',
            docs: 'http://www.dest-unreach.org/socat/doc/socat.html'
        },
        icon: '🔗'
    },
    {
        id: 'curl',
        name: 'cURL',
        category: 'utilities',
        platform: 'web',
        description: 'Outil en ligne de commande pour transférer des données avec des URL.',
        features: [
            'Support de nombreux protocoles',
            'Headers personnalisés',
            'Authentification',
            'Cookies',
            'Proxy support'
        ],
        installation: {
            debian: 'apt-get install curl',
            redhat: 'yum install curl',
            arch: 'pacman -S curl',
            macos: 'brew install curl',
            windows: 'winget install curl'
        },
        usage: 'curl -X GET http://target.com',
        links: {
            official: 'https://curl.se',
            github: 'https://github.com/curl/curl',
            docs: 'https://curl.se/docs/'
        },
        icon: '🌐'
    },

    // Forensics
    {
        id: 'volatility',
        name: 'Volatility',
        category: 'forensics',
        platform: 'linux',
        description: 'Framework d\'analyse de mémoire volatile.',
        features: [
            'Analyse de dumps mémoire',
            'Extraction d\'artefacts',
            'Support multi-OS',
            'Plugins extensibles',
            'Timeline analysis'
        ],
        installation: {
            debian: 'pip3 install volatility3',
            redhat: 'pip3 install volatility3',
            arch: 'pip3 install volatility3',
            macos: 'pip3 install volatility3',
            windows: 'pip3 install volatility3'
        },
        usage: 'vol.py -f memory.dump windows.info',
        links: {
            official: 'https://www.volatilityfoundation.org',
            github: 'https://github.com/volatilityfoundation/volatility3',
            docs: 'https://volatility3.readthedocs.io'
        },
        icon: '🧠'
    },
    {
        id: 'autopsy',
        name: 'Autopsy',
        category: 'forensics',
        platform: 'linux',
        description: 'Plateforme d\'investigation numérique open source.',
        features: [
            'Interface graphique',
            'Analyse de disques',
            'Timeline analysis',
            'Recherche de mots-clés',
            'Rapports automatiques'
        ],
        installation: {
            debian: 'Télécharger depuis sleuthkit.org',
            redhat: 'Télécharger depuis sleuthkit.org',
            arch: 'yay -S autopsy',
            macos: 'Télécharger depuis sleuthkit.org',
            windows: 'Télécharger depuis sleuthkit.org'
        },
        usage: 'autopsy',
        links: {
            official: 'https://www.sleuthkit.org/autopsy/',
            github: 'https://github.com/sleuthkit/autopsy',
            docs: 'https://www.sleuthkit.org/autopsy/docs/'
        },
        icon: '🔍'
    }
];

// Variables globales
let filteredTools = [...toolsDatabase];
let currentView = 'grid';
let currentOS = 'debian';

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initializeToolsPage();
    setupEventListeners();
    renderTools();
    updateStats();
});

// Configuration des event listeners
function setupEventListeners() {
    // Recherche
    const searchInput = document.getElementById('toolSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }

    // Filtres
    const categoryFilter = document.getElementById('categoryFilter');
    const platformFilter = document.getElementById('platformFilter');
    
    if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
    if (platformFilter) platformFilter.addEventListener('change', applyFilters);

    // Boutons de vue
    const gridViewBtn = document.getElementById('gridView');
    const listViewBtn = document.getElementById('listView');
    
    if (gridViewBtn) gridViewBtn.addEventListener('click', () => setView('grid'));
    if (listViewBtn) listViewBtn.addEventListener('click', () => setView('list'));

    // Onglets d'installation
    document.querySelectorAll('.install-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            currentOS = e.target.dataset.os;
            updateInstallTabs();
            generateInstallCommands();
        });
    });

    // Boutons d'action
    const clearFiltersBtn = document.getElementById('clearFilters');
    const resetSearchBtn = document.getElementById('resetSearch');
    
    if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', clearAllFilters);
    if (resetSearchBtn) resetSearchBtn.addEventListener('click', clearAllFilters);

    // Modal
    const modal = document.getElementById('toolModal');
    const closeBtn = document.querySelector('.modal-close');
    
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // Échapper pour fermer la modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}

// Initialisation de la page
function initializeToolsPage() {
    // Détecter l'OS de l'utilisateur
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('mac')) currentOS = 'macos';
    else if (userAgent.includes('win')) currentOS = 'windows';
    else currentOS = 'debian';

    updateInstallTabs();
    generateInstallCommands();
}

// Gestion de la recherche
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    applyFilters(searchTerm);
}

// Application des filtres
function applyFilters(searchTerm = '') {
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';
    const platformFilter = document.getElementById('platformFilter')?.value || '';
    const searchInput = document.getElementById('toolSearch');
    const currentSearchTerm = searchTerm || (searchInput ? searchInput.value.toLowerCase() : '');

    filteredTools = toolsDatabase.filter(tool => {
        const matchesSearch = !currentSearchTerm || 
            tool.name.toLowerCase().includes(currentSearchTerm) ||
            tool.description.toLowerCase().includes(currentSearchTerm) ||
            tool.features.some(feature => feature.toLowerCase().includes(currentSearchTerm));

        const matchesCategory = !categoryFilter || tool.category === categoryFilter;
        const matchesPlatform = !platformFilter || tool.platform === platformFilter;

        return matchesSearch && matchesCategory && matchesPlatform;
    });

    renderTools();
    updateStats();
    generateInstallCommands();
}

// Effacement de tous les filtres
function clearAllFilters() {
    const searchInput = document.getElementById('toolSearch');
    const categoryFilter = document.getElementById('categoryFilter');
    const platformFilter = document.getElementById('platformFilter');

    if (searchInput) searchInput.value = '';
    if (categoryFilter) categoryFilter.value = '';
    if (platformFilter) platformFilter.value = '';

    filteredTools = [...toolsDatabase];
    renderTools();
    updateStats();
    generateInstallCommands();
}

// Rendu des outils
function renderTools() {
    const container = document.getElementById('toolsContainer');
    const noToolsMessage = document.getElementById('noToolsMessage');

    if (!container) return;

    if (filteredTools.length === 0) {
        container.style.display = 'none';
        if (noToolsMessage) noToolsMessage.style.display = 'block';
        return;
    }

    container.style.display = 'grid';
    if (noToolsMessage) noToolsMessage.style.display = 'none';

    container.innerHTML = filteredTools.map(tool => createToolCard(tool)).join('');

    // Ajouter les event listeners pour les cartes
    container.querySelectorAll('.tool-card').forEach(card => {
        card.addEventListener('click', () => {
            const toolId = card.dataset.toolId;
            openToolModal(toolId);
        });
    });
}

// Création d'une carte d'outil
function createToolCard(tool) {
    const platformIcons = {
        linux: '🐧',
        windows: '🪟',
        macos: '🍎',
        web: '🌐',
        mobile: '📱',
        network: '🌐'
    };

    return `
        <div class="tool-card" data-tool-id="${tool.id}">
            <div class="tool-header">
                <span class="tool-icon">${tool.icon}</span>
                <div class="tool-info">
                    <h3 class="tool-name">${tool.name}</h3>
                    <div class="tool-meta">
                        <span class="tool-platform">${platformIcons[tool.platform]} ${tool.platform}</span>
                        <span class="tool-category">${tool.category}</span>
                    </div>
                </div>
            </div>
            <p class="tool-description">${tool.description}</p>
            <div class="tool-features">
                ${tool.features.slice(0, 3).map(feature => `<span class="feature-tag">${feature}</span>`).join('')}
                ${tool.features.length > 3 ? `<span class="feature-more">+${tool.features.length - 3} plus</span>` : ''}
            </div>
            <div class="tool-actions">
                <button class="tool-action-btn details-btn" onclick="event.stopPropagation(); openToolModal('${tool.id}')">
                    📖 Voir les détails
                </button>
            </div>
        </div>
    `;
}

// Mise à jour des statistiques
function updateStats() {
    const totalToolsEl = document.getElementById('totalTools');
    const filteredToolsEl = document.getElementById('filteredTools');
    const categoriesCountEl = document.getElementById('categoriesCount');

    if (totalToolsEl) totalToolsEl.textContent = toolsDatabase.length;
    if (filteredToolsEl) filteredToolsEl.textContent = filteredTools.length;
    
    if (categoriesCountEl) {
        const categories = new Set(toolsDatabase.map(tool => tool.category));
        categoriesCountEl.textContent = categories.size;
    }
}

// Changement de vue
function setView(view) {
    currentView = view;
    const container = document.getElementById('toolsContainer');
    const gridBtn = document.getElementById('gridView');
    const listBtn = document.getElementById('listView');

    if (!container) return;

    if (view === 'grid') {
        container.className = 'tools-grid';
        if (gridBtn) gridBtn.classList.add('active');
        if (listBtn) listBtn.classList.remove('active');
    } else {
        container.className = 'tools-list';
        if (gridBtn) gridBtn.classList.remove('active');
        if (listBtn) listBtn.classList.add('active');
    }
}

// Gestion des onglets d'installation
function updateInstallTabs() {
    document.querySelectorAll('.install-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.os === currentOS);
    });
}

// Génération des commandes d'installation
function generateInstallCommands() {
    const installCommandsEl = document.getElementById('installCommands');
    if (!installCommandsEl) return;

    const commands = filteredTools
        .filter(tool => tool.installation[currentOS])
        .map(tool => `# ${tool.name}\n${tool.installation[currentOS]}`)
        .join('\n\n');

    installCommandsEl.innerHTML = `<pre><code>${commands}</code></pre>`;
}

// Ouverture de la modal d'outil
function openToolModal(toolId) {
    const tool = toolsDatabase.find(t => t.id === toolId);
    if (!tool) return;

    // Remplir les informations
    const modalElements = {
        modalToolName: tool.name,
        modalToolCategory: tool.category,
        modalToolPlatform: tool.platform,
        modalToolDescription: tool.description,
        modalInstallCommand: tool.installation[currentOS] || 'Non disponible pour cette plateforme',
        modalUsageExample: tool.usage
    };

    Object.entries(modalElements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });

    // Features
    const featuresList = document.getElementById('modalToolFeatures');
    if (featuresList) {
        featuresList.innerHTML = tool.features.map(feature => `<li>${feature}</li>`).join('');
    }

    // Links
    const links = {
        modalOfficialLink: tool.links.official,
        modalGithubLink: tool.links.github,
        modalDocsLink: tool.links.docs
    };

    Object.entries(links).forEach(([id, href]) => {
        const element = document.getElementById(id);
        if (element) element.href = href;
    });

    // Afficher la modal
    const modal = document.getElementById('toolModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

// Fermeture de la modal
function closeModal() {
    const modal = document.getElementById('toolModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Fonction utilitaire pour copier dans le presse-papiers
function copyToClipboard(text) {
    if (typeof text === 'string') {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Texte copié dans le presse-papiers!', 'success');
        }).catch(err => {
            console.error('Erreur lors de la copie:', err);
            showNotification('Erreur lors de la copie', 'error');
        });
    } else {
        const element = document.getElementById(text);
        if (element) {
            navigator.clipboard.writeText(element.textContent).then(() => {
                showNotification('Texte copié dans le presse-papiers!', 'success');
            }).catch(err => {
                console.error('Erreur lors de la copie:', err);
                showNotification('Erreur lors de la copie', 'error');
            });
        }
    }
}

// Fonction utilitaire pour les notifications
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    const colors = {
        success: '#10b981',
        error: '#ef4444',
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

// Fonction utilitaire debounce
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

// Ajout des styles pour les animations
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