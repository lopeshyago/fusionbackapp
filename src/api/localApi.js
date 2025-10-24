// Preferir localhost no desenvolvimento; pode ser sobrescrito por VITE_API_URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4001";

class LocalApiClient {
  constructor() {
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const config = {
      ...options,
      headers,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // Auth methods
  async login(email, password) {
    const result = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(result.token);
    return result;
  }

  async register(email, password, full_name, role = 'aluno') {
    const result = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name, role }),
    });
    this.setToken(result.token);
    return result;
  }

  async getCurrentUser() {
    return this.request('/me');
  }

  async logout() {
    this.token = null;
    // Note: Server-side logout might be needed, but for now just clear local token
  }

  // Generic CRUD methods
  async get(table, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/api/${table}?${queryString}` : `/api/${table}`;
    return this.request(endpoint);
  }

  async create(table, data) {
    return this.request(`/api/${table}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async update(table, id, data) {
    return this.request(`/api/${table}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(table, id) {
    return this.request(`/api/${table}/${id}`, {
      method: 'DELETE',
    });
  }

  // File upload
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${API_URL}/upload`;
    const headers = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    return response.json();
  }
}

export const localApi = new LocalApiClient();
