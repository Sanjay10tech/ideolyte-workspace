"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export interface TaskWithProject {
  id: string;
  project_id: string;
  milestone_id: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignee_id: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  projects: {
    name: string;
    client_id: string;
  };
}

export async function getTasks(projectId?: string, status?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("tasks")
    .select("*, projects(name, client_id)")
    .order("created_at", { ascending: false });

  if (projectId) {
    query = query.eq("project_id", projectId);
  }
  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as unknown as TaskWithProject[];
}

export async function getTasksByProject(projectId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createTaskAction(formData: FormData) {
  const supabase = await createAdminClient();

  const project_id = formData.get("project_id") as string;
  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const status = (formData.get("status") as string) || "todo";
  const priority = (formData.get("priority") as string) || "medium";
  const due_date = (formData.get("due_date") as string) || null;
  const milestone_id = (formData.get("milestone_id") as string) || null;
  const assignee_id = formData.get("assignee_id") as string;

  if (!assignee_id) {
    return { error: "Assign To is required. Please select a team member." };
  }

  const { error } = await supabase
    .from("tasks")
    .insert({ project_id, title, description, status, priority, due_date, milestone_id, assignee_id });

  if (error) return { error: error.message };

  // Log activity
  const currentUser = await supabase.auth.getUser();
  if (currentUser.data.user) {
    await supabase.from("activity_logs").insert({
      user_id: currentUser.data.user.id,
      action: "created",
      entity_type: "task",
      entity_id: project_id,
      metadata: { task_title: title, project_id },
    });
  }

  revalidatePath("/admin/tasks");
  revalidatePath("/admin/projects");
  revalidatePath("/client");
  return { success: true };
}

export async function updateTaskAction(taskId: string, formData: FormData) {
  const supabase = await createAdminClient();

  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const status = (formData.get("status") as string) || "todo";
  const priority = (formData.get("priority") as string) || "medium";
  const due_date = (formData.get("due_date") as string) || null;
  const completed_at = status === "completed" ? new Date().toISOString() : null;

  const { error } = await supabase
    .from("tasks")
    .update({ title, description, status, priority, due_date, completed_at })
    .eq("id", taskId);

  if (error) return { error: error.message };

  revalidatePath("/admin/tasks");
  revalidatePath("/admin/projects");
  revalidatePath("/client");
  return { success: true };
}

export async function deleteTaskAction(taskId: string) {
  const supabase = await createAdminClient();
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) return { error: error.message };

  revalidatePath("/admin/tasks");
  revalidatePath("/admin/projects");
  revalidatePath("/client");
  return { success: true };
}
