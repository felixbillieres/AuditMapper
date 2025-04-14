document.addEventListener('DOMContentLoaded', function() {
    const newHostIpInput = document.getElementById('newHostIp');
    const addHostBtn = document.getElementById('addHostBtn');
    const hostListDiv = document.getElementById('hostList');
    const allUsernamesPre = document.getElementById('allUsernames');
    const allPasswordsPre = document.getElementById('allPasswords');
    const allHashesPre = document.getElementById('allHashes');
    const removeAllHostsBtn = document.getElementById('removeAllHostsBtn');
    const copyAllDataBtn = document.getElementById('copyAllDataBtn');
    const exportAllDataBtn = document.getElementById('exportAllDataBtn');

    const STORAGE_KEY = 'pentestHostData';

    // Charger les données depuis localStorage ou initialiser
    let hostData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

    // --- Fonctions Utilitaires ---

    function saveData() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(hostData));
    }

    function sanitizeFilename(name) {
        // Remplace les caractères non autorisés dans les noms de fichiers
        return name.replace(/[^a-z0-9_\-\.]/gi, '_');
    }

    // --- Fonctions de Rendu ---

    function renderHost(ip) {
        const host = hostData[ip];
        if (!host) return ''; // Ne devrait pas arriver mais sécurité

        // Convertir les tableaux en chaînes pour les textareas
        const usernamesText = host.usernames ? host.usernames.join('\n') : '';
        const passwordsText = host.passwords ? host.passwords.join('\n') : '';
        const hashesText = host.hashes ? host.hashes.join('\n') : '';

        return `
            <div class="host-entry" data-ip="${ip}">
                <div class="host-header">
                    <h3>${ip}</h3>
                    <button class="remove-host-btn" data-ip="${ip}">Supprimer</button>
                </div>
                <div class="host-details">
                    <div class="form-group">
                        <label for="notes-${ip}">Notes:</label>
                        <textarea id="notes-${ip}" class="host-textarea" data-ip="${ip}" data-type="notes" placeholder="Notes générales sur l'hôte...">${host.notes || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="usernames-${ip}">Noms d'utilisateur:</label>
                        <textarea id="usernames-${ip}" class="host-textarea" data-ip="${ip}" data-type="usernames" placeholder="Un par ligne...">${usernamesText}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="passwords-${ip}">Mots de passe:</label>
                        <textarea id="passwords-${ip}" class="host-textarea" data-ip="${ip}" data-type="passwords" placeholder="Un par ligne...">${passwordsText}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="hashes-${ip}">Hashes:</label>
                        <textarea id="hashes-${ip}" class="host-textarea" data-ip="${ip}" data-type="hashes" placeholder="Un par ligne...">${hashesText}</textarea>
                    </div>
                </div>
            </div>
        `;
    }

    function renderHostList() {
        hostListDiv.innerHTML = ''; // Vider la liste actuelle
        const sortedIps = Object.keys(hostData).sort(); // Trier les IPs pour un affichage cohérent
        sortedIps.forEach(ip => {
            hostListDiv.innerHTML += renderHost(ip);
        });

        // Réattacher les écouteurs d'événements aux éléments dynamiques
        attachDynamicEventListeners();
    }

    function renderAggregatedData() {
        let allUsers = [];
        let allPass = [];
        let allHash = [];

        Object.values(hostData).forEach(host => {
            if (host.usernames) allUsers.push(...host.usernames);
            if (host.passwords) allPass.push(...host.passwords);
            if (host.hashes) allHash.push(...host.hashes);
        });

        // Rendre unique et trier
        allUsernamesPre.textContent = [...new Set(allUsers)].sort().join('\n') || 'Aucun nom d\'utilisateur trouvé.';
        allPasswordsPre.textContent = [...new Set(allPass)].sort().join('\n') || 'Aucun mot de passe trouvé.';
        allHashesPre.textContent = [...new Set(allHash)].sort().join('\n') || 'Aucun hash trouvé.';
    }

    function renderAll() {
        renderHostList();
        renderAggregatedData();
    }

    // --- Gestionnaires d'Événements ---

    function handleAddHost() {
        const ip = newHostIpInput.value.trim();
        // Validation simple de l'IP (peut être améliorée)
        if (!ip || !/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ip)) {
            alert("Veuillez entrer une adresse IP valide.");
            return;
        }

        if (hostData[ip]) {
            alert("Cet hôte existe déjà.");
            return;
        }

        hostData[ip] = {
            notes: '',
            usernames: [],
            passwords: [],
            hashes: []
        };

        newHostIpInput.value = ''; // Vider l'input
        saveData();
        renderAll(); // Mettre à jour l'affichage
    }

    function handleRemoveHost(event) {
        if (event.target.classList.contains('remove-host-btn')) {
            const ip = event.target.dataset.ip;
            if (ip && confirm(`Êtes-vous sûr de vouloir supprimer l'hôte ${ip} et toutes ses données ?`)) {
                delete hostData[ip];
                saveData();
                renderAll();
            }
        }
    }

    function handleHostDataChange(event) {
        if (event.target.classList.contains('host-textarea')) {
            const ip = event.target.dataset.ip;
            const type = event.target.dataset.type;
            const value = event.target.value;

            if (hostData[ip]) {
                if (type === 'notes') {
                    hostData[ip].notes = value;
                } else {
                    // Pour usernames, passwords, hashes: stocker comme tableau
                    hostData[ip][type] = value.split('\n').map(s => s.trim()).filter(Boolean); // Sépare par ligne, nettoie, enlève les vides
                }
                saveData();
                renderAggregatedData(); // Mettre à jour seulement les données agrégées pour la performance
            }
        }
    }

    // --- Gestionnaire pour Supprimer Tous les Hôtes (Vérification) ---
    function handleRemoveAllHosts() {
        // Vérifier s'il y a des hôtes à supprimer
        if (Object.keys(hostData).length === 0) {
            alert("Il n'y a aucun hôte à supprimer.");
            return; // Sortir si la liste est déjà vide
        }

        // Demander confirmation
        if (confirm("Êtes-vous sûr de vouloir supprimer TOUS les hôtes et leurs données ? Cette action est irréversible.")) {
            console.log("Suppression de tous les hôtes confirmée.");
            hostData = {}; // Vider l'objet des données
            saveData();    // Sauvegarder l'état vide dans localStorage
            renderAll();   // Mettre à jour l'affichage (vider la liste et les données agrégées)
            alert("Tous les hôtes ont été supprimés."); // Confirmer à l'utilisateur
        } else {
            console.log("Suppression de tous les hôtes annulée."); // Optionnel: log si annulé
        }
    }

    // --- Nouveau Gestionnaire pour Copier Toutes les Données ---
    function handleCopyAllData() {
        if (Object.keys(hostData).length === 0) {
            alert("Il n'y a aucune donnée à copier.");
            return;
        }

        let allDataText = "--- Données Host Manager ---\n\n";
        const sortedIps = Object.keys(hostData).sort();

        sortedIps.forEach(ip => {
            const host = hostData[ip];
            allDataText += `--- Hôte: ${ip} ---\n`;
            allDataText += `Notes:\n${host.notes || '(aucune)'}\n\n`;
            allDataText += `Noms d'utilisateur:\n${host.usernames && host.usernames.length > 0 ? host.usernames.join('\n') : '(aucun)'}\n\n`;
            allDataText += `Mots de passe:\n${host.passwords && host.passwords.length > 0 ? host.passwords.join('\n') : '(aucun)'}\n\n`;
            allDataText += `Hashes:\n${host.hashes && host.hashes.length > 0 ? host.hashes.join('\n') : '(aucun)'}\n\n`;
            allDataText += "------------------------\n\n";
        });

        navigator.clipboard.writeText(allDataText)
            .then(() => {
                alert("Toutes les données ont été copiées dans le presse-papiers !");
            })
            .catch(err => {
                console.error("Erreur lors de la copie dans le presse-papiers:", err);
                alert("Erreur lors de la copie. Vérifiez la console pour plus de détails.");
            });
    }

    // --- Nouveau Gestionnaire pour Exporter Toutes les Données ---
    async function handleExportAllData() {
        if (Object.keys(hostData).length === 0) {
            alert("Il n'y a aucune donnée à exporter.");
            return;
        }

        // Vérifier la compatibilité de l'API File System Access
        if (!window.showDirectoryPicker) {
            alert("Votre navigateur ne supporte pas l'API File System Access nécessaire pour cette fonctionnalité. Essayez avec Chrome ou Edge.");
            return;
        }

        try {
            // Demander à l'utilisateur de choisir un dossier
            const directoryHandle = await window.showDirectoryPicker();

            const sortedIps = Object.keys(hostData).sort();

            // Boucler sur chaque hôte
            for (const ip of sortedIps) {
                const host = hostData[ip];
                // Créer ou obtenir le dossier pour l'IP courante
                const hostDirectoryHandle = await directoryHandle.getDirectoryHandle(ip, { create: true });

                // Définir les types de données à exporter pour cet hôte
                const dataTypes = {
                    'notes': host.notes || '',
                    'usernames': host.usernames ? host.usernames.join('\n') : '',
                    'passwords': host.passwords ? host.passwords.join('\n') : '',
                    'hashes': host.hashes ? host.hashes.join('\n') : ''
                };

                // Créer un fichier pour chaque type de donnée
                for (const type in dataTypes) {
                    const content = dataTypes[type];
                    // Ne crée pas de fichier si le contenu est vide (optionnel, mais évite les fichiers vides)
                    // if (content.trim() === '') continue;

                    const filename = `${ip}_${type}.txt`; // Nom du fichier: IP_type.txt
                    const fileHandle = await hostDirectoryHandle.getFileHandle(filename, { create: true });
                    const writable = await fileHandle.createWritable();
                    await writable.write(content);
                    await writable.close();
                }
            }

            alert("Exportation terminée avec succès !");

        } catch (err) {
            // Gérer les erreurs (ex: l'utilisateur annule la sélection du dossier)
            if (err.name !== 'AbortError') {
                console.error("Erreur lors de l'exportation :", err);
                alert(`Erreur lors de l'exportation : ${err.message}`);
            } else {
                console.log("Exportation annulée par l'utilisateur.");
            }
        }
    }

    // Attacher les écouteurs d'événements statiques
    addHostBtn.addEventListener('click', handleAddHost);
    removeAllHostsBtn.addEventListener('click', handleRemoveAllHosts);
    copyAllDataBtn.addEventListener('click', handleCopyAllData);
    exportAllDataBtn.addEventListener('click', handleExportAllData);

    // Attacher les écouteurs pour les éléments dynamiques (suppression, modification)
    function attachDynamicEventListeners() {
        // Utiliser la délégation d'événements sur hostListDiv
        hostListDiv.removeEventListener('click', handleRemoveHost); // Enlever l'ancien avant d'ajouter
        hostListDiv.addEventListener('click', handleRemoveHost);

        hostListDiv.removeEventListener('input', handleHostDataChange); // Utiliser 'input' pour une sauvegarde plus fréquente
        hostListDiv.addEventListener('input', handleHostDataChange);
    }

    // --- Initialisation ---
    renderAll(); // Afficher l'état initial au chargement
}); 