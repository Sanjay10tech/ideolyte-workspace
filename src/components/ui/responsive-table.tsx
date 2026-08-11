"use client";

import { cn } from "@/lib/utils";

/**
 * Responsive table wrapper — horizontal scroll on mobile, full table on desktop.
 * Prevents page overflow while keeping table usable.
 */
export function ResponsiveTable({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("w-full overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0", className)}>
      <table className="w-full min-w-[580px]">
        {children}
      </table>
    </div>
  );
}
