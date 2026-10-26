/**
 * "Today's sky" widget.
 * The frontend asks OUR backend (GET /weather); the backend calls
 * OpenWeatherMap with the secret key, a timeout and error logging.
 * If anything fails we show a friendly fallback instead of an error.
 */
const Weather = {
  icons: {
    sunny: '<svg viewBox="0 0 130 120" width="120" height="110" role="img" aria-label="Sunny"><circle cx="65" cy="60" r="34" fill="#FFD166"/><g stroke="#FFD166" stroke-width="6" stroke-linecap="round"><path d="M65 8v12M65 100v12M13 60h12M105 60h12M28 23l9 9M93 88l9 9M28 97l9-9M93 32l9-9"/></g><path d="M54 58q4-5 8 0M68 58q4-5 8 0" fill="none" stroke="#2B2D42" stroke-width="3" stroke-linecap="round"/><path d="M56 68q9 7 18 0" fill="none" stroke="#2B2D42" stroke-width="3" stroke-linecap="round"/></svg>',
    partly: '<img src="assets/images/weather-partly.svg" width="120" height="110" alt="Partly cloudy">',
    rain: '<svg viewBox="0 0 130 120" width="120" height="110" role="img" aria-label="Rain"><path d="M30 78h66a20 20 0 0 0 0-40a26 26 0 0 0-48 6a17 17 0 0 0-18 34z" fill="#FFFFFF" stroke="#A9D8F5" stroke-width="3"/><g stroke="#4EA8DE" stroke-width="5" stroke-linecap="round"><path d="M45 90l-5 12M65 90l-5 12M85 90l-5 12"/></g></svg>'
  },

  async fetch() { return Api.get('/weather'); },

  /** Big widget used on the home page. */
  async renderFull(el) {
    if (!el) return;
    el.innerHTML = `<div class="weather-card text-center"><div class="spinner-border text-purple" role="status"><span class="visually-hidden">Loading weather…</span></div></div>`;
    try {
      const w = await this.fetch();
      const time = new Date(w.updated_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      el.innerHTML = `
        <div class="weather-card d-flex flex-wrap gap-4 align-items-center">
          ${this.icons[w.icon] || this.icons.partly}
          <div class="flex-grow-1">
            <div class="fw-bold" style="color:#17557F">${Utils.esc(w.city)} · right now</div>
            <div class="weather-temp">${Math.round(w.temp)}°C</div>
            <div class="fs-5 fw-bold">${Utils.esc(w.description)}</div>
          </div>
          <div class="w-100 d-flex flex-wrap gap-2">
            ${w.outdoor_ok
              ? '<span class="chip chip-good"><i class="bi bi-check-lg"></i> Great for outdoor play</span>'
              : '<span class="chip chip-warn"><i class="bi bi-house-heart"></i> Indoor fun today</span>'}
            <span class="chip">Wind ${Utils.esc(w.wind_kmh)} km/h</span>
            <span class="chip">Humidity ${Utils.esc(w.humidity)}%</span>
            <span class="chip">Updated ${time}</span>
          </div>
        </div>`;
    } catch (err) {
      console.warn('[weather]', err.message);
      el.innerHTML = this.fallback();
    }
  },

  /** Small card used in the dashboard sidebar. */
  async renderMini(el) {
    if (!el) return;
    try {
      const w = await this.fetch();
      el.innerHTML = `
        <div class="weather-mini">
          <div class="small fw-bold text-ink-soft">Today's sky</div>
          <div class="font-display fs-3">${Math.round(w.temp)}°C <span class="fs-6" style="font-family:var(--font-body)">${Utils.esc(w.description)}</span></div>
          <div class="small fw-bold ${w.outdoor_ok ? 'text-sage' : 'text-purple-dark'}">${w.outdoor_ok ? '✓ Outdoor play is on' : '☂ Indoor play today'}</div>
        </div>`;
    } catch {
      el.innerHTML = `<div class="weather-mini small fw-bold"><i class="bi bi-moon-stars-fill me-1" style="color:#F2B63C"></i>Our weather moon is taking a nap</div>`;
    }
  },

  fallback() {
    return `
      <div class="weather-fallback d-flex gap-3 align-items-center">
        <i class="bi bi-moon-stars-fill fs-2" style="color:#F2B63C"></i>
        <span><strong>Our weather moon is taking a nap.</strong><br>We couldn't check the sky right now — please peek back in a little while!</span>
      </div>`;
  }
};
