// Kopīgais JS: pieteikšanās logrīks galvenē, kursu pieteikšanās
(function() {
    // 'pieteicies' (D1 vērtība) klientam rāda kā "Gaida apmaksu": pieteikums vēl nav galīgs, kamēr nav samaksāts
    var STATUSI = { pieteicies: 'Gaida apmaksu', uznemts: 'Uzņemts', sacis: 'Sācis', pabeidzis: 'Pabeidzis', atteicies: 'Atteicies' };
    window.LIB = window.LIB || {};
    window.LIB.STATUSI = STATUSI;

    // Palīgfunkcija API izsaukumiem (JSON)
    window.LIB.api = function(method, url, body) {
        var opts = { method: method, credentials: 'same-origin', headers: {} };
        if (body !== undefined) {
            opts.headers['Content-Type'] = 'application/json';
            opts.body = JSON.stringify(body);
        }
        return fetch(url, opts).then(function(r) {
            return r.json().catch(function() { return {}; }).then(function(d) {
                if (!r.ok) { var err = new Error(d.error || 'Kļūda'); err.status = r.status; throw err; }
                return d;
            });
        });
    };
    var api = window.LIB.api;

    function el(tag, cls, text) {
        var e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text !== undefined) e.textContent = text;
        return e;
    }
    window.LIB.el = el;

    function toast(msg, isError) {
        var t = el('div', 'toast' + (isError ? ' toast-error' : ''), msg);
        document.body.appendChild(t);
        setTimeout(function() { t.classList.add('toast-hide'); }, 3500);
        setTimeout(function() { t.remove(); }, 4000);
    }
    window.LIB.toast = toast;

    function signInUrl(ret) {
        return '/auth/google?return=' + encodeURIComponent(ret || (location.pathname + location.search + location.hash));
    }
    window.LIB.signInUrl = signInUrl;

    function renderAuth(me) {
        var wrap = document.querySelector('.nav-wrapper');
        if (!wrap) return;
        var box = el('div', 'auth-box');
        if (!me || !me.user) {
            var a = el('a', 'btn-secondary btn-signin', 'Ienākt ar Google');
            a.href = signInUrl();
            box.appendChild(a);
        } else {
            var u = me.user;
            var chip = el('button', 'user-chip');
            chip.type = 'button';
            chip.setAttribute('aria-haspopup', 'true');
            chip.setAttribute('aria-expanded', 'false');
            if (u.picture) {
                var img = el('img', 'user-avatar');
                img.src = u.picture; img.alt = ''; img.referrerPolicy = 'no-referrer';
                chip.appendChild(img);
            } else {
                chip.appendChild(el('span', 'user-avatar user-avatar-ph', (u.name || u.email || '?').charAt(0).toUpperCase()));
            }
            chip.appendChild(el('span', 'user-name', u.name || u.email));
            var menu = el('div', 'user-menu');
            menu.hidden = true;
            var l1 = el('a', '', 'Mani kursi'); l1.href = 'konts.html'; menu.appendChild(l1);
            if (u.is_admin) { var l2 = el('a', '', 'Administrācija'); l2.href = 'admin.html'; menu.appendChild(l2); }
            var out = el('button', '', 'Iziet'); out.type = 'button';
            out.addEventListener('click', function() {
                api('POST', '/auth/logout').catch(function() {}).then(function() { location.href = 'index.html'; });
            });
            menu.appendChild(out);
            chip.addEventListener('click', function(e) {
                e.stopPropagation();
                menu.hidden = !menu.hidden;
                chip.setAttribute('aria-expanded', String(!menu.hidden));
            });
            document.addEventListener('click', function() { menu.hidden = true; chip.setAttribute('aria-expanded', 'false'); });
            box.appendChild(chip);
            box.appendChild(menu);
        }
        wrap.appendChild(box);
    }

    function enrolledMap(me) {
        var m = {};
        ((me && me.enrollments) || []).forEach(function(e) { m[e.course_id] = e; });
        return m;
    }

    // Poga pēc pieteikšanās: "Gaida apmaksu" (silts, nevis zaļš ✓ — vieta vēl nav galīga), pēc uzņemšanas — statuss ar ✓
    function setBtn(btn, enr) {
        btn.classList.remove('btn-done', 'btn-gaida');
        if (enr && enr.status !== 'atteicies') {
            if (enr.status === 'pieteicies') {
                btn.textContent = 'Gaida apmaksu';
                btn.classList.add('btn-done', 'btn-gaida');
                btn.title = 'Pieteikums saņemts. Statusu redzi sadaļā “Mani kursi”.';
            } else {
                btn.textContent = (STATUSI[enr.status] || enr.status) + ' ✓';
                btn.classList.add('btn-done');
            }
        } else {
            btn.textContent = 'Pieteikties kursam';
            btn.removeAttribute('title');
        }
    }

    function enroll(btn, id) {
        btn.classList.add('btn-busy');
        return api('POST', '/api/enroll', { course_id: id }).then(function(d) {
            setBtn(btn, d && d.enrollment ? d.enrollment : { status: 'pieteicies' });
            toast(d && d.email_sent ? 'Paldies! Pieteikums saņemts — apstiprinājumu nosūtījām uz tavu e-pastu.' : 'Paldies! Pieteikums saņemts.');
        }).catch(function(err) {
            if (err.status === 409) { setBtn(btn, { status: 'pieteicies' }); toast('Tu jau esi pieteicies šim kursam.'); }
            else toast(err.message || 'Neizdevās iesniegt pieteikumu', true);
        }).then(function() { btn.classList.remove('btn-busy'); });
    }

    // Kursa dati apstiprinājuma logam — no kartītes (kursi.html)
    function kursaDati(btn) {
        var karte = btn.closest('.course-card') || document;
        function t(sel) { var n = karte.querySelector(sel); return n ? n.textContent.replace(/\s+/g, ' ').trim() : ''; }
        return { nosaukums: t('h3'), limenis: t('.chip--limenis'), cena: t('.course-price'), grafiks: t('.course-info') };
    }

    // Apstiprinājuma logs pirms pieteikšanās (native <dialog>: fokusa slazds + Esc). apstiprinat() izsauc tikai pēc atzīmes.
    function radiLogu(btn, logged, apstiprinat) {
        var k = kursaDati(btn);
        var d = el('dialog', 'pieteikuma-logs');
        d.setAttribute('aria-labelledby', 'pl-virsraksts');
        d.setAttribute('aria-describedby', 'pl-ievads');

        var galva = el('div', 'pl-galva');
        if (window.EMPANADILLO && EMPANADILLO.svg) {
            var empa = el('span', 'pl-empa');
            empa.innerHTML = EMPANADILLO.svg('rada', { scale: 2, shadow: false });
            galva.appendChild(empa);
        }
        var gt = el('div', 'pl-galva-teksts');
        gt.appendChild(el('p', 'pl-zime', 'Pieteikums kursam'));
        var h = el('h2', 'pl-virsraksts', k.nosaukums || 'Kurss'); h.id = 'pl-virsraksts';
        gt.appendChild(h);
        galva.appendChild(gt);
        var x = el('button', 'pl-aizvert'); x.type = 'button'; x.setAttribute('aria-label', 'Aizvērt');
        x.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18"/></svg>';
        galva.appendChild(x);
        d.appendChild(galva);

        var dl = el('dl', 'pl-dati');
        [['Līmenis', k.limenis], ['Cena', k.cena], ['Grafiks', k.grafiks]].forEach(function(r) {
            if (!r[1]) return;
            var w = el('div');
            w.appendChild(el('dt', '', r[0]));
            w.appendChild(el('dd', '', r[1]));
            dl.appendChild(w);
        });
        d.appendChild(dl);

        var ievads = el('p', 'pl-ievads', 'Pieteikums rezervē tev vietu grupā. Tas kļūst galīgs pēc apmaksas — līdz tam nekas nav jāmaksā un pieteikumu vari atcelt.');
        ievads.id = 'pl-ievads';
        d.appendChild(ievads);

        d.appendChild(el('h3', 'pl-apaksvirsraksts', 'Kas notiks tālāk'));
        var ol = el('ol', 'pl-soli');
        [
            ['Apstiprinājums e-pastā', 'Uzreiz nosūtīsim vēstuli ar pieteikuma kopsavilkumu.'],
            ['Apmaksas informācija', 'Sazināsimies ar tevi un nosūtīsim rēķinu vai apmaksas rekvizītus.'],
            ['Vieta grupā ir tava', 'Pēc apmaksas statuss “Mani kursi” sadaļā mainās uz “Uzņemts”.']
        ].forEach(function(s) {
            var li = el('li');
            li.appendChild(el('b', '', s[0]));
            li.appendChild(el('span', '', s[1]));
            ol.appendChild(li);
        });
        d.appendChild(ol);

        var lbl = el('label', 'pl-piekrisana');
        var cb = el('input'); cb.type = 'checkbox'; cb.required = true;
        lbl.appendChild(cb);
        var lt = el('span');
        lt.appendChild(document.createTextNode('Esmu iepazinies ar '));
        var na = el('a', '', 'noteikumiem un privātuma politiku'); na.href = 'noteikumi.html'; na.target = '_blank'; na.rel = 'noopener';
        lt.appendChild(na);
        lt.appendChild(document.createTextNode(' un vēlos pieteikties šim kursam.'));
        lbl.appendChild(lt);
        d.appendChild(lbl);

        var pogas = el('div', 'pl-pogas');
        var ok = el('button', 'btn-cta', logged ? 'Apstiprināt pieteikumu' : 'Ienākt ar Google un pieteikties');
        ok.type = 'button'; ok.disabled = true;
        var atcelt = el('button', 'btn-secondary', 'Atcelt'); atcelt.type = 'button';
        pogas.appendChild(ok);
        pogas.appendChild(atcelt);
        d.appendChild(pogas);
        if (!logged) d.appendChild(el('p', 'pl-piezime', 'Pieteikšanās notiek ar Google kontu — pēc ienākšanas pieteikums tiks iesniegts automātiski.'));

        cb.addEventListener('change', function() { ok.disabled = !cb.checked; });
        function aizvert() { d.close(); }
        x.addEventListener('click', aizvert);
        atcelt.addEventListener('click', aizvert);
        // Klikšķis uz fona (ārpus loga) aizver
        d.addEventListener('click', function(e) { if (e.target === d) aizvert(); });
        d.addEventListener('close', function() { d.remove(); if (document.body.contains(btn)) btn.focus(); });
        ok.addEventListener('click', function() { if (!cb.checked) return; d.close(); apstiprinat(); });

        document.body.appendChild(d);
        if (d.showModal) d.showModal(); else d.setAttribute('open', '');
        cb.focus();
    }

    function initPage(me) {
        var logged = !!(me && me.user);
        var map = enrolledMap(me);

        document.querySelectorAll('a.btn-cta[data-course]').forEach(function(btn) {
            var id = btn.getAttribute('data-course');
            if (logged) setBtn(btn, map[id]);
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                if (btn.classList.contains('btn-busy') || btn.classList.contains('btn-done')) return;
                radiLogu(btn, logged, function() {
                    if (!logged) {
                        // Apstiprināts pirms ienākšanas — pēc atgriešanās pieteikums tiek iesniegts bez otra loga
                        try { sessionStorage.setItem('pendingCourse', id); } catch (x) {}
                        location.href = signInUrl('/kursi.html');
                        return;
                    }
                    enroll(btn, id);
                });
            });
        });

        // Piekrišanas piezīme viesiem — kursu lapā pie pieteikšanās (hero poga "Izvēlies kursu" vairs neved uz Google)
        // vieta: [data-consent-vieta] (kursi.html "Kā pieteikties"), citādi aiz ievada teksta
        var vieta = document.querySelector('[data-consent-vieta]');
        var ievads = vieta || document.querySelector('.courses-section .sakums-ievads');
        if (!logged && ievads) {
            var note = el('p', 'consent-note');
            note.appendChild(document.createTextNode('Piesakoties kursam, jūs ienāksiet ar Google un piekrītat '));
            var na = el('a', '', 'noteikumiem un privātuma politikai'); na.href = 'noteikumi.html';
            note.appendChild(na);
            note.appendChild(document.createTextNode('.'));
            if (vieta) vieta.appendChild(note);
            else ievads.parentNode.insertBefore(note, ievads.nextSibling);
        }

        // Gaidošais pieteikums pēc ienākšanas
        var pending = null;
        try { pending = sessionStorage.getItem('pendingCourse'); sessionStorage.removeItem('pendingCourse'); } catch (x) {}
        if (logged && pending) {
            var pb = document.querySelector('a.btn-cta[data-course="' + pending.replace(/[^a-z0-9-]/gi, '') + '"]');
            if (pb && !(map[pending] && map[pending].status !== 'atteicies')) enroll(pb, pending);
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        fetch('/api/me', { credentials: 'same-origin' })
            .then(function(r) { return r.ok ? r.json() : { user: null }; })
            .catch(function() { return { user: null }; })
            .then(function(me) {
                if (!me || typeof me !== 'object') me = { user: null };
                window.LIB.me = me;
                renderAuth(me);
                initPage(me);
                document.dispatchEvent(new CustomEvent('lib:me', { detail: me }));
            });
    });
})();

