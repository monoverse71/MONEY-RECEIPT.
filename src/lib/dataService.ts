import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { mockDataStore } from "@/lib/mockData";
import type { Project } from "@/features/projects/types";
import type { Customer, CustomerSearchField } from "@/features/customers/types";
import type { ReceiptStatus } from "@/types/database.types";

/**
 * DATA SERVICE
 * ------------
 * This is the ONLY place in the app that decides "real database" vs.
 * "local demo data". Hooks (useProjects, useCustomers, useReceiptNumber) and
 * pages call these functions and never import `supabase` or `mockDataStore`
 * directly. When real Supabase credentials are supplied later, every
 * function below will automatically start hitting the real database with
 * zero changes required in components or hooks.
 */

export { isSupabaseConfigured };

export async function listProjects(): Promise<Project[]> {
  if (!isSupabaseConfigured) {
    return mockDataStore.listProjects();
  }
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.from("projects").select("*").order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function searchCustomers(
  projectId: string,
  field: CustomerSearchField,
  query: string
): Promise<Customer[]> {
  if (!query.trim()) return [];

  if (!isSupabaseConfigured) {
    return mockDataStore.searchCustomers(projectId, field, query);
  }

  const supabase = await getSupabaseClient();

  if (field === "receipt_number") {
    const { data: receipt, error: receiptErr } = await supabase
      .from("receipts")
      .select("customer_id")
      .eq("project_id", projectId)
      .ilike("receipt_number", `%${query.trim()}%`)
      .limit(1)
      .maybeSingle();
    if (receiptErr) throw receiptErr;
    if (!receipt) return [];

    const { data: customer, error: customerErr } = await supabase
      .from("customers")
      .select("*")
      .eq("id", receipt.customer_id)
      .maybeSingle();
    if (customerErr) throw customerErr;
    return customer ? [customer] : [];
  }

  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("project_id", projectId)
    .ilike(field, `%${query.trim()}%`)
    .limit(10);
  if (error) throw error;
  return data ?? [];
}

export async function createCustomer(
  projectId: string,
  input: {
    name: string;
    nid?: string;
    mobile?: string;
    nominee_name?: string;
    nominee_nid?: string;
  }
): Promise<Customer> {
  if (!isSupabaseConfigured) {
    const code = await mockDataStore.nextCustomerCode(projectId);
    return mockDataStore.createCustomer(projectId, input, code);
  }

  const supabase = await getSupabaseClient();
  const { data: code, error: codeErr } = await supabase.rpc("next_customer_code", {
    p_project_id: projectId,
  });
  if (codeErr) throw codeErr;

  const { data, error } = await supabase
    .from("customers")
    .insert({
      project_id: projectId,
      customer_code: code as string,
      name: input.name,
      nid: input.nid ?? null,
      mobile: input.mobile ?? null,
      nominee_name: input.nominee_name ?? null,
      nominee_nid: input.nominee_nid ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function reserveNextReceiptNumber(projectId: string): Promise<string> {
  if (!isSupabaseConfigured) {
    return mockDataStore.nextReceiptNumber(projectId);
  }
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.rpc("next_receipt_number", {
    p_project_id: projectId,
  });
  if (error) throw error;
  return data as string;
}

export interface SaveReceiptInput {
  projectId: string;
  customerId: string;
  receiptNumber: string;
  receiptDate: string;
  status: ReceiptStatus;
  note: string;
  preparedBy: string;
  authorizedBy: string;
  items: {
    sl: number;
    description: string;
    paymentMethod: string;
    totalUnitPrice: number;
    amountPaid: number;
  }[];
}

export async function saveReceipt(input: SaveReceiptInput): Promise<void> {
  if (!isSupabaseConfigured) {
    const receipt = await mockDataStore.insertReceipt({
      project_id: input.projectId,
      customer_id: input.customerId,
      receipt_number: input.receiptNumber,
      receipt_date: input.receiptDate,
      status: input.status,
      note: input.note || null,
      prepared_by: input.preparedBy || null,
      authorized_by: input.authorizedBy || null,
    });
    await mockDataStore.insertReceiptItems(
      input.items.map((it) => ({
        receipt_id: receipt.id,
        sl: it.sl,
        description: it.description,
        payment_method: it.paymentMethod,
        total_unit_price: it.totalUnitPrice,
        amount_paid: it.amountPaid,
      }))
    );
    return;
  }

  const supabase = await getSupabaseClient();
  const { data: receipt, error: receiptErr } = await supabase
    .from("receipts")
    .insert({
      project_id: input.projectId,
      customer_id: input.customerId,
      receipt_number: input.receiptNumber,
      receipt_date: input.receiptDate,
      status: input.status,
      note: input.note || null,
      prepared_by: input.preparedBy || null,
      authorized_by: input.authorizedBy || null,
    })
    .select("*")
    .single();
  if (receiptErr) throw receiptErr;

  const rows = input.items.map((it) => ({
    receipt_id: receipt.id,
    sl: it.sl,
    description: it.description,
    payment_method: it.paymentMethod,
    total_unit_price: it.totalUnitPrice,
    amount_paid: it.amountPaid,
  }));
  const { error: itemsErr } = await supabase.from("receipt_items").insert(rows);
  if (itemsErr) throw itemsErr;
}
