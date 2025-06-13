# AuditMapper - Guide de Design MVP

## 📋 Vue d'ensemble

Ce guide définit la structure, le design et les composants standards pour toutes les pages de l'application AuditMapper, basé sur l'analyse de la page hostmanager existante.

---

## 🎨 Système de Design et Couleurs

### Palette de Couleurs Principale

**Mode Clair :**
- **Arrière-plan principal :** `#f0f2f5`
- **Arrière-plan cartes :** `#ffffff`
- **Couleur primaire :** `#3498db`
- **Couleur primaire hover :** `#2980b9`
- **Couleur texte :** `#333333`
- **Couleur heading :** `#2c3e50`
- **Couleur secondaire :** `#34495e`

**Mode Sombre :**
- **Variables CSS avec préfixes `--dark-`**
- **Arrière-plan principal :** Variables CSS dark
- **Auto-switch via classe `body.dark-theme`**

**Couleurs de Statut :**
```css
/* Succès */
.success-color { color: #28a745; }

/* Avertissement */
.warning-color { color: #ffc107; }

/* Danger */
.danger-color { color: #dc3545; }

/* Info */
.info-color { color: #17a2b8; }

/* Compromission Badges */
.compromise-none { background: #28a745; }
.compromise-low { background: #ffc107; color: #212529; }
.compromise-medium { background: #fd7e14; }
.compromise-high { background: #dc3545; }
.compromise-critical { background: #6f42c1; }
.compromise-full { background: #343a40; }
```

### Typographie

**Police Principale :**
```css
font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
```

**Police Alternative (Pages modernes) :**
```css
font-family: 'Inter', sans-serif;
```

**Importation Google Fonts :**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```

---

## 🏗️ Structure HTML Standard

### Template de Base

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[Page Title] - AuditMapper</title>
    
    <!-- CSS Dependencies -->
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
    <link rel="stylesheet" href="/assets/css/styles.css">
    <link rel="stylesheet" href="/assets/css/[page-specific].css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    
    <!-- JavaScript Dependencies -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.bundle.min.js"></script>
    <!-- Additional page-specific dependencies -->
    
    <!-- Page Info for Template Loader -->
    <script>
        window.pageInfo = {
            title: '[Page Display Title]',
            headerTitle: '[Header Title]',
            activePage: '[page-identifier]'
        };
    </script>
    <script src="/assets/js/template-loader.js"></script>
</head>
<body>
    <!-- Sidebar Toggle Button -->
    <!-- Sidebar -->
    <!-- Header -->
    <!-- Main Content -->
    <!-- Footer -->
    <!-- Scripts -->
</body>
</html>
```

---

## 📱 Composants Essentiels

### 1. Bouton Toggle Sidebar

```html
<button id="sidebar-toggle" class="sidebar-toggle">
    <i>☰</i>
</button>
```

### 2. Sidebar Unifiée

```html
<div id="sidebar" class="sidebar">
    <a href="/index.html" class="sidebar-header">
        <img src="/assets/photos/logo.png" alt="AuditMapper" class="sidebar-logo">
        <div class="sidebar-header-text">
            <h2>AuditMapper</h2>
            <p>Security Assessment Suite</p>
        </div>
    </a>
    
    <div class="sidebar-content">
        <ul class="sidebar-nav">
            <div class="sidebar-category">Management</div>
            <li class="sidebar-nav-item">
                <a href="/pages/hostmanager.html" class="sidebar-nav-link [active]">
                    <i>🖥️</i> Host Manager
                </a>
            </li>
            
            <div class="sidebar-category">Outils</div>
            <li class="sidebar-nav-item">
                <a href="/pages/tools.html" class="sidebar-nav-link">
                    <i>🛠️</i> Bibliothèque d'outils
                </a>
            </li>
            <li class="sidebar-nav-item">
                <a href="/pages/file_transfer.html" class="sidebar-nav-link">
                    <i>🔄</i> Transfert Fichiers
                </a>
            </li>
            <li class="sidebar-nav-item">
                <a href="/pages/pivoting_guide.html" class="sidebar-nav-link">
                    <i>🔀</i> Pivoting Guide
                </a>
            </li>
            <li class="sidebar-nav-item">
                <a href="/pages/privesc.html" class="sidebar-nav-link">
                    <i>🔑</i> Guide Privesc
                </a>
            </li>
            
            <div class="sidebar-category">Parsers & Générateurs</div>
            <li class="sidebar-nav-item">
                <a href="/pages/hostsmaker.html" class="sidebar-nav-link">
                    <i>🌐</i> Config Generator
                </a>
            </li>
            <li class="sidebar-nav-item">
                <a href="/pages/grepmaster.html" class="sidebar-nav-link">
                    <i>🔍</i> Grep Master
                </a>
            </li>
            <li class="sidebar-nav-item">
                <a href="/pages/vulnreport.html" class="sidebar-nav-link">
                    <i>📊</i> Vuln Report
                </a>
            </li>
        </ul>
    </div>
</div>
```

