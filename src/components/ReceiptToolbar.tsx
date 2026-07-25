import { Download, Eraser, Printer, Save, FileEdit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ReceiptStatus } from "@/types/database.types";

interface ReceiptToolbarProps {
  status: ReceiptStatus;
  saving: boolean;
  onSave: () => void;
  onSaveDraft: () => void;
  onPrintPreview: () => void;
  onPrint: () => void;
  onDownloadPdf: () => void;
  onClear: () => void;
}

const STATUS_VARIANT: Record<ReceiptStatus, "warning" | "success" | "destructive"> = {
  draft: "warning",
  final: "success",
  cancelled: "destructive",
};

export function ReceiptToolbar({
  status,
  saving,
  onSave,
  onSaveDraft,
  onPrintPreview,
  onPrint,
  onDownloadPdf,
  onClear,
}: ReceiptToolbarProps) {
  return (
    <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-md border bg-white p-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-slate-600">Status:</span>
        <Badge variant={STATUS_VARIANT[status]} className="capitalize">
          {status}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={onSaveDraft} disabled={saving}>
          <FileEdit /> Save Draft
        </Button>
        <Button size="sm" onClick={onSave} disabled={saving}>
          <Save /> Save
        </Button>
        <Button size="sm" variant="secondary" onClick={onPrintPreview}>
          Print Preview
        </Button>
        <Button size="sm" variant="secondary" onClick={onPrint}>
          <Printer /> Print
        </Button>
        <Button size="sm" variant="secondary" onClick={onDownloadPdf}>
          <Download /> Download PDF
        </Button>
        <Button size="sm" variant="ghost" onClick={onClear}>
          <Eraser /> Clear Form
        </Button>
      </div>
    </div>
  );
}
