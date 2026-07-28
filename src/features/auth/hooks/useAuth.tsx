import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  login as loginService,
  logout as logoutService,
  getCurrentSession,
  type AuthUser,
} from "../lib/authService";

// Demo-mode session is scoped to this browser tab/session only - matches
// the "once per visit, until logout" requirement without needing a backend.
const DEMO_SESSION_KEY = "receipt-app-demo-auth";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        if (isSupabaseConfigured) {
          const sessionUser = await getCurrentSession();
          if (!cancelled) setUser(sessionUser);
        } else {
          const raw = sessionStorage.getItem(DEMO_SESSION_KEY);
          if (raw && !cancelled) {
            try {
              setUser(JSON.parse(raw) as AuthUser);
            } catch {
              sessionStorage.removeItem(DEMO_SESSION_KEY);
            }
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  async function login(email: string, password: string) {
    setError(null);
    try {
      const loggedInUser = await loginService(email, password);
      setUser(loggedInUser);
      if (!isSupabaseConfigured) {
        sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(loggedInUser));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed.";
      setError(message);
      throw err;
    }
  }

  async function logout() {
    await logoutService();
    sessionStorage.removeItem(DEMO_SESSION_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
