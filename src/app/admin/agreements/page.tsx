"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, FileSignature, Send, Eye } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton, EmptyState } from "@/components/ui/skeleton";
import { getAgreements, sendAgreementToClient, type AgreementWithClient } from "@/lib/actions/agreements";
import { formatDate, formatCurrency } from "@/lib/utils";

const statusColors: Record<string, string> = {
  draft: "bg-slate-50 text-slate-600 border-slate-200",
  sent: "bg-blue-50 text-blue-700 border-blue-200",
  active: "bg-blue-50 text-blue-700 border-blue-200",
  accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  expired: "bg-gray-50 text-gray-500 border-gray-200",
  terminated: "bg-red-50 text-red-700 border-red-200",
};

export default function AdminAgreementsPage() {
  const [agreements, setAgreements] = useState<AgreementWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    try { setLoading(true); const d = await getAgreements(filter); setAgreements(d); } catch { toast.error("Failed to load"); } finally { setLoading(false); }
  }, [filter]);
  useEffect(() => { load(); }, [load]);

  async function handleSend(id: string) {
    const result = await sendAgreementToClient(id);
    if (result.error) { toast.error(result.error); return; }
    toast.success("Agreement sent to client");
    load();
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Agreements" description="Manage client agreements">
        <Link href="/admin/agreements/new"><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Create Agreement</Button></Link>
      </PageHeader>

      <div className="flex items-center gap-3">
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-auto">
          <option value="all">All Agreements</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="accepted">Accepted</option>
          <option value="expired">Expired</option>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? <TableSkeleton rows={4} /> : agreements.length === 0 ? (
            <EmptyState title="No agreements" description="Create your first agreement" icon={<FileSignature className="h-10 w-10" />} />
          ) : (
            <div className="divide-y divide-gray-50">
              {agreements.map((agr) => (
                <div key={agr.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-900 truncate">{agr.title}</p>
                      <Badge className={`border text-[10px] ${statusColors[agr.status] || statusColors.draft}`}>{agr.status}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {agr.clients?.profiles?.full_name} · {agr.clients?.company}
                      {agr.projects?.name ? ` · ${agr.projects.name}` : ""}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      {agr.agreement_number && <span>{agr.agreement_number}</span>}
                      {agr.amount && <span>{formatCurrency(agr.amount)}</span>}
                      <span>{formatDate(agr.created_at)}</span>
                      {agr.accepted_at && <span className="text-emerald-600">Accepted {formatDate(agr.accepted_at)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    {agr.status === "draft" && (
                      <Button variant="outline" size="sm" className="text-xs" onClick={() => handleSend(agr.id)}><Send className="h-3 w-3 mr-1" /> Send</Button>
                    )}
                    <Link href={`/admin/agreements/${agr.id}`}><Button variant="ghost" size="sm" className="text-xs"><Eye className="h-3 w-3 mr-1" /> View</Button></Link>
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
