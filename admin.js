// Administrācija: lietotāji un pieteikumi (visi dati tiek rādīti ar textContent)
(function() {
    var L = window.LIB, el = L.el, api = L.api;
    var root = document.getElementById('admin');
    var ST = Object.keys(L.STATUSI);
    var state = { users: [], enr: [], courses: [], tab: 'enr', fc: '', fs: '', fp: '', q: '' };
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
            import('/grafiks.js').catch(function() { return null; })
        ]).then(function(r) {
            G = r[3];
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
        var t = tableWrap(['Lietotājs', 'Kurss', 'Grupa', 'Statuss', 'Apmaksāts', 'Apmaksas datums', 'Piezīmes', 'Iesniegts', '']);
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
            var paidDate;
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

    function render() {
        root.textContent = '';
        root.appendChild(summary());
        root.appendChild(addForm());

        var tabs = el('div', 'admin-tabs');
        [['enr', 'Pieteikumi (' + state.enr.length + ')'], ['users', 'Lietotāji (' + state.users.length + ')']].forEach(function(x) {
            var b = el('button', 'admin-tab' + (state.tab === x[0] ? ' active' : ''), x[1]); b.type = 'button';
            b.addEventListener('click', function() { state.tab = x[0]; render(); });
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
        root.appendChild(bar);
        root.appendChild(state.tab === 'enr' ? enrTab() : usersTab());
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
