"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export interface AgreementWithClient {
  id: string;
  client_id: string;
  project_id: string | null;
  title: string;
  agreement_number: string | null;
  amount: number | null;
  content: string | null;
  status: string;
  signed_date: string | null;
  expiry_date: string | null;
  start_date: string | null;
  file_url: string | null;
  accepted_at: string | null;
  accepted_by: string | null;
  scope_of_work: string | null;
  deliverables: string | null;
  timeline: string | null;
  payment_terms: string | null;
  revision_policy: string | null;
  support_terms: string | null;
  cancellation_terms: string | null;
  additional_terms: string | null;
  client_responsibilities: string | null;
  created_at: string;
  updated_at: string;
  clients: { company: string; profiles: { full_name: string; email: string } };
  projects?: { name: string } | null;
}

export async function getAgreements(status?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("agreements")
    .select("*, clients(company, profiles(full_name, email)), projects(name)")
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as unknown as AgreementWithClient[];
}

export async function getAgreementById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agreements")
    .select("*, clients(company, profiles(full_name, email, phone, company)), projects(name)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as unknown as AgreementWithClient;
}

export async function getClientAgreements() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("profile_id", user.id)
    .single();
  if (!client) return [];

  const { data, error } = await supabase
    .from("agreements")
    .select("*, projects(name)")
    .eq("client_id", (client as { id: string }).id)
    .in("status", ["sent", "active", "accepted"])
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as AgreementWithClient[];
}

export async function createAgreementAction(input: {
  client_id: string;
  project_id?: string;
  title: string;
  agreement_number: string;
  amount?: number;
  start_date?: string;
  expiry_date?: string;
  scope_of_work: string;
  deliverables: string;
  payment_terms: string;
  revision_policy?: string;
  support_terms?: string;
  client_responsibilities?: string;
  cancellation_terms?: string;
  additional_terms?: string;
  send?: boolean;
}): Promise<{ success?: boolean; error?: string; id?: string }> {
  const supabase = await createAdminClient();

  const payload = {
    client_id: input.client_id,
    project_id: input.project_id || null,
    title: input.title,
    agreement_number: input.agreement_number,
    amount: input.amount || null,
    start_date: input.start_date || null,
    expiry_date: input.expiry_date || null,
    scope_of_work: input.scope_of_work,
    deliverables: input.deliverables,
    payment_terms: input.payment_terms,
    revision_policy: input.revision_policy || null,
    support_terms: input.support_terms || null,
    client_responsibilities: input.client_responsibilities || null,
    cancellation_terms: input.cancellation_terms || null,
    additional_terms: input.additional_terms || null,
    status: input.send ? "sent" : "draft",
    signed_date: input.send ? new Date().toISOString().split("T")[0] : null,
  };

  const { data, error } = await supabase.from("agreements").insert(payload).select().single();
  if (error) return { error: error.message };

  // If sending, notify client
  if (input.send) {
    const { data: clientData } = await supabase.from("clients").select("profile_id").eq("id", input.client_id).single();
    if (clientData) {
      await supabase.from("notifications").insert({
        user_id: (clientData as { profile_id: string }).profile_id,
        title: "New Agreement",
        message: `A new agreement "${input.title}" has been sent for your review.`,
        type: "agreement",
        link: "/client/agreement",
      });
    }
  }

  revalidatePath("/admin/agreements");
  revalidatePath("/client/agreement");
  return { success: true, id: (data as { id: string }).id };
}

export async function sendAgreementToClient(id: string) {
  const supabase = await createAdminClient();

  const { data: agreement } = await supabase.from("agreements").select("client_id, title").eq("id", id).single();
  if (!agreement) return { error: "Agreement not found" };

  const { error } = await supabase.from("agreements").update({ status: "sent", signed_date: new Date().toISOString().split("T")[0] }).eq("id", id);
  if (error) return { error: error.message };

  // Notify client
  const agr = agreement as { client_id: string; title: string };
  const { data: clientData } = await supabase.from("clients").select("profile_id").eq("id", agr.client_id).single();
  if (clientData) {
    await supabase.from("notifications").insert({
      user_id: (clientData as { profile_id: string }).profile_id,
      title: "New Agreement",
      message: `Agreement "${agr.title}" is ready for your review.`,
      type: "agreement",
      link: "/client/agreement",
    });
  }

  revalidatePath("/admin/agreements");
  revalidatePath("/client/agreement");
  return { success: true };
}

export async function acceptAgreementAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("agreements")
    .update({ accepted_at: new Date().toISOString(), accepted_by: user.id, status: "accepted" })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/client/agreement");
  revalidatePath("/admin/agreements");
  return { success: true };
}
