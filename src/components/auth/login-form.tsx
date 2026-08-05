"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AlertCircle, CheckCircle2, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";
import { loginWithRole } from "@/lib/auth/actions";
import { LoginLayout } from "./login-layout";

interface LoginPageShellProps {
  role: "admin" | "team_member" | "client";
  title: string;
}

const subtitles: Record<string, string> = {
  admin: "Sign in to access your admin workspace",
  team_member: "Sign in to access your team workspace",
  client: "Sign in to access your client workspace",
};

function LoginFormInner({ role, title }: LoginPageShellProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const message = searchParams.get("message");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("expected_role", role);

    try {
      const result = await loginWithRole(formData);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <LoginLayout>
      {/* Glassmorphism Card */}
      <div className="relative rounded-[20px] border border-[#3b82f6]/15 bg-[#0c1929]/75 backdrop-blur-[22px] p-7 sm:p-8 shadow-[0_8px_60px_rgba(0,0,0,0.4)] overflow-hidden">
        {/* Subtle edge lighting effects */}
        <div className="absolute inset-0 rounded-[20px] border border-white/[0.06] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#60a5fa]/30 to-transparent" />
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-[#60a5fa]/20 via-transparent to-transparent" />
        {/* Subtle blue outer glow */}
        <div className="absolute -inset-px rounded-[20px] bg-[#3b82f6]/[0.04] pointer-events-none" />

        {/* Logo */}
        <div className="relative text-center mb-7">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#0f172a] border border-[#3b82f6]/20 mb-3 shadow-lg shadow-blue-900/20">
            <span className="text-base font-bold text-white tracking-tight">iW</span>
          </div>
          <div>
            <span className="text-[11px] font-semibold tracking-[0.25em] uppercase text-[#94a3b8]">Ideolyte</span>
            <p className="text-[10px] text-[#64748b] -mt-0.5 tracking-wide">Workspace</p>
          </div>
        </div>

        {/* Title */}
        <div className="relative mb-6 text-center">
          <h1 className="text-xl font-semibold text-white">{title}</h1>
          <p className="mt-1.5 text-sm text-[#94a3b8]">{subtitles[role]}</p>
        </div>

        {/* Messages */}
        {message && (
          <div className="relative mb-5 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <p className="text-sm text-emerald-300">{message}</p>
          </div>
        )}

        {error && (
          <div className="relative mb-5 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="relative space-y-5">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#cbd5e1] mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b]" />
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@company.com"
                required
                disabled={loading}
                autoComplete="email"
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#0f1d2f]/80 border border-[#334155]/60 text-white text-sm placeholder:text-[#4b5e73] focus:outline-none focus:border-[#3b82f6]/60 focus:ring-2 focus:ring-[#3b82f6]/20 transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#cbd5e1] mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b]" />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                disabled={loading}
                minLength={6}
                autoComplete="current-password"
                className="w-full h-11 pl-10 pr-11 rounded-xl bg-[#0f1d2f]/80 border border-[#334155]/60 text-white text-sm placeholder:text-[#4b5e73] focus:outline-none focus:border-[#3b82f6]/60 focus:ring-2 focus:ring-[#3b82f6]/20 transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#94a3b8] transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-[#94a3b8] cursor-pointer">
              <input type="checkbox" name="remember" className="rounded border-[#334155] bg-[#0f1d2f] text-[#3b82f6] focus:ring-[#3b82f6]/30 focus:ring-offset-0" />
              Remember me
            </label>
            {role === "admin" && (
              <button type="button" className="text-sm text-[#60a5fa] hover:text-[#93c5fd] font-medium transition-colors">
                Forgot password?
              </button>
            )}
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-[#3b82f6] via-[#2563eb] to-[#1d4ed8] text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:brightness-100"
          >
            {loading ? (
              <span className="flex items-center gap-2"><LoadingSpinner size="sm" /> Signing in...</span>
            ) : (
              <>Sign In <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative mt-7 mb-4 flex items-center gap-3">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#334155]/50" />
          <div className="flex items-center gap-1.5 text-[10px] text-[#64748b] uppercase tracking-wider">
            <ShieldCheck className="h-3 w-3" />
            <span>Secure Access</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#334155]/50" />
        </div>

        {/* Footer */}
        <p className="relative text-center text-[10px] text-[#4b5e73]">
          &copy; Ideolyte Workspace. All rights reserved.
        </p>
      </div>
    </LoginLayout>
  );
}

export function LoginPageShell(props: LoginPageShellProps) {
  return (
    <Suspense fallback={
      <LoginLayout>
        <div className="rounded-[20px] bg-[#0c1929]/75 backdrop-blur-[22px] border border-[#3b82f6]/15 p-8 shadow-[0_8px_60px_rgba(0,0,0,0.4)] flex items-center justify-center min-h-[300px]">
          <LoadingSpinner />
        </div>
      </LoginLayout>
    }>
      <LoginFormInner {...props} />
    </Suspense>
  );
}
