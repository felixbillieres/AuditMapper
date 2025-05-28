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
        console.log(">>> populateCredentialsSection: START");
        this.credentialsData = credentials || [];
        
        const container = document.getElementById('editCredentialsContainer');
        if (!container) return;

        container.innerHTML = '';

        if (this.credentialsData.length === 0) {
            container.innerHTML = '<p class="text-muted small">Aucun credential enregistré.</p>';
            return;
        }

        this.credentialsData.forEach((cred, index) => {
            const credDiv = this.createCredentialElement(cred, index);
            container.appendChild(credDiv);
        });

        console.log(">>> populateCredentialsSection: END");
    }

    createCredentialElement(credential, index) {
        const div = document.createElement('div');
        div.className = 'credential-group mb-3 p-3 border rounded';
        
        div.innerHTML = `
            <div class="row">
                <div class="col-md-4">
                    <label>Username:</label>
                    <input type="text" class="form-control form-control-sm credential-username" value="${credential.username || ''}" data-index="${index}">
                </div>
                <div class="col-md-4">
                    <label>Password:</label>
                    <input type="text" class="form-control form-control-sm credential-password" value="${credential.password || ''}" data-index="${index}">
                </div>
                <div class="col-md-3">
                    <label>Hash:</label>
                    <input type="text" class="form-control form-control-sm credential-hash" value="${credential.hash || ''}" data-index="${index}">
                </div>
                <div class="col-md-1 d-flex align-items-end">
                    <button type="button" class="btn btn-danger btn-sm" onclick="hostManager.modules.credentials.removeCredential(${index})">×</button>
                </div>
            </div>
        `;

        return div;
    }

    addCredential() {
        this.credentialsData.push({ username: '', password: '', hash: '' });
        this.populateCredentialsSection(this.credentialsData);
    }

    removeCredential(index) {
        this.credentialsData.splice(index, 1);
        this.populateCredentialsSection(this.credentialsData);
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