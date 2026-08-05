"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function getMilestones(projectId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("milestones")
    .select("*")
    .eq("project_id", projectId)
    .order("due_date", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createMilestoneAction(formData: FormData) {
  const supabase = await createAdminClient();

  const project_id = formData.get("project_id") as string;
  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const due_date = (formData.get("due_date") as string) || null;
  const status = (formData.get("status") as string) || "upcoming";

  const { error } = await supabase
    .from("milestones")
    .insert({ project_id, title, description, due_date, status });

  if (error) return { error: error.message };

  revalidatePath("/admin/projects");
  revalidatePath("/client");
  return { success: true };
}

export async function updateMilestoneAction(id: string, formData: FormData) {
  const supabase = await createAdminClient();

  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const due_date = (formData.get("due_date") as string) || null;
  const status = (formData.get("status") as string) || "upcoming";
  const completed_date = status === "completed" ? new Date().toISOString().split("T")[0] : null;

  const { error } = await supabase
    .from("milestones")
    .update({ title, description, due_date, status, completed_date })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/projects");
  revalidatePath("/client");
  return { success: true };
}

export async function deleteMilestoneAction(id: string) {
  const supabase = await createAdminClient();

  const { error } = await supabase.from("milestones").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/projects");
  revalidatePath("/client");
  return { success: true };
}
