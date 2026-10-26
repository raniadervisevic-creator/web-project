/**
 * Reusable CRUD component: a table + "add/edit" modal form + delete.
 * Used by the admin panel (5 entities) and the parent "My children" page.
 *
 * new CrudTable({
 *   container: element,             // where to render
 *   endpoint: '/programs',          // REST resource
 *   singular: 'program',            // used in button labels / messages
 *   columns: [{ key, label, render(row) }],
 *   fields:  [{ name, label, type, required, options | loadOptions(), col, min, max, help, createOnly }],
 *   canCreate, canEdit, canDelete,  // booleans or (row) => boolean
 *   rowActions: [{ label, icon, className, show(row), run(row, table) }],
 *   toPayload(data, row)            // optional: reshape form data before sending
 * })
 */
class CrudTable {
  constructor(opts) {
    this.o = Object.assign({ canCreate: true, canEdit: true, canDelete: true, rowActions: [], emptyText: 'Nothing here yet.' }, opts);
    this.rows = [];
    this.editing = null;
    this.uid = 'crud' + Math.random().toString(36).slice(2, 8);
    this.renderShell();
    this.load();
  }

  allowed(flag, row) { return typeof flag === 'function' ? flag(row) : !!flag; }

  renderShell() {
    const o = this.o;
    o.container.innerHTML = `
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div class="input-group" style="max-width:320px">
          <span class="input-group-text bg-white border-0 rounded-start-pill"><i class="bi bi-search"></i></span>
          <input type="search" class="form-control border-0 rounded-end-pill" placeholder="Search…" aria-label="Search ${Utils.esc(o.singular)}s" data-search>
        </div>
        ${o.canCreate ? `<button class="btn btn-sunny" data-add><i class="bi bi-plus-lg me-1"></i>Add ${Utils.esc(o.singular)}</button>` : ''}
      </div>
      <div class="soft-card shadow-butter p-3 p-md-4">
        <div class="table-responsive"><table class="table table-soft"><thead><tr>
          ${o.columns.map(c => `<th scope="col">${Utils.esc(c.label)}</th>`).join('')}<th scope="col" class="text-end">Actions</th>
        </tr></thead><tbody data-body></tbody></table></div>
      </div>
      <div class="modal fade" id="${this.uid}" tabindex="-1" aria-labelledby="${this.uid}-title" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg"><div class="modal-content p-2">
          <form novalidate data-form>
            <div class="modal-header"><h2 class="modal-title" id="${this.uid}-title"></h2>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button></div>
            <div class="modal-body"><div class="alert alert-danger d-none rounded-4" data-error role="alert"></div><div class="row g-3" data-fields></div></div>
            <div class="modal-footer">
              <button type="button" class="btn btn-soft" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-sunny" data-save>Save</button>
            </div>
          </form>
        </div></div>
      </div>`;

    this.tbody = o.container.querySelector('[data-body]');
    this.modalEl = o.container.querySelector('.modal');
    this.modal = new bootstrap.Modal(this.modalEl);
    this.form = o.container.querySelector('[data-form]');

    o.container.querySelector('[data-search]').addEventListener('input', e => this.renderRows(e.target.value));
    const add = o.container.querySelector('[data-add]');
    if (add) add.addEventListener('click', () => this.openForm(null));
    this.form.addEventListener('submit', e => { e.preventDefault(); this.save(); });

    this.tbody.addEventListener('click', e => {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;
      const row = this.rows.find(r => String(r.id) === btn.dataset.id);
      if (!row) return;
      if (btn.dataset.act === 'edit') this.openForm(row);
      else if (btn.dataset.act === 'delete') this.remove(row);
      else {
        const action = this.o.rowActions[Number(btn.dataset.act)];
        if (action) action.run(row, this);
      }
    });
  }

  async load() {
    this.tbody.innerHTML = `<tr><td colspan="${this.o.columns.length + 1}" class="text-center py-4"><div class="spinner-border text-purple" role="status"><span class="visually-hidden">Loading…</span></div></td></tr>`;
    try {
      this.rows = await Api.get(this.o.endpoint);
      this.renderRows();
      if (this.o.onLoad) this.o.onLoad(this.rows);
    } catch (err) {
      this.tbody.innerHTML = `<tr><td colspan="${this.o.columns.length + 1}" class="text-center text-danger fw-bold py-4">${Utils.esc(err.message)}</td></tr>`;
    }
  }

