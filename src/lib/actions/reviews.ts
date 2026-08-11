"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export interface ProjectReview {
  id: string;
  project_id: string;
  client_id: string;
  requested_by: string;
  status: string;
  message: string | null;
  deadline: string | null;
  checklist: string[];
  reviewed_at: string | null;
  reviewed_by: string | null;
  approval_comment: string | null;
  change_comment: string | null;
  change_priority: string | null;
  created_at: string;
  updated_at: string;
  projects?: { name: string; progress: number };
  clients?: { company: string; profiles: { full_name: string } };
}

export interface ReviewHistoryItem {
  id: string;
  action: string;
  performed_by: string;
  comment: string | null;
  created_at: string;
  profiles: { full_name: string };
}

// Admin: get all reviews
export async function getProjectReviews(status?: string): Promise<ProjectReview[]> {
  const supabase = await createClient();
  let query = supabase.from("project_reviews").select("*, projects(name, progress), clients(company, profiles(full_name))").order("created_at", { ascending: false });
  if (status && status !== "all") query = query.eq("status", status);
  const { data, error } = await query;
  if (error) { console.error("getProjectReviews:", error.message); return []; }
  return (data || []) as unknown as ProjectReview[];
}

// Admin: get review for a specific project
export async function getProjectReviewByProject(projectId: string): Promise<ProjectReview | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("project_reviews").select("*, projects(name, progress), clients(company, profiles(full_name))").eq("project_id", projectId).order("created_at", { ascending: false }).limit(1).single();
  return (data || null) as unknown as ProjectReview | null;
}

// Admin: request client review
export async function requestClientReview(input: {
  project_id: string;
  message: string;
  deadline?: string;
  checklist: string[];
}): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Get project's client_id
  const { data: project } = await supabase.from("projects").select("client_id, name").eq("id", input.project_id).single();
  if (!project) return { error: "Project not found" };

  const clientId = (project as { client_id: string; name: string }).client_id;
  const projectName = (project as { client_id: string; name: string }).name;

  // Create review
  const { data: review, error } = await supabase.from("project_reviews").insert({
    project_id: input.project_id,
    client_id: clientId,
    requested_by: user.id,
    status: "awaiting_client",
    message: input.message,
    deadline: input.deadline || null,
    checklist: input.checklist,
  }).select().single();

  if (error) return { error: error.message };

  // Log history
  await supabase.from("review_history").insert({
    review_id: (review as { id: string }).id,
    action: "review_requested",
    performed_by: user.id,
    comment: input.message,
  });

  // Notify client
  const { data: clientData } = await supabase.from("clients").select("profile_id").eq("id", clientId).single();
  if (clientData) {
    await supabase.from("notifications").insert({
      user_id: (clientData as { profile_id: string }).profile_id,
      title: "Project Ready for Review",
      message: `Your project "${projectName}" is ready for final review.`,
      type: "review",
      link: "/client/reviews",
    });
  }

  revalidatePath("/admin/projects");
  revalidatePath("/client");
  return { success: true };
}

// Client: get their reviews
export async function getClientReviews(): Promise<ProjectReview[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: client } = await supabase.from("clients").select("id").eq("profile_id", user.id).single();
  if (!client) return [];
  const { data } = await supabase.from("project_reviews").select("*, projects(name, progress)").eq("client_id", (client as { id: string }).id).order("created_at", { ascending: false });
  return (data || []) as unknown as ProjectReview[];
}

// Client: approve
export async function approveReview(reviewId: string, comment?: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("project_reviews").update({
    status: "approved",
    reviewed_at: new Date().toISOString(),
    reviewed_by: user.id,
    approval_comment: comment || null,
  }).eq("id", reviewId);

  if (error) return { error: error.message };

  // History
  const adminSupabase = await createAdminClient();
  await adminSupabase.from("review_history").insert({ review_id: reviewId, action: "approved", performed_by: user.id, comment });

  // Notify admin
  const { data: admins } = await adminSupabase.from("profiles").select("id").eq("role", "admin").limit(1);
  if (admins && admins.length > 0) {
    await adminSupabase.from("notifications").insert({ user_id: (admins[0] as { id: string }).id, title: "Project Approved", message: "A client has approved their project review.", type: "review", link: "/admin/projects" });
  }

  revalidatePath("/client/reviews");
  revalidatePath("/admin/projects");
  return { success: true };
}

// Client: request changes
export async function requestChanges(reviewId: string, comment: string, priority?: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("project_reviews").update({
    status: "changes_requested",
    reviewed_at: new Date().toISOString(),
    reviewed_by: user.id,
    change_comment: comment,
    change_priority: priority || "medium",
  }).eq("id", reviewId);

  if (error) return { error: error.message };

  const adminSupabase = await createAdminClient();
  await adminSupabase.from("review_history").insert({ review_id: reviewId, action: "changes_requested", performed_by: user.id, comment });

  const { data: admins } = await adminSupabase.from("profiles").select("id").eq("role", "admin").limit(1);
  if (admins && admins.length > 0) {
    await adminSupabase.from("notifications").insert({ user_id: (admins[0] as { id: string }).id, title: "Changes Requested", message: "A client has requested changes to their project.", type: "review", link: "/admin/projects" });
  }

  revalidatePath("/client/reviews");
  revalidatePath("/admin/projects");
  return { success: true };
}

// Admin: resubmit review
export async function resubmitReview(reviewId: string, message?: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("project_reviews").update({ status: "awaiting_client", message: message || null, change_comment: null }).eq("id", reviewId);
  if (error) return { error: error.message };

  await supabase.from("review_history").insert({ review_id: reviewId, action: "resubmitted", performed_by: user.id, comment: message });

  revalidatePath("/admin/projects");
  revalidatePath("/client/reviews");
  return { success: true };
}

// Get review history
export async function getReviewHistory(reviewId: string): Promise<ReviewHistoryItem[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("review_history").select("*, profiles:performed_by(full_name)").eq("review_id", reviewId).order("created_at", { ascending: true });
  return (data || []) as unknown as ReviewHistoryItem[];
}
