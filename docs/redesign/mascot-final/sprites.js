/* EMPANADILLO CEĻOTĀJS — pikseļu sprites (3. solis, variants B "Traveller").
   Tas pats formāts kā empanadillo.js: katrs burts = viena krāsa no KRASAS, "." = caurspīdīgs.
   Ķermenis, acis un rokas ROKA_A/B ir pārkopēti no empanadillo.js bez izmaiņām (pikseli pa pikselim),
   tikai palete saskaņota ar jauno dizaina sistēmu. Koordinātas: ķermeņa (0,0) = tas pats, kas oriģinālā,
   tāpēc somu un nūju zīmē negatīvos x. Nekas šeit vēl nav pieslēgts lapai.

   Lietošana:  EMPA_SPRITES.svg('vicina', { frame: 0, hat: 'santa' })  ->  '<svg ...>'
               EMPA_SPRITES.pikseli(EMPA_SPRITES.KERMENIS, 0, 0)        ->  '<rect .../>...'          */
(function (root) {
    'use strict';

    // Palete: 13 bāzes krāsas + 5 tikai rekvizītiem (cepures, sviedru lāse).
    var KRASAS = {
        O: '#4A2810', // kontūra (silti brūna, nekad melna)
        F: '#8A5020', // kājas, nūjas ēna
        D: '#A8652A', // apcepta mala / garoza
        S: '#B8742E', // uzacis, plankumiņi
        M: '#D9963F', // vidējais mīklas tonis
        L: '#F0BE62', // mīkla
        H: '#FBE3A0', // izgaismojums, acs atspīdums
        W: '#FFFDF8', // acu baltums, karte (papīrs = --c-surface)
        K: '#2A1A10', // zīlītes
        P: '#E8796B', // vaigi + mēle (oriģinālā T apvienots ar P)
        R: '#6B1D1D', // mute, maršruts kartē, "?" (= --c-brand bordo)
        A: '#6E3F27', // āda: soma, siksna (tumša, vēsāka brūna; nesaduras ar ember #B4502A)
        V: '#A9BFA8', // salvija: guļammaiss, spieķa lente, kartes zeme
        // rekvizīti
        Z: '#A9C9DA', // sviedru lāse
        X: '#B23A2A', // Ziemassvētku cepure
        B: '#7E2620', // cepures ēna
        G: '#D9CFC0', // kažokādas ēna (= --c-line)
        Y: '#F2C46A'  // ballītes cepure (= --c-season-glow)
    };

    // ---- Ķermenis (no empanadillo.js, 34×25; rindas 0–2 tukšas) ----
    var KERMENIS_AUGSA = [
        '..................................',
        '..................................',
        '..................................',
        '............OOOOOOOOOO............',
        '..........OOHLDHLLHDLLOO..........',
        '........OODHLDHLDDLHDLLDOO........',
        '.......OLDHLDHLDHHDLLDLLDLO.......',
        '......OLDHLDHLLLLLLLLLDLLDMO......',
        '.....OLDHLDLLLLLLLLLLLLDLLDMO.....',
        '....OLDHLLHSSLLLLLLLLSSLLLMDMO....',
        '...OLDHLLHHLLLLLLLLLLLLLLLMMDMO...',
        '...ODHLDLLLLLLLLLLLLLLLLLLDMMDO...',
        '..ODHLDLLLLLLLLLLLLLLLLLMMMDMMDO..',
        '..OHLDLLLLLLLLLLLLLLLLLLMMMMDMMO..',
        '.OOLDLLLLLLLLLLLLLMMLLLLMMMMMDMMO.',
        'OLMOLLLLPPLLLLRMMMMRMLLMPPMMDMDMO.',
        'OMDOLLLLLLLLMMMRRRRMMMMMMSDDDMMDO.',
        '.OOMDLLSSLMMMMMRPPRMMMMDDDSDDDMMO.',
        '.OMDMLLMMMMMMSMMRRMMDDSDDDDDDMDMO.',
        '.ODMMMMMMMMMMMMMMDDDDDDDDDDDDMMDO.',
        '..OODDDDDDDDDDDDDDDDDDDDDDDDDDOO..',
        '....ODDDDDDDDDDDDDDDDDDDDDDDDO....',
        '.....OOOOOFFFFOOOOOOFFFFOOOOO.....'
    ];
    var KAJAS = [
        '.........OFFFFFO...OFFFFFO........',
        '..........OOOOO.....OOOOO.........'
    ];
    // Iešana (ielāde): viena pēda pacelta
    var KAJAS_SOLIS_A = [
        '..........OOOOO....OFFFFFO........',
        '....................OOOOO.........'
    ];
    var KAJAS_SOLIS_B = [
        '.........OFFFFFO....OOOOO.........',
        '..........OOOOO...................'
    ];
    var KERMENIS = KERMENIS_AUGSA.concat(KAJAS); // = oriģinālais KERMENIS

    // ---- Acis (no empanadillo.js) + skatiena varianti ----
    var ACIS = [
        '.WW........WW.',
        'WKKW......WKKW',
        'WHKW......WHKW',
        'WKKW......WKKW',
        '.WW........WW.'
    ];
    var ACIS_LEJA = [ // lasa karti
        '.WW........WW.',
        'WWWW......WWWW',
        'WHKW......WHKW',
        'WKKW......WKKW',
        '.KK........KK.'
    ];
    var ACIS_PA_LABI = [ // skatās uz pogu
        '.WW........WW.',
        'WWKK......WWKK',
        'WWHK......WWHK',
        'WWKK......WWKK',
        '.WW........WW.'
    ];

    // ---- Sejas ielāpi (zīmē virs ķermeņa) ----
    var UZACIS_APJUKUSI = [ // x11, y8: iekšējie gali uz augšu (tumšākas, lai redz)
        '.F........F.',
        'FL........LF'
    ];
    var MUTE_O = [ // x14, y15: maza "o" mute
        'LMMMMM',
        'MMRRMM',
        'MRPPRM',
        'MMRRMM'
    ];

    // ---- Labā roka (zīmē AIZ ķermeņa) ----
    var ROKA_A = ['...OO.', '..OLLO', '..OLMO', '...OMO', '..OMMO', '.OMMO.', 'OMMO..'];
    var ROKA_B = ['......OO', '.....OLLO', '.....OLMO', '....OMMO.', '...OMMO..', '..OMMO...', 'OMMMO....'];
    var ROKA_MIERS = [ // x31, y13: atslābināta roka gar sānu
        '.OO..',
        'OMMO.',
        'OMMO.',
        '.OMMO',
        '.OLLO',
        '..OO.'
    ];
    var ROKA_RADA = [ // x30, y12: izstiepta, rāda pa labi (uz pogu)
        '..OOOO....',
        '.OMMMLOOO.',
        'OMMMMLLLLO',
        'OMMMMLLOO.',
        '.OOOOOO...'
    ];

    // ---- Ceļotāja rekvizīti ----
    var MUGURSOMA = [ // x-6, y1: ādas soma ar salvijas guļammaisu (aiz ķermeņa, kreisajā pusē)
        '.OOOOOOOOOO.',
        'OVVAVVVVAVVO',
        'OVVAVVVVAVVO',
        '.OOOOOOOOOO.',
        '.OFFFFFFFO..',
        '.OFFFFFFFO..',
        '.OOOOLOOOO..',
        '.OAAALAAAO..',
        '.OAAAAAAAO..',
        '.OAAAAAAAO..',
        '.OAAAAAAAO..',
        '.OAAAAAAAO..',
        '.OAAAAAAAO..',
        '.OAAAAAAAO..',
        '.OAAAAAAAO..',
        '.OAAAAAAAO..',
        '.OAAAAAAAO..',
        '..OAAAAAO...',
        '...OOOOO....'
    ];
    var SIKSNA = [ // x3, y4: somas siksna pāri pleciem (zīmē VIRS ķermeņa, zem cepures)
        '.........AA',
        '........AA.',
        '.......AA..',
        '......AA...',
        '.....LA....',
        '....AL.....',
        '...AA......',
        '..AA.......',
        '.AA........',
        'AA.........'
    ];
    var NUJA = [ // x-9, y3: tievs spieķis ar salvijas lenti
        'OOO',
        'OHO',
        'OVO',
        'OVO',
        'ODO', 'ODO', 'ODO', 'ODO', 'ODO', 'ODO', 'ODO', 'ODO', 'ODO', 'ODO',
        'ODO', 'ODO', 'ODO', 'ODO', 'ODO', 'ODO', 'ODO',
        'OOO'
    ];
    var ROKA_K = [ // x-10, y8: kreisā roka slīpi no "austiņas" uz augšu līdz ķepai uz spieķa (aiz ķermeņa)
        '.OOO.......',
        'OLLLO......',
        'OLMMO......',
        'OMMMMO.....',
        '.OOMMMO....',
        '...OMMMO...',
        '....OMMMO..',
        '.....OMMMO.',
        '......OMMMO',
        '.......OOOO'
    ];
    var KARTE = [ // x7, y18: atvērta karte: papīrs, salvijas zeme, bordo maršruts līdz krustiņam, loce vidū
        'OOOOOOOOOOOOOOOOOOOO',
        'OWVVWWWWWGWWWWWRWRWO',
        'OVVVWWWRRGWRRWWWRWWO',
        'OWVWWRRWWGWWWVVRWRWO',
        'OWWRRWWWWGWWVVVVWWWO',
        'OOOOOOOOOOOOOOOOOOOO'
    ];
    var KEPAS_KARTE = [ // x5, y19: abas ķepas tur karti
        '.OO..................OO.',
        'OLLO................OLLO',
        'OMMO................OMMO',
        '.OO..................OO.'
    ];
    var SVIEDRI = ['.O..', 'OZO.', 'OZZO', 'OWZO', '.OO.'];
    var JAUTAJUMS = [
        '.RRR.',
        'R...R',
        '....R',
        '..RR.',
        '..R..',
        '.....',
        '..R..'
    ];

    // ---- Cepures (no empanadillo.js, krāsas saskaņotas) ----
    var CEPURE = [
        '...................OO..',
        '..................OWWO.',
        '...........OOOO..OWWWWO',
        '........OOOXXXXOOOWGWO.',
        '......OOXXXXXXXXXXBOO..',
        '.....OXXXXXXXXXXXBBO...',
        '....OXXXXXXXXXXXBBO....',
        '...OXXXXXXXXXXXXBO.....',
        '..OWWWWWWWWWWWWWWWO....',
        '.OWWWWWWWWWWWWWWGGGO...',
        '..OGGGGGGGGGGGGGGOO....',
        '...OOOOOOOOOOOOOO......'
    ];
    var BALLITES_CEPURE = [
        '.......OO.......',
        '......OYYO......',
        '.....OYYYYO.....',
        '......OYYO......',
        '......OPPO......',
        '.....OPPYYO.....',
        '.....OPYYVO.....',
        '....OPYYVVPO....',
        '....OYYVVPPO....',
        '...OYYVVPPYYO...',
        '...OYVVPPYYVO...',
        '..OYVVPPYYVVPO..',
        '..OVVPPYYVVPPO..',
        '.OVVPPYYVVPPYYO.',
        '..OOOOOOOOOOOO..'
    ];

    // ---- MAZAIS: vienkāršots 30×19 ķermenis stūra pogai (≤64 px). Bez nūjas, tikai maza soma. ----
    var MAZAIS_KERMENIS = [
        '..........OOOOOOOOOO..........',
        '........OOHLDHLLHDLLOO........',
        '......OODHLDHLDDLHDLLDOO......',
        '.....OLDHLDHLLLLLLLDLLDMO.....',
        '....OLDHLDLLLLLLLLLLDLLDMO....',
        '...OLDHLHSSLLLLLLLLSSLLMDMO...',
        '..OLDHLLHLLLLLLLLLLLLLLMMDMO..',
        '..ODHLDLLLLLLLLLLLLLLLMDMMDO..',
        '.ODHLDLLLLLLLLLLLLLLLLMMMDMDO.',
        '.OOLDLLLLLLLLLLLLLLLLMMMMDMMO.',
        'OLMOLLLLLLLLLLLLLLLLLMMMDMDMO.',
        'OMDOLLPPLLLLRMMMMRMMMMPPMDMDO.',
        '.OOMDLLLLLLLMRRRRMMMMMMSDDDMO.',
        '.OMDMLSSLMMMMRPPRMMMMDDDSDDMO.',
        '.ODMMMMMMMMMMMRRMMDDDDDDDMMDO.',
        '..OODDDDDDDDDDDDDDDDDDDDDDOO..',
        '....OOOOOFFFFOOOOFFFFOOOOO....',
        '........OFFFFFO.OFFFFFO.......',
        '.........OOOOO...OOOOO........'
    ];
    var MAZAS_ACIS = ACIS; // tās pašas 4×5 acis (x8, y7) — seja paliek lasāma
    var MAZA_ROKA_A = ['..OO.', '.OLLO', '.OLMO', '.OMO.', '.OMO.', 'OMMO.'];
    var MAZA_ROKA_B = ['...OO.', '..OLLO', '..OLMO', '.OMMO.', 'OMMO..', 'OMO...'];
    var MAZA_SOMA = [ // x-2, y1: guļammaiss + somas mala virs kreisā pleca
        '.OOOOO.',
        'OVAVVAO',
        'OVAVVAO',
        '.OOOOO.',
        '.OAAAO.',
        '.OAAO..',
        '.OAAO..',
        '.OAO...',
        '..O....'
    ];
    var MAZA_SIKSNA = [ // x3, y1: tā pati siksna, īsāka
        '.......AA',
        '......AA.',
        '.....AA..',
        '....LA...',
        '...AL....',
        '..AA.....',
        '.AA......',
        'AA.......'
    ];
    var MAZA_CEPURE = [
        '................OO.',
        '.........OOO...OWWO',
        '......OOOXXXOOOWGWO',
        '....OOXXXXXXXXBOOO.',
        '...OXXXXXXXXXBBO...',
        '..OXXXXXXXXXXBO....',
        '.OWWWWWWWWWWWWWO...',
        'OWWWWWWWWWWWWGGGO..',
        '.OOOOOOOOOOOOOOO...'
    ];
    var MAZA_BALLITE = [
        '.....OO.....',
        '....OYYO....',
        '....OPPO....',
        '....OYVO....',
        '...OYVVPO...',
        '...OVVPPO...',
        '..OVPPYYVO..',
        '..OPPYYVVO..',
        '.OPYYVVPPYO.',
        '..OOOOOOOO..'
    ];

    var REZGI = {
        KERMENIS: KERMENIS, KERMENIS_AUGSA: KERMENIS_AUGSA, KAJAS: KAJAS,
        KAJAS_SOLIS_A: KAJAS_SOLIS_A, KAJAS_SOLIS_B: KAJAS_SOLIS_B,
        ACIS: ACIS, ACIS_LEJA: ACIS_LEJA, ACIS_PA_LABI: ACIS_PA_LABI,
        UZACIS_APJUKUSI: UZACIS_APJUKUSI, MUTE_O: MUTE_O,
        ROKA_A: ROKA_A, ROKA_B: ROKA_B, ROKA_MIERS: ROKA_MIERS, ROKA_RADA: ROKA_RADA,
        MUGURSOMA: MUGURSOMA, SIKSNA: SIKSNA, NUJA: NUJA, ROKA_K: ROKA_K, KARTE: KARTE, KEPAS_KARTE: KEPAS_KARTE,
        SVIEDRI: SVIEDRI, JAUTAJUMS: JAUTAJUMS, CEPURE: CEPURE, BALLITES_CEPURE: BALLITES_CEPURE,
        MAZAIS_KERMENIS: MAZAIS_KERMENIS, MAZAS_ACIS: MAZAS_ACIS, MAZA_ROKA_A: MAZA_ROKA_A, MAZA_ROKA_B: MAZA_ROKA_B,
        MAZA_SOMA: MAZA_SOMA, MAZA_SIKSNA: MAZA_SIKSNA, MAZA_CEPURE: MAZA_CEPURE, MAZA_BALLITE: MAZA_BALLITE
    };

    // ---- Slāņi: [režģis, x, y, klase]. Secība = zīmēšanas secība (aizmugure -> priekša) ----
    var SOMA = ['MUGURSOMA', -6, 1, 'empa-soma'];
    var NUJA_S = ['NUJA', -9, 3, 'empa-nuja'];
    var ROKA_K_S = ['ROKA_K', -10, 8, 'empa-roka-k'];
    var SIKSNA_S = ['SIKSNA', 3, 4, 'empa-siksna'];
    var KERM = ['KERMENIS', 0, 0];
    var ACIS_S = ['ACIS', 10, 11, 'empa-acis'];

    var MIERS = ['ROKA_MIERS', 31, 13, 'empa-roka'];
    var POZAS = {
        // stāv, spieķis atbalstīts
        miera: [[SOMA, NUJA_S, ROKA_K_S, MIERS, KERM, SIKSNA_S, ACIS_S]],
        // māj: 2 kadri (tā pati loģika kā .empa-roka-a / -b)
        vicina: [
            [SOMA, NUJA_S, ROKA_K_S, ['ROKA_A', 29, 6, 'empa-roka empa-roka-a'], KERM, SIKSNA_S, ACIS_S],
            [SOMA, NUJA_S, ROKA_K_S, ['ROKA_B', 29, 6, 'empa-roka empa-roka-b'], KERM, SIKSNA_S, ACIS_S]
        ],
        // lasa karti (spieķis nolikts)
        lasa: [[SOMA, KERM, SIKSNA_S, ['ACIS_LEJA', 10, 11, 'empa-acis'], ['KARTE', 7, 18, 'empa-karte'], ['KEPAS_KARTE', 5, 19]]],
        // rāda uz pogu pa labi
        rada: [[SOMA, NUJA_S, ROKA_K_S, ['ROKA_RADA', 30, 12, 'empa-roka'], KERM, SIKSNA_S, ['ACIS_PA_LABI', 10, 11, 'empa-acis']]],
        // apjucis / 404
        apjucis: [[SOMA, NUJA_S, ROKA_K_S, MIERS, KERM, SIKSNA_S, ACIS_S,
            ['UZACIS_APJUKUSI', 11, 8], ['MUTE_O', 14, 15], ['SVIEDRI', 29, 4], ['JAUTAJUMS', 34, -4, 'empa-jautajums']]],
        // ielāde: iet uz vietas (2 kadri) — pēdas pārmaiņus, spieķis un ķepa paceļas ar kreiso soli
        ielade: [
            [SOMA, ['NUJA', -9, 2, 'empa-nuja'], ['ROKA_K', -10, 7, 'empa-roka-k'], MIERS, ['KERMENIS_AUGSA', 0, 0], ['KAJAS_SOLIS_A', 0, 23], SIKSNA_S, ACIS_S],
            [SOMA, NUJA_S, ROKA_K_S, MIERS, ['KERMENIS_AUGSA', 0, 0], ['KAJAS_SOLIS_B', 0, 23], SIKSNA_S, ACIS_S]
        ]
    };

    // Mazais (stūra poga ≤64 px, 404 ikonas): bez nūjas, maza soma
    var M_SOMA = ['MAZA_SOMA', -2, 1, 'empa-soma'];
    var M_KERM = ['MAZAIS_KERMENIS', 0, 0];
    var M_ACIS = ['MAZAS_ACIS', 8, 7, 'empa-acis'];
    var M_SIKSNA = ['MAZA_SIKSNA', 3, 1, 'empa-siksna'];
    var MAZAIS = {
        vicina: [
            [M_SOMA, ['MAZA_ROKA_A', 23, 0, 'empa-roka empa-roka-a'], M_KERM, M_SIKSNA, M_ACIS],
            [M_SOMA, ['MAZA_ROKA_B', 24, 0, 'empa-roka empa-roka-b'], M_KERM, M_SIKSNA, M_ACIS]
        ]
    };

    var CEPURES = {
        santa: ['CEPURE', 6, -6, 'empa-cepure'],
        ballite: ['BALLITES_CEPURE', 10, -10, 'empa-ballite']
    };
    var MAZAS_CEPURES = {
        santa: ['MAZA_CEPURE', 6, -6, 'empa-cepure'],
        ballite: ['MAZA_BALLITE', 9, -8, 'empa-ballite']
    };

    // Pārvērš pikseļu rindas SVG taisnstūros (tieši kā empanadillo.js)
    function pikseli(rindas, ox, oy, krasas) {
        krasas = krasas || KRASAS;
        var s = '';
        rindas.forEach(function (r, y) {
            var x = 0;
            while (x < r.length) {
                var c = r[x];
                var len = 1;
                while (x + len < r.length && r[x + len] === c) len++;
                if (c !== '.') {
                    s += '<rect x="' + (x + ox) + '" y="' + (y + oy) + '" width="' + len + '" height="1" fill="' + krasas[c] + '"/>';
                }
                x += len;
            }
        });
        return s;
    }

    function slanis(l) {
        var r = pikseli(REZGI[l[0]], l[1], l[2]);
        return l[3] ? '<g class="' + l[3] + '">' + r + '</g>' : r;
    }

    // Kopējais skats (lai kadri un cepures nelēkā). Zeme = apakšējā mala.
    // Lielais: x -11..40, y -10..24 (52×35 → ×2 = 104 px, ×3 = 156, ×4 = 208)
    // Mazais:  x -2..29,  y -8..18  (32×27 → ×1 = 32 px, ×2 = 64, ×3 = 96)
    var VIEWBOX = '-11 -10 52 35';
    var VIEWBOX_MAZAIS = '-2 -8 32 27';
    // Plakana (ne-pikseļu) ēna zem kājām — iederas vektora ainavā
    var ENA = { lielais: [14, 24.7, 22, 1.6], mazais: [14.5, 18.7, 13, 1.2] };

    /* svg(poza, { mazais, frame, animate, hat: 'santa'|'ballite', shadow, label })
       animate: true -> visi kadri kā <g class="empa-kadrs empa-kadrs-N">, pārslēdz CSS (steps). */
    function svg(poza, o) {
        o = o || {};
        var komplekts = o.mazais ? MAZAIS : POZAS;
        var kadri = komplekts[poza];
        var cepure = o.hat && (o.mazais ? MAZAS_CEPURES : CEPURES)[o.hat];
        function kadrs(slani) {
            slani = slani.slice();
            if (cepure) slani.push(cepure);
            return slani.map(slanis).join('');
        }
        var e = ENA[o.mazais ? 'mazais' : 'lielais'];
        var ena = o.shadow === false ? '' :
            '<ellipse class="empa-ena" cx="' + e[0] + '" cy="' + e[1] + '" rx="' + e[2] + '" ry="' + e[3] +
            '" fill="#1E2E29" opacity=".16" shape-rendering="geometricPrecision"/>';
        var saturs = o.animate && kadri.length > 1
            ? kadri.map(function (k, i) { return '<g class="empa-kadrs empa-kadrs-' + i + '">' + kadrs(k) + '</g>'; }).join('')
            : kadrs(kadri[(o.frame || 0) % kadri.length]);
        return '<svg viewBox="' + (o.viewBox || (o.mazais ? VIEWBOX_MAZAIS : VIEWBOX)) + '" shape-rendering="crispEdges"' +
            (o.label ? ' role="img" aria-label="' + o.label + '"' : ' aria-hidden="true" focusable="false"') + '>' +
            ena + '<g class="empa-figura">' + saturs + '</g></svg>';
    }

    root.EMPA_SPRITES = {
        KRASAS: KRASAS, REZGI: REZGI, POZAS: POZAS, MAZAIS: MAZAIS, CEPURES: CEPURES, MAZAS_CEPURES: MAZAS_CEPURES,
        VIEWBOX: VIEWBOX, VIEWBOX_MAZAIS: VIEWBOX_MAZAIS, pikseli: pikseli, svg: svg
    };
    if (typeof module !== 'undefined' && module.exports) module.exports = root.EMPA_SPRITES;
})(typeof window !== 'undefined' ? window : this);