// Mobilā izvēlne (≤768px): .izvelnes-poga atver nav.main-nav kā lapu zem galvenes.
// Esc aizver un atdod fokusu pogai; kamēr atvērta, Tab paliek izvēlnē, fons neritinās (CSS: body.izvelne-atverta).
(function() {
    var poga = document.querySelector('.izvelnes-poga');
    var nav = poga && document.getElementById(poga.getAttribute('aria-controls'));
    if (!nav) return;
    var galvene = poga.closest('.site-header') || document.body;

    function atverta() { return poga.getAttribute('aria-expanded') === 'true'; }

    function iestatit(atvert, fokussUzPogu) {
        poga.setAttribute('aria-expanded', String(atvert));
        poga.setAttribute('aria-label', atvert ? 'Aizvērt izvēlni' : 'Atvērt izvēlni');
        galvene.classList.toggle('izvelne-atverta', atvert);
        document.body.classList.toggle('izvelne-atverta', atvert);
        if (atvert) {
            var pirma = nav.querySelector('a[href]');
            if (pirma) pirma.focus();
        } else if (fokussUzPogu) {
            poga.focus();
        }
    }

    poga.addEventListener('click', function() { iestatit(!atverta(), false); });

    // Saite izvēlnē: aizver (svarīgi enkuriem tajā pašā lapā)
    nav.addEventListener('click', function(e) {
        if (atverta() && e.target.closest('a')) iestatit(false, false);
    });

    document.addEventListener('keydown', function(e) {
        if (!atverta()) return;
        if (e.key === 'Escape') { iestatit(false, true); return; }
        if (e.key !== 'Tab') return;
        // Fokusa slazds: poga + izvēlnes saites
        var vietas = [poga].concat([].slice.call(nav.querySelectorAll('a[href], button')));
        var i = vietas.indexOf(document.activeElement);
        if (i === -1) { e.preventDefault(); vietas[0].focus(); }
        else if (e.shiftKey && i === 0) { e.preventDefault(); vietas[vietas.length - 1].focus(); }
        else if (!e.shiftKey && i === vietas.length - 1) { e.preventDefault(); vietas[0].focus(); }
    });

    // Pārejot uz plato ekrānu, izvēlne aizveras (citādi paliktu bloķēta ritināšana)
    var mq = window.matchMedia('(max-width: 768px)');
    function mainita() { if (!mq.matches && atverta()) iestatit(false, false); }
    if (mq.addEventListener) mq.addEventListener('change', mainita); else if (mq.addListener) mq.addListener(mainita);
})();

