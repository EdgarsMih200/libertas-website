/* SNIEGS — krītošas sniegpārslas sākumlapā no novembra līdz februārim (nov., dec., janv., febr.).
   Pārbaudei jebkurā dienā: ?sniegs=1. Svētku klases (html.ziemassvetki, html.svetku-dienas, html.ballite)
   tagad iestata sezona.js (<head>, visās lapās). */
(function () {
    var menesis = new Date().getMonth(); // 0 = janvāris
    var q = location.search;

    var ziema = menesis === 10 || menesis === 11 || menesis === 0 || menesis === 1;
    if (!ziema && !/[?&]sniegs=1\b/.test(q)) return;
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var canvas = document.createElement('canvas');
    canvas.className = 'snow-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');

    var platums, augstums, parslas = [];
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    function izmers() {
        platums = window.innerWidth;
        augstums = window.innerHeight;
        canvas.width = platums * dpr;
        canvas.height = augstums * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        // Maz pārslu (≤ 36), uz šauriem ekrāniem vēl mazāk
        var skaits = Math.round(Math.min(36, platums / 40));
        while (parslas.length < skaits) parslas.push(jaunaParsla(true));
        parslas.length = skaits;
    }

    // Plakanā stila pārsla: mīksts apaļš punkts. Dziļums d (0…1): tuvākās lielākas, gaišākas un krīt ātrāk
    function jaunaParsla(jebkurAugstums) {
        var d = Math.random();
        return {
            x: Math.random() * platums,
            y: jebkurAugstums ? Math.random() * augstums : -10,
            r: 1.6 + d * 2.8,
            atr: 0.25 + d * 0.45,
            sv: Math.random() * Math.PI * 2,
            svAtr: 0.006 + Math.random() * 0.008,
            alfa: 0.55 + d * 0.4
        };
    }

    function zimetParslu(p) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        // papīra baltums (--c-season-snow) ar vieglu meža ēnu, lai redzama arī uz gaišā fona
        ctx.fillStyle = 'rgba(244, 241, 234, ' + p.alfa + ')';
        ctx.shadowColor = 'rgba(47, 74, 64, 0.35)';
        ctx.shadowBlur = 2;
        ctx.fill();
    }

    var pedejais = 0;
    function kadrs(t) {
        var dt = pedejais ? Math.min((t - pedejais) / 16.7, 3) : 1;
        pedejais = t;
        ctx.clearRect(0, 0, platums, augstums);
        for (var i = 0; i < parslas.length; i++) {
            var p = parslas[i];
            p.y += p.atr * dt;
            p.sv += p.svAtr * dt;
            p.x += Math.sin(p.sv) * 0.3 * dt;
            if (p.y > augstums + 10 || p.x < -10 || p.x > platums + 10) {
                parslas[i] = jaunaParsla(false);
                continue;
            }
            zimetParslu(p);
        }
        requestAnimationFrame(kadrs);
    }

    window.addEventListener('resize', izmers);
    izmers();
    requestAnimationFrame(kadrs);
})();
