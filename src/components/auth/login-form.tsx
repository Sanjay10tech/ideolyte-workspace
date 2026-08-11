"use client";

import { Suspense, useState, useEffect, useRef } from "react";
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
  const [mounted, setMounted] = useState(false);
  const [shakeError, setShakeError] = useState(false);
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const config = roleConfig[role];
  const styleRef = useRef<HTMLStyleElement | null>(null);

  // Inject keyframe animations into head (guaranteed to work)
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes iw-drift {
        0% { transform: translate(0, 0) scale(1); }
        33% { transform: translate(12px, -8px) scale(1.02); }
        66% { transform: translate(-8px, 6px) scale(0.98); }
        100% { transform: translate(0, 0) scale(1); }
      }
      @keyframes iw-drift2 {
        0% { transform: translate(0, 0); }
        50% { transform: translate(-15px, 10px); }
        100% { transform: translate(0, 0); }
      }
      @keyframes iw-drift3 {
        0% { transform: translate(0, 0); }
        50% { transform: translate(10px, -12px); }
        100% { transform: translate(0, 0); }
      }
      @keyframes iw-travel {
        0% { left: -8px; opacity: 0; }
        15% { opacity: 1; }
        85% { opacity: 1; }
        100% { left: 100%; opacity: 0; }
      }
      @keyframes iw-shake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-3px); }
        40% { transform: translateX(3px); }
        60% { transform: translateX(-2px); }
        80% { transform: translateX(2px); }
      }
      @keyframes iw-pulse-ring {
        0% { transform: scale(1); opacity: 0.4; }
        50% { transform: scale(1.08); opacity: 0.2; }
        100% { transform: scale(1); opacity: 0.4; }
      }
    `;
    document.head.appendChild(style);
    styleRef.current = style;
    return () => { if (styleRef.current) document.head.removeChild(styleRef.current); };
  }, []);

  // Trigger mount animation
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Caps lock detection
  useEffect(() => {
    const handler = (e: KeyboardEvent) => setCapsLock(e.getModifierState("CapsLock"));
    window.addEventListener("keydown", handler);
    window.addEventListener("keyup", handler);
    return () => { window.removeEventListener("keydown", handler); window.removeEventListener("keyup", handler); };
  }, []);

  // Shake error animation
  useEffect(() => {
    if (error) {
      setShakeError(true);
      const t = setTimeout(() => setShakeError(false), 300);
      return () => clearTimeout(t);
    }
  }, [error]);

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
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden" style={{ background: "#f7f8fc" }}>
      {/* Animated background glows - using inline animation */}
      <div style={{
        position: "fixed", top: "-15%", left: "-8%", width: 500, height: 500,
        borderRadius: "50%", background: "rgba(191, 219, 254, 0.25)", filter: "blur(100px)",
        pointerEvents: "none", animation: "iw-drift 14s ease-in-out infinite",
      }} />
      <div style={{
        position: "fixed", bottom: "-10%", right: "-5%", width: 450, height: 450,
        borderRadius: "50%", background: "rgba(221, 214, 254, 0.2)", filter: "blur(90px)",
        pointerEvents: "none", animation: "iw-drift2 18s ease-in-out infinite",
      }} />
      <div style={{
        position: "fixed", top: "40%", right: "15%", width: 250, height: 250,
        borderRadius: "50%", background: "rgba(209, 250, 229, 0.2)", filter: "blur(70px)",
        pointerEvents: "none", animation: "iw-drift3 12s ease-in-out infinite",
      }} />

      {/* Main Container with entrance animation */}
      <div
        className="relative z-10 w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-[52fr_48fr] bg-white/90 backdrop-blur-sm border border-slate-200/50 rounded-[22px] shadow-[0_8px_40px_rgba(0,0,0,0.04)] overflow-hidden"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0) scale(1)" : "translateY(14px) scale(0.98)",
          transition: "opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >

        {/* Left Brand Section */}
        <div className="hidden lg:flex flex-col justify-between p-10 xl:p-12 relative overflow-hidden">
          {/* Faint watermark */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none leading-none"
            style={{ fontSize: 180, fontWeight: 700, color: "rgba(241, 245, 249, 0.5)" }}>iW</div>

          {/* Logo */}
          <div className="relative flex items-center gap-2.5" style={{
            opacity: mounted ? 1 : 0, transform: mounted ? "scale(1)" : "scale(0.9)",
            transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.2s",
          }}>
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-600/10">
              <span className="text-sm font-bold text-white tracking-tight">iW</span>
            </div>
            <div>
              <span className="text-[15px] font-semibold text-slate-900 block leading-tight">Ideolyte</span>
              <span className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">Workspace</span>
            </div>
          </div>

          {/* Welcome + Tagline */}
          <div className="relative space-y-4 my-6" style={{
            opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(16px)",
            transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s",
          }}>
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
                { icon: Users2, label: "Client", bg: "#eff6ff", text: "#2563eb" },
                { icon: Package, label: "Project", bg: "#f5f3ff", text: "#7c3aed" },
                { icon: LayoutGrid, label: "Team", bg: "#ecfdf5", text: "#059669" },
                { icon: CheckCircle2, label: "Delivery", bg: "#fffbeb", text: "#d97706" },
              ].map((step, i) => (
                <div key={step.label} className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1.5" style={{
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? "translateY(0)" : "translateY(12px)",
                    transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${0.5 + i * 0.15}s`,
                  }}>
                    <div className="h-11 w-11 rounded-xl flex items-center justify-center shadow-sm transition-transform hover:scale-110"
                      style={{ background: step.bg, color: step.text }}>
                      <step.icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-500">{step.label}</span>
                  </div>
                  {i < 3 && (
                    <div className="w-8 mb-5 relative overflow-hidden" style={{ height: 4 }}>
                      <div style={{ position: "absolute", top: "50%", left: 0, right: 0, borderTop: "1px dashed #cbd5e1" }} />
                      <div style={{
                        position: "absolute", top: 0, width: 10, height: 4,
                        borderRadius: 4,
                        background: "linear-gradient(to right, rgba(59,130,246,0.6), transparent)",
                        animation: `iw-travel 4s ease-in-out infinite ${i * 1.3}s`,
                      }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="relative flex items-start gap-6 pt-4" style={{
            opacity: mounted ? 1 : 0, transition: "opacity 0.5s ease 1s",
          }}>
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
                className="flex-1 py-2.5 px-3 rounded-lg text-[13px] font-medium transition-all duration-200"
                style={{
                  background: role === key ? "#fff" : "transparent",
                  color: role === key ? "#0f172a" : "#64748b",
                  boxShadow: role === key ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                  border: role === key ? "1px solid #dbeafe" : "1px solid transparent",
                }}>
                {label}
              </button>
            ))}
          </div>

          {/* Heading with role transition */}
          <div className="mb-6" style={{ transition: "all 0.2s ease" }}>
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
            <div className="mb-5 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200/60 px-4 py-3"
              style={{ animation: shakeError ? "iw-shake 0.25s ease-in-out" : "none" }}>
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
              <p className="text-[13px] text-red-700">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors" />
                <input name="email" type="email" required disabled={loading} autoComplete="email"
                  placeholder="you@company.com"
                  className="w-full h-[48px] pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 disabled:opacity-50 shadow-sm shadow-slate-100/50"
                  style={{ outline: "none" }}
                  onFocus={e => { e.currentTarget.style.borderColor = "#60a5fa"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(241,245,249,0.5)"; }}
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors" />
                <input name="password" type={showPassword ? "text" : "password"} required disabled={loading} minLength={6} autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full h-[48px] pl-10 pr-11 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 disabled:opacity-50 shadow-sm shadow-slate-100/50"
                  style={{ outline: "none" }}
                  onFocus={e => { e.currentTarget.style.borderColor = "#60a5fa"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(241,245,249,0.5)"; }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  style={{ transition: "all 0.15s ease" }}>
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
              className="w-full h-[50px] rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
              style={{
                background: success ? "#059669" : "linear-gradient(to right, #2563eb, #4f46e5)",
                boxShadow: "0 8px 16px rgba(37,99,235,0.15)",
                transform: "translateY(0)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={e => { if (!loading && !success) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 12px 24px rgba(37,99,235,0.2)"; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 16px rgba(37,99,235,0.15)"; }}
              onMouseDown={e => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              {loading ? (
                <><LoadingSpinner size="sm" /> Signing in...</>
              ) : success ? (
                <><CheckCircle2 className="h-4 w-4" /> Welcome to Ideolyte</>
              ) : (
                <>Sign In <ArrowRight className="h-4 w-4" /></>
              )}
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: "#f7f8fc" }}><LoadingSpinner /></div>}>
      <LoginFormInner {...props} />
    </Suspense>
  );
}
