import { cn } from "../../lib/utils";

type Status =
  | "operational" | "needs-service" | "offline"
  | "active" | "inactive"
  | "online" | "offline" | "on-route"
  | "scheduled" | "completed" | "cancelled"
  | "pending" | "in-progress" | "missed"
  | "available" | "in-use" | "maintenance"
  | "superadmin" | "manager" | "driver" | "viewer"
  | string;

const statusConfig: Record<string, { label: string; className: string }> = {
  operational: { label: "Operational", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "needs-service": { label: "Needs Service", className: "bg-amber-50 text-amber-700 border-amber-200" },
  offline: { label: "Offline", className: "bg-red-50 text-red-700 border-red-200" },
  active: { label: "Active", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  inactive: { label: "Inactive", className: "bg-slate-50 text-slate-500 border-slate-200" },
  online: { label: "Online", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "on-route": { label: "On Route", className: "bg-blue-50 text-blue-700 border-blue-200" },
  scheduled: { label: "Scheduled", className: "bg-slate-50 text-slate-600 border-slate-200" },
  completed: { label: "Completed", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled: { label: "Cancelled", className: "bg-red-50 text-red-700 border-red-200" },
  pending: { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-200" },
  "in-progress": { label: "In Progress", className: "bg-blue-50 text-blue-700 border-blue-200" },
  missed: { label: "Missed", className: "bg-red-50 text-red-700 border-red-200" },
  available: { label: "Available", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "in-use": { label: "In Use", className: "bg-blue-50 text-blue-700 border-blue-200" },
  maintenance: { label: "Maintenance", className: "bg-amber-50 text-amber-700 border-amber-200" },
  superadmin: { label: "Admin", className: "bg-purple-50 text-purple-700 border-purple-200" },
  supervisor: { label: "Supervisor", className: "bg-blue-50 text-blue-700 border-blue-200" },
  driver: { label: "Driver", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  viewer: { label: "Viewer", className: "bg-slate-50 text-slate-500 border-slate-200" },
};

interface StatusBadgeProps {
  status: Status;
  withDot?: boolean;
  className?: string;
}

export default function StatusBadge({ status, withDot = false, className }: StatusBadgeProps) {
  const normalizedStatus = (status || "").toLowerCase().replace("_", "-");
  const config = statusConfig[normalizedStatus] || { label: status, className: "bg-slate-50 text-slate-600 border-slate-200" };
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full border", config.className, className)}>
      {withDot && (
        <span className={cn("w-1.5 h-1.5 rounded-full",
          normalizedStatus === "operational" || normalizedStatus === "active" || normalizedStatus === "online" || normalizedStatus === "completed" || normalizedStatus === "available" ? "bg-emerald-500" :
          normalizedStatus === "needs-service" || normalizedStatus === "pending" || normalizedStatus === "maintenance" ? "bg-amber-500" :
          normalizedStatus === "offline" || normalizedStatus === "inactive" || normalizedStatus === "cancelled" || normalizedStatus === "missed" ? "bg-red-500" :
          "bg-blue-500"
        )} />
      )}
      {config.label}
    </span>
  );
}
