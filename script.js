// E-pasta adrese, uz kuru tiek sūtīti pieteikumi no registracija.html
const REGISTRATION_EMAIL = '';

const COURSE_NAMES = {
    'spain-a1': 'Spāņu valodas pamati (A1)',
    'english-a1': 'Angļu valodas pamati (A1)'
};

document.addEventListener('DOMContentLoaded', function() {
    const exploreBtn = document.getElementById('exploreBtn');

    if (exploreBtn) {
        exploreBtn.addEventListener('click', function(e) {
            // Ja poga nav piesaistīta citai lapai, parāda paziņojumu
            if (this.getAttribute('href') === '#' || !this.getAttribute('href')) {
                e.preventDefault();
                alert('Paldies par interesi! Drīz šeit būs pieejams pieteikšanās logs.');
            }
        });
    }

    // Reģistrācijas forma
    const form = document.getElementById('registerForm');
    if (!form) return;

    // Iepriekš izvēlas kursu no saites, piem. registracija.html?course=spain-a1
    const course = new URLSearchParams(window.location.search).get('course');
    if (course && COURSE_NAMES[course]) {
        form.course.value = course;
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const d = form.elements;
        const courseName = COURSE_NAMES[d.course.value] || d.course.value;
        const subject = 'Pieteikums kursam: ' + courseName;
        const body = [
            'Kurss: ' + courseName,
            'Vārds, uzvārds: ' + d.firstName.value + ' ' + d.lastName.value,
            'E-pasts: ' + d.email.value,
            'Tālrunis: ' + (d.phone.value || '-'),
            '',
            'Komentāri:',
            d.message.value || '-'
        ].join('\n');

        window.location.href = 'mailto:' + REGISTRATION_EMAIL +
            '?subject=' + encodeURIComponent(subject) +
            '&body=' + encodeURIComponent(body);

        form.hidden = true;
        document.getElementById('registerDone').hidden = false;
    });
});
