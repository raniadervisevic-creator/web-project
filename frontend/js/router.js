/**
 * Tiny hash router for the single-page app.
 *   #/home  →  loads views/home.html into <main id="app"> and runs its init()
 * No page reloads; views are cached after the first load.
 *
 * Route options:
 *   view     file in views/ (without .html)
 *   title    browser tab title
 *   init     function(params) run after the HTML is inserted
 *   auth     true = must be logged in
 *   role     'admin' = must have that role
 *   guest    true = only for logged-out users (login/register)
 *   layout   'dashboard' = wrap the view in views/layouts/dashboard.html
 */
const Router = {
  routes: {
    home:        { view: 'home',        title: 'Home',           init: () => PublicPages.home() },
    programs:    { view: 'programs',    title: 'Classes',        init: () => PublicPages.programs() },
    contact:     { view: 'contact',     title: 'Contact',        init: () => PublicPages.contact() },
    login:       { view: 'login',       title: 'Log in',         init: p => AuthPages.login(p), guest: true },
    register:    { view: 'register',    title: 'Join us',        init: () => AuthPages.register(), guest: true },
    dashboard:   { view: 'dashboard',   title: 'My dashboard',   init: () => ParentPages.dashboard(), auth: true, layout: 'dashboard' },
    children:    { view: 'children',    title: 'My children',    init: () => ParentPages.children(), auth: true, layout: 'dashboard' },
    enrollments: { view: 'enrollments', title: 'Enrollments',    init: p => ParentPages.enrollments(p), auth: true, layout: 'dashboard' },
    profile:     { view: 'profile',     title: 'My profile',     init: () => ParentPages.profile(), auth: true, layout: 'dashboard' },
    events:      { view: 'events',      title: 'Activities',     init: () => ParentPages.events(), auth: true, layout: 'dashboard' },
    admin:       { view: 'admin',       title: 'Admin panel',    init: () => AdminPages.panel(), auth: true, role: 'admin', layout: 'dashboard' },
    'not-found': { view: 'not-found',   title: 'Page not found' }
  },

  cache: {},
  current: null,

  /** Navigate in code: Router.go('login', { expired: 1 }) */
  go(name, params) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    const target = `#/${name}${qs}`;
    if (location.hash === target) this.resolve(); else location.hash = target;
  },

  parse() {
    const raw = location.hash.replace(/^#\/?/, '');
    const [name, query] = raw.split('?');
    return { name: name || CONFIG.DEFAULT_ROUTE, params: Object.fromEntries(new URLSearchParams(query || '')) };
  },

  async fetchHtml(file) {
    if (this.cache[file]) return this.cache[file];
    const res = await fetch(`views/${file}.html`, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`Could not load views/${file}.html`);
    return (this.cache[file] = await res.text());
  },

  async resolve() {
    let { name, params } = this.parse();
    let route = this.routes[name];
    if (!route) { name = 'not-found'; route = this.routes[name]; }

    // --- guards ---
    if (route.auth && !Auth.isLoggedIn()) {
      if (Auth.getToken()) { Auth.handleExpired(); return; }
      sessionStorage.setItem('ms_return_to', location.hash);
      Utils.toast('Please log in to see that page.', 'info');
      return this.go('login');
    }
    if (route.role && Auth.role() !== route.role) {
      Utils.toast('Sorry, that page is only for administrators.', 'error');
      return this.go('dashboard');
    }
    if (route.guest && Auth.isLoggedIn()) return this.go(Auth.isAdmin() ? 'admin' : 'dashboard');

    const app = document.getElementById('app');
    try {
      let html = await this.fetchHtml(route.view);
      if (route.layout) {
        const layout = await this.fetchHtml(`layouts/${route.layout}`);
        html = layout.replace('<!--VIEW-->', html);
      }
      app.innerHTML = html;
    } catch (err) {
      app.innerHTML = `<div class="container py-5 text-center"><h1>Oops!</h1><p>${Utils.esc(err.message)}</p>
        <p class="small">Tip: open the site through a web server (e.g. XAMPP or <code>php -S localhost:8000</code>), not by double-clicking index.html.</p></div>`;
      return;
    }

    this.current = name;
    document.title = `${route.title} · Magični Svijet`;
    app.classList.remove('view-enter'); void app.offsetWidth; app.classList.add('view-enter');
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });

    // highlight nav links (top navbar + dashboard sidebar)
    document.querySelectorAll('[data-route]').forEach(a => {
      const on = a.dataset.route === name;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    // collapse the mobile menu after navigating
    const nav = document.getElementById('mainNav');
    if (nav && nav.classList.contains('show')) bootstrap.Collapse.getOrCreateInstance(nav).hide();

    Auth.updateNav();
    if (route.layout === 'dashboard') ParentPages.layout();
    if (route.init) {
      try { await route.init(params); }
      catch (err) { console.error(err); Utils.toast(err.message || 'Something went wrong.', 'error'); }
    }
    app.focus({ preventScroll: true });
  },

  start() {
    window.addEventListener('hashchange', () => this.resolve());
    // in-page links like <a data-scroll="about"> scroll instead of changing the route
    document.addEventListener('click', e => {
      const a = e.target.closest('[data-scroll]');
      if (a) { e.preventDefault(); Utils.scrollTo(a.dataset.scroll); }
    });
    if (!location.hash) location.replace(`#/${CONFIG.DEFAULT_ROUTE}`);
    this.resolve();
  }
};
