import type React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CustomerInfoFormProps {
  customerCode: string;
  customerName: string;
  nid: string;
  mobile: string;
  nomineeName: string;
  nomineeNid: string;
  readOnlyCode?: boolean;
  onChange: (field: string, value: string) => void;
}

export function CustomerInfoForm({
  customerCode,
  customerName,
  nid,
  mobile,
  nomineeName,
  nomineeNid,
  readOnlyCode = true,
  onChange,
}: CustomerInfoFormProps) {
  return (
    <div className="overflow-hidden rounded-md border">
      <div className="bg-brand-teal px-4 py-2 text-sm font-bold uppercase tracking-wide text-white">
        Customer &amp; Nominee Information
      </div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-3 p-4 md:grid-cols-2">
        <FieldRow label="Customer Name">
          <Input
            value={customerName}
            onChange={(e) => onChange("customerName", e.target.value)}
            placeholder="Full name"
          />
        </FieldRow>
        <FieldRow label="Customer ID">
          <Input value={customerCode} readOnly={readOnlyCode} className="bg-slate-50 font-medium" />
        </FieldRow>

        <FieldRow label="National ID (NID)">
          <Input value={nid} onChange={(e) => onChange("nid", e.target.value)} placeholder="NID number" />
        </FieldRow>
        <FieldRow label="Mobile Number">
          <Input value={mobile} onChange={(e) => onChange("mobile", e.target.value)} placeholder="01XXXXXXXXX" />
        </FieldRow>

        <FieldRow label="Nominee Name">
          <Input
            value={nomineeName}
            onChange={(e) => onChange("nomineeName", e.target.value)}
            placeholder="Nominee full name"
          />
        </FieldRow>
        <FieldRow label="Nominee NID">
          <Input
            value={nomineeNid}
            onChange={(e) => onChange("nomineeNid", e.target.value)}
            placeholder="Nominee NID number"
          />
        </FieldRow>
      </div>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs text-slate-600">{label}</Label>
      {children}
    </div>
  );
}
