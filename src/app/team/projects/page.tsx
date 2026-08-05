"use client";

import { useEffect, useState, useCallback } from "react";
import { FolderKanban } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { CardSkeleton, EmptyState } from "@/components/ui/skeleton";
import { getMyTeamProjects } from "@/lib/actions/team";
import { formatDate } from "@/lib/utils";

type Project = { id: string; name: string; description: string | null; status: string; progress: number; deadline: string | null; role_in_project: string };

export default function TeamProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setLoading(true); const d = await getMyTeamProjects(); setProjects(d as Project[]); } catch { toast.error("Failed"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader title="My Projects" description="Projects assigned to you" />
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2"><CardSkeleton /><CardSkeleton /></div>
      ) : projects.length === 0 ? (
        <Card><CardContent className="p-0"><EmptyState title="No projects" description="Projects will appear here when you are assigned" icon={<FolderKanban className="h-10 w-10" />} /></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link key={p.id} href={`/team/projects/${p.id}`}>
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-900">{p.name}</h3>
                    <Badge className="border text-[10px] bg-blue-50 text-blue-700 border-blue-200 shrink-0">{p.status.replace("-", " ")}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">Role: {p.role_in_project}</p>
                  {p.description && <p className="text-xs text-gray-400 line-clamp-2 mb-3">{p.description}</p>}
                  <Progress value={p.progress} />
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                    <span>{p.progress}%</span>
                    {p.deadline && <span>Due {formatDate(p.deadline)}</span>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
