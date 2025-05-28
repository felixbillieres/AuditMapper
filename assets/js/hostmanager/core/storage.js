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
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    this.hostManager.updateData(importedData);
                    console.log("Session imported successfully.");
                    resolve();
                } catch (error) {
                    console.error("Error parsing imported file:", error);
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error("File reading failed"));
            reader.readAsText(file);
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