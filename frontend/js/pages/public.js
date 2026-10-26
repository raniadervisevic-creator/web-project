/**
 * Public pages (no login needed): home, programs, contact.
 */
const PublicPages = {
  palette: [
    { bg: 'bg-butter', line: 'var(--butter-line)' },
    { bg: 'bg-sky', line: 'var(--sky-line)' },
    { bg: 'bg-lavender-mid', line: 'var(--lavender-line)' }
  ],

  /** One class card (used on Home and Programs). */
  classCard(p, i) {
    const c = this.palette[i % this.palette.length];
    const applyHref = Auth.isLoggedIn() ? `#/enrollments?new=1&program=${p.id}` : '#/register';
    return `
      <div class="col-md-6 col-lg-4">
        <article class="class-card">
          <div class="media ${c.bg}"><img src="assets/images/${Utils.esc(p.image || 'class-preschool.svg')}" alt="" width="320" height="170"></div>
          <div class="body">
            <h3>${Utils.esc(p.name)}</h3>
            <p class="m-0 text-center">${Utils.esc(p.description)}</p>
            <div class="d-flex justify-content-between align-items-center gap-2 pt-3" style="border-top:3px dotted ${c.line}">
              <div class="d-flex align-items-center gap-2">
                <img src="assets/images/teacher-${(i % 3) + 1}.svg" class="teacher-mini" alt="">
                <div class="lh-sm"><div class="fw-bold small">${Utils.esc(p.teacher || '[TEACHER NAME]')}</div><div class="small">Teacher</div></div>
              </div>
              <span class="price-pill">${p.price ? Utils.esc(p.price) + ' KM' : '[PRICE] KM'}</span>
            </div>
            <a href="${applyHref}" class="btn btn-soft w-100">Apply for this class</a>
          </div>
          <div class="meta-row">
            <div class="bg-butter"><small>Age</small><strong>${Utils.esc(p.min_age)}–${Utils.esc(p.max_age)} yrs</strong></div>
            <div class="bg-mint"><small>Time</small><strong class="small">${Utils.esc(p.schedule || '[HOURS]')}</strong></div>
            <div class="bg-sky"><small>Capacity</small><strong>${Utils.esc(p.capacity || '?')} kids</strong></div>
          </div>
        </article>
      </div>`;
  },

  async home() {
    Weather.renderFull(document.getElementById('weatherWidget'));
    const box = document.getElementById('homeClasses');
    try {
      const programs = await Api.get('/programs');
      box.innerHTML = programs.length
        ? programs.slice(0, 3).map((p, i) => this.classCard(p, i)).join('')
        : `<div class="col-12">${Utils.empty('bi-stars', 'Classes are coming soon!')}</div>`;
    } catch (err) {
      box.innerHTML = `<div class="col-12">${Utils.empty('bi-cloud-drizzle', 'We could not load the classes right now.')}</div>`;
    }
  },

  async programs() {
    const list = document.getElementById('programList');
    let programs = [];
    try {
      programs = await Api.get('/programs');
    } catch (err) {
      list.innerHTML = `<div class="col-12">${Utils.empty('bi-cloud-drizzle', err.message)}</div>`;
      return;
    }
    const render = age => {
      const shown = age === 'all' ? programs : programs.filter(p => Number(age) >= p.min_age && Number(age) <= p.max_age);
      list.innerHTML = shown.length
        ? shown.map((p, i) => this.classCard(p, i)).join('')
        : `<div class="col-12">${Utils.empty('bi-search-heart', 'No class for that age yet — contact us and we will help!', '<a href="#/contact" class="btn btn-sunny">Contact us</a>')}</div>`;
    };
    document.getElementById('ageFilter').addEventListener('click', e => {
      const btn = e.target.closest('button[data-age]');
      if (!btn) return;
      document.querySelectorAll('#ageFilter button').forEach(b => {
        const on = b === btn;
        b.classList.toggle('btn-purple', on); b.classList.toggle('btn-white', !on);
        b.setAttribute('aria-pressed', on);
      });
      render(btn.dataset.age);
    });
    render('all');
  },

  async contact() {
    const form = document.getElementById('contactForm');
    // attach the handler first so the form never submits natively while data loads
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!Utils.validate(form)) return;
      const btn = form.querySelector('[type=submit]');
      Utils.setLoading(btn, true, 'Sending…');
      try {
        const res = await Api.post('/inquiries', Utils.formData(form));
        Utils.toast(res.message || 'Thank you! We will get back to you soon.', 'success');
        form.reset(); form.classList.remove('was-validated');
      } catch (err) {
        Utils.toast(err.message, 'error');
      } finally {
        Utils.setLoading(btn, false);
      }
    });

    try {
      const programs = await Api.get('/programs');
      if (!document.body.contains(form)) return; // user already left the page
      form.program.insertAdjacentHTML('beforeend', programs.map(p => `<option>${Utils.esc(p.name)}</option>`).join(''));
    } catch { /* the select still works with "Not sure yet" */ }
  }
};
