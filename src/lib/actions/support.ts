"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export interface TicketRow {
  id: string;
  client_id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  clients: { company: string; profiles: { full_name: string } };
}

export async function getTickets() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("support_tickets")
    .select("*, clients(company, profiles(full_name))")
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data || []) as unknown as TicketRow[];
}

export async function getClientTickets() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: client } = await supabase.from("clients").select("id").eq("profile_id", user.id).single();
  if (!client) return [];
  const { data, error } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false });
  if (error) return [];
  return data || [];
}

export async function createTicketAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: client } = await supabase.from("clients").select("id").eq("profile_id", user.id).single();
  if (!client) return { error: "Client record not found" };

  const subject = formData.get("subject") as string;
  const description = formData.get("description") as string;
  const priority = (formData.get("priority") as string) || "medium";

  const { error } = await supabase.from("support_tickets").insert({ client_id: client.id, subject, description, priority, status: "open" });
  if (error) return { error: error.message };

  revalidatePath("/client/support");
  revalidatePath("/admin/support");
  return { success: true };
}

export async function updateTicketStatusAction(ticketId: string, status: string) {
  const supabase = await createAdminClient();
  const updates: Record<string, unknown> = { status };
  if (status === "resolved") updates.resolved_at = new Date().toISOString();
  const { error } = await supabase.from("support_tickets").update(updates).eq("id", ticketId);
  if (error) return { error: error.message };
  revalidatePath("/admin/support");
  revalidatePath("/client/support");
  return { success: true };
}
