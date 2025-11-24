// frontend/src/apiClient.js

// Browser-side client for talking to the Better Bets backend.
// NOTE: Do not put any secret API keys in this file. The backend
// handles authentication/authorization based on environment config.
const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL || '';

export async function apiGet(path) {
  const url = path.startsWith('http') ? path : `${BACKEND_BASE}${path}`;

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    let text = '';
    try {
      text = await res.text();
    } catch {
      // ignore
    }
    const message = text || res.statusText || `HTTP ${res.status}`;
    throw new Error(`API error: ${message}`);
  }

  return res.json();
}
