"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({ open, onClose, children, className }: DialogProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          "relative z-10 w-full sm:max-w-lg max-h-[85vh] sm:max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-xl border border-slate-200/60 bg-white shadow-xl",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) {
  return (
    <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 sticky top-0 bg-white z-10 rounded-t-2xl sm:rounded-t-xl">
      <h2 className="text-base sm:text-lg font-semibold text-slate-900">{children}</h2>
      {onClose && (
        <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 touch-manipulation" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

export function DialogContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("p-4 sm:p-5", className)}>{children}</div>;
}

export function DialogFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-end gap-2 p-4 sm:p-5 border-t border-slate-100 sticky bottom-0 bg-white", className)}>
      {children}
    </div>
  );
}
