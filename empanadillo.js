/* EMPANADILLO — Libertas talismans (maza empanada), kas sveicina apmeklētājus.
   Stūrī lapas apakšā; pirmajā apmeklējumā sesijā pats pasaka sveicienu.
   Klikšķis uz viņa — nākamā frāze. Nov./dec. (html.ziemassvetki) viņam ir Ziemassvētku cepure. */
(function () {
    var svetki = document.documentElement.classList.contains('ziemassvetki');

    var sveiciens = svetki
        ? '¡Feliz Navidad! Es esmu <b>Empanadillo</b>. Laipni lūdzam Libertas!'
        : '¡Hola! Es esmu <b>Empanadillo</b>. Laipni lūdzam Libertas!';
    var frazes = [
        'Apskati mūsu kursus zemāk: spāņu un angļu valoda A1!',
        'Vai zināji? Spāniski <i>empanar</i> nozīmē „ietīt mīklā”. Tāds esmu es!',
        'Runā, saproti, ceļo, audz! Es palīdzēšu tev sākt.',
        '¡Hasta luego! Uz tikšanos nodarbībās!'
    ];

    // Gofrētā mala (repulgue) gar empanadas loku
    function mala() {
        var s = '';
        var n = 15;
        for (var i = 0; i <= n; i++) {
            var a = Math.PI + (Math.PI * i) / n;
            var x = 60 + 47 * Math.cos(a);
            var y = 72 + 52 * Math.sin(a);
            var rot = (a * 180) / Math.PI + 90;
            s += '<ellipse cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="5.2" ry="7.5" transform="rotate(' +
                rot.toFixed(1) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"/>';
        }
        return s;
    }

    var svg =
        '<svg viewBox="0 -14 124 106" aria-hidden="true" focusable="false">' +
        '<defs><radialGradient id="empa-mikla" cx=".45" cy=".35" r=".75">' +
        '<stop offset="0" stop-color="#F7CF7A"/><stop offset=".6" stop-color="#E3A64A"/><stop offset="1" stop-color="#BF7F2A"/>' +
        '</radialGradient></defs>' +
        '<ellipse cx="60" cy="88" rx="38" ry="4" fill="#000" opacity=".12"/>' +
        // Kājas
        '<ellipse cx="46" cy="82" rx="7" ry="4.5" fill="#A8692A"/><ellipse cx="74" cy="82" rx="7" ry="4.5" fill="#A8692A"/>' +
        // Kreisā roka
        '<path d="M16 64 Q4 66 3 76" stroke="#C98A35" stroke-width="6" fill="none" stroke-linecap="round"/>' +
        '<circle cx="3" cy="77" r="4.5" fill="#E3A64A"/>' +
        // Labā roka (māj)
        '<g class="empa-roka"><path d="M104 62 Q116 56 118 42" stroke="#C98A35" stroke-width="6" fill="none" stroke-linecap="round"/>' +
        '<circle cx="118" cy="40" r="5" fill="#E3A64A"/></g>' +
        // Ķermenis
        '<path d="M8 76 C8 40 30 18 60 18 C90 18 112 40 112 76 Q60 84 8 76Z" fill="url(#empa-mikla)" stroke="#A8692A" stroke-width="1.5"/>' +
        '<g fill="#EDB75E" stroke="#B87A2E" stroke-width="1">' + mala() + '</g>' +
        // Cepti plankumiņi
        '<g fill="#B87A2E" opacity=".35"><ellipse cx="30" cy="66" rx="3" ry="2"/><ellipse cx="92" cy="68" rx="3.5" ry="2"/><ellipse cx="84" cy="36" rx="2.5" ry="1.6"/></g>' +
        // Seja
        '<g class="empa-acis">' +
        '<ellipse cx="46" cy="50" rx="7" ry="8" fill="#fff"/><ellipse cx="74" cy="50" rx="7" ry="8" fill="#fff"/>' +
        '<circle cx="47.5" cy="51.5" r="4.2" fill="#3A2416"/><circle cx="75.5" cy="51.5" r="4.2" fill="#3A2416"/>' +
        '<circle cx="49" cy="49.5" r="1.5" fill="#fff"/><circle cx="77" cy="49.5" r="1.5" fill="#fff"/>' +
        '</g>' +
        '<path d="M39 40 Q45 36 51 39 M69 39 Q75 36 81 40" stroke="#7A4A22" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '<ellipse cx="36" cy="62" rx="5.5" ry="3.5" fill="#E86A5C" opacity=".45"/><ellipse cx="84" cy="62" rx="5.5" ry="3.5" fill="#E86A5C" opacity=".45"/>' +
        '<path d="M51 61 Q60 73 69 61 Q60 65 51 61Z" fill="#8E1C17"/>' +
        '<path d="M55 66 Q60 70 65 66 Q60 64 55 66Z" fill="#E86A5C"/>' +
        // Ziemassvētku cepure (redzama tikai nov./dec.)
        '<g class="empa-cepure">' +
        '<path d="M38 26 Q50 -8 96 -6 L82 22Z" fill="#B3261E"/>' +
        '<path d="M60 8 Q74 -4 90 -5" stroke="#8E1C17" stroke-width="2" fill="none" opacity=".5"/>' +
        '<rect x="34" y="18" width="52" height="11" rx="5.5" fill="#fff" transform="rotate(-8 60 23)"/>' +
        '<circle cx="97" cy="-5" r="6" fill="#fff"/>' +
        '</g>' +
        '</svg>';

    var wrap = document.createElement('div');
    wrap.className = 'empanadillo';
    wrap.innerHTML =
        '<div class="empa-burbulis" role="status" aria-live="polite" hidden>' +
        '<button type="button" class="empa-aizvert" aria-label="Aizvērt">&times;</button>' +
        '<p class="empa-teksts"></p></div>' +
        '<button type="button" class="empa-poga" aria-label="Empanadillo, Libertas talismans: parunāt">' + svg + '</button>';
    document.body.appendChild(wrap);

    var burbulis = wrap.querySelector('.empa-burbulis');
    var teksts = wrap.querySelector('.empa-teksts');
    var poga = wrap.querySelector('.empa-poga');
    var taimeris = null;
    var nakama = 0;

    function maj() {
        wrap.classList.remove('maj');
        void wrap.offsetWidth; // atsāk animāciju
        wrap.classList.add('maj');
    }

    function runat(html) {
        teksts.innerHTML = html;
        burbulis.hidden = false;
        maj();
        clearTimeout(taimeris);
        taimeris = setTimeout(kluset, 9000);
    }

    function kluset() {
        burbulis.hidden = true;
    }

    poga.addEventListener('click', function () {
        runat(frazes[nakama]);
        nakama = (nakama + 1) % frazes.length;
    });
    poga.addEventListener('mouseenter', maj);
    wrap.querySelector('.empa-aizvert').addEventListener('click', kluset);

    // Ienāk lapā; sveicina vienreiz sesijā
    setTimeout(function () {
        wrap.classList.add('ieradies');
        var jauSveicinats = false;
        try { jauSveicinats = sessionStorage.getItem('empaSveiciens') === '1'; } catch (e) {}
        if (!jauSveicinats) {
            setTimeout(function () { runat(sveiciens); }, 700);
            try { sessionStorage.setItem('empaSveiciens', '1'); } catch (e) {}
        }
    }, 800);
})();