### 3. Header Standard

```html
<header id="main-header" class="main-header">
    <div class="header-container">
        <div class="header-content">
            <h1>[Titre de la page avec emoji]</h1>
            <p class="header-subtitle">[Description de la page]</p>
        </div>
        <div class="header-controls">
            <!-- Contrôles spécifiques selon la page -->
            <div class="search-container">
                <input type="text" id="searchInput" placeholder="Rechercher..." class="search-input">
                <button class="search-btn">🔍</button>
            </div>
            <div class="view-controls">
                <button id="gridView" class="view-btn active" title="Vue grille">⊞</button>
                <button id="listView" class="view-btn" title="Vue liste">☰</button>
            </div>
            <div class="language-selector">
                <select id="languageSelect" class="language-select">
                    <option value="fr">🇫🇷 Français</option>
                    <option value="en">🇬🇧 English</option>
                </select>
            </div>
            <button id="toggleTheme" class="theme-toggle">
                <i class="icon-theme">🌓</i>
            </button>
        </div>
    </div>
</header>
```

### 4. Zone de Contenu Principal

```html
<div id="main-content" class="main-content">
    <!-- Sections de contrôles/filtres si nécessaire -->
    <div class="page-controls">
        <div class="filters-section">
            <!-- Filtres spécifiques à la page -->
        </div>
        <div class="stats-section">
            <!-- Statistiques si applicables -->
        </div>
    </div>
    
    <!-- Contenu principal -->
    <div class="main-section">
        <!-- Contenu spécifique à la page -->
        <!-- Utiliser .form-section ou .card pour les zones de contenu -->
    </div>
    
    <!-- Sections additionnelles si nécessaire -->
</div>
```

### 5. Footer Standard

```html
<footer class="main-footer">
    <div class="footer-content">
        <p>Made with ❤️ by Elliot Belt - AuditMapper Security Suite</p>
    </div>
</footer>
```

---

## 📂 Structure JavaScript Standard

### Scripts de Base (Ordre Obligatoire)

```html
<!-- Scripts de base - TOUJOURS dans cet ordre -->
<script src="/assets/js/sidebar.js"></script>
<script src="/assets/js/theme.js"></script>
<script src="/assets/js/language.js"></script>

<!-- Scripts spécifiques à la page -->
<script src="/assets/js/[page-specific].js"></script>
```

### Template JavaScript de Base

```javascript
// Pattern standard pour chaque page
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

function initializePage() {
    // 1. Initialisation des composants de base
    initializeTheme();
    initializeLanguage();
    initializeSidebar();
    
    // 2. Initialisation spécifique à la page
    initializePageSpecificFeatures();
    
    // 3. Event listeners
    setupEventListeners();
}

function initializePageSpecificFeatures() {
    // Fonctionnalités spécifiques à implémenter
}

function setupEventListeners() {
    // Event listeners spécifiques à la page
}

// Export pour modules si nécessaire
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        initializePage,
        initializePageSpecificFeatures 
    };
}
```

---

## 🎨 Classes CSS Essentielles

### Layout de Base

```css
/* Zone principale de contenu */
.main-content {
    margin-left: 250px; /* Largeur sidebar */
    padding: 20px;
    transition: margin-left 0.3s ease;
}

.main-content.full-width {
    margin-left: 0;
}

/* Sections de formulaire */
.form-section {
    background-color: white;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

/* Cards Bootstrap personnalisées */
.card {
    border-radius: 8px;
    border: 1px solid #e3e6f0;
    box-shadow: 0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.15);
}
```

### Composants de Navigation

```css
/* Sidebar */
.sidebar {
    position: fixed;
    left: 0;
    top: 0;
    width: 250px;
    height: 100vh;
    background-color: #fff;
    box-shadow: 2px 0 10px rgba(0,0,0,0.1);
    z-index: 1000;
    transition: transform 0.3s ease;
}

.sidebar-nav-link.active {
    background-color: #3498db;
    color: white;
}

/* Header */
.main-header {
    background-color: white;
    border-bottom: 1px solid #e3e6f0;
    padding: 1rem 0;
    margin-left: 250px;
    transition: margin-left 0.3s ease;
}

.header-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 2rem;
}
```

### Contrôles et Boutons

```css
/* Toggle theme */
.theme-toggle {
    background-color: transparent;
    border: 1px solid #ddd;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
}

/* Boutons standards */
.btn {
    border-radius: 6px;
    padding: 8px 16px;
    font-weight: 500;
    transition: all 0.3s ease;
}

.btn-primary {
    background-color: #3498db;
    border-color: #3498db;
}

.btn-primary:hover {
    background-color: #2980b9;
    border-color: #2980b9;
}
```

### Mode Sombre

