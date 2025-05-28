/**
 * Gestionnaire d'export ZIP
 */

export class ZipExporter {
    constructor(hostManager) {
        this.hostManager = hostManager;
    }

    initialize() {
        console.log(">>> ZipExporter.initialize: START");
        this.setupEventListeners();
        console.log(">>> ZipExporter.initialize: END");
    }

    setupEventListeners() {
        const executeNodeExportZipBtn = document.getElementById('executeNodeExportZipBtn');
        if (executeNodeExportZipBtn) {
            executeNodeExportZipBtn.addEventListener('click', () => this.executeZipExport());
        }
    }

    async executeZipExport() {
        try {
            const statusMsg = document.getElementById('nodeExportStatusMsg');
            if (statusMsg) {
                statusMsg.textContent = 'Génération de l\'archive ZIP...';
                statusMsg.className = 'mt-3 d-block small text-info';
            }

            if (typeof JSZip === 'undefined') {
                throw new Error('JSZip n\'est pas chargé');
            }

            const zip = new JSZip();
            const hostData = this.hostManager.getData();

            for (const categoryName in hostData.categories) {
                const category = hostData.categories[categoryName];
                if (!category.hosts) continue;

                const categoryFolder = zip.folder(categoryName);

                for (const hostId in category.hosts) {
                    const host = category.hosts[hostId];
                    const content = this.generateHostFileContent(host, hostId, categoryName);
                    categoryFolder.file(`${hostId}.txt`, content);
                }
            }

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            
            if (typeof saveAs !== 'undefined') {
                saveAs(zipBlob, `hostmanager_export_${new Date().toISOString().slice(0, 10)}.zip`);
            } else {
                // Fallback si FileSaver.js n'est pas disponible
                const url = URL.createObjectURL(zipBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `hostmanager_export_${new Date().toISOString().slice(0, 10)}.zip`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }

            if (statusMsg) {
                statusMsg.textContent = 'Archive ZIP générée et téléchargée avec succès!';
                statusMsg.className = 'mt-3 d-block small text-success';
            }
        } catch (error) {
            console.error('Erreur lors de la génération ZIP:', error);
            const statusMsg = document.getElementById('nodeExportStatusMsg');
            if (statusMsg) {
                statusMsg.textContent = 'Erreur lors de la génération ZIP: ' + error.message;
                statusMsg.className = 'mt-3 d-block small text-danger';
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