// Sākumlapas bento flīzes: gaismas plankums seko kursoram + ieejas animācija, kad sadaļa parādās ekrānā
(function() {
    var bento = document.querySelector('.bento');
    if (!bento) return;
    bento.addEventListener('pointermove', function(e) {
        var f = e.target.closest('.bento-flize');
        if (!f) return;
        var r = f.getBoundingClientRect();
        f.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        f.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    bento.classList.add('gaida');
    var io = new IntersectionObserver(function(ieraksti) {
        if (!ieraksti[0].isIntersecting) return;
        bento.classList.add('redzams');
        bento.classList.remove('gaida');
        io.disconnect();
    }, { rootMargin: '0px 0px -10% 0px' });
    io.observe(bento);
})();

// Sākumlapas hero: maiga paralakse (tikai pele, bez samazinātas kustības, ≥1024px). Slāņus pārvieto CSS pēc --px/--py.
(function() {
    var ainava = document.querySelector('.hero-ainava');
    if (!ainava || !window.matchMedia) return;
    var mq = window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference) and (min-width: 1024px)');
    var mx = 0, my = 0, x = 0, y = 0, rafId = 0;
    function solis() {
        x += (mx - x) * 0.08;
        y += (my - y) * 0.08;
        ainava.style.setProperty('--px', x.toFixed(3));
        ainava.style.setProperty('--py', y.toFixed(3));
        rafId = (Math.abs(mx - x) > 0.002 || Math.abs(my - y) > 0.002) ? requestAnimationFrame(solis) : 0;
    }
    function sakt() { if (!rafId) rafId = requestAnimationFrame(solis); }
    var hero = ainava.parentNode;
    hero.addEventListener('pointermove', function(e) {
        if (!mq.matches) return;
        var r = hero.getBoundingClientRect();
        mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        my = ((e.clientY - r.top) / r.height - 0.5) * 2;
        sakt();
    });
    hero.addEventListener('pointerleave', function() { mx = 0; my = 0; sakt(); });
})();
