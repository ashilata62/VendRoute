// @ts-nocheck
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip
} from "recharts";
import {
  Route as RouteIcon, Users, CheckCircle2, XCircle, TrendingUp, AlertTriangle,
  AlertOctagon, MapPin, Plus, UserPlus, FileText, RefreshCw, Layers,
  BellCheck, X, ArrowUpRight, Info
} from "lucide-react";

import { useRouteStore } from "../store/routeStore";
import { useTrackingStore } from "../store/trackingStore";
import { useLocationStore } from "../store/locationStore";
import { useAuthStore } from "../store/authStore";
import { useNotificationStore } from "../store/notificationStore";
import PageHeader from "../components/shared/PageHeader";
import { formatCurrency } from "../lib/utils";
import { reportsApi } from "../services/api";
import DriverDashboardView from "../components/dashboard/DriverDashboardView";

// Leaflet Icon setup
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const createDriverIcon = (isOnline: boolean, type: string) => {
  const color = isOnline ? "#10B981" : "#64748B";
  const iconSvg = type === "truck"
    ? `<path d="M10 17h4M5 17h.01M19 17h.01M3 6h11v11H3zM14 10h4l3 3v4h-7z" stroke="white" stroke-width="2" fill="none"/>`
    : `<path d="M17 10h-2M19 17h.01M5 17h.01M3 6h11v11H3zM14 9h4l2 3v5h-6z" stroke="white" stroke-width="2" fill="none"/>`;

  return L.divIcon({
    html: `<div style="background:${color};width:34px;height:34px;border-radius:50%;border:2px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;">
      <svg width="18" height="18" viewBox="0 0 24 24">${iconSvg}</svg>
    </div>`,
    className: "",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
};

// Map Recenter Controller
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom(), { animate: true, duration: 1 });
  }, [center, map]);
  return null;
}

