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
        console.log(">>> populateOutputsSection called with:", outputs);
        
        const container = document.getElementById('outputsList');
        if (!container) {
            console.warn("Outputs container not found");
            return;
        }

        container.innerHTML = '';

        if (!outputs || outputs.length === 0) {
            container.innerHTML = '<p class="text-muted">Aucune sortie enregistrée.</p>';
            return;
        }

        outputs.forEach((output, index) => {
            const outputElement = this.createOutputElement(output, index);
            container.appendChild(outputElement);
        });
    }

    createOutputElement(output, index) {
        const div = document.createElement('div');
        div.className = 'output-item mb-2 p-2 border rounded';
        
        div.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                    <h6 class="mb-1">${output.title || `Sortie ${index + 1}`}</h6>
                    <pre class="small mb-1" style="max-height: 100px; overflow-y: auto;">${output.content || 'Aucun contenu'}</pre>
                    ${output.type ? `<span class="badge badge-info">${output.type}</span>` : ''}
                </div>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-secondary" onclick="hostManager.modules.outputs.editOutput(${index})" title="Éditer">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="hostManager.modules.outputs.removeOutput(${index})" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
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

    editOutput(index) {
        console.log(`Editing output ${index}`);
    }

    removeOutput(index) {
        console.log(`Removing output ${index}`);
    }

    getOutputsData() {
        return this.outputsData || [];
    }
} 