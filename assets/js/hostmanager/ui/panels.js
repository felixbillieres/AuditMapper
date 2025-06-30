/**
 * Gestionnaire des panneaux d'interface utilisateur
 */

export class PanelUI {
    constructor(hostManager) {
        this.hostManager = hostManager;
    }

    initialize() {
        console.log(">>> PanelUI.initialize: START");
        this.setupGlobalEventListeners();
        console.log(">>> PanelUI.initialize: END");
    }

    setupGlobalEventListeners() {
        // Écouteurs pour les boutons d'export/import
        const exportSessionBtn = document.getElementById('exportSessionBtn');
        if (exportSessionBtn) {
            exportSessionBtn.addEventListener('click', () => {
                this.hostManager.modules.storage.exportSession();
            });
        }

        const importSessionInput = document.getElementById('importSessionInput');
        if (importSessionInput) {
            importSessionInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    // Afficher un indicateur de chargement
                    const loadingAlert = document.createElement('div');
                    loadingAlert.className = 'alert alert-info';
                    loadingAlert.textContent = 'Import en cours...';
                    document.body.appendChild(loadingAlert);
                    
                    this.hostManager.modules.storage.importSession(file)
                        .then(() => {
                            document.body.removeChild(loadingAlert);
                            alert('Session importée avec succès!');
                            this.hostManager.modules.categoryUI.renderCategories();
                            this.hostManager.modules.network.updateNetwork();
                            // Réinitialiser l'input pour permettre la sélection du même fichier
                            e.target.value = '';
                        })
                        .catch(error => {
                            document.body.removeChild(loadingAlert);
                            console.error('Erreur import session:', error);
                            alert('Erreur import session: ' + error.message);
                            // Réinitialiser l'input
                            e.target.value = '';
                        });
                }
            });
        }

        const removeAllDataBtn = document.getElementById('removeAllDataBtn');
        if (removeAllDataBtn) {
            removeAllDataBtn.addEventListener('click', () => {
                this.hostManager.modules.storage.removeAllData();
            });
        }
    }
} 