"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Send, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers/auth-provider";
import { getMessages, sendMessageAction, markMessagesRead, type MessageRow } from "@/lib/actions/messages";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";

export default function TeamMessagesPage() {
  const { user } = useAuth();
  const [adminId, setAdminId] = useState<string | null>(null);
  const [adminName, setAdminName] = useState("Admin");
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: admins } = await supabase.from("profiles").select("id, full_name").eq("role", "admin").limit(1);
    if (admins && admins.length > 0) {
      const admin = admins[0] as { id: string; full_name: string };
      setAdminId(admin.id); setAdminName(admin.full_name);
      const msgs = await getMessages(admin.id);
      setMessages(msgs);
      await markMessagesRead(admin.id);
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!msgInput.trim() || !adminId) return;
    setSending(true);
    const fd = new FormData(); fd.set("receiver_id", adminId); fd.set("content", msgInput);
    const result = await sendMessageAction(fd);
    setSending(false);
    if (result.error) { toast.error(result.error); return; }
    setMsgInput(""); load();
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Messages" description="Chat with your team lead" />
      <Card className="flex flex-col h-[calc(100vh-240px)] min-h-[400px]">
        <div className="flex items-center gap-3 p-4 border-b border-gray-100">
          <Avatar name={adminName} size="sm" />
          <div><p className="text-sm font-medium text-gray-900">{adminName}</p><p className="text-xs text-gray-500">Project Lead</p></div>
        </div>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? <EmptyState title="No messages" description="Send a message to start" icon={<MessageSquare className="h-8 w-8" />} /> : messages.map(msg => {
            const isMe = msg.sender_id === user?.id;
            return (<div key={msg.id} className={`flex gap-3 ${isMe ? "justify-end" : ""}`}>
              {!isMe && <Avatar name={msg.sender?.full_name || ""} size="sm" />}
              <div className={`max-w-[70%] rounded-lg px-4 py-2.5 ${isMe ? "bg-[#1e293b] text-white" : "bg-gray-100 text-gray-800"}`}>
                <p className="text-sm">{msg.content}</p>
                <p className={`text-xs mt-1 ${isMe ? "text-gray-300" : "text-gray-400"}`}>{formatDate(msg.created_at)}</p>
              </div>
            </div>);
          })}
          <div ref={chatEndRef} />
        </CardContent>
        <form onSubmit={handleSend} className="border-t border-gray-100 p-4"><div className="flex items-center gap-2"><Input placeholder="Type a message..." value={msgInput} onChange={e => setMsgInput(e.target.value)} className="flex-1" disabled={sending || !adminId} /><Button size="icon" type="submit" disabled={sending || !msgInput.trim()}><Send className="h-4 w-4" /></Button></div></form>
      </Card>
    </div>
  );
}
