"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AlertCircle, Mail, Lock, Eye, EyeOff, ArrowRight, Shield, Zap, FolderKanban, Users, UserCircle, ShieldCheck, CheckCircle2 } from "lucide-react";
import { loginWithRole } from "@/lib/auth/actions";

interface LoginPageShellProps {
  role: "admin" | "team_member" | "client";
  title: string;
}

const roleConfig = {
  admin: { heading: "Manage your workspace", subtitle: "Sign in with your administrator account.", icon: ShieldCheck },
  team_member: { heading: "Continue your work", subtitle: "Access your assigned projects and tasks.", icon: Users },
  client: { heading: "Track your project", subtitle: "View progress, files, messages and updates.", icon: UserCircle },
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-[#f8faff]" />
      <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-100/40 blur-[120px]" />
      <div className="fixed bottom-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full bg-violet-100/30 blur-[100px]" />
      <div className="fixed top-[30%] right-[20%] w-[300px] h-[300px] rounded-full bg-emerald-50/40 blur-[80px]" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-[52fr_48fr] bg-white/80 backdrop-blur-sm border border-white/80 rounded-3xl shadow-[0_8px_60px_rgba(0,0,0,0.04)] overflow-hidden">
        
        {/* Left Brand Section */}
        <div className="hidden lg:flex flex-col justify-between p-10 xl:p-12 bg-gradient-to-br from-slate-50/50 to-blue-50/30">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <span className="text-sm font-bold text-white tracking-tight">iW</span>
            </div>
            <div>
              <span className="text-[15px] font-semibold text-slate-900 block leading-tight">Ideolyte</span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Workspace</span>
            </div>
          </div>

          {/* Welcome */}
          <div className="space-y-4 my-8">
            <h1 className="text-3xl xl:text-[34px] font-bold text-slate-900 leading-tight">Welcome Back!</h1>
            <p className="text-lg font-medium">
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Projects. People. Progress.</span>
            </p>
            <p className="text-[14px] text-slate-500 leading-relaxed max-w-sm">
              Sign in to access your workspace and keep your projects moving forward.
            </p>

            {/* Workflow visual */}
            <div className="pt-6 flex items-center gap-3">
              {[
                { label: "Client", color: "bg-blue-100 text-blue-600" },
                { label: "Project", color: "bg-violet-100 text-violet-600" },
                { label: "Team", color: "bg-emerald-100 text-emerald-600" },
                { label: "Delivery", color: "bg-amber-100 text-amber-600" },
              ].map((step, i) => (
                <div key={step.label} className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-full ${step.color} flex items-center justify-center text-[10px] font-semibold`}>
                    {step.label.slice(0, 2)}
                  </div>
                  {i < 3 && <div className="w-6 border-t border-dashed border-slate-300" />}
                </div>
              ))}
            </div>
          </div>

          {/* Trust indicators */}
          <div className="flex items-center gap-6 pt-4">
            {[
              { icon: Shield, label: "Secure", desc: "Protected access" },
              { icon: Zap, label: "Fast", desc: "Optimized speed" },
              { icon: FolderKanban, label: "Organized", desc: "One workspace" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <item.icon className="h-3.5 w-3.5 text-slate-400" />
                <div>
                  <p className="text-[11px] font-medium text-slate-700">{item.label}</p>
                  <p className="text-[10px] text-slate-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Login Card */}
        <div className="p-8 sm:p-10 xl:p-12 flex flex-col justify-center">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <span className="text-xs font-bold text-white">iW</span>
            </div>
            <span className="text-[14px] font-semibold text-slate-900">Ideolyte Workspace</span>
          </div>

          {/* Role Selector */}
          <div className="flex items-center rounded-xl bg-slate-100/70 p-1 mb-7">
            {([["admin", "Admin"], ["team_member", "Team"], ["client", "Client"]] as const).map(([key, label]) => (
              <button key={key} onClick={() => { setRole(key); setError(null); }}
                className={`flex-1 py-2 px-3 rounded-lg text-[13px] font-medium transition-all ${role === key ? "bg-white text-slate-900 shadow-sm border border-blue-200/60" : "text-slate-500 hover:text-slate-700"}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Role heading */}
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
            <div className="mb-5 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200/60 px-4 py-3">
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
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all disabled:opacity-50" />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input name="password" type={showPassword ? "text" : "password"} required disabled={loading} minLength={6} autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-11 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all disabled:opacity-50" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {capsLock && <p className="text-[11px] text-amber-600 mt-1.5 flex items-center gap-1">⚠ Caps Lock is on</p>}
            </div>

            {role === "admin" && (
              <div className="flex justify-end">
                <button type="button" className="text-[13px] text-blue-600 hover:text-blue-700 font-medium transition-colors">Forgot password?</button>
              </div>
            )}

            <button type="submit" disabled={loading || success}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md shadow-blue-600/10 hover:shadow-lg hover:shadow-blue-600/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-md">
              {loading ? <><LoadingSpinner size="sm" /> Signing in...</> : success ? <><CheckCircle2 className="h-4 w-4" /> Welcome to Ideolyte</> : <>Sign In <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-[11px] text-slate-400 mt-8">&copy; Ideolyte Workspace</p>
        </div>
      </div>
    </div>
  );
}

export function LoginPageShell(props: LoginPageShellProps) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#f8faff]"><LoadingSpinner /></div>}>
      <LoginFormInner {...props} />
    </Suspense>
  );
}
