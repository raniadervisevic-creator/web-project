/**
 * MOCK BACKEND — used only while CONFIG.USE_MOCK_API is true.
 *
 * It imitates the FlightPHP REST API (same URLs, same JSON shapes, same
 * status codes) and keeps its "database" in localStorage, so CRUD works and
 * survives a page refresh. When the real backend is ready, set
 * USE_MOCK_API to false; nothing else in the frontend has to change.
 *
 * Endpoints it imitates (build these in backend/routes):
 *   POST   /auth/register          POST /auth/login          GET|PUT /auth/me   PUT /auth/password
 *   GET    /programs   /programs/:id     POST|PUT|DELETE (admin)
 *   GET    /events     /events/:id       POST|PUT|DELETE (admin)
 *   GET    /children                     POST|PUT|DELETE (owner or admin)
 *   GET    /enrollments                  POST (parent)  PUT (admin: status)  DELETE
 *   GET    /users                        PUT|DELETE (admin)
 *   GET    /weather                      (backend proxies OpenWeatherMap)
 *   POST   /inquiries   POST /newsletter (public forms)
 *
 * Test accounts:  admin@magicnisvijet.ba / Admin123!
 *                 parent@magicnisvijet.ba / Parent123!
 */
const MockApi = (() => {
  const DB_KEY = 'ms_mock_db_v1';
  const TOKEN_LIFETIME_S = 60 * 60; // 1 hour, like a typical JWT

  const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const now = () => new Date().toISOString();

  function seed() {
    return {
      seq: { users: 3, children: 3, programs: 3, enrollments: 3, events: 4, inquiries: 0 },
      users: [
        { id: 1, first_name: 'Admin', last_name: 'Magični', email: 'admin@magicnisvijet.ba', phone: '', role: 'admin', password: 'Admin123!', created_at: now() },
        { id: 2, first_name: 'Ana', last_name: 'Anić', email: 'parent@magicnisvijet.ba', phone: '+387 61 000 000', role: 'parent', password: 'Parent123!', created_at: now() },
        { id: 3, first_name: 'Teacher', last_name: 'Demo', email: 'teacher@magicnisvijet.ba', phone: '', role: 'teacher', password: 'Teacher123!', created_at: now() }
      ],
      programs: [
        { id: 1, name: 'Toddler Bloom', min_age: 1, max_age: 3, description: 'Gentle first steps into group play — songs, sensory corners and lots of cuddles.', schedule: 'Mon–Fri, 07:30–16:00', price: 250, capacity: 12, teacher: '[TEACHER NAME]', image: 'class-toddler.svg' },
        { id: 2, name: 'Preschool Explorers', min_age: 3, max_age: 5, description: 'Nature walks, story circles and early science — curiosity turned into expeditions.', schedule: 'Mon–Fri, 07:30–16:30', price: 280, capacity: 18, teacher: '[TEACHER NAME]', image: 'class-preschool.svg' },
        { id: 3, name: 'Little Astronauts', min_age: 5, max_age: 6, description: 'Letters, numbers and big questions — a confident launch into the first school year.', schedule: 'Mon–Fri, 08:00–16:30', price: 300, capacity: 20, teacher: '[TEACHER NAME]', image: 'class-astronauts.svg' }
      ],
      children: [
        { id: 1, parent_id: 2, first_name: 'Lana', last_name: 'Anić', date_of_birth: '2022-03-14', notes: 'Loves painting', created_at: now() },
        { id: 2, parent_id: 2, first_name: 'Mirza', last_name: 'Anić', date_of_birth: '2024-06-02', notes: 'Allergic to peanuts', created_at: now() },
        { id: 3, parent_id: 3, first_name: 'Demo', last_name: 'Child', date_of_birth: '2021-01-20', notes: '', created_at: now() }
      ],
      enrollments: [
        { id: 1, child_id: 1, program_id: 2, status: 'active', start_date: '2026-09-01', notes: '', created_at: '2026-08-20T10:00:00Z' },
        { id: 2, child_id: 2, program_id: 1, status: 'pending', start_date: day(30), notes: 'Mornings only at first', created_at: now() },
        { id: 3, child_id: 1, program_id: 3, status: 'approved', start_date: '2027-09-01', notes: '', created_at: now() }
      ],
      events: [
        { id: 1, title: 'Autumn leaf hunt', description: 'Park walk — bring rain boots!', event_date: day(4), location: 'City park', program_id: 2 },
        { id: 2, title: 'Pajama story night', description: 'Bedtime stories and warm milk.', event_date: day(6), location: 'Moon room', program_id: null },
        { id: 3, title: 'Planetarium field trip', description: 'Signed permission slip needed.', event_date: day(11), location: 'Planetarium', program_id: 3 },
        { id: 4, title: 'Music morning', description: 'Shakers, drums and singing together.', event_date: day(15), location: 'Story & music room', program_id: 1 }
      ],
      inquiries: []
    };
  }

  const load = () => { try { return JSON.parse(localStorage.getItem(DB_KEY)) || seed(); } catch { return seed(); } };
  const save = db => { try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch { /* storage full/blocked: keep in memory */ } };

  // --- fake JWT (header.payload.signature, base64url) ---
  const b64url = obj => btoa(unescape(encodeURIComponent(JSON.stringify(obj)))).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  function makeToken(user) {
    const iat = Math.floor(Date.now() / 1000);
    const payload = { sub: user.id, email: user.email, role: user.role, name: user.first_name, iat, exp: iat + TOKEN_LIFETIME_S };
    return `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url(payload)}.mock-signature`;
  }
  function readToken(token) {
    if (!token) return null;
    const p = Auth.decodeToken(token);
    if (!p || !p.exp || p.exp * 1000 < Date.now()) return null;
    return p;
  }

  const publicUser = u => { const { password, ...rest } = u; return rest; };
  const ok = (data, status = 200) => ({ status, data });
  const fail = (status, message, errors) => ({ status, data: { message, errors } });
  const required = (body, fields) => fields.filter(f => body[f] === undefined || body[f] === null || String(body[f]).trim() === '');

  const withJoins = (db, e) => {
    const child = db.children.find(c => c.id === e.child_id) || {};
    const program = db.programs.find(p => p.id === e.program_id) || {};
    return { ...e, child_name: `${child.first_name || '?'} ${child.last_name || ''}`.trim(), program_name: program.name || '—', parent_id: child.parent_id };
  };
  const eventJoin = (db, ev) => ({ ...ev, program_name: ev.program_id ? (db.programs.find(p => p.id === ev.program_id) || {}).name || '—' : 'All groups' });

  /** Generic CRUD helpers */
  function create(db, table, body) {
    const row = { id: ++db.seq[table], ...body, created_at: now() };
    db[table].push(row); save(db); return row;
  }
  function update(db, table, id, body) {
    const row = db[table].find(r => r.id === id);
    if (!row) return null;
    Object.assign(row, body, { id }); save(db); return row;
  }
  function remove(db, table, id) {
    const i = db[table].findIndex(r => r.id === id);
    if (i === -1) return false;
    db[table].splice(i, 1); save(db); return true;
  }

  async function handle(method, fullPath, body = {}, token) {
    await new Promise(r => setTimeout(r, 250 + Math.random() * 250)); // feel like a network
    body = body || {};
    const db = load();
    const path = fullPath.split('?')[0].replace(/\/+$/, '');
    const parts = path.split('/').filter(Boolean);       // e.g. ['children','3']
    const [resource, idPart] = parts;
    const id = idPart !== undefined ? Number(idPart) : null;
    const me = readToken(token);
    const isAdmin = me && me.role === 'admin';
    const needAuth = () => !me ? fail(401, 'Missing or expired token.') : null;
    const needAdmin = () => needAuth() || (!isAdmin ? fail(403, 'Only administrators can do that.') : null);

    // ---------- AUTH ----------
    if (resource === 'auth') {
      if (idPart === 'login' && method === 'POST') {
        const missing = required(body, ['email', 'password']);
        if (missing.length) return fail(400, 'Email and password are required.');
        const user = db.users.find(u => u.email.toLowerCase() === body.email.toLowerCase());
        if (!user || user.password !== body.password) return fail(401, 'Wrong email or password.');
        return ok({ token: makeToken(user), user: publicUser(user) });
      }
      if (idPart === 'register' && method === 'POST') {
        const missing = required(body, ['first_name', 'last_name', 'email', 'password']);
        if (missing.length) return fail(400, 'Please fill in all required fields.', missing);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) return fail(400, 'Please enter a valid email address.');
        if (String(body.password).length < 8) return fail(400, 'Password must be at least 8 characters.');
        if (db.users.some(u => u.email.toLowerCase() === body.email.toLowerCase())) return fail(409, 'An account with this email already exists.');
        const user = create(db, 'users', { first_name: body.first_name, last_name: body.last_name, email: body.email, phone: body.phone || '', password: body.password, role: 'parent' });
        return ok({ token: makeToken(user), user: publicUser(user) }, 201);
      }
      if (idPart === 'me' && method === 'PUT') {
        const e = needAuth(); if (e) return e;
        const missing = required(body, ['first_name', 'last_name']); if (missing.length) return fail(400, 'First and last name are required.', missing);
        const user = update(db, 'users', me.sub, { first_name: body.first_name, last_name: body.last_name, phone: body.phone || '' });
        return user ? ok(publicUser(user)) : fail(404, 'User not found.');
      }
      if (idPart === 'password' && method === 'PUT') {
        const e = needAuth(); if (e) return e;
        const user = db.users.find(u => u.id === me.sub);
        if (!user || user.password !== body.current_password) return fail(400, 'Your current password is not correct.');
        if (!body.new_password || String(body.new_password).length < 8) return fail(400, 'New password must be at least 8 characters.');
        update(db, 'users', me.sub, { password: body.new_password });
        return ok({ message: 'Password updated.' });
      }
      if (idPart === 'me' && method === 'GET') {
        const e = needAuth(); if (e) return e;
        const user = db.users.find(u => u.id === me.sub);
        return user ? ok(publicUser(user)) : fail(404, 'User not found.');
      }
    }

    // ---------- PROGRAMS ----------
    if (resource === 'programs') {
      if (method === 'GET') {
        if (id) { const p = db.programs.find(x => x.id === id); return p ? ok(p) : fail(404, 'Program not found.'); }
        return ok(db.programs);
      }
      const e = needAdmin(); if (e) return e;
      const data = { ...body, min_age: Number(body.min_age), max_age: Number(body.max_age), price: Number(body.price), capacity: Number(body.capacity) };
      if (method === 'POST') {
        const missing = required(body, ['name', 'min_age', 'max_age']); if (missing.length) return fail(400, 'Name and ages are required.', missing);
        return ok(create(db, 'programs', { image: 'class-preschool.svg', ...data }), 201);
      }
      if (method === 'PUT') { const r = update(db, 'programs', id, data); return r ? ok(r) : fail(404, 'Program not found.'); }
      if (method === 'DELETE') {
        if (db.enrollments.some(x => x.program_id === id)) return fail(409, 'This program still has enrollments. Remove them first.');
        return remove(db, 'programs', id) ? ok({ message: 'Program deleted.' }) : fail(404, 'Program not found.');
      }
    }

    // ---------- EVENTS ----------
    if (resource === 'events') {
      if (method === 'GET') {
        const list = db.events.map(ev => eventJoin(db, ev)).sort((a, b) => a.event_date.localeCompare(b.event_date));
        if (id) { const ev = list.find(x => x.id === id); return ev ? ok(ev) : fail(404, 'Event not found.'); }
        return ok(list);
      }
      const e = needAdmin(); if (e) return e;
      const data = { ...body, program_id: body.program_id ? Number(body.program_id) : null };
      if (method === 'POST') {
        const missing = required(body, ['title', 'event_date']); if (missing.length) return fail(400, 'Title and date are required.', missing);
        return ok(eventJoin(db, create(db, 'events', data)), 201);
      }
      if (method === 'PUT') { const r = update(db, 'events', id, data); return r ? ok(eventJoin(db, r)) : fail(404, 'Event not found.'); }
      if (method === 'DELETE') return remove(db, 'events', id) ? ok({ message: 'Event deleted.' }) : fail(404, 'Event not found.');
    }

    // ---------- CHILDREN ----------
    if (resource === 'children') {
      const e = needAuth(); if (e) return e;
      const mine = c => isAdmin || c.parent_id === me.sub;
      const withParent = c => { const p = db.users.find(u => u.id === c.parent_id) || {}; return { ...c, parent_name: `${p.first_name || ''} ${p.last_name || ''}`.trim(), age: Utils.ageFromDob(c.date_of_birth) }; };
      if (method === 'GET') {
        if (id) { const c = db.children.find(x => x.id === id); return c && mine(c) ? ok(withParent(c)) : fail(404, 'Child not found.'); }
        return ok(db.children.filter(mine).map(withParent));
      }
      if (method === 'POST') {
        const missing = required(body, ['first_name', 'last_name', 'date_of_birth']); if (missing.length) return fail(400, 'Name and date of birth are required.', missing);
        const parent_id = isAdmin && body.parent_id ? Number(body.parent_id) : me.sub;
        return ok(withParent(create(db, 'children', { first_name: body.first_name, last_name: body.last_name, date_of_birth: body.date_of_birth, notes: body.notes || '', parent_id })), 201);
      }
      const child = db.children.find(x => x.id === id);
      if (!child || !mine(child)) return fail(404, 'Child not found.');
      if (method === 'PUT') { const { parent_id, ...rest } = body; return ok(withParent(update(db, 'children', id, rest))); }
      if (method === 'DELETE') {
        db.enrollments = db.enrollments.filter(x => x.child_id !== id);
        remove(db, 'children', id); return ok({ message: 'Child removed.' });
      }
    }

    // ---------- ENROLLMENTS ----------
    if (resource === 'enrollments') {
      const e = needAuth(); if (e) return e;
      const list = db.enrollments.map(x => withJoins(db, x)).filter(x => isAdmin || x.parent_id === me.sub)
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
      if (method === 'GET') {
        if (id) { const x = list.find(r => r.id === id); return x ? ok(x) : fail(404, 'Enrollment not found.'); }
        return ok(list);
      }
      if (method === 'POST') {
        const missing = required(body, ['child_id', 'program_id', 'start_date']); if (missing.length) return fail(400, 'Choose a child, a program and a start date.', missing);
        const child = db.children.find(c => c.id === Number(body.child_id));
        if (!child || (!isAdmin && child.parent_id !== me.sub)) return fail(403, 'You can only enroll your own children.');
        const program = db.programs.find(p => p.id === Number(body.program_id));
        if (!program) return fail(404, 'Program not found.');
        const age = Utils.ageFromDob(child.date_of_birth);
        if (age !== null && (age < program.min_age - 1 || age > program.max_age)) return fail(400, `${program.name} is for ages ${program.min_age}–${program.max_age}. ${child.first_name} is ${age}.`);
        if (db.enrollments.some(x => x.child_id === child.id && x.program_id === program.id && x.status !== 'rejected')) return fail(409, `${child.first_name} already has an application for ${program.name}.`);
        const row = create(db, 'enrollments', { child_id: child.id, program_id: program.id, start_date: body.start_date, notes: body.notes || '', status: 'pending' });
        return ok(withJoins(db, row), 201);
      }
      const row = list.find(r => r.id === id);
      if (!row) return fail(404, 'Enrollment not found.');
      if (method === 'PUT') {
        if (!isAdmin) return fail(403, 'Only administrators can change the status.');
        const allowed = ['pending', 'approved', 'active', 'rejected'];
        if (body.status && !allowed.includes(body.status)) return fail(400, 'Unknown status.');
        const data = { ...body }; if (data.program_id) data.program_id = Number(data.program_id); if (data.child_id) data.child_id = Number(data.child_id);
        return ok(withJoins(db, update(db, 'enrollments', id, data)));
      }
      if (method === 'DELETE') {
        if (!isAdmin && row.status !== 'pending') return fail(403, 'Only pending applications can be cancelled.');
        remove(db, 'enrollments', id); return ok({ message: 'Application removed.' });
      }
    }

    // ---------- USERS (admin) ----------
    if (resource === 'users') {
      const e = needAdmin(); if (e) return e;
      if (method === 'GET') return ok(db.users.map(publicUser));
      if (method === 'POST') {
        const missing = required(body, ['first_name', 'last_name', 'email', 'password']); if (missing.length) return fail(400, 'Please fill in all required fields.', missing);
        if (db.users.some(u => u.email.toLowerCase() === body.email.toLowerCase())) return fail(409, 'Email already in use.');
        return ok(publicUser(create(db, 'users', { ...body, role: body.role || 'parent' })), 201);
      }
      if (method === 'PUT') {
        const { password, ...rest } = body;
        const r = update(db, 'users', id, password ? body : rest); return r ? ok(publicUser(r)) : fail(404, 'User not found.');
      }
      if (method === 'DELETE') {
        if (id === me.sub) return fail(400, 'You cannot delete your own account.');
        return remove(db, 'users', id) ? ok({ message: 'User deleted.' }) : fail(404, 'User not found.');
      }
    }

    // ---------- WEATHER (backend proxies OpenWeatherMap) ----------
    if (resource === 'weather' && method === 'GET') {
      const samples = [
        { temp: 18, description: 'Partly cloudy', icon: 'partly', wind_kmh: 9, humidity: 54 },
        { temp: 22, description: 'Sunny', icon: 'sunny', wind_kmh: 6, humidity: 40 },
        { temp: 9, description: 'Light rain', icon: 'rain', wind_kmh: 14, humidity: 82 }
      ];
      const w = samples[new Date().getDate() % samples.length];
      const outdoor_ok = w.icon !== 'rain' && w.temp >= 5 && w.temp <= 30;
      return ok({ city: CONFIG.CITY, ...w, outdoor_ok, updated_at: now(), source: 'mock' });
    }

    // ---------- PUBLIC FORMS ----------
    if (resource === 'inquiries' && method === 'POST') {
      const missing = required(body, ['name', 'email', 'message']); if (missing.length) return fail(400, 'Please fill in your name, email and message.', missing);
      create(db, 'inquiries', body);
      return ok({ message: 'Thank you! We will get back to you soon.' }, 201);
    }
    if (resource === 'newsletter' && method === 'POST') {
      if (!body.email) return fail(400, 'Email is required.');
      return ok({ message: 'You are on the list!' }, 201);
    }

    return fail(404, `No mock endpoint for ${method} ${path}`);
  }

  return { handle, reset: () => localStorage.removeItem(DB_KEY) };
})();
