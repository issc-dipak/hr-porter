/**
 * Centralized API Fetch client for the frontend application.
 * Manages authentication headers, logs network errors, and returns JSON payloads.
 */

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('hr_system_token');
}

export function authHeaders(): Record<string, string> {
  const token = getToken();
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

export async function apiFetch(url: string, options?: RequestInit): Promise<any | null> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...authHeaders(),
        ...(options?.headers || {})
      }
    });

    if (!res.ok) {
      console.warn(`[API Client] Fetch failed for ${url}: Status ${res.status}`);
      return null;
    }

    return await res.json();
  } catch (err: any) {
    console.error(`[API Client] Network error for ${url}:`, err);
    return null;
  }
}
