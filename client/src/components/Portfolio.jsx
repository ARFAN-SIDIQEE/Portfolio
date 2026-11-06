import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { emailConfigured, sendContactEmail } from '../emailjs.js';
import { Alert, Section, Spinner, TimelineItem, dateRange } from './ui.jsx';

const NAV = ['about', 'skills', 'projects', 'services', 'experience', 'education', 'contact'];
const DEFAULT_TITLES = {
  about: 'About Me', skills: 'My Skills', projects: 'Featured Projects', services: 'Free Services',
  experience: 'Experience', education: 'Education', contact: "Let's Connect",
};

export default function Portfolio() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const load = useCallback(() => {
    setError('');
    api.getPortfolio().then(setData).catch((reason) => setError(reason.message));
  }, []);

  useEffect(() => {
    load();
    const onScroll = () => document.getElementById('header')?.classList.toggle('scrolled', window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [load]);

  useEffect(() => {
    if (!data) return;
    const { siteTitle, metaDescription } = data.settings;
    if (siteTitle) document.title = siteTitle;
    if (metaDescription) document.querySelector('meta[name="description"]')?.setAttribute('content', metaDescription);
  }, [data]);

  if (!data) {
    return (
      <main className="container py-5">
        {error ? (
          <div className="text-center py-5">
            <Alert>{`The portfolio could not load: ${error}`}</Alert>
            <button className="btn btn-primary" onClick={load}>Try again</button>
          </div>
        ) : <Spinner label="Loading portfolio…" />}
      </main>
    );
  }

  const { profile, settings, projects, skills, services, education, experience, socialLinks } = data;
  const shown = (id) => settings.sections?.[id] !== false;
  const titleOf = (id) => settings.sectionTitles?.[id] || DEFAULT_TITLES[id];
  const hasContent = { about: true, skills: skills.length > 0, projects: projects.length > 0, services: services.length > 0, experience: experience.length > 0, education: education.length > 0, contact: true };
  const visible = (id) => shown(id) && hasContent[id];
  const [firstName, ...rest] = (profile.fullName || '').split(' ');
  const logoName = firstName || 'Portfolio';
  const github = socialLinks.find((link) => /github/i.test(link.platform));

  return (
    <>
      <div className="bg-blobs" aria-hidden="true"><div className="blob blob-1" /><div className="blob blob-2" /></div>
      <header id="header">
        <nav className="container">
          <a href="#hero" className="logo">{logoName}<span>.</span></a>
          <ul className={`nav-links ${menuOpen ? 'active' : ''}`}>
            {NAV.filter(visible).map((id) => (
              <li key={id}><a href={`#${id}`} className="nav-link" onClick={() => setMenuOpen(false)}>{id[0].toUpperCase() + id.slice(1)}</a></li>
            ))}
          </ul>
          <button className="mobile-toggle" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
            <i className={`fas ${menuOpen ? 'fa-times' : 'fa-bars'}`} />
          </button>
        </nav>
      </header>

      <main>
        <Hero profile={profile} firstName={firstName} lastName={rest.join(' ')} showProjects={visible('projects')} showContact={visible('contact')} />

        {visible('about') && (
          <Section id="about" title={titleOf('about')}>
            <div className="about-grid glass-card">
              <div className="about-text">
                {profile.aboutParagraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
                {profile.resumeUrl && <a href={profile.resumeUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline mt-2"><i className="fas fa-file-arrow-down" /> Resume</a>}
              </div>
              <div className="about-stats">
                {profile.aboutStats.map((stat, index) => (
                  <div className="stat-item" key={index}>
                    <span className="stat-value">{stat.icon ? <i className={stat.icon} /> : stat.value}</span>
                    <span className="stat-label">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </Section>
        )}

        {visible('skills') && (
          <Section id="skills" title={titleOf('skills')}>
            <div className="skills-wrapper">
              <SkillGroup title="Technical Skills" icon="fas fa-laptop-code" skills={skills.filter((skill) => skill.category === 'Technical')} />
              <SkillGroup title="Soft Skills" icon="fas fa-users" skills={skills.filter((skill) => skill.category === 'Soft')} />
            </div>
          </Section>
        )}

        {visible('projects') && (
          <Section id="projects" title={titleOf('projects')}>
            <div className="projects-grid">{projects.map((project) => <ProjectCard key={project._id} project={project} />)}</div>
            {github && settings.projectsFooterText && (
              <div className="more-projects">
                <p>{settings.projectsFooterText}</p>
                <a href={github.url} target="_blank" rel="noreferrer" className="btn btn-secondary">Visit GitHub <i className="fas fa-arrow-right" /></a>
              </div>
            )}
          </Section>
        )}

        {visible('services') && (
          <Section id="services" title={titleOf('services')}>
            <div className="services-grid">
              {services.map((service) => (
                <article className="service-card glass-card" key={service._id}>
                  <div className="service-icon"><i className={service.icon || 'fas fa-code'} /></div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                  {service.price && <span className="service-price">{service.price}</span>}
                </article>
              ))}
            </div>
          </Section>
        )}

        {visible('experience') && (
          <Section id="experience" title={titleOf('experience')}>
            <div className="timeline">
              {experience.map((item) => (
                <TimelineItem key={item._id} icon="fas fa-briefcase" title={item.title} subtitle={item.company} date={dateRange(item.startDate, item.endDate)}>{item.description}</TimelineItem>
              ))}
            </div>
          </Section>
        )}

        {visible('education') && (
          <Section id="education" title={titleOf('education')}>
            <div className="timeline">
              {education.map((item) => (
                <TimelineItem key={item._id} icon="fas fa-graduation-cap" title={item.degree} subtitle={item.institution} date={dateRange(item.startDate, item.endDate)}>{item.description}</TimelineItem>
              ))}
            </div>
          </Section>
        )}

        {visible('contact') && <Contact title={titleOf('contact')} profile={profile} settings={settings} socialLinks={socialLinks} />}
      </main>

      <footer>
        <div className="container footer-content">
          <div className="logo">{logoName}<span>.</span></div>
          <p>© {new Date().getFullYear()} {profile.fullName}. {settings.footerText}</p>
          <div className="social-links">
            {socialLinks.map((link) => (
              <a key={link._id} href={link.url} target={link.url.startsWith('http') ? '_blank' : undefined} rel="noreferrer" aria-label={link.platform}><i className={link.icon} /></a>
            ))}
            <a href="/admin" aria-label="Admin dashboard" title="Admin"><i className="fas fa-lock" /></a>
          </div>
        </div>
      </footer>
    </>
  );
}

function Hero({ profile, firstName, lastName, showProjects, showContact }) {
  return (
    <section id="hero" className="container">
      <div className="hero-content">
        {profile.avatarUrl && <img className="hero-avatar" src={profile.avatarUrl} alt={profile.fullName} width="140" height="140" />}
        {profile.badge && <span className="badge">{profile.badge}</span>}
        <h1 className="hero-title">Hi, I'm <span className="gradient-text">{[firstName, lastName].filter(Boolean).join(' ')}</span></h1>
        {profile.headline && <h2 className="hero-subtitle">{profile.headline}</h2>}
        <p className="hero-desc">{profile.heroDescription}</p>
        <div className="hero-cta">
          {showProjects && <a href="#projects" className="btn btn-primary">View Projects</a>}
          {showContact && <a href="#contact" className="btn btn-secondary">Get In Touch</a>}
        </div>
      </div>
    </section>
  );
}

function SkillGroup({ title, icon, skills }) {
  if (!skills.length) return null;
  return (
    <div className="skills-category glass-card">
      <h3><i className={icon} /> {title}</h3>
      <div className="skills-grid">
        {skills.map((skill) => <div className="skill-item" key={skill._id}><i className={skill.icon || 'fas fa-star'} /> {skill.name}</div>)}
      </div>
    </div>
  );
}

function ProjectCard({ project }) {
  return (
    <article className="project-card glass-card">
      {project.imageUrl && <img className="project-image" src={project.imageUrl} alt={`${project.title} screenshot`} loading="lazy" />}
      <div className="project-content">
        <span className={`project-badge status-${project.status}`}>{project.category || 'Project'} · {project.status === 'completed' ? 'Completed' : 'In Progress'}</span>
        <h3>{project.title}</h3>
        <p>{project.description}</p>
        <ul className="project-tech">{project.technologies.map((technology) => <li key={technology}>{technology}</li>)}</ul>
        <div className="project-links">
          {project.sourceUrl && <a href={project.sourceUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline"><i className="fab fa-github" /> Source Code</a>}
          {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline"><i className="fas fa-arrow-up-right-from-square" /> Live Demo</a>}
        </div>
      </div>
    </article>
  );
}

function Contact({ title, profile, settings, socialLinks }) {
  const [state, setState] = useState({ loading: false, message: '', error: false });

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    if (values.website) return; // honeypot: bots fill hidden fields
    setState({ loading: true, message: '', error: false });
    try {
      await sendContactEmail(values);
      form.reset();
      setState({ loading: false, message: 'Thanks for reaching out. Your message has been sent.', error: false });
    } catch (error) {
      setState({ loading: false, message: error.message, error: true });
    }
  }

  return (
    <Section id="contact" title={title}>
      <div className="contact-wrapper glass-card">
        <div className="contact-info">
          {settings.contactIntro && <p>{settings.contactIntro}</p>}
          <div className="contact-methods">
            {profile.whatsapp && <a href={`https://wa.me/${profile.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="contact-method"><i className="fab fa-whatsapp" /><span>WhatsApp</span></a>}
            {profile.email && <a href={`mailto:${profile.email}`} className="contact-method"><i className="fas fa-envelope" /><span>{profile.email}</span></a>}
            {socialLinks.filter((link) => !/whatsapp/i.test(link.platform)).map((link) => (
              <a key={link._id} href={link.url} target="_blank" rel="noreferrer" className="contact-method"><i className={link.icon} /><span>{link.platform}</span></a>
            ))}
          </div>
        </div>
        <form className="contact-form" onSubmit={submit}>
          <div className="form-group"><input name="name" type="text" placeholder="Your Name" autoComplete="name" maxLength="80" required /></div>
          <div className="form-group"><input name="email" type="email" placeholder="Your Email" autoComplete="email" maxLength="254" required /></div>
          <div className="form-group"><textarea name="message" rows="4" placeholder="Your Message" maxLength="5000" required /></div>
          <input name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }} />
          <button type="submit" className="btn btn-primary btn-block" disabled={state.loading || !emailConfigured}>
            {state.loading ? 'Sending…' : 'Send Message'}
          </button>
          {!emailConfigured && <p className="form-feedback error" role="status">The contact form is not configured yet. Please use the links on the left.</p>}
          {state.message && <p className={`form-feedback ${state.error ? 'error' : ''}`} role="status">{state.message}</p>}
        </form>
      </div>
    </Section>
  );
}
