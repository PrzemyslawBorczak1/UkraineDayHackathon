const ORIGIN = "http://localhost:8000";
const API_PREFIX = "/api/v1";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail?.detail ?? detail?.message ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  /** POST to an /api/v1 endpoint (path is appended to the /api/v1 prefix). */
  post: <T>(path: string, body: unknown) =>
    request<T>(`${ORIGIN}${API_PREFIX}${path}`, { method: "POST", body: JSON.stringify(body) }),
  /** GET against the server origin. Pass the full router path, e.g. "/warehouse/". */
  get: <T>(path: string) => request<T>(`${ORIGIN}${path}`),
};
