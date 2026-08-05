"use client";

import { Badge } from "@/components/ui/badge";

type StatusType =
  | "active"
  | "inactive"
  | "pending"
  | "in-progress"
  | "completed"
  | "on-hold"
  | "planning"
  | "paid"
  | "overdue"
  | "draft"
  | "todo"
  | "review"
  | "low"
  | "medium"
  | "high"
  | "urgent"
  | "upcoming";

const statusConfig: Record<StatusType, { label: string; variant: "success" | "warning" | "destructive" | "info" | "secondary" | "default" | "outline" }> = {
  active: { label: "Active", variant: "success" },
  inactive: { label: "Inactive", variant: "secondary" },
  pending: { label: "Pending", variant: "warning" },
  "in-progress": { label: "In Progress", variant: "info" },
  completed: { label: "Completed", variant: "success" },
  "on-hold": { label: "On Hold", variant: "warning" },
  planning: { label: "Planning", variant: "secondary" },
  paid: { label: "Paid", variant: "success" },
  overdue: { label: "Overdue", variant: "destructive" },
  draft: { label: "Draft", variant: "outline" },
  todo: { label: "To Do", variant: "secondary" },
  review: { label: "In Review", variant: "info" },
  low: { label: "Low", variant: "secondary" },
  medium: { label: "Medium", variant: "warning" },
  high: { label: "High", variant: "destructive" },
  urgent: { label: "Urgent", variant: "destructive" },
  upcoming: { label: "Upcoming", variant: "info" },
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  if (!config) return null;
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
