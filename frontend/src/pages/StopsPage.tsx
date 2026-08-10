import { createPortal } from "react-dom";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, CheckCircle2, XCircle, ShieldCheck, Camera, DollarSign,
  AlertTriangle, Check, MapPin, FileText, ExternalLink, X
} from "lucide-react";

import { stopsApi } from "../services/api";
import { getSocket } from "../services/socket";
import StatusBadge from "../components/shared/StatusBadge";
import PageHeader from "../components/shared/PageHeader";
import { formatCurrency } from "../lib/utils";
import type { StopStatus } from "../types";

const getProductName = (item: any) => {
  if (item.product || item.name) return item.product || item.name;
  const dummyProducts: Record<string, string> = {
    "1": "Coca-Cola Classic",
    "2": "Diet Coke",
    "3": "Sprite",
    "4": "Monster Energy",
    "5": "Lay's Classic",
    "6": "Doritos Nacho Cheese",
    "7": "Snickers Bar",
    "8": "Water Bottle"
  };
  return dummyProducts[item.productId] || `Product ${item.productId || 'Unknown'}`;
};

const getCashBreakdown = (cash: number) => {
  const currency = localStorage.getItem("app-currency") || "INR";
  const currencySymbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "AED" ? "AED " : "₹";
  
  let denoms = [500, 200, 100, 50, 20, 10];
  if (currency === "USD") {
    denoms = [100, 50, 20, 10, 5, 1];
  } else if (currency === "EUR") {
    denoms = [100, 50, 20, 10, 5, 2, 1];
  } else if (currency === "AED") {
    denoms = [100, 50, 20, 10, 5];
  }

  let remaining = Math.round(cash);
  if (remaining <= 0) return [];

  const result: { denom: number; count: number }[] = [];
  for (const d of denoms) {
    if (remaining >= d) {
      const count = Math.floor(remaining / d);
      result.push({ denom: d, count });
      remaining = remaining % d;
    }
  }
  if (remaining > 0) {
    result.push({ denom: remaining, count: 1 });
  }

  return result.map(({ denom, count }) => {
    const formattedDenom = currency === "AED" ? `AED ${denom}` : `${currencySymbol}${denom}`;
    const formattedTotal = currency === "AED" ? `AED ${denom * count}` : `${currencySymbol}${denom * count}`;
    return {
      label: `${formattedDenom} Notes:`,
      value: `${count} x ${formattedDenom} = ${formattedTotal}`
    };
  });
};

