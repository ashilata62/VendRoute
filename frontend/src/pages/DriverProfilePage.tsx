import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import {
  ArrowLeft, Phone, Mail, MapPin, Calendar as CalendarIcon,
  Shield, Loader2, Pencil, Trash2, X, Check
} from "lucide-react";

import { usersApi, routesApi, vehiclesApi, analyticsApi } from "../services/api";
import StatusBadge from "../components/shared/StatusBadge";
import PageHeader from "../components/shared/PageHeader";
import { formatDate } from "../lib/utils";

const performanceLineData = [
  { day: "Week 1", completed: 12, target: 10 },
  { day: "Week 2", completed: 15, target: 12 },
  { day: "Week 3", completed: 14, target: 12 },
  { day: "Week 4", completed: 18, target: 15 },
];

const stopsBarData = [
  { day: "Mon", stops: 12 },
  { day: "Tue", stops: 14 },
  { day: "Wed", stops: 18 },
  { day: "Thu", stops: 15 },
  { day: "Fri", stops: 20 },
  { day: "Sat", stops: 10 },
];

export default function DriverProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [driver, setDriver] = useState<any>(null);
  const [vehicle, setVehicle] = useState<any>(null);
  const [driverRoutes, setDriverRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "routes" | "attendance" | "performance">("overview");

  // Edit & Delete Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    licenseNumber: "",
    emergencyContact: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const handleOpenEdit = () => {
    if (!driver) return;
    setEditForm({
      name: driver.name || "",
      email: driver.email || "",
      phone: driver.phone || "",
      address: driver.address || "",
      licenseNumber: driver.licenseNumber || "",
      emergencyContact: driver.emergencyContact || "",
    });
    setEditError("");
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError("");
    try {
      const res = await usersApi.update(id!, editForm);
      if (res.success) {
        setDriver(res.data);
        setIsEditModalOpen(false);
      }
    } catch (err: any) {
      setEditError(err.message || "Failed to update driver details");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteDriver = async () => {
    if (!window.confirm(`Are you sure you want to delete ${driver.name}? This will also delete their assigned route records.`)) return;
    try {
      const res = await usersApi.delete(id!);
      if (res.success) {
        navigate("/drivers");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete driver");
    }
  };

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const [userRes, routesRes, vhRes] = await Promise.all([
          usersApi.getById(id),
          routesApi.getAll(),
          vehiclesApi.getAll(),
        ]);
        if (userRes.success) setDriver(userRes.data);
        if (routesRes.success) {
          setDriverRoutes(routesRes.data.filter((r: any) => r.driverId === id));
        }
        
        try {
          const analyticsRes = await analyticsApi.getDriverAnalytics(id);
          if (analyticsRes.success) setAnalyticsData(analyticsRes.data);
        } catch (e) {
          console.error("Failed to load driver analytics", e);
        }
        if (vhRes.success && userRes.success) {
          const assignedVehicle = vhRes.data.find((v: any) =>
            v.id === userRes.data.assignedVehicleId || v.driverId === id
          );
          setVehicle(assignedVehicle || null);
        }
      } catch (err) {
        console.error("Failed to load driver profile:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="text-center py-16 text-slate-400">
        <p className="text-sm font-semibold">Driver not found.</p>
        <button onClick={() => navigate('/drivers')} className="mt-3 text-xs text-primary-600 underline">Back to Drivers</button>
      </div>
    );
  }

  const avatarUrl = driver.photo || driver.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(driver.name)}&background=3B82F6&color=fff&size=96`;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={driver.name}
        description="Driver Performance Profile & Assignment Records"
        breadcrumbs={[{ label: "Drivers", path: "/drivers" }, { label: driver.name }]}
        action={
          <button
            onClick={() => navigate("/drivers")}
            className="flex items-center gap-2 text-sm text-slate-600 bg-white border border-border px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Drivers
          </button>
        }
      />

      {/* Cover Header with Gradient */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 relative" />
        <div className="px-6 pb-6 pt-0 flex flex-col sm:flex-row items-center sm:items-end justify-between -mt-12 gap-4 relative z-10">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <img
              src={avatarUrl}
              alt={driver.name}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-md bg-white bg-slate-200"
              onError={(e) => { (e.target as HTMLImageElement).src = avatarUrl; }}
            />
            <div className="mt-2 sm:mt-0">
              <h2 className="text-xl font-bold text-slate-900">{driver.name}</h2>
              <div className="flex items-center gap-2 mt-1 justify-center sm:justify-start">
                <StatusBadge status={driver.isOnline !== false ? 'active' : 'offline'} />
                <span className="text-xs text-slate-500">⭐ {driver.rating?.toFixed(1) || '4.0'} Rating</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenEdit}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit Profile
            </button>
            <button
              onClick={handleDeleteDriver}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Driver
            </button>
            <button
              onClick={() => navigate("/tracking")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Track Driver Live
            </button>
          </div>
        </div>

        {/* Profile Tabs */}
        <div className="flex border-t border-border px-6">
          {[
            { id: "overview", label: "Overview" },
            { id: "routes", label: "Assigned Routes" },
            { id: "attendance", label: "Attendance Calendar" },
            { id: "performance", label: "Performance Scorecard" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Details */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-border pb-3">Personal & License Details</h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400" /> <span>{driver.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-4 h-4 text-slate-400" /> <span>{driver.email}</span>
                </div>
                <div className="flex items-start gap-2 text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5" /> <span>{driver.address || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Shield className="w-4 h-4 text-slate-400" /> <span>License: {driver.licenseNumber || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <CalendarIcon className="w-4 h-4 text-slate-400" /> <span>Joined: {driver.createdAt ? formatDate(driver.createdAt) : 'N/A'}</span>
                </div>
              </div>

            <div className="pt-3 border-t border-border">
              <p className="text-xs font-semibold text-slate-700 mb-1">Emergency Contact</p>
              <p className="text-xs text-slate-500">{driver.emergencyContact || 'N/A'}</p>
            </div>
          </div>

          {/* Assigned Vehicle Card */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-border pb-3">Assigned Vehicle</h3>
            {vehicle ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{vehicle.model}</span>
                  <StatusBadge status={vehicle.status} />
                </div>
                <p className="font-mono text-slate-500 font-semibold">{vehicle.plateNumber}</p>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg">
                  <div><span className="text-slate-400">Fuel Level:</span> <strong className="text-emerald-600">{vehicle.currentFuelLevel}%</strong></div>
                  <div><span className="text-slate-400">Odometer:</span> <strong className="text-slate-800">{vehicle.odometer} km</strong></div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No vehicle assigned.</p>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-border pb-3">Career Achievements</h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                <p className="text-xl font-bold text-blue-700">{driverRoutes.length}</p>
                <p className="text-[10px] text-blue-500 uppercase font-semibold">Routes Finished</p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                <p className="text-xl font-bold text-emerald-700">{driver.completedStops?.toLocaleString() || driverRoutes.reduce((a: number, r: any) => a + (r.stops?.filter((s: any) => s.status === 'COMPLETED').length || 0), 0)}</p>
                <p className="text-[10px] text-emerald-500 uppercase font-semibold">Stops Visited</p>
              </div>
            </div>
            </div>
          </div>
        
        {/* Today's Shift */}
        {(() => {
            const isToday = (r: any) => {
              const dateToUse = r.endTime || r.date || r.createdAt;
              if (!dateToUse) return false;
              const d = new Date(dateToUse);
              if (isNaN(d.getTime())) return false;
              const today = new Date();
              return d.getDate() === today.getDate() && 
                     d.getMonth() === today.getMonth() && 
                     d.getFullYear() === today.getFullYear();
            };
            const todaysRoutes = driverRoutes.filter(isToday);
            const todaysCompleted = todaysRoutes.filter((r: any) => r.status === "COMPLETED").length;
            const todaysPending = todaysRoutes.length - todaysCompleted;
            
            return (
              <div className="bg-card rounded-xl border border-border shadow-sm p-6">
                <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                  <h3 className="font-bold text-slate-900 text-sm">Today's Shift (Routes)</h3>
                  <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-bold border border-purple-100">
                    {new Date().toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-border text-center">
                    <p className="text-2xl font-black text-slate-900">{todaysRoutes.length}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Total Routes</p>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-center">
                    <p className="text-2xl font-black text-emerald-600">{todaysCompleted}</p>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase mt-1">Completed</p>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-center">
                    <p className="text-2xl font-black text-amber-600">{todaysPending}</p>
                    <p className="text-[10px] text-amber-600 font-bold uppercase mt-1">Pending</p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 2: ROUTES */}
      {activeTab === "routes" && (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border font-bold text-slate-900 text-sm">Driver Route Records</div>
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-border text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Route ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Distance</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {driverRoutes.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-semibold text-slate-600">{r.id.toUpperCase()}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{r.name}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(r.date)}</td>
                  <td className="px-4 py-3 text-slate-600">{r.totalDistance} km</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: ATTENDANCE */}
      {activeTab === "attendance" && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-border pb-3">Monthly Attendance Log</h3>
          <div className="grid grid-cols-7 gap-2 text-center text-xs">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="font-semibold text-slate-400">{d}</div>
            ))}
            {Array.from({ length: 28 }).map((_, i) => (
              <div key={i} className="p-3 rounded-lg border border-border bg-emerald-50/50 text-slate-800">
                <span className="font-bold block">{i + 1}</span>
                <span className="text-[9px] text-emerald-700 font-semibold">08:00 - 17:30</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PERFORMANCE */}
      {activeTab === "performance" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl border border-border shadow-sm p-6">
              <h3 className="font-bold text-slate-900 text-sm mb-4">Routes Completed Trend</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={analyticsData?.historicalData?.completionRateByDay || performanceLineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Line type="monotone" dataKey="completed" name="Completed Stops" stroke="#2563EB" strokeWidth={2.5} />
                  <Line type="monotone" dataKey="missed" name="Missed Stops" stroke="#EF4444" strokeWidth={2.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-sm p-6">
              <h3 className="font-bold text-slate-900 text-sm mb-4">Daily Stop Volume</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={analyticsData?.historicalData?.stopVolumeByDay || stopsBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="stops" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Performance Scorecard Grade */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Performance Grade Scorecard</h3>
              <p className="text-xs text-slate-500 mt-1">Based on safety, on-time arrivals, and customer rating</p>
            </div>
            <div className={`w-16 h-16 rounded-2xl text-white font-black text-3xl flex items-center justify-center shadow-lg ${
              (analyticsData?.score || 95) >= 90 ? 'bg-emerald-500' : (analyticsData?.score || 95) >= 75 ? 'bg-amber-500' : 'bg-red-500'
            }`}>
              {(analyticsData?.score || 95) >= 90 ? 'A+' : (analyticsData?.score || 95) >= 80 ? 'B' : 'C'}
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT DRIVER PROFILE MODAL ── */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-border shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
            >
              <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-base">Edit Driver Profile</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs">
                {editError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl font-medium">
                    {editError}
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Driver Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="e.g. 7458962037"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">License Number</label>
                    <input
                      type="text"
                      value={editForm.licenseNumber}
                      onChange={(e) => setEditForm({ ...editForm, licenseNumber: e.target.value })}
                      placeholder="e.g. MH01 MG-5632"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Emergency Contact Info</label>
                  <input
                    type="text"
                    value={editForm.emergencyContact}
                    onChange={(e) => setEditForm({ ...editForm, emergencyContact: e.target.value })}
                    placeholder="e.g. Sunil (Father) - 9820011223"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Residential Address</label>
                  <textarea
                    rows={2}
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    placeholder="e.g. Sector 62, Noida, UP"
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer"
                  >
                    {editLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <>Save Changes <Check className="w-4 h-4" /></>}
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
