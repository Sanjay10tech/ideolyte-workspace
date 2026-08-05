"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Download, DollarSign } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { Dialog, DialogHeader, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { LoadingSpinner, PageLoader } from "@/components/ui/loading-spinner";
import { getInvoiceById, updateInvoiceStatus, type InvoiceWithClient } from "@/lib/actions/invoices";
import { recordPaymentAction } from "@/lib/actions/payments";
import { downloadPdf, type PdfData } from "@/lib/pdf/generate-pdf";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function InvoiceDetailPage() {
  const params = useParams();
  const [invoice, setInvoice] = useState<InvoiceWithClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentForm, setPaymentForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const load = useCallback(async () => {
    try { setLoading(true); const d = await getInvoiceById(params.id as string); setInvoice(d); } catch { toast.error("Failed to load"); } finally { setLoading(false); }
  }, [params.id]);
  useEffect(() => { load(); }, [load]);

  if (loading) return <PageLoader />;
  if (!invoice) return <p className="text-center text-gray-500 py-12">Invoice not found</p>;

  const balance = invoice.total_amount - (invoice.paid_amount || 0);

  async function handlePayment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("invoice_id", invoice!.id);
    formData.set("client_id", invoice!.client_id);
    const result = await recordPaymentAction(formData);
    setFormLoading(false);
    if (result.error) { toast.error(result.error); return; }
    toast.success("Payment recorded");
    setPaymentForm(false); load();
  }

  async function handleStatusChange(status: string) {
    const result = await updateInvoiceStatus(invoice!.id, status);
    if (result.error) { toast.error(result.error); return; }
    toast.success("Status updated"); load();
  }

  function handleDownload() {
    if (!invoice) return;
    const pdfData: PdfData = {
      type: "invoice", documentNumber: invoice.invoice_number, date: formatDate(invoice.issued_date), dueDate: formatDate(invoice.due_date),
      companyName: "Ideolyte", companyEmail: "hello@ideolyte.com", companyPhone: "+1 (555) 123-4567", companyAddress: "San Francisco, CA",
      clientName: invoice.clients?.profiles?.full_name || "", clientCompany: invoice.clients?.company || "", clientEmail: invoice.clients?.profiles?.email || "",
      projectName: invoice.projects?.name || undefined,
      items: invoice.invoice_items?.map(i => ({ description: i.description, quantity: i.quantity, unitPrice: i.unit_price, total: i.total })) || [],
      subtotal: invoice.subtotal, discount: invoice.discount, discountAmount: invoice.subtotal * ((invoice.discount || 0) / 100),
      taxRate: invoice.tax_rate, taxAmount: invoice.tax_amount, total: invoice.total_amount,
      paidAmount: invoice.paid_amount || 0, balance, notes: invoice.notes || undefined,
    };
    downloadPdf(pdfData);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title={invoice.invoice_number} description={`Invoice for ${invoice.clients?.profiles?.full_name}`}>
        <div className="flex gap-2">
          <Select value={invoice.status} onChange={e => handleStatusChange(e.target.value)} className="w-auto h-9 text-xs">
            <option value="draft">Draft</option><option value="pending">Pending</option><option value="paid">Paid</option><option value="overdue">Overdue</option>
          </Select>
          <Button size="sm" variant="outline" onClick={handleDownload}><Download className="h-3.5 w-3.5 mr-1" /> PDF</Button>
          {balance > 0 && <Button size="sm" onClick={() => setPaymentForm(true)}><DollarSign className="h-3.5 w-3.5 mr-1" /> Record Payment</Button>}
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card className="p-4"><p className="text-xs text-gray-500">Total</p><p className="text-lg font-semibold mt-1">{formatCurrency(invoice.total_amount)}</p></Card>
        <Card className="p-4"><p className="text-xs text-gray-500">Paid</p><p className="text-lg font-semibold text-emerald-600 mt-1">{formatCurrency(invoice.paid_amount || 0)}</p></Card>
        <Card className="p-4"><p className="text-xs text-gray-500">Balance</p><p className="text-lg font-semibold text-red-600 mt-1">{formatCurrency(balance)}</p></Card>
        <Card className="p-4"><p className="text-xs text-gray-500">Status</p><Badge className="mt-2 border bg-blue-50 text-blue-700 border-blue-200">{invoice.status}</Badge></Card>
      </div>

      {/* Items */}
      <Card>
        <CardHeader><CardTitle className="text-base">Line Items</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead><tr className="border-b border-gray-100 bg-gray-50"><th className="px-5 py-2 text-left text-xs font-medium text-gray-500">Description</th><th className="px-5 py-2 text-center text-xs font-medium text-gray-500">Qty</th><th className="px-5 py-2 text-right text-xs font-medium text-gray-500">Rate</th><th className="px-5 py-2 text-right text-xs font-medium text-gray-500">Amount</th></tr></thead>
            <tbody>
              {invoice.invoice_items?.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-50"><td className="px-5 py-3 text-sm">{item.description}</td><td className="px-5 py-3 text-sm text-center">{item.quantity}</td><td className="px-5 py-3 text-sm text-right">{formatCurrency(item.unit_price)}</td><td className="px-5 py-3 text-sm text-right font-medium">{formatCurrency(item.total)}</td></tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Record Payment Dialog */}
      <Dialog open={paymentForm} onClose={() => setPaymentForm(false)}>
        <DialogHeader onClose={() => setPaymentForm(false)}>Record Payment</DialogHeader>
        <form onSubmit={handlePayment}>
          <DialogContent className="space-y-4">
            <p className="text-sm text-gray-500">Balance due: <strong>{formatCurrency(balance)}</strong></p>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Amount *</label><Input name="amount" type="number" step="0.01" required max={balance} defaultValue={balance} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Date *</label><Input name="paid_at" type="date" required defaultValue={new Date().toISOString().split("T")[0]} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Method *</label>
              <Select name="payment_method" required><option value="bank_transfer">Bank Transfer</option><option value="credit_card">Credit Card</option><option value="paypal">PayPal</option><option value="other">Other</option></Select>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Reference/Transaction ID</label><Input name="transaction_id" placeholder="TXN-12345" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label><Input name="notes" placeholder="Optional notes" /></div>
          </DialogContent>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setPaymentForm(false)}>Cancel</Button><Button type="submit" disabled={formLoading}>{formLoading ? <LoadingSpinner size="sm" /> : "Record Payment"}</Button></DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
