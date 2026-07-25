import { useState } from "react";
import { searchCustomers, createCustomer as createCustomerService } from "@/lib/dataService";
import type { Customer, CustomerSearchField } from "../types";

export function useCustomers(projectId: string | null) {
  const [results, setResults] = useState<Customer[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search(field: CustomerSearchField, query: string) {
    if (!projectId || !query.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    setError(null);

    try {
      const data = await searchCustomers(projectId, field, query);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
    } finally {
      setSearching(false);
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
