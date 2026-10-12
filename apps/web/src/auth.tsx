import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "./api";

export type User = {
  id: string;
  email: string;
  role: string;
  fullName: string;
  state: string;
  lga: string;
  isEligibleZenithCustomer: boolean;
};

type Auth = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, otp?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const Ctx = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshMe() {
    if (!localStorage.getItem("cahs_access")) {
      setUser(null);
      return;
    }
    const data = await api("/api/auth/me");
    setUser(data.user);
  }

  useEffect(() => {
    refreshMe()
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string, otp?: string) {
    const data = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, otp }),
    });
    localStorage.setItem("cahs_access", data.accessToken);
    localStorage.setItem("cahs_refresh", data.refreshToken);
    setUser(data.user);
  }

  async function logout() {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    localStorage.removeItem("cahs_access");
    localStorage.removeItem("cahs_refresh");
    setUser(null);
  }

  return <Ctx.Provider value={{ user, loading, login, logout, refreshMe }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("auth");
  return v;
}
