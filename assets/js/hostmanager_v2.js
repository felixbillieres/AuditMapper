document.addEventListener('DOMContentLoaded', function() {
    // --- Références DOM ---
    const categoryTabsContainer = document.getElementById('categoryTabs');
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const categoryContentContainer = document.getElementById('categoryContentContainer');
    const networkMapDiv = document.getElementById('network-map');
    const allUsernamesPre = document.getElementById('allUsernames');
    const allPasswordsPre = document.getElementById('allPasswords');
    const allHashesPre = document.getElementById('allHashes');
    const filterCategorySelect = document.getElementById('filterCategory');
    const filterTagInput = document.getElementById('filterTag');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    const exportSessionBtn = document.getElementById('exportSessionBtn');
    const importSessionInput = document.getElementById('importSessionInput');
    const removeAllDataBtn = document.getElementById('removeAllDataBtn');
    const editPanel = document.getElementById('editPanel');
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
    const generateKillchainBtn = document.getElementById('generateKillchainBtn');
    const killchainReportPreview = document.getElementById('killchainReportPreview');
    const killchainReportRenderedPreview = document.getElementById('killchainReportRenderedPreview');
    const exportKillchainBtn = document.getElementById('exportKillchainBtn');
    const showPreviewTab = document.getElementById('showPreviewTab');
    const showEditorTab = document.getElementById('showEditorTab');

    const STORAGE_KEY = 'pentestHostData_v2';
    let hostData = {
        categories: {}, // { "categoryName": { hosts: { "hostId": { ... } } } }
        edges: []       // { from: "hostId1", to: "hostId2", label: "..." }
    };
    let activeCategory = null;
    let network = null; // Instance Vis.js

    // Vérification rapide que les éléments existent au chargement
    if (!killchainReportPreview || !killchainReportRenderedPreview || !showPreviewTab || !showEditorTab) {
        console.error("ERREUR: Un ou plusieurs éléments DOM pour l'aperçu Markdown sont introuvables ! Vérifiez les IDs dans hostmanager.html.");
        // On pourrait vouloir arrêter l'initialisation ici ou désactiver la fonctionnalité
    }

    // --- Fonctions de Gestion des Données ---

    function loadData() {
        const storedData = localStorage.getItem(STORAGE_KEY);
        if (storedData) {
            try {
                hostData = JSON.parse(storedData);
                // Assurer que la structure de base existe si le storage est corrompu ou ancien
                if (!hostData.categories) hostData.categories = {};
                if (!hostData.edges) hostData.edges = [];
            } catch (e) {
                console.error("Erreur lors du chargement des données depuis localStorage:", e);
                // Initialiser avec une structure vide en cas d'erreur
                hostData = { categories: {}, edges: [] };
                alert("Erreur lors du chargement des données. Les données pourraient être corrompues. Initialisation à vide.");
            }
        }
        // S'il n'y a pas de catégories, en créer une par défaut
        if (Object.keys(hostData.categories).length === 0) {
            addCategory("Default"); // Ajoute une catégorie par défaut si vide
        }
        // Définir la première catégorie comme active
        activeCategory = Object.keys(hostData.categories)[0];
    }

    function saveData() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(hostData));
        } catch (e) {
            console.error("Erreur lors de la sauvegarde des données dans localStorage:", e);
            alert("Erreur lors de la sauvegarde des données. Vérifiez l'espace disponible dans le localStorage.");
        }
    }

    function getHostById(hostId) {
        for (const categoryName in hostData.categories) {
            if (hostData.categories[categoryName].hosts && hostData.categories[categoryName].hosts[hostId]) {
                return { host: hostData.categories[categoryName].hosts[hostId], category: categoryName };
            }
        }
        return null; // Hôte non trouvé
    }

    function sanitizeInput(str) {
        // Simple sanitization, might need more robust solution depending on usage
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    }

    // --- Fonctions Utilitaires ---

    // Nouvelle fonction pour obtenir la date actuelle formatée (REMISE EN PLACE)
    function getCurrentDateFormatted() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Mise à jour pour échapper le Markdown dans les cellules de tableau si nécessaire (REMISE EN PLACE)
    function sanitizeForMarkdownTable(str) {
        if (!str) return '';
        // Échapper les barres verticales (|) qui cassent les tableaux Markdown
        // Remplacer aussi les sauts de ligne par <br> pour l'affichage HTML dans les cellules
        return sanitizeInput(str).replace(/\|/g, '\\|').replace(/\n/g, '<br>');
    }

    // Nouvelle fonction utilitaire pour formater les credentials pour le Markdown (REMISE EN PLACE)
    function formatCredentialsForMarkdown(credentials) {
        if (!credentials || credentials.length === 0) {
            return '(aucun)';
        }
        return credentials.map(cred => {
            let parts = [];
            // Utiliser sanitizeInput pour les valeurs avant de les mettre dans les backticks
            if (cred.username) parts.push(`User: \`${sanitizeInput(cred.username)}\``);
            if (cred.password) parts.push(`Pass: \`${sanitizeInput(cred.password)}\``);
            if (cred.hash) parts.push(`Hash: \`${sanitizeInput(cred.hash)}\``);
            return parts.join(', ');
        }).join('<br>'); // Utiliser <br> pour les sauts de ligne dans les cellules de tableau Markdown rendu en HTML
    }

    // --- Fonctions de Rendu ---

    function renderAll() {
        renderCategoryTabs();
        renderActiveCategoryContent();
        renderNetworkMap();
        renderAggregatedData(); // Initial render without filters
        populateFilterDropdowns();
    }

    function renderCategoryTabs() {
        categoryTabsContainer.innerHTML = ''; // Vider les onglets existants
        Object.keys(hostData.categories).sort().forEach(categoryName => {
            const tab = document.createElement('button');
            tab.className = `category-tab ${categoryName === activeCategory ? 'active' : ''}`;
            tab.textContent = categoryName;
            tab.dataset.category = categoryName;
            tab.addEventListener('click', () => switchCategory(categoryName));

             // Ajouter un bouton de suppression (sauf pour "Default" ?)
             if (categoryName !== "Default" || Object.keys(hostData.categories).length > 1) { // Empêche la suppression de la seule catégorie
                const deleteBtn = document.createElement('span');
                deleteBtn.textContent = ' 🗑️';
                deleteBtn.style.fontSize = '10px';
                deleteBtn.style.cursor = 'pointer';
                deleteBtn.style.marginLeft = '5px';
                deleteBtn.title = `Supprimer la catégorie "${categoryName}"`;
                deleteBtn.onclick = (e) => {
                    e.stopPropagation(); // Empêche le clic de déclencher le switchCategory
                    handleRemoveCategory(categoryName);
                };
                tab.appendChild(deleteBtn);
            }

            categoryTabsContainer.appendChild(tab);
        });
        // Replacer le bouton "+" à la fin
        categoryTabsContainer.appendChild(addCategoryBtn);
    }

    function renderActiveCategoryContent() {
        categoryContentContainer.innerHTML = ''; // Vider le contenu précédent
        if (!activeCategory || !hostData.categories[activeCategory]) {
            categoryContentContainer.innerHTML = '<p>Sélectionnez ou créez une catégorie.</p>';
            return;
        }

        const categoryData = hostData.categories[activeCategory];
        const contentDiv = document.createElement('div');
        contentDiv.className = 'category-content active'; // Rendre visible

        // 1. Formulaire d'ajout d'hôte pour cette catégorie
        contentDiv.innerHTML += `
            <div class="form-section add-host-section">
                <h2>Ajouter un Hôte à "${sanitizeInput(activeCategory)}"</h2>
                <form id="addHostForm-${activeCategory}">
                    <div class="form-group inline-form">
                        <input type="text" name="ipName" placeholder="IP / Nom Hôte *" required style="flex-grow: 2;">
                        <input type="text" name="services" placeholder="Services (Ex: SMB 445, HTTP 80)" style="flex-grow: 1;">
                        <input type="text" name="tags" placeholder="Tags (Ex: interne, web)" style="flex-grow: 1;">
                        <button type="submit" class="action-button">Ajouter</button>
                    </div>
                     <div class="form-group">
                         <textarea name="notes" placeholder="Notes..." style="width:100%; min-height: 40px; margin-top: 10px;"></textarea>
                     </div>
                     <!-- Zone pour ajouter des credentials directement si besoin -->
                </form>
            </div>
        `;

        // 2. Liste des hôtes pour cette catégorie
        const hostListDiv = document.createElement('div');
        hostListDiv.className = 'host-list-section';
        hostListDiv.innerHTML = `<h2>Hôtes dans "${sanitizeInput(activeCategory)}"</h2>`;
        const listContainer = document.createElement('div');
        listContainer.className = 'host-list'; // Utiliser la classe existante pour le style grid

        if (categoryData.hosts && Object.keys(categoryData.hosts).length > 0) {
            Object.entries(categoryData.hosts).sort().forEach(([hostId, host]) => {
                listContainer.innerHTML += renderHostSummary(hostId, host, activeCategory);
            });
        } else {
            listContainer.innerHTML = '<p>Aucun hôte dans cette catégorie.</p>';
        }
        hostListDiv.appendChild(listContainer);
        contentDiv.appendChild(hostListDiv);

        categoryContentContainer.appendChild(contentDiv);

        // Attacher l'écouteur au formulaire d'ajout spécifique à la catégorie
        const addHostForm = document.getElementById(`addHostForm-${activeCategory}`);
        if (addHostForm) {
            addHostForm.addEventListener('submit', handleAddHost);
        }

        // Attacher les écouteurs pour les boutons Edit/Delete sur la liste
         attachHostListActionListeners(listContainer);
    }

     function attachHostListActionListeners(container) {
        container.querySelectorAll('.edit-host-summary-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const hostId = e.target.closest('.host-summary-entry').dataset.hostId;
                const category = e.target.closest('.host-summary-entry').dataset.category;
                openEditPanel(hostId, category);
            });
        });
        container.querySelectorAll('.delete-host-summary-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                 const hostId = e.target.closest('.host-summary-entry').dataset.hostId;
                 const category = e.target.closest('.host-summary-entry').dataset.category;
                 handleRemoveHost(hostId, category);
            });
        });
    }

    function renderHostSummary(hostId, host, categoryName) {
        // Version simplifiée pour la liste, le détail est dans le panneau
        const tagsString = host.tags ? host.tags.join(', ') : 'Aucun';
        const servicesString = host.services || 'Non spécifiés';
        const credentialCount = host.credentials ? host.credentials.length : 0;

        return `
            <div class="host-summary-entry" data-host-id="${sanitizeInput(hostId)}" data-category="${sanitizeInput(categoryName)}" style="border: 1px solid #eee; padding: 10px; margin-bottom: 10px; border-radius: 4px; background: #fff;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <h4 style="margin: 0;">${sanitizeInput(hostId)}</h4>
                    <div>
                        <button class="edit-host-summary-btn action-button" style="font-size: 12px; padding: 3px 8px; margin-right: 5px;">Éditer</button>
                        <button class="delete-host-summary-btn action-button danger-button" style="font-size: 12px; padding: 3px 8px;">Supprimer</button>
                    </div>
                </div>
                <p style="font-size: 0.9em; margin: 2px 0;"><strong>Services:</strong> ${sanitizeInput(servicesString)}</p>
                <p style="font-size: 0.9em; margin: 2px 0;"><strong>Tags:</strong> ${sanitizeInput(tagsString)}</p>
                <p style="font-size: 0.9em; margin: 2px 0;"><strong>Credentials:</strong> ${credentialCount}</p>
                <p style="font-size: 0.9em; margin: 2px 0;"><strong>Notes:</strong> ${host.notes ? sanitizeInput(host.notes.substring(0, 50)) + '...' : 'Aucune'}</p>
            </div>
        `;
         // Note: Ajouter des styles CSS pour .host-summary-entry et ses boutons si nécessaire
    }


    function renderNetworkMap() {
        const nodes = [];
        const edges = hostData.edges || []; // Utiliser les edges stockées

        Object.entries(hostData.categories).forEach(([categoryName, categoryData]) => {
            if (categoryData.hosts) {
                Object.entries(categoryData.hosts).forEach(([hostId, host]) => {
                    // Créer un titre (tooltip) pour le node
                    let title = `<b>${sanitizeInput(hostId)}</b> (${sanitizeInput(categoryName)})<br>`;
                    if (host.services) title += `Services: ${sanitizeInput(host.services)}<br>`;
                    if (host.tags && host.tags.length > 0) title += `Tags: ${sanitizeInput(host.tags.join(', '))}<br>`;
                    if (host.notes) title += `Notes: ${sanitizeInput(host.notes.substring(0, 100))}...<br>`;
                    if (host.credentials && host.credentials.length > 0) title += `Credentials: ${host.credentials.length}`;

                    nodes.push({
                        id: hostId,
                        label: hostId, // Afficher l'ID/Nom sur le node
                        title: title,  // Tooltip HTML
                        group: categoryName // Pour potentiellement colorer par catégorie
                    });
                });
            }
        });

        const container = networkMapDiv;
        const data = { nodes: new vis.DataSet(nodes), edges: new vis.DataSet(edges) };
        const options = {
            nodes: {
                shape: 'dot',
                size: 16,
                font: { size: 12, color: '#333' }, // Ajuster la couleur pour le thème sombre si nécessaire
                borderWidth: 2
            },
            edges: {
                width: 2,
                arrows: 'to' // Afficher des flèches
            },
            physics: {
                forceAtlas2Based: {
                    gravitationalConstant: -26,
                    centralGravity: 0.005,
                    springLength: 230,
                    springConstant: 0.18
                },
                maxVelocity: 146,
                solver: 'forceAtlas2Based',
                timestep: 0.35,
                stabilization: { iterations: 150 }
            },
            interaction: {
                tooltipDelay: 200,
                hideEdgesOnDrag: true
            },
             groups: { // Optionnel: définir des couleurs par catégorie
                // "Externe": { color: { background:'red', border:'maroon' } },
                // "Interne": { color: { background:'lime', border:'green' } },
                // "DMZ": { color: { background:'orange', border:'darkorange' } }
             }
        };

        // Appliquer les couleurs de police pour le thème sombre
        if (document.body.classList.contains('dark-theme')) {
            options.nodes.font.color = '#e0e0e0';
            // Ajuster d'autres couleurs si nécessaire
        }


        if (network) {
            network.setData(data); // Mettre à jour les données si la map existe déjà
        } else {
            network = new vis.Network(container, data, options);

            // Écouteur pour ouvrir le panneau d'édition au clic sur un node
            network.on("click", function (params) {
                if (params.nodes.length > 0) {
                    const nodeId = params.nodes[0];
                    const hostInfo = getHostById(nodeId);
                    if (hostInfo) {
                        openEditPanel(nodeId, hostInfo.category);
                    }
                } else {
                    closeEditPanel(); // Fermer le panneau si on clique en dehors d'un node
                }
            });
        }
    }

    function renderAggregatedData(filterCategory = 'all', filterTag = '') {
        let allUsers = [];
        let allPass = [];
        let allHash = [];

        Object.entries(hostData.categories).forEach(([categoryName, categoryData]) => {
            // Appliquer le filtre de catégorie
            if (filterCategory !== 'all' && categoryName !== filterCategory) {
                return; // Passer cette catégorie si elle ne correspond pas au filtre
            }

            if (categoryData.hosts) {
                Object.values(categoryData.hosts).forEach(host => {
                    // Appliquer le filtre de tag
                    const hostTags = host.tags || [];
                    if (filterTag && !hostTags.some(tag => tag.toLowerCase().includes(filterTag.toLowerCase()))) {
                        return; // Passer cet hôte s'il ne correspond pas au filtre de tag
                    }

                    // Ajouter les credentials si l'hôte passe les filtres
                    if (host.credentials) {
                        host.credentials.forEach(cred => {
                            if (cred.username) allUsers.push(cred.username);
                            if (cred.password) allPass.push(cred.password);
                            if (cred.hash) allHash.push(cred.hash);
                        });
                    }
                });
            }
        });

        // Rendre unique et trier
        allUsernamesPre.textContent = [...new Set(allUsers)].sort().join('\n') || 'Aucun nom d\'utilisateur trouvé.';
        allPasswordsPre.textContent = [...new Set(allPass)].sort().join('\n') || 'Aucun mot de passe trouvé.';
        allHashesPre.textContent = [...new Set(allHash)].sort().join('\n') || 'Aucun hash trouvé.';
    }

    function populateFilterDropdowns() {
        // Catégories
        const currentCategoryFilter = filterCategorySelect.value;
        filterCategorySelect.innerHTML = '<option value="all">Toutes</option>'; // Reset
        Object.keys(hostData.categories).sort().forEach(categoryName => {
            const option = document.createElement('option');
            option.value = categoryName;
            option.textContent = categoryName;
            filterCategorySelect.appendChild(option);
        });
        filterCategorySelect.value = currentCategoryFilter; // Restaurer la sélection si possible

        // Tags (pourrait être amélioré avec une liste dynamique des tags existants)
        // Pour l'instant, on garde l'input texte simple.
    }


    // --- Fonctions de Gestion des Catégories ---

    function addCategory(name) {
        const categoryName = name || prompt("Entrez le nom de la nouvelle catégorie:");
        if (categoryName && !hostData.categories[categoryName]) {
            hostData.categories[categoryName] = { hosts: {} };
            activeCategory = categoryName; // Rendre la nouvelle catégorie active
            saveData();
            renderAll(); // Mettre à jour tout l'affichage
        } else if (categoryName) {
            alert("Cette catégorie existe déjà.");
        }
    }

    function switchCategory(categoryName) {
        if (hostData.categories[categoryName]) {
            activeCategory = categoryName;
            renderCategoryTabs(); // Mettre à jour l'état actif des onglets
            renderActiveCategoryContent(); // Afficher le contenu de la nouvelle catégorie active
            // Pas besoin de re-render toute la map ou les données agrégées juste pour changer d'onglet
        }
    }

     function handleRemoveCategory(categoryName) {
        if (!hostData.categories[categoryName]) return;

        const hostCount = Object.keys(hostData.categories[categoryName].hosts || {}).length;
        let confirmationText = `Êtes-vous sûr de vouloir supprimer la catégorie "${categoryName}"`;
        if (hostCount > 0) {
             confirmationText += ` et ses ${hostCount} hôte(s) ? Cette action est irréversible.`;
        } else {
             confirmationText += ` ?`;
        }

        if (confirm(confirmationText)) {
            // Supprimer les edges liés aux hôtes de cette catégorie
            const hostsInCategory = Object.keys(hostData.categories[categoryName].hosts || {});
            hostData.edges = hostData.edges.filter(edge =>
                !hostsInCategory.includes(edge.from) && !hostsInCategory.includes(edge.to)
            );

            // Supprimer la catégorie
            delete hostData.categories[categoryName];

            // Si la catégorie active a été supprimée, choisir une autre catégorie active
            if (activeCategory === categoryName) {
                const remainingCategories = Object.keys(hostData.categories);
                activeCategory = remainingCategories.length > 0 ? remainingCategories[0] : null;
            }

            // S'il ne reste plus de catégorie, en créer une par défaut
             if (Object.keys(hostData.categories).length === 0) {
                addCategory("Default"); // Recrée la catégorie par défaut
             } else {
                saveData();
                renderAll(); // Mettre à jour l'affichage
             }
        }
    }


    // --- Fonctions de Gestion des Hôtes ---

    function handleAddHost(event) {
        event.preventDefault();
        const form = event.target;
        const ipName = form.elements['ipName'].value.trim();
        const services = form.elements['services'].value.trim();
        const tags = form.elements['tags'].value.trim().split(',').map(t => t.trim()).filter(Boolean);
        const notes = form.elements['notes'].value.trim();
        const category = activeCategory; // Ajouter à la catégorie active

        if (!ipName) {
            alert("L'adresse IP ou le nom de l'hôte est requis.");
            return;
        }

        // Vérifier si l'hôte existe déjà (dans n'importe quelle catégorie)
        if (getHostById(ipName)) {
             alert(`L'hôte "${ipName}" existe déjà.`);
             return;
        }

        if (category && hostData.categories[category]) {
            if (!hostData.categories[category].hosts) {
                hostData.categories[category].hosts = {};
            }
            hostData.categories[category].hosts[ipName] = {
                services: services,
                notes: notes,
                credentials: [], // Initialiser avec un tableau vide
                tags: tags
            };
            saveData();
            renderActiveCategoryContent(); // Mettre à jour la liste de la catégorie
            renderNetworkMap(); // Mettre à jour la carte
            renderAggregatedData(); // Mettre à jour les données agrégées
            populateFilterDropdowns(); // Mettre à jour les filtres
            form.reset(); // Vider le formulaire
        } else {
            alert("Erreur : Catégorie active non valide.");
        }
    }

    function handleRemoveHost(hostId, categoryName) {
        if (!hostId || !categoryName || !hostData.categories[categoryName] || !hostData.categories[categoryName].hosts[hostId]) {
             console.error("Tentative de suppression d'hôte invalide:", hostId, categoryName);
             return;
        }

        if (confirm(`Êtes-vous sûr de vouloir supprimer l'hôte "${hostId}" de la catégorie "${categoryName}" ?`)) {
            // Supprimer l'hôte
            delete hostData.categories[categoryName].hosts[hostId];

            // Supprimer les edges connectés à cet hôte
            hostData.edges = hostData.edges.filter(edge => edge.from !== hostId && edge.to !== hostId);

            saveData();
            renderActiveCategoryContent(); // Mettre à jour la liste
            renderNetworkMap(); // Mettre à jour la carte
            renderAggregatedData(); // Mettre à jour les données agrégées
            closeEditPanel(); // Fermer le panneau si l'hôte supprimé y était affiché
        }
    }

    // --- Fonctions du Panneau d'Édition ---

    function openEditPanel(hostId, categoryName) {
        const hostInfo = getHostById(hostId);
        if (!hostInfo) return;

        const host = hostInfo.host;

        // Remplir les champs du formulaire
        editHostIdInput.value = hostId;
        editHostCategoryInput.value = categoryName;
        editHostIpNameInput.value = hostId; // L'ID est l'IP/Nom ici
        editHostServicesInput.value = host.services || '';
        editHostNotesTextarea.value = host.notes || '';
        editHostTagsInput.value = host.tags ? host.tags.join(', ') : '';

        // Remplir les credentials
        editCredentialsContainer.innerHTML = ''; // Vider les anciens
        if (host.credentials && host.credentials.length > 0) {
            host.credentials.forEach((cred, index) => {
                addCredentialInputs(cred.username, cred.password, cred.hash, index);
            });
        } else {
             addCredentialInputs('', '', '', 0); // Ajouter une ligne vide si pas de creds
        }

        // Remplir les connexions existantes
        renderExistingEdges(hostId);


        // Afficher le panneau
        editPanel.classList.add('visible');
    }

    function closeEditPanel() {
        editPanel.classList.remove('visible');
        // Optionnel: Réinitialiser le formulaire d'édition
        // editHostForm.reset();
        // editCredentialsContainer.innerHTML = '';
        // existingEdgesListDiv.innerHTML = '';
    }

    function addCredentialInputs(username = '', password = '', hash = '', index) {
        const div = document.createElement('div');
        div.className = 'credential-group';
        div.dataset.index = index; // Pour identifier la ligne
        div.innerHTML = `
            <button type="button" class="remove-credential-btn" title="Supprimer ce credential">&times;</button>
            <div class="form-group">
                <label>Username:</label>
                <input type="text" class="edit-cred-username" value="${sanitizeInput(username)}">
            </div>
            <div class="form-group">
                <label>Password:</label>
                <input type="text" class="edit-cred-password" value="${sanitizeInput(password)}">
            </div>
            <div class="form-group">
                <label>Hash:</label>
                <input type="text" class="edit-cred-hash" value="${sanitizeInput(hash)}">
            </div>
        `;
        // Ajouter l'écouteur pour le bouton de suppression de cette ligne
        div.querySelector('.remove-credential-btn').addEventListener('click', (e) => {
            e.target.closest('.credential-group').remove();
            // Réindexer après suppression si nécessaire (ou gérer lors de la sauvegarde)
        });
        editCredentialsContainer.appendChild(div);
    }

    function handleSaveHostFromPanel(event) {
        event.preventDefault();
        const hostId = editHostIdInput.value;
        const originalCategory = editHostCategoryInput.value;
        const newIpName = editHostIpNameInput.value.trim(); // Nouveau nom/IP potentiel
        const services = editHostServicesInput.value.trim();
        const notes = editHostNotesTextarea.value.trim();
        const tags = editHostTagsInput.value.trim().split(',').map(t => t.trim()).filter(Boolean);

        if (!newIpName) {
            alert("L'IP ou le nom ne peut pas être vide.");
            return;
        }

        // Récupérer les credentials depuis le panneau
        const credentials = [];
        editCredentialsContainer.querySelectorAll('.credential-group').forEach(group => {
            const username = group.querySelector('.edit-cred-username').value.trim();
            const password = group.querySelector('.edit-cred-password').value.trim();
            const hash = group.querySelector('.edit-cred-hash').value.trim();
            // Ajouter seulement si au moins un champ est rempli
            if (username || password || hash) {
                credentials.push({ username, password, hash });
            }
        });

        // Vérifier si l'ID (IP/Nom) a changé et si le nouveau existe déjà
        if (hostId !== newIpName && getHostById(newIpName)) {
            alert(`Un hôte avec l'ID "${newIpName}" existe déjà.`);
            return;
        }

        // Mettre à jour les données
        const hostInfo = getHostById(hostId);
        if (!hostInfo || hostInfo.category !== originalCategory) {
             console.error("Erreur: Hôte ou catégorie d'origine introuvable lors de la sauvegarde.", hostId, originalCategory);
             alert("Erreur lors de la sauvegarde. Impossible de trouver l'hôte d'origine.");
             return;
        }

        // Créer le nouvel objet hôte
        const updatedHostData = { services, notes, tags, credentials };

        // Supprimer l'ancien enregistrement
        delete hostData.categories[originalCategory].hosts[hostId];

        // Ajouter/Mettre à jour avec le nouvel ID et les nouvelles données
        if (!hostData.categories[originalCategory].hosts) {
             hostData.categories[originalCategory].hosts = {};
        }
        hostData.categories[originalCategory].hosts[newIpName] = updatedHostData;


        // Mettre à jour les edges si l'ID a changé
        if (hostId !== newIpName) {
            hostData.edges.forEach(edge => {
                if (edge.from === hostId) edge.from = newIpName;
                if (edge.to === hostId) edge.to = newIpName;
            });
        }

        saveData();
        renderActiveCategoryContent(); // Mettre à jour la liste
        renderNetworkMap(); // Mettre à jour la carte
        renderAggregatedData(); // Mettre à jour les données agrégées
        populateFilterDropdowns(); // Mettre à jour les filtres
        closeEditPanel(); // Fermer le panneau
        alert(`Hôte "${newIpName}" sauvegardé.`);
    }

     function handleDeleteHostFromPanel() {
        const hostId = editHostIdInput.value;
        const category = editHostCategoryInput.value;
        handleRemoveHost(hostId, category); // Réutilise la fonction de suppression existante
        // La fonction handleRemoveHost s'occupe déjà de la sauvegarde, du rendu et de la fermeture du panneau.
    }

    // --- Fonctions de Gestion des Connexions (Edges) ---

    function handleAddEdge() {
        const fromId = editHostIdInput.value; // L'hôte en cours d'édition
        const toId = editEdgeToInput.value.trim();
        const label = editEdgeLabelInput.value.trim();

        if (!fromId || !toId) {
            alert("Veuillez spécifier l'hôte source et cible pour la connexion.");
            return;
        }

        // Vérifier si l'hôte cible existe
        if (!getHostById(toId)) {
            alert(`L'hôte cible "${toId}" n'existe pas.`);
            return;
        }

        // Vérifier si l'edge existe déjà (dans un sens ou l'autre, optionnel)
        const edgeExists = hostData.edges.some(edge =>
            (edge.from === fromId && edge.to === toId) || (edge.from === toId && edge.to === fromId)
        );

        if (edgeExists) {
            alert("Une connexion existe déjà entre ces deux hôtes.");
            return;
        }

        // Ajouter le nouvel edge
        hostData.edges.push({ from: fromId, to: toId, label: label || undefined }); // Ne pas mettre de label vide

        saveData();
        renderNetworkMap(); // Mettre à jour la carte pour afficher le nouvel edge
        renderExistingEdges(fromId); // Mettre à jour la liste dans le panneau

        // Vider les champs d'ajout d'edge
        editEdgeToInput.value = '';
        editEdgeLabelInput.value = '';
    }

    function renderExistingEdges(hostId) {
        existingEdgesListDiv.innerHTML = '<strong>Connexions existantes :</strong><ul>';
        const relatedEdges = hostData.edges.filter(edge => edge.from === hostId || edge.to === hostId);

        if (relatedEdges.length === 0) {
            existingEdgesListDiv.innerHTML += '<li>Aucune</li>';
        } else {
            relatedEdges.forEach((edge, index) => {
                const target = edge.from === hostId ? edge.to : edge.from;
                const direction = edge.from === hostId ? 'vers' : 'depuis';
                const label = edge.label ? ` (${edge.label})` : '';
                existingEdgesListDiv.innerHTML += `
                    <li>
                        ${direction} <strong>${sanitizeInput(target)}</strong>${sanitizeInput(label)}
                        <button class="remove-edge-btn" data-edge-index="${hostData.edges.indexOf(edge)}" style="font-size: 10px; color: red; cursor: pointer; border: none; background: none; margin-left: 5px;">[X]</button>
                    </li>`;
            });
        }
        existingEdgesListDiv.innerHTML += '</ul>';

        // Attacher les écouteurs pour supprimer les edges
        existingEdgesListDiv.querySelectorAll('.remove-edge-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const edgeIndex = parseInt(e.target.dataset.edgeIndex, 10);
                if (!isNaN(edgeIndex) && hostData.edges[edgeIndex]) {
                    handleRemoveEdge(edgeIndex, hostId);
                }
            });
        });
    }

    function handleRemoveEdge(edgeIndex, currentHostId) {
         if (confirm("Êtes-vous sûr de vouloir supprimer cette connexion ?")) {
            hostData.edges.splice(edgeIndex, 1); // Supprimer l'edge du tableau
            saveData();
            renderNetworkMap(); // Mettre à jour la carte
            renderExistingEdges(currentHostId); // Mettre à jour la liste dans le panneau
         }
    }


    // --- Fonctions d'Actions Globales ---

    function handleExportSession() {
        if (Object.keys(hostData.categories).length === 0 && hostData.edges.length === 0) {
            alert("Il n'y a aucune donnée à exporter.");
            return;
        }
        try {
            const jsonData = JSON.stringify(hostData, null, 2); // Indenté pour lisibilité
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            a.download = `hostmanager_session_${timestamp}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Erreur lors de l'exportation JSON:", e);
            alert("Erreur lors de la création du fichier d'exportation.");
        }
    }

    function handleImportSession(event) {
        const file = event.target.files[0];
        if (!file) {
            return;
        }
        if (!confirm("Importer ce fichier remplacera toutes les données actuelles. Continuer ?")) {
            event.target.value = null; // Réinitialiser l'input file
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                // Validation basique de la structure importée
                if (importedData && typeof importedData.categories === 'object' && Array.isArray(importedData.edges)) {
                    hostData = importedData;
                    // S'assurer que les catégories ont bien une structure 'hosts'
                    Object.values(hostData.categories).forEach(cat => {
                        if (!cat.hosts) cat.hosts = {};
                    });
                    // Définir la catégorie active
                    activeCategory = Object.keys(hostData.categories)[0] || null;
                     if (!activeCategory && Object.keys(hostData.categories).length === 0) {
                        addCategory("Default"); // Ajouter Default si l'import est vide
                     } else {
                        saveData();
                        renderAll(); // Re-render toute l'interface avec les nouvelles données
                        alert("Session importée avec succès !");
                     }
                } else {
                    throw new Error("Structure de données invalide dans le fichier importé.");
                }
            } catch (error) {
                console.error("Erreur lors de l'importation JSON:", error);
                alert(`Erreur lors de l'importation du fichier : ${error.message}`);
            } finally {
                 event.target.value = null; // Réinitialiser l'input file
            }
        };
        reader.onerror = function() {
            alert("Erreur lors de la lecture du fichier.");
             event.target.value = null; // Réinitialiser l'input file
        };
        reader.readAsText(file);
    }

    function handleRemoveAllData() {
        if (confirm("Êtes-vous sûr de vouloir supprimer TOUTES les catégories, hôtes et connexions ? Cette action est irréversible.")) {
            hostData = { categories: {}, edges: [] };
            addCategory("Default"); // Recréer la catégorie par défaut
            // La fonction addCategory gère saveData et renderAll
        }
    }

    function handleCopyAggregatedData(event) {
        if (!event.target.classList.contains('copy-btn')) return;

        const targetId = event.target.dataset.target;
        const preElement = document.getElementById(targetId);
        if (preElement) {
            navigator.clipboard.writeText(preElement.textContent)
                .then(() => alert(`${targetId.replace('all', 'Tous les ')} copiés dans le presse-papiers !`))
                .catch(err => {
                    console.error("Erreur de copie:", err);
                    alert("Erreur lors de la copie.");
                });
        }
    }


    // --- Fonctions de Génération et Prévisualisation du Rapport Killchain ---

    function updateMarkdownPreview() {
        console.log("updateMarkdownPreview: Début"); // Log de début
        if (!killchainReportPreview || !killchainReportRenderedPreview) {
            console.error("updateMarkdownPreview: Textarea ou Div d'aperçu non trouvé.");
            return;
        }

        const markdownText = killchainReportPreview.value;
        console.log("updateMarkdownPreview: Markdown brut récupéré (longueur):", markdownText.length);

        // Vérifier si marked et DOMPurify sont chargés
        if (typeof marked === 'undefined' || typeof DOMPurify === 'undefined') {
             console.error("ERREUR: marked.js ou DOMPurify n'est pas chargé ! Vérifiez les balises <script> dans hostmanager.html.");
             killchainReportRenderedPreview.innerHTML = `<p style="color: red;">Erreur: Bibliothèques manquantes (marked/DOMPurify).</p>`;
             return;
        }

        try {
            console.log("updateMarkdownPreview: Appel de marked.parse()...");
            const dirtyHtml = marked.parse(markdownText);
            console.log("updateMarkdownPreview: HTML après marked (longueur):", dirtyHtml.length);

            console.log("updateMarkdownPreview: Appel de DOMPurify.sanitize()...");
            const cleanHtml = DOMPurify.sanitize(dirtyHtml);
            console.log("updateMarkdownPreview: HTML après DOMPurify (longueur):", cleanHtml.length);

            // Vérification cruciale : le HTML nettoyé est-il vide ?
            if (markdownText.length > 0 && cleanHtml.length === 0) {
                console.warn("updateMarkdownPreview: DOMPurify a supprimé tout le contenu HTML. Le Markdown d'origine était peut-être invalide ou considéré comme dangereux.");
                killchainReportRenderedPreview.innerHTML = `<p style="color: orange;">Avertissement: Le contenu Markdown a été entièrement filtré par le sanitiseur.</p>`;
            } else {
                killchainReportRenderedPreview.innerHTML = cleanHtml;
                console.log("updateMarkdownPreview: innerHTML du div d'aperçu mis à jour.");
            }

        } catch (error) {
            console.error("ERREUR lors de la conversion Markdown ou de la sanitization:", error);
            // Afficher l'erreur dans l'aperçu pour un feedback direct
            killchainReportRenderedPreview.innerHTML = `<p style="color: red;">Erreur lors du rendu Markdown :<br><pre>${error.message}</pre></p>`;
        }
        console.log("updateMarkdownPreview: Fin");
    }

    function generateKillchainReport() {
        console.log("generateKillchainReport: Début");
        if (Object.keys(hostData.categories).length === 0 && hostData.edges.length === 0) {
            alert("Aucune donnée disponible pour générer le rapport.");
            killchainReportPreview.value = '';
            updateMarkdownPreview(); // Mettre à jour l'aperçu (qui sera vide)
            exportKillchainBtn.disabled = true;
            return;
        }

        // --- Demander des informations ---
        const targetName = prompt("Entrez le nom de la cible/mission pour le rapport :", "Projet X");
        if (targetName === null) { console.log("Génération annulée (cible)"); return; }
        const authorName = prompt("Entrez le nom de l'auteur :", "Pentester Senior");
        if (authorName === null) { console.log("Génération annulée (auteur)"); return; }
        const summary = prompt("Entrez un bref résumé du pentest :", "Audit de sécurité interne visant à évaluer la posture de sécurité et les chemins d'attaque potentiels.");
        if (summary === null) { console.log("Génération annulée (résumé)"); return; }


        let markdown = '';

        // --- 1. Frontmatter YAML ---
        markdown += `---
title: "Rapport Killchain - Pentest ${targetName || 'Inconnu'}"
date: "${getCurrentDateFormatted()}"
author: "${authorName || 'Inconnu'}"
summary: "${summary || 'Analyse des chemins d\'attaque découverts lors du pentest.'}"
---\n\n`;

        // --- 2. Titre Principal ---
        markdown += `# Rapport d'Analyse Killchain - ${targetName || 'Pentest'}\n\n`;
        markdown += `**Date:** ${getCurrentDateFormatted()}  \n`;
        markdown += `**Auteur:** ${authorName || 'Inconnu'}  \n\n`;

        // --- 3. Introduction ---
        markdown += `## Introduction\n\n`;
        markdown += `Ce document détaille la séquence d'exploitation (killchain) observée lors de l'audit de sécurité pour ${targetName || 'la cible'}. Il décrit les étapes suivies, depuis la reconnaissance initiale jusqu'aux actions post-exploitation, en mettant en évidence les pivots et les techniques utilisées pour progresser dans le réseau cible.\n\n`;
        markdown += `Le scope de l'audit incluait **[À compléter : décrire le scope ici]**. Les objectifs principaux étaient **[À compléter : lister les objectifs]**.\n\n`;

        // --- 4. Développement de la Killchain ---
        markdown += `## Développement de la Killchain\n\n`;
        markdown += `Cette section détaille chaque hôte compromis ou utilisé comme pivot durant l'audit.\n\n`;

        let hostCounter = 0;
        Object.entries(hostData.categories).forEach(([categoryName, categoryData]) => {
            if (categoryData.hosts) {
                Object.entries(categoryData.hosts).sort().forEach(([hostId, host]) => {
                    hostCounter++;
                    markdown += `### ${hostCounter}. Hôte : ${sanitizeInput(hostId)} (${sanitizeInput(categoryName)})\n\n`;

                    // --- 4.1 Tableau Technique ---
                    markdown += `#### Informations Techniques\n\n`;
                    const outgoingEdges = hostData.edges.filter(edge => edge.from === hostId);
                    const techniques = outgoingEdges.map(edge => `\`${sanitizeInput(edge.label || 'Pivot')}\` vers \`${sanitizeInput(edge.to)}\``).join('<br>');
                    const tags = host.tags ? host.tags.map(tag => `\`${sanitizeInput(tag)}\``).join(', ') : '(aucun)';

                    markdown += `| Élément              | Détail                                                                 |\n`;
                    markdown += `|----------------------|------------------------------------------------------------------------|\n`;
                    markdown += `| IP / Nom             | \`${sanitizeInput(hostId)}\`                                            |\n`;
                    markdown += `| Catégorie / Tags     | ${sanitizeInput(categoryName)} / ${tags}                               |\n`;
                    markdown += `| Services Détectés    | ${host.services ? `\`${sanitizeInput(host.services)}\`` : '(non spécifié)'} |\n`;
                    markdown += `| Credentials Trouvés  | ${formatCredentialsForMarkdown(host.credentials)}                      |\n`;
                    markdown += `| Techniques / Pivots  | ${techniques || '(aucun pivot sortant défini)'}                         |\n`;
                    markdown += `| Notes / Observations | ${host.notes ? sanitizeForMarkdownTable(host.notes) : '(aucune)'}        |\n\n`;


                    // --- 4.2 Analyse et Exploitation (Narration) ---
                    markdown += `#### Analyse et Exploitation\n\n`;
                    let narration = `L'hôte \`${sanitizeInput(hostId)}\` appartenant à la catégorie **${sanitizeInput(categoryName)}**`;
                    if (host.services) {
                        narration += ` exposant les services ${host.services ? `\`${sanitizeInput(host.services)}\`` : ''}`;
                    }
                    narration += ` a été analysé. `;

                    if (host.credentials && host.credentials.length > 0) {
                        narration += `Les credentials suivants y ont été découverts : ${formatCredentialsForMarkdown(host.credentials)}. `;
                    } else {
                        narration += `Aucun credential spécifique n'a été enregistré pour cet hôte. `;
                    }

                    if (outgoingEdges.length > 0) {
                        narration += `Depuis cet hôte, les pivots suivants ont été établis : ${outgoingEdges.map(edge => `**${sanitizeInput(edge.label || 'Pivot')}** vers \`${sanitizeInput(edge.to)}\``).join(', ')}. `;
                    } else {
                        narration += `Aucun pivot sortant n'a été défini depuis cet hôte dans la cartographie. `;
                    }

                    if (host.notes) {
                         narration += `\n\n**Notes supplémentaires :**\n${sanitizeInput(host.notes)}\n`; // Afficher les notes brutes ici
                    }

                    markdown += `${narration}\n\n`;
                    markdown += `*([À compléter : Ajouter des détails spécifiques sur la méthode d'exploitation, les vulnérabilités utilisées, ou les commandes clés exécutées sur cet hôte si nécessaire]*)\n\n`;

                });
            }
        });

        if (hostCounter === 0) {
            markdown += `*Aucun hôte n'a été ajouté aux catégories.*\n\n`;
        }

        // --- 5. Récapitulatif Global des Credentials ---
        markdown += `## Récapitulatif Global des Credentials\n\n`;
        markdown += `| Hôte Source          | Username             | Password             | Hash                 |\n`;
        markdown += `|----------------------|----------------------|----------------------|----------------------|\n`;
        let credCount = 0;
        Object.entries(hostData.categories).forEach(([categoryName, categoryData]) => {
            if (categoryData.hosts) {
                Object.entries(categoryData.hosts).forEach(([hostId, host]) => {
                    if (host.credentials && host.credentials.length > 0) {
                        host.credentials.forEach(cred => {
                            markdown += `| \`${sanitizeInput(hostId)}\` | ${cred.username ? `\`${sanitizeInput(cred.username)}\`` : ''} | ${cred.password ? `\`${sanitizeInput(cred.password)}\`` : ''} | ${cred.hash ? `\`${sanitizeInput(cred.hash)}\`` : ''} |\n`;
                            credCount++;
                        });
                    }
                });
            }
        });

        if (credCount === 0) {
            markdown += `| (Aucun credential trouvé) |                      |                      |                      |\n`;
        }
        markdown += `\n`;

        // --- 6. Conclusion / Lessons Learned ---
        markdown += `## Conclusion et Recommandations\n\n`;
        markdown += `L'analyse de la killchain a mis en évidence plusieurs chemins d'attaque et vulnérabilités au sein du réseau de ${targetName || 'la cible'}. Les points clés incluent : \n`;
        markdown += `*   **[À compléter : Point clé 1, ex: Faiblesse critique dans la gestion des mots de passe administrateur]**\n`;
        markdown += `*   **[À compléter : Point clé 2, ex: Exposition de services obsolètes et vulnérables sur le périmètre externe]**\n`;
        markdown += `*   **[À compléter : Point clé 3, ex: Absence de segmentation efficace entre les zones réseau]**\n\n`;
        markdown += `Les techniques de pivot les plus efficaces observées ont été **[À compléter : ex: l'exploitation de credentials réutilisés, les tunnels SSH via des hôtes compromis, l'abus de relations de confiance AD]**.\n\n`;
        markdown += `### Recommandations Principales\n\n`;
        markdown += `1.  **[À compléter : Recommandation 1, ex: Mettre en place une politique de mots de passe robuste et unique pour les comptes à privilèges (LAPS, etc.)]**\n`;
        markdown += `2.  **[À compléter : Recommandation 2, ex: Effectuer un inventaire des services exposés et désactiver/mettre à jour/filtrer les services non essentiels ou vulnérables]**\n`;
        markdown += `3.  **[À compléter : Recommandation 3, ex: Revoir et renforcer la segmentation du réseau (pare-feu, VLANs) pour limiter les mouvements latéraux]**\n\n`;
        markdown += `--- Fin du Rapport ---`;


        // --- Afficher dans la Textarea et Mettre à jour l'Aperçu ---
        console.log("generateKillchainReport: Markdown généré (longueur):", markdown.length);
        killchainReportPreview.value = markdown; // Mettre à jour la textarea d'abord

        console.log("generateKillchainReport: Appel de updateMarkdownPreview()...");
        updateMarkdownPreview(); // Mettre à jour le rendu HTML ensuite

        exportKillchainBtn.disabled = false; // Activer le bouton d'export

        console.log("generateKillchainReport: Appel de switchToPreviewTab()...");
        switchToPreviewTab(); // Assurer que l'onglet Aperçu est visible

        alert("Rapport Killchain généré et prévisualisé ! Vérifiez l'onglet 'Aperçu'.");
        console.log("generateKillchainReport: Fin");
    }

    function handleExportKillchain() {
        const markdownContent = killchainReportPreview.value; // Exporter depuis la textarea (source de vérité)
        if (!markdownContent) {
            alert("Aucun rapport à exporter. Veuillez d'abord générer le rapport.");
            return;
        }
        // ... (logique d'export via Blob inchangée) ...
        try {
            const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const titleMatch = markdownContent.match(/title: "Rapport Killchain - Pentest ([^"]+)"/);
            const filenameBase = titleMatch && titleMatch[1] ? sanitizeInput(titleMatch[1]).replace(/ /g, '_') : 'killchain_report';
            a.download = `${filenameBase}_${timestamp}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Erreur lors de l'exportation Markdown:", e);
            alert("Erreur lors de la création du fichier d'exportation Markdown.");
        }
    }

    // --- Logique des Onglets Aperçu/Éditeur ---
    function switchToPreviewTab() {
        console.log("switchToPreviewTab: Activation");
        if (!killchainReportRenderedPreview || !killchainReportPreview || !showPreviewTab || !showEditorTab) return;
        killchainReportRenderedPreview.style.display = 'block';
        killchainReportPreview.style.display = 'none';
        showPreviewTab.classList.add('active');
        showEditorTab.classList.remove('active');
    }

    function switchToEditorTab() {
        console.log("switchToEditorTab: Activation");
        if (!killchainReportRenderedPreview || !killchainReportPreview || !showPreviewTab || !showEditorTab) return;
        killchainReportRenderedPreview.style.display = 'none';
        killchainReportPreview.style.display = 'block';
        showPreviewTab.classList.remove('active');
        showEditorTab.classList.add('active');
    }


    // --- Initialisation et Écouteurs d'Événements ---

    function initialize() {
        console.log("Initialisation Host Manager v2...");
        loadData();
        renderAll();

        // ... (Écouteurs existants pour catégories, hôtes, panel, edges, actions globales) ...
        addCategoryBtn.addEventListener('click', () => addCategory());
        applyFiltersBtn.addEventListener('click', () => {
            renderAggregatedData(filterCategorySelect.value, filterTagInput.value.trim());
        });
        exportSessionBtn.addEventListener('click', handleExportSession);
        importSessionInput.addEventListener('change', handleImportSession);
        removeAllDataBtn.addEventListener('click', handleRemoveAllData);
        closePanelBtn.addEventListener('click', closeEditPanel);
        editHostForm.addEventListener('submit', handleSaveHostFromPanel);
        addCredentialBtn.addEventListener('click', () => addCredentialInputs());
        deleteHostFromPanelBtn.addEventListener('click', handleDeleteHostFromPanel);
        addEdgeBtn.addEventListener('click', handleAddEdge);
        document.querySelector('.aggregated-data-section').addEventListener('click', handleCopyAggregatedData);


        // Nouveaux écouteurs pour le rapport Killchain
        if (generateKillchainBtn) {
            generateKillchainBtn.addEventListener('click', generateKillchainReport);
        } else { console.error("Bouton generateKillchainBtn non trouvé !"); }

        if (exportKillchainBtn) {
            exportKillchainBtn.addEventListener('click', handleExportKillchain);
        } else { console.error("Bouton exportKillchainBtn non trouvé !"); }

        if (showPreviewTab) {
            showPreviewTab.addEventListener('click', switchToPreviewTab);
        } else { console.error("Onglet showPreviewTab non trouvé !"); }

        if (showEditorTab) {
            showEditorTab.addEventListener('click', switchToEditorTab);
        } else { console.error("Onglet showEditorTab non trouvé !"); }

        // Mettre à jour l'aperçu en temps réel lors de l'édition
        if (killchainReportPreview) {
            killchainReportPreview.addEventListener('input', updateMarkdownPreview);
        } else { console.error("Textarea killchainReportPreview non trouvée !"); }


        // ... (Observer pour le thème) ...
         const themeToggle = document.getElementById('toggleTheme');
         if (themeToggle) {
            const observer = new MutationObserver((mutationsList) => {
                for(let mutation of mutationsList) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class' && mutation.target === document.body) {
                        if (network) {
                            renderNetworkMap(); // Re-render pour les couleurs
                        }
                        break;
                    }
                }
            });
            observer.observe(document.body, { attributes: true });
         }

         // Initialiser l'état des onglets et du bouton export
         switchToPreviewTab(); // Afficher l'aperçu par défaut
         if (exportKillchainBtn) exportKillchainBtn.disabled = true; // Désactiver l'export initialement
         updateMarkdownPreview(); // Afficher le placeholder initial ou le contenu existant
         console.log("Initialisation terminée.");
    }

    initialize();
}); 