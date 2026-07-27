import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ClearProjectDataDialogProps {
  projectName: string | null;
  onConfirm: () => Promise<void>;
}

const CONFIRM_WORD = "DELETE";

export function ClearProjectDataDialog({ projectName, onConfirm }: ClearProjectDataDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDelete = confirmText === CONFIRM_WORD && !deleting;

  function handleOpenChange(next: boolean) {
    if (deleting) return; // don't allow closing mid-operation
    setOpen(next);
    if (!next) {
      setConfirmText("");
      setError(null);
    }
  }

  async function handleDelete() {
    if (!canDelete) return;
    setDeleting(true);
    setError(null);
    try {
      await onConfirm();
      setOpen(false);
      setConfirmText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear project data.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="destructive">
          <Trash2 /> Clear Current Project Data
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clear all data for this project?</DialogTitle>
          <DialogDescription>
            This will permanently delete every customer, receipt, and payment record for{" "}
            <strong className="text-foreground">{projectName ?? "this project"}</strong>, and
            reset its numbering back to CUST-001 / REC-000001. Other projects are not affected.
            This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="clear-project-confirm-input">
            Type <span className="font-mono text-red-600">{CONFIRM_WORD}</span> to confirm
          </Label>
          <Input
            id="clear-project-confirm-input"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={CONFIRM_WORD}
            autoComplete="off"
            autoFocus
          />
        </div>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={!canDelete}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
