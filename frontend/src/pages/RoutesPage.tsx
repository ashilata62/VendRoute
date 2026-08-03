import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Plus, Search, Eye, Trash2, MapPin,
  ChevronLeft, ChevronRight, Navigation, Play, X,
  Check
} from "lucide-react";

import { useRouteStore } from "../store/routeStore";
import { usersApi, locationsApi, vehiclesApi } from "../services/api";
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
  }, [fetchRoutes]);

  // Tab State
  const [activeTab, setActiveTab] = useState<"active" | "scheduled" | "completed" | "calendar">("active");

  // Filters State
  const [search, setSearch] = useState("");
  const [driverFilter, setDriverFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<RouteStatus | "all">("all");
  const [dateFilter, setDateFilter] = useState("");

  // Modal / Detail States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [detailRoute, setDetailRoute] = useState<Route | null>(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayStep, setReplayStep] = useState(0);

  // Calendar State
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date(2026, 6, 1)); // July 2026
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>("2026-07-31");

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
      if (activeTab === "active") matchTab = r.status === "IN_PROGRESS";
      else if (activeTab === "scheduled") matchTab = r.status === "PENDING";
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
        if (prev >= (detailRoute.stops.length || 3) - 1) {
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
      const dayRoutes = routes.filter((r) => r.date === dateStr);
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
            <table className="w-full text-sm text-left min-w-[720px]">
              <thead className="bg-slate-50 border-b border-border text-xs text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Route ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Driver</th>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Stops</th>
                  <th className="px-4 py-3">Progress</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">ETA</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRoutes.map((route) => {
                  const routeStops = route.stops || [];
                  const completedStops = routeStops.filter((s: any) => s.status === "COMPLETED").length;
                  const totalStops = routeStops.length;
                  const pct = totalStops === 0 ? 0 : Math.round((completedStops / totalStops) * 100) || (route.status === "COMPLETED" ? 100 : route.status === "IN_PROGRESS" ? 60 : 0);

                  return (
                    <tr key={route.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-600">
                        {route.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{route.name}</p>
                        <p className="text-xs text-slate-400">{formatDate(route.date)}</p>
                      </td>
                      <td className="px-4 py-3">
                        {(route as any).driver ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-[10px] font-bold">
                              {(route as any).driver.name?.charAt(0)}
                            </div>
                            <span className="text-xs font-medium text-slate-700">{(route as any).driver.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {vehicles.find((v) => v.id === route.vehicleId)?.plateNumber || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-slate-700">
                        {completedStops}/{totalStops}
                      </td>
                      <td className="px-4 py-3 w-32">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-primary-600 h-full rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-semibold text-slate-500">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={route.status} withDot />
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
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
                            onClick={() => deleteRoute(route.id)}
                            className="p-1.5 text-slate-400 hover:text-danger hover:bg-red-50 rounded-md transition-colors"
                            title="Delete"
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
                onClick={() => setCurrentMonthDate(new Date(2026, 6, 1))}
                className="px-3 py-1 text-xs border border-border rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1))}
                className="p-1.5 border border-border rounded-lg text-slate-600 hover:bg-slate-50"
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
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((item, idx) => {
              if (!item) return <div key={idx} className="h-24 bg-slate-50/50 rounded-lg" />;
              const isSelected = selectedCalendarDate === item.dateStr;

              return (
                <div
                  key={item.dateStr}
                  onClick={() => setSelectedCalendarDate(item.dateStr)}
                  className={`h-24 p-1.5 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected ? "border-primary-600 bg-primary-50/30" : "border-border hover:border-slate-300 bg-white"
                  }`}
                >
                  <span className={`text-xs font-semibold ${isSelected ? "text-primary-600" : "text-slate-700"}`}>
                    {item.day}
                  </span>

                  <div className="space-y-1 overflow-y-auto">
                    {item.dayRoutes.map((r) => (
                      <div
                        key={r.id}
                        onClick={(e) => { e.stopPropagation(); setDetailRoute(r); }}
                        className={`px-1.5 py-0.5 rounded text-[10px] truncate font-medium ${
                          r.status === "IN_PROGRESS" ? "bg-emerald-100 text-emerald-800" :
                          r.status === "PENDING" ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {r.name}
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
                            <div>
                              <p className="text-xs font-medium text-slate-900">{loc.name}</p>
                              <p className="text-[10px] text-slate-500 truncate max-w-[220px]">{loc.address}</p>
                            </div>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${selected ? "bg-primary-600 border-primary-600 text-white" : "border-slate-300"}`}>
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
                    onClick={() => setIsReplaying(!isReplaying)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5" /> {isReplaying ? "Pause Replay" : "Route Replay"}
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
                      {(detailRoute as any).driver?.name || "—"}
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
                  <MapContainer center={[19.0760, 72.8777]} zoom={11} className="h-full w-full">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {detailRoute.stops.map((stop: any, idx) => {
                      const locationId = typeof stop === 'string' ? stop : stop.locationId;
                      const loc = locations.find((l) => l.id === locationId);
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
                  </MapContainer>
                  {isReplaying && (
                    <div className="absolute top-2 right-2 bg-slate-900/80 text-white text-xs px-2.5 py-1 rounded-full z-[1000] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      Replaying Stop {replayStep + 1}
                    </div>
                  )}
                </div>

                {/* Stop Sequence List */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider">Stop Sequence Timeline</h4>
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {detailRoute.stops.map((stop: any, idx) => {
                      const locationId = typeof stop === 'string' ? stop : stop.locationId;
                      const loc = locations.find((l) => l.id === locationId);
                      if (!loc) return null;
                      const isCompleted = idx <= replayStep;
                      return (
                        <div key={loc.id} className="relative flex items-start justify-between bg-slate-50 p-3 rounded-lg border border-border">
                          <div className={`absolute -left-6 top-3 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                            isCompleted ? "bg-emerald-500 border-white text-white" : "bg-white border-slate-300 text-slate-600"
                          }`}>
                            {idx + 1}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{loc.name}</p>
                            <p className="text-[10px] text-slate-500">{loc.address}</p>
                          </div>
                          <div className="text-right">
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${isCompleted ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
                              {isCompleted ? "Completed" : "Scheduled"}
                            </span>
                            <p className="text-[10px] text-slate-400 mt-1">ETA: 09:30 AM</p>
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
    </div>
  );
}
