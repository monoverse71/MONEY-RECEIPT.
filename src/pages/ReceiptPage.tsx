import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectSelector } from "@/components/ProjectSelector";
import { CustomerSearch } from "@/components/CustomerSearch";
import { CustomerInfoForm } from "@/components/CustomerInfoForm";
import { PaymentBreakdownTable } from "@/components/PaymentBreakdownTable";
import { ReceiptToolbar } from "@/components/ReceiptToolbar";
import { ReceiptPreview } from "@/components/ReceiptPreview";
import { useProjects } from "@/features/projects/hooks/useProjects";
import { useCustomers } from "@/features/customers/hooks/useCustomers";
import { useReceiptNumber } from "@/features/receipts/hooks/useReceiptNumber";
import { todayISO } from "@/lib/utils";
import type { Customer } from "@/features/customers/types";
import type { ReceiptFormState } from "@/features/receipts/types";
import { saveReceipt, isSupabaseConfigured, getLatestReceiptItemsForCustomer } from "@/lib/dataService";
import { DemoModeBanner } from "@/components/DemoModeBanner";
import { focusNextInputOnEnter } from "@/lib/focusNavigation";

const EMPTY_FORM: ReceiptFormState = {
  receiptNumber: "",
  receiptDate: todayISO(),
  status: "draft",
  customerId: null,
  customerCode: "",
  customerName: "",
  nid: "",
  mobile: "",
  nomineeName: "",
  nomineeNid: "",
  items: [
    {
      id: crypto.randomUUID(),
      sl: 1,
      description: "",
      paymentMethod: "Bank Transfer",
      totalUnitPrice: 0,
      amountPaid: 0,
    },
  ],
  note: "All payments are non-refundable and subject to clearance of cheque/transfer.",
  preparedBy: "",
  authorizedBy: "",
};

