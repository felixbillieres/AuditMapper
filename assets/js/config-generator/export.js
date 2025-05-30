/**
 * Config Generator - Module Export
 * Gestionnaire d'export et création d'archives
 */

window.ConfigExporter = class ConfigExporter {
    constructor(app) {
        this.app = app;
    }

    async init() {
        console.log('📦 Initialisation du module Export...');
    }

    async createArchive(formats) {
        try {
            // Créer une instance JSZip
            const zip = new JSZip();
            
            // Créer le dossier principal
            const mainFolder = zip.folder('pentest-configs');
            const timestamp = new Date().toISOString().split('T')[0];
            
            // Ajouter les configurations sélectionnées
            if (formats.includes('hosts')) {
                await this.addHostsConfig(mainFolder);
            }
            
            if (formats.includes('kerberos')) {
                await this.addKerberosConfig(mainFolder);
            }
            
            if (formats.includes('proxychains')) {
                await this.addProxyChainsConfig(mainFolder);
            }
            
            if (formats.includes('readme')) {
                await this.addReadme(mainFolder);
            }
            
            // Générer et télécharger l'archive
            const content = await zip.generateAsync({ type: 'blob' });
            this.downloadBlob(content, `pentest-configs-${timestamp}.zip`);
            
            return true;
        } catch (error) {
            console.error('❌ Erreur création archive:', error);
            throw error;
        }
    }

    async addHostsConfig(folder) {
        const hostsModule = this.app.getModule('hosts');
        if (hostsModule) {
            const content = await hostsModule.generateConfigForExport();
            if (content) {
                folder.file('hosts', content);
            }
        }
    }

    async addKerberosConfig(folder) {
        const kerberosModule = this.app.getModule('kerberos');
        if (kerberosModule) {
            const content = await kerberosModule.generateConfigForExport();
            if (content) {
                folder.file('krb5.conf', content);
            }
        }
    }

    async addProxyChainsConfig(folder) {
        const proxychainsModule = this.app.getModule('proxychains');
        if (proxychainsModule) {
            const content = await proxychainsModule.generateConfigForExport();
            if (content) {
                folder.file('proxychains.conf', content);
            }
        }
    }

    async addReadme(folder) {
        const readme = this.generateReadme();
        folder.file('README.md', readme);
    }

    generateReadme() {
        const timestamp = new Date().toLocaleString('fr-FR');
        return `# Configuration Pentest Package

Généré le: ${timestamp}

## Contenu

Ce package contient les fichiers de configuration générés par le Config Generator.

### Fichiers inclus

- \`hosts\` - Fichier /etc/hosts avec les systèmes découverts
- \`krb5.conf\` - Configuration Kerberos pour l'authentification AD
- \`proxychains.conf\` - Configuration ProxyChains pour le tunneling

### Utilisation

1. **Hosts File**: Copiez le contenu dans votre \`/etc/hosts\`
   \`\`\`bash
   sudo cp hosts /etc/hosts
   \`\`\`

2. **Kerberos**: Copiez la configuration Kerberos
   \`\`\`bash
   sudo cp krb5.conf /etc/krb5.conf
   \`\`\`

3. **ProxyChains**: Copiez la configuration ProxyChains
   \`\`\`bash
   cp proxychains.conf ~/.proxychains/proxychains.conf
   \`\`\`

## Notes

- Vérifiez et adaptez les configurations selon votre environnement
- Testez les configurations avant utilisation en production
- Assurez-vous d'avoir les permissions nécessaires

---
Généré par Config Generator - Pentest Tools Suite
`;
    }

    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
} 