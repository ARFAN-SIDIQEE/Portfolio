import { useEffect, useState } from 'react';
import { api } from './api.js';

const initialProjects = [{
  _id: 'fundraising-system',
  title: 'Fundraising System',
  description: 'Developed a fundraising system to help manage and track donations efficiently. Designed the user interface focusing on usability and simple navigation.',
  technologies: ['HTML', 'CSS', 'JavaScript'],
  status: 'completed',
  category: 'Semester Project',
  sourceUrl: 'https://github.com/ARFAN-SIDIQEE/fundraising-system',
  liveUrl: 'https://fundraising-system.vercel.app',
}];

const initialSkills = [
  { _id: 'html', name: 'HTML', category: 'Technical', icon: 'fab fa-html5' },
  { _id: 'css', name: 'CSS', category: 'Technical', icon: 'fab fa-css3-alt' },
  { _id: 'javascript', name: 'JavaScript', category: 'Technical', icon: 'fab fa-js' },
  { _id: 'react', name: 'React (Learning)', category: 'Technical', icon: 'fab fa-react' },
  { _id: 'python', name: 'Python', category: 'Technical', icon: 'fab fa-python' },
  { _id: 'communication', name: 'Communication', category: 'Soft', icon: 'fas fa-comments' },
  { _id: 'teamwork', name: 'Teamwork', category: 'Soft', icon: 'fas fa-people-carry' },
  { _id: 'problem-solving', name: 'Problem-solving', category: 'Soft', icon: 'fas fa-lightbulb' },
];

