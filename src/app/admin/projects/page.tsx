"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Search, FolderKanban, Edit, Archive, Eye, Users2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Avatar } from "@/components/ui/avatar";
import { PageHeader } from "@/components/shared/page-header";
import { CardSkeleton, EmptyState } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ProjectFormDialog } from "@/components/admin/project-form-dialog";
import { getProjects, archiveProjectAction, type ProjectWithClient } from "@/lib/actions/projects";
import { formatCurrency, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const statusColors: Record<string, string> = {
  planning: "bg-gray-50 text-gray-700 border-gray-200",
  "in-progress": "bg-blue-50 text-blue-700 border-blue-200",
  "on-hold": "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  testing: "bg-purple-50 text-purple-700 border-purple-200",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editProject, setEditProject] = useState<ProjectWithClient | null>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [projectTeams, setProjectTeams] = useState<Record<string, { name: string }[]>>({});

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getProjects(search || undefined, statusFilter);
      setProjects(data);
      // Load team members for each project
      if (data.length > 0) {
        const supabase = createClient();
        const { data: members } = await supabase
          .from("project_members")
          .select("project_id, team_members(profiles(full_name))")
          .in("project_id", data.map(p => p.id));
        const teamMap: Record<string, { name: string }[]> = {};
        for (const m of (members || []) as unknown as { project_id: string; team_members: { profiles: { full_name: string } } }[]) {
          if (!teamMap[m.project_id]) teamMap[m.project_id] = [];
          teamMap[m.project_id].push({ name: m.team_members.profiles.full_name });
        }
        setProjectTeams(teamMap);
      }
    } catch {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(loadProjects, 300);
    return () => clearTimeout(timer);
  }, [loadProjects]);

  async function handleArchive() {
    if (!archiveId) return;
    const result = await archiveProjectAction(archiveId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Project archived successfully");
      loadProjects();
    }
    setArchiveId(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Projects" description="Track and manage all projects">
        <Button size="sm" onClick={() => { setEditProject(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> New Project
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 flex-1 max-w-sm">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
          />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-auto">
          <option value="all">All Statuses</option>
          <option value="planning">Planning</option>
          <option value="in-progress">In Progress</option>
          <option value="on-hold">On Hold</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              title="No projects found"
              description={search || statusFilter !== "all" ? "Try different filters" : "Create your first project to get started"}
              icon={<FolderKanban className="h-10 w-10" />}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{project.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {project.clients?.profiles?.full_name || project.clients?.company}
                    </p>
                  </div>
                  <Badge className={`border text-[10px] ${statusColors[project.status] || statusColors.planning}`}>
                    {project.status.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}
                  </Badge>
                </div>
                {project.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 mb-4">{project.description}</p>
                )}
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span className="font-medium text-gray-700">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    {project.budget && <span className="font-medium text-gray-700">{formatCurrency(project.budget)}</span>}
                    {project.deadline && <span>Due {formatDate(project.deadline)}</span>}
                  </div>
                  {/* Team */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                    <div className="flex items-center gap-1">
                      <Users2 className="h-3 w-3 text-slate-400" />
                      {(projectTeams[project.id] || []).length > 0 ? (
                        <div className="flex items-center -space-x-1.5">
                          {(projectTeams[project.id] || []).slice(0, 3).map((m, i) => (
                            <Avatar key={i} name={m.name} size="sm" className="h-6 w-6 text-[9px] border-2 border-white" />
                          ))}
                          {(projectTeams[project.id] || []).length > 3 && (
                            <span className="text-[10px] text-slate-500 ml-1.5">+{(projectTeams[project.id] || []).length - 3}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">Not assigned</span>
                      )}
                    </div>
                    <Link href={`/admin/projects/${project.id}`} className="text-[11px] text-blue-600 hover:text-blue-700 font-medium">
                      {(projectTeams[project.id] || []).length === 0 ? "Assign" : "Manage"}
                    </Link>
                  </div>
                  {/* Actions */}
                  <div className="pt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/admin/projects/${project.id}`}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        <Eye className="h-3 w-3 mr-1" /> View
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setEditProject(project); setFormOpen(true); }}>
                      <Edit className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    {project.status !== "cancelled" && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500 hover:text-red-600" onClick={() => setArchiveId(project.id)}>
                        <Archive className="h-3 w-3 mr-1" /> Archive
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Project Form Dialog */}
      <ProjectFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditProject(null); }}
        project={editProject}
        onSuccess={loadProjects}
      />

      {/* Archive Confirm */}
      <ConfirmDialog
        open={!!archiveId}
        onClose={() => setArchiveId(null)}
        onConfirm={handleArchive}
        title="Archive Project"
        description="Are you sure you want to archive this project? It will be marked as cancelled."
        confirmLabel="Archive"
        destructive
      />
    </div>
  );
}
