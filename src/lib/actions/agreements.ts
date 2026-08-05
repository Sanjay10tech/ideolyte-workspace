"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export interface AgreementWithClient {
  id: string;
  client_id: string;
  title: string;
  content: string | null;
  status: string;
  signed_date: string | null;
  expiry_date: string | null;
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
  created_at: string;
  updated_at: string;
  clients: { company: string; profiles: { full_name: string; email: string } };
}

export async function getAgreements() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agreements")
    .select("*, clients(company, profiles(full_name, email))")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as AgreementWithClient[];
}

export async function getAgreementById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agreements")
    .select("*, clients(company, profiles(full_name, email, phone, company))")
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
    .select("*")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as AgreementWithClient[];
}

export async function createAgreementAction(formData: FormData) {
  const supabase = await createAdminClient();

  const payload = {
    client_id: formData.get("client_id") as string,
    title: formData.get("title") as string,
    content: (formData.get("content") as string) || null,
    scope_of_work: (formData.get("scope_of_work") as string) || null,
    deliverables: (formData.get("deliverables") as string) || null,
    timeline: (formData.get("timeline") as string) || null,
    payment_terms: (formData.get("payment_terms") as string) || null,
    revision_policy: (formData.get("revision_policy") as string) || null,
    support_terms: (formData.get("support_terms") as string) || null,
    cancellation_terms: (formData.get("cancellation_terms") as string) || null,
    additional_terms: (formData.get("additional_terms") as string) || null,
    expiry_date: (formData.get("expiry_date") as string) || null,
    status: "draft",
  };

  const { data, error } = await supabase.from("agreements").insert(payload).select().single();
  if (error) return { error: error.message };

  revalidatePath("/admin/agreements");
  return { success: true, id: data.id };
}

export async function publishAgreement(id: string) {
  const supabase = await createAdminClient();
  const { error } = await supabase.from("agreements").update({ status: "active", signed_date: new Date().toISOString().split("T")[0] }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/agreements");
  revalidatePath("/client");
  return { success: true };
}

export async function acceptAgreementAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("agreements")
    .update({ accepted_at: new Date().toISOString(), accepted_by: user.id })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/client/agreement");
  return { success: true };
}
