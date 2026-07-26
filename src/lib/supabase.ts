import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    "Supabase env vars are missing. Running in local demo mode " +
      "(copy .env.example to .env for local dev, or set VITE_SUPABASE_URL / " +
      "VITE_SUPABASE_ANON_KEY as environment variables in your Vercel project settings)."
  );
}

// ROOT CAUSE FIX (traced via jsdom execution of the real production bundle):
// `@supabase/supabase-js` statically pulls in `@supabase/node-fetch` through
// every sub-package (postgrest-js, auth-js, realtime-js, storage-js). That
// module runs `globalObject.fetch.bind(globalObject)` as a *top-level,
// module-scope statement* the instant it is evaluated - before any of our
// code runs, and unconditionally, regardless of isSupabaseConfigured.
//
// Previously `createClient` was imported statically at the top of this file,
// which is itself statically imported by dataService.ts -> every hook ->
// ReceiptPage. That pulled the entire supabase-js graph (including the
// fragile top-level fetch binding) into the main entry chunk and ran it on
// every page load, in every environment, even in local demo mode where no
// Supabase call is ever made.
//
// Fix: only import/construct the real client lazily, on demand, and only
// when Supabase is actually configured. In demo mode, `@supabase/supabase-js`
// is never imported at all, so its side effects never run.
let clientPromise: Promise<SupabaseClient<Database>> | null = null;

export function getSupabaseClient(): Promise<SupabaseClient<Database>> {
  if (!isSupabaseConfigured) {
    return Promise.reject(
      new Error("Supabase is not configured. This should never be called in demo mode.")
    );
  }
  if (!clientPromise) {
    clientPromise = import("@supabase/supabase-js").then(({ createClient }) =>
      createClient<Database>(supabaseUrl, supabaseAnonKey)
    );
  }
  return clientPromise;
}
