import { useState, useEffect } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";
import Header from "./Header";
import DriverMobileLayout from "./DriverMobileLayout";
import { useAuthStore } from "../../store/authStore";

export default function MainLayout() {
  const { isAuthenticated, user } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (user?.role?.toLowerCase() === "driver") {
    return <DriverMobileLayout />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans overflow-x-hidden">
      {/* Sidebar Component */}
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          collapsed ? "md:ml-20" : "md:ml-64"
        } ml-0`}
      >
        {/* Header Component */}
        <Header
          collapsed={collapsed}
          onToggleSidebar={() => {
            if (window.innerWidth < 768) {
              setMobileOpen(!mobileOpen);
            } else {
              setCollapsed(!collapsed);
            }
          }}
        />

        {/* Page Main View */}
        <main className="flex-1 mt-16 p-3 sm:p-4 md:p-6 overflow-x-hidden max-w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
