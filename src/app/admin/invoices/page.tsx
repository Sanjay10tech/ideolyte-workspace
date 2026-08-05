"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Receipt, Eye } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton, EmptyState } from "@/components/ui/skeleton";
import { getInvoices, type InvoiceWithClient } from "@/lib/actions/invoices";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusColors: Record<string, string> = {
  draft: "bg-gray-50 text-gray-700 border-gray-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  overdue: "bg-red-50 text-red-700 border-red-200",
  cancelled: "bg-gray-50 text-gray-400 border-gray-200",
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceWithClient[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setLoading(true); const d = await getInvoices(); setInvoices(d); } catch { toast.error("Failed to load invoices"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const outstanding = invoices.filter(i => i.status === "pending" || i.status === "overdue").reduce((a, i) => a + i.total_amount - (i.paid_amount || 0), 0);
  const paid = invoices.filter(i => i.status === "paid").reduce((a, i) => a + i.total_amount, 0);
  const overdue = invoices.filter(i => i.status === "overdue").reduce((a, i) => a + i.total_amount - (i.paid_amount || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Invoices" description="Manage billing and invoices">
        <Link href="/admin/invoices/new">
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Create Invoice</Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4"><p className="text-xs text-gray-500">Total Outstanding</p><p className="text-xl font-semibold text-gray-900 mt-1">{formatCurrency(outstanding)}</p></Card>
        <Card className="p-4"><p className="text-xs text-gray-500">Total Paid</p><p className="text-xl font-semibold text-emerald-600 mt-1">{formatCurrency(paid)}</p></Card>
        <Card className="p-4"><p className="text-xs text-gray-500">Overdue</p><p className="text-xl font-semibold text-red-600 mt-1">{formatCurrency(overdue)}</p></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? <TableSkeleton rows={5} /> : invoices.length === 0 ? (
            <EmptyState title="No invoices yet" description="Create your first invoice to get started" icon={<Receipt className="h-10 w-10" />} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-100">
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr></thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4"><p className="text-sm font-medium text-gray-900">{inv.invoice_number}</p><p className="text-xs text-gray-500">{inv.projects?.name || ""}</p></td>
                      <td className="px-5 py-4 text-sm text-gray-600">{inv.clients?.profiles?.full_name}</td>
                      <td className="px-5 py-4 text-sm font-medium text-gray-900">{formatCurrency(inv.total_amount)}</td>
                      <td className="px-5 py-4 text-sm text-emerald-600">{formatCurrency(inv.paid_amount || 0)}</td>
                      <td className="px-5 py-4"><Badge className={`border text-[10px] ${statusColors[inv.status] || ""}`}>{inv.status}</Badge></td>
                      <td className="px-5 py-4 text-sm text-gray-500">{formatDate(inv.due_date)}</td>
                      <td className="px-5 py-4 text-right">
                        <Link href={`/admin/invoices/${inv.id}`}><Button variant="ghost" size="sm" className="h-7"><Eye className="h-3.5 w-3.5" /></Button></Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
