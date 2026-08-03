import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, CheckCircle2, XCircle, ShieldCheck, Camera, DollarSign,
  AlertTriangle, Check, MapPin, FileText, ExternalLink, X, Edit
} from "lucide-react";

import { mockStops, mockLocations, mockRoutes, mockDrivers } from "../data/mockData";
import StatusBadge from "../components/shared/StatusBadge";
import PageHeader from "../components/shared/PageHeader";
import { formatCurrency } from "../lib/utils";
import type { Stop, StopStatus } from "../types";

export default function StopsPage() {
  // Main Stops State
  const [stops, setStops] = useState<Stop[]>(mockStops);

  // Filters State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StopStatus | "all">("all");
  const [driverFilter, setDriverFilter] = useState("all");
  const [routeFilter, setRouteFilter] = useState("all");

  // Modal / Lightbox State
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [galleryModalPhotos, setGalleryModalPhotos] = useState<string[] | null>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Edit Form State
  const [editForm, setEditForm] = useState<{
    arrivalTime: string;
    departureTime: string;
    cashCollected: number;
    notes: string;
    machineIssues: string;
    inventoryRefilled: { product: string; qty: number }[];
  }>({
    arrivalTime: "",
    departureTime: "",
    cashCollected: 0,
    notes: "",
    machineIssues: "",
    inventoryRefilled: [],
  });

  // Selected Stop Location and Cash Breakdown
  const selectedStopLocation = selectedStop
    ? mockLocations.find((l) => l.id === selectedStop.locationId)
    : null;
  const selectedStopRoute = selectedStop
    ? mockRoutes.find((r) => r.id === selectedStop.routeId)
    : null;
  const selectedStopDriver = selectedStopRoute
    ? mockDrivers.find((d) => d.id === selectedStopRoute.driverId)
    : null;

  const cashAmt = isEditing ? editForm.cashCollected : (selectedStop?.cashCollected ?? 0);
  const n500 = Math.floor(cashAmt / 500);
  const rem500 = cashAmt % 500;
  const n200 = Math.floor(rem500 / 200);
  const rem200 = rem500 % 200;
  const n100 = Math.floor(rem200 / 100);
  const remCoins = rem200 % 100;

  // Start Editing Handler
  const handleStartEdit = () => {
    if (!selectedStop) return;
    setEditForm({
      arrivalTime: selectedStop.arrivalTime || "2026-07-31T09:05:00",
      departureTime: selectedStop.departureTime || "2026-07-31T09:35:00",
      cashCollected: selectedStop.cashCollected,
      notes: selectedStop.notes || "",
      machineIssues: selectedStop.machineIssues || "",
      inventoryRefilled: selectedStop.inventoryRefilled.length > 0
        ? [...selectedStop.inventoryRefilled.map(i => ({ ...i }))]
        : [{ product: "Lays Chips", qty: 12 }, { product: "Pepsi Can", qty: 10 }],
    });
    setIsEditing(true);
  };

  // Save Edit Handler
  const handleSaveEdit = () => {
    if (!selectedStop) return;
    const updatedStop: Stop = {
      ...selectedStop,
      arrivalTime: editForm.arrivalTime,
      departureTime: editForm.departureTime,
      cashCollected: editForm.cashCollected,
      notes: editForm.notes,
      machineIssues: editForm.machineIssues,
      inventoryRefilled: editForm.inventoryRefilled,
    };
    setStops(prev => prev.map(s => s.id === updatedStop.id ? updatedStop : s));
    setSelectedStop(updatedStop);
    setIsEditing(false);
  };

  // Filtered Stops Logic
  const filteredStops = useMemo(() => {
    return stops.filter((s) => {
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
  }, [stops, search, statusFilter, driverFilter, routeFilter]);

  const stats = useMemo(() => ({
    completed: stops.filter((s) => s.status === "completed").length,
    missed: stops.filter((s) => s.status === "missed").length,
    gpsVerified: stops.filter((s) => s.gpsVerified).length,
    totalCash: stops.reduce((a, s) => a + s.cashCollected, 0),
  }), [stops]);

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
              <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-slate-50 flex-shrink-0">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {isEditing ? "Edit Stop Details" : `Stop Details - ${selectedStop.id.toUpperCase()}`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {mockLocations.find((l) => l.id === selectedStop.locationId)?.customerName}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setSelectedStop(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {isEditing ? (
                  // EDITING MODE FORM
                  <div className="space-y-6">
                    {/* Timeline Editing */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-border space-y-3">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Visit Execution Timeline</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Arrival Time</label>
                          <input
                            type="text"
                            className="w-full px-3 py-1.5 border border-border rounded-lg text-xs bg-white text-slate-850 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            value={editForm.arrivalTime}
                            onChange={(e) => setEditForm(prev => ({ ...prev, arrivalTime: e.target.value }))}
                            placeholder="e.g. 2026-07-31T09:05:00"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Departure Time</label>
                          <input
                            type="text"
                            className="w-full px-3 py-1.5 border border-border rounded-lg text-xs bg-white text-slate-850 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            value={editForm.departureTime}
                            onChange={(e) => setEditForm(prev => ({ ...prev, departureTime: e.target.value }))}
                            placeholder="e.g. 2026-07-31T09:35:00"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Inventory Refill Qty Editing */}
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
                          {editForm.inventoryRefilled.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="px-3 py-2 font-medium text-slate-900">{item.product}</td>
                              <td className="px-3 py-2 text-slate-500">4 units</td>
                              <td className="px-3 py-2 font-bold text-emerald-600">
                                <input
                                  type="number"
                                  className="w-20 px-2 py-0.5 border border-border rounded text-xs bg-white text-slate-850 focus:outline-none"
                                  value={item.qty}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    setEditForm(prev => {
                                      const newRefill = [...prev.inventoryRefilled];
                                      newRefill[idx] = { ...newRefill[idx], qty: val };
                                      return { ...prev, inventoryRefilled: newRefill };
                                    });
                                  }}
                                />
                              </td>
                              <td className="px-3 py-2 font-medium text-slate-800">{4 + item.qty} units</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Cash Collected & Issues Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-border space-y-2">
                        <label className="block text-xs text-slate-400 uppercase font-semibold">Cash Collected (₹)</label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white text-slate-850 font-bold focus:outline-none"
                          value={editForm.cashCollected}
                          onChange={(e) => setEditForm(prev => ({ ...prev, cashCollected: parseInt(e.target.value) || 0 }))}
                        />
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl border border-border space-y-2">
                        <label className="block text-xs text-slate-400 uppercase font-semibold">Machine Issues Reported</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-border rounded-lg text-xs bg-white text-slate-850 focus:outline-none"
                          value={editForm.machineIssues}
                          onChange={(e) => setEditForm(prev => ({ ...prev, machineIssues: e.target.value }))}
                          placeholder="e.g. None or Faulty bill reader"
                        />
                      </div>
                    </div>

                    {/* Notes Field Editing */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-border space-y-2">
                      <label className="block text-xs text-slate-400 uppercase font-semibold">Notes / Feedback</label>
                      <textarea
                        className="w-full h-20 px-3 py-2 border border-border rounded-lg text-xs bg-white text-slate-850 focus:outline-none"
                        value={editForm.notes}
                        onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Add visit notes..."
                      />
                    </div>
                  </div>
                ) : (
                  // READ ONLY MODE
                  <>
                    {/* Timeline Connector */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-border space-y-3">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Visit Execution Timeline</h4>
                      <div className="flex items-center justify-between text-xs relative before:absolute before:top-1/2 before:inset-x-6 before:h-0.5 before:bg-slate-200">
                        <div className="relative z-10 bg-white p-2 rounded-lg border border-border text-center shadow-sm">
                          <p className="text-[10px] text-slate-400 uppercase">Arrival</p>
                          <p className="font-bold text-slate-900">
                            {selectedStop.arrivalTime ? new Date(selectedStop.arrivalTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}
                          </p>
                        </div>
                        <div className="relative z-10 bg-white p-2 rounded-lg border border-border text-center shadow-sm">
                          <p className="text-[10px] text-slate-400 uppercase">Activities</p>
                          <p className="font-bold text-emerald-600">Refill & Cash</p>
                        </div>
                        <div className="relative z-10 bg-white p-2 rounded-lg border border-border text-center shadow-sm">
                          <p className="text-[10px] text-slate-400 uppercase">Departure</p>
                          <p className="font-bold text-slate-900">
                            {selectedStop.departureTime ? new Date(selectedStop.departureTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}
                          </p>
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
                        <p className="text-xl font-bold text-emerald-700">{formatCurrency(cashAmt)}</p>
                        <div className="text-[11px] text-slate-500 space-y-0.5 border-t border-slate-200 pt-2">
                          {cashAmt > 0 ? (
                            <>
                              {n500 > 0 && <div className="flex justify-between"><span>₹500 Notes:</span> <span>{n500} x ₹500 = {formatCurrency(n500 * 500)}</span></div>}
                              {n200 > 0 && <div className="flex justify-between"><span>₹200 Notes:</span> <span>{n200} x ₹200 = {formatCurrency(n200 * 200)}</span></div>}
                              {n100 > 0 && <div className="flex justify-between"><span>₹100 Notes:</span> <span>{n100} x ₹100 = {formatCurrency(n100 * 100)}</span></div>}
                              {remCoins > 0 && <div className="flex justify-between"><span>Coins/Others:</span> <span>{formatCurrency(remCoins)}</span></div>}
                            </>
                          ) : (
                            <div className="text-slate-400 italic">No cash collected for this stop</div>
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl border border-border space-y-2">
                        <p className="text-xs text-slate-400 uppercase font-semibold">Signature Captured</p>
                        {selectedStop.signature ? (
                          <button
                            onClick={() => setShowSignatureModal(true)}
                            title="Click to verify signature"
                            className="w-full h-20 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-300 rounded-lg border border-slate-200 flex flex-col items-center justify-center text-emerald-800 transition-all cursor-pointer group"
                          >
                            <span className="font-serif italic text-base font-bold text-emerald-700 select-none group-hover:scale-105 transition-transform">
                              {selectedStopDriver ? selectedStopDriver.name : "Vikram Desai"}
                            </span>
                            <span className="text-[9px] text-emerald-600 font-semibold tracking-wider uppercase mt-1">
                              Click to Verify
                            </span>
                          </button>
                        ) : (
                          <div className="w-full h-20 bg-slate-100/50 rounded-lg border border-slate-200 flex flex-col items-center justify-center text-slate-400">
                            <span className="text-xs italic select-none">
                              No Signature Captured
                            </span>
                            <span className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase mt-1">
                              Pending Service Finish
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Notes & Comments Display */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-border space-y-2">
                      <p className="text-xs text-slate-400 uppercase font-semibold">Notes / Feedback</p>
                      <p className="text-xs text-slate-700">
                        {selectedStop.notes ? selectedStop.notes : "No notes submitted by the driver."}
                      </p>
                    </div>

                    {/* GPS Coordinates & Map Link */}
                    <div className="flex items-center justify-between text-xs bg-slate-50 p-3 rounded-lg border border-border">
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin className="w-4 h-4 text-primary-600" />
                        <span>
                          GPS Verified:{" "}
                          {selectedStopLocation
                            ? `${selectedStopLocation.lat.toFixed(4)}° N, ${selectedStopLocation.lng.toFixed(4)}° E`
                            : "19.0596° N, 72.8656° E"}
                        </span>
                      </div>
                      <a
                        href={
                          selectedStopLocation
                            ? `https://www.google.com/maps/search/?api=1&query=${selectedStopLocation.lat},${selectedStopLocation.lng}`
                            : "https://maps.google.com"
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary-600 hover:underline flex items-center gap-1 font-semibold"
                      >
                        View on Map <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer actions */}
              <div className="px-6 py-3 border-t border-border flex justify-end gap-2 bg-slate-50 flex-shrink-0">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleStartEdit}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit Stop
                    </button>
                    <button
                      onClick={() => setSelectedStop(null)}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                  </>
                )}
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

      {/* SIGNATURE VERIFICATION MODAL */}
      <AnimatePresence>
        {showSignatureModal && selectedStop && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-border shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Signature Verification</h3>
                </div>
                <button
                  onClick={() => setShowSignatureModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                <div className="text-center space-y-1">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Verified Signee</p>
                  <p className="text-lg font-bold text-slate-800">
                    {selectedStopDriver ? selectedStopDriver.name : "Vikram Desai"}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Role: Dispatched Driver (ID: {selectedStopDriver ? selectedStopDriver.id : "d1"})
                  </p>
                </div>

                {/* Simulated Signature Canvas Box */}
                <div className="relative border border-slate-200 rounded-xl bg-slate-50 h-36 flex items-center justify-center overflow-hidden bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]">
                  {/* Signature Cursive display */}
                  <span className="font-serif italic text-3xl font-extrabold text-blue-800 transform -rotate-3 select-none">
                    {selectedStopDriver ? selectedStopDriver.name : "Vikram Desai"}
                  </span>
                  {/* Grid watermark lines */}
                  <div className="absolute inset-x-0 bottom-8 border-b border-slate-200 border-dashed pointer-events-none" />
                  <div className="absolute right-4 bottom-2 text-[9px] text-slate-400 font-semibold tracking-widest uppercase">
                    Digital Signature Lock
                  </div>
                </div>

                {/* Audit details */}
                <div className="bg-slate-50 p-4 rounded-xl border border-border text-xs space-y-2 text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Verification Code:</span>
                    <span className="font-mono font-bold text-slate-800">SIG-SEC-{selectedStop.id.toUpperCase()}-X92</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Timestamp:</span>
                    <span className="font-medium text-slate-800">
                      {selectedStop.arrivalTime ? new Date(selectedStop.arrivalTime).toLocaleString() : "09:35 AM"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">GPS Lock:</span>
                    <span className="font-mono text-slate-800">
                      {selectedStopLocation
                        ? `${selectedStopLocation.lat.toFixed(5)}, ${selectedStopLocation.lng.toFixed(5)}`
                        : "19.0596, 72.8656"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Status:</span>
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> SECURE MATCH
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-border flex justify-end">
                <button
                  onClick={() => setShowSignatureModal(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  Close Verification
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
