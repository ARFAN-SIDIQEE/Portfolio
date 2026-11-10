// Runs the API integration tests against a THROWAWAY database. It never reads MONGODB_URI
// from server/.env, so production/Atlas data is not touched.
//
//   MONGOD_BIN=/path/to/mongod(.exe) node test/run-integration.mjs     (starts a temp local mongod)
//   MONGODB_TEST_URI=mongodb://127.0.0.1:27017 node test/run-integration.mjs   (use an existing disposable server)
//
// Requires `npm run build` first (it runs dist/main.js).
import { execFileSync, spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import net from 'node:net';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startCloudinaryStub } from './cloudinary-stub.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const serverDir = join(here, '..');
const API_PORT = 3999, MONGO_PORT = 27555, STUB_PORT = 4555;
const children = [];
let tmpDir;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function waitForPort(port, timeoutMs = 60000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const socket = net.connect(port, '127.0.0.1');
      socket.once('connect', () => { socket.destroy(); resolve(); });
      socket.once('error', () => { socket.destroy(); Date.now() - start > timeoutMs ? reject(new Error(`port ${port} not ready`)) : setTimeout(attempt, 500); });
    };
    attempt();
  });
}
function run(cmd, args, opts = {}) {
  const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], ...opts });
  children.push(child);
  child.output = '';
  child.stdout.on('data', (d) => (child.output += d));
  child.stderr.on('data', (d) => (child.output += d));
  return child;
}
const stop = (child) => new Promise((resolve) => { if (child.exitCode !== null) return resolve(); child.once('exit', resolve); child.kill(); setTimeout(resolve, 3000); });

async function startApi(env) {
  const api = run('node', ['dist/main.js'], {
    cwd: serverDir,
    env: {
      PATH: process.env.PATH, SystemRoot: process.env.SystemRoot,
      PORT: String(API_PORT), CLIENT_ORIGIN: 'http://localhost:5173',
      ADMIN_USERNAME: 'tester', ADMIN_PASSWORD: 'testpass123', ADMIN_PASSWORD_HASH: '',
      JWT_SECRET: randomBytes(48).toString('hex'),
      // empty strings stop dotenv from filling these in from a real server/.env
      CLOUDINARY_CLOUD_NAME: '', CLOUDINARY_API_KEY: '', CLOUDINARY_API_SECRET: '', CLOUDINARY_API_BASE: '',
      SMTP_HOST: '', MONGODB_DB_NAME: '', CLOUDINARY_CLEANUP: 'off',
      // pin everything server/.env might define so tests behave the same on any machine
      NODE_ENV: 'test', TRUST_PROXY: '', LOGIN_MAX_ATTEMPTS: '', API_RATE_LIMIT: '', CLOUDINARY_FOLDER: '', CLOUDINARY_ORPHAN_GRACE_MINUTES: '',
      NODE_TLS_REJECT_UNAUTHORIZED: '0', // only for the self-signed Cloudinary stub
      ...env,
    },
  });
  const start = Date.now();
  while (Date.now() - start < 60000) {
    if (api.exitCode !== null) throw new Error(`API exited early:\n${api.output.slice(-1500)}`);
    try { if ((await fetch(`http://localhost:${API_PORT}/api/portfolio`)).ok) return api; } catch { /* not up yet */ }
    await sleep(500);
  }
  throw new Error(`API did not become ready:\n${api.output.slice(-1500)}`);
}

async function phase(name, script, env) {
  console.log(`\n=== ${name} ===`);
  const api = await startApi(env);
  const tests = run('node', [join(here, script)], { env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, BASE: `http://localhost:${API_PORT}/api`, STUB: `https://localhost:${STUB_PORT}`, NODE_TLS_REJECT_UNAUTHORIZED: '0' } });
  tests.stdout.pipe(process.stdout);
  const code = await new Promise((resolve) => tests.once('exit', resolve));
  await stop(api);
  if (code) console.log(`
--- API log (last lines) ---
${api.output.replace(/[[0-9;]*m/g, "").slice(-9000)}`);
  return code;
}

let exit = 1;
try {
  let mongoBase = process.env.MONGODB_TEST_URI;
  if (!mongoBase) {
    if (!process.env.MONGOD_BIN) throw new Error('Set MONGOD_BIN (path to mongod) or MONGODB_TEST_URI (a disposable MongoDB).');
    tmpDir = mkdtempSync(join(tmpdir(), 'portfolio-test-db-'));
    run(process.env.MONGOD_BIN, ['--dbpath', tmpDir, '--port', String(MONGO_PORT), '--bind_ip', '127.0.0.1', '--nojournal']);
    await waitForPort(MONGO_PORT);
    mongoBase = `mongodb://127.0.0.1:${MONGO_PORT}`;
  }
  const certDir = mkdtempSync(join(tmpdir(), 'portfolio-test-cert-'));
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1', '-subj', '/CN=localhost', '-keyout', join(certDir, 'k.pem'), '-out', join(certDir, 'c.pem')], { stdio: 'ignore' });
  await startCloudinaryStub(STUB_PORT, { key: readFileSync(join(certDir, 'k.pem')), cert: readFileSync(join(certDir, 'c.pem')) });
  rmSync(certDir, { recursive: true, force: true });
  const stamp = Date.now();
  const a = await phase('Phase A: CRUD, auth, validation (Cloudinary NOT configured)', 'e2e.mjs', { MONGODB_URI: mongoBase, MONGODB_DB_NAME: `portfolio_test_a_${stamp}` });
  const b = await phase('Phase B: uploads, replacement, deletion, orphan sweep, rate limit (Cloudinary stub)', 'e2e-uploads.mjs', {
    MONGODB_URI: mongoBase, MONGODB_DB_NAME: `portfolio_test_b_${stamp}`,
    CLOUDINARY_CLOUD_NAME: 'testcloud', CLOUDINARY_API_KEY: '123456', CLOUDINARY_API_SECRET: 'testsecret', CLOUDINARY_API_BASE: `https://localhost:${STUB_PORT}`, CLOUDINARY_FOLDER: 'portfolio-test', CLOUDINARY_ORPHAN_GRACE_MINUTES: '60',
  });
  exit = a || b ? 1 : 0;
  console.log(`\nPhase A exit ${a}, Phase B exit ${b}`);
} catch (error) {
  console.error('\nIntegration run aborted:', error.message);
} finally {
  for (const child of children) { try { child.kill(); } catch { /* already gone */ } }
  await sleep(1500);
  if (tmpDir) { try { rmSync(tmpDir, { recursive: true, force: true }); } catch { /* mongod may still hold files */ } }
  process.exit(exit);
}
