"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export interface ProjectUpdateWithAuthor {
  id: string;
  project_id: string;
  author_id: string;
  title: string;
  content: string;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

export async function getProjectUpdates(projectId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_updates")
    .select("*, profiles(full_name)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as unknown as ProjectUpdateWithAuthor[];
}

export async function createProjectUpdateAction(formData: FormData) {
  const supabase = await createAdminClient();

  const project_id = formData.get("project_id") as string;
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("project_updates")
    .insert({ project_id, author_id: user.id, title, content });

  if (error) return { error: error.message };

  // Log activity
  await supabase.from("activity_logs").insert({
    user_id: user.id,
    action: "published_update",
    entity_type: "project",
    entity_id: project_id,
    metadata: { update_title: title },
  });

  revalidatePath("/admin/projects");
  revalidatePath("/client");
  return { success: true };
}
