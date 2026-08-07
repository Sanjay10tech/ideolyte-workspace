"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load recharts to avoid blocking initial render
const AreaChart = dynamic(() => import("recharts").then(m => m.AreaChart), { ssr: false });
const Area = dynamic(() => import("recharts").then(m => m.Area), { ssr: false });
const XAxis = dynamic(() => import("recharts").then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then(m => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then(m => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false });
const PieChart = dynamic(() => import("recharts").then(m => m.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then(m => m.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then(m => m.Cell), { ssr: false });
const BarChart = dynamic(() => import("recharts").then(m => m.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then(m => m.Bar), { ssr: false });

// Glass card wrapper
function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/70 bg-white/[0.72] backdrop-blur-[16px] shadow-[0_4px_24px_rgba(99,102,241,0.06)] p-5 ${className}`}>
      {children}
    </div>
  );
}

function ChartSkeleton() {
  return <div className="space-y-3"><Skeleton className="h-4 w-32" /><Skeleton className="h-[200px] w-full rounded-xl" /></div>;
}

// ─── REVENUE CHART ───
export function RevenueChart() {
  const [data, setData] = useState<{ month: string; received: number; pending: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: invoices } = await supabase
      .from("invoices")
      .select("total_amount, paid_amount, status, issued_date")
      .gte("issued_date", sixMonthsAgo.toISOString().split("T")[0]);

    // Group by month
    const monthMap = new Map<string, { received: number; pending: number }>();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${months[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
      monthMap.set(key, { received: 0, pending: 0 });
    }

    for (const inv of (invoices || []) as { total_amount: number; paid_amount: number; status: string; issued_date: string }[]) {
      const d = new Date(inv.issued_date);
      const key = `${months[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
      if (monthMap.has(key)) {
        const entry = monthMap.get(key)!;
        entry.received += inv.paid_amount || 0;
        entry.pending += (inv.total_amount - (inv.paid_amount || 0));
      }
    }

    setData(Array.from(monthMap.entries()).map(([month, v]) => ({ month, ...v })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <GlassCard><ChartSkeleton /></GlassCard>;

  const formatY = (v: number) => {
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
    if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
    return `₹${v}`;
  };

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-semibold text-slate-900">Revenue Overview</h3>
        <span className="text-[11px] text-slate-400">Last 6 months</span>
      </div>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradReceived" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradPending" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={formatY} width={50} />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
            <Area type="monotone" dataKey="received" stroke="#3b82f6" strokeWidth={2} fill="url(#gradReceived)" name="Received" />
            <Area type="monotone" dataKey="pending" stroke="#8b5cf6" strokeWidth={2} fill="url(#gradPending)" name="Pending" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-4 mt-3">
        <span className="flex items-center gap-1.5 text-[11px] text-slate-500"><span className="h-2 w-2 rounded-full bg-blue-500" />Received</span>
        <span className="flex items-center gap-1.5 text-[11px] text-slate-500"><span className="h-2 w-2 rounded-full bg-violet-500" />Pending</span>
      </div>
    </GlassCard>
  );
}

// ─── PROJECT STATUS DONUT ───
export function ProjectStatusChart() {
  const [data, setData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: projects } = await supabase.from("projects").select("status");

    const counts: Record<string, number> = { "in-progress": 0, completed: 0, "on-hold": 0, planning: 0 };
    for (const p of (projects || []) as { status: string }[]) {
      if (counts[p.status] !== undefined) counts[p.status]++;
      else counts.planning++;
    }

    const items = [
      { name: "Active", value: counts["in-progress"], color: "#3b82f6" },
      { name: "Completed", value: counts.completed, color: "#10b981" },
      { name: "On Hold", value: counts["on-hold"], color: "#f59e0b" },
      { name: "Planning", value: counts.planning, color: "#6366f1" },
    ].filter(i => i.value > 0);

    setData(items);
    setTotal((projects || []).length);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <GlassCard><ChartSkeleton /></GlassCard>;

  return (
    <GlassCard>
      <h3 className="text-[15px] font-semibold text-slate-900 mb-4">Project Status</h3>
      <div className="h-[200px] relative">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full"><p className="text-sm text-slate-400">No projects yet</p></div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                  {data.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">{total}</p>
                <p className="text-[10px] text-slate-400">Total</p>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="flex flex-wrap gap-3 mt-3">
        {data.map((d) => (
          <span key={d.name} className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />{d.name} ({d.value})
          </span>
        ))}
      </div>
    </GlassCard>
  );
}

// ─── TEAM WORKLOAD BAR ───
export function TeamWorkloadChart() {
  const [data, setData] = useState<{ name: string; assigned: number; completed: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: team } = await supabase.from("team_members").select("profile_id, profiles(full_name)");
    const { data: tasks } = await supabase.from("tasks").select("assignee_id, status");

    const members = (team || []) as unknown as { profile_id: string; profiles: { full_name: string } }[];
    const allTasks = (tasks || []) as { assignee_id: string | null; status: string }[];

    const chartData = members.map(m => {
      const myTasks = allTasks.filter(t => t.assignee_id === m.profile_id);
      return {
        name: m.profiles.full_name.split(" ")[0],
        assigned: myTasks.length,
        completed: myTasks.filter(t => t.status === "completed").length,
      };
    }).filter(d => d.assigned > 0);

    setData(chartData);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <GlassCard><ChartSkeleton /></GlassCard>;

  return (
    <GlassCard>
      <h3 className="text-[15px] font-semibold text-slate-900 mb-4">Team Workload</h3>
      <div className="h-[180px]">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full"><p className="text-sm text-slate-400">No team data yet</p></div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }} barGap={4}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
              <Bar dataKey="assigned" fill="#6366f1" radius={[4, 4, 0, 0]} name="Assigned" />
              <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="flex items-center gap-4 mt-3">
        <span className="flex items-center gap-1.5 text-[11px] text-slate-500"><span className="h-2 w-2 rounded-full bg-indigo-500" />Assigned</span>
        <span className="flex items-center gap-1.5 text-[11px] text-slate-500"><span className="h-2 w-2 rounded-full bg-emerald-500" />Completed</span>
      </div>
    </GlassCard>
  );
}
