/**
 * Gestionnaire d'export File System Access API
 */

export class FileSystemExporter {
    constructor(hostManager) {
        this.hostManager = hostManager;
    }

    initialize() {
        console.log(">>> FileSystemExporter.initialize: START");
        this.setupEventListeners();
        console.log(">>> FileSystemExporter.initialize: END");
    }

    setupEventListeners() {
        const selectExportDirBtn = document.getElementById('selectExportDirBtn');
        if (selectExportDirBtn) {
            selectExportDirBtn.addEventListener('click', () => this.selectExportDirectory());
        }

        const executeNodeExportBtn = document.getElementById('executeNodeExportBtn');
        if (executeNodeExportBtn) {
            executeNodeExportBtn.addEventListener('click', () => this.executeNodeExport());
        }
    }

    async selectExportDirectory() {
        try {
            if ('showDirectoryPicker' in window) {
                this.hostManager.selectedDirectoryHandle = await window.showDirectoryPicker();
                const selectedDirPath = document.getElementById('selectedDirPath');
                const executeNodeExportBtn = document.getElementById('executeNodeExportBtn');
                
                if (selectedDirPath) {
                    selectedDirPath.textContent = this.hostManager.selectedDirectoryHandle.name;
                }
                if (executeNodeExportBtn) {
                    executeNodeExportBtn.disabled = false;
                }
            } else {
                alert('File System Access API non supportée par ce navigateur. Utilisez Chrome ou Edge.');
            }
        } catch (error) {
            console.error('Erreur lors de la sélection du dossier:', error);
        }
    }

    async executeNodeExport() {
        if (!this.hostManager.selectedDirectoryHandle) {
            alert('Veuillez d\'abord sélectionner un dossier de destination.');
            return;
        }

        try {
            const statusMsg = document.getElementById('nodeExportStatusMsg');
            if (statusMsg) {
                statusMsg.textContent = 'Export en cours...';
                statusMsg.className = 'mt-3 d-block small text-info';
            }

            await this.createDirectoryStructure();

            if (statusMsg) {
                statusMsg.textContent = 'Export terminé avec succès!';
                statusMsg.className = 'mt-3 d-block small text-success';
            }
        } catch (error) {
            console.error('Erreur lors de l\'export:', error);
            const statusMsg = document.getElementById('nodeExportStatusMsg');
            if (statusMsg) {
                statusMsg.textContent = 'Erreur lors de l\'export: ' + error.message;
                statusMsg.className = 'mt-3 d-block small text-danger';
            }
        }
    }

    async createDirectoryStructure() {
        const hostData = this.hostManager.getData();
        
        for (const categoryName in hostData.categories) {
            const category = hostData.categories[categoryName];
            if (!category.hosts) continue;

            // Créer le dossier de catégorie
            const categoryDirHandle = await this.hostManager.selectedDirectoryHandle.getDirectoryHandle(categoryName, { create: true });

            for (const hostId in category.hosts) {
                const host = category.hosts[hostId];
                
                // Créer le fichier pour l'hôte
                const fileName = `${hostId}.txt`;
                const fileHandle = await categoryDirHandle.getFileHandle(fileName, { create: true });
                const writable = await fileHandle.createWritable();
                
                const content = this.generateHostFileContent(host, hostId, categoryName);
                await writable.write(content);
                await writable.close();
            }
        }
    }

    generateHostFileContent(host, hostId, categoryName) {
        let content = `=== ${hostId} ===\n`;
        content += `Catégorie: ${categoryName}\n`;
        content += `Système: ${host.system || 'N/A'}\n`;
        content += `Rôle: ${host.role || 'N/A'}\n`;
        content += `Zone: ${host.zone || 'N/A'}\n`;
        content += `Niveau de compromission: ${host.compromiseLevel || 'None'}\n`;
        content += `Tags: ${host.tags?.join(', ') || 'Aucun'}\n\n`;

        if (host.notes) {
            content += `=== NOTES ===\n${host.notes}\n\n`;
        }

        if (host.credentials && host.credentials.length > 0) {
            content += `=== CREDENTIALS ===\n`;
            host.credentials.forEach(cred => {
                content += `Username: ${cred.username || 'N/A'}\n`;
                content += `Password: ${cred.password || 'N/A'}\n`;
                content += `Hash: ${cred.hash || 'N/A'}\n---\n`;
            });
            content += '\n';
        }

        if (host.outputs && host.outputs.length > 0) {
            content += `=== OUTPUTS ===\n`;
            host.outputs.forEach(output => {
                content += `Type: ${output.type || 'N/A'}\n`;
                if (output.subType) content += `Sous-type: ${output.subType}\n`;
                content += `Contenu:\n${output.content || ''}\n---\n`;
            });
            content += '\n';
        }

        return content;
    }
} 