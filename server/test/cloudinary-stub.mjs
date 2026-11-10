// Minimal local stand-in for the Cloudinary upload/destroy/resources endpoints.
// It lets the integration tests exercise OUR upload, replace, delete and orphan-sweep code
// without real credentials. The SDK only speaks HTTPS, so this uses a throwaway self-signed cert
// (the test processes run with NODE_TLS_REJECT_UNAUTHORIZED=0).
// without real credentials. It is NOT Cloudinary: it cannot catch Cloudinary-side rejections.
import { createServer } from 'node:https';

export function startCloudinaryStub(port, tls) {
  const images = new Map(); // public_id -> { created_at, bytes }
  const log = [];
  let counter = 0;

  const server = createServer(tls, (req, res) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks);
      const url = new URL(req.url, `https://localhost:${port}`);
      const json = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
      log.push(`${req.method} ${url.pathname}`);

      if (req.method === 'POST' && /\/image\/upload$/.test(url.pathname)) {
        const text = raw.toString('latin1');
        const folder = /name="folder"\r\n\r\n([^\r]+)/.exec(text)?.[1] || '';
        const signed = /name="signature"/.test(text) && /name="api_key"/.test(text);
        if (!signed) return json(401, { error: { message: 'missing signature/api_key' } });
        const publicId = `${folder ? folder + '/' : ''}stub${++counter}`;
        const created_at = new Date().toISOString();
        const tags = (/name="tags"\r\n\r\n([^\r]+)/.exec(text)?.[1] || '').split(',').filter(Boolean);
        images.set(publicId, { created_at, bytes: raw.length, tags });
        return json(200, { public_id: publicId, secure_url: `https://stub.cloudinary.test:${port}/img/${publicId}.png`, url: `https://stub.cloudinary.test:${port}/img/${publicId}.png`, created_at, resource_type: 'image' });
      }
      if (req.method === 'POST' && /\/image\/destroy$/.test(url.pathname)) {
        const body = raw.toString();
        const id = (() => {
          try { return JSON.parse(body).public_id; } catch { /* not JSON */ }
          return /name="public_id"\r\n\r\n([^\r]+)/.exec(body)?.[1] ?? new URLSearchParams(body).get('public_id');
        })();
        const existed = images.delete(id);
        return json(200, { result: existed ? 'ok' : 'not found' });
      }
      if (req.method === 'GET' && /\/resources\/image(\/upload)?$/.test(url.pathname)) {
        const prefix = url.searchParams.get('prefix') || '';
        const resources = [...images].filter(([id]) => id.startsWith(prefix)).map(([id, v]) => ({ public_id: id, created_at: v.created_at }));
        return json(200, { resources });
      }
      const byTag = /\/resources\/image\/tags\/([^/]+)$/.exec(url.pathname);
      if (req.method === 'GET' && byTag) { // what the app's sweep uses: tagged images only
        const resources = [...images].filter(([, v]) => v.tags?.includes(decodeURIComponent(byTag[1]))).map(([id, v]) => ({ public_id: id, created_at: v.created_at }));
        return json(200, { resources });
      }
      if (url.pathname === '/__seed') { // add an image directly (e.g. one the app does not own)
        const id = url.searchParams.get('id');
        const tags = (url.searchParams.get('tags') || '').split(',').filter(Boolean);
        images.set(id, { created_at: new Date(Date.now() - 3 * 3_600_000).toISOString(), bytes: 0, tags });
        return json(200, { ok: true });
      }
      if (url.pathname === '/__tags') return json(200, Object.fromEntries([...images].map(([id, v]) => [id, v.tags || []])));
      if (url.pathname === '/__state') return json(200, { ids: [...images.keys()], log });
      if (url.pathname === '/__age') { // backdate an image so the orphan sweep considers it old enough
        const entry = images.get(url.searchParams.get('id'));
        if (entry) entry.created_at = new Date(Date.now() - 3 * 3_600_000).toISOString();
        return json(200, { ok: Boolean(entry) });
      }
      json(404, { error: { message: `stub: no route ${req.method} ${url.pathname}` } });
    });
  });
  return new Promise((resolve) => server.listen(port, () => resolve({ server, images, log })));
}

if (process.argv[1] && process.argv[1].endsWith('cloudinary-stub.mjs')) {
  const port = Number(process.env.STUB_PORT) || 4555;
  await startCloudinaryStub(port);
  console.log(`Cloudinary stub on :${port}`);
}
