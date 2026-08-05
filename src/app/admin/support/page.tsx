"use client";

import { useEffect, useState, useCallback } from "react";
import { HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton, EmptyState } from "@/components/ui/skeleton";
import { getTickets, updateTicketStatusAction, type TicketRow } from "@/lib/actions/support";
import { formatDate } from "@/lib/utils";

const statusColors: Record<string, string> = {
  open: "bg-blue-50 text-blue-700 border-blue-200",
  "in-progress": "bg-amber-50 text-amber-700 border-amber-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-gray-50 text-gray-500 border-gray-200",
};

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setLoading(true); const d = await getTickets(); setTickets(d); } catch { toast.error("Failed to load"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function handleStatusChange(id: string, status: string) {
    const result = await updateTicketStatusAction(id, status);
    if (result.error) { toast.error(result.error); return; }
    toast.success("Status updated");
    load();
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Support" description="Manage support tickets" />
      <Card>
        <CardContent className="p-0">
          {loading ? <TableSkeleton rows={5} /> : tickets.length === 0 ? (
            <EmptyState title="No tickets" description="Support tickets from clients will appear here" icon={<HelpCircle className="h-10 w-10" />} />
          ) : (
            <div className="divide-y divide-gray-50">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">{ticket.subject}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{ticket.clients?.profiles?.full_name || ""} · {ticket.clients?.company || ""}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{ticket.description}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <Badge className={`border text-[10px] ${statusColors[ticket.priority] || "bg-gray-50 text-gray-600 border-gray-200"}`}>{ticket.priority}</Badge>
                    <Select value={ticket.status} onChange={(e) => handleStatusChange(ticket.id, e.target.value)} className="w-auto h-8 text-xs">
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </Select>
                    <span className="text-xs text-gray-400 hidden sm:inline">{formatDate(ticket.created_at)}</span>
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
