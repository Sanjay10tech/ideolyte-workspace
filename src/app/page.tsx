import Link from "next/link";
import { ShieldCheck, Users, User } from "lucide-react";

const workspaces = [
  {
    href: "/login/admin",
    icon: ShieldCheck,
    title: "Admin Workspace",
    description: "Manage clients, projects and business",
    buttonLabel: "Admin Login",
    color: "bg-[#1e293b]/10 text-[#1e293b]",
  },
  {
    href: "/login/team",
    icon: Users,
    title: "Team Workspace",
    description: "Access assigned projects and tasks",
    buttonLabel: "Team Login",
    color: "bg-purple-100 text-purple-700",
  },
  {
    href: "/login/client",
    icon: User,
    title: "Client Workspace",
    description: "Track progress, files and invoices",
    buttonLabel: "Client Login",
    color: "bg-blue-100 text-blue-700",
  },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-[center_top] bg-no-repeat"
        style={{ backgroundImage: "url('/login-bg.jpg')" }}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-[#0f172a]/35" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-start justify-center px-4 pt-10 pb-12 sm:pt-16">
        <div className="w-full max-w-3xl">
          {/* Branding */}
          <div className="text-center mb-10">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#1e293b] border border-white/10 mb-4 shadow-lg">
              <span className="text-base font-bold text-white tracking-tight">iW</span>
            </div>
            <div className="mb-1">
              <span className="text-sm font-semibold tracking-[0.15em] uppercase text-white/70">Ideolyte</span>
            </div>
            <p className="text-xs text-white/50">Workspace</p>
            <h1 className="text-xl sm:text-2xl font-semibold text-white mt-6">Welcome to Ideolyte Workspace</h1>
            <p className="text-sm text-white/60 mt-1">Choose your workspace to continue</p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {workspaces.map((ws) => (
              <Link
                key={ws.href}
                href={ws.href}
                className="group rounded-2xl border border-white/15 bg-white/95 backdrop-blur-md p-6 text-center shadow-xl hover:shadow-2xl transition-all hover:bg-white hover:scale-[1.02]"
              >
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${ws.color} mb-4 group-hover:scale-105 transition-transform`}>
                  <ws.icon className="h-5 w-5" />
                </div>
                <h2 className="text-sm font-semibold text-gray-900">{ws.title}</h2>
                <p className="text-xs text-gray-700 mt-1 mb-5">{ws.description}</p>
                <span className="inline-flex items-center justify-center h-9 px-5 rounded-lg bg-[#1e293b] text-white text-sm font-medium group-hover:bg-[#334155] transition-colors">
                  {ws.buttonLabel}
                </span>
              </Link>
            ))}
          </div>

          {/* Footer */}
          <p className="text-center text-[11px] text-white/40 mt-10">
            &copy; Ideolyte Workspace
          </p>
        </div>
      </div>
    </div>
  );
}
