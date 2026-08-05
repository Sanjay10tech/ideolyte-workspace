"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { CheckCircle2, Clock, Circle, Flag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton, EmptyState } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";

type Milestone = { id: string; title: string; description: string | null; status: string; due_date: string | null; completed_date: string | null; projects: { name: string } };

export default function MilestonesPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("milestones")
        .select("*, projects(name)")
        .order("due_date", { ascending: true });
      setMilestones((data || []) as unknown as Milestone[]);
    } catch {
      toast.error("Failed to load milestones");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader title="Milestones" description="Project milestones and deliverables" />
      {loading ? <TableSkeleton rows={5} /> : milestones.length === 0 ? (
        <Card><CardContent className="p-0">
          <EmptyState title="No milestones yet" description="Milestones will appear here as they are defined" icon={<Flag className="h-10 w-10" />} />
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          {milestones.map((m, idx) => {
            const Icon = m.status === "completed" ? CheckCircle2 : m.status === "in-progress" ? Clock : Circle;
            const iconColor = m.status === "completed" ? "text-emerald-500" : m.status === "in-progress" ? "text-blue-500" : "text-gray-300";
            const statusBadge = m.status === "completed" ? "success" : m.status === "in-progress" ? "info" : "secondary";
            return (
              <Card key={m.id}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <Icon className={`h-6 w-6 ${iconColor}`} />
                      {idx < milestones.length - 1 && (
                        <div className="absolute top-7 left-3 w-px h-6 bg-gray-200" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900">{m.title}</h3>
                        <Badge variant={statusBadge as "success" | "info" | "secondary"}>
                          {m.status.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{m.projects?.name}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        {m.due_date && <span>Due: {formatDate(m.due_date)}</span>}
                        {m.completed_date && <span className="text-emerald-600">Completed: {formatDate(m.completed_date)}</span>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
