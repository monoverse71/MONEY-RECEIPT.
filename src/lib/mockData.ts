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

const customers: Customer[] = [
  {
    id: "demo-cust-101",
    project_id: "demo-proj-balv",
    customer_code: "CUST-101",
    name: "Rafiqul Islam",
    nid: "1990123456789",
    mobile: "01711000101",
    nominee_name: "Shirin Islam",
    nominee_nid: "1992123456790",
  },
  {
    id: "demo-cust-102",
    project_id: "demo-proj-balv",
    customer_code: "CUST-102",
    name: "Nusrat Jahan",
    nid: "1988123456123",
    mobile: "01911000102",
    nominee_name: "Kamal Hossain",
    nominee_nid: "1985123456124",
  },
  {
    id: "demo-cust-201",
    project_id: "demo-proj-anc",
    customer_code: "CUST-201",
    name: "Tanvir Ahmed",
    nid: "1987123456555",
    mobile: "01811000201",
    nominee_name: "Farida Ahmed",
    nominee_nid: "1989123456556",
  },
];

const receipts: MockReceipt[] = [
  {
    id: "demo-rec-1",
    project_id: "demo-proj-balv",
    customer_id: "demo-cust-101",
    receipt_number: "REC-000001",
    receipt_date: "2026-05-10",
    status: "final",
    note: "All payments are non-refundable and subject to clearance of cheque/transfer.",
    prepared_by: "Front Desk",
    authorized_by: "Sales Manager",
  },
];

const receiptItems: MockReceiptItem[] = [
  {
    id: "demo-rec-item-1",
    receipt_id: "demo-rec-1",
    sl: 1,
    description: "1st Installment - Booking Advance for Unit#",
    payment_method: "Bank Transfer",
    total_unit_price: 500000,
    amount_paid: 250000,
  },
];

const sequences: Record<string, { lastReceiptNumber: number; lastCustomerNumber: number }> = {
  "demo-proj-balv": { lastReceiptNumber: 1, lastCustomerNumber: 102 },
  "demo-proj-anc": { lastReceiptNumber: 0, lastCustomerNumber: 201 },
  "demo-proj-anr": { lastReceiptNumber: 0, lastCustomerNumber: 100 },
};

function delay<T>(value: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function matches(haystack: string | null, needle: string): boolean {
  return (haystack ?? "").toLowerCase().includes(needle.toLowerCase());
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
    const seq = sequences[projectId] ?? { lastReceiptNumber: 0, lastCustomerNumber: 100 };
    seq.lastCustomerNumber += 1;
    sequences[projectId] = seq;
    return delay(`CUST-${seq.lastCustomerNumber}`);
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
    const seq = sequences[projectId] ?? { lastReceiptNumber: 0, lastCustomerNumber: 100 };
    seq.lastReceiptNumber += 1;
    sequences[projectId] = seq;
    return delay(`REC-${String(seq.lastReceiptNumber).padStart(6, "0")}`);
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
