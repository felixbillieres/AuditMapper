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
    const editPanelToggleWideBtn = document.getElementById('toggleWidePanelBtn');
    const editOutputsSection = document.getElementById('editOutputsSection');
    const editOutputsContainer = document.getElementById('editOutputsContainer');
    const addOutputBtn = document.getElementById('addOutputBtn');
    const outputTypeSelection = document.getElementById('outputTypeSelection');
    const newOutputInputArea = document.getElementById('newOutputInputArea');
    const newOutputTitle = document.getElementById('newOutputTitle');
    const newOutputContent = document.getElementById('newOutputContent');
    const newOutputContentLabel = document.getElementById('newOutputContentLabel');
    const newOutputSubTypeGroup = document.getElementById('newOutputSubTypeGroup');
    const newOutputSubType = document.getElementById('newOutputSubType');
    const saveNewOutputBtn = document.getElementById('saveNewOutputBtn');
    const cancelNewOutputBtn = document.getElementById('cancelNewOutputBtn');
    const cancelOutputTypeSelectionBtn = document.getElementById('cancelOutputTypeSelectionBtn');
    const outputNavigation = document.getElementById('outputNavigation');
    const noOutputsMsg = editOutputsContainer?.querySelector('.no-outputs-msg'); // Message "Aucun output"
    const nodeExportSection = document.getElementById('nodeExportSection');
    const selectExportDirBtn = document.getElementById('selectExportDirBtn'); // Nouveau bouton
    const selectedDirPath = document.getElementById('selectedDirPath');       // Span pour afficher chemin
    const executeNodeExportBtn = document.getElementById('executeNodeExportBtn');
    const executeNodeExportZipBtn = document.getElementById('executeNodeExportZipBtn'); // Pour ZIP
    const nodeExportStatusMsg = document.getElementById('nodeExportStatusMsg');
    const exploitationStepsSection = document.getElementById('exploitationStepsSection');
    const exploitationStepsListDiv = document.getElementById('exploitationStepsList');
    const addExploitationStepBtn = document.getElementById('addExploitationStepBtn');
    const noExploitationStepsMsg = document.querySelector('.no-exploitation-steps-msg');

    // Références pour la modale des détails de l'étape
    const exploitationStepDetailModal = document.getElementById('exploitationStepDetailModal');
    const exploitationStepDetailForm = document.getElementById('exploitationStepDetailForm');
    const stepDetailModalStepId = document.getElementById('stepDetailModalStepId');
    const stepDetailModalOrder = document.getElementById('stepDetailModalOrder');
    const stepDetailModalTitle = document.getElementById('stepDetailModalTitle');
    const stepDetailModalContent = document.getElementById('stepDetailModalContent');
    const stepDetailModalScreenshotUrl = document.getElementById('stepDetailModalScreenshotUrl');
    const stepDetailModalScreenshotPreview = document.getElementById('stepDetailModalScreenshotPreview');
    const saveExploitationStepBtn = document.getElementById('saveExploitationStepBtn');

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
    let selectedDirectoryHandle = null; // Pour stocker le handle du dossier choisi

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
            if (hostData.categories[catName] && hostData.categories[catName].hosts) {
                for (const hostId in hostData.categories[catName].hosts) {
                    const host = hostData.categories[catName].hosts[hostId];
                    if (host && !Array.isArray(host.exploitationSteps)) { // Assurer présence exploitationSteps
                        host.exploitationSteps = [];
                    }
                    // Assurer que chaque étape a un ID et un ordre si ce n'était pas le cas
                    if (host && host.exploitationSteps) {
                        host.exploitationSteps.forEach(step => {
                            if (!step.id) step.id = generateUUID();
                            if (typeof step.order !== 'number') step.order = 1; // Donner un ordre par défaut
                        });
                    }
                }
            }
        }
    }

    function saveData() {
        console.log(">>> saveData: Attempting to save data to localStorage..."); // LOG S1
        try {
            const dataToSave = JSON.stringify(hostData); // LOG S2 - Vérifier si la sérialisation échoue
            console.log(`Data size to save: ${dataToSave.length} characters.`);
            localStorage.setItem(STORAGE_KEY, dataToSave);
            console.log(">>> saveData: Data successfully saved to localStorage."); // LOG S3
            renderAll(); // Mettre à jour l'UI après sauvegarde
        } catch (e) {
            console.error(">>> saveData: Error saving to localStorage:", e); // LOG S4
            alert("Erreur lors de la sauvegarde des données. Vérifiez la console. L'espace de stockage local est peut-être plein.");
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
            exploitationTechniques: [], vulnerabilities: [],
            outputs: [], // Assurez-vous que outputs est initialisé
            exploitationSteps: [] // <<<< AJOUT: Initialiser le tableau des étapes
        };

        hostData.categories[categoryName].hosts[sanitizedIpName] = newHost;

        console.log(`Nouvel hôte ajouté : ${sanitizedIpName}`, newHost);
        saveData(); // Sauvegarde et re-rendu
        openEditPanel(sanitizedIpName); // Ouvrir pour édition immédiate
    }

    function handleSaveHostFromPanel(event) {
        event.preventDefault(); // Empêcher la soumission standard du formulaire
        console.log(">>> handleSaveHostFromPanel: START"); // LOG 1

        const originalHostId = editHostIdInput.value;
        const originalCategory = editHostCategoryInput.value;
        const newHostId = sanitizeInput(editHostIpNameInput.value.trim()); // Le nouvel ID potentiel
        console.log(`Original ID: ${originalHostId}, Category: ${originalCategory}, New ID: ${newHostId}`); // LOG 2

        if (!newHostId) {
            alert("Le nom/IP de l'hôte ne peut pas être vide.");
            return;
        }

        // Vérifier si l'hôte original existe toujours
        const hostInfo = findHostById(originalHostId); // Utiliser findHostById pour simplifier
        if (!hostInfo || hostInfo.categoryName !== originalCategory) {
             console.error(`Erreur sauvegarde: Hôte original ${originalHostId} dans ${originalCategory} introuvable ou catégorie incorrecte.`);
             alert("Erreur: Impossible de trouver l'hôte original à modifier.");
             closeEditPanel();
             return;
        }
        console.log("Original host found."); // LOG 3

        // Vérifier si le nouvel ID existe déjà (s'il est différent de l'original)
        if (newHostId !== originalHostId) {
            let idExists = false;
            // Simplification: findHostById cherche dans toutes les catégories
            if (findHostById(newHostId)) {
                 idExists = true;
            }
            if (idExists) {
                alert(`L'IP/Nom d'hôte "${newHostId}" existe déjà. Veuillez en choisir un autre.`);
                return;
            }
            console.log("New host ID is different and available."); // LOG 4
        }

        // --- Collecter toutes les données du formulaire ---
        console.log("Collecting form data..."); // LOG 5
        // Récupérer l'objet hôte existant pour le mettre à jour (inclut déjà les outputs ajoutés via saveNewOutput)
        const hostToUpdate = hostInfo.host;

        // Mettre à jour les champs simples
        hostToUpdate.services = editHostServicesInput.value.trim();
        hostToUpdate.notes = editHostNotesTextarea.value.trim();
        hostToUpdate.tags = editHostTagsInput.value.split(',').map(t => t.trim()).filter(Boolean);
        hostToUpdate.system = document.getElementById('editHostSystem').value.trim() || null; // Mettre null si vide
        hostToUpdate.role = document.getElementById('editHostRole').value.trim();
        hostToUpdate.zone = document.getElementById('editHostZone').value.trim();
        hostToUpdate.compromiseLevel = document.getElementById('editHostCompromiseLevel').value;
        hostToUpdate.exploitationTechniques = document.getElementById('editHostTechniques').value.split(',').map(t => t.trim()).filter(Boolean);
        hostToUpdate.vulnerabilities = document.getElementById('editHostVulnerabilities').value.split(',').map(t => t.trim()).filter(Boolean);

        // --- Collecter les credentials ---
        console.log("Collecting credentials..."); // LOG 6
        const collectedCredentials = []; // Toujours recréer à partir du formulaire
        const credentialGroups = editCredentialsContainer.querySelectorAll('.credential-group');
        console.log(`Found ${credentialGroups.length} credential groups in the form.`); // LOG 7

        credentialGroups.forEach((group, index) => {
            const inputs = group.querySelectorAll('input, select'); // Sélecteur correct
            console.log(`Processing credential group ${index + 1}, found ${inputs.length} inputs/selects.`); // LOG 8
            // Vérifier si on a bien les 5 éléments attendus (user, pass, hash, type, source) + le bouton delete (donc >= 5 inputs/selects)
            // Ajustement: Le bouton n'est pas un input/select, donc on attend 5.
            if (inputs.length >= 5) {
                const username = inputs[0].value.trim();
                const password = inputs[1].value.trim(); // Type=password ou text
                const hash = inputs[2].value.trim();
                const type = inputs[3].value; // Le select
                const source = inputs[4].value.trim(); // Le champ source
                // Ajouter seulement si au moins un champ significatif est rempli
                if (username || password || hash) {
                    const cred = { username, password, hash, type, source };
                    collectedCredentials.push(cred);
                    console.log("Collected credential:", cred); // LOG 9
                } else {
                     console.log(`Credential group ${index + 1} skipped (empty).`); // LOG 10
                }
            } else {
                 console.warn(`Credential group ${index + 1} skipped, expected >= 5 inputs/selects, found: ${inputs.length}`, group); // LOG 11
            }
        });
        // Remplacer complètement les anciens credentials par ceux du formulaire
        hostToUpdate.credentials = collectedCredentials;
        console.log("Final collected credentials for host:", hostToUpdate.credentials); // LOG 12

        // --- Logique de mise à jour de l'ID si nécessaire ---
        console.log("Applying updates to hostData..."); // LOG 13
        if (newHostId !== originalHostId) {
            console.log(`Host ID changed from ${originalHostId} to ${newHostId}. Updating hostData and edges.`); // LOG 14
            // 1. Supprimer l'ancien hôte
            delete hostData.categories[originalCategory].hosts[originalHostId];
            console.log(`Deleted old host entry: hostData.categories[${originalCategory}].hosts[${originalHostId}]`); // LOG 15

            // 2. Ajouter le nouvel hôte avec les données mises à jour
            hostData.categories[originalCategory].hosts[newHostId] = hostToUpdate;
            console.log(`Added new host entry: hostData.categories[${originalCategory}].hosts[${newHostId}]`); // LOG 16

            // 3. Mettre à jour les edges
            let edgeUpdatedCount = 0;
            hostData.edges.forEach(edge => {
                if (edge.from === originalHostId) {
                    edge.from = newHostId;
                    edgeUpdatedCount++;
                    // console.log(`Edge ${edge.id} 'from' updated to ${newHostId}`);
                }
                if (edge.to === originalHostId) {
                    edge.to = newHostId;
                    edgeUpdatedCount++;
                    // console.log(`Edge ${edge.id} 'to' updated to ${newHostId}`);
                }
            });
             console.log(`Updated ${edgeUpdatedCount} edge references.`); // LOG 17
        } else {
            // Si l'ID n'a pas changé, on s'assure juste que l'objet dans hostData est bien celui qu'on a mis à jour.
            // Normalement, hostToUpdate EST déjà une référence à l'objet dans hostData,
            // donc les modifications précédentes l'ont déjà affecté. Pas besoin de réassigner.
             console.log(`Host ID (${originalHostId}) did not change. Updates applied directly to hostData object.`); // LOG 18
        }

        // --- Sauvegarder et fermer ---
        console.log("Calling saveData()..."); // LOG 19
        saveData(); // Sauvegarde et déclenche renderAll()
        console.log("Calling closeEditPanel()..."); // LOG 20
        closeEditPanel();
        console.log(">>> handleSaveHostFromPanel: END - Modifications sauvegardées."); // LOG 21
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
        const fromHostId = editHostIdInput.value;
        const toHost = editEdgeToInput.value.trim();
        const label = editEdgeLabelInput.value.trim();

        if (!fromHostId || !toHost) {
            alert("Veuillez spécifier l'hôte source (via le panneau) et l'hôte cible.");
            return;
        }

        // Vérifier si l'hôte cible existe (optionnel mais utile)
        if (!findHostById(toHost)) {
             if (!confirm(`L'hôte cible "${toHost}" n'existe pas encore. Voulez-vous quand même créer la connexion ?`)) {
                 return;
             }
        }


        const newEdge = {
            id: `edge-${generateUUID()}`, // Générer un ID unique pour l'edge
            from: fromHostId,
            to: toHost,
            label: label || '', // Label optionnel
            arrows: 'to' // Style de flèche par défaut
        };

        hostData.edges.push(newEdge);
        console.log("Nouvel edge ajouté:", newEdge);

        saveData(); // Sauvegarde et re-render global

        // Mettre à jour la liste dans le panneau
        renderExistingEdges(fromHostId);

        // Vider les champs d'ajout
        editEdgeToInput.value = '';
        editEdgeLabelInput.value = '';
        console.log(">>> handleAddEdge: END");
    }

    function handleDeleteEdge(edgeId, hostIdToUpdatePanel) {
        console.log(`>>> handleDeleteEdge: START for edge ${edgeId}`);
        if (!edgeId) {
            console.error("ID d'edge manquant pour la suppression.");
            return;
        }

        const edgeIndex = hostData.edges.findIndex(edge => edge.id === edgeId);

        if (edgeIndex === -1) {
            console.warn(`Edge avec ID ${edgeId} non trouvé pour suppression.`);
            return; // Edge déjà supprimé ou ID invalide
        }

        // Confirmation (optionnelle mais recommandée)
        // if (!confirm(`Supprimer la connexion vers ${hostData.edges[edgeIndex].to} ?`)) {
        //     return;
        // }

        hostData.edges.splice(edgeIndex, 1); // Supprimer l'edge du tableau
        console.log(`Edge ${edgeId} supprimé.`);

        saveData(); // Sauvegarder les changements (cela va aussi re-render la carte)

        // Mettre à jour uniquement la liste dans le panneau d'édition si l'hôte est fourni
        if (hostIdToUpdatePanel) {
            renderExistingEdges(hostIdToUpdatePanel);
        }
        console.log(">>> handleDeleteEdge: END");
    }


    // --- Fonctions de Gestion des Panneaux (Edit, Settings) ---

    function openEditPanel(hostId) {
        console.log(`>>> openEditPanel: START for host ${hostId}`); // Log 1
        try {
            // Vérifier si l'ID est valide avant de chercher
            if (!hostId) {
                console.error(">>> openEditPanel: ERROR - hostId is null or empty.");
                alert("Erreur interne: ID d'hôte invalide fourni.");
                return;
            }

            const hostInfo = findHostById(hostId);
            console.log(">>> openEditPanel: hostInfo from findHostById:", hostInfo); // Log 2

            if (!hostInfo || !hostInfo.host || !hostInfo.categoryName) {
                console.error(`>>> openEditPanel: ERROR - Host info not found or incomplete for ID ${hostId}. hostInfo:`, hostInfo);
                alert(`Erreur: Impossible de trouver les informations complètes pour l'hôte ${hostId}.`);
                return;
            }

            const { host, categoryName } = hostInfo;
            console.log(`>>> openEditPanel: Found host object:`, host); // Log 3
            console.log(`>>> openEditPanel: Found categoryName: ${categoryName}`); // Log 4

            // Remplir les champs cachés cruciaux
            console.log(`>>> openEditPanel: Setting hidden editHostIdInput.value = ${hostId}`); // Log 5
            editHostIdInput.value = hostId;
            console.log(`>>> openEditPanel: Setting hidden editHostCategoryInput.value = ${categoryName}`); // Log 6
            editHostCategoryInput.value = categoryName;

            // Remplir les champs visibles
            console.log(`>>> openEditPanel: Setting visible editHostIpNameInput.value = ${hostId}`); // Log 7
            editHostIpNameInput.value = hostId; // L'ID est le nom/IP ici

            console.log(`>>> openEditPanel: Setting services (raw data: ${host.services})`); // Log 8
            editHostServicesInput.value = host.services || '';

            console.log(`>>> openEditPanel: Setting notes (raw data length: ${host.notes?.length || 0})`); // Log 9
            editHostNotesTextarea.value = host.notes || '';

            console.log(`>>> openEditPanel: Setting tags (raw data: ${host.tags})`); // Log 10
            editHostTagsInput.value = Array.isArray(host.tags) ? host.tags.join(', ') : (host.tags || '');

            console.log(`>>> openEditPanel: Setting system (raw data: ${host.system})`); // Log 11
            document.getElementById('editHostSystem').value = host.system || '';

            console.log(`>>> openEditPanel: Setting role (raw data: ${host.role})`); // Log 12
            document.getElementById('editHostRole').value = host.role || '';

            console.log(`>>> openEditPanel: Setting zone (raw data: ${host.zone})`); // Log 13
            document.getElementById('editHostZone').value = host.zone || '';

            console.log(`>>> openEditPanel: Setting compromiseLevel (raw data: ${host.compromiseLevel})`); // Log 14
            document.getElementById('editHostCompromiseLevel').value = host.compromiseLevel || 'None';

            console.log(`>>> openEditPanel: Setting exploitationTechniques (raw data: ${host.exploitationTechniques})`); // Log 15
            document.getElementById('editHostTechniques').value = Array.isArray(host.exploitationTechniques) ? host.exploitationTechniques.join(', ') : (host.exploitationTechniques || '');

            console.log(`>>> openEditPanel: Setting vulnerabilities (raw data: ${host.vulnerabilities})`); // Log 16
            document.getElementById('editHostVulnerabilities').value = Array.isArray(host.vulnerabilities) ? host.vulnerabilities.join(', ') : (host.vulnerabilities || '');

            // Vider et remplir les credentials
            console.log(">>> openEditPanel: Clearing and rendering credentials..."); // Log 17
            editCredentialsContainer.innerHTML = ''; // Vider d'abord
            renderHostCredentials(hostId); // Afficher les credentials existants via la NOUVELLE fonction

            // Afficher un placeholder SEULEMENT si aucun credential n'a été rendu
            if (editCredentialsContainer.children.length === 0) {
                console.log(">>> openEditPanel: No existing credentials found, adding placeholder."); // Log 18
                addCredentialInputGroup(); // Appeler sans argument pour un placeholder vide
            }

            // Vider et remplir les edges
            console.log(">>> openEditPanel: Clearing and rendering edges..."); // Log 19
            existingEdgesListDiv.innerHTML = ''; // Vider d'abord
            renderExistingEdges(hostId);

            // Vider et remplir les outputs
            console.log(">>> openEditPanel: Clearing and rendering outputs..."); // Log 20
            editOutputsContainer.innerHTML = ''; // Vider d'abord
            renderHostOutputs(hostId);

            // === NOUVEAU: Vider et remplir les étapes d'exploitation ===
            console.log(">>> openEditPanel: Clearing and rendering exploitation steps..."); // Log N1
            renderExploitationSteps(hostId); // Afficher les étapes existantes

            // Afficher le panneau en ajoutant la classe 'open'
            console.log(">>> openEditPanel: Adding 'open' class to editPanel."); // Log 21
            editPanel.classList.add('open');   // Nouvelle méthode (probablement correcte pour votre CSS)
            console.log(">>> openEditPanel: END - Panel should be open for", hostId); // Log 22

        } catch (error) {
            // Log amélioré de l'erreur
            console.error(`>>> openEditPanel: CRITICAL ERROR while processing host ${hostId}:`, error); // Log E1
            alert(`Une erreur critique est survenue lors de l'ouverture du panneau pour ${hostId}. Vérifiez la console.`);
        }
    }

    function closeEditPanel() {
        if (editPanel) {
            // Cacher le panneau en retirant la classe 'open'
            // editPanel.style.display = 'none'; // Ancienne méthode
            editPanel.classList.remove('open'); // Nouvelle méthode
            console.log("Edit panel closed.");
        }
        // Reset potentiellement large fields
        if (killchainReportPreviewTextarea) killchainReportPreviewTextarea.value = '';
        if (killchainReportRenderedPreviewDiv) killchainReportRenderedPreviewDiv.innerHTML = '';
    }

    // Modifier addCredentialInputGroup pour gérer les données existantes OU un placeholder
    function addCredentialInputGroup(credential = null) { // Accepte un objet credential ou null
        console.log(`>>> addCredentialInputGroup: START (Credential data: ${credential ? 'Provided' : 'None'})`);
        const container = editCredentialsContainer;
        if (!container) {
            console.error("Credential container not found!");
            return;
        }

        const group = document.createElement('div');
        group.className = 'credential-group form-row align-items-end mb-2';
        group.style.display = 'flex';
        group.style.flexWrap = 'wrap';
        group.style.gap = '0.5rem';

        // Pré-remplir les valeurs si un credential est fourni, sinon laisser vide
        const username = credential?.username || '';
        const password = credential?.password || '';
        const hash = credential?.hash || '';
        const type = credential?.type || 'Password'; // Défaut à 'Password' si nouveau
        const source = credential?.source || '';

        // Structure HTML avec valeurs pré-remplies ou placeholders
        group.innerHTML = `
            <div style="flex: 1 1 100px;"> <!-- User -->
                <label class="small mb-0 d-block">User</label>
                <input type="text" class="form-control form-control-sm" placeholder="Username" value="${sanitizeInput(username)}">
            </div>
            <div style="flex: 1 1 100px;"> <!-- Password -->
                <label class="small mb-0 d-block">Password</label>
                <input type="password" class="form-control form-control-sm" placeholder="Password" value="${sanitizeInput(password)}">
            </div>
            <div style="flex: 1 1 100px;"> <!-- Hash -->
                <label class="small mb-0 d-block">Hash</label>
                <input type="text" class="form-control form-control-sm" placeholder="Hash" value="${sanitizeInput(hash)}">
            </div>
            <div style="flex: 0 1 120px;"> <!-- Type -->
                <label class="small mb-0 d-block">Type</label>
                <select class="form-control form-control-sm">
                    <option value="Password" ${type === 'Password' ? 'selected' : ''}>Password</option>
                    <option value="Hash" ${type === 'Hash' ? 'selected' : ''}>Hash</option>
                    <option value="Token" ${type === 'Token' ? 'selected' : ''}>Token</option>
                    <option value="Key" ${type === 'Key' ? 'selected' : ''}>Key</option>
                    <option value="Other" ${type === 'Other' ? 'selected' : ''}>Other</option>
                </select>
            </div>
            <div style="flex: 1 1 100px;"> <!-- Source -->
                <label class="small mb-0 d-block">Source</label>
                <input type="text" class="form-control form-control-sm" placeholder="Source" value="${sanitizeInput(source)}">
            </div>
            <div style="flex: 0 0 auto; align-self: flex-end;"> <!-- Bouton Supprimer -->
                <button type="button" class="btn btn-danger btn-sm remove-credential-btn" title="Supprimer ce credential">&times;</button>
            </div>
        `;

        // Mettre la valeur sélectionnée pour le select (après l'ajout au DOM serait plus sûr, mais on essaie comme ça)
        const selectElement = group.querySelector('select');
        if (selectElement) selectElement.value = type; // Assigner la valeur après création

        // Ajouter l'écouteur pour le bouton supprimer
        const removeBtn = group.querySelector('.remove-credential-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', function() {
                console.log("Remove credential button clicked.");
                group.remove();
                // La suppression réelle des données se fait lors de la sauvegarde globale via handleSaveHostFromPanel
            });
        }

        container.appendChild(group);
        console.log(">>> addCredentialInputGroup: END - Group added.");
    }

    function renderExistingEdges(hostId) {
        console.log(`>>> renderExistingEdges: START for host ${hostId}`);
        if (!existingEdgesListDiv) {
            console.error("Element #existingEdgesList introuvable.");
            return;
        }
        existingEdgesListDiv.innerHTML = ''; // Vider la liste actuelle

        if (!hostData.edges || hostData.edges.length === 0) {
            existingEdgesListDiv.innerHTML = '<p class="text-muted small">Aucune connexion sortante définie.</p>';
            console.log("Aucun edge à afficher.");
            return;
        }

        const outgoingEdges = hostData.edges.filter(edge => edge.from === hostId);

        if (outgoingEdges.length === 0) {
            existingEdgesListDiv.innerHTML = '<p class="text-muted small">Aucune connexion sortante définie pour cet hôte.</p>';
            console.log(`Aucun edge sortant trouvé pour ${hostId}.`);
            return;
        }

        console.log(`Affichage de ${outgoingEdges.length} edge(s) sortant(s) pour ${hostId}`);
        outgoingEdges.forEach(edge => {
            const edgeDiv = document.createElement('div');
            edgeDiv.className = 'edge-item d-flex justify-content-between align-items-center mb-1 p-1 border-bottom'; // Utilisation de classes Bootstrap pour la mise en forme
            edgeDiv.innerHTML = `
                <span>Vers: <strong>${sanitizeInput(edge.to)}</strong> (Label: <em>${sanitizeInput(edge.label || 'N/A')}</em>)</span>
                <button class="btn btn-outline-danger btn-sm delete-edge-btn" data-edge-id="${edge.id}" title="Supprimer cette connexion">🗑️</button>
            `;

            const deleteBtn = edgeDiv.querySelector('.delete-edge-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => handleDeleteEdge(edge.id, hostId)); // Passer hostId pour re-render
            }

            existingEdgesListDiv.appendChild(edgeDiv);
        });
        console.log(">>> renderExistingEdges: END");
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

    // --- Fonctions Utilitaires ---
    function findHostById(hostId) {
        console.log(`>>> findHostById: Searching for host with ID: ${hostId}`); // Log existant
        if (!hostId) {
            console.warn(">>> findHostById: Called with null or empty hostId.");
            return null;
        }
        for (const categoryName in hostData.categories) {
            if (hostData.categories[categoryName]?.hosts?.[hostId]) {
                console.log(`>>> findHostById: Host found in category "${categoryName}"`); // Log existant
                // Retourner une copie pour éviter les modifications accidentelles par référence ? Non, on veut modifier l'original.
                return { host: hostData.categories[categoryName].hosts[hostId], categoryName: categoryName };
            }
        }
        console.warn(`>>> findHostById: Host with ID ${hostId} not found in any category.`);
        return null; // Hôte non trouvé
    }

    // --- Fonctions de Gestion des Outputs --- AJOUT DE CETTE SECTION COMPLÈTE

    // Affiche les outputs pour un hôte donné dans le panneau
    function renderHostOutputs(hostId) {
        console.log(`>>> renderHostOutputs: START for host ${hostId}`);
        if (!editOutputsContainer || !outputNavigation || !noOutputsMsg) {
            console.error("renderHostOutputs: Output container, navigation element, or no-output message element not found.");
            return;
        }

        const hostInfo = findHostById(hostId);
        // Assurer que hostInfo.host.outputs est un tableau, même s'il n'existe pas encore
        const outputs = hostInfo?.host?.outputs || [];
        if (!Array.isArray(outputs)) {
             console.warn(`Outputs for host ${hostId} is not an array, initializing.`);
             if (hostInfo && hostInfo.host) {
                 hostInfo.host.outputs = [];
             } else {
                 console.error("Cannot initialize outputs array as host object is missing.");
                 return;
             }
        }


        editOutputsContainer.innerHTML = ''; // Vider les anciens outputs affichés
        outputNavigation.innerHTML = ''; // Vider la navigation
        outputNavigation.style.display = 'none'; // Cacher la navigation par défaut
        noOutputsMsg.style.display = 'none'; // Cacher le message par défaut

        if (outputs.length === 0) {
            console.log("No outputs to render.");
            // S'assurer que noOutputsMsg existe avant de l'ajouter
            if (noOutputsMsg) {
                editOutputsContainer.appendChild(noOutputsMsg); // Remettre le message
                noOutputsMsg.style.display = 'block'; // Afficher le message
            } else {
                editOutputsContainer.innerHTML = '<p class="text-muted small">Aucun output enregistré pour cet hôte.</p>'; // Fallback
            }
            return;
        }

        console.log(`Rendering ${outputs.length} outputs.`);

        // Créer la structure de navigation (onglets)
        const navTabs = document.createElement('ul');
        navTabs.className = 'nav nav-tabs';
        outputNavigation.appendChild(navTabs);
        outputNavigation.style.display = 'block'; // Afficher la zone de navigation

        outputs.forEach((output, index) => {
            // Créer l'onglet de navigation
            const navItem = document.createElement('li');
            navItem.className = 'nav-item';
            const navLink = document.createElement('a');
            navLink.className = 'nav-link';
            navLink.href = '#'; // Pour le style, mais l'action est gérée par JS
            // Utiliser le type et l'index pour le nom de l'onglet, ou juste l'index si type manquant
            navLink.textContent = `${output.type || 'Output'} #${index + 1}`;
            navLink.dataset.outputId = output.id; // Lier l'onglet à l'output
            if (index === 0) {
                navLink.classList.add('active'); // Activer le premier onglet
            }
            navLink.addEventListener('click', (e) => {
                e.preventDefault();
                switchOutputTab(output.id);
            });
            navItem.appendChild(navLink);
            navTabs.appendChild(navItem);

            // Créer l'élément pour afficher l'output
            const outputDiv = document.createElement('div');
            outputDiv.className = 'output-display-item';
            outputDiv.dataset.outputId = output.id; // Lier le contenu à l'ID
            outputDiv.style.display = (index === 0) ? 'block' : 'none'; // Afficher seulement le premier

            // Header de l'output
            const headerDiv = document.createElement('div');
            headerDiv.className = 'output-display-header';
            const typeStrong = document.createElement('strong');
            typeStrong.textContent = output.type || 'Output Brut';
            if (output.type === 'Dump' && output.subType) {
                 typeStrong.textContent += ` (${output.subType})`;
            }
            const timestampSpan = document.createElement('span');
            timestampSpan.className = 'output-timestamp ml-auto mr-2'; // ml-auto pousse à droite
            timestampSpan.textContent = output.timestamp ? new Date(output.timestamp).toLocaleString() : 'Date inconnue';
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-outline-danger btn-sm delete-output-btn';
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.title = 'Supprimer cet output';
            deleteBtn.addEventListener('click', () => handleDeleteOutput(output.id, hostId));

            headerDiv.appendChild(typeStrong);
            headerDiv.appendChild(timestampSpan);
            headerDiv.appendChild(deleteBtn);

            // Contenu de l'output
            const contentDiv = document.createElement('div');
            contentDiv.className = 'output-display-content';
            const preElement = document.createElement('pre');
            preElement.textContent = output.content || ''; // Afficher le contenu brut
            contentDiv.appendChild(preElement);

            outputDiv.appendChild(headerDiv);
            outputDiv.appendChild(contentDiv);
            editOutputsContainer.appendChild(outputDiv);
        });

        console.log(">>> renderHostOutputs: END");
    }

    // Gère le clic sur un onglet de navigation d'output
    function switchOutputTab(outputIdToShow) {
        console.log(`>>> switchOutputTab: Switching to output ${outputIdToShow}`);
        if (!editOutputsContainer || !outputNavigation) return;

        // Masquer tous les contenus d'output
        const allOutputItems = editOutputsContainer.querySelectorAll('.output-display-item');
        allOutputItems.forEach(item => item.style.display = 'none');

        // Désactiver tous les onglets
        const allNavLinks = outputNavigation.querySelectorAll('.nav-link');
        allNavLinks.forEach(link => link.classList.remove('active'));

        // Afficher l'output sélectionné et activer son onglet
        const outputToShow = editOutputsContainer.querySelector(`.output-display-item[data-output-id="${outputIdToShow}"]`);
        const navLinkToActivate = outputNavigation.querySelector(`.nav-link[data-output-id="${outputIdToShow}"]`);

        if (outputToShow) {
            outputToShow.style.display = 'block';
        } else {
            console.warn(`Output content not found for ID: ${outputIdToShow}`);
        }
        if (navLinkToActivate) {
            navLinkToActivate.classList.add('active');
        } else {
             console.warn(`Navigation link not found for ID: ${outputIdToShow}`);
        }
        console.log(">>> switchOutputTab: END");
    }

    // Gère la suppression d'un output (ne sauvegarde pas globalement)
    function handleDeleteOutput(outputId, hostId) {
        console.log(`>>> handleDeleteOutput: START for output ${outputId} on host ${hostId}`);
        if (!outputId || !hostId) {
            console.error("handleDeleteOutput: Missing outputId or hostId.");
            return;
        }

        const hostInfo = findHostById(hostId);
        if (!hostInfo || !hostInfo.host || !Array.isArray(hostInfo.host.outputs)) {
            console.error(`handleDeleteOutput: Host ${hostId} or its outputs array not found.`);
            return;
        }

        const outputIndex = hostInfo.host.outputs.findIndex(out => out.id === outputId);

        if (outputIndex === -1) {
            console.warn(`handleDeleteOutput: Output with ID ${outputId} not found on host ${hostId}.`);
            return;
        }

        // Confirmation (optionnelle)
        // if (!confirm(`Supprimer l'output ${hostInfo.host.outputs[outputIndex].type || 'Output'} #${outputIndex + 1} ?`)) {
        //     return;
        // }

        hostInfo.host.outputs.splice(outputIndex, 1); // Supprimer l'output du tableau
        console.log(`Output ${outputId} removed from host ${hostId} object.`);

        // Rafraîchir l'affichage des outputs dans le panneau
        renderHostOutputs(hostId);
        console.log(">>> handleDeleteOutput: END");
        // Note: La sauvegarde globale se fera via le bouton "Sauvegarder Modifications" du panneau
    }

    // Ouvre et prépare la zone de saisie pour un nouveau type d'output
    function openNewOutputInput(type) {
        console.log(`>>> openNewOutputInput: START for type ${type}`);
        if (!newOutputInputArea || !outputTypeSelection || !addOutputBtn || !newOutputTitle || !newOutputContent || !newOutputContentLabel || !newOutputSubTypeGroup) {
            console.error("openNewOutputInput: One or more required elements for the input area are missing.");
            return;
        }

        // Préparer la zone de saisie
        newOutputTitle.textContent = `Ajouter Output: ${type}`;
        newOutputContent.value = ''; // Vider le contenu précédent
        newOutputSubType.value = ''; // Vider le sous-type
        newOutputContent.placeholder = `Collez l'output ${type} ici...`;
        newOutputContentLabel.textContent = `Contenu (${type}):`;

        // Gérer le champ spécifique pour le type "Dump"
        newOutputSubTypeGroup.style.display = (type === 'Dump') ? 'block' : 'none';

        // Stocker le type pour la sauvegarde
        newOutputInputArea.dataset.currentOutputType = type;

        // Afficher/Cacher les bonnes sections
        outputTypeSelection.style.display = 'none';
        newOutputInputArea.style.display = 'block';
        addOutputBtn.style.display = 'none'; // Garder le bouton principal caché

        console.log(">>> openNewOutputInput: END - Input area ready.");
    }

    // Sauvegarde le nouvel output dans l'objet host (ne sauvegarde pas globalement)
    function saveNewOutput() {
        console.log(">>> saveNewOutput: START");
        const hostId = editHostIdInput.value;
        const type = newOutputInputArea.dataset.currentOutputType;
        const content = newOutputContent.value.trim();
        const subType = (type === 'Dump') ? newOutputSubType.value.trim() : undefined;

        if (!hostId || !type || !content) {
            alert("Erreur: Type ou contenu manquant pour l'output.");
            console.error("saveNewOutput: Missing hostId, type, or content.");
            return;
        }

        const hostInfo = findHostById(hostId);
        if (!hostInfo || !hostInfo.host) {
            alert("Erreur: Hôte non trouvé pour ajouter l'output.");
            console.error("saveNewOutput: Host not found.");
            return;
        }

        // S'assurer que le tableau outputs existe
        if (!Array.isArray(hostInfo.host.outputs)) {
            hostInfo.host.outputs = [];
        }

        const newOutput = {
            id: `output-${generateUUID()}`,
            type: type,
            content: content,
            timestamp: new Date().toISOString(), // Ajouter un timestamp
        };
        if (subType !== undefined && subType !== '') { // Ajouter subType seulement s'il est défini et non vide
            newOutput.subType = subType;
        }

        hostInfo.host.outputs.push(newOutput);
        console.log(`New output added to host ${hostId} object:`, newOutput);

        // Rafraîchir l'affichage et cacher la zone de saisie
        renderHostOutputs(hostId);
        newOutputInputArea.style.display = 'none';
        addOutputBtn.style.display = 'inline-block'; // Réafficher le bouton principal

        // --- AJOUT DE LA SAUVEGARDE IMMÉDIATE ---
        saveData(); // Sauvegarde les données globales (y compris le nouvel output) et rafraîchit l'UI
        // -----------------------------------------

        console.log(">>> saveNewOutput: END");
        // Note: La sauvegarde globale se fera via le bouton "Sauvegarder Modifications" du panneau
    }

    // --- Initialisation et Écouteurs d'Événements ---

    function setupEventListeners() {
        console.log(">>> setupEventListeners: START"); // Mise à jour du log

        // Vérifier si les éléments DOM essentiels sont présents
        if (!categoryTabsContainer || !addCategoryBtn || !categoryContentContainer || !networkMapDiv || !editPanel || !importSessionInput) {
             console.error("setupEventListeners: Un ou plusieurs éléments DOM critiques sont manquants. Vérifiez les IDs dans hostmanager.html.");
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

        // --- Panneau d'Édition Hôte ---
        if (closePanelBtn) closePanelBtn.addEventListener('click', closeEditPanel);
        if (editHostForm) editHostForm.addEventListener('submit', handleSaveHostFromPanel);
        if (addCredentialBtn) addCredentialBtn.addEventListener('click', () => addCredentialInputGroup());
        if (deleteHostFromPanelBtn) deleteHostFromPanelBtn.addEventListener('click', handleDeleteHostFromPanel);
        if (addEdgeBtn) addEdgeBtn.addEventListener('click', handleAddEdge);
        if (editPanelToggleWideBtn) editPanelToggleWideBtn.addEventListener('click', () => editPanel.classList.toggle('wide-panel'));
        console.log("Listeners for Edit Panel attached."); // Ajout d'un log pour confirmer

        // --- Section Outputs ---
        if (addOutputBtn) {
            addOutputBtn.addEventListener('click', () => {
                console.log("Bouton 'Ajouter un Output' cliqué !"); // Log de débogage
                if (outputTypeSelection && newOutputInputArea && addOutputBtn) {
                    outputTypeSelection.style.display = 'block'; // Afficher la sélection de type
                    newOutputInputArea.style.display = 'none'; // Cacher la zone de saisie (au cas où)
                    addOutputBtn.style.display = 'none'; // Cacher le bouton principal "Ajouter"
                    console.log("Affichage de la sélection du type d'output.");
                } else {
                    console.error("Impossible d'afficher la sélection de type : un ou plusieurs éléments sont manquants.");
                }
            });
            console.log("Listener attaché à addOutputBtn."); // Confirmation
        } else {
            console.warn("Le bouton #addOutputBtn n'a pas été trouvé.");
        }

        if (outputTypeSelection) {
            outputTypeSelection.addEventListener('click', (event) => {
                const target = event.target;
                if (target.tagName === 'BUTTON' && target.dataset.outputType) {
                    console.log(`Type d'output sélectionné: ${target.dataset.outputType}`);
                    openNewOutputInput(target.dataset.outputType);
                } else if (target.id === 'cancelOutputTypeSelectionBtn') {
                     console.log("Annulation de la sélection du type.");
                     if (outputTypeSelection) outputTypeSelection.style.display = 'none';
                     if (addOutputBtn) addOutputBtn.style.display = 'inline-block'; // Réafficher le bouton principal
                }
            });
            console.log("Listener attaché à outputTypeSelection (délégation).");
        } else {
             console.warn("La zone #outputTypeSelection n'a pas été trouvée.");
        }

        if (saveNewOutputBtn) {
             saveNewOutputBtn.addEventListener('click', saveNewOutput);
             console.log("Listener attaché à saveNewOutputBtn.");
        } else {
             console.warn("Le bouton #saveNewOutputBtn n'a pas été trouvé.");
        }

        if (cancelNewOutputBtn) {
            cancelNewOutputBtn.addEventListener('click', () => {
                console.log("Annulation de l'ajout d'output.");
                if (newOutputInputArea) newOutputInputArea.style.display = 'none';
                if (addOutputBtn) addOutputBtn.style.display = 'inline-block'; // Réafficher le bouton principal
            });
            console.log("Listener attaché à cancelNewOutputBtn.");
        } else {
             console.warn("Le bouton #cancelNewOutputBtn n'a pas été trouvé.");
        }
        // Les écouteurs pour supprimer outputs/credentials/edges sont ajoutés dynamiquement lors du rendu

        // ... (écouteurs pour panneau settings, killchain, etc.) ...

        // --- Section Exportation Arborescence --- MISE À JOUR DES ÉCOUTEURS
        if (selectExportDirBtn) {
            selectExportDirBtn.addEventListener('click', selectExportDirectory);
            console.log("Listener attaché à selectExportDirBtn.");
        } else {
            console.warn("Le bouton #selectExportDirBtn n'a pas été trouvé.");
        }

        if (executeNodeExportBtn) {
            executeNodeExportBtn.addEventListener('click', executeNodeTreeExport);
            console.log("Listener attaché à executeNodeExportBtn.");
        } else {
            console.warn("Le bouton #executeNodeExportBtn n'a pas été trouvé.");
        }

        if (executeNodeExportZipBtn) {
            executeNodeExportZipBtn.addEventListener('click', executeNodeTreeExportZip);
            console.log("Listener attaché à executeNodeExportZipBtn.");
        } else {
            console.warn("Le bouton #executeNodeExportZipBtn n'a pas été trouvé.");
        }

        // Désactiver le bouton d'export initialement
        if(executeNodeExportBtn) executeNodeExportBtn.disabled = true;
        if(executeNodeExportZipBtn) executeNodeExportZipBtn.disabled = false; // Assurez-vous que le bouton ZIP est activé par défaut

        // Écouteurs pour le panneau d'édition
        if (editPanel) {
            // ... (écouteurs existants pour closePanelBtn, toggleWidePanelBtn, editHostForm submit, etc.)
            if (addExploitationStepBtn) {
                addExploitationStepBtn.addEventListener('click', handleAddExploitationStep);
            }
        }

        // Écouteurs pour la modale des détails de l'étape
        if (saveExploitationStepBtn) {
            saveExploitationStepBtn.addEventListener('click', handleSaveExploitationStep);
        }
        // Mettre à jour l'aperçu quand l'URL change dans la modale
         if (stepDetailModalScreenshotUrl) {
            stepDetailModalScreenshotUrl.addEventListener('input', () => {
                updateScreenshotPreview(stepDetailModalScreenshotUrl.value);
            });
        }
         // Fermeture de la modale Bootstrap (si Bootstrap JS est utilisé)
         $('#exploitationStepDetailModal').on('hidden.bs.modal', function () {
             // Optionnel: faire quelque chose à la fermeture, comme vider explicitement
             exploitationStepDetailForm.reset();
             stepDetailModalScreenshotPreview.innerHTML = '';
         });

        console.log(">>> setupEventListeners: END - Écouteurs attachés."); // Mise à jour du log
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

    // --- Exécution au chargement du DOM ---
    // Déplacer l'exécution principale ici, à la fin du script, dans l'écouteur DOMContentLoaded

    // Chargement initial des données
    loadData();
    // Rendu initial de l'interface
    renderAll();
    // Attachement des écouteurs d'événements
    setupEventListeners(); // Appel de la fonction qui contient les addEventListener

    console.log("Host Manager V2 Initialized and ready.");

    // --- Fonction d'Exportation Arborescence TXT via File System Access API --- MODIFICATION PROFONDE

    // Fonction pour demander à l'utilisateur de choisir un dossier
    async function selectExportDirectory() {
        console.log(">>> selectExportDirectory: START");
        nodeExportStatusMsg.textContent = ''; // Clear previous messages
        nodeExportStatusMsg.className = 'mt-2 d-block small';
        executeNodeExportBtn.disabled = true; // Désactiver tant qu'on n'a pas de handle valide
        selectedDirPath.textContent = 'Sélection en cours...';

        // Vérifier la compatibilité de l'API
        if (!window.showDirectoryPicker) {
            console.error("File System Access API (showDirectoryPicker) is not supported by this browser.");
            nodeExportStatusMsg.textContent = "Erreur: Votre navigateur ne supporte pas la sélection de dossier directe.";
            nodeExportStatusMsg.className = 'mt-2 d-block small error';
            selectedDirPath.textContent = 'Non supporté';
            selectExportDirBtn.disabled = true; // Désactiver le bouton si API non supportée
            return;
        }

        try {
            // Demander à l'utilisateur de choisir un dossier
            const handle = await window.showDirectoryPicker();
            selectedDirectoryHandle = handle; // Stocker le handle
            selectedDirPath.textContent = `Dossier : ${handle.name}`; // Afficher le nom du dossier choisi
            executeNodeExportBtn.disabled = false; // Activer le bouton d'export
            nodeExportStatusMsg.textContent = "Dossier sélectionné. Prêt à exporter.";
            nodeExportStatusMsg.className = 'mt-2 d-block small info';
            console.log(">>> selectExportDirectory: END - Directory selected:", handle.name);
        } catch (err) {
            // Gérer l'erreur si l'utilisateur annule ou si l'API échoue
            if (err.name === 'AbortError') {
                console.log("User cancelled the directory selection.");
                nodeExportStatusMsg.textContent = "Sélection du dossier annulée.";
                nodeExportStatusMsg.className = 'mt-2 d-block small warning';
            } else {
                console.error("Error selecting directory:", err);
                nodeExportStatusMsg.textContent = `Erreur lors de la sélection: ${err.message}`;
                nodeExportStatusMsg.className = 'mt-2 d-block small error';
            }
            selectedDirectoryHandle = null; // Réinitialiser le handle
            selectedDirPath.textContent = 'Aucun dossier sélectionné';
        }
    }

    // Fonction principale d'exportation qui utilise le handle stocké
    async function executeNodeTreeExport() {
        console.log(">>> executeNodeTreeExport (FSA): START");
        if (!selectedDirectoryHandle) { /* ... (vérifications comme avant) ... */ return; }
        if (!executeNodeExportBtn || !nodeExportStatusMsg) { /* ... */ return; }

        // Désactiver les boutons pendant l'export
        executeNodeExportBtn.disabled = true;
        selectExportDirBtn.disabled = true;
        executeNodeExportZipBtn.disabled = true; // Désactiver aussi le bouton ZIP
        nodeExportStatusMsg.textContent = "Exportation vers le dossier en cours...";
        nodeExportStatusMsg.className = 'mt-3 d-block small info';

        try {
            const permissionStatus = await selectedDirectoryHandle.requestPermission({ mode: 'readwrite' });
            if (permissionStatus !== 'granted') { throw new Error("Permission d'écriture refusée."); }

            for (const categoryName in hostData.categories) {
                if (!hostData.categories.hasOwnProperty(categoryName)) continue;
                const categoryData = hostData.categories[categoryName];
                const categoryDirHandle = await selectedDirectoryHandle.getDirectoryHandle(sanitizeFilename(categoryName), { create: true });

                if (!categoryData.hosts) continue;

                for (const hostId in categoryData.hosts) {
                    if (!categoryData.hosts.hasOwnProperty(hostId)) continue;
                    const host = categoryData.hosts[hostId];
                    const hostDirHandle = await categoryDirHandle.getDirectoryHandle(sanitizeFilename(hostId), { create: true });

                    // Utiliser l'helper pour obtenir le contenu
                    const fileContents = generateHostFileContent(host, hostId, categoryName);

                    // Écrire les fichiers
                    await writeFile(hostDirHandle, "info.txt", fileContents.info);
                    if (fileContents.credentials) {
                        await writeFile(hostDirHandle, "credentials.txt", fileContents.credentials);
                    }
                    if (fileContents.outputs.length > 0) {
                        const outputsDirHandle = await hostDirHandle.getDirectoryHandle("outputs", { create: true });
                        for (const output of fileContents.outputs) {
                            await writeFile(outputsDirHandle, output.filename, output.content);
                        }
                    }
                    await writeFile(hostDirHandle, "edges.txt", fileContents.edges);
                }
            }

            nodeExportStatusMsg.textContent = "Exportation vers dossier terminée avec succès !";
            nodeExportStatusMsg.className = 'mt-3 d-block small success';
            console.log(">>> executeNodeTreeExport (FSA): END - Success");

        } catch (error) {
            console.error("Erreur lors de l'exportation FSA:", error);
            nodeExportStatusMsg.textContent = `Erreur (FSA): ${error.message}`;
            nodeExportStatusMsg.className = 'mt-3 d-block small error';
            console.log(">>> executeNodeTreeExport (FSA): END - Error");
        } finally {
            // Réactiver les boutons (sauf celui d'export FSA si handle perdu)
            executeNodeExportBtn.disabled = !selectedDirectoryHandle;
            selectExportDirBtn.disabled = false;
            executeNodeExportZipBtn.disabled = false;
            // ... (timeout pour effacer message comme avant) ...
             setTimeout(() => {
                 if (nodeExportStatusMsg) nodeExportStatusMsg.textContent = '';
                 if (nodeExportStatusMsg) nodeExportStatusMsg.className = 'mt-3 d-block small';
            }, 7000);
        }
    }

    // Fonction utilitaire pour écrire un fichier FSA (INCHANGÉE)
    async function writeFile(dirHandle, fileName, content) {
        try {
            const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(content);
            await writable.close();
            // console.log(`Fichier écrit: ${fileName}`); // Log si besoin
        } catch (err) {
            console.error(`Erreur lors de l'écriture du fichier ${fileName}:`, err);
            throw err; // Propager l'erreur pour la gestion globale
        }
    }


    // --- Option 2: Export ZIP ---

    // Fonction d'exportation ZIP (RÉINTRODUITE et MODIFIÉE pour utiliser l'helper)
    async function executeNodeTreeExportZip() {
        console.log(">>> executeNodeTreeExportZip: START");
        if (!executeNodeExportZipBtn || !nodeExportStatusMsg) { /* ... */ return; }

        // Vérifier la présence des bibliothèques
        if (typeof JSZip === 'undefined' || typeof saveAs === 'undefined') {
             console.error("JSZip or FileSaver library not found.");
             nodeExportStatusMsg.textContent = "Erreur: Bibliothèques JSZip/FileSaver manquantes.";
             nodeExportStatusMsg.className = 'mt-3 d-block small error';
             return;
        }

        // Désactiver les boutons pendant l'export
        executeNodeExportZipBtn.disabled = true;
        executeNodeExportBtn.disabled = true; // Désactiver aussi le bouton FSA
        selectExportDirBtn.disabled = true;
        nodeExportStatusMsg.textContent = "Génération de l'archive ZIP en cours...";
        nodeExportStatusMsg.className = 'mt-3 d-block small info';

        try {
            const zip = new JSZip();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

            for (const categoryName in hostData.categories) {
                if (!hostData.categories.hasOwnProperty(categoryName)) continue;
                const categoryData = hostData.categories[categoryName];
                const categoryFolder = zip.folder(sanitizeFilename(categoryName));

                if (!categoryData.hosts) continue;

                for (const hostId in categoryData.hosts) {
                    if (!categoryData.hosts.hasOwnProperty(hostId)) continue;
                    const host = categoryData.hosts[hostId];
                    const hostFolder = categoryFolder.folder(sanitizeFilename(hostId));

                    // Utiliser l'helper pour obtenir le contenu
                    const fileContents = generateHostFileContent(host, hostId, categoryName);

                    // Ajouter les fichiers au ZIP
                    hostFolder.file("info.txt", fileContents.info);
                    if (fileContents.credentials) {
                        hostFolder.file("credentials.txt", fileContents.credentials);
                    }
                    if (fileContents.outputs.length > 0) {
                        const outputsFolder = hostFolder.folder("outputs");
                        fileContents.outputs.forEach(output => {
                            outputsFolder.file(output.filename, output.content);
                        });
                    }
                    hostFolder.file("edges.txt", fileContents.edges);
                }
            }

            // Générer et télécharger le ZIP
            const zipBlob = await zip.generateAsync({ type: "blob" });
            saveAs(zipBlob, `HostManager_Export_${timestamp}.zip`);

            nodeExportStatusMsg.textContent = "Exportation ZIP générée avec succès !";
            nodeExportStatusMsg.className = 'mt-3 d-block small success';
            console.log(">>> executeNodeTreeExportZip: END - Success");

        } catch (error) {
            console.error("Erreur lors de la génération de l'export ZIP:", error);
            nodeExportStatusMsg.textContent = `Erreur (ZIP): ${error.message}`;
            nodeExportStatusMsg.className = 'mt-3 d-block small error';
            console.log(">>> executeNodeTreeExportZip: END - Error");
        } finally {
            // Réactiver les boutons (sauf celui d'export FSA si handle perdu)
             executeNodeExportZipBtn.disabled = false;
             executeNodeExportBtn.disabled = !selectedDirectoryHandle;
             selectExportDirBtn.disabled = false;
            // ... (timeout pour effacer message comme avant) ...
             setTimeout(() => {
                 if (nodeExportStatusMsg) nodeExportStatusMsg.textContent = '';
                 if (nodeExportStatusMsg) nodeExportStatusMsg.className = 'mt-3 d-block small';
            }, 7000);
        }
    }


    // Fonction utilitaire pour nettoyer les noms de fichiers/dossiers (INCHANGÉE)
    function sanitizeFilename(name) {
        return name.replace(/[\\/:*?"<>|]/g, '_');
    }

    // Helper pour générer le contenu des fichiers pour un hôte donné
    function generateHostFileContent(host, hostId, categoryName) {
        const content = {
            info: '',
            credentials: null, // Sera une string si des credentials existent
            outputs: [],       // Tableau d'objets { filename: '...', content: '...' }
            edges: ''
        };

        // a) info.txt
        content.info = `Hôte: ${hostId}\n`;
        content.info += `Catégorie: ${categoryName}\n`;
        content.info += `Système: ${host.system || 'N/A'}\n`;
        content.info += `Rôle: ${host.role || 'N/A'}\n`;
        content.info += `Zone Réseau: ${host.zone || 'N/A'}\n`;
        content.info += `Niveau Compromission: ${host.compromiseLevel || 'None'}\n`;
        content.info += `\n--- Notes ---\n${host.notes || ''}\n`;
        content.info += `\n--- Tags ---\n${Array.isArray(host.tags) ? host.tags.join(', ') : (host.tags || 'Aucun')}\n`;
        content.info += `\n--- Techniques Exploitation ---\n${Array.isArray(host.exploitationTechniques) ? host.exploitationTechniques.map(t => `- ${t}`).join('\n') : (host.exploitationTechniques || 'Aucune')}\n`;
        content.info += `\n--- Vulnérabilités ---\n${Array.isArray(host.vulnerabilities) ? host.vulnerabilities.map(v => `- ${v}`).join('\n') : (host.vulnerabilities || 'Aucune')}\n`;

        // b) credentials.txt
        if (host.credentials && host.credentials.length > 0) {
            // CORRECTION ICI: Utiliser les champs corrects (username, password, hash)
            let credContent = "Username\tPassword\tHash\tType\tSource\n";
            credContent += "--------\t--------\t----\t----\t------\n";
            host.credentials.forEach(cred => {
                // Utiliser les bonnes propriétés de l'objet credential
                const user = cred.username || '';
                const pass = cred.password || '';
                const hashVal = cred.hash || '';
                const type = cred.type || 'N/A';
                const source = cred.source || 'N/A';
                credContent += `${user}\t${pass}\t${hashVal}\t${type}\t${source}\n`;
            });
            content.credentials = credContent;
        }

        // c) outputs/
        if (host.outputs && host.outputs.length > 0) {
            host.outputs.forEach((output, index) => {
                const outputFilename = sanitizeFilename(`${output.type || 'Output'}_${index + 1}_${output.id}.txt`);
                let outputContent = `Type: ${output.type || 'N/A'}\n`;
                if (output.subType) {
                    outputContent += `Sous-Type: ${output.subType}\n`;
                }
                outputContent += `Timestamp: ${output.timestamp ? new Date(output.timestamp).toLocaleString() : 'N/A'}\n`;
                outputContent += `--- Contenu ---\n\n${output.content || ''}`;
                content.outputs.push({ filename: outputFilename, content: outputContent });
            });
        }

        // d) edges.txt
        let edgeContent = `--- Connexions Sortantes (Depuis ${hostId}) ---\n`;
        const outgoingEdges = hostData.edges.filter(edge => edge.from === hostId);
        if (outgoingEdges.length > 0) {
            outgoingEdges.forEach(edge => {
                edgeContent += `- Vers: ${edge.to} (Label: ${edge.label || 'Aucun'})\n`;
            });
        } else {
            edgeContent += "(Aucune)\n";
        }

        edgeContent += `\n--- Connexions Entrantes (Vers ${hostId}) ---\n`;
        const incomingEdges = hostData.edges.filter(edge => edge.to === hostId);
        if (incomingEdges.length > 0) {
            incomingEdges.forEach(edge => {
                edgeContent += `- Depuis: ${edge.from} (Label: ${edge.label || 'Aucun'})\n`;
            });
        } else {
            edgeContent += "(Aucune)\n";
        }
        content.edges = edgeContent;

        return content;
    }

    // NOUVELLE FONCTION : Pour afficher les credentials existants dans le panneau
    function renderHostCredentials(hostId) {
        console.log(`>>> renderHostCredentials: START for host ${hostId}`);
        if (!editCredentialsContainer) {
            console.error("Element #editCredentialsContainer introuvable.");
            return;
        }
        // Pas besoin de vider ici, openEditPanel le fait déjà avant d'appeler

        const hostInfo = findHostById(hostId);
        if (!hostInfo || !hostInfo.host || !Array.isArray(hostInfo.host.credentials) || hostInfo.host.credentials.length === 0) {
            console.log(`Aucun credential à afficher pour ${hostId}.`);
            // Ne rien faire, openEditPanel ajoutera le placeholder si nécessaire
            return;
        }

        console.log(`Affichage de ${hostInfo.host.credentials.length} credential(s) pour ${hostId}`);
        hostInfo.host.credentials.forEach(cred => {
            addCredentialInputGroup(cred); // Passer l'objet credential existant
        });
        console.log(">>> renderHostCredentials: END");
    }

    // ========================================================
    // == NOUVELLES FONCTIONS POUR LES ÉTAPES D'EXPLOITATION ==
    // ========================================================

    /**
     * Affiche la liste des étapes d'exploitation pour un hôte donné dans le panneau.
     * @param {string} hostId L'ID de l'hôte (IP/Nom).
     */
    function renderExploitationSteps(hostId) {
        console.log(`>>> renderExploitationSteps: START for host ${hostId}`);
        if (!exploitationStepsListDiv || !noExploitationStepsMsg) {
            console.error("renderExploitationSteps: Steps list container or no-steps message element not found.");
            return;
        }

        const hostInfo = findHostById(hostId);
        // Assurer que hostInfo.host.exploitationSteps est un tableau
        const steps = hostInfo?.host?.exploitationSteps || [];
        if (!Array.isArray(steps)) {
            console.warn(`Exploitation steps for host ${hostId} is not an array, initializing.`);
            if (hostInfo && hostInfo.host) {
                hostInfo.host.exploitationSteps = [];
            } else {
                console.error("Cannot initialize exploitation steps array as host object is missing.");
                return;
            }
        }

        exploitationStepsListDiv.innerHTML = ''; // Vider la liste
        noExploitationStepsMsg.style.display = 'none'; // Cacher le message par défaut

        if (steps.length === 0) {
            console.log("No exploitation steps to render.");
            exploitationStepsListDiv.appendChild(noExploitationStepsMsg); // Remettre le message
            noExploitationStepsMsg.style.display = 'block'; // Afficher le message
            return;
        }

        console.log(`Rendering ${steps.length} exploitation steps.`);

        // Trier les étapes par leur propriété 'order'
        const sortedSteps = [...steps].sort((a, b) => (a.order || 0) - (b.order || 0));

        sortedSteps.forEach((step, index) => {
            const stepElement = document.createElement('div');
            stepElement.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center exploitation-step-item';
            stepElement.dataset.stepId = step.id;

            const stepContent = document.createElement('span');
            stepContent.innerHTML = `
                <span class="step-order mr-2 text-muted small">#${step.order || '?'}</span>
                <strong class="step-title">${sanitizeInput(step.title) || 'Étape sans titre'}</strong>
                ${step.screenshotUrl ? '<i class="icon-screenshot text-info ml-2" title="Capture d\'écran associée">📷</i>' : ''}
            `;
            stepContent.style.cursor = 'pointer'; // Indiquer qu'on peut cliquer
            stepContent.addEventListener('click', () => openExploitationStepModal(hostId, step.id)); // Ouvrir la modale au clic

            const stepActions = document.createElement('div');
            stepActions.className = 'step-actions';

            // Boutons pour réordonner (simplifié : échange l'ordre avec le précédent/suivant)
            const moveUpBtn = document.createElement('button');
            moveUpBtn.className = 'btn btn-outline-secondary btn-sm mr-1 move-step-btn';
            moveUpBtn.innerHTML = '↑';
            moveUpBtn.title = 'Monter';
            moveUpBtn.disabled = index === 0; // Désactiver si c'est le premier
            moveUpBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Empêcher l'ouverture de la modale
                handleMoveStep(hostId, step.id, 'up');
            });

            const moveDownBtn = document.createElement('button');
            moveDownBtn.className = 'btn btn-outline-secondary btn-sm mr-1 move-step-btn';
            moveDownBtn.innerHTML = '↓';
            moveDownBtn.title = 'Descendre';
            moveDownBtn.disabled = index === sortedSteps.length - 1; // Désactiver si c'est le dernier
            moveDownBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Empêcher l'ouverture de la modale
                handleMoveStep(hostId, step.id, 'down');
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-outline-danger btn-sm delete-step-btn';
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.title = 'Supprimer cette étape';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Empêcher l'ouverture de la modale
                handleDeleteExploitationStep(hostId, step.id);
            });

            stepActions.appendChild(moveUpBtn);
            stepActions.appendChild(moveDownBtn);
            stepActions.appendChild(deleteBtn);

            stepElement.appendChild(stepContent);
            stepElement.appendChild(stepActions);
            exploitationStepsListDiv.appendChild(stepElement);
        });

        console.log(">>> renderExploitationSteps: END");
    }

    /**
     * Ouvre la modale pour ajouter ou éditer une étape d'exploitation.
     * @param {string} hostId L'ID de l'hôte.
     * @param {string|null} stepId L'ID de l'étape à éditer, ou null pour une nouvelle étape.
     */
    function openExploitationStepModal(hostId, stepId = null) {
        console.log(`>>> openExploitationStepModal: host=${hostId}, step=${stepId}`);
        const hostInfo = findHostById(hostId);
        if (!hostInfo || !hostInfo.host) {
            console.error("Cannot open step modal: host not found or host data invalid.");
            return;
        }
        // Assurer l'existence du tableau
        hostInfo.host.exploitationSteps = hostInfo.host.exploitationSteps || [];

        exploitationStepDetailForm.reset(); // Réinitialiser le formulaire
        stepDetailModalScreenshotPreview.innerHTML = ''; // Vider l'aperçu

        if (stepId) {
            // Mode Édition
            const step = hostInfo.host.exploitationSteps.find(s => s.id === stepId);
            if (!step) {
                console.error(`Step with ID ${stepId} not found for host ${hostId}.`);
                alert("Erreur : Étape introuvable.");
                return;
            }
            document.getElementById('exploitationStepDetailModalLabel').textContent = "Modifier l'Étape";
            stepDetailModalStepId.value = step.id;
            stepDetailModalOrder.value = step.order || 1;
            stepDetailModalTitle.value = step.title || '';
            stepDetailModalContent.value = step.content || '';
            stepDetailModalScreenshotUrl.value = step.screenshotUrl || '';
            updateScreenshotPreview(step.screenshotUrl || ''); // Mettre à jour l'aperçu
        } else {
            // Mode Ajout
            document.getElementById('exploitationStepDetailModalLabel').textContent = "Ajouter une Nouvelle Étape";
            stepDetailModalStepId.value = ''; // Pas d'ID existant
            // Calculer le prochain numéro d'ordre
            const maxOrder = hostInfo.host.exploitationSteps.reduce((max, s) => Math.max(max, s.order || 0), 0);
            stepDetailModalOrder.value = maxOrder + 1;
            // Les autres champs sont vides par défaut grâce au reset()
        }

        // Afficher la modale (nécessite Bootstrap JS ou une gestion manuelle)
        $('#exploitationStepDetailModal').modal('show');
    }

    /**
     * Gère le clic sur le bouton "Ajouter une Étape".
     */
    function handleAddExploitationStep() {
        const hostId = document.getElementById('editHostId').value;
        if (!hostId) {
            console.error("Cannot add step: No host ID found in edit panel.");
            alert("Erreur : Impossible d'ajouter une étape sans hôte sélectionné.");
            return;
        }
        openExploitationStepModal(hostId, null); // Ouvre la modale en mode ajout
    }

    /**
     * Gère la sauvegarde des détails d'une étape depuis la modale.
     */
    function handleSaveExploitationStep() {
        const hostId = document.getElementById('editHostId').value;
        const stepId = stepDetailModalStepId.value;
        const order = parseInt(stepDetailModalOrder.value, 10);
        const title = stepDetailModalTitle.value.trim();
        const content = stepDetailModalContent.value.trim();
        const screenshotUrl = stepDetailModalScreenshotUrl.value.trim();

        if (!hostId) {
            console.error("Cannot save step: No host ID.");
            return;
        }
        if (isNaN(order) || order < 1) {
            alert("Veuillez entrer un numéro d'ordre valide (entier positif).");
            return;
        }
         if (!title) {
            alert("Veuillez entrer un titre pour l'étape.");
            return;
        }


        const hostInfo = findHostById(hostId);
        if (!hostInfo || !hostInfo.host) {
            console.error("Cannot save step: Host not found or data invalid.");
            return;
        }
        hostInfo.host.exploitationSteps = hostInfo.host.exploitationSteps || [];

        const newStepData = {
            id: stepId || generateUUID(), // Générer un nouvel ID si ajout
            order: order,
            title: title,
            content: content,
            screenshotUrl: screenshotUrl
        };

        if (stepId) {
            // Mise à jour
            const stepIndex = hostInfo.host.exploitationSteps.findIndex(s => s.id === stepId);
            if (stepIndex > -1) {
                hostInfo.host.exploitationSteps[stepIndex] = newStepData;
                console.log(`Step ${stepId} updated for host ${hostId}.`);
            } else {
                console.error(`Step ${stepId} not found for update.`);
                return; // Ne rien faire si l'étape n'est pas trouvée
            }
        } else {
            // Ajout
            hostInfo.host.exploitationSteps.push(newStepData);
            console.log(`New step added for host ${hostId}.`);
        }

        saveData(); // Sauvegarder toutes les données
        renderExploitationSteps(hostId); // Re-rendre la liste des étapes

        // Fermer la modale (nécessite Bootstrap JS ou gestion manuelle)
        $('#exploitationStepDetailModal').modal('hide');
    }

    /**
     * Gère la suppression d'une étape d'exploitation.
     * @param {string} hostId L'ID de l'hôte.
     * @param {string} stepId L'ID de l'étape à supprimer.
     */
    function handleDeleteExploitationStep(hostId, stepId) {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cette étape d'exploitation ?")) {
            return;
        }

        const hostInfo = findHostById(hostId);
        if (!hostInfo || !hostInfo.host || !hostInfo.host.exploitationSteps) {
            console.error("Cannot delete step: Host or steps data not found.");
            return;
        }

        const initialLength = hostInfo.host.exploitationSteps.length;
        hostInfo.host.exploitationSteps = hostInfo.host.exploitationSteps.filter(s => s.id !== stepId);

        if (hostInfo.host.exploitationSteps.length < initialLength) {
            console.log(`Step ${stepId} deleted for host ${hostId}.`);
            saveData();
            renderExploitationSteps(hostId);
        } else {
            console.warn(`Step ${stepId} not found for deletion.`);
        }
    }

    /**
     * Gère le déplacement d'une étape vers le haut ou le bas dans la liste.
     * Simplifié : échange les numéros d'ordre avec l'étape adjacente dans la liste triée.
     * @param {string} hostId L'ID de l'hôte.
     * @param {string} stepId L'ID de l'étape à déplacer.
     * @param {'up' | 'down'} direction La direction du déplacement.
     */
    function handleMoveStep(hostId, stepId, direction) {
        const hostInfo = findHostById(hostId);
        if (!hostInfo || !hostInfo.host || !hostInfo.host.exploitationSteps) return;

        const steps = hostInfo.host.exploitationSteps;
        // Travailler sur une copie triée pour trouver les voisins
        const sortedSteps = [...steps].sort((a, b) => (a.order || 0) - (b.order || 0));
        const currentIndex = sortedSteps.findIndex(s => s.id === stepId);

        if (currentIndex === -1) return; // Étape non trouvée

        let swapIndex = -1;
        if (direction === 'up' && currentIndex > 0) {
            swapIndex = currentIndex - 1;
        } else if (direction === 'down' && currentIndex < sortedSteps.length - 1) {
            swapIndex = currentIndex + 1;
        }

        if (swapIndex !== -1) {
            // Trouver les étapes originales dans le tableau non trié
            const stepToMove = steps.find(s => s.id === sortedSteps[currentIndex].id);
            const stepToSwapWith = steps.find(s => s.id === sortedSteps[swapIndex].id);

            if (stepToMove && stepToSwapWith) {
                // Échanger leurs numéros d'ordre
                const tempOrder = stepToMove.order;
                stepToMove.order = stepToSwapWith.order;
                stepToSwapWith.order = tempOrder;

                console.log(`Swapped order between step ${stepToMove.id} and ${stepToSwapWith.id}`);
                saveData();
                renderExploitationSteps(hostId); // Re-rendre pour refléter le nouvel ordre
            }
        }
    }


    /**
     * Met à jour l'aperçu de la capture d'écran dans la modale.
     * @param {string} url L'URL de l'image.
     */
    function updateScreenshotPreview(url) {
        stepDetailModalScreenshotPreview.innerHTML = ''; // Vider
        if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/'))) {
            // Tenter d'afficher l'image si c'est une URL web ou un chemin absolu local
            // Note: Les chemins relatifs simples peuvent ne pas fonctionner comme prévu ici.
            // Note 2: L'accès aux fichiers locaux (file:///) est restreint par les navigateurs.
            const img = document.createElement('img');
            img.src = url;
            img.style.maxWidth = '100%';
            img.style.maxHeight = '180px'; // Limiter la hauteur dans l'aperçu
            img.alt = 'Aperçu capture d\'écran';
            img.onerror = () => { // Gérer l'erreur si l'image ne charge pas
                 stepDetailModalScreenshotPreview.innerHTML = '<p class="text-danger small">Impossible de charger l\'aperçu de l\'image.</p>';
            };
            stepDetailModalScreenshotPreview.appendChild(img);
        } else if (url) {
             stepDetailModalScreenshotPreview.innerHTML = '<p class="text-muted small">Aperçu non disponible pour ce chemin.</p>';
        }
    }

    // --- Initialisation ---
    document.addEventListener('DOMContentLoaded', () => {
        console.log("Host Manager V2 Initializing...");
        loadData();
        initializeNetwork();
        renderAll(); // Ceci inclut maintenant le rendu initial des catégories, etc.
        initializeEventListeners(); // Appel de la fonction principale d'initialisation des écouteurs
        updateCategoryFilterOptions(); // Mettre à jour les options de filtre au démarrage
        console.log("Host Manager V2 Ready.");
    });

    // --- Initialisation et Écouteurs d'Événements ---

    function initializeEventListeners() {
        // ... (écouteurs existants pour addCategoryBtn, applyFiltersBtn, etc.)

        // Écouteurs pour le panneau d'édition
        if (editPanel) {
            // ... (écouteurs existants pour closePanelBtn, toggleWidePanelBtn, editHostForm submit, etc.)
            if (addExploitationStepBtn) {
                addExploitationStepBtn.addEventListener('click', handleAddExploitationStep);
            }
        }

        // Écouteurs pour la modale des détails de l'étape
        if (saveExploitationStepBtn) {
            saveExploitationStepBtn.addEventListener('click', handleSaveExploitationStep);
        }
        // Mettre à jour l'aperçu quand l'URL change dans la modale
         if (stepDetailModalScreenshotUrl) {
            stepDetailModalScreenshotUrl.addEventListener('input', () => {
                updateScreenshotPreview(stepDetailModalScreenshotUrl.value);
            });
        }
         // Fermeture de la modale Bootstrap (si Bootstrap JS est utilisé)
         $('#exploitationStepDetailModal').on('hidden.bs.modal', function () {
             // Optionnel: faire quelque chose à la fermeture, comme vider explicitement
             exploitationStepDetailForm.reset();
             stepDetailModalScreenshotPreview.innerHTML = '';
         });


        // ... (autres écouteurs existants pour export, import, delete all, etc.)
    }

}); // Fin du DOMContentLoaded