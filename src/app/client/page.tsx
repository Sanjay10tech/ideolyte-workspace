"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { CheckCircle2, Clock, FolderKanban, ListTodo } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/stat-card";
import { useAuth } from "@/components/providers/auth-provider";
import { CardSkeleton } from "@/components/ui/skeleton";
import { getClientProjects } from "@/lib/actions/projects";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";

const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false });
const PieChart = dynamic(() => import("recharts").then(m => m.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then(m => m.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then(m => m.Cell), { ssr: false });

type Project = { id: string; name: string; status: string; progress: number; deadline: string | null; budget: number | null; start_date: string | null; description: string | null };

export default function ClientDashboardPage() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [taskStats, setTaskStats] = useState({ total: 0, completed: 0, inProgress: 0, remaining: 0 });
  const [loading, setLoading] = useState(true);
  const firstName = profile?.full_name?.split(" ")[0] || "there";

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const p = await getClientProjects();
      setProjects(p as Project[]);

      // Load task stats for client's projects
      if (p.length > 0) {
        const supabase = createClient();
        const { data: tasks } = await supabase
          .from("tasks")
          .select("status")
          .in("project_id", (p as Project[]).map(proj => proj.id));

        if (tasks) {
          const completed = tasks.filter(t => (t as { status: string }).status === "completed").length;
          const inProgress = tasks.filter(t => (t as { status: string }).status === "in-progress").length;
          setTaskStats({ total: tasks.length, completed, inProgress, remaining: tasks.length - completed });
        }
      }
    } catch {
      // empty state will show
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const activeProjects = projects.filter(p => p.status === "in-progress" || p.status === "planning");

  const statusColor = (s: string) => {
    if (s === "in-progress") return "bg-blue-50 text-blue-700 border-blue-200";
    if (s === "completed") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (s === "on-hold") return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  const chartData = [
    { name: "Completed", value: taskStats.completed, color: "#10b981" },
    { name: "In Progress", value: taskStats.inProgress, color: "#3b82f6" },
    { name: "Remaining", value: taskStats.remaining - taskStats.inProgress, color: "#e2e8f0" },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-xl bg-gradient-to-r from-[#0f172a] to-[#1e293b] p-6 sm:p-8 text-white">
        <h1 className="text-xl sm:text-2xl font-semibold">Welcome back, {firstName} 👋</h1>
        <p className="mt-2 text-sm text-gray-300 max-w-xl">
          Track your projects, tasks, documents and payments in one place.
        </p>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard title="Projects" value={projects.length.toString()} icon={FolderKanban} accent="blue" />
          <StatCard title="Total Tasks" value={taskStats.total.toString()} icon={ListTodo} accent="purple" />
          <StatCard title="Completed" value={taskStats.completed.toString()} icon={CheckCircle2} accent="green" />
          <StatCard title="Remaining" value={taskStats.remaining.toString()} icon={Clock} accent="amber" />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Projects */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-4">Active Projects</h2>
            {loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><CardSkeleton /><CardSkeleton /></div>
            ) : activeProjects.length === 0 ? (
              <Card><CardContent className="p-6 text-center"><p className="text-sm text-slate-400">No active projects</p></CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {activeProjects.map((project) => (
                  <Card key={project.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-sm font-semibold text-slate-900 pr-2 truncate">{project.name}</h3>
                        <Badge className={`border text-[10px] shrink-0 ${statusColor(project.status)}`}>
                          {project.status.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                            <span>Progress</span>
                            <span className="font-semibold text-slate-700">{project.progress}%</span>
                          </div>
                          <Progress value={project.progress} />
                        </div>
                        {project.deadline && (
                          <p className="text-xs text-slate-500">Due {formatDate(project.deadline)}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Task Progress Chart */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Task Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {taskStats.total === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">Tasks will appear here once assigned</p>
              ) : (
                <>
                  <div className="h-[160px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={chartData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value" stroke="none">
                          {chartData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <p className="text-xl font-bold text-slate-900">{taskStats.completed}/{taskStats.total}</p>
                        <p className="text-[10px] text-slate-400">Done</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 mt-3">
                    <span className="flex items-center gap-1.5 text-[11px] text-slate-500"><span className="h-2 w-2 rounded-full bg-emerald-500" />Completed ({taskStats.completed})</span>
                    <span className="flex items-center gap-1.5 text-[11px] text-slate-500"><span className="h-2 w-2 rounded-full bg-blue-500" />In Progress ({taskStats.inProgress})</span>
                    <span className="flex items-center gap-1.5 text-[11px] text-slate-500"><span className="h-2 w-2 rounded-full bg-slate-200" />Remaining ({taskStats.remaining - taskStats.inProgress})</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
