"use client";

import { useEffect, useState, useCallback } from "react";
import { DollarSign, TrendingUp, ArrowUpRight, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton, EmptyState } from "@/components/ui/skeleton";
import { getPayments, type PaymentWithInvoice } from "@/lib/actions/payments";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentWithInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const d = await getPayments();
      setPayments(d);
    } catch (err) {
      console.error("Payments load error:", err);
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const totalReceived = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" description="Track all payments received" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Total Received" value={formatCurrency(totalReceived)} icon={DollarSign} accent="green" />
        <StatCard title="Transactions" value={payments.length.toString()} icon={TrendingUp} accent="blue" />
        <StatCard title="Average Payment" value={payments.length > 0 ? formatCurrency(totalReceived / payments.length) : "₹0"} icon={CreditCard} accent="purple" />
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle>Payment History</CardTitle></CardHeader>
        <CardContent>
          {loading ? <TableSkeleton rows={5} /> : payments.length === 0 ? (
            <EmptyState title="No payments yet" description="Payments will appear here once recorded against invoices" icon={<DollarSign className="h-10 w-10" />} />
          ) : (
            <div className="space-y-2">
              {payments.map((payment) => (
                <div key={payment.id} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-slate-100 p-3 sm:p-4 hover:bg-slate-50 transition-colors gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50"><ArrowUpRight className="h-4 w-4 text-emerald-600" /></div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{payment.clients?.profiles?.full_name || "Client"}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {payment.invoices?.invoice_number || "Invoice"} · {payment.payment_method?.replace("_", " ") || "N/A"}
                      </p>
                      <p className="text-[11px] text-slate-400">{formatDate(payment.paid_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 ml-12 sm:ml-0">
                    {payment.transaction_id && <Badge variant="secondary" className="text-[10px]">{payment.transaction_id}</Badge>}
                    <p className="text-sm font-semibold text-emerald-600 whitespace-nowrap">+{formatCurrency(Number(payment.amount))}</p>
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
