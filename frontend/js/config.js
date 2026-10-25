/**
 * Frontend configuration.
 *
 * USE_MOCK_API = true  → the app runs fully in the browser with fake data
 *                        (saved in localStorage) so you can build/test the
 *                        frontend before the FlightPHP backend exists.
 * USE_MOCK_API = false → every request goes to API_BASE_URL (your backend).
 *
 * No secrets belong in this file: it is downloaded by every visitor.
 * The OpenWeatherMap key lives ONLY in backend/config/config.php.
 */
const CONFIG = Object.freeze({
  API_BASE_URL: 'http://localhost/kindergarten-app/backend',
  USE_MOCK_API: true,

  REQUEST_TIMEOUT_MS: 10000,      // abort slow requests after 10 s
  TOKEN_KEY: 'ms_token',          // localStorage key for the JWT
  USER_KEY: 'ms_user',            // localStorage key for the cached user
  TOKEN_CHECK_INTERVAL_MS: 30000, // how often we check if the JWT expired

  DEFAULT_ROUTE: 'home',
  CITY: 'Sarajevo'
});
