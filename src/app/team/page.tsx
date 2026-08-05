"use client";

import { useEffect, useState, useCallback } from "react";
import { FolderKanban, CheckSquare, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { StatCard } from "@/components/shared/stat-card";
import { useAuth } from "@/components/providers/auth-provider";
import { CardSkeleton } from "@/components/ui/skeleton";
import { getMyTeamProjects, getMyTasks, updateMyTaskStatus } from "@/lib/actions/team";
import { formatDate } from "@/lib/utils";

type Project = { id: string; name: string; status: string; progress: number; deadline: string | null; role_in_project: string };
type Task = { id: string; title: string; status: string; priority: string; due_date: string | null; projects: { name: string } };

const statusColors: Record<string, string> = {
  "in-progress": "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  planning: "bg-gray-50 text-gray-700 border-gray-200",
  "on-hold": "bg-amber-50 text-amber-700 border-amber-200",
};

export default function TeamDashboard() {
  const { profile } = useAuth();
  const firstName = profile?.full_name?.split(" ")[0] || "Team Member";
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [p, t] = await Promise.all([getMyTeamProjects(), getMyTasks()]);
      setProjects(p as Project[]);
      setTasks(t as Task[]);
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function handleStatusChange(taskId: string, status: string) {
    const result = await updateMyTaskStatus(taskId, status);
    if (result.error) { toast.error(result.error); return; }
    toast.success("Task updated");
    load();
  }

  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const upcomingDeadlines = tasks.filter(t => t.due_date && t.status !== "completed").length;

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-[#0f172a] to-[#1e293b] p-6 text-white">
        <h1 className="text-xl font-semibold">Welcome back, {firstName} 👋</h1>
        <p className="mt-1 text-sm text-gray-300">Here&apos;s your workspace overview.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="My Projects" value={projects.length.toString()} icon={FolderKanban} />
            <StatCard title="My Tasks" value={tasks.length.toString()} icon={CheckSquare} />
            <StatCard title="Completed Tasks" value={completedTasks.toString()} icon={CheckCircle2} />
            <StatCard title="Upcoming Deadlines" value={upcomingDeadlines.toString()} icon={Clock} />
          </div>

          {/* My Tasks */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">My Tasks</CardTitle></CardHeader>
            <CardContent>
              {tasks.length === 0 ? <p className="text-sm text-gray-400 text-center py-6">No tasks assigned yet</p> : (
                <div className="space-y-2">
                  {tasks.filter(t => t.status !== "completed").slice(0, 8).map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-50 hover:bg-gray-50">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                        <p className="text-xs text-gray-500">{(task.projects as { name: string })?.name} {task.due_date ? `· Due ${formatDate(task.due_date)}` : ""}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <Badge className={`border text-[10px] ${task.priority === "high" || task.priority === "urgent" ? "bg-red-50 text-red-700 border-red-200" : "bg-gray-50 text-gray-600 border-gray-200"}`}>{task.priority}</Badge>
                        <Select value={task.status} onChange={(e) => handleStatusChange(task.id, e.target.value)} className="w-auto h-7 text-xs">
                          <option value="todo">To Do</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Projects */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">My Projects</CardTitle></CardHeader>
            <CardContent>
              {projects.length === 0 ? <p className="text-sm text-gray-400 text-center py-6">No projects assigned yet</p> : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {projects.map((p) => (
                    <Link key={p.id} href={`/team/projects/${p.id}`} className="rounded-lg border border-gray-100 p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{p.name}</h3>
                        <Badge className={`border text-[10px] shrink-0 ${statusColors[p.status] || statusColors.planning}`}>
                          {p.status.replace("-", " ")}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">Role: {p.role_in_project}</p>
                      <Progress value={p.progress} />
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                        <span>{p.progress}%</span>
                        {p.deadline && <span>Due {formatDate(p.deadline)}</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