export default function ReceiptPage() {
  const { projects, loading: projectsLoading } = useProjects();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [customerMode, setCustomerMode] = useState<"new" | "existing">("new");
  const [form, setForm] = useState<ReceiptFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const { results, searching, search, createCustomer } = useCustomers(projectId);
  const { reserveNext } = useReceiptNumber();

  const activeProject = useMemo(
    () => projects.find((p) => p.id === projectId) ?? null,
    [projects, projectId]
  );

  // Select the first project once the list loads.
  useEffect(() => {
    if (!projectId && projects.length > 0) {
      setProjectId(projects[0].id);
    }
  }, [projects, projectId]);

  function handleProjectChange(id: string) {
    setProjectId(id);
    setForm(EMPTY_FORM);
  }

  function handleFieldChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSelectCustomer(customer: Customer) {
    setForm((prev) => ({
      ...prev,
      customerId: customer.id,
      customerCode: customer.customer_code,
      customerName: customer.name,
      nid: customer.nid ?? "",
      mobile: customer.mobile ?? "",
      nomineeName: customer.nominee_name ?? "",
      nomineeNid: customer.nominee_nid ?? "",
    }));

    // Restore this customer's most recently saved payment breakdown exactly
    // as stored - every description, payment method, unit price, and paid
    // amount comes straight from the database, never recalculated or
    // replaced with a default value.
    try {
      const savedItems = await getLatestReceiptItemsForCustomer(customer.id);
      if (savedItems && savedItems.length > 0) {
        setForm((prev) => ({ ...prev, items: savedItems }));
      }
    } catch (err) {
      setSaveMessage(
        err instanceof Error
          ? `Selected customer, but couldn't restore their saved payment history: ${err.message}`
          : "Selected customer, but couldn't restore their saved payment history."
      );
    }
  }

  async function persistReceipt(status: "draft" | "final") {
    if (!projectId) {
      setSaveMessage("Select a project first.");
      return;
    }
    setSaving(true);
    setSaveMessage(null);

    try {
      // 1. Resolve the customer: create a new one, or use the selected existing one.
      let customerId = form.customerId;
      let customerCode = form.customerCode;

      if (customerMode === "new") {
        if (!form.customerName.trim()) throw new Error("Customer name is required.");
        const created = await createCustomer({
          name: form.customerName,
          nid: form.nid,
          mobile: form.mobile,
          nominee_name: form.nomineeName,
          nominee_nid: form.nomineeNid,
        });
        customerId = created.id;
        customerCode = created.customer_code;
      }

      if (!customerId) throw new Error("Select an existing customer or fill in a new one.");

      // 2. Reserve a receipt number if one hasn't been assigned yet.
      let receiptNumber = form.receiptNumber;
      if (!receiptNumber) {
        const next = await reserveNext(projectId);
        if (!next) throw new Error("Could not generate a receipt number.");
        receiptNumber = next;
      }

      // 3. Save the receipt header + payment breakdown rows via the data
      //    service (transparently uses Supabase when configured, or the
      //    local in-memory demo store otherwise).
      await saveReceipt({
        projectId,
        customerId,
        receiptNumber,
        receiptDate: form.receiptDate,
        status,
        note: form.note,
        preparedBy: form.preparedBy,
        authorizedBy: form.authorizedBy,
        items: form.items.map((it) => ({
          sl: it.sl,
          description: it.description,
          paymentMethod: it.paymentMethod,
          totalUnitPrice: it.totalUnitPrice,
          amountPaid: it.amountPaid,
        })),
      });

      setForm((prev) => ({ ...prev, receiptNumber, customerId, customerCode, status }));
      setSaveMessage(`Receipt ${receiptNumber} saved as ${status}.`);
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : "Failed to save receipt.");
    } finally {
      setSaving(false);
    }
  }

  function handleClear() {
    setForm(EMPTY_FORM);
    setCustomerMode("new");
    setSaveMessage(null);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-secondary/40 pb-16">
      <header className="border-b bg-white px-6 py-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ProjectSelector
            projects={projects}
            loading={projectsLoading}
            selectedProjectId={projectId}
            onChange={handleProjectChange}
          />
          {!isSupabaseConfigured && <DemoModeBanner />}
        </div>
      </header>

      <main className="mx-auto mt-6 grid max-w-7xl grid-cols-1 gap-6 px-6 lg:grid-cols-2">
        {/* LEFT: editable form */}
        <div className="no-print space-y-4" onKeyDown={focusNextInputOnEnter}>
          <ReceiptToolbar
            status={form.status}
            saving={saving}
            onSave={() => persistReceipt("final")}
            onSaveDraft={() => persistReceipt("draft")}
            onPrintPreview={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            onPrint={handlePrint}
            onDownloadPdf={handlePrint}
            onClear={handleClear}
          />

          {saveMessage && (
            <div className="rounded-md border border-brand-teal/30 bg-brand-teal/10 px-3 py-2 text-sm text-brand-tealDark">
              {saveMessage}
            </div>
          )}

          <Card>
            <CardContent className="space-y-4 pt-5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">
                  Receipt #: <span className="text-red-600">{form.receiptNumber || "Auto-generated on save"}</span>
                </span>
                <label className="flex items-center gap-2">
                  <span className="font-semibold">Date:</span>
                  <input
                    type="date"
                    value={form.receiptDate}
                    onChange={(e) => handleFieldChange("receiptDate", e.target.value)}
                    className="rounded-md border px-2 py-1 text-sm"
                  />
                </label>
              </div>

              <CustomerSearch
                mode={customerMode}
                onModeChange={setCustomerMode}
                results={results}
                searching={searching}
                onSearch={search}
                onSelectCustomer={handleSelectCustomer}
              />

              <CustomerInfoForm
                customerCode={customerMode === "new" ? "Auto-generated" : form.customerCode}
                customerName={form.customerName}
                nid={form.nid}
                mobile={form.mobile}
                nomineeName={form.nomineeName}
                nomineeNid={form.nomineeNid}
                readOnlyCode
                onChange={handleFieldChange}
              />
            </CardContent>
          </Card>

          <PaymentBreakdownTable items={form.items} onChange={(items) => setForm((p) => ({ ...p, items }))} />
        </div>

        {/* RIGHT: live receipt preview (this is what gets printed) */}
        <div>
          <ReceiptPreview project={activeProject} form={form} />
        </div>
      </main>
    </div>
  );
}
