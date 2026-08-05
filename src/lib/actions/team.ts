"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth/verify-admin";

export interface TeamMemberWithProfile {
  id: string;
  profile_id: string;
  job_role: string;
  status: string;
  created_at: string;
  updated_at: string;
  profiles: { id: string; full_name: string; email: string; phone: string | null; avatar_url: string | null };
}

export interface ProjectMemberRow {
  id: string;
  project_id: string;
  team_member_id: string;
  role_in_project: string;
  assigned_at: string;
  team_members: { id: string; job_role: string; profiles: { full_name: string; avatar_url: string | null } };
}

export async function getTeamMembers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("team_members")
    .select("*, profiles(id, full_name, email, phone, avatar_url)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as unknown as TeamMemberWithProfile[];
}

export async function getTeamMemberById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("team_members")
    .select("*, profiles(id, full_name, email, phone, avatar_url)")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data as unknown as TeamMemberWithProfile;
}

// Accept plain object instead of FormData to avoid serialization issues
export async function createTeamMemberAction(input: {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
  phone: string;
  job_role: string;
}): Promise<{ success?: boolean; error?: string }> {
  // Verify caller is admin
  try {
    await verifyAdmin();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized: Admin access required" };
  }

  // Validate input
  if (!input.full_name || !input.email || !input.password) {
    return { error: "Full name, email, and password are required" };
  }
  if (input.password !== input.confirm_password) {
    return { error: "Passwords do not match" };
  }
  if (input.password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  let supabase;
  try {
    supabase = await createAdminClient();
  } catch (e) {
    return { error: `Server config error: ${e instanceof Error ? e.message : "Cannot create admin client"}` };
  }

  // Step 1: Create Supabase Auth user (no role in metadata to avoid trigger enum cast)
  let userId: string;
  try {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: input.full_name },
    });

    if (authError) {
      const msg = authError.message || authError.name || (typeof authError === "object" ? JSON.stringify(authError) : String(authError));
      console.error("Supabase Auth Admin createUser error:", authError);
      return { error: `Auth error: ${msg}` };
    }
    if (!authData?.user) {
      return { error: "Auth error: User was not created" };
    }
    userId = authData.user.id;
  } catch (e) {
    console.error("Auth exception:", e);
    return { error: `Auth exception: ${e instanceof Error ? e.message : JSON.stringify(e)}` };
  }

  // Step 2: Upsert profile — trigger creates with 'client' default, we override to 'team_member'
  try {
    // Wait briefly for trigger to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    const { error: profError } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        email: input.email,
        full_name: input.full_name,
        phone: input.phone || null,
        role: "team_member",
      }, { onConflict: "id" });

    if (profError) {
      return { error: `Profile failed: ${profError.message}` };
    }
  } catch (e) {
    return { error: `Profile exception: ${e instanceof Error ? e.message : String(e)}` };
  }

  // Step 3: Create team_members record
  try {
    const { error: tmError } = await supabase
      .from("team_members")
      .insert({ profile_id: userId, job_role: input.job_role, status: "active" });

    if (tmError) {
      return { error: `Team member insert failed: ${tmError.message}` };
    }
  } catch (e) {
    return { error: `Team member exception: ${e instanceof Error ? e.message : String(e)}` };
  }

  revalidatePath("/admin/team");
  return { success: true };
}

export async function updateTeamMemberAction(teamMemberId: string, input: {
  full_name: string;
  phone: string;
  job_role: string;
  status: string;
}): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createAdminClient();

  const { data: tm } = await supabase.from("team_members").select("profile_id").eq("id", teamMemberId).single();
  if (!tm) return { error: "Team member not found" };

  await supabase.from("profiles").update({ full_name: input.full_name, phone: input.phone || null }).eq("id", (tm as { profile_id: string }).profile_id);
  const { error } = await supabase.from("team_members").update({ job_role: input.job_role, status: input.status }).eq("id", teamMemberId);
  if (error) return { error: error.message };

  revalidatePath("/admin/team");
  return { success: true };
}

