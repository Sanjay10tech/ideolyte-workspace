"use client";

import { cn } from "@/lib/utils";

interface BrandLogoProps {
  variant?: "full" | "mark" | "sidebar";
  className?: string;
}

export function BrandLogo({ variant = "full", className }: BrandLogoProps) {
  if (variant === "mark") {
    return (
      <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e293b]", className)}>
        <span className="text-sm font-bold text-white tracking-tight">iW</span>
      </div>
    );
  }

  if (variant === "sidebar") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e293b]">
          <span className="text-sm font-bold text-white tracking-tight">iW</span>
        </div>
        <div className="leading-tight">
          <span className="text-base font-semibold text-gray-900 block">Ideolyte</span>
          <span className="text-[10px] text-gray-500 font-medium -mt-0.5 block">Workspace</span>
        </div>
      </div>
    );
  }

  // Full logo
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e293b]">
        <span className="text-sm font-bold text-white tracking-tight">iW</span>
      </div>
      <span className="text-lg font-semibold text-gray-900">Ideolyte Workspace</span>
    </div>
  );
}

// Brand constants for use across the app
export const BRAND = {
  name: "Ideolyte",
  product: "Ideolyte Workspace",
  subtitle: "Digital Solutions & Technology",
  tagline: "Projects. Progress. Partnership.",
  email: "hello@ideolyte.com",
  address: "Indore • Bengaluru, India",
  website: "ideolyte.com",
} as const;
