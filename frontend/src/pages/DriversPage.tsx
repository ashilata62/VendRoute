import { createPortal } from "react-dom";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, UserCheck, Award, Star,
  Plus, Search, Navigation, MessageSquare, X, ArrowUpRight, Loader2, Pencil, KeyRound, Check
} from "lucide-react";

import { usersApi, vehiclesApi } from "../services/api";
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
  const [messageDriver, setMessageDriver] = useState<any | null>(null);
  const [messageText, setMessageText] = useState("");

  // Real API state
  const [allDrivers, setAllDrivers] = useState<any[]>([]);
  const [allVehicles, setAllVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addForm, setAddForm] = useState({ name: "", email: "", phone: "", licenseNumber: "", address: "", emergencyContact: "", password: "Driver@123" });
  const [addSaving, setAddSaving] = useState(false);

  // Reset Password state
  const [resetPasswordDriver, setResetPasswordDriver] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) { setResetMsg("Password must be at least 6 characters."); return; }
    setResetting(true); setResetMsg("");
    try {
      const res = await usersApi.update(resetPasswordDriver.id, { password: newPassword });
      if (res.success) {
        setResetSuccess(true);
        setTimeout(() => { setResetPasswordDriver(null); setNewPassword(""); setResetSuccess(false); }, 1500);
      } else { setResetMsg("Failed to reset password."); }
    } catch (err: any) {
      setResetMsg(err.message || "Failed to reset password.");
    } finally { setResetting(false); }
  };

  const itemsPerPage = 6;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [drRes, vhRes] = await Promise.all([
          usersApi.getAll("driver"),
          vehiclesApi.getAll(),
        ]);
        if (drRes.success) setAllDrivers(drRes.data);
        if (vhRes.success) setAllVehicles(vhRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredDrivers = useMemo(() => {
    return allDrivers.filter((d: any) => {
      const matchSearch = !search ||
        d.name?.toLowerCase().includes(search.toLowerCase()) ||
        d.email?.toLowerCase().includes(search.toLowerCase()) ||
        d.phone?.includes(search);
      return matchSearch;
    });
  }, [search, allDrivers]);

  const totalPages = Math.ceil(filteredDrivers.length / itemsPerPage) || 1;
  const paginatedDrivers = filteredDrivers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = {
    total: allDrivers.length,
    activeToday: allDrivers.length,
    avgPerformance: "96%",
    topDriver: allDrivers[0]?.name ? `${allDrivers[0].name}` : "N/A",
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
          { label: "Registered", value: `${stats.activeToday} Drivers`, icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
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
            placeholder="Search drivers by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : allDrivers.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-semibold">No drivers found.</p>
          <p className="text-xs mt-1">Add a driver using the button above.</p>
        </div>
      ) : null}

      {/* Driver Grid (3-column layout) */}
      {!loading && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedDrivers.map((driver: any) => {
          const vehicle =
            allVehicles.find((v: any) => v.assignedDriverId === driver.id || v.user?.id === driver.id) ||
            (driver.vehicle && driver.vehicle.length > 0 ? driver.vehicle[0] : null) ||
            allVehicles.find((v: any) => v.id === driver.route?.[0]?.vehicleId) ||
            driver.route?.[0]?.vehicle;
          const score = driver.rating ? Math.round(driver.rating * 20) : 80;
          const avatarUrl = driver.photo || driver.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(driver.name)}&background=3B82F6&color=fff&size=80`;

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
                        src={avatarUrl}
                        alt={driver.name}
                        className="w-20 h-20 rounded-full object-cover ring-2 ring-slate-100 shadow-inner bg-slate-200"
                        onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(driver.name)}&background=3B82F6&color=fff&size=80`; }}
                      />
                      <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${driver.isOnline !== false ? "bg-emerald-500" : "bg-red-500"}`} title={driver.isOnline !== false ? "Online" : "Offline"} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base group-hover:text-primary-600 transition-colors">
                        {driver.name}
                      </h3>
                      <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-100">
                        {driver.role === 'driver' ? 'Field Driver' : driver.role}
                      </span>
                      <div className="mt-1">
                        <StarRating rating={driver.rating || 4.0} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={driver.isOnline !== false ? "active" : "offline"} />
                    <button
                      onClick={() => { setResetPasswordDriver(driver); setNewPassword(""); setResetMsg(""); setResetSuccess(false); }}
                      className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                      title="Reset Password"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => navigate(`/drivers/${driver.id}`)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Edit Driver Profile"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
                    <p className="text-slate-400 text-[10px]">Email</p>
                    <p className="font-bold text-slate-900 mt-0.5 truncate text-[10px]">{driver.email}</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-border">
                    <p className="text-slate-400 text-[10px]">Phone</p>
                    <p className="font-bold text-slate-900 mt-0.5">{driver.phone || "—"}</p>
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
              </div>
            </motion.div>
          );
        })}
      </div>
      )}

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

      {/* ADD DRIVER MODAL - connected to real API */}
      {createPortal(
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
              <form onSubmit={async (e) => {
                e.preventDefault();
                setAddSaving(true);
                try {
                  const res = await usersApi.create({ ...addForm, role: 'driver' });
                  if (res.success) {
                    setAllDrivers(prev => [res.data, ...prev]);
                    setIsAddModalOpen(false);
                    setAddForm({ name: '', email: '', phone: '', licenseNumber: '', address: '', emergencyContact: '', password: 'Driver@123' });
                    alert('Driver added successfully!');
                  }
                } catch (err: any) {
                  alert(err.message || 'Failed to add driver');
                } finally {
                  setAddSaving(false);
                }
              }} className="p-6 space-y-3.5 text-xs max-h-[80vh] overflow-y-auto">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input type="text" required value={addForm.name} onChange={e => setAddForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Vikram Sharma" className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                    <input type="email" required value={addForm.email} onChange={e => setAddForm(f => ({...f, email: e.target.value}))} placeholder="driver@vendroute.in" className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                    <input type="text" value={addForm.phone} onChange={e => setAddForm(f => ({...f, phone: e.target.value}))} placeholder="+91 98200 00000" className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">License Number</label>
                    <input type="text" value={addForm.licenseNumber} onChange={e => setAddForm(f => ({...f, licenseNumber: e.target.value}))} placeholder="MH-0120260099" className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Password *</label>
                    <input type="text" required value={addForm.password} onChange={e => setAddForm(f => ({...f, password: e.target.value}))} placeholder="Default: Driver@123" className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Residential Address</label>
                  <input type="text" value={addForm.address} onChange={e => setAddForm(f => ({...f, address: e.target.value}))} placeholder="e.g. Bandra West, Mumbai" className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Emergency Contact</label>
                  <input type="text" value={addForm.emergencyContact} onChange={e => setAddForm(f => ({...f, emergencyContact: e.target.value}))} placeholder="e.g. Ramesh Sharma (Brother) · +91 98200 99887" className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none" />
                </div>
                <div className="pt-4 border-t border-border flex justify-end gap-2">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                  <button type="submit" disabled={addSaving} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg flex items-center gap-2">
                    {addSaving ? <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</> : 'Save Driver'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
        document.body
      )}

      {/* MESSAGE DRAWER */}
      {createPortal(
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
      </AnimatePresence>,
        document.body
      )}

      {/* Reset Password Modal */}
      {resetPasswordDriver && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-500" /> Reset Driver Password
              </h3>
              <button onClick={() => setResetPasswordDriver(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Setting new password for <span className="font-bold text-slate-800">{resetPasswordDriver.name}</span>. They will use this to log in to the Driver App.
            </p>
            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Enter new password (min. 6 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
              {resetMsg && <div className="bg-red-50 text-red-700 p-2.5 rounded-xl text-xs font-semibold">{resetMsg}</div>}
              {resetSuccess && (
                <div className="bg-emerald-50 text-emerald-700 p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4" /> Password updated successfully!
                </div>
              )}
              <div className="pt-1 flex justify-end gap-2">
                <button type="button" onClick={() => setResetPasswordDriver(null)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                <button type="submit" disabled={resetting} className="px-4 py-2 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-60 rounded-xl shadow-sm">
                  {resetting ? "Saving..." : "Save New Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