export async function toggleTeamMemberStatus(id: string, newStatus: string): Promise<{ success?: boolean; error?: string }> {
  try { await verifyAdmin(); } catch (e) { return { error: e instanceof Error ? e.message : "Unauthorized" }; }
  const supabase = await createAdminClient();
  const { error } = await supabase.from("team_members").update({ status: newStatus }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/team");
  return { success: true };
}

export async function sendPasswordReset(email: string): Promise<{ success?: boolean; error?: string }> {
  try { await verifyAdmin(); } catch (e) { return { error: e instanceof Error ? e.message : "Unauthorized" }; }
  const supabase = await createAdminClient();
  const { error } = await supabase.auth.admin.generateLink({ type: "recovery", email });
  if (error) return { error: error.message };
  return { success: true };
}

// ─── Project Assignment ───

export async function getProjectMembers(projectId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_members")
    .select("*, team_members(id, job_role, profiles(full_name, avatar_url))")
    .eq("project_id", projectId);
  if (error) return [];
  return (data || []) as unknown as ProjectMemberRow[];
}

export interface ProjectTeamMemberForAssignment {
  profile_id: string;
  full_name: string;
  job_role: string;
}

export async function getProjectTeamForTaskAssignment(projectId: string): Promise<ProjectTeamMemberForAssignment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_members")
    .select("team_members(profile_id, job_role, profiles(full_name))")
    .eq("project_id", projectId);
  if (error || !data) return [];
  return (data as unknown as { team_members: { profile_id: string; job_role: string; profiles: { full_name: string } } }[]).map(d => ({
    profile_id: d.team_members.profile_id,
    full_name: d.team_members.profiles.full_name,
    job_role: d.team_members.job_role,
  }));
}

export async function assignTeamMemberToProject(projectId: string, teamMemberId: string, roleInProject?: string) {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("project_members")
    .insert({ project_id: projectId, team_member_id: teamMemberId, role_in_project: roleInProject || "Member" });
  if (error) return { error: error.message };

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("activity_logs").insert({ user_id: user.id, action: "assigned_team_member", entity_type: "project", entity_id: projectId, metadata: { team_member_id: teamMemberId } });
  }

  revalidatePath("/admin/projects");
  revalidatePath("/team");
  return { success: true };
}

export async function removeTeamMemberFromProject(projectId: string, teamMemberId: string) {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("team_member_id", teamMemberId);
  if (error) return { error: error.message };
  revalidatePath("/admin/projects");
  revalidatePath("/team");
  return { success: true };
}

// ─── Team member's own data ───

export async function getMyTeamProjects() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: tm } = await supabase.from("team_members").select("id").eq("profile_id", user.id).single();
  if (!tm) return [];

  const { data } = await supabase
    .from("project_members")
    .select("role_in_project, projects(id, name, status, progress, deadline, description)")
    .eq("team_member_id", (tm as { id: string }).id);

  return (data || []).map((d: { role_in_project: string; projects: unknown }) => ({ ...d.projects as Record<string, unknown>, role_in_project: d.role_in_project }));
}

export async function getMyTasks() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("tasks")
    .select("*, projects(name)")
    .eq("assignee_id", user.id)
    .order("created_at", { ascending: false });
  if (error) return [];
  return data || [];
}

export async function updateMyTaskStatus(taskId: string, status: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const updates: Record<string, unknown> = { status };
  if (status === "completed") updates.completed_at = new Date().toISOString();

  const { error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", taskId)
    .eq("assignee_id", user.id);

  if (error) return { error: error.message };

  await supabase.from("activity_logs").insert({ user_id: user.id, action: status === "completed" ? "completed_task" : "updated_task_status", entity_type: "task", entity_id: taskId, metadata: { status } });

  revalidatePath("/team");
  revalidatePath("/admin");
  return { success: true };
}
