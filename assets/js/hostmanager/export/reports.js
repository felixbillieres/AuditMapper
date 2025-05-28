/**
 * Gestionnaire de génération de rapports
 */

export class ReportGenerator {
    constructor(hostManager) {
        this.hostManager = hostManager;
    }

    initialize() {
        console.log(">>> ReportGenerator.initialize: START");
        this.setupEventListeners();
        console.log(">>> ReportGenerator.initialize: END");
    }

    setupEventListeners() {
        const generateKillchainBtn = document.getElementById('generateKillchainBtn');
        if (generateKillchainBtn) {
            generateKillchainBtn.addEventListener('click', () => this.generateKillchainReport());
        }
    }

    generateKillchainReport() {
        console.log(">>> generateKillchainReport: START");
        
        const hostData = this.hostManager.getData();
        let report = "# Rapport Killchain\n\n";
        
        report += "## Résumé Exécutif\n\n";
        report += this.generateExecutiveSummary(hostData);
        
        report += "\n## Détails par Catégorie\n\n";
        
        for (const categoryName in hostData.categories) {
            const category = hostData.categories[categoryName];
            if (!category.hosts) continue;
            
            report += `### ${categoryName}\n\n`;
            
            for (const hostId in category.hosts) {
                const host = category.hosts[hostId];
                report += this.generateHostSection(host, hostId);
            }
        }
        
        this.displayReport(report);
        console.log(">>> generateKillchainReport: END");
    }

    generateExecutiveSummary(hostData) {
        let summary = "";
        let totalHosts = 0;
        let compromisedHosts = 0;
        
        for (const categoryName in hostData.categories) {
            const category = hostData.categories[categoryName];
            if (!category.hosts) continue;
            
            for (const hostId in category.hosts) {
                totalHosts++;
                const host = category.hosts[hostId];
                if (host.compromiseLevel && host.compromiseLevel !== 'None') {
                    compromisedHosts++;
                }
            }
        }
        
        summary += `- **Nombre total d'hôtes**: ${totalHosts}\n`;
        summary += `- **Hôtes compromis**: ${compromisedHosts}\n`;
        summary += `- **Taux de compromission**: ${totalHosts > 0 ? Math.round((compromisedHosts / totalHosts) * 100) : 0}%\n`;
        
        return summary;
    }

    generateHostSection(host, hostId) {
        let section = `#### ${hostId}\n\n`;
        
        section += `- **Système**: ${host.system || 'N/A'}\n`;
        section += `- **Rôle**: ${host.role || 'N/A'}\n`;
        section += `- **Zone**: ${host.zone || 'N/A'}\n`;
        section += `- **Niveau de compromission**: ${host.compromiseLevel || 'None'}\n`;
        
        if (host.notes) {
            section += `\n**Notes**:\n${host.notes}\n`;
        }
        
        if (host.exploitationSteps && host.exploitationSteps.length > 0) {
            section += `\n**Étapes d'exploitation**:\n`;
            const sortedSteps = host.exploitationSteps.sort((a, b) => (a.order || 0) - (b.order || 0));
            sortedSteps.forEach(step => {
                section += `${step.order}. **${step.title}**\n`;
                if (step.content) {
                    section += `   ${step.content.replace(/\n/g, '\n   ')}\n`;
                }
            });
        }
        
        section += '\n---\n\n';
        return section;
    }

    displayReport(report) {
        const previewTextarea = document.getElementById('killchainReportPreview');
        const renderedPreview = document.getElementById('killchainReportRenderedPreview');
        
        if (previewTextarea) {
            previewTextarea.value = report;
        }
        
        if (renderedPreview && typeof marked !== 'undefined') {
            const htmlContent = marked.parse(report);
            if (typeof DOMPurify !== 'undefined') {
                renderedPreview.innerHTML = DOMPurify.sanitize(htmlContent);
            } else {
                renderedPreview.innerHTML = htmlContent;
            }
        }
    }
} 