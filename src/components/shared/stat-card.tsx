"use client";

import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  accent?: "blue" | "green" | "amber" | "purple";
}

const accentStyles = {
  blue: { bg: "bg-blue-50", icon: "text-blue-600", border: "border-blue-100" },
  green: { bg: "bg-emerald-50", icon: "text-emerald-600", border: "border-emerald-100" },
  amber: { bg: "bg-amber-50", icon: "text-amber-600", border: "border-amber-100" },
  purple: { bg: "bg-violet-50", icon: "text-violet-600", border: "border-violet-100" },
};

export function StatCard({ title, value, icon: Icon, trend, trendUp, accent = "blue" }: StatCardProps) {
  const style = accentStyles[accent];

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] text-slate-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {trend && (
            <p className={`text-[11px] mt-1 font-medium ${trendUp ? "text-emerald-600" : "text-slate-400"}`}>
              {trendUp ? "↑" : ""} {trend}
            </p>
          )}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${style.bg} ${style.border} border`}>
          <Icon className={`h-[18px] w-[18px] ${style.icon}`} />
        </div>
      </div>
    </div>
  );
}
