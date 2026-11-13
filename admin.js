// Administrācija: lietotāji un pieteikumi (visi dati tiek rādīti ar textContent)
(function() {
    var L = window.LIB, el = L.el, api = L.api;
    var root = document.getElementById('admin');
    var ST = Object.keys(L.STATUSI);
    var state = { users: [], enr: [], courses: [], ek: { kursi: [], dalibnieki: [] }, rek: { rekini: [], rekviziti: {} }, tab: location.hash === '#rekini' ? 'rek' : 'enr', fc: '', fs: '', fp: '', q: '' };
    var G = null; // grafiks.js (grupu periodi)

    // Kursa grupas administrācijai: no pagājušā gada līdz nākamajam (arī jau sākušās)
    function kursaPeriodi(courseId) {
        if (!G || G.AR_GRAFIKU.indexOf(courseId) < 0) return [];
        var y = new Date().getFullYear(), out = [];
        for (var g = y - 1; g <= y + 1; g++) out = out.concat(G.gadaPeriodi(courseId, g));
        return out;
    }
    var DIENAS_ISS = { 'pr-tr': 'P/T', 'ot-ce': 'O/C' };
    function lvD(s) { var p = String(s || '').split('-'); return p.length === 3 ? p[2] + '.' + p[1] + '.' + p[0] + '.' : '—'; }
    function periodaNos(start, end, days) { return start ? lvD(start) + '–' + lvD(end) + ' · ' + (DIENAS_ISS[days] || '') : 'Nav izvēlēta'; }
    function periodaSelect(courseId, value, onchange) {
        var opts = [['', 'Grupa nav izvēlēta']], ir = false;
        kursaPeriodi(courseId).forEach(function(p) {
            opts.push([p.id, periodaNos(p.sakums, p.beigas, p.dienas)]);
            if (p.id === value) ir = true;
        });
        if (value && !ir) opts.push([value, lvD(value) + ' (ārpus saraksta)']);
        return select(opts, value || '', onchange);
    }

    function fmt(iso, time) {
        if (!iso) return '—';
        var d = new Date(iso);
        if (isNaN(d)) return '—';
        return time ? d.toLocaleString('lv-LV', { dateStyle: 'short', timeStyle: 'short' }) : d.toLocaleDateString('lv-LV');
    }
    function err(e) { L.toast(e.message || 'Kļūda', true); }
    function td(tr, content, cls) {
        var c = el('td', cls || '');
        if (content instanceof Node) c.appendChild(content); else c.textContent = content == null || content === '' ? '—' : content;
        tr.appendChild(c); return c;
    }
    function tableWrap(heads) {
        var wrap = el('div', 'table-wrap'), t = el('table', 'admin-table'), th = el('thead'), tr = el('tr');
        heads.forEach(function(h) { tr.appendChild(el('th', '', h)); });
        th.appendChild(tr); t.appendChild(th);
        var tb = el('tbody'); t.appendChild(tb); wrap.appendChild(t);
        return { wrap: wrap, body: tb };
    }
    function select(options, value, onchange) {
        var s = el('select');
        options.forEach(function(o) {
            var op = el('option', '', o[1]); op.value = o[0]; if (o[0] === value) op.selected = true; s.appendChild(op);
        });
        if (onchange) s.addEventListener('change', function() { onchange(s.value); });
        return s;
    }
    function courseName(id) {
        var c = state.courses.filter(function(x) { return x.id === id; })[0];
        return c ? c.name : id;
    }
    function eName(e) { return e.user_name || e.name || ''; }
    function eEmail(e) { return e.user_email || e.email || ''; }

    function load() {
        return Promise.all([
            api('GET', '/api/admin/users'), api('GET', '/api/admin/enrollments'), api('GET', '/api/courses'),
            import('/grafiks.js').catch(function() { return null; }),
            api('GET', '/api/admin/ek').catch(function() { return { kursi: [], dalibnieki: [] }; }),
            api('GET', '/api/admin/advente').catch(function() { return { dalibnieki: [], kodi: [], izloze: null }; }),
            api('GET', '/api/admin/rekini').catch(function() { return { rekini: [], rekviziti: {} }; })
        ]).then(function(r) {
            state.rek = r[6];
            G = r[3];
            state.ek = r[4];
            state.adv = r[5];
            state.users = r[0].users || r[0] || [];
            state.enr = r[1].enrollments || r[1] || [];
            state.courses = r[2].courses || r[2] || [];
            render();
        });
    }

    // Kopsavilkums: kurss x statuss
    function summary() {
        var box = el('div', 'admin-summary');
        state.courses.forEach(function(c) {
            var card = el('div', 'summary-card');
            card.appendChild(el('strong', '', c.name));
            var rows = state.enr.filter(function(e) { return e.course_id === c.id; });
            var line = el('div', 'muted', 'Kopā: ' + rows.length);
            card.appendChild(line);
            var chips = el('div', 'summary-chips');
            ST.forEach(function(s) {
                var n = rows.filter(function(e) { return e.status === s; }).length;
                if (n) chips.appendChild(el('span', 'badge badge-' + s, L.STATUSI[s] + ': ' + n));
            });
            var paid = rows.filter(function(e) { return e.paid; }).length;
            if (paid) chips.appendChild(el('span', 'badge badge-paid', 'Apmaksāts: ' + paid));
            card.appendChild(chips);
            box.appendChild(card);
        });
        return box;
    }

    function addForm() {
        var f = el('form', 'admin-add');
        f.appendChild(el('strong', '', 'Pievienot kursam'));
        var us = select([['', 'Izvēlieties lietotāju']].concat(state.users.map(function(u) {
            return [String(u.id), (u.name || '') + ' <' + u.email + '>'];
        })), '');
        var ps = periodaSelect('', '');
        var cs = select([['', 'Izvēlieties kursu']].concat(state.courses.map(function(c) { return [c.id, c.name]; })), '', function(v) {
            var jauns = periodaSelect(v, '');
            f.replaceChild(jauns, ps); ps = jauns;
        });
        var b = el('button', 'btn-cta btn-small', 'Pievienot'); b.type = 'submit';
        f.appendChild(us); f.appendChild(cs); f.appendChild(ps); f.appendChild(b);
        f.addEventListener('submit', function(e) {
            e.preventDefault();
            if (!us.value || !cs.value) return L.toast('Izvēlieties lietotāju un kursu.', true);
            api('POST', '/api/admin/enrollments', { user_id: Number(us.value), course_id: cs.value, period: ps.value || null })
                .then(function() { L.toast('Pievienots.'); return load(); }).catch(err);
        });
        return f;
    }

    function usersTab() {
        var t = tableWrap(['', 'Vārds', 'E-pasts', 'Tālrunis', 'Reģistrējies', 'Pēdējā ienākšana', 'Pēdējais apmeklējums', 'Ienākšanas', 'Kursi']);
        var q = state.q.toLowerCase();
        state.users.filter(function(u) {
            return !q || ((u.name || '') + ' ' + u.email + ' ' + (u.phone || '')).toLowerCase().indexOf(q) >= 0;
        }).forEach(function(u) {
            var tr = el('tr');
            var av;
            if (u.picture) { av = el('img', 'user-avatar'); av.src = u.picture; av.alt = ''; av.referrerPolicy = 'no-referrer'; }
            else av = el('span', 'user-avatar user-avatar-ph', (u.name || u.email || '?').charAt(0).toUpperCase());
            td(tr, av);
            td(tr, u.name); td(tr, u.email); td(tr, u.phone);
            td(tr, fmt(u.created_at)); td(tr, fmt(u.last_login_at, true)); td(tr, fmt(u.last_seen_at, true));
            td(tr, String(u.login_count || 0));
            var cell = el('div', 'summary-chips');
            (u.enrollments || []).forEach(function(e) {
                cell.appendChild(el('span', 'badge badge-' + e.status, (e.course_name || courseName(e.course_id)) + (e.period_start ? ' (' + lvD(e.period_start) + ')' : '') + ' · ' +(L.STATUSI[e.status] || e.status)));
            });
            td(tr, cell.childNodes.length ? cell : '—');
            t.body.appendChild(tr);
        });
        return t.wrap;
    }

    function enrTab() {
        var t = tableWrap(['Lietotājs', 'Kurss', 'Atlaide', 'Grupa', 'Statuss', 'Rēķins', 'Apmaksāts', 'Apmaksas datums', 'Piezīmes', 'Iesniegts', '']);
        var q = state.q.toLowerCase();
        state.enr.filter(function(e) {
            return (!state.fc || e.course_id === state.fc) && (!state.fs || e.status === state.fs) &&
                (!state.fp || (state.fp === '-' ? !e.period_start : e.period_start === state.fp)) &&
                (!q || (eName(e) + ' ' + eEmail(e)).toLowerCase().indexOf(q) >= 0);
        }).forEach(function(e) {
            var tr = el('tr');
            var who = el('div'); who.appendChild(el('strong', '', eName(e))); who.appendChild(el('div', 'muted', eEmail(e)));
            td(tr, who);
            td(tr, e.course_name || courseName(e.course_id));
            td(tr, e.atlaides_kods ? '−' + e.atlaide_proc + ' % · ' + e.atlaides_kods : '—');
            td(tr, periodaSelect(e.course_id, e.period_start, function(v) {
                api('PATCH', '/api/admin/enrollments/' + e.id, { period: v || null }).then(function(r) {
                    var n = (r && r.enrollment) || {};
                    e.period_start = n.period_start || null; e.period_end = n.period_end || null; e.period_days = n.period_days || null;
                    L.toast('Grupa saglabāta.'); render();
                }).catch(function(x) { err(x); render(); });
            }));
            td(tr, select(ST.map(function(s) { return [s, L.STATUSI[s]]; }), e.status, function(v) {
                api('PATCH', '/api/admin/enrollments/' + e.id, { status: v }).then(function() { e.status = v; render(); }).catch(function(x) { err(x); render(); });
            }));
            td(tr, rekinaSuna(e));
            var cb = el('input'); cb.type = 'checkbox'; cb.checked = !!e.paid;
            cb.addEventListener('change', function() {
                api('PATCH', '/api/admin/enrollments/' + e.id, { paid: cb.checked }).then(function(r) {
                    e.paid = cb.checked ? 1 : 0;
                    e.paid_at = (r && r.paid_at !== undefined) ? r.paid_at : (cb.checked ? new Date().toISOString() : null);
                    render();
                }).catch(function(x) { err(x); cb.checked = !cb.checked; });
            });
            td(tr, cb, 'center');
            td(tr, fmt(e.paid_at));
            var note = el('input'); note.type = 'text'; note.value = e.notes || ''; note.maxLength = 500;
            note.addEventListener('blur', function() {
                if (note.value === (e.notes || '')) return;
                api('PATCH', '/api/admin/enrollments/' + e.id, { notes: note.value })
                    .then(function() { e.notes = note.value; L.toast('Saglabāts.'); }).catch(err);
            });
            td(tr, note);
            td(tr, fmt(e.created_at));
            var del = el('button', 'btn-link btn-danger', 'Dzēst'); del.type = 'button';
            del.addEventListener('click', function() {
                if (!confirm('Dzēst pieteikumu: ' + eName(e) + ' — ' + (e.course_name || courseName(e.course_id)) + '?')) return;
                api('DELETE', '/api/admin/enrollments/' + e.id).then(function() {
                    state.enr = state.enr.filter(function(x) { return x.id !== e.id; }); render();
                }).catch(err);
            });
            td(tr, del);
            t.body.appendChild(tr);
        });
        return t.wrap;
    }

    // ---------- RĒĶINI (redaktors: rekins.html) ----------
    var REK_ST = { melnraksts: ['Melnraksts', ''], nosutits: ['Nosūtīts', 'badge-uznemts'], daleji: ['Daļēji apmaksāts', 'badge-pieteicies'], apmaksats: ['Apmaksāts', 'badge-paid'] };
    function eurS(n) { return (Number(n) || 0).toFixed(2).replace('.', ',') + ' EUR'; }
    function rekBadge(r) {
        var s = REK_ST[r.statuss] || REK_ST.melnraksts;
        var w = el('span', 'summary-chips');
        w.appendChild(el('span', 'badge ' + s[1], s[0] + (r.statuss === 'daleji' ? ' ' + r.apmaksatas + '/' + r.rindu : '')));
        if (r.kavets) w.appendChild(el('span', 'badge badge-atteicies', 'Kavēts'));
        return w;
    }
    // Pieteikumu tabulas šūna: esošie rēķini (saite + statuss) un saite jaunam rēķinam
    function rekinaSuna(e) {
        var box = el('div', 'rek-suna');
        state.rek.rekini.filter(function(r) { return r.enrollment_id === e.id; }).forEach(function(r) {
            var rinda = el('div');
            var a = el('a', '', 'Nr. ' + r.nr); a.href = 'rekins.html?id=' + r.id; rinda.appendChild(a);
            rinda.appendChild(document.createTextNode(' '));
            rinda.appendChild(rekBadge(r));
            box.appendChild(rinda);
        });
        var jauns = el('a', 'btn-link', box.childNodes.length ? '+ Vēl rēķins' : 'Izrakstīt rēķinu');
        jauns.href = 'rekins.html?pieteikums=' + e.id;
        box.appendChild(jauns);
        return box;
    }
    function rekTab() {
        var R = state.rek, wrap = el('div', 'ek-admin');
        var aug = el('div', 'ek-pogas');
        var jn = el('a', 'btn-cta btn-small', 'Jauns rēķins'); jn.href = 'rekins.html?jauns'; aug.appendChild(jn);
        aug.appendChild(el('span', 'muted', 'Nākamais Nr. ' + (R.nakamais_nr || '—') + '. Rēķinu pieteikumam izraksti cilnē «Pieteikumi».' + (R.epasts ? '' : ' E-pasta sūtīšana nav iestatīta.')));
        wrap.appendChild(aug);

        // Rekvizīti glabājas datubāzē (repozitorijs ir publisks)
        var rk = R.rekviziti || {};
        var det = el('details', 'ek-karte');
        if (!rk.konts) det.open = true;
        det.appendChild(el('summary', '', 'Rekvizīti rēķinam' + (rk.konts ? '' : ' — jāaizpilda!'))).style.cssText = 'font-weight:700;cursor:pointer';
        var f = el('form', 'ek-forma'), lauki = {};
        [['vards', 'Vārds, uzvārds (saņēmējs)'], ['talrunis', 'Tālrunis'], ['epasts', 'E-pasts (klientu atbildes nonāk šeit)'], ['adrese', 'Adrese'],
         ['banka', 'Banka'], ['konts', 'Konta Nr. (IBAN)'], ['piezime', 'Piezīme rēķina apakšā'], ['pirmais_nr', 'Mazākais nākamā rēķina Nr.']].forEach(function(x) {
            var l = el('label', '', x[1]); var i = el('input', 'lauks'); i.type = x[0] === 'pirmais_nr' ? 'number' : 'text';
            i.value = rk[x[0]] == null ? '' : rk[x[0]]; lauki[x[0]] = i; l.appendChild(i); f.appendChild(l);
        });
        var sv = el('button', 'btn-cta', 'Saglabāt rekvizītus'); sv.type = 'submit'; f.appendChild(sv);
        f.addEventListener('submit', function(ev) {
            ev.preventDefault();
            var b = {}; Object.keys(lauki).forEach(function(k) { b[k] = lauki[k].value; });
            api('PUT', '/api/admin/rekviziti', b).then(function() { L.toast('Rekvizīti saglabāti.'); return load(); }).catch(err);
        });
        det.appendChild(f);
        wrap.appendChild(det);

        if (!R.rekini.length) { wrap.appendChild(el('p', 'register-intro', 'Rēķinu vēl nav.')); return wrap; }
        var t = tableWrap(['Nr.', 'Datums', 'Maksātājs', 'Kurss', 'Summa', 'Apmaksāts', 'Statuss', 'Nākamais termiņš', 'Nosūtīts', '']);
        var q = state.q.toLowerCase();
        R.rekini.filter(function(r) {
            return !q || ((r.m_vards || '') + ' ' + (r.m_epasts || '') + ' ' + r.nr).toLowerCase().indexOf(q) >= 0;
        }).forEach(function(r) {
            var tr = el('tr');
            var a = el('a', '', r.nr); a.href = 'rekins.html?id=' + r.id; var s = el('strong'); s.appendChild(a); td(tr, s);
            td(tr, lvD(r.datums));
            var who = el('div'); who.appendChild(el('strong', '', r.m_vards || '—')); who.appendChild(el('div', 'muted', r.m_epasts || '')); td(tr, who);
            td(tr, r.kurss);
            td(tr, eurS(r.summa));
            td(tr, eurS(r.apmaksats));
            td(tr, rekBadge(r));
            var nak = (r.rindas || []).filter(function(x) { return !x.p && x.d; }).map(function(x) { return x.d; }).sort()[0];
            td(tr, nak ? lvD(nak) : '—');
            td(tr, r.nosutits_at ? fmt(r.nosutits_at, true) : 'Nav');
            var o = el('a', 'btn-link', 'Atvērt'); o.href = 'rekins.html?id=' + r.id; td(tr, o);
            t.body.appendChild(tr);
        });
        wrap.appendChild(t.wrap);
        return wrap;
    }

    // ---------- E-KURSI: iestatījumi + dalībnieki ----------
    function ekDienas(iso) { return iso ? Math.ceil((Date.parse(iso) - Date.now()) / 86400000) : null; }
    function ekTab() {
        var wrap = el('div', 'ek-admin');
        if (!state.ek.kursi.length) { wrap.appendChild(el('p', 'register-intro', 'E-kursu vēl nav. Saturu augšupielādē ar node riki/ek-augsupladet.mjs <kurss> --remote.')); return wrap; }
        state.ek.kursi.forEach(function(c) {
            var bloks = el('section', 'ek-iest'); bloks.style.marginBottom = 'var(--sp-7)';
            var f = el('form', 'ek-karte ek-forma');
            f.appendChild(el('h3', '', c.name)).style.cssText = 'margin:0;font-size:1.1rem';
            f.appendChild(el('p', 'muted', (c.nodarbibas || 0) + ' nodarbības augšupielādētas' + (c.versija ? ' · ' + fmt(c.versija, true) : ''))).style.margin = '0';
            var lauki = {};
            [['price_eur', 'Cena', 'EUR', 0.01], ['ek_dienas', 'Piekļuves ilgums', 'dienas', 1], ['ek_meginajumi', 'Eksāmena mēģinājumi', 'reizes', 1],
             ['ek_pauze_h', 'Pauze starp mēģinājumiem', 'h', 1], ['ek_papildu_cena', 'Konsultācijas / papildu mēģinājumu cena', 'EUR', 0.01]].forEach(function(x) {
                var l = el('label', '', x[1]); var s = el('span', 'ar-vien');
                var i = el('input', 'lauks'); i.type = 'number'; i.step = String(x[3]); i.min = '0'; i.value = c[x[0]] == null ? '' : c[x[0]];
                lauki[x[0]] = i; s.appendChild(i); s.appendChild(document.createTextNode(' ' + x[2])); l.appendChild(s); f.appendChild(l);
            });
            var al = el('label'); al.style.cssText = 'display:flex;gap:10px;align-items:center;font-weight:400';
            var ac = el('input'); ac.type = 'checkbox'; ac.checked = !!c.active; ac.style.cssText = 'width:20px;height:20px';
            al.appendChild(ac); al.appendChild(document.createTextNode('Kurss redzams lapā «Kursi» un pērkams')); f.appendChild(al);
            f.appendChild(el('small', 'muted', 'Piekļuves ilgums attiecas uz jaunām apmaksām; esošajiem dalībniekiem termiņu maini tabulā.'));
            var sv = el('button', 'btn-cta', 'Saglabāt'); sv.type = 'submit'; f.appendChild(sv);
            var sa = el('div', 'ek-pogas');
            var pv = el('a', 'btn-link', 'Priekšskatīt kursu'); pv.href = 'macibas.html?k=' + c.id; pv.target = '_blank'; sa.appendChild(pv);
            var ap = el('a', 'btn-link', 'Apraksta lapa'); ap.href = 'ek-kurss.html?k=' + c.id; ap.target = '_blank'; sa.appendChild(ap);
            f.appendChild(sa);
            f.addEventListener('submit', function(e) {
                e.preventDefault();
                var b = { active: ac.checked };
                Object.keys(lauki).forEach(function(k) { if (lauki[k].value !== '') b[k] = Number(lauki[k].value); });
                api('PATCH', '/api/admin/ek/kursi/' + c.id, b).then(function() { L.toast('Saglabāts.'); return load(); }).catch(err);
            });
            bloks.appendChild(f);

            var k2 = el('div', 'ek-karte');
            var dal = state.ek.dalibnieki.filter(function(d) { return d.course_id === c.id; });
            k2.appendChild(el('h3', '', 'Dalībnieki (' + dal.length + ')')).style.cssText = 'margin:0 0 10px;font-size:1.1rem';
            var t = tableWrap(['Dalībnieks', 'Apmaksāts', 'Piekļuve līdz', 'Progress', 'Eksāmens', 'Sertifikāts']);
            dal.forEach(function(d) {
                var tr = el('tr');
                var who = el('div'); who.appendChild(el('strong', '', d.name || '')); who.appendChild(el('div', 'muted', d.email)); td(tr, who);
                var cb = el('input'); cb.type = 'checkbox'; cb.checked = !!d.paid;
                cb.addEventListener('change', function() {
                    if (!confirm(cb.checked ? 'Atzīmēt apmaksu? Piekļuve sāksies šodien (' + (c.ek_dienas || 90) + ' dienas).' : 'Noņemt apmaksas atzīmi?')) { cb.checked = !cb.checked; return; }
                    api('PATCH', '/api/admin/enrollments/' + d.id, { paid: cb.checked }).then(function() { L.toast('Saglabāts.'); return load(); }).catch(function(x) { err(x); cb.checked = !cb.checked; });
                });
                td(tr, cb, 'center');
                var lc = el('div');
                if (d.ek_lidz) {
                    var di = el('input'); di.type = 'date'; di.value = d.ek_lidz.slice(0, 10); di.setAttribute('aria-label', 'Piekļuve līdz');
                    di.addEventListener('change', function() { api('PATCH', '/api/admin/ek/dalibnieki/' + d.id, { ek_lidz: di.value }).then(function() { L.toast('Termiņš saglabāts.'); return load(); }).catch(err); });
                    lc.appendChild(di);
                    var dn = ekDienas(d.ek_lidz);
                    if (dn < 0) lc.appendChild(el('span', 'ek-statuss ek-statuss--err', 'Beidzies'));
                    else if (dn <= 7) lc.appendChild(el('span', 'ek-statuss ek-statuss--warn', 'Beidzas pēc ' + dn + ' d.'));
                } else lc.appendChild(el('span', 'ek-statuss ek-statuss--warn', 'Gaida apmaksu'));
                td(tr, lc);
                var pr = el('div'); var pb = el('span', 'ek-progress'); var ps = el('span'); ps.style.width = (c.nodarbibas ? Math.round(d.nokartotas / c.nodarbibas * 100) : 0) + '%'; pb.appendChild(ps); pr.appendChild(pb); pr.appendChild(document.createTextNode(d.nokartotas + '/' + (c.nodarbibas || 0))); td(tr, pr);
                var limits = d.ek_eks_limits != null ? d.ek_eks_limits : (c.ek_meginajumi || 3);
                var ek = el('div');
                ek.appendChild(el('span', d.eks_izmantoti >= limits && !d.sertifikats && (d.eks_labakais || 0) < 80 ? 'ek-statuss ek-statuss--err' : '', d.eks_izmantoti + '/' + limits + (d.eks_labakais != null ? ' · ' + d.eks_labakais + ' %' : '')));
                if (d.ek_pieprasijums) ek.appendChild(el('div', 'ek-statuss ek-statuss--warn', 'Pieprasa: ' + (d.ek_pieprasijums === 'konsultacija' ? 'konsultāciju' : 'mēģinājumus') + ' · ' + fmt(d.ek_pieprasijums_at)));
                if (d.eks_izmantoti >= limits || d.ek_pieprasijums) {
                    var plus = el('button', 'btn-link', '+' + (c.ek_meginajumi || 3) + ' mēģinājumi (apmaksāts)'); plus.type = 'button';
                    plus.addEventListener('click', function() {
                        if (!confirm('Pievienot ' + (c.ek_meginajumi || 3) + ' eksāmena mēģinājumus (' + (d.name || d.email) + ')?')) return;
                        api('PATCH', '/api/admin/ek/dalibnieki/' + d.id, { papildu_meginajumi: true }).then(function() { L.toast('Pievienots.'); return load(); }).catch(err);
                    });
                    ek.appendChild(plus);
                }
                td(tr, ek);
                if (d.sertifikats) { var sa2 = el('a', '', d.sertifikats); sa2.href = 'sertifikats.html?kods=' + d.sertifikats; sa2.target = '_blank'; td(tr, sa2); } else td(tr, '—');
                t.body.appendChild(tr);
            });
            k2.appendChild(t.wrap);
            bloks.appendChild(k2);
            wrap.appendChild(bloks);
        });
        return wrap;
    }

    // ---------- ADVENTE: dalībnieki, kodu izmantošana, izloze ----------
    function advTab() {
        var A = state.adv || { dalibnieki: [], kodi: [] };
        var wrap = el('div', 'ek-admin');
        var cemp = A.dalibnieki.filter(function(d) { return d.laika === 24; });
        var k1 = el('div', 'ek-karte');
        k1.appendChild(el('h3', '', 'Izloze (' + cemp.length + ' atvēruši visas 24 savā dienā)')).style.cssText = 'margin:0 0 10px;font-size:1.1rem';
        if (A.izloze) {
            k1.appendChild(el('p', '', 'Uzvarētājs: ' + (A.izloze.name || '') + ' <' + A.izloze.email + '> · izlozēts ' + fmt(A.izloze.at) + ' no ' + A.izloze.dalibnieki + ' dalībniekiem.'));
            var at = el('button', 'btn-link btn-danger', 'Atcelt izlozi (testam)'); at.type = 'button';
            at.addEventListener('click', function() {
                if (!confirm('Dzēst izlozes rezultātu?')) return;
                api('DELETE', '/api/admin/advente/izloze').then(function(d) { state.adv = d; render(); }).catch(err);
            });
            k1.appendChild(at);
        } else {
            var iz = el('button', 'btn-cta', 'Veikt izlozi'); iz.type = 'button';
            iz.addEventListener('click', function() {
                if (!confirm('Izlozēt galveno balvu starp ' + cemp.length + ' dalībniekiem? Rezultātu saglabās.')) return;
                api('POST', '/api/admin/advente/izloze' + location.search.replace(/^\?advente=/, '?diena=')).then(function(d) { state.adv = d; render(); }).catch(err);
            });
            k1.appendChild(iz);
            k1.appendChild(el('p', 'muted', 'Pieejama pēc 24. decembra. Piedalās tikai tie, kas katras durvis atvēra tieši savā dienā (administratori netiek skaitīti). Uzvarētāju izvēlas serveris nejauši.'));
        }
        wrap.appendChild(k1);
        var k2 = el('div', 'ek-karte');
        k2.appendChild(el('h3', '', 'Izmantotie kodi pieteikumos')).style.cssText = 'margin:0 0 10px;font-size:1.1rem';
        k2.appendChild(el('p', '', A.kodi.length ? A.kodi.map(function(k) { return k.kods + ': ' + k.skaits; }).join(' · ') : 'Vēl nav.'));
        wrap.appendChild(k2);
        var t = tableWrap(['Dalībnieks', 'Atvērtas durvis', 'Savā dienā', 'Pēdējoreiz']);
        var q = state.q.toLowerCase();
        A.dalibnieki.filter(function(d) { return !q || ((d.name || '') + ' ' + d.email).toLowerCase().indexOf(q) >= 0; }).forEach(function(d) {
            var tr = el('tr');
            var who = el('div'); who.appendChild(el('strong', '', d.name || '')); who.appendChild(el('div', 'muted', d.email)); td(tr, who);
            td(tr, d.atvertas + '/24');
            td(tr, d.laika + '/24' + (d.laika === 24 ? ' ★' : ''));
            td(tr, fmt(d.pedeja));
            t.body.appendChild(tr);
        });
        wrap.appendChild(t.wrap);
        return wrap;
    }

    function render() {
        root.textContent = '';
        root.appendChild(summary());
        root.appendChild(addForm());

        var tabs = el('div', 'admin-tabs');
        [['enr', 'Pieteikumi (' + state.enr.length + ')'], ['users', 'Lietotāji (' + state.users.length + ')'], ['ek', 'E-kursi (' + state.ek.kursi.length + ')'], ['adv', 'Advente (' + ((state.adv && state.adv.dalibnieki) || []).length + ')'], ['rek', 'Rēķini (' + state.rek.rekini.length + ')']].forEach(function(x) {
            var b = el('button', 'admin-tab' + (state.tab === x[0] ? ' active' : ''), x[1]); b.type = 'button';
            b.addEventListener('click', function() { state.tab = x[0]; history.replaceState(null, '', x[0] === 'rek' ? '#rekini' : location.pathname + location.search); render(); });
            tabs.appendChild(b);
        });
        root.appendChild(tabs);

        var bar = el('div', 'admin-filters');
        var q = el('input'); q.type = 'search'; q.placeholder = 'Meklēt pēc vārda vai e-pasta'; q.value = state.q;
        q.addEventListener('input', function() {
            state.q = q.value;
            var pos = q.selectionStart; render();
            var nq = root.querySelector('input[type=search]'); nq.focus(); nq.setSelectionRange(pos, pos);
        });
        bar.appendChild(q);
        if (state.tab === 'enr') {
            bar.appendChild(select([['', 'Visi kursi']].concat(state.courses.map(function(c) { return [c.id, c.name]; })), state.fc, function(v) { state.fc = v; render(); }));
            bar.appendChild(select([['', 'Visi statusi']].concat(ST.map(function(s) { return [s, L.STATUSI[s]]; })), state.fs, function(v) { state.fs = v; render(); }));
            // Grupu filtrs: periodi, kuriem ir pieteikumi (izvēlētajam kursam vai visiem)
            var redzami = {};
            state.enr.forEach(function(e) {
                if ((!state.fc || e.course_id === state.fc) && e.period_start) redzami[e.period_start] = periodaNos(e.period_start, e.period_end, e.period_days);
            });
            var popts = [['', 'Visas grupas'], ['-', 'Bez grupas']].concat(Object.keys(redzami).sort().map(function(k) { return [k, redzami[k]]; }));
            bar.appendChild(select(popts, state.fp, function(v) { state.fp = v; render(); }));
        }
        if (state.tab === 'ek') { root.appendChild(ekTab()); return; }
        root.appendChild(bar);
        root.appendChild(state.tab === 'enr' ? enrTab() : state.tab === 'adv' ? advTab() : state.tab === 'rek' ? rekTab() : usersTab());
    }

    function start(me) {
        if (!me || !me.user) {
            root.textContent = '';
            root.appendChild(el('p', 'register-intro', 'Lai piekļūtu administrācijai, lūdzu, ienāciet.'));
            var a = el('a', 'btn-cta btn-signin', 'Ienākt ar Google'); a.href = L.signInUrl('/admin.html');
            var w = el('div', 'center'); w.appendChild(a); root.appendChild(w);
            return;
        }
        if (!me.user.is_admin) { root.textContent = ''; root.appendChild(el('p', 'register-intro', 'Nav piekļuves')); return; }
        load().catch(function(e) {
            root.textContent = '';
            root.appendChild(el('p', 'register-intro', e.status === 403 ? 'Nav piekļuves' : (e.message || 'Kļūda')));
        });
    }

    if (L.me) start(L.me);
    else document.addEventListener('lib:me', function(e) { start(e.detail); });
})();
