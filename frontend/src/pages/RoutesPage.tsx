import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Plus, Search, Eye, Trash2, MapPin,
  ChevronLeft, ChevronRight, Navigation, Play, X,
  Check, Edit3
} from "lucide-react";

import { useRouteStore } from "../store/routeStore";
import { usersApi, locationsApi, vehiclesApi } from "../services/api";
import { getSocket } from "../services/socket";
import StatusBadge from "../components/shared/StatusBadge";
import PageHeader from "../components/shared/PageHeader";
import { formatDate } from "../lib/utils";
import type { Route, RouteStatus } from "../types";

// Leaflet default icon fix
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Map Controller for Preview & Replay
function MapFlyController({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom || 12, { animate: true, duration: 1 });
  }, [center, zoom, map]);
  return null;
}

export default function RoutesPage() {
  const navigate = useNavigate();
  const { routes, createRoute, deleteRoute, fetchRoutes } = useRouteStore();

  // Real data from backend
  const [drivers, setDrivers] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);

  useEffect(() => {
    fetchRoutes();
    // Fetch real drivers (DRIVER role users)
    usersApi.getAll("DRIVER").then((res) => {
      if (res.success) setDrivers(res.data);
    }).catch(() => {});
    // Fetch real locations for stop picker
    locationsApi.getAll().then((res) => {
      if (res.success) setLocations(res.data);
    }).catch(() => {});
    // Fetch real vehicles
    vehiclesApi.getAll().then((res) => {
      if (res.success) setVehicles(res.data);
    }).catch(() => {});

    // 🔌 Real-time WebSocket connection for instant driver check-in sync
    const socket = getSocket();
    const handleUpdate = () => fetchRoutes();

    socket.on("stop:updated", handleUpdate);
    socket.on("route:updated", handleUpdate);
    socket.on("notification:new", handleUpdate);

    // ⏱️ Auto-polling every 4 seconds as a fallback
    const interval = setInterval(fetchRoutes, 4000);

    return () => {
      socket.off("stop:updated", handleUpdate);
      socket.off("route:updated", handleUpdate);
      socket.off("notification:new", handleUpdate);
      clearInterval(interval);
    };
  }, [fetchRoutes]);

  // Tab State
  const [activeTab, setActiveTab] = useState<"active" | "scheduled" | "reached" | "completed" | "calendar">("active");

  // Filters State
  const [search, setSearch] = useState("");
  const [driverFilter, setDriverFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<RouteStatus | "all">("all");
  const [dateFilter, setDateFilter] = useState("");

  // Modal / Detail States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [detailRoute, setDetailRoute] = useState<Route | null>(null);
  const [routeToDelete, setRouteToDelete] = useState<Route | null>(null);
  const [routeToEdit, setRouteToEdit] = useState<Route | null>(null);
  const [editForm, setEditForm] = useState({
    driverId: "",
    vehicleId: "",
  });
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayStep, setReplayStep] = useState(0);

  // Calendar State (Initializes dynamically to Real Current Month & Date)
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(new Date().toISOString().split("T")[0]);

  // Create Form State
  const [createForm, setCreateForm] = useState({
    name: "",
    date: new Date().toISOString().split("T")[0],
    driverId: "",
    vehicleId: "",
    autoOptimize: true,
    notes: "",
    stops: [] as string[],
  });

  // Filtered Routes Logic
  const filteredRoutes = useMemo(() => {
    return routes.filter((r) => {
      let matchTab = true;
      const stops = (r as any).stops || (r as any).routestop || [];
      const hasReachedStop = Array.isArray(stops) && stops.some((s: any) => s.status === "REACHED");

      if (activeTab === "active") matchTab = r.status === "IN_PROGRESS";
      else if (activeTab === "scheduled") matchTab = r.status === "PENDING" && !hasReachedStop;
      else if (activeTab === "reached") matchTab = r.status === "REACHED" || hasReachedStop || (r.status === "IN_PROGRESS" && hasReachedStop);
      else if (activeTab === "completed") matchTab = r.status === "COMPLETED";

      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      const matchDriver = driverFilter === "all" || r.driverId === driverFilter;
      const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase());
      const matchDate = !dateFilter || r.date === dateFilter;

      return matchTab && matchStatus && matchDriver && matchSearch && matchDate;
    });
  }, [routes, activeTab, statusFilter, driverFilter, search, dateFilter]);

  // Create Form Selected Locations & Coordinates
  const selectedLocationObjs = useMemo(() => {
    return createForm.stops
      .map((id) => locations.find((l: any) => l.id === id))
      .filter(Boolean);
  }, [createForm.stops, locations]);

  const previewPolylineCoords: [number, number][] = useMemo(() => {
    return selectedLocationObjs
      .filter((loc: any) => loc?.latitude && loc?.longitude)
      .map((loc: any) => [loc.latitude, loc.longitude]);
  }, [selectedLocationObjs]);

  const previewCenter: [number, number] = useMemo(() => {
    if (previewPolylineCoords.length > 0) return previewPolylineCoords[0];
    return [19.0760, 72.8777];
  }, [previewPolylineCoords]);

  // Detail Modal Coordinates & Map Center
  const detailPolylineCoords: [number, number][] = useMemo(() => {
    if (!detailRoute) return [];
    const stops = (detailRoute as any).routestop || (detailRoute as any).stops || [];
    const coords: [number, number][] = [];
    stops.forEach((s: any) => {
      const locId = typeof s === 'string' ? s : s.locationId;
      const loc = (typeof s === 'object' && s.location) ? s.location : locations.find((l: any) => l.id === locId);
      if (loc && loc.latitude && loc.longitude) {
        const lat = Number(loc.latitude);
        const lng = Number(loc.longitude);
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
          coords.push([lat, lng]);
        }
      }
    });
    return coords;
  }, [detailRoute, locations]);

  const detailMapCenter: [number, number] = useMemo(() => {
    if (detailPolylineCoords.length > 0) return detailPolylineCoords[0];
    return [19.0760, 72.8777];
  }, [detailPolylineCoords]);

  // Handle Form Submit
  const handleSaveRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (createForm.stops.length === 0) {
      alert("Please select at least one location stop to create a route.");
      return;
    }

    const success = await createRoute({
      name: createForm.name || "New Field Route",
      date: createForm.date,
      driverId: createForm.driverId || (drivers.length > 0 ? drivers[0].id : undefined),
      vehicleId: createForm.vehicleId || (vehicles && vehicles.length > 0 ? vehicles[0].id : undefined),
      status: "PENDING",
      stops: createForm.stops,
      totalDistance: createForm.stops.length * 8 + 12,
      estimatedTime: createForm.stops.length * 30 + 45,
      actualTime: null,
      startTime: null,
      endTime: null,
    });
    
    if (success) {
      setIsCreateModalOpen(false);
      setActiveTab("scheduled");
      setCreateForm({
        name: "",
        date: new Date().toISOString().split("T")[0],
        driverId: "",
        vehicleId: "",
        autoOptimize: true,
        notes: "",
        stops: [],
      });
    }
  };

  // Replay animation effect
  useEffect(() => {
    if (!isReplaying || !detailRoute) return;
    const interval = setInterval(() => {
      setReplayStep((prev) => {
        const stopsCount = (detailRoute as any).routestop?.length || detailRoute.stops?.length || 3;
        if (prev >= stopsCount - 1) {
          setIsReplaying(false);
          return 0;
        }
        return prev + 1;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [isReplaying, detailRoute]);

  // Calendar calculations
  const calendarDays = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayRoutes = routes.filter((r) => {
        const rDate = r.date ? new Date(r.date).toISOString().split("T")[0] : (r.createdAt ? new Date(r.createdAt).toISOString().split("T")[0] : "");
        return rDate === dateStr;
      });
      days.push({ dateStr, day: d, dayRoutes });
    }
    return days;
  }, [currentMonthDate, routes]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Title and Create Button */}
      <PageHeader
        title="Route Management"
        description="Plan, schedule, and optimize field service routes."
        action={
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Route
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-border pb-1 gap-y-2">
        <div className="flex flex-wrap gap-1.5 overflow-x-auto">
          {[
            { id: "active", label: "Active Routes" },
            { id: "scheduled", label: "Scheduled" },
            // { id: "reached", label: "Reached" },
            { id: "completed", label: "Completed" },
            { id: "calendar", label: "Calendar View" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab.id
                  ? "bg-primary-50 text-primary-700 border border-primary-100"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TABS CONTENT: ACTIVE / SCHEDULED / COMPLETED DATATABLE */}
      {activeTab !== "calendar" && (
        <div className="space-y-4">
          {/* Filters Row */}
          <div className="bg-card rounded-lg border border-border p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search route by name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full">
              {/* Driver Dropdown */}
              <select
                value={driverFilter}
                onChange={(e) => setDriverFilter(e.target.value)}
                className="px-3 py-2 text-xs border border-border rounded-lg bg-white focus:outline-none text-slate-700"
              >
                <option value="all">All Drivers</option>
                {drivers.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>

              {/* Status Dropdown */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 text-xs border border-border rounded-lg bg-white focus:outline-none text-slate-700"
              >
                <option value="all">All Statuses</option>
                <option value="PENDING">Scheduled</option>
                <option value="IN_PROGRESS">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              {/* Date Filter */}
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 text-xs border border-border rounded-lg bg-white focus:outline-none text-slate-700"
              />
            </div>
          </div>

          {/* DataTable */}
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[960px]">
              <thead className="bg-slate-50 border-b border-border text-xs text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3 w-24">Route ID</th>
                  <th className="px-4 py-3 w-40">Name</th>
                  <th className="px-4 py-3 w-36">Driver</th>
                  <th className="px-4 py-3 w-32">Vehicle</th>
                  <th className="px-4 py-3 w-16">Stops</th>
                  <th className="px-4 py-3 w-32">Progress</th>
                  <th className="px-4 py-3 w-28">Status</th>
                  <th className="px-4 py-3 w-20">ETA</th>
                  <th className="px-4 py-3 w-32 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRoutes.map((route) => {
                  const routeStops = (route as any).routestop || route.stops || [];
                  const completedStops = routeStops.filter((s: any) => s.status === "COMPLETED").length;
                  const totalStops = routeStops.length;
                  const hasReached = routeStops.some((s: any) => s.status === "REACHED") || route.status === "REACHED";
                  const displayStatus = route.status === "COMPLETED" ? "completed" : (hasReached ? "reached" : (route.status === "IN_PROGRESS" ? "in-progress" : route.status));
                  const pct = totalStops === 0 ? 0 : Math.round((completedStops / totalStops) * 100) || (route.status === "COMPLETED" ? 100 : (hasReached || route.status === "IN_PROGRESS") ? 60 : 0);

                  return (
                    <tr key={route.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 w-24 font-mono text-xs font-semibold text-slate-600 whitespace-nowrap">
                        {route.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3 w-40">
                        <p className="font-semibold text-slate-900 truncate max-w-[140px]">{route.name}</p>
                        <p className="text-xs text-slate-400">{formatDate(route.date)} • {route.createdAt ? new Date(route.createdAt).toLocaleTimeString('en-IN', {hour: '2-digit', minute:'2-digit'}) : ''}</p>
                      </td>
                      <td className="px-4 py-3 w-36">
                        {(route as any).user ? (
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                              {(route as any).user.name?.charAt(0)}
                            </div>
                            <span className="text-xs font-medium text-slate-700 truncate">{(route as any).user.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3 w-32 text-xs text-slate-600 whitespace-nowrap">
                        {vehicles.find((v) => v.id === route.vehicleId)?.plateNumber || "—"}
                      </td>
                      <td className="px-4 py-3 w-16 text-xs font-medium text-slate-700 whitespace-nowrap">
                        {completedStops}/{totalStops}
                      </td>
                      <td className="px-4 py-3 w-32">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : pct === 0 ? 'bg-red-500' : 'bg-amber-500'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-semibold text-slate-500 w-6 flex-shrink-0">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 w-28">
                        <StatusBadge status={displayStatus} withDot />
                      </td>
                      <td className="px-4 py-3 w-20 text-xs text-slate-600 whitespace-nowrap">
                        {route.estimatedTime} mins
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setDetailRoute(route)}
                            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate("/tracking")}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                            title="Live Track"
                          >
                            <Navigation className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setRouteToEdit(route);
                              setEditForm({
                                driverId: route.driverId || "",
                                vehicleId: route.vehicleId || "",
                              });
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                            title="Edit Route Assignment"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setRouteToDelete(route)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                            title="Delete Route"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredRoutes.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <MapPin className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="font-medium text-sm">No routes found for this filter</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CALENDAR VIEW TABS CONTENT */}
      {activeTab === "calendar" && (
        <div className="bg-card rounded-lg border border-border shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-base">
              {currentMonthDate.toLocaleString("en-US", { month: "long", year: "numeric" })}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1))}
                className="p-1.5 border border-border rounded-lg text-slate-600 hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentMonthDate(new Date())}
                className="px-3 py-1 text-xs border border-border rounded-lg text-slate-600 hover:bg-slate-50 font-medium cursor-pointer"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1))}
                className="p-1.5 border border-border rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid Header */}
          <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-400 border-b border-border pb-2">
            <div>SUN</div><div>MON</div><div>TUE</div><div>WED</div><div>THU</div><div>FRI</div><div>SAT</div>
          </div>

          {/* Calendar Grid Cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((item, idx) => {
              if (!item) return <div key={idx} className="h-28 bg-slate-50/40 rounded-xl" />;
              const isSelected = selectedCalendarDate === item.dateStr;
              const isToday = item.dateStr === new Date().toISOString().split("T")[0];

              return (
                <div
                  key={item.dateStr}
                  onClick={() => setSelectedCalendarDate(item.dateStr)}
                  className={`min-h-[110px] p-2 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isToday
                      ? "border-blue-600 bg-blue-50/40 shadow-sm"
                      : isSelected
                      ? "border-blue-400 bg-slate-50"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-xs font-bold ${isToday ? "text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-md" : "text-slate-700"}`}>
                      {item.day}
                    </span>
                    {item.dayRoutes.length > 0 && (
                      <span className="text-[9px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-full">
                        {item.dayRoutes.length} {item.dayRoutes.length === 1 ? "Route" : "Routes"}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 overflow-y-auto max-h-20">
                    {item.dayRoutes.map((r) => (
                      <div
                        key={r.id}
                        onClick={(e) => { e.stopPropagation(); setDetailRoute(r); }}
                        className={`px-2 py-1 rounded-lg text-[10px] truncate font-bold shadow-xs transition-transform hover:scale-[1.02] ${
                          r.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : r.status === "IN_PROGRESS"
                            ? "bg-amber-100 text-amber-900 border border-amber-200"
                            : "bg-blue-100 text-blue-900 border border-blue-200"
                        }`}
                        title={`${r.name} - Driver: ${r.driverName || "Assigned Driver"}`}
                      >
                        <p className="truncate">{r.name}</p>
                        {r.driverName && <p className="text-[9px] font-normal opacity-85 truncate">👤 {r.driverName}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CREATE ROUTE MODAL */}
      {createPortal(
        <>
          <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl border border-border shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-slate-50">
                <h3 className="font-bold text-slate-900 text-base">Create New Field Route</h3>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveRoute} className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Form */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Route Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. West Mumbai Beverage Run"
                        value={createForm.name}
                        onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
                        <input
                          type="date"
                          required
                          value={createForm.date}
                          onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Assign Driver *</label>
                        <select
                          required
                          value={createForm.driverId}
                          onChange={(e) => setCreateForm({ ...createForm, driverId: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none"
                        >
                          <option value="">Select driver...</option>
                          {drivers.map((d: any) => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Assign Vehicle *</label>
                        <select
                          required
                          value={createForm.vehicleId}
                          onChange={(e) => setCreateForm({ ...createForm, vehicleId: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none"
                        >
                          <option value="">Select vehicle...</option>
                          {vehicles.map((v) => (
                            <option key={v.id} value={v.id}>{v.model} ({v.plateNumber})</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center justify-between pt-5">
                        <span className="text-xs font-semibold text-slate-700">Auto-optimize Sequence</span>
                        <input
                          type="checkbox"
                          checked={createForm.autoOptimize}
                          onChange={(e) => setCreateForm({ ...createForm, autoOptimize: e.target.checked })}
                          className="w-4 h-4 accent-primary-600 cursor-pointer"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Instructions</label>
                      <textarea
                        rows={2}
                        placeholder="Add special instructions for the driver..."
                        value={createForm.notes}
                        onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Right: Stop Picker */}
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-slate-700">
                      Select Vending Locations ({createForm.stops.length} selected)
                    </label>
                    <div className="border border-border rounded-lg max-h-64 overflow-y-auto divide-y divide-border bg-slate-50">
                      {locations.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">Loading locations...</p>
                      ) : locations.map((loc: any) => {
                        const selected = createForm.stops.includes(loc.id);
                        const customerName = loc.customer?.companyName || loc.customer?.contactPerson || loc.customerName || "";
                        return (
                          <div
                            key={loc.id}
                            onClick={() => {
                              setCreateForm((f) => ({
                                ...f,
                                stops: selected ? f.stops.filter((id) => id !== loc.id) : [...f.stops, loc.id],
                              }));
                            }}
                            className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                              selected ? "bg-primary-50/70" : "hover:bg-slate-100"
                            }`}
                          >
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-xs font-semibold text-slate-900">{loc.name}</p>
                                {customerName ? (
                                  <span className="text-[9px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 rounded">
                                    {customerName}
                                  </span>
                                ) : null}
                              </div>
                              <p className="text-[10px] text-slate-500 truncate max-w-[240px] mt-0.5">{loc.address}</p>
                            </div>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selected ? "bg-primary-600 border-primary-600 text-white" : "border-slate-300"}`}>
                              {selected && <Check className="w-3 h-3" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Mini Leaflet Map Preview */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-700">Route Map Preview</span>
                  <div className="h-44 rounded-lg overflow-hidden border border-border">
                    <MapContainer center={previewCenter} zoom={11} className="h-full w-full">
                      <MapFlyController center={previewCenter} />
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      {selectedLocationObjs.map((loc, idx) => {
                        if (!loc) return null;
                        const lat = Number(loc.latitude || loc.lat);
                        const lng = Number(loc.longitude || loc.lng);
                        if (isNaN(lat) || isNaN(lng) || !lat || !lng) return null;
                        return (
                          <Marker key={loc.id} position={[lat, lng]}>
                            <Popup>{idx + 1}. {loc.name}</Popup>
                          </Marker>
                        );
                      })}
                      {previewPolylineCoords.length > 1 && (
                        <Polyline positions={previewPolylineCoords} color="#2563EB" weight={3} />
                      )}
                    </MapContainer>
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium"
                  >
                    Save & Schedule Route
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ROUTE DETAIL & REPLAY MODAL */}
      <AnimatePresence>
        {detailRoute && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl border border-border shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{detailRoute.name}</h3>
                  <p className="text-xs text-slate-500">{detailRoute.id.toUpperCase()} · {formatDate(detailRoute.date)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/routes/${detailRoute.id}/replay`)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5" /> Full Replay
                  </button>
                  <button onClick={() => setDetailRoute(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Route Info Cards */}
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-border">
                    <p className="text-[10px] text-slate-400 uppercase">Driver</p>
                    <p className="text-xs font-bold text-slate-900 mt-0.5">
                      {(detailRoute as any).user?.name || "—"}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-border">
                    <p className="text-[10px] text-slate-400 uppercase">Vehicle</p>
                    <p className="text-xs font-bold text-slate-900 mt-0.5">
                      {(detailRoute as any).vehicle?.plateNumber || "—"}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-border">
                    <p className="text-[10px] text-slate-400 uppercase">Distance</p>
                    <p className="text-xs font-bold text-slate-900 mt-0.5">{detailRoute.totalDistance} km</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-border">
                    <p className="text-[10px] text-slate-400 uppercase">Status</p>
                    <div className="mt-0.5 flex justify-center"><StatusBadge status={detailRoute.status} /></div>
                  </div>
                </div>

                {/* Animated Replay Map Section */}
                <div className="h-48 rounded-lg overflow-hidden border border-border relative">
                  <MapContainer center={detailMapCenter} zoom={11} className="h-full w-full">
                    <MapFlyController center={detailMapCenter} />
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {((detailRoute as any).routestop || detailRoute.stops)?.map((stop: any, idx: number) => {
                      const locationId = typeof stop === 'string' ? stop : stop.locationId;
                      const loc = (typeof stop === 'object' && stop.location) ? stop.location : locations.find((l) => l.id === locationId);
                      if (!loc) return null;
                      const lat = Number(loc.latitude || loc.lat);
                      const lng = Number(loc.longitude || loc.lng);
                      if (isNaN(lat) || isNaN(lng) || !lat || !lng) return null;
                      return (
                        <Marker key={loc.id || idx} position={[lat, lng]}>
                          <Popup>
                            <div className="text-xs font-semibold">{idx + 1}. {loc.name}</div>
                            {loc.address && <div className="text-[10px] text-slate-500">{loc.address}</div>}
                          </Popup>
                        </Marker>
                      );
                    })}
                    {detailPolylineCoords.length > 1 && (
                      <Polyline positions={detailPolylineCoords} color="#2563EB" weight={3} />
                    )}
                  </MapContainer>
                  {isReplaying && (
                    <div className="absolute top-2 right-2 bg-slate-900/80 text-white text-xs px-2.5 py-1 rounded-full z-[1000] flex items-center gap-1.5 shadow-md">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      Replaying Stop {replayStep + 1}
                    </div>
                  )}
                </div>

                {/* Stop Sequence List */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider">Stop Sequence Timeline</h4>
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {((detailRoute as any).routestop || detailRoute.stops)?.map((stop: any, idx: number) => {
                      const locationId = typeof stop === 'string' ? stop : stop.locationId;
                      const loc = (typeof stop === 'object' && stop.location) ? stop.location : locations.find((l) => l.id === locationId);
                      if (!loc) return null;

                      // Real backend stop status
                      const stopStatus = typeof stop === 'object' && stop.status 
                        ? stop.status 
                        : (detailRoute.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING');
                      
                      const isCompleted = isReplaying ? idx <= replayStep : stopStatus === 'COMPLETED';
                      const isInProgress = !isReplaying && stopStatus === 'IN_PROGRESS';
                      const isSkipped = !isReplaying && stopStatus === 'SKIPPED';

                      // Dynamic ETA / Time calculation
                      const getStopEtaText = () => {
                        if (isCompleted) return "Visited & Completed";
                        if (isInProgress) return "In Progress · Current Stop";
                        if (isSkipped) return "Skipped by Driver";
                        
                        let baseMinutes = 9 * 60; // 09:00 AM standard shift start
                        if (detailRoute.startTime) {
                          const d = new Date(detailRoute.startTime);
                          if (!isNaN(d.getTime())) baseMinutes = d.getHours() * 60 + d.getMinutes();
                        }
                        const totalMinutes = baseMinutes + (idx + 1) * 35;
                        const h = Math.floor(totalMinutes / 60) % 24;
                        const m = totalMinutes % 60;
                        const ampm = h >= 12 ? 'PM' : 'AM';
                        const displayH = h % 12 || 12;
                        return `Est. ETA: ${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
                      };

                      return (
                        <div key={loc.id || idx} className="relative flex items-start justify-between bg-slate-50 p-3 rounded-lg border border-border">
                          <div className={`absolute -left-6 top-3 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                            isCompleted 
                              ? "bg-emerald-500 border-white text-white shadow-sm" 
                              : isInProgress 
                              ? "bg-amber-500 border-white text-white animate-pulse shadow-sm" 
                              : isSkipped 
                              ? "bg-rose-500 border-white text-white" 
                              : "bg-white border-slate-300 text-slate-600"
                          }`}>
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="text-xs font-bold text-slate-900">{loc.name}</p>
                                  {(loc.customer?.companyName || loc.customer?.contactPerson || loc.customerName) && (
                                    <span className="text-[9px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 rounded">
                                      {loc.customer?.companyName || loc.customer?.contactPerson || loc.customerName}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-500 mt-0.5">{loc.address}</p>
                              </div>
                              <div className="text-right">
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                  isCompleted 
                                    ? "bg-emerald-100 text-emerald-800" 
                                    : isInProgress 
                                    ? "bg-amber-100 text-amber-800" 
                                    : isSkipped 
                                    ? "bg-rose-100 text-rose-800" 
                                    : "bg-slate-200 text-slate-600"
                                }`}>
                                  {isCompleted ? "Completed" : isInProgress ? "In Progress" : isSkipped ? "Skipped" : "Scheduled"}
                                </span>
                                <p className="text-[10px] text-slate-400 mt-1">{getStopEtaText()}</p>
                              </div>
                            </div>
                            
                            {/* Service Details from Driver */}
                            {isCompleted && typeof stop === 'object' && (stop.cashCollected > 0 || stop.notes || stop.machineIssues || stop.photos) && (
                              <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 gap-2 text-[10px]">
                                {stop.cashCollected > 0 && (
                                  <div className="bg-white p-1.5 rounded border border-slate-100">
                                    <span className="text-slate-400 block mb-0.5">Cash Collected</span>
                                    <span className="font-bold text-emerald-600">₹{stop.cashCollected}</span>
                                  </div>
                                )}
                                {stop.machineIssues && stop.machineIssues !== "None" && (
                                  <div className="bg-white p-1.5 rounded border border-slate-100">
                                    <span className="text-slate-400 block mb-0.5">Issue Reported</span>
                                    <span className="font-bold text-red-600">{stop.machineIssues}</span>
                                  </div>
                                )}
                                {stop.notes && (
                                  <div className="bg-white p-1.5 rounded border border-slate-100 col-span-2">
                                    <span className="text-slate-400 block mb-0.5">Driver Notes</span>
                                    <span className="text-slate-700 italic">"{stop.notes}"</span>
                                  </div>
                                )}
                                {stop.photos && (
                                  <div className="col-span-2 mt-1">
                                    <span className="text-slate-400 block mb-1">Service Photos</span>
                                    <div className="flex gap-2 overflow-x-auto">
                                      {(() => {
                                        const isValidPhoto = (url: string) => {
                                          if (!url) return false;
                                          return url.startsWith("data:image/") || url.startsWith("http://") || url.startsWith("https://");
                                        };
                                        try {
                                          let parsed = stop.photos;
                                          while (typeof parsed === "string") {
                                            parsed = JSON.parse(parsed);
                                          }
                                          const photos = (Array.isArray(parsed) 
                                            ? parsed 
                                            : [...(parsed.before || []), ...(parsed.after || [])]).filter(isValidPhoto);
                                          return photos.map((p: string, i: number) => (
                                            <img key={i} src={p} className="h-12 w-12 rounded object-cover border border-slate-200" alt="Service" />
                                          ));
                                        } catch {
                                          const splitPhotos = stop.photos.split(",").map((p: string) => p.trim()).filter(isValidPhoto);
                                          return splitPhotos.map((p: string, i: number) => (
                                            <img key={i} src={p} className="h-12 w-12 rounded object-cover border border-slate-200" alt="Service" />
                                          ));
                                        }
                                      })()}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── DELETE ROUTE CONFIRMATION MODAL ── */}
      <AnimatePresence>
        {routeToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden p-6 space-y-4 text-center"
            >
              <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border-4 border-red-100 shadow-sm">
                <Trash2 className="w-7 h-7" />
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-lg">Delete Route Confirmation</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to delete <strong className="text-slate-900">"{routeToDelete.name}"</strong>?
                  This action cannot be undone and will unassign linked stops.
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-left space-y-1 text-slate-600">
                <p><strong>Route ID:</strong> <span className="font-mono text-slate-900">{routeToDelete.id.slice(0, 8)}</span></p>
                <p><strong>Driver:</strong> {routeToDelete.driverName || "Assigned Driver"}</p>
                <p><strong>Total Stops:</strong> {routeToDelete.stops?.length || 0}</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRouteToDelete(null)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await deleteRoute(routeToDelete.id);
                    setRouteToDelete(null);
                  }}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-600/20 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> Yes, Delete Route
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── EDIT ROUTE CONFIRMATION MODAL ── */}
      <AnimatePresence>
        {routeToEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-base">Edit Route Assignment</h3>
                <button onClick={() => setRouteToEdit(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Route Name: <strong className="text-slate-700">{routeToEdit.name}</strong></p>
                  <p className="text-xs text-slate-500">Scheduled Date: <strong className="text-slate-700">{formatDate(routeToEdit.date)}</strong></p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reassign Driver *</label>
                  <select
                    value={editForm.driverId}
                    onChange={(e) => setEditForm({ ...editForm, driverId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                  >
                    <option value="">Select driver...</option>
                    {drivers.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reassign Vehicle</label>
                  <select
                    value={editForm.vehicleId}
                    onChange={(e) => setEditForm({ ...editForm, vehicleId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                  >
                    <option value="">Select vehicle...</option>
                    {vehicles.map((v: any) => (
                      <option key={v.id} value={v.id}>{v.model} ({v.plateNumber})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRouteToEdit(null)}
                  className="flex-1 py-2 text-slate-700 border border-slate-200 rounded-lg font-semibold hover:bg-slate-50 transition-colors text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const success = await useRouteStore.getState().updateRoute(routeToEdit.id, {
                      driverId: editForm.driverId,
                      vehicleId: editForm.vehicleId || undefined,
                    });
                    if (success) {
                      setRouteToEdit(null);
                      fetchRoutes();
                    } else {
                      alert("Failed to update route assignment");
                    }
                  }}
                  className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors text-xs cursor-pointer shadow-md shadow-primary-600/10"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
        </>,
        document.body
      )}
    </div>
  );
}
