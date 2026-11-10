// Lietotāja konts: profils un pieteikumi
(function() {
    var L = window.LIB, el = L.el, api = L.api;
    var root = document.getElementById('konts');

    function fmt(iso) {
        if (!iso) return '—';
        var d = new Date(iso);
        return isNaN(d) ? '—' : d.toLocaleDateString('lv-LV');
    }

    function render(me) {
        root.textContent = '';
        root.removeAttribute('aria-busy'); // virsraksts "Mani kursi" ir lapas joslā (konts.html)

        if (!me || !me.user) {
            root.appendChild(el('p', 'register-intro', 'Lai redzētu savus kursus, lūdzu, ienāciet.'));
            var a = el('a', 'btn-cta btn-signin', 'Ienākt ar Google');
            a.href = L.signInUrl('/konts.html');
            var w = el('div', 'center'); w.appendChild(a); root.appendChild(w);
            return;
        }
        var u = me.user;

        // Profils
        var prof = el('div', 'account-profile');
        if (u.picture) {
            var img = el('img', 'user-avatar user-avatar-lg');
            img.src = u.picture; img.alt = ''; img.referrerPolicy = 'no-referrer';
            prof.appendChild(img);
        }
        var info = el('div');
        info.appendChild(el('strong', '', u.name || ''));
        info.appendChild(el('div', 'muted', u.email));
        prof.appendChild(info);
        root.appendChild(prof);

        var form = el('form', 'account-form');
        var lab = el('label', '', 'Tālrunis');
        lab.setAttribute('for', 'phone');
        var inp = el('input'); inp.type = 'tel'; inp.id = 'phone'; inp.value = u.phone || ''; inp.maxLength = 30;
        inp.placeholder = '+371 ...';
        var save = el('button', 'btn-cta btn-small', 'Saglabāt'); save.type = 'submit';
        form.appendChild(lab); form.appendChild(inp); form.appendChild(save);
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            api('PATCH', '/api/me', { phone: inp.value.trim() })
                .then(function() { L.toast('Tālrunis saglabāts.'); })
                .catch(function(err) { L.toast(err.message, true); });
        });
        root.appendChild(form);

        // Pieteikumi
        root.appendChild(el('h2', 'account-h2', 'Mani pieteikumi'));
        var list = me.enrollments || [];
        if (!list.length) {
            var p = el('p', 'muted tukss-stavoklis', 'Jums vēl nav pieteikumu. ');
            p.appendChild(el('em', '', '¡Vamos!')).lang = 'es';
            p.appendChild(document.createTextNode(' Pirmais solis — izvēlēties kursu. '));
            var l = el('a', '', 'Skatīt kursus'); l.href = 'kursi.html';
            p.appendChild(l);
            root.appendChild(p);
        }
        list.forEach(function(en) {
            var row = el('div', 'enroll-row');
            var left = el('div');
            left.appendChild(el('strong', '', en.course_name));
            left.appendChild(el('div', 'muted', 'Pieteicies: ' + fmt(en.created_at)));
            row.appendChild(left);
            var right = el('div', 'enroll-right');
            right.appendChild(el('span', 'badge badge-' + en.status, L.STATUSI[en.status] || en.status));
            if (en.paid) right.appendChild(el('span', 'badge badge-paid', 'Apmaksāts'));
            if (en.status === 'pieteicies') {
                var c = el('button', 'btn-link', 'Atcelt'); c.type = 'button';
                c.addEventListener('click', function() {
                    if (!confirm('Atcelt pieteikumu kursam "' + en.course_name + '"?')) return;
                    api('POST', '/api/enroll/cancel', { course_id: en.course_id }).then(function() {
                        en.status = 'atteicies';
                        render(me);
                    }).catch(function(err) { L.toast(err.message, true); });
                });
                right.appendChild(c);
            }
            row.appendChild(right);
            root.appendChild(row);
        });
    }

    if (L.me) render(L.me);
    else document.addEventListener('lib:me', function(e) { render(e.detail); });
})();
