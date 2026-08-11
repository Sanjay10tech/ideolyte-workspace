"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Calendar, DollarSign, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { Dialog, DialogHeader, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LoadingSpinner, PageLoader } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/skeleton";
import { getProjectById, type ProjectWithClient } from "@/lib/actions/projects";
import { getMilestones, createMilestoneAction, updateMilestoneAction, deleteMilestoneAction } from "@/lib/actions/milestones";
import { getTasksByProject, createTaskAction, updateTaskAction, deleteTaskAction } from "@/lib/actions/tasks";
import { getProjectUpdates, createProjectUpdateAction, type ProjectUpdateWithAuthor } from "@/lib/actions/project-updates";
import { formatDate, formatCurrency } from "@/lib/utils";
import { ProjectTeamSection } from "@/components/admin/project-team-section";
import { ProjectReviewSection } from "@/components/admin/project-review-section";
import { getProjectTeamForTaskAssignment, type ProjectTeamMemberForAssignment } from "@/lib/actions/team";

type Milestone = { id: string; title: string; description: string | null; status: string; due_date: string | null; completed_date: string | null };
type Task = { id: string; title: string; description: string | null; status: string; priority: string; due_date: string | null };

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<ProjectWithClient | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [updates, setUpdates] = useState<ProjectUpdateWithAuthor[]>([]);
  const [teamForAssignment, setTeamForAssignment] = useState<ProjectTeamMemberForAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Dialog states
  const [milestoneForm, setMilestoneForm] = useState(false);
  const [editMilestone, setEditMilestone] = useState<Milestone | null>(null);
  const [taskForm, setTaskForm] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [updateForm, setUpdateForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string } | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [p, m, t, u, tm] = await Promise.all([
        getProjectById(projectId),
        getMilestones(projectId),
        getTasksByProject(projectId),
        getProjectUpdates(projectId),
        getProjectTeamForTaskAssignment(projectId),
      ]);
      setProject(p);
      setMilestones(m as Milestone[]);
      setTasks(t as Task[]);
      setUpdates(u);
      setTeamForAssignment(tm);
    } catch {
      toast.error("Failed to load project data");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <PageLoader />;
  if (!project) return <EmptyState title="Project not found" description="This project may have been deleted." />;

  const completedTasks = tasks.filter(t => t.status === "completed").length;

  // ─── Handlers ───
  async function handleMilestoneSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("project_id", projectId);
    const result = editMilestone
      ? await updateMilestoneAction(editMilestone.id, formData)
      : await createMilestoneAction(formData);
    setFormLoading(false);
    if (result.error) { toast.error(result.error); return; }
    toast.success(editMilestone ? "Milestone updated" : "Milestone created");
    setMilestoneForm(false); setEditMilestone(null); loadData();
  }

  async function handleTaskSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("project_id", projectId);
    const result = editTask
      ? await updateTaskAction(editTask.id, formData)
      : await createTaskAction(formData);
    setFormLoading(false);
    if (result.error) { toast.error(result.error); return; }
    toast.success(editTask ? "Task updated" : "Task created");
    setTaskForm(false); setEditTask(null); loadData();
  }

  async function handleUpdateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("project_id", projectId);
    const result = await createProjectUpdateAction(formData);
    setFormLoading(false);
    if (result.error) { toast.error(result.error); return; }
    toast.success("Update published");
    setUpdateForm(false); loadData();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setFormLoading(true);
    const result = deleteTarget.type === "milestone"
      ? await deleteMilestoneAction(deleteTarget.id)
      : await deleteTaskAction(deleteTarget.id);
    setFormLoading(false);
    if (result.error) { toast.error(result.error); return; }
    toast.success(`${deleteTarget.type === "milestone" ? "Milestone" : "Task"} deleted`);
    setDeleteTarget(null); loadData();
  }

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
        <StatCard title="Tasks" value={`${completedTasks}/${tasks.length}`} icon={CheckCircle2} />
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 overflow-x-auto">
        <nav className="flex gap-0 min-w-max">
          {[
            { key: "overview", label: "Overview" },
            { key: "team", label: "Team" },
            { key: "review", label: "Review" },
          ].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab: Review */}
      {activeTab === "review" && (
        <ProjectReviewSection
          projectId={projectId}
          projectName={project.name}
          clientName={project.clients?.profiles?.full_name || project.clients?.company || "Client"}
          progress={project.progress}
        />
      )}

      {/* Tab: Team */}
      {activeTab === "team" && <ProjectTeamSection projectId={projectId} />}

      {/* Tab: Overview */}
      {activeTab === "overview" && (<>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Milestones */}
        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-base">Milestones</CardTitle>
            <Button size="sm" variant="outline" onClick={() => { setEditMilestone(null); setMilestoneForm(true); }}>
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          </CardHeader>
          <CardContent>
            {milestones.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No milestones yet</p>
            ) : (
              <div className="space-y-3">
                {milestones.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-50 hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${m.status === "completed" ? "bg-emerald-500" : m.status === "in-progress" ? "bg-blue-500" : "bg-gray-300"}`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{m.title}</p>
                        {m.due_date && <p className="text-xs text-gray-400">{formatDate(m.due_date)}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditMilestone(m); setMilestoneForm(true); }} className="p-1 text-gray-400 hover:text-gray-600"><Edit className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setDeleteTarget({ type: "milestone", id: m.id })} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-base">Tasks</CardTitle>
            <Button size="sm" variant="outline" onClick={() => { setEditTask(null); setTaskForm(true); }}>
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No tasks yet</p>
            ) : (
              <div className="space-y-2">
                {tasks.slice(0, 8).map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-50 hover:bg-gray-50">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`h-2 w-2 rounded-full shrink-0 ${t.status === "completed" ? "bg-emerald-500" : t.status === "in-progress" ? "bg-blue-500" : t.status === "review" ? "bg-amber-500" : "bg-gray-300"}`} />
                      <p className="text-sm text-gray-700 truncate">{t.title}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant="secondary" className="text-[10px]">{t.priority}</Badge>
                      <button onClick={() => { setEditTask(t); setTaskForm(true); }} className="p-1 text-gray-400 hover:text-gray-600"><Edit className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setDeleteTarget({ type: "task", id: t.id })} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Overall Progress</span>
            <span className="font-semibold">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-3" />
        </CardContent>
      </Card>

      {/* Project Updates */}
      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between">
          <CardTitle className="text-base">Project Updates</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setUpdateForm(true)}>
            <Plus className="h-3 w-3 mr-1" /> Post Update
          </Button>
        </CardHeader>
        <CardContent>
          {updates.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No updates yet</p>
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

      </>)}

      {/* ─── MILESTONE FORM ─── */}
      <Dialog open={milestoneForm} onClose={() => { setMilestoneForm(false); setEditMilestone(null); }}>
        <DialogHeader onClose={() => { setMilestoneForm(false); setEditMilestone(null); }}>
          {editMilestone ? "Edit Milestone" : "Add Milestone"}
        </DialogHeader>
        <form onSubmit={handleMilestoneSubmit}>
          <DialogContent className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label><Input name="title" required defaultValue={editMilestone?.title || ""} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label><Textarea name="description" rows={2} defaultValue={editMilestone?.description || ""} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date</label><Input name="due_date" type="date" defaultValue={editMilestone?.due_date || ""} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                <Select name="status" defaultValue={editMilestone?.status || "upcoming"}>
                  <option value="upcoming">Upcoming</option><option value="in-progress">In Progress</option><option value="completed">Completed</option>
                </Select>
              </div>
            </div>
          </DialogContent>
          <DialogFooter><Button type="button" variant="outline" onClick={() => { setMilestoneForm(false); setEditMilestone(null); }}>Cancel</Button><Button type="submit" disabled={formLoading}>{formLoading ? <LoadingSpinner size="sm" /> : "Save"}</Button></DialogFooter>
        </form>
      </Dialog>

      {/* ─── TASK FORM ─── */}
      <Dialog open={taskForm} onClose={() => { setTaskForm(false); setEditTask(null); }}>
        <DialogHeader onClose={() => { setTaskForm(false); setEditTask(null); }}>
          {editTask ? "Edit Task" : "Add Task"}
        </DialogHeader>
        <form onSubmit={handleTaskSubmit}>
          <DialogContent className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label><Input name="title" required defaultValue={editTask?.title || ""} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label><Textarea name="description" rows={2} defaultValue={editTask?.description || ""} /></div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Assign To *</label>
              {teamForAssignment.length === 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-sm text-amber-700">No team members assigned to this project.</p>
                  <Button type="button" variant="outline" size="sm" className="mt-2 text-xs" onClick={() => { setTaskForm(false); }}>Assign Team Member</Button>
                </div>
              ) : (
                <Select name="assignee_id" required defaultValue={editTask ? "" : ""}>
                  <option value="">Select team member</option>
                  {teamForAssignment.map((tm) => (
                    <option key={tm.profile_id} value={tm.profile_id}>{tm.full_name} — {tm.job_role}</option>
                  ))}
                </Select>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                <Select name="status" defaultValue={editTask?.status || "todo"}>
                  <option value="todo">To Do</option><option value="in-progress">In Progress</option><option value="review">Review</option><option value="completed">Completed</option>
                </Select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
                <Select name="priority" defaultValue={editTask?.priority || "medium"}>
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
                </Select>
              </div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date</label><Input name="due_date" type="date" defaultValue={editTask?.due_date || ""} /></div>
          </DialogContent>
          <DialogFooter><Button type="button" variant="outline" onClick={() => { setTaskForm(false); setEditTask(null); }}>Cancel</Button><Button type="submit" disabled={formLoading || teamForAssignment.length === 0}>{formLoading ? <LoadingSpinner size="sm" /> : "Save"}</Button></DialogFooter>
        </form>
      </Dialog>

      {/* ─── UPDATE FORM ─── */}
      <Dialog open={updateForm} onClose={() => setUpdateForm(false)}>
        <DialogHeader onClose={() => setUpdateForm(false)}>Post Project Update</DialogHeader>
        <form onSubmit={handleUpdateSubmit}>
          <DialogContent className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label><Input name="title" required placeholder="e.g. Frontend development completed" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Content *</label><Textarea name="content" required rows={4} placeholder="Describe the progress or changes..." /></div>
          </DialogContent>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setUpdateForm(false)}>Cancel</Button><Button type="submit" disabled={formLoading}>{formLoading ? <LoadingSpinner size="sm" /> : "Publish"}</Button></DialogFooter>
        </form>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Item" description="Are you sure? This action cannot be undone." confirmLabel="Delete" destructive loading={formLoading} />
    </div>
  );
}
