import type { PaymentMethod, ReceiptStatus } from "@/types/database.types";

export interface ReceiptItem {
  id: string; // client-side temp id or db id
  sl: number;
  description: string;
  paymentMethod: PaymentMethod;
  totalUnitPrice: number;
  amountPaid: number;
}

export interface ReceiptFormState {
  receiptNumber: string;
  receiptDate: string; // ISO yyyy-mm-dd
  status: ReceiptStatus;
  customerId: string | null;
  customerCode: string;
  customerName: string;
  nid: string;
  mobile: string;
  nomineeName: string;
  nomineeNid: string;
  items: ReceiptItem[];
  note: string;
  preparedBy: string;
  authorizedBy: string;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  "Cash",
  "Bank Transfer",
  "Cheque",
  "BEFTN",
  "RTGS",
  "bKash",
  "Nagad",
  "Rocket",
  "Upay",
  "Others",
];

/**
 * A single row for a project-scoped receipt history view. Backend-only for
 * now (see dataService.listReceiptsForProject) - no UI currently consumes
 * this, per the instruction not to add/change any UI in this pass.
 */
export interface ReceiptHistoryRow {
  id: string;
  receiptNumber: string;
  receiptDate: string;
  status: ReceiptStatus;
  customerName: string;
  customerCode: string;
  totalUnitPrice: number;
  totalPaid: number;
  totalDue: number;
}

/**
 * Aggregate statistics for exactly one project (requirement 10). Backend-only
 * for now - see dataService.getProjectStatistics.
 */
export interface ProjectStatistics {
  projectId: string;
  totalCustomers: number;
  totalReceipts: number;
  totalCollected: number;
  totalDue: number;
  totalUnitPrice: number;
}
