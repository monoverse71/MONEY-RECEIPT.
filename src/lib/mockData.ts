import type { Project } from "@/features/projects/types";
import type { Customer, CustomerSearchField } from "@/features/customers/types";
import type { ReceiptHistoryRow, ProjectStatistics } from "@/features/receipts/types";

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
    id: "demo-proj-balvt",
    name: "BRAHMAPUTRO ARCH LAKE VIEW TOWER",
    short_code: "BALVT",
    address: null,
    contact_phone: null,
  },
  {
    id: "demo-proj-ggc",
    name: "GOYAILKANDI GARDEN CITY",
    short_code: "GGC",
    address: null,
    contact_phone: null,
  },
  {
    id: "demo-proj-agc",
    name: "AMLAPARA GARDEN CITY",
    short_code: "AGC",
    address: null,
    contact_phone: null,
  },
  {
    id: "demo-proj-mgc",
    name: "MASKANDA GARDEN CITY",
    short_code: "MGC",
    address: null,
    contact_phone: null,
  },
  {
    id: "demo-proj-rubt",
    name: "RAFIQ UDDIN BHUIYAN TOWER",
    short_code: "RUBT",
    address: null,
    contact_phone: null,
  },
  {
    id: "demo-proj-mgccp",
    name: "MASKANDA GARDEN CITY CONSTRUCTION PAYMENT",
    short_code: "MGCCP",
    address: null,
    contact_phone: null,
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

  /**
   * Project-scoped receipt history (requirement 5 / 9): only ever reads
   * receipts whose project_id matches the given project.
   */
  async listReceiptsForProject(projectId: string): Promise<ReceiptHistoryRow[]> {
    const rows: ReceiptHistoryRow[] = receipts
      .filter((r) => r.project_id === projectId)
      .map((r) => {
        const items = receiptItems.filter((it) => it.receipt_id === r.id);
        const totalUnitPrice = items.reduce((s, it) => s + it.total_unit_price, 0);
        const totalPaid = items.reduce((s, it) => s + it.amount_paid, 0);
        const customer = customers.find((c) => c.id === r.customer_id);
        return {
          id: r.id,
          receiptNumber: r.receipt_number,
          receiptDate: r.receipt_date,
          status: r.status,
          customerName: customer?.name ?? "Unknown",
          customerCode: customer?.customer_code ?? "—",
          totalUnitPrice,
          totalPaid,
          totalDue: totalUnitPrice - totalPaid,
        };
      })
      .sort((a, b) => b.receiptDate.localeCompare(a.receiptDate));
    return delay(rows);
  },

  /**
   * Project-scoped statistics (requirement 10): every total here is derived
   * only from records belonging to this one project.
   */
  async getProjectStatistics(projectId: string): Promise<ProjectStatistics> {
    const projectCustomerCount = customers.filter((c) => c.project_id === projectId).length;
    const rows = receipts
      .filter((r) => r.project_id === projectId)
      .map((r) => {
        const items = receiptItems.filter((it) => it.receipt_id === r.id);
        const totalUnitPrice = items.reduce((s, it) => s + it.total_unit_price, 0);
        const totalPaid = items.reduce((s, it) => s + it.amount_paid, 0);
        return { totalUnitPrice, totalPaid };
      });

    return delay({
      projectId,
      totalCustomers: projectCustomerCount,
      totalReceipts: rows.length,
      totalCollected: rows.reduce((s, r) => s + r.totalPaid, 0),
      totalDue: rows.reduce((s, r) => s + (r.totalUnitPrice - r.totalPaid), 0),
      totalUnitPrice: rows.reduce((s, r) => s + r.totalUnitPrice, 0),
    });
  },
};
