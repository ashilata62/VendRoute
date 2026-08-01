import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, CheckCircle2, XCircle, ShieldCheck, Camera, DollarSign,
  AlertTriangle, Check, MapPin, FileText, ExternalLink, X
} from "lucide-react";

import { mockStops, mockLocations, mockRoutes, mockDrivers } from "../data/mockData";
import StatusBadge from "../components/shared/StatusBadge";
import PageHeader from "../components/shared/PageHeader";
import { formatCurrency } from "../lib/utils";
import type { Stop, StopStatus } from "../types";

export default function StopsPage() {
  // Filters State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StopStatus | "all">("all");
  const [driverFilter, setDriverFilter] = useState("all");
  const [routeFilter, setRouteFilter] = useState("all");

  // Modal / Lightbox State
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [galleryModalPhotos, setGalleryModalPhotos] = useState<string[] | null>(null);

  // Filtered Stops Logic
  const filteredStops = useMemo(() => {
    return mockStops.filter((s) => {
      const loc = mockLocations.find((l) => l.id === s.locationId);
      const route = mockRoutes.find((r) => r.id === s.routeId);

      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      const matchDriver = driverFilter === "all" || route?.driverId === driverFilter;
      const matchRoute = routeFilter === "all" || s.routeId === routeFilter;
      const matchSearch =
        !search ||
        loc?.customerName.toLowerCase().includes(search.toLowerCase()) ||
        s.id.toLowerCase().includes(search.toLowerCase());

      return matchStatus && matchDriver && matchRoute && matchSearch;
    });
  }, [search, statusFilter, driverFilter, routeFilter]);

  const stats = useMemo(() => ({
    completed: mockStops.filter((s) => s.status === "completed").length,
    missed: mockStops.filter((s) => s.status === "missed").length,
    gpsVerified: mockStops.filter((s) => s.gpsVerified).length,
    totalCash: mockStops.reduce((a, s) => a + s.cashCollected, 0),
  }), []);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Stops Management"
        description="Monitor field visit executions, inventory refilled, and cash collected."
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Completed Stops", value: stats.completed, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Missed Stops", value: stats.missed, icon: XCircle, color: "text-danger", bg: "bg-red-50" },
          { label: "GPS Verified", value: `${stats.gpsVerified}/${mockStops.length}`, icon: ShieldCheck, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Cash Collected", value: formatCurrency(stats.totalCash), icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bg}`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">{label}</p>
              <p className="text-lg font-bold text-slate-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Header Filters Bar */}
      <div className="bg-card rounded-lg border border-border p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search stop by location name or Stop ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Driver Filter */}
          <select
            value={driverFilter}
            onChange={(e) => setDriverFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-border rounded-lg bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">All Drivers</option>
            {mockDrivers.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          {/* Route Filter */}
          <select
            value={routeFilter}
            onChange={(e) => setRouteFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-border rounded-lg bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">All Routes</option>
            {mockRoutes.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs border border-border rounded-lg bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="in-progress">In Progress</option>
            <option value="pending">Pending</option>
            <option value="missed">Missed</option>
          </select>
        </div>
      </div>

      {/* DataTable */}
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[900px]">
          <thead className="bg-slate-50 border-b border-border text-xs text-slate-500 uppercase font-semibold">
            <tr>
              <th className="px-4 py-3">Stop ID</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Route & Driver</th>
              <th className="px-4 py-3">Time & Duration</th>
              <th className="px-4 py-3">GPS</th>
              <th className="px-4 py-3">Photos</th>
              <th className="px-4 py-3">Inventory</th>
              <th className="px-4 py-3">Cash</th>
              <th className="px-4 py-3">Issues</th>
              <th className="px-4 py-3">Sign</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredStops.map((stop) => {
              const loc = mockLocations.find((l) => l.id === stop.locationId);
              const route = mockRoutes.find((r) => r.id === stop.routeId);
              const driver = mockDrivers.find((d) => d.id === route?.driverId);

              const arrTime = stop.arrivalTime ? new Date(stop.arrivalTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—";
              const depTime = stop.departureTime ? new Date(stop.departureTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—";

              return (
                <tr
                  key={stop.id}
                  onClick={() => setSelectedStop(stop)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-600">
                    {stop.id.toUpperCase()}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{loc?.customerName}</p>
                    <p className="text-xs text-slate-400 truncate max-w-[200px]">{loc?.address}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-slate-800">{route?.name}</p>
                    <p className="text-[10px] text-slate-400">{driver?.name}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    <p>{arrTime} - {depTime}</p>
                    <p className="text-[10px] text-slate-400">30 mins spent</p>
                  </td>
                  <td className="px-4 py-3">
                    {stop.gpsVerified ? (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                        <ShieldCheck className="w-3 h-3" /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                        Unverified
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {stop.photos.length > 0 ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); setGalleryModalPhotos(stop.photos); }}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md font-medium"
                      >
                        <Camera className="w-3.5 h-3.5" /> {stop.photos.length} photos
                      </button>
                    ) : (
                      <span className="text-xs text-slate-300">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                      {stop.inventoryRefilled.length || 2} items
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-900">
                    {stop.cashCollected > 0 ? formatCurrency(stop.cashCollected) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {stop.machineIssues ? (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-red-50 text-danger border border-red-200 px-2 py-0.5 rounded-full font-medium truncate max-w-[120px]">
                        <AlertTriangle className="w-3 h-3 flex-shrink-0" /> {stop.machineIssues}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-300">None</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {stop.signature ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={stop.status} withDot />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredStops.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">No stops found for this filter</p>
          </div>
        )}
      </div>

      {/* STOP DETAIL MODAL */}
      <AnimatePresence>
        {selectedStop && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl border border-border shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Stop Details - {selectedStop.id.toUpperCase()}</h3>
                  <p className="text-xs text-slate-500">
                    {mockLocations.find((l) => l.id === selectedStop.locationId)?.customerName}
                  </p>
                </div>
                <button onClick={() => setSelectedStop(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Timeline Connector */}
                <div className="bg-slate-50 p-4 rounded-xl border border-border space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Visit Execution Timeline</h4>
                  <div className="flex items-center justify-between text-xs relative before:absolute before:top-1/2 before:inset-x-6 before:h-0.5 before:bg-slate-200">
                    <div className="relative z-10 bg-white p-2 rounded-lg border border-border text-center shadow-sm">
                      <p className="text-[10px] text-slate-400 uppercase">Arrival</p>
                      <p className="font-bold text-slate-900">09:05 AM</p>
                    </div>
                    <div className="relative z-10 bg-white p-2 rounded-lg border border-border text-center shadow-sm">
                      <p className="text-[10px] text-slate-400 uppercase">Activities</p>
                      <p className="font-bold text-emerald-600">Refill & Cash</p>
                    </div>
                    <div className="relative z-10 bg-white p-2 rounded-lg border border-border text-center shadow-sm">
                      <p className="text-[10px] text-slate-400 uppercase">Departure</p>
                      <p className="font-bold text-slate-900">09:35 AM</p>
                    </div>
                  </div>
                </div>

                {/* Inventory Refilled Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Inventory Refilled Breakdown</h4>
                  <table className="w-full text-xs text-left border border-border rounded-lg overflow-hidden">
                    <thead className="bg-slate-50 border-b border-border font-semibold text-slate-600">
                      <tr>
                        <th className="px-3 py-2">Product</th>
                        <th className="px-3 py-2">Before Qty</th>
                        <th className="px-3 py-2">Refilled Qty</th>
                        <th className="px-3 py-2">After Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(selectedStop.inventoryRefilled.length > 0
                        ? selectedStop.inventoryRefilled
                        : [{ product: "Lays Chips", qty: 12 }, { product: "Pepsi Can", qty: 10 }]
                      ).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-medium text-slate-900">{item.product}</td>
                          <td className="px-3 py-2 text-slate-500">4 units</td>
                          <td className="px-3 py-2 font-bold text-emerald-600">+{item.qty} units</td>
                          <td className="px-3 py-2 font-medium text-slate-800">{4 + item.qty} units</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Cash Collected & Denomination */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-border space-y-2">
                    <p className="text-xs text-slate-400 uppercase font-semibold">Cash Collected</p>
                    <p className="text-xl font-bold text-emerald-700">{formatCurrency(selectedStop.cashCollected || 3200)}</p>
                    <div className="text-[11px] text-slate-500 space-y-0.5 border-t border-slate-200 pt-2">
                      <div className="flex justify-between"><span>₹500 Notes:</span> <span>4 x ₹500 = ₹2,000</span></div>
                      <div className="flex justify-between"><span>₹200 Notes:</span> <span>5 x ₹200 = ₹1,000</span></div>
                      <div className="flex justify-between"><span>₹100 Notes:</span> <span>2 x ₹100 = ₹200</span></div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-border space-y-2">
                    <p className="text-xs text-slate-400 uppercase font-semibold">Signature Captured</p>
                    <div className="h-20 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 text-xs italic font-serif">
                      [ Signed: Vikram Desai ]
                    </div>
                  </div>
                </div>

                {/* GPS Coordinates & Map Link */}
                <div className="flex items-center justify-between text-xs bg-slate-50 p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-4 h-4 text-primary-600" />
                    <span>GPS Verified: 19.0596° N, 72.8656° E</span>
                  </div>
                  <a
                    href="https://maps.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    View on Map <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PHOTO LIGHTBOX MODAL */}
      <AnimatePresence>
        {galleryModalPhotos && (
          <div
            onClick={() => setGalleryModalPhotos(null)}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-4 max-w-2xl w-full space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h4 className="font-bold text-slate-900 text-sm">Stop Execution Photos</h4>
                <button onClick={() => setGalleryModalPhotos(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {galleryModalPhotos.map((url, i) => (
                  <div key={i} className="aspect-video rounded-lg overflow-hidden bg-slate-100 border border-border">
                    <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
