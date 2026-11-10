// API smoke test. Start the API with ADMIN_USERNAME=tester ADMIN_PASSWORD=testpass123 PORT=3999 against a THROWAWAY database, then: node test/e2e.mjs
const BASE = process.env.BASE || 'http://localhost:3999/api';
let pass = 0, fail = 0;
const check = (name, ok, extra = '') => { (ok ? pass++ : fail++); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  -> ' + extra}`); };

async function call(method, path, { body, token, raw } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { ...(body && !raw ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: raw ?? (body ? JSON.stringify(body) : undefined),
  });
  const text = await res.text();
  let json; try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { status: res.status, json };
}

// --- public API / seed
let r = await call('GET', '/portfolio');
check('GET /portfolio 200', r.status === 200, r.status);
check('seeded profile name', r.json?.profile?.fullName === 'Arfan Sidiqee', JSON.stringify(r.json?.profile));
check('seeded project + skills', r.json?.projects?.length === 1 && r.json?.skills?.length === 8);
check('seeded social links', r.json?.socialLinks?.length === 2);
check('services section hidden by default', r.json?.settings?.sections?.services === false);

// --- auth
for (const [m, p] of [['POST', '/projects'], ['PATCH', '/projects/aaaaaaaaaaaaaaaaaaaaaaaa'], ['DELETE', '/skills/aaaaaaaaaaaaaaaaaaaaaaaa'], ['POST', '/services'], ['POST', '/education'], ['POST', '/experience'], ['POST', '/social-links'], ['PUT', '/profile'], ['PUT', '/settings'], ['POST', '/uploads/image']]) {
  r = await call(m, p, { body: { x: 1 } });
  check(`unauthenticated ${m} ${p} -> 401`, r.status === 401, r.status);
}
r = await call('POST', '/projects', { body: { title: 'x' }, token: 'a.b.c' });
check('forged token -> 401', r.status === 401, r.status);
r = await call('POST', '/auth/login', { body: { username: 'tester', password: 'wrong' } });
check('bad login -> 401', r.status === 401, r.status);
r = await call('POST', '/auth/login', { body: { username: 'tester', password: 'testpass123' } });
check('good login -> token', r.status === 201 && r.json?.accessToken, JSON.stringify(r));
const token = r.json.accessToken;

// --- projects CRUD
const project = { title: 'E2E', description: 'd', technologies: ['React'], status: 'in-progress', sourceUrl: 'https://github.com/x/y', liveUrl: 'https://x.dev', imageUrl: '', order: 5 };
r = await call('POST', '/projects', { body: project, token });
check('create project (empty imageUrl ok)', r.status === 201, JSON.stringify(r.json));
const pid = r.json?._id;
r = await call('POST', '/projects', { body: { ...project, status: 'bogus' }, token });
check('invalid status -> 400', r.status === 400, r.status);
r = await call('POST', '/projects', { body: { ...project, liveUrl: 'not a url' }, token });
check('invalid url -> 400', r.status === 400, r.status);
r = await call('POST', '/projects', { body: { ...project, evil: 1 }, token });
check('unknown field -> 400', r.status === 400, r.status);
r = await call('PATCH', `/projects/${pid}`, { body: { status: 'completed', sourceUrl: '', imageUrl: 'https://res.cloudinary.com/demo/a.png', imagePublicId: 'portfolio/a' }, token });
check('update project + clear sourceUrl', r.status === 200 && r.json.status === 'completed' && r.json.sourceUrl === '' && r.json.imageUrl.endsWith('a.png'), JSON.stringify(r.json));
r = await call('PATCH', '/projects/not-an-id', { body: { status: 'completed' }, token });
check('bad ObjectId -> 400', r.status === 400, r.status);
r = await call('GET', '/projects');
check('public list shows new project, ordered', r.json.some((p) => p._id === pid), JSON.stringify(r.json.map((p) => p.title)));
r = await call('DELETE', `/projects/${pid}`, { token });
check('delete project', r.status === 200, r.status);
r = await call('DELETE', `/projects/${pid}`, { token });
check('delete missing project -> 404', r.status === 404, r.status);

// --- other collections
async function crud(path, create, patch, label) {
  let x = await call('POST', path, { body: create, token });
  check(`${label}: create`, x.status === 201, JSON.stringify(x.json));
  const id = x.json?._id;
  x = await call('PATCH', `${path}/${id}`, { body: patch, token });
  check(`${label}: update`, x.status === 200 && Object.entries(patch).every(([k, v]) => x.json[k] === v), JSON.stringify(x.json));
  x = await call('GET', path);
  check(`${label}: public list`, x.status === 200 && x.json.some((i) => i._id === id));
  x = await call('POST', path, { body: { ...create, bad: true }, token });
  check(`${label}: rejects unknown field`, x.status === 400, x.status);
  x = await call('DELETE', `${path}/${id}`, { token });
  check(`${label}: delete`, x.status === 200, x.status);
}
await crud('/services', { title: 'Free website review', description: 'I review your site', icon: 'fas fa-eye' }, { price: 'Free (limited)' }, 'services');
await crud('/education', { institution: 'Uni', degree: 'BSSE' }, { endDate: '2026' }, 'education');
await crud('/experience', { title: 'Intern', company: 'Acme' }, { description: 'Did things' }, 'experience');
await crud('/social-links', { platform: 'LinkedIn', url: 'https://linkedin.com/in/x', icon: 'fab fa-linkedin' }, { platform: 'LinkedIn2' }, 'social-links');
await crud('/skills', { name: 'Node', category: 'Technical' }, { name: 'Node.js' }, 'skills');
r = await call('POST', '/social-links', { body: { platform: 'x', url: 'javascript:alert(1)' }, token });
check('social link rejects javascript: URL', r.status === 400, r.status);

// --- singletons
r = await call('PUT', '/profile', { body: { fullName: 'Arfan S', email: '', aboutParagraphs: ['a', 'b'], aboutStats: [{ value: '5th', label: 'Sem' }] }, token });
check('profile update (empty email allowed)', r.status === 200 && r.json.fullName === 'Arfan S' && r.json.aboutParagraphs.length === 2, JSON.stringify(r.json));
r = await call('PUT', '/profile', { body: { email: 'not-an-email' }, token });
check('profile invalid email -> 400', r.status === 400, r.status);
r = await call('PUT', '/settings', { body: { sections: { about: false }, sectionTitles: { about: 'Hello' } }, token });
check('settings partial update', r.status === 200 && r.json.sections.about === false && r.json.sections.services === false && r.json.sections.skills === true, JSON.stringify(r.json.sections));
r = await call('PUT', '/settings', { body: { sections: { about: true, services: true } }, token });
check('settings re-enable sections', r.json.sections.about === true && r.json.sections.services === true);
r = await call('PUT', '/settings', { body: { sections: { about: 'yes' } }, token });
check('settings invalid flag -> 400', r.status === 400, r.status);

// --- uploads (no Cloudinary creds in this env)
const fd = new FormData(); fd.append('file', new Blob([Buffer.from('x')], { type: 'text/plain' }), 'a.txt');
let u = await fetch(BASE + '/uploads/image', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
check('upload rejects non-image -> 400', u.status === 400, u.status);
const fd2 = new FormData(); fd2.append('file', new Blob([Buffer.from('89504e47', 'hex')], { type: 'image/png' }), 'a.png');
u = await fetch(BASE + '/uploads/image', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd2 });
const ub = await u.json();
check('upload without Cloudinary creds -> 503 with clear message', u.status === 503 && /CLOUDINARY/.test(ub.message), `${u.status} ${JSON.stringify(ub)}`);
u = await fetch(BASE + '/uploads/image', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: new FormData() });
check('upload without file -> 400', u.status === 400, u.status);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
