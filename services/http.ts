const API_BASE = import.meta.env.VITE_API_URL as string | undefined;

if (!API_BASE) {
  console.error('❌ VITE_API_URL is not configured. Please set it in your .env file.');
}

// Authentication uses HttpOnly cookies set by the server
export const apiGet = async <T>(path: string): Promise<T> => {
  if (!API_BASE) {
    throw new Error('API URL is not configured. Please set VITE_API_URL in your environment variables.');
  }
  const r = await fetch(`${API_BASE}${path}`, { 
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Include cookies for authentication
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};

export const apiPost = async <T>(path: string, body: any): Promise<T> => {
  if (!API_BASE) {
    throw new Error('API URL is not configured. Please set VITE_API_URL in your environment variables.');
  }
  const r = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Include cookies for authentication
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};

export const apiPatch = async <T>(path: string, body: any): Promise<T> => {
  if (!API_BASE) {
    throw new Error('API URL is not configured. Please set VITE_API_URL in your environment variables.');
  }
  const r = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Include cookies for authentication
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};

export const getApiBase = () => API_BASE;