function Portfolio() {
  const [projects, setProjects] = useState(initialProjects);
  const [skills, setSkills] = useState(initialSkills);
  const [dataError, setDataError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [formState, setFormState] = useState({ loading: false, message: '', error: false });

  useEffect(() => {
    let active = true;
    api.getProjects().then((items) => active && setProjects(items))
      .catch((error) => active && setDataError(`Projects could not load: ${error.message}`));
    api.getSkills().then((items) => active && setSkills(items))
      .catch((error) => active && setDataError(`Skills could not load: ${error.message}`));
    const onScroll = () => document.getElementById('header')?.classList.toggle('scrolled', window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => {
      active = false;
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  async function submitContact(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setFormState({ loading: true, message: '', error: false });
    try {
      await api.sendMessage(Object.fromEntries(new FormData(form)));
      form.reset();
      setFormState({ loading: false, message: 'Thanks for reaching out. Your message has been sent.', error: false });
    } catch (error) {
      setFormState({ loading: false, message: error.message, error: true });
    }
  }

  const technicalSkills = skills.filter((skill) => skill.category === 'Technical');
  const softSkills = skills.filter((skill) => skill.category === 'Soft');

  return (
    <>
      <div className="bg-blobs" aria-hidden="true"><div className="blob blob-1" /><div className="blob blob-2" /></div>
      <header id="header">
        <nav className="container">
          <a href="#hero" className="logo">Arfan<span>.</span></a>
          <ul className={`nav-links ${menuOpen ? 'active' : ''}`}>
            {['about', 'skills', 'projects', 'experience', 'contact'].map((id) => (
              <li key={id}><a href={`#${id}`} className="nav-link" onClick={() => setMenuOpen(false)}>{id[0].toUpperCase() + id.slice(1)}</a></li>
            ))}
          </ul>
          <button className="mobile-toggle" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
            <i className={`fas ${menuOpen ? 'fa-times' : 'fa-bars'}`} />
          </button>
        </nav>
      </header>

      <main>
        {dataError && <div className="container"><p className="admin-error" role="alert">{dataError}</p></div>}
        <section id="hero" className="container">
          <div className="hero-content">
            <span className="badge">BS Software Engineering (5th Semester)</span>
            <h1 className="hero-title">Hi, I'm <span className="gradient-text">Arfan Sidiqee</span></h1>
            <h2 className="hero-subtitle">Aspiring Front-End Developer</h2>
            <p className="hero-desc">I enjoy building responsive and user-friendly web applications using modern technologies. Continuously learning and improving to become a professional developer!</p>
            <div className="hero-cta">
              <a href="#projects" className="btn btn-primary">View Projects</a>
              <a href="#contact" className="btn btn-secondary">Get In Touch</a>
            </div>
          </div>
        </section>

        <section id="about" className="container">
          <h2 className="section-title">About Me</h2>
          <div className="about-grid glass-card">
            <div className="about-text">
              <p>I am a dedicated BS Software Engineering student currently in my 5th semester, with a strong interest in front-end development. I enjoy bringing ideas to life in the browser and creating intuitive digital experiences.</p>
              <p>My journey in software engineering has equipped me with a solid foundation in core web technologies, problem-solving, and teamwork. I am currently focusing on mastering React while actively seeking opportunities to gain professional experience.</p>
            </div>
            <div className="about-stats">
              <div className="stat-item"><span className="stat-value">5th</span><span className="stat-label">Semester<br />Student</span></div>
              <div className="stat-item"><span className="stat-value"><i className="fas fa-code" /></span><span className="stat-label">Frontend<br />Focused</span></div>
            </div>
          </div>
        </section>

        <section id="skills" className="container">
          <h2 className="section-title">My Skills</h2>
          <div className="skills-wrapper">
            <SkillGroup title="Technical Skills" icon="fas fa-laptop-code" skills={technicalSkills} />
            <SkillGroup title="Soft Skills" icon="fas fa-users" skills={softSkills} />
          </div>
        </section>

        <section id="projects" className="container">
          <h2 className="section-title">Featured Projects</h2>
          <div className="projects-grid">
            {projects.map((project) => (
              <article className="project-card glass-card" key={project._id}>
                <div className="project-content">
                  <span className={`project-badge status-${project.status}`}>{project.category || 'Project'} · {project.status === 'completed' ? 'Completed' : 'In Progress'}</span>
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                  <ul className="project-tech">{project.technologies.map((technology) => <li key={technology}>{technology}</li>)}</ul>
                  <div className="project-links">
                    {project.sourceUrl && <a href={project.sourceUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline"><i className="fab fa-github" /> Source Code</a>}
                    {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline">Visit Project</a>}
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="more-projects">
            <p>Explore more of my work and code samples on GitHub</p>
            <a href="https://github.com/ARFAN-SIDIQEE" target="_blank" rel="noreferrer" className="btn btn-secondary">Visit GitHub <i className="fas fa-arrow-right" /></a>
          </div>
        </section>

        <section id="experience" className="container">
          <h2 className="section-title">Background</h2>
          <div className="timeline">
            <TimelineItem icon="fas fa-graduation-cap" title="BS Software Engineering" date="Current (5th Semester)">Building a strong academic foundation in software engineering principles, algorithms, and web app development technologies.</TimelineItem>
            <TimelineItem icon="fas fa-briefcase" title="Open to Opportunities" date="Present">Currently seeking opportunities to gain professional experience in front-end development. Open to internships and entry-level roles where I can contribute to exciting projects.</TimelineItem>
          </div>
        </section>

        <section id="contact" className="container">
          <h2 className="section-title">Let's Connect</h2>
          <div className="contact-wrapper glass-card">
            <div className="contact-info">
              <p>I'm always open to discussing new projects, exchanging ideas, or talking about potential roles and collaborations.</p>
              <div className="contact-methods">
                <a href="https://wa.me/923554450320" target="_blank" rel="noreferrer" className="contact-method"><i className="fab fa-whatsapp" /><span>WhatsApp</span></a>
                <a href="mailto:arfansidiqee@gmail.com" className="contact-method"><i className="fas fa-envelope" /><span>arfansidiqee@gmail.com</span></a>
                <a href="https://github.com/ARFAN-SIDIQEE" target="_blank" rel="noreferrer" className="contact-method"><i className="fab fa-github" /><span>GitHub/Profile</span></a>
              </div>
            </div>
            <form className="contact-form" onSubmit={submitContact}>
              <div className="form-group"><input name="name" type="text" placeholder="Your Name" autoComplete="name" maxLength="80" required /></div>
              <div className="form-group"><input name="email" type="email" placeholder="Your Email" autoComplete="email" maxLength="254" required /></div>
              <div className="form-group"><textarea name="message" rows="4" placeholder="Your Message" maxLength="5000" required /></div>
              <button type="submit" className="btn btn-primary btn-block" disabled={formState.loading}>{formState.loading ? 'Sending…' : 'Send Message'}</button>
              {formState.message && <p className={`form-feedback ${formState.error ? 'error' : ''}`} role="status">{formState.message}</p>}
            </form>
          </div>
        </section>
      </main>

      <footer>
        <div className="container footer-content">
          <div className="logo">Arfan<span>.</span></div>
          <p>© {new Date().getFullYear()} Arfan Sidiqee. Built with React & Bootstrap.</p>
          <div className="social-links">
            <a href="https://github.com/ARFAN-SIDIQEE" target="_blank" rel="noreferrer" aria-label="GitHub"><i className="fab fa-github" /></a>
            <a href="https://wa.me/923554450320" target="_blank" rel="noreferrer" aria-label="WhatsApp"><i className="fab fa-whatsapp" /></a>
            <a href="/admin" aria-label="Admin dashboard" title="Admin"><i className="fas fa-lock" /></a>
          </div>
        </div>
      </footer>
    </>
  );
}

function SkillGroup({ title, icon, skills }) {
  return <div className="skills-category glass-card"><h3><i className={icon} /> {title}</h3><div className="skills-grid">
    {skills.map((skill) => <div className="skill-item" key={skill._id}><i className={skill.icon || 'fas fa-star'} /> {skill.name}</div>)}
  </div></div>;
}

function TimelineItem({ icon, title, date, children }) {
  return <div className="timeline-item"><div className="timeline-icon"><i className={icon} /></div><div className="timeline-content"><h3>{title}</h3><span className="timeline-date">{date}</span><p>{children}</p></div></div>;
}

function Admin() {
  const [token, setToken] = useState(() => localStorage.getItem('adminToken') || '');
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [skillEdit, setSkillEdit] = useState(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  async function refresh() {
    const [projectList, skillList] = await Promise.all([api.getProjects(), api.getSkills()]);
    setProjects(projectList);
    setSkills(skillList);
  }

  useEffect(() => {
    if (token) refresh().catch((reason) => setError(reason.message));
  }, [token]);

  async function login(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const result = await api.login(values);
      localStorage.setItem('adminToken', result.accessToken);
      setToken(result.accessToken);
      setError('');
    } catch (reason) {
      setError(reason.message);
    }
  }

  async function createProject(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    values.technologies = values.technologies.split(',').map((item) => item.trim()).filter(Boolean);
    try {
      await api.createProject(values, token);
      form.reset();
      await refresh();
      setNotice('Project added.');
      setError('');
    } catch (reason) { setError(reason.message); }
  }

  async function changeStatus(project, status) {
    try {
      await api.updateProject(project._id, { status }, token);
      await refresh();
      setNotice('Project status updated.');
      setError('');
    } catch (reason) { setError(reason.message); }
  }

  async function saveSkill(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (skillEdit?._id) await api.updateSkill(skillEdit._id, values, token);
      else await api.createSkill(values, token);
      setSkillEdit(null);
      await refresh();
      setNotice('Skill saved.');
      setError('');
    } catch (reason) { setError(reason.message); }
  }

  async function removeSkill(id) {
    try {
      await api.deleteSkill(id, token);
      await refresh();
      setNotice('Skill removed.');
      setError('');
    } catch (reason) { setError(reason.message); }
  }

  if (!token) return <AdminShell><a className="admin-back" href="/">← Back to portfolio</a><section className="admin-card glass-card">
    <h1>Admin sign in</h1><form onSubmit={login} className="admin-form">
      <label>Username<input name="username" className="form-control" autoComplete="username" required /></label>
      <label>Password<input name="password" type="password" className="form-control" autoComplete="current-password" required /></label>
      <button className="btn btn-primary" type="submit">Sign in</button>
    </form>{error && <p className="admin-error" role="alert">{error}</p>}
  </section></AdminShell>;

  return <AdminShell>
    <div className="admin-heading"><div><a className="admin-back" href="/">← View portfolio</a><h1>Portfolio admin</h1></div>
      <button className="btn btn-secondary" onClick={() => { localStorage.removeItem('adminToken'); setToken(''); }}>Sign out</button>
    </div>
    {error && <p className="admin-error" role="alert">{error}</p>}{notice && <p className="admin-notice" role="status">{notice}</p>}
    <div className="admin-columns">
      <section className="admin-card glass-card">
        <h2>Add project</h2>
        <form className="admin-form" onSubmit={createProject}>
          <label>Title<input className="form-control" name="title" maxLength="120" required /></label>
          <label>Description<textarea className="form-control" name="description" maxLength="2000" rows="3" required /></label>
          <label>Technologies (comma separated)<input className="form-control" name="technologies" placeholder="React, Node.js" required /></label>
          <label>Category<input className="form-control" name="category" maxLength="80" placeholder="Personal Project" /></label>
          <label>Status<select className="form-select" name="status" defaultValue="in-progress"><option value="in-progress">In progress</option><option value="completed">Completed</option></select></label>
          <label>Source URL<input className="form-control" name="sourceUrl" type="url" /></label>
          <label>Live URL<input className="form-control" name="liveUrl" type="url" /></label>
          <button className="btn btn-primary" type="submit">Add project</button>
        </form>
        <h3 className="admin-subheading">Projects</h3>
        {projects.map((project) => <div className="admin-list-item" key={project._id}>
          <span>{project.title}</span><select className="form-select" aria-label={`Status for ${project.title}`} value={project.status} onChange={(event) => changeStatus(project, event.target.value)}>
            <option value="in-progress">In progress</option><option value="completed">Completed</option>
          </select>
        </div>)}
      </section>
      <section className="admin-card glass-card">
        <h2>{skillEdit ? 'Update skill' : 'Add skill'}</h2>
        <form className="admin-form" onSubmit={saveSkill} key={skillEdit?._id || 'new-skill'}>
          <label>Skill name<input className="form-control" name="name" maxLength="80" defaultValue={skillEdit?.name || ''} required /></label>
          <label>Category<select className="form-select" name="category" defaultValue={skillEdit?.category || 'Technical'}><option>Technical</option><option>Soft</option></select></label>
          <label>Icon class (Font Awesome)<input className="form-control" name="icon" maxLength="80" defaultValue={skillEdit?.icon || 'fas fa-star'} /></label>
          <div className="admin-actions"><button className="btn btn-primary" type="submit">{skillEdit ? 'Save changes' : 'Add skill'}</button>{skillEdit && <button type="button" className="btn btn-secondary" onClick={() => setSkillEdit(null)}>Cancel</button>}</div>
        </form>
        <h3 className="admin-subheading">Skills shown on portfolio</h3>
        {skills.map((skill) => <div className="admin-list-item" key={skill._id}>
          <span><i className={skill.icon || 'fas fa-star'} /> {skill.name} <small>({skill.category})</small></span>
          <div className="admin-actions"><button className="btn btn-sm btn-outline" onClick={() => setSkillEdit(skill)}>Edit</button><button className="btn btn-sm btn-outline" onClick={() => removeSkill(skill._id)}>Remove</button></div>
        </div>)}
      </section>
    </div>
  </AdminShell>;
}

function AdminShell({ children }) {
  return <main className="admin-page"><div className="bg-blobs" aria-hidden="true"><div className="blob blob-1" /><div className="blob blob-2" /></div><div className="admin-container">{children}</div></main>;
}

export default function App() {
  return window.location.pathname.replace(/\/+$/, '') === '/admin' ? <Admin /> : <Portfolio />;
}
