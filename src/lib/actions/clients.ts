"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth/verify-admin";

export interface ClientWithProfile {
  id: string;
  profile_id: string;
  company: string;
  website: string | null;
  address: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  profiles: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
  };
  project_count?: number;
}

export async function getClients(search?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("clients")
    .select("*, profiles(id, full_name, email, phone, avatar_url)")
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(
      `company.ilike.%${search}%,profiles.full_name.ilike.%${search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as unknown as ClientWithProfile[];
}

export async function getClientById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*, profiles(id, full_name, email, phone, avatar_url)")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as unknown as ClientWithProfile;
}

export async function createClientAction(formData: FormData) {
  // Verify caller is admin
  try { await verifyAdmin(); } catch (e) { return { error: e instanceof Error ? e.message : "Unauthorized" }; }

  const supabase = await createAdminClient();

  const fullName = formData.get("full_name") as string;
  const email = formData.get("email") as string;
  const phone = (formData.get("phone") as string) || null;
  const company = formData.get("company") as string;
  const address = (formData.get("address") as string) || null;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirm_password") as string;

  // Validate passwords match
  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: "client" },
  });

  if (authError) {
    return { error: authError.message };
  }

  const userId = authData.user.id;

  // 2. Update profile with phone & company
  await supabase
    .from("profiles")
    .update({ phone, company })
    .eq("id", userId);

  // 3. Create client record
  const { error: clientError } = await supabase
    .from("clients")
    .insert({
      profile_id: userId,
      company,
      address,
      status: "active",
    });

  if (clientError) {
    return { error: clientError.message };
  }

  // 4. Log activity
  const currentUser = await supabase.auth.getUser();
  if (currentUser.data.user) {
    await supabase.from("activity_logs").insert({
      user_id: currentUser.data.user.id,
      action: "created",
      entity_type: "client",
      entity_id: userId,
      metadata: { client_name: fullName, company },
    });
  }

  revalidatePath("/admin/clients");
  return { success: true };
}

export async function updateClientAction(clientId: string, formData: FormData) {
  try { await verifyAdmin(); } catch (e) { return { error: e instanceof Error ? e.message : "Unauthorized" }; }
  const supabase = await createAdminClient();

  const fullName = formData.get("full_name") as string;
  const phone = (formData.get("phone") as string) || null;
  const company = formData.get("company") as string;
  const address = (formData.get("address") as string) || null;
  const status = formData.get("status") as string;

  // Get profile_id from client
  const { data: client } = await supabase
    .from("clients")
    .select("profile_id")
    .eq("id", clientId)
    .single();

  if (!client) return { error: "Client not found" };

  // Update profile
  await supabase
    .from("profiles")
    .update({ full_name: fullName, phone, company })
    .eq("id", client.profile_id);

  // Update client
  const { error } = await supabase
    .from("clients")
    .update({ company, address, status })
    .eq("id", clientId);

  if (error) return { error: error.message };

  revalidatePath("/admin/clients");
  return { success: true };
}

export async function toggleClientStatus(clientId: string, newStatus: string) {
  try { await verifyAdmin(); } catch (e) { return { error: e instanceof Error ? e.message : "Unauthorized" }; }
  const supabase = await createAdminClient();

  const { error } = await supabase
    .from("clients")
    .update({ status: newStatus })
    .eq("id", clientId);

  if (error) return { error: error.message };

  revalidatePath("/admin/clients");
  return { success: true };
}

export async function sendClientPasswordReset(email: string) {
  try { await verifyAdmin(); } catch (e) { return { error: e instanceof Error ? e.message : "Unauthorized" }; }
  const supabase = await createAdminClient();
  const { error } = await supabase.auth.admin.generateLink({ type: "recovery", email });
  if (error) return { error: error.message };
  return { success: true };
}
