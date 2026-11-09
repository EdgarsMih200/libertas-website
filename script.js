document.addEventListener('DOMContentLoaded', function() {
    // Pieteikšanās pogas (hero un kursu kartītes): kamēr nav pieteikšanās lapas, parāda paziņojumu
    document.querySelectorAll('a.btn-cta').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#' || !this.getAttribute('href')) {
                e.preventDefault();
                alert('Paldies par interesi! Drīz šeit būs pieejams pieteikšanās logs.');
            }
        });
    });
});
