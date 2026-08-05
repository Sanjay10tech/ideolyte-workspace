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

export async function getMessages(otherUserId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("messages")
    .select("*, sender:sender_id(full_name), receiver:receiver_id(full_name)")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: true });

  if (otherUserId) {
    query = supabase
      .from("messages")
      .select("*, sender:sender_id(full_name), receiver:receiver_id(full_name)")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true });
  }

  const { data, error } = await query;
  if (error) return [];
  return (data || []) as unknown as MessageRow[];
}

export async function getConversations() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("messages")
    .select("*, sender:sender_id(full_name), receiver:receiver_id(full_name)")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (!data) return [];

  // Group by other user
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

  const { error } = await supabase.from("messages").insert({ sender_id: user.id, receiver_id, content, project_id });
  if (error) return { error: error.message };

  // Create notification
  const adminSupabase = await createAdminClient();
  await adminSupabase.from("notifications").insert({ user_id: receiver_id, title: "New Message", message: `You have a new message`, type: "message", link: "/messages" });

  revalidatePath("/admin/messages");
  revalidatePath("/client/messages");
  return { success: true };
}

export async function markMessagesRead(senderId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("messages").update({ read: true }).eq("sender_id", senderId).eq("receiver_id", user.id).eq("read", false);
}
