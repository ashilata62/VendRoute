import { createPortal } from "react-dom";
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import {
  Truck, Wrench, Plus, Edit3, Trash2, X, AlertCircle, Navigation
} from "lucide-react";

import { vehiclesApi, usersApi } from "../services/api";
import { useTrackingStore } from "../store/trackingStore";
import StatusBadge from "../components/shared/StatusBadge";
import PageHeader from "../components/shared/PageHeader";
import { formatDate, formatCurrency } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Leaflet default icon fix
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Dummy data removed as requested

function FuelBar({ level }: { level: number }) {
  const color = level > 50 ? "bg-emerald-500" : level > 20 ? "bg-amber-500" : "bg-danger";
  return (
    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${level}%` }} />
    </div>
  );
}

// Dynamic Map Recenter Controller
function MapFlyToController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, 13, { animate: true, duration: 1.2 });
    }
  }, [center, map]);
  return null;
}

// Helper to resolve real GPS location from backend telemetry & live socket
const getVehicleLocation = (vehicle: any, liveLocs: any[]) => {
  if (!vehicle) return null;
  const driverId = vehicle.assignedDriverId || vehicle.user?.id;
  const live = liveLocs.find((l) => l.driverId === driverId);
  if (live && live.lat && live.lng) {
    return {
      lat: live.lat,
      lng: live.lng,
      speed: live.speed ?? 0,
      heading: live.heading ?? 0,
      isLive: true,
      label: "Live GPS",
    };
  }
  if (vehicle.currentLocation?.latitude && vehicle.currentLocation?.longitude) {
    return {
      lat: vehicle.currentLocation.latitude,
      lng: vehicle.currentLocation.longitude,
      speed: vehicle.currentLocation.speed ?? 0,
      heading: vehicle.currentLocation.heading ?? 0,
      isLive: vehicle.currentLocation.isLive ?? false,
      label: vehicle.currentLocation.isLive ? "Live GPS" : (vehicle.currentLocation.locationName || "Assigned Location"),
    };
  }
  if (vehicle.routePath && vehicle.routePath.length > 0) {
    return {
      lat: vehicle.routePath[0][0],
      lng: vehicle.routePath[0][1],
      speed: 0,
      heading: 0,
      isLive: false,
      label: "Route Base",
    };
  }
  return null;
};

// Create custom numbered stop icon
const createStopIcon = (num: number, isCompleted: boolean) =>
  L.divIcon({
    className: "custom-stop-marker",
    html: `<div style="background-color: ${isCompleted ? '#10B981' : '#2563EB'}; color: white; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 11px; border: 2px solid #ffffff; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">${num}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

export default function VehiclesPage() {
  const [activeTab, setActiveTab] = useState<"fleet" | "schedule" | "fuel" | "history">("fleet");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("v1");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [createForm, setCreateForm] = useState({ model: "", plateNumber: "", fuelType: "diesel", type: "van" });
  
  const [editingVehicle, setEditingVehicle] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ model: "", plateNumber: "", fuelType: "diesel", type: "van", assignedDriverId: "" });
  const [vehicleToDelete, setVehicleToDelete] = useState<any | null>(null);

  // ── Fuel & Service Expense Modals State ──
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [fuelForm, setFuelForm] = useState({ vehicleId: "", liters: "", cost: "", month: "Jul" });
  const [fuelLogs, setFuelLogs] = useState<any[]>(() => {
    const saved = localStorage.getItem('fuelLogs');
    return saved ? JSON.parse(saved) : [];
  });

  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [serviceForm, setServiceForm] = useState({ vehicleId: "", date: new Date().toISOString().split("T")[0], type: "", cost: "", notes: "" });
  const [serviceHistory, setServiceHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem('serviceHistory');
    return saved ? JSON.parse(saved) : [];
  });

  const fetchVehicles = () => {
    vehiclesApi.getAll().then(res => {
      if (res.success) {
        setVehicles(res.data);
        if (res.data.length > 0 && (selectedVehicleId === "v1" || !selectedVehicleId)) {
          setSelectedVehicleId(res.data[0].id);
        }
      }
    }).catch(() => {});
  };

  useEffect(() => {
    fetchVehicles();
    usersApi.getAll("DRIVER").then(res => {
      if (res.success) setDrivers(res.data);
    }).catch(() => {});
  }, []);

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await vehiclesApi.create(createForm);
      if (res.success) {
        setIsAddModalOpen(false);
        setCreateForm({ model: "", plateNumber: "", fuelType: "diesel", type: "van" });
        fetchVehicles();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const { liveLocations } = useTrackingStore();

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0] || null;
  const selectedVehicleLocation = getVehicleLocation(selectedVehicle, liveLocations);

  const currentCenter: [number, number] = selectedVehicleLocation
    ? [selectedVehicleLocation.lat, selectedVehicleLocation.lng]
    : [19.0760, 72.8777];

  const currentPath: [number, number][] =
    selectedVehicle?.routePath && selectedVehicle.routePath.length > 0
      ? selectedVehicle.routePath
      : selectedVehicleLocation
      ? [[selectedVehicleLocation.lat, selectedVehicleLocation.lng]]
      : [];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Fleet Management"
        description="Monitor vehicles, maintenance schedules, fuel logs, and GPS history."
        action={
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Vehicle
          </button>
        }
      />

      {/* Tabs Bar */}
      <div className="flex flex-wrap border-b border-border pb-1 gap-2 overflow-x-auto">
        {[
          { id: "fleet", label: "Vehicle Fleet & Map" },
          { id: "schedule", label: "Maintenance Schedule" },
          { id: "fuel", label: "Fuel Logs" },
          { id: "history", label: "Service History" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === t.id ? "bg-primary-600 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: FLEET & MAP VIEW */}
      {activeTab === "fleet" && (
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* Left Cards List (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {vehicles.length === 0 ? (
              <div className="bg-card rounded-xl border border-border p-8 text-center text-slate-400">
                <Truck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-semibold">No vehicles in fleet.</p>
                <p className="text-[10px] text-slate-400 mt-1">Click "+ Add Vehicle" to register one.</p>
              </div>
            ) : (
              vehicles.map((vehicle) => {
                const assignedDriver = drivers.find((d) => d.id === vehicle.assignedDriverId) || vehicle.user;
                const isSelected = selectedVehicle?.id === vehicle.id;
                const vLoc = getVehicleLocation(vehicle, liveLocations);

              return (
                <div
                  key={vehicle.id}
                  onClick={() => setSelectedVehicleId(vehicle.id)}
                  className={`bg-card rounded-xl border p-4 shadow-sm transition-all cursor-pointer ${
                    isSelected ? "border-primary-600 bg-primary-50/40 ring-1 ring-primary-600" : "border-border hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{vehicle.model}</p>
                        <p className="font-mono text-xs text-slate-500">{vehicle.plateNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={vehicle.status} withDot />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingVehicle(vehicle);
                          setEditForm({
                            model: vehicle.model,
                            plateNumber: vehicle.plateNumber,
                            fuelType: vehicle.fuelType || "diesel",
                            type: vehicle.type || "van",
                            assignedDriverId: vehicle.assignedDriverId || "",
                          });
                        }}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                        title="Edit Vehicle"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setVehicleToDelete(vehicle);
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                        title="Delete Vehicle"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="flex justify-between text-slate-500 mb-1">
                        <span>Fuel Level</span>
                        <span className="font-semibold text-slate-800">{vehicle.currentFuelLevel || 75}%</span>
                      </div>
                      <FuelBar level={vehicle.currentFuelLevel || 75} />
                    </div>

                    {vehicle.activeRoute && (
                      <div className="text-[11px] bg-slate-100/80 rounded px-2 py-1 text-slate-700 font-medium flex items-center justify-between">
                        <span className="truncate">🛣️ {vehicle.activeRoute.name}</span>
                        <span className="text-[10px] text-slate-500 font-semibold">{vehicle.activeRoute.stopsCount} stops</span>
                      </div>
                    )}

                    <div className="flex justify-between border-t border-border pt-2 text-[11px] text-slate-500">
                      <span>Driver: <strong className="text-slate-800">{assignedDriver?.name || "Unassigned"}</strong></span>
                      <span className={`flex items-center gap-1 font-semibold ${vLoc?.isLive ? "text-emerald-600" : vLoc ? "text-blue-600" : "text-slate-400"}`}>
                        <Navigation className="w-3 h-3" />
                        {vLoc ? `${vLoc.lat.toFixed(3)}°, ${vLoc.lng.toFixed(3)}°` : "No GPS"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
            )}
          </div>

          {/* Right Map Detail (6 cols) */}
          <div className="lg:col-span-6 bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col h-[520px]">
            {selectedVehicle ? (
              <>
                <div className="p-4 border-b border-border bg-slate-50 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">
                        {selectedVehicle.model} ({selectedVehicle.plateNumber})
                      </h3>
                      {selectedVehicle.activeRoute && (
                        <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
                          {selectedVehicle.activeRoute.name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>
                        GPS:{" "}
                        <strong className="font-mono text-blue-600">
                          {selectedVehicleLocation ? `${selectedVehicleLocation.lat.toFixed(4)}° N, ${selectedVehicleLocation.lng.toFixed(4)}° E` : "Pending GPS Signal"}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Speed: <strong className="text-emerald-600">{selectedVehicleLocation?.speed || 0} km/h</strong>
                      </span>
                      {selectedVehicleLocation?.isLive && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE
                        </span>
                      )}
                    </p>
                  </div>
                  <StatusBadge status={selectedVehicle.status} />
                </div>

                <div className="flex-1 relative">
                  <MapContainer center={currentCenter} zoom={13} className="h-full w-full">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapFlyToController center={currentCenter} />
                    
                    {/* Vehicle Location Marker */}
                    {selectedVehicleLocation && (
                      <Marker position={currentCenter}>
                        <Popup>
                          <div className="p-1 space-y-1">
                            <p className="font-bold text-xs text-slate-900">{selectedVehicle.model}</p>
                            <p className="text-[11px] font-mono text-slate-600">{selectedVehicle.plateNumber}</p>
                            <p className="text-[10px] text-emerald-600 font-semibold">
                              {selectedVehicleLocation.isLive ? "🟢 Live GPS" : "📍 Spot"}: {currentCenter[0].toFixed(4)}° N, {currentCenter[1].toFixed(4)}° E
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    )}

                    {/* Active Route Stops Markers */}
                    {selectedVehicle.activeRoute?.stops?.map((stop: any, sIdx: number) => {
                      if (!stop.latitude || !stop.longitude) return null;
                      return (
                        <Marker
                          key={stop.id || sIdx}
                          position={[stop.latitude, stop.longitude]}
                          icon={createStopIcon(sIdx + 1, stop.status === "COMPLETED")}
                        >
                          <Popup>
                            <div className="p-1 space-y-0.5 text-xs">
                              <p className="font-bold text-slate-900">Stop #{sIdx + 1}: {stop.name}</p>
                              <p className="text-[11px] text-slate-600">{stop.address}{stop.city ? `, ${stop.city}` : ""}</p>
                              <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded mt-1 ${stop.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                                {stop.status}
                              </span>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}

                    {/* Real Route Polyline */}
                    {currentPath.length > 1 && (
                      <Polyline
                        positions={currentPath}
                        color="#2563EB"
                        weight={4}
                        dashArray="5 5"
                      />
                    )}
                  </MapContainer>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6">
                <Truck className="w-12 h-12 mb-2 opacity-20" />
                <p className="text-sm font-semibold">No Vehicle Selected</p>
                <p className="text-xs mt-1">Select a vehicle from the list to view its map telemetry.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MAINTENANCE SCHEDULE */}
      {activeTab === "schedule" && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-border pb-3">Upcoming Maintenance Schedule</h3>
          <div className="space-y-3">
            {vehicles.map((v) => (
              <div key={v.id} className="p-4 rounded-xl bg-slate-50 border border-border flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{v.model} ({v.plateNumber})</p>
                    <p className="text-slate-500">Scheduled Service: <strong>{formatDate(v.nextMaintenance || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))}</strong></p>
                  </div>
                </div>
                <span className="bg-amber-100 text-amber-800 font-semibold px-2.5 py-1 rounded-full text-[10px]">
                  Scheduled
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: FUEL LOGS */}
      {activeTab === "fuel" && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Fuel Consumption & Cost Log</h3>
              <p className="text-xs text-slate-500">Track petrol/diesel liters & expense bills</p>
            </div>
            <button
              onClick={() => setIsFuelModalOpen(true)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Fuel Entry
            </button>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={fuelLogs}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Line type="monotone" dataKey="liters" stroke="#2563EB" strokeWidth={2.5} name="Fuel (Liters)" />
              <Line type="monotone" dataKey="cost" stroke="#10B981" strokeWidth={2.5} name="Cost (₹)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* TAB 4: SERVICE HISTORY */}
      {activeTab === "history" && (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Past Service History Logs</h3>
              <p className="text-xs text-slate-500">Garage repair & maintenance bill records</p>
            </div>
            <button
              onClick={() => setIsServiceModalOpen(true)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Log Service Expense
            </button>
          </div>
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-border text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Service Type</th>
                <th className="px-4 py-3">Cost</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {serviceHistory.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-800">{formatDate(item.date)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{item.type}</td>
                  <td className="px-4 py-3 font-bold text-emerald-700">{formatCurrency(item.cost)}</td>
                  <td className="px-4 py-3 text-slate-600">{item.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE VEHICLE MODAL */}
      {createPortal(
        <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl border border-border shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
            >
              <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-slate-50">
                <h3 className="font-bold text-slate-900 text-base">Add New Vehicle</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateVehicle} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Model / Make *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tata Ace Gold"
                    value={createForm.model}
                    onChange={(e) => setCreateForm({ ...createForm, model: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">License Plate Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MH-01-AB-1234"
                    value={createForm.plateNumber}
                    onChange={(e) => setCreateForm({ ...createForm, plateNumber: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Type *</label>
                    <select
                      value={createForm.type}
                      onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none"
                    >
                      <option value="van">Van</option>
                      <option value="truck">Truck</option>
                      <option value="car">Car</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Fuel Type *</label>
                    <select
                      value={createForm.fuelType}
                      onChange={(e) => setCreateForm({ ...createForm, fuelType: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none"
                    >
                      <option value="diesel">Diesel</option>
                      <option value="petrol">Petrol</option>
                      <option value="electric">Electric</option>
                      <option value="cng">CNG</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors shadow-sm cursor-pointer"
                  >
                    Add Vehicle
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
        document.body
      )}

      {/* EDIT VEHICLE MODAL */}
      {createPortal(
        <AnimatePresence>
        {editingVehicle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-border shadow-2xl w-full max-w-lg overflow-hidden flex flex-col p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-blue-600" /> Edit Vehicle Details
                </h3>
                <button onClick={() => setEditingVehicle(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await vehiclesApi.update(editingVehicle.id, editForm);
                  if (res.success) {
                    setEditingVehicle(null);
                    fetchVehicles();
                  }
                } catch (err: any) {
                  alert(err.message || "Failed to update vehicle.");
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Model / Make *</label>
                  <input
                    type="text"
                    required
                    value={editForm.model}
                    onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">License Plate Number *</label>
                  <input
                    type="text"
                    required
                    value={editForm.plateNumber}
                    onChange={(e) => setEditForm({ ...editForm, plateNumber: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Type *</label>
                    <select
                      value={editForm.type}
                      onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none"
                    >
                      <option value="van">Van</option>
                      <option value="truck">Truck</option>
                      <option value="car">Car</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Fuel Type *</label>
                    <select
                      value={editForm.fuelType}
                      onChange={(e) => setEditForm({ ...editForm, fuelType: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none"
                    >
                      <option value="diesel">Diesel</option>
                      <option value="petrol">Petrol</option>
                      <option value="electric">Electric</option>
                      <option value="cng">CNG</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                  <button
                    type="button"
                    onClick={() => setEditingVehicle(null)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
        document.body
      )}

      {/* DELETE VEHICLE CONFIRMATION MODAL */}
      {createPortal(
        <AnimatePresence>
        {vehicleToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 text-center"
            >
              <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border-4 border-red-100 shadow-sm">
                <Trash2 className="w-7 h-7" />
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-lg">Delete Vehicle Confirmation</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to delete <strong className="text-slate-900">"{vehicleToDelete.model} ({vehicleToDelete.plateNumber})"</strong>?
                  This action cannot be undone.
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-left space-y-1 text-slate-600">
                <p><strong>Model:</strong> {vehicleToDelete.model}</p>
                <p><strong>License Plate:</strong> <span className="font-mono text-slate-900">{vehicleToDelete.plateNumber}</span></p>
                <p><strong>Fuel Type:</strong> <span className="capitalize">{vehicleToDelete.fuelType}</span></p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setVehicleToDelete(null)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await vehiclesApi.delete(vehicleToDelete.id);
                      setVehicleToDelete(null);
                      fetchVehicles();
                    } catch (err: any) {
                      alert(err.message || "Failed to delete vehicle.");
                    }
                  }}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-600/20 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> Yes, Delete Vehicle
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
        document.body
      )}

      {/* ADD FUEL ENTRY MODAL */}
      {createPortal(
        <AnimatePresence>
        {isFuelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  ⛽ Add Fuel Expense Entry
                </h3>
                <button onClick={() => setIsFuelModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const litersNum = Number(fuelForm.liters) || 30;
                const costNum = Number(fuelForm.cost) || 3000;
                const newLogs = [...fuelLogs, { month: fuelForm.month, liters: litersNum, cost: costNum }];
                setFuelLogs(newLogs);
                localStorage.setItem('fuelLogs', JSON.stringify(newLogs));
                setIsFuelModalOpen(false);
                setFuelForm({ vehicleId: "", liters: "", cost: "", month: "Aug" });
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select Vehicle *</label>
                  <select
                    required
                    value={fuelForm.vehicleId}
                    onChange={(e) => setFuelForm({ ...fuelForm, vehicleId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none"
                  >
                    <option value="">Choose vehicle...</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.model} ({v.plateNumber})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Fuel Liters *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 45"
                      value={fuelForm.liters}
                      onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Total Bill Cost (₹) *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 4200"
                      value={fuelForm.cost}
                      onChange={(e) => setFuelForm({ ...fuelForm, cost: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Month Period *</label>
                  <select
                    value={fuelForm.month}
                    onChange={(e) => setFuelForm({ ...fuelForm, month: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none"
                  >
                    {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button type="button" onClick={() => setIsFuelModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer shadow-sm">
                    Save Fuel Entry
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
        document.body
      )}

      {/* LOG SERVICE EXPENSE MODAL */}
      {createPortal(
        <AnimatePresence>
        {isServiceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  🛠️ Log Service Repair Expense
                </h3>
                <button onClick={() => setIsServiceModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const newHistory = [
                  {
                    date: serviceForm.date,
                    type: serviceForm.type || "Full Engine Service",
                    cost: Number(serviceForm.cost) || 5000,
                    notes: serviceForm.notes || "Servicing and maintenance bill entry",
                  },
                  ...serviceHistory,
                ];
                setServiceHistory(newHistory);
                localStorage.setItem('serviceHistory', JSON.stringify(newHistory));
                setIsServiceModalOpen(false);
                setServiceForm({ vehicleId: "", date: new Date().toISOString().split("T")[0], type: "", cost: "", notes: "" });
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select Vehicle *</label>
                  <select
                    required
                    value={serviceForm.vehicleId}
                    onChange={(e) => setServiceForm({ ...serviceForm, vehicleId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none"
                  >
                    <option value="">Choose vehicle...</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.model} ({v.plateNumber})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Service Type / Work Done *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Engine Oil Service & Brake Replacement"
                    value={serviceForm.type}
                    onChange={(e) => setServiceForm({ ...serviceForm, type: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Service Date *</label>
                    <input
                      type="date"
                      required
                      value={serviceForm.date}
                      onChange={(e) => setServiceForm({ ...serviceForm, date: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Service Bill Cost (₹) *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 8500"
                      value={serviceForm.cost}
                      onChange={(e) => setServiceForm({ ...serviceForm, cost: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Garage Notes & Invoice Details</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Oil filter replaced, front brake pads aligned"
                    value={serviceForm.notes}
                    onChange={(e) => setServiceForm({ ...serviceForm, notes: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button type="button" onClick={() => setIsServiceModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl cursor-pointer shadow-sm">
                    Save Service Record
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
