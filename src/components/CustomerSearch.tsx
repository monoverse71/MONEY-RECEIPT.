import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Customer, CustomerSearchField } from "@/features/customers/types";

interface CustomerSearchProps {
  mode: "new" | "existing";
  onModeChange: (mode: "new" | "existing") => void;
  results: Customer[];
  searching: boolean;
  onSearch: (field: CustomerSearchField, query: string) => void;
  onSelectCustomer: (customer: Customer) => void;
}

const FIELD_OPTIONS: { value: CustomerSearchField; label: string }[] = [
  { value: "customer_code", label: "Customer ID" },
  { value: "name", label: "Customer Name" },
  { value: "mobile", label: "Mobile Number" },
  { value: "nid", label: "National ID (NID)" },
  { value: "receipt_number", label: "Receipt Number" },
];

export function CustomerSearch({
  mode,
  onModeChange,
  results,
  searching,
  onSearch,
  onSelectCustomer,
}: CustomerSearchProps) {
  const [field, setField] = useState<CustomerSearchField>("name");
  const [query, setQuery] = useState("");

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === "new" ? "default" : "outline"}
          onClick={() => onModeChange("new")}
        >
          New Customer
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "existing" ? "default" : "outline"}
          onClick={() => onModeChange("existing")}
        >
          Existing Customer
        </Button>
      </div>

      {mode === "existing" && (
        <div className="space-y-2 rounded-md border bg-slate-50 p-3">
          <div className="flex gap-2">
            <Select value={field} onValueChange={(v) => setField(v as CustomerSearchField)}>
              <SelectTrigger className="w-44 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search by ${FIELD_OPTIONS.find((f) => f.value === field)?.label.toLowerCase()}...`}
              className="bg-white"
              onKeyDown={(e) => e.key === "Enter" && onSearch(field, query)}
            />
            <Button type="button" size="icon" variant="secondary" onClick={() => onSearch(field, query)}>
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {searching && <p className="text-xs text-muted-foreground">Searching...</p>}

          {!searching && results.length > 0 && (
            <div className="max-h-40 overflow-y-auto rounded-md border bg-white">
              {results.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => onSelectCustomer(c)}
                  className="flex w-full flex-col border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-slate-100"
                >
                  <span className="font-semibold text-brand-navy">
                    {c.name} <span className="font-normal text-muted-foreground">({c.customer_code})</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {c.mobile ?? "No mobile"} · {c.nid ?? "No NID"}
                  </span>
                </button>
              ))}
            </div>
          )}

          {!searching && query && results.length === 0 && (
            <p className="text-xs text-muted-foreground">No matching customers found.</p>
          )}
        </div>
      )}
    </div>
  );
}
