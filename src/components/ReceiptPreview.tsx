import { formatCurrency } from "@/lib/utils";
import { numberToWordsTaka } from "@/lib/numberToWords";
import type { Project } from "@/features/projects/types";
import type { ReceiptFormState } from "@/features/receipts/types";

interface ReceiptPreviewProps {
  project: Project | null;
  form: ReceiptFormState;
}

export function ReceiptPreview({ project, form }: ReceiptPreviewProps) {
  const totalUnitPrice = form.items.reduce((s, it) => s + (it.totalUnitPrice || 0), 0);
  const totalPaid = form.items.reduce((s, it) => s + (it.amountPaid || 0), 0);
  const totalRemaining = totalUnitPrice - totalPaid;

  return (
    <div
      id="receipt-print-area"
      className="mx-auto w-full max-w-[794px] border bg-white p-8 text-[13px] text-slate-900 shadow-sm print:border-0 print:shadow-none"
    >
      {/* Company name box */}
      <div className="border-2 border-brand-teal px-4 py-3 text-center">
        <h1 className="text-2xl font-extrabold uppercase tracking-wide text-brand-navy">
          {project?.name ?? "Select a Project"}
        </h1>
      </div>
      <p className="mt-1 text-center text-xs italic text-slate-500">
        Corporate Office: {project?.address ?? "—"} | Contact: {project?.contact_phone ?? "—"}
      </p>

      {/* Title banner */}
      <div className="mt-4 bg-brand-navy py-2 text-center text-lg font-bold uppercase tracking-wide text-white">
        Official Money Receipt
      </div>

      {/* Receipt # / Date */}
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="font-semibold">
          Receipt |{" "}
          <span className="font-bold text-red-600">{form.receiptNumber || "—"}</span>
        </span>
        <span>
          <span className="font-semibold">Date: </span>
          {form.receiptDate}
        </span>
      </div>

      {/* Customer & Nominee Information */}
      <div className="mt-3 overflow-hidden border">
        <div className="bg-brand-teal px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
          Customer &amp; Nominee Information
        </div>
        <table className="w-full border-collapse text-xs">
          <tbody>
            <PreviewRow label1="Customer Name:" value1={form.customerName} label2="Customer ID:" value2={form.customerCode} />
            <PreviewRow label1="National ID (NID):" value1={form.nid} label2="Mobile Number:" value2={form.mobile} />
            <PreviewRow label1="Nominee Name:" value1={form.nomineeName} label2="Nominee NID:" value2={form.nomineeNid} last />
          </tbody>
        </table>
      </div>

      {/* Payment Breakdown */}
      <div className="mt-3 overflow-hidden border">
        <div className="bg-brand-navy px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
          Payment Breakdown
        </div>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 text-left">
              <th className="border-b px-2 py-1.5 font-bold">SL</th>
              <th className="border-b px-2 py-1.5 font-bold">Description / Payment Purpose</th>
              <th className="border-b px-2 py-1.5 font-bold">Payment Method</th>
              <th className="border-b px-2 py-1.5 text-right font-bold">Total Unit Price</th>
              <th className="border-b px-2 py-1.5 text-right font-bold">Amount Paid</th>
              <th className="border-b px-2 py-1.5 text-right font-bold">Remaining Due</th>
            </tr>
          </thead>
          <tbody>
            {form.items.map((item) => (
              <tr key={item.id}>
                <td className="border-b px-2 py-1.5 text-center">{item.sl}</td>
                <td className="border-b px-2 py-1.5">{item.description || "—"}</td>
                <td className="border-b px-2 py-1.5">{item.paymentMethod}</td>
                <td className="border-b px-2 py-1.5 text-right">{formatCurrency(item.totalUnitPrice)}</td>
                <td className="border-b px-2 py-1.5 text-right">{formatCurrency(item.amountPaid)}</td>
                <td className="border-b px-2 py-1.5 text-right font-semibold text-red-600">
                  {formatCurrency(item.totalUnitPrice - item.amountPaid)}
                </td>
              </tr>
            ))}
            <tr className="bg-slate-100 font-bold">
              <td colSpan={3} className="px-2 py-1.5 text-right uppercase">
                Total Payment Received
              </td>
              <td className="px-2 py-1.5 text-right">{formatCurrency(totalUnitPrice)}</td>
              <td className="px-2 py-1.5 text-right text-emerald-700">{formatCurrency(totalPaid)}</td>
              <td className="px-2 py-1.5 text-right text-red-600">{formatCurrency(totalRemaining)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* In words */}
      <div className="mt-3 rounded-sm bg-slate-50 px-3 py-2 text-xs italic">
        <span className="font-bold not-italic text-brand-navy">In Words: </span>
        {numberToWordsTaka(totalPaid)}
      </div>
      <p className="mt-1 text-[11px] italic text-slate-500">Note: {form.note}</p>

      {/* Signatures */}
      <div className="mt-14 flex justify-between text-xs">
        <SignatureLine label="Customer Signature" />
        <SignatureLine label="Prepared By" />
        <SignatureLine label="Authorized Signatory" />
      </div>
    </div>
  );
}

function PreviewRow({
  label1,
  value1,
  label2,
  value2,
  last = false,
}: {
  label1: string;
  value1: string;
  label2: string;
  value2: string;
  last?: boolean;
}) {
  return (
    <tr className={last ? "" : "border-b"}>
      <td className="w-32 border-b px-2 py-1.5 font-semibold">{label1}</td>
      <td className="border-b px-2 py-1.5">{value1 || "—"}</td>
      <td className="w-32 border-b px-2 py-1.5 font-semibold">{label2}</td>
      <td className="border-b px-2 py-1.5">{value2 || "—"}</td>
    </tr>
  );
}

function SignatureLine({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="w-40 border-t border-dashed border-slate-500 pt-1 text-center">{label}</span>
    </div>
  );
}
