/**
 * Gestionnaire de stockage et persistance des données
 */

export class StorageManager {
    constructor(hostManager) {
        this.hostManager = hostManager;
        this.STORAGE_KEY = 'pentestHostData_v2';
    }

    loadData() {
        console.log(">>> loadData: START");
        try {
            const savedData = localStorage.getItem(this.STORAGE_KEY);
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                this.hostManager.hostData = parsedData;
                console.log("Data loaded from localStorage:", parsedData);
            } else {
                console.log("No saved data found, using default structure.");
                this.hostManager.hostData = { categories: {}, edges: [] };
            }
        } catch (error) {
            console.error("Error loading data from localStorage:", error);
            this.hostManager.hostData = { categories: {}, edges: [] };
        }
        console.log(">>> loadData: END");
    }

    saveData() {
        console.log(">>> saveData: START");
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.hostManager.hostData));
            console.log("Data saved to localStorage.");
        } catch (error) {
            console.error("Error saving data to localStorage:", error);
        }
        console.log(">>> saveData: END");
    }

    exportSession() {
        console.log(">>> exportSession: START");
        try {
            const dataStr = JSON.stringify(this.hostManager.hostData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `hostmanager_session_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            console.log("Session exported successfully.");
        } catch (error) {
            console.error("Error exporting session:", error);
        }
        console.log(">>> exportSession: END");
    }

    importSession(file) {
        console.log(">>> importSession: START");
        return new Promise((resolve, reject) => {
            // Vérifier que le fichier existe et est valide
            if (!file) {
                reject(new Error("Aucun fichier sélectionné"));
                return;
            }
            
            // Vérifier le type de fichier
            if (!file.name.toLowerCase().endsWith('.json')) {
                reject(new Error("Le fichier doit être au format JSON"));
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const result = e.target.result;
                    if (!result || result.trim() === '') {
                        throw new Error("Le fichier est vide");
                    }
                    
                    const importedData = JSON.parse(result);
                    
                    // Valider la structure des données
                    if (!importedData || typeof importedData !== 'object') {
                        throw new Error("Format de données invalide");
                    }
                    
                    // Ajouter une structure par défaut si nécessaire
                    const validData = {
                        categories: importedData.categories || {},
                        edges: importedData.edges || []
                    };
                    
                    this.hostManager.updateData(validData);
                    console.log("Session imported successfully.");
                    resolve();
                } catch (error) {
                    console.error("Error parsing imported file:", error);
                    reject(new Error("Erreur lors de l'analyse du fichier: " + error.message));
                }
            };
            
            reader.onerror = (error) => {
                console.error("FileReader error:", error);
                reject(new Error("Impossible de lire le fichier. Vérifiez que le fichier n'est pas corrompu."));
            };
            
            reader.onabort = () => {
                reject(new Error("Lecture du fichier interrompue"));
            };
            
            try {
                reader.readAsText(file, 'UTF-8');
            } catch (error) {
                console.error("Error starting file read:", error);
                reject(new Error("Impossible de démarrer la lecture du fichier"));
            }
        });
    }

    removeAllData() {
        console.log(">>> removeAllData: START");
        if (confirm("Êtes-vous sûr de vouloir supprimer toutes les données ? Cette action est irréversible.")) {
            localStorage.removeItem(this.STORAGE_KEY);
            this.hostManager.updateData({ categories: {}, edges: [] });
            console.log("All data removed.");
        }
        console.log(">>> removeAllData: END");
    }
}