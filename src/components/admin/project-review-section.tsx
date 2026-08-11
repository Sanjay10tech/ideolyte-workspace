"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, Clock, AlertTriangle, Send, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogHeader, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getProjectReviewByProject, requestClientReview, resubmitReview, getReviewHistory, type ProjectReview, type ReviewHistoryItem } from "@/lib/actions/reviews";
import { formatDate } from "@/lib/utils";

interface Props {
  projectId: string;
  projectName: string;
  clientName: string;
  progress: number;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  awaiting_client: { label: "Awaiting Client Review", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Clock },
  changes_requested: { label: "Changes Requested", color: "bg-amber-50 text-amber-700 border-amber-200", icon: AlertTriangle },
  approved: { label: "Approved", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  resubmitted: { label: "Resubmitted for Review", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Clock },
};

export function ProjectReviewSection({ projectId, projectName, clientName, progress }: Props) {
  const [review, setReview] = useState<ProjectReview | null>(null);
  const [history, setHistory] = useState<ReviewHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestOpen, setRequestOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const r = await getProjectReviewByProject(projectId);
      setReview(r);
      if (r) {
        const h = await getReviewHistory(r.id);
        setHistory(h);
      }
    } catch { /* empty */ }
    finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  async function handleRequestReview(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormLoading(true);
    const form = e.currentTarget;
    const message = (form.elements.namedItem("message") as HTMLTextAreaElement)?.value || "";
    const deadline = (form.elements.namedItem("deadline") as HTMLInputElement)?.value || undefined;

    const result = await requestClientReview({
      project_id: projectId,
      message,
      deadline,
      checklist: ["Requirements completed", "Development completed", "Testing completed", "Final deliverables ready"],
    });
    setFormLoading(false);
    if (result.error) { toast.error(result.error); return; }
    toast.success("Review request sent to client");
    setRequestOpen(false);
    load();
  }

  async function handleResubmit() {
    if (!review) return;
    setFormLoading(true);
    const result = await resubmitReview(review.id, "Project has been updated. Please review again.");
    setFormLoading(false);
    if (result.error) { toast.error(result.error); return; }
    toast.success("Review resubmitted to client");
    load();
  }

  if (loading) return <Card><CardContent className="p-6 flex justify-center"><LoadingSpinner /></CardContent></Card>;

  // No review requested yet
  if (!review) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Project Review</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Status</p>
                <Badge variant="secondary" className="mt-1">Not Requested</Badge>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600">Progress</p>
                <p className="text-lg font-semibold text-slate-900 mt-0.5">{progress}%</p>
              </div>
            </div>
            <Progress value={progress} className="h-2" />

            <div className="pt-3 space-y-2">
              <p className="text-xs font-medium text-slate-500 uppercase">Checklist</p>
              {["Project requirements", "Development", "Testing", "Final deliverables"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  {item}
                </div>
              ))}
            </div>

            <Button className="w-full sm:w-auto mt-4" onClick={() => setRequestOpen(true)}>
              <Send className="h-4 w-4 mr-1.5" /> Request Client Review
            </Button>
          </CardContent>
        </Card>

        {/* Request Modal */}
        <Dialog open={requestOpen} onClose={() => setRequestOpen(false)}>
          <DialogHeader onClose={() => setRequestOpen(false)}>Request Client Review</DialogHeader>
          <form onSubmit={handleRequestReview}>
            <DialogContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-slate-500">Client</p><p className="font-medium text-slate-900">{clientName}</p></div>
                <div><p className="text-slate-500">Project</p><p className="font-medium text-slate-900">{projectName}</p></div>
              </div>
              <div className="flex items-center gap-2 text-sm"><span className="text-slate-500">Progress:</span><span className="font-semibold">{progress}%</span></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Message</label><Textarea name="message" rows={3} defaultValue="Your project is ready for final review. Please review the completed work and let us know if any changes are required." /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Review Deadline (optional)</label><Input name="deadline" type="date" /></div>
            </DialogContent>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setRequestOpen(false)}>Cancel</Button><Button type="submit" disabled={formLoading}>{formLoading ? <LoadingSpinner size="sm" /> : "Send Review Request"}</Button></DialogFooter>
          </form>
        </Dialog>
      </div>
    );
  }

  // Review exists
  const cfg = statusConfig[review.status] || statusConfig.awaiting_client;
  const StatusIcon = cfg.icon;

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <Card>
        <CardHeader><CardTitle className="text-base">Project Review</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <Badge className={`border text-xs ${cfg.color}`}><StatusIcon className="h-3 w-3 mr-1" />{cfg.label}</Badge>
            <p className="text-xs text-slate-500">Requested {formatDate(review.created_at)}</p>
          </div>

          {review.status === "approved" && review.reviewed_at && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200/60">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm font-medium text-emerald-800">Client Approved ✓</p>
                <p className="text-xs text-emerald-600">{formatDate(review.reviewed_at)}</p>
                {review.approval_comment && <p className="text-xs text-emerald-700 mt-1">&quot;{review.approval_comment}&quot;</p>}
              </div>
            </div>
          )}

          {review.status === "changes_requested" && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200/60">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Client Requested Changes</p>
                  {review.change_comment && <p className="text-xs text-amber-700 mt-1">&quot;{review.change_comment}&quot;</p>}
                  {review.change_priority && <Badge variant="secondary" className="mt-1 text-[10px]">{review.change_priority} priority</Badge>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleResubmit} disabled={formLoading}>
                  <RotateCcw className="h-3.5 w-3.5 mr-1" /> {formLoading ? "Sending..." : "Request Review Again"}
                </Button>
              </div>
            </div>
          )}

          {review.status === "awaiting_client" && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200/60">
              <Clock className="h-4 w-4 text-blue-600" />
              <p className="text-sm text-blue-700">Waiting for client response...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review History */}
      {history.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Review History</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {history.map((h) => (
                <div key={h.id} className="flex items-start gap-3">
                  <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${h.action === "approved" ? "bg-emerald-500" : h.action === "changes_requested" ? "bg-amber-500" : "bg-blue-500"}`} />
                  <div>
                    <p className="text-sm text-slate-700">
                      {h.action === "review_requested" && "Review requested"}
                      {h.action === "approved" && "Client approved"}
                      {h.action === "changes_requested" && "Client requested changes"}
                      {h.action === "resubmitted" && "Review resubmitted"}
                    </p>
                    <p className="text-xs text-slate-400">{h.profiles?.full_name} · {formatDate(h.created_at)}</p>
                    {h.comment && <p className="text-xs text-slate-500 mt-0.5">&quot;{h.comment}&quot;</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
