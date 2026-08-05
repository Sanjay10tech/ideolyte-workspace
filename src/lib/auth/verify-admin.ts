"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Verifies the current authenticated user is an admin.
 * Returns the user ID if admin, throws error otherwise.
 */
export async function verifyAdmin(): Promise<string> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Not authenticated");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    throw new Error(`Profile error: ${profileError.message}`);
  }

  if (!profile || (profile as { role: string }).role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }

  return user.id;
}
