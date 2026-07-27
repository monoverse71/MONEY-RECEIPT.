import { useEffect, useRef, useState } from "react";
import { searchCustomers, createCustomer as createCustomerService } from "@/lib/dataService";
import type { Customer, CustomerSearchField } from "../types";

export function useCustomers(projectId: string | null) {
  const [results, setResults] = useState<Customer[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guards against out-of-order async responses: if the user triggers a new
  // search before an older one has finished, the older response (when it
  // eventually resolves) must not be allowed to overwrite the newer results.
  const latestRequestId = useRef(0);

  // Clear any previously-shown search results whenever the active project
  // changes. Without this, results from the old project stayed on screen
  // (and remained clickable) after switching projects - a real project-
  // isolation violation, not just a stale-UI cosmetic issue.
  useEffect(() => {
    latestRequestId.current += 1; // also invalidate any in-flight search from the old project
    setResults([]);
    setError(null);
  }, [projectId]);

  async function search(field: CustomerSearchField, query: string) {
    const requestId = ++latestRequestId.current;

    if (!projectId || !query.trim()) {
      if (requestId === latestRequestId.current) setResults([]);
      return;
    }
    setSearching(true);
    setError(null);

    try {
      const data = await searchCustomers(projectId, field, query);
      if (requestId !== latestRequestId.current) return; // a newer search superseded this one
      setResults(data);
    } catch (err) {
      if (requestId !== latestRequestId.current) return;
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
    } finally {
      if (requestId === latestRequestId.current) setSearching(false);
    }
  }

  async function createCustomer(input: {
    name: string;
    nid?: string;
    mobile?: string;
    nominee_name?: string;
    nominee_nid?: string;
  }): Promise<Customer> {
    if (!projectId) throw new Error("No project selected");
    return createCustomerService(projectId, input);
  }

  return { results, searching, error, search, createCustomer };
}
