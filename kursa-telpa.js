// Grupu kursa telpa (kursa-telpa.html). Bez ?k — manu kursu saraksts; ar ?k=<kurss> skati pēc hash:
//   #              kursa sākums: Google Meet saite, nodarbību saraksts, progress (pasniedzējam — rediģēšana)
//   #n/<nr>        nodarbība: PDF/HTML lejupielāde, tīmekļa saturs, uzdevumi (krustvārdi, vārdu meklēšana,
//                  atmiņas spēle, burtu jucekļi, teikumu secība), mājasdarbs, pasniedzēja materiāli
//   #dalibnieki    pasniedzējam: grupas dalībnieki un progress
// API: worker/grupu-kursi.js. Saturs no riki/gk-sagatavot.mjs.
(function () {
    'use strict';
    const kurss = (new URLSearchParams(location.search).get('k') || '').replace(/[^a-z0-9-]/g, '');
    const sakne = document.getElementById('gk-saknes');
    const lapa = document.getElementById('gk-lapa');
    const virsraksts = document.getElementById('gk-virsraksts');
    const cels = document.getElementById('gk-cels');
    let P = null;            // kursa pārskats
    const nodKes = {};

    // ---------- palīgi ----------
    function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    function studentaSkats() { try { return localStorage.getItem('gk-skats') === 'students'; } catch (e) { return false; } }
    function iestatitSkatu(st) { try { if (st) localStorage.setItem('gk-skats', 'students'); else localStorage.removeItem('gk-skats'); } catch (e) {} location.hash = ''; location.reload(); }
    function api(method, url, body, galvenes) {
        const headers = Object.assign(body && !(body instanceof Blob) ? { 'Content-Type': 'application/json' } : {}, galvenes || {});
        if (studentaSkats()) headers['X-Gk-Skats'] = 'students';
        return fetch(url, { method, credentials: 'same-origin', headers, body: body instanceof Blob ? body : body ? JSON.stringify(body) : undefined })
            .then((r) => r.json().catch(() => ({})).then((d) => { if (!r.ok) { const e = new Error(d.error || 'Kļūda'); e.status = r.status; throw e; } return d; }));
    }
    function toast(m, kl) { if (window.LIB && LIB.toast) LIB.toast(m, kl); else alert(m); }
    function lvDat(iso) { if (!iso) return ''; const p = String(iso).slice(0, 10).split('-'); return p[2] + '.' + p[1] + '.' + p[0] + '.'; }
    const NED = ['svētdiena', 'pirmdiena', 'otrdiena', 'trešdiena', 'ceturtdiena', 'piektdiena', 'sestdiena'];
    function nedDiena(iso) { const p = String(iso).split('-').map(Number); return NED[new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay()]; }
    function sodienIso() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
    function izmers(b) { return b > 1048576 ? (b / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }
    const IKONAS = {
        skana: '<path d="M4 10v4h4l5 4V6L8 10H4z"/><path d="M16 9a4 4 0 010 6M18.5 6.5a7.5 7.5 0 010 11"/>',
        video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>',
        pdf: '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 13h6M9 17h4"/>',
        html: '<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 8h18M9 21h6M12 18v3"/>',
        saite: '<path d="M10 14a4 4 0 006 0l3-3a4 4 0 00-6-6l-1 1"/><path d="M14 10a4 4 0 00-6 0l-3 3a4 4 0 006 6l1-1"/>',
        fails: '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/>',
        lejup: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
        kal: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
        cek: '<path d="M6 12l4 4 8-8"/>', slot: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
        acs: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
        acsX: '<path d="M10.6 5.1A9.7 9.7 0 0112 5c6 0 10 7 10 7a17 17 0 01-3.1 3.9M6.6 6.6C3.8 8.4 2 12 2 12s4 7 10 7a9.4 9.4 0 005.4-1.6"/><path d="M9.9 9.9a3 3 0 004.2 4.2M3 3l18 18"/>',
        speles: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><path d="M16.5 13v7M13 16.5h7"/>',
        grupa: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0113 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2a5 5 0 016 4.8"/>',
        x: '<path d="M6 6l12 12M18 6L6 18"/>', zimulis: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>'
    };
    function ikona(n, cls) { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', cls || 'ek-ikona'); s.setAttribute('aria-hidden', 'true'); s.innerHTML = IKONAS[n] || ''; return s; }
    function poga(teksts, cls, fn) { const b = el('button', cls || 'btn-secondary ek-poga-maza', teksts); b.type = 'button'; if (fn) b.addEventListener('click', fn); return b; }
    function saite(teksts, href, cls) { const a = el('a', cls || 'btn-secondary', teksts); a.href = href; return a; }
    // Pasniedzējam: mazas ikonpogas ar uzrakstu, uzbraucot ar peli (data-tips): acs = Paslēpt/Rādīt, X = Dzēst
    function ikonPoga(ik, tips, aria, fn, cls) {
        const b = el('button', 'gk-ikonpoga gk-ikonpoga--maza' + (cls ? ' ' + cls : '')); b.type = 'button';
        b.setAttribute('data-tips', tips); b.setAttribute('aria-label', aria); b.appendChild(ikona(ik));
        b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); fn(b); });
        return b;
    }
    function nodarbibasPogas(n) {
        const w = el('span', 'gk-ikonpogas');
        const nos = n.nr + '. ' + n.nosaukums;
        const r = ikonPoga(n.redzama ? 'acsX' : 'acs', n.redzama ? 'Paslēpt' : 'Rādīt', (n.redzama ? 'Paslēpt studentiem: ' : 'Rādīt studentiem: ') + nos, (b) => {
            b.disabled = true;
            api('PATCH', '/api/gk/' + kurss + '/nodarbiba/' + n.nr, { redzama: !n.redzama })
                .then(() => { toast(n.redzama ? 'Nodarbība paslēpta studentiem' : 'Nodarbība atkal redzama studentiem'); return atjaunot(); })
                .catch((e) => { b.disabled = false; toast(e.message, true); });
        }, 'gk-redzamiba');
        r.setAttribute('aria-pressed', String(!n.redzama));
        w.appendChild(r);
        w.appendChild(ikonPoga('x', 'Dzēst', 'Dzēst nodarbību: ' + nos, () => dzestNodarbibu(n), 'gk-ikonpoga--dzest'));
        return w;
    }
    function dzestNodarbibu(n) {
        if (!confirm('Dzēst ' + n.nr + '. nodarbību «' + n.nosaukums + '» ar visiem tās materiāliem un studentu progresu? To nevar atsaukt.')) return;
        api('DELETE', '/api/gk/' + kurss + '/nodarbiba/' + n.nr).then(() => { toast('Nodarbība dzēsta'); location.hash = ''; return atjaunot(); }).catch((e) => toast(e.message, true));
    }
    // Nodarbības sadaļas stāvoklis: 'redzama' | 'slepta' | 'dzesta'
    function sadalasStav(N, id) { return (N.sadalas && N.sadalas[id]) || 'redzama'; }
    function mainitSadalu(N, id, stavoklis, b) {
        if (b) b.disabled = true;
        return api('PATCH', '/api/gk/' + kurss + '/nodarbiba/' + N.nr, { sadala: { id, stavoklis } })
            .then(() => { toast(stavoklis === 'slepta' ? 'Sadaļa paslēpta studentiem' : stavoklis === 'dzesta' ? 'Sadaļa dzēsta' : 'Sadaļa atkal redzama'); return atjaunot(); })
            .catch((e) => { if (b) b.disabled = false; toast(e.message, true); });
    }
    function karte(cls) { return el('div', 'ek-karte' + (cls ? ' ' + cls : '')); }
    function jaukt(a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
    const bezAkc = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '');
    const norm = (s) => String(s == null ? '' : s).toLowerCase().normalize('NFC').replace(/[.,!?¡¿;:"'’«»“”()]/g, ' ').replace(/\s+/g, ' ').trim();
    // 2 = precīzi, 1 = pareizi, bet bez garumzīmēm, 0 = nepareizi
    function salidzinat(atb, varianti) {
        const a = norm(atb); if (!a) return 0;
        if (varianti.some((v) => norm(v) === a)) return 2;
        if (varianti.some((v) => bezAkc(norm(v)) === bezAkc(a))) return 1;
        return 0;
    }

    // ---------- kursa valoda ----------
    // Nodarbības saturs var norādīt valoda ('es' noklusējums, 'et') un audio: true (ierakstītā izruna, riki/ek-audio.py --gk)
    const VAL = {
        es: { bcp: 'es-ES', nos: 'spāņu', iski: 'spāniski', labi: '¡Muy bien!', fant: '¡Fantástico!', bravo: '¡Bravo!', genial: '¡Genial!', sutits: '¡Enviado!' },
        et: { bcp: 'et-EE', nos: 'igauņu', iski: 'igauniski', labi: 'Väga hea!', fant: 'Suurepärane!', bravo: 'Tubli!', genial: 'Vahva!', sutits: 'Saadetud!' },
    };
    let VALODA = 'es', AUDIO = false;
    const V = () => VAL[VALODA];

    // ---------- runa ----------
    // avots = nospiestā poga/teksts: otrs klikšķis uz tā paša aptur skaņu
    let skanAvots = null, skanAudio = null;
    function beigtSkanu() { if (skanAvots) { skanAvots.classList.remove('skan'); skanAvots.removeAttribute('aria-pressed'); pogasTeksts(skanAvots, 'Klausīties tekstu'); } skanAvots = null; }
    function pogasTeksts(b, t) { const n = b.classList.contains('gk-klausit') && b.lastChild; if (n && n.nodeType === 3) n.nodeValue = ' ' + t; }
    async function audioAtslega(teksts) { // = sha1(teksts NFC)[:16], tāpat kā riki/ek-audio.py
        const h = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(String(teksts).normalize('NFC')));
        return Array.from(new Uint8Array(h).slice(0, 8), (x) => x.toString(16).padStart(2, '0')).join('');
    }
    function runat(teksts, avots) {
        const bija = avots && avots === skanAvots;
        if (skanAudio) { skanAudio.pause(); skanAudio = null; }
        if ('speechSynthesis' in window) speechSynthesis.cancel();
        beigtSkanu();
        if (bija) return;
        if (AUDIO && window.crypto && crypto.subtle) {
            if (avots) { skanAvots = avots; avots.classList.add('skan'); avots.setAttribute('aria-pressed', 'true'); pogasTeksts(avots, 'Apturēt'); }
            const atpakal = () => { beigtSkanu(); sintezet(teksts, avots); };
            audioAtslega(teksts).then((k) => {
                if (avots && skanAvots !== avots) return;
                const a = new Audio('/api/gk/' + encodeURIComponent(kurss) + '/audio/' + k); skanAudio = a;
                a.onended = () => { if (skanAudio === a) { skanAudio = null; beigtSkanu(); } };
                a.onerror = () => { if (skanAudio === a) { skanAudio = null; atpakal(); } };
                a.play().catch(() => { if (skanAudio === a) { skanAudio = null; atpakal(); } });
            }).catch(atpakal);
            return;
        }
        sintezet(teksts, avots);
    }
    function sintezet(teksts, avots) {
        if (!('speechSynthesis' in window)) { toast('Šī pārlūkprogramma neatbalsta skaņu', true); return; }
        const u = new SpeechSynthesisUtterance(String(teksts).replace(/\([^)]*\)/g, ''));
        const bcp = V().bcp;
        u.lang = bcp; u.rate = 0.9;
        const b = speechSynthesis.getVoices().find((v) => v.lang === bcp) || speechSynthesis.getVoices().find((v) => v.lang.slice(0, 2) === bcp.slice(0, 2));
        if (b) u.voice = b;
        if (avots) { skanAvots = avots; avots.classList.add('skan'); avots.setAttribute('aria-pressed', 'true'); pogasTeksts(avots, 'Apturēt'); u.onend = u.onerror = () => { if (skanAvots === avots) beigtSkanu(); }; }
        speechSynthesis.speak(u);
    }
    function skanasPoga(teksts) { const b = el('button', 'ek-skana-poga'); b.type = 'button'; b.setAttribute('aria-label', 'Klausīties: ' + teksts); b.appendChild(ikona('skana')); b.addEventListener('click', (e) => { e.stopPropagation(); runat(teksts, b); }); return b; }

    // ---------- stāvokļi ----------
    function ielade(ir) { lapa.setAttribute('aria-busy', ir ? 'true' : 'false'); }
    function notirit() { sakne.textContent = ''; window.scrollTo(0, 0); }
    function stavoklis(virs, teksts, pogas) {
        notirit();
        const k = karte('ek-stavoklis');
        k.appendChild(el('span')).setAttribute('data-empa-poza', 'apjucis');
        k.appendChild(el('h2', '', virs)); if (teksts) k.appendChild(el('p', '', teksts));
        const pg = el('div', 'ek-pogas'); (pogas || []).forEach((p) => pg.appendChild(p)); k.appendChild(pg);
        sakne.appendChild(k);
        if (window.EMPANADILLO && EMPANADILLO.svg) { const z = k.querySelector('[data-empa-poza]'); z.innerHTML = EMPANADILLO.svg('apjucis', { scale: 3 }); }
    }
    function kluda(e) { stavoklis('Neizdevās ielādēt', e.message || 'Mēģini vēlreiz.', [saite(kurss ? 'Uz kursa sākumu' : 'Mani kursi', kurss ? '#' : 'konts.html#kursi', 'btn-cta')]); }
    function ienakt() { return saite('Ienākt ar Google', window.LIB && LIB.signInUrl ? LIB.signInUrl(location.pathname + location.search) : '/auth/google', 'btn-cta'); }

    // ===================================================================
    // KURSU SARAKSTS (bez ?k)
    // ===================================================================
    function saraksts() {
        virsraksts.textContent = 'Kursu telpas'; cels.textContent = 'Kursu telpas'; document.title = 'Kursu telpas — Libertas';
        return api('GET', '/api/gk').then((d) => {
            notirit();
            const w = el('div', 'gk-saraksts');
            if (d.pasniedzejs) w.appendChild(el('p', 'gk-ievads', 'Tu esi pasniedzējs: vari atvērt un rediģēt visu grupu kursu telpas. Telpu izveido vienreiz katram kursam.'));
            const kursi = d.kursi || [];
            if (!kursi.length) {
                stavoklis('Tev vēl nav grupu kursu', 'Kad pieteiksies grupas kursam un apmaksāsi to, šeit atvērsies kursa telpa ar nodarbībām un materiāliem.', [saite('Skatīt kursus', 'kursi.html', 'btn-cta')]);
                return;
            }
            const g = el('div', 'gk-kursu-rezgis');
            kursi.forEach((k) => {
                const c = karte('gk-kursa-karte');
                const kPasn = d.pasniedzejs || k.loma === 'pasniedzejs'; // pasniedzējs visos kursos vai tikai šajā
                c.appendChild(el('h2', '', k.name));
                if (!d.pasniedzejs && k.loma === 'pasniedzejs') c.appendChild(el('span', 'badge badge-uznemts', 'Pasniedzējs'));
                const meta = el('p', 'gk-meta');
                meta.textContent = (k.telpa ? k.nodarbibas + ' nodarbības' : 'Telpa vēl nav izveidota') + (kPasn && k.telpa ? ' · ' + k.studenti + ' studenti' : '');
                c.appendChild(meta);
                const pg = el('div', 'ek-pogas');
                if (k.telpa) {
                    const pieejams = kPasn || k.paid || ['uznemts', 'sacis', 'pabeidzis'].includes(k.status);
                    if (pieejams) pg.appendChild(saite('Atvērt kursu', 'kursa-telpa.html?k=' + encodeURIComponent(k.id), 'btn-cta'));
                    else pg.appendChild(el('span', 'badge badge-pieteicies', 'Atvērsies pēc apmaksas'));
                } else if (kPasn) {
                    pg.appendChild(poga('Izveidot kursa telpu', 'btn-cta', () => api('POST', '/api/gk/' + k.id).then(() => { location.href = 'kursa-telpa.html?k=' + k.id; }).catch((e) => toast(e.message, true))));
                } else pg.appendChild(el('span', 'gk-meta', 'Kursa telpa tiek gatavota'));
                c.appendChild(pg); g.appendChild(c);
            });
            w.appendChild(g); sakne.appendChild(w);
        });
    }

    // ===================================================================
    // KURSA SĀKUMS
    // ===================================================================
    function ieladetParskatu() { return api('GET', '/api/gk/' + kurss).then((d) => { P = d; return d; }); }
    const izpilditi = (nr) => {
        const n = P.nodarbibas.find((x) => x.nr === nr), sd = (n && n.sadalas) || {};
        return Object.keys((P.progress && P.progress[nr]) || {}).filter((id) => { const st = sd['u-' + id]; return !st || (st === 'slepta' && P.piekluve && P.piekluve.pasniedzejs); }).length;
    };

    function meetKarte() {
        const K = P.kurss, pasn = P.piekluve.pasniedzejs;
        const k = karte('gk-meet');
        const g = el('div', 'gk-meet-galva'); g.appendChild(ikona('video', 'gk-meet-ikona'));
        const t = el('div'); t.appendChild(el('h2', '', 'Tiešsaistes nodarbības')); t.appendChild(el('p', '', 'Viena Google Meet saite visām kursa nodarbībām'));
        g.appendChild(t); k.appendChild(g);
        // tuvākā nodarbība
        const sod = sodienIso();
        const nak = P.nodarbibas.filter((n) => n.datums && n.datums >= sod).sort((a, b) => a.datums.localeCompare(b.datums))[0];
        if (nak) {
            const p = el('p', 'gk-nakama'); p.appendChild(ikona('kal'));
            p.appendChild(document.createTextNode((nak.datums === sod ? 'Šodien' : 'Nākamā nodarbība: ' + nedDiena(nak.datums) + ', ' + lvDat(nak.datums)) + (P.grupa ? ' ' + P.grupa.laiks.split('–')[0] : '') + ' · ' + nak.nr + '. ' + nak.nosaukums));
            k.appendChild(p);
        } else if (P.grupa) {
            k.appendChild(el('p', 'gk-nakama', P.grupa.teksts + ' ' + P.grupa.laiks));
        }
        if (K.meet_url) {
            const a = saite('Pievienoties nodarbībai', K.meet_url, 'btn-cta gk-meet-poga'); a.target = '_blank'; a.rel = 'noopener';
            a.insertBefore(ikona('video'), a.firstChild); k.appendChild(a);
            const u = el('p', 'gk-meet-url'); u.textContent = K.meet_url.replace(/^https?:\/\//, ''); k.appendChild(u);
        } else k.appendChild(el('p', 'gk-meet-tukss', pasn ? 'Saite vēl nav pievienota — ievadi to zemāk.' : 'Pasniedzējs drīzumā pievienos nodarbību saiti.'));
        if (pasn) {
            const f = el('form', 'gk-forma gk-meet-forma');
            const l = el('label', '', 'Google Meet saite'); const i = el('input', 'lauks'); i.type = 'url'; i.placeholder = 'https://meet.google.com/abc-defg-hij'; i.value = K.meet_url || ''; i.id = 'gk-meet-ievade'; l.htmlFor = i.id;
            f.appendChild(l); const r = el('div', 'gk-rinda'); r.appendChild(i);
            const s = el('button', 'btn-secondary ek-poga-maza', 'Saglabāt'); s.type = 'submit'; r.appendChild(s); f.appendChild(r);
            f.addEventListener('submit', (e) => { e.preventDefault(); api('PATCH', '/api/gk/' + kurss, { meet_url: i.value }).then(() => { toast('Saite saglabāta'); atjaunot(); }).catch((er) => toast(er.message, true)); });
            k.appendChild(f);
        }
        return k;
    }

    function sakums() {
        notirit();
        const K = P.kurss, pasn = P.piekluve.pasniedzejs;
        const wrap = el('div', 'ek-sakums gk-sakums');
        const kr = el('div');
        // ievads
        if (K.ievads || pasn) {
            const iv = el('div', 'gk-kursa-ievads');
            if (K.ievads) iv.appendChild(el('p', '', K.ievads));
            if (pasn) {
                const b = poga(K.ievads ? 'Labot ievadu' : '+ Pievienot ievadu kursam', 'btn-link', () => {
                    const t = prompt('Īss ievads studentiem (redzams kursa sākumā):', K.ievads || '');
                    if (t == null) return;
                    api('PATCH', '/api/gk/' + kurss, { ievads: t }).then(atjaunot).catch((e) => toast(e.message, true));
                });
                iv.appendChild(b);
            }
            kr.appendChild(iv);
        }
        const ol = el('ol', 'ek-taka gk-taka');
        const sod = sodienIso();
        P.nodarbibas.forEach((n) => {
            const izp = izpilditi(n.nr), visi = n.uzdevumi || 0;
            const gatavs = visi > 0 && izp >= visi;
            const tagad = !gatavs && n.datums && n.datums <= sod;
            const li = el('li', 'ek-solis gk-solis ' + (gatavs ? 'ek-solis--izdarits' : n.redzama ? 'ek-solis--tagad' : 'ek-solis--slegts'));
            const z = el('span', 'ek-solis-zime'); if (gatavs) z.appendChild(ikona('cek')); else z.textContent = String(n.nr); li.appendChild(z);
            const t = el('div', 'ek-solis-teksts');
            const h = el('h3'); const a = el('a', 'ek-solis-saite', n.nr + '. ' + n.nosaukums); a.href = '#n/' + n.nr; h.appendChild(a); t.appendChild(h);
            const meta = el('p', 'gk-solis-meta');
            if (n.datums) { meta.appendChild(ikona('kal')); meta.appendChild(document.createTextNode(lvDat(n.datums))); }
            const birkas = [];
            n.materiali.forEach((m) => { if (m.tips === 'pdf') birkas.push('PDF'); if (m.tips === 'html') birkas.push('Prezentācija'); });
            const pap = n.materiali.filter((m) => m.tips === 'fails' || m.tips === 'saite').length;
            if (pap) birkas.push(pap + ' papildmateriāli');
            birkas.forEach((b) => meta.appendChild(el('span', 'gk-birka', b)));
            if (!n.redzama) meta.appendChild(el('span', 'gk-birka gk-birka--slepta', 'Paslēpta studentiem'));
            const md = P.majasdarbi && P.majasdarbi[n.nr];
            if (pasn && md) meta.appendChild(el('span', 'gk-birka gk-birka--md', md + (md % 10 === 1 && md % 100 !== 11 ? ' mājasdarbs' : ' mājasdarbi') + ' jāpārbauda'));
            if (!pasn && md && md.statuss !== 'melnraksts') meta.appendChild(el('span', 'gk-birka gk-birka--md-' + md.statuss, 'Mājasdarbs: ' + MD_NOS[md.statuss] + (md.statuss === 'novertets' && md.vertejums ? ' ' + md.vertejums : '')));
            t.appendChild(meta);
            if (n.temas && n.temas.length) t.appendChild(el('p', '', n.temas.map((x) => x.replace(/^\d+\.\d+\.\s*/, '')).join(' · ')));
            li.appendChild(t);
            const lab = el('div', 'gk-solis-labais');
            if (visi) { const r = el('span', 'gk-uzd-skaits' + (gatavs ? ' gatavs' : ''), pasn ? visi + ' uzd.' : izp + '/' + visi); r.title = 'Izpildītie uzdevumi'; r.insertBefore(ikona('speles'), r.firstChild); lab.appendChild(r); }
            if (pasn) lab.appendChild(nodarbibasPogas(n));
            lab.appendChild(saite(tagad && !izp ? 'Sākt' : 'Atvērt', '#n/' + n.nr, (tagad ? 'btn-cta' : 'btn-secondary') + ' ek-poga-maza'));
            li.appendChild(lab);
            ol.appendChild(li);
        });
        if (!P.nodarbibas.length) kr.appendChild(el('p', 'gk-meta', pasn ? 'Vēl nav nevienas nodarbības — pievieno pirmo!' : 'Nodarbības parādīsies šeit, kad pasniedzējs tās pievienos.'));
        kr.appendChild(ol);
        if (pasn) kr.appendChild(jaunaNodarbibaForma());
        wrap.appendChild(kr);

        // labais panelis
        const pan = el('aside', 'ek-panelis gk-panelis');
        pan.appendChild(meetKarte());
        const visiU = P.nodarbibas.reduce((s, n) => s + (n.uzdevumi || 0), 0);
        if (visiU && !pasn) {
            const k1 = karte(); k1.style.textAlign = 'center';
            const izp = P.nodarbibas.reduce((s, n) => s + Math.min(izpilditi(n.nr), n.uzdevumi || 0), 0);
            const ap = el('div', 'ek-aplis'); ap.style.setProperty('--p', Math.round(izp / visiU * 100)); ap.appendChild(el('span', '', izp + '/' + visiU)); k1.appendChild(ap);
            const pp = el('p', 'gk-meta', 'izpildīti uzdevumi'); pp.style.marginTop = '10px'; k1.appendChild(pp);
            pan.appendChild(k1);
        }
        if (pasn || P.piekluve.students) {
            const k2 = karte('gk-pasn-karte');
            k2.appendChild(el('h3', '', P.piekluve.students ? 'Studenta skats' : 'Pasniedzēja rīki'));
            const sk = el('div', 'gk-pogu-kolonna');
            if (pasn) {
                const jap = Object.values(P.majasdarbi || {}).reduce((a, b) => a + (Number(b) || 0), 0);
                sk.appendChild(saite('Mājasdarbi' + (jap ? ' (' + jap + ' jāpārbauda)' : ''), '#majasdarbi', (jap ? 'btn-cta' : 'btn-secondary') + ' ek-poga-maza'));
                sk.appendChild(saite('Dalībnieki un progress', '#dalibnieki', 'btn-secondary ek-poga-maza'));
                sk.appendChild(poga('Skatīt kā students', 'btn-secondary ek-poga-maza', () => iestatitSkatu(true)));
            } else sk.appendChild(poga('Atpakaļ uz pasniedzēja skatu', 'btn-secondary ek-poga-maza', () => iestatitSkatu(false)));
            k2.appendChild(sk); pan.appendChild(k2);
        }
        wrap.appendChild(pan);
        sakne.appendChild(wrap);
    }

    function jaunaNodarbibaForma() {
        const d = el('details', 'gk-jauna'); d.appendChild(el('summary', 'btn-secondary ek-poga-maza', '+ Pievienot nodarbību'));
        const f = el('form', 'gk-forma');
        const nak = (P.nodarbibas.reduce((m, n) => Math.max(m, n.nr), 0) || 0) + 1;
        const i1 = lauks(f, 'Numurs', 'number', String(nak)); i1.min = 1; i1.style.maxWidth = '120px';
        const i2 = lauks(f, 'Nosaukums', 'text', ''); i2.placeholder = 'piem., Darbs un profesijas';
        const s = el('button', 'btn-cta ek-poga-maza', 'Pievienot'); s.type = 'submit'; f.appendChild(s);
        f.addEventListener('submit', (e) => {
            e.preventDefault();
            api('POST', '/api/gk/' + kurss + '/nodarbibas', { nr: Number(i1.value), nosaukums: i2.value }).then((r) => { location.hash = '#n/' + r.nr; return atjaunot(); }).catch((er) => toast(er.message, true));
        });
        d.appendChild(f); return d;
    }
    function lauks(f, nos, tips, v) {
        const id = 'gk-l-' + Math.random().toString(36).slice(2, 8);
        const l = el('label', '', nos); l.htmlFor = id; const i = el('input', 'lauks'); i.type = tips; i.id = id; i.value = v || '';
        const w = el('div', 'gk-lauks'); w.appendChild(l); w.appendChild(i); f.appendChild(w); return i;
    }

    // ===================================================================
    // NODARBĪBA
    // ===================================================================
    function nodarbibaDati(nr) { if (nodKes[nr]) return Promise.resolve(nodKes[nr]); return api('GET', '/api/gk/' + kurss + '/nodarbiba/' + nr).then((d) => (nodKes[nr] = d)); }
    function failaUrl(m, lejup) { return '/api/gk/' + kurss + '/fails/' + m.id + (lejup ? '?lejupielade=1' : ''); }

    function nodarbiba(nr) {
        return nodarbibaDati(nr).then((d) => {
            notirit();
            const N = d.nodarbiba, S = d.saturs || {}, pasn = d.pasniedzejs;
            VALODA = VAL[S.valoda] ? S.valoda : 'es'; AUDIO = !!S.audio;
            virsraksts.textContent = N.nr + '. ' + N.nosaukums;
            document.title = N.nr + '. nodarbība — ' + P.kurss.name + ' — Libertas';
            const lay = el('div', 'ek-nod gk-nod');
            const nav = el('nav', 'ek-nod-nav gk-nod-nav'); nav.setAttribute('aria-label', 'Nodarbības saturs');
            const atp = saite('← Kursa sākums', '#', 'mat-atpakal'); atp.style.padding = '0'; nav.appendChild(atp);
            const navOl = el('ol'); nav.appendChild(navOl);
            const sat = el('div', 'gk-nod-saturs');
            let sk = 0;
            // vai sadaļu rādīt: dzēstās nerāda nevienam, paslēptās — tikai pasniedzējam
            const rada = (id) => { const st = sadalasStav(N, id); return st === 'redzama' || (st === 'slepta' && pasn); };
            const sadala = (id, virs, meta, navTeksts, gatavs) => {
                const slepta = sadalasStav(N, id) === 'slepta';
                const s = el('section', 'ek-bloks gk-bloks' + (slepta ? ' gk-bloks--slepta' : '')); s.id = 'gk-' + id;
                const g = el('div', 'ek-bloks-galva'); g.appendChild(el('span', 'mat-nr', String(++sk))); const h = el('h2', '', virs); g.appendChild(h);
                if (slepta) g.appendChild(el('span', 'gk-birka gk-birka--slepta', 'Paslēpta studentiem'));
                if (meta) g.appendChild(el('span', 'ek-bloks-meta', meta));
                if (pasn) {
                    const pg = el('span', 'gk-ikonpogas gk-ikonpogas--sadala');
                    pg.appendChild(ikonPoga(slepta ? 'acs' : 'acsX', slepta ? 'Rādīt' : 'Paslēpt', (slepta ? 'Rādīt studentiem sadaļu: ' : 'Paslēpt studentiem sadaļu: ') + virs, (b) => mainitSadalu(N, id, slepta ? 'redzama' : 'slepta', b), 'gk-redzamiba'));
                    pg.appendChild(ikonPoga('x', 'Dzēst', 'Dzēst sadaļu: ' + virs, (b) => { if (confirm('Dzēst sadaļu «' + virs + '»? Studenti to vairs neredzēs. (Atjaunot var nodarbības augšā.)')) mainitSadalu(N, id, 'dzesta', b); }, 'gk-ikonpoga--dzest'));
                    g.appendChild(pg);
                }
                s.appendChild(g); sat.appendChild(s);
                const li = el('li', gatavs ? 'gatavs' : ''); const a = el('a'); a.href = '#gk-' + id;
                a.appendChild(el('span', 'nr', gatavs ? '✓' : String(sk))); a.appendChild(document.createTextNode(navTeksts || virs));
                a.addEventListener('click', (e) => { e.preventDefault(); s.scrollIntoView({ behavior: 'smooth', block: 'start' }); navOl.querySelectorAll('a').forEach((x) => x.removeAttribute('aria-current')); a.setAttribute('aria-current', 'step'); });
                li.appendChild(a); navOl.appendChild(li);
                return s;
            };

            // 0. galva: datums, tēmas, lejupielādes
            const gal = el('div', 'gk-nod-galva');
            if (pasn) {
                const rj = el('p', 'gk-redzamiba-josla');
                rj.appendChild(el('span', 'gk-birka' + (N.redzama ? '' : ' gk-birka--slepta'), N.redzama ? 'Redzama studentiem' : 'Paslēpta studentiem'));
                rj.appendChild(nodarbibasPogas(N));
                const dz = Object.keys(N.sadalas || {}).filter((id) => N.sadalas[id] === 'dzesta').length;
                if (dz) rj.appendChild(poga('Atjaunot dzēstās sadaļas (' + dz + ')', 'btn-link ek-poga-maza', () => {
                    api('PATCH', '/api/gk/' + kurss + '/nodarbiba/' + N.nr, { atjaunotSadalas: true }).then(() => { toast('Sadaļas atjaunotas'); return atjaunot(); }).catch((e) => toast(e.message, true));
                }));
                gal.appendChild(rj);
            }
            if (N.datums) { const p = el('p', 'gk-nakama'); p.appendChild(ikona('kal')); p.appendChild(document.createTextNode(nedDiena(N.datums) + ', ' + lvDat(N.datums) + (P.grupa ? ' · ' + P.grupa.laiks : ''))); gal.appendChild(p); }
            const temas = S.temas && S.temas.length ? S.temas : N.temas;
            if (temas && temas.length) { const ul = el('ul', 'ek-merki'); temas.forEach((t) => ul.appendChild(el('li', '', t))); gal.appendChild(ul); }
            if (N.apraksts) gal.appendChild(el('p', 'gk-apraksts', N.apraksts));
            const prez = d.materiali.filter((m) => m.tips === 'pdf' || m.tips === 'html');
            const lej = el('div', 'gk-lejupielades');
            prez.forEach((m) => lej.appendChild(prezKarte(m)));
            if (P.kurss.meet_url) {
                const mk = el('a', 'gk-lej-karte gk-lej-karte--meet'); mk.href = P.kurss.meet_url; mk.target = '_blank'; mk.rel = 'noopener';
                mk.appendChild(ikona('video', 'gk-lej-ikona')); const t = el('span'); t.appendChild(el('b', '', 'Google Meet')); t.appendChild(el('small', '', 'Pievienoties nodarbībai')); mk.appendChild(t); lej.appendChild(mk);
            }
            if (lej.children.length) gal.appendChild(lej);
            else if (!pasn) gal.appendChild(el('p', 'gk-meta', 'Prezentācija vēl nav pievienota.'));
            sat.appendChild(gal);
            if (pasn) sat.appendChild(pasniedzejaPanelis(N, d.materiali));

            // 1. saturs
            const bloki = S.bloki || [];
            if (bloki.length) {
                const grupas = grupetBlokus(bloki);
                grupas.forEach((gr, i) => {
                    if (!rada('s' + i)) return;
                    const s = sadala('s' + i, gr.virs, gr.meta, gr.virs);
                    gr.bloki.forEach((b, j) => s.appendChild(renderBloks(b, bloki, j === 0 && b.title === gr.virs)));
                });
            } else if (rada('saturs')) {
                const s = sadala('saturs', 'Nodarbības saturs');
                s.appendChild(el('p', 'gk-meta', prez.length ? 'Šīs nodarbības materiāls ir prezentācijā — atver vai lejupielādē to augstāk.' : 'Saturs tiks pievienots drīzumā.'));
            }
            // 2. uzdevumi
            const U = S.uzdevumi || [];
            U.forEach((u) => {
                if (!rada('u-' + u.id)) return;
                const pab = d.progress[u.id] != null;
                const s = sadala('u-' + u.id, u.virsraksts, pab ? '✓ izpildīts' : 'uzdevums', '✎ ' + u.virsraksts, pab);
                s.classList.add('gk-speles-bloks');
                if (u.apraksts) s.appendChild(el('p', 'gk-uzd-apraksts', u.apraksts));
                s.appendChild(renderUzdevums(u, nr));
            });
            // 3. mājasdarbs
            if (S.majasdarbs && rada('majasdarbs')) {
                const M = d.majasdarbs;
                const iesn = M && M.statuss !== 'melnraksts';
                const meta = pasn ? (P.majasdarbi[nr] ? P.majasdarbi[nr] + ' jāpārbauda' : '') : M ? MD_NOS[M.statuss] : '';
                const s = sadala('majasdarbs', 'Mājasdarbs', meta, 'Mājasdarbs', !pasn && iesn);
                if (pasn) {
                    const k = karte('gk-majasdarbs'); k.appendChild(el('p', '', S.majasdarbs.teksts));
                    if (S.majasdarbs.prasibas) { const ul = el('ul', 'ek-merki'); S.majasdarbs.prasibas.forEach((p) => ul.appendChild(el('li', '', p))); k.appendChild(ul); }
                    s.appendChild(k);
                    s.appendChild(el('h3', 'gk-bloka-virs', 'Iesniegtie mājasdarbi')).style.marginTop = 'var(--sp-5)';
                    const sar = el('div', 'gk-md-saraksts'); s.appendChild(sar);
                    iesniegumi(sar, nr);
                } else s.appendChild(majasdarbaRedaktors(S, nr, M));
            }
            // 4. papildmateriāli
            const pap = d.materiali.filter((m) => m.tips === 'fails' || m.tips === 'saite');
            if ((pap.length || pasn) && rada('materiali')) {
                const s = sadala('materiali', 'Papildmateriāli', pap.length ? pap.length + '' : '');
                if (!pap.length) s.appendChild(el('p', 'gk-meta', 'Vēl nav pievienots neviens papildmateriāls.'));
                const ul = el('ul', 'gk-materiali');
                pap.forEach((m) => ul.appendChild(materialaRinda(m, pasn)));
                s.appendChild(ul);
                if (pasn) s.appendChild(materialaForma(N.nr));
            }

            // apakšā: iepriekšējā / nākamā
            const ap = el('div', 'ek-nod-apaksa');
            const i = P.nodarbibas.findIndex((x) => x.nr === nr);
            const iep = P.nodarbibas[i - 1], nak = P.nodarbibas[i + 1];
            ap.appendChild(iep ? saite('← ' + iep.nr + '. nodarbība', '#n/' + iep.nr, 'btn-secondary ek-poga-maza') : saite('← Kursa sākums', '#', 'btn-secondary ek-poga-maza'));
            if (nak) ap.appendChild(saite(nak.nr + '. nodarbība →', '#n/' + nak.nr, 'btn-cta ek-poga-maza'));
            sat.appendChild(ap);

            lay.appendChild(nav); lay.appendChild(sat);
            sakne.appendChild(lay);
            // Navigācijas izcelšana ritinot
            if ('IntersectionObserver' in window) {
                const io = new IntersectionObserver((ent) => {
                    ent.forEach((e) => { if (e.isIntersecting) { navOl.querySelectorAll('a').forEach((x) => x.toggleAttribute('aria-current', x.getAttribute('href') === '#' + e.target.id)); } });
                }, { rootMargin: '-30% 0px -60% 0px' });
                sat.querySelectorAll('.gk-bloks').forEach((s) => io.observe(s));
            }
        });
    }

    function prezKarte(m) {
        const k = el('div', 'gk-lej-karte');
        k.appendChild(ikona(m.tips === 'pdf' ? 'pdf' : 'html', 'gk-lej-ikona'));
        const t = el('span'); t.appendChild(el('b', '', m.tips === 'pdf' ? 'Prezentācija PDF' : 'Interaktīvā prezentācija'));
        t.appendChild(el('small', '', (m.tips === 'pdf' ? 'PDF' : 'HTML') + (m.izmers ? ' · ' + izmers(m.izmers) : ''))); k.appendChild(t);
        const pg = el('span', 'gk-lej-pogas');
        const at = saite('Atvērt', failaUrl(m), 'btn-secondary ek-poga-maza'); at.target = '_blank'; at.rel = 'noopener'; pg.appendChild(at);
        const lj = saite('', failaUrl(m, true), 'btn-cta ek-poga-maza'); lj.appendChild(ikona('lejup')); lj.appendChild(document.createTextNode('Lejupielādēt')); lj.setAttribute('download', ''); pg.appendChild(lj);
        k.appendChild(pg);
        return k;
    }
    function materialaRinda(m, pasn) {
        const li = el('li', 'gk-materials');
        li.appendChild(ikona(m.tips === 'saite' ? 'saite' : (m.mime || '').includes('pdf') ? 'pdf' : 'fails', 'gk-lej-ikona'));
        const a = el('a', '', m.nosaukums); a.href = m.tips === 'saite' ? m.url : failaUrl(m); a.target = '_blank'; a.rel = 'noopener';
        const t = el('span'); t.appendChild(a);
        t.appendChild(el('small', '', m.tips === 'saite' ? m.url.replace(/^https?:\/\//, '').slice(0, 60) : izmers(m.izmers || 0)));
        li.appendChild(t);
        if (m.tips !== 'saite') { const lj = saite('', failaUrl(m, true), 'gk-ikonpoga'); lj.setAttribute('aria-label', 'Lejupielādēt ' + m.nosaukums); lj.appendChild(ikona('lejup')); li.appendChild(lj); }
        if (pasn) li.appendChild(dzestPoga(m));
        return li;
    }
    function dzestPoga(m) {
        const b = el('button', 'gk-ikonpoga gk-ikonpoga--dzest'); b.type = 'button'; b.setAttribute('aria-label', 'Dzēst ' + m.nosaukums); b.appendChild(ikona('x'));
        b.addEventListener('click', () => { if (!confirm('Dzēst «' + m.nosaukums + '»?')) return; api('DELETE', '/api/gk/' + kurss + '/materiali/' + m.id).then(atjaunot).catch((e) => toast(e.message, true)); });
        return b;
    }
    function augsuplade(nr, fails, tips, nosaukums) {
        if (fails.size > 24 * 1048576) { toast('Fails ir par lielu (līdz 24 MB)', true); return Promise.reject(); }
        const mime = fails.type || (fails.name.endsWith('.pdf') ? 'application/pdf' : /\.html?$/i.test(fails.name) ? 'text/html' : 'application/octet-stream');
        toast('Augšupielādē «' + fails.name + '»…');
        return api('POST', '/api/gk/' + kurss + '/nodarbiba/' + nr + '/materiali', new Blob([fails], { type: mime }), { 'X-Tips': tips, 'X-Nosaukums': encodeURIComponent(nosaukums || fails.name.replace(/\.[a-z0-9]+$/i, '')) })
            .then(() => { toast('Pievienots'); return atjaunot(); }).catch((e) => { if (e) toast(e.message, true); });
    }
    function pasniedzejaPanelis(N, mat) {
        const d = el('details', 'gk-pasn-panelis');
        const sm = el('summary'); sm.appendChild(ikona('zimulis')); sm.appendChild(document.createTextNode('Rediģēt nodarbību')); d.appendChild(sm);
        const f = el('form', 'gk-forma gk-forma--rezgis');
        const i1 = lauks(f, 'Nosaukums', 'text', N.nosaukums);
        const i2 = lauks(f, 'Datums (ja atšķiras no grafika)', 'date', N.datums || '');
        const lb = el('label', 'gk-checkbox'); const cb = el('input'); cb.type = 'checkbox'; cb.checked = N.redzama; lb.appendChild(cb); lb.appendChild(document.createTextNode(' Redzama studentiem')); f.appendChild(lb);
        const s = el('button', 'btn-cta ek-poga-maza', 'Saglabāt'); s.type = 'submit'; f.appendChild(s);
        f.addEventListener('submit', (e) => { e.preventDefault(); api('PATCH', '/api/gk/' + kurss + '/nodarbiba/' + N.nr, { nosaukums: i1.value, datums: i2.value || null, redzama: cb.checked }).then(() => { toast('Saglabāts'); return atjaunot(); }).catch((er) => toast(er.message, true)); });
        d.appendChild(f);
        // prezentācijas
        const pr = el('div', 'gk-prez-augsup');
        [['pdf', 'PDF prezentācija', '.pdf,application/pdf'], ['html', 'HTML prezentācija', '.html,.htm,text/html']].forEach(([tips, nos, acc]) => {
            const ir = mat.find((m) => m.tips === tips);
            const r = el('div', 'gk-prez-rinda');
            r.appendChild(ikona(tips, 'gk-lej-ikona'));
            const t = el('span'); t.appendChild(el('b', '', nos)); t.appendChild(el('small', '', ir ? ir.nosaukums + ' · ' + izmers(ir.izmers || 0) : 'nav pievienota')); r.appendChild(t);
            const l = el('label', 'btn-secondary ek-poga-maza', ir ? 'Aizstāt' : 'Augšupielādēt'); const inp = el('input'); inp.type = 'file'; inp.accept = acc; inp.hidden = true;
            inp.addEventListener('change', () => { if (inp.files[0]) augsuplade(N.nr, inp.files[0], tips, P.kurss.name + ' — ' + N.nr + '. nodarbība'); });
            l.appendChild(inp); r.appendChild(l);
            if (ir) r.appendChild(dzestPoga(ir));
            pr.appendChild(r);
        });
        d.appendChild(pr);
        const dz = poga('Dzēst nodarbību', 'btn-link btn-danger', () => {
            if (!confirm('Dzēst ' + N.nr + '. nodarbību ar visiem tās materiāliem un studentu progresu? To nevar atsaukt.')) return;
            api('DELETE', '/api/gk/' + kurss + '/nodarbiba/' + N.nr).then(() => { location.hash = ''; return atjaunot(); }).catch((e) => toast(e.message, true));
        });
        d.appendChild(dz);
        return d;
    }
    function materialaForma(nr) {
        const w = el('div', 'gk-mat-forma');
        const cilnes = el('div', 'gk-cilnes'); cilnes.setAttribute('role', 'tablist');
        const fF = el('form', 'gk-forma'), fS = el('form', 'gk-forma');
        const c1 = poga('Fails (PDF u. c.)', 'gk-cilne'), c2 = poga('Saite (URL)', 'gk-cilne');
        const rad = (f) => { fF.hidden = !f; fS.hidden = f; c1.setAttribute('aria-pressed', f); c2.setAttribute('aria-pressed', !f); };
        c1.addEventListener('click', () => rad(true)); c2.addEventListener('click', () => rad(false));
        cilnes.appendChild(c1); cilnes.appendChild(c2); w.appendChild(el('h3', '', 'Pievienot materiālu')); w.appendChild(cilnes);
        const n1 = lauks(fF, 'Nosaukums (neobligāts)', 'text', '');
        const fl = lauks(fF, 'Fails (līdz 24 MB)', 'file', ''); fl.classList.remove('lauks');
        const s1 = el('button', 'btn-cta ek-poga-maza', 'Augšupielādēt'); s1.type = 'submit'; fF.appendChild(s1);
        fF.addEventListener('submit', (e) => { e.preventDefault(); if (!fl.files[0]) { toast('Izvēlies failu', true); return; } augsuplade(nr, fl.files[0], 'fails', n1.value); });
        const n2 = lauks(fS, 'Nosaukums', 'text', ''); n2.placeholder = 'piem., Video: futuro simple';
        const u2 = lauks(fS, 'Saite', 'url', ''); u2.placeholder = 'https://…';
        const s2 = el('button', 'btn-cta ek-poga-maza', 'Pievienot saiti'); s2.type = 'submit'; fS.appendChild(s2);
        fS.addEventListener('submit', (e) => { e.preventDefault(); api('POST', '/api/gk/' + kurss + '/nodarbiba/' + nr + '/materiali', { tips: 'saite', nosaukums: n2.value, url: u2.value }).then(() => { toast('Saite pievienota'); return atjaunot(); }).catch((er) => toast(er.message, true)); });
        w.appendChild(fF); w.appendChild(fS); rad(true);
        return w;
    }

    // ---------- satura bloki ----------
    // Sagrupē slaidus sadaļās: «Atkārtojums», vārdu krājums + teksti pēc tēmām, vingrinājumi pie savas tēmas
    function grupetBlokus(bloki) {
        const out = []; let cur = null;
        const jauna = (virs) => { cur = { virs, bloki: [] }; out.push(cur); };
        const VINGR = ['fill', 'choice', 'transform', 'tf', 'quiz'];
        bloki.forEach((b) => {
            const atk = /^Atkārtojums/i.test(b.title || '');
            const iepr = cur && cur.bloki[cur.bloki.length - 1];
            // Jauna sadaļa: katrs teksts (ja iepriekšējais nav teksts), vārdu krājums pēc vingrinājuma vai aktivitātes
            const sakas = b.type === 'text' ? iepr?.type !== 'text' || !String(b.title || '').startsWith(String(cur.virs).split(':')[0])
                : b.type === 'vocab' ? iepr?.type !== 'text' && iepr?.type !== 'vocab'
                : false;
            if (!cur) jauna(atk ? 'Atkārtojums' : b.title);
            else if (atk) { if (cur.virs !== 'Atkārtojums') jauna('Atkārtojums'); }
            else if (cur.virs === 'Atkārtojums' && !VINGR.includes(b.type) || sakas) jauna(b.title);
            cur.bloki.push(b);
        });
        out.forEach((g) => { g.meta = g.bloki.filter((b) => ['fill', 'choice', 'transform', 'tf', 'quiz'].includes(b.type)).length ? '✎ ar vingrinājumiem' : ''; });
        return out;
    }
    function blokaGalva(b, w, bezVirsraksta) {
        if (b.title && !bezVirsraksta) w.appendChild(el('h3', 'gk-bloka-virs', b.title));
        if (b.pre) w.appendChild(el('p', 'gk-piezime', b.pre));
        if (b.note && !['vocab'].includes(b.type)) w.appendChild(el('p', 'gk-uzd-apraksts', b.note));
    }
    function renderBloks(b, visi, bezVirsraksta) {
        const w = el('div', 'gk-bloks-iekss gk-b--' + b.type);
        blokaGalva(b, w, bezVirsraksta);
        const f = { vocab: rVocab, text: rText, fill: rFill, choice: rChoice, transform: rTransform, tf: rTf, quiz: rQuiz, speak: rSpeak, guess: rGuess }[b.type];
        if (f) f(b, w, visi);
        return w;
    }
    function ierakstitTekstuAr(es, cel) { // klikšķis uz .es = izruna
        cel.querySelectorAll('.es').forEach((x) => {
            x.tabIndex = 0; x.setAttribute('role', 'button'); x.title = 'Klausīties';
            const tx = x.dataset.runa || x.textContent;
            let r = () => runat(tx, x);
            if (!x.dataset.runa && x.textContent.trim().length > 80) { // garam tekstam — redzama poga «Klausīties tekstu» / «Apturēt»; klikšķis uz teksta dara to pašu
                const b = poga('', 'btn-secondary ek-poga-maza gk-klausit', () => runat(x.textContent, b));
                b.appendChild(ikona('skana')); b.appendChild(document.createTextNode(' Klausīties tekstu'));
                let kur = x.closest('p, li, .card'); if (!kur || !cel.contains(kur)) kur = x; kur.parentNode.insertBefore(b, kur);
                x.title = 'Klausīties / apturēt'; r = () => b.click();
            } x.addEventListener('click', r); x.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); r(); } }); });
    }
    function rVocab(b, w) {
        const esPirmais = b.dir === 'es';
        const tb = el('table', 'gk-vardi' + (b.arrow ? ' gk-vardi--bulta' : ''));
        const tbody = el('tbody');
        b.pairs.forEach((p) => {
            const tr = el('tr');
            const [lv, es] = esPirmais ? [p[1], p[0]] : [p[0], p[1]];
            const tdEs = el('td', 'gk-vardi-es'); const sp = el('span', 'gk-es-teksts', es); tdEs.appendChild(sp);
            if (!b.nospeak) tdEs.insertBefore(skanasPoga(es), sp);
            const tdLv = el('td', 'gk-vardi-lv', lv);
            if (esPirmais) { tr.appendChild(tdEs); tr.appendChild(tdLv); } else { tr.appendChild(tdLv); tr.appendChild(tdEs); }
            tbody.appendChild(tr);
        });
        tb.appendChild(tbody);
        const tw = el('div', 'ek-tabula-wrap'); tw.appendChild(tb); w.appendChild(tw);
        if (b.note) w.appendChild(el('p', 'gk-piezime', b.note));
        const sl = el('label', 'gk-slept'); const c = el('input'); c.type = 'checkbox';
        c.addEventListener('change', () => tb.classList.toggle('gk-vardi--slepts', c.checked));
        sl.appendChild(c); sl.appendChild(document.createTextNode(' Paslēpt ' + V().nos + ' vārdus (pārbaudi sevi)'));
        w.appendChild(sl);
        tb.addEventListener('click', (e) => { const td = e.target.closest('.gk-vardi--slepts .gk-vardi-es'); if (td) td.classList.toggle('atklats'); });
    }
    function rText(b, w) { const d = el('div', 'gk-teksts'); d.innerHTML = b.html || ''; ierakstitTekstuAr(true, d); w.appendChild(d); }
    function rezultats(w, labi, visi) {
        let r = w.querySelector('.ek-atgriezeniska'); if (!r) { r = el('div'); w.appendChild(r); }
        r.className = 'ek-atgriezeniska ' + (labi === visi ? 'ek-atgriezeniska--labi' : 'ek-atgriezeniska--slikti');
        r.textContent = labi === visi ? V().labi + ' Viss pareizi (' + labi + '/' + visi + ').' : 'Pareizi ' + labi + ' no ' + visi + '. Izlabo sarkanos un pārbaudi vēlreiz.';
    }
    function atzimet(inp, v) { inp.classList.remove('pareizi', 'nepareizi', 'gandriz'); if (v === 2) inp.classList.add('pareizi'); else if (v === 1) inp.classList.add('pareizi', 'gandriz'); else inp.classList.add('nepareizi'); inp.setAttribute('aria-invalid', v ? 'false' : 'true'); }
    function rFill(b, w) {
        const ol = el('ol', 'gk-vingr'); const lauki = [];
        b.items.forEach((it) => {
            const li = el('li');
            it.split(/(\{[^}]+\})/).forEach((d) => {
                const m = d.match(/^\{([^}]+)\}$/);
                if (m) { const v = m[1].split('|'); const i = el('input', 'lauks gk-tuks'); i.type = 'text'; i.autocomplete = 'off'; i.spellcheck = false; i.lang = VALODA; i.setAttribute('aria-label', 'Atbilde'); i.style.width = Math.max(5, v[0].length + 2) + 'ch'; i.dataset.v = m[1]; lauki.push(i); li.appendChild(i); }
                else if (d) li.appendChild(document.createTextNode(d));
            });
            ol.appendChild(li);
        });
        w.appendChild(ol);
        w.appendChild(pogas(() => { let l = 0; lauki.forEach((i) => { const v = salidzinat(i.value, i.dataset.v.split('|')); atzimet(i, v); if (v) l++; if (v === 1) i.title = 'Ar garumzīmēm: ' + i.dataset.v.split('|')[0]; }); rezultats(w, l, lauki.length); },
            () => lauki.forEach((i) => { i.value = i.dataset.v.split('|')[0]; atzimet(i, 2); })));
    }
    function pogas(parbaudit, paradit) {
        const p = el('div', 'ek-uzd-pogas');
        p.appendChild(poga('Pārbaudīt', 'btn-cta ek-poga-maza', parbaudit));
        if (paradit) p.appendChild(poga('Rādīt atbildes', 'btn-secondary ek-poga-maza', paradit));
        return p;
    }
    function rChoice(b, w) {
        const ol = el('ol', 'gk-vingr gk-izvele'); let labi = 0, atb = 0;
        b.items.forEach((it) => {
            const li = el('li');
            const m = String(it.q).match(/\[([^\]]*)\]/);
            const opc = m && m[1] ? m[1].split('|') : (b.options || []);
            const q = el('span', 'gk-izvele-q'); q.innerHTML = String(it.q).replace(/\[[^\]]*\]/, '<span class="gk-izvele-vieta">___</span>'); li.appendChild(q);
            ierakstitTekstuAr(true, q);
            const g = el('span', 'gk-izvele-opc');
            opc.forEach((o) => {
                const bt = el('button', 'ek-cips', o); bt.type = 'button';
                bt.addEventListener('click', () => {
                    if (li.dataset.ok) return;
                    const pareizi = o === it.a; bt.classList.add(pareizi ? 'pareizi' : 'nepareizi');
                    if (pareizi) { li.dataset.ok = '1'; labi++; const v = q.querySelector('.gk-izvele-vieta'); if (v) v.textContent = o; g.querySelectorAll('button').forEach((x) => { x.disabled = x !== bt; }); }
                    if (!li.dataset.m) { li.dataset.m = '1'; atb++; }
                    if (labi === b.items.length) rezultats(w, labi, b.items.length);
                });
                g.appendChild(bt);
            });
            li.appendChild(g); ol.appendChild(li);
        });
        w.appendChild(ol);
    }
    function rTransform(b, w) {
        const ol = el('ol', 'gk-vingr gk-parveido'); const lauki = [];
        b.items.forEach((it) => {
            const li = el('li'); if (it.runa) li.appendChild(skanasPoga(it.runa)); li.appendChild(el('span', 'gk-parveido-q', it.q));
            const i = el('input', 'lauks'); i.type = 'text'; i.placeholder = b.ph || ''; i.lang = VALODA; i.spellcheck = false; i.autocomplete = 'off'; i.setAttribute('aria-label', 'Pārveidots teikums: ' + it.q); i._a = it.a; lauki.push(i);
            li.appendChild(i); ol.appendChild(li);
        });
        w.appendChild(ol);
        if (b.hint) w.appendChild(el('p', 'gk-piezime', b.hint));
        w.appendChild(pogas(() => { let l = 0; lauki.forEach((i) => { const v = salidzinat(i.value, i._a); atzimet(i, v); if (v) l++; }); rezultats(w, l, lauki.length); },
            () => lauki.forEach((i) => { i.value = i._a[0]; atzimet(i, 2); })));
    }
    function rTf(b, w) {
        const ol = el('ol', 'gk-vingr gk-pn'); let labi = 0;
        b.items.forEach((it) => {
            const li = el('li'); const q = el('span', '', it.q); li.appendChild(q);
            const g = el('span', 'gk-izvele-opc');
            [[true, 'Patiesi'], [false, 'Nepatiesi']].forEach(([v, t]) => {
                const bt = el('button', 'ek-cips', t); bt.type = 'button';
                bt.addEventListener('click', () => {
                    if (li.dataset.ok) return;
                    const ok = v === it.a; bt.classList.add(ok ? 'pareizi' : 'nepareizi');
                    if (ok) { li.dataset.ok = '1'; labi++; g.querySelectorAll('button').forEach((x) => { x.disabled = x !== bt; }); if (labi === b.items.length) rezultats(w, labi, labi); }
                });
                g.appendChild(bt);
            });
            li.appendChild(g); ol.appendChild(li);
        });
        w.appendChild(ol);
    }
    function rQuiz(b, w, visi) {
        const pari = visi.filter((x) => x.type === 'vocab' && b.from.includes(x.id)).flatMap((x) => x.pairs.map((p) => (x.dir === 'es' ? [p[1], p[0]] : p)));
        const kaste = el('div'); w.appendChild(kaste);
        const jauns = () => {
            kaste.textContent = '';
            const jaut = jaukt(pari).slice(0, b.n || 10); let labi = 0, atb = 0;
            const ol = el('ol', 'gk-vingr gk-tests');
            jaut.forEach((p) => {
                const li = el('li'); li.appendChild(el('span', 'gk-tests-q', p[0]));
                const opc = jaukt([p].concat(jaukt(pari.filter((x) => x[1] !== p[1])).slice(0, 3)));
                const g = el('span', 'gk-izvele-opc');
                opc.forEach((o) => {
                    const bt = el('button', 'ek-cips', o[1]); bt.type = 'button';
                    bt.addEventListener('click', () => {
                        if (li.dataset.d) return; li.dataset.d = '1'; atb++;
                        const ok = o[1] === p[1]; if (ok) labi++;
                        bt.classList.add(ok ? 'pareizi' : 'nepareizi');
                        g.querySelectorAll('button').forEach((x) => { x.disabled = true; if (x.textContent === p[1]) x.classList.add('pareizi'); });
                        if (atb === jaut.length) { rezultats(kaste, labi, jaut.length); }
                    });
                    g.appendChild(bt);
                });
                li.appendChild(g); ol.appendChild(li);
            });
            kaste.appendChild(ol);
            const p = el('div', 'ek-uzd-pogas'); p.appendChild(poga('Jauns tests', 'btn-secondary ek-poga-maza', jauns)); kaste.appendChild(p);
        };
        jauns();
    }
    function rSpeak(b, w) {
        const ol = el('ol', 'gk-runa');
        b.questions.forEach((q) => { const li = el('li'); li.appendChild(skanasPoga(q)); li.appendChild(el('span', '', q)); ol.appendChild(li); });
        w.appendChild(ol);
    }
    function rGuess(b, w) {
        const lab = b.label || 'Kartīte:';
        const k = el('div', 'gk-minet');
        const pk = el('div', 'gk-minet-kartite'); pk.textContent = 'Spied, lai izvilktu kartīti'; pk.tabIndex = 0; pk.setAttribute('role', 'button');
        const velk = () => { const x = b.films[Math.floor(Math.random() * b.films.length)]; pk.textContent = ''; pk.appendChild(el('small', '', lab)); pk.appendChild(el('b', '', x)); };
        pk.addEventListener('click', velk); pk.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); velk(); } });
        k.appendChild(pk);
        if (b.phrases && b.phrases.length) {
            const ul = el('ul', 'ek-piemeri');
            b.phrases.forEach((p) => { const li = el('li'); li.appendChild(skanasPoga(p[0])); li.appendChild(el('b', '', p[0])); li.appendChild(el('span', '', p[1])); ul.appendChild(li); });
            k.appendChild(ul);
        }
        w.appendChild(k);
    }

    // ===================================================================
    // UZDEVUMI (spēles)
    // ===================================================================
    function saglabat(nr, id, rez) {
        if (P.piekluve.pasniedzejs) return;
        api('POST', '/api/gk/' + kurss + '/progress', { nr, uzdevums: id, rezultats: rez }).then(() => {
            if (nodKes[nr]) nodKes[nr].progress[id] = rez;
            P.progress[nr] = P.progress[nr] || {}; P.progress[nr][id] = rez;
            const a = document.querySelector('.gk-nod-nav a[href="#gk-u-' + id + '"]');
            if (a) { a.parentNode.classList.add('gatavs'); a.querySelector('.nr').textContent = '✓'; }
        }).catch(() => {});
    }
    function pabeigts(w, teksts) {
        let r = w.querySelector(':scope > .gk-pabeigts'); if (r) r.remove();
        r = el('div', 'ek-atgriezeniska ek-atgriezeniska--labi gk-pabeigts'); r.setAttribute('role', 'status'); r.textContent = teksts; w.appendChild(r);
    }
    function renderUzdevums(u, nr) {
        const w = el('div', 'gk-spele gk-spele--' + u.tips);
        const f = { krustvardi: uKrustvardi, meklesana: uMeklesana, atmina: uAtmina, jucekli: uJucekli, seciba: uSeciba }[u.tips];
        if (f) f(u, w, (rez, teksts) => { pabeigts(w, teksts); saglabat(nr, u.id, rez); });
        return w;
    }

    // Rūtiņas izmērs pēc pieejamā platuma (režģis vienmēr ietilpst; jautājumi pārceļas zem tā)
    function pielagotSunas(w, rez, kol, max) {
        const iest = () => { const W = w.clientWidth || w.parentNode.clientWidth; if (!W) return; rez.style.setProperty('--s', Math.max(20, Math.min(max, Math.floor((W - 8 - 2 * (kol - 1)) / kol))) + 'px'); };
        requestAnimationFrame(iest);
        if ('ResizeObserver' in window) new ResizeObserver(iest).observe(w);
    }

    // --- krustvārdu mīkla ---
    function uKrustvardi(u, w, gatavs) {
        const sunas = {}; // "x,y" -> {inp, burts, vardi:[]}
        const rez = el('div', 'gk-kv-rezgis'); rez.style.setProperty('--kol', u.platums); rez.style.setProperty('--rin', u.augstums);
        rez.setAttribute('role', 'grid'); rez.setAttribute('aria-label', 'Krustvārdu mīkla');
        let virziens = 'h', aktivs = null, atklati = 0;
        u.vardi.forEach((v, vi) => {
            [...v.atbilde].forEach((b, i) => {
                const x = v.x + (v.virziens === 'h' ? i : 0), y = v.y + (v.virziens === 'v' ? i : 0), k = x + ',' + y;
                if (!sunas[k]) {
                    const c = el('div', 'gk-kv-suna'); c.style.gridColumn = x + 1; c.style.gridRow = y + 1;
                    const inp = el('input'); inp.maxLength = 1; inp.autocomplete = 'off'; inp.spellcheck = false; inp.setAttribute('autocapitalize', 'characters');
                    c.appendChild(inp); rez.appendChild(c);
                    sunas[k] = { c, inp, burts: b, x, y, vardi: [] };
                }
                sunas[k].vardi.push(vi);
                if (i === 0) { const n = el('span', 'gk-kv-nr', String(v.n)); if (!sunas[k].c.querySelector('.gk-kv-nr')) sunas[k].c.appendChild(n); }
            });
        });
        Object.values(sunas).forEach((s) => s.inp.setAttribute('aria-label', 'Rūtiņa ' + s.vardi.map((vi) => u.vardi[vi].n + (u.vardi[vi].virziens === 'h' ? ' horizontāli' : ' vertikāli')).join(', ')));
        const vardaSunas = (vi) => { const v = u.vardi[vi]; return [...v.atbilde].map((_, i) => sunas[(v.x + (v.virziens === 'h' ? i : 0)) + ',' + (v.y + (v.virziens === 'v' ? i : 0))]); };
        const izcelt = () => {
            Object.values(sunas).forEach((s) => s.c.classList.remove('iezime'));
            jautLi.forEach((li) => li.classList.remove('tagad'));
            if (aktivs == null) return;
            vardaSunas(aktivs).forEach((s) => s.c.classList.add('iezime'));
            jautLi[aktivs].classList.add('tagad');
        };
        const izveletiesVardu = (s) => {
            const der = s.vardi.find((vi) => u.vardi[vi].virziens === virziens);
            aktivs = der != null ? der : s.vardi[0]; virziens = u.vardi[aktivs].virziens; izcelt();
        };
        const parbauditVisu = (rad) => {
            let visi = true;
            Object.values(sunas).forEach((s) => {
                const ok = s.inp.value.toUpperCase() === s.burts;
                if (!ok) visi = false;
                s.c.classList.toggle('nepareizi', rad && !!s.inp.value && !ok);
            });
            u.vardi.forEach((v, vi) => jautLi[vi].classList.toggle('gatavs', vardaSunas(vi).every((s) => s.inp.value.toUpperCase() === s.burts)));
            return visi;
        };
        let beigts = false;
        const parbBeigas = () => { if (!beigts && parbauditVisu(false)) { beigts = true; gatavs(atklati ? Math.max(40, 100 - atklati * 5) : 100, V().fant + ' Krustvārdu mīkla atrisināta' + (atklati ? ' (atklāti ' + atklati + ' burti).' : '!')); } };
        Object.values(sunas).forEach((s) => {
            s.inp.addEventListener('focus', () => { if (aktivs == null || !s.vardi.includes(aktivs)) izveletiesVardu(s); else izcelt(); s.inp.select(); });
            s.inp.addEventListener('mousedown', () => { if (document.activeElement === s.inp && s.vardi.length > 1) { virziens = virziens === 'h' ? 'v' : 'h'; izveletiesVardu(s); } });
            s.inp.addEventListener('input', () => {
                s.inp.value = bezAkc(s.inp.value.slice(-1)).toUpperCase().replace(/[^A-ZÑ]/g, '');
                s.c.classList.remove('nepareizi');
                if (s.inp.value && aktivs != null) { const ss = vardaSunas(aktivs); const i = ss.indexOf(s); if (ss[i + 1]) ss[i + 1].inp.focus(); }
                parbauditVisu(false); parbBeigas();
            });
            s.inp.addEventListener('keydown', (e) => {
                const kust = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }[e.key];
                if (kust) { e.preventDefault(); const n = sunas[(s.x + kust[0]) + ',' + (s.y + kust[1])]; virziens = kust[0] ? 'h' : 'v'; if (n) { n.inp.focus(); izveletiesVardu(n); } return; }
                if (e.key === 'Backspace' && !s.inp.value && aktivs != null) { const ss = vardaSunas(aktivs); const i = ss.indexOf(s); if (ss[i - 1]) { e.preventDefault(); ss[i - 1].inp.value = ''; ss[i - 1].inp.focus(); } }
            });
        });
        const wrapR = el('div', 'gk-kv-wrap'); wrapR.appendChild(rez);
        const jaut = el('div', 'gk-kv-jautajumi'); const jautLi = [];
        [['h', 'Horizontāli →'], ['v', 'Vertikāli ↓']].forEach(([vz, nos]) => {
            const k = el('div'); k.appendChild(el('h4', '', nos)); const ol = el('ol');
            u.vardi.forEach((v, vi) => {
                if (v.virziens !== vz) return;
                const li = el('li'); const b = el('button', 'gk-kv-jaut'); b.type = 'button';
                b.appendChild(el('b', '', v.n + '.')); b.appendChild(document.createTextNode(' ' + v.jautajums + ' ')); b.appendChild(el('small', '', '(' + v.atbilde.length + ')'));
                b.addEventListener('click', () => { virziens = vz; aktivs = vi; const s = vardaSunas(vi).find((x) => !x.inp.value) || vardaSunas(vi)[0]; s.inp.focus(); izcelt(); });
                li.appendChild(b); ol.appendChild(li); jautLi[vi] = li;
            });
            k.appendChild(ol); jaut.appendChild(k);
        });
        const izk = el('div', 'gk-kv'); izk.appendChild(wrapR); izk.appendChild(jaut); w.appendChild(izk);
        pielagotSunas(w, rez, u.platums, 38);
        const pg = el('div', 'ek-uzd-pogas');
        pg.appendChild(poga('Parādīt kļūdas', 'btn-secondary ek-poga-maza', () => { parbauditVisu(true); }));
        pg.appendChild(poga('Atklāt burtu', 'btn-secondary ek-poga-maza', () => {
            const ss = aktivs != null ? vardaSunas(aktivs) : Object.values(sunas);
            const s = ss.find((x) => x.inp.value.toUpperCase() !== x.burts); if (!s) return;
            s.inp.value = s.burts; s.c.classList.add('atklats'); atklati++; s.inp.focus(); parbauditVisu(false); parbBeigas();
        }));
        pg.appendChild(poga('Rādīt atbildes', 'btn-secondary ek-poga-maza', () => {
            if (!confirm('Parādīt visas atbildes?')) return;
            Object.values(sunas).forEach((s) => { if (s.inp.value.toUpperCase() !== s.burts) { s.inp.value = s.burts; s.c.classList.add('atklats'); atklati++; } }); parbauditVisu(false);
        }));
        w.appendChild(pg);
    }

    // --- vārdu meklēšana ---
    function uMeklesana(u, w, gatavs) {
        const N = u.izmers; const sunas = [];
        const g = el('div', 'gk-vm-rezgis'); g.style.setProperty('--n', N); g.setAttribute('role', 'grid'); g.setAttribute('aria-label', 'Vārdu meklēšanas tabula');
        let sakums = null; const atrasti = new Set();
        u.rindas.forEach((r, y) => [...r].forEach((b, x) => {
            const c = el('button', 'gk-vm-suna', b); c.type = 'button'; c.dataset.x = x; c.dataset.y = y;
            c.setAttribute('aria-label', b + ', ' + (y + 1) + '. rinda, ' + (x + 1) + '. kolonna');
            c.addEventListener('click', () => izvele(x, y, c));
            c.addEventListener('mouseenter', () => prieksskats(x, y));
            g.appendChild(c); sunas.push(c);
        }));
        const suna = (x, y) => sunas[y * N + x];
        const linija = (x1, y1, x2, y2) => {
            const dx = Math.sign(x2 - x1), dy = Math.sign(y2 - y1), L = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
            if (!(x1 === x2 || y1 === y2 || Math.abs(x2 - x1) === Math.abs(y2 - y1))) return null;
            return Array.from({ length: L + 1 }, (_, i) => [x1 + dx * i, y1 + dy * i]);
        };
        const notiritPriekss = () => sunas.forEach((c) => c.classList.remove('priekss'));
        const prieksskats = (x, y) => { if (!sakums) return; notiritPriekss(); const l = linija(sakums[0], sakums[1], x, y); if (l) l.forEach(([a, b]) => suna(a, b).classList.add('priekss')); };
        const sar = el('ul', 'gk-vm-saraksts'); const liKarte = {};
        u.vardi.forEach((v, i) => { const li = el('li'); li.appendChild(el('span', 'gk-vm-lv', v.jautajums)); li.appendChild(el('b', 'gk-vm-es', '·'.repeat(v.atbilde.length))); sar.appendChild(li); liKarte[i] = li; });
        const izvele = (x, y, c) => {
            if (!sakums) { sakums = [x, y]; c.classList.add('sakums'); return; }
            const [sx, sy] = sakums; suna(sx, sy).classList.remove('sakums'); sakums = null; notiritPriekss();
            const l = linija(sx, sy, x, y); if (!l) return;
            const vards = l.map(([a, b]) => u.rindas[b][a]).join('');
            const i = u.vardi.findIndex((v, k) => !atrasti.has(k) && (v.atbilde === vards || v.atbilde === [...vards].reverse().join('')));
            if (i < 0) { l.forEach(([a, b]) => { const s = suna(a, b); s.classList.add('kluda'); setTimeout(() => s.classList.remove('kluda'), 500); }); return; }
            atrasti.add(i); const krasa = i % 6;
            l.forEach(([a, b]) => suna(a, b).classList.add('atrasts', 'k' + krasa));
            liKarte[i].classList.add('atrasts'); liKarte[i].querySelector('.gk-vm-es').textContent = u.vardi[i].vards;
            runat(u.vardi[i].vards);
            if (atrasti.size === u.vardi.length) gatavs(100, V().bravo + ' Visi ' + u.vardi.length + ' vārdi atrasti.');
        };
        const izk = el('div', 'gk-vm'); izk.appendChild(g); const lab = el('div', 'gk-vm-labais'); lab.appendChild(el('h4', '', 'Atrodi ' + V().iski + ':')); lab.appendChild(sar); izk.appendChild(lab);
        w.appendChild(izk);
        pielagotSunas(w, g, N, 36);
    }

    // --- atmiņas spēle ---
    function uAtmina(u, w, gatavs) {
        const kaste = el('div'); w.appendChild(kaste);
        const sakt = () => {
            kaste.textContent = '';
            const kartes = jaukt(u.pari.flatMap((p, i) => [{ i, t: p[0], val: 'lv' }, { i, t: p[1], val: 'es' }]));
            const g = el('div', 'gk-atm'); let atv = [], gajieni = 0, pari = 0, slegts = false;
            const info = el('p', 'gk-meta', 'Gājieni: 0');
            kartes.forEach((k) => {
                const b = el('button', 'gk-atm-karte'); b.type = 'button'; b.setAttribute('aria-label', 'Aizvērta kartīte');
                const iek = el('span', 'gk-atm-iekss'); iek.appendChild(el('span', 'gk-atm-mugura')); const pr = el('span', 'gk-atm-prieksa gk-atm--' + k.val, k.t); iek.appendChild(pr); b.appendChild(iek);
                b.addEventListener('click', () => {
                    if (slegts || b.classList.contains('atverta') || b.classList.contains('paris')) return;
                    b.classList.add('atverta'); b.setAttribute('aria-label', k.t); atv.push([b, k]);
                    if (k.val === 'es') runat(k.t);
                    if (atv.length < 2) return;
                    gajieni++; info.textContent = 'Gājieni: ' + gajieni;
                    const [[b1, k1], [b2, k2]] = atv; atv = [];
                    if (k1.i === k2.i && k1.val !== k2.val) {
                        b1.classList.add('paris'); b2.classList.add('paris'); pari++;
                        if (pari === u.pari.length) gatavs(gajieni <= u.pari.length + 4 ? 100 : gajieni <= u.pari.length * 2 + 2 ? 85 : 70, V().genial + ' Visi pāri atrasti ar ' + gajieni + ' gājieniem.');
                    } else { slegts = true; setTimeout(() => { [b1, b2].forEach((x) => { x.classList.remove('atverta'); x.setAttribute('aria-label', 'Aizvērta kartīte'); }); slegts = false; }, 1000); }
                });
                g.appendChild(b);
            });
            kaste.appendChild(g); kaste.appendChild(info);
            const p = el('div', 'ek-uzd-pogas'); p.appendChild(poga('Sākt no jauna', 'btn-secondary ek-poga-maza', sakt)); kaste.appendChild(p);
        };
        sakt();
    }

    // --- burtu jucekļi ---
    function uJucekli(u, w, gatavs) {
        let atrisinati = 0, palidziba = 0;
        const ol = el('ol', 'gk-juc');
        u.vardi.forEach((v) => {
            const li = el('li', 'gk-juc-v'); li.appendChild(el('span', 'gk-juc-lv', v.jautajums));
            const atb = el('div', 'gk-juc-atb'); atb.setAttribute('aria-label', 'Tava atbilde');
            const burti = el('div', 'gk-juc-burti');
            const izm = [];
            const rad = () => {
                atb.textContent = '';
                izm.forEach((bi, n) => { const c = el('button', 'gk-juc-burts', v.jauktie[bi]); c.type = 'button'; c.setAttribute('aria-label', v.jauktie[bi] + ' — noņemt'); c.addEventListener('click', () => { if (li.classList.contains('gatavs')) return; izm.splice(n, 1); rad(); }); atb.appendChild(c); });
                burti.querySelectorAll('button').forEach((b, bi) => { b.disabled = izm.includes(bi) || li.classList.contains('gatavs'); });
                if (izm.length === v.vards.length) {
                    const s = izm.map((bi) => v.jauktie[bi]).join('');
                    if (s === v.vards) { li.classList.add('gatavs'); atb.querySelectorAll('button').forEach((b) => { b.disabled = true; }); runat(v.vards); atrisinati++; if (atrisinati === u.vardi.length) gatavs(Math.max(40, 100 - palidziba * 10), V().bravo + ' Visi vārdi salikti.'); }
                    else { atb.classList.add('kluda'); setTimeout(() => atb.classList.remove('kluda'), 600); }
                }
            };
            [...v.jauktie].forEach((b, bi) => { const c = el('button', 'gk-juc-burts', b); c.type = 'button'; c.addEventListener('click', () => { izm.push(bi); rad(); }); burti.appendChild(c); });
            const pal = el('button', 'btn-link gk-juc-pal', 'Palīdzēt'); pal.type = 'button';
            pal.addEventListener('click', () => {
                if (li.classList.contains('gatavs')) return;
                // Saglabā pareizo sākumu, pievieno nākamo pareizo burtu
                let k = 0; while (k < izm.length && v.jauktie[izm[k]] === v.vards[k]) k++;
                izm.splice(k);
                const vajag = v.vards[k]; const bi = [...v.jauktie].findIndex((b, i) => b === vajag && !izm.includes(i));
                if (bi > -1) { izm.push(bi); palidziba++; rad(); }
            });
            li.appendChild(atb); li.appendChild(burti); li.appendChild(pal); ol.appendChild(li);
        });
        w.appendChild(ol);
    }

    // --- teikumu secība ---
    function uSeciba(u, w, gatavs) {
        let labi = 0;
        const ol = el('ol', 'gk-sec');
        u.teikumi.forEach((t) => {
            const vardi = t.split(' ');
            let jauk; do { jauk = jaukt(vardi.map((v, i) => i)); } while (jauk.every((x, i) => x === i) && vardi.length > 1);
            const li = el('li', 'gk-sec-t');
            const atb = el('div', 'ek-seciba-atbilde'); const el2 = el('div', 'ek-seciba-elementi');
            const izm = [];
            const rad = () => {
                atb.textContent = '';
                izm.forEach((vi, n) => { const c = el('button', 'ek-cips', vardi[vi]); c.type = 'button'; c.addEventListener('click', () => { if (li.classList.contains('gatavs')) return; izm.splice(n, 1); rad(); }); atb.appendChild(c); });
                el2.querySelectorAll('button').forEach((b) => { b.disabled = izm.includes(Number(b.dataset.i)) || li.classList.contains('gatavs'); });
                if (izm.length === vardi.length) {
                    if (izm.map((i) => vardi[i]).join(' ') === t) { li.classList.add('gatavs'); atb.querySelectorAll('button').forEach((b) => { b.disabled = true; }); runat(t); labi++; if (labi === u.teikumi.length) gatavs(100, V().labi + ' Visi teikumi salikti.'); }
                    else { atb.classList.add('kluda'); setTimeout(() => atb.classList.remove('kluda'), 600); }
                }
            };
            jauk.forEach((vi) => { const c = el('button', 'ek-cips', vardi[vi]); c.type = 'button'; c.dataset.i = vi; c.addEventListener('click', () => { izm.push(vi); rad(); }); el2.appendChild(c); });
            li.appendChild(atb); li.appendChild(el2); ol.appendChild(li);
        });
        w.appendChild(ol);
    }

    // ===================================================================
    // MĀJASDARBI: students raksta un iesniedz, pasniedzējs novērtē
    // ===================================================================
    const MD_NOS = { melnraksts: 'melnraksts', iesniegts: 'iesniegts · gaida pārbaudi', novertets: 'novērtēts', jalabo: 'jāpalabo' };
    const MD_KL = { melnraksts: 'pieteicies', iesniegts: 'uznemts', novertets: 'pabeidzis', jalabo: 'atteicies' };
    const BURTI = 'a-záéíóúüñ';
    const mdRe = (re, g) => new RegExp(re.replace(/⟨/g, '(?<![' + BURTI + '])').replace(/⟩/g, '(?![' + BURTI + '])'), g || 'g');
    // Pārbaudes kā prezentācijā (noteikumi no riki/gk-sagatavot.mjs → majasdarbs.parbaudes)
    function parbauditMd(parb, t, bloki) {
        const low = t.toLowerCase();
        return (parb || []).map((x) => {
            let v = 0, ok = false, brid = null;
            if (x.tips === 'teikumi') { v = t.split(/[.!?…]+/).map((y) => y.trim()).filter((y) => y.split(/\s+/).length >= 3).length; ok = v >= x.min && v <= (x.max || 999); }
            else if (x.tips === 'vardi') {
                const kopa = new RegExp(x.kopas);
                const vardi = [...new Set((bloki || []).filter((b) => b.type === 'vocab' && b.id && kopa.test(b.id)).flatMap((b) => b.pairs.map((p) => (b.dir === 'es' ? p[0] : p[1])))
                    .flatMap((y) => y.replace(/\([^)]*\)/g, '').split('/')).map((y) => y.trim().toLowerCase().replace(/^(el|la|los|las|un|una)\s+/, '').replace(/^(el|la)\s*$/, '')).filter((y) => y.length > 2))];
                v = vardi.filter((w) => mdRe('⟨' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '⟩', '').test(low)).length; ok = v >= x.min;
            } else if (x.tips === 'skaits') { v = ((x.originals ? t : low).match(mdRe(x.re)) || []).length; ok = v >= x.min; if (x.min === 1) v = ok ? '✓' : '–'; }
            else if (x.tips === 'nav') { const ir = mdRe(x.re, 'i').test(low); ok = !ir; v = ''; if (ir) brid = x.bridinajums; }
            return { id: x.id, teksts: brid || x.teksts, ok, v, brid: !!brid };
        });
    }
    function checklist(rez) {
        const ul = el('ul', 'gk-md-prasibas');
        rez.forEach((r) => { const li = el('li', r.ok ? 'izpildits' : r.brid ? 'bridinajums' : ''); li.appendChild(el('span', 'gk-md-zime', r.ok ? '✓' : r.brid ? '!' : '')); li.appendChild(el('span', '', r.teksts)); if (r.v !== '' && r.v != null) li.appendChild(el('b', 'gk-md-v', '(' + r.v + ')')); ul.appendChild(li); });
        return ul;
    }
    function vertejumaKaste(M) {
        const k = el('div', 'gk-md-vertejums gk-md-vertejums--' + M.statuss);
        k.appendChild(el('strong', '', M.statuss === 'jalabo' ? 'Pasniedzējs lūdz palabot' : 'Pasniedzēja vērtējums' + (M.vertejums ? ': ' + M.vertejums : '')));
        if (M.komentars) k.appendChild(el('p', '', M.komentars));
        return k;
    }
    function majasdarbaRedaktors(S, nr, M) {
        const md = S.majasdarbs, w = karte('gk-majasdarbs');
        const lsKey = 'gk-md-' + kurss + '-' + nr;
        w.appendChild(el('p', 'gk-md-uzdevums', md.teksts));
        if (M && M.statuss !== 'melnraksts') {
            const st = el('p', 'gk-md-statuss'); st.appendChild(el('span', 'badge badge-' + MD_KL[M.statuss], MD_NOS[M.statuss]));
            if (M.iesniegts_at) st.appendChild(document.createTextNode(' Iesniegts ' + lvDat(M.iesniegts_at.slice(0, 10)) + (M.reizes > 1 ? ' (' + M.reizes + '. reizi)' : '')));
            w.appendChild(st);
        }
        if (M && (M.statuss === 'novertets' || M.statuss === 'jalabo')) w.appendChild(vertejumaKaste(M));
        const lasit = M && (M.statuss === 'novertets' || M.statuss === 'iesniegts');
        const izk = el('div', 'gk-md-izk');
        const ta = el('textarea', 'ek-textarea gk-md-teksts'); ta.lang = VALODA; ta.spellcheck = false; ta.setAttribute('aria-label', 'Tavs mājasdarbs');
        ta.placeholder = 'Raksti šeit ' + V().iski + '…';
        let ls = null; try { ls = localStorage.getItem(lsKey); } catch (e) {}
        ta.value = M && M.teksts ? (M.statuss !== 'iesniegts' && M.statuss !== 'novertets' && ls && ls.length > M.teksts.length ? ls : M.teksts) : (ls || '');
        ta.readOnly = !!lasit;
        const kr = el('div', 'gk-md-kr'); kr.appendChild(el('h4', '', 'Prasības'));
        const sk = el('p', 'gk-meta');
        const listeVieta = el('div'); kr.appendChild(listeVieta); kr.appendChild(sk);
        let rez = [];
        const atj = () => {
            rez = md.parbaudes ? parbauditMd(md.parbaudes, ta.value, S.bloki) : (md.prasibas || []).map((p) => ({ teksts: p, ok: false, v: '' }));
            listeVieta.textContent = ''; listeVieta.appendChild(checklist(rez));
            const v = ta.value.trim() ? ta.value.trim().split(/\s+/).length : 0;
            sk.textContent = v + ' vārdi' + (md.parbaudes ? ' · izpildītas ' + rez.filter((r) => r.ok).length + '/' + rez.length + ' prasības' : '');
        };
        ta.addEventListener('input', () => { atj(); try { localStorage.setItem(lsKey, ta.value); } catch (e) {} });
        atj();
        izk.appendChild(ta); izk.appendChild(kr); w.appendChild(izk);
        const pg = el('div', 'ek-uzd-pogas');
        const sutit = (iesniegt) => {
            if (iesniegt) {
                const neizp = rez.filter((r) => md.parbaudes && !r.ok).length;
                if (neizp && !confirm('Vēl nav izpildītas ' + neizp + ' prasības. Tomēr iesniegt pasniedzējam?')) return;
            }
            const parb = {}; rez.forEach((r) => { if (r.id) parb[r.id] = [r.ok ? 1 : 0, r.v]; });
            api('PUT', '/api/gk/' + kurss + '/majasdarbs/' + nr, { teksts: ta.value, iesniegt, parbaudes: parb })
                .then(() => { if (iesniegt) { try { localStorage.removeItem(lsKey); } catch (e) {} } toast(iesniegt ? V().sutits + ' Mājasdarbs iesniegts pasniedzējam.' : 'Melnraksts saglabāts'); return atjaunot(); })
                .catch((e) => toast(e.message, true));
        };
        if (!M || M.statuss === 'melnraksts' || M.statuss === 'jalabo') {
            pg.appendChild(poga(M && M.statuss === 'jalabo' ? 'Iesniegt labojumu' : 'Iesniegt pasniedzējam', 'btn-cta ek-poga-maza', () => sutit(true)));
            pg.appendChild(poga('Saglabāt melnrakstu', 'btn-secondary ek-poga-maza', () => sutit(false)));
        } else if (M.statuss === 'iesniegts') {
            const lab = poga('Labot iesniegto', 'btn-secondary ek-poga-maza', () => {
                ta.readOnly = false; ta.focus(); lab.remove();
                pg.appendChild(poga('Iesniegt vēlreiz', 'btn-cta ek-poga-maza', () => sutit(true)));
            });
            pg.appendChild(lab);
        }
        if (pg.children.length) w.appendChild(pg);
        w.appendChild(el('p', 'gk-meta', M && M.statuss === 'novertets' ? 'Mājasdarbs ir novērtēts.' : 'Teksts tiek glabāts šajā pārlūkā, kamēr raksti. Pēc iesniegšanas pasniedzējs saņems paziņojumu.'));
        return w;
    }

    // --- pasniedzējs: iesniegumu saraksts un vērtēšana ---
    function iesniegumi(vieta, nr, filtrs) {
        vieta.textContent = ''; vieta.appendChild(el('p', 'gk-meta', 'Ielādē…'));
        return api('GET', '/api/gk/' + kurss + '/majasdarbi' + (nr ? '?nr=' + nr : '')).then((d) => {
            vieta.textContent = '';
            let L = d.majasdarbi;
            if (filtrs === 'japarbauda') L = L.filter((m) => m.statuss === 'iesniegts');
            if (!L.length) { vieta.appendChild(el('p', 'gk-meta', filtrs === 'japarbauda' ? 'Visi iesniegtie mājasdarbi ir pārbaudīti. ¡Genial!' : 'Vēl neviens nav iesniedzis mājasdarbu.')); return; }
            L.forEach((m) => vieta.appendChild(iesniegumaKarte(m, !nr, () => iesniegumi(vieta, nr, filtrs))));
        }).catch((e) => { vieta.textContent = ''; vieta.appendChild(el('p', 'gk-meta', e.message)); });
    }
    function iesniegumaKarte(m, radNodarbibu, parlādēt) {
        const k = el('article', 'gk-md-iesniegums gk-md-iesniegums--' + m.statuss);
        const g = el('div', 'gk-md-iesn-galva');
        const kas = el('div'); kas.appendChild(el('b', '', m.name || m.email));
        kas.appendChild(el('small', '', (radNodarbibu ? m.nr + '. ' + (m.nosaukums || 'nodarbība') + ' · ' : '') + 'iesniegts ' + lvDat((m.iesniegts_at || '').slice(0, 10)) + (m.reizes > 1 ? ' · ' + m.reizes + '. versija' : '')));
        g.appendChild(kas); g.appendChild(el('span', 'badge badge-' + MD_KL[m.statuss], MD_NOS[m.statuss] + (m.statuss === 'novertets' && m.vertejums ? ': ' + m.vertejums : '')));
        k.appendChild(g);
        k.appendChild(el('div', 'gk-md-iesn-teksts', m.teksts));
        const vardi = m.teksts.trim() ? m.teksts.trim().split(/\s+/).length : 0;
        const info = el('p', 'gk-meta', vardi + ' vārdi');
        if (m.parbaudes) { const v = Object.values(m.parbaudes); info.textContent += ' · automātiskās pārbaudes: ' + v.filter((x) => x[0]).length + '/' + v.length + ' izpildītas'; }
        k.appendChild(info);
        const f = el('form', 'gk-md-vertet');
        const v = lauks(f, 'Vērtējums (piem., 9/10 vai «Teicami»)', 'text', m.vertejums || ''); v.maxLength = 40;
        const kw = el('div', 'gk-lauks gk-lauks--plats'); const kl = el('label', '', 'Komentārs studentam'); const ka = el('textarea', 'ek-textarea'); ka.value = m.komentars || ''; ka.rows = 3; ka.id = 'gk-k-' + m.id; kl.htmlFor = ka.id; kw.appendChild(kl); kw.appendChild(ka); f.appendChild(kw);
        const pg = el('div', 'ek-uzd-pogas');
        const sut = (statuss) => api('PATCH', '/api/gk/' + kurss + '/majasdarbi/' + m.id, { statuss, vertejums: v.value, komentars: ka.value })
            .then(() => { toast(statuss === 'jalabo' ? 'Atgriezts labošanai — students saņems e-pastu' : 'Novērtēts — students saņems e-pastu'); return ieladetParskatu().then(parlādēt); }).catch((e) => toast(e.message, true));
        const b1 = el('button', 'btn-cta ek-poga-maza', m.statuss === 'novertets' ? 'Saglabāt vērtējumu' : 'Novērtēt'); b1.type = 'submit'; pg.appendChild(b1);
        pg.appendChild(poga('Atgriezt labošanai', 'btn-secondary ek-poga-maza', () => sut('jalabo')));
        f.appendChild(pg);
        f.addEventListener('submit', (e) => { e.preventDefault(); sut('novertets'); });
        k.appendChild(f);
        return k;
    }
    function majasdarbiLapa() {
        notirit();
        virsraksts.textContent = 'Mājasdarbi';
        const k = el('div', 'gk-md-lapa');
        const atp = saite('← Kursa sākums', '#', 'mat-atpakal'); atp.style.padding = '0'; k.appendChild(atp);
        const cil = el('div', 'gk-cilnes'); const sar = el('div', 'gk-md-saraksts');
        let filtrs = 'japarbauda';
        const c1 = poga('Jāpārbauda', 'gk-cilne'), c2 = poga('Visi', 'gk-cilne');
        const rad = (f) => { filtrs = f; c1.setAttribute('aria-pressed', f === 'japarbauda'); c2.setAttribute('aria-pressed', f !== 'japarbauda'); iesniegumi(sar, null, filtrs); };
        c1.addEventListener('click', () => rad('japarbauda')); c2.addEventListener('click', () => rad('visi'));
        cil.appendChild(c1); cil.appendChild(c2); k.appendChild(cil); k.appendChild(sar);
        sakne.appendChild(k);
        rad('japarbauda');
        return Promise.resolve();
    }

    // ===================================================================
    // DALĪBNIEKI (pasniedzējam)
    // ===================================================================
    function dalibnieki() {
        return api('GET', '/api/gk/' + kurss + '/dalibnieki').then((d) => {
            notirit();
            virsraksts.textContent = 'Dalībnieki';
            const k = karte();
            const atp = saite('← Kursa sākums', '#', 'mat-atpakal'); atp.style.padding = '0'; k.appendChild(atp);
            if (!d.dalibnieki.length) { k.appendChild(el('p', 'gk-meta', 'Šim kursam vēl nav dalībnieku. Studentu pievieno administrācijā («Pievienot kursam»).')); sakne.appendChild(k); return; }
            const tw = el('div', 'ek-tabula-wrap'); const tb = el('table', 'ek-tabula gk-dal-tabula');
            const th = el('tr'); ['Students', 'Statuss'].concat(P.nodarbibas.map((n) => n.nr + '.')).forEach((h) => th.appendChild(el('th', '', h)));
            const thead = el('thead'); thead.appendChild(th); tb.appendChild(thead);
            const tbody = el('tbody');
            d.dalibnieki.forEach((s) => {
                const tr = el('tr');
                const td = el('td'); td.appendChild(el('b', '', s.name || '—')); td.appendChild(el('small', '', s.email)); tr.appendChild(td);
                tr.appendChild(el('td', '', s.piekluve ? 'Piekļuve ✓' : 'Gaida apmaksu'));
                P.nodarbibas.forEach((n) => { const v = s.progress[n.nr] || 0; const c = el('td', 'gk-dal-sk' + (n.uzdevumi && v >= n.uzdevumi ? ' gatavs' : ''), n.uzdevumi ? v + '/' + n.uzdevumi : '—'); tr.appendChild(c); });
                tbody.appendChild(tr);
            });
            tb.appendChild(tbody); tw.appendChild(tb); k.appendChild(tw);
            k.appendChild(el('p', 'gk-meta', 'Skaitļi = izpildītie uzdevumi nodarbībā. Lomas (Pasniedzējs / Students) maina administrācijā → Lietotāji.'));
            sakne.appendChild(k);
        });
    }

    // ===================================================================
    // MARŠRUTI
    // ===================================================================
    // Pārlādē datus; ja skats nav mainījies (piem., pievienots materiāls), paliek tajā pašā ritinājuma vietā
    function atjaunot() {
        const h = location.hash, y = window.scrollY;
        Object.keys(nodKes).forEach((k) => delete nodKes[k]);
        return ieladetParskatu().then(marsruts).then(() => { if (location.hash === h) window.scrollTo(0, y); }).catch(kluda);
    }
    function marsruts() {
        if (!P) return;
        const h = location.hash.replace(/^#/, '');
        cels.textContent = P.kurss.name; virsraksts.textContent = P.kurss.name; document.title = P.kurss.name + ' — Libertas';
        let m; ielade(true);
        let p;
        if ((m = h.match(/^n\/(\d+)$/))) p = nodarbiba(Number(m[1]));
        else if (h === 'dalibnieki' && P.piekluve.pasniedzejs) p = dalibnieki();
        else if (h === 'majasdarbi' && P.piekluve.pasniedzejs) p = majasdarbiLapa();
        else { p = Promise.resolve(sakums()); }
        return p.catch(kluda).then(() => ielade(false));
    }

    function sakt() {
        if (!kurss) { saraksts().catch((e) => { if (e.status === 401) stavoklis('Ienāc savā kontā', 'Kursu telpas pieejamas pēc ienākšanas ar Google kontu.', [ienakt()]); else kluda(e); }).then(() => ielade(false)); return; }
        ieladetParskatu().then((d) => {
            if (!d.piekluve.ok) {
                const i = d.piekluve.iemesls;
                const T = {
                    ienakt: ['Ienāc savā kontā', 'Kursa telpa pieejama pēc ienākšanas ar Google kontu.', [ienakt()]],
                    nav: ['Tu neesi reģistrēts šim kursam', 'Piesakies kursam — pēc apmaksas šeit atvērsies kursa telpa ar nodarbībām un materiāliem.', [saite('Skatīt kursus', 'kursi.html', 'btn-cta')]],
                    apmaksa: ['Gaida apmaksu', 'Pieteikums ir saņemts. Kursa telpa atvērsies, tiklīdz apmaksa būs apstiprināta.', [saite('Mani kursi', 'konts.html#kursi', 'btn-cta')]],
                    nav_telpas: ['Kursa telpa tiek gatavota', 'Pasniedzējs drīzumā pievienos nodarbības un tiešsaistes saiti.', [saite('Mani kursi', 'konts.html#kursi', 'btn-cta')]],
                }[i] || ['Nav piekļuves', '', []];
                if (d.kurss) { cels.textContent = d.kurss.name; virsraksts.textContent = d.kurss.name; }
                stavoklis(T[0], T[1], T[2]); ielade(false); return;
            }
            window.addEventListener('hashchange', marsruts);
            marsruts();
        }).catch((e) => {
            ielade(false);
            if (e.status === 404) stavoklis('Kursa telpa vēl nav izveidota', 'Izveido telpu, lai pievienotu nodarbības, Google Meet saiti un materiālus.', [poga('Izveidot kursa telpu', 'btn-cta', () => api('POST', '/api/gk/' + kurss).then(() => location.reload()).catch((er) => toast(er.message, true)))]);
            else kluda(e);
        });
    }
    sakt();
})();
