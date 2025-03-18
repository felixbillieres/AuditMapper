// Fichier de débogage indépendant
document.addEventListener('DOMContentLoaded', function() {
    console.log("DEBUG.JS: Document chargé");
    
    // Essai de fonction autonome
    function toggleBreachCredentials() {
        console.log("toggleBreachCredentials appelé");
        const assumedBreachCheckbox = document.getElementById('assumedBreach');
        const breachCredentials = document.getElementById('breachCredentials');
        
        if (assumedBreachCheckbox && breachCredentials) {
            breachCredentials.style.display = assumedBreachCheckbox.checked ? 'block' : 'none';
            console.log("Display set to:", breachCredentials.style.display);
        } else {
            console.error("Éléments non trouvés:", {
                assumedBreachCheckbox: !!assumedBreachCheckbox,
                breachCredentials: !!breachCredentials
            });
        }
    }
    
    // Attachement direct et explicite
    const assumedBreachCheckbox = document.getElementById('assumedBreach');
    if (assumedBreachCheckbox) {
        console.log("DEBUG.JS: Checkbox trouvée, attachement de l'événement");
        assumedBreachCheckbox.onclick = toggleBreachCredentials;
    } else {
        console.error("DEBUG.JS: Checkbox non trouvée!");
        
        // Liste tous les checkboxes sur la page pour le débogage
        const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');
        console.log("DEBUG.JS: Tous les checkboxes:", Array.from(allCheckboxes).map(cb => ({
            id: cb.id,
            name: cb.name
        })));
    }
}); 