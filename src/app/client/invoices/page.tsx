"use client";

import { useEffect, useState, useCallback } from "react";
import { Download, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton, EmptyState } from "@/components/ui/skeleton";
import { getClientInvoices, type InvoiceWithClient } from "@/lib/actions/invoices";
import { downloadPdf, type PdfData } from "@/lib/pdf/generate-pdf";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusColors: Record<string, string> = {
  draft: "bg-gray-50 text-gray-700 border-gray-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  overdue: "bg-red-50 text-red-700 border-red-200",
};

export default function ClientInvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceWithClient[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setLoading(true); const d = await getClientInvoices(); setInvoices(d); } catch { toast.error("Failed to load invoices"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const totalPaid = invoices.filter(i => i.status === "paid").reduce((a, i) => a + i.total_amount, 0);
  const totalPending = invoices.filter(i => i.status === "pending" || i.status === "overdue").reduce((a, i) => a + i.total_amount - (i.paid_amount || 0), 0);

  function handleDownload(inv: InvoiceWithClient) {
    const pdfData: PdfData = {
      type: "invoice", documentNumber: inv.invoice_number, date: formatDate(inv.issued_date), dueDate: formatDate(inv.due_date),
      companyName: "Ideolyte", companyEmail: "hello@ideolyte.com", companyPhone: "+1 (555) 123-4567", companyAddress: "San Francisco, CA",
      clientName: inv.clients?.profiles?.full_name || "", clientCompany: inv.clients?.company || "", clientEmail: inv.clients?.profiles?.email || "",
      projectName: inv.projects?.name || undefined,
      items: inv.invoice_items?.map(i => ({ description: i.description, quantity: i.quantity, unitPrice: i.unit_price, total: i.total })) || [],
      subtotal: inv.subtotal, discount: inv.discount, discountAmount: inv.subtotal * ((inv.discount || 0) / 100),
      taxRate: inv.tax_rate, taxAmount: inv.tax_amount, total: inv.total_amount,
      paidAmount: inv.paid_amount || 0, balance: inv.total_amount - (inv.paid_amount || 0),
      notes: inv.notes || undefined,
    };
    downloadPdf(pdfData);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Invoices" description="Your billing history" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4"><p className="text-xs text-gray-500">Total Paid</p><p className="text-xl font-semibold text-emerald-600 mt-1">{formatCurrency(totalPaid)}</p></Card>
        <Card className="p-4"><p className="text-xs text-gray-500">Outstanding</p><p className="text-xl font-semibold text-amber-600 mt-1">{formatCurrency(totalPending)}</p></Card>
        <Card className="p-4"><p className="text-xs text-gray-500">Total Invoiced</p><p className="text-xl font-semibold text-gray-900 mt-1">{formatCurrency(invoices.reduce((a, i) => a + i.total_amount, 0))}</p></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? <TableSkeleton rows={4} /> : invoices.length === 0 ? (
            <EmptyState title="No invoices" description="Invoices will appear here once issued" icon={<Receipt className="h-10 w-10" />} />
          ) : (
            <div className="divide-y divide-gray-50">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <div><p className="text-sm font-medium text-gray-900">{inv.invoice_number}</p><p className="text-xs text-gray-500">{inv.projects?.name || ""} · Issued {formatDate(inv.issued_date)}</p></div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(inv.total_amount)}</p>
                      <Badge className={`border text-[10px] ${statusColors[inv.status] || ""}`}>{inv.status}</Badge>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDownload(inv)}><Download className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
