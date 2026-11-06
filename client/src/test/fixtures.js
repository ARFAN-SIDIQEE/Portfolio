// Deliberately different from the original hardcoded content, so a passing test proves
// the UI renders API data rather than a built-in fallback.
export const portfolio = {
  profile: {
    fullName: 'Zed Tester', headline: 'API Headline', badge: 'API Badge', heroDescription: 'API hero text',
    aboutParagraphs: ['API about one', 'API about two'], aboutStats: [{ value: '9x', label: 'API Stat' }, { icon: 'fas fa-code', label: 'Icon Stat' }],
    email: 'zed@example.com', whatsapp: '15550001111', avatarUrl: 'https://img.test/avatar.png', resumeUrl: '',
  },
  settings: {
    siteTitle: 'API Site Title', metaDescription: 'API meta', footerText: 'API footer', contactIntro: 'API contact intro', projectsFooterText: 'API projects footer',
    sections: { about: true, skills: true, projects: true, services: true, experience: true, education: true, contact: true },
    sectionTitles: { about: 'API About Heading', projects: 'API Projects Heading' },
  },
  projects: [{ _id: 'p1', title: 'API Project', description: 'API project desc', technologies: ['Vue'], status: 'completed', category: 'API Cat', sourceUrl: 'https://github.com/x/api', liveUrl: 'https://live.test', imageUrl: 'https://img.test/p.png' }],
  skills: [{ _id: 's1', name: 'API Tech Skill', category: 'Technical', icon: 'fas fa-star' }, { _id: 's2', name: 'API Soft Skill', category: 'Soft', icon: 'fas fa-star' }],
  services: [{ _id: 'v1', title: 'API Service', description: 'API service desc', icon: 'fas fa-code', price: 'Free' }],
  education: [{ _id: 'e1', institution: 'API Uni', degree: 'API Degree', startDate: '2020', endDate: '2024', description: 'API edu' }],
  experience: [{ _id: 'x1', title: 'API Role', company: 'API Co', startDate: '2024', endDate: 'Now', description: 'API exp' }],
  socialLinks: [{ _id: 'l1', platform: 'GitHub', url: 'https://github.com/x', icon: 'fab fa-github' }],
};

/** fetch stub: routes is { 'METHOD /path': (body, headers) => ({status, body}) | body } */
export function mockFetch(routes) {
  const calls = [];
  const fn = async (url, options = {}) => {
    const path = String(url).replace(/^\/api/, '');
    const key = `${options.method || 'GET'} ${path}`;
    calls.push({ key, options });
    const handler = routes[key];
    if (!handler) return new Response(JSON.stringify({ message: `no route ${key}` }), { status: 404 });
    const out = typeof handler === 'function' ? await handler(options) : handler;
    const status = out?.__status ?? 200;
    const body = out?.__status ? out.body : out;
    return new Response(status === 204 ? null : JSON.stringify(body), { status });
  };
  fn.calls = calls;
  return fn;
}
export const fail = (status, message) => ({ __status: status, body: { message } });
