import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Route, Satellite, MapPin, StopCircle,
  Users, Truck, Building2, BarChart3, Bell, UserCog, Settings,
  ChevronLeft, ChevronRight, X, User, LogOut
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuthStore } from "../../store/authStore";
import brandLogo from "../../assets/maryland-logo.png";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const navItems = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard", emoji: "🏠" },
  { path: "/routes", icon: Route, label: "Routes", emoji: "🗺️" },
  { path: "/tracking", icon: Satellite, label: "Live Tracking", emoji: "📍" },
  { path: "/locations", icon: MapPin, label: "Vending Machines", emoji: "🥤" },
  { path: "/stops", icon: StopCircle, label: "Stops", emoji: "📋" },
  { path: "/drivers", icon: Users, label: "Drivers", emoji: "👨‍✈️" },
  { path: "/vehicles", icon: Truck, label: "Vehicles", emoji: "🚚" },
  { path: "/customers", icon: Building2, label: "Customers / Locations", emoji: "👥" },
  { path: "/reports", icon: BarChart3, label: "Reports", emoji: "📊" },
  { path: "/notifications", icon: Bell, label: "Notifications", emoji: "🔔" },
  { path: "/users", icon: UserCog, label: "Users & Roles", emoji: "👤" },
  { path: "/settings", icon: Settings, label: "Settings", emoji: "⚙️" },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onCloseMobile }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();

  const handleLogout = () => {
    logout();
    onCloseMobile();
    navigate("/login");
  };

  const isSuperAdmin = user?.role === "superadmin";
  const isSupervisor = user?.role === "supervisor";

  const allowedNavItems = navItems.filter((item) => {
    // Read dynamic permission matrix from localStorage
    const savedPermsStr = localStorage.getItem("role-permissions");
    let permissions: any = null;
    if (savedPermsStr) {
      try { permissions = JSON.parse(savedPermsStr); } catch {}
    }

    const roleKey = isSupervisor ? "supervisor" : isSuperAdmin ? "superadmin" : "driver";
    const rolePerms = permissions?.[roleKey];

    if (rolePerms) {
      if (item.path === "/routes" && rolePerms.routes === false) return false;
      if (item.path === "/users" && rolePerms.users === false) return false;
      if (item.path === "/reports" && rolePerms.reports === false) return false;
      if (item.path === "/customers" && rolePerms.regions === false) return false;
    }

    if (isSupervisor) {
      return !["/customers", "/users", "/settings"].includes(item.path);
    }
    return true;
  });

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Drawer Container */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full bg-[#0B1536] border-r border-slate-800/80 shadow-2xl z-50 md:z-30 flex flex-col transition-all duration-300 overflow-hidden",
          mobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0",
          collapsed ? "md:w-20" : "md:w-64"
        )}
      >
        {/* Logo Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800/80 flex-shrink-0 bg-[#070E28]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white shadow-lg shadow-red-600/30 flex items-center justify-center overflow-hidden border border-white/20 flex-shrink-0">
              <img
                src={localStorage.getItem("company-logo") || brandLogo}
                alt="Company Logo"
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = brandLogo; }}
              />
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="truncate">
                <p className="font-bold text-white text-[13px] leading-tight tracking-tight flex items-center gap-0.5">
                  {(() => {
                    const savedComp = localStorage.getItem("company-settings");
                    if (savedComp) {
                      try { return JSON.parse(savedComp).orgName || "Maryland Vending"; } catch { }
                    }
                    return "Maryland Vending";
                  })()}
                </p>
                <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                  {isSuperAdmin ? "Super Admin Portal" : isSupervisor ? "Supervisor Portal" : "Field Operations"}
                </p>
              </div>
            )}
          </div>

          {/* Close button for Mobile Drawer */}
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 md:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1.5 no-scrollbar">
          {allowedNavItems.map((item) => {
            const isActive = item.path === "/settings"
              ? (location.pathname === "/settings" && !location.search.includes("profile=true"))
              : (location.pathname === item.path || location.pathname.startsWith(item.path + "/"));
            const isCollapsedDesktop = collapsed && !mobileOpen;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                title={isCollapsedDesktop ? `${item.emoji} ${item.label}` : undefined}
                className={cn(
                  "sidebar-link group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all duration-200",
                  isActive
                    ? "bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/30"
                    : "text-slate-300 font-medium hover:bg-slate-800/70 hover:text-white",
                  isCollapsedDesktop && "justify-center px-0"
                )}
              >
                {isCollapsedDesktop ? (
                  <span className="text-base flex-shrink-0" role="img" aria-label={item.label}>
                    {item.emoji}
                  </span>
                ) : (
                  <>
                    <span className="text-sm" role="img" aria-label={item.label}>
                      {item.emoji}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}

          {/* Divider */}
          <div className="my-3 border-t border-slate-800/80" />

          {/* Profile & Logout Section at the bottom of standard list */}
          {[
            {
              path: "/profile",
              icon: User,
              label: "Profile",
              onClick: () => {
                onCloseMobile();
                navigate("/profile");
              },
            },
            {
              path: "/login",
              icon: LogOut,
              label: "Logout",
              onClick: handleLogout,
            },
          ].map((item) => {
            const isActive = location.pathname === item.path;
            const isCollapsedDesktop = collapsed && !mobileOpen;

            return (
              <button
                key={item.label}
                onClick={item.onClick}
                title={isCollapsedDesktop ? item.label : undefined}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all duration-200 text-left cursor-pointer",
                  isActive
                    ? "bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/30"
                    : item.label === "Logout"
                    ? "text-red-400 font-medium hover:bg-red-950/30 hover:text-red-300"
                    : "text-slate-300 font-medium hover:bg-slate-800/70 hover:text-white",
                  isCollapsedDesktop && "justify-center px-0"
                )}
              >
                <item.icon
                  className={cn(
                    "flex-shrink-0 w-4 h-4 transition-colors",
                    isActive ? "text-white" : item.label === "Logout" ? "text-red-400" : "text-slate-400 group-hover:text-blue-400"
                  )}
                />
                {!isCollapsedDesktop && (
                  <span className="truncate">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Desktop Collapse Toggle */}
        <div className="p-3 border-t border-slate-800/80 hidden md:block bg-[#070E28]">
          <button
            onClick={onToggle}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800/70 hover:text-slate-200 transition-colors cursor-pointer",
              collapsed && "justify-center px-0"
            )}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse Menu</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
