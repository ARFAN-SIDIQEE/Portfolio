const API_URL = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...options.headers,
    },
  });

  let body = null;
  if (response.status !== 204) {
    const text = await response.text();
    if (text.trim()) {
      try {
        body = JSON.parse(text);
      } catch {
        throw new Error(
          response.ok
            ? 'The API returned an unexpected response. Check that the backend is running.'
            : `The API returned an unreadable error (HTTP ${response.status}). Check the backend terminal.`,
        );
      }
    }
  }

  if (!response.ok) {
    const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
    if (message) throw new Error(message);
    if (!body) {
      throw new Error(
        `The API returned an empty response (HTTP ${response.status}). Check that the backend is running and server/.env is configured.`,
      );
    }
    throw new Error(`The request could not be completed (HTTP ${response.status}).`);
  }
  return body;
}

export const api = {
  getProjects: () => request('/projects'),
  getSkills: () => request('/skills'),
  sendMessage: (data) => request('/contact', { method: 'POST', body: JSON.stringify(data) }),
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  createProject: (data, token) => request('/projects', { method: 'POST', body: JSON.stringify(data), token }),
  updateProject: (id, data, token) => request(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data), token }),
  createSkill: (data, token) => request('/skills', { method: 'POST', body: JSON.stringify(data), token }),
  updateSkill: (id, data, token) => request(`/skills/${id}`, { method: 'PATCH', body: JSON.stringify(data), token }),
  deleteSkill: (id, token) => request(`/skills/${id}`, { method: 'DELETE', token }),
};
