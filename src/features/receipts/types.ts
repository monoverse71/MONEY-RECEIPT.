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
