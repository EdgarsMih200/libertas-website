document.addEventListener('DOMContentLoaded', function() {
    const exploreBtn = document.getElementById('exploreBtn');
    
    if (exploreBtn) {
        exploreBtn.addEventListener('click', function(e) {
            // Ja poga nav piesaistīta citai lapai, parāda paziņojumu
            if (this.getAttribute('href') === '#' || !this.getAttribute('href')) {
                e.preventDefault();
                alert('Paldies par interesi! Drīz šeit būs pieejams pieteikšanās logs.');
            }
        });
    }
});