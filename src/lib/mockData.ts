import type { Project } from "@/features/projects/types";
import type { Customer, CustomerSearchField } from "@/features/customers/types";

/**
 * LOCAL DEMO DATA LAYER
 * ---------------------
 * This mirrors the shape of the Supabase tables (see supabase/schema.sql) so
 * that dataService.ts can swap between the real backend and this in-memory
 * store without the UI or hooks knowing the difference.
 *
 * State resets on page reload — this is intentional for a demo mode, not a
 * bug. Once Supabase credentials are provided, this file is bypassed
 * entirely (see isSupabaseConfigured in lib/supabase.ts).
 */

interface MockReceipt {
  id: string;
  project_id: string;
  customer_id: string;
  receipt_number: string;
  receipt_date: string;
  status: "draft" | "final" | "cancelled";
  note: string | null;
  prepared_by: string | null;
  authorized_by: string | null;
}

interface MockReceiptItem {
  id: string;
  receipt_id: string;
  sl: number;
  description: string;
  payment_method: string;
  total_unit_price: number;
  amount_paid: number;
}

const projects: Project[] = [
  {
    id: "demo-proj-balv",
    name: "Brahmaputra Arch Lake View Tower",
    short_code: "BALV",
    address: "House #37, Station Road, Dhaka-1205",
    contact_phone: "+88000-000000",
  },
  {
    id: "demo-proj-anc",
    name: "Apon Niketon Commercial",
    short_code: "ANC",
    address: "Apon Niketon, Dhaka",
    contact_phone: "+88000-000001",
  },
  {
    id: "demo-proj-anr",
    name: "Apon Niketon Residency",
    short_code: "ANR",
    address: "Apon Niketon, Dhaka",
    contact_phone: "+88000-000002",
  },
];

// No seeded customers, receipts, or line items - the demo store starts
// genuinely empty, exactly like a fresh installation.
const customers: Customer[] = [];
const receipts: MockReceipt[] = [];
const receiptItems: MockReceiptItem[] = [];

function delay<T>(value: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function matches(haystack: string | null, needle: string): boolean {
  return (haystack ?? "").toLowerCase().includes(needle.toLowerCase());
}

/**
 * Derives the next sequence number by scanning the actual in-memory records
 * for this project - never from a separately-tracked counter. This is what
 * requirement 5 calls for: the sequence is always calculated from the real
 * data (or empty store), so it can never drift out of sync with what's
 * actually there, and it's automatically correct after every save.
 */
function nextSequenceNumber(existingCodes: string[], prefix: string): number {
  let max = 0;
  for (const code of existingCodes) {
    const match = code.match(new RegExp(`^${prefix}-(\\d+)$`));
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > max) max = n;
    }
  }
  return max + 1;
}

export const mockDataStore = {
  async listProjects(): Promise<Project[]> {
    return delay([...projects]);
  },

  async searchCustomers(
    projectId: string,
    field: CustomerSearchField,
    query: string
  ): Promise<Customer[]> {
    if (!query.trim()) return delay([]);

    if (field === "receipt_number") {
      const receipt = receipts.find(
        (r) => r.project_id === projectId && matches(r.receipt_number, query)
      );
      if (!receipt) return delay([]);
      const customer = customers.find((c) => c.id === receipt.customer_id);
      return delay(customer ? [customer] : []);
    }

    const fieldMap: Record<Exclude<CustomerSearchField, "receipt_number">, keyof Customer> = {
      customer_code: "customer_code",
      name: "name",
      mobile: "mobile",
      nid: "nid",
    };
    const key = fieldMap[field as Exclude<CustomerSearchField, "receipt_number">];

    const results = customers.filter(
      (c) => c.project_id === projectId && matches(c[key] as string | null, query)
    );
    return delay(results.slice(0, 10));
  },

  async nextCustomerCode(projectId: string): Promise<string> {
    const existingCodes = customers
      .filter((c) => c.project_id === projectId)
      .map((c) => c.customer_code);
    const next = nextSequenceNumber(existingCodes, "CUST");
    return delay(`CUST-${String(next).padStart(3, "0")}`);
  },

  async createCustomer(
    projectId: string,
    input: {
      name: string;
      nid?: string;
      mobile?: string;
      nominee_name?: string;
      nominee_nid?: string;
    },
    customerCode: string
  ): Promise<Customer> {
    const customer: Customer = {
      id: `demo-cust-${crypto.randomUUID()}`,
      project_id: projectId,
      customer_code: customerCode,
      name: input.name,
      nid: input.nid ?? null,
      mobile: input.mobile ?? null,
      nominee_name: input.nominee_name ?? null,
      nominee_nid: input.nominee_nid ?? null,
    };
    customers.push(customer);
    return delay(customer);
  },

  async nextReceiptNumber(projectId: string): Promise<string> {
    const existingNumbers = receipts
      .filter((r) => r.project_id === projectId)
      .map((r) => r.receipt_number);
    const next = nextSequenceNumber(existingNumbers, "REC");
    return delay(`REC-${String(next).padStart(6, "0")}`);
  },

  async insertReceipt(receipt: Omit<MockReceipt, "id">): Promise<MockReceipt> {
    const row: MockReceipt = { ...receipt, id: `demo-rec-${crypto.randomUUID()}` };
    receipts.push(row);
    return delay(row);
  },

  async insertReceiptItems(items: Omit<MockReceiptItem, "id">[]): Promise<void> {
    for (const item of items) {
      receiptItems.push({ ...item, id: `demo-item-${crypto.randomUUID()}` });
    }
    return delay(undefined);
  },
};
