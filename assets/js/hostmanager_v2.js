console.log("hostmanager_v2.js: Script start parsing."); // LOG 1

document.addEventListener('DOMContentLoaded', function() {
    console.log("hostmanager_v2.js: DOMContentLoaded event fired."); // LOG 2

    // --- Références DOM ---
    console.log("Getting DOM references...");
    const categoryTabsContainer = document.getElementById('categoryTabs');
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const categoryContentContainer = document.getElementById('categoryContentContainer');
    const networkMapDiv = document.getElementById('network-map');
    const importSessionInput = document.getElementById('importSessionInput');
    const editPanel = document.getElementById('editPanel');
    const generateKillchainBtn = document.getElementById('generateKillchainBtn');
    const allUsernamesPre = document.getElementById('allUsernames');
    const allPasswordsPre = document.getElementById('allPasswords');
    const allHashesPre = document.getElementById('allHashes');
    const filterCategorySelect = document.getElementById('filterCategory');
    const filterTagInput = document.getElementById('filterTag');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    const exportSessionBtn = document.getElementById('exportSessionBtn');
    const removeAllDataBtn = document.getElementById('removeAllDataBtn');
    const closePanelBtn = document.getElementById('closePanelBtn');
    const editHostForm = document.getElementById('editHostForm');
    const editHostIdInput = document.getElementById('editHostId');
    const editHostCategoryInput = document.getElementById('editHostCategory');
    const editHostIpNameInput = document.getElementById('editHostIpName');
    const editHostServicesInput = document.getElementById('editHostServices');
    const editHostNotesTextarea = document.getElementById('editHostNotes');
    const editHostTagsInput = document.getElementById('editHostTags');
    const editCredentialsContainer = document.getElementById('editCredentialsContainer');
    const addCredentialBtn = document.getElementById('addCredentialBtn');
    const deleteHostFromPanelBtn = document.getElementById('deleteHostFromPanelBtn');
    const editEdgeToInput = document.getElementById('editEdgeTo');
    const editEdgeLabelInput = document.getElementById('editEdgeLabel');
    const addEdgeBtn = document.getElementById('addEdgeBtn');
    const existingEdgesListDiv = document.getElementById('existingEdgesList');
    const killchainReportPreviewTextarea = document.getElementById('killchainReportPreview');
    const killchainReportRenderedPreviewDiv = document.getElementById('killchainReportRenderedPreview');
    const exportKillchainBtn = document.getElementById('exportKillchainBtn');
    const showPreviewTab = document.getElementById('showPreviewTab');
    const showEditorTab = document.getElementById('showEditorTab');
    const updateCurrentReportBtn = document.getElementById('updateCurrentReportBtn');
    const categorySettingsPanel = document.getElementById('categorySettingsPanel');
    const closeCategorySettingsPanelBtn = document.getElementById('closeCategorySettingsPanelBtn');
    const categorySettingsPanelTitle = document.getElementById('categorySettingsPanelTitle');
    const settingsCategoryNameInput = document.getElementById('settingsCategoryName');
    const categoryTemplateTypeSelect = document.getElementById('categoryTemplateTypeSelect');
    const saveCategorySettingsBtn = document.getElementById('saveCategorySettingsBtn');
    console.log("DOM references obtained.");

    // --- Constantes et Configuration ---
    const STORAGE_KEY = 'pentestHostData_v2';
    const TEMPLATE_CONFIG = {
        'AD': '/templates/ad.md',
        'Windows': '/templates/windows.md',
        'Linux': '/templates/linux.md',
        'Web': '/templates/web.md',
        'Custom': '/templates/custom.md', // Assurez-vous que ce fichier existe si vous le référencez
    };

    // --- Variables Globales ---
    let hostData = { categories: {}, edges: [] };
    let network = null;
    let activeCategory = null;
    let currentFilters = { category: '', tag: '' };
    let killchainReportContent = '';

    // --- Fonctions de Persistance des Données ---
    function loadData() {
        const storedData = localStorage.getItem(STORAGE_KEY);
        if (storedData) {
            try {
                hostData = JSON.parse(storedData);
                if (!hostData.categories) hostData.categories = {};
                if (!hostData.edges) hostData.edges = [];
                console.log("Données chargées depuis localStorage.");
            } catch (e) {
                console.error("Erreur parsing localStorage:", e);
                hostData = { categories: {}, edges: [] };
            }
        } else {
            console.log("Aucune donnée localStorage trouvée.");
            hostData = { categories: {}, edges: [] };
        }
        // Assurer la structure minimale pour chaque catégorie
        for (const catName in hostData.categories) {
            if (!hostData.categories[catName]) { // Vérifier si la catégorie elle-même est valide
                 console.warn(`Catégorie invalide trouvée et ignorée: ${catName}`);
                 delete hostData.categories[catName];
                 continue;
            }
            if (!hostData.categories[catName].hosts) {
                hostData.categories[catName].hosts = {};
            }
             if (hostData.categories[catName].templateType === undefined) { // Assurer présence templateType
                 hostData.categories[catName].templateType = null;
             }
        }
    }

    function saveData() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(hostData));
            console.log("Données sauvegardées.");
            renderAll(); // Mettre à jour l'UI après sauvegarde
        } catch (e) {
            console.error("Erreur sauvegarde localStorage:", e);
            alert("Erreur sauvegarde. Vérifiez console.");
        }
    }

    // --- Fonctions de Gestion des Templates ---
    async function fetchTemplate(templateName) {
        if (!templateName) return null;
        const path = TEMPLATE_CONFIG[templateName];
        if (!path) {
            console.log(`fetchTemplate: Pas de chemin pour "${templateName}".`);
            return null;
        }
        console.log(`[DEBUG] fetchTemplate: Fetching "${templateName}" from "${path}"`);
        try {
            const response = await fetch(path);
            console.log(`[DEBUG] fetchTemplate: Response for "${path}", Status: ${response.status}`);
            if (!response.ok) {
                // Gérer 404 spécifiquement
                if (response.status === 404) {
                     console.warn(`fetchTemplate: Template file not found at ${path}.`);
                     alert(`Le fichier template pour "${templateName}" (${path}) n'a pas été trouvé. Assurez-vous qu'il existe.`);
                } else {
                    console.error(`fetchTemplate: Failed fetch for ${path}. Status: ${response.status} ${response.statusText}`);
                    alert(`Erreur lors du chargement du template "${templateName}". Statut: ${response.status}`);
                }
                return null;
            }
            const templateContent = await response.text();
            console.log(`[DEBUG] fetchTemplate: Content for "${templateName}" length: ${templateContent.length}`);
            return templateContent;
        } catch (error) {
            console.error(`fetchTemplate: Network or other error fetching ${path}:`, error);
            alert(`Erreur réseau lors du chargement du template "${templateName}". Vérifiez la console.`);
            return null;
        }
    }

    // --- Fonctions de Génération de Rapport Killchain ---

    function analyzeOverallData(data) {
        console.log(">>> analyzeOverallData: START");
        let stats = {
            hostCount: 0,
            credCount: 0,
            pivotCount: data.edges?.length || 0,
            categories: {},
            zones: {},
            systems: {},
            compromiseLevels: {},
            commonTechniques: {},
            commonVulns: {},
            passwordReuseDetected: false,
            exposedServices: {}
        };
        let allCredentials = []; // Pour détecter la réutilisation (simpliste)

        if (!data || !data.categories) {
             console.warn("analyzeOverallData: No categories found in data.");
             return stats; // Retourner stats vides si pas de données
        }


        for (const categoryName in data.categories) {
            const category = data.categories[categoryName];
            if (!category || !category.hosts) continue; // Ignorer catégorie invalide

            const hostCountInCategory = Object.keys(category.hosts).length;
            stats.categories[categoryName] = hostCountInCategory;

            for (const hostName in category.hosts) {
                stats.hostCount++;
                const host = { ...category.hosts[hostName], ipName: hostName }; // Inclure ipName

                // Compter Systèmes, Zones, Niveaux de Compromission
                if (host.system) stats.systems[host.system] = (stats.systems[host.system] || 0) + 1;
                if (host.zone) stats.zones[host.zone] = (stats.zones[host.zone] || 0) + 1;
                if (host.compromiseLevel) stats.compromiseLevels[host.compromiseLevel] = (stats.compromiseLevels[host.compromiseLevel] || 0) + 1;

                // Compter Credentials et collecter pour détection réutilisation
                if (host.credentials && host.credentials.length > 0) {
                    stats.credCount += host.credentials.length;
                    host.credentials.forEach(cred => {
                        if (cred.password) allCredentials.push(cred.password);
                        if (cred.hash) allCredentials.push(cred.hash); // Inclure les hashs
                    });
                }

                // Compter Techniques et Vulnérabilités
                (host.exploitationTechniques || []).forEach(tech => stats.commonTechniques[tech] = (stats.commonTechniques[tech] || 0) + 1);
                (host.vulnerabilities || []).forEach(vuln => stats.commonVulns[vuln] = (stats.commonVulns[vuln] || 0) + 1);

                // Analyser les services (simpliste)
                (host.services || "").split(',').forEach(service => {
                    const trimmedService = service.trim();
                    if (trimmedService) {
                         const serviceName = trimmedService.split('/')[0]; // ex: '80' ou '445'
                         stats.exposedServices[serviceName] = (stats.exposedServices[serviceName] || 0) + 1;
                    }
                });
            }
        }

        // Détection simple de réutilisation
        const credCounts = allCredentials.reduce((acc, cred) => {
            if (cred) acc[cred] = (acc[cred] || 0) + 1;
            return acc;
        }, {});
        stats.passwordReuseDetected = Object.values(credCounts).some(count => count > 1);

        console.log(">>> analyzeOverallData: END - Stats:", stats);
        return stats;
    }

    function generateIntroductionMarkdown(stats) {
        console.log(">>> generateIntroductionMarkdown: START");
        let intro = "## Introduction et Synthèse\n\n";
        intro += `Ce rapport détaille les résultats d'une simulation d'intrusion effectuée sur le périmètre défini. L'analyse a porté sur **${stats.hostCount} machine(s)** réparties dans différentes catégories.\n\n`;

        intro += "**Statistiques Clés :**\n";
        intro += `- **Hôtes analysés :** ${stats.hostCount}\n`;
        intro += `- **Credentials découverts :** ${stats.credCount}\n`;
        intro += `- **Pivots/Connexions identifiés :** ${stats.pivotCount}\n`;
        if (stats.passwordReuseDetected) {
            intro += `- **Réutilisation de mots de passe détectée :** Oui ⚠️\n`;
        }

        // Répartition par catégorie
        if (Object.keys(stats.categories).length > 0) {
            intro += "- **Répartition par Catégorie :**\n";
            for (const cat in stats.categories) {
                intro += `  - ${cat}: ${stats.categories[cat]} hôte(s)\n`;
            }
        }
        // Répartition par OS (si pertinent)
        if (Object.keys(stats.systems).length > 0) {
            intro += "- **Répartition par Système d'Exploitation :**\n";
            for (const sys in stats.systems) {
                intro += `  - ${sys}: ${stats.systems[sys]} hôte(s)\n`;
            }
        }
         // Répartition par Niveau de Compromission
         if (Object.keys(stats.compromiseLevels).length > 0) {
            intro += "- **Niveaux de Compromission Atteints :**\n";
            for (const level in stats.compromiseLevels) {
                if (level !== 'None' || stats.compromiseLevels[level] > 0) { // N'afficher "None" que s'il y en a
                     intro += `  - ${level}: ${stats.compromiseLevels[level]} hôte(s)\n`;
                }
            }
        }

        intro += "\n";
        console.log(">>> generateIntroductionMarkdown: END");
        return intro;
    }

    function generateKillchainNarrative(edges, categories) {
        console.log(">>> generateKillchainNarrative: START");
        let narrative = "## Chemin d'Attaque Principal (Killchain)\n\n";
        if (!edges || edges.length === 0) {
            narrative += "*Aucun pivot ou connexion explicite n'a été défini entre les hôtes.*\n\n";
            return narrative;
        }

        narrative += "La séquence suivante illustre un chemin d'attaque potentiel basé sur les connexions identifiées :\n\n";
        // Tentative de reconstruction simple (peut être améliorée avec une vraie analyse de graphe)
        let currentPath = [];
        let usedEdges = new Set();
        let nodesInPath = new Set();

        // Trouver un point de départ potentiel (nœud sans edge entrant ou marqué "Initial Access"?)
        // Pour simplifier, on prend le premier edge si aucune heuristique n'est définie
        let startEdge = edges.find(e => !edges.some(e2 => e2.to === e.from)); // Noeud sans parent dans les edges définis
        if (!startEdge) startEdge = edges[0]; // Fallback

        let currentNode = startEdge.from;
        currentPath.push(currentNode);
        nodesInPath.add(currentNode);

        let safetyBreak = 0;
        while(safetyBreak < edges.length * 2) { // Eviter boucle infinie
             safetyBreak++;
             let nextEdge = edges.find(e => e.from === currentNode && !usedEdges.has(e.id) && !nodesInPath.has(e.to));
             if (nextEdge) {
                 usedEdges.add(nextEdge.id);
                 currentNode = nextEdge.to;
                 currentPath.push(` --(${nextEdge.label || 'pivot'})--> ${currentNode}`);
                 nodesInPath.add(currentNode);
             } else {
                 break; // Plus de chemin depuis ce noeud
             }
        }

        narrative += "```\n" + currentPath.join('') + "\n```\n\n";

        // Lister tous les pivots pour référence
        narrative += "**Liste de tous les pivots/connexions identifiés :**\n";
        edges.forEach(edge => {
            narrative += `- **${edge.from}** → **${edge.to}** ${edge.label ? `(via ${edge.label})` : ''}\n`;
        });

        narrative += "\n";
        console.log(">>> generateKillchainNarrative: END");
        return narrative;
    }

    /**
     * Génère le contenu Markdown pour un hôte spécifique en utilisant un template.
     */
    async function generateHostMarkdown(host, hostId, categoryName) {
        console.log(`>>> generateHostMarkdown: START for ${hostId} in ${categoryName}`);
        const category = hostData.categories[categoryName];
        const templateType = category?.templateType;
        const templateNameToUse = templateType || 'Custom';
        const templateContent = await fetchTemplate(templateNameToUse);

        if (!templateContent) {
            console.warn(`Impossible de charger le template "${templateNameToUse}" pour l'hôte ${hostId}.`);
            return `#### Hôte: ${hostId} (${categoryName})\n\n*Impossible de charger le template ${templateNameToUse}.*\n\n**Notes:**\n${host.notes || '(aucune)'}\n\n`;
        }

        // --- Préparation des données dynamiques ---
        const replacements = {
            '{{hostname}}': hostId,
            '{{ip}}': hostId,
            '{{date}}': new Date().toLocaleDateString('fr-FR'),
            '{{type}}': host.system || categoryName || 'Inconnu',
            '{{notes}}': host.notes || '(Aucune note spécifique enregistrée)',
        };

        // Services
        replacements['{{services_detected}}'] = host.services || '(Non spécifiés)';
        if (host.services) {
            replacements['{{services_context}}'] = `Les services suivants ont été identifiés : \`${host.services}\`. Leur présence peut indiquer des vecteurs d'attaque potentiels spécifiques à ces technologies.`;
        } else {
            replacements['{{services_context}}'] = "Aucun service spécifique n'a été listé pour cet hôte.";
        }

        // Credentials
        if (host.credentials && host.credentials.length > 0) {
            replacements['{{credentials_summary}}'] = `Des informations d'authentification (${host.credentials.length}) ont été collectées pour cet hôte. Ces éléments peuvent être cruciaux pour l'accès ou l'élévation de privilèges.`;
            let credList = host.credentials.map(c => `- **Type:** ${c.type || 'N/A'} | **User:** \`${c.username || ''}\` | **Secret:** ${c.password ? '`' + c.password + '`' : (c.hash ? 'Hash (`' + c.hash.substring(0, 15) + '...`)' : 'N/A')} | **Source:** ${c.source || 'N/A'}`).join('\n');
            replacements['{{credentials_list}}'] = "**Détails des Credentials :**\n" + credList;
        } else {
            replacements['{{credentials_summary}}'] = "Aucune information d'authentification spécifique n'a été trouvée ou enregistrée pour cet hôte lors de cette phase.";
            replacements['{{credentials_list}}'] = "";
        }

        // Accès / Exploitation / Vulnérabilités
        let accessNarrative = "";
        const techniques = host.exploitationTechniques || [];
        const vulns = host.vulnerabilities || [];

        if (techniques.length > 0 && vulns.length > 0) {
            accessNarrative = `L'accès ou la compromission a été potentiellement réalisé via les techniques suivantes : **${techniques.join(', ')}**. Ces actions ont pu être facilitées par les vulnérabilités identifiées : **${vulns.join(', ')}**.`;
        } else if (techniques.length > 0) {
            accessNarrative = `Les techniques suivantes ont été employées ou envisagées pour l'accès/exploitation : **${techniques.join(', ')}**.`;
        } else if (vulns.length > 0) {
            accessNarrative = `Bien qu'aucune technique d'exploitation spécifique n'ait été confirmée, les vulnérabilités suivantes ont été identifiées et pourraient être exploitables : **${vulns.join(', ')}**.`;
        } else {
            accessNarrative = "Aucune méthode d'accès confirmée ni vulnérabilité spécifique n'a été identifiée ou enregistrée pour cet hôte à ce stade.";
        }
        replacements['{{access_vector}}'] = accessNarrative;
        // Garder {{exploitation_technique}} pour compatibilité simple, mais il est inclus dans access_vector
        replacements['{{exploitation_technique}}'] = techniques.join(', ') || '(Non spécifiée)';


        // Élévation de Privilèges
        // Si vous ajoutez un champ host.privescTechniques:
        // const privescTechs = host.privescTechniques || [];
        // if (privescTechs.length > 0) {
        //     replacements['{{privesc_technique}}'] = `Des pistes pour l'élévation de privilèges ont été identifiées, notamment : **${privescTechs.join(', ')}**.`;
        // } else {
        //     replacements['{{privesc_technique}}'] = "Aucune technique spécifique d'élévation de privilèges n'a été documentée pour cet hôte.";
        // }
        replacements['{{privesc_technique}}'] = "Les possibilités d'élévation de privilèges n'ont pas été spécifiquement détaillées pour cet hôte dans les données actuelles.";


        // Mouvement Latéral / Pivot
        const outgoingEdges = hostData.edges.filter(edge => edge.from === hostId);
        if (outgoingEdges.length > 0) {
            replacements['{{pivots_summary}}'] = `Cet hôte a servi de point de pivot pour accéder à ${outgoingEdges.length} autre(s) système(s). Ces mouvements sont essentiels pour comprendre la progression de l'attaque.`;
            let pivotList = outgoingEdges.map(edge => `- De **${edge.from}** vers **${edge.to}** ${edge.label ? `(technique/protocole: ${edge.label})` : ''}`).join('\n');
            replacements['{{pivots_list}}'] = "**Détails des Pivots :**\n" + pivotList;
        } else {
            replacements['{{pivots_summary}}'] = "Aucun mouvement latéral depuis cet hôte n'a été enregistré dans les données actuelles.";
            replacements['{{pivots_list}}'] = "";
        }

        // Synthèse Hôte
        let summaryParts = [];
        if(host.role) summaryParts.push(`Identifié avec le rôle **${host.role}**`);
        if(host.zone) summaryParts.push(`situé dans la zone réseau **${host.zone}**`);
        if(host.compromiseLevel && host.compromiseLevel !== 'None') summaryParts.push(`atteignant un niveau de compromission de **${host.compromiseLevel}**`);

        if (summaryParts.length > 0) {
             replacements['{{host_summary}}'] = `Synthèse : Hôte ${summaryParts.join(', ')}.`;
        } else {
             replacements['{{host_summary}}'] = "Synthèse : Pas d'informations de rôle, zone ou niveau de compromission spécifiques disponibles.";
        }


        // --- Application des remplacements ---
        let finalMarkdown = templateContent;
        for (const placeholder in replacements) {
            finalMarkdown = finalMarkdown.replace(new RegExp(placeholder.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), replacements[placeholder]);
        }

        // Nettoyage final : Supprimer les lignes qui contiendraient ENCORE un placeholder (sécurité)
        finalMarkdown = finalMarkdown.split('\n').filter(line => !line.trim().match(/^\{\{.*\}\}$/)).join('\n');

        console.log(`>>> generateHostMarkdown: END for ${hostId}`);
        // Ajouter un titre H4 standardisé au début du bloc retourné
        return `#### Hôte: ${hostId} (${host.system || categoryName || 'N/A'})\n\n` + finalMarkdown;
    }

    function generateConclusionMarkdown(stats) {
        console.log(">>> generateConclusionMarkdown: START");
        let conclusion = "## Conclusion et Recommandations\n\n";

        conclusion += "L'analyse a révélé plusieurs points d'attention et chemins d'attaque potentiels. Les éléments suivants résument les observations principales et proposent des axes de remédiation.\n\n";

        // Vulnérabilités fréquentes
        if (Object.keys(stats.commonVulns).length > 0) {
            conclusion += "**Vulnérabilités Récurrentes :**\n";
            const sortedVulns = Object.entries(stats.commonVulns).sort(([,a],[,b]) => b-a);
            sortedVulns.slice(0, 5).forEach(([vuln, count]) => conclusion += `- ${vuln} (observée ${count} fois)\n`);
            conclusion += "\n";
        }

         // Techniques fréquentes
         if (Object.keys(stats.commonTechniques).length > 0) {
            conclusion += "**Techniques d'Attaque Fréquentes :**\n";
            const sortedTechs = Object.entries(stats.commonTechniques).sort(([,a],[,b]) => b-a);
            sortedTechs.slice(0, 5).forEach(([tech, count]) => conclusion += `- ${tech} (observée ${count} fois)\n`);
            conclusion += "\n";
        }

        // Mauvaises pratiques observées
        conclusion += "**Mauvaises Pratiques Observées :**\n";
        let practicesFound = false;
        if (stats.passwordReuseDetected) {
            conclusion += "- **Réutilisation de mots de passe :** Des mots de passe identiques ou similaires ont été trouvés sur plusieurs comptes ou systèmes, facilitant les mouvements latéraux. ⚠️\n";
            practicesFound = true;
        }
        // Analyser services exposés (exemple simple)
        const riskyServices = Object.entries(stats.exposedServices).filter(([port]) => ['21', '23', '135', '139', '445', '3389'].includes(port)); // Ports potentiellement risqués
        if (riskyServices.length > 0) {
             conclusion += "- **Exposition de services sensibles :** Des services potentiellement vulnérables ou permettant un accès non authentifié ont été détectés :\n";
             riskyServices.forEach(([port, count]) => conclusion += `  - Port ${port} (observé ${count} fois)\n`);
             practicesFound = true;
        }
        // Ajouter d'autres détections de mauvaises pratiques ici...
        if (!practicesFound) {
             conclusion += "- *Aucune mauvaise pratique évidente détectée automatiquement (vérification manuelle recommandée).*\n";
        }
        conclusion += "\n";


        // Recommandations Générales
        conclusion += "**Recommandations Générales :**\n";
        conclusion += "- **Correction des vulnérabilités :** Prioriser la correction des vulnérabilités identifiées, en particulier celles mentionnées comme récurrentes.\n";
        conclusion += "- **Renforcement des mots de passe :** Mettre en œuvre une politique de mots de passe robustes et uniques pour tous les comptes (utilisateurs et services). Envisager des solutions de gestion centralisée des mots de passe (Vault).\n";
        conclusion += "- **Segmentation réseau :** Revoir et renforcer la segmentation réseau pour limiter les mouvements latéraux en cas de compromission initiale.\n";
        conclusion += "- **Filtrage des services :** Limiter l'exposition des services aux seules machines qui en ont légitimement besoin. Désactiver les protocoles non sécurisés (Telnet, FTP).\n";
        conclusion += "- **Surveillance et détection :** Mettre en place ou améliorer les mécanismes de surveillance (logs, EDR, SIEM) pour détecter les activités suspectes identifiées lors de cet exercice.\n";
        conclusion += "- **Sensibilisation :** Renforcer la sensibilisation des utilisateurs aux risques liés au phishing et à l'ingénierie sociale.\n";

        console.log(">>> generateConclusionMarkdown: END");
        return conclusion;
    }

    /**
     * Génère le rapport Killchain complet en Markdown.
     */
    async function generateKillchainReport() {
        console.log(">>> generateKillchainReport: START");
        let finalReportContent = `# Rapport Killchain - ${new Date().toLocaleString('fr-FR')}\n\n`;

        // 1. Ajouter la narrative Killchain basée sur les edges
        finalReportContent += generateKillchainNarrative(hostData.edges, hostData.categories);

        // 2. Ajouter les détails par catégorie et par hôte
        finalReportContent += "## Détails par Hôte\n\n";

        for (const categoryName in hostData.categories) {
            const category = hostData.categories[categoryName];
            if (!category || Object.keys(category.hosts || {}).length === 0) continue; // Sauter catégorie vide

            finalReportContent += `### Catégorie: ${categoryName}\n\n`; // Utiliser H3 pour les catégories ici

            const sortedHostIds = Object.keys(category.hosts).sort(); // Trier les hôtes par ID/IP

            for (const hostId of sortedHostIds) {
                const host = category.hosts[hostId];
                try {
                    // Utiliser la fonction améliorée generateHostMarkdown
                    const hostMd = await generateHostMarkdown(host, hostId, categoryName);
                    finalReportContent += hostMd;
                    finalReportContent += "\n\n---\n\n"; // AJOUT: Séparateur horizontal après chaque hôte
                } catch (error) {
                    console.error(`Erreur lors de la génération du markdown pour l'hôte ${hostId}:`, error);
                    finalReportContent += `### Hôte: ${hostId}\n\n*Erreur lors de la génération des détails pour cet hôte.*\n\n---\n\n`;
                }
            }
             finalReportContent += "\n"; // Espace après la dernière section d'hôte d'une catégorie
        }

        // Mettre à jour la variable globale et l'UI
        killchainReportContent = finalReportContent;
        if (killchainReportPreviewTextarea) {
            killchainReportPreviewTextarea.value = killchainReportContent;
        }
        updateMarkdownPreview(); // Mettre à jour l'aperçu rendu
        switchToPreviewTab(); // Afficher l'aperçu par défaut après génération

        console.log(">>> generateKillchainReport: END");
        alert("Nouveau rapport Killchain généré !");
    }

    function updateReportUI() {
        console.log(">>> updateReportUI: START");
        if (killchainReportPreviewTextarea) {
            killchainReportPreviewTextarea.value = killchainReportContent;
            console.log("Textarea updated.");
        } else {
             console.error("updateReportUI: Textarea #killchainReportPreview not found!");
        }
        updateMarkdownPreview(); // Mettre à jour l'aperçu rendu
        // Activer les boutons si du contenu existe
        const hasContent = killchainReportContent.trim().length > 0;
         if (updateCurrentReportBtn) updateCurrentReportBtn.disabled = !hasContent;
         if (exportKillchainBtn) exportKillchainBtn.disabled = !hasContent;
        console.log(">>> updateReportUI: END");
    }


    // --- Fonctions de Rendu UI ---

    function renderAll() {
        console.log(">>> renderAll: START");
        if (!categoryTabsContainer || !categoryContentContainer || !networkMapDiv || !allUsernamesPre) {
             console.error("renderAll: Critical DOM elements missing. Aborting render.");
             return;
        }
        renderCategoryTabs();
        renderActiveCategoryContent();
        renderNetworkMap();
        renderAggregatedData();
        populateFilterCategorySelect();
        populateTemplateTypeSelect(); // Remplir le select dans le panneau settings
        console.log(">>> renderAll: END");
    }

    function renderCategoryTabs() {
        console.log(">>> renderCategoryTabs: START");
        // Vider les onglets existants (sauf le bouton +)
        const existingTabs = categoryTabsContainer.querySelectorAll('.category-tab');
        existingTabs.forEach(tab => tab.remove());

        const categories = Object.keys(hostData.categories).sort();

        categories.forEach(categoryName => {
            const tab = document.createElement('button');
            tab.className = `category-tab btn btn-sm ${categoryName === activeCategory ? 'active btn-primary' : 'btn-outline-secondary'}`;
            // tab.textContent = categoryName; // Texte simple
            tab.dataset.category = categoryName;

             // Contenu de l'onglet (Nom + boutons)
             const tabContent = document.createElement('span');
             tabContent.textContent = categoryName;
             tab.appendChild(tabContent);


            // Ajouter bouton settings
            const settingsBtn = document.createElement('span');
            settingsBtn.className = 'category-settings-btn ml-2'; // ml-2 pour espace
            settingsBtn.innerHTML = '⚙️'; // Icône engrenage
            settingsBtn.title = `Paramètres de ${categoryName}`;
            settingsBtn.dataset.category = categoryName;
            settingsBtn.style.cursor = 'pointer';
            tab.appendChild(settingsBtn);

             // Ajouter bouton supprimer
             const removeBtn = document.createElement('span');
             removeBtn.className = 'remove-category-btn ml-1'; // ml-1
             removeBtn.innerHTML = '🗑️'; // Icône poubelle
             removeBtn.title = `Supprimer ${categoryName}`;
             removeBtn.dataset.category = categoryName;
             removeBtn.style.cursor = 'pointer';
             tab.appendChild(removeBtn);


            // Insérer avant le bouton '+'
            if (addCategoryBtn) {
                categoryTabsContainer.insertBefore(tab, addCategoryBtn);
            } else {
                 categoryTabsContainer.appendChild(tab); // Fallback si bouton + non trouvé
            }
        });

        // S'assurer qu'une catégorie est active si possible
        if (!activeCategory && categories.length > 0) {
            switchCategory(categories[0]);
        } else if (activeCategory && !hostData.categories[activeCategory]) {
             // Si la catégorie active a été supprimée
             activeCategory = categories.length > 0 ? categories[0] : null;
             renderActiveCategoryContent(); // Mettre à jour le contenu
        } else if (categories.length === 0) {
            activeCategory = null;
            renderActiveCategoryContent(); // Afficher message "aucune catégorie"
        }
        console.log(">>> renderCategoryTabs: END");
    }

    function renderActiveCategoryContent() {
        console.log(">>> renderActiveCategoryContent: START");
        categoryContentContainer.innerHTML = ''; // Vider

        if (!activeCategory || !hostData.categories[activeCategory]) {
            let message = '<p>Aucune catégorie sélectionnée.</p>';
            if (Object.keys(hostData.categories).length === 0) {
                 message = '<p>Aucune catégorie définie. Cliquez sur le bouton "+" pour en créer une.</p>';
            }
            categoryContentContainer.innerHTML = message;
            console.log(">>> renderActiveCategoryContent: END - No active category");
            return;
        }

        const categoryData = hostData.categories[activeCategory];
        const hosts = categoryData.hosts || {};
        // Appliquer les filtres ici
        const filteredHostEntries = Object.entries(hosts).filter(([hostName, host]) => {
             if (!currentFilters.tag) return true; // Pas de filtre tag
             return host.tags?.some(tag => tag.toLowerCase().includes(currentFilters.tag));
        });
        const hostNames = filteredHostEntries.map(([name]) => name).sort();


        // Créer un conteneur pour cette catégorie
        const categoryDiv = document.createElement('div');
        categoryDiv.id = `category-${activeCategory}`;
        categoryDiv.className = 'category-content';

        // Bouton pour ajouter un hôte à CETTE catégorie
        const addHostBtn = document.createElement('button');
        addHostBtn.className = 'btn btn-success btn-sm mb-3 add-host-btn';
        addHostBtn.textContent = `+ Ajouter Hôte à ${activeCategory}`;
        addHostBtn.dataset.category = activeCategory;
        categoryDiv.appendChild(addHostBtn);

        // Conteneur pour les cartes d'hôtes
        const hostListDiv = document.createElement('div');
        hostListDiv.className = 'host-list row'; // Utiliser row pour Bootstrap grid

        if (hostNames.length === 0) {
            hostListDiv.innerHTML = '<p>Aucun hôte dans cette catégorie (ou correspondant aux filtres).</p>';
        } else {
            hostNames.forEach(hostName => {
                const host = hosts[hostName];
                const cardCol = document.createElement('div');
                cardCol.className = 'col-md-6 col-lg-4 mb-3'; // Bootstrap grid columns

                const card = document.createElement('div');
                card.className = 'card host-card h-100'; // h-100 pour hauteur égale

                const cardBody = document.createElement('div');
                cardBody.className = 'card-body d-flex flex-column'; // flex pour aligner bouton en bas

                const cardTitle = document.createElement('h5');
                cardTitle.className = 'card-title';
                cardTitle.textContent = hostName;
                cardBody.appendChild(cardTitle);

                // Ajouter quelques infos clés
                const cardInfo = document.createElement('p');
                cardInfo.className = 'card-text small';
                cardInfo.innerHTML = `
                    Système: ${host.system || 'N/A'}<br>
                    Rôle: ${host.role || 'N/A'}<br>
                    Compromission: ${host.compromiseLevel || 'None'}<br>
                    Tags: ${host.tags?.join(', ') || 'Aucun'}
                `;
                cardBody.appendChild(cardInfo);

                // Bouton Editer (aligné en bas)
                const editBtn = document.createElement('button');
                editBtn.className = 'btn btn-outline-primary btn-sm mt-auto edit-host-card-btn'; // mt-auto pour pousser en bas
                editBtn.textContent = 'Éditer';
                editBtn.dataset.hostId = hostName; // Utiliser hostName comme ID
                cardBody.appendChild(editBtn);

                card.appendChild(cardBody);
                cardCol.appendChild(card);
                hostListDiv.appendChild(cardCol);
            });
        }
        categoryDiv.appendChild(hostListDiv);
        categoryContentContainer.appendChild(categoryDiv);
        console.log(">>> renderActiveCategoryContent: END");
    }

    /**
     * Rend ou met à jour la carte réseau Vis.js.
     */
    function renderNetworkMap() {
        console.log(">>> renderNetworkMap: START");
        // ... (début de la fonction : récupération des nœuds et edges) ...
        if (!networkMapDiv) {
            console.error("renderNetworkMap: Div #network-map introuvable.");
            return;
        }

        const nodes = [];
        const edges = [];

        // Créer les nœuds à partir de hostData
        for (const categoryName in hostData.categories) {
            // ... (création des nodes comme avant) ...
             const category = hostData.categories[categoryName];
             if (!category || !category.hosts) continue;

             for (const hostId in category.hosts) {
                 const host = category.hosts[hostId];
                 // Appliquer les filtres ici
                 const categoryFilterMatch = !currentFilters.category || currentFilters.category === categoryName;
                 const tagFilterMatch = !currentFilters.tag || host.tags?.some(tag => tag.toLowerCase().includes(currentFilters.tag));

                 if (categoryFilterMatch && tagFilterMatch) {
                     nodes.push({
                         id: hostId, // Utiliser ipName comme ID
                         label: hostId,
                         title: `Catégorie: ${categoryName}\nSystème: ${host.system || 'N/A'}\nRôle: ${host.role || 'N/A'}`, // Infobulle simple
                         group: categoryName, // Pour la couleur/forme par catégorie
                     });
                 }
             }
        }

        // Ajouter les edges depuis hostData, en filtrant si les nœuds existent dans la vue actuelle
        hostData.edges.forEach(edge => {
            const sourceExistsInView = nodes.some(node => node.id === edge.from);
            const targetExistsInView = nodes.some(node => node.id === edge.to);
            if (sourceExistsInView && targetExistsInView) {
                 edges.push({
                     id: edge.id || generateUUID(), // Assurer un ID pour l'edge
                     from: edge.from,
                     to: edge.to,
                     label: edge.label || '',
                     arrows: 'to'
                 });
            } else {
                 // Ne pas logger ici car c'est normal si un nœud est filtré
                 // console.warn(`renderNetworkMap: Edge ignoré car nœud source ou cible filtré: ${edge.from} -> ${edge.to}`);
            }
        });


        const data = {
            nodes: new vis.DataSet(nodes),
            edges: new vis.DataSet(edges),
        };

        // ... (définition des options comme avant) ...
        const options = {
            // ... (options vis.js) ...
             locale: 'fr',
             nodes: {
                 shape: 'dot',
                 size: 16,
                 font: {
                     size: 12,
                     color: document.body.classList.contains('dark-theme') ? '#ffffff' : '#343434'
                 },
                 borderWidth: 2,
             },
             edges: {
                 width: 2,
                 color: { inherit: 'from' },
                 smooth: { type: 'continuous' }
             },
             physics: {
                 enabled: true,
                 barnesHut: { gravitationalConstant: -8000, springConstant: 0.04, springLength: 150 },
                 stabilization: { enabled: true, iterations: 1000, updateInterval: 50, onlyDynamicEdges: false, fit: true }
             },
             interaction: {
                 hover: true,
                 tooltipDelay: 200,
                 navigationButtons: true,
                 keyboard: true
             },
             // groups: { ... } // Définitions des groupes si nécessaire
        };


        // Créer ou mettre à jour le réseau
        if (!network) {
            console.log("Création d'une nouvelle instance Vis Network.");
            network = new vis.Network(networkMapDiv, data, options);

            // **ATTACHER L'ÉCOUTEUR UNE SEULE FOIS À LA CRÉATION**
            network.on('click', function(params) {
                console.log(">>> network.on('click'): START", params);
                if (params.nodes.length > 0) {
                    const nodeId = params.nodes[0];
                    console.log(`Node clicked: ${nodeId}`);
                    // Appel direct à openEditPanel
                    openEditPanel(nodeId);
                } else {
                    console.log("Click event on map background (no node selected).");
                    // Optionnel: Fermer le panneau si on clique en dehors ?
                    // closeEditPanel();
                }
            });
            console.log("Listener 'click' attaché au réseau Vis.");

        } else {
            console.log("Mise à jour des données Vis Network existantes.");
            network.setData(data);
            // Pas besoin de réattacher l'écouteur ici si attaché à la création
        }

        // ... (stabilisation, fit, etc.) ...
         if (nodes.length > 0) {
             network.once('stabilizationIterationsDone', function() {
                 network.setOptions( { physics: false } );
                 console.log("Stabilisation de la carte terminée, physique désactivée.");
             });
         }

        console.log(">>> renderNetworkMap: END");
    }

    function renderAggregatedData() {
        console.log(">>> renderAggregatedData: START");
        const allUsernames = new Set();
        const allPasswords = new Set();
        const allHashes = new Set();

        for (const categoryName in hostData.categories) {
            const category = hostData.categories[categoryName];
            if (!category || !category.hosts) continue;
            for (const hostName in category.hosts) {
                const host = category.hosts[hostName];
                if (host.credentials) {
                    host.credentials.forEach(cred => {
                        if (cred.username) allUsernames.add(cred.username.trim());
                        if (cred.password) allPasswords.add(cred.password.trim());
                        if (cred.hash) allHashes.add(cred.hash.trim());
                    });
                }
            }
        }

        if (allUsernamesPre) allUsernamesPre.textContent = [...allUsernames].sort().join('\n');
        if (allPasswordsPre) allPasswordsPre.textContent = [...allPasswords].sort().join('\n');
        if (allHashesPre) allHashesPre.textContent = [...allHashes].sort().join('\n');
    }

    function populateFilterCategorySelect() {
        console.log(">>> populateFilterCategorySelect: START");
        if (!filterCategorySelect) return;
        const currentSelection = filterCategorySelect.value;
        filterCategorySelect.innerHTML = '<option value="">Toutes les catégories</option>';
        const categories = Object.keys(hostData.categories).sort();
        categories.forEach(categoryName => {
            const option = document.createElement('option');
            option.value = categoryName;
            option.textContent = categoryName;
            filterCategorySelect.appendChild(option);
        });
        // Restaurer la sélection
        if (hostData.categories[currentSelection]) {
            filterCategorySelect.value = currentSelection;
        }
        console.log(">>> populateFilterCategorySelect: END");
    }

    function populateTemplateTypeSelect(selectElement = categoryTemplateTypeSelect) {
         console.log(">>> populateTemplateTypeSelect: START");
         if (!selectElement) return;
         const currentVal = selectElement.value; // Sauver valeur actuelle
         selectElement.innerHTML = '<option value="">Aucun (Générique)</option>'; // Option par défaut
         Object.keys(TEMPLATE_CONFIG).forEach(templateName => {
             const option = document.createElement('option');
             option.value = templateName;
             option.textContent = templateName;
             selectElement.appendChild(option);
         });
         // Restaurer si possible
         if (Array.from(selectElement.options).some(opt => opt.value === currentVal)) {
             selectElement.value = currentVal;
         }
         console.log(">>> populateTemplateTypeSelect: END");
    }


    // --- Fonctions de Gestion des Données (CRUD Catégories/Hôtes/Edges) ---

    function addCategory() {
        console.log(">>> addCategory: START");
        const categoryName = prompt("Entrez le nom de la nouvelle catégorie:");
        if (categoryName && categoryName.trim() !== '') {
            const sanitizedName = sanitizeInput(categoryName.trim());
            if (hostData.categories[sanitizedName]) {
                alert(`La catégorie "${sanitizedName}" existe déjà.`);
                return;
            }
            hostData.categories[sanitizedName] = { hosts: {}, templateType: null };
            console.log(`Catégorie ajoutée: ${sanitizedName}`);
            activeCategory = sanitizedName;
            saveData(); // Sauvegarde et re-rend l'UI
        }
    }

    function handleRemoveCategory(categoryName) {
        console.log(`>>> handleRemoveCategory: START for ${categoryName}`);
        if (!categoryName || !hostData.categories[categoryName]) return;

        if (confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${categoryName}" et tous ses hôtes ?\nCette action est irréversible.`)) {
            // Supprimer les edges liés aux hôtes de cette catégorie
            const hostsToRemove = Object.keys(hostData.categories[categoryName]?.hosts || {});
            hostData.edges = hostData.edges.filter(edge =>
                !hostsToRemove.includes(edge.from) && !hostsToRemove.includes(edge.to)
            );

            // Supprimer la catégorie
            delete hostData.categories[categoryName];
            console.log(`Catégorie supprimée: ${categoryName}`);

            // Si la catégorie active a été supprimée, choisir une autre ou aucune
            if (activeCategory === categoryName) {
                const remainingCategories = Object.keys(hostData.categories);
                activeCategory = remainingCategories.length > 0 ? remainingCategories[0] : null;
            }
            saveData(); // Sauvegarde et re-rend l'UI
        }
    }

    function switchCategory(categoryName) {
        console.log(`>>> switchCategory: START for ${categoryName}`);
        if (hostData.categories[categoryName]) {
            activeCategory = categoryName;
            console.log(`Catégorie active changée en: ${activeCategory}`);
            // Mettre à jour l'UI sans recharger toutes les données (juste le contenu et les onglets)
            renderCategoryTabs();
            renderActiveCategoryContent();
            // Optionnel: Mettre à jour le filtre catégorie si on veut qu'il suive
            // if (filterCategorySelect) filterCategorySelect.value = activeCategory;
        } else {
            console.warn(`Tentative de passage à une catégorie inexistante: ${categoryName}`);
        }
    }

    function handleAddHost(categoryName) {
        console.log(`>>> handleAddHost: START for ${categoryName}`);
        if (!categoryName || !hostData.categories[categoryName]) {
            alert("Erreur : Catégorie non spécifiée ou invalide pour l'ajout de l'hôte.");
            return;
        }
        const ipName = prompt(`Entrez l'IP ou le nom d'hôte pour la catégorie "${categoryName}":`);
        if (!ipName || ipName.trim() === '') {
            return; // Annulé
        }

        const sanitizedIpName = sanitizeInput(ipName.trim());

        // Vérifier si l'hôte existe déjà DANS CETTE catégorie
        if (hostData.categories[categoryName]?.hosts?.[sanitizedIpName]) {
             alert(`L'hôte "${sanitizedIpName}" existe déjà dans la catégorie "${categoryName}".`);
             return;
        }

        const newHost = {
            services: '', notes: '', tags: [], credentials: [],
            system: null, role: 'Unknown', zone: 'Unknown', compromiseLevel: 'None',
            exploitationTechniques: [], vulnerabilities: []
        };

        hostData.categories[categoryName].hosts[sanitizedIpName] = newHost;

        console.log(`Nouvel hôte ajouté : ${sanitizedIpName}`, newHost);
        saveData(); // Sauvegarde et re-rendu
        openEditPanel(sanitizedIpName); // Ouvrir pour édition immédiate
    }

    function handleSaveHostFromPanel(event) {
        event.preventDefault(); // Empêcher la soumission standard du formulaire
        console.log(">>> handleSaveHostFromPanel: START");

        const originalHostId = editHostIdInput.value;
        const originalCategory = editHostCategoryInput.value;
        const newHostId = sanitizeInput(editHostIpNameInput.value.trim()); // Le nouvel ID potentiel

        if (!newHostId) {
            alert("Le nom/IP de l'hôte ne peut pas être vide.");
            return;
        }

        // Vérifier si l'hôte original existe toujours
        if (!hostData.categories[originalCategory]?.hosts?.[originalHostId]) {
            console.error(`Erreur sauvegarde: Hôte original ${originalHostId} dans ${originalCategory} introuvable.`);
            alert("Erreur: Impossible de trouver l'hôte original à modifier.");
            closeEditPanel();
            return;
        }

        // Vérifier si le nouvel ID existe déjà (s'il est différent de l'original)
        if (newHostId !== originalHostId) {
            let idExists = false;
            for (const cat in hostData.categories) {
                if (hostData.categories[cat]?.hosts?.[newHostId]) {
                    idExists = true;
                    break;
                }
            }
            if (idExists) {
                alert(`L'IP/Nom d'hôte "${newHostId}" existe déjà. Veuillez en choisir un autre.`);
                return;
            }
        }

        // Collecter toutes les données du formulaire
        const updatedHostData = {
            services: editHostServicesInput.value.trim(),
            notes: editHostNotesTextarea.value.trim(),
            tags: editHostTagsInput.value.split(',').map(t => t.trim()).filter(Boolean),
            system: document.getElementById('editHostSystem').value.trim(),
            role: document.getElementById('editHostRole').value.trim(),
            zone: document.getElementById('editHostZone').value.trim(),
            compromiseLevel: document.getElementById('editHostCompromiseLevel').value,
            exploitationTechniques: document.getElementById('editHostTechniques').value.split(',').map(t => t.trim()).filter(Boolean),
            vulnerabilities: document.getElementById('editHostVulnerabilities').value.split(',').map(t => t.trim()).filter(Boolean),
            credentials: [] // Sera rempli ci-dessous
        };

        // Collecter les credentials
        const credentialGroups = editCredentialsContainer.querySelectorAll('.credential-group');
        credentialGroups.forEach(group => {
            const inputs = group.querySelectorAll('input, select');
            if (inputs.length >= 4) { // S'assurer qu'on a tous les champs
                const username = inputs[0].value.trim();
                const password = inputs[1].value.trim(); // Type=password ou text
                const hash = inputs[2].value.trim();
                const type = inputs[3].value;
                const source = inputs[4] ? inputs[4].value.trim() : ''; // Champ source optionnel
                // Ajouter seulement si au moins un champ est rempli (ou selon votre logique)
                if (username || password || hash) {
                    updatedHostData.credentials.push({ username, password, hash, type, source });
                }
            }
        });

        // --- Logique de mise à jour ---
        // 1. Supprimer l'ancien hôte (si l'ID a changé)
        if (newHostId !== originalHostId) {
            delete hostData.categories[originalCategory].hosts[originalHostId];
            console.log(`Ancien hôte ${originalHostId} supprimé.`);
        }

        // 2. Ajouter/Mettre à jour l'hôte avec le nouvel ID et les nouvelles données
        hostData.categories[originalCategory].hosts[newHostId] = updatedHostData;
        console.log(`Hôte ${newHostId} ajouté/mis à jour dans ${originalCategory}.`);

        // 3. Mettre à jour les edges si l'ID a changé
        if (newHostId !== originalHostId) {
            hostData.edges.forEach(edge => {
                if (edge.from === originalHostId) {
                    edge.from = newHostId;
                    console.log(`Edge ${edge.id} 'from' mis à jour vers ${newHostId}`);
                }
                if (edge.to === originalHostId) {
                    edge.to = newHostId;
                     console.log(`Edge ${edge.id} 'to' mis à jour vers ${newHostId}`);
                }
            });
        }

        // 4. Sauvegarder et fermer
        saveData(); // Sauvegarde et déclenche renderAll()
        closeEditPanel();
        console.log("Modifications sauvegardées.");
    }

    function handleDeleteHostFromPanel() {
        console.log(">>> handleDeleteHostFromPanel: START");
        const hostId = editHostIdInput.value;
        const categoryName = editHostCategoryInput.value;

        if (!hostId || !categoryName || !hostData.categories[categoryName]?.hosts?.[hostId]) {
            alert("Erreur: Impossible de déterminer quel hôte supprimer.");
            return;
        }

        if (confirm(`Êtes-vous sûr de vouloir supprimer l'hôte "${hostId}" de la catégorie "${categoryName}" ?`)) {
            // Supprimer l'hôte
            delete hostData.categories[categoryName].hosts[hostId];
            // Supprimer les edges connectés à cet hôte
            hostData.edges = hostData.edges.filter(edge => edge.from !== hostId && edge.to !== hostId);

            console.log(`Hôte supprimé: ${hostId} de ${categoryName}. Edges liés supprimés.`);
            saveData();
            closeEditPanel();
        }
    }

    function handleAddEdge() {
        console.log(">>> handleAddEdge: START");
        const fromHostId = editHostIdInput.value; // L'hôte en cours d'édition est le 'from'
        const toHostId = sanitizeInput(editEdgeToInput.value.trim());
        const label = sanitizeInput(editEdgeLabelInput.value.trim());

        if (!fromHostId || !toHostId) {
            alert("Veuillez spécifier l'hôte cible pour la connexion.");
            return;
        }

        // Vérifier si l'hôte cible existe (dans n'importe quelle catégorie)
        let targetExists = false;
        for (const cat in hostData.categories) {
            if (hostData.categories[cat]?.hosts?.[toHostId]) {
                targetExists = true;
                break;
            }
        }
        if (!targetExists) {
            alert(`L'hôte cible "${toHostId}" n'a pas été trouvé dans les données actuelles.`);
            // Optionnel: proposer de créer l'hôte cible ?
            return;
        }

        // Ajouter l'edge
        const newEdge = {
            id: generateUUID(), // Générer un ID unique pour l'edge
            from: fromHostId,
            to: toHostId,
            label: label || '', // Label optionnel
            arrows: 'to' // Assurer la flèche
        };
        hostData.edges.push(newEdge);
        console.log("Edge ajouté:", newEdge);

        // Mettre à jour la liste dans le panneau et sauvegarder
        renderEdgesInPanel(fromHostId);
        saveData(); // Sauvegarde et re-rend la carte réseau

        // Vider les champs
        editEdgeToInput.value = '';
        editEdgeLabelInput.value = '';
    }

    function handleDeleteEdge(edgeId) {
        console.log(`>>> handleDeleteEdge: START for ${edgeId}`);
        const fromHostId = editHostIdInput.value; // Récupérer l'hôte actuel pour re-render le panneau
        hostData.edges = hostData.edges.filter(edge => edge.id !== edgeId);
        console.log(`Edge supprimé: ${edgeId}`);
        renderEdgesInPanel(fromHostId); // Mettre à jour la liste dans le panneau
        saveData(); // Sauvegarde et re-rend la carte réseau
    }


    // --- Fonctions de Gestion des Panneaux (Edit, Settings) ---

    function openEditPanel(hostId) {
        console.log(`>>> openEditPanel: START for ${hostId}`);
        // Vérifier si le panneau existe dans le DOM
        if (!editPanel) {
            console.error("Élément #editPanel introuvable dans le DOM.");
            return;
        }

        // Trouver l'hôte et sa catégorie
        let host = null;
        let categoryName = null;
        for (const cat in hostData.categories) {
            if (hostData.categories[cat]?.hosts?.[hostId]) {
                host = hostData.categories[cat].hosts[hostId];
                categoryName = cat;
                break;
            }
        }

        if (!host || !categoryName) {
            console.error(`Hôte non trouvé pour ID: ${hostId}`);
            // Optionnel : Afficher une alerte ou un message à l'utilisateur
            // alert(`Erreur: Hôte "${hostId}" introuvable dans les données.`);
            return; // Arrêter l'exécution si l'hôte n'est pas trouvé
        }

        console.log(`Hôte trouvé: ${hostId} dans catégorie ${categoryName}`, host);

        // Remplir les champs du formulaire (vérifier les IDs HTML)
        try {
            editHostIdInput.value = hostId;
            editHostCategoryInput.value = categoryName;
            editHostIpNameInput.value = hostId; // ipName est l'ID
            editHostServicesInput.value = host.services || '';
            editHostNotesTextarea.value = host.notes || '';
            editHostTagsInput.value = host.tags?.join(', ') || '';
            document.getElementById('editHostSystem').value = host.system || '';
            document.getElementById('editHostRole').value = host.role || '';
            document.getElementById('editHostZone').value = host.zone || '';
            document.getElementById('editHostCompromiseLevel').value = host.compromiseLevel || 'None';
            document.getElementById('editHostTechniques').value = host.exploitationTechniques?.join(', ') || '';
            document.getElementById('editHostVulnerabilities').value = host.vulnerabilities?.join(', ') || '';

            // Remplir les credentials
            editCredentialsContainer.innerHTML = ''; // Vider les anciens
            (host.credentials || []).forEach(cred => addCredentialInputGroup(cred));

            // Remplir les edges sortants
            renderEdgesInPanel(hostId);

            // Afficher le panneau
            editPanel.classList.add('open');
            console.log(`Panneau d'édition ouvert pour: ${hostId}`);

        } catch (error) {
             console.error("Erreur lors du remplissage du panneau d'édition:", error);
             // Peut arriver si un ID d'élément HTML est incorrect
             alert("Une erreur s'est produite lors de l'ouverture du panneau d'édition. Vérifiez la console.");
        }
    }

    function closeEditPanel() {
        if (!editPanel) return;
        editPanel.classList.remove('open');
        console.log("Panneau d'édition fermé.");
    }

    function addCredentialInputGroup(credential = {}) {
        console.log(">>> addCredentialInputGroup: START");
        if (!editCredentialsContainer) return;
        const credDiv = document.createElement('div');
        credDiv.className = 'credential-group input-group input-group-sm mb-2'; // input-group-sm pour taille cohérente
        credDiv.innerHTML = `
            <input type="text" class="form-control" placeholder="Utilisateur" value="${credential.username || ''}">
            <input type="text" class="form-control" placeholder="Mot de passe" value="${credential.password || ''}">
            <input type="text" class="form-control" placeholder="Hash" value="${credential.hash || ''}">
            <input type="text" class="form-control" placeholder="Type (ex: NTLM)" value="${credential.type || ''}">
            <input type="text" class="form-control" placeholder="Source (ex: Mimikatz)" value="${credential.source || ''}">
            <div class="input-group-append">
                <button class="btn btn-outline-danger remove-credential-btn" type="button">🗑️</button>
            </div>
        `;
        // Ajouter l'écouteur pour le bouton supprimer de CE groupe
        const removeBtn = credDiv.querySelector('.remove-credential-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', function() {
                credDiv.remove();
                console.log("Groupe credential supprimé.");
            });
        }
        editCredentialsContainer.appendChild(credDiv);
        console.log(">>> addCredentialInputGroup: END");
    }

    function renderEdgesInPanel(hostId) {
        console.log(`>>> renderEdgesInPanel: START for ${hostId}`);
        if (!existingEdgesListDiv) return;
        existingEdgesListDiv.innerHTML = ''; // Vider la liste

        const outgoingEdges = hostData.edges.filter(edge => edge.from === hostId);

        if (outgoingEdges.length === 0) {
            existingEdgesListDiv.innerHTML = '<small><em>Aucune connexion sortante définie.</em></small>';
        } else {
            const list = document.createElement('ul');
            list.className = 'list-unstyled';
            outgoingEdges.forEach(edge => {
                const listItem = document.createElement('li');
                listItem.className = 'd-flex justify-content-between align-items-center mb-1';
                listItem.innerHTML = `
                    <span>Vers: <strong>${edge.to}</strong> ${edge.label ? `(${edge.label})` : ''}</span>
                    <button class="btn btn-danger btn-sm remove-edge-btn" data-edge-id="${edge.id}">🗑️</button>
                `;
                // Ajouter écouteur pour supprimer cet edge spécifique
                const removeBtn = listItem.querySelector('.remove-edge-btn');
                if (removeBtn) {
                    removeBtn.addEventListener('click', () => handleDeleteEdge(edge.id));
                }
                list.appendChild(listItem);
            });
            existingEdgesListDiv.appendChild(list);
        }
        console.log(`>>> renderEdgesInPanel: END - ${outgoingEdges.length} edges rendered.`);
    }

    function openCategorySettingsPanel(categoryName) {
        console.log(`>>> openCategorySettingsPanel: START for ${categoryName}`);
        if (!categorySettingsPanel || !hostData.categories[categoryName]) return;

        settingsCategoryNameInput.value = categoryName; // Stocker le nom
        categorySettingsPanelTitle.textContent = `Paramètres: ${categoryName}`;

        // Pré-remplir le type de template actuel
        const currentTemplateType = hostData.categories[categoryName].templateType;
        if (categoryTemplateTypeSelect) {
             categoryTemplateTypeSelect.value = currentTemplateType || ""; // Mettre à "" si null/undefined
        }

        categorySettingsPanel.classList.add('open');
        console.log(`Panneau settings ouvert pour: ${categoryName}`);
    }

    function closeCategorySettingsPanel() {
        if (!categorySettingsPanel) return;
        categorySettingsPanel.classList.remove('open');
        console.log("Panneau settings fermé.");
    }

    function saveCategoryTemplateType() {
        console.log(">>> saveCategoryTemplateType: START");
        const categoryName = settingsCategoryNameInput.value;
        const selectedTemplateType = categoryTemplateTypeSelect.value;

        if (!categoryName || !hostData.categories[categoryName]) {
            alert("Erreur: Catégorie non valide.");
            return;
        }

        hostData.categories[categoryName].templateType = selectedTemplateType || null; // Stocker null si ""
        console.log(`Template type pour "${categoryName}" mis à jour à: ${selectedTemplateType || 'Aucun'}`);
        saveData(); // Sauvegarder les données (pas besoin de renderAll ici)
        closeCategorySettingsPanel();
    }


    // --- Fonctions d'Import/Export/Filtres ---

    function handleExportSession() {
        console.log(">>> handleExportSession: START");
        try {
            const dataStr = JSON.stringify(hostData, null, 2); // Indenter pour lisibilité
            const blob = new Blob([dataStr], { type: "application/json;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            a.href = url;
            a.download = `hostmanager_session_${timestamp}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            console.log("Session exportée.");
        } catch (e) {
            console.error("Erreur lors de l'exportation de la session:", e);
            alert("Erreur lors de l'exportation. Vérifiez la console.");
        }
    }

    function handleImportSession(event) {
        console.log(">>> handleImportSession: START");
        const file = event.target.files[0];
        if (!file) {
            console.log("Aucun fichier sélectionné.");
            return;
        }

        const reader = new FileReader();

        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                console.log("Fichier JSON parsé avec succès. Données importées (début):", JSON.stringify(importedData).substring(0, 500)); // Log pour vérifier

                // **CORRECTION/VÉRIFICATION CRUCIALE**
                // Valider la structure minimale attendue
                if (importedData && typeof importedData === 'object' && importedData.categories && importedData.edges !== undefined) {
                    // Remplacer complètement les données actuelles par les données importées
                    hostData = importedData;
                    console.log("hostData mis à jour avec les données importées.");

                    // Assurer la structure minimale après import (comme dans loadData)
                    for (const catName in hostData.categories) {
                         if (!hostData.categories[catName]) {
                              console.warn(`Catégorie invalide trouvée dans import et ignorée: ${catName}`);
                              delete hostData.categories[catName];
                              continue;
                         }
                         if (!hostData.categories[catName].hosts) {
                             hostData.categories[catName].hosts = {};
                         }
                         if (hostData.categories[catName].templateType === undefined) {
                             hostData.categories[catName].templateType = null;
                         }
                     }
                     // S'assurer qu'activeCategory est valide ou null
                     const firstCategory = Object.keys(hostData.categories)[0];
                     activeCategory = hostData.categories[activeCategory] ? activeCategory : (firstCategory || null);


                    // Sauvegarder les nouvelles données et déclencher le re-rendu complet
                    saveData(); // Ceci appelle renderAll() qui appelle renderNetworkMap()
                    console.log("Données importées sauvegardées et UI rafraîchie.");
                    alert("Session importée avec succès !");
                } else {
                    console.error("Le fichier JSON importé n'a pas la structure attendue (manque 'categories' ou 'edges').", importedData);
                    alert("Erreur: Le fichier JSON importé n'a pas la structure attendue (il doit contenir au moins les clés 'categories' et 'edges').");
                }

            } catch (error) {
                console.error("Erreur lors du parsing du fichier JSON:", error);
                alert("Erreur lors de la lecture ou du parsing du fichier JSON. Assurez-vous que le fichier est valide.");
            } finally {
                 // Réinitialiser l'input pour permettre de réimporter le même fichier si nécessaire
                 event.target.value = null;
            }
        };

        reader.onerror = function() {
            console.error("Erreur lors de la lecture du fichier:", reader.error);
            alert("Erreur lors de la lecture du fichier.");
             event.target.value = null; // Réinitialiser
        };

        reader.readAsText(file);
    }

    function handleRemoveAllData() {
        console.log(">>> handleRemoveAllData: START");
        if (confirm("Êtes-vous sûr de vouloir supprimer TOUTES les données (catégories, hôtes, connexions) ? Cette action est irréversible.")) {
            hostData = { categories: {}, edges: [] };
            activeCategory = null;
            currentFilters = { category: '', tag: '' }; // Réinitialiser aussi les filtres
            killchainReportContent = ''; // Vider le rapport
            localStorage.removeItem(STORAGE_KEY); // Supprimer du stockage local
            console.log("Toutes les données ont été supprimées.");
            saveData(); // Sauvegarde l'état vide et rafraîchit l'UI
            // Vider explicitement certains éléments UI
            if(filterTagInput) filterTagInput.value = '';
            if(killchainReportPreviewTextarea) killchainReportPreviewTextarea.value = '';
            updateMarkdownPreview(); // Met à jour l'aperçu vide
            alert("Toutes les données ont été supprimées.");
        }
    }

    function applyFiltersAndRender() {
        console.log(">>> applyFiltersAndRender: START");
        // Lire les filtres depuis les inputs
        currentFilters.category = filterCategorySelect ? filterCategorySelect.value : '';
        currentFilters.tag = filterTagInput ? filterTagInput.value.trim().toLowerCase() : '';
        console.log("Application des filtres:", currentFilters);
        renderAll(); // Re-render la carte et potentiellement le contenu de la catégorie
    }


    // --- Fonctions Utilitaires ---

    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function sanitizeInput(str) {
        // Fonction simple pour éviter les injections basiques, à renforcer si nécessaire
        if (typeof str !== 'string') return str;
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
        // Alternative plus stricte (supprime les tags):
        // const temp = document.createElement('div');
        // temp.innerHTML = str;
        // return temp.textContent || temp.innerText || "";
    }


    // --- Initialisation et Écouteurs d'Événements ---

    function initialize() {
        console.log(">>> initialize: START");

        // Vérifier si les éléments DOM essentiels sont présents
        if (!categoryTabsContainer || !addCategoryBtn || !categoryContentContainer || !networkMapDiv || !editPanel || !importSessionInput) {
             console.error("Initialize: Un ou plusieurs éléments DOM critiques sont manquants. Vérifiez les IDs dans hostmanager.html.");
             alert("Erreur critique: Impossible d'initialiser l'application. Vérifiez la console.");
             return; // Arrêter l'initialisation
        }

        console.log("Attaching listeners...");
        // Boutons Globaux / Filtres
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', addCategory);
            console.log("Listener attached to addCategoryBtn."); // LOG 5a
        }
        // Utiliser la délégation pour les onglets et leurs boutons internes
        if (categoryTabsContainer) {
             categoryTabsContainer.addEventListener('click', handleCategoryTabClick);
             console.log("Listener attached to categoryTabsContainer (delegation)."); // LOG 5b
        }
        // Utiliser la délégation pour le contenu des catégories (boutons Ajouter/Editer Hôte)
        if (categoryContentContainer) {
             categoryContentContainer.addEventListener('click', handleCategoryContentClick);
             console.log("Listener attached to categoryContentContainer (delegation)."); // LOG 5c
        }

        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', applyFiltersAndRender);
            console.log("Listener attached to applyFiltersBtn."); // LOG 5d
        }
        if (exportSessionBtn) {
            exportSessionBtn.addEventListener('click', handleExportSession);
            console.log("Listener attached to exportSessionBtn."); // LOG 5e
        }
        if (importSessionInput) {
            // L'écouteur est sur 'change', pas 'click' pour un input file
            importSessionInput.addEventListener('change', handleImportSession);
            console.log("Listener attached to importSessionInput (change)."); // LOG 5f
             // Permettre de cliquer sur un bouton visible pour déclencher l'input caché
             const importTriggerBtn = document.getElementById('importSessionBtn'); // Assurez-vous que ce bouton existe
             if (importTriggerBtn) {
                 importTriggerBtn.addEventListener('click', () => importSessionInput.click());
                 console.log("Listener attached to importSessionBtn (trigger).");
             }
        }
        if (removeAllDataBtn) {
            removeAllDataBtn.addEventListener('click', handleRemoveAllData);
            console.log("Listener attached to removeAllDataBtn.");
        }

        // Panneau d'Édition Hôte
        if (closePanelBtn) {
            closePanelBtn.addEventListener('click', closeEditPanel);
            console.log("Listener attached to closePanelBtn.");
        }
        if (editHostForm) {
            editHostForm.addEventListener('submit', handleSaveHostFromPanel);
            console.log("Listener attached to editHostForm (submit)."); // LOG 5g
        }
        if (addCredentialBtn) {
            addCredentialBtn.addEventListener('click', () => addCredentialInputGroup());
            console.log("Listener attached to addCredentialBtn.");
        }
        if (deleteHostFromPanelBtn) {
            deleteHostFromPanelBtn.addEventListener('click', handleDeleteHostFromPanel);
            console.log("Listener attached to deleteHostFromPanelBtn.");
        }
        if (addEdgeBtn) {
            addEdgeBtn.addEventListener('click', handleAddEdge);
            console.log("Listener attached to addEdgeBtn.");
        }
        // Les écouteurs pour supprimer credentials/edges sont ajoutés dynamiquement

        // Panneau Paramètres Catégorie
        if (closeCategorySettingsPanelBtn) {
            closeCategorySettingsPanelBtn.addEventListener('click', closeCategorySettingsPanel);
            console.log("Listener attached to closeCategorySettingsPanelBtn.");
        }
        if (saveCategorySettingsBtn) {
            saveCategorySettingsBtn.addEventListener('click', saveCategoryTemplateType);
            console.log("Listener attached to saveCategorySettingsBtn.");
        }

        // Rapport Killchain
        if (generateKillchainBtn) {
            generateKillchainBtn.addEventListener('click', generateKillchainReport);
            console.log("Listener attached to generateKillchainBtn."); // LOG 5h
        }
        if (exportKillchainBtn) {
            exportKillchainBtn.addEventListener('click', handleExportKillchain);
            exportKillchainBtn.disabled = true;
            console.log("Listener attached to exportKillchainBtn.");
        }
        if (killchainReportPreviewTextarea) {
            killchainReportPreviewTextarea.addEventListener('input', updateMarkdownPreview);
            console.log("Listener attached to killchainReportPreviewTextarea (input).");
        }
        if (showPreviewTab) {
            showPreviewTab.addEventListener('click', switchToPreviewTab);
            console.log("Listener attached to showPreviewTab.");
        }
        if (showEditorTab) {
            showEditorTab.addEventListener('click', switchToEditorTab);
            console.log("Listener attached to showEditorTab.");
        }
        if (updateCurrentReportBtn) {
            updateCurrentReportBtn.addEventListener('click', () => {
                console.log("[DEBUG] Bouton #updateCurrentReportBtn cliqué ! Regénération...");
                generateKillchainReport();
            });
            updateCurrentReportBtn.disabled = true;
            console.log("Listener attached to updateCurrentReportBtn.");
        }

        // Observer pour le thème (si nécessaire pour la carte Vis.js)
        const themeToggle = document.getElementById('toggleTheme');
        if (themeToggle && typeof MutationObserver !== 'undefined') {
           const observer = new MutationObserver((mutationsList) => {
               for(let mutation of mutationsList) {
                   if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                       console.log('Theme changed, re-rendering network map...');
                       renderNetworkMap();
                   }
               }
           });
           observer.observe(document.body, { attributes: true });
           console.log("Theme observer attached.");
        }

        // Chargement des données initiales
        console.log("Calling loadData...");
        loadData();
        console.log("Calling renderAll...");
        renderAll(); // Appel initial pour afficher l'état chargé

        // Initialiser l'état des onglets rapport
        switchToPreviewTab();
        updateMarkdownPreview();

        console.log(">>> initialize: END - Initialisation Host Manager v3 terminée et écouteurs attachés."); // LOG 6
    }

    // --- Fonctions de Gestion des Onglets Rapport ---
    function switchToPreviewTab() {
        console.log(">>> switchToPreviewTab: START");
        const editorContainer = document.getElementById('killchainEditorContainer');
        const previewContainer = document.getElementById('killchainRenderedPreviewContainer');
        const editorTab = document.getElementById('showEditorTab');
        const previewTab = document.getElementById('showPreviewTab');

        if (editorContainer) editorContainer.style.display = 'none';
        if (previewContainer) previewContainer.style.display = 'block';
        if (editorTab) editorTab.classList.remove('active');
        if (previewTab) previewTab.classList.add('active');
        updateMarkdownPreview(); // Mettre à jour l'aperçu quand on y passe
        console.log(">>> switchToPreviewTab: END");
    }

    function switchToEditorTab() {
        console.log(">>> switchToEditorTab: START");
        const editorContainer = document.getElementById('killchainEditorContainer');
        const previewContainer = document.getElementById('killchainRenderedPreviewContainer');
        const editorTab = document.getElementById('showEditorTab');
        const previewTab = document.getElementById('showPreviewTab');

        if (editorContainer) editorContainer.style.display = 'block';
        if (previewContainer) previewContainer.style.display = 'none';
        if (editorTab) editorTab.classList.add('active');
        if (previewTab) previewTab.classList.remove('active');
        console.log(">>> switchToEditorTab: END");
    }

    function updateMarkdownPreview() {
        console.log(">>> updateMarkdownPreview: START");
        if (!killchainReportPreviewTextarea || !killchainReportRenderedPreviewDiv) {
            console.error("Éléments d'édition/aperçu Markdown introuvables.");
            return;
        }

        // Mettre à jour la variable globale avec le contenu actuel de l'éditeur SI l'éditeur est visible
        if (document.getElementById('killchainEditorContainer')?.style.display !== 'none') {
             killchainReportContent = killchainReportPreviewTextarea.value;
        }


        // Rendu Markdown
        if (typeof marked === 'undefined' || typeof DOMPurify === 'undefined') {
            killchainReportRenderedPreviewDiv.innerHTML = '<p>Erreur: Librairies Marked.js ou DOMPurify non chargées.</p>';
            return;
        }
        try {
            // Utiliser le contenu de la variable globale pour le rendu
            const dirtyHtml = marked.parse(killchainReportContent || "*Aucun contenu à afficher.*");
            const cleanHtml = DOMPurify.sanitize(dirtyHtml);
            killchainReportRenderedPreviewDiv.innerHTML = cleanHtml;
        } catch (e) {
            console.error("Erreur lors du rendu Markdown:", e);
            killchainReportRenderedPreviewDiv.innerHTML = '<p>Erreur lors du rendu Markdown. Vérifiez la console.</p>';
        }
        console.log(">>> updateMarkdownPreview: END");
    }

    function handleExportKillchain() {
        console.log(">>> handleExportKillchain: START");
        if (!killchainReportContent) {
            alert("Aucun rapport à exporter. Générez ou actualisez le rapport d'abord.");
            return;
        }
        try {
            const blob = new Blob([killchainReportContent], { type: "text/markdown;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            a.href = url;
            a.download = `killchain_report_${timestamp}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            console.log("Rapport Killchain exporté.");
        } catch (e) {
            console.error("Erreur lors de l'exportation du rapport Killchain:", e);
            alert("Erreur lors de l'exportation du rapport. Vérifiez la console.");
        }
    }


    // --- Fonctions de Gestion des Catégories (pour les écouteurs délégués) ---
    function handleCategoryTabClick(event) {
        console.log(">>> handleCategoryTabClick: START");
        const target = event.target;
        const settingsButton = target.closest('.category-settings-btn');
        const removeButton = target.closest('.remove-category-btn');
        const tabElement = target.closest('.category-tab');

        if (settingsButton) {
             const categoryName = settingsButton.dataset.category;
             console.log("Settings button clicked for:", categoryName);
             openCategorySettingsPanel(categoryName);
        } else if (removeButton) {
             const categoryName = removeButton.dataset.category;
             console.log("Remove button clicked for:", categoryName);
             handleRemoveCategory(categoryName);
        } else if (tabElement && !settingsButton && !removeButton) {
             // Clic sur l'onglet lui-même (pas sur les boutons dedans)
             const categoryName = tabElement.dataset.category;
             console.log("Tab clicked for:", categoryName);
             switchCategory(categoryName);
        }
    }

    function handleCategoryContentClick(event) {
        console.log(">>> handleCategoryContentClick: START");
        const addHostButton = event.target.closest('.add-host-btn');
        const editHostCardBtn = event.target.closest('.edit-host-card-btn');

        if (addHostButton) {
            event.preventDefault(); // Empêcher comportement par défaut si c'est un lien <a>
            const categoryName = addHostButton.dataset.category;
            console.log("Add host button clicked for category:", categoryName);
            if (categoryName) handleAddHost(categoryName);
            else console.error("Nom de catégorie manquant sur le bouton Ajouter Hôte.");
        } else if (editHostCardBtn) {
             const hostId = editHostCardBtn.dataset.hostId;
             console.log("Edit host card button clicked for host:", hostId);
             if (hostId) openEditPanel(hostId);
             else console.error("ID d'hôte manquant sur le bouton Editer.");
        }
    }


    // Lancer l'initialisation globale
    initialize();

}); // Fin du DOMContentLoaded