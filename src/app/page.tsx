import Link from "next/link";
import { ShieldCheck, Users, User } from "lucide-react";

const workspaces = [
  {
    href: "/login/admin",
    icon: ShieldCheck,
    title: "Admin Workspace",
    description: "Manage clients, projects and business",
    buttonLabel: "Admin Login",
    color: "bg-blue-50 text-blue-600",
  },
  {
    href: "/login/team",
    icon: Users,
    title: "Team Workspace",
    description: "Access assigned projects and tasks",
    buttonLabel: "Team Login",
    color: "bg-violet-50 text-violet-600",
  },
  {
    href: "/login/client",
    icon: User,
    title: "Client Workspace",
    description: "Track progress, files and invoices",
    buttonLabel: "Client Login",
    color: "bg-emerald-50 text-emerald-600",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-[#f8faff]" />
      <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-100/40 blur-[120px]" />
      <div className="fixed bottom-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full bg-violet-100/30 blur-[100px]" />
      <div className="fixed top-[30%] right-[20%] w-[300px] h-[300px] rounded-full bg-emerald-50/40 blur-[80px]" />

      <div className="relative z-10 w-full max-w-2xl">
        {/* Branding */}
        <div className="text-center mb-10">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 mb-4 shadow-lg shadow-blue-600/10">
            <span className="text-base font-bold text-white tracking-tight">iW</span>
          </div>
          <div className="mb-1">
            <span className="text-sm font-semibold tracking-[0.15em] uppercase text-slate-500">Ideolyte</span>
          </div>
          <p className="text-[11px] text-slate-400 tracking-wide">Workspace</p>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 mt-6">Welcome to Ideolyte Workspace</h1>
          <p className="text-sm text-slate-500 mt-1">Choose your workspace to continue</p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {workspaces.map((ws) => (
            <Link
              key={ws.href}
              href={ws.href}
              className="group rounded-2xl border border-slate-200/60 bg-white/90 backdrop-blur-sm p-6 text-center shadow-sm hover:shadow-md transition-all hover:border-blue-200/60 hover:-translate-y-0.5"
            >
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${ws.color} mb-4 group-hover:scale-105 transition-transform`}>
                <ws.icon className="h-5 w-5" />
              </div>
              <h2 className="text-sm font-semibold text-slate-900">{ws.title}</h2>
              <p className="text-xs text-slate-500 mt-1 mb-5">{ws.description}</p>
              <span className="inline-flex items-center justify-center h-9 px-5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium group-hover:shadow-md group-hover:shadow-blue-600/20 transition-all">
                {ws.buttonLabel}
              </span>
            </Link>
          ))}
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-10">&copy; Ideolyte Workspace</p>
      </div>
    </div>
  );
}
