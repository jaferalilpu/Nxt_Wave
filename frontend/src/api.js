// One small wrapper around fetch so every call handles errors the same way.
const BASE = import.meta.env.VITE_API_URL || 'https://nxt-wave-g162.onrender.com';

async function post(path, body) {
  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Cannot reach the server. Is the backend running?');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.details = data.details || [];
    throw err;
  }
  return data;
}

export const api = {
  health: () => fetch(`${BASE}/api/health`).then((r) => r.json()),
  generate: (material) => post('/generate', { material }),
  regenerate: (material, type, existingTexts, attempt) =>
    post('/regenerate', { material, type, existingTexts, attempt }),
  verify: (material, question) => post('/verify', { material, question }),
  exportGroup: (material, questions) => post('/export', { material, questions }),
};
