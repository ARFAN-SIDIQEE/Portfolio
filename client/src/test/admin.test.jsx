import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import Admin from '../components/admin/Admin.jsx';
import { fail, mockFetch, portfolio } from './fixtures.js';

const profileDoc = { ...portfolio.profile, avatarPublicId: 'portfolio/av' };
const baseRoutes = () => ({
  'GET /auth/me': { username: 'admin' },
  'GET /profile': profileDoc,
  'GET /settings': portfolio.settings,
  'GET /projects': portfolio.projects,
  'GET /skills': portfolio.skills,
  'GET /services': [],
  'GET /education': portfolio.education,
  'GET /experience': portfolio.experience,
  'GET /social-links': portfolio.socialLinks,
});
const signedIn = () => localStorage.setItem('adminToken', 'tok');
const tab = (name) => userEvent.click(screen.getByRole('tab', { name: new RegExp(name, 'i') }));
const lastCall = (fetchMock, key) => [...fetchMock.calls].reverse().find((call) => call.key === key);

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('admin login', () => {
  it('shows an API error for wrong credentials and stays signed out', async () => {
    vi.stubGlobal('fetch', mockFetch({ 'POST /auth/login': fail(401, 'Invalid username or password.') }));
    render(<Admin />);
    await userEvent.type(screen.getByLabelText(/username/i), 'admin');
    await userEvent.type(screen.getByLabelText(/password/i), 'nope');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid username or password.');
    expect(localStorage.getItem('adminToken')).toBeNull();
  });

  it('shows the rate-limit message from the API', async () => {
    vi.stubGlobal('fetch', mockFetch({ 'POST /auth/login': fail(429, 'Too many failed login attempts. Try again in 15 minute(s).') }));
    render(<Admin />);
    await userEvent.type(screen.getByLabelText(/username/i), 'a');
    await userEvent.type(screen.getByLabelText(/password/i), 'b');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/too many failed login attempts/i);
  });

  it('stores the token on success and opens the dashboard; sign out clears it', async () => {
    vi.stubGlobal('fetch', mockFetch({ ...baseRoutes(), 'POST /auth/login': { accessToken: 'jwt-123' } }));
    render(<Admin />);
    await userEvent.type(screen.getByLabelText(/username/i), 'admin');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByRole('heading', { name: /portfolio admin/i })).toBeInTheDocument();
    expect(localStorage.getItem('adminToken')).toBe('jwt-123');
    await userEvent.click(screen.getByRole('button', { name: /sign out/i }));
    expect(localStorage.getItem('adminToken')).toBeNull();
    expect(screen.getByRole('heading', { name: /admin sign in/i })).toBeInTheDocument();
  });

  it('returns to sign-in with a message when the token is rejected (401)', async () => {
    signedIn();
    vi.stubGlobal('fetch', mockFetch({ ...baseRoutes(), 'GET /auth/me': fail(401, 'Invalid admin token.') }));
    render(<Admin />);
    expect(await screen.findByText(/session expired/i)).toBeInTheDocument();
    expect(localStorage.getItem('adminToken')).toBeNull();
  });
});

