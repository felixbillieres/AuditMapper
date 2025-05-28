/**
 * Gestionnaire des credentials
 */

export class CredentialManager {
    constructor(hostManager) {
        this.hostManager = hostManager;
        this.credentialsData = [];
    }

    initialize() {
        console.log(">>> CredentialManager.initialize: START");
        this.setupEventListeners();
        console.log(">>> CredentialManager.initialize: END");
    }

    setupEventListeners() {
        const addCredentialBtn = document.getElementById('addCredentialBtn');
        if (addCredentialBtn) {
            addCredentialBtn.addEventListener('click', () => this.addCredential());
        }
    }

    populateCredentialsSection(credentials) {
        console.log(">>> populateCredentialsSection called with:", credentials);
        
        const container = document.getElementById('credentialsList');
        if (!container) {
            console.warn("Credentials container not found");
            return;
        }

        container.innerHTML = '';

        if (!credentials || credentials.length === 0) {
            container.innerHTML = '<p class="text-muted">Aucun identifiant enregistré.</p>';
            return;
        }

        credentials.forEach((credential, index) => {
            const credElement = this.createCredentialElement(credential, index);
            container.appendChild(credElement);
        });
    }

    createCredentialElement(credential, index) {
        const div = document.createElement('div');
        div.className = 'credential-item mb-2 p-2 border rounded';
        
        div.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                    <strong>${credential.username || 'N/A'}</strong>
                    <span class="text-muted">: ${credential.password ? '••••••••' : 'Pas de mot de passe'}</span>
                    ${credential.type ? `<span class="badge badge-secondary ml-2">${credential.type}</span>` : ''}
                </div>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-secondary" onclick="hostManager.modules.credentials.editCredential(${index})" title="Éditer">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="hostManager.modules.credentials.removeCredential(${index})" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;

        return div;
    }

    addCredential() {
        console.log("Adding new credential");
    }

    editCredential(index) {
        console.log(`Editing credential ${index}`);
    }

    removeCredential(index) {
        console.log(`Removing credential ${index}`);
    }

    getCredentialsData() {
        const container = document.getElementById('editCredentialsContainer');
        if (!container) return [];

        const credentials = [];
        const credentialGroups = container.querySelectorAll('.credential-group');

        credentialGroups.forEach(group => {
            const username = group.querySelector('.credential-username')?.value || '';
            const password = group.querySelector('.credential-password')?.value || '';
            const hash = group.querySelector('.credential-hash')?.value || '';

            if (username || password || hash) {
                credentials.push({ username, password, hash });
            }
        });

        return credentials;
    }
} 