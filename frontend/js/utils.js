/**
 * Small shared helpers used by every page.
 */
const Utils = {
  /** Escape text before putting it into innerHTML (prevents XSS). */
  esc(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  },

  /** "2026-10-28" → "28 Oct 2026" */
  formatDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d)) return Utils.esc(value);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  },

  /** Parts for the little calendar badge: { month: 'OCT', day: 28 } */
  dateParts(value) {
    const d = new Date(value);
    return { month: d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase(), day: d.getDate() };
  },

  /** Age in whole years from a yyyy-mm-dd birth date. */
  ageFromDob(dob) {
    const b = new Date(dob);
    if (isNaN(b)) return null;
    const now = new Date();
    let age = now.getFullYear() - b.getFullYear();
    const m = now.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
    return age;
  },

  initials(first, last) {
    return ((first || '?')[0] + (last ? last[0] : '')).toUpperCase();
  },

  /** Read all named fields of a form into a plain object. */
  formData(form) {
    const data = {};
    new FormData(form).forEach((v, k) => { data[k] = typeof v === 'string' ? v.trim() : v; });
    form.querySelectorAll('input[type=checkbox][name]').forEach(cb => { data[cb.name] = cb.checked; });
    return data;
  },

  /** Run Bootstrap-style validation; returns true when the form is valid. */
  validate(form) {
    form.classList.add('was-validated');
    return form.checkValidity();
  },

  /** Disable a button and show a spinner while a request runs. */
  setLoading(button, loading, label) {
    if (!button) return;
    if (loading) {
      button.dataset.label = button.innerHTML;
      button.disabled = true;
      button.innerHTML = `<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>${Utils.esc(label || 'Please wait…')}`;
    } else {
      button.disabled = false;
      if (button.dataset.label) button.innerHTML = button.dataset.label;
    }
  },

  /** Bootstrap toast notification. type: success | error | info */
  toast(message, type = 'info') {
    const icons = { success: 'bi-check-circle-fill text-sage', error: 'bi-exclamation-circle-fill text-danger', info: 'bi-stars text-purple' };
    const el = document.createElement('div');
    el.className = `toast toast-${type} align-items-center`;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    el.innerHTML = `
      <div class="d-flex">
        <div class="toast-body d-flex gap-2 align-items-center">
          <i class="bi ${icons[type] || icons.info} fs-5"></i><span>${Utils.esc(message)}</span>
        </div>
        <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>`;
    document.getElementById('toastArea').appendChild(el);
    const t = new bootstrap.Toast(el, { delay: 4000 });
    el.addEventListener('hidden.bs.toast', () => el.remove());
    t.show();
  },

  /** Promise-based confirm dialog built on a Bootstrap modal (no blocking alert()). */
  confirm(message, { title = 'Are you sure?', okLabel = 'Yes, delete', okClass = 'btn-danger-soft' } = {}) {
    return new Promise(resolve => {
      const wrap = document.createElement('div');
      wrap.innerHTML = `
        <div class="modal fade" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content p-2">
              <div class="modal-header"><h2 class="modal-title">${Utils.esc(title)}</h2>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button></div>
              <div class="modal-body">${Utils.esc(message)}</div>
              <div class="modal-footer">
                <button type="button" class="btn btn-soft" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn ${okClass}" data-ok>${Utils.esc(okLabel)}</button>
              </div>
            </div>
          </div>
        </div>`;
      const modalEl = wrap.firstElementChild;
      document.body.appendChild(modalEl);
      const modal = new bootstrap.Modal(modalEl);
      let answer = false;
      modalEl.querySelector('[data-ok]').addEventListener('click', () => { answer = true; modal.hide(); });
      modalEl.addEventListener('hidden.bs.modal', () => { modalEl.remove(); resolve(answer); });
      modal.show();
    });
  },

  /** Coloured pill for an enrollment status. */
  statusBadge(status) {
    const s = ['pending', 'approved', 'active', 'rejected'].includes(status) ? status : 'pending';
    return `<span class="status status-${s}">${Utils.esc(s)}</span>`;
  },

  /** Friendly empty state block. */
  empty(icon, text, actionHtml = '') {
    return `<div class="empty-state"><i class="bi ${icon} fs-1 text-purple"></i><p class="fw-bold my-2">${Utils.esc(text)}</p>${actionHtml}</div>`;
  },

  /** Scroll smoothly to an element id inside the current view. */
  scrollTo(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};
