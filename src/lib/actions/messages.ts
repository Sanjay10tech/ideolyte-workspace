"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export interface MessageRow {
  id: string;
  project_id: string | null;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
  sender: { full_name: string };
  receiver: { full_name: string };
}

export interface EligibleContact {
  userId: string;
  name: string;
  role: string;
  projectName?: string;
}

/**
 * Get eligible contacts for the current user based on project assignments.
 * ADMIN: can message anyone
 * CLIENT: can message admin + team members assigned to their projects
 * TEAM_MEMBER: can message admin + clients of assigned projects + team on same projects
 */
export async function getEligibleContacts(): Promise<EligibleContact[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile) return [];
  const role = (profile as { role: string }).role;

  const contacts: EligibleContact[] = [];
  const seen = new Set<string>();

  if (role === "admin") {
    // Admin can message everyone
    const { data: allProfiles } = await supabase.from("profiles").select("id, full_name, role").neq("id", user.id);
    for (const p of (allProfiles || []) as { id: string; full_name: string; role: string }[]) {
      if (!seen.has(p.id)) { seen.add(p.id); contacts.push({ userId: p.id, name: p.full_name, role: p.role === "team_member" ? "Team" : p.role === "client" ? "Client" : "Admin" }); }
    }
  } else if (role === "client") {
    // Client: admin + team members on their projects (single query batch)
    const { data: admins } = await supabase.from("profiles").select("id, full_name").eq("role", "admin").limit(5);
    for (const a of (admins || []) as { id: string; full_name: string }[]) {
      if (!seen.has(a.id)) { seen.add(a.id); contacts.push({ userId: a.id, name: a.full_name, role: "Admin" }); }
    }
    const { data: clientRec } = await supabase.from("clients").select("id").eq("profile_id", user.id).single();
    if (clientRec) {
      // Get all project members across all client's projects in one query
      const { data: projects } = await supabase.from("projects").select("id, name").eq("client_id", (clientRec as { id: string }).id);
      const projectIds = (projects || []).map((p: { id: string }) => p.id);
      if (projectIds.length > 0) {
        const { data: members } = await supabase.from("project_members").select("project_id, team_members(profile_id, profiles(full_name))").in("project_id", projectIds);
        const projMap = new Map((projects as { id: string; name: string }[]).map(p => [p.id, p.name]));
        for (const m of (members || []) as unknown as { project_id: string; team_members: { profile_id: string; profiles: { full_name: string } } }[]) {
          const pid = m.team_members.profile_id;
          if (!seen.has(pid)) { seen.add(pid); contacts.push({ userId: pid, name: m.team_members.profiles.full_name, role: "Team", projectName: projMap.get(m.project_id) }); }
        }
      }
    }
  } else if (role === "team_member") {
    // Team member: admin + clients of assigned projects + team on same projects
    const { data: admins } = await supabase.from("profiles").select("id, full_name").eq("role", "admin").limit(5);
    for (const a of (admins || []) as { id: string; full_name: string }[]) {
      if (!seen.has(a.id)) { seen.add(a.id); contacts.push({ userId: a.id, name: a.full_name, role: "Admin" }); }
    }
    // Get assigned projects with clients and all members in one query
    const { data: tm } = await supabase.from("team_members").select("id").eq("profile_id", user.id).single();
    if (tm) {
      const tmId = (tm as { id: string }).id;
      // Get all my assignments with project+client info
      const { data: assignments } = await supabase
        .from("project_members")
        .select("project_id, projects(name, clients(profile_id, profiles(full_name)))")
        .eq("team_member_id", tmId);

      const myProjectIds = (assignments || []).map((a: { project_id: string }) => a.project_id);

      // Add clients from assigned projects
      for (const a of (assignments || []) as unknown as { project_id: string; projects: { name: string; clients: { profile_id: string; profiles: { full_name: string } } } }[]) {
        const cpid = a.projects.clients.profile_id;
        if (!seen.has(cpid)) { seen.add(cpid); contacts.push({ userId: cpid, name: a.projects.clients.profiles.full_name, role: "Client", projectName: a.projects.name }); }
      }

      // Get all team members on all my projects in ONE query
      if (myProjectIds.length > 0) {
        const { data: allMembers } = await supabase
          .from("project_members")
          .select("project_id, team_members(profile_id, profiles(full_name))")
          .in("project_id", myProjectIds)
          .neq("team_member_id", tmId);

        for (const om of (allMembers || []) as unknown as { project_id: string; team_members: { profile_id: string; profiles: { full_name: string } } }[]) {
          const opid = om.team_members.profile_id;
          if (!seen.has(opid)) { seen.add(opid); contacts.push({ userId: opid, name: om.team_members.profiles.full_name, role: "Team" }); }
        }
      }
    }
  }

  return contacts;
}

export async function getMessages(otherUserId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("messages")
    .select("id, sender_id, receiver_id, content, read, created_at, sender:sender_id(full_name), receiver:receiver_id(full_name)")
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) return [];
  return (data || []) as unknown as MessageRow[];
}

export async function getConversations() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("messages")
    .select("id, sender_id, receiver_id, content, read, created_at, sender:sender_id(full_name), receiver:receiver_id(full_name)")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(100);

  if (!data) return [];

  const convMap = new Map<string, { userId: string; name: string; lastMessage: string; timestamp: string; unread: number }>();
  for (const msg of data as unknown as MessageRow[]) {
    const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
    const otherName = msg.sender_id === user.id ? msg.receiver?.full_name : msg.sender?.full_name;
    if (!convMap.has(otherId)) {
      convMap.set(otherId, { userId: otherId, name: otherName || "User", lastMessage: msg.content, timestamp: msg.created_at, unread: 0 });
    }
    if (!msg.read && msg.receiver_id === user.id) {
      const c = convMap.get(otherId)!;
      c.unread++;
    }
  }
  return Array.from(convMap.values());
}

export async function sendMessageAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const receiver_id = formData.get("receiver_id") as string;
  const content = formData.get("content") as string;
  const project_id = (formData.get("project_id") as string) || null;

  if (!content?.trim()) return { error: "Message cannot be empty" };

  const { error } = await supabase.from("messages").insert({ sender_id: user.id, receiver_id, content, project_id });
  if (error) return { error: error.message };

  // Notification
  const adminSupabase = await createAdminClient();
  await adminSupabase.from("notifications").insert({ user_id: receiver_id, title: "New Message", message: "You have a new message", type: "message", link: "/messages" });

  revalidatePath("/admin/messages");
  revalidatePath("/client/messages");
  revalidatePath("/team/messages");
  return { success: true };
}

export async function markMessagesRead(senderId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("messages").update({ read: true }).eq("sender_id", senderId).eq("receiver_id", user.id).eq("read", false);
}
