"use client";

import { useState } from "react";
import { Menu, LogOut } from "lucide-react";
import { ClientSidebar } from "@/components/client/client-sidebar";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/shared/notification-bell";
import { useAuth } from "@/components/providers/auth-provider";
import { PageLoader } from "@/components/ui/loading-spinner";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, loading, signOut } = useAuth();

  if (loading) return <PageLoader />;

  return (
    <div className="flex h-screen overflow-hidden">
      <ClientSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-slate-200/60 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-slate-400 hover:text-slate-700" aria-label="Open sidebar"><Menu className="h-5 w-5" /></button>
            <h2 className="text-[13px] font-medium text-slate-500 hidden sm:block">{profile?.company || profile?.full_name || "Client"}</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <NotificationBell />
            <Button variant="ghost" size="icon" onClick={signOut} title="Sign out" className="text-slate-400 hover:text-slate-600 hover:bg-slate-50"><LogOut className="h-4 w-4" /></Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#f7f8fc]">{children}</main>
      </div>
    </div>
  );
}
