# Pentest Tools

![Pentesting Template Generator](screenshot.png)

Un générateur de rapports de pentests dynamique qui facilite la création de templates Markdown pour documenter vos tests d'intrusion.

image.png

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

## Plus de détails:

### Générateur de Rapport
- Création de rapports au format Markdown avec des templates
- Gestion des éléments de preuve (captures d'écran, code, etc.)
- Export en différents formats

image.png

image.png

### Bibliothèque d'Outils
- Collection de commandes utiles pour les tests d'intrusion
- Outils classés par catégorie (reconnaissance, exploitation, post-exploitation)
- Commandes prêtes à être copiées-collées

### Guide Privesc
- Checklist pour l'escalade de privilèges sur Windows et Linux
- Ressources et 

image.png

### /etc/hosts Maker
- Convertit les outputs de scan (ex: CrackMapExec) en entrées pour /etc/hosts
- Facilite la gestion des noms d'hôtes pour les engagements internes

image.png

### Grep Master
- Analyse intelligente d'outputs de commandes de pentest
- Extraction automatique d'informations pertinentes
- Formatage des résultats pour inclusion dans des rapports

image.png

### Rapport de Vulnérabilités
- Génération rapide de descriptions de vulnérabilités
- Support pour les captures d'écran (drag & drop)
- Création de tableaux récapitulatifs de vulnérabilités
- Export en Markdown ou format 

image.png

image.png

## Installation

```bash
git clone https://github.com/your-username/pentest-tools.git
cd pentest-tools
# Lancer avec un serveur web simple comme Python HTTP Server
python3 -m http.server
```

## Utilisation

Accédez à `http://localhost:8000` dans votre navigateur pour commencer à utiliser les outils.

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## Licence

Ce projet est sous licence MIT. 