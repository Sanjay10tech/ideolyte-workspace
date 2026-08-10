"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { CheckCircle2, Clock, FolderKanban, ListTodo } from "lucide-react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/shared/stat-card";
import { useAuth } from "@/components/providers/auth-provider";
import { CardSkeleton } from "@/components/ui/skeleton";
import { getClientDashboardData, type ClientDashboardData } from "@/lib/actions/client-dashboard";
import { formatDate } from "@/lib/utils";

const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false });
const PieChart = dynamic(() => import("recharts").then(m => m.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then(m => m.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then(m => m.Cell), { ssr: false });
const BarChart = dynamic(() => import("recharts").then(m => m.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then(m => m.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then(m => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then(m => m.Tooltip), { ssr: false });

export default function ClientDashboardPage() {
  const { profile } = useAuth();
  const [data, setData] = useState<ClientDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const firstName = profile?.full_name?.split(" ")[0] || "there";

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const d = await getClientDashboardData();
      setData(d);
    } catch { /* empty */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const projects = data?.projects || [];
  const taskStats = data?.taskStats || { total: 0, completed: 0, inProgress: 0, review: 0, todo: 0 };
  const milestones = data?.milestones || [];
  const activeProjects = projects.filter(p => p.status === "in-progress" || p.status === "planning" || p.status === "review" || p.status === "on-hold");
  const completedProjects = projects.filter(p => p.status === "completed");

  const statusColor = (s: string) => {
    if (s === "in-progress") return "bg-blue-50 text-blue-700 border-blue-200";
    if (s === "completed") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (s === "on-hold") return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  // Chart data
  const taskDonutData = [
    { name: "Completed", value: taskStats.completed, color: "#10b981" },
    { name: "In Progress", value: taskStats.inProgress, color: "#3b82f6" },
    { name: "Review", value: taskStats.review, color: "#f59e0b" },
    { name: "To Do", value: taskStats.todo, color: "#e2e8f0" },
  ].filter(d => d.value > 0);

  const projectBarData = projects.slice(0, 6).map(p => ({
    name: p.name.length > 18 ? p.name.slice(0, 18) + "…" : p.name,
    progress: p.progress,
  }));

  const milestoneStats = {
    completed: milestones.filter(m => m.status === "completed").length,
    inProgress: milestones.filter(m => m.status === "in-progress").length,
    upcoming: milestones.filter(m => m.status === "upcoming").length,
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-xl bg-gradient-to-r from-[#0f172a] to-[#1e293b] p-6 sm:p-8 text-white">
        <h1 className="text-xl sm:text-2xl font-semibold">Welcome back, {firstName} 👋</h1>
        <p className="mt-2 text-sm text-gray-300 max-w-xl">Track your projects, tasks, documents and payments in one place.</p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard title="Total Projects" value={projects.length.toString()} icon={FolderKanban} accent="blue" />
          <StatCard title="Active" value={activeProjects.length.toString()} icon={ListTodo} accent="purple" />
          <StatCard title="Completed" value={completedProjects.length.toString()} icon={CheckCircle2} accent="green" />
          <StatCard title="Tasks Remaining" value={(taskStats.total - taskStats.completed).toString()} icon={Clock} accent="amber" />
        </div>
      )}

      {/* Active Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-semibold text-slate-900">Active Projects ({activeProjects.length})</h2>
          {projects.length > 3 && <Link href="/client/projects"><Button variant="ghost" size="sm" className="text-xs text-blue-600">View All</Button></Link>}
        </div>
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"><CardSkeleton /><CardSkeleton /></div>
        ) : activeProjects.length === 0 ? (
          <Card><CardContent className="p-6 text-center"><p className="text-sm text-slate-400">No active projects right now.</p></CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeProjects.slice(0, 6).map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-900 pr-2 truncate">{project.name}</h3>
                    <Badge className={`border text-[10px] shrink-0 ${statusColor(project.status)}`}>
                      {project.status.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1"><span>Progress</span><span className="font-semibold text-slate-700">{project.progress}%</span></div>
                    <Progress value={project.progress} />
                    {project.deadline && <p className="text-xs text-slate-400 mt-1">Due {formatDate(project.deadline)}</p>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Completed Projects */}
      {!loading && completedProjects.length > 0 && (
        <div>
          <h2 className="text-[15px] font-semibold text-slate-900 mb-4">Completed Projects ({completedProjects.length})</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {completedProjects.slice(0, 6).map((project) => (
              <Card key={project.id} className="border-emerald-100/60">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{project.name}</p>
                    {project.deadline && <p className="text-xs text-slate-400">Completed · Due {formatDate(project.deadline)}</p>}
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 border text-[10px] shrink-0">100%</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Charts */}
      {!loading && (taskStats.total > 0 || projects.length > 0 || milestones.length > 0) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Chart 1 — Project Progress Bar */}
          <Card className="rounded-2xl border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-[14px]">Project Progress</CardTitle></CardHeader>
            <CardContent>
              {projectBarData.length === 0 ? <p className="text-sm text-slate-400 text-center py-4">No projects yet.</p> : (
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectBarData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                      <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                      <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} width={100} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} formatter={(v) => `${v}%`} />
                      <Bar dataKey="progress" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chart 2 — Task Status Donut */}
          <Card className="rounded-2xl border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-[14px]">Task Status</CardTitle></CardHeader>
            <CardContent>
              {taskStats.total === 0 ? <p className="text-sm text-slate-400 text-center py-4">No tasks assigned yet.</p> : (
                <>
                  <div className="h-[150px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={taskDonutData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value" stroke="none">
                          {taskDonutData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center"><p className="text-lg font-bold text-slate-900">{taskStats.total}</p><p className="text-[9px] text-slate-400">Tasks</p></div>
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 mt-2">
                    {taskDonutData.map(d => <span key={d.name} className="flex items-center gap-1 text-[10px] text-slate-500"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />{d.name}</span>)}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Chart 3 — Milestone Progress */}
          <Card className="rounded-2xl border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-[14px]">Milestone Progress</CardTitle></CardHeader>
            <CardContent>
              {milestones.length === 0 ? <p className="text-sm text-slate-400 text-center py-4">No milestones yet.</p> : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Completed</span>
                    <span className="font-semibold text-emerald-600">{milestoneStats.completed}</span>
                  </div>
                  <Progress value={milestones.length > 0 ? (milestoneStats.completed / milestones.length) * 100 : 0} className="h-2" />
                  <div className="space-y-2 mt-4">
                    {milestones.slice(0, 6).map((m) => (
                      <div key={m.id} className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full shrink-0 ${m.status === "completed" ? "bg-emerald-500" : m.status === "in-progress" ? "bg-blue-500" : "bg-slate-200"}`} />
                        <span className="text-[12px] text-slate-700 truncate flex-1">{m.title}</span>
                        <span className="text-[10px] text-slate-400 shrink-0">{m.status === "completed" ? "✓" : m.status === "in-progress" ? "●" : "○"}</span>
                      </div>
                    ))}
                  </div>
                  {milestones.length > 6 && <p className="text-[11px] text-slate-400 text-center mt-2">+{milestones.length - 6} more</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
