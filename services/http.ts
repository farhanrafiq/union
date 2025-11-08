const API_BASE = import.meta.env.VITE_API_URL as string | undefined;

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export const authHeader = () => {
  const token = localStorage.getItem('ur:auth:token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const apiGet = async <T>(path: string): Promise<T> => {
  if (!API_BASE) {
    throw new ApiError(500, 'API not configured');
  }
  const r = await fetch(`${API_BASE}${path}`, { 
    headers: { 'Content-Type': 'application/json', ...authHeader() } 
  });
  if (!r.ok) {
    const errorText = await r.text();
    let errorMessage = errorText;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error || errorText;
    } catch {}
    throw new ApiError(r.status, errorMessage);
  }
  return r.json();
};

export const apiPost = async <T>(path: string, body: any): Promise<T> => {
  if (!API_BASE) {
    throw new ApiError(500, 'API not configured');
  }
  const r = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const errorText = await r.text();
    let errorMessage = errorText;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error || errorText;
    } catch {}
    throw new ApiError(r.status, errorMessage);
  }
  return r.json();
};

export const apiPatch = async <T>(path: string, body: any): Promise<T> => {
  if (!API_BASE) {
    throw new ApiError(500, 'API not configured');
  }
  const r = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const errorText = await r.text();
    let errorMessage = errorText;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error || errorText;
    } catch {}
    throw new ApiError(r.status, errorMessage);
  }
  return r.json();
};

export const getApiBase = () => API_BASE;

