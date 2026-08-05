"use client";

import { useEffect, useState, useCallback } from "react";
import { HelpCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { Dialog, DialogHeader, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/skeleton";
import { getClientTickets, createTicketAction } from "@/lib/actions/support";
import { formatDate } from "@/lib/utils";

const statusColors: Record<string, string> = {
  open: "bg-blue-50 text-blue-700 border-blue-200",
  "in-progress": "bg-amber-50 text-amber-700 border-amber-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-gray-50 text-gray-500 border-gray-200",
};

type Ticket = { id: string; subject: string; description: string; status: string; priority: string; created_at: string; resolved_at: string | null };

export default function ClientSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const load = useCallback(async () => {
    try { setLoading(true); const d = await getClientTickets(); setTickets(d as Ticket[]); } catch { toast.error("Failed to load"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await createTicketAction(formData);
    setFormLoading(false);
    if (result.error) { toast.error(result.error); return; }
    toast.success("Support request submitted");
    setFormOpen(false); load();
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Support" description="Get help with your projects">
        <Button size="sm" onClick={() => setFormOpen(true)}><Plus className="h-4 w-4 mr-1" /> New Request</Button>
      </PageHeader>

      {/* Tickets */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><HelpCircle className="h-4 w-4" /> Your Requests</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-gray-400">Loading...</p> : tickets.length === 0 ? (
            <EmptyState title="No requests" description="Submit a request if you need help" icon={<HelpCircle className="h-8 w-8" />} />
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-50 hover:bg-gray-50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{t.subject}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{t.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <Badge className={`border text-[10px] ${statusColors[t.status] || ""}`}>{t.status.replace("-", " ")}</Badge>
                    <span className="text-xs text-gray-400 hidden sm:inline">{formatDate(t.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Ticket Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)}>
        <DialogHeader onClose={() => setFormOpen(false)}>Submit Support Request</DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogContent className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Subject *</label><Input name="subject" required placeholder="Brief description" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
              <Select name="priority"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></Select>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label><Textarea name="description" required rows={4} placeholder="Describe your issue..." /></div>
          </DialogContent>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button><Button type="submit" disabled={formLoading}>{formLoading ? <LoadingSpinner size="sm" /> : "Submit"}</Button></DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
