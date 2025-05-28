/**
 * Gestionnaire des outputs
 */

export class OutputManager {
    constructor(hostManager) {
        this.hostManager = hostManager;
        this.outputsData = [];
    }

    initialize() {
        console.log(">>> OutputManager.initialize: START");
        this.setupEventListeners();
        console.log(">>> OutputManager.initialize: END");
    }

    setupEventListeners() {
        const addOutputBtn = document.getElementById('addOutputBtn');
        if (addOutputBtn) {
            addOutputBtn.addEventListener('click', () => this.showOutputTypeSelection());
        }

        const cancelOutputTypeSelectionBtn = document.getElementById('cancelOutputTypeSelectionBtn');
        if (cancelOutputTypeSelectionBtn) {
            cancelOutputTypeSelectionBtn.addEventListener('click', () => this.hideOutputTypeSelection());
        }

        const saveNewOutputBtn = document.getElementById('saveNewOutputBtn');
        if (saveNewOutputBtn) {
            saveNewOutputBtn.addEventListener('click', () => this.saveNewOutput());
        }

        const cancelNewOutputBtn = document.getElementById('cancelNewOutputBtn');
        if (cancelNewOutputBtn) {
            cancelNewOutputBtn.addEventListener('click', () => this.hideNewOutputArea());
        }

        // Écouteurs pour les boutons de type d'output
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-output-type]')) {
                const outputType = e.target.getAttribute('data-output-type');
                this.showNewOutputArea(outputType);
            }
        });
    }

    populateOutputsSection(outputs) {
        console.log(">>> populateOutputsSection: START");
        this.outputsData = outputs || [];
        
        const container = document.getElementById('editOutputsContainer');
        const noOutputsMsg = container?.querySelector('.no-outputs-msg');
        
        if (!container) return;

        // Vider le container mais garder le message "no outputs"
        const children = Array.from(container.children);
        children.forEach(child => {
            if (!child.classList.contains('no-outputs-msg')) {
                child.remove();
            }
        });

        if (this.outputsData.length === 0) {
            if (noOutputsMsg) noOutputsMsg.style.display = 'block';
            return;
        }

        if (noOutputsMsg) noOutputsMsg.style.display = 'none';

        this.outputsData.forEach((output, index) => {
            const outputDiv = this.createOutputElement(output, index);
            container.appendChild(outputDiv);
        });

        console.log(">>> populateOutputsSection: END");
    }

    createOutputElement(output, index) {
        const div = document.createElement('div');
        div.className = 'output-item mb-3 p-3 border rounded';
        
        div.innerHTML = `
            <div class="d-flex justify-content-between align-items-start mb-2">
                <h6 class="mb-0">${output.type || 'Output'} ${output.subType ? `(${output.subType})` : ''}</h6>
                <button type="button" class="btn btn-danger btn-sm" onclick="hostManager.modules.outputs.removeOutput(${index})">Supprimer</button>
            </div>
            <pre class="bg-light p-2 small" style="max-height: 200px; overflow-y: auto;">${output.content || ''}</pre>
        `;

        return div;
    }

    showOutputTypeSelection() {
        const typeSelection = document.getElementById('outputTypeSelection');
        if (typeSelection) {
            typeSelection.style.display = 'block';
        }
    }

    hideOutputTypeSelection() {
        const typeSelection = document.getElementById('outputTypeSelection');
        if (typeSelection) {
            typeSelection.style.display = 'none';
        }
    }

    showNewOutputArea(outputType) {
        this.hideOutputTypeSelection();
        
        const newOutputArea = document.getElementById('newOutputInputArea');
        const newOutputTitle = document.getElementById('newOutputTitle');
        const newOutputContentLabel = document.getElementById('newOutputContentLabel');
        const newOutputSubTypeGroup = document.getElementById('newOutputSubTypeGroup');
        
        if (newOutputArea) {
            newOutputArea.style.display = 'block';
            newOutputArea.dataset.outputType = outputType;
        }
        
        if (newOutputTitle) {
            newOutputTitle.textContent = `Ajouter un Output ${outputType}`;
        }
        
        if (newOutputContentLabel) {
            newOutputContentLabel.textContent = `Contenu ${outputType}:`;
        }

        // Afficher le champ subType pour les dumps
        if (newOutputSubTypeGroup) {
            newOutputSubTypeGroup.style.display = outputType === 'Dump' ? 'block' : 'none';
        }
    }

    hideNewOutputArea() {
        const newOutputArea = document.getElementById('newOutputInputArea');
        if (newOutputArea) {
            newOutputArea.style.display = 'none';
        }
        
        // Réinitialiser les champs
        const newOutputContent = document.getElementById('newOutputContent');
        const newOutputSubType = document.getElementById('newOutputSubType');
        if (newOutputContent) newOutputContent.value = '';
        if (newOutputSubType) newOutputSubType.value = '';
    }

    saveNewOutput() {
        const newOutputArea = document.getElementById('newOutputInputArea');
        const outputType = newOutputArea?.dataset.outputType;
        const content = document.getElementById('newOutputContent')?.value || '';
        const subType = document.getElementById('newOutputSubType')?.value || '';

        if (!content.trim()) {
            alert('Veuillez entrer du contenu pour l\'output.');
            return;
        }

        const newOutput = {
            type: outputType,
            content: content.trim(),
            timestamp: new Date().toISOString()
        };

        if (subType && outputType === 'Dump') {
            newOutput.subType = subType.trim();
        }

        this.outputsData.push(newOutput);
        this.populateOutputsSection(this.outputsData);
        this.hideNewOutputArea();
    }

    removeOutput(index) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cet output ?')) {
            this.outputsData.splice(index, 1);
            this.populateOutputsSection(this.outputsData);
        }
    }

    getOutputsData() {
        return this.outputsData || [];
    }
} 