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
                    this.hostManager.modules.storage.importSession(file)
                        .then(() => {
                            alert('Session importée avec succès!');
                            this.hostManager.modules.categoryUI.renderCategories();
                            this.hostManager.modules.network.updateNetwork();
                        })
                        .catch(error => {
                            alert('Erreur lors de l\'importation: ' + error.message);
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