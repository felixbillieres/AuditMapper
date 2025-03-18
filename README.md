# Pentesting Template Generator

![Pentesting Template Generator](screenshot.png)

Un générateur de rapports de pentests dynamique qui facilite la création de templates Markdown pour documenter vos tests d'intrusion.

## 🚀 Fonctionnalités

- **Génération automatique** de templates de rapports de pentest
- **Sélection dynamique** des services découverts (HTTP, SMB, FTP, etc.)
- **Prévisualisation en temps réel** du rapport formaté en Markdown
- **Intégration avec Obsidian** pour une documentation efficace
- **Export en Markdown** pour une utilisation flexible
- **Bibliothèque d'outils** avec commandes de référence

## 📋 Comment utiliser

1. Saisissez le nom de la box et son adresse IP
2. Sélectionnez le type de template (Standard ou Active Directory)
3. Cochez les services que vous avez détectés lors de votre scan
4. Prévisualisez le rapport généré
5. Copiez ou téléchargez le Markdown pour l'utiliser dans votre documentation

## 🛠️ Technologies utilisées

- HTML5, CSS3, JavaScript (vanilla)
- Marked.js pour le rendu Markdown
- Serveur HTTP pour le développement et les tests

## 📁 Structure du projet

```
pentesting-template-generator/
├── assets/
│   ├── css/
│   │   └── styles.css
│   └── js/
│       └── main.js
├── exploitationDetails/
│   ├── FTP.md
│   ├── HTTP.md
│   ├── LDAP.md
│   ├── MSSQL.md
│   ├── RPC.md
│   ├── SMB.md
│   └── ...
├── pages/
│   ├── index.html
│   └── tools.html
├── tools/
│   ├── IPScan.py
│   └── usernamegenerator.py
├── docker-compose.yml
├── Dockerfile
└── README.md
```

## 🐳 Démarrage avec Docker

### Option 1: Docker Compose (recommandée)

```bash
# Cloner le dépôt
git clone https://github.com/your-username/pentesting-template-generator.git
cd pentesting-template-generator

# Lancer avec Docker Compose
docker-compose up
```

Puis visitez http://localhost:8080 dans votre navigateur.

### Option 2: Docker sans Compose

```bash
# Construire l'image
docker build -t pentesting-template-generator .

# Lancer le conteneur
docker run -p 8080:80 pentesting-template-generator
```

## 💻 Installation locale (sans Docker)

```bash
# Cloner le dépôt
git clone https://github.com/your-username/pentesting-template-generator.git
cd pentesting-template-generator

# Lancer un serveur Python
python3 -m http.server 8080
```

Puis visitez http://localhost:8080 dans votre navigateur.

## 🤝 Contribuer

Les contributions sont bienvenues ! N'hésitez pas à soumettre des PR pour ajouter de nouveaux modules d'exploitation ou améliorer les fonctionnalités existantes.

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

---

Made with ❤️ by Elliot Belt 