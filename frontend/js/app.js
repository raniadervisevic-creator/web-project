/**
 * App bootstrap: wires the shared navbar/footer and starts the router.
 */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('year').textContent = new Date().getFullYear();

  // Safety net: forms inside views are always handled by JavaScript (SPA),
  // never submitted natively — even if a page script is still loading.
  document.addEventListener('submit', e => { if (e.target.closest('#app')) e.preventDefault(); });

  // Log out button in the navbar dropdown
  document.getElementById('logoutBtn').addEventListener('click', () => Auth.logout());

  // Footer newsletter form
  const nl = document.getElementById('newsletterForm');
  nl.addEventListener('submit', async e => {
    e.preventDefault();
    if (!Utils.validate(nl)) return;
    const btn = nl.querySelector('button');
    Utils.setLoading(btn, true, '…');
    try {
      const res = await Api.post('/newsletter', { email: nl.newsletterEmail.value.trim() });
      Utils.toast(res.message || 'You are on the list!', 'success');
      nl.reset(); nl.classList.remove('was-validated');
    } catch (err) {
      Utils.toast(err.message, 'error');
    } finally {
      Utils.setLoading(btn, false);
    }
  });

  // If a token is already stored, log out right away when it is expired
  if (Auth.getToken() && Auth.isTokenExpired()) Auth.clear();
  if (Auth.isLoggedIn()) Auth.startExpiryWatch();
  Auth.updateNav();

  if (CONFIG.USE_MOCK_API) console.info('%c[Magični Svijet] Running with the MOCK API (js/mock-api.js). Set USE_MOCK_API=false in js/config.js to use the real backend.', 'color:#7B2CBF;font-weight:bold');

  Router.start();
});
