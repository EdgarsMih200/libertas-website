/* ZVANIŅI — zelta zvaniņi uz egles zariem sākumlapā (nov./dec., kad html.ziemassvetki).
   Uzbraucot ar peli (vai pieskaroties), zvans nošūpojas un nozvana.
   Skaņa tiek sintezēta ar Web Audio API, tāpēc nav vajadzīgs skaņas fails.
   Pārlūki atļauj skaņu tikai pēc pirmā klikšķa/pieskāriena/taustiņa lapā. */
(function () {
    if (!document.documentElement.classList.contains('ziemassvetki')) return;
    var zvani = document.querySelectorAll('.zvans');
    if (!zvani.length) return;

    var AudioCtx = window.AudioContext || window.webkitAudioContext;
    var ctx = null;

    function audio() {
        if (!AudioCtx) return null;
        if (!ctx) {
            try { ctx = new AudioCtx(); } catch (e) { return null; }
        }
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
    }

    // Atbloķē skaņu pēc pirmās lietotāja darbības
    function atbloket() {
        audio();
        ['pointerdown', 'keydown', 'touchstart'].forEach(function (n) {
            window.removeEventListener(n, atbloket, true);
        });
    }
    ['pointerdown', 'keydown', 'touchstart'].forEach(function (n) {
        window.addEventListener(n, atbloket, true);
    });

    // Zvana skaņa: vairākas sinusa virsskaņas ar dažādu dzišanas laiku
    var virsskanas = [
        [0.5, 0.35, 2.4],
        [1, 1, 1.8],
        [1.19, 0.45, 1.2],
        [1.5, 0.3, 1.0],
        [2, 0.4, 0.8],
        [2.74, 0.25, 0.5],
        [3.76, 0.15, 0.35]
    ];

    function nozvanit(frekv) {
        var a = audio();
        if (!a) return;
        if (a.state !== 'running') {
            // Pirmais pieskāriens: skaņa vēl tiek ieslēgta — nozvana, kad gatava
            var ua = navigator.userActivation;
            if (ua && ua.isActive) a.resume().then(function () { skana(a, frekv); });
            return;
        }
        skana(a, frekv);
    }

    function skana(a, frekv) {
        var t = a.currentTime;
        var kopa = a.createGain();
        kopa.gain.value = 0.12;
        kopa.connect(a.destination);
        virsskanas.forEach(function (v) {
            var osc = a.createOscillator();
            var g = a.createGain();
            osc.type = 'sine';
            osc.frequency.value = frekv * v[0];
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(v[1], t + 0.004);
            g.gain.exponentialRampToValueAtTime(0.0001, t + v[2]);
            osc.connect(g);
            g.connect(kopa);
            osc.start(t);
            osc.stop(t + v[2] + 0.05);
        });
    }

    zvani.forEach(function (zv) {
        var frekv = parseFloat(zv.getAttribute('data-nots')) || 1046.5;
        var pedejais = 0;
        function zvanit() {
            var tagad = Date.now();
            if (tagad - pedejais < 350) return;
            pedejais = tagad;
            nozvanit(frekv);
            zv.classList.remove('zvana');
            void zv.offsetWidth; // atsāk animāciju
            zv.classList.add('zvana');
        }
        zv.addEventListener('pointerenter', zvanit);
        zv.addEventListener('click', zvanit);
        zv.addEventListener('animationend', function () {
            zv.classList.remove('zvana');
        });
    });
})();
