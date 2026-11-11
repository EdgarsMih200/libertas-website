// E-kursa atskaņotājs (macibas.html?k=<kurss>). Skati pēc hash:
//   #            kursa sākums (taka, progress, piekļuve)
//   #n/<nr>[/<daļa>]  nodarbība: merki → d1…dn → prakse → kopsavilkums
//   #t/<nr>      pašpārbaudes tests (vērtē serveris)
//   #eksamens    noslēguma eksāmens · #sertifikats · #talak (resursi)
// Vingrinājumus pārbauda pārlūkā (atbildes ir nodarbības JSON); testu/eksāmena atbildes pārlūkam netiek sūtītas.
(function () {
    'use strict';
    const kurss = (new URLSearchParams(location.search).get('k') || '').replace(/[^a-z0-9-]/g, '');
    const sakne = document.getElementById('ek-saknes');
    const lapa = document.getElementById('ek-lapa');
    const virsraksts = document.getElementById('ek-virsraksts');
    const cels = document.getElementById('ek-cels');
    let P = null;            // kursa pārskats no /api/ek/<kurss>
    const nodKes = {};       // nodarbību kešs
    let tests = null;        // aktīvais tests/eksāmens {veids, nr, meginajums, atbildes, i}

    // ---------- palīgi ----------
    function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    function api(method, url, body) {
        return fetch(url, { method, credentials: 'same-origin', headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined })
            .then((r) => r.json().catch(() => ({})).then((d) => { if (!r.ok) { const e = new Error(d.error || 'Kļūda'); e.status = r.status; e.dati = d; throw e; } return d; }));
    }
    function toast(m, kl) { if (window.LIB && LIB.toast) LIB.toast(m, kl); else alert(m); }
    function lvDat(iso) { if (!iso) return ''; const d = new Date(iso); return String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + d.getFullYear() + '.'; }
    function lvDatD(iso) { const p = String(iso).slice(0, 10).split('-'); return p[2] + '.' + p[1] + '.' + p[0] + '.'; }
    function lvDatLaiks(iso) { const d = new Date(iso); return lvDat(iso) + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
    function dienasLidz(iso) { return Math.max(0, Math.ceil((Date.parse(iso) - Date.now()) / 86400000)); }
    function cena(e) { return Number(e || 0).toFixed(2).replace('.', ',') + ' EUR'; }
    const IKONAS = {
        skana: '<path d="M4 10v4h4l5 4V6L8 10H4z"/><path d="M16 9a4 4 0 010 6M18.5 6.5a7.5 7.5 0 010 11"/>',
        slot: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
        cek: '<path d="M6 12l4 4 8-8"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h0"/>',
        kal: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
        gram: '<path d="M5 4h10l4 4v12H5z"/><path d="M9 12h6M9 16h6"/>', sert: '<circle cx="12" cy="9" r="5"/><path d="M9 13l-2 7 5-2 5 2-2-7"/>',
        mik: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/>', cel: '<path d="M4 19h16M6 15l4-6 3 4 2-3 3 5"/>',
        x: '<path d="M6 6l12 12M18 6L6 18"/>'
    };
    function ikona(n, cls) { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', cls || 'ek-ikona'); s.setAttribute('aria-hidden', 'true'); s.innerHTML = IKONAS[n]; return s; }
    function poga(teksts, cls, fn) { const b = el('button', cls || 'btn-secondary', teksts); b.type = 'button'; if (fn) b.addEventListener('click', fn); return b; }
    function saite(teksts, href, cls) { const a = el('a', cls || 'btn-secondary', teksts); a.href = href; return a; }
    function karte(cls) { return el('div', 'ek-karte' + (cls ? ' ' + cls : '')); }
    function noteikumi(saturs) { const d = el('div', 'ek-noteikumi'); d.appendChild(ikona('info')); const s = el('span'); if (typeof saturs === 'string') s.innerHTML = saturs; else s.appendChild(saturs); d.appendChild(s); return d; }
    function escH(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    // Vienkāršs Markdown: **b**, *i*, saraksti, rindkopas
    function md(t) {
        const inl = (s) => escH(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');
        return String(t || '').split(/\n{2,}/).map((b) => {
            const r = b.split('\n');
            if (r.every((x) => /^\s*[-•]\s+/.test(x))) return '<ul>' + r.map((x) => '<li>' + inl(x.replace(/^\s*[-•]\s+/, '')) + '</li>').join('') + '</ul>';
            if (r.every((x) => /^\s*\d+[.)]\s+/.test(x))) return '<ol>' + r.map((x) => '<li>' + inl(x.replace(/^\s*\d+[.)]\s+/, '')) + '</li>').join('') + '</ol>';
            return '<p>' + r.map(inl).join('<br>') + '</p>';
        }).join('');
    }

    // ---------- runa ----------
    const VALODAS = { es: 'es-ES', en: 'en-GB', de: 'de-DE', fr: 'fr-FR', it: 'it-IT', lv: 'lv-LV' };
    function runat(teksts) {
        if (!('speechSynthesis' in window)) { toast('Šī pārlūkprogramma neatbalsta skaņu', true); return; }
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(teksts);
        u.lang = VALODAS[(P && P.kurss.valoda) || 'es'] || 'es-ES';
        u.rate = 0.85;
        const b = speechSynthesis.getVoices().find((v) => v.lang === u.lang) || speechSynthesis.getVoices().find((v) => v.lang.slice(0, 2) === u.lang.slice(0, 2));
        if (b) u.voice = b;
        speechSynthesis.speak(u);
    }
    function skanasPoga(teksts, cls) { const b = el('button', cls || 'ek-skana-poga'); b.type = 'button'; b.setAttribute('aria-label', 'Klausīties: ' + teksts); b.appendChild(ikona('skana')); b.addEventListener('click', () => runat(teksts)); return b; }

    // ---------- materiāla bloki ----------
    function bloks(b) {
        const t = b.t;
        if (t === 'teksts') { const d = el('div', 'ek-teorija'); d.innerHTML = md(b.md); return d; }
        if (t === 'svarigi') { const d = el('div', 'ek-svarigi'); d.appendChild(el('strong', '', 'Svarīgi!')); const s = el('div'); s.innerHTML = md(b.md); d.appendChild(s); return d; }
        if (t === 'piemers' || t === 'vardnica') {
            const w = el('div');
            if (b.md) { const d = el('div', 'ek-teorija'); d.innerHTML = md(b.md); w.appendChild(d); }
            const ul = el('ul', 'ek-piemeri');
            (b.vienumi || []).forEach((v) => { const li = el('li'); li.appendChild(skanasPoga(v[0])); li.appendChild(el('b', '', v[0])); li.appendChild(el('span', '', v[1] || '')); ul.appendChild(li); });
            w.appendChild(ul); return w;
        }
        if (t === 'burti') {
            const g = el('div', 'ek-burti');
            (b.vienumi || []).forEach((v) => { const c = el('div', 'ek-burts'); c.appendChild(el('b', '', v[0])); c.appendChild(el('span', '', '[' + v[1] + ']')); c.appendChild(el('i', '', v[2] || '')); c.appendChild(skanasPoga(v[2] || v[0])); g.appendChild(c); });
            return g;
        }
        if (t === 'zilbes') {
            const d = el('div', 'ek-zilbes'); const daļas = String(b.vards).split('|');
            d.setAttribute('aria-label', daļas.join('-').toLowerCase() + ' (uzsvērtā: ' + (daļas.find((x) => x === x.toUpperCase() && /\p{L}/u.test(x)) || '').toLowerCase() + ')');
            daļas.forEach((z) => { const uz = z === z.toUpperCase() && /\p{Lu}/u.test(z); d.appendChild(el('span', uz ? 'uzsv' : '', uz ? z.toLowerCase() : z)); });
            d.appendChild(skanasPoga(daļas.join('').toLowerCase()));
            return d;
        }
        if (t === 'tabula') {
            const tb = el('table', 'ek-tabula-md');
            if (b.galva) { const tr = el('tr'); b.galva.forEach((h) => tr.appendChild(el('th', '', h))); const th = el('thead'); th.appendChild(tr); tb.appendChild(th); }
            const tbody = el('tbody'); (b.rindas || []).forEach((r) => { const tr = el('tr'); r.forEach((c) => tr.appendChild(el('td', '', c))); tbody.appendChild(tr); }); tb.appendChild(tbody);
            const w = el('div', 'ek-tabula-wrap'); w.appendChild(tb); return w;
        }
        if (t === 'attels') { const i = el('img'); i.src = b.src; i.alt = b.alt || ''; i.loading = 'lazy'; i.style.maxWidth = '100%'; return i; }
        return el('div');
    }

    // ---------- uzdevumi ----------
    const PRASMES_NOS = () => Object.fromEntries(((P && P.kurss.prasmes) || []).map((p) => [p.id, p.nosaukums]));
    const norm = (s) => String(s == null ? '' : s).toLowerCase().normalize('NFC').replace(/[.,!?¡¿;:"'’«»“”()]/g, ' ').replace(/\s+/g, ' ').trim();
    const sakrit = (a, alt) => typeof a === 'string' && String(alt).split('|').map(norm).includes(norm(a));
    function vertet(u, a) {
        switch (u.tips) {
            case 'izvele': return a === u.atbilde ? 1 : 0;
            case 'klausies': return u.varianti ? (a === u.atbilde ? 1 : 0) : (sakrit(a, u.atbilde) ? 1 : 0);
            case 'vairakas': return Array.isArray(a) && a.length === u.atbildes.length && u.atbildes.every((x) => a.includes(x)) ? 1 : 0;
            case 'ievadi': return sakrit(a, u.atbilde) ? 1 : 0;
            case 'tuksumi': return Array.isArray(a) ? u.atbildes.filter((alt, i) => sakrit(a[i], alt)).length / u.atbildes.length : 0;
            case 'pari': return Array.isArray(a) ? u.pari.filter((p, i) => a[i] === p[1]).length / u.pari.length : 0;
            case 'seciba': return Array.isArray(a) && a.join('\u0001') === u.elementi.join('\u0001') ? 1 : 0;
            case 'kategorijas': { const v = Object.entries(u.kategorijas).flatMap(([k, x]) => x.map((y) => [y, k])); return a ? v.filter(([y, k]) => a[y] === k).length / v.length : 0; }
        }
        return 0;
    }
    function jaukt(a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
    // Prakses uzdevumu pārveido tādā pašā formā kā testa jautājumu (kreisie/labie, sajaukti elementi…)
    function kaKlientam(u) {
        const r = Object.assign({}, u);
        if (u.tips === 'pari') { r.kreisie = u.pari.map((p) => p[0]); r.labie = jaukt(u.pari.map((p) => p[1])); }
        if (u.tips === 'seciba') r.elementi = jaukt(u.elementi);
        if (u.tips === 'kategorijas') { r.kategorijas = Object.keys(u.kategorijas); r.vienumi = jaukt(Object.values(u.kategorijas).flat()); }
        if (u.tips === 'tuksumi') r.tuksumi = u.atbildes.length;
        return r;
    }

    // Uzdevuma ievade. j = klienta forma; vertiba() atgriež atbildi; onMaina() pēc katras izmaiņas
    function ievade(j, sakuma, onMaina) {
        const w = el('div', 'ek-ievade-kaste');
        let vert = sakuma;
        const set = (v) => { vert = v; if (onMaina) onMaina(v); };
        if (j.fragments) w.appendChild(el('div', 'ek-fragments', j.fragments));
        if (j.tips === 'klausies' && j.runa) { const b = poga('', 'btn-secondary ek-poga-maza'); b.appendChild(ikona('skana')); b.appendChild(document.createTextNode(' Atskaņot')); b.addEventListener('click', () => runat(j.runa)); b.style.marginBottom = '12px'; w.appendChild(b); }
        if (j.jautajums && j.tips !== 'tuksumi') w.appendChild(el('p', 'ek-jaut-teksts', j.jautajums));
        if (j.varianti) {
            const g = el('div', 'ek-varianti'); const vair = j.tips === 'vairakas';
            const atz = new Set(vair ? (vert || []) : []);
            j.varianti.forEach((v, i) => {
                const b = el('button', 'ek-variants', v); b.type = 'button';
                b.setAttribute('aria-pressed', String(vair ? atz.has(i) : vert === i));
                b.addEventListener('click', () => {
                    if (vair) { atz.has(i) ? atz.delete(i) : atz.add(i); b.setAttribute('aria-pressed', String(atz.has(i))); set([...atz].sort()); }
                    else { g.querySelectorAll('.ek-variants').forEach((x) => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); set(i); }
                });
                g.appendChild(b);
            });
            if (vair) w.appendChild(el('p', 'ek-bloks-meta', 'Var būt vairākas pareizās atbildes.'));
            w.appendChild(g);
        } else if (j.tips === 'ievadi' || j.tips === 'klausies') {
            const i = el('input', 'lauks'); i.type = 'text'; i.autocomplete = 'off'; i.spellcheck = false; i.setAttribute('aria-label', 'Tava atbilde'); i.value = vert || '';
            i.addEventListener('input', () => set(i.value)); w.appendChild(i);
        } else if (j.tips === 'tuksumi') {
            const p = el('p', 'ek-tuksumi'); const dalas = String(j.jautajums).split(/_{3,}/); const arr = Array.isArray(vert) ? vert.slice() : [];
            dalas.forEach((d, k) => {
                p.appendChild(document.createTextNode(d));
                if (k < dalas.length - 1) { const i = el('input', 'lauks'); i.type = 'text'; i.autocomplete = 'off'; i.spellcheck = false; i.setAttribute('aria-label', 'Tukšums ' + (k + 1)); i.value = arr[k] || ''; i.addEventListener('input', () => { arr[k] = i.value; set(arr.slice()); }); p.appendChild(i); }
            });
            w.appendChild(p);
        } else if (j.tips === 'pari' || j.tips === 'kategorijas') {
            const kreisie = j.tips === 'pari' ? j.kreisie : j.vienumi;
            const opcijas = j.tips === 'pari' ? j.labie : j.kategorijas;
            const atb = j.tips === 'pari' ? (Array.isArray(vert) ? vert.slice() : []) : Object.assign({}, vert || {});
            kreisie.forEach((k, n) => {
                const r = el('label', 'ek-rinda-izvele'); r.appendChild(el('span', '', k));
                const s = el('select'); s.appendChild(el('option', '', '— izvēlies —')).value = '';
                opcijas.forEach((o) => { const op = el('option', '', o); op.value = o; s.appendChild(op); });
                s.value = (j.tips === 'pari' ? atb[n] : atb[k]) || '';
                s.addEventListener('change', () => { if (j.tips === 'pari') atb[n] = s.value || null; else atb[k] = s.value || null; set(Array.isArray(atb) ? atb.slice() : Object.assign({}, atb)); });
                r.appendChild(s); w.appendChild(r);
            });
        } else if (j.tips === 'seciba') {
            const atb = el('div', 'ek-seciba-atbilde'); atb.setAttribute('aria-label', 'Tava secība'); const el2 = el('div', 'ek-seciba-elementi');
            let arr = Array.isArray(vert) ? vert.slice() : [];
            const zimet = () => {
                atb.textContent = ''; el2.textContent = '';
                const izm = arr.slice();
                arr.forEach((x, n) => { const c = el('button', 'ek-cips', x); c.type = 'button'; c.setAttribute('aria-label', x + ' — noņemt'); c.addEventListener('click', () => { arr.splice(n, 1); set(arr.slice()); zimet(); }); atb.appendChild(c); });
                j.elementi.forEach((x) => { const k = izm.indexOf(x); const c = el('button', 'ek-cips', x); c.type = 'button'; if (k > -1) { izm.splice(k, 1); c.disabled = true; } else c.addEventListener('click', () => { arr.push(x); set(arr.slice()); zimet(); }); el2.appendChild(c); });
            };
            zimet(); w.appendChild(atb); w.appendChild(el2);
        }
        return { mezgls: w, vertiba: () => vert };
    }

    // Vingrinājums ar tūlītēju atgriezenisko saiti (pārlūkā)
    function vingrinajums(u, nr) {
        const k = el('div', 'ek-uzd');
        const g = el('div', 'ek-uzd-galva');
        if (nr) g.appendChild(el('span', 'ek-bloks-meta', nr));
        const pn = PRASMES_NOS();
        if (u.prasme) g.appendChild(el('span', 'ek-birka', pn[u.prasme] || u.prasme));
        k.appendChild(g);
        k.appendChild(el('h3', '', u.teksts || u.uzdevums || ''));
        if (u.tips === 'rakstit' || u.tips === 'runat') { pasparbaude(k, u); return k; }
        const j = kaKlientam(u);
        let ie = ievade(j, null, () => { if (fb) { fb.remove(); fb = null; } });
        k.appendChild(ie.mezgls);
        let fb = null;
        const pogas = el('div', 'ek-uzd-pogas');
        pogas.appendChild(poga('Pārbaudīt', 'btn-secondary ek-poga-maza', () => {
            const a = ie.vertiba();
            if (a == null || a === '' || (Array.isArray(a) && !a.length)) { toast('Vispirms atbildi'); return; }
            const p = vertet(u, a);
            if (fb) fb.remove();
            fb = el('div', 'ek-atgriezeniska ' + (p === 1 ? 'ek-atgriezeniska--labi' : 'ek-atgriezeniska--slikti'));
            fb.setAttribute('role', 'status');
            fb.appendChild(ikona(p === 1 ? 'cek' : 'info'));
            const s = el('span'); s.appendChild(el('b', '', p === 1 ? 'Pareizi! ' : p > 0 ? 'Daļēji pareizi. ' : 'Vēl ne. '));
            s.appendChild(document.createTextNode((u.skaidrojums || '') + (p < 1 ? ' Mēģini vēlreiz!' : '')));
            fb.appendChild(s); k.insertBefore(fb, pogas.nextSibling);
        }));
        pogas.appendChild(poga('Rādīt atbildi', 'btn-link', () => {
            if (fb) fb.remove();
            fb = el('div', 'ek-atgriezeniska ek-atgriezeniska--labi'); fb.appendChild(ikona('info'));
            const s = el('span'); s.appendChild(el('b', '', 'Atbilde: ')); s.appendChild(document.createTextNode(pareizaAtb(u) + '. ' + (u.skaidrojums || ''))); fb.appendChild(s);
            k.insertBefore(fb, pogas.nextSibling);
        }));
        k.appendChild(pogas);
        return k;
    }
    function pareizaAtb(u) {
        const p = (s) => String(s).split('|')[0];
        switch (u.tips) {
            case 'izvele': return u.varianti[u.atbilde];
            case 'klausies': return u.varianti ? u.varianti[u.atbilde] : p(u.atbilde);
            case 'vairakas': return u.atbildes.map((i) => u.varianti[i]).join(', ');
            case 'ievadi': return p(u.atbilde);
            case 'tuksumi': return u.atbildes.map(p).join(' · ');
            case 'pari': return u.pari.map((x) => x[0] + ' — ' + x[1]).join('; ');
            case 'seciba': return u.elementi.join(' ');
            case 'kategorijas': return Object.entries(u.kategorijas).map(([k, v]) => k + ': ' + v.join(', ')).join('; ');
        }
        return '';
    }
    // Rakstīšana / runāšana ar paraugu un pašpārbaudes sarakstu
    function pasparbaude(k, u) {
        if (u.tips === 'rakstit') {
            const t = el('textarea', 'ek-textarea'); t.setAttribute('aria-label', 'Tavs teksts');
            const kl = 'ek-rakst-' + kurss + '-' + (u.id || ''); try { t.value = localStorage.getItem(kl) || ''; } catch (e) {}
            t.addEventListener('input', () => { try { localStorage.setItem(kl, t.value); } catch (e) {} });
            k.appendChild(t);
        } else {
            const paraugi = Array.isArray(u.paraugs) ? u.paraugs : [u.paraugs];
            const p = el('p', 'ek-ievade'); paraugi.forEach((x, i) => { if (i) p.appendChild(document.createTextNode(' · ')); p.appendChild(document.createTextNode(x)); }); p.style.fontSize = '1.25rem';
            k.appendChild(p);
            const r = el('div', 'ek-ieraksts');
            const b = el('button', 'ek-ieraksts-poga'); b.type = 'button'; b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-label', 'Sākt ierakstu'); b.appendChild(ikona('mik'));
            const audio = el('audio'); audio.controls = true; audio.hidden = true;
            let rec = null, gab = [];
            b.addEventListener('click', () => {
                if (rec && rec.state === 'recording') { rec.stop(); return; }
                if (!navigator.mediaDevices || !window.MediaRecorder) { toast('Ierakstīšana šajā pārlūkā nav pieejama — izlasi skaļi un salīdzini ar paraugu.', true); return; }
                navigator.mediaDevices.getUserMedia({ audio: true }).then((s) => {
                    rec = new MediaRecorder(s); gab = [];
                    rec.ondataavailable = (e) => gab.push(e.data);
                    rec.onstop = () => { s.getTracks().forEach((t) => t.stop()); audio.src = URL.createObjectURL(new Blob(gab, { type: rec.mimeType })); audio.hidden = false; b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-label', 'Ierakstīt vēlreiz'); };
                    rec.start(); b.setAttribute('aria-pressed', 'true'); b.setAttribute('aria-label', 'Apturēt ierakstu');
                }).catch(() => toast('Mikrofons nav atļauts', true));
            });
            r.appendChild(b); r.appendChild(audio);
            r.appendChild(poga('Paraugs', 'btn-secondary ek-poga-maza', () => runat(paraugi.join('. '))));
            k.appendChild(r);
        }
        if (u.tips === 'rakstit') {
            const pg = el('div', 'ek-uzd-pogas'); let rad = null;
            pg.appendChild(poga('Rādīt paraugu', 'btn-secondary ek-poga-maza', () => { if (rad) return; rad = el('div', 'ek-paraugs', Array.isArray(u.paraugs) ? u.paraugs.join('\n') : u.paraugs); rad.style.whiteSpace = 'pre-line'; k.insertBefore(rad, pg.nextSibling); }));
            k.appendChild(pg);
        }
        const ul = el('ul', 'ek-parbaude');
        (u.parbaude || []).forEach((x) => { const li = el('li'); const l = el('label'); const c = el('input'); c.type = 'checkbox'; l.appendChild(c); l.appendChild(document.createTextNode(' ' + x)); li.appendChild(l); ul.appendChild(li); });
        k.appendChild(el('p', 'ek-bloks-meta', 'Pārbaudi sevi:'));
        k.appendChild(ul);
    }

    // ---------- ielāde ----------
    function ielade(ir) { lapa.setAttribute('aria-busy', ir ? 'true' : 'false'); }
    function notirit() { sakne.textContent = ''; window.scrollTo(0, 0); }
    function kluda(e) {
        notirit();
        const k = karte('ek-stavoklis');
        k.appendChild(el('h2', '', 'Neizdevās ielādēt'));
        k.appendChild(el('p', '', e.message || 'Mēģini vēlreiz.'));
        k.appendChild(saite('Uz kursa sākumu', '#', 'btn-cta'));
        sakne.appendChild(k);
    }
    function ieladetParskatu() { return api('GET', '/api/ek/' + kurss).then((d) => { P = d; return d; }); }
    function nodarbibaDati(nr) { if (nodKes[nr]) return Promise.resolve(nodKes[nr]); return api('GET', '/api/ek/' + kurss + '/nodarbiba/' + nr).then((d) => (nodKes[nr] = d)); }

    // ---------- nav piekļuves ----------
    function navPiekluves() {
        notirit();
        const k = karte('ek-stavoklis'); const i = P.piekluve.iemesls;
        const T = {
            ienakt: ['Ienāc savā kontā', 'Kurss pieejams pēc ienākšanas ar Google kontu.'],
            nav: ['Tev vēl nav piekļuves šim kursam', 'Iegādājies piekļuvi kursu lapā — pēc apmaksas kurss atvērsies šeit.'],
            apmaksa: ['Gaida apmaksu', 'Pieteikums ir saņemts. Kurss atvērsies, tiklīdz apmaksa būs apstiprināta.'],
            beigusies: ['Piekļuve beigusies', 'Piekļuves termiņš beidzās ' + lvDatD(P.piekluve.lidz) + '. Ja vēlies to pagarināt, sazinies ar mums.']
        }[i] || ['Nav piekļuves', ''];
        k.appendChild(el('h2', '', T[0])); k.appendChild(el('p', '', T[1]));
        if (i === 'ienakt') k.appendChild(saite('Ienākt ar Google', window.LIB && LIB.signInUrl ? LIB.signInUrl(location.pathname + location.search) : '/auth/google', 'btn-cta'));
        else if (i === 'nav') k.appendChild(saite('Skatīt kursu', 'ek-kurss.html?k=' + kurss, 'btn-cta'));
        else k.appendChild(saite('Mani kursi', 'konts.html#kursi', 'btn-cta'));
        if (P.sertifikats) k.appendChild(saite('Mans sertifikāts', 'sertifikats.html?kods=' + P.sertifikats.kods, 'btn-secondary'));
        sakne.appendChild(k);
    }

    // ---------- kursa sākums ----------
    function nakamaisSolis() {
        for (const n of P.kurss.nodarbibas) {
            const pr = P.progress[n.nr];
            if (!pr || !pr.nokartots_at) {
                if (!n.atverta) return null;
                const izd = (pr && pr.dalas) || [];
                return { nr: n.nr, href: '#n/' + n.nr + (izd.length ? '/' + (izd.length >= n.dalas.length ? 'prakse' : 'd' + (izd.filter((x) => /^d\d+$/.test(x)).length + 1)) : ''), teksts: 'Turpināt: ' + n.nr + '. nodarbība' };
            }
        }
        if (!P.eksamens.nokartots) return { href: '#eksamens', teksts: 'Uz noslēguma eksāmenu' };
        if (!P.sertifikats) return { href: '#sertifikats', teksts: 'Saņemt sertifikātu' };
        return { href: '#talak', teksts: 'Ko darīt tālāk' };
    }
    function sakums() {
        notirit();
        const K = P.kurss, E = P.eksamens;
        const wrap = el('div', 'ek-sakums');
        const ol = el('ol', 'ek-taka');
        const solis = (cls, zime, virs, apr, labais, href) => {
            const li = el('li', 'ek-solis ' + cls);
            const z = el('span', 'ek-solis-zime'); if (typeof zime === 'string') z.textContent = zime; else z.appendChild(zime); li.appendChild(z);
            const t = el('div', 'ek-solis-teksts');
            const h = el('h3'); if (href) { const a = el('a', 'ek-solis-saite', virs); a.href = href; h.appendChild(a); } else h.textContent = virs;
            t.appendChild(h); if (apr) t.appendChild(el('p', '', apr)); li.appendChild(t);
            if (labais) li.appendChild(labais);
            ol.appendChild(li);
        };
        const tagad = nakamaisSolis();
        K.nodarbibas.forEach((n) => {
            const pr = P.progress[n.nr];
            const min = n.dalas.reduce((s, d) => s + (d.ilgums_min || 0), 0) + 30;
            if (pr && pr.nokartots_at) solis('ek-solis--izdarits', String(n.nr), n.nosaukums, (n.temas || []).join(' · '), el('span', 'ek-rezultats', 'Tests ' + pr.tests_labakais + ' %'), '#n/' + n.nr);
            else if (n.atverta) solis('ek-solis--tagad', String(n.nr), n.nosaukums, n.dalas.length + ' daļas · ~' + Math.round(min / 10) * 10 + ' min' + (pr && pr.dalas.length ? ' · iesākta' : ''), saite(pr && pr.dalas.length ? 'Turpināt' : 'Sākt', tagad && tagad.nr === n.nr ? tagad.href : '#n/' + n.nr, 'btn-cta ek-poga-maza'), '#n/' + n.nr);
            else solis('ek-solis--slegts', ikona('slot'), n.nr + '. ' + n.nosaukums, 'Atveras pēc iepriekšējās nodarbības testa (≥ 80 %)');
        });
        const eksAtv = E.atverts;
        solis((E.nokartots ? 'ek-solis--izdarits' : eksAtv ? 'ek-solis--tagad' : 'ek-solis--slegts') + ' ek-solis--eksamens', ikona(E.nokartots ? 'cek' : eksAtv ? 'gram' : 'slot'), 'Noslēguma eksāmens',
            E.jautajumi + ' uzdevumi no visām nodarbībām · ' + E.limits + ' mēģinājumi', E.nokartots ? el('span', 'ek-rezultats', E.labakais + ' %') : eksAtv ? saite('Atvērt', '#eksamens', 'btn-cta ek-poga-maza') : null, eksAtv ? '#eksamens' : null);
        solis(P.sertifikats ? 'ek-solis--izdarits' : E.nokartots ? 'ek-solis--tagad' : 'ek-solis--slegts', ikona(P.sertifikats ? 'cek' : E.nokartots ? 'sert' : 'slot'), 'Sertifikāts', 'Ar ≥ ' + E.slieksnis + ' % eksāmenā — automātiski šeit un sadaļā «Mani kursi»', null, E.nokartots ? '#sertifikats' : null);
        solis(P.resursi ? 'ek-solis--izdarits' : 'ek-solis--slegts', ikona(P.resursi ? 'cel' : 'slot'), 'Ko darīt tālāk', 'Noderīgi resursi un ceļi patstāvīgai mācībai', null, P.resursi ? '#talak' : null);
        const kr = el('div'); kr.appendChild(ol); wrap.appendChild(kr);

        const pan = el('aside', 'ek-panelis');
        const k1 = karte(); k1.style.textAlign = 'center';
        const pab = K.nodarbibas.filter((n) => P.progress[n.nr] && P.progress[n.nr].nokartots_at).length;
        const ap = el('div', 'ek-aplis'); ap.style.setProperty('--p', Math.round(pab / K.nodarbibas.length * 100)); ap.appendChild(el('span', '', pab + '/' + K.nodarbibas.length)); k1.appendChild(ap);
        const pp = el('p', '', 'nodarbības pabeigtas'); pp.style.cssText = 'margin:10px 0 16px;color:var(--c-muted);font-size:var(--fs-sm)'; k1.appendChild(pp);
        if (tagad) k1.appendChild(saite(tagad.teksts, tagad.href, 'btn-cta'));
        const pk = el('p', 'ek-piekluve'); pk.style.justifyContent = 'center'; pk.appendChild(ikona('kal'));
        if (P.piekluve.lidz) { pk.appendChild(document.createTextNode('Piekļuve līdz ')); pk.appendChild(el('strong', '', lvDatD(P.piekluve.lidz))); pk.appendChild(document.createTextNode(' (vēl ' + dienasLidz(P.piekluve.lidz) + ' d.)')); }
        else pk.appendChild(document.createTextNode(P.piekluve.admin ? 'Priekšskatījums (administrators)' : ''));
        k1.appendChild(pk);
        pan.appendChild(k1);
        if (K.prasmes && K.prasmes.length) {
            const k2 = karte(); k2.appendChild(el('h3', '', 'Ko tu trenē')).style.cssText = 'margin:0 0 12px;font-size:1.1rem';
            const pr = el('div'); pr.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px';
            K.prasmes.forEach((p) => pr.appendChild(el('span', 'ek-birka', p.nosaukums)));
            k2.appendChild(pr); pan.appendChild(k2);
        }
        pan.appendChild(noteikumi('<strong>Eksāmens:</strong> ' + E.limits + ' mēģinājumi, starp tiem ' + E.pauze_h + ' h. Ja ' + E.limits + ' reizes neizdodas — konsultācija ar pasniedzēju + 3 mēģinājumi vai apmaksa par 3 papildu mēģinājumiem (' + cena(E.papildu_cena) + ').'));
        wrap.appendChild(pan);
        sakne.appendChild(wrap);
    }

    // ---------- nodarbība ----------
    function nodarbiba(nr, solisId) {
        return nodarbibaDati(nr).then((d) => {
            notirit();
            const N = d.nodarbiba; const pr = d.progress || { dalas: [] };
            const izd = new Set(pr.dalas || []);
            const soli = [{ id: 'sakums', nos: 'Mērķi un iesildīšanās', min: 5 }]
                .concat(N.dalas.map((x, i) => ({ id: x.id, nos: (i + 1) + '. daļa · ' + x.nosaukums, min: x.ilgums_min, dala: x })))
                .concat([{ id: 'prakse', nos: 'Praktiskais uzdevums', min: 15 }, { id: 'tests', nos: 'Pašpārbaudes tests', min: 15, tests: true }, { id: 'kopsavilkums', nos: 'Kopsavilkums', min: 5 }]);
            const tagad = soli.find((s) => s.id === solisId) || soli[0];
            const testsOk = !!(pr.nokartots_at);
            const gatavs = (s) => s.tests ? testsOk : s.id === 'sakums' ? izd.size > 0 || testsOk : izd.has(s.id);

            const lay = el('div', 'ek-nod');
            const nav = el('nav', 'ek-nod-nav'); nav.setAttribute('aria-label', 'Nodarbības daļas');
            const atp = saite('← Kursa sākums', '#', 'mat-atpakal'); atp.style.padding = '0'; nav.appendChild(atp);
            const h = el('h2', '', N.nr + '. ' + N.nosaukums); h.style.cssText = 'font-size:1.15rem;margin:12px 0 6px'; nav.appendChild(h);
            const pb = el('div', 'ek-progress'); const pbs = el('span'); pbs.style.width = Math.round(soli.filter(gatavs).length / soli.length * 100) + '%'; pb.appendChild(pbs); nav.appendChild(pb);
            const ol = el('ol');
            soli.forEach((s, i) => {
                const li = el('li', (gatavs(s) ? 'gatavs' : '') + (s.tests ? ' tests' : ''));
                const a = el('a'); a.href = s.tests ? '#t/' + nr : '#n/' + nr + '/' + s.id;
                if (s === tagad) a.setAttribute('aria-current', 'step');
                a.appendChild(el('span', 'nr', gatavs(s) ? '✓' : String(i + 1)));
                a.appendChild(document.createTextNode(s.nos)); a.appendChild(el('small', '', s.min + ' min'));
                li.appendChild(a); ol.appendChild(li);
            });
            nav.appendChild(ol); lay.appendChild(nav);

            const sat = el('div');
            const galva = (n, t, meta) => { const g = el('div', 'ek-bloks-galva'); g.appendChild(el('span', 'mat-nr', String(n))); g.appendChild(el('h2', '', t)); if (meta) g.appendChild(el('span', 'ek-bloks-meta', meta)); return g; };
            const idx = soli.indexOf(tagad);
            if (tagad.id === 'sakums') {
                const s1 = el('section', 'ek-bloks'); s1.appendChild(galva(1, 'Mērķi', (N.ilgums_min ? '~' + N.ilgums_min + ' min' : '')));
                s1.appendChild(el('p', '', 'Pēc šīs nodarbības tu varēsi:'));
                const ul = el('ul', 'ek-merki'); (N.merki || []).forEach((m) => ul.appendChild(el('li', '', m))); s1.appendChild(ul);
                if (N.saites && N.saites.balstas && N.saites.balstas.length) s1.appendChild(noteikumi('<strong>Balstās uz:</strong> ' + N.saites.balstas.map(escH).join('; ')));
                sat.appendChild(s1);
                const s2 = el('section', 'ek-bloks'); s2.appendChild(galva(2, 'Iesildīšanās', 'bez vērtējuma'));
                ((N.iesildisanas && N.iesildisanas.jautajumi) || []).forEach((q) => s2.appendChild(el('p', 'ek-svarigi', q)).style.borderLeftColor = 'var(--c-sage-ink)');
                if (d.atkartojums && d.atkartojums.length) { s2.appendChild(el('h3', '', 'Atkārto iepriekšējo')).style.margin = '16px 0 12px'; d.atkartojums.forEach((u) => s2.appendChild(vingrinajums(u))); }
                sat.appendChild(s2);
            } else if (tagad.dala) {
                const D = tagad.dala;
                const s = el('section', 'ek-bloks'); s.appendChild(galva(idx, D.nosaukums, '~' + D.ilgums_min + ' min'));
                (D.materials || []).forEach((b) => s.appendChild(bloks(b)));
                sat.appendChild(s);
                const v = el('section', 'ek-bloks'); v.appendChild(galva('✎', 'Vingrinājumi', 'bez vērtējuma · atbildes vari pārbaudīt uzreiz'));
                (D.vingrinajumi || []).forEach((u, i) => v.appendChild(vingrinajums(u, (i + 1) + '/' + D.vingrinajumi.length)));
                sat.appendChild(v);
            } else if (tagad.id === 'prakse') {
                const s = el('section', 'ek-bloks'); s.appendChild(galva(idx, 'Praktiskais uzdevums', 'pašpārbaude'));
                if (N.prakse) s.appendChild(vingrinajums(Object.assign({ teksts: N.prakse.uzdevums }, N.prakse)));
                sat.appendChild(s);
            } else if (tagad.id === 'kopsavilkums') {
                const K = N.kopsavilkums || {};
                const s = el('section', 'ek-bloks'); s.appendChild(galva(idx, 'Kopsavilkums'));
                const ul = el('ul', 'ek-merki'); (K.punkti || []).forEach((m) => ul.appendChild(el('li', '', m))); s.appendChild(ul);
                sat.appendChild(s);
                const s2 = el('section', 'ek-bloks'); s2.appendChild(galva('✓', 'Pašvērtējums', 'redzams tikai tev'));
                const f = el('form', 'ek-pasvert'); const pv = pr.pasvertejums || {};
                (K.var_darit || []).forEach((t, i) => {
                    const fs = el('fieldset'); fs.appendChild(el('legend', '', t));
                    [['3', 'Protu labi'], ['2', 'Daļēji'], ['1', 'Vēl jāatkārto']].forEach(([v, n]) => { const l = el('label'); const r = el('input'); r.type = 'radio'; r.name = 'pv' + i; r.value = v; r.checked = String(pv[i]) === v; l.appendChild(r); l.appendChild(document.createTextNode(n)); fs.appendChild(l); });
                    f.appendChild(fs);
                });
                const ta = el('textarea', 'ek-textarea'); ta.placeholder = 'Mana piezīme: ko gribu atcerēties vai atkārtot'; ta.value = pr.piezime || ''; ta.setAttribute('aria-label', 'Mana piezīme');
                f.appendChild(ta);
                const sv = poga('Saglabāt', 'btn-secondary', () => {
                    const obj = {}; (K.var_darit || []).forEach((t, i) => { const c = f.querySelector('input[name="pv' + i + '"]:checked'); if (c) obj[i] = Number(c.value); });
                    api('POST', '/api/ek/' + kurss + '/nodarbiba/' + nr + '/progress', { pasvertejums: obj, piezime: ta.value, dala: 'kopsavilkums' }).then(() => { delete nodKes[nr]; toast('Saglabāts'); }).catch((e) => toast(e.message, true));
                });
                f.appendChild(sv); s2.appendChild(f); sat.appendChild(s2);
            }

            // Apakšējā navigācija + daļas pabeigšana
            const ap = el('div', 'ek-nod-apaksa');
            const iep = soli[idx - 1];
            ap.appendChild(iep ? saite('← ' + (iep.tests ? 'Tests' : iep.nos.replace(/^\d+\. daļa · /, '')), iep.tests ? '#t/' + nr : '#n/' + nr + '/' + iep.id) : saite('← Kursa sākums', '#'));
            const nak = soli[idx + 1];
            if (nak) {
                const b = poga(nak.tests ? 'Uz pašpārbaudes testu →' : 'Tālāk: ' + nak.nos.replace(/^\d+\. daļa · /, '') + ' →', 'btn-cta', () => {
                    const doties = () => { location.hash = nak.tests ? '#t/' + nr : '#n/' + nr + '/' + nak.id; };
                    if (izd.has(tagad.id)) return doties();
                    b.classList.add('btn-busy');
                    api('POST', '/api/ek/' + kurss + '/nodarbiba/' + nr + '/progress', { dala: tagad.id }).then(() => { delete nodKes[nr]; doties(); }).catch((e) => { b.classList.remove('btn-busy'); toast(e.message, true); });
                });
                ap.appendChild(b);
            } else if (testsOk && d.nakama) ap.appendChild(saite('Uz ' + d.nakama + '. nodarbību →', '#n/' + d.nakama, 'btn-cta'));
            else ap.appendChild(saite('Uz kursa sākumu', '#', 'btn-cta'));
            sat.appendChild(ap);
            lay.appendChild(sat);
            sakne.appendChild(lay);
            // Telefonā daļu josla ritinās horizontāli — parādām pašreizējo daļu
            const tag = ol.querySelector('[aria-current]');
            if (tag && ol.scrollWidth > ol.clientWidth) ol.scrollLeft = tag.getBoundingClientRect().left - ol.getBoundingClientRect().left - 16;
        });
    }

    // ---------- tests / eksāmens ----------
    function testaSkats(veids, nr) {
        notirit();
        const w = el('div', 'ek-tests');
        sakne.appendChild(w);
        const url = veids === 'tests' ? '/api/ek/' + kurss + '/tests/' + nr : '/api/ek/' + kurss + '/eksamens';
        return api('POST', url).then((d) => {
            const m = d.meginajums;
            let atb = {};
            try { atb = JSON.parse(sessionStorage.getItem('ek-atb-' + m.id) || '{}'); } catch (e) {}
            tests = { veids, nr, m, atb, i: 0 };
            jautajums();
        }).catch((e) => { if (veids === 'eksamens') { location.hash = '#eksamens'; toast(e.message, true); } else kluda(e); });
    }
    function jautajums() {
        const T = tests; const w = sakne.querySelector('.ek-tests'); w.textContent = '';
        const J = T.m.jautajumi, j = J[T.i];
        const k = karte();
        const g = el('div', 'ek-tests-galva');
        g.appendChild(el('span', '', T.veids === 'tests' ? T.nr + '. nodarbība · Pašpārbaudes tests' : 'Noslēguma eksāmens'));
        const sk = el('span'); sk.innerHTML = 'Jautājums <b>' + (T.i + 1) + '</b> no ' + J.length; g.appendChild(sk); k.appendChild(g);
        const pb = el('div', 'ek-progress'); const s = el('span'); s.style.cssText = 'width:' + Math.round((T.i + 1) / J.length * 100) + '%;background:var(--c-accent)'; pb.appendChild(s); k.appendChild(pb);
        const h = el('p', 'ek-jautajums', j.teksts); h.tabIndex = -1; k.appendChild(h);
        const ie = ievade(j, T.atb[j.id], (v) => { T.atb[j.id] = v; try { sessionStorage.setItem('ek-atb-' + T.m.id, JSON.stringify(T.atb)); } catch (e) {} });
        k.appendChild(ie.mezgls);
        const ap = el('div', 'ek-nod-apaksa'); ap.style.cssText = 'border:0;margin-top:var(--sp-5);padding:0';
        const iep = poga('← Iepriekšējais', 'btn-secondary', () => { T.i--; jautajums(); }); iep.disabled = T.i === 0; ap.appendChild(iep);
        if (T.i < J.length - 1) ap.appendChild(poga('Nākamais →', 'btn-cta', () => { T.i++; jautajums(); }));
        else ap.appendChild(poga(T.veids === 'tests' ? 'Iesniegt testu' : 'Iesniegt eksāmenu', 'btn-cta', iesniegt));
        k.appendChild(ap);
        const atbildeti = J.filter((x) => { const v = T.atb[x.id]; return v != null && v !== '' && !(Array.isArray(v) && !v.length); }).length;
        const inf = el('p', 'ek-bloks-meta', 'Atbildēti ' + atbildeti + ' no ' + J.length + (T.m.turpinats ? ' · turpini iesākto mēģinājumu' : '')); inf.style.marginTop = '12px'; k.appendChild(inf);
        w.appendChild(k);
        h.focus({ preventScroll: true });
    }
    function iesniegt() {
        const T = tests; const J = T.m.jautajumi;
        const neatb = J.filter((x) => { const v = T.atb[x.id]; return v == null || v === '' || (Array.isArray(v) && !v.length); }).length;
        if (neatb && !confirm('Neatbildēti jautājumi: ' + neatb + '. Iesniegt tik un tā?')) return;
        if (T.veids === 'eksamens' && !confirm('Iesniegt eksāmenu? Mēģinājums tiks ieskaitīts.')) return;
        ielade(true);
        const url = T.veids === 'tests' ? '/api/ek/' + kurss + '/tests/' + T.nr + '/iesniegt' : '/api/ek/' + kurss + '/eksamens/iesniegt';
        api('POST', url, { id: T.m.id, atbildes: T.atb }).then((r) => {
            try { sessionStorage.removeItem('ek-atb-' + T.m.id); } catch (e) {}
            delete nodKes[T.nr];
            return ieladetParskatu().then(() => (T.veids === 'tests' ? testaRezultats(r, T) : eksamenaRezultats(r)));
        }).catch((e) => toast(e.message, true)).then(() => ielade(false));
    }
    function rezultataKarte(r, virsOk, virsNe) {
        const k = karte('ek-rez ' + (r.nokartots ? 'ek-rez--labi' : 'ek-rez--slikti'));
        const ap = el('div', 'ek-aplis'); ap.style.setProperty('--p', r.rezultats); ap.appendChild(el('span', '', r.rezultats + ' %')); k.appendChild(ap);
        const t = el('div'); t.appendChild(el('h2', '', r.nokartots ? virsOk : virsNe));
        if (!r.nokartots) { const sl = el('div', 'ek-slieksnis'); const s = el('span'); s.style.cssText = 'width:' + r.rezultats + '%;background:var(--c-error)'; sl.appendChild(s); t.appendChild(sl); }
        k.appendChild(t);
        return { k, t };
    }
    function testaRezultats(r, T) {
        notirit();
        const w = el('div', 'ek-tests'); sakne.appendChild(w);
        const n = nodKes[T.nr] || null;
        const { k, t } = rezultataKarte(r, '¡Muy bien! Tests nokārtots', 'Vēl nedaudz! Vajag vismaz ' + r.slieksnis + ' %');
        const nakNr = (P.kurss.nodarbibas.find((x, i, a) => a[i - 1] && a[i - 1].nr === T.nr) || {}).nr;
        t.appendChild(el('p', '', r.pareizi + ' no ' + r.kopa + ' pareizi.' + (r.nokartots ? (nakNr ? ' Atvērta ' + nakNr + '. nodarbība.' : ' Atvērts noslēguma eksāmens.') : ' Ieteicams atkārtot:')));
        const pog = el('div', 'ek-pogas');
        if (!r.nokartots) {
            const ul = el('ul', 'ek-vajagatkartot'); const sk = {};
            r.kludas.forEach((x) => { if (x.saite) sk[x.saite] = (sk[x.saite] || 0) + 1; });
            Object.entries(sk).sort((a, b) => b[1] - a[1]).forEach(([id, c]) => { const li = el('li'); li.appendChild(document.createTextNode('→ ')); li.appendChild(saite(id === 'prakse' ? 'Praktiskais uzdevums' : 'Daļa ' + id.replace(/^d/, '') + ' (' + c + (c === 1 ? ' kļūda' : ' kļūdas') + ')', '#n/' + T.nr + '/' + id, '')); ul.appendChild(li); });
            if (ul.children.length) t.appendChild(ul);
            pog.appendChild(poga('Pildīt vēlreiz', 'btn-cta', () => testaSkats('tests', T.nr)));
            pog.appendChild(saite('Atkārtot materiālu', '#n/' + T.nr + '/d1', 'btn-secondary'));
        } else {
            pog.appendChild(saite(nakNr ? 'Uz ' + nakNr + '. nodarbību' : 'Uz eksāmenu', nakNr ? '#n/' + nakNr : '#eksamens', 'btn-cta'));
            pog.appendChild(saite('Kopsavilkums', '#n/' + T.nr + '/kopsavilkums', 'btn-secondary'));
        }
        t.appendChild(pog); w.appendChild(k);
        if (r.atbildes) {
            const pec = new Map(T.m.jautajumi.map((j) => [j.id, j]));
            const d = el('details'); d.style.marginTop = 'var(--sp-5)'; d.appendChild(el('summary', '', 'Skatīt atbildes un skaidrojumus'));
            const ul = el('ul', 'ek-tests-saraksts');
            r.atbildes.forEach((a) => { const li = el('li', a.ok ? 'ok' : 'nav'); const j = pec.get(a.id) || {}; li.appendChild(el('b', '', (j.teksts || '') + (j.jautajums ? ' ' + j.jautajums : ''))); li.appendChild(el('div', '', 'Pareizi: ' + a.pareiza)); if (a.skaidrojums) li.appendChild(el('small', '', a.skaidrojums)); ul.appendChild(li); });
            d.appendChild(ul); w.appendChild(d);
        }
    }

    function meginajumuRinda(E) {
        const d = el('div', 'ek-meginajumi');
        for (let i = 0; i < Math.min(Math.max(E.limits, E.izmantoti), 10); i++) {
            const c = el('i', i < E.izmantoti ? 'izm' : i === E.izmantoti ? 'tagad' : '', i < E.izmantoti ? '✕' : String(i + 1));
            d.appendChild(c);
        }
        const s = el('span'); s.innerHTML = E.izmantoti >= E.limits ? E.izmantoti + ' mēģinājumi izmantoti' + (E.labakais != null ? ' · labākais: <b>' + E.labakais + ' %</b>' : '') : 'Mēģinājums <b>' + (E.izmantoti + 1) + ' no ' + E.limits + '</b>' + (E.pedejais != null ? ' · iepriekšējais: ' + E.pedejais + ' %' : '');
        d.appendChild(s);
        return d;
    }
    function eksamens() {
        notirit();
        const E = P.eksamens; const w = el('div', 'ek-tests'); sakne.appendChild(w);
        const k = karte();
        k.appendChild(el('span', 'ek-birka ek-birka--silts', 'Noslēguma eksāmens'));
        const h = el('h2', '', P.kurss.nosaukums); h.style.margin = '10px 0 6px'; k.appendChild(h);
        if (E.nokartots) {
            k.appendChild(el('p', '', 'Eksāmens nokārtots ar ' + E.labakais + ' %. Apsveicam!'));
            const pg = el('div', 'ek-pogas'); pg.appendChild(saite(P.sertifikats ? 'Mans sertifikāts' : 'Saņemt sertifikātu', '#sertifikats', 'btn-cta')); pg.appendChild(saite('Ko darīt tālāk', '#talak', 'btn-secondary')); k.appendChild(pg);
            w.appendChild(k); return;
        }
        if (!E.atverts) { k.appendChild(el('p', '', 'Eksāmens atveras, kad nokārtoti visu nodarbību pašpārbaudes testi.')); k.appendChild(saite('Uz kursa sākumu', '#', 'btn-cta')); w.appendChild(k); return; }
        const p = el('p', '', 'Uzdevumi no visām nodarbībām dažādos formātos. Jautājumi atšķiras no pašpārbaudes testiem.'); p.style.cssText = 'margin:0;color:var(--c-muted)'; k.appendChild(p);
        const dati = el('div', 'ek-eks-dati');
        [[E.jautajumi, 'uzdevumi'], ['bez taimera', 'savā tempā'], [E.slieksnis + ' %', 'lai nokārtotu'], [E.pauze_h + ' h', 'starp mēģinājumiem']].forEach((x) => { const d = el('div'); d.appendChild(el('b', '', String(x[0]))); d.appendChild(el('span', '', x[1])); dati.appendChild(d); });
        k.appendChild(dati);
        k.appendChild(meginajumuRinda(E));
        if (E.izmantoti >= E.limits && !E.iesakts) {
            w.appendChild(k);
            const k2 = karte(); k2.style.marginTop = 'var(--sp-5)';
            k2.appendChild(el('h2', '', 'Kā turpināt?'));
            if (E.pieprasijums) {
                k2.appendChild(el('p', '', 'Tavs pieprasījums (' + (E.pieprasijums === 'konsultacija' ? 'konsultācija ar pasniedzēju + 3 mēģinājumi' : '3 papildu mēģinājumi') + ') ir saņemts. Nosūtīsim apmaksas informāciju; pēc apmaksas mēģinājumi parādīsies šeit.'));
                w.appendChild(k2); return;
            }
            k2.appendChild(el('p', '', 'Tavs progress un nodarbības paliek pieejami. Izvēlies vienu no iespējām, lai iegūtu vēl 3 mēģinājumus.'));
            const iz = el('div', 'ek-izvele');
            [['konsultacija', 'Konsultācija ar pasniedzēju', ['Tiešsaistē pārrunājam tavas kļūdas', '+ 3 eksāmena mēģinājumi'], 'Pieteikt konsultāciju', 'btn-cta', 'Ieteicams'],
             ['meginajumi', '3 papildu mēģinājumi', ['Bez konsultācijas', '+ 3 eksāmena mēģinājumi'], 'Apmaksāt mēģinājumus', 'btn-secondary', 'Patstāvīgi']].forEach((o) => {
                const c = karte(); c.style.boxShadow = 'none';
                c.appendChild(el('span', 'ek-birka', o[5])); c.appendChild(el('h3', '', o[1]));
                const ul = el('ul'); o[2].forEach((x) => ul.appendChild(el('li', '', x))); c.appendChild(ul);
                c.appendChild(el('p', 'ek-cena', cena(E.papildu_cena)));
                c.appendChild(poga(o[3], o[4], () => {
                    if (!confirm(o[1] + ' — ' + cena(E.papildu_cena) + '. Nosūtīt pieprasījumu? Apmaksas informāciju saņemsi e-pastā.')) return;
                    api('POST', '/api/ek/' + kurss + '/pieprasijums', { veids: o[0] }).then(() => ieladetParskatu()).then(() => { toast('Pieprasījums nosūtīts'); eksamens(); }).catch((e) => toast(e.message, true));
                }));
                iz.appendChild(c);
            });
            k2.appendChild(iz); w.appendChild(k2); return;
        }
        k.appendChild(noteikumi('Iesāktu eksāmenu var pārtraukt — atbildes saglabājas šajā pārlūkā. Mēģinājums tiek ieskaitīts, kad nospied «Iesniegt». Pēc ' + E.limits + ' neveiksmīgiem mēģinājumiem: konsultācija vai papildu mēģinājumi (' + cena(E.papildu_cena) + ').')).style.margin = 'var(--sp-5) 0';
        if (E.nakamais_no) { k.appendChild(el('p', '', 'Nākamais mēģinājums būs pieejams ' + lvDatLaiks(E.nakamais_no) + '. Izmanto laiku, lai atkārtotu nodarbības ar vājākajiem rezultātiem.')); k.appendChild(saite('Uz kursa sākumu', '#', 'btn-secondary')); }
        else k.appendChild(poga(E.iesakts ? 'Turpināt iesākto mēģinājumu' : 'Sākt ' + (E.izmantoti + 1) + '. mēģinājumu', 'btn-cta', () => testaSkats('eksamens')));
        w.appendChild(k);
    }
    function eksamenaRezultats(r) {
        notirit();
        const w = el('div', 'ek-tests'); sakne.appendChild(w);
        const { k, t } = rezultataKarte(r, '¡Enhorabuena! Eksāmens nokārtots', 'Šoreiz neizdevās');
        t.appendChild(el('p', '', r.pareizi + ' no ' + r.kopa + ' pareizi (vajag ' + r.slieksnis + ' %).'));
        const pog = el('div', 'ek-pogas');
        if (r.nokartots) pog.appendChild(saite('Saņemt sertifikātu', '#sertifikats', 'btn-cta'));
        else {
            if (r.vajas_vietas.length) { const ul = el('ul', 'ek-vajagatkartot'); r.vajas_vietas.forEach((v) => { const li = el('li'); li.appendChild(document.createTextNode('→ ')); li.appendChild(saite(v.nr + '. ' + (v.nosaukums || 'nodarbība') + ' (' + v.kludas + ')', '#n/' + v.nr, '')); ul.appendChild(li); }); t.appendChild(el('p', '', 'Vājākās vietas:')); t.appendChild(ul); }
            t.appendChild(meginajumuRinda(r.statuss));
            pog.appendChild(saite('Uz eksāmena lapu', '#eksamens', 'btn-cta'));
        }
        t.appendChild(pog); w.appendChild(k);
    }

    // ---------- sertifikāts ----------
    function sertifikats() {
        notirit();
        const w = el('div', 'ek-tests'); sakne.appendChild(w);
        const k = karte();
        if (P.sertifikats) {
            k.appendChild(el('h2', '', 'Tavs sertifikāts'));
            k.appendChild(el('p', '', P.sertifikats.vards + ' · ' + lvDatD(P.sertifikats.datums) + ' · kods ' + P.sertifikats.kods));
            const pg = el('div', 'ek-pogas'); pg.appendChild(saite('Atvērt un lejupielādēt PDF', 'sertifikats.html?kods=' + P.sertifikats.kods, 'btn-cta')); pg.appendChild(saite('Ko darīt tālāk', '#talak', 'btn-secondary')); k.appendChild(pg);
            w.appendChild(k); return;
        }
        if (!P.eksamens.nokartots) { k.appendChild(el('h2', '', 'Sertifikāts')); k.appendChild(el('p', '', 'Sertifikāts būs pieejams pēc noslēguma eksāmena nokārtošanas (≥ ' + P.eksamens.slieksnis + ' %).')); k.appendChild(saite('Uz kursa sākumu', '#', 'btn-cta')); w.appendChild(k); return; }
        const f = el('form', 'ek-sert-forma');
        f.appendChild(el('h2', '', 'Apsveicam! Pēdējais solis'));
        f.appendChild(el('p', '', 'Pārbaudi, kā tavs vārds un uzvārds jāraksta sertifikātā (ar garumzīmēm). Pēc izsniegšanas to vairs nevar mainīt.'));
        const l = el('label', 'profila-lauks'); l.appendChild(el('span', '', 'Vārds un uzvārds sertifikātam'));
        const i = el('input', 'lauks'); i.required = true; i.autocomplete = 'name'; i.value = (P.lietotajs && P.lietotajs.vards) || ''; i.maxLength = 80; l.appendChild(i); f.appendChild(l);
        const b = el('button', 'btn-cta', 'Izsniegt sertifikātu'); b.type = 'submit'; f.appendChild(b);
        f.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!confirm('Sertifikātā būs: «' + i.value.trim() + '». Apstiprināt?')) return;
            b.classList.add('btn-busy');
            api('POST', '/api/ek/' + kurss + '/sertifikats', { vards: i.value }).then((d) => { location.href = 'sertifikats.html?kods=' + d.sertifikats.kods; })
                .catch((er) => { b.classList.remove('btn-busy'); toast(er.message, true); });
        });
        k.appendChild(f); w.appendChild(k);
    }

    // ---------- ko darīt tālāk ----------
    function talak() {
        notirit();
        const R = P.resursi;
        if (!R) { const k = karte('ek-stavoklis'); k.appendChild(el('h2', '', 'Ko darīt tālāk')); k.appendChild(el('p', '', 'Šī sadaļa atveras pēc noslēguma eksāmena.')); k.appendChild(saite('Uz kursa sākumu', '#', 'btn-cta')); sakne.appendChild(k); return; }
        const w = el('div', 'ek-resursi');
        if (R.ievads) { const p = el('div', 'ek-teorija'); p.innerHTML = md(R.ievads); w.appendChild(p); }
        (R.celi || []).forEach((c) => {
            const k = karte(); k.appendChild(el('h2', '', c.nosaukums)).style.marginTop = '0';
            if (c.apraksts) { const p = el('div', 'ek-teorija'); p.innerHTML = md(c.apraksts); k.appendChild(p); }
            if (c.soli && c.soli.length) { const ol = el('ol'); c.soli.forEach((s) => ol.appendChild(el('li', '', s))); k.appendChild(ol); }
            const ul = el('ul');
            (c.resursi || []).forEach((r) => { const li = el('li'); const a = el('a', '', r.nosaukums); a.href = r.url; a.target = '_blank'; a.rel = 'noopener'; li.appendChild(a); li.appendChild(document.createTextNode(' · ' + (r.tips || '') + (r.bezmaksas ? ' · bezmaksas' : ''))); if (r.apraksts) li.appendChild(el('small', '', r.apraksts)); ul.appendChild(li); });
            k.appendChild(ul); w.appendChild(k);
        });
        sakne.appendChild(w);
    }

    // ---------- maršrutēšana ----------
    function marsruts() {
        if (!P) return;
        if (window.speechSynthesis) try { speechSynthesis.cancel(); } catch (e) {}
        if (!P.piekluve.ok) return navPiekluves();
        const h = location.hash.replace(/^#/, '');
        let m;
        ielade(true);
        let darbs;
        if ((m = h.match(/^n\/(\d+)(?:\/([a-z0-9-]+))?$/))) darbs = nodarbiba(Number(m[1]), m[2]);
        else if ((m = h.match(/^t\/(\d+)$/))) darbs = testaSkats('tests', Number(m[1]));
        else if (h === 'eksamens') darbs = ieladetParskatu().then(eksamens);
        else if (h === 'sertifikats') darbs = Promise.resolve(sertifikats());
        else if (h === 'talak') darbs = Promise.resolve(talak());
        else darbs = ieladetParskatu().then(sakums);
        Promise.resolve(darbs).catch((e) => { if (e.status === 403) { toast(e.message, true); location.hash = ''; } else kluda(e); }).then(() => ielade(false));
    }

    if (!kurss) { P = { piekluve: { ok: false, iemesls: 'nav' }, kurss: {} }; notirit(); sakne.appendChild(el('p', '', 'Kurss nav norādīts.')); return; }
    ieladetParskatu().then(() => {
        virsraksts.textContent = P.kurss.nosaukums;
        cels.textContent = P.kurss.nosaukums;
        document.title = P.kurss.nosaukums + ' — Libertas';
        marsruts();
    }).catch(kluda).then(() => ielade(false));
    window.addEventListener('hashchange', marsruts);
})();
