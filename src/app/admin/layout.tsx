"use client";

import { useState } from "react";
import { Menu, Search, LogOut } from "lucide-react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/shared/notification-bell";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useAuth } from "@/components/providers/auth-provider";
import { PageLoader } from "@/components/ui/loading-spinner";
import { getInitials } from "@/lib/utils";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, loading, signOut } = useAuth();

  if (loading) return <PageLoader />;

  const initials = profile?.full_name ? getInitials(profile.full_name) : "AD";

  return (
    <div className="flex h-screen bg-[#f6f8fc] overflow-hidden">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b border-slate-100 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-slate-400 hover:text-slate-700" aria-label="Open sidebar"><Menu className="h-5 w-5" /></button>
            <div className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <input type="text" placeholder="Search anything..." className="bg-transparent text-[13px] outline-none w-52 placeholder:text-slate-400 text-slate-700" />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <NotificationBell />
            <Button variant="ghost" size="icon" onClick={signOut} title="Sign out" className="text-slate-400 hover:text-slate-600 hover:bg-slate-50"><LogOut className="h-4 w-4" /></Button>
            <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-[11px] font-semibold ml-1">{initials}</div>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
