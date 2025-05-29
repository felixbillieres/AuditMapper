/**
 * Gestionnaire de réseau (DÉSACTIVÉ - remplacé par NetworkMap)
 */

export class NetworkManager {
    constructor(hostManager) {
        this.hostManager = hostManager;
        this.network = null;
        this.nodes = null;
        this.edges = null;
        this.container = null;
    }

    initialize() {
        console.log(">>> NetworkManager.initialize: START (DISABLED)");
        // Module désactivé - NetworkMap prend le relais
        console.log(">>> NetworkManager.initialize: END (DISABLED)");
    }

    updateNetwork() {
        console.log(">>> NetworkManager.updateNetwork: START (DISABLED)");
        // Module désactivé - NetworkMap prend le relais
        console.log(">>> NetworkManager.updateNetwork: END (DISABLED)");
    }

    // Méthodes vides pour compatibilité
    addEdge() {}
    removeEdge() {}
    getNetworkData() { return { nodes: [], edges: [] }; }
}