"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export interface ProjectWithClient {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  budget: number | null;
  start_date: string | null;
  deadline: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  clients: {
    id: string;
    company: string;
    profiles: {
      full_name: string;
    };
  };
  task_count?: { total: number; completed: number };
}

export async function getProjects(search?: string, status?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("projects")
    .select("*, clients(id, company, profiles(full_name))")
    .order("created_at", { ascending: false });

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }
  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as unknown as ProjectWithClient[];
}

export async function getProjectById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*, clients(id, company, profile_id, profiles(full_name, email))")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as unknown as ProjectWithClient;
}

export async function getClientProjects() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (clientError || !client) return [];

  const { data, error } = await supabase
    .from("projects")
    .select("id, name, description, status, progress, budget, start_date, deadline")
    .eq("client_id", (client as { id: string }).id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getClientProjects error:", error.message);
    return [];
  }
  return data || [];
}

export async function createProjectAction(formData: FormData) {
  const supabase = await createAdminClient();

  const name = formData.get("name") as string;
  const client_id = formData.get("client_id") as string;
  const description = (formData.get("description") as string) || null;
  const budget = formData.get("budget") ? Number(formData.get("budget")) : null;
  const start_date = (formData.get("start_date") as string) || null;
  const deadline = (formData.get("deadline") as string) || null;
  const status = (formData.get("status") as string) || "planning";

  const { data, error } = await supabase
    .from("projects")
    .insert({ name, client_id, description, budget, start_date, deadline, status })
    .select()
    .single();

  if (error) return { error: error.message };

  // Log activity
  const currentUser = await supabase.auth.getUser();
  if (currentUser.data.user) {
    await supabase.from("activity_logs").insert({
      user_id: currentUser.data.user.id,
      action: "created",
      entity_type: "project",
      entity_id: data.id,
      metadata: { project_name: name },
    });
  }

  revalidatePath("/admin/projects");
  revalidatePath("/client");
  return { success: true, id: data.id };
}

export async function updateProjectAction(projectId: string, formData: FormData) {
  const supabase = await createAdminClient();

  const name = formData.get("name") as string;
  const client_id = formData.get("client_id") as string;
  const description = (formData.get("description") as string) || null;
  const budget = formData.get("budget") ? Number(formData.get("budget")) : null;
  const start_date = (formData.get("start_date") as string) || null;
  const deadline = (formData.get("deadline") as string) || null;
  const status = (formData.get("status") as string) || "planning";
  const progress = Number(formData.get("progress") || 0);

  const { error } = await supabase
    .from("projects")
    .update({ name, client_id, description, budget, start_date, deadline, status, progress })
    .eq("id", projectId);

  if (error) return { error: error.message };

  // Log activity
  const currentUser = await supabase.auth.getUser();
  if (currentUser.data.user) {
    await supabase.from("activity_logs").insert({
      user_id: currentUser.data.user.id,
      action: "updated",
      entity_type: "project",
      entity_id: projectId,
      metadata: { project_name: name, status, progress },
    });
  }

  revalidatePath("/admin/projects");
  revalidatePath("/client");
  return { success: true };
}

export async function archiveProjectAction(projectId: string) {
  const supabase = await createAdminClient();

  const { error } = await supabase
    .from("projects")
    .update({ status: "cancelled" })
    .eq("id", projectId);

  if (error) return { error: error.message };

  revalidatePath("/admin/projects");
  revalidatePath("/client");
  return { success: true };
}
