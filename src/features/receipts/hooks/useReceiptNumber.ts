import { useCallback, useState } from "react";
import { reserveNextReceiptNumber } from "@/lib/dataService";

/**
 * Reserves the next receipt number for a project (e.g. REC-000001).
 * Routed through the data service, so it transparently uses the real
 * Supabase RPC (atomic, server-side) when configured, or the local mock
 * counter in demo mode. See src/lib/dataService.ts.
 *
 * NOTE: Calling this reserves/increments the counter immediately. In phase 2
 * we may want to defer the actual reservation until "Save" is pressed (not
 * "Print Preview"), to avoid burning numbers on abandoned drafts.
 */
export function useReceiptNumber() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reserveNext = useCallback(async (projectId: string): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      return await reserveNextReceiptNumber(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate receipt number");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { reserveNext, loading, error };
}
