"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export interface ProjectFile {
  id: string;
  project_id: string;
  uploaded_by: string;
  name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  category: string | null;
  created_at: string;
  projects: { name: string };
  profiles: { full_name: string };
}

export async function getProjectFiles(projectId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("project_files")
    .select("*, projects(name), profiles:uploaded_by(full_name)")
    .order("created_at", { ascending: false });

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as unknown as ProjectFile[];
}

export async function getClientFiles() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_files")
    .select("*, projects(name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as ProjectFile[];
}

export async function uploadFileAction(formData: FormData) {
  const supabase = await createAdminClient();

  const project_id = formData.get("project_id") as string;
  const file = formData.get("file") as File;
  const category = (formData.get("category") as string) || null;

  if (!file) return { error: "No file provided" };

  const currentUser = await supabase.auth.getUser();
  if (!currentUser.data.user) return { error: "Not authenticated" };

  // Upload to storage
  const filePath = `${project_id}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("project-files")
    .upload(filePath, file);

  if (uploadError) return { error: uploadError.message };

  // Get public URL
  const { data: urlData } = supabase.storage.from("project-files").getPublicUrl(filePath);

  // Create file record
  const { error: dbError } = await supabase.from("project_files").insert({
    project_id,
    uploaded_by: currentUser.data.user.id,
    name: file.name,
    file_url: urlData.publicUrl,
    file_size: file.size,
    file_type: file.type,
    category,
  });

  if (dbError) return { error: dbError.message };

  revalidatePath("/admin/documents");
  revalidatePath("/client/files");
  return { success: true };
}

export async function getSignedUrl(filePath: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("project-files")
    .createSignedUrl(filePath, 3600); // 1 hour
  if (error) return { error: error.message };
  return { url: data.signedUrl };
}

export async function deleteFileAction(fileId: string, filePath: string) {
  const supabase = await createAdminClient();

  await supabase.storage.from("project-files").remove([filePath]);
  const { error } = await supabase.from("project_files").delete().eq("id", fileId);
  if (error) return { error: error.message };

  revalidatePath("/admin/documents");
  revalidatePath("/client/files");
  return { success: true };
}

/**
 * Save file metadata only (file already uploaded from browser directly to Supabase Storage)
 */
export async function saveFileMetadata(input: {
  project_id: string;
  name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  category: string | null;
}): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("project_files").insert({
    project_id: input.project_id,
    uploaded_by: user.id,
    name: input.name,
    file_url: input.file_url,
    file_size: input.file_size,
    file_type: input.file_type,
    category: input.category,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/documents");
  revalidatePath("/client/files");
  return { success: true };
}
