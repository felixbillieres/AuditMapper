document.addEventListener('DOMContentLoaded', function() {
    // Éléments du DOM
    const outputTypeSelect = document.getElementById('outputType');
    const rawOutputElement = document.getElementById('rawOutput');
    const extractUsersBtn = document.getElementById('extractUsers');
    const extractHashesBtn = document.getElementById('extractHashes');
    const extractPasswordsBtn = document.getElementById('extractPasswords');
    const extractIpsBtn = document.getElementById('extractIps');
    const extractEmailsBtn = document.getElementById('extractEmails');
    const extractionOutputSection = document.getElementById('extractionOutput');
    const extractionTitleElement = document.getElementById('extractionTitle');
    const extractionCountElement = document.getElementById('extractionCount');
    const extractionContentElement = document.getElementById('extractionContent');
    const copyExtractionBtn = document.getElementById('copyExtraction');
    const saveExtractionBtn = document.getElementById('saveExtraction');
    
    // Configurer les accordéons
    const accordions = document.querySelectorAll('.accordion-header');
    accordions.forEach(accordion => {
        accordion.addEventListener('click', function() {
            this.classList.toggle('active');
            const content = this.nextElementSibling;
            if (content.style.display === 'block') {
                content.style.display = 'none';
            } else {
                content.style.display = 'block';
            }
        });
    });
    
    // Fonction pour extraire les utilisateurs
    function extractUsers() {
        const outputType = outputTypeSelect.value;
        const rawOutput = rawOutputElement.value.trim();
        
        if (!rawOutput) {
            alert('Veuillez coller un output à analyser.');
            return;
        }
        
        let users = [];
        const lines = rawOutput.split('\n');
        
        switch (outputType) {
            case 'secretsdump':
            case 'sam':
                // Format: username:RID:LM:NT:::
                lines.forEach(line => {
                    const match = line.match(/^([^:]+):\d+:/);
                    if (match && match[1]) {
                        users.push(match[1]);
                    }
                });
                break;
                
            case 'rpcclient':
                // Format: user:[0xXXX] rid:0xXXX User: username
                lines.forEach(line => {
                    const match = line.match(/User: (.+?)$/);
                    if (match && match[1]) {
                        users.push(match[1].trim());
                    }
                });
                break;
                
            case 'ldap':
                // Chercher plusieurs formats communs de LDAP
                lines.forEach(line => {
                    let match = line.match(/sAMAccountName: (.+?)$/);
                    if (match && match[1]) {
                        users.push(match[1].trim());
                    } else {
                        match = line.match(/uid=([^,]+)/);
                        if (match && match[1]) {
                            users.push(match[1].trim());
                        }
                    }
                });
                break;
                
            case 'passwd':
                // Format: username:x:UID:GID:Comment:Home:Shell
                lines.forEach(line => {
                    if (!line.startsWith('#')) {
                        const parts = line.split(':');
                        if (parts.length >= 7 && parts[0]) {
                            users.push(parts[0]);
                        }
                    }
                });
                break;
                
            case 'shadow':
                // Format: username:encoded_password:...
                lines.forEach(line => {
                    if (!line.startsWith('#')) {
                        const parts = line.split(':');
                        if (parts.length >= 2 && parts[0]) {
                            users.push(parts[0]);
                        }
                    }
                });
                break;
                
            case 'lsass':
                // Cherche plusieurs patterns typiques de lsass
                lines.forEach(line => {
                    const match = line.match(/Username\s*:\s*(.+?)$/i) || 
                                 line.match(/User\s*:\s*(.+?)$/i);
                    if (match && match[1]) {
                        users.push(match[1].trim());
                    }
                });
                break;
                
            case 'generic':
                // Tente d'identifier tous les noms d'utilisateur possibles
                const userPatterns = [
                    /user(?:name)?[=:]\s*["']?([^"',\s]+)/i,
                    /(?:^|\s)(?:u|user|username):\s*(.+?)(?:\s|$)/i,
                    /login[=:]\s*["']?([^"',\s]+)/i
                ];
                
                lines.forEach(line => {
                    for (const pattern of userPatterns) {
                        const match = line.match(pattern);
                        if (match && match[1]) {
                            users.push(match[1].trim());
                        }
                    }
                });
                break;
        }
        
        // Filtrer les doublons et trier
        users = [...new Set(users)].sort();
        
        // Afficher les résultats
        displayResults(users, 'Utilisateurs extraits');
    }
    
    // Fonction pour extraire les hashes
    function extractHashes() {
        const outputType = outputTypeSelect.value;
        const rawOutput = rawOutputElement.value.trim();
        
        if (!rawOutput) {
            alert('Veuillez coller un output à analyser.');
            return;
        }
        
        let hashes = [];
        const lines = rawOutput.split('\n');
        
        switch (outputType) {
            case 'secretsdump':
            case 'sam':
                // Format: username:RID:LM:NT:::
                lines.forEach(line => {
                    const parts = line.split(':');
                    if (parts.length >= 4) {
                        const username = parts[0];
                        const ntHash = parts[3];
                        if (ntHash && ntHash !== 'aad3b435b51404eeaad3b435b51404ee') {
                            // Format hashcat: hash:user
                            hashes.push(`${ntHash}:${username}`);
                        }
                    }
                });
                break;
                
            case 'lsass':
                // Recherche de hashes NTLM/NTLMv2 typiques
                const ntlmPatterns = [
                    /NTLM\s*:\s*([a-fA-F0-9]{32})/i,
                    /Hash\s*:\s*([a-fA-F0-9]{32})/i
                ];
                
                lines.forEach(line => {
                    for (const pattern of ntlmPatterns) {
                        const match = line.match(pattern);
                        if (match && match[1]) {
                            const usernameMatch = line.match(/Username\s*:\s*(.+?)$/i) ||
                                                line.match(/User\s*:\s*(.+?)$/i);
                            const username = usernameMatch ? usernameMatch[1].trim() : 'unknown';
                            hashes.push(`${match[1]}:${username}`);
                        }
                    }
                });
                break;
                
            case 'hashcat':
                // Format: hash:password
                lines.forEach(line => {
                    const parts = line.split(':');
                    if (parts.length >= 1) {
                        const hash = parts[0].trim();
                        if (/^[a-fA-F0-9]{32}$/.test(hash)) {
                            hashes.push(hash);
                        }
                    }
                });
                break;
                
            case 'shadow':
                // Format: username:encoded_password:...
                lines.forEach(line => {
                    if (!line.startsWith('#')) {
                        const parts = line.split(':');
                        if (parts.length >= 2 && parts[1] && parts[1] !== '*' && parts[1] !== '!') {
                            hashes.push(`${parts[1]}:${parts[0]}`);
                        }
                    }
                });
                break;
                
            case 'generic':
                // Cherche des hashes MD5, SHA1, NT, etc.
                const hashPatterns = [
                    /\b([a-fA-F0-9]{32})\b/g,  // MD5/NT hash
                    /\b([a-fA-F0-9]{40})\b/g,  // SHA1 hash
                    /\b([a-fA-F0-9]{64})\b/g   // SHA256 hash
                ];
                
                lines.forEach(line => {
                    for (const pattern of hashPatterns) {
                        let match;
                        while ((match = pattern.exec(line)) !== null) {
                            hashes.push(match[1]);
                        }
                    }
                });
                break;
        }
        
        // Filtrer les doublons
        hashes = [...new Set(hashes)];
        
        // Afficher les résultats
        displayResults(hashes, 'Hashes extraits');
    }
    
    // Fonction pour extraire les mots de passe
    function extractPasswords() {
        const outputType = outputTypeSelect.value;
        const rawOutput = rawOutputElement.value.trim();
        
        if (!rawOutput) {
            alert('Veuillez coller un output à analyser.');
            return;
        }
        
        let passwords = [];
        const lines = rawOutput.split('\n');
        
        switch (outputType) {
            case 'hashcat':
                // Format: hash:password
                lines.forEach(line => {
                    const parts = line.split(':');
                    if (parts.length >= 2) {
                        // Tout après le premier : est considéré comme mot de passe
                        const password = parts.slice(1).join(':').trim();
                        if (password) {
                            passwords.push(password);
                        }
                    }
                });
                break;
                
            case 'lsass':
                // Cherche les mots de passe en clair dans lsass
                const passwordPatterns = [
                    /Password\s*:\s*(.+?)$/i,
                    /ClearText\s*:\s*(.+?)$/i
                ];
                
                lines.forEach(line => {
                    for (const pattern of passwordPatterns) {
                        const match = line.match(pattern);
                        if (match && match[1] && match[1].trim() !== '(null)') {
                            passwords.push(match[1].trim());
                        }
                    }
                });
                break;
                
            case 'generic':
                // Tente d'identifier tous les mots de passe possibles
                const pwdPatterns = [
                    /pass(?:word)?[=:]\s*["']?([^"',\s]+)/i,
                    /pwd[=:]\s*["']?([^"',\s]+)/i,
                    /password is ["']([^"']+)["']/i
                ];
                
                lines.forEach(line => {
                    for (const pattern of pwdPatterns) {
                        const match = line.match(pattern);
                        if (match && match[1]) {
                            passwords.push(match[1].trim());
                        }
                    }
                });
                break;
        }
        
        // Filtrer les doublons
        passwords = [...new Set(passwords)];
        
        // Afficher les résultats
        displayResults(passwords, 'Mots de passe extraits');
    }
    
    // Fonction pour extraire les adresses IP
    function extractIps() {
        const rawOutput = rawOutputElement.value.trim();
        
        if (!rawOutput) {
            alert('Veuillez coller un output à analyser.');
            return;
        }
        
        // Regex pour IPv4
        const ipv4Regex = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;
        
        // Regex pour IPv6 (simplifiée)
        const ipv6Regex = /\b(?:[A-F0-9]{1,4}:){7}[A-F0-9]{1,4}\b/gi;
        
        let ips = [];
        let match;
        
        // Trouver toutes les IPv4
        while ((match = ipv4Regex.exec(rawOutput)) !== null) {
            ips.push(match[0]);
        }
        
        // Trouver toutes les IPv6
        while ((match = ipv6Regex.exec(rawOutput)) !== null) {
            ips.push(match[0]);
        }
        
        // Filtrer les doublons
        ips = [...new Set(ips)];
        
        // Afficher les résultats
        displayResults(ips, 'Adresses IP extraites');
    }
    
    // Fonction pour extraire les emails
    function extractEmails() {
        const rawOutput = rawOutputElement.value.trim();
        
        if (!rawOutput) {
            alert('Veuillez coller un output à analyser.');
            return;
        }
        
        // Regex pour les emails
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        
        let emails = [];
        let match;
        
        // Trouver tous les emails
        while ((match = emailRegex.exec(rawOutput)) !== null) {
            emails.push(match[0]);
        }
        
        // Filtrer les doublons
        emails = [...new Set(emails)];
        
        // Afficher les résultats
        displayResults(emails, 'Adresses email extraites');
    }
    
    // Fonction pour afficher les résultats
    function displayResults(results, title) {
        extractionTitleElement.textContent = title;
        extractionCountElement.textContent = `${results.length} élément(s) trouvé(s)`;
        
        if (results.length > 0) {
            extractionContentElement.textContent = results.join('\n');
            extractionOutputSection.style.display = 'block';
        } else {
            extractionContentElement.textContent = 'Aucun élément trouvé.';
            extractionOutputSection.style.display = 'block';
        }
    }
    
    // Fonction pour copier les résultats
    function copyExtractionContent() {
        const content = extractionContentElement.textContent;
        
        navigator.clipboard.writeText(content)
            .then(() => {
                alert('Contenu copié dans le presse-papier !');
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
                alert('Contenu copié dans le presse-papier !');
            });
    }
    
    // Fonction pour télécharger les résultats
    function saveExtractionContent() {
        const content = extractionContentElement.textContent;
        const outputType = outputTypeSelect.value;
        const extractionType = extractionTitleElement.textContent.split(' ')[0].toLowerCase();
        
        // Créer un nom de fichier basé sur le type d'extraction
        const filename = `${extractionType}_${outputType}_${new Date().toISOString().slice(0, 10)}.txt`;
        
        // Créer un objet Blob
        const blob = new Blob([content], { type: 'text/plain' });
        
        // Créer un URL pour le Blob
        const url = URL.createObjectURL(blob);
        
        // Créer un élément a pour le téléchargement
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        
        // Cliquer sur le lien pour déclencher le téléchargement
        document.body.appendChild(a);
        a.click();
        
        // Nettoyer
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
    }
    
    // Attacher les gestionnaires d'événements
    if (extractUsersBtn) extractUsersBtn.addEventListener('click', extractUsers);
    if (extractHashesBtn) extractHashesBtn.addEventListener('click', extractHashes);
    if (extractPasswordsBtn) extractPasswordsBtn.addEventListener('click', extractPasswords);
    if (extractIpsBtn) extractIpsBtn.addEventListener('click', extractIps);
    if (extractEmailsBtn) extractEmailsBtn.addEventListener('click', extractEmails);
    if (copyExtractionBtn) copyExtractionBtn.addEventListener('click', copyExtractionContent);
    if (saveExtractionBtn) saveExtractionBtn.addEventListener('click', saveExtractionContent);
}); 