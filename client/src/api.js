const API_URL = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, options = {}) {
  const isForm = typeof FormData !== 'undefined' && options.body instanceof FormData;
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        // The browser sets the multipart boundary itself for FormData bodies.
        ...(options.body && !isForm ? { 'Content-Type': 'application/json' } : {}),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and that the API is running.', 0);
  }

  let body = null;
  if (response.status !== 204) {
    const text = await response.text();
    if (text.trim()) {
      try {
        body = JSON.parse(text);
      } catch {
        throw new ApiError(
          response.ok
            ? 'The API returned an unexpected response. Check that the backend is running.'
            : `The API returned an unreadable error (HTTP ${response.status}). Check the backend terminal.`,
          response.status,
        );
      }
    }
  }

  if (!response.ok) {
    const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
    if (message) throw new ApiError(message, response.status);
    if (!body) {
      throw new ApiError(
        `The API returned an empty response (HTTP ${response.status}). Check that the backend is running and server/.env is configured.`,
        response.status,
      );
    }
    throw new ApiError(`The request could not be completed (HTTP ${response.status}).`, response.status);
  }
  return body;
}

const json = (data) => JSON.stringify(data);

export const api = {
  // Public
  getPortfolio: () => request('/portfolio'),
  getProjects: () => request('/projects'),
  getSkills: () => request('/skills'),
  sendMessage: (data) => request('/contact', { method: 'POST', body: json(data) }),
  me: (token) => request('/auth/me', { token }),
  login: (credentials) => request('/auth/login', { method: 'POST', body: json(credentials) }),

  // Generic admin CRUD: resource is a path such as "projects", "skills", "services"
  list: (resource) => request(`/${resource}`),
  create: (resource, data, token) => request(`/${resource}`, { method: 'POST', body: json(data), token }),
  update: (resource, id, data, token) => request(`/${resource}/${id}`, { method: 'PATCH', body: json(data), token }),
  remove: (resource, id, token) => request(`/${resource}/${id}`, { method: 'DELETE', token }),

  // Singletons (profile, settings)
  getSingleton: (resource) => request(`/${resource}`),
  saveSingleton: (resource, data, token) => request(`/${resource}`, { method: 'PUT', body: json(data), token }),

  uploadImage: (file, token) => {
    const form = new FormData();
    form.append('file', file);
    return request('/uploads/image', { method: 'POST', body: form, token });
  },

  // Kept for compatibility with earlier callers
  createProject: (data, token) => request('/projects', { method: 'POST', body: json(data), token }),
  updateProject: (id, data, token) => request(`/projects/${id}`, { method: 'PATCH', body: json(data), token }),
  createSkill: (data, token) => request('/skills', { method: 'POST', body: json(data), token }),
  updateSkill: (id, data, token) => request(`/skills/${id}`, { method: 'PATCH', body: json(data), token }),
  deleteSkill: (id, token) => request(`/skills/${id}`, { method: 'DELETE', token }),
};
