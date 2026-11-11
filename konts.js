// Lietotāja konts (konts.html): cilnes "Mani kursi" (#kursi, kursu kartītes) un "Mans profils" (#profils, kontakti + foto)
(function() {
    var L = window.LIB, el = L.el, api = L.api;
    var root = document.getElementById('konts');
    var virsraksts = document.getElementById('konta-virsraksts');

    // Kursu vāki un līmeņi (tie paši, kas kursi.html kartītēs)
    var KURSI = {
        'spain-a1': { vaks: 'spanu-a1', limenis: 'A1', valoda: 'es' },
        'spain-a2': { vaks: 'spanu-a2', limenis: 'A2', valoda: 'es' },
        'spain-b1-1': { vaks: 'spanu-b1-1', limenis: 'B1.1', valoda: 'es' },
        'spain-b1-2': { vaks: 'spanu-b1-2', limenis: 'B1.2', valoda: 'es' },
        'english-a1': { vaks: 'anglu-a1', limenis: 'A1', valoda: 'en' },
        'english-a2': { vaks: 'anglu-a2', limenis: 'A2', valoda: 'en' }
    };
    var CILNES = {
        kursi: { nosaukums: 'Mani kursi' },
        profils: { nosaukums: 'Mans profils' }
    };
    var IKONA_KALENDARS = '<svg class="course-info-ikona" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>';
    // Grupas periods no D1 (period_start/_end/_days) -> "11.01.2027.–24.02.2027. · Pirmdienās un trešdienās, 18:00–21:00"
    var DIENAS = { "pr-tr": "Pirmdienās un trešdienās", "ot-ce": "Otrdienās un ceturtdienās" };
    function lvDatums(s) { var p = String(s).split("-"); return p.length === 3 ? p[2] + "." + p[1] + "." + p[0] + "." : s; }
    function periodaTeksts(en) {
        if (!en.period_start) return "";
        return lvDatums(en.period_start) + "–" + lvDatums(en.period_end) + " · " + (DIENAS[en.period_days] || "") + ", 18:00–21:00";
    }
    var IKONA_KAMERA = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>';

    function fmt(iso) {
        if (!iso) return '—';
        var d = new Date(iso);
        return isNaN(d) ? '—' : d.toLocaleDateString('lv-LV');
    }
    function cena(eur) {
        if (eur == null) return '';
        return Number(eur).toLocaleString('lv-LV', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' EUR';
    }
    function empa(poza, merogs) {
        var s = el('span', 'konta-empa');
        if (window.EMPANADILLO && EMPANADILLO.svg) s.innerHTML = EMPANADILLO.svg(poza, { scale: merogs || 3 });
        return s;
    }
    function cilne() { return location.hash === '#profils' ? 'profils' : 'kursi'; }

    var me = null;

    function render() {
        root.textContent = '';
        root.removeAttribute('aria-busy');

        if (!me || !me.user) {
            virsraksts.textContent = 'Mans konts';
            var k = el('div', 'register-card account-card center');
            k.appendChild(el('p', 'register-intro', 'Lai redzētu savus kursus un profilu, lūdzu, ienāc.'));
            var a = el('a', 'btn-cta btn-signin', 'Ienākt ar Google');
            a.href = L.signInUrl('/konts.html' + location.hash);
            k.appendChild(a);
            root.appendChild(k);
            return;
        }

        var c = cilne();
        virsraksts.textContent = CILNES[c].nosaukums;
        document.title = CILNES[c].nosaukums + ' — Libertas';

        // Cilnes (saites ar #hash — strādā arī no galvenes izvēlnes un pārlūka "Atpakaļ")
        var nav = el('nav', 'konta-cilnes');
        nav.setAttribute('aria-label', 'Konta sadaļas');
        ['kursi', 'profils'].forEach(function(id) {
            var a = el('a', 'konta-cilne', CILNES[id].nosaukums);
            a.href = '#' + id;
            if (id === c) a.setAttribute('aria-current', 'page');
            if (id === 'kursi') {
                var n = aktivie().length;
                if (n) a.appendChild(el('span', 'konta-cilne-skaits', String(n)));
            }
            nav.appendChild(a);
        });
        root.appendChild(nav);

        root.appendChild(c === 'profils' ? profils() : kursi());
    }

    function aktivie() {
        return (me.enrollments || []).filter(function(e) { return e.status !== 'atteicies'; });
    }

    // ---------- MANI KURSI ----------
    function kursi() {
        var wrap = el('div', 'mani-kursi');
        var akt = aktivie();
        var atceltie = (me.enrollments || []).filter(function(e) { return e.status === 'atteicies'; });

        if (!akt.length) {
            var t = el('div', 'register-card mani-kursi-tukss');
            t.appendChild(empa('skumst', 3));
            t.appendChild(el('h2', '', 'Te pagaidām ir tukšs'));
            var p = el('p', 'muted');
            p.appendChild(document.createTextNode('Empanadillo jau sapakojis mugursomu, bet vēl nezina, uz kurieni doties. Izvēlies savu pirmo kursu — '));
            var em = el('em', '', '¡vamos!'); em.lang = 'es';
            p.appendChild(em);
            t.appendChild(p);
            var poga = el('a', 'btn-cta', 'Skatīt kursus'); poga.href = 'kursi.html';
            t.appendChild(poga);
            wrap.appendChild(t);
        } else {
            var grid = el('div', 'courses-grid mani-kursi-rezgis');
            akt.forEach(function(en) { grid.appendChild(kartite(en)); });
            wrap.appendChild(grid);
            var vel = el('p', 'mani-kursi-vairak muted');
            vel.appendChild(document.createTextNode('Gribi turpināt ceļu? '));
            var va = el('a', '', 'Visi kursi'); va.href = 'kursi.html';
            vel.appendChild(va);
            wrap.appendChild(vel);
        }

        if (atceltie.length) {
            var d = el('details', 'atceltie');
            d.appendChild(el('summary', '', 'Atceltie pieteikumi (' + atceltie.length + ')'));
            atceltie.forEach(function(en) {
                var r = el('div', 'enroll-row');
                var l = el('div');
                l.appendChild(el('strong', '', en.course_name));
                l.appendChild(el('div', 'muted', 'Pieteikts: ' + fmt(en.created_at)));
                r.appendChild(l);
                var a = el('a', 'btn-link', 'Pieteikties vēlreiz');
                a.href = 'kursi.html#' + ((KURSI[en.course_id] || {}).valoda === 'en' ? 'anglu' : 'spanu');
                r.appendChild(a);
                d.appendChild(r);
            });
            wrap.appendChild(d);
        }
        return wrap;
    }

    // Gaita: pieteikums → apmaksa → uzņemts → kurss sācies
    function gaita(en) {
        var s = en.status;
        var soli = [
            ['Pieteikums', true],
            ['Apmaksa', !!en.paid || s === 'uznemts' || s === 'sacis' || s === 'pabeidzis'],
            ['Uzņemts', s === 'uznemts' || s === 'sacis' || s === 'pabeidzis'],
            [s === 'pabeidzis' ? 'Pabeigts' : 'Kurss sācies', s === 'sacis' || s === 'pabeidzis']
        ];
        var ol = el('ol', 'kursa-gaita');
        ol.setAttribute('aria-label', 'Pieteikuma gaita');
        soli.forEach(function(x) {
            var li = el('li', x[1] ? 'izdarits' : '', x[0]);
            if (x[1]) li.appendChild(el('span', 'sr-only', ' (izdarīts)'));
            ol.appendChild(li);
        });
        return ol;
    }

    function piezime(en, valoda) {
        var es = valoda === 'es';
        switch (en.status) {
            case 'pieteicies':
                return en.paid ? 'Apmaksa saņemta — drīz apstiprināsim vietu grupā.'
                    : 'Sazināsimies ar tevi un atsūtīsim apmaksas informāciju. Līdz apmaksai pieteikumu vari atcelt.';
            case 'uznemts': return 'Vieta grupā ir tava! Informāciju par pirmo nodarbību atsūtīsim e-pastā.';
            case 'sacis': return (es ? '¡Ánimo! ' : 'Keep going! ') + 'Veiksmi nodarbībās.';
            case 'pabeidzis': return (es ? '¡Enhorabuena! ' : 'Well done! ') + 'Kurss pabeigts — varbūt nākamais līmenis?';
        }
        return '';
    }

    function kartite(en) {
        var k = KURSI[en.course_id] || {};
        var art = el('article', 'course-card mans-kurss mans-kurss--' + en.status);

        var img = el('img');
        img.src = 'assets/kursi/' + (k.vaks || 'spanu-a1') + '.svg';
        img.alt = ''; img.width = 600; img.height = 320; img.decoding = 'async';
        art.appendChild(img);

        var b = el('div', 'course-body');
        var birkas = el('div', 'mans-kurss-birkas');
        if (k.limenis) birkas.appendChild(el('span', 'chip chip--limenis', k.limenis));
        if (en.paid && en.status === 'pieteicies') birkas.appendChild(el('span', 'badge badge-paid', 'Apmaksāts'));
        else {
            birkas.appendChild(el('span', 'badge badge-' + en.status, L.STATUSI[en.status] || en.status));
            if (en.paid && en.status === 'uznemts') birkas.appendChild(el('span', 'badge badge-paid', 'Apmaksāts'));
        }
        b.appendChild(birkas);
        b.appendChild(el('h3', '', en.course_name));
        if (en.price_eur != null) b.appendChild(el('p', 'course-price', cena(en.price_eur)));
        var grupa = periodaTeksts(en) || en.schedule;
        if (grupa) {
            var inf = el('p', 'course-info');
            inf.innerHTML = IKONA_KALENDARS;
            inf.appendChild(document.createTextNode(grupa));
            b.appendChild(inf);
        }
        b.appendChild(gaita(en));
        var pz = piezime(en, k.valoda);
        if (pz) b.appendChild(el('p', 'mans-kurss-piezime', pz));

        var apaksa = el('div', 'mans-kurss-apaksa');
        apaksa.appendChild(el('span', 'muted', 'Pieteikts ' + fmt(en.created_at)));
        if (en.status === 'pieteicies' && !en.paid) {
            var x = el('button', 'btn-link btn-danger', 'Atcelt pieteikumu'); x.type = 'button';
            x.addEventListener('click', function() {
                if (!confirm('Atcelt pieteikumu kursam "' + en.course_name + '"?')) return;
                x.disabled = true;
                api('POST', '/api/enroll/cancel', { course_id: en.course_id }).then(function() {
                    en.status = 'atteicies';
                    L.toast('Pieteikums atcelts.');
                    render();
                }).catch(function(err) { x.disabled = false; L.toast(err.message, true); });
            });
            apaksa.appendChild(x);
        }
        b.appendChild(apaksa);
        art.appendChild(b);
        return art;
    }

    // ---------- MANS PROFILS ----------
    function profils() {
        var u = me.user;
        var karte = el('div', 'register-card account-card profila-karte');

        // Foto + vārds
        var galva = el('div', 'profila-galva');
        var foto = el('div', 'profila-foto');
        foto.appendChild(L.avatars(u, 'user-avatar-xl'));
        var fails = el('input'); fails.type = 'file'; fails.accept = 'image/*'; fails.id = 'profila-foto-fails'; fails.className = 'sr-only';
        var mainit = el('label', 'profila-foto-poga');
        mainit.setAttribute('for', fails.id);
        mainit.innerHTML = IKONA_KAMERA;
        mainit.appendChild(el('span', 'sr-only', 'Mainīt profila foto'));
        mainit.title = 'Mainīt foto';
        foto.appendChild(fails);
        foto.appendChild(mainit);
        galva.appendChild(foto);

        var kas = el('div', 'profila-kas');
        kas.appendChild(el('strong', '', u.name || u.email));
        kas.appendChild(el('div', 'muted', 'Libertas kopš ' + fmt(u.created_at)));
        var fotoPogas = el('div', 'profila-foto-saites');
        var mainitSaite = el('label', 'btn-link', 'Mainīt foto');
        mainitSaite.setAttribute('for', fails.id);
        fotoPogas.appendChild(mainitSaite);
        if (u.custom_picture) {
            var atpakal = el('button', 'btn-link', u.google_picture ? 'Atjaunot Google foto' : 'Noņemt foto');
            atpakal.type = 'button';
            atpakal.addEventListener('click', function() {
                atpakal.disabled = true;
                api('DELETE', '/api/me/avatar').then(function(d) {
                    atjaunotLietotaju(d.user);
                    L.toast('Foto noņemts.');
                }).catch(function(err) { atpakal.disabled = false; L.toast(err.message, true); });
            });
            fotoPogas.appendChild(atpakal);
        }
        kas.appendChild(fotoPogas);
        galva.appendChild(kas);
        karte.appendChild(galva);

        fails.addEventListener('change', function() {
            var f = fails.files && fails.files[0];
            fails.value = '';
            if (!f) return;
            if (!/^image\//.test(f.type)) { L.toast('Lūdzu, izvēlies attēlu.', true); return; }
            if (f.size > 15 * 1024 * 1024) { L.toast('Attēls ir par lielu (līdz 15 MB).', true); return; }
            foto.classList.add('ladejas');
            samazinat(f).then(function(dataUrl) {
                return api('PUT', '/api/me/avatar', { image: dataUrl });
            }).then(function(d) {
                atjaunotLietotaju(d.user);
                L.toast('Foto nomainīts.');
            }).catch(function(err) {
                foto.classList.remove('ladejas');
                L.toast(err.message || 'Neizdevās nomainīt foto', true);
            });
        });

        // Kontaktinformācija
        karte.appendChild(el('h2', 'account-h2', 'Kontaktinformācija'));
        var form = el('form', 'profila-forma');
        form.noValidate = true;
        function lauks(id, teksts, ievade, palidziba) {
            var w = el('div', 'profila-lauks');
            var lab = el('label', '', teksts); lab.setAttribute('for', id);
            ievade.id = id; ievade.className = 'lauks';
            w.appendChild(lab); w.appendChild(ievade);
            if (palidziba) {
                var h = el('p', 'profila-palidziba', palidziba); h.id = id + '-pal';
                ievade.setAttribute('aria-describedby', h.id);
                w.appendChild(h);
            }
            form.appendChild(w);
            return ievade;
        }
        var vards = el('input'); vards.type = 'text'; vards.value = u.name || ''; vards.maxLength = 80; vards.autocomplete = 'name';
        lauks('profils-vards', 'Vārds, uzvārds', vards, 'Tā tevi uzrunāsim e-pastos un rēķinos.');
        var epasts = el('input'); epasts.type = 'email'; epasts.value = u.email; epasts.readOnly = true;
        lauks('profils-epasts', 'E-pasts', epasts, 'No Google konta — šeit mainīt nevar.');
        var tel = el('input'); tel.type = 'tel'; tel.value = u.phone || ''; tel.maxLength = 30; tel.autocomplete = 'tel'; tel.placeholder = '+371 2…';
        lauks('profils-talrunis', 'Tālrunis', tel, 'Lai varam ātri sazināties par nodarbībām.');

        var pogas = el('div', 'profila-pogas');
        var save = el('button', 'btn-cta btn-small', 'Saglabāt'); save.type = 'submit';
        pogas.appendChild(save);
        form.appendChild(pogas);
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var t = tel.value.trim();
            var derigs = !t || /^[0-9+()\-\s.]{5,30}$/.test(t);
            tel.setAttribute('aria-invalid', String(!derigs));
            if (!derigs) { L.toast('Tālrunī drīkst būt tikai cipari, atstarpes un + ( ) -', true); tel.focus(); return; }
            save.disabled = true;
            api('PATCH', '/api/me', { name: vards.value, phone: t }).then(function(d) {
                var nu = Object.assign({}, me.user, { name: d.name, phone: d.phone });
                atjaunotLietotaju(nu);
                L.toast('Profils saglabāts.');
            }).catch(function(err) { save.disabled = false; L.toast(err.message, true); });
        });
        karte.appendChild(form);

        var priv = el('p', 'profila-privatums muted');
        priv.appendChild(document.createTextNode('Šos datus izmantojam tikai saziņai par taviem kursiem. '));
        var pa = el('a', '', 'Privātuma politika'); pa.href = 'noteikumi.html#privatums';
        priv.appendChild(pa);
        karte.appendChild(priv);
        return karte;
    }

    function atjaunotLietotaju(u) {
        me.user = u;
        if (L.atjaunotGalveni) L.atjaunotGalveni(u);
        render();
    }

    // Attēlu apgriež kvadrātā (centrs) un samazina līdz 256×256 JPEG (~20 KB) — serverī glabājas tikai šis
    function samazinat(f) {
        return new Promise(function(ok, nok) {
            var url = URL.createObjectURL(f);
            var img = new Image();
            img.onload = function() {
                var s = Math.min(img.naturalWidth, img.naturalHeight);
                var izm = Math.min(256, s);
                var c = document.createElement('canvas');
                c.width = c.height = izm;
                var ctx = c.getContext('2d');
                ctx.fillStyle = '#fff';
                ctx.fillRect(0, 0, izm, izm);
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, izm, izm);
                URL.revokeObjectURL(url);
                ok(c.toDataURL('image/jpeg', 0.86));
            };
            img.onerror = function() { URL.revokeObjectURL(url); nok(new Error('Šo attēlu nevar nolasīt.')); };
            img.src = url;
        });
    }

    window.addEventListener('hashchange', function() { if (me) { render(); window.scrollTo(0, 0); } });

    function sakt(d) { me = d; render(); }
    if (L.me) sakt(L.me);
    else document.addEventListener('lib:me', function(e) { sakt(e.detail); });
})();
