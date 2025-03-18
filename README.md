# Pentesting Template Generator

![Pentesting Template Generator](screenshot.png)

Un générateur de rapports de pentests dynamique qui facilite la création de templates Markdown pour documenter vos tests d'intrusion.

## 🚀 Fonctionnalités

- **Génération automatique** de templates de rapports de pentest
- **Sélection dynamique** des services découverts (HTTP, SMB, FTP, etc.)
- **Prévisualisation en temps réel** du rapport formaté en Markdown
- **Mode Assumed Breach** pour les tests avec identifiants existants
- **Mode Exegol** pour la génération de one-liners avec variables d'environnement
- **Bibliothèque d'outils** avec commandes prêtes à l'emploi
- **Guide d'escalade de privilèges** avec checklists pour Linux et Windows
- **Section Pivoting** avec commandes pour les outils de tunneling
- **Mode Nuit** pour réduire la fatigue visuelle
- **Compatible avec Obsidian** pour l'export direct

## 🏗️ Structure du Template

Le template généré inclut les sections suivantes:
- Informations sur la box (nom, IP)
- Récapitulatif des services ouverts
- Sections détaillées pour chaque service sélectionné
- Espaces pour les notes de l'attaquant
- Checklists adaptées pour Windows ou Linux

## 💻 Installation et utilisation

### Option 1: Docker (recommandée)

```bash
# Cloner le dépôt
git clone https://github.com/votre-repo/pentesting-template-generator.git
cd pentesting-template-generator

# Lancer l'application avec Docker Compose
docker-compose up -d
```

L'application sera accessible à l'adresse http://localhost:8081

### Option 2: Serveur web standard

Placez les fichiers dans votre serveur web (Apache, Nginx, etc.) et accédez-y via votre navigateur.

## 🧩 Modules disponibles

### Services supportés
- HTTP/HTTPS
- SMB
- FTP
- SSH
- LDAP
- MSSQL
- MySQL
- RDP
- WinRM
- et plus...

### Pages spéciales
- **Générateur de Rapport**: Page principale pour créer des templates
- **Bibliothèque d'outils**: Commandes et outils prêts à l'emploi
- **Guide d'escalade de privilèges**: Checklists pour Linux/Windows

## 🔧 Fonctionnalités avancées

### Mode Assumed Breach
Permet de générer un template avec des identifiants déjà connus, utile pour:
- Tests d'intrusion internes
- Tests de post-exploitation
- Tests de contrôle d'accès

### Mode Exegol
Génère automatiquement un one-liner pour définir les variables d'environnement dans Exegol:
```bash
export USER="username" PASSWORD="p@ssw0rd" DOMAIN="contoso.local" IP="10.10.10.10"
```

### Outils de Pivoting
Documentation prête à l'emploi pour:
- Ligolo-ng
- Chisel
- SSHuttle

### Mode Nuit
Bascule entre un thème clair et sombre pour réduire la fatigue visuelle lors des sessions nocturnes.

## 🖥️ Compatibilité

- Tous les navigateurs modernes (Chrome, Firefox, Edge, Safari)
- Responsive design pour PC/tablettes
- Export compatible avec Markdown standard et Obsidian

## 🤝 Contribuer

Les contributions sont bienvenues ! N'hésitez pas à soumettre des PR pour ajouter de nouveaux modules d'exploitation ou améliorer les fonctionnalités existantes.

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

---

Made with ❤️ by Elliot Belt 