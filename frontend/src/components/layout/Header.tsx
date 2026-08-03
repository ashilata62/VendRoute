import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, Search, Bell, ChevronDown, LogOut, User, Settings, X, Sun, Moon } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useNotificationStore } from "../../store/notificationStore";
import { cn } from "../../lib/utils";
import { mockLocations, mockDrivers, mockRoutes } from "../../data/mockData";
import brandLogo from "../../assets/maryland-logo.png";

interface HeaderProps {
  collapsed: boolean;
  onToggleSidebar: () => void;
}

const breadcrumbMap: Record<string, string> = {
  dashboard: "Dashboard",
  routes: "Route Management",
  tracking: "Live Tracking",
  locations: "Vending Locations",
  stops: "Stops",
  drivers: "Drivers",
  vehicles: "Vehicles",
  customers: "Customers",
  reports: "Reports",
  notifications: "Notifications",
  users: "Users & Roles",
  settings: "Settings",
  create: "Create New",
};

export default function Header({ collapsed, onToggleSidebar }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const searchResults = (() => {
    if (!searchValue.trim()) return { locations: [], drivers: [], routes: [] };
    const q = searchValue.toLowerCase();
    return {
      locations: mockLocations.filter(
        (l) =>
          l.machineId.toLowerCase().includes(q) ||
          l.customerName.toLowerCase().includes(q) ||
          l.address.toLowerCase().includes(q)
      ).slice(0, 3),
      drivers: mockDrivers.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.phone.toLowerCase().includes(q)
      ).slice(0, 3),
      routes: mockRoutes.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q)
      ).slice(0, 3),
    };
  })();

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("app-theme") === "Dark" ? "Dark" : "Light";
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setTheme(localStorage.getItem("app-theme") === "Dark" ? "Dark" : "Light");
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "Light" ? "Dark" : "Light";
    setTheme(nextTheme);
    localStorage.setItem("app-theme", nextTheme);
    const root = document.documentElement;
    if (nextTheme === "Dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    window.dispatchEvent(new Event("storage"));
  };

  const segments = location.pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((seg, i) => ({
    label: breadcrumbMap[seg] || seg,
    path: "/" + segments.slice(0, i + 1).join("/"),
  }));

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header
      className={cn(
        "fixed top-0 right-0 h-16 bg-white border-b border-slate-200/80 z-20 flex items-center px-3 sm:px-4 md:px-6 gap-2 sm:gap-4 transition-all duration-300 left-0",
        collapsed ? "md:left-20" : "md:left-64"
      )}
    >
      {/* Hamburger Toggle */}
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors flex-shrink-0 cursor-pointer"
        title="Toggle Menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0 overflow-hidden whitespace-nowrap">
        <div className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0 hidden sm:flex border border-slate-200">
          <img src={brandLogo} alt="Logo" className="w-full h-full object-cover" />
        </div>
        <span className="text-slate-400 font-semibold hidden sm:inline">Maryland Vending</span>
        {breadcrumbs.map((bc, i) => (
          <span key={bc.path} className="flex items-center gap-1.5 min-w-0">
            <span className="text-slate-300 hidden sm:inline">/</span>
            <span
              className={cn(
                "cursor-pointer transition-colors truncate max-w-[100px] sm:max-w-[160px]",
                i === breadcrumbs.length - 1
                  ? "text-slate-900 font-bold"
                  : "text-slate-400 hover:text-blue-600"
              )}
              onClick={() => navigate(bc.path)}
            >
              {bc.label}
            </span>
          </span>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Mobile Search Toggle */}
      <button
        onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
        className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors md:hidden cursor-pointer"
      >
        {mobileSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
      </button>

      {/* Desktop Search */}
      <div className="relative hidden md:flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search routes, drivers, locations..."
          value={searchValue}
          onFocus={() => setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl w-48 lg:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700 placeholder:text-slate-400"
        />

        {/* Desktop Autocomplete Results */}
        {showResults && searchValue.trim() && (
          <div className="absolute top-11 left-0 w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-3.5 max-h-[360px] overflow-y-auto z-50 text-slate-800 space-y-3">
            {/* Locations (Vending Machines) */}
            {searchResults.locations.length > 0 && (
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vending Machines</p>
                <div className="space-y-0.5">
                  {searchResults.locations.map((loc) => (
                    <div
                      key={loc.id}
                      onClick={() => {
                        navigate(`/locations/${loc.id}`);
                        setSearchValue("");
                        setShowResults(false);
                      }}
                      className="flex justify-between items-center px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <span className="text-xs font-semibold text-slate-700 truncate max-w-[150px]">{loc.customerName}</span>
                      <span className="text-[9px] font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-500">{loc.machineId}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Drivers */}
            {searchResults.drivers.length > 0 && (
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Drivers</p>
                <div className="space-y-0.5">
                  {searchResults.drivers.map((drv) => (
                    <div
                      key={drv.id}
                      onClick={() => {
                        navigate(`/drivers`);
                        setSearchValue("");
                        setShowResults(false);
                      }}
                      className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <img src={drv.photo} alt="" className="w-4.5 h-4.5 rounded-full object-cover" />
                      <span className="text-xs font-semibold text-slate-700">{drv.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Routes */}
            {searchResults.routes.length > 0 && (
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Routes</p>
                <div className="space-y-0.5">
                  {searchResults.routes.map((rt) => (
                    <div
                      key={rt.id}
                      onClick={() => {
                        navigate(`/routes`);
                        setSearchValue("");
                        setShowResults(false);
                      }}
                      className="flex justify-between items-center px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <span className="text-xs font-semibold text-slate-700 truncate max-w-[160px]">{rt.name}</span>
                      <span className="text-[9px] font-mono text-blue-600 font-bold">#{rt.id}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchResults.locations.length === 0 && searchResults.drivers.length === 0 && searchResults.routes.length === 0 && (
              <div className="text-center py-3 text-xs text-slate-400 font-medium">
                No records match query.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Search Dropdown */}
      {mobileSearchOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b border-slate-200 p-3 shadow-lg md:hidden z-30">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search routes, locations..."
              value={searchValue}
              onFocus={() => setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
              onChange={(e) => setSearchValue(e.target.value)}
              autoFocus
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-400"
            />

            {/* Mobile Autocomplete Results overlay */}
            {showResults && searchValue.trim() && (
              <div className="absolute left-0 right-0 bg-white border border-slate-200 mt-2 rounded-xl shadow-xl p-3 max-h-[280px] overflow-y-auto z-50 text-slate-800 space-y-3">
                {searchResults.locations.length > 0 && (
                  <div>
                    <p className="text-[9px] font-bold text-slate-450 uppercase mb-1">Machines</p>
                    {searchResults.locations.map((loc) => (
                      <div
                        key={loc.id}
                        onClick={() => {
                          navigate(`/locations/${loc.id}`);
                          setSearchValue("");
                          setShowResults(false);
                          setMobileSearchOpen(false);
                        }}
                        className="flex justify-between items-center py-1 hover:bg-slate-50 px-1 rounded text-xs text-slate-700"
                      >
                        <span>{loc.customerName}</span>
                        <span className="text-[9px] font-mono text-slate-400">{loc.machineId}</span>
                      </div>
                    ))}
                  </div>
                )}
                {searchResults.drivers.length === 0 && searchResults.locations.length === 0 && (
                  <p className="text-center text-xs text-slate-405 py-2">No matching items.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors flex-shrink-0 cursor-pointer"
        title={theme === "Light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
      >
        {theme === "Light" ? (
          <Moon className="w-5 h-5" />
        ) : (
          <Sun className="w-5 h-5 text-amber-500" />
        )}
      </button>

      {/* Notification Bell */}
      <button
        onClick={() => navigate("/notifications")}
        className="relative p-2 rounded-xl hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-colors flex-shrink-0 cursor-pointer"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-blue-600 text-white text-[10px] rounded-full flex items-center justify-center font-bold shadow-sm shadow-blue-600/30 animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Profile Dropdown */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className="flex items-center gap-2 p-1 sm:pl-2 sm:pr-3 sm:py-1.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
        >
          <img
            src={user?.avatar}
            alt={user?.name}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-200 shadow-sm"
          />
          <div className="hidden lg:block text-left">
            <p className="text-xs font-bold text-slate-800 leading-tight">{user?.name}</p>
            <p className="text-[10px] text-slate-400 font-semibold capitalize">
              {user?.role === "superadmin" ? "Super Admin" : user?.role}
            </p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
        </button>

        {profileOpen && (
          <>
            {/* Click-away overlay */}
            <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
              {/* User info header */}
              <div className="px-4 py-3 bg-gradient-to-br from-[#ff3b3b] to-[#4f46e5] text-white">
                <div className="flex items-center gap-3">
                  <img src={user?.avatar} alt="" className="w-10 h-10 rounded-full border-2 border-white/30 shadow-md" />
                  <div>
                    <p className="text-sm font-bold">{user?.name}</p>
                    <p className="text-[11px] opacity-80 truncate">{user?.email}</p>
                  </div>
                </div>
              </div>
              <div className="p-1.5">
                <button
                  onClick={() => { navigate("/settings?profile=true"); setProfileOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4 text-slate-400" /> Profile & Account
                </button>
                <button
                  onClick={() => { navigate("/settings"); setProfileOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-slate-400" /> System Settings
                </button>
                <div className="my-1 border-t border-slate-100" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
