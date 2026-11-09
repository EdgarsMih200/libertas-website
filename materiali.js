// Noderīgi materiāli: izrunas pogas (🔊) elementiem ar data-es, izmantojot pārlūka runas sintēzi
(function () {
    if (!('speechSynthesis' in window)) return;

    var balss = null;
    function izveletiesBalsi() {
        var balsis = speechSynthesis.getVoices();
        balss = balsis.find(function (b) { return b.lang === 'es-ES'; }) ||
                balsis.find(function (b) { return b.lang && b.lang.indexOf('es') === 0; }) || null;
    }
    izveletiesBalsi();
    speechSynthesis.addEventListener('voiceschanged', izveletiesBalsi);

    function runat(teksts) {
        speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(teksts);
        u.lang = 'es-ES';
        u.rate = 0.85;
        if (balss) u.voice = balss;
        speechSynthesis.speak(u);
    }

    document.querySelectorAll('[data-es]').forEach(function (el) {
        var teksts = el.getAttribute('data-es');
        var poga = document.createElement('button');
        poga.type = 'button';
        poga.className = 'runat-poga';
        poga.textContent = '🔊';
        poga.setAttribute('aria-label', 'Klausīties: ' + teksts);
        poga.title = 'Klausīties izrunu';
        poga.addEventListener('click', function () { runat(teksts); });
        // Tabulas rindā poga iet pirmajā šūnā
        var vieta = el.tagName === 'TR' ? el.cells[0] : el;
        vieta.insertBefore(poga, vieta.firstChild);
    });
})();
