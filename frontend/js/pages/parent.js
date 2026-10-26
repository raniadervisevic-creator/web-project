/**
 * Logged-in area: dashboard layout, overview, children, enrollments, events.
 * (Admins can open these too — the API then returns data for everyone.)
 */
const ParentPages = {
  /** Fill the shared sidebar (runs for every dashboard-layout page). */
  layout() {
    const user = Auth.getUser() || {};
    document.getElementById('sideName').textContent = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Friend';
    document.getElementById('sideRole').textContent = user.role === 'admin' ? 'Administrator' : 'Parent account';
    document.getElementById('sideAvatar').textContent = Utils.initials(user.first_name, user.last_name);
    document.getElementById('sideLogout').addEventListener('click', () => Auth.logout());
    Weather.renderMini(document.getElementById('sideWeather'));
  },

  childAvatarColors: ['bg-sky', 'bg-sunny', 'bg-pink', 'bg-mint', 'bg-lavender-mid'],

  eventItem(ev, i) {
    const d = Utils.dateParts(ev.event_date);
    const colors = ['var(--sunny)', 'var(--sky)', 'var(--sage)', 'var(--lavender-line)'];
    return `
      <div class="d-flex gap-3 align-items-start">
        <div class="date-badge" style="background:${colors[i % colors.length]}"><small>${d.month}</small><strong>${d.day}</strong></div>
        <div><div class="fw-bold">${Utils.esc(ev.title)}</div>
          <div class="small text-ink-soft">${Utils.esc(ev.program_name)} · ${Utils.esc(ev.location || '')}</div>
          ${ev.description ? `<div class="small">${Utils.esc(ev.description)}</div>` : ''}</div>
      </div>`;
  },

  async dashboard() {
    const user = Auth.getUser() || {};
    const h = new Date().getHours();
    document.getElementById('greeting').textContent = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    document.getElementById('dashName').textContent = user.first_name || 'friend';

    const [children, enrollments, events] = await Promise.all([
      Api.get('/children'), Api.get('/enrollments'), Api.get('/events')
    ]);
    if (Router.current !== 'dashboard') return; // user navigated away while loading

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const inWeek = new Date(today); inWeek.setDate(inWeek.getDate() + 7);
    const upcoming = events.filter(ev => new Date(ev.event_date) >= today);

    document.getElementById('statProfile').textContent = user.role === 'admin' ? 'Administrator' : 'Verified parent';
    document.getElementById('statChildren').textContent = children.length;
    document.getElementById('statPending').textContent = enrollments.filter(e => e.status === 'pending').length;
    document.getElementById('statEvents').textContent = upcoming.filter(ev => new Date(ev.event_date) <= inWeek).length;

    // children cards
    const programOf = id => {
      const e = enrollments.find(x => x.child_id === id && ['active', 'approved', 'pending'].includes(x.status));
      return e ? { name: e.program_name, status: e.status } : null;
    };
    document.getElementById('dashChildren').innerHTML = children.length
      ? children.slice(0, 4).map((c, i) => {
          const p = programOf(c.id);
          return `
          <div class="col-md-6">
            <div class="child-card" style="box-shadow:5px 5px 0 ${['var(--sky)', 'var(--sunny)', 'var(--lavender-line)', 'var(--mint-mid)'][i % 4]}">
              <div class="child-avatar ${this.childAvatarColors[i % 5]}">${Utils.esc(c.first_name[0] || '?')}</div>
              <div class="flex-grow-1 min-w-0">
                <div class="font-display fs-4">${Utils.esc(c.first_name)}</div>
                <div>${Utils.esc(c.age ?? '?')} years${p ? ' · ' + Utils.esc(p.name) : ''}</div>
                ${p ? Utils.statusBadge(p.status) : '<span class="status" style="background:#EFE6D6">not enrolled</span>'}
              </div>
            </div>
          </div>`; }).join('')
      : `<div class="col-12">${Utils.empty('bi-emoji-smile', 'No children added yet.', '<a href="#/children" class="btn btn-sunny">Add your first child</a>')}</div>`;

    // enrollments table
    document.getElementById('dashEnrollments').innerHTML = enrollments.length
      ? enrollments.slice(0, 5).map(e => `
          <tr><td class="fw-bold">${Utils.esc(e.child_name)}</td><td>${Utils.esc(e.program_name)}</td>
          <td>${Utils.formatDate(e.start_date)}</td><td>${Utils.statusBadge(e.status)}</td></tr>`).join('')
      : `<tr><td colspan="4" class="text-center fw-bold py-3">No applications yet — <a href="#/enrollments?new=1">apply for a class</a>.</td></tr>`;

    // events
    document.getElementById('dashEvents').innerHTML = upcoming.length
      ? upcoming.slice(0, 3).map((ev, i) => this.eventItem(ev, i)).join('')
      : '<p class="fw-bold m-0">No upcoming events yet.</p>';
  },

  children() {
    const isAdmin = Auth.isAdmin();
    new CrudTable({
      container: document.getElementById('childrenTable'),
      endpoint: '/children',
      singular: 'child',
      emptyText: 'No children yet — click “Add child” to add your first little one.',
      nameOf: r => `${r.first_name} ${r.last_name}`,
      columns: [
        { label: 'Name', render: r => `<span class="fw-bold">${Utils.esc(r.first_name)} ${Utils.esc(r.last_name)}</span>` },
        { label: 'Age', render: r => `${Utils.esc(r.age ?? '?')} yrs` },
        { label: 'Date of birth', render: r => Utils.formatDate(r.date_of_birth) },
        ...(isAdmin ? [{ label: 'Parent', key: 'parent_name' }] : []),
        { label: 'Notes', render: r => `<span class="small">${Utils.esc(r.notes || '—')}</span>` }
      ],
      fields: [
        { name: 'first_name', label: 'First name', required: true },
        { name: 'last_name', label: 'Last name', required: true },
        { name: 'date_of_birth', label: 'Date of birth', type: 'date', required: true, max: new Date().toISOString().slice(0, 10), invalid: 'Please pick a date in the past.' },
        { name: 'notes', label: 'Notes (allergies, favourite things…)', type: 'textarea', col: 'col-12' }
      ]
    });
  },

  async enrollments(params = {}) {
    const rowsEl = document.getElementById('enrollmentRows');
    const modalEl = document.getElementById('enrollModal');
    const modal = new bootstrap.Modal(modalEl);
    const form = document.getElementById('enrollForm');
    const errBox = document.getElementById('enrollError');
    let programs = [];

    const load = async () => {
      rowsEl.innerHTML = `<tr><td colspan="6" class="text-center py-4"><div class="spinner-border text-purple" role="status"><span class="visually-hidden">Loading…</span></div></td></tr>`;
      try {
        const list = await Api.get('/enrollments');
        rowsEl.innerHTML = list.length ? list.map(e => `
          <tr>
            <td class="fw-bold">${Utils.esc(e.child_name)}</td>
            <td>${Utils.esc(e.program_name)}</td>
            <td>${Utils.formatDate(e.start_date)}</td>
            <td>${Utils.formatDate(e.created_at)}</td>
            <td>${Utils.statusBadge(e.status)}</td>
            <td class="text-end">${e.status === 'pending'
              ? `<button class="btn btn-sm btn-danger-soft" data-cancel="${e.id}" data-name="${Utils.esc(e.child_name)} – ${Utils.esc(e.program_name)}"><i class="bi bi-x-lg me-1"></i>Cancel</button>`
              : ''}</td>
          </tr>`).join('')
          : `<tr><td colspan="6" class="text-center fw-bold py-4">No applications yet. Click “New application” to apply for a class.</td></tr>`;
      } catch (err) {
        rowsEl.innerHTML = `<tr><td colspan="6" class="text-center text-danger fw-bold py-4">${Utils.esc(err.message)}</td></tr>`;
      }
    };

    rowsEl.addEventListener('click', async e => {
      const btn = e.target.closest('[data-cancel]');
      if (!btn) return;
      if (!await Utils.confirm(`Cancel the application “${btn.dataset.name}”?`, { okLabel: 'Yes, cancel it' })) return;
      try {
        await Api.del(`/enrollments/${btn.dataset.cancel}`);
        Utils.toast('Application cancelled.', 'success');
        load();
      } catch (err) { Utils.toast(err.message, 'error'); }
    });

    const openModal = async (programId) => {
      form.reset(); form.classList.remove('was-validated'); errBox.classList.add('d-none');
      const [children, progs] = await Promise.all([Api.get('/children'), Api.get('/programs')]);
      programs = progs;
      form.child_id.innerHTML = `<option value="">${children.length ? 'Choose a child…' : 'No children yet — add one first'}</option>` +
        children.map(c => `<option value="${c.id}">${Utils.esc(c.first_name)} ${Utils.esc(c.last_name)} (${Utils.esc(c.age ?? '?')} yrs)</option>`).join('');
      form.program_id.innerHTML = '<option value="">Choose a program…</option>' +
        programs.map(p => `<option value="${p.id}" ${String(p.id) === String(programId) ? 'selected' : ''}>${Utils.esc(p.name)} · ages ${p.min_age}–${p.max_age}</option>`).join('');
      const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
      form.start_date.min = tomorrow.toISOString().slice(0, 10);
      updateHint();
      modal.show();
    };

    const updateHint = () => {
      const p = programs.find(x => String(x.id) === form.program_id.value);
      document.getElementById('enProgramHint').textContent = p ? `${p.schedule || ''} · ${p.price ? p.price + ' KM / month' : ''}` : '';
    };
    form.program_id.addEventListener('change', updateHint);

    form.addEventListener('submit', async e => {
      e.preventDefault();
      errBox.classList.add('d-none');
      if (!Utils.validate(form)) return;
      const btn = document.getElementById('enrollSubmit');
      Utils.setLoading(btn, true, 'Sending…');
      try {
        await Api.post('/enrollments', Utils.formData(form));
        modal.hide();
        Utils.toast('Application sent! We will review it soon.', 'success');
        load();
      } catch (err) {
        errBox.textContent = err.message;
        errBox.classList.remove('d-none');
      } finally {
        Utils.setLoading(btn, false);
      }
    });

    document.getElementById('newEnrollmentBtn').addEventListener('click', () => openModal());
    await load();
    if (params.new) openModal(params.program);
  },

  async profile() {
    const form = document.getElementById('profileForm');
    const pwForm = document.getElementById('passwordForm');
    const pwError = document.getElementById('pwError');

    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!Utils.validate(form)) return;
      const btn = form.querySelector('[type=submit]');
      Utils.setLoading(btn, true, 'Saving…');
      try {
        const { email, ...data } = Utils.formData(form);
        const user = await Api.put('/auth/me', data);
        Auth.save(Auth.getToken(), user);   // refresh navbar + sidebar name
        document.getElementById('sideName').textContent = `${user.first_name} ${user.last_name}`;
        document.getElementById('sideAvatar').textContent = Utils.initials(user.first_name, user.last_name);
        Utils.toast('Profile saved!', 'success');
      } catch (err) { Utils.toast(err.message, 'error'); }
      finally { Utils.setLoading(btn, false); }
    });

    pwForm.addEventListener('submit', async e => {
      e.preventDefault();
      pwError.classList.add('d-none');
      if (!Utils.validate(pwForm)) return;
      const btn = pwForm.querySelector('[type=submit]');
      Utils.setLoading(btn, true, 'Updating…');
      try {
        await Api.put('/auth/password', Utils.formData(pwForm));
        Utils.toast('Password updated!', 'success');
        pwForm.reset(); pwForm.classList.remove('was-validated');
      } catch (err) {
        pwError.textContent = err.message;
        pwError.classList.remove('d-none');
      } finally { Utils.setLoading(btn, false); }
    });

    const user = await Api.get('/auth/me');
    if (Router.current !== 'profile') return;
    form.first_name.value = user.first_name || '';
    form.last_name.value = user.last_name || '';
    form.email.value = user.email || '';
    form.phone.value = user.phone || '';
  },

  async events() {
    const listEl = document.getElementById('eventList');
    const toggle = document.getElementById('onlyMine');
    const isAdmin = Auth.isAdmin();
    const [events, enrollments] = await Promise.all([Api.get('/events'), Api.get('/enrollments')]);
    if (Router.current !== 'events') return;
    const myPrograms = new Set(enrollments.filter(e => e.status !== 'rejected').map(e => e.program_id));
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const render = () => {
      const onlyMine = !isAdmin && toggle && toggle.checked;
      const shown = events.filter(ev => !onlyMine || ev.program_id === null || myPrograms.has(ev.program_id));
      listEl.innerHTML = shown.length ? shown.map((ev, i) => {
        const past = new Date(ev.event_date) < today;
        return `
          <div class="col-md-6 col-xl-4">
            <div class="soft-card ${['shadow-butter', 'shadow-sky', 'shadow-lav'][i % 3]} h-100 ${past ? 'opacity-50' : ''}">
              ${this.eventItem(ev, i)}
              <div class="small fw-bold mt-3">${Utils.formatDate(ev.event_date)}${past ? ' · finished' : ''}</div>
            </div>
          </div>`;
      }).join('') : `<div class="col-12">${Utils.empty('bi-calendar-heart', 'No events for your groups yet.')}</div>`;
    };
    if (toggle) toggle.addEventListener('change', render);
    render();
  }
};
