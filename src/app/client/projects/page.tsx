"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { CardSkeleton, EmptyState } from "@/components/ui/skeleton";
import { getClientProjects } from "@/lib/actions/projects";
import { formatDate, formatCurrency } from "@/lib/utils";
import { FolderKanban, Eye } from "lucide-react";

type Project = { id: string; name: string; description: string | null; status: string; progress: number; budget: number | null; start_date: string | null; deadline: string | null };

export default function ClientProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getClientProjects();
      setProjects(data as Project[]);
    } catch {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const statusColor = (s: string) => {
    if (s === "in-progress") return "bg-blue-50 text-blue-700 border-blue-200";
    if (s === "completed") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (s === "on-hold") return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  return (
    <div className="space-y-6">
      <PageHeader title="My Projects" description="All your projects in Ideolyte Workspace" />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2"><CardSkeleton /><CardSkeleton /></div>
      ) : projects.length === 0 ? (
        <Card><CardContent className="p-0">
          <EmptyState title="No projects yet" description="Your projects will appear here once assigned" icon={<FolderKanban className="h-10 w-10" />} />
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900">{project.name}</h3>
                  <Badge className={`border text-[10px] ${statusColor(project.status)}`}>
                    {project.status.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}
                  </Badge>
                </div>
                {project.description && <p className="text-sm text-gray-500 mb-4 line-clamp-2">{project.description}</p>}
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                      <span>Progress</span>
                      <span className="font-semibold text-gray-700">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-50">
                    <div><p className="text-xs text-gray-400">Deadline</p><p className="text-sm font-medium text-gray-900">{project.deadline ? formatDate(project.deadline) : "—"}</p></div>
                    <div><p className="text-xs text-gray-400">Budget</p><p className="text-sm font-medium text-gray-900">{project.budget ? formatCurrency(project.budget) : "—"}</p></div>
                  </div>
                  <Link href={`/client/projects/${project.id}`}>
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      <Eye className="h-3.5 w-3.5 mr-1" /> View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
