import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './auth';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown };

async function refreshToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  const res = await fetch(`${BASE}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: refresh }),
  });
  if (!res.ok) {
    clearTokens();
    return null;
  }
  const data = await res.json();
  setTokens(data.accessToken, refresh);
  return data.accessToken;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, headers: extraHeaders, ...rest } = options;
  const token = getAccessToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extraHeaders as Record<string, string>),
  };

  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    // Try to refresh once
    const newToken = await refreshToken();
    if (newToken) {
      const retryRes = await fetch(`${BASE}${path}`, {
        ...rest,
        headers: { ...headers, Authorization: `Bearer ${newToken}` },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      if (!retryRes.ok) throw await retryRes.json();
      if (retryRes.status === 204) return undefined as T;
      return retryRes.json() as Promise<T>;
    }
    clearTokens();
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) throw await res.json();
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
