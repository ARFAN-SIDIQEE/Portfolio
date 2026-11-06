import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api.js';
import { Alert, Spinner } from '../ui.jsx';
import { CrudManager, SingletonForm } from './CrudManager.jsx';
import {
  educationFields, experienceFields, profileFields, projectFields, serviceFields, settingsFields, skillFields, socialFields,
} from './config.js';

const TABS = [
  { id: 'profile', label: 'Profile', icon: 'fa-user' },
  { id: 'projects', label: 'Projects', icon: 'fa-diagram-project' },
  { id: 'skills', label: 'Skills', icon: 'fa-star' },
  { id: 'education', label: 'Education', icon: 'fa-graduation-cap' },
  { id: 'experience', label: 'Experience', icon: 'fa-briefcase' },
  { id: 'services', label: 'Services', icon: 'fa-hand-holding-heart' },
  { id: 'social', label: 'Social links', icon: 'fa-share-nodes' },
  { id: 'settings', label: 'Site settings', icon: 'fa-sliders' },
];

function AdminShell({ children }) {
  return (
    <main className="admin-page">
      <div className="bg-blobs" aria-hidden="true"><div className="blob blob-1" /><div className="blob blob-2" /></div>
      <div className="admin-container">{children}</div>
    </main>
  );
}

function Login({ onLogin }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await api.login(Object.fromEntries(new FormData(event.currentTarget)));
      onLogin(result.accessToken);
    } catch (reason) {
      setError(reason.message);
    } finally { setBusy(false); }
  }

  return (
    <AdminShell>
      <a className="admin-back" href="/">← Back to portfolio</a>
      <section className="admin-card glass-card">
        <h1>Admin sign in</h1>
        <form onSubmit={submit} className="admin-form">
          <label>Username<input name="username" className="form-control" autoComplete="username" required /></label>
          <label>Password<input name="password" type="password" className="form-control" autoComplete="current-password" required /></label>
          <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <Alert>{error}</Alert>
      </section>
    </AdminShell>
  );
}

export default function Admin() {
  const [token, setToken] = useState(() => localStorage.getItem('adminToken') || '');
  const [tab, setTab] = useState('profile');
  const [expired, setExpired] = useState(false);
  // A stored token is only trusted after the API accepts it.
  const [verified, setVerified] = useState(false);

  const signOut = useCallback((didExpire = false) => {
    localStorage.removeItem('adminToken');
    setToken('');
    setExpired(didExpire === true);
  }, []);
  const onAuthError = useCallback(() => signOut(true), [signOut]);

  useEffect(() => {
    if (!token) return undefined;
    let active = true;
    api.me(token).then(() => active && setVerified(true)).catch((reason) => {
      if (!active) return;
      if (reason.status === 401) signOut(true);
      else setVerified(true); // API unreachable: let the screens show their own errors
    });
    return () => { active = false; };
  }, [token, signOut]);

  if (!token) {
    return (
      <>
        <Login onLogin={(value) => { localStorage.setItem('adminToken', value); setVerified(true); setToken(value); setExpired(false); }} />
        {expired && <div className="admin-container"><Alert>Your session expired. Please sign in again.</Alert></div>}
      </>
    );
  }

  if (!verified) return <AdminShell><Spinner label="Checking your session…" /></AdminShell>;

  const shared = { token, onAuthError };
  return (
    <AdminShell>
      <div className="admin-heading">
        <div><a className="admin-back" href="/">← View portfolio</a><h1>Portfolio admin</h1></div>
        <button className="btn btn-secondary" onClick={() => signOut()}>Sign out</button>
      </div>
      <ul className="nav nav-pills admin-tabs mb-4 flex-wrap gap-1" role="tablist">
        {TABS.map((item) => (
          <li className="nav-item" key={item.id}>
            <button className={`nav-link ${tab === item.id ? 'active' : ''}`} role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)}>
              <i className={`fas ${item.icon}`} /> {item.label}
            </button>
          </li>
        ))}
      </ul>

      {tab === 'profile' && <SingletonForm title="Profile" resource="profile" fields={profileFields} {...shared} />}
      {tab === 'projects' && <CrudManager title="Project" resource="projects" fields={projectFields} describe={(p) => `${p.title} (${p.status === 'completed' ? 'completed' : 'in progress'})`} {...shared} />}
      {tab === 'skills' && <CrudManager title="Skill" resource="skills" fields={skillFields} describe={(s) => `${s.name} (${s.category})`} {...shared} />}
      {tab === 'education' && <CrudManager title="Education" resource="education" fields={educationFields} describe={(e) => `${e.degree} – ${e.institution}`} {...shared} />}
      {tab === 'experience' && <CrudManager title="Experience" resource="experience" fields={experienceFields} describe={(e) => `${e.title}${e.company ? ` – ${e.company}` : ''}`} {...shared} />}
      {tab === 'services' && <CrudManager title="Service" resource="services" fields={serviceFields} describe={(s) => s.title} {...shared} />}
      {tab === 'social' && <CrudManager title="Social link" resource="social-links" fields={socialFields} describe={(l) => `${l.platform} – ${l.url}`} {...shared} />}
      {tab === 'settings' && <SingletonForm title="Site settings" resource="settings" fields={settingsFields} intro="Toggle sections on or off and edit headings and text. Hidden sections disappear from the page and navigation." {...shared} />}
    </AdminShell>
  );
}
