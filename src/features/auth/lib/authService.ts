import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

export interface AuthUser {
  id: string;
  email: string;
}

/**
 * AUTH SERVICE
 * ------------
 * Mirrors the same "real backend vs. local demo mode" seam already
 * established by src/lib/dataService.ts, so this feature behaves
 * consistently with the rest of the app:
 *  - Supabase configured  -> real supabase.auth.signInWithPassword(...)
 *  - Not configured       -> any non-empty email + password succeeds
 *                            (matches the existing "Local Demo Mode" pattern)
 *
 * Uses Supabase Auth's built-in, Supabase-managed `auth.users` system -
 * this requires ZERO changes to our own schema/tables.
 */

export async function login(email: string, password: string): Promise<AuthUser> {
  if (!isSupabaseConfigured) {
    if (!email.trim() || !password.trim()) {
      throw new Error("Email and password are required.");
    }
    return { id: "demo-user", email: email.trim() };
  }

  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error("Login failed. Please check your credentials.");

  return { id: data.user.id, email: data.user.email ?? email };
}

export async function logout(): Promise<void> {
  if (!isSupabaseConfigured) return;
  const supabase = await getSupabaseClient();
  await supabase.auth.signOut();
}

/**
 * Restores an existing Supabase Auth session (if any) without making a
 * network round-trip - reads from the locally persisted session.
 * Only relevant when Supabase is configured; demo-mode session restoration
 * is handled separately via sessionStorage in useAuth.
 */
export async function getCurrentSession(): Promise<AuthUser | null> {
  if (!isSupabaseConfigured) return null;

  const supabase = await getSupabaseClient();
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) return null;

  return { id: user.id, email: user.email ?? "" };
}
