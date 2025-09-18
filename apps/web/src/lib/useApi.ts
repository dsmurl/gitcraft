import { useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';

const DEFAULT_API_BASE =
  (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:3001';

/**
 * Minimal hook for calling your API with a Clerk bearer token.
 * Usage:
 *   const { fetchWithAuth } = useApi();
 *   const data = await fetchWithAuth('/api/test/private'); // GET
 *   const updated = await fetchWithAuth('/api/test/settings', {
 *     method: 'POST',
 *     body: JSON.stringify({ value: 42 }),
 *   });
 */
export function useApi(apiBase: string = DEFAULT_API_BASE) {
  const { getToken } = useAuth();

  const fetchWithAuth = useCallback(
    async (path: string, init: RequestInit = {}) => {
      const token = await getToken();
      const headers = new Headers(init.headers || {});

      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      // Add JSON content-type if not sending FormData and no content-type set
      if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
      }

      const resp = await fetch(`${apiBase}${path}`, {
        ...init,
        headers,
        credentials: 'include',
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Request failed ${resp.status}: ${text}`);
      }

      const contentType = resp.headers.get('Content-Type') || '';
      if (contentType.includes('application/json')) {
        return resp.json();
      }
      return resp.text();
    },
    [apiBase, getToken]
  );

  return { fetchWithAuth };
}
