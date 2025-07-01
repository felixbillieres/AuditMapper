# 🛡️ AuditMapper - Security Assessment Suite

<div align="center">
  <img src="/assets/photos/logo.png" alt="AuditMapper Logo" width="200" height="200">
  
  **Suite d'outils professionnels pour audits de sécurité et tests d'intrusion**
  
  [![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/felixbillieres/AuditMapper)
  [![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
  [![Status](https://img.shields.io/badge/status-En%20développement-orange.svg)](https://github.com/felixbillieres/AuditMapper)
</div>

---

## 📋 Table des Matières

- [À propos](#-à-propos)
- [⚠️ Avertissement](#️-avertissement-important)
- [🚀 Fonctionnalités](#-fonctionnalités-principales)
- [🛠️ Outils Disponibles](#️-outils-disponibles)
- [📸 Captures d'écran](#-captures-décran)
- [⚡ Démarrage Rapide](#-démarrage-rapide)
- [🔧 Installation](#-installation)
- [📖 Utilisation](#-utilisation)
- [🤝 Contribution](#-contribution)
- [📞 Contact](#-contact)

---

## 🎯 À propos

AuditMapper est une suite d'outils conçue pour rationaliser et optimiser les opérations des professionnels de la cybersécurité, en particulier lors des audits de sécurité et des tests d'intrusion. Développée avec une interface moderne et intuitive, elle vise à simplifier et automatiser les tâches récurrentes du pentesting.

### ✨ Points forts
- 🎨 **Interface moderne** et responsive
- 🔧 **Outils intégrés** pour tous les aspects du pentesting (en tout cas c'est le but)
- 📊 **Génération automatique** de rapports
- 🌙 **Support du thème sombre**
- 🌍 **Interface multilingue** (FR/EN) (bientôt l'implem de l'anglais)
- 📱 **Design responsive** pour tous les appareils

---

## ⚠️ Avertissement Important

> **🚨 PROJET EN COURS DE DÉVELOPPEMENT** 🚨

AuditMapper est un **projet en cours de développement actif**. Il s'agit d'un **side-project** développé par un étudiant donc ne pas utiliser ça si le projet est important / confidentiel, au risque de perdre de la data.

### ⚡ État actuel
- ✅ **Interface utilisateur** fonctionnelle
- ✅ **Outils de base** opérationnels
- 🔄 **Optimisations** en cours
- 🔄 **Tests complets** à effectuer

### 🚫 Limitations actuelles
- **Le code n'est pas encore optimisé** - Attendez-vous à des comportements inattendus
- **Non recommandé pour la production** - Utilisation à vos propres risques
- **Fonctionnalités en développement** - Certaines features peuvent être instables

### 💪 Engagement
Je m'engage à améliorer cet outil continuellement. Tous les retours, bugs et suggestions sont les bienvenus !

---

## 🚀 Fonctionnalités Principales

### 🖥️ **Host Manager**
Gérez vos hôtes de manière centralisée avec une interface graphique interactive.
- 📊 Visualisation réseau interactive
- 🏷️ Catégorisation automatique
- 📤 Export multi-format
- 📋 Génération de rapports

### 🌐 **Config Generator**
Générez automatiquement vos fichiers de configuration à partir de vos données d'audit.
- 📝 Fichiers `/etc/hosts`
- 🔐 Configuration Kerberos
- 🔗 ProxyChains setup
- 📋 Templates personnalisés

### 🔍 **Grep Master**
Parser intelligent pour extraire les informations utiles de vos outputs.
- 🔍 Extraction automatique
- 📄 Support multi-format
- 🎯 Filtrage avancé
- 📤 Export structuré

### 🔀 **Pivot Master**
Générateur de commandes de pivoting avec visualisation réseau.
- 🌐 Visualisation réseau
- ⚡ Commandes automatiques
- 🔌 Multi-protocoles
- 📚 Historique des pivots

### 🔑 **Guide Privesc**
Checklist interactive pour l'escalade de privilèges.
- ✅ Checklist contextuelle
- 📈 Suivi de progression
- 💻 Multi-plateformes
- 📊 Rapports détaillés

### 📊 **Rapport Generator**
Créez des rapports de vulnérabilités professionnels.
- 📋 Templates personnalisables
- 📤 Export multi-format
- 🖼️ Intégration de captures d'écran
- 🎨 Design professionnel

---

## 📸 Captures d'écran

### 🖥️ Host Manager
![Host Manager](/assets/photos/hostmanager.png)
*Interface de gestion centralisée des hôtes avec visualisation réseau*

### 🔍 Grep Master
![Grep Master](/assets/photos/grep.png)
*Parser intelligent pour l'extraction d'informations*

### 🔀 Pivot Master
![Pivot Master](/assets/photos/pivot.png)
*Générateur de commandes de pivoting avec visualisation*

### 📁 File Transfer
![File Transfer](/assets/photos/filetransfer.png)
*Interface de transfert de fichiers sécurisé*

---

## ⚡ Démarrage Rapide

### Prérequis
- 🌐 Navigateur web moderne (Chrome, Firefox, Safari, Edge)
- 📁 Serveur web local (optionnel pour le développement)

### 🚀 Lancement rapide
1. **Clonez le repository**
   ```bash
   git clone https://github.com/felixbillieres/AuditMapper.git
   cd AuditMapper
   ```

2. **Ouvrez l'application**
   ```bash
   # Option 1: Serveur Python simple
   python -m http.server 8000
   
   # Option 2: Serveur Node.js
   npx serve .
   
   # Option 3: Ouvrez directement index.html
   ```

3. **Accédez à l'application**
   ```
   http://localhost:8000
   ```

---

## 🔧 Installation

### Méthode 1: Installation locale
```bash
# Clonez le repository
git clone https://github.com/felixbillieres/AuditMapper.git

# Accédez au dossier
cd AuditMapper

# Lancez un serveur local
python -m http.server 8000
```

### Méthode 2: Docker (à venir)
```bash
# Build de l'image
docker build -t auditmapper .

# Lancement du conteneur
docker run -p 8080:80 auditmapper
```

### Méthode 3: Déploiement web
1. Uploadez les fichiers sur votre serveur web
2. Configurez votre serveur pour servir les fichiers statiques
3. Accédez à l'application via votre domaine

---

## 📖 Utilisation

### 🎯 Première utilisation
1. **Accédez à l'application** via votre navigateur
2. **Explorez les outils** disponibles dans la sidebar
3. **Commencez par le Host Manager** pour organiser vos hôtes
4. **Utilisez les autres outils** selon vos besoins

### 🛠️ Workflow recommandé
1. **Host Manager** → Organisez vos hôtes
2. **Config Generator** → Générez vos configurations
3. **Grep Master** → Analysez vos outputs
4. **Pivot Master** → Planifiez vos pivots
5. **Guide Privesc** → Suivez vos escalades
6. **Rapport Generator** → Créez vos rapports

### 🎨 Personnalisation
- **Thème sombre** : Cliquez sur l'icône 🌓
- **Langue** : Sélectionnez FR/EN dans le menu
- **Vue** : Basculez entre grille et liste dans les outils

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Voici comment contribuer :

### 🐛 Signaler un bug
1. Vérifiez que le bug n'a pas déjà été signalé
2. Créez une issue avec une description détaillée
3. Incluez les étapes pour reproduire le bug
4. Ajoutez des captures d'écran si possible

### 💡 Proposer une amélioration
1. Créez une issue avec le label "enhancement"
2. Décrivez clairement votre proposition
3. Expliquez pourquoi cette amélioration serait utile

### 🔧 Contribuer au code
1. Forkez le repository
2. Créez une branche pour votre feature
3. Committez vos changements
4. Créez une Pull Request

### 📝 Améliorer la documentation
1. Corrigez les erreurs de typo
2. Améliorez la clarté des explications
3. Ajoutez des exemples d'utilisation

---

## 📞 Contact

### 👨‍💻 Développeur
**Elliot Belt** - Pentester Junior & CTF player @ Phreaks 2600

### 🌐 Liens utiles
- **Portfolio** : [felixbillieres.github.io](https://felixbillieres.github.io/)
- **GitHub** : [@felixbillieres](https://github.com/felixbillieres)
- **LinkedIn** : [Elliot Belt](https://linkedin.com/in/elliot-belt)

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

<div align="center">
  <p>Made with ❤️ by <strong>Elliot Belt</strong></p>
  <p>AuditMapper - Security Assessment Suite</p>
</div>
