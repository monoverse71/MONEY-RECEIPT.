import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { PAYMENT_METHODS, type ReceiptItem } from "@/features/receipts/types";

interface PaymentBreakdownTableProps {
  items: ReceiptItem[];
  onChange: (items: ReceiptItem[]) => void;
}

export function PaymentBreakdownTable({ items, onChange }: PaymentBreakdownTableProps) {
  function updateItem(id: string, patch: Partial<ReceiptItem>) {
    onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  function addRow() {
    onChange([
      ...items,
      {
        id: crypto.randomUUID(),
        sl: items.length + 1,
        description: "",
        paymentMethod: "Bank Transfer",
        totalUnitPrice: 0,
        amountPaid: 0,
      },
    ]);
  }

  function removeRow(id: string) {
    const filtered = items.filter((it) => it.id !== id).map((it, idx) => ({ ...it, sl: idx + 1 }));
    onChange(filtered);
  }

  const totalUnitPrice = items.reduce((sum, it) => sum + (it.totalUnitPrice || 0), 0);
  const totalPaid = items.reduce((sum, it) => sum + (it.amountPaid || 0), 0);
  const totalRemaining = totalUnitPrice - totalPaid;

  return (
    <div className="overflow-hidden rounded-md border">
      <div className="flex items-center justify-between bg-brand-navy px-4 py-2 text-sm font-bold uppercase tracking-wide text-white">
        Payment Breakdown
        <Button type="button" size="sm" variant="secondary" onClick={addRow} className="h-7 gap-1 text-xs">
          <Plus className="h-3.5 w-3.5" /> Add Row
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-slate-100">
            <TableHead className="w-12">SL</TableHead>
            <TableHead>Description / Payment Purpose</TableHead>
            <TableHead className="w-44">Payment Method</TableHead>
            <TableHead className="w-32 text-right">Total Unit Price</TableHead>
            <TableHead className="w-32 text-right">Amount Paid</TableHead>
            <TableHead className="w-32 text-right">Remaining Due</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const remaining = (item.totalUnitPrice || 0) - (item.amountPaid || 0);
            return (
              <TableRow key={item.id}>
                <TableCell className="text-center text-slate-500">{item.sl}</TableCell>
                <TableCell>
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(item.id, { description: e.target.value })}
                    placeholder="e.g. 1st Installment - Booking Advance for Unit#"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={item.paymentMethod}
                    onValueChange={(v) => updateItem(item.id, { paymentMethod: v as ReceiptItem["paymentMethod"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    className="text-right"
                    value={item.totalUnitPrice || ""}
                    onChange={(e) => updateItem(item.id, { totalUnitPrice: Number(e.target.value) })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    className="text-right"
                    value={item.amountPaid || ""}
                    onChange={(e) => updateItem(item.id, { amountPaid: Number(e.target.value) })}
                  />
                </TableCell>
                <TableCell className="text-right font-semibold text-red-600">
                  {formatCurrency(remaining)}
                </TableCell>
                <TableCell>
                  <Button type="button" size="icon" variant="ghost" onClick={() => removeRow(item.id)}>
                    <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between border-t bg-slate-100 px-4 py-2 text-sm font-bold">
        <span>TOTAL PAYMENT RECEIVED</span>
        <div className="flex gap-8 pr-14">
          <span>{formatCurrency(totalUnitPrice)}</span>
          <span className="text-emerald-700">{formatCurrency(totalPaid)}</span>
          <span className="text-red-600">{formatCurrency(totalRemaining)}</span>
        </div>
      </div>
    </div>
  );
}
