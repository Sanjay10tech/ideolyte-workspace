"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Calendar, DollarSign, CheckCircle2, Clock, Circle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { PageLoader } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/skeleton";
import { getProjectById } from "@/lib/actions/projects";
import { getMilestones } from "@/lib/actions/milestones";
import { getTasksByProject } from "@/lib/actions/tasks";
import { getProjectUpdates, type ProjectUpdateWithAuthor } from "@/lib/actions/project-updates";
import { formatDate, formatCurrency } from "@/lib/utils";

type Milestone = { id: string; title: string; status: string; due_date: string | null; completed_date: string | null };
type Task = { id: string; title: string; status: string; priority: string; due_date: string | null };

export default function ClientProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<{ id: string; name: string; description: string | null; status: string; progress: number; budget: number | null; start_date: string | null; deadline: string | null } | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [updates, setUpdates] = useState<ProjectUpdateWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [p, m, t, u] = await Promise.all([
        getProjectById(projectId),
        getMilestones(projectId),
        getTasksByProject(projectId),
        getProjectUpdates(projectId),
      ]);
      setProject(p as unknown as typeof project);
      setMilestones(m as Milestone[]);
      setTasks(t as Task[]);
      setUpdates(u);
    } catch {
      toast.error("Failed to load project");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <PageLoader />;
  if (!project) return <EmptyState title="Project not found" description="This project may not exist or you don't have access." />;

  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const totalTasks = tasks.length;

  return (
    <div className="space-y-6">
      <PageHeader title={project.name} description={project.description || undefined}>
        <Badge className="border bg-blue-50 text-blue-700 border-blue-200">
          {project.status.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}
        </Badge>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Progress" value={`${project.progress}%`} icon={CheckCircle2} />
        <StatCard title="Budget" value={project.budget ? formatCurrency(project.budget) : "—"} icon={DollarSign} />
        <StatCard title="Deadline" value={project.deadline ? formatDate(project.deadline) : "—"} icon={Calendar} />
        <StatCard title="Tasks Done" value={`${completedTasks}/${totalTasks}`} icon={CheckCircle2} />
      </div>

      {/* Progress Visualization */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600 font-medium">Overall Progress</span>
            <span className="font-semibold text-gray-900">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-3" />
          <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
            {project.start_date && <span>Started {formatDate(project.start_date)}</span>}
            {project.deadline && <span>Due {formatDate(project.deadline)}</span>}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Milestone Timeline */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            {milestones.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No milestones defined yet</p>
            ) : (
              <div className="space-y-0">
                {milestones.map((m, idx) => {
                  const Icon = m.status === "completed" ? CheckCircle2 : m.status === "in-progress" ? Clock : Circle;
                  const iconColor = m.status === "completed" ? "text-emerald-500" : m.status === "in-progress" ? "text-blue-500" : "text-gray-300";
                  return (
                    <div key={m.id} className="flex gap-3 relative">
                      {/* Vertical line */}
                      {idx < milestones.length - 1 && (
                        <div className="absolute left-[11px] top-7 w-0.5 h-[calc(100%-4px)] bg-gray-200" />
                      )}
                      <Icon className={`h-6 w-6 shrink-0 ${iconColor} relative z-10 bg-white`} />
                      <div className="pb-5">
                        <p className="text-sm font-medium text-gray-900">{m.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {m.due_date && <p className="text-xs text-gray-500">{formatDate(m.due_date)}</p>}
                          {m.completed_date && <p className="text-xs text-emerald-600">✓ {formatDate(m.completed_date)}</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No tasks yet</p>
            ) : (
              <div className="space-y-2">
                {tasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-50">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                        t.status === "completed" ? "bg-emerald-500" :
                        t.status === "in-progress" ? "bg-blue-500" :
                        t.status === "review" ? "bg-amber-500" : "bg-gray-300"
                      }`} />
                      <p className={`text-sm truncate ${t.status === "completed" ? "text-gray-400 line-through" : "text-gray-700"}`}>{t.title}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] shrink-0 ml-2">{t.status.replace("-", " ")}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Updates */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Updates</CardTitle>
        </CardHeader>
        <CardContent>
          {updates.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No updates yet</p>
          ) : (
            <div className="space-y-4">
              {updates.map((u) => (
                <div key={u.id} className="border-l-2 border-[#1e293b] pl-4">
                  <p className="text-sm font-medium text-gray-900">{u.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{u.content}</p>
                  <p className="text-xs text-gray-400 mt-1">{u.profiles.full_name} · {formatDate(u.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
