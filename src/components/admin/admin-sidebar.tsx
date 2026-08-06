"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Users2, FolderKanban, CheckSquare, FileText, FileSignature, Receipt, CreditCard, MessageSquare, HelpCircle, Settings, X } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { BrandLogo } from "@/components/shared/brand-logo";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/team", label: "Team", icon: Users2 },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/admin/documents", label: "Documents", icon: FileText },
  { href: "/admin/agreements", label: "Agreements", icon: FileSignature },
  { href: "/admin/invoices", label: "Invoices", icon: Receipt },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare },
  { href: "/admin/support", label: "Support", icon: HelpCircle },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

interface AdminSidebarProps { open: boolean; onClose: () => void }

export function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { profile } = useAuth();
  const isActive = (href: string) => href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  const initials = profile?.full_name ? getInitials(profile.full_name) : "AD";

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/20 lg:hidden" onClick={onClose} />}
      <aside className={cn("fixed inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-slate-100 flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto", open ? "translate-x-0" : "-translate-x-full")}>
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-100">
          <Link href="/admin" className="flex items-center gap-2"><BrandLogo variant="sidebar" /></Link>
          <button onClick={onClose} className="lg:hidden p-1 text-slate-400 hover:text-slate-600" aria-label="Close sidebar"><X className="h-5 w-5" /></button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all",
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-blue-600" />}
                <item.icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-blue-600" : "text-slate-400")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-xs font-semibold">{initials}</div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-slate-900 truncate">{profile?.full_name || "Admin"}</p>
              <p className="text-[11px] text-slate-400 truncate">{profile?.email || ""}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
