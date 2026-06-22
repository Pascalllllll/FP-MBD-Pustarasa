// Thin fetch wrapper: attaches JWT, unwraps { success, data }, throws errors with the server's message.

import { toast } from '../lib/toast.js';

const BASE = import.meta.env.VITE_API_BASE || '/api';

let authToken = localStorage.getItem('pustarasa_token') || null;

export function setToken(token) {
  authToken = token;
  if (token) localStorage.setItem('pustarasa_token', token);
  else localStorage.removeItem('pustarasa_token');
}

export function getToken() {
  return authToken;
}

async function request(path, { method = 'GET', body, params } = {}) {
  let url = `${BASE}${path}`;
  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
    ).toString();
    if (qs) url += `?${qs}`;
  }

  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const err = new Error((payload && payload.message) || `Request gagal (${res.status})`);
    err.status = res.status;
    err.details = payload && payload.details;
    err.trigger = Boolean(payload && payload.trigger);
    if (err.trigger) toast.trigger(err.message);
    if (res.status === 401) setToken(null);
    throw err;
  }

  // Mirror toast.trigger: a write request that *isn't* rejected gets a green confirmation.
  // /trigger/* is excluded — it always returns 200 even when the simulated trigger rejects,
  // since that page shows its own ✓/✕ result inline.
  if (method !== 'GET' && !path.startsWith('/auth/') && !path.startsWith('/trigger/')) {
    toast.success('Operasi berhasil disimpan.');
  }

  return payload ? payload.data : null;
}

export const api = {
  get: (path, params) => request(path, { params }),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  del: (path) => request(path, { method: 'DELETE' }),
};
