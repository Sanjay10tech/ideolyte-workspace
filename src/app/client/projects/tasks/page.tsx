"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton, EmptyState } from "@/components/ui/skeleton";
import { CheckSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";

type Task = { id: string; title: string; description: string | null; status: string; priority: string; due_date: string | null; projects: { name: string } };

export default function ClientTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      // Get tasks for client's projects (RLS will filter)
      const { data } = await supabase
        .from("tasks")
        .select("*, projects(name)")
        .order("created_at", { ascending: false });
      setTasks((data || []) as unknown as Task[]);
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const statusColor = (s: string) => {
    if (s === "completed") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (s === "in-progress") return "bg-blue-50 text-blue-700 border-blue-200";
    if (s === "review") return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Tasks" description="All tasks across your projects" />
      <Card>
        <CardContent className="p-0">
          {loading ? <TableSkeleton rows={6} /> : tasks.length === 0 ? (
            <EmptyState title="No tasks" description="Tasks will appear here once your projects are underway" icon={<CheckSquare className="h-10 w-10" />} />
          ) : (
            <div className="divide-y divide-gray-50">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                      task.status === "completed" ? "bg-emerald-500" : task.status === "in-progress" ? "bg-blue-500" : task.status === "review" ? "bg-amber-500" : "bg-gray-300"
                    }`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                      <p className="text-xs text-gray-500">{task.projects?.name || ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <Badge className={`border text-[10px] ${statusColor(task.status)}`}>
                      {task.status.replace("-", " ")}
                    </Badge>
                    {task.due_date && <span className="text-xs text-gray-400 hidden sm:inline">{formatDate(task.due_date)}</span>}
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
