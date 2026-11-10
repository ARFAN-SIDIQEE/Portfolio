// Verifies the MongoDB Atlas configuration from server/.env WITHOUT printing credentials.
// Usage: npm run check:db
import 'dotenv/config';
import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI || '';
const report = (label, ok, detail = '') => console.log(`${ok ? 'OK  ' : 'FAIL'}  ${label}${detail ? ` - ${detail}` : ''}`);

report('MONGODB_URI is set', Boolean(uri));
if (!uri) process.exit(1);

const match = /^(mongodb(?:\+srv)?):\/\/(?:([^:@/]+)(?::([^@]*))?@)?([^/?]+)(?:\/([^?]*))?(?:\?(.*))?$/.exec(uri);
report('URI format is valid', Boolean(match), match ? '' : 'expected mongodb:// or mongodb+srv://user:pass@host/...');
if (!match) process.exit(1);
const [, scheme, user, pass, hosts, dbInUri, query] = match;
report('scheme', true, scheme);
report('username present', Boolean(user));
report('password present', Boolean(pass), pass?.includes('<') ? 'still contains a <placeholder>' : '');
report('password has no raw special characters', !pass || !/[@:/?#\[\]]/.test(decodeURIComponent(pass)) || pass.includes('%'), 'URL-encode characters such as @ : / ? #');
report('host list', true, `${hosts.split(',').length} host(s), atlas=${/mongodb\.net/.test(hosts)}`);
report('database name', true, dbInUri ? 'in URI' : `not in URI, using MONGODB_DB_NAME="${process.env.MONGODB_DB_NAME || 'portfolio'}"`);
if (query) report('options', true, query.split('&').map((q) => q.split('=')[0]).join(', '));

const dbName = process.env.MONGODB_DB_NAME || 'portfolio';

// --- diagnostics helpers (never print the URI, username or password) ---
const secrets = [uri, user, pass, user && decodeURIComponent(user), pass && decodeURIComponent(pass)].filter((s) => s && s.length >= 3);
const clean = (value) => {
  let text = String(value ?? '');
  for (const secret of secrets) text = text.split(secret).join('<redacted>');
  return text.replace(/(mongodb(?:\+srv)?:\/\/)[^\s'"]+/gi, '$1<redacted>');
};
const describeError = (e) => {
  if (!e || !e.message) return 'none';
  const code = e.code ?? e.errno ?? e.syscall ?? '';
  return clean(`${e.name}: ${e.message}${code ? ` [code=${code}${e.syscall ? `, syscall=${e.syscall}` : ''}${e.hostname ? `, host=${e.hostname}` : ''}]` : ''}`);
};
const classify = (text, code) => {
  if (/bad auth|Authentication failed|AuthenticationFailed|auth failed/i.test(text)) return 'AUTHENTICATION (credentials rejected after TLS succeeded)';
  if (/querySrv|querytxt|ENOTFOUND|EAI_AGAIN|ESERVFAIL|ENODATA/i.test(text) || /^(ENOTFOUND|EAI_AGAIN|ESERVFAIL|ENODATA)$/.test(code)) return 'DNS (SRV/TXT/host lookup failed)';
  if (/alert number 80|tlsv1 alert|ERR_SSL|SSL routines|certificate|handshake|TLS/i.test(text)) return 'TLS handshake failure (Atlas drops the TLS handshake for IPs not on Network Access, so this is IP-access OR a TLS/cert/proxy problem)';
  if (/ETIMEDOUT|timed out|ESOCKETTIMEDOUT|Server selection timed out/i.test(text)) return 'TIMEOUT (no server answered in time: firewall/VPN/blocked port 27017, or IP not allowed)';
  if (/ECONNREFUSED|ECONNRESET|EHOSTUNREACH|ENETUNREACH/i.test(text) || /^(ECONNREFUSED|ECONNRESET|EHOSTUNREACH|ENETUNREACH)$/.test(code)) return 'TCP connection refused/reset/unreachable';
  return 'UNCLASSIFIED (see raw details above)';
};

// Diagnostic-only DNS override; the application itself never changes DNS.
// Example (PowerShell): $env:DIAG_DNS_SERVERS='8.8.8.8,1.1.1.1'; npm run check:db
const dns = await import('node:dns');
if (process.env.DIAG_DNS_SERVERS) dns.setServers(process.env.DIAG_DNS_SERVERS.split(',').map((s) => s.trim()).filter(Boolean));
report('Node DNS servers used', true, (process.env.DIAG_DNS_SERVERS ? `${process.env.DIAG_DNS_SERVERS} (DIAG_DNS_SERVERS override)` : `${dns.getServers().join(', ')} (system default)`));

if (scheme === 'mongodb+srv') {
  const host = hosts.split(',')[0];
  for (const [label, fn, arg] of [['SRV  _mongodb._tcp.<host>', 'resolveSrv', `_mongodb._tcp.${host}`], ['TXT  <host>', 'resolveTxt', host]]) {
    try {
      const out = await dns.promises[fn](arg);
      report(`DNS ${label}`, true, fn === 'resolveSrv' ? `${out.length} record(s): ${out.map((r) => `${r.name}:${r.port}`).join(', ')}` : `${out.length} record(s)`);
    } catch (e) { report(`DNS ${label}`, false, describeError(e)); }
  }
}

try {
  const started = Date.now();
  await mongoose.connect(uri, { dbName: dbInUri ? undefined : dbName, serverSelectionTimeoutMS: 10000 });
  report('connection', true, `${Date.now() - started} ms, database "${mongoose.connection.name}"`);
  const collections = await mongoose.connection.db.listCollections().toArray();
  report('read access', true, `${collections.length} collection(s): ${collections.map((c) => c.name).join(', ') || 'none yet'}`);
  await mongoose.disconnect();
} catch (error) {
  const servers = error.reason?.servers ? [...error.reason.servers.entries()] : [];
  const text = [error.message, describeError(error.cause), ...servers.map(([, s]) => s.error?.message), ...servers.map(([, s]) => s.error?.cause?.message)].filter(Boolean).join(' ');
  const code = [error.code, error.cause?.code, ...servers.map(([, s]) => s.error?.code ?? s.error?.cause?.code)].filter(Boolean).join(' ');
  report('connection', false, 'see details below');
  console.log('  --- sanitized error details ---');
  console.log(`  error     : ${describeError(error)}`);
  console.log(`  cause     : ${describeError(error.cause)}`);
  console.log(`  code      : ${clean(code) || 'none'}`);
  console.log(`  mongoose readyState: ${mongoose.connection.readyState}`);
  if (error.reason) {
    console.log(`  topology  : type=${error.reason.type}, setName=${error.reason.setName ?? 'n/a'}, maxElectionId/compatible=${error.reason.compatible}, servers=${servers.length}`);
    for (const [address, s] of servers) {
      // host:port of the cluster is not a secret
      console.log(`  server    : ${address} type=${s.type} roundTripTime=${s.roundTripTime} lastUpdate=${s.lastUpdateTime ?? 'n/a'}`);
      console.log(`    error   : ${describeError(s.error)}`);
      if (s.error?.cause) console.log(`    cause   : ${describeError(s.error.cause)}`);
      if (s.error?.errorLabels?.length || s.error?.errorLabelSet) console.log(`    labels  : ${[...(s.error.errorLabelSet ?? s.error.errorLabels)].join(', ')}`);
    }
  }
  console.log(`  classification: ${classify(text, code)}`);
  process.exit(1);
}
