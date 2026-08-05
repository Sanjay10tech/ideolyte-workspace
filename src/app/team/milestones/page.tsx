"use client";

import { useEffect, useState, useCallback } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton, EmptyState } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";

type Milestone = { id: string; title: string; status: string; due_date: string | null; projects: { name: string } };

export default function TeamMilestonesPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase.from("milestones").select("*, projects(name)").order("due_date", { ascending: true });
      setMilestones((data || []) as unknown as Milestone[]);
    } catch { toast.error("Failed"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader title="Milestones" description="Project milestones across your assignments" />
      <Card><CardContent className="p-0">
        {loading ? <TableSkeleton rows={5} /> : milestones.length === 0 ? (
          <EmptyState title="No milestones" description="Milestones will appear from your assigned projects" icon={<Flag className="h-10 w-10" />} />
        ) : (
          <div className="divide-y divide-gray-50">
            {milestones.map(m => (
              <div key={m.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <span className={`h-2.5 w-2.5 rounded-full ${m.status === "completed" ? "bg-emerald-500" : m.status === "in-progress" ? "bg-blue-500" : "bg-gray-300"}`} />
                  <div><p className="text-sm font-medium text-gray-900">{m.title}</p><p className="text-xs text-gray-500">{m.projects?.name}</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="border text-[10px] bg-gray-50 text-gray-600 border-gray-200">{m.status.replace("-", " ")}</Badge>
                  {m.due_date && <span className="text-xs text-gray-400">{formatDate(m.due_date)}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent></Card>
    </div>
  );
}
