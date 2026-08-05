"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Activity, FolderKanban, LayoutDashboard, CheckSquare, Flag, MessageSquare, FileText, Receipt, FileSignature, HelpCircle, X } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { BrandLogo } from "@/components/shared/brand-logo";

const navItems = [
  { href: "/client", label: "Home", icon: Home },
  { href: "/client/activity", label: "Activity", icon: Activity },
  { href: "/client/projects", label: "My Projects", icon: FolderKanban },
  { href: "/client/projects/overview", label: "Overview", icon: LayoutDashboard, indent: true },
  { href: "/client/projects/tasks", label: "Tasks", icon: CheckSquare, indent: true },
  { href: "/client/projects/milestones", label: "Milestones", icon: Flag, indent: true },
  { href: "/client/messages", label: "Messages", icon: MessageSquare },
  { href: "/client/files", label: "Files", icon: FileText },
  { href: "/client/invoices", label: "Invoices", icon: Receipt },
  { href: "/client/agreement", label: "Agreement", icon: FileSignature },
  { href: "/client/support", label: "Support", icon: HelpCircle },
];

interface ClientSidebarProps { open: boolean; onClose: () => void }

export function ClientSidebar({ open, onClose }: ClientSidebarProps) {
  const pathname = usePathname();
  const { profile } = useAuth();
  const isActive = (href: string) => href === "/client" ? pathname === "/client" : pathname.startsWith(href);
  const initials = profile?.full_name ? getInitials(profile.full_name) : "CL";

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/20 lg:hidden" onClick={onClose} />}
      <aside className={cn("fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex h-16 items-center justify-between px-5 border-b border-gray-100">
          <Link href="/client" className="flex items-center gap-2">
            <BrandLogo variant="sidebar" />
          </Link>
          <button onClick={onClose} className="lg:hidden p-1 text-gray-400 hover:text-gray-600" aria-label="Close sidebar"><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={onClose} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors", item.indent && "pl-8", isActive(item.href) ? "bg-[#1e293b] text-white" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900")}>
              <item.icon className="h-4.5 w-4.5 shrink-0" />{item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-sm font-medium">{initials}</div>
            <div className="min-w-0"><p className="text-sm font-medium text-gray-900 truncate">{profile?.full_name || "Client"}</p><p className="text-xs text-gray-500 truncate">{profile?.company || ""}</p></div>
          </div>
        </div>
      </aside>
    </>
  );
}
