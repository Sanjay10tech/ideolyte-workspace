"use client";

interface LoginLayoutProps {
  children: React.ReactNode;
}

export function LoginLayout({ children }: LoginLayoutProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background Image - unchanged */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/login-bg.jpg')" }}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-[#0f172a]/40" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-start px-5 py-8 sm:px-8 lg:px-16 xl:px-24">
        <div className="w-full max-w-[440px] sm:max-w-[440px]">
          {children}
        </div>
      </div>
    </div>
  );
}
