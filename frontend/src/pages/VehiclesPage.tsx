import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import {
  Truck, Wrench, Plus,
} from "lucide-react";

import { vehiclesApi, usersApi } from "../services/api";
import StatusBadge from "../components/shared/StatusBadge";
import PageHeader from "../components/shared/PageHeader";
import { formatDate, formatCurrency } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

// Leaflet default icon fix
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const fuelChartData = [
  { month: "Jan", liters: 320, cost: 28800 },
  { month: "Feb", liters: 290, cost: 26100 },
  { month: "Mar", liters: 350, cost: 31500 },
  { month: "Apr", liters: 310, cost: 27900 },
  { month: "May", liters: 380, cost: 34200 },
  { month: "Jun", liters: 410, cost: 36900 },
];

const serviceHistoryData = [
  { date: "2026-06-15", type: "Full Engine Oil Service", cost: 8500, notes: "Oil filter replaced, brake inspection clean." },
  { date: "2026-04-10", type: "Tire Replacement & Alignment", cost: 14200, notes: "Replaced 2 front tires and balanced alignment." },
  { date: "2026-02-05", type: "Brake Pad Maintenance", cost: 4800, notes: "Front brake pads replaced." },
];

function FuelBar({ level }: { level: number }) {
  const color = level > 50 ? "bg-emerald-500" : level > 20 ? "bg-amber-500" : "bg-danger";
  return (
    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${level}%` }} />
    </div>
  );
}

export default function VehiclesPage() {
  const [activeTab, setActiveTab] = useState<"fleet" | "schedule" | "fuel" | "history">("fleet");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("v1");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [createForm, setCreateForm] = useState({ model: "", plateNumber: "", fuelType: "diesel", type: "van" });

  const fetchVehicles = () => {
    vehiclesApi.getAll().then(res => {
      if (res.success) {
        setVehicles(res.data);
        if (res.data.length > 0 && selectedVehicleId === "v1") {
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

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0] || null;

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
              activeTab === t.id
                ? "bg-primary-50 text-primary-700 border border-primary-100"
                : "text-slate-500 hover:bg-slate-100"
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
            {vehicles.map((vehicle) => {
              const assignedDriver = drivers.find((d) => d.id === vehicle.assignedDriverId);
              const isSelected = selectedVehicle.id === vehicle.id;

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
                    <StatusBadge status={vehicle.status} withDot />
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="flex justify-between text-slate-500 mb-1">
                        <span>Fuel Level</span>
                        <span className="font-semibold text-slate-800">{vehicle.currentFuelLevel || 75}%</span>
                      </div>
                      <FuelBar level={vehicle.currentFuelLevel || 75} />
                    </div>

                    <div className="flex justify-between border-t border-border pt-2 text-[11px] text-slate-500">
                      <span>Driver: <strong className="text-slate-800">{assignedDriver?.name || "Unassigned"}</strong></span>
                      <span>GPS: <strong className="text-emerald-600">Online</strong></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Map Detail (6 cols) */}
          <div className="lg:col-span-6 bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col h-[520px]">
            <div className="p-4 border-b border-border bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{selectedVehicle.model} ({selectedVehicle.plateNumber})</h3>
                <p className="text-xs text-slate-400">Live GPS Location & Route History</p>
              </div>
              <StatusBadge status={selectedVehicle.status} />
            </div>

            <div className="flex-1 relative">
              <MapContainer center={[19.0760, 72.8777]} zoom={12} className="h-full w-full">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[19.0760, 72.8777]}>
                  <Popup>
                    <p className="font-bold text-xs">{selectedVehicle.model}</p>
                    <p className="text-[10px] text-slate-500">{selectedVehicle.plateNumber}</p>
                  </Popup>
                </Marker>
                <Polyline
                  positions={[[19.0596, 72.8656], [19.0760, 72.8777], [19.1196, 72.9050]]}
                  color="#2563EB"
                  weight={4}
                  dashArray="5 5"
                />
              </MapContainer>
            </div>
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
          <h3 className="font-bold text-slate-900 text-sm border-b border-border pb-3">Fuel Consumption & Cost Log</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={fuelChartData}>
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
          <div className="p-4 border-b border-border font-bold text-slate-900 text-sm">Past Service History Logs</div>
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
              {serviceHistoryData.map((item, idx) => (
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
                    className="px-4 py-2 text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors shadow-sm"
                  >
                    Add Vehicle
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
