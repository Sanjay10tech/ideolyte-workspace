"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AlertCircle, Mail, Lock, Eye, EyeOff, ArrowRight, Shield, LayoutGrid, Users2, Package, CheckCircle2 } from "lucide-react";
import { loginWithRole } from "@/lib/auth/actions";

interface LoginPageShellProps {
  role: "admin" | "team_member" | "client";
  title: string;
}

const roleConfig = {
  admin: { heading: "Manage your workspace", subtitle: "Sign in with your administrator account." },
  team_member: { heading: "Continue your work", subtitle: "Access your assigned projects and tasks." },
  client: { heading: "Track your project", subtitle: "View your project progress, files and updates." },
};

function LoginFormInner({ role: initialRole }: LoginPageShellProps) {
  const [role, setRole] = useState<"admin" | "team_member" | "client">(initialRole);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const config = roleConfig[role];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => setCapsLock(e.getModifierState("CapsLock"));
    window.addEventListener("keydown", handler);
    window.addEventListener("keyup", handler);
    return () => { window.removeEventListener("keydown", handler); window.removeEventListener("keyup", handler); };
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("expected_role", role);
    try {
      const result = await loginWithRole(formData);
      if (result?.error) { setError(result.error); setLoading(false); }
      else { setSuccess(true); }
    } catch { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-[#f7f8fc]">
      {/* Animated background glows */}
      <div className="fixed top-[-15%] left-[-8%] w-[500px] h-[500px] rounded-full bg-blue-100/30 blur-[100px] pointer-events-none animate-drift" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[450px] h-[450px] rounded-full bg-violet-100/25 blur-[90px] pointer-events-none animate-drift delay-300" style={{ animationDuration: "15s" }} />
      <div className="fixed top-[40%] right-[15%] w-[250px] h-[250px] rounded-full bg-emerald-50/30 blur-[70px] pointer-events-none animate-drift delay-500" style={{ animationDuration: "10s" }} />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-[52fr_48fr] bg-white/90 backdrop-blur-sm border border-slate-200/50 rounded-[22px] shadow-[0_8px_40px_rgba(0,0,0,0.04)] overflow-hidden animate-scale-in">

        {/* Left Brand Section */}
        <div className="hidden lg:flex flex-col justify-between p-10 xl:p-12 relative overflow-hidden">
          {/* Faint watermark */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[180px] font-bold text-slate-100/40 select-none pointer-events-none leading-none">iW</div>

          {/* Logo */}
          <div className="relative flex items-center gap-2.5 animate-fade-in">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-600/10 animate-scale-in">
              <span className="text-sm font-bold text-white tracking-tight">iW</span>
            </div>
            <div>
              <span className="text-[15px] font-semibold text-slate-900 block leading-tight">Ideolyte</span>
              <span className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">Workspace</span>
            </div>
          </div>

          {/* Welcome + Tagline */}
          <div className="relative space-y-4 my-6 animate-fade-up delay-150">
            <h1 className="text-[32px] xl:text-[36px] font-bold text-slate-900 leading-[1.15]">Welcome Back!</h1>
            <p className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              Projects. People. Progress.
            </p>
            <p className="text-[14px] text-slate-500 leading-relaxed max-w-[320px]">
              One workspace to manage clients, projects and delivery.
            </p>

            {/* Workflow Visual */}
            <div className="pt-8 flex items-center gap-2">
              {[
                { icon: Users2, label: "Client", bg: "bg-blue-50", text: "text-blue-600" },
                { icon: Package, label: "Project", bg: "bg-violet-50", text: "text-violet-600" },
                { icon: LayoutGrid, label: "Team", bg: "bg-emerald-50", text: "text-emerald-600" },
                { icon: CheckCircle2, label: "Delivery", bg: "bg-amber-50", text: "text-amber-600" },
              ].map((step, i) => (
                <div key={step.label} className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1.5 animate-fade-up" style={{ animationDelay: `${300 + i * 150}ms` }}>
                    <div className={`h-11 w-11 rounded-xl ${step.bg} ${step.text} flex items-center justify-center shadow-sm transition-transform hover:scale-110`}>
                      <step.icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-500">{step.label}</span>
                  </div>
                  {i < 3 && (
                    <div className="w-8 mb-5 relative overflow-hidden">
                      <div className="border-t border-dashed border-slate-300 w-full" />
                      <div className="absolute top-[-2px] left-[-12px] h-[5px] w-3 bg-gradient-to-r from-blue-500/50 to-transparent rounded-full animate-travel-right" style={{ animationDelay: `${i * 1.5}s` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="relative flex items-start gap-6 pt-4">
            {[
              { icon: Shield, title: "Secure", desc: "Protected workspace access" },
              { icon: LayoutGrid, title: "Organized", desc: "Projects, tasks and files" },
              { icon: Users2, title: "Connected", desc: "Clients and teams aligned" },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-2">
                <item.icon className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[12px] font-semibold text-slate-700">{item.title}</p>
                  <p className="text-[11px] text-slate-400 leading-tight">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Login Panel */}
        <div className="p-7 sm:p-10 xl:p-12 flex flex-col justify-center bg-white/50">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-7">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <span className="text-xs font-bold text-white">iW</span>
            </div>
            <div>
              <span className="text-[14px] font-semibold text-slate-900">Ideolyte</span>
              <span className="text-[10px] text-slate-400 ml-1 tracking-wide uppercase">Workspace</span>
            </div>
          </div>

          {/* Role Selector */}
          <div className="flex items-center rounded-xl bg-slate-100/70 p-1 mb-7">
            {([["admin", "Admin"], ["team_member", "Team"], ["client", "Client"]] as const).map(([key, label]) => (
              <button key={key} onClick={() => { setRole(key); setError(null); }}
                className={`flex-1 py-2.5 px-3 rounded-lg text-[13px] font-medium transition-all duration-200 ${role === key ? "bg-white text-slate-900 shadow-sm border border-blue-100" : "text-slate-500 hover:text-slate-700"}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900">{config.heading}</h2>
            <p className="text-[13px] text-slate-500 mt-1">{config.subtitle}</p>
          </div>

          {/* Messages */}
          {message && (
            <div className="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200/60 px-4 py-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <p className="text-[13px] text-emerald-700">{message}</p>
            </div>
          )}
          {error && (
            <div className="mb-5 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200/60 px-4 py-3 animate-shake">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
              <p className="text-[13px] text-red-700">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input name="email" type="email" required disabled={loading} autoComplete="email"
                  placeholder="you@company.com"
                  className="w-full h-[48px] pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-400 transition-all duration-200 disabled:opacity-50 shadow-sm shadow-slate-100/50" />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input name="password" type={showPassword ? "text" : "password"} required disabled={loading} minLength={6} autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full h-[48px] pl-10 pr-11 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-400 transition-all duration-200 disabled:opacity-50 shadow-sm shadow-slate-100/50" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {capsLock && <p className="text-[11px] text-amber-600 mt-1.5">⚠ Caps Lock is on</p>}
            </div>

            {role === "admin" && (
              <div className="flex justify-end">
                <button type="button" className="text-[13px] text-blue-600 hover:text-blue-700 font-medium transition-colors">Forgot password?</button>
              </div>
            )}

            <button type="submit" disabled={loading || success}
              className="w-full h-[50px] rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/15 hover:shadow-xl hover:shadow-blue-600/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60 disabled:hover:translate-y-0">
              {loading ? <><LoadingSpinner size="sm" /> Signing in...</> : success ? <><CheckCircle2 className="h-4 w-4" /> Welcome to Ideolyte</> : <>Sign In <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <p className="text-center text-[11px] text-slate-400 mt-8">&copy; Ideolyte Workspace</p>
        </div>
      </div>
    </div>
  );
}

export function LoginPageShell(props: LoginPageShellProps) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#f7f8fc]"><LoadingSpinner /></div>}>
      <LoginFormInner {...props} />
    </Suspense>
  );
}
