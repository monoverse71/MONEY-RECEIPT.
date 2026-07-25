export interface Customer {
  id: string;
  project_id: string;
  customer_code: string;
  name: string;
  nid: string | null;
  mobile: string | null;
  nominee_name: string | null;
  nominee_nid: string | null;
}

export type CustomerSearchField = "customer_code" | "name" | "mobile" | "nid" | "receipt_number";
