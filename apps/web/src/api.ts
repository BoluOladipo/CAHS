export const API = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "http://localhost:4000" : "");

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
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    const errorMsg = data?.error ?? (text && !text.includes("<html") && text.length < 120 ? text.trim() : `Service request failed (${res.status} ${res.statusText})`);
    throw new Error(errorMsg);
  }
  return data;
}

export const naira = (n: number) =>
  `₦${new Intl.NumberFormat("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)}`;
