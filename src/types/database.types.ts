// NOTE: This file is hand-written to match `supabase/schema.sql`.
// Once the project is linked to a live Supabase instance, regenerate with:
//   npx supabase gen types typescript --project-id <ref> > src/types/database.types.ts

export type ReceiptStatus = "draft" | "final" | "cancelled";

export type PaymentMethod =
  | "Cash"
  | "Bank Transfer"
  | "Cheque"
  | "BEFTN"
  | "RTGS"
  | "bKash"
  | "Nagad"
  | "Rocket"
  | "Upay"
  | "Others";

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          name: string;
          short_code: string;
          address: string | null;
          contact_phone: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["projects"]["Row"]> & {
          name: string;
          short_code: string;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Row"]>;
      };
      customers: {
        Row: {
          id: string;
          project_id: string;
          customer_code: string;
          name: string;
          nid: string | null;
          mobile: string | null;
          nominee_name: string | null;
          nominee_nid: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["customers"]["Row"]> & {
          project_id: string;
          customer_code: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Row"]>;
      };
      receipts: {
        Row: {
          id: string;
          project_id: string;
          customer_id: string;
          receipt_number: string;
          receipt_date: string;
          status: ReceiptStatus;
          note: string | null;
          prepared_by: string | null;
          authorized_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["receipts"]["Row"]> & {
          project_id: string;
          customer_id: string;
          receipt_number: string;
        };
        Update: Partial<Database["public"]["Tables"]["receipts"]["Row"]>;
      };
      receipt_items: {
        Row: {
          id: string;
          receipt_id: string;
          sl: number;
          description: string;
          payment_method: string;
          total_unit_price: number;
          amount_paid: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["receipt_items"]["Row"]> & {
          receipt_id: string;
          sl: number;
          description: string;
          payment_method: string;
        };
        Update: Partial<Database["public"]["Tables"]["receipt_items"]["Row"]>;
      };
      project_sequences: {
        Row: {
          project_id: string;
          last_receipt_number: number;
          last_customer_number: number;
        };
        Insert: Database["public"]["Tables"]["project_sequences"]["Row"];
        Update: Partial<Database["public"]["Tables"]["project_sequences"]["Row"]>;
      };
    };
    Functions: {
      next_receipt_number: {
        Args: { p_project_id: string };
        Returns: string;
      };
      next_customer_code: {
        Args: { p_project_id: string };
        Returns: string;
      };
    };
  };
}
