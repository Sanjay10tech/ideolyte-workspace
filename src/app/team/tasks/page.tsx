"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckSquare } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton, EmptyState } from "@/components/ui/skeleton";
import { getMyTasks, updateMyTaskStatus } from "@/lib/actions/team";
import { formatDate } from "@/lib/utils";

type Task = { id: string; title: string; description: string | null; status: string; priority: string; due_date: string | null; projects: { name: string } };

export default function TeamTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setLoading(true); const d = await getMyTasks(); setTasks(d as Task[]); } catch { toast.error("Failed"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function handleStatus(taskId: string, status: string) {
    const result = await updateMyTaskStatus(taskId, status);
    if (result.error) { toast.error(result.error); return; }
    toast.success("Task updated"); load();
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My Tasks" description="Tasks assigned to you across all projects" />
      <Card>
        <CardContent className="p-0">
          {loading ? <TableSkeleton rows={6} /> : tasks.length === 0 ? (
            <EmptyState title="No tasks assigned" description="Tasks will appear here when assigned to you" icon={<CheckSquare className="h-10 w-10" />} />
          ) : (
            <div className="divide-y divide-gray-50">
              {tasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">{t.title}</p>
                    <p className="text-xs text-gray-500">{(t.projects as { name: string })?.name} {t.due_date ? `· Due ${formatDate(t.due_date)}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <Badge className={`border text-[10px] ${t.priority === "high" || t.priority === "urgent" ? "bg-red-50 text-red-700 border-red-200" : t.priority === "medium" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-gray-50 text-gray-600 border-gray-200"}`}>{t.priority}</Badge>
                    <Select value={t.status} onChange={(e) => handleStatus(t.id, e.target.value)} className="w-auto h-8 text-xs">
                      <option value="todo">To Do</option><option value="in-progress">In Progress</option><option value="completed">Completed</option>
                    </Select>
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
