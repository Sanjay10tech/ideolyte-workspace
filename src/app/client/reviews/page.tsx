"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, Clock, FileCheck } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";
import { Dialog, DialogHeader, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/skeleton";
import { getClientReviews, approveReview, requestChanges, type ProjectReview } from "@/lib/actions/reviews";
import { formatDate } from "@/lib/utils";

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  awaiting_client: { label: "Awaiting Your Review", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Clock },
  changes_requested: { label: "Changes Requested", color: "bg-amber-50 text-amber-700 border-amber-200", icon: AlertTriangle },
  approved: { label: "Approved", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  resubmitted: { label: "Resubmitted", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Clock },
};

export default function ClientReviewsPage() {
  const [reviews, setReviews] = useState<ProjectReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [approveOpen, setApproveOpen] = useState<string | null>(null);
  const [changesOpen, setChangesOpen] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [checked, setChecked] = useState([false, false, false]);

  const load = useCallback(async () => {
    try { setLoading(true); const d = await getClientReviews(); setReviews(d); } catch { /* empty */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function handleApprove(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!approveOpen) return;
    setFormLoading(true);
    const comment = (e.currentTarget.elements.namedItem("comment") as HTMLTextAreaElement)?.value || "";
    const result = await approveReview(approveOpen, comment);
    setFormLoading(false);
    if (result.error) { toast.error(result.error); return; }
    toast.success("Project approved successfully!");
    setApproveOpen(null); setChecked([false, false, false]); load();
  }

  async function handleChanges(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!changesOpen) return;
    setFormLoading(true);
    const comment = (e.currentTarget.elements.namedItem("comment") as HTMLTextAreaElement)?.value || "";
    const priority = (e.currentTarget.elements.namedItem("priority") as HTMLSelectElement)?.value || "medium";
    const result = await requestChanges(changesOpen, comment, priority);
    setFormLoading(false);
    if (result.error) { toast.error(result.error); return; }
    toast.success("Change request submitted");
    setChangesOpen(null); load();
  }

  const pendingReviews = reviews.filter(r => r.status === "awaiting_client");

  return (
    <div className="space-y-6">
      <PageHeader title="Review Requests" description="Review and approve your projects">
        {pendingReviews.length > 0 && <Badge className="bg-blue-50 text-blue-700 border border-blue-200">{pendingReviews.length} pending</Badge>}
      </PageHeader>

      {loading ? <div className="space-y-4"><Card><CardContent className="p-6"><LoadingSpinner /></CardContent></Card></div> : reviews.length === 0 ? (
        <Card><CardContent className="p-0"><EmptyState title="No review requests" description="You'll be notified when a project is ready for review" icon={<FileCheck className="h-10 w-10" />} /></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const cfg = statusConfig[review.status] || statusConfig.awaiting_client;
            return (
              <Card key={review.id}>
                <CardContent className="p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{review.projects?.name || "Project"}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Requested {formatDate(review.created_at)}{review.deadline ? ` · Due ${formatDate(review.deadline)}` : ""}</p>
                    </div>
                    <Badge className={`border text-[11px] shrink-0 ${cfg.color}`}>{cfg.label}</Badge>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1"><span>Progress</span><span className="font-semibold text-slate-700">{review.projects?.progress || 0}%</span></div>
                    <Progress value={review.projects?.progress || 0} />
                  </div>

                  {/* Message */}
                  {review.message && (
                    <div className="bg-slate-50 rounded-lg p-4 mb-4">
                      <p className="text-xs font-medium text-slate-500 mb-1">Admin Message</p>
                      <p className="text-sm text-slate-700">{review.message}</p>
                    </div>
                  )}

                  {/* Approved state */}
                  {review.status === "approved" && review.reviewed_at && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200/60">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <p className="text-sm text-emerald-700 font-medium">Approved on {formatDate(review.reviewed_at)}</p>
                    </div>
                  )}

                  {/* Changes requested state */}
                  {review.status === "changes_requested" && review.change_comment && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200/60">
                      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                      <div><p className="text-sm text-amber-700 font-medium">Changes Requested</p><p className="text-xs text-amber-600 mt-0.5">{review.change_comment}</p></div>
                    </div>
                  )}

                  {/* Actions for awaiting_client */}
                  {review.status === "awaiting_client" && (
                    <div className="mt-5 pt-4 border-t border-slate-100">
                      <p className="text-xs font-medium text-slate-600 mb-3">Review Checklist</p>
                      <div className="space-y-2 mb-4">
                        {["I have reviewed the delivered work", "The project meets the agreed requirements", "I have reviewed the available files"].map((item, i) => (
                          <label key={i} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                            <input type="checkbox" checked={checked[i]} onChange={() => setChecked(prev => { const n = [...prev]; n[i] = !n[i]; return n; })} className="rounded border-slate-300 text-blue-600" />
                            {item}
                          </label>
                        ))}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button variant="outline" className="flex-1 text-amber-700 border-amber-200 hover:bg-amber-50" onClick={() => setChangesOpen(review.id)}>Request Changes</Button>
                        <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={!checked.every(Boolean)} onClick={() => setApproveOpen(review.id)}>Approve Project</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Approve Modal */}
      <Dialog open={!!approveOpen} onClose={() => setApproveOpen(null)}>
        <DialogHeader onClose={() => setApproveOpen(null)}>Approve Project</DialogHeader>
        <form onSubmit={handleApprove}>
          <DialogContent className="space-y-4">
            <p className="text-sm text-slate-600">Are you satisfied with the completed project?</p>
            <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Comment (optional)</label><Textarea name="comment" rows={3} placeholder="Great work! Everything looks perfect." /></div>
          </DialogContent>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setApproveOpen(null)}>Cancel</Button><Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={formLoading}>{formLoading ? <LoadingSpinner size="sm" /> : "Approve Project"}</Button></DialogFooter>
        </form>
      </Dialog>

      {/* Changes Modal */}
      <Dialog open={!!changesOpen} onClose={() => setChangesOpen(null)}>
        <DialogHeader onClose={() => setChangesOpen(null)}>Request Changes</DialogHeader>
        <form onSubmit={handleChanges}>
          <DialogContent className="space-y-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1.5">What changes are needed? *</label><Textarea name="comment" required rows={4} placeholder="Please describe the changes..." /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label><Select name="priority"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></Select></div>
          </DialogContent>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setChangesOpen(null)}>Cancel</Button><Button type="submit" disabled={formLoading}>{formLoading ? <LoadingSpinner size="sm" /> : "Submit Changes"}</Button></DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
