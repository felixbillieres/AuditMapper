document.addEventListener('DOMContentLoaded', function() {
    // Gestion des onglets
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Désactiver tous les onglets
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Activer l'onglet sélectionné
            button.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Gestion des sections collapsibles
    const collapsibles = document.querySelectorAll('.collapsible h3');
    
    collapsibles.forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const parent = header.parentElement;
            
            parent.classList.toggle('collapsed');
            
            // Mettre à jour l'icône
            const icon = header.querySelector('.toggle-icon');
            if (parent.classList.contains('collapsed')) {
                icon.textContent = '►';
            } else {
                icon.textContent = '▼';
            }
        });
    });
    
    // Gestion des onglets de sortie
    const outputTabs = document.querySelectorAll('.output-tab');
    const outputFormats = document.querySelectorAll('.output-format');
    
    outputTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const format = tab.getAttribute('data-format');
            
            // Désactiver tous les onglets
            outputTabs.forEach(t => t.classList.remove('active'));
            outputFormats.forEach(f => f.classList.remove('active'));
            
            // Activer l'onglet sélectionné
            tab.classList.add('active');
            document.getElementById(format + 'Wordlist').classList.add('active');
        });
    });
    
    // Password Parser Heaven
    const passPolicyOutput = document.getElementById('passPolicyOutput');
    const passwordPolicyDetected = document.getElementById('passwordPolicyDetected');
    const filterWordlistBtn = document.getElementById('filterWordlist');
    const wordlistInput = document.getElementById('wordlistInput');
    const filterResults = document.getElementById('filterResults');
    const validWordlist = document.getElementById('validWordlist');
    const invalidWordlist = document.getElementById('invalidWordlist');
    const totalPasswords = document.getElementById('totalPasswords');
    const validPasswords = document.getElementById('validPasswords');
    const invalidPasswords = document.getElementById('invalidPasswords');
    const copyFilteredWordlistBtn = document.getElementById('copyFilteredWordlist');
    const downloadFilteredWordlistBtn = document.getElementById('downloadFilteredWordlist');
    
    // Détecter la politique de mots de passe à partir de l'output
    passPolicyOutput.addEventListener('input', () => {
        const output = passPolicyOutput.value;
        if (output.trim() === '') {
            passwordPolicyDetected.innerHTML = "<p>Aucune politique détectée. Veuillez coller une sortie de commande de politique de mots de passe.</p>";
            return;
        }
        
        // Analyse de la sortie pour détecter la politique
        const policy = parsePasswordPolicy(output);
        
        // Mettre à jour l'affichage de la politique
        if (policy) {
            const policyHTML = `
                <div class="policy-item">
                    <strong>Longueur minimale:</strong> ${policy.minLength} caractères
                </div>
                <div class="policy-item">
                    <strong>Majuscules requises:</strong> ${policy.requireUppercase ? 'Oui' : 'Non'}
                </div>
                <div class="policy-item">
                    <strong>Minuscules requises:</strong> ${policy.requireLowercase ? 'Oui' : 'Non'}
                </div>
                <div class="policy-item">
                    <strong>Chiffres requis:</strong> ${policy.requireDigits ? 'Oui' : 'Non'}
                </div>
                <div class="policy-item">
                    <strong>Caractères spéciaux requis:</strong> ${policy.requireSpecialChars ? 'Oui' : 'Non'}
                </div>
                <div class="policy-item">
                    <strong>Historique de mots de passe:</strong> ${policy.passwordHistory}
                </div>
            `;
            passwordPolicyDetected.innerHTML = policyHTML;
            
            // Mettre à jour les champs manuels
            document.getElementById('minLength').value = policy.minLength;
            document.getElementById('requireUppercase').checked = policy.requireUppercase;
            document.getElementById('requireLowercase').checked = policy.requireLowercase;
            document.getElementById('requireDigits').checked = policy.requireDigits;
            document.getElementById('requireSpecialChars').checked = policy.requireSpecialChars;
            document.getElementById('passwordHistory').value = policy.passwordHistory;
        } else {
            passwordPolicyDetected.innerHTML = "<p>Impossible de détecter une politique de mots de passe. Veuillez configurer manuellement.</p>";
        }
    });
    
    // Filtrer la wordlist en fonction de la politique
    filterWordlistBtn.addEventListener('click', () => {
        const wordlist = wordlistInput.value.trim().split('\n').filter(p => p.trim() !== '');
        
        if (wordlist.length === 0) {
            alert('Veuillez entrer une wordlist à filtrer.');
            return;
        }
        
        // Récupérer la politique configurée
        const policy = {
            minLength: parseInt(document.getElementById('minLength').value),
            maxLength: parseInt(document.getElementById('maxLength').value),
            requireUppercase: document.getElementById('requireUppercase').checked,
            requireLowercase: document.getElementById('requireLowercase').checked,
            requireDigits: document.getElementById('requireDigits').checked,
            requireSpecialChars: document.getElementById('requireSpecialChars').checked,
            passwordHistory: parseInt(document.getElementById('passwordHistory').value)
        };
        
        // Filtrer la wordlist
        const { valid, invalid } = filterWordlistByPolicy(wordlist, policy);
        
        // Afficher les résultats
        validWordlist.textContent = valid.join('\n');
        invalidWordlist.textContent = invalid.join('\n');
        
        totalPasswords.textContent = wordlist.length;
        validPasswords.textContent = valid.length;
        invalidPasswords.textContent = invalid.length;
        
        filterResults.style.display = 'block';
    });
    
    // Copier la wordlist filtrée
    copyFilteredWordlistBtn.addEventListener('click', () => {
        const activeTab = document.querySelector('.output-tab.active').getAttribute('data-format');
        const text = (activeTab === 'valid') ? validWordlist.textContent : invalidWordlist.textContent;
        
        navigator.clipboard.writeText(text)
            .then(() => {
                const originalText = copyFilteredWordlistBtn.textContent;
                copyFilteredWordlistBtn.textContent = 'Copié !';
                setTimeout(() => {
                    copyFilteredWordlistBtn.textContent = originalText;
                }, 2000);
            })
            .catch(err => {
                console.error('Erreur lors de la copie: ', err);
                alert('Impossible de copier le texte');
            });
    });
    
    // Télécharger la wordlist filtrée
    downloadFilteredWordlistBtn.addEventListener('click', () => {
        const activeTab = document.querySelector('.output-tab.active').getAttribute('data-format');
        const text = (activeTab === 'valid') ? validWordlist.textContent : invalidWordlist.textContent;
        
        const filename = (activeTab === 'valid') ? 'valid_passwords.txt' : 'invalid_passwords.txt';
        const blob = new Blob([text], { type: 'text/plain' });
        
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
    });
    
    // Générateur de mots de passe
    const generatePasswordsBtn = document.getElementById('generatePasswords');
    const passwordResults = document.getElementById('passwordResults');
    const generatedPasswordsList = document.getElementById('generatedPasswordsList');
    const generatedPasswordCount = document.getElementById('generatedPasswordCount');
    const copyGeneratedPasswordsBtn = document.getElementById('copyGeneratedPasswords');
    const downloadGeneratedPasswordsBtn = document.getElementById('downloadGeneratedPasswords');
    
    generatePasswordsBtn.addEventListener('click', () => {
        // Récupérer les paramètres de génération
        const baseWords = document.getElementById('baseWords').value.split(',').map(w => w.trim()).filter(w => w !== '');
        const minLength = parseInt(document.getElementById('genMinLength').value);
        const maxLength = parseInt(document.getElementById('genMaxLength').value);
        const includeLowercase = document.getElementById('includeLowercase').checked;
        const includeUppercase = document.getElementById('includeUppercase').checked;
        const includeDigits = document.getElementById('includeDigits').checked;
        const includeSpecial = document.getElementById('includeSpecial').checked;
        const includeYears = document.getElementById('includeYears').checked;
        const yearStart = parseInt(document.getElementById('yearStart').value);
        const yearEnd = parseInt(document.getElementById('yearEnd').value);
        const includePaddingDigits = document.getElementById('includePaddingDigits').checked;
        const leetSpeak = document.getElementById('leetSpeak').checked;
        const maxResults = parseInt(document.getElementById('maxResults').value);
        
        if (baseWords.length === 0 && !(includeLowercase || includeUppercase || includeDigits || includeSpecial)) {
            alert('Veuillez entrer des mots de base ou activer au moins un type de caractères pour la génération aléatoire.');
            return;
        }
        
        const options = {
            minLength,
            maxLength,
            includeLowercase,
            includeUppercase,
            includeDigits,
            includeSpecial,
            includeYears,
            yearStart,
            yearEnd,
            includePaddingDigits,
            leetSpeak,
            maxResults
        };
        
        // Générer les mots de passe
        const passwords = generatePasswords(
            baseWords,
            options
        );
        
        // Afficher les résultats
        generatedPasswordsList.textContent = passwords.join('\n');
        generatedPasswordCount.textContent = passwords.length;
        
        passwordResults.style.display = 'block';
    });
    
    // Copier les mots de passe générés
    copyGeneratedPasswordsBtn.addEventListener('click', () => {
        const text = generatedPasswordsList.textContent;
        
        navigator.clipboard.writeText(text)
            .then(() => {
                const originalText = copyGeneratedPasswordsBtn.textContent;
                copyGeneratedPasswordsBtn.textContent = 'Copié !';
                setTimeout(() => {
                    copyGeneratedPasswordsBtn.textContent = originalText;
                }, 2000);
            })
            .catch(err => {
                console.error('Erreur lors de la copie: ', err);
                alert('Impossible de copier le texte');
            });
    });
    
    // Télécharger les mots de passe générés
    downloadGeneratedPasswordsBtn.addEventListener('click', () => {
        const text = generatedPasswordsList.textContent;
        
        const filename = `generated_passwords.txt`;
        const blob = new Blob([text], { type: 'text/plain' });
        
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
    });
    
    // Générateur d'identifiants
    const generateUsernamesBtn = document.getElementById('generateUsernames');
    const usernameResults = document.getElementById('usernameResults');
    const generatedUsernamesList = document.getElementById('generatedUsernamesList');
    const generatedUsernameCount = document.getElementById('generatedUsernameCount');
    const copyGeneratedUsernamesBtn = document.getElementById('copyGeneratedUsernames');
    const downloadGeneratedUsernamesBtn = document.getElementById('downloadGeneratedUsernames');
    
    // Gestion des onglets de saisie pour le générateur d'identifiants
    const inputTabs = document.querySelectorAll('.input-tab');
    const inputPanels = document.querySelectorAll('.input-panel');

    inputTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const inputType = tab.getAttribute('data-input');
            
            // Désactiver tous les onglets
            inputTabs.forEach(t => t.classList.remove('active'));
            inputPanels.forEach(p => p.classList.remove('active'));
            
            // Activer l'onglet sélectionné
            tab.classList.add('active');
            document.getElementById(inputType + 'Input').classList.add('active');
        });
    });

    // Chargement des wordlists préinstallées
    const presetWordlistsSelect = document.getElementById('presetWordlists');
    const loadPresetWordlistBtn = document.getElementById('loadPresetWordlist');
    const wordlistLoading = document.getElementById('wordlistLoading');

    const wordlistUrls = {
        'rockyou': '/assets/wordlists/rockyou-sample.txt',
        'fasttrack': '/assets/wordlists/fasttrack.txt',
        'unix_passwords': '/assets/wordlists/unix_passwords.txt',
        'darkweb2017': '/assets/wordlists/darkweb2017-top100.txt',
        '500-worst-passwords': '/assets/wordlists/500-worst-passwords.txt',
        'cirt-default': '/assets/wordlists/cirt-default-passwords.txt',
        'common_roots': '/assets/wordlists/common-roots.txt'
    };

    loadPresetWordlistBtn.addEventListener('click', () => {
        const selected = presetWordlistsSelect.value;
        
        if (!selected) {
            alert('Veuillez sélectionner une wordlist dans la liste.');
            return;
        }
        
        const url = wordlistUrls[selected];
        
        if (!url) {
            alert('URL de wordlist invalide.');
            return;
        }
        
        // Afficher l'indicateur de chargement
        wordlistLoading.style.display = 'block';
        
        // Charger la wordlist
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erreur lors du chargement de la wordlist.');
                }
                return response.text();
            })
            .then(text => {
                // Insérer la wordlist dans le textarea
                wordlistInput.value = text;
                
                // Mettre à jour les statistiques
                const lines = text.split('\n').filter(line => line.trim() !== '');
                alert(`Wordlist chargée avec succès ! ${lines.length} mots de passe importés.`);
            })
            .catch(error => {
                alert('Erreur: ' + error.message);
            })
            .finally(() => {
                // Masquer l'indicateur de chargement
                wordlistLoading.style.display = 'none';
            });
    });

    // Amélioration du générateur d'identifiants pour traiter les entrées en masse
    generateUsernamesBtn.addEventListener('click', () => {
        let firstNames = [];
        let lastNames = [];
        
        // Vérifier le mode d'entrée actif
        const activePanel = document.querySelector('.input-panel.active').id;
        
        if (activePanel === 'manualInput') {
            // Mode saisie manuelle
            firstNames = document.getElementById('firstNames').value.split(',').map(n => n.trim()).filter(n => n !== '');
            lastNames = document.getElementById('lastNames').value.split(',').map(n => n.trim()).filter(n => n !== '');
            
            if (firstNames.length === 0 || lastNames.length === 0) {
                alert('Veuillez entrer au moins un prénom et un nom de famille.');
                return;
            }
        } else {
            // Mode saisie en masse
            const bulkNames = document.getElementById('bulkNames').value.trim();
            if (!bulkNames) {
                alert('Veuillez entrer des noms dans la zone de texte.');
                return;
            }
            
            const bulkFormat = document.querySelector('input[name="bulkFormat"]:checked').value;
            const nameLines = bulkNames.split('\n').map(line => line.trim()).filter(line => line !== '');
            
            // Extraire les prénoms et noms selon le format
            const parsedNames = parseBulkNames(nameLines, bulkFormat);
            firstNames = parsedNames.firstNames;
            lastNames = parsedNames.lastNames;
            
            if (firstNames.length === 0 || lastNames.length === 0) {
                alert('Impossible d\'extraire des prénoms et noms valides. Vérifiez le format des données.');
                return;
            }
        }
        
        const domainName = document.getElementById('domainName').value.trim();
        
        const formats = {
            firstLast: document.getElementById('formatFirstLast').checked,
            firstDotLast: document.getElementById('formatFirstDotLast').checked,
            firstInitialLast: document.getElementById('formatFirstInitialLast').checked,
            first: document.getElementById('formatFirst').checked,
            last: document.getElementById('formatLast').checked,
            lastFirst: document.getElementById('formatLastFirst').checked,
            lastInitialFirst: document.getElementById('formatLastInitialFirst').checked
        };
        
        const options = {
            addEmailDomain: document.getElementById('addEmailDomain').checked,
            complexity: document.getElementById('usernameComplexity').value
        };
        
        // Générer les identifiants
        const usernames = generateUsernames(firstNames, lastNames, domainName, formats, options);
        
        // Afficher les résultats
        generatedUsernamesList.textContent = usernames.join('\n');
        generatedUsernameCount.textContent = usernames.length;
        
        usernameResults.style.display = 'block';
    });

    // Fonction pour analyser les noms en masse
    function parseBulkNames(nameLines, format) {
        const firstNames = [];
        const lastNames = [];
        
        nameLines.forEach(line => {
            if (format === 'mixed') {
                // Détection automatique du format
                if (line.includes(',')) {
                    // Format "Nom, Prénom"
                    const parts = line.split(',').map(part => part.trim());
                    if (parts.length >= 2) {
                        lastNames.push(parts[0]);
                        firstNames.push(parts[1]);
                    }
                } else {
                    // Essayer de déterminer si c'est "Prénom Nom" ou "Nom Prénom"
                    const parts = line.split(/\s+/);
                    if (parts.length >= 2) {
                        // Pour simplifier, nous supposons que le format le plus courant est "Prénom Nom"
                        firstNames.push(parts[0]);
                        lastNames.push(parts[parts.length - 1]);
                    }
                }
            } else if (format === 'firstLast') {
                // Format "Prénom Nom"
                const parts = line.split(/\s+/);
                if (parts.length >= 2) {
                    firstNames.push(parts[0]);
                    lastNames.push(parts[parts.length - 1]);
                }
            } else if (format === 'lastFirst') {
                // Format "Nom Prénom"
                const parts = line.split(/\s+/);
                if (parts.length >= 2) {
                    lastNames.push(parts[0]);
                    firstNames.push(parts[parts.length - 1]);
                }
            } else if (format === 'lastCommaFirst') {
                // Format "Nom, Prénom"
                const parts = line.split(',').map(part => part.trim());
                if (parts.length >= 2) {
                    lastNames.push(parts[0]);
                    firstNames.push(parts[1]);
                }
            }
        });
        
        return { firstNames, lastNames };
    }
    
    // Fonction pour générer des mots de passe basés sur des mots de base et des options
    function generatePasswords(baseWords, options) {
        let passwords = [];
        
        // Si des mots de base sont fournis, les utiliser comme point de départ
        if (baseWords.length > 0) {
            passwords = [...baseWords];
            
            // Appliquer des transformations aux mots de base
            let transformedPasswords = [];
            
            // Ajouter des années si demandé
            if (options.includeYears) {
                for (const password of passwords) {
                    for (let year = options.yearStart; year <= options.yearEnd; year++) {
                        transformedPasswords.push(password + year);
                    }
                }
            }
            
            // Ajouter des chiffres de padding si demandé
            if (options.includePaddingDigits) {
                for (const password of passwords) {
                    for (let i = 0; i <= 999; i++) {
                        // Ajouter des chiffres de 0 à 999
                        const paddedDigits = i.toString().padStart(i > 99 ? 3 : (i > 9 ? 2 : 1), '0');
                        transformedPasswords.push(password + paddedDigits);
                    }
                }
            }
            
            // Combiner les mots de passe originaux et transformés
            passwords = passwords.concat(transformedPasswords);
            
            // Appliquer le leet speak si demandé
            if (options.leetSpeak) {
                const leetPasswords = [];
                for (const password of passwords) {
                    leetPasswords.push(applyLeetSpeak(password));
                }
                passwords = passwords.concat(leetPasswords);
            }
        }
        // Sinon, générer des mots de passe aléatoires
        else {
            const chars = [];
            if (options.includeLowercase) chars.push(...'abcdefghijklmnopqrstuvwxyz');
            if (options.includeUppercase) chars.push(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
            if (options.includeDigits) chars.push(...'0123456789');
            if (options.includeSpecial) chars.push(...'!@#$%^&*()_-+=<>?');
            
            if (chars.length === 0) {
                return passwords;
            }
            
            // Générer des mots de passe aléatoires
            const count = Math.min(options.maxResults || 1000, 1000); // Limiter à 1000 mots de passe maximum
            for (let i = 0; i < count; i++) {
                const length = Math.floor(Math.random() * (options.maxLength - options.minLength + 1)) + options.minLength;
                let password = '';
                for (let j = 0; j < length; j++) {
                    password += chars[Math.floor(Math.random() * chars.length)];
                }
                passwords.push(password);
            }
        }
        
        // Filtrer les mots de passe par longueur
        passwords = passwords.filter(p => 
            p.length >= options.minLength && 
            (options.maxLength === 0 || p.length <= options.maxLength)
        );
        
        // Limiter le nombre de résultats si demandé
        if (options.maxResults > 0 && passwords.length > options.maxResults) {
            passwords = passwords.slice(0, options.maxResults);
        }
        
        return passwords;
    }
    
    // Fonction pour appliquer le leet speak
    function applyLeetSpeak(text) {
        const leetMap = {
            'a': '4',
            'e': '3',
            'i': '1',
            'o': '0',
            's': '5',
            't': '7',
            'l': '1',
            'b': '8',
            'g': '9'
        };
        
        return text.split('').map(char => leetMap[char.toLowerCase()] || char).join('');
    }
    
    // Fonction pour générer des identifiants d'utilisateurs
    function generateUsernames(firstNames, lastNames, domainName, formats, options) {
        let usernames = [];
        
        for (const firstName of firstNames) {
            for (const lastName of lastNames) {
                // Préparer les variations de base
                const first = firstName.toLowerCase();
                const last = lastName.toLowerCase();
                const firstInitial = first.charAt(0);
                
                // Appliquer les formats sélectionnés
                if (formats.firstLast) {
                    usernames.push(`${first}.${last}`);
                }
                
                if (formats.firstDotLast) {
                    usernames.push(`${firstInitial}.${last}`);
                }
                
                if (formats.firstInitialLast) {
                    usernames.push(`${firstInitial}${last}`);
                }
                
                if (formats.first) {
                    usernames.push(first);
                }
                
                if (formats.last) {
                    usernames.push(last);
                }
                
                if (formats.lastFirst) {
                    usernames.push(`${last}.${first}`);
                }
                
                if (formats.lastInitialFirst) {
                    usernames.push(`${last}${firstInitial}`);
                }
                
                // Ajouter des variantes avec des chiffres pour le niveau de complexité moyen
                if (options.complexity === 'medium' || options.complexity === 'advanced') {
                    const baseUsernames = [...usernames];
                    for (const username of baseUsernames) {
                        for (let i = 0; i <= 99; i++) {
                            usernames.push(`${username}${i}`);
                        }
                    }
                }
                
                // Ajouter des variantes plus complexes pour le niveau avancé
                if (options.complexity === 'advanced') {
                    // Ajouter des années
                    const baseUsernames = [...usernames];
                    for (const username of baseUsernames) {
                        for (let year = 2000; year <= 2025; year++) {
                            usernames.push(`${username}${year}`);
                        }
                    }
                    
                    // Ajouter des variantes avec des underscores
                    if (formats.firstLast) {
                        usernames.push(`${first}_${last}`);
                    }
                    
                    if (formats.lastFirst) {
                        usernames.push(`${last}_${first}`);
                    }
                }
            }
        }
        
        // Ajouter le domaine pour les emails si nécessaire
        if (options.addEmailDomain && domainName) {
            const baseUsernames = [...usernames];
            usernames = baseUsernames.map(username => `${username}@${domainName}`);
        }
        
        // Éliminer les doublons
        usernames = [...new Set(usernames)];
        
        return usernames;
    }
}); 