"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Dialog, DialogHeader, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { createProjectAction, updateProjectAction, type ProjectWithClient } from "@/lib/actions/projects";
import { getClients, type ClientWithProfile } from "@/lib/actions/clients";

interface ProjectFormDialogProps {
  open: boolean;
  onClose: () => void;
  project: ProjectWithClient | null;
  onSuccess: () => void;
}

export function ProjectFormDialog({ open, onClose, project, onSuccess }: ProjectFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<ClientWithProfile[]>([]);
  const isEdit = !!project;

  useEffect(() => {
    if (open) {
      getClients().then(setClients).catch(() => {});
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    let result;
    if (isEdit) {
      result = await updateProjectAction(project.id, formData);
    } else {
      result = await createProjectAction(formData);
    }

    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(isEdit ? "Project updated successfully" : "Project created successfully");
      onSuccess();
      onClose();
    }
  }

  return (
    <Dialog open={open} onClose={onClose} className="max-w-lg">
      <DialogHeader onClose={onClose}>{isEdit ? "Edit Project" : "New Project"}</DialogHeader>
      <form onSubmit={handleSubmit}>
        <DialogContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Name *</label>
            <Input name="name" required defaultValue={project?.name || ""} placeholder="E-commerce Platform Redesign" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Client *</label>
            <Select name="client_id" required defaultValue={project?.client_id || ""}>
              <option value="">Select a client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.profiles.full_name} — {c.company}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <Textarea name="description" rows={3} defaultValue={project?.description || ""} placeholder="Brief project description..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Budget ($)</label>
              <Input name="budget" type="number" step="0.01" defaultValue={project?.budget || ""} placeholder="10000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <Select name="status" defaultValue={project?.status || "planning"}>
                <option value="planning">Planning</option>
                <option value="in-progress">In Progress</option>
                <option value="on-hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
              <Input name="start_date" type="date" defaultValue={project?.start_date || ""} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Deadline</label>
              <Input name="deadline" type="date" defaultValue={project?.deadline || ""} />
            </div>
          </div>
          {isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Progress (%)</label>
              <Input name="progress" type="number" min="0" max="100" defaultValue={project?.progress || 0} />
            </div>
          )}
        </DialogContent>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading ? <LoadingSpinner size="sm" /> : isEdit ? "Save Changes" : "Create Project"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
