/**
 * Authentication: stores the JWT, reads its payload (role, expiry),
 * keeps the navbar in sync and logs the user out when the token expires.
 */
const Auth = {
  _timer: null,

  getToken() { try { return localStorage.getItem(CONFIG.TOKEN_KEY); } catch { return null; } },

  getUser() {
    try { return JSON.parse(localStorage.getItem(CONFIG.USER_KEY)); } catch { return null; }
  },

  /** Decode the (unverified) JWT payload. The backend still verifies the signature. */
  decodeToken(token) {
    try {
      const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = part + '='.repeat((4 - part.length % 4) % 4);
      return JSON.parse(decodeURIComponent(escape(atob(padded))));
    } catch { return null; }
  },

  isTokenExpired(token = this.getToken()) {
    const p = token && this.decodeToken(token);
    return !p || !p.exp || p.exp * 1000 <= Date.now();
  },

  isLoggedIn() { return !!this.getToken() && !this.isTokenExpired(); },

  role() {
    const p = this.isLoggedIn() && this.decodeToken(this.getToken());
    return p ? p.role : null;
  },

  isAdmin() { return this.role() === 'admin'; },

  save(token, user) {
    try {
      localStorage.setItem(CONFIG.TOKEN_KEY, token);
      localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
    } catch { /* storage blocked — session lasts until refresh */ }
    this.updateNav();
    this.startExpiryWatch();
  },

  clear() {
    try {
      localStorage.removeItem(CONFIG.TOKEN_KEY);
      localStorage.removeItem(CONFIG.USER_KEY);
    } catch { /* ignore */ }
    this.updateNav();
  },

  async login(email, password) {
    const res = await Api.post('/auth/login', { email, password });
    this.save(res.token, res.user);
    return res.user;
  },

  async register(data) {
    const res = await Api.post('/auth/register', data);
    this.save(res.token, res.user);
    return res.user;
  },

  logout(message = 'You have been logged out. See you soon!') {
    this.clear();
    Utils.toast(message, 'info');
    Router.go('home');
  },

  /** Called when the token expired or the API answered 401. */
  handleExpired() {
    if (!this.getToken()) return;
    this.clear();
    sessionStorage.setItem('ms_return_to', location.hash || '#/dashboard');
    Utils.toast('Your session has expired — please log in again.', 'error');
    Router.go('login', { expired: 1 });
  },

  /** Periodically check the token so an idle tab also gets logged out. */
  startExpiryWatch() {
    clearInterval(this._timer);
    this._timer = setInterval(() => {
      if (this.getToken() && this.isTokenExpired()) this.handleExpired();
    }, CONFIG.TOKEN_CHECK_INTERVAL_MS);
  },

  /** Show/hide navbar items depending on login state and role. */
  updateNav() {
    const logged = this.isLoggedIn();
    const admin = this.isAdmin();
    document.querySelectorAll('.guest-only').forEach(el => el.classList.toggle('d-none', logged));
    document.querySelectorAll('.auth-only').forEach(el => el.classList.toggle('d-none', !logged));
    document.querySelectorAll('.admin-only').forEach(el => el.classList.toggle('d-none', !admin));
    document.querySelectorAll('.parent-only').forEach(el => el.classList.toggle('d-none', !logged || admin));
    const user = this.getUser();
    if (logged && user) {
      document.getElementById('navUserName').textContent = user.first_name;
      document.getElementById('navAvatar').textContent = Utils.initials(user.first_name, user.last_name);
    }
  }
};
