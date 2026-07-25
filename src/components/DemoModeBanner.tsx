import { FlaskConical } from "lucide-react";

/**
 * Shown only when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set.
 * The app is fully usable in this mode — it just reads/writes to an
 * in-memory mock store (src/lib/mockData.ts) instead of the real database.
 */
export function DemoModeBanner() {
  return (
    <div className="no-print flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">
      <FlaskConical className="h-3.5 w-3.5 shrink-0" />
      Running in Local Demo Mode — Supabase is not configured, so data is stored in memory only and
      will reset on page reload.
    </div>
  );
}
