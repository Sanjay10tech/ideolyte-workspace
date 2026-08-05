"use client";

import { useEffect, useState, useCallback } from "react";
import { DollarSign, TrendingUp, ArrowUpRight, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton, EmptyState } from "@/components/ui/skeleton";
import { getPayments, type PaymentWithInvoice } from "@/lib/actions/payments";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentWithInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setLoading(true); const d = await getPayments(); setPayments(d); } catch { toast.error("Failed to load payments"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const totalReceived = payments.reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" description="Track all payments received" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Total Received" value={formatCurrency(totalReceived)} icon={DollarSign} />
        <StatCard title="Transactions" value={payments.length.toString()} icon={TrendingUp} />
        <StatCard title="Average Payment" value={payments.length > 0 ? formatCurrency(totalReceived / payments.length) : "₹0"} icon={CreditCard} />
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle>Payment History</CardTitle></CardHeader>
        <CardContent>
          {loading ? <TableSkeleton rows={5} /> : payments.length === 0 ? (
            <EmptyState title="No payments yet" description="Payments will appear here once recorded against invoices" icon={<DollarSign className="h-10 w-10" />} />
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between rounded-lg border border-gray-50 p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50"><ArrowUpRight className="h-4 w-4 text-emerald-600" /></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{payment.clients?.profiles?.full_name || "Client"}</p>
                      <p className="text-xs text-gray-500">{payment.payment_method.replace("_", " ")} · {payment.invoices?.invoice_number} · {formatDate(payment.paid_at)}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-emerald-600">+{formatCurrency(payment.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
