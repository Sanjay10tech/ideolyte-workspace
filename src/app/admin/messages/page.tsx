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
import { getConversations, getMessages, sendMessageAction, markMessagesRead, type MessageRow } from "@/lib/actions/messages";
import { getClients, type ClientWithProfile } from "@/lib/actions/clients";
import { formatDate } from "@/lib/utils";

export default function AdminMessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<{ userId: string; name: string; lastMessage: string; timestamp: string; unread: number }[]>([]);
  const [clients, setClients] = useState<ClientWithProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    const [convs, cls] = await Promise.all([getConversations(), getClients()]);
    setConversations(convs);
    setClients(cls);
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const loadMessages = useCallback(async (userId: string) => {
    setSelectedUserId(userId);
    const msgs = await getMessages(userId);
    setMessages(msgs);
    await markMessagesRead(userId);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!msgInput.trim() || !selectedUserId) return;
    setSending(true);
    const formData = new FormData();
    formData.set("receiver_id", selectedUserId);
    formData.set("content", msgInput);
    const result = await sendMessageAction(formData);
    setSending(false);
    if (result.error) { toast.error(result.error); return; }
    setMsgInput("");
    loadMessages(selectedUserId);
    loadConversations();
  }

  const selectedName = conversations.find(c => c.userId === selectedUserId)?.name || clients.find(c => c.profile_id === selectedUserId)?.profiles.full_name || "";

  // Get all client profile IDs for starting new conversations
  const allClientProfiles = clients.map(c => ({ id: c.profile_id, name: c.profiles.full_name }));
  const existingIds = new Set(conversations.map(c => c.userId));
  const newContacts = allClientProfiles.filter(p => !existingIds.has(p.id));

  return (
    <div className="space-y-6">
      <PageHeader title="Messages" description="Client communications" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardContent className="p-0">
            <div className="p-3 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase px-1">Conversations</p>
            </div>
            <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
              {conversations.map((conv) => (
                <div key={conv.userId} onClick={() => loadMessages(conv.userId)}
                  className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedUserId === conv.userId ? "bg-gray-50" : ""} ${conv.unread > 0 ? "bg-blue-50/30" : ""}`}>
                  <Avatar name={conv.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{conv.name}</p>
                      {conv.unread > 0 && <span className="h-5 w-5 flex items-center justify-center rounded-full bg-blue-500 text-[10px] text-white">{conv.unread}</span>}
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{conv.lastMessage}</p>
                  </div>
                </div>
              ))}
              {newContacts.length > 0 && (
                <div className="p-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-2">Start new conversation:</p>
                  {newContacts.map(c => (
                    <button key={c.id} onClick={() => loadMessages(c.id)} className="block text-sm text-[#1e293b] hover:underline py-1">{c.name}</button>
                  ))}
                </div>
              )}
              {conversations.length === 0 && newContacts.length === 0 && (
                <div className="p-6"><EmptyState title="No conversations" description="Messages will appear once you have clients" icon={<MessageSquare className="h-8 w-8" />} /></div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2 flex flex-col min-h-[500px]">
          {!selectedUserId ? (
            <div className="flex-1 flex items-center justify-center"><p className="text-sm text-gray-400">Select a conversation</p></div>
          ) : (
            <>
              <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                <Avatar name={selectedName} size="sm" />
                <p className="text-sm font-medium text-gray-900">{selectedName}</p>
              </div>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No messages yet. Send the first one!</p>}
                {messages.map((msg) => {
                  const isMe = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex gap-3 ${isMe ? "justify-end" : ""}`}>
                      {!isMe && <Avatar name={msg.sender?.full_name || ""} size="sm" />}
                      <div className={`max-w-[70%] rounded-lg px-4 py-2.5 ${isMe ? "bg-[#1e293b] text-white" : "bg-gray-100 text-gray-800"}`}>
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-xs mt-1 ${isMe ? "text-gray-300" : "text-gray-400"}`}>{formatDate(msg.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </CardContent>
              <form onSubmit={handleSend} className="border-t border-gray-100 p-4">
                <div className="flex items-center gap-2">
                  <Input placeholder="Type a message..." value={msgInput} onChange={e => setMsgInput(e.target.value)} className="flex-1" disabled={sending} />
                  <Button size="icon" type="submit" disabled={sending || !msgInput.trim()}><Send className="h-4 w-4" /></Button>
                </div>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