describe('admin dashboard', () => {
  it('shows a loading state, then the profile form filled from the API', async () => {
    signedIn();
    vi.stubGlobal('fetch', mockFetch(baseRoutes()));
    render(<Admin />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(await screen.findByLabelText(/full name/i)).toHaveValue('Zed Tester');
    expect(screen.getByLabelText(/about me/i)).toHaveValue('API about one\nAPI about two');
    expect(screen.getByAltText('Preview')).toHaveAttribute('src', 'https://img.test/avatar.png');
  });

  it('navigates every tab and loads each list from its API', async () => {
    signedIn();
    const fetchMock = mockFetch(baseRoutes());
    vi.stubGlobal('fetch', fetchMock);
    render(<Admin />);
    await screen.findByLabelText(/full name/i);

    const expectations = [
      ['Projects', 'API Project'], ['Skills', 'API Tech Skill'], ['Education', 'API Degree'],
      ['Experience', 'API Role'], ['Social links', 'GitHub'],
    ];
    for (const [name, text] of expectations) {
      await tab(name);
      expect(await screen.findByText(new RegExp(text))).toBeInTheDocument();
    }
    await tab('Services');
    expect(await screen.findByText(/nothing here yet/i)).toBeInTheDocument();
    await tab('Site settings');
    expect(await screen.findByLabelText(/show "projects" section/i)).toBeChecked();
    expect(screen.getByLabelText(/projects section heading/i)).toHaveValue('API Projects Heading');
  });

  it('saves the profile with the right payload (PUT, bearer token, converted fields)', async () => {
    signedIn();
    const fetchMock = mockFetch({ ...baseRoutes(), 'PUT /profile': (options) => JSON.parse(options.body) });
    vi.stubGlobal('fetch', fetchMock);
    render(<Admin />);
    const name = await screen.findByLabelText(/full name/i);
    await userEvent.clear(name);
    await userEvent.type(name, 'New Name');
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));
    expect(await screen.findByText(/profile saved/i)).toBeInTheDocument();
    const call = lastCall(fetchMock, 'PUT /profile');
    expect(call.options.headers.Authorization).toBe('Bearer tok');
    const body = JSON.parse(call.options.body);
    expect(body.fullName).toBe('New Name');
    expect(body.aboutParagraphs).toEqual(['API about one', 'API about two']);
    expect(body.aboutStats).toEqual([{ value: '9x', label: 'API Stat', icon: undefined }, { value: undefined, label: 'Icon Stat', icon: 'fas fa-code' }]);
    expect(body.avatarPublicId).toBe('portfolio/av');
  });

  it('shows API validation errors and keeps the form open', async () => {
    signedIn();
    vi.stubGlobal('fetch', mockFetch({ ...baseRoutes(), 'POST /projects': fail(400, 'liveUrl must be a URL address') }));
    render(<Admin />);
    await screen.findByLabelText(/full name/i);
    await tab('Projects');
    await userEvent.click(await screen.findByRole('button', { name: /add new/i }));
    await userEvent.type(screen.getByLabelText(/^title/i), 'New');
    await userEvent.type(screen.getByLabelText(/^description/i), 'Desc');
    await userEvent.type(screen.getByLabelText(/technologies/i), 'React, Node');
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('liveUrl must be a URL address');
    expect(screen.getByLabelText(/^title/i)).toHaveValue('New'); // form still open, input preserved
  });

  it('enforces required fields in the browser before calling the API', async () => {
    signedIn();
    const fetchMock = mockFetch(baseRoutes());
    vi.stubGlobal('fetch', fetchMock);
    render(<Admin />);
    await screen.findByLabelText(/full name/i);
    await tab('Projects');
    await userEvent.click(await screen.findByRole('button', { name: /add new/i }));
    expect(screen.getByLabelText(/^title/i)).toBeRequired();
    expect(screen.getByLabelText(/technologies/i)).toBeRequired();
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(lastCall(fetchMock, 'POST /projects')).toBeUndefined();
  });

  it('creates a project with technologies split into an array', async () => {
    signedIn();
    const fetchMock = mockFetch({ ...baseRoutes(), 'POST /projects': (o) => JSON.parse(o.body) });
    vi.stubGlobal('fetch', fetchMock);
    render(<Admin />);
    await screen.findByLabelText(/full name/i);
    await tab('Projects');
    await userEvent.click(await screen.findByRole('button', { name: /add new/i }));
    await userEvent.type(screen.getByLabelText(/^title/i), 'Shiny');
    await userEvent.type(screen.getByLabelText(/^description/i), 'Desc');
    await userEvent.type(screen.getByLabelText(/technologies/i), 'React, , Node ');
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    await waitFor(() => expect(lastCall(fetchMock, 'POST /projects')).toBeDefined());
    const body = JSON.parse(lastCall(fetchMock, 'POST /projects').options.body);
    expect(body).toMatchObject({ title: 'Shiny', technologies: ['React', 'Node'], status: 'in-progress', imageUrl: '', order: 0 });
  });

  it('edits and deletes (with confirmation) through the API', async () => {
    signedIn();
    const fetchMock = mockFetch({ ...baseRoutes(), 'PATCH /skills/s1': (o) => JSON.parse(o.body), 'DELETE /skills/s2': { deleted: true } });
    vi.stubGlobal('fetch', fetchMock);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    render(<Admin />);
    await screen.findByLabelText(/full name/i);
    await tab('Skills');
    const row = (await screen.findByText(/API Tech Skill/)).closest('.admin-list-item');
    await userEvent.click(within(row).getByRole('button', { name: 'Edit' }));
    const name = screen.getByLabelText(/skill name/i);
    await userEvent.clear(name);
    await userEvent.type(name, 'Renamed');
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    await waitFor(() => expect(lastCall(fetchMock, 'PATCH /skills/s1')).toBeDefined());
    expect(JSON.parse(lastCall(fetchMock, 'PATCH /skills/s1').options.body).name).toBe('Renamed');

    const softRow = (await screen.findByText(/API Soft Skill/)).closest('.admin-list-item');
    await userEvent.click(within(softRow).getByRole('button', { name: 'Delete' }));
    expect(lastCall(fetchMock, 'DELETE /skills/s2')).toBeUndefined(); // cancelled confirm -> nothing sent
    await userEvent.click(within(softRow).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(lastCall(fetchMock, 'DELETE /skills/s2')).toBeDefined());
    expect(confirm).toHaveBeenCalledTimes(2);
  });

  it('shows a list-loading error instead of a blank page', async () => {
    signedIn();
    vi.stubGlobal('fetch', mockFetch({ ...baseRoutes(), 'GET /education': fail(500, 'Database unavailable') }));
    render(<Admin />);
    await screen.findByLabelText(/full name/i);
    await tab('Education');
    expect(await screen.findByRole('alert')).toHaveTextContent('Database unavailable');
  });

  it('uploads an image (multipart, bearer token), previews it and sends its public id on save', async () => {
    signedIn();
    const fetchMock = mockFetch({
      ...baseRoutes(),
      'POST /uploads/image': { url: 'https://res.cloudinary.test/new.png', publicId: 'portfolio/new' },
      'PATCH /projects/p1': (o) => JSON.parse(o.body),
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<Admin />);
    await screen.findByLabelText(/full name/i);
    await tab('Projects');
    const row = (await screen.findByText(/API Project/)).closest('.admin-list-item');
    await userEvent.click(within(row).getByRole('button', { name: 'Edit' }));

    const file = new File(['png'], 'shot.png', { type: 'image/png' });
    await userEvent.upload(screen.getByLabelText(/project image/i), file);
    await waitFor(() => expect(screen.getByAltText('Preview')).toHaveAttribute('src', 'https://res.cloudinary.test/new.png'));
    const upload = lastCall(fetchMock, 'POST /uploads/image');
    expect(upload.options.body).toBeInstanceOf(FormData);
    expect(upload.options.body.get('file').name).toBe('shot.png');
    expect(upload.options.headers.Authorization).toBe('Bearer tok');
    expect(upload.options.headers['Content-Type']).toBeUndefined();

    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    await waitFor(() => expect(lastCall(fetchMock, 'PATCH /projects/p1')).toBeDefined());
    const body = JSON.parse(lastCall(fetchMock, 'PATCH /projects/p1').options.body);
    expect(body).toMatchObject({ imageUrl: 'https://res.cloudinary.test/new.png', imagePublicId: 'portfolio/new' });
  });

  it('surfaces upload failures (e.g. Cloudinary not configured) and keeps the old image', async () => {
    signedIn();
    vi.stubGlobal('fetch', mockFetch({ ...baseRoutes(), 'POST /uploads/image': fail(503, 'Image uploads are not configured.') }));
    render(<Admin />);
    await screen.findByLabelText(/full name/i);
    await userEvent.upload(screen.getByLabelText(/profile picture/i), new File(['x'], 'a.png', { type: 'image/png' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Image uploads are not configured.');
    expect(screen.getByAltText('Preview')).toHaveAttribute('src', 'https://img.test/avatar.png');
  });

  it('removing an image clears both url and public id in the saved payload', async () => {
    signedIn();
    const fetchMock = mockFetch({ ...baseRoutes(), 'PUT /profile': (o) => JSON.parse(o.body) });
    vi.stubGlobal('fetch', fetchMock);
    render(<Admin />);
    await screen.findByLabelText(/full name/i);
    await userEvent.click(screen.getByRole('button', { name: /^remove$/i }));
    expect(screen.queryByAltText('Preview')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() => expect(lastCall(fetchMock, 'PUT /profile')).toBeDefined());
    expect(JSON.parse(lastCall(fetchMock, 'PUT /profile').options.body)).toMatchObject({ avatarUrl: '', avatarPublicId: '' });
  });

  it('settings: toggling a section sends nested boolean flags', async () => {
    signedIn();
    const fetchMock = mockFetch({ ...baseRoutes(), 'PUT /settings': (o) => JSON.parse(o.body) });
    vi.stubGlobal('fetch', fetchMock);
    render(<Admin />);
    await screen.findByLabelText(/full name/i);
    await tab('Site settings');
    await userEvent.click(await screen.findByLabelText(/show "projects" section/i));
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() => expect(lastCall(fetchMock, 'PUT /settings')).toBeDefined());
    const body = JSON.parse(lastCall(fetchMock, 'PUT /settings').options.body);
    expect(body.sections.projects).toBe(false);
    expect(body.sections.about).toBe(true);
    expect(body.sectionTitles.projects).toBe('API Projects Heading');
  });
});
