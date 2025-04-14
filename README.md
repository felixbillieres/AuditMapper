# Pentest Tools Suite

Une collection d'outils web conçue pour assister les professionnels de la sécurité lors des tests d'intrusion. Ce projet vise à rationaliser les tâches courantes telles que la génération de rapports, la gestion des données collectées et l'exécution de commandes répétitives.

## Fonctionnalités Principales

*   **Générateur de Rapports Dynamique** : Créez des templates de rapports de pentest au format Markdown. Sélectionnez les services découverts pour inclure automatiquement les checklists et commandes pertinentes (`assets/js/main.js` lignes 27-89).
*   **Host Manager Avancé** : Gérez les hôtes découverts, leurs informations (notes, services, credentials), visualisez les relations sous forme de carte réseau, agrégez les credentials et générez des rapports "killchain" (`assets/js/hostmanager_v2.js`, `pages/hostmanager.html`).
*   **Grep Master** : Analysez et extrayez des informations spécifiques (utilisateurs, hashes, mots de passe, IPs, emails) à partir des outputs bruts de divers outils de pentest (Secretsdump, LSASS dump, NXC, etc.) (`assets/js/grepmaster.js`, `pages/grepmaster.html` lignes 105-127).
*   **`/etc/hosts` Maker** : Convertissez rapidement la sortie des scans réseau (ex: NXC SMB) en entrées formatées pour le fichier `/etc/hosts` (`assets/js/hostsmaker.js` lignes 11-73).
*   **Bibliothèque d'Outils** : Accédez à une collection de commandes utiles pour différentes phases du pentest (reconnaissance, exploitation, post-exploitation), prêtes à être copiées (`pages/tools.html` lignes 20-42).
*   **Guides d'Escalade de Privilèges** : Consultez des checklists pour les techniques d'escalade de privilèges sous Windows et Linux (`pages/privesc.html`).
*   **Générateur de Noms d'Utilisateur** : Script Python pour générer des listes de noms d'utilisateur potentielles basées sur des formats courants (`tools/usernamegenerator.py` lignes 33-53).
*   **Scanner de Reconnaissance (IPScan.py)** : Script Python pour l'énumération initiale et l'analyse des versions des services (`tools/IPScan.py` lignes 76-99).
*   **Rapporteur de Vulnérabilités** : Facilite la création de descriptions standardisées de vulnérabilités et de tableaux récapitulatifs (`pages/vulnreport.html`).
*   **Support Docker** : Déployez facilement l'application à l'aide de Docker (`Dockerfile` lignes 1-15).
*   **Mode Nuit** : Thème sombre disponible pour réduire la fatigue visuelle.

## Structure de l'Application

L'application est principalement accessible via une interface web. Les différentes fonctionnalités sont organisées en sections distinctes :

*   **Accueil (`index.html`)** : Présentation générale et accès aux différents modules.
*   **Générateur de Rapport (`pages/index.html`)** : Module principal pour la création de rapports Markdown.
*   **Host Manager (`pages/hostmanager.html`)** : Outil avancé de gestion des hôtes et de cartographie.
*   **Outils (`pages/tools.html`, `pages/privesc.html`)** : Bibliothèques de commandes et guides.
*   **Parsers (`pages/hostsmaker.html`, `pages/grepmaster.html`)** : Outils d'analyse et de formatage de données.
*   **Rapport de Vulnérabilités (`pages/vulnreport.html`)** : Aide à la rédaction de sections de vulnérabilités.

Des scripts Python complémentaires (`tools/`) peuvent être utilisés en ligne de commande.

## Installation

### Méthode 1 : Serveur Web Simple (Python)

1.  Clonez le dépôt :
    ```bash
    git clone https://github.com/your-username/pentest-tools.git
    cd pentest-tools
    ```
2.  Lancez un serveur web local :
    ```bash
    python3 -m http.server 8000
    # Ou pour Python 2: python -m SimpleHTTPServer 8000
    ```
3.  Accédez à l'application dans votre navigateur via `http://localhost:8000`.

### Méthode 2 : Docker

1.  Assurez-vous que Docker est installé et en cours d'exécution.
2.  Clonez le dépôt (si ce n'est pas déjà fait) :
    ```bash
    git clone https://github.com/your-username/pentest-tools.git
    cd pentest-tools
    ```
3.  Construisez l'image Docker :
    ```bash
    docker build -t pentest-tools-suite .
    ```
4.  Lancez un conteneur :
    ```bash
    docker run -d -p 8080:80 --name pentest-tools-app pentest-tools-suite
    ```
5.  Accédez à l'application dans votre navigateur via `http://localhost:8080`.

## Utilisation

Une fois l'application lancée (via Python ou Docker), ouvrez votre navigateur web et accédez à l'URL correspondante (`http://localhost:8000` ou `http://localhost:8080` par défaut). Naviguez entre les différentes sections à l'aide de la barre latérale pour utiliser les outils souhaités.

## Technologies Utilisées

*   Frontend : HTML5, CSS3, JavaScript (ES6+)
*   Bibliothèques JS : Vis.js (pour la cartographie), Marked.js (rendu Markdown), DOMPurify (sécurité)
*   Backend/Scripts : Python 3 (pour les outils en ligne de commande)
*   Conteneurisation : Docker, Nginx (image de base)

## Contribution

Les contributions sont les bienvenues ! Si vous souhaitez améliorer le projet, n'hésitez pas à ouvrir une *issue* pour discuter des changements ou à soumettre une *pull request*.

## Licence

Ce projet est distribué sous la licence MIT. Voir le fichier `LICENSE` pour plus de détails. 