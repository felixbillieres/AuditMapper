document.addEventListener('DOMContentLoaded', function() {
    const nxcOutputElement = document.getElementById('nxcOutput');
    const includeCommentsCheckbox = document.getElementById('includeComments');
    const includeHeaderCheckbox = document.getElementById('includeHeader');
    const includeDomainOnlyCheckbox = document.getElementById('includeDomainOnly');
    const generateHostsButton = document.getElementById('generateHosts');
    const hostsOutputSection = document.getElementById('hostsOutput');
    const hostsContentElement = document.getElementById('hostsContent');
    const copyHostsButton = document.getElementById('copyHosts');
    
    // Fonction pour générer les entrées /etc/hosts
    function generateHostsEntries() {
        const nxcOutput = nxcOutputElement.value.trim();
        if (!nxcOutput) {
            alert('Veuillez coller la sortie de votre scan nxc.');
            return;
        }
        
        // Initialiser le contenu avec un en-tête si demandé
        let hostsContent = '';
        if (includeHeaderCheckbox.checked) {
            hostsContent += '# Entrées générées par Pentesting Template Generator\n';
            hostsContent += '# Date: ' + new Date().toLocaleString() + '\n\n';
        }
        
        // Traiter chaque ligne
        const lines = nxcOutput.split('\n');
        const uniqueEntries = new Map(); // Pour éviter les doublons
        const domainMap = new Map(); // Pour conserver les domaines
        
        for (const line of lines) {
            // Chercher le format typique de la sortie nxc smb
            // SMB 192.168.1.101 445 DC2012A [*] Windows ... (name:DC2012A) (domain:OCEAN) ...
            const parts = line.trim().split(/\s+/);
            
            // Vérifier si la ligne a le format attendu (au moins 5 parties)
            if (parts.length >= 5 && parts[0] === 'SMB') {
                const ip = parts[1];
                const hostname = parts[3];
                
                // Extraire le domaine avec une expression régulière
                const domainMatch = line.match(/\(domain:([^)]+)\)/);
                const domain = domainMatch ? domainMatch[1].trim().toUpperCase() : '';
                
                // Vérifier si cette IP a déjà été traitée
                if (!uniqueEntries.has(ip)) {
                    let entry = '';
                    
                    // Ajouter un commentaire si demandé
                    if (includeCommentsCheckbox.checked) {
                        const osInfo = line.match(/\[\*\]([^(]+)/);
                        const osInfoText = osInfo ? osInfo[1].trim() : 'Unknown';
                        entry += `# ${hostname} - ${osInfoText}\n`;
                    }
                    
                    // Ajouter l'entrée principale
                    if (domain) {
                        entry += `${ip}\t${hostname}.${domain} ${hostname}\n`;
                        
                        // Conserver le domaine pour une entrée supplémentaire si demandé
                        if (includeDomainOnlyCheckbox.checked) {
                            if (!domainMap.has(domain)) {
                                domainMap.set(domain, ip);
                            }
                        }
                    } else {
                        entry += `${ip}\t${hostname}\n`;
                    }
                    
                    uniqueEntries.set(ip, entry);
                }
            }
        }
        
        // Ajouter toutes les entrées au contenu
        for (const entry of uniqueEntries.values()) {
            hostsContent += entry;
        }
        
        // Ajouter les entrées de domaine seules si demandé
        if (includeDomainOnlyCheckbox.checked && domainMap.size > 0) {
            hostsContent += '\n# Entrées de domaine\n';
            for (const [domain, ip] of domainMap.entries()) {
                hostsContent += `${ip}\t${domain}\n`;
            }
        }
        
        // Afficher le résultat
        hostsContentElement.textContent = hostsContent;
        hostsOutputSection.style.display = 'block';
    }
    
    // Fonction pour copier le contenu généré
    function copyHostsContent() {
        const content = hostsContentElement.textContent;
        
        navigator.clipboard.writeText(content)
            .then(() => {
                alert('Entrées /etc/hosts copiées dans le presse-papier !');
            })
            .catch(err => {
                console.error('Erreur lors de la copie:', err);
                // Alternative pour les navigateurs qui ne supportent pas clipboard API
                const textarea = document.createElement('textarea');
                textarea.value = content;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                alert('Entrées /etc/hosts copiées dans le presse-papier !');
            });
    }
    
    // Attacher les gestionnaires d'événements
    if (generateHostsButton) {
        generateHostsButton.addEventListener('click', generateHostsEntries);
    }
    
    if (copyHostsButton) {
        copyHostsButton.addEventListener('click', copyHostsContent);
    }
}); 