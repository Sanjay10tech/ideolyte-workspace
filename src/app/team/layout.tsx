"use client";

import { useState } from "react";
import { Menu, LogOut } from "lucide-react";
import { TeamSidebar } from "@/components/team/team-sidebar";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/shared/notification-bell";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useAuth } from "@/components/providers/auth-provider";
import { PageLoader } from "@/components/ui/loading-spinner";

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, loading, signOut } = useAuth();

  if (loading) return <PageLoader />;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <TeamSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-gray-100 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-500 hover:text-gray-700" aria-label="Open sidebar"><Menu className="h-5 w-5" /></button>
            <h2 className="text-sm font-medium text-gray-500 hidden sm:block">{profile?.full_name || "Team Member"}</h2>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />
            <Button variant="ghost" size="icon" onClick={signOut} title="Sign out"><LogOut className="h-4.5 w-4.5" /></Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
