/**
 * API client — the ONLY place that talks to the backend.
 * Adds the JWT, applies a timeout, converts errors into ApiError and
 * sends the user back to the login page when the token is rejected (401).
 */
class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const Api = {
  async request(method, path, body) {
    let status, data;

    if (CONFIG.USE_MOCK_API) {
      ({ status, data } = await MockApi.handle(method, path, body, Auth.getToken()));
    } else {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT_MS);
      const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
      const token = Auth.getToken();
      if (token) headers.Authorization = `Bearer ${token}`;

      let res;
      try {
        res = await fetch(CONFIG.API_BASE_URL + path, {
          method,
          headers,
          body: body !== undefined ? JSON.stringify(body) : undefined,
          signal: controller.signal
        });
      } catch (err) {
        throw new ApiError(err.name === 'AbortError'
          ? 'The server is taking too long to answer. Please try again.'
          : 'We could not reach the server. Check your connection and try again.', 0);
      } finally {
        clearTimeout(timer);
      }
      status = res.status;
      try { data = await res.json(); } catch { data = null; }
    }

    if (status === 401 && Auth.getToken()) {
      Auth.handleExpired();
      throw new ApiError('Your session has expired. Please log in again.', 401, data);
    }
    if (status < 200 || status >= 300) {
      const msg = (data && (data.message || data.error)) || `Something went wrong (error ${status}).`;
      throw new ApiError(msg, status, data);
    }
    return data;
  },

  get(path) { return this.request('GET', path); },
  post(path, body) { return this.request('POST', path, body); },
  put(path, body) { return this.request('PUT', path, body); },
  del(path) { return this.request('DELETE', path); }
};
