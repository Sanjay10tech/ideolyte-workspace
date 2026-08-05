"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, CheckSquare } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/page-header";
import { CardSkeleton, EmptyState } from "@/components/ui/skeleton";
import { Dialog, DialogHeader, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getTasks, createTaskAction, updateTaskAction, type TaskWithProject } from "@/lib/actions/tasks";
import { getProjects, type ProjectWithClient } from "@/lib/actions/projects";
import { getProjectTeamForTaskAssignment, type ProjectTeamMemberForAssignment } from "@/lib/actions/team";
import { formatDate } from "@/lib/utils";

const columns = [
  { key: "todo", label: "To Do", color: "border-t-gray-400" },
  { key: "in-progress", label: "In Progress", color: "border-t-blue-500" },
  { key: "review", label: "In Review", color: "border-t-amber-500" },
  { key: "completed", label: "Completed", color: "border-t-emerald-500" },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskWithProject[]>([]);
  const [projects, setProjects] = useState<ProjectWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<TaskWithProject | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [assignableMembers, setAssignableMembers] = useState<ProjectTeamMemberForAssignment[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [t, p] = await Promise.all([getTasks(), getProjects()]);
      setTasks(t);
      setProjects(p);
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleProjectChange(projectId: string) {
    setSelectedProjectId(projectId);
    if (!projectId) { setAssignableMembers([]); return; }
    setLoadingMembers(true);
    const members = await getProjectTeamForTaskAssignment(projectId);
    setAssignableMembers(members);
    setLoadingMembers(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = editTask
      ? await updateTaskAction(editTask.id, formData)
      : await createTaskAction(formData);
    setFormLoading(false);
    if (result.error) { toast.error(result.error); return; }
    toast.success(editTask ? "Task updated" : "Task created");
    setFormOpen(false); setEditTask(null); loadData();
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Tasks" description="Manage all tasks across projects">
        <Button size="sm" onClick={() => { setEditTask(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add Task
        </Button>
      </PageHeader>

      {/* Kanban Board */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : tasks.length === 0 ? (
        <Card><CardContent className="p-0">
          <EmptyState title="No tasks yet" description="Create tasks from project pages or add one here" icon={<CheckSquare className="h-10 w-10" />} />
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {columns.map((column) => {
            const colTasks = tasks.filter((t) => t.status === column.key);
            return (
              <div key={column.key} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700">{column.label}</h3>
                  <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{colTasks.length}</span>
                </div>
                <div className="space-y-3">
                  {colTasks.map((task) => (
                    <Card key={task.id} className={`border-t-2 ${column.color} cursor-pointer hover:shadow-md transition-shadow`}
                      onClick={() => { setEditTask(task); setFormOpen(true); }}>
                      <CardContent className="p-4">
                        <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                        {task.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>}
                        <div className="mt-3 flex items-center justify-between">
                          <Badge variant={task.priority === "high" || task.priority === "urgent" ? "destructive" : task.priority === "medium" ? "warning" : "secondary"}>
                            {task.priority}
                          </Badge>
                          {task.due_date && <span className="text-xs text-gray-400">{formatDate(task.due_date)}</span>}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">{task.projects?.name || "Unknown"}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Form Dialog */}
      <Dialog open={formOpen} onClose={() => { setFormOpen(false); setEditTask(null); setSelectedProjectId(""); setAssignableMembers([]); }}>
        <DialogHeader onClose={() => { setFormOpen(false); setEditTask(null); setSelectedProjectId(""); setAssignableMembers([]); }}>
          {editTask ? "Edit Task" : "Add Task"}
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogContent className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label><Input name="title" required defaultValue={editTask?.title || ""} placeholder="Task title" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label><Textarea name="description" rows={3} defaultValue={editTask?.description || ""} /></div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Project *</label>
              <Select name="project_id" required defaultValue={editTask?.project_id || ""} onChange={(e) => handleProjectChange(e.target.value)}>
                <option value="">Select project</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Assign To *</label>
              {loadingMembers ? (
                <p className="text-xs text-gray-400">Loading team members...</p>
              ) : !selectedProjectId && !editTask ? (
                <p className="text-xs text-gray-400">Select a project first</p>
              ) : assignableMembers.length === 0 && selectedProjectId ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-sm text-amber-700">No team members assigned to this project.</p>
                </div>
              ) : (
                <Select name="assignee_id" required defaultValue="">
                  <option value="">Select team member</option>
                  {assignableMembers.map((tm) => (
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setFormOpen(false); setEditTask(null); setSelectedProjectId(""); setAssignableMembers([]); }}>Cancel</Button>
            <Button type="submit" disabled={formLoading}>{formLoading ? <LoadingSpinner size="sm" /> : "Save"}</Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
