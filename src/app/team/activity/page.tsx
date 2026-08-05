"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Activity } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton, EmptyState } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";

type Log = { id: string; action: string; entity_type: string; metadata: Record<string, unknown> | null; created_at: string };

export default function TeamActivityPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setLoading(true); const supabase = createClient(); const { data } = await supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(20); setLogs((data || []) as unknown as Log[]); } catch { toast.error("Failed"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader title="Activity" description="Your recent activity" />
      <Card><CardHeader className="pb-3"><CardTitle className="text-base">Activity Log</CardTitle></CardHeader><CardContent>
        {loading ? <TableSkeleton rows={6} /> : logs.length === 0 ? (
          <EmptyState title="No activity yet" description="Your actions will be logged here" icon={<Activity className="h-10 w-10" />} />
        ) : (
          <div className="space-y-4">{logs.map(a => (<div key={a.id} className="flex items-start gap-3"><div className="h-2.5 w-2.5 rounded-full bg-[#1e293b] mt-1.5 shrink-0" /><div><p className="text-sm text-gray-700">{a.action.replace(/_/g, " ")} {a.entity_type}</p><p className="text-xs text-gray-400">{formatDate(a.created_at)}</p></div></div>))}</div>
        )}
      </CardContent></Card>
    </div>
  );
}
