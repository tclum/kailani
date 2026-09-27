import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './auth';
import { isDemo } from './demo/flag';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown };

/**
 * Demo mode: answer the request from the in-browser fake backend instead of
 * the network. The module is loaded on demand, so flag-off builds never fetch it.
 * A 401 is handled like a failed refresh on the real path.
 */
async function demoRequest<T>(method: string, path: string, body: unknown): Promise<T> {
  const { demoDispatch } = await import('./demo/router');
  try {
    // JSON bodies take the same round trip the network would give them.
    const payload = body === undefined || body instanceof FormData ? body : JSON.parse(JSON.stringify(body));
    return (await demoDispatch({ method, path, body: payload, token: getAccessToken() })) as T;
  } catch (err) {
    if ((err as { status?: number })?.status === 401) {
      clearTokens();
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    throw err;
  }
}

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
  if (isDemo()) return demoRequest<T>(rest.method ?? 'GET', path, body);
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

/**
 * Multipart upload (portfolio images, profile images, ID verification).
 * Returns the parsed JSON body; on a non-2xx response throws the parsed body,
 * like apiFetch. No token refresh, matching the direct fetch calls it replaced.
 */
export async function apiUpload<T = unknown>(path: string, formData: FormData): Promise<T> {
  if (isDemo()) return demoRequest<T>('POST', path, formData);
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getAccessToken()}` },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data as T;
}

/**
 * Message for a failed apiUpload, keeping the two messages the upload call
 * sites always showed: the server's `error` (or `httpFallback`) for an error
 * response, `networkFallback` when the request itself failed.
 */
export function uploadErrorMessage(err: unknown, httpFallback: string, networkFallback: string): string {
  if (err instanceof Error) return networkFallback;
  return (err as { error?: string } | null)?.error ?? httpFallback;
}
