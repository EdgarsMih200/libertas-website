// Blogs: krāsu tēma (mežs / papīrs), saraksta filtri + meklēšana + skaiti, raksta "patīk" un komentāri.
// API: worker/blogs.js. Komentēt var tikai reģistrēti; "patīk" — visi (viesim anonīms id localStorage).
(function() {
    var LIB = window.LIB || {};
    function el(tag, cls, text) {
        var e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text !== undefined) e.textContent = text;
        return e;
    }
    function api(method, url, body) {
        return LIB.api ? LIB.api(method, url, body) : Promise.reject(new Error('Kļūda'));
    }
    function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

    // ---------- Krāsu tēma ----------
    var html = document.documentElement;
    function tema(t) {
        html.classList.toggle('blogs-gaiss', t === 'gaiss');
        document.querySelectorAll('.blogs-tema-poga').forEach(function(b) {
            b.setAttribute('aria-pressed', String(b.getAttribute('data-tema') === t));
        });
    }
    tema(html.classList.contains('blogs-gaiss') ? 'gaiss' : 'tumss');
    document.querySelectorAll('.blogs-tema-poga').forEach(function(b) {
        b.addEventListener('click', function() {
            var t = b.getAttribute('data-tema');
            tema(t);
            lsSet('blogsTema', t);
        });
    });

    // ---------- Saraksts ----------
    var saraksts = document.querySelector('[data-blogs-saraksts]');
    if (saraksts) {
        var kartes = [].slice.call(saraksts.querySelectorAll('.blogs-karte'));
        var meklet = document.getElementById('blogs-meklet');
        var filtrs = null; // { veids: 'sadala'|'birka', v }
        var filtrsRinda = saraksts.querySelector('.blogs-filtrs');
        var tukss = saraksts.querySelector('.blogs-tukss');

        var q = new URLSearchParams(location.search);
        if (q.get('birka')) filtrs = { veids: 'birka', v: q.get('birka') };
        else if (q.get('sadala')) filtrs = { veids: 'sadala', v: q.get('sadala') };

        function norm(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
        function paradit() {
            var teksts = norm(meklet ? meklet.value.trim() : '');
            var redz = 0;
            kartes.forEach(function(k) {
                var ok = true;
                if (filtrs && filtrs.veids === 'sadala') ok = k.getAttribute('data-sadala') === filtrs.v;
                if (filtrs && filtrs.veids === 'birka') ok = (' ' + k.getAttribute('data-birkas') + ' ').indexOf(' ' + filtrs.v + ' ') > -1;
                if (ok && teksts) ok = norm(k.textContent).indexOf(teksts) > -1;
                k.hidden = !ok;
                if (ok) redz++;
            });
            tukss.hidden = redz > 0;
            filtrsRinda.hidden = !filtrs;
            if (filtrs) filtrsRinda.querySelector('[data-filtrs-teksts]').textContent =
                (filtrs.veids === 'sadala' ? 'Sadaļa: ' + filtrs.v : 'Birka: #' + filtrs.v) + ' · ' + redz + (redz === 1 ? ' raksts' : ' raksti');
            document.querySelectorAll('[data-filtrs-sadala]').forEach(function(b) {
                b.setAttribute('aria-pressed', String(!!filtrs && filtrs.veids === 'sadala' && filtrs.v === b.getAttribute('data-filtrs-sadala')));
            });
            document.querySelectorAll('[data-filtrs-birka]').forEach(function(b) {
                b.setAttribute('aria-pressed', String(!!filtrs && filtrs.veids === 'birka' && filtrs.v === b.getAttribute('data-filtrs-birka')));
            });
        }
        function iestatit(f) {
            filtrs = f;
            var u = new URL(location.href);
            u.searchParams.delete('birka'); u.searchParams.delete('sadala');
            if (f) u.searchParams.set(f.veids, f.v);
            history.replaceState(null, '', u.pathname + u.search + u.hash);
            paradit();
        }
        document.querySelectorAll('[data-filtrs-sadala]').forEach(function(b) {
            b.addEventListener('click', function() {
                var v = b.getAttribute('data-filtrs-sadala');
                iestatit(filtrs && filtrs.veids === 'sadala' && filtrs.v === v ? null : { veids: 'sadala', v: v });
            });
        });
        document.querySelectorAll('[data-filtrs-birka]').forEach(function(b) {
            b.addEventListener('click', function() {
                var v = b.getAttribute('data-filtrs-birka');
                iestatit(filtrs && filtrs.veids === 'birka' && filtrs.v === v ? null : { veids: 'birka', v: v });
            });
        });
        saraksts.querySelector('.blogs-notirit').addEventListener('click', function() {
            if (meklet) meklet.value = '';
            iestatit(null);
        });
        if (meklet) meklet.addEventListener('input', paradit);
        paradit();

        api('GET', '/api/blogs').then(function(d) {
            Object.keys(d.raksti || {}).forEach(function(s) {
                var r = d.raksti[s];
                document.querySelectorAll('[data-skaits-patik="' + s + '"]').forEach(function(n) { n.textContent = r.patik; });
                document.querySelectorAll('[data-skaits-kom="' + s + '"]').forEach(function(n) { n.textContent = r.komentari; });
            });
        }).catch(function() {});
    }

    // ---------- Raksts ----------
    var raksts = document.querySelector('[data-blogs-raksts]');
    if (!raksts) return;
    var slug = raksts.getAttribute('data-blogs-raksts');

    var viesis = lsGet('blogsViesis');
    if (!viesis || !/^[0-9a-f-]{36}$/i.test(viesis)) {
        viesis = (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, function() {
            return (Math.random() * 16 | 0).toString(16);
        }));
        lsSet('blogsViesis', viesis);
    }

    var patikPoga = raksts.querySelector('[data-blogs-patik]');
    var patikSk = raksts.querySelector('[data-patik-skaits]');
    var formaVieta = raksts.querySelector('[data-kom-forma]');
    var sarakstsKom = raksts.querySelector('[data-kom-saraksts]');
    var komSk = raksts.querySelector('[data-kom-skaits]');

    function patikStavoklis(n, es) {
        patikSk.textContent = n;
        patikPoga.setAttribute('aria-pressed', String(!!es));
        patikPoga.querySelector('.blogs-patik-teksts').textContent = es ? 'Tev patīk' : 'Patīk';
    }

    patikPoga.addEventListener('click', function() {
        var bija = patikPoga.getAttribute('aria-pressed') === 'true';
        var n = +patikSk.textContent || 0;
        patikStavoklis(Math.max(0, n + (bija ? -1 : 1)), !bija); // uzreiz, pēc tam API skaitlis
        if (!bija) {
            patikPoga.classList.remove('pukst');
            void patikPoga.offsetWidth;
            patikPoga.classList.add('pukst');
        }
        patikPoga.disabled = true;
        api('POST', '/api/blogs/' + slug + '/patik', { viesis: viesis })
            .then(function(d) { patikStavoklis(d.patik, d.esPatik); })
            .catch(function(e) { patikStavoklis(n, bija); if (LIB.toast) LIB.toast(e.message, true); })
            .then(function() { patikPoga.disabled = false; });
    });

    var dalities = raksts.querySelector('[data-blogs-dalities]');
    if (dalities) dalities.addEventListener('click', function() {
        var u = location.origin + location.pathname;
        var ok = function() { if (LIB.toast) LIB.toast('Saite nokopēta'); };
        if (navigator.share && matchMedia('(pointer: coarse)').matches) {
            navigator.share({ title: document.title, url: u }).catch(function() {});
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(u).then(ok, function() { prompt('Saite:', u); });
        } else prompt('Saite:', u);
    });

    var MENESI = ['janvārī', 'februārī', 'martā', 'aprīlī', 'maijā', 'jūnijā', 'jūlijā', 'augustā', 'septembrī', 'oktobrī', 'novembrī', 'decembrī'];
    function laiks(iso) {
        var d = new Date(iso), s = (Date.now() - d) / 1000;
        if (s < 60) return 'tikko';
        if (s < 3600) return 'pirms ' + Math.floor(s / 60) + ' min';
        if (s < 86400) return 'pirms ' + Math.floor(s / 3600) + ' h';
        var t = d.getDate() + '. ' + MENESI[d.getMonth()];
        if (d.getFullYear() !== new Date().getFullYear()) t = d.getFullYear() + '. gada ' + t;
        return t;
    }

    function zimetKomentarus(list) {
        komSk.textContent = list.length ? '(' + list.length + ')' : '';
        sarakstsKom.textContent = '';
        if (!list.length) {
            sarakstsKom.appendChild(el('li', 'blogs-kom-tukss', 'Vēl neviena komentāra. Būsi pirmais?'));
            return;
        }
        list.forEach(function(k) {
            var li = el('li', 'blogs-kom' + (k.mans ? ' blogs-kom--mans' : ''));
            li.id = 'k' + k.id;
            var foto = LIB.avatars ? LIB.avatars({ picture: k.foto, name: k.vards }, 'blogs-kom-foto')
                : el('span', 'user-avatar user-avatar-ph blogs-kom-foto', k.vards.charAt(0));
            li.appendChild(foto);
            var kerm = el('div', 'blogs-kom-kermenis');
            var galva = el('p', 'blogs-kom-galva');
            galva.appendChild(el('strong', 'blogs-kom-vards', k.vards));
            var t = el('time', 'blogs-kom-laiks', laiks(k.at));
            t.dateTime = k.at;
            t.title = new Date(k.at).toLocaleString('lv-LV');
            galva.appendChild(t);
            kerm.appendChild(galva);
            kerm.appendChild(el('p', 'blogs-kom-teksts', k.teksts));
            if (k.dzest) {
                var dz = el('button', 'blogs-kom-dzest', 'Dzēst');
                dz.type = 'button';
                dz.addEventListener('click', function() {
                    if (!confirm('Dzēst šo komentāru?')) return;
                    dz.disabled = true;
                    api('DELETE', '/api/blogs/komentari/' + k.id).then(ielade).catch(function(e) {
                        dz.disabled = false;
                        if (LIB.toast) LIB.toast(e.message, true);
                    });
                });
                kerm.appendChild(dz);
            }
            li.appendChild(kerm);
            sarakstsKom.appendChild(li);
        });
    }

    var MAX = 2000;
    function zimetFormu(lietotajs) {
        formaVieta.textContent = '';
        if (!lietotajs) {
            var aic = el('div', 'blogs-kom-aicinajums');
            aic.appendChild(el('p', '', 'Komentēt var reģistrēti lietotāji. Ienāc ar Google kontu — tas aizņem dažas sekundes.'));
            var a = el('a', 'btn-cta blogs-kom-ienakt', 'Ienākt un komentēt');
            a.href = LIB.signInUrl ? LIB.signInUrl(location.pathname + '#komentari') : '/auth/google';
            aic.appendChild(a);
            formaVieta.appendChild(aic);
            return;
        }
        var f = el('form', 'blogs-kom-forma');
        f.noValidate = true;
        var me = (LIB.me && LIB.me.user) || null;
        if (me && LIB.avatars) f.appendChild(LIB.avatars(me, 'blogs-kom-foto'));
        var lauki = el('div', 'blogs-kom-lauki');
        var lbl = el('label', 'sr-only', 'Tavs komentārs');
        lbl.htmlFor = 'blogs-kom-teksts';
        var ta = el('textarea', 'blogs-kom-ievade');
        ta.id = 'blogs-kom-teksts';
        ta.rows = 3;
        ta.maxLength = MAX;
        ta.placeholder = 'Ko tu par to domā?';
        var apaksa = el('div', 'blogs-kom-forma-apaksa');
        var sk = el('span', 'blogs-kom-zimes', '');
        var poga = el('button', 'btn-cta blogs-kom-sutit', 'Publicēt');
        poga.type = 'submit';
        poga.disabled = true;
        ta.addEventListener('input', function() {
            var n = ta.value.trim().length;
            poga.disabled = n < 2;
            sk.textContent = ta.value.length > MAX - 300 ? ta.value.length + ' / ' + MAX : '';
        });
        apaksa.appendChild(sk);
        apaksa.appendChild(poga);
        lauki.appendChild(lbl);
        lauki.appendChild(ta);
        lauki.appendChild(apaksa);
        f.appendChild(lauki);
        f.addEventListener('submit', function(e) {
            e.preventDefault();
            if (ta.value.trim().length < 2) return;
            poga.disabled = true;
            poga.textContent = 'Publicē…';
            api('POST', '/api/blogs/' + slug + '/komentari', { teksts: ta.value }).then(function(d) {
                ta.value = '';
                sk.textContent = '';
                zimetKomentarus(d.komentari);
                var pedejais = sarakstsKom.lastElementChild;
                if (pedejais) pedejais.classList.add('blogs-kom--jauns');
                if (LIB.toast) LIB.toast('Paldies! Komentārs publicēts.');
            }).catch(function(err) {
                if (LIB.toast) LIB.toast(err.message, true);
                poga.disabled = false;
            }).then(function() { poga.textContent = 'Publicēt'; });
        });
        formaVieta.appendChild(f);
    }

    var formaGatava = false;
    function ielade() {
        return api('GET', '/api/blogs/' + slug + '?viesis=' + encodeURIComponent(viesis)).then(function(d) {
            patikStavoklis(d.patik, d.esPatik);
            zimetKomentarus(d.komentari);
            if (!formaGatava) { zimetFormu(d.lietotajs); formaGatava = true; }
            if (location.hash === '#komentari' && d.lietotajs) {
                var ta = document.getElementById('blogs-kom-teksts');
                if (ta) ta.focus({ preventScroll: true });
            }
        }).catch(function() {
            formaVieta.textContent = '';
            formaVieta.appendChild(el('p', 'blogs-kom-ielade', 'Komentārus neizdevās ielādēt. Pamēģini pārlādēt lapu.'));
        });
    }
    ielade();
    // Pēc /api/me (script.js) forma var parādīt lietotāja foto
    document.addEventListener('lib:me', function() {
        if (formaGatava && LIB.me && LIB.me.user && !formaVieta.querySelector('.blogs-kom-foto')) {
            var f = formaVieta.querySelector('form');
            if (f && LIB.avatars) f.insertBefore(LIB.avatars(LIB.me.user, 'blogs-kom-foto'), f.firstChild);
        }
    });
})();
