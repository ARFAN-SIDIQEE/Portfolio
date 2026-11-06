import { useState } from 'react';
import { api } from '../../api.js';

/* ---- value <-> form conversion, keyed by field type ---- */
const converters = {
  tags: {
    toForm: (value) => (value || []).join(', '),
    toApi: (value) => String(value || '').split(',').map((item) => item.trim()).filter(Boolean),
  },
  lines: {
    toForm: (value) => (value || []).join('\n'),
    toApi: (value) => String(value || '').split('\n').map((item) => item.trim()).filter(Boolean),
  },
  // one stat per line: "value | label | icon class"
  stats: {
    toForm: (value) => (value || []).map((stat) => [stat.value || '', stat.label || '', stat.icon || ''].join(' | ')).join('\n'),
    toApi: (value) => String(value || '').split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
      const [stat, label, icon] = line.split('|').map((part) => part.trim());
      return { value: stat || undefined, label: label || undefined, icon: icon || undefined };
    }),
  },
  number: {
    toForm: (value) => (value ?? 0),
    toApi: (value) => (value === '' || value == null ? 0 : parseInt(value, 10) || 0),
  },
  checkbox: { toForm: (value) => value !== false, toApi: (value) => Boolean(value) },
};

/** Builds the initial form state for a field list from an existing item (or defaults). */
export function toFormValues(fields, item = {}) {
  const values = {};
  for (const field of fields) {
    if (field.type === 'image') {
      values[field.name] = item[field.name] || '';
      values[field.idName] = item[field.idName] || '';
      continue;
    }
    const raw = field.nested ? item[field.nested]?.[field.name] : item[field.name];
    const convert = converters[field.type]?.toForm;
    const fallback = raw === undefined ? field.default : raw;
    values[field.key || field.name] = convert ? convert(fallback) : (fallback ?? '');
  }
  return values;
}

/** Converts form state back into the API payload, re-nesting grouped fields. */
export function toApiPayload(fields, values) {
  const payload = {};
  for (const field of fields) {
    if (field.type === 'image') {
      payload[field.name] = values[field.name] || '';
      payload[field.idName] = values[field.idName] || '';
      continue;
    }
    const convert = converters[field.type]?.toApi;
    const value = convert ? convert(values[field.key || field.name]) : values[field.key || field.name];
    if (field.nested) (payload[field.nested] ||= {})[field.name] = value;
    else payload[field.name] = value;
  }
  return payload;
}

export function ImageUploader({ field, values, onChange, token, onError }) {
  const [busy, setBusy] = useState(false);
  const url = values[field.name];

  async function pick(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return onError('Images must be 5 MB or smaller.');
    setBusy(true);
    try {
      const uploaded = await api.uploadImage(file, token);
      onChange({ [field.name]: uploaded.url, [field.idName]: uploaded.publicId });
      onError('');
    } catch (reason) {
      onError(reason.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-2">
      <span className="d-block mb-1">{field.label}</span>
      {url && <img className="admin-preview" src={url} alt="Preview" />}
      <div className="d-flex gap-2 align-items-center flex-wrap">
        <input className="form-control" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={pick} disabled={busy} aria-label={field.label} />
        {busy && <span className="spinner-border spinner-border-sm" role="status" aria-label="Uploading" />}
        {url && !busy && <button type="button" className="btn btn-sm btn-outline" onClick={() => onChange({ [field.name]: '', [field.idName]: '' })}>Remove</button>}
      </div>
    </div>
  );
}

export function FieldInput({ field, values, setValues, token, onError }) {
  if (field.type === 'image') {
    return <ImageUploader field={field} values={values} token={token} onError={onError} onChange={(patch) => setValues((current) => ({ ...current, ...patch }))} />;
  }
  const key = field.key || field.name;
  const value = values[key];
  const set = (next) => setValues((current) => ({ ...current, [key]: next }));
  const common = { id: `f-${key}`, name: key, required: field.required, maxLength: field.maxLength, placeholder: field.placeholder };

  if (field.type === 'checkbox') {
    return (
      <div className="form-check form-switch mb-2">
        <input className="form-check-input" type="checkbox" role="switch" id={common.id} checked={Boolean(value)} onChange={(event) => set(event.target.checked)} />
        <label className="form-check-label" htmlFor={common.id}>{field.label}</label>
      </div>
    );
  }
  return (
    <label className="d-block mb-2" htmlFor={common.id}>
      {field.label}
      {field.type === 'textarea' || field.type === 'lines' || field.type === 'stats' ? (
        <textarea className="form-control" rows={field.rows || 3} {...common} value={value} onChange={(event) => set(event.target.value)} />
      ) : field.type === 'select' ? (
        <select className="form-select" id={common.id} name={key} value={value} onChange={(event) => set(event.target.value)}>
          {field.options.map((option) => <option key={option.value ?? option} value={option.value ?? option}>{option.label ?? option}</option>)}
        </select>
      ) : (
        <input className="form-control" type={field.type === 'number' ? 'number' : field.type === 'url' ? 'url' : field.type === 'email' ? 'email' : 'text'} {...common} value={value} onChange={(event) => set(event.target.value)} />
      )}
      {field.help && <small className="d-block text-muted">{field.help}</small>}
    </label>
  );
}
