/* SNIEGS — krītošas sniegpārslas sākumlapā no novembra līdz februārim (nov., dec., janv., febr.).
   Ziemassvētku rotājumi (html.ziemassvetki) — tikai decembrī; sveiciens "Priecīgus Ziemassvētkus!"
   (html.svetku-dienas) — tikai 22.–26. decembrī.
   Pārbaudei jebkurā dienā: ?sniegs=1 (sniegs), ?ziemassvetki=1 (rotājumi), ?sveiciens=1 (rotājumi + sveiciens) */
(function () {
    var sodien = new Date();
    var menesis = sodien.getMonth(); // 0 = janvāris
    var diena = sodien.getDate();
    var q = location.search;
    var html = document.documentElement;
    var sveiciens = (menesis === 11 && diena >= 22 && diena <= 26) || /[?&]sveiciens=1\b/.test(q);
    if (menesis === 11 || sveiciens || /[?&]ziemassvetki=1\b/.test(q)) html.classList.add('ziemassvetki');
    if (sveiciens) html.classList.add('svetku-dienas');

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
        // Mazāk pārslu uz maziem ekrāniem
        var skaits = Math.round(Math.min(45, platums / 30));
        while (parslas.length < skaits) parslas.push(jaunaParsla(true));
        parslas.length = skaits;
    }

    function jaunaParsla(jebkurAugstums) {
        return {
            x: Math.random() * platums,
            y: jebkurAugstums ? Math.random() * augstums : -20,
            r: 5 + Math.random() * 8,
            atr: 0.4 + Math.random() * 0.8,
            sv: Math.random() * Math.PI * 2,
            rot: Math.random() * Math.PI,
            rotAtr: (Math.random() - 0.5) * 0.02,
            alfa: 0.6 + Math.random() * 0.4
        };
    }

    // Sešstaru sniegpārsla: stari ar diviem zariņu pāriem
    function zimetParslu(p) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.beginPath();
        for (var s = 0; s < 6; s++) {
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -p.r);
            for (var z = 1; z <= 2; z++) {
                var y = -p.r * (0.3 + z * 0.22);
                var g = p.r * (0.38 - z * 0.1);
                ctx.moveTo(0, y);
                ctx.lineTo(-g, y - g);
                ctx.moveTo(0, y);
                ctx.lineTo(g, y - g);
            }
            ctx.rotate(Math.PI / 3);
        }
        ctx.lineWidth = Math.max(1, p.r / 7);
        ctx.lineCap = 'round';
        // Balta pārsla ar ēnu, lai redzama arī uz gaišā fona
        ctx.strokeStyle = 'rgba(255, 255, 255, ' + p.alfa + ')';
        ctx.shadowColor = 'rgba(60, 80, 110, 0.6)';
        ctx.shadowBlur = 3;
        ctx.stroke();
        ctx.restore();
    }

    var pedejais = 0;
    function kadrs(t) {
        var dt = pedejais ? Math.min((t - pedejais) / 16.7, 3) : 1;
        pedejais = t;
        ctx.clearRect(0, 0, platums, augstums);
        for (var i = 0; i < parslas.length; i++) {
            var p = parslas[i];
            p.y += p.atr * dt;
            p.sv += 0.01 * dt;
            p.x += Math.sin(p.sv) * 0.4 * dt;
            p.rot += p.rotAtr * dt;
            if (p.y > augstums + 20 || p.x < -20 || p.x > platums + 20) {
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