```css
/* Système de variables pour dark mode */
:root {
    --dark-bg-primary: #1a1a1a;
    --dark-bg-secondary: #2c2c2c;
    --dark-text-primary: #e0e0e0;
    --dark-text-secondary: #adb5bd;
    --dark-border-color: #404040;
}

body.dark-theme {
    background-color: var(--dark-bg-primary);
    color: var(--dark-text-primary);
}

body.dark-theme .sidebar {
    background-color: var(--dark-bg-secondary);
    border-right-color: var(--dark-border-color);
}

body.dark-theme .form-section,
body.dark-theme .card {
    background-color: var(--dark-bg-secondary);
    border-color: var(--dark-border-color);
    color: var(--dark-text-primary);
}
```

---

## 📱 Responsivité Standard

### Breakpoints

```css
/* Mobile First Approach */

/* Mobile (jusqu'à 768px) */
@media screen and (max-width: 768px) {
    .sidebar {
        transform: translateX(-100%);
    }
    
    .sidebar.sidebar-visible {
        transform: translateX(0);
    }
    
    .main-content {
        margin-left: 0;
    }
    
    .main-header {
        margin-left: 0;
    }
    
    .header-controls {
        flex-direction: column;
        gap: 10px;
    }
}

/* Tablette (768px à 992px) */
@media screen and (min-width: 768px) and (max-width: 992px) {
    .main-content {
        padding: 15px;
    }
}

/* Desktop (992px+) */
@media screen and (min-width: 992px) {
    .sidebar {
        transform: translateX(0);
    }
}
```

---

## 🔧 Fonctionnalités Standard

### 1. Système de Thème

**Fonctionnalités :**
- Toggle automatique light/dark mode
- Persistance dans localStorage
- Variables CSS pour tous les éléments
- Animation de transition fluide

**Implementation :**
```javascript
// Dans theme.js
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('darkMode', isDark);
}
```

### 2. Support Multi-langues

**Fonctionnalités :**
- Support FR/EN par défaut
- Persistance localStorage
- Système de traduction JavaScript
- Sélecteur dans header

### 3. Sidebar Responsive

**Fonctionnalités :**
- Auto-collapse sur mobile
- Toggle button toujours visible
- Navigation unifiée entre pages
- Highlight de la page active

### 4. Template Loader

**Fonctionnalités :**
- Chargement automatique des composants communs
- Configuration via `window.pageInfo`
- Évite la duplication de code

---

## 📊 Types de Pages Standards

### 1. Pages d'Outils (Type: Tools)
- **Exemple :** `tools.html`
- **Structure :** Grille d'outils avec filtres
- **Composants :** Search, filtres, cartes d'outils, modal détails

### 2. Pages de Management (Type: Manager)
- **Exemple :** `hostmanager.html`
- **Structure :** Interface complexe avec panneaux
- **Composants :** Onglets, formulaires, graphiques, export/import

### 3. Pages de Guide (Type: Guide)
- **Exemple :** `privesc.html`, `pivoting_guide.html`
- **Structure :** Contenu structuré avec navigation
- **Composants :** Sommaire, sections, code blocks, checklists

### 4. Pages de Générateur (Type: Generator)
- **Exemple :** `hostsmaker.html`, `grepmaster.html`
- **Structure :** Formulaire → Génération → Résultat
- **Composants :** Formulaires, preview, export

---

## ✅ Checklist d'Implémentation

### Pour Chaque Nouvelle Page :

**HTML Structure :**
- [ ] DOCTYPE html et meta tags standards
- [ ] Inclusion CSS dans le bon ordre
- [ ] Structure sidebar + header + main-content + footer
- [ ] Configuration `window.pageInfo`
- [ ] Scripts dans le bon ordre

**Composants Requis :**
- [ ] Sidebar avec navigation complète
- [ ] Header avec titre et contrôles appropriés
- [ ] Zone main-content avec sections appropriées
- [ ] Footer standard
- [ ] Support responsive

**Fonctionnalités :**
- [ ] Toggle theme fonctionnel
- [ ] Sélecteur de langue
- [ ] Sidebar responsive
- [ ] Page active highlightée dans sidebar

**CSS/JS :**
- [ ] Utilisation des classes standards
- [ ] Support dark mode
- [ ] Event listeners centralisés
- [ ] Gestion d'erreurs appropriée

**Tests :**
- [ ] Test sur mobile/tablette/desktop
- [ ] Test light/dark mode
- [ ] Test changement de langue
- [ ] Test navigation sidebar

---

*Ce guide sert de référence pour maintenir la cohérence et la qualité à travers toute l'application AuditMapper.*

---

## 🚀 Extensions Futures

### Améliorations Possibles :
- [ ] Système de notifications toast
- [ ] Loader/Spinner unifié
- [ ] Modal système réutilisable
- [ ] Système de raccourcis clavier
- [ ] PWA (Progressive Web App)
- [ ] Système de plugins modulaires

---

*Ce guide sert de référence pour maintenir la cohérence et la qualité à travers toute l'application AuditMapper.* 