/**
 * Admin panel — full CRUD for the 5 entities:
 * Programs, Enrollments, Events, Children, Users.
 * Each tab is one CrudTable bound to its REST endpoint.
 */
const AdminPages = {
  programOptions: async () => (await Api.get('/programs')).map(p => ({ value: p.id, label: p.name })),
  childOptions: async () => (await Api.get('/children')).map(c => ({ value: c.id, label: `${c.first_name} ${c.last_name}` })),
  parentOptions: async () => (await Api.get('/users')).filter(u => u.role === 'parent').map(u => ({ value: u.id, label: `${u.first_name} ${u.last_name} (${u.email})` })),

  tabs: {
    programs: () => ({
      endpoint: '/programs', singular: 'program', nameOf: r => r.name,
      columns: [
        { label: 'Name', render: r => `<span class="fw-bold">${Utils.esc(r.name)}</span>` },
        { label: 'Ages', render: r => `${Utils.esc(r.min_age)}–${Utils.esc(r.max_age)}` },
        { label: 'Schedule', key: 'schedule' },
        { label: 'Price', render: r => `${Utils.esc(r.price)} KM` },
        { label: 'Capacity', key: 'capacity' }
      ],
      fields: [
        { name: 'name', label: 'Name', required: true },
        { name: 'teacher', label: 'Teacher' },
        { name: 'min_age', label: 'Min age', type: 'number', required: true, min: 0, max: 7, col: 'col-md-3' },
        { name: 'max_age', label: 'Max age', type: 'number', required: true, min: 1, max: 7, col: 'col-md-3' },
        { name: 'price', label: 'Price (KM / month)', type: 'number', min: 0, col: 'col-md-3' },
        { name: 'capacity', label: 'Capacity', type: 'number', min: 1, col: 'col-md-3' },
        { name: 'schedule', label: 'Schedule', help: 'e.g. Mon–Fri, 07:30–16:00' },
        { name: 'image', label: 'Picture', type: 'select', required: true, options: [
          { value: 'class-toddler.svg', label: 'Toddler with a flower' },
          { value: 'class-preschool.svg', label: 'Explorer with a magnifying glass' },
          { value: 'class-astronauts.svg', label: 'Little astronaut' }] },
        { name: 'description', label: 'Description', type: 'textarea', col: 'col-12' }
      ]
    }),

    enrollments: () => ({
      endpoint: '/enrollments', singular: 'enrollment', nameOf: r => `${r.child_name} – ${r.program_name}`,
      columns: [
        { label: 'Child', render: r => `<span class="fw-bold">${Utils.esc(r.child_name)}</span>` },
        { label: 'Program', key: 'program_name' },
        { label: 'Start', render: r => Utils.formatDate(r.start_date) },
        { label: 'Status', render: r => Utils.statusBadge(r.status) },
        { label: 'Notes', render: r => `<span class="small">${Utils.esc(r.notes || '—')}</span>` }
      ],
      fields: [
        { name: 'child_id', label: 'Child', type: 'select', required: true, loadOptions: AdminPages.childOptions },
        { name: 'program_id', label: 'Program', type: 'select', required: true, loadOptions: AdminPages.programOptions },
        { name: 'start_date', label: 'Start date', type: 'date', required: true },
        { name: 'status', label: 'Status', type: 'select', required: true, default: 'pending', options: ['pending', 'approved', 'active', 'rejected'].map(s => ({ value: s, label: s })) },
        { name: 'notes', label: 'Notes', type: 'textarea', col: 'col-12' }
      ],
      rowActions: [
        { label: 'Approve', icon: 'bi-check-lg', className: 'btn-mint', show: r => r.status === 'pending', run: (r, t) => AdminPages.setStatus(r, 'approved', t) },
        { label: 'Reject', icon: 'bi-x-lg', className: 'btn-danger-soft', show: r => r.status === 'pending', run: (r, t) => AdminPages.setStatus(r, 'rejected', t) },
        { label: 'Activate', icon: 'bi-star', className: 'btn-sunny', show: r => r.status === 'approved', run: (r, t) => AdminPages.setStatus(r, 'active', t) }
      ]
    }),

    events: () => ({
      endpoint: '/events', singular: 'event', nameOf: r => `“${r.title}”`,
      columns: [
        { label: 'Title', render: r => `<span class="fw-bold">${Utils.esc(r.title)}</span>` },
        { label: 'Date', render: r => Utils.formatDate(r.event_date) },
        { label: 'Group', key: 'program_name' },
        { label: 'Location', key: 'location' }
      ],
      fields: [
        { name: 'title', label: 'Title', required: true },
        { name: 'event_date', label: 'Date', type: 'date', required: true },
        { name: 'location', label: 'Location' },
        { name: 'program_id', label: 'Group', type: 'select', emptyLabel: 'All groups', loadOptions: AdminPages.programOptions },
        { name: 'description', label: 'Description', type: 'textarea', col: 'col-12' }
      ]
    }),

    children: () => ({
      endpoint: '/children', singular: 'child', nameOf: r => `${r.first_name} ${r.last_name}`,
      columns: [
        { label: 'Name', render: r => `<span class="fw-bold">${Utils.esc(r.first_name)} ${Utils.esc(r.last_name)}</span>` },
        { label: 'Age', render: r => `${Utils.esc(r.age ?? '?')} yrs` },
        { label: 'Parent', key: 'parent_name' },
        { label: 'Notes', render: r => `<span class="small">${Utils.esc(r.notes || '—')}</span>` }
      ],
      fields: [
        { name: 'first_name', label: 'First name', required: true },
        { name: 'last_name', label: 'Last name', required: true },
        { name: 'date_of_birth', label: 'Date of birth', type: 'date', required: true, max: new Date().toISOString().slice(0, 10) },
        { name: 'parent_id', label: 'Parent', type: 'select', required: true, createOnly: true, loadOptions: AdminPages.parentOptions },
        { name: 'notes', label: 'Notes', type: 'textarea', col: 'col-12' }
      ]
    }),

    users: () => ({
      endpoint: '/users', singular: 'user', nameOf: r => r.email,
      canDelete: r => r.id !== (Auth.getUser() || {}).id,
      columns: [
        { label: 'Name', render: r => `<span class="fw-bold">${Utils.esc(r.first_name)} ${Utils.esc(r.last_name)}</span>` },
        { label: 'Email', key: 'email' },
        { label: 'Phone', render: r => Utils.esc(r.phone || '—') },
        { label: 'Role', render: r => `<span class="status ${r.role === 'admin' ? 'status-pending' : r.role === 'teacher' ? 'status-approved' : 'status-active'}">${Utils.esc(r.role)}</span>` }
      ],
      fields: [
        { name: 'first_name', label: 'First name', required: true },
        { name: 'last_name', label: 'Last name', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'phone', label: 'Phone', type: 'tel' },
        { name: 'role', label: 'Role', type: 'select', required: true, default: 'parent', options: [
          { value: 'parent', label: 'Parent' }, { value: 'teacher', label: 'Teacher' }, { value: 'admin', label: 'Admin' }] },
        { name: 'password', label: 'Password', type: 'password', required: true, minlength: 8, invalid: 'At least 8 characters.' }
      ]
    })
  },

  async setStatus(row, status, table) {
    try {
      await Api.put(`/enrollments/${row.id}`, { status });
      Utils.toast(`${row.child_name}: ${status}.`, 'success');
      table.load();
    } catch (err) { Utils.toast(err.message, 'error'); }
  },

  panel() {
    const pane = document.getElementById('adminPane');
    const show = name => {
      document.querySelectorAll('#adminTabs .nav-link').forEach(b => {
        const on = b.dataset.tab === name;
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', on);
      });
      new CrudTable({ container: pane, ...this.tabs[name]() });
    };
    document.getElementById('adminTabs').addEventListener('click', e => {
      const btn = e.target.closest('[data-tab]');
      if (btn) show(btn.dataset.tab);
    });
    show('programs');
  }
};
