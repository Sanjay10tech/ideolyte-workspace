"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth/verify-admin";

/**
 * Admin resets another user's password securely using Supabase Admin API.
 * Never stores plain-text passwords.
 */
export async function adminResetUserPassword(userId: string, newPassword: string): Promise<{ success?: boolean; error?: string }> {
  try {
    await verifyAdmin();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unauthorized" };
  }

  if (!newPassword || newPassword.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  const supabase = await createAdminClient();

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) {
    return { error: `Failed to reset password: ${error.message || JSON.stringify(error)}` };
  }

  return { success: true };
}
