"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton, EmptyState } from "@/components/ui/skeleton";
import { Activity } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";

type ActivityLog = { id: string; action: string; entity_type: string; metadata: Record<string, unknown> | null; created_at: string };

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      setActivities((data || []) as unknown as ActivityLog[]);
    } catch {
      toast.error("Failed to load activity");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  function formatAction(log: ActivityLog): string {
    const meta = log.metadata || {};
    const name = (meta.project_name || meta.task_title || meta.client_name || "") as string;
    return `${log.action.replace(/_/g, " ")} ${log.entity_type}${name ? `: ${name}` : ""}`;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Activity" description="Recent updates across your projects" />
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Activity Timeline</CardTitle></CardHeader>
        <CardContent>
          {loading ? <TableSkeleton rows={6} /> : activities.length === 0 ? (
            <EmptyState title="No activity yet" description="Activity will appear here as your project progresses" icon={<Activity className="h-10 w-10" />} />
          ) : (
            <div className="space-y-4">
              {activities.map((a) => (
                <div key={a.id} className="flex items-start gap-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#1e293b] mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm text-gray-700">{formatAction(a)}</p>
                    <p className="text-xs text-gray-400">{formatDate(a.created_at)}</p>
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
