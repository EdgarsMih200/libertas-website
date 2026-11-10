// Kopīgais JS: pieteikšanās logrīks galvenē, kursu pieteikšanās
(function() {
    var STATUSI = { pieteicies: 'Pieteicies', uznemts: 'Uzņemts', sacis: 'Sācis', pabeidzis: 'Pabeidzis', atteicies: 'Atteicies' };
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
            var a = el('a', 'btn-cta btn-signin', 'Ienākt ar Google');
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

    function setBtn(btn, enr) {
        if (enr && enr.status !== 'atteicies') {
            btn.textContent = enr.status === 'pieteicies' ? 'Pieteikts ✓' : (STATUSI[enr.status] || enr.status) + ' ✓';
            btn.classList.add('btn-done');
        } else {
            btn.textContent = 'Pieteikties kursam';
            btn.classList.remove('btn-done');
        }
    }

    function enroll(btn, id) {
        btn.classList.add('btn-busy');
        return api('POST', '/api/enroll', { course_id: id }).then(function(enr) {
            setBtn(btn, enr && enr.status ? enr : { status: 'pieteicies' });
            toast('Paldies! Jūsu pieteikums ir saņemts.');
        }).catch(function(err) {
            if (err.status === 409) { setBtn(btn, { status: 'pieteicies' }); toast('Jūs jau esat pieteicies šim kursam.'); }
            else toast(err.message || 'Neizdevās pieteikties', true);
        }).then(function() { btn.classList.remove('btn-busy'); });
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
                if (!logged) {
                    try { sessionStorage.setItem('pendingCourse', id); } catch (x) {}
                    location.href = signInUrl('/kursi.html');
                    return;
                }
                enroll(btn, id);
            });
        });

        // Hero "REĢISTRĒTIES": neienākušam — uz Google, citādi uz kursiem
        var hero = document.getElementById('exploreBtn');
        if (hero) {
            hero.addEventListener('click', function(e) {
                if (!logged) { e.preventDefault(); location.href = signInUrl('/kursi.html'); }
            });
            if (!logged) {
                var note = el('p', 'consent-note');
                note.appendChild(document.createTextNode('Ienākot ar Google, jūs piekrītat '));
                var na = el('a', '', 'noteikumiem un privātuma politikai'); na.href = 'noteikumi.html';
                note.appendChild(na);
                note.appendChild(document.createTextNode('.'));
                hero.parentNode.appendChild(note);
            }
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
