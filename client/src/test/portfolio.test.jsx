import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import Portfolio from '../components/Portfolio.jsx';
import { fail, mockFetch, portfolio } from './fixtures.js';

const clone = () => structuredClone(portfolio);

describe('public portfolio', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('shows a loading state, then every section from the API (no hardcoded content)', async () => {
    vi.stubGlobal('fetch', mockFetch({ 'GET /portfolio': portfolio }));
    render(<Portfolio />);
    expect(screen.getByRole('status')).toHaveTextContent(/loading portfolio/i);

    expect(await screen.findByText('API Headline')).toBeInTheDocument();
    for (const text of [
      'API Badge', 'API hero text', 'API about one', 'API about two', 'API Stat', 'API Tech Skill', 'API Soft Skill',
      'API Project', 'API project desc', 'API Service', 'API service desc', 'API Role', 'API Co', 'API Degree', 'API Uni',
      'API contact intro', 'API projects footer', 'zed@example.com',
    ]) expect(screen.getAllByText(new RegExp(text)).length).toBeGreaterThan(0);

    // custom headings + links + images come from settings / data
    expect(screen.getByRole('heading', { name: 'API About Heading' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'API Projects Heading' })).toBeInTheDocument();
    expect(screen.getByAltText('Zed Tester')).toHaveAttribute('src', 'https://img.test/avatar.png');
    expect(screen.getByAltText('API Project screenshot')).toHaveAttribute('src', 'https://img.test/p.png');
    expect(screen.getByRole('link', { name: /Source Code/ })).toHaveAttribute('href', 'https://github.com/x/api');
    expect(screen.getByRole('link', { name: /Live Demo/ })).toHaveAttribute('href', 'https://live.test');
    expect(screen.getByRole('link', { name: /whatsapp/i })).toHaveAttribute('href', 'https://wa.me/15550001111');
    expect(document.title).toBe('API Site Title');

    // the original hardcoded copy must not appear anywhere
    for (const old of ['Fundraising System', 'Aspiring Front-End Developer', 'arfansidiqee@gmail.com', 'Semester Student']) {
      expect(screen.queryByText(new RegExp(old))).not.toBeInTheDocument();
    }
  });

  it('hides sections switched off in settings, including their nav links', async () => {
    const data = clone();
    data.settings.sections.projects = false;
    data.settings.sections.services = false;
    vi.stubGlobal('fetch', mockFetch({ 'GET /portfolio': data }));
    render(<Portfolio />);
    await screen.findByText('API Headline');

    expect(document.getElementById('projects')).toBeNull();
    expect(document.getElementById('services')).toBeNull();
    expect(screen.queryByText('API Project')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Projects' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Services' })).not.toBeInTheDocument();
    expect(document.getElementById('skills')).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Skills' })).toBeInTheDocument();
  });

  it('omits empty collections instead of showing empty sections', async () => {
    const data = clone();
    data.education = [];
    data.skills = [];
    vi.stubGlobal('fetch', mockFetch({ 'GET /portfolio': data }));
    render(<Portfolio />);
    await screen.findByText('API Headline');
    expect(document.getElementById('education')).toBeNull();
    expect(document.getElementById('skills')).toBeNull();
  });

  it('shows an error with retry and NO fallback content when the API fails', async () => {
    let healthy = false;
    vi.stubGlobal('fetch', mockFetch({ 'GET /portfolio': () => (healthy ? portfolio : fail(500, 'Database unavailable')) }));
    render(<Portfolio />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Database unavailable');
    expect(screen.queryByText('Fundraising System')).not.toBeInTheDocument();
    expect(screen.queryByText('API Project')).not.toBeInTheDocument();

    healthy = true;
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(await screen.findByText('API Headline')).toBeInTheDocument();
  });

  it('reports an unreachable server clearly', async () => {
    vi.stubGlobal('fetch', async () => { throw new TypeError('Failed to fetch'); });
    render(<Portfolio />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/cannot reach the server/i);
  });
});

describe('contact form + EmailJS', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules(); vi.doUnmock('@emailjs/browser'); });

  async function loadWithEnv(env, send) {
    vi.resetModules();
    for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
    vi.doMock('@emailjs/browser', () => ({ default: { send } }));
    vi.stubGlobal('fetch', mockFetch({ 'GET /portfolio': portfolio }));
    const { default: Fresh } = await import('../components/Portfolio.jsx');
    return Fresh;
  }

  const configured = { VITE_EMAILJS_SERVICE_ID: 'svc_x', VITE_EMAILJS_TEMPLATE_ID: 'tpl_x', VITE_EMAILJS_PUBLIC_KEY: 'pub_x' };

  it('disables the form and explains why when EmailJS is not configured', async () => {
    const send = vi.fn();
    const Fresh = await loadWithEnv({ VITE_EMAILJS_SERVICE_ID: '', VITE_EMAILJS_TEMPLATE_ID: '', VITE_EMAILJS_PUBLIC_KEY: '' }, send);
    render(<Fresh />);
    await screen.findByText('API Headline');
    expect(screen.getByRole('button', { name: /send message/i })).toBeDisabled();
    expect(screen.getByText(/not configured yet/i)).toBeInTheDocument();
    expect(send).not.toHaveBeenCalled();
  });

  it('sends name/email/message to EmailJS with the configured ids and public key', async () => {
    const send = vi.fn().mockResolvedValue({ status: 200 });
    const Fresh = await loadWithEnv(configured, send);
    render(<Fresh />);
    await screen.findByText('API Headline');
    await userEvent.type(screen.getByPlaceholderText('Your Name'), 'Visitor');
    await userEvent.type(screen.getByPlaceholderText('Your Email'), 'v@example.com');
    await userEvent.type(screen.getByPlaceholderText('Your Message'), 'Hello there');
    await userEvent.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    expect(send).toHaveBeenCalledWith('svc_x', 'tpl_x',
      { from_name: 'Visitor', from_email: 'v@example.com', reply_to: 'v@example.com', message: 'Hello there' },
      { publicKey: 'pub_x' });
    expect(await screen.findByText(/your message has been sent/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Your Name')).toHaveValue('');
  });

  it('shows the EmailJS error and keeps the typed message when sending fails', async () => {
    const send = vi.fn().mockRejectedValue({ status: 412, text: 'The Public Key is invalid' });
    const Fresh = await loadWithEnv(configured, send);
    render(<Fresh />);
    await screen.findByText('API Headline');
    await userEvent.type(screen.getByPlaceholderText('Your Name'), 'Visitor');
    await userEvent.type(screen.getByPlaceholderText('Your Email'), 'v@example.com');
    await userEvent.type(screen.getByPlaceholderText('Your Message'), 'Keep me');
    await userEvent.click(screen.getByRole('button', { name: /send message/i }));
    expect(await screen.findByText(/Public Key is invalid/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Your Message')).toHaveValue('Keep me');
  });

  it('drops submissions that fill the honeypot field', async () => {
    const send = vi.fn().mockResolvedValue({});
    const Fresh = await loadWithEnv(configured, send);
    const { container } = render(<Fresh />);
    await screen.findByText('API Headline');
    await userEvent.type(screen.getByPlaceholderText('Your Name'), 'Bot');
    await userEvent.type(screen.getByPlaceholderText('Your Email'), 'b@example.com');
    await userEvent.type(screen.getByPlaceholderText('Your Message'), 'spam');
    await userEvent.type(container.querySelector('input[name="website"]'), 'http://spam');
    await userEvent.click(screen.getByRole('button', { name: /send message/i }));
    expect(send).not.toHaveBeenCalled();
  });
});
