document.addEventListener('DOMContentLoaded', function() {
    // Éléments DOM
    const osLinuxRadio = document.getElementById('osLinux');
    const osWindowsRadio = document.getElementById('osWindows');
    const linuxChecklist = document.getElementById('linuxChecklist');
    const windowsChecklist = document.getElementById('windowsChecklist');
    const showChecklistBtn = document.getElementById('showChecklist');
    const copyLinuxChecklistBtn = document.getElementById('copyLinuxChecklist');
    const copyWindowsChecklistBtn = document.getElementById('copyWindowsChecklist');
    
    // Fonction pour basculer entre les checklists Linux et Windows
    function toggleChecklist() {
        if (osLinuxRadio.checked) {
            linuxChecklist.style.display = 'block';
            windowsChecklist.style.display = 'none';
        } else {
            linuxChecklist.style.display = 'none';
            windowsChecklist.style.display = 'block';
        }
    }
    
    // Événement pour afficher la checklist
    if (showChecklistBtn) {
        showChecklistBtn.addEventListener('click', toggleChecklist);
    }
    
    // Événements pour les boutons radio du système d'exploitation
    if (osLinuxRadio) {
        osLinuxRadio.addEventListener('change', toggleChecklist);
    }
    
    if (osWindowsRadio) {
        osWindowsRadio.addEventListener('change', toggleChecklist);
    }
    
    // Fonction pour copier la checklist Linux
    if (copyLinuxChecklistBtn) {
        copyLinuxChecklistBtn.addEventListener('click', function() {
            const linuxContent = document.querySelector('#linuxChecklist .checklist-pre').textContent;
            copyToClipboard(linuxContent, 'Checklist Linux copiée !');
        });
    }
    
    // Fonction pour copier la checklist Windows
    if (copyWindowsChecklistBtn) {
        copyWindowsChecklistBtn.addEventListener('click', function() {
            const windowsContent = document.querySelector('#windowsChecklist .checklist-pre').textContent;
            copyToClipboard(windowsContent, 'Checklist Windows copiée !');
        });
    }
    
    // Fonction utilitaire pour copier du texte
    function copyToClipboard(text, successMessage) {
        navigator.clipboard.writeText(text)
            .then(() => {
                alert(successMessage);
            })
            .catch(err => {
                console.error('Erreur lors de la copie:', err);
                // Alternative pour les navigateurs qui ne supportent pas clipboard API
                const textarea = document.createElement('textarea');
                textarea.value = text;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                alert(successMessage);
            });
    }
}); 