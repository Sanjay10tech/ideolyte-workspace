"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, FolderKanban, CreditCard, CheckCircle2, Clock, ArrowUpRight, Plus, Receipt } from "lucide-react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { CardSkeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { RevenueChart, ProjectStatusChart, TeamWorkloadChart } from "@/components/admin/analytics-charts";

type Project = { id: string; name: string; status: string; progress: number; deadline: string | null; clients: { company: string; profiles: { full_name: string } } };
type Invoice = { id: string; invoice_number: string; total_amount: number; status: string; clients: { profiles: { full_name: string } }; projects: { name: string } | null };
type Activity = { id: string; action: string; entity_type: string; metadata: Record<string, unknown> | null; created_at: string };

export default function AdminDashboardPage() {
  const { profile } = useAuth();
  const firstName = profile?.full_name?.split(" ")[0] || "Admin";
  const [stats, setStats] = useState({ clients: 0, active: 0, pending: 0, completed: 0 });
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ count: clientCount }, { data: projData }, { data: invData }, { data: actData }] = await Promise.all([
      supabase.from("clients").select("id", { count: "exact", head: true }),
      supabase.from("projects").select("id, name, status, progress, deadline, clients(company, profiles(full_name))").order("created_at", { ascending: false }).limit(5),
      supabase.from("invoices").select("id, invoice_number, total_amount, status, clients(profiles(full_name))").in("status", ["pending", "overdue"]).limit(5),
      supabase.from("activity_logs").select("id, action, entity_type, created_at").order("created_at", { ascending: false }).limit(6),
    ]);
    const allProjects = (projData || []) as unknown as Project[];
    setStats({
      clients: clientCount || 0,
      active: allProjects.filter(p => p.status === "in-progress").length,
      pending: (invData || []).reduce((a, i: { total_amount: number }) => a + (i.total_amount || 0), 0),
      completed: allProjects.filter(p => p.status === "completed").length,
    });
    setProjects(allProjects);
    setInvoices((invData || []) as unknown as Invoice[]);
    setActivities((actData || []) as unknown as Activity[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">Welcome back, {firstName}. Manage your workspace from here.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/projects">
            <Button size="sm" variant="outline" className="text-[13px] border-slate-200 text-slate-600 hover:bg-slate-50">
              <Plus className="h-3.5 w-3.5 mr-1" /> New Project
            </Button>
          </Link>
          <Link href="/admin/clients">
            <Button size="sm" className="text-[13px] bg-blue-600 hover:bg-blue-700">
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Client
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}</div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Clients" value={stats.clients.toString()} icon={Users} accent="blue" />
            <StatCard title="Active Projects" value={stats.active.toString()} icon={FolderKanban} accent="green" />
            <StatCard title="Pending Payments" value={formatCurrency(stats.pending)} icon={CreditCard} accent="amber" />
            <StatCard title="Completed" value={stats.completed.toString()} icon={CheckCircle2} accent="purple" />
          </div>

          {/* Analytics */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2"><RevenueChart /></div>
            <div><ProjectStatusChart /></div>
          </div>
          <TeamWorkloadChart />

          {/* Main Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Recent Projects */}
              <Card className="border-slate-100 shadow-none hover:shadow-sm transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-[15px] font-semibold text-slate-900">
                    <span>Recent Projects</span>
                    <Link href="/admin/projects" className="text-[12px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">View all <ArrowUpRight className="h-3 w-3" /></Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {projects.length === 0 ? <p className="text-sm text-slate-400 text-center py-6">No projects yet</p> : (
                    <div className="space-y-2.5">
                      {projects.slice(0, 4).map((project) => (
                        <Link key={project.id} href={`/admin/projects/${project.id}`} className="flex items-center gap-4 rounded-lg border border-slate-50 p-3 hover:bg-slate-50/50 transition-colors">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                            <FolderKanban className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-slate-900 truncate">{project.name}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{project.clients?.profiles?.full_name || project.clients?.company}</p>
                          </div>
                          <div className="hidden sm:flex items-center gap-3">
                            <Badge className="border text-[10px] bg-blue-50 text-blue-700 border-blue-100 font-medium">{project.status.replace("-", " ")}</Badge>
                            <div className="w-20">
                              <Progress value={project.progress} />
                            </div>
                            <span className="text-[11px] text-slate-500 w-8 text-right">{project.progress}%</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pending Invoices */}
              {invoices.length > 0 && (
                <Card className="border-slate-100 shadow-none hover:shadow-sm transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-[15px] font-semibold text-slate-900">
                      <span>Pending Invoices</span>
                      <Link href="/admin/invoices" className="text-[12px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">View all <ArrowUpRight className="h-3 w-3" /></Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2.5">
                      {invoices.map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between rounded-lg border border-slate-50 p-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                              <Receipt className="h-3.5 w-3.5 text-amber-600" />
                            </div>
                            <div>
                              <p className="text-[13px] font-medium text-slate-900">{inv.invoice_number}</p>
                              <p className="text-[11px] text-slate-400">{inv.clients?.profiles?.full_name}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[13px] font-semibold text-slate-900">{formatCurrency(inv.total_amount)}</p>
                            <Badge className="border text-[10px] bg-amber-50 text-amber-700 border-amber-100">{inv.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Upcoming Deadlines */}
              <Card className="border-slate-100 shadow-none hover:shadow-sm transition-shadow">
                <CardHeader className="pb-3"><CardTitle className="text-[15px] font-semibold text-slate-900">Upcoming Deadlines</CardTitle></CardHeader>
                <CardContent>
                  {projects.filter(p => p.deadline && p.status !== "completed").length === 0 ? <p className="text-[13px] text-slate-400 text-center py-4">No upcoming deadlines</p> : (
                    <div className="space-y-3">
                      {projects.filter(p => p.deadline && p.status !== "completed").sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime()).slice(0, 4).map((p) => (
                        <div key={p.id} className="flex items-start gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50"><Clock className="h-3.5 w-3.5 text-amber-600" /></div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium text-slate-900 truncate">{p.name}</p>
                            <p className="text-[11px] text-slate-400">{formatDate(p.deadline!)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="border-slate-100 shadow-none hover:shadow-sm transition-shadow">
                <CardHeader className="pb-3"><CardTitle className="text-[15px] font-semibold text-slate-900">Recent Activity</CardTitle></CardHeader>
                <CardContent>
                  {activities.length === 0 ? <p className="text-[13px] text-slate-400 text-center py-4">No activity yet</p> : (
                    <div className="space-y-3">
                      {activities.map((a) => (
                        <div key={a.id} className="flex items-start gap-3">
                          <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                          <div>
                            <p className="text-[13px] text-slate-700">{a.action.replace(/_/g, " ")} {a.entity_type}</p>
                            <p className="text-[11px] text-slate-400">{formatDate(a.created_at)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