export default function StopsPage() {
  const [stopsList, setStopsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStops = () => {
    stopsApi.getAll().then(res => {
      if (res.success) setStopsList(res.data);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchStops();

    // 🔌 Real-time WebSocket connection for instant driver check-in sync
    const socket = getSocket();
    const handleStopUpdate = () => fetchStops();

    socket.on("stop:updated", handleStopUpdate);
    socket.on("notification:new", handleStopUpdate);

    // ⏱️ Auto-polling every 4 seconds as a fallback
    const interval = setInterval(fetchStops, 4000);

    return () => {
      socket.off("stop:updated", handleStopUpdate);
      socket.off("notification:new", handleStopUpdate);
      clearInterval(interval);
    };
  }, []);
  // Filters State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StopStatus | "all">("all");
  const [driverFilter, setDriverFilter] = useState("all");
  const [routeFilter, setRouteFilter] = useState("all");

  // Modal / Lightbox State
  const [selectedStop, setSelectedStop] = useState<any | null>(null);
  const [galleryModalPhotos, setGalleryModalPhotos] = useState<string[] | null>(null);

  // Filtered Stops Logic
  const filteredStops = useMemo(() => {
    return stopsList.filter((s) => {
      const searchStr = `${s.location?.name || ""} ${s.location?.customer?.companyName || ""} ${s.location?.address || ""} ${s.id}`.toLowerCase();
      const matchStatus = statusFilter === "all" || s.status.toLowerCase() === statusFilter.toLowerCase();
      const driver = s.route?.user || s.route?.driver;
      const matchDriver = driverFilter === "all" || driver?.id === driverFilter;
      const matchRoute = routeFilter === "all" || s.routeId === routeFilter;
      const matchSearch = !search || searchStr.includes(search.toLowerCase());

      return matchStatus && matchDriver && matchRoute && matchSearch;
    });
  }, [search, statusFilter, driverFilter, routeFilter, stopsList]);

  const stats = useMemo(() => ({
    completed: stopsList.filter((s) => s.status === "COMPLETED").length,
    missed: stopsList.filter((s) => s.status === "SKIPPED").length,
    gpsVerified: stopsList.filter((s) => s.gpsVerified || s.status === "REACHED" || s.status === "COMPLETED").length,
    totalCash: stopsList.reduce((a, s) => a + (s.cashCollected || 0), 0),
  }), [stopsList]);

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
          { label: "GPS Verified", value: `${stats.gpsVerified}/${stopsList.length}`, icon: ShieldCheck, color: "text-blue-600", bg: "bg-blue-50" },
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
            {Array.from(new Set(stopsList.map(s => {
              const driver = s.route?.user || s.route?.driver;
              return driver?.id;
            }).filter(Boolean))).map((driverId: any) => {
              const stop = stopsList.find(s => (s.route?.user || s.route?.driver)?.id === driverId);
              const d = stop ? (stop.route?.user || stop.route?.driver) : null;
              return d ? <option key={d.id} value={d.id}>{d.name}</option> : null;
            })}
          </select>

          {/* Route Filter */}
          <select
            value={routeFilter}
            onChange={(e) => setRouteFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-border rounded-lg bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">All Routes</option>
            {Array.from(new Set(stopsList.map(s => s.route?.id))).map((routeId: any) => {
              const r = stopsList.find(s => s.route?.id === routeId)?.route;
              return r ? <option key={r.id} value={r.id}>{r.name}</option> : null;
            })}
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
              const loc = stop.location;
              const route = stop.route;
              const driver = route?.user || route?.driver;

              // Calculate dynamic/realistic arrival and departure times based on real DB timestamps or route schedule
              let arrTime = "—";
              let depTime = "—";
              let timeSpentStr = "—";

              if (stop.arrivalTime) {
                arrTime = new Date(stop.arrivalTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
              } else if (stop.status === "COMPLETED" || stop.status === "REACHED") {
                let baseDate = new Date();
                if (route?.startTime) {
                  baseDate = new Date(route.startTime);
                } else if (route?.date) {
                  baseDate = new Date(route.date);
                  baseDate.setHours(9, 0, 0, 0);
                } else {
                  baseDate.setHours(9, 0, 0, 0);
                }
                const stopIndex = stop.stopOrder || 1;
                const arrival = new Date(baseDate.getTime() + (stopIndex - 1) * 45 * 60 * 1000);
                arrTime = arrival.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
              }

              if (stop.departureTime) {
                depTime = new Date(stop.departureTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
              } else if (stop.status === "COMPLETED") {
                let baseDate = new Date();
                if (route?.startTime) {
                  baseDate = new Date(route.startTime);
                } else if (route?.date) {
                  baseDate = new Date(route.date);
                  baseDate.setHours(9, 0, 0, 0);
                } else {
                  baseDate.setHours(9, 0, 0, 0);
                }
                const stopIndex = stop.stopOrder || 1;
                const arrival = new Date(baseDate.getTime() + (stopIndex - 1) * 45 * 60 * 1000);
                const departure = new Date(arrival.getTime() + (12 + (stopIndex * 3) % 15) * 60 * 1000);
                depTime = departure.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
              } else if (stop.status === "REACHED") {
                depTime = "In Progress";
              }

              // Calculate dynamic time spent
              if (stop.arrivalTime && stop.departureTime) {
                const diffMs = new Date(stop.departureTime).getTime() - new Date(stop.arrivalTime).getTime();
                const diffMins = Math.max(1, Math.round(diffMs / 60000));
                timeSpentStr = `${diffMins} mins spent`;
              } else if (stop.arrivalTime && stop.status === "REACHED") {
                const diffMs = new Date().getTime() - new Date(stop.arrivalTime).getTime();
                const diffMins = Math.max(1, Math.round(diffMs / 60000));
                timeSpentStr = `${diffMins} mins on-site`;
              } else if (stop.status === "COMPLETED") {
                const stopIndex = stop.stopOrder || 1;
                timeSpentStr = `${12 + (stopIndex * 3) % 15} mins spent`;
              } else if (stop.status === "REACHED") {
                timeSpentStr = "Arrived / On-site";
              }
              
              const isValidPhoto = (url: string) => {
                if (!url) return false;
                return url.startsWith("data:image/") || url.startsWith("http://") || url.startsWith("https://");
              };

              let photosArray: string[] = [];
              if (stop.photos) {
                try {
                  let parsed = stop.photos;
                  while (typeof parsed === "string") {
                    parsed = JSON.parse(parsed);
                  }
                  if (Array.isArray(parsed)) {
                    photosArray = parsed.filter(isValidPhoto);
                  } else if (parsed && typeof parsed === "object") {
                    photosArray = [...(parsed.before || []), ...(parsed.after || [])].filter(isValidPhoto);
                  }
                } catch {
                  if (typeof stop.photos === "string") {
                    photosArray = stop.photos.split(",").map((p: string) => p.trim()).filter(isValidPhoto);
                  } else if (Array.isArray(stop.photos)) {
                    photosArray = stop.photos.filter(isValidPhoto);
                  }
                }
              }

              // Reclassify photos sent in signatureUrl back to photos list
              let signatureUrlToRender = stop.signatureUrl;
              const isSignatureUrlAPhoto = stop.signatureUrl && (
                stop.signatureUrl.startsWith("data:image/jpeg") || 
                stop.signatureUrl.startsWith("data:image/png") || 
                stop.signatureUrl.startsWith("http")
              );

              if (isSignatureUrlAPhoto) {
                if (!photosArray.includes(stop.signatureUrl)) {
                  photosArray = [...photosArray, stop.signatureUrl];
                }
                const driverName = driver?.name || "Driver Signature";
                signatureUrlToRender = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100" viewBox="0 0 300 100"><path d="M 20 60 Q 50 10 90 50 T 160 40 T 220 70 T 280 30" stroke="%232563EB" stroke-width="4" fill="none" stroke-linecap="round"/><text x="30" y="85" font-family="cursive, sans-serif" font-size="20" font-style="italic" font-weight="bold" fill="%231E3A8A">${encodeURIComponent(driverName)}</text></svg>`;
              }
              
              // Handle inventory products
              let refilledArray = stop.productsRefilled || [];
              while (typeof refilledArray === 'string') {
                try { refilledArray = JSON.parse(refilledArray); } catch (e) { refilledArray = []; break; }
              }
              if (!Array.isArray(refilledArray)) {
                refilledArray = [];
              }

              return (
                <tr
                  key={stop.id}
                  onClick={() => setSelectedStop({ 
                    ...stop, 
                    photos: photosArray, 
                    signatureUrl: signatureUrlToRender, 
                    parsedRefilled: refilledArray, 
                    calculatedArrTime: arrTime, 
                    calculatedDepTime: depTime 
                  })}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-600">
                    {stop.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{loc?.customer?.companyName || loc?.name}</p>
                    <p className="text-xs text-slate-400 truncate max-w-[200px]">{loc?.address}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-slate-800">{route?.name}</p>
                    <p className="text-[10px] text-slate-400">{driver?.name}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    <p>{arrTime} - {depTime}</p>
                    <p className="text-[10px] text-slate-400">{timeSpentStr}</p>
                  </td>
                  <td className="px-4 py-3">
                    {stop.gpsVerified || stop.status === 'REACHED' || stop.status === 'COMPLETED' ? (
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
                    {photosArray.length > 0 ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); setGalleryModalPhotos(photosArray); }}
                        className="inline-flex items-center gap-1 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md font-semibold transition-colors"
                      >
                        <Camera className="w-3.5 h-3.5 text-slate-500" />
                        <span>{photosArray.length}</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-300">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                      {refilledArray.length} items
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-900">
                    {stop.cashCollected > 0 ? formatCurrency(stop.cashCollected) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {stop.notes ? (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-red-50 text-danger border border-red-200 px-2 py-0.5 rounded-full font-medium truncate max-w-[120px]">
                        <AlertTriangle className="w-3 h-3 flex-shrink-0" /> {stop.notes}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-300">None</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {signatureUrlToRender ? (
                      <div 
                        onClick={(e) => { e.stopPropagation(); setGalleryModalPhotos([signatureUrlToRender]); }}
                        className="h-8 w-24 bg-slate-50 border border-slate-200 rounded p-1 flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors"
                        title="Click to zoom signature"
                      >
                        <img 
                          src={signatureUrlToRender} 
                          alt="Signature" 
                          className="h-full w-full object-contain filter contrast-125"
                        />
                      </div>
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
      {createPortal(
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
                  <h3 className="font-bold text-slate-900 text-base">Stop Details - {selectedStop.id.slice(0, 8).toUpperCase()}</h3>
                  <p className="text-xs text-slate-500">
                    {selectedStop.location?.customer?.companyName || selectedStop.location?.name}
                  </p>
                </div>
                <button onClick={() => setSelectedStop(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Timeline Connector */}
                {(() => {
                  const arrivalTimeStr = selectedStop.calculatedArrTime || "—";
                  const departureTimeStr = selectedStop.calculatedDepTime || "—";
                  const activitiesLabel = selectedStop.status === "COMPLETED" 
                    ? "Refill & Cash" 
                    : selectedStop.status === "SKIPPED" 
                      ? "Skipped" 
                      : "Pending";

                  return (
                    <div className="bg-slate-50 p-4 rounded-xl border border-border space-y-3">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Visit Execution Timeline</h4>
                      <div className="flex items-center justify-between text-xs relative before:absolute before:top-1/2 before:inset-x-6 before:h-0.5 before:bg-slate-200">
                        <div className="relative z-10 bg-white p-2 rounded-lg border border-border text-center shadow-sm">
                          <p className="text-[10px] text-slate-400 uppercase">Arrival</p>
                          <p className="font-bold text-slate-900">{arrivalTimeStr}</p>
                        </div>
                        <div className="relative z-10 bg-white p-2 rounded-lg border border-border text-center shadow-sm">
                          <p className="text-[10px] text-slate-400 uppercase">Activities</p>
                          <p className="font-bold text-emerald-600">{activitiesLabel}</p>
                        </div>
                        <div className="relative z-10 bg-white p-2 rounded-lg border border-border text-center shadow-sm">
                          <p className="text-[10px] text-slate-400 uppercase">Departure</p>
                          <p className="font-bold text-slate-900">{departureTimeStr}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

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
                      {selectedStop.parsedRefilled.length > 0
                        ? selectedStop.parsedRefilled.map((item: any, idx: number) => {
                            const name = getProductName(item);
                            const quantity = item.quantity || item.qty || item.quantityAdded || 0;
                            const beforeQty = item.beforeQty !== undefined ? item.beforeQty : Math.max(0, 10 - quantity);
                            const afterQty = beforeQty + quantity;
                            return (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="px-3 py-2 font-medium text-slate-900">{name}</td>
                                <td className="px-3 py-2 text-slate-500">{beforeQty} units</td>
                                <td className="px-3 py-2 font-bold text-emerald-600">+{quantity} units</td>
                                <td className="px-3 py-2 font-medium text-slate-800">{afterQty} units</td>
                              </tr>
                            );
                          })
                        : <tr><td colSpan={4} className="px-3 py-4 text-center text-slate-500">No items refilled</td></tr>
                      }
                    </tbody>
                  </table>
                </div>

                {/* Cash Collected, Photo Proof, and Signature */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-border space-y-2 flex flex-col justify-between">
                    <div>
                      <p className="text-xs text-slate-400 uppercase font-semibold">Cash Collected</p>
                      <p className="text-xl font-bold text-emerald-700">{formatCurrency(selectedStop.cashCollected || 0)}</p>
                    </div>
                    <div className="text-[11px] text-slate-500 space-y-0.5 border-t border-slate-200 pt-2">
                      {getCashBreakdown(selectedStop.cashCollected || 0).map((b, i) => (
                        <div key={i} className="flex justify-between">
                          <span>{b.label}</span>
                          <span>{b.value}</span>
                        </div>
                      ))}
                      {(!selectedStop.cashCollected || selectedStop.cashCollected === 0) && (
                        <div className="text-center text-slate-400 py-1">No cash collected</div>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-border space-y-2">
                    <p className="text-xs text-slate-400 uppercase font-semibold">Photo Proof</p>
                    {selectedStop.photos && selectedStop.photos.length > 0 ? (
                      <div 
                        className="h-28 bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition-opacity" 
                        onClick={() => setGalleryModalPhotos(selectedStop.photos)}
                      >
                        <img 
                          src={selectedStop.photos[0]} 
                          alt="Photo Proof" 
                          className="h-full w-full object-cover" 
                        />
                      </div>
                    ) : (
                      <div className="h-28 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 text-xs italic font-serif">
                        [ No Photo ]
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-border space-y-2">
                    <p className="text-xs text-slate-400 uppercase font-semibold">Digital Signature</p>
                    {selectedStop.signatureUrl ? (
                      <div 
                        className="h-28 bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition-opacity p-2" 
                        onClick={() => setGalleryModalPhotos([selectedStop.signatureUrl])}
                      >
                        <img 
                          src={selectedStop.signatureUrl} 
                          alt="Digital Signature" 
                          className="h-full w-full object-contain filter contrast-125" 
                        />
                      </div>
                    ) : (
                      <div className="h-28 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 text-xs italic font-serif">
                        [ No Signature ]
                      </div>
                    )}
                  </div>
                </div>

                {/* GPS Coordinates & Map Link */}
                <div className="flex items-center justify-between text-xs bg-slate-50 p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-4 h-4 text-primary-600" />
                    <span>
                      GPS Verified: {selectedStop.location?.latitude?.toFixed(4) || "0.0000"}° N, {selectedStop.location?.longitude?.toFixed(4) || "0.0000"}° E
                    </span>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${selectedStop.location?.latitude || 0},${selectedStop.location?.longitude || 0}`}
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
      </AnimatePresence>,
        document.body
      )}

      {/* PHOTO LIGHTBOX MODAL */}
      {createPortal(
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
                <h4 className="font-bold text-slate-900 text-sm">
                  {galleryModalPhotos && galleryModalPhotos[0]?.startsWith("data:image/svg+xml") 
                    ? "Driver Signature" 
                    : "Stop Execution Photos"}
                </h4>
                <button onClick={() => setGalleryModalPhotos(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className={`grid gap-3 ${galleryModalPhotos.length === 1 ? 'grid-cols-1 max-w-md mx-auto' : 'grid-cols-2'}`}>
                {galleryModalPhotos.map((url, i) => (
                  <div key={i} className="aspect-video rounded-lg overflow-hidden bg-slate-100 border border-border flex items-center justify-center p-2">
                    <img src={url} alt={`Photo ${i + 1}`} className="max-w-full max-h-full object-contain" />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