// Helper: format relative time from ISO timestamp
function timeAgo(ts: string): string {
  if (!ts) return "";
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (hours > 24) return `${Math.floor(hours / 24)}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins} mins ago`;
  return "Just now";
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isSupervisor = user?.role === "supervisor";
  const { liveLocations, seedLocationsFromDrivers } = useTrackingStore();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllRead } = useNotificationStore();

  const [mapCenter, setMapCenter] = useState<[number, number]>([19.0760, 72.8777]);
  const [movingLocations, setMovingLocations] = useState(liveLocations);
  const [mapTile, setMapTile] = useState<"standard" | "satellite">("standard");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Real data state
  const [routes, setRoutes] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [dbStats, setDbStats] = useState<any>(null);

  if (user?.role === "driver" || user?.role === "DRIVER") {
    return <DriverDashboardView />;
  }

  useEffect(() => {
    import("../services/api").then(({ routesApi, usersApi, locationsApi, reportsApi }) => {
      routesApi.getAll().then(res => { if (res.success) setRoutes(res.data); }).catch(() => {});
      usersApi.getAll("DRIVER").then(res => { 
        if (res.success) {
          setDrivers(res.data);
          seedLocationsFromDrivers(res.data.map((d: any) => d.id));
        }
      }).catch(() => {});
      locationsApi.getAll().then(res => { if (res.success) setLocations(res.data); }).catch(() => {});
      reportsApi.getDashboard().then((res) => {
        if (res.success) setDbStats(res.data);
      }).catch(() => {});
    });
    fetchNotifications();
  }, []);

  // Metrics — Real calculated values from stores
  const targetRoutes = routes.filter((r) => r.date === selectedDate || r.date?.startsWith(selectedDate));
  const totalRoutesToday = targetRoutes.length;
  const activeDriversCount = drivers.filter((d) => d.isOnline || d.liveStatus === "online" || d.liveStatus === "on-route").length;
  const totalDriversCount = drivers.length;
  
  const completedStopsCount = targetRoutes.reduce((acc, r) => acc + (r.routestop?.filter((s:any) => s.status === 'COMPLETED').length || 0), 0);
  const totalStopsCount = targetRoutes.reduce((acc, r) => acc + (r.routestop?.length || 0), 0);
  const missedStopsCount = targetRoutes.reduce((acc, r) => acc + (r.routestop?.filter((s:any) => s.status === 'MISSED' || s.status === 'FAILED').length || 0), 0);
  
  const machineAlertsCount = locations.filter((l) => l.status === "needs-service" || l.status === "offline").length;
  const todayRevenue = targetRoutes.reduce((acc, r) => acc + (r.routestop?.reduce((sum: number, s:any) => sum + (Number(s.cashCollected) || 0), 0) || 0), 0);

  // Donut chart machine status
  const machineStatusCounts = useMemo(() => {
    const op = locations.filter((l) => l.status === "operational").length;
    const ns = locations.filter((l) => l.status === "needs-service").length;
    const off = locations.filter((l) => l.status === "offline").length;
    return [
      { name: "Operational", value: op, color: "#10B981" },
      { name: "Needs Service", value: ns, color: "#F59E0B" },
      { name: "Offline", value: off, color: "#EF4444" },
    ];
  }, [locations]);

  useEffect(() => {
    setMovingLocations(liveLocations);
  }, [liveLocations]);

  // Map backend notification type → dashboard icon type
  const notifTypeToAlertType = (type: string) => {
    if (type === "error") return "emergency";
    if (type === "warning") return "machine";
    if (type === "success") return "route";
    return "route"; // info
  };

  // Map backend notification type → severity label
  const notifTypeToSeverity = (type: string) => {
    if (type === "error") return "Critical";
    if (type === "warning") return "Warning";
    return "Info";
  };

  const handleMarkAllRead = () => {
    markAllRead();
  };

  const handleDismissAlert = (id: string) => {
    markAsRead(id);
  };

  // Active Route Progress calculation
  const activeRoutesProgress = useMemo(() => {
    return targetRoutes.slice(0, 4).map((r) => {
      const driverName = (r as any).user?.name || (r as any).driver?.name || "Driver";
      const totalStops = r.routestop?.length || 0;
      const completed = r.routestop?.filter((s:any) => s.status === 'COMPLETED').length || 0;
      let pct = totalStops > 0 ? Math.round((completed / totalStops) * 100) : 0;
      if (totalStops === 0 && r.status === "COMPLETED") pct = 100;
      
      const avatarUrl = (r as any).user?.avatar || (r as any).driver?.photo ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(driverName)}&background=3B82F6&color=fff&size=32`;
      return {
        id: r.id,
        name: r.name,
        driverId: r.driverId,
        driverName,
        avatar: avatarUrl,
        percentage: pct,
        status: r.status,
      };
    });
  }, [routes]);


  const totalProgressPct = Math.round(
    activeRoutesProgress.reduce((acc, r) => acc + r.percentage, 0) / (activeRoutesProgress.length || 1)
  );

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Dashboard"
        description={`Overview of operations for ${selectedDate}`}
        action={
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-200 rounded-lg shadow-sm">
            <label className="text-xs font-bold text-slate-500 uppercase">Select Date:</label>
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-sm font-bold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
            />
          </div>
        }
      />

      {/* TOP ROW: KPI Cards */}
      <div className={`grid grid-cols-2 sm:grid-cols-3 ${isSupervisor ? "lg:grid-cols-5" : "lg:grid-cols-6"} gap-4`}>
        {/* Card 1: Today's Routes */}
        <motion.div
          whileHover={{ y: -3 }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="stat-card flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Selected Date Routes</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <RouteIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900">{totalRoutesToday}</p>
          </div>
        </motion.div>

        {/* Card 2: Active Drivers */}
        <motion.div
          whileHover={{ y: -3 }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="stat-card flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Active Drivers</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900">{activeDriversCount}</p>
            <p className="text-xs text-slate-400 mt-1">{activeDriversCount} of {totalDriversCount} online</p>
          </div>
        </motion.div>

        {/* Card 3: Completed Stops Circular */}
        <motion.div
          whileHover={{ y: -3 }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="stat-card flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Completed Stops</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center text-cyan-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <p className="text-xl font-bold text-slate-900">{completedStopsCount}/{totalStopsCount}</p>
              <p className="text-xs text-slate-400 mt-1">{totalStopsCount > 0 ? Math.round((completedStopsCount / totalStopsCount) * 100) : 0}% target</p>
            </div>
            {/* SVG Circular Progress */}
            <div className="relative w-10 h-10 flex items-center justify-center">
              <svg className="w-10 h-10 transform -rotate-90">
                <circle cx="20" cy="20" r="16" stroke="#E2E8F0" strokeWidth="3" fill="transparent" />
                <circle
                  cx="20" cy="20" r="16"
                  stroke="#06B6D4" strokeWidth="3" fill="transparent"
                  strokeDasharray={100}
                  strokeDashoffset={100 - (totalStopsCount > 0 ? (completedStopsCount / totalStopsCount) * 100 : 0)}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </motion.div>

        {/* Card 4: Missed Stops */}
        <motion.div
          whileHover={{ y: -3 }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="stat-card flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Missed Stops</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-danger">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-2xl font-bold text-slate-900">{missedStopsCount}</p>
            {missedStopsCount > 0 && (
              <span className="bg-red-50 text-danger border border-red-200 text-xs font-semibold px-2 py-0.5 rounded-full">
                Attention
              </span>
            )}
          </div>
        </motion.div>

        {!isSupervisor && (
          /* Card 5: Revenue Overview Sparkline */
          <motion.div
            whileHover={{ y: -3 }}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            className="stat-card flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Revenue ({selectedDate})</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-lg font-bold text-slate-900">{formatCurrency(todayRevenue)}</p>
              {/* Sparkline mini representation */}
              <div className="flex items-end gap-1 h-4 mt-2">
                <div className="w-1.5 h-2 bg-blue-300 rounded-sm" />
                <div className="w-1.5 h-3 bg-blue-400 rounded-sm" />
                <div className="w-1.5 h-2 bg-blue-300 rounded-sm" />
                <div className="w-1.5 h-4 bg-primary-600 rounded-sm" />
                <div className="w-1.5 h-3.5 bg-blue-500 rounded-sm" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Card 6: Machine Alerts */}
        <motion.div
          whileHover={{ y: -3 }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="stat-card flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Machine Alerts</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-2xl font-bold text-slate-900">{machineAlertsCount}</p>
            <span className="text-xs bg-amber-100 text-amber-800 font-medium px-2 py-0.5 rounded-full">
              {machineAlertsCount > 0 ? "Need attention" : "All good"}
            </span>
          </div>
        </motion.div>
      </div>

      {/* SECOND ROW: Live Vehicles Map (60%) + Live Alerts Panel (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Live Vehicles Map (6 cols = 60%) */}
        <div className="lg:col-span-6 bg-card rounded-lg border border-border shadow-sm overflow-hidden flex flex-col h-[440px]">
          <div className="p-4 border-b border-border flex items-center justify-between bg-white z-10">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Live Vehicles Map</h3>
              <p className="text-xs text-slate-400">Real-time fleet movement (Simulated updates every 5s)</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMapTile(mapTile === "standard" ? "satellite" : "standard")}
                className="p-1.5 text-slate-500 hover:text-slate-900 border border-border rounded-md text-xs flex items-center gap-1 bg-slate-50"
                title="Toggle layer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline capitalize">{mapTile}</span>
              </button>
              <button
                onClick={() => setMapCenter([19.0760, 72.8777])}
                className="p-1.5 text-slate-500 hover:text-slate-900 border border-border rounded-md text-xs flex items-center gap-1 bg-slate-50"
                title="Recenter"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Recenter</span>
              </button>
            </div>
          </div>

          <div className="flex-1 relative">
            <MapContainer
              center={mapCenter}
              zoom={11}
              className="h-full w-full"
            >
              <MapController center={mapCenter} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url={
                  mapTile === "standard"
                    ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                }
              />
              {movingLocations.slice(0, 4).map((loc) => {
                if (!loc || typeof loc.lat !== "number" || typeof loc.lng !== "number" || isNaN(loc.lat) || isNaN(loc.lng)) {
                  return null;
                }
                
                const driverMatch = drivers.find(d => d.id === loc.driverId);
                const driverName = driverMatch?.name || loc.driverName || "Driver";
                const vehicleModel = loc.vehicleModel || "Vehicle";
                const vehiclePlate = loc.vehiclePlate || "";
                const driverPhoto = driverMatch?.photo || loc.driverPhoto ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(driverName)}&background=3B82F6&color=fff&size=24`;
                const isOnline = driverMatch?.isOnline || driverMatch?.liveStatus === "online" || driverMatch?.liveStatus === "on-route" || true;

                return (
                  <Marker
                    key={loc.driverId || Math.random()}
                    position={[loc.lat, loc.lng]}
                    icon={createDriverIcon(isOnline, "van")}
                  >
                    <Popup>
                      <div className="p-1 text-xs space-y-1">
                        <div className="flex items-center gap-2">
                          <img src={driverPhoto} alt={driverName} className="w-6 h-6 rounded-full bg-slate-200" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                          <p className="font-bold text-slate-900">{driverName}</p>
                        </div>
                        <p className="text-slate-600">Vehicle: <span className="font-semibold">{vehicleModel} ({vehiclePlate})</span></p>
                        <p className="text-slate-600">Speed: <span className="font-semibold text-emerald-600">{loc.speed} km/h</span></p>
                        <p className="text-slate-400 text-[10px]">Updated: Just now</p>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>

        {/* Alerts Feed Panel (4 cols = 40%) */}
        <div className="lg:col-span-4 bg-card rounded-lg border border-border shadow-sm flex flex-col h-[440px]">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 text-sm">Live Alerts Feed</h3>
              {unreadCount > 0 && (
                <span className="bg-danger text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              <BellCheck className="w-3.5 h-3.5" /> Mark all read
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <AnimatePresence>
              {notifications.map((notif) => {
                const alertType = notifTypeToAlertType(notif.type);
                const severity = notifTypeToSeverity(notif.type);
                const severityStyles: Record<string, string> = {
                  Critical: "bg-red-50 text-red-700 border-red-200",
                  Warning: "bg-amber-50 text-amber-700 border-amber-200",
                  Info: "bg-blue-50 text-blue-700 border-blue-200",
                };

                const renderIcon = () => {
                  switch (alertType) {
                    case "emergency":
                      return <AlertOctagon className="w-4 h-4 text-red-600" />;
                    case "machine":
                      return <AlertTriangle className="w-4 h-4 text-amber-600" />;
                    case "route":
                      return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
                    default:
                      return <Info className="w-4 h-4 text-blue-600" />;
                  }
                };

                return (
                  <motion.div
                    key={notif.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={`p-3 rounded-lg border text-xs relative group transition-colors ${
                      notif.read ? "bg-slate-50 border-border" : "bg-white border-blue-200 shadow-sm"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 flex-shrink-0">{renderIcon()}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-semibold text-slate-900 truncate">{notif.title}</p>
                          <span className="text-[10px] text-slate-400 flex-shrink-0">{timeAgo(notif.timestamp)}</span>
                        </div>
                        <p className="text-slate-600 mt-1 line-clamp-2">{notif.message}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-medium ${severityStyles[severity]}`}>
                            {severity}
                          </span>
                          {!notif.read && <span className="w-2 h-2 rounded-full bg-blue-600" />}
                        </div>
                      </div>
                      {!notif.read && (
                        <button
                          onClick={() => handleDismissAlert(notif.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 transition-opacity"
                          title="Mark as read"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {notifications.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                <BellCheck className="w-8 h-8 opacity-30 mb-2" />
                <p className="text-xs font-medium">No active alerts</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* THIRD ROW: Machine Status Donut (50%) + Quick Actions (50%) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Machine Status Donut Chart */}
        <div className="bg-card rounded-lg border border-border shadow-sm p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-slate-900 text-sm">Machine Status</h3>
            <span className="text-xs text-slate-400">Total 25 machines</span>
          </div>

          <div className="relative h-44 flex items-center justify-center">
            {machineStatusCounts.reduce((acc, curr) => acc + curr.value, 0) > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={machineStatusCounts}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    dataKey="value"
                    paddingAngle={4}
                  >
                    {machineStatusCounts.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                <p className="text-xs font-semibold">No machine data</p>
              </div>
            )}
            {/* Donut Center Overlay */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-slate-900">{locations.length}</span>
              <span className="text-[10px] text-slate-400">Total</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 text-center border-t border-border pt-3">
            {machineStatusCounts.map((item) => (
              <div key={item.name} className="flex flex-col items-center">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-slate-500 font-medium">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-slate-900 mt-0.5">
                  {item.value} ({locations.length > 0 ? Math.round((item.value / locations.length) * 100) : 0}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-card rounded-lg border border-border shadow-sm p-6 flex flex-col justify-between">
          <h3 className="font-semibold text-slate-900 text-sm mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4 flex-1">
            {/* Action 1: Create Route */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/routes/create")}
              className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-50 text-left flex flex-col justify-between transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5" />
              </div>
              <div className="mt-3">
                <p className="font-semibold text-slate-900 text-sm">Create Route</p>
                <p className="text-xs text-slate-500 mt-0.5">Assign stops & driver</p>
              </div>
            </motion.button>

            {/* Action 2: Add Location */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/locations")}
              className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 text-left flex flex-col justify-between transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="mt-3">
                <p className="font-semibold text-slate-900 text-sm">Add Location</p>
                <p className="text-xs text-slate-500 mt-0.5">Register new machine</p>
              </div>
            </motion.button>

            {/* Action 3: Assign Driver */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/drivers")}
              className="p-4 rounded-xl border border-purple-100 bg-purple-50/50 hover:bg-purple-50 text-left flex flex-col justify-between transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <UserPlus className="w-5 h-5" />
              </div>
              <div className="mt-3">
                <p className="font-semibold text-slate-900 text-sm">Assign Driver</p>
                <p className="text-xs text-slate-500 mt-0.5">Manage fleet staff</p>
              </div>
            </motion.button>

            {/* Action 4: Generate Report */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/reports")}
              className="p-4 rounded-xl border border-amber-100 bg-amber-50/50 hover:bg-amber-50 text-left flex flex-col justify-between transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div className="mt-3">
                <p className="font-semibold text-slate-900 text-sm">Generate Report</p>
                <p className="text-xs text-slate-500 mt-0.5">Export operational data</p>
              </div>
            </motion.button>
          </div>
        </div>
      </div>

      {/* FOURTH ROW: Route Completion Progress */}
      <div className="bg-card rounded-lg border border-border shadow-sm p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Route Completion Progress</h3>
            <p className="text-xs text-slate-400">Overall today's completion rate across active field routes</p>
          </div>
          <span className="text-sm font-bold text-primary-600">{totalProgressPct}% Complete</span>
        </div>

        {/* Master Horizontal Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex mb-6">
          <div
            className="bg-primary-600 h-full transition-all duration-500 rounded-full"
            style={{ width: `${totalProgressPct}%` }}
          />
        </div>

        {/* Route Segments List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {activeRoutesProgress.length === 0 ? (
          <p className="text-xs text-slate-400 col-span-4 text-center py-4">No active routes today.</p>
        ) : (
          activeRoutesProgress.map((route) => (
            <div
              key={route.id}
              className="p-3 rounded-lg border border-border bg-slate-50/80 hover:bg-slate-100 transition-colors relative group"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <img src={route.avatar || ''} alt={route.driverName} className="w-7 h-7 rounded-full object-cover bg-slate-200" onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(route.driverName)}&background=3B82F6&color=fff&size=28`; }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">{route.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{route.driverName}</p>
                </div>
                <span className="text-xs font-bold text-slate-700">{route.percentage}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${route.percentage}%` }}
                />
              </div>

              {/* Hover Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900 text-white text-[10px] py-1 px-2 rounded shadow-md whitespace-nowrap z-20 pointer-events-none">
                {route.name}: {route.percentage}% done
              </div>
            </div>
          ))
        )}
        </div>
      </div>
    </div>
  );
}

