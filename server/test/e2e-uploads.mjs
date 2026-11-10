// Upload / replace / delete / orphan-sweep / rate-limit tests. Needs the API started with
// CLOUDINARY_API_BASE pointing at test/cloudinary-stub.mjs (run-integration.mjs does this).
const BASE = process.env.BASE || 'http://localhost:3999/api';
const STUB = process.env.STUB || 'https://localhost:4555';
let pass = 0, fail = 0;
const check = (name, ok, extra = '') => { (ok ? pass++ : fail++); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  -> ' + extra}`); };

async function call(method, path, { body, token } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json; try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { status: res.status, json, headers: res.headers };
}
const stub = (path) => fetch(STUB + path).then((r) => r.json());
const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');
async function upload(token, { type = 'image/png', name = 'a.png' } = {}) {
  const form = new FormData();
  form.append('file', new Blob([PNG], { type }), name);
  const res = await fetch(BASE + '/uploads/image', { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form });
  return { status: res.status, json: await res.json().catch(() => null) };
}

let r = await call('POST', '/auth/login', { body: { username: 'tester', password: 'testpass123' } });
const token = r.json.accessToken;

// --- upload
let u = await upload(null);
check('upload without token -> 401', u.status === 401, u.status);
u = await upload(token, { type: 'text/plain', name: 'a.txt' });
check('upload non-image -> 400', u.status === 400, u.status);
const a = await upload(token);
check('upload image -> 201 {url, publicId}', a.status === 201 && a.json.url?.startsWith('http') && a.json.publicId?.startsWith('portfolio-test/'), JSON.stringify(a));
let state = await stub('/__state');
check('image reached Cloudinary (stub) under the CLOUDINARY_FOLDER (portfolio-test/)', state.ids.includes(a.json.publicId), JSON.stringify(state.ids));

// --- project image lifecycle
r = await call('POST', '/projects', { token, body: { title: 'Img', description: 'd', technologies: ['x'], status: 'completed', imageUrl: a.json.url, imagePublicId: a.json.publicId } });
check('project saved with image', r.status === 201 && r.json.imagePublicId === a.json.publicId, JSON.stringify(r.json));
const pid = r.json._id;
const b = await upload(token);
r = await call('PATCH', `/projects/${pid}`, { token, body: { imageUrl: b.json.url, imagePublicId: b.json.publicId } });
check('project image replaced', r.status === 200 && r.json.imagePublicId === b.json.publicId, JSON.stringify(r.json));
state = await stub('/__state');
check('replacing deletes the OLD image from Cloudinary', !state.ids.includes(a.json.publicId) && state.ids.includes(b.json.publicId), JSON.stringify(state.ids));
r = await call('PATCH', `/projects/${pid}`, { token, body: { title: 'Img2' } });
state = await stub('/__state');
check('editing other fields keeps the image', state.ids.includes(b.json.publicId) && r.json.imagePublicId === b.json.publicId);
r = await call('PATCH', `/projects/${pid}`, { token, body: { imageUrl: '', imagePublicId: '' } });
state = await stub('/__state');
check('clearing the image deletes it from Cloudinary', r.json.imageUrl === '' && !state.ids.includes(b.json.publicId), JSON.stringify(state.ids));
const c = await upload(token);
await call('PATCH', `/projects/${pid}`, { token, body: { imageUrl: c.json.url, imagePublicId: c.json.publicId } });
r = await call('DELETE', `/projects/${pid}`, { token });
state = await stub('/__state');
check('deleting a project deletes its image', r.status === 200 && !state.ids.includes(c.json.publicId), JSON.stringify(state.ids));

// --- profile picture lifecycle
const p1 = await upload(token);
r = await call('PUT', '/profile', { token, body: { avatarUrl: p1.json.url, avatarPublicId: p1.json.publicId } });
check('profile picture saved', r.status === 200 && r.json.avatarPublicId === p1.json.publicId, JSON.stringify(r.json));
const p2 = await upload(token);
r = await call('PUT', '/profile', { token, body: { avatarUrl: p2.json.url, avatarPublicId: p2.json.publicId } });
state = await stub('/__state');
check('replacing profile picture deletes the old one', r.status === 200 && !state.ids.includes(p1.json.publicId) && state.ids.includes(p2.json.publicId), JSON.stringify(state.ids));
r = await call('PUT', '/profile', { token, body: { fullName: 'Still Here' } });
state = await stub('/__state');
check('saving profile without image fields keeps the picture', state.ids.includes(p2.json.publicId));

// --- orphan sweep
const orphan = await upload(token);
r = await fetch(BASE + '/uploads/cleanup', { method: 'POST' });
check('cleanup without token -> 401', r.status === 401, r.status);
let sweep = await call('POST', '/uploads/cleanup', { token });
state = await stub('/__state');
check('fresh unreferenced upload survives the grace period', sweep.status === 201 && state.ids.includes(orphan.json.publicId), JSON.stringify(sweep.json));
await stub(`/__age?id=${encodeURIComponent(orphan.json.publicId)}`);
await stub(`/__age?id=${encodeURIComponent(p2.json.publicId)}`);
sweep = await call('POST', '/uploads/cleanup', { token });
state = await stub('/__state');
check('old orphan is removed by the sweep', sweep.json.deleted.includes(orphan.json.publicId) && !state.ids.includes(orphan.json.publicId), JSON.stringify(sweep.json));
check('old but REFERENCED image is kept', state.ids.includes(p2.json.publicId), JSON.stringify(state.ids));

// --- safety: uploads are tagged and cleanup/deletes never touch anything outside the managed folder
const fresh = await upload(token);
const tags = await stub('/__tags');
check('uploads carry the portfolio-managed tag and live in the managed folder', tags[fresh.json.publicId]?.includes('portfolio-managed') && fresh.json.publicId.startsWith('portfolio-test/'), JSON.stringify(tags[fresh.json.publicId]));
const seed = (id, t) => fetch(STUB + '/__seed?id=' + encodeURIComponent(id) + '&tags=' + t);
await seed('portfolio-test/legacy-untagged', '');          // in our folder but not uploaded by this app
await seed('otherenv/tagged-leak', 'portfolio-managed');   // tagged but in another environment's folder
await seed('real-images/hero', '');                          // an unrelated, pre-existing image
sweep = await call('POST', '/uploads/cleanup', { token });
state = await stub('/__state');
check('sweep ignores untagged images, other folders and pre-existing images (all aged, none referenced)', ['portfolio-test/legacy-untagged', 'otherenv/tagged-leak', 'real-images/hero'].every((i) => state.ids.includes(i)) && sweep.json.deleted.every((i) => i.startsWith('portfolio-test/')), JSON.stringify(sweep.json));
r = await call('POST', '/projects', { token, body: { title: 'ForeignId', description: 'd', technologies: ['x'], status: 'completed', imageUrl: 'https://res.cloudinary.test/real.png', imagePublicId: 'real-images/hero' } });
await call('DELETE', '/projects/' + r.json._id, { token });
state = await stub('/__state');
check('deleting a record that points at a foreign public id does NOT delete that image', state.ids.includes('real-images/hero'), JSON.stringify(state.ids));

// --- login rate limiting (last: it locks this client out)
const wrong = [];
for (let i = 0; i < 6; i++) wrong.push((await call('POST', '/auth/login', { body: { username: 'tester', password: 'bad' + i } })).status);
check('first failures are 401, then 429', wrong.slice(0, 4).every((s) => s === 401) && wrong.slice(-1)[0] === 429, wrong.join(','));
r = await call('POST', '/auth/login', { body: { username: 'tester', password: 'testpass123' } });
check('correct password is also blocked while locked out', r.status === 429 && /too many/i.test(r.json.message), JSON.stringify(r.json));
r = await call('GET', '/portfolio');
check('public API unaffected by the login lockout', r.status === 200);
r = await call('POST', '/projects', { token, body: { title: 'still ok', description: 'd', technologies: ['x'], status: 'completed' } });
check('existing admin token still works during lockout', r.status === 201, r.status);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
