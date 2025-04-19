document.addEventListener('DOMContentLoaded', () => {
    const placeholderForm = document.getElementById('placeholderForm');
    const formInputs = placeholderForm.querySelectorAll('input[data-placeholder]');
    const allFormGroups = placeholderForm.querySelectorAll('.form-group'); // Sélectionner tous les groupes
    const techniqueTabLinks = document.querySelectorAll('.technique-tabs .nav-link[data-technique]');
    const techniqueContentContainer = document.getElementById('techniqueTabContent');
    const codeBlocksToUpdate = document.querySelectorAll('code[data-command-template]');
    const copyButtons = document.querySelectorAll('.copy-btn');

    // --- Placeholder Storage ---
    const placeholderStorageKey = 'pivotingGuidePlaceholders';
    const lastActiveTabKey = 'pivotingGuideLastActiveTab';

    // --- Initialisation ---
    loadPlaceholders();
    updateCommands(); // Mettre à jour avant d'afficher pour avoir les bonnes valeurs initiales
    const lastActiveTechnique = localStorage.getItem(lastActiveTabKey) || 'ssh';
    // Afficher l'onglet initial ET les paramètres correspondants
    initializeActiveTabAndParams(lastActiveTechnique);


    // --- Fonctions ---

    // NOUVEAU: Fonction pour afficher/cacher les paramètres contextuels
    function updateVisibleParams(activeTechniqueId) {
        allFormGroups.forEach(formGroup => {
            const relevantTechniques = formGroup.dataset.techniques ? formGroup.dataset.techniques.split(',') : [];
            if (relevantTechniques.includes(activeTechniqueId)) {
                // formGroup.style.display = 'block'; // Simple show/hide
                formGroup.classList.add('visible'); // Utiliser la classe pour la transition CSS
            } else {
                // formGroup.style.display = 'none'; // Simple show/hide
                formGroup.classList.remove('visible'); // Utiliser la classe pour la transition CSS
            }
        });
    }

    // NOUVEAU: Fonction d'initialisation combinée
    function initializeActiveTabAndParams(techniqueId) {
        const targetTabLink = document.querySelector(`.technique-tabs .nav-link[data-technique="${techniqueId}"]`);
        let initialTechnique = techniqueId;

        if (targetTabLink) {
            $(targetTabLink).tab('show'); // Affiche l'onglet
        } else {
            // Fallback si l'onglet sauvegardé n'existe pas
            const firstTabLink = document.querySelector('.technique-tabs .nav-link');
            if (firstTabLink) {
                initialTechnique = firstTabLink.dataset.technique;
                $(firstTabLink).tab('show');
                localStorage.setItem(lastActiveTabKey, initialTechnique); // Mettre à jour le stockage
            }
        }
        // Mettre à jour les paramètres visibles pour l'onglet initial
        // Utiliser setTimeout pour s'assurer que l'onglet est rendu avant d'appliquer la visibilité (peut aider avec les transitions)
        setTimeout(() => updateVisibleParams(initialTechnique), 50);
    }


    // Met à jour toutes les commandes basées sur les valeurs du formulaire
    function updateCommands() {
        const currentPlaceholders = getPlaceholdersFromForm(); // Lit TOUS les inputs

        codeBlocksToUpdate.forEach(codeElement => {
            const template = codeElement.dataset.commandTemplate;
            if (!template) return;

            let updatedCommand = template;
            for (const key in currentPlaceholders) {
                const regex = new RegExp(key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
                // Utilise la valeur, ou le placeholder si vide, ou la clé elle-même
                const inputElement = document.querySelector(`[data-placeholder="${key}"]`);
                const placeholderValue = inputElement ? inputElement.placeholder : key;
                // Préfère la valeur actuelle si elle n'est pas null (donc non vide), sinon le placeholder HTML
                const replacementValue = currentPlaceholders[key] !== null ? currentPlaceholders[key] : placeholderValue;
                updatedCommand = updatedCommand.replace(regex, replacementValue);
            }
            // Nettoyer les placeholders restants si l'input correspondant n'existe pas/n'est pas pertinent
            updatedCommand = updatedCommand.replace(/<[A-Z_]+>/g, match => {
                 // Si un input existe pour ce placeholder, on le laisse (au cas où il serait vide et remplacé par le placeholder HTML)
                 // Sinon, on le remplace par ??? pour indiquer une valeur manquante.
                 return document.querySelector(`[data-placeholder="${match}"]`) ? match : '???';
            });

            codeElement.textContent = updatedCommand;
        });
    }

    // Récupère les valeurs actuelles de TOUS les inputs du formulaire
    function getPlaceholdersFromForm() {
        const placeholders = {};
        formInputs.forEach(input => {
            const key = input.dataset.placeholder;
            // Stocke la valeur si elle n'est pas vide, sinon null
            placeholders[key] = input.value.trim() ? input.value.trim() : null;
        });
        return placeholders;
    }

     // Sauvegarde les placeholders dans localStorage
    function savePlaceholders() {
        const placeholdersToSave = {};
         formInputs.forEach(input => {
            placeholdersToSave[input.id] = input.value;
        });
        try {
            localStorage.setItem(placeholderStorageKey, JSON.stringify(placeholdersToSave));
        } catch (e) {
            console.error("Erreur lors de la sauvegarde des placeholders dans localStorage:", e);
        }
    }

    // Charge les placeholders depuis localStorage et remplit le formulaire
    function loadPlaceholders() {
        try {
            const savedData = localStorage.getItem(placeholderStorageKey);
            if (savedData) {
                const loadedPlaceholders = JSON.parse(savedData);
                formInputs.forEach(input => {
                    // Vérifie si l'ID existe dans les données sauvegardées
                    if (loadedPlaceholders.hasOwnProperty(input.id)) {
                        input.value = loadedPlaceholders[input.id];
                    }
                });
            }
        } catch (e) {
            console.error("Erreur lors du chargement des placeholders depuis localStorage:", e);
            localStorage.removeItem(placeholderStorageKey);
        }
    }

    // Copie le contenu d'un bloc de code dans le presse-papiers
    async function copyCode(button) {
        const codeContainer = button.closest('.code-block-container');
        if (!codeContainer) return;
        const codeElement = codeContainer.querySelector('code');
        if (!codeElement) return;

        const textToCopy = codeElement.textContent;
        const originalButtonHTML = button.innerHTML; // Sauvegarde l'icône HTML

        try {
            await navigator.clipboard.writeText(textToCopy);
            button.innerHTML = '<i class="fas fa-check"></i> Copié!'; // Changement texte + icône
            button.classList.add('copied');
            button.disabled = true; // Désactiver temporairement
            setTimeout(() => {
                button.innerHTML = originalButtonHTML; // Restaure l'icône/texte
                 button.classList.remove('copied');
                 button.disabled = false; // Réactiver
            }, 1500);
        } catch (err) {
            console.error('Erreur lors de la copie:', err);
            button.innerHTML = '<i class="fas fa-times"></i> Erreur'; // Indiquer l'erreur
             setTimeout(() => {
                button.innerHTML = originalButtonHTML; // Restaure l'icône/texte
            }, 2000);
        }
    }

    // --- Écouteurs d'événements ---

    // Mettre à jour les commandes et sauvegarder à chaque changement dans le formulaire
    placeholderForm.addEventListener('input', (event) => {
        if (event.target.matches('input[data-placeholder]')) {
            updateCommands(); // Mettre à jour les commandes en temps réel
            savePlaceholders(); // Sauvegarder la valeur modifiée
        }
    });

    // Gérer la navigation par onglets ET la mise à jour des paramètres visibles
    techniqueTabLinks.forEach(link => {
        link.addEventListener('shown.bs.tab', event => { // Se déclenche APRES que l'onglet soit affiché
            const activeTechniqueId = event.target.dataset.technique;
            // Mettre à jour les paramètres visibles pour le nouvel onglet
            updateVisibleParams(activeTechniqueId);
            // Sauvegarder l'onglet actif
             try {
                localStorage.setItem(lastActiveTabKey, activeTechniqueId);
            } catch (e) {
                 console.error("Erreur lors de la sauvegarde de l'onglet actif (event) dans localStorage:", e);
            }
            // Mettre à jour les commandes une fois les paramètres affichés (important si des valeurs par défaut doivent être appliquées)
            updateCommands();
        });
    });


    // Gérer les clics sur les boutons "Copier"
    copyButtons.forEach(button => {
        button.addEventListener('click', () => {
            copyCode(button);
        });
    });

}); 