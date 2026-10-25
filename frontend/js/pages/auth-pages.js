/**
 * Login and registration pages.
 */
const AuthPages = {
  /** After login go back to the page the user wanted, or to their home area. */
  redirectAfterLogin(user) {
    const back = sessionStorage.getItem('ms_return_to');
    sessionStorage.removeItem('ms_return_to');
    if (back && !/login|register/.test(back)) location.hash = back;
    else Router.go(user.role === 'admin' ? 'admin' : 'dashboard');
  },

  bindPasswordToggles(root) {
    root.querySelectorAll('[data-toggle-pw]').forEach(btn => btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.togglePw);
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      btn.querySelector('i').className = show ? 'bi bi-eye-slash' : 'bi bi-eye';
    }));
  },

  login(params = {}) {
    const form = document.getElementById('loginForm');
    const errBox = document.getElementById('loginError');
    const notice = document.getElementById('loginNotice');
    this.bindPasswordToggles(form);
    if (!CONFIG.USE_MOCK_API) document.getElementById('demoAccounts').remove();

    if (params.expired) {
      notice.querySelector('span').textContent = 'Your session fell asleep — please log in again.';
      notice.classList.remove('d-none');
    }

    form.addEventListener('submit', async e => {
      e.preventDefault();
      errBox.classList.add('d-none');
      if (!Utils.validate(form)) return;
      const btn = form.querySelector('[type=submit]');
      Utils.setLoading(btn, true, 'Logging in…');
      try {
        const user = await Auth.login(form.email.value.trim(), form.password.value);
        Utils.toast(`Welcome back, ${user.first_name}!`, 'success');
        this.redirectAfterLogin(user);
      } catch (err) {
        errBox.textContent = err.message;
        errBox.classList.remove('d-none');
        form.password.value = '';
      } finally {
        Utils.setLoading(btn, false);
      }
    });
  },

  register() {
    const form = document.getElementById('registerForm');
    const errBox = document.getElementById('registerError');
    const pw = form.password, pw2 = form.password_confirm;
    const checkMatch = () => pw2.setCustomValidity(pw2.value && pw2.value !== pw.value ? 'mismatch' : '');
    pw.addEventListener('input', checkMatch);
    pw2.addEventListener('input', checkMatch);

    form.addEventListener('submit', async e => {
      e.preventDefault();
      errBox.classList.add('d-none');
      checkMatch();
      if (!Utils.validate(form)) return;
      const { password_confirm, terms, ...data } = Utils.formData(form);
      const btn = form.querySelector('[type=submit]');
      Utils.setLoading(btn, true, 'Creating account…');
      try {
        const user = await Auth.register(data);
        Utils.toast(`Welcome to Magični Svijet, ${user.first_name}! Add your first child to get started.`, 'success');
        Router.go('children');
      } catch (err) {
        errBox.textContent = err.message;
        errBox.classList.remove('d-none');
      } finally {
        Utils.setLoading(btn, false);
      }
    });
  }
};
