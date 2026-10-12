const API = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export function getToken() {
  return localStorage.getItem("cahs_access");
}

export async function api(path: string, opts: RequestInit = {}) {
  const headers: Record<string, string> = {
    ...(opts.body ? { "Content-Type": "application/json" } : {}),
    ...(opts.headers as Record<string, string>),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...opts, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.error ?? res.statusText);
  return data;
}

export const naira = (n: number) =>
  `₦${new Intl.NumberFormat("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)}`;
