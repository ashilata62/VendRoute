import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, UserCheck, Award, Star,
  Plus, Search, Navigation, MessageSquare, X, ArrowUpRight
} from "lucide-react";

import { mockDrivers, mockVehicles } from "../data/mockData";
import StatusBadge from "../components/shared/StatusBadge";
import PageHeader from "../components/shared/PageHeader";
import type { Driver } from "../types";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-3.5 h-3.5 ${n <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"}`}
        />
      ))}
      <span className="text-xs font-semibold text-slate-700 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function DriversPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [messageDriver, setMessageDriver] = useState<Driver | null>(null);
  const [messageText, setMessageText] = useState("");

  const itemsPerPage = 6;

  const filteredDrivers = useMemo(() => {
    return mockDrivers.filter((d) => {
      const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.phone.includes(search);
      const matchStatus = statusFilter === "all" || d.liveStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter]);

  const totalPages = Math.ceil(filteredDrivers.length / itemsPerPage) || 1;
  const paginatedDrivers = filteredDrivers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = {
    total: mockDrivers.length,
    activeToday: mockDrivers.filter((d) => d.liveStatus !== "offline").length,
    avgPerformance: "96%",
    topDriver: "Arjun Sharma (⭐4.9)",
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Drivers & Fleet Staff"
        description="Manage driver profiles, assignments, performance scores, and live status."
        action={
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Driver
          </button>
        }
      />

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Drivers", value: stats.total, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Active Today", value: `${stats.activeToday} Online`, icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Avg Performance", value: stats.avgPerformance, icon: ArrowUpRight, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Top Performer", value: stats.topDriver, icon: Award, color: "text-amber-600", bg: "bg-amber-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bg}`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">{label}</p>
              <p className="text-base font-bold text-slate-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-card rounded-lg border border-border p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search drivers by name, phone, or license..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-border rounded-lg bg-white text-slate-700 focus:outline-none"
        >
          <option value="all">All Live Statuses</option>
          <option value="online">Online</option>
          <option value="on-route">On Route</option>
          <option value="offline">Offline</option>
        </select>
      </div>

      {/* Driver Grid (3-column layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedDrivers.map((driver) => {
          const vehicle = mockVehicles.find((v) => v.id === driver.assignedVehicleId);
          const score = Math.round(driver.rating * 20); // 0-100 scale

          return (
            <motion.div
              key={driver.id}
              whileHover={{ y: -3 }}
              className="bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between relative group"
            >
              <div>
                {/* Header info */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <img
                        src={driver.photo}
                        alt={driver.name}
                        className="w-20 h-20 rounded-full object-cover ring-2 ring-slate-100 shadow-inner"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                          driver.liveStatus === "on-route"
                            ? "bg-blue-500 animate-pulse"
                            : driver.liveStatus === "online"
                            ? "bg-emerald-500"
                            : "bg-slate-300"
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base group-hover:text-primary-600 transition-colors">
                        {driver.name}
                      </h3>
                      <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-100">
                        Senior Field Officer
                      </span>
                      <div className="mt-1">
                        <StarRating rating={driver.rating} />
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={driver.liveStatus} />
                </div>

                {/* Score & Assigned Vehicle */}
                <div className="bg-slate-50 rounded-lg p-3 border border-border flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Assigned Vehicle</p>
                    <p className="text-xs font-bold text-slate-800 truncate max-w-[150px]">
                      {vehicle ? `${vehicle.model} (${vehicle.plateNumber})` : "Unassigned"}
                    </p>
                  </div>
                  {/* Score Indicator */}
                  <div className="text-center">
                    <span className="text-xs font-extrabold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full border border-primary-100">
                      {score}/100 Score
                    </span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-2 text-center mb-4 text-xs">
                  <div className="bg-slate-50 p-2 rounded-lg border border-border">
                    <p className="text-slate-400 text-[10px]">Routes Completed</p>
                    <p className="font-bold text-slate-900 mt-0.5">{driver.totalRoutes}</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-border">
                    <p className="text-slate-400 text-[10px]">Stops Done</p>
                    <p className="font-bold text-slate-900 mt-0.5">{driver.completedStops.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 border-t border-border pt-4">
                <button
                  onClick={() => navigate(`/drivers/${driver.id}`)}
                  className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors text-center"
                >
                  Profile
                </button>
                <button
                  onClick={() => navigate("/tracking")}
                  className="px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <Navigation className="w-3 h-3" /> Track
                </button>
                <button
                  onClick={() => setMessageDriver(driver)}
                  className="px-2 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <MessageSquare className="w-3 h-3" /> Message
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4 text-xs text-slate-500">
          <span>Showing Page {currentPage} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-3 py-1.5 border border-border rounded-lg disabled:opacity-40 hover:bg-slate-50"
            >
              Previous
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-3 py-1.5 border border-border rounded-lg disabled:opacity-40 hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ADD DRIVER MODAL */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl border border-border shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-slate-50">
                <h3 className="font-bold text-slate-900 text-base">Add New Driver</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); setIsAddModalOpen(false); }} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input type="text" required placeholder="e.g. Vikram Sharma" className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input type="email" required placeholder="driver@vendroute.in" className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input type="text" required placeholder="+91 98200 00000" className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">License Number *</label>
                  <input type="text" required placeholder="MH-012024009999" className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none" />
                </div>
                <div className="pt-4 border-t border-border flex justify-end gap-2">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg">Save Driver</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MESSAGE DRAWER */}
      <AnimatePresence>
        {messageDriver && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-sm">
            <motion.div
              initial={{ x: 300 }}
              animate={{ x: 0 }}
              exit={{ x: 300 }}
              className="bg-white w-full max-w-sm h-full shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b border-border flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <img src={messageDriver.photo} alt={messageDriver.name} className="w-8 h-8 rounded-full" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{messageDriver.name}</h4>
                    <p className="text-[10px] text-slate-400">Dispatch Messaging</p>
                  </div>
                </div>
                <button onClick={() => setMessageDriver(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 p-4 bg-slate-50 overflow-y-auto space-y-3 text-xs">
                <div className="bg-white p-3 rounded-lg border border-border shadow-sm max-w-[80%]">
                  <p className="text-slate-700">Dispatch: Please complete stop #3 before 2:00 PM.</p>
                  <span className="text-[9px] text-slate-400 block mt-1">11:30 AM</span>
                </div>
              </div>

              <div className="p-3 border-t border-border flex gap-2">
                <input
                  type="text"
                  placeholder="Type dispatch message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-border rounded-lg focus:outline-none"
                />
                <button
                  onClick={() => { alert(`Message sent to ${messageDriver.name}`); setMessageText(""); setMessageDriver(null); }}
                  className="bg-primary-600 text-white font-semibold text-xs px-3 py-2 rounded-lg"
                >
                  Send
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
