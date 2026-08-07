"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Send, MessageSquare, Plus } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/skeleton";
import { Dialog, DialogHeader, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/components/providers/auth-provider";
import { getConversations, getMessages, getEligibleContacts, sendMessageAction, markMessagesRead, type MessageRow, type EligibleContact } from "@/lib/actions/messages";
import { formatDate } from "@/lib/utils";

export function MessagingPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<{ userId: string; name: string; lastMessage: string; timestamp: string; unread: number }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState("");
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [sending, setSending] = useState(false);
  const [newMsgOpen, setNewMsgOpen] = useState(false);
  const [contacts, setContacts] = useState<EligibleContact[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    const convs = await getConversations();
    setConversations(convs);
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const loadMessages = useCallback(async (userId: string, name?: string) => {
    setSelectedUserId(userId);
    if (name) setSelectedName(name);
    const msgs = await getMessages(userId);
    setMessages(msgs);
    await markMessagesRead(userId);
    loadConversations();
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [loadConversations]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!msgInput.trim() || !selectedUserId) return;
    setSending(true);
    const fd = new FormData();
    fd.set("receiver_id", selectedUserId);
    fd.set("content", msgInput);
    const result = await sendMessageAction(fd);
    setSending(false);
    if (result.error) { toast.error(result.error); return; }
    setMsgInput("");
    loadMessages(selectedUserId);
  }

  async function handleNewMessage() {
    const c = await getEligibleContacts();
    setContacts(c);
    setNewMsgOpen(true);
  }

  function selectContact(contact: EligibleContact) {
    setSelectedUserId(contact.userId);
    setSelectedName(contact.name);
    setNewMsgOpen(false);
    loadMessages(contact.userId, contact.name);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Messages" description="Project-based messaging">
        <Button size="sm" variant="outline" onClick={handleNewMessage}><Plus className="h-3.5 w-3.5 mr-1" /> New Message</Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardContent className="p-0">
            <div className="p-3 border-b border-slate-100">
              <p className="text-xs font-medium text-slate-500 uppercase px-1">Conversations</p>
            </div>
            <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-6 text-center"><p className="text-sm text-slate-400">No conversations yet</p><Button size="sm" variant="outline" className="mt-3 text-xs" onClick={handleNewMessage}>Start a conversation</Button></div>
              ) : conversations.map((conv) => (
                <div key={conv.userId} onClick={() => loadMessages(conv.userId, conv.name)}
                  className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-slate-50 transition-colors ${selectedUserId === conv.userId ? "bg-slate-50" : ""} ${conv.unread > 0 ? "bg-blue-50/30" : ""}`}>
                  <Avatar name={conv.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-900">{conv.name}</p>
                      {conv.unread > 0 && <span className="h-5 w-5 flex items-center justify-center rounded-full bg-blue-500 text-[10px] text-white">{conv.unread}</span>}
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{conv.lastMessage}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2 flex flex-col min-h-[500px]">
          {!selectedUserId ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState title="Select a conversation" description="Choose from the left or start a new message" icon={<MessageSquare className="h-8 w-8" />} />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 p-4 border-b border-slate-100">
                <Avatar name={selectedName} size="sm" />
                <p className="text-sm font-medium text-slate-900">{selectedName}</p>
              </div>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No messages yet. Send the first one!</p>}
                {messages.map((msg) => {
                  const isMe = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex gap-3 ${isMe ? "justify-end" : ""}`}>
                      {!isMe && <Avatar name={msg.sender?.full_name || ""} size="sm" />}
                      <div className={`max-w-[70%] rounded-lg px-4 py-2.5 ${isMe ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-800"}`}>
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-xs mt-1 ${isMe ? "text-blue-200" : "text-slate-400"}`}>{formatDate(msg.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </CardContent>
              <form onSubmit={handleSend} className="border-t border-slate-100 p-4">
                <div className="flex items-center gap-2">
                  <Input placeholder="Type a message..." value={msgInput} onChange={e => setMsgInput(e.target.value)} className="flex-1" disabled={sending} />
                  <Button size="icon" type="submit" disabled={sending || !msgInput.trim()}><Send className="h-4 w-4" /></Button>
                </div>
              </form>
            </>
          )}
        </Card>
      </div>

      {/* New Message Dialog */}
      <Dialog open={newMsgOpen} onClose={() => setNewMsgOpen(false)}>
        <DialogHeader onClose={() => setNewMsgOpen(false)}>New Message</DialogHeader>
        <DialogContent>
          {contacts.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No eligible contacts found.</p>
          ) : (
            <div className="space-y-1 max-h-[300px] overflow-y-auto">
              {contacts.map((c) => (
                <button key={c.userId} onClick={() => selectContact(c)} className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-slate-50 text-left transition-colors">
                  <Avatar name={c.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900">{c.name}</p>
                    {c.projectName && <p className="text-xs text-slate-400">{c.projectName}</p>}
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{c.role}</Badge>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
