"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface NotificationRow {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

export async function getNotifications() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select("id, title, message, type, read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) return [];
  return (data || []) as unknown as NotificationRow[];
}

export async function markNotificationRead(id: string) {
  const supabase = await createClient();
  await supabase.from("notifications").update({ read: true }).eq("id", id);
}

export async function markAllRead() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
  revalidatePath("/");
}
