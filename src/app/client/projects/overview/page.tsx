"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Calendar, DollarSign, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { CardSkeleton } from "@/components/ui/skeleton";
import { getClientProjects } from "@/lib/actions/projects";
import { formatDate, formatCurrency } from "@/lib/utils";

type Project = { id: string; name: string; description: string | null; status: string; progress: number; budget: number | null; deadline: string | null; start_date: string | null };

export default function ProjectOverviewPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setLoading(true); const d = await getClientProjects(); setProjects(d as Project[]); } catch { toast.error("Failed to load"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="space-y-4"><CardSkeleton /><CardSkeleton /></div>;

  const active = projects.filter(p => p.status !== "completed" && p.status !== "cancelled");
  const totalBudget = projects.reduce((acc, p) => acc + (p.budget || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Projects Overview" description="Summary of all your projects" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Projects" value={projects.length.toString()} icon={CheckCircle2} />
        <StatCard title="Active" value={active.length.toString()} icon={Calendar} />
        <StatCard title="Total Budget" value={formatCurrency(totalBudget)} icon={DollarSign} />
      </div>
      <div className="space-y-4">
        {projects.map((p) => (
          <Card key={p.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{p.name}</CardTitle>
                <Badge className="border bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                  {p.status.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                <span>Progress</span>
                <span className="font-semibold text-gray-700">{p.progress}%</span>
              </div>
              <Progress value={p.progress} />
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                {p.deadline && <span>Due: {formatDate(p.deadline)}</span>}
                {p.budget && <span>Budget: {formatCurrency(p.budget)}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
