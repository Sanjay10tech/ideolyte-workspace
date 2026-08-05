"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Calendar, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { PageLoader } from "@/components/ui/loading-spinner";
import { getProjectById } from "@/lib/actions/projects";
import { getMilestones } from "@/lib/actions/milestones";
import { getProjectUpdates, type ProjectUpdateWithAuthor } from "@/lib/actions/project-updates";
import { getMyTasks, updateMyTaskStatus } from "@/lib/actions/team";
import { formatDate } from "@/lib/utils";

type Task = { id: string; title: string; status: string; priority: string; due_date: string | null; project_id: string };
type Milestone = { id: string; title: string; status: string; due_date: string | null };

export default function TeamProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<{ name: string; description: string | null; status: string; progress: number; deadline: string | null } | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [updates, setUpdates] = useState<ProjectUpdateWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [p, m, u, t] = await Promise.all([
        getProjectById(projectId),
        getMilestones(projectId),
        getProjectUpdates(projectId),
        getMyTasks(),
      ]);
      setProject(p as unknown as typeof project);
      setMilestones(m as Milestone[]);
      setUpdates(u);
      setTasks((t as Task[]).filter(task => task.project_id === projectId));
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  }, [projectId]);
  useEffect(() => { load(); }, [load]);

  if (loading) return <PageLoader />;
  if (!project) return <p className="text-center text-gray-500 py-12">Project not found or not assigned to you.</p>;

  async function handleTaskStatus(taskId: string, status: string) {
    const result = await updateMyTaskStatus(taskId, status);
    if (result.error) { toast.error(result.error); return; }
    toast.success("Task updated"); load();
  }

  const completedTasks = tasks.filter(t => t.status === "completed").length;

  return (
    <div className="space-y-6">
      <PageHeader title={project.name} description={project.description || undefined}>
        <Badge className="border bg-blue-50 text-blue-700 border-blue-200">{project.status.replace("-", " ")}</Badge>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Progress" value={`${project.progress}%`} icon={CheckCircle2} />
        <StatCard title="My Tasks" value={`${completedTasks}/${tasks.length}`} icon={CheckCircle2} />
        <StatCard title="Deadline" value={project.deadline ? formatDate(project.deadline) : "—"} icon={Calendar} />
      </div>

      <Card><CardContent className="p-5"><div className="flex items-center justify-between text-sm mb-2"><span className="text-gray-600">Progress</span><span className="font-semibold">{project.progress}%</span></div><Progress value={project.progress} className="h-3" /></CardContent></Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* My Tasks */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">My Tasks</CardTitle></CardHeader>
          <CardContent>
            {tasks.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">No tasks assigned</p> : (
              <div className="space-y-2">
                {tasks.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-50">
                    <p className="text-sm text-gray-700 truncate">{t.title}</p>
                    <Select value={t.status} onChange={e => handleTaskStatus(t.id, e.target.value)} className="w-auto h-7 text-xs">
                      <option value="todo">To Do</option><option value="in-progress">In Progress</option><option value="completed">Completed</option>
                    </Select>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Milestones */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Milestones</CardTitle></CardHeader>
          <CardContent>
            {milestones.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">No milestones</p> : (
              <div className="space-y-2">
                {milestones.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-50">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${m.status === "completed" ? "bg-emerald-500" : m.status === "in-progress" ? "bg-blue-500" : "bg-gray-300"}`} />
                      <p className="text-sm text-gray-700">{m.title}</p>
                    </div>
                    {m.due_date && <span className="text-xs text-gray-400">{formatDate(m.due_date)}</span>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Updates */}
      {updates.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Project Updates</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {updates.slice(0, 5).map(u => (
                <div key={u.id} className="border-l-2 border-[#1e293b] pl-4">
                  <p className="text-sm font-medium text-gray-900">{u.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{u.content}</p>
                  <p className="text-xs text-gray-400 mt-1">{u.profiles.full_name} · {formatDate(u.created_at)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
