import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api.js';
import { Alert, Spinner } from '../ui.jsx';
import { FieldInput, toApiPayload, toFormValues } from './fields.jsx';

/**
 * Generic list + add/edit/delete screen for any list-type resource.
 * Driven entirely by `fields`, so every collection shares one implementation.
 */
export function CrudManager({ title, resource, fields, describe, token, onAuthError }) {
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null); // null = closed, {} = new, item = edit
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const fail = useCallback((reason) => {
    if (reason.status === 401) return onAuthError();
    setError(reason.message);
  }, [onAuthError]);

  const refresh = useCallback(() => api.list(resource).then(setItems).catch(fail), [resource, fail]);
  useEffect(() => { setItems(null); setEditing(null); refresh(); }, [refresh]);

  function open(item) {
    setEditing(item);
    setValues(toFormValues(fields, item));
    setError('');
    setNotice('');
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = toApiPayload(fields, values);
      if (editing._id) await api.update(resource, editing._id, payload, token);
      else await api.create(resource, payload, token);
      setEditing(null);
      setNotice(`${title} saved.`);
      setError('');
      await refresh();
    } catch (reason) { fail(reason); } finally { setSaving(false); }
  }

  async function remove(item) {
    if (!window.confirm(`Delete "${describe(item)}"? This cannot be undone.`)) return;
    try {
      await api.remove(resource, item._id, token);
      setNotice(`${title} deleted.`);
      setError('');
      await refresh();
    } catch (reason) { fail(reason); }
  }

  return (
    <section className="admin-card glass-card">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h2 className="m-0">{title}</h2>
        {!editing && <button className="btn btn-primary btn-sm" onClick={() => open({})}><i className="fas fa-plus" /> Add new</button>}
      </div>
      <Alert onClose={() => setError('')}>{error}</Alert>
      <Alert kind="notice" onClose={() => setNotice('')}>{notice}</Alert>

      {editing && (
        <form className="admin-form mb-4" onSubmit={save}>
          <h3 className="admin-subheading">{editing._id ? 'Edit' : 'Add'} {title.toLowerCase()}</h3>
          {fields.map((field) => <FieldInput key={field.key || field.name} field={field} values={values} setValues={setValues} token={token} onError={setError} />)}
          <div className="admin-actions">
            <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            <button className="btn btn-secondary" type="button" onClick={() => setEditing(null)} disabled={saving}>Cancel</button>
          </div>
        </form>
      )}

      {items === null ? <Spinner /> : items.length === 0 ? <p className="text-muted">Nothing here yet.</p> : items.map((item) => (
        <div className="admin-list-item" key={item._id}>
          <span>{describe(item)}</span>
          <div className="admin-actions">
            <button className="btn btn-sm btn-outline" onClick={() => open(item)}>Edit</button>
            <button className="btn btn-sm btn-outline" onClick={() => remove(item)}>Delete</button>
          </div>
        </div>
      ))}
    </section>
  );
}

/** Single-document editor (profile, settings). */
export function SingletonForm({ title, resource, fields, token, onAuthError, intro }) {
  const [values, setValues] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const fail = useCallback((reason) => {
    if (reason.status === 401) return onAuthError();
    setError(reason.message);
  }, [onAuthError]);

  useEffect(() => {
    setValues(null);
    api.getSingleton(resource).then((doc) => setValues(toFormValues(fields, doc))).catch(fail);
  }, [resource, fields, fail]);

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const saved = await api.saveSingleton(resource, toApiPayload(fields, values), token);
      setValues(toFormValues(fields, saved));
      setNotice(`${title} saved.`);
      setError('');
    } catch (reason) { fail(reason); } finally { setSaving(false); }
  }

  return (
    <section className="admin-card glass-card">
      <h2>{title}</h2>
      {intro && <p className="text-muted">{intro}</p>}
      <Alert onClose={() => setError('')}>{error}</Alert>
      <Alert kind="notice" onClose={() => setNotice('')}>{notice}</Alert>
      {values === null ? (error ? null : <Spinner />) : (
        <form className="admin-form" onSubmit={save}>
          {fields.map((field) => <FieldInput key={field.key || field.name} field={field} values={values} setValues={setValues} token={token} onError={setError} />)}
          <div className="admin-actions"><button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button></div>
        </form>
      )}
    </section>
  );
}
