export function Spinner({ label = 'Loading…', className = '' }) {
  return (
    <div className={`d-flex align-items-center justify-content-center gap-2 py-5 ${className}`} role="status">
      <span className="spinner-border spinner-border-sm" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function Alert({ kind = 'error', children, onClose }) {
  if (!children) return null;
  return (
    <p className={kind === 'error' ? 'admin-error' : 'admin-notice'} role={kind === 'error' ? 'alert' : 'status'}>
      {children}
      {onClose && <button type="button" className="btn-close btn-close-white float-end" aria-label="Dismiss" onClick={onClose} />}
    </p>
  );
}

export function Section({ id, title, children }) {
  return (
    <section id={id} className="container">
      <h2 className="section-title">{title}</h2>
      {children}
    </section>
  );
}

export function TimelineItem({ icon, title, subtitle, date, children }) {
  return (
    <div className="timeline-item">
      <div className="timeline-icon"><i className={icon} /></div>
      <div className="timeline-content">
        <h3>{title}</h3>
        {subtitle && <span className="timeline-subtitle">{subtitle}</span>}
        {date && <span className="timeline-date">{date}</span>}
        {children && <p>{children}</p>}
      </div>
    </div>
  );
}

export const dateRange = (start, end) => [start, end].filter(Boolean).join(' – ');