  renderRows(filter = '') {
    const o = this.o;
    const q = filter.toLowerCase();
    const rows = q ? this.rows.filter(r => JSON.stringify(r).toLowerCase().includes(q)) : this.rows;
    if (!rows.length) {
      this.tbody.innerHTML = `<tr><td colspan="${o.columns.length + 1}" class="text-center py-4 fw-bold">${Utils.esc(q ? 'No matches.' : o.emptyText)}</td></tr>`;
      return;
    }
    this.tbody.innerHTML = rows.map(r => `
      <tr>
        ${o.columns.map(c => `<td>${c.render ? c.render(r) : Utils.esc(r[c.key])}</td>`).join('')}
        <td class="text-end text-nowrap">
          ${o.rowActions.map((a, i) => (!a.show || a.show(r)) ? `<button class="btn btn-sm ${a.className || 'btn-soft'} me-1" data-act="${i}" data-id="${r.id}" aria-label="${Utils.esc(a.label)}"><i class="bi ${a.icon} me-1"></i>${Utils.esc(a.label)}</button>` : '').join('')}
          ${this.allowed(o.canEdit, r) ? `<button class="btn btn-sm btn-soft me-1" data-act="edit" data-id="${r.id}" aria-label="Edit"><i class="bi bi-pencil"></i></button>` : ''}
          ${this.allowed(o.canDelete, r) ? `<button class="btn btn-sm btn-danger-soft" data-act="delete" data-id="${r.id}" aria-label="Delete"><i class="bi bi-trash"></i></button>` : ''}
        </td>
      </tr>`).join('');
  }

  async fieldHtml(f, row) {
    const id = `${this.uid}-${f.name}`;
    const val = row ? (row[f.name] ?? '') : (f.default ?? '');
    const req = f.required && !(row && f.type === 'password') ? 'required' : '';
    const attrs = `id="${id}" name="${f.name}" ${req} ${f.min !== undefined ? `min="${f.min}"` : ''} ${f.max !== undefined ? `max="${f.max}"` : ''} ${f.minlength ? `minlength="${f.minlength}"` : ''}`;
    let input;
    if (f.type === 'select') {
      const opts = f.loadOptions ? await f.loadOptions() : f.options;
      input = `<select class="form-select" ${attrs}>
        ${f.required ? '<option value="">Choose…</option>' : `<option value="">${Utils.esc(f.emptyLabel || '—')}</option>`}
        ${opts.map(op => `<option value="${Utils.esc(op.value)}" ${String(op.value) === String(val) ? 'selected' : ''}>${Utils.esc(op.label)}</option>`).join('')}
      </select>`;
    } else if (f.type === 'textarea') {
      input = `<textarea class="form-control" rows="3" ${attrs}>${Utils.esc(val)}</textarea>`;
    } else {
      const v = f.type === 'password' ? '' : val;
      input = `<input type="${f.type || 'text'}" class="form-control" value="${Utils.esc(v)}" ${attrs} ${f.type === 'password' && row ? 'placeholder="Leave empty to keep current"' : ''}>`;
    }
    return `<div class="${f.col || 'col-md-6'}">
      <label for="${id}" class="form-label">${Utils.esc(f.label)}${f.required ? ' *' : ''}</label>
      ${input}
      ${f.help ? `<div class="form-text">${Utils.esc(f.help)}</div>` : ''}
      <div class="invalid-feedback">${Utils.esc(f.invalid || 'Please fill in this field.')}</div>
    </div>`;
  }

  async openForm(row) {
    this.editing = row;
    this.form.classList.remove('was-validated');
    this.form.querySelector('[data-error]').classList.add('d-none');
    this.modalEl.querySelector('.modal-title').textContent = `${row ? 'Edit' : 'Add'} ${this.o.singular}`;
    const fields = this.o.fields.filter(f => !(row && f.createOnly) && !(!row && f.editOnly));
    this.form.querySelector('[data-fields]').innerHTML = (await Promise.all(fields.map(f => this.fieldHtml(f, row)))).join('');
    this.modal.show();
  }

  async save() {
    if (!Utils.validate(this.form)) return;
    const btn = this.form.querySelector('[data-save]');
    const errBox = this.form.querySelector('[data-error]');
    let data = Utils.formData(this.form);
    if (this.editing && data.password === '') delete data.password;
    if (this.o.toPayload) data = this.o.toPayload(data, this.editing);
    Utils.setLoading(btn, true, 'Saving…');
    try {
      if (this.editing) await Api.put(`${this.o.endpoint}/${this.editing.id}`, data);
      else await Api.post(this.o.endpoint, data);
      this.modal.hide();
      Utils.toast(`${this.o.singular[0].toUpperCase() + this.o.singular.slice(1)} ${this.editing ? 'updated' : 'added'}!`, 'success');
      await this.load();
    } catch (err) {
      errBox.textContent = err.message;
      errBox.classList.remove('d-none');
    } finally {
      Utils.setLoading(btn, false);
    }
  }

  async remove(row) {
    const name = this.o.nameOf ? this.o.nameOf(row) : `this ${this.o.singular}`;
    const yes = await Utils.confirm(`Delete ${name}? This cannot be undone.`);
    if (!yes) return;
    try {
      await Api.del(`${this.o.endpoint}/${row.id}`);
      Utils.toast(`${this.o.singular[0].toUpperCase() + this.o.singular.slice(1)} deleted.`, 'success');
      await this.load();
    } catch (err) {
      Utils.toast(err.message, 'error');
    }
  }
}
