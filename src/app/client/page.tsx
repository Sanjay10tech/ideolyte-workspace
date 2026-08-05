"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/providers/auth-provider";
import { CardSkeleton } from "@/components/ui/skeleton";
import { getClientProjects } from "@/lib/actions/projects";
import { formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type Project = { id: string; name: string; status: string; progress: number; deadline: string | null; budget: number | null; start_date: string | null; description: string | null };
type ActivityLog = { id: string; action: string; entity_type: string; metadata: Record<string, unknown> | null; created_at: string };

export default function ClientDashboardPage() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const firstName = profile?.full_name?.split(" ")[0] || "there";

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const p = await getClientProjects();
      setProjects(p as Project[]);

      // Load activities for client
      const supabase = createClient();
      const { data: logs } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);
      setActivities((logs || []) as unknown as ActivityLog[]);
    } catch {
      toast.error("Failed to load dashboard data");
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

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-xl bg-gradient-to-r from-[#0f172a] to-[#1e293b] p-6 sm:p-8 text-white">
        <h1 className="text-xl sm:text-2xl font-semibold">Welcome back, {firstName} 👋</h1>
        <p className="mt-2 text-sm text-gray-300 max-w-xl">
          Track your projects, tasks, documents and payments in one place.
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Projects */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-4">Active Projects</h2>
            {loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <CardSkeleton /><CardSkeleton />
              </div>
            ) : activeProjects.length === 0 ? (
              <Card><CardContent className="p-6 text-center"><p className="text-sm text-gray-400">No active projects</p></CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {activeProjects.map((project) => (
                  <Card key={project.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-900 pr-2">{project.name}</h3>
                        <Badge className={`border text-[10px] shrink-0 ${statusColor(project.status)}`}>
                          {project.status.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                            <span>Progress</span>
                            <span className="font-semibold text-gray-700">{project.progress}%</span>
                          </div>
                          <Progress value={project.progress} />
                        </div>
                        {project.deadline && (
                          <p className="text-xs text-gray-500">Due {formatDate(project.deadline)}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Activity */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No recent activity</p>
              ) : (
                <div className="space-y-4">
                  {activities.map((a) => (
                    <div key={a.id} className="flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-[#1e293b] mt-1.5 shrink-0" />
                      <div>
                        <p className="text-sm text-gray-700">
                          {a.action.replace("_", " ")} — {a.entity_type}
                        </p>
                        <p className="text-xs text-gray-400">{formatDate(a.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
