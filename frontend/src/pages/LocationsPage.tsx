import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Search, Grid, List, Map as MapIcon, Plus, Eye, Edit, MapPin,
  Wrench, X, Upload, Tag, Trash2, Loader2, AlertCircle, Check
} from "lucide-react";

import PageHeader from "../components/shared/PageHeader";
import { locationsApi, customersApi } from "../services/api";

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ─── Backend Data Shapes ───────────────────────────────────────────────────────
interface BackendLocation {
  id: string;
  customerId: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  createdAt: string;
  customer?: { companyName: string; contactPerson: string };
  machines?: { id: string; machineCode: string; model: string; fillLevel: number; status: string }[];
  products?: any;
}

interface BackendCustomer {
  id: string;
  companyName: string;
}

// ─── Photo Preview ────────────────────────────────────────────────────────────

const emptyForm = {
  name: "",
  address: "",
  city: "",
  latitude: 19.076,
  longitude: 72.8777,
  customerId: "",
  productInput: "",
  products: [] as string[],
  notes: "",
  photoFiles: [] as File[],
  photoPreviews: [] as string[],
};

export default function LocationsPage() {
  const navigate = useNavigate();

  // ── Data state ──────────────────────────────────────────────────────────────
  const [locations, setLocations] = useState<BackendLocation[]>([]);
  const [customers, setCustomers] = useState<BackendCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<BackendLocation | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);


  // ── Fetch data ──────────────────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [locRes, custRes] = await Promise.all([
        locationsApi.getAll(),
        customersApi.getAll(),
      ]);
      if (locRes.success) setLocations(locRes.data);
      if (custRes.success) setCustomers(custRes.data);
    } catch (err: any) {
      setError(err?.message || "Failed to load locations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filteredLocations = locations.filter((l) => {
    if (!search) return true;
    return (
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.address.toLowerCase().includes(search.toLowerCase()) ||
      l.city.toLowerCase().includes(search.toLowerCase()) ||
      l.customer?.companyName?.toLowerCase().includes(search.toLowerCase())
    );
  });

  // ── Machine status counts from backend machines ─────────────────────────────
  const allMachines = locations.flatMap((l) => l.machines || []);
  const activeCount = allMachines.filter((m) => m.status === "ACTIVE").length;
  const maintenanceCount = allMachines.filter((m) => m.status === "NEEDS_MAINTENANCE").length;
  const inactiveCount = allMachines.filter((m) => m.status === "INACTIVE").length;
  const outOfStockCount = allMachines.filter((m) => m.status === "OUT_OF_STOCK").length;

  // ── Open modals ─────────────────────────────────────────────────────────────
  const openAddModal = () => {
    setEditingLocation(null);
    setForm({ ...emptyForm, customerId: customers[0]?.id || "" });
    setSaveError("");
    setSaveSuccess(false);
    setIsModalOpen(true);
  };

  const openEditModal = (loc: BackendLocation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLocation(loc);
    setForm({
      name: loc.name,
      address: loc.address,
      city: loc.city,
      latitude: loc.latitude,
      longitude: loc.longitude,
      customerId: loc.customerId,
      productInput: "",
      products: Array.isArray(loc.products) ? loc.products : [],
      notes: "",
      photoFiles: [],
      photoPreviews: loc.imageUrl ? [loc.imageUrl] : [],
    });
    setSaveError("");
    setSaveSuccess(false);
    setIsModalOpen(true);
  };

  // ── Save (create/update) ────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveError("");
    try {
      // Create payload, attaching base64 image if exists
      const payload: any = {
        customerId: form.customerId,
        name: form.name,
        address: form.address,
        city: form.city,
        latitude: form.latitude,
        longitude: form.longitude,
        products: form.products,
      };

      if (form.photoPreviews.length > 0) {
        payload.imageUrl = form.photoPreviews[0]; // Sending the first preview (can be base64 or existing URL)
      } else {
        payload.imageUrl = null; // Clear image if removed
      }

      if (editingLocation) {
        await locationsApi.update(editingLocation.id, payload);
      } else {
        await locationsApi.create(payload);
      }
      setSaveSuccess(true);
      await fetchData();
      setTimeout(() => {
        setSaveSuccess(false);
        setIsModalOpen(false);
      }, 1200);
    } catch (err: any) {
      setSaveError(err?.message || "Failed to save location");
    } finally {
      setSaveLoading(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await locationsApi.delete(id);
      await fetchData();
    } catch (err: any) {
      alert("Delete failed: " + err?.message);
    }
  };

  // ── Product tag helpers ─────────────────────────────────────────────────────
  const handleAddProduct = () => {
    if (form.productInput.trim() && !form.products.includes(form.productInput.trim())) {
      setForm({ ...form, products: [...form.products, form.productInput.trim()], productInput: "" });
    }
  };
  const handleRemoveProduct = (p: string) => setForm({ ...form, products: form.products.filter((x) => x !== p) });

  // ── Status helper ───────────────────────────────────────────────────────────
  const getMachineStatusColor = (status: string) => {
    if (status === "ACTIVE") return "bg-emerald-100 text-emerald-700";
    if (status === "NEEDS_MAINTENANCE") return "bg-amber-100 text-amber-700";
    if (status === "OUT_OF_STOCK") return "bg-red-100 text-red-700";
    return "bg-slate-100 text-slate-600";
  };

  // ── Loading / Error ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <span className="ml-3 text-slate-500 text-sm">Loading locations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <p className="text-sm text-slate-600">{error}</p>
        <button onClick={fetchData} className="text-xs text-primary-600 font-semibold hover:underline">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Vending Machines & Locations"
        description={`Managing ${locations.length} vending machine locations across ${customers.length} customers.`}
        action={
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Location
          </button>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-center">
          <p className="text-2xl font-extrabold text-slate-900">{locations.length}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Total Locations</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-center">
          <p className="text-2xl font-extrabold text-slate-600">{allMachines.length}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Total Machines</p>
        </div>
        <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-4 text-center">
          <p className="text-2xl font-extrabold text-emerald-700">{activeCount}</p>
          <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider mt-0.5">Active</p>
        </div>
        <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4 text-center">
          <p className="text-2xl font-extrabold text-amber-700">{maintenanceCount}</p>
          <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider mt-0.5">Maintenance</p>
        </div>
        <div className="bg-red-50 rounded-2xl border border-red-100 p-4 text-center">
          <p className="text-2xl font-extrabold text-red-700">{outOfStockCount}</p>
          <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-0.5">Out of Stock</p>
        </div>
        <div className="bg-slate-100 rounded-2xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-extrabold text-slate-600">{inactiveCount}</p>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Inactive</p>
        </div>
      </div>

      {/* Filters & View Toggle */}
      <div className="bg-card rounded-lg border border-border p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, address, city, or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20"
          />
        </div>
        <div className="flex border border-border rounded-lg overflow-hidden bg-slate-50 p-0.5">
          {(["grid", "list", "map"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors ${
                viewMode === mode ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {mode === "grid" && <Grid className="w-3.5 h-3.5" />}
              {mode === "list" && <List className="w-3.5 h-3.5" />}
              {mode === "map" && <MapIcon className="w-3.5 h-3.5" />}
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filteredLocations.length === 0 && (
        <div className="text-center py-16 text-slate-400 text-sm">
          No locations found. Add your first vending location!
        </div>
      )}

      {/* GRID VIEW */}
      {viewMode === "grid" && filteredLocations.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLocations.map((loc) => (
            <div
              key={loc.id}
              onClick={() => navigate(`/locations/${loc.id}`)}
              className="bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group flex flex-col justify-between"
            >
              <div className="relative h-40 bg-gradient-to-br from-slate-200 to-slate-300 overflow-hidden flex items-center justify-center">
                {loc.imageUrl ? (
                  <img src={loc.imageUrl} alt={loc.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <MapPin className="w-12 h-12 text-slate-400" />
                )}
                <div className="absolute top-3 right-3 flex gap-1 flex-wrap justify-end">
                  {(loc.machines || []).slice(0, 2).map((m) => (
                    <span key={m.id} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getMachineStatusColor(m.status)}`}>
                      {m.machineCode}
                    </span>
                  ))}
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/locations/${loc.id}`); }}
                    className="p-2 bg-white text-slate-800 rounded-lg hover:bg-slate-100 shadow" title="View">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={(e) => openEditModal(loc, e)}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow" title="Edit">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={(e) => handleDelete(loc.id, loc.name, e)}
                    className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-primary-600 transition-colors">{loc.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{loc.customer?.companyName || "—"}</p>
                  <div className="flex items-start gap-1.5 mt-1 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{loc.address}, {loc.city}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-slate-500">
                  <span className="text-[11px] text-slate-400">{loc.machines?.length || 0} machine(s)</span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(loc.createdAt).toLocaleDateString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === "list" && filteredLocations.length > 0 && (
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-border text-xs text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Location Name</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Machines</th>
                <th className="px-4 py-3">Added</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLocations.map((loc) => (
                <tr key={loc.id} onClick={() => navigate(`/locations/${loc.id}`)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{loc.name}</p>
                    <p className="text-xs text-slate-400 truncate max-w-[200px]">{loc.address}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{loc.customer?.companyName || "—"}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{loc.city}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {(loc.machines || []).slice(0, 2).map((m) => (
                        <span key={m.id} className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${getMachineStatusColor(m.status)}`}>
                          {m.machineCode}
                        </span>
                      ))}
                      {(loc.machines?.length || 0) === 0 && <span className="text-xs text-slate-400">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {new Date(loc.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/locations/${loc.id}`); }}
                        className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-md">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={(e) => openEditModal(loc, e)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={(e) => handleDelete(loc.id, loc.name, e)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MAP VIEW */}
      {viewMode === "map" && (
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden h-[550px]">
          <MapContainer center={[20.5937, 78.9629]} zoom={5} className="h-full w-full">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {filteredLocations.map((loc) => {
              const lat = Number(loc.latitude || (loc as any).lat);
              const lng = Number(loc.longitude || (loc as any).lng);
              if (isNaN(lat) || isNaN(lng) || !lat || !lng) return null;
              return (
                <Marker key={loc.id} position={[lat, lng]}>
                <Popup>
                  <div className="p-1 text-xs space-y-1">
                    <p className="font-bold text-slate-900">{loc.name}</p>
                    <p className="text-slate-500">{loc.address}, {loc.city}</p>
                    <p className="text-slate-600">{loc.customer?.companyName}</p>
                    <p className="text-slate-500">{loc.machines?.length || 0} machine(s)</p>
                    <button onClick={() => navigate(`/locations/${loc.id}`)}
                      className="mt-2 w-full bg-primary-600 text-white py-1 text-[10px] rounded font-semibold text-center">
                      View Details
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
          </MapContainer>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-slate-50">
                <h3 className="font-bold text-slate-900 text-base">
                  {editingLocation ? "Edit Location" : "Add New Location"}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Customer selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Customer *</label>
                  <select required value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-600/20">
                    <option value="">— Select Customer —</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.companyName}</option>
                    ))}
                  </select>
                </div>

                {/* Location Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Location Name *</label>
                  <input required placeholder="e.g. Metro Hospital Main Lobby" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
                </div>

                {/* Address & City */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Full Address *</label>
                    <input required placeholder="Street, Landmark" value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">City *</label>
                    <input required placeholder="e.g. Mumbai" value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none" />
                  </div>
                </div>

                {/* Coordinates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Latitude</label>
                    <input type="number" step="any" value={form.latitude}
                      onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Longitude</label>
                    <input type="number" step="any" value={form.longitude}
                      onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none" />
                  </div>
                </div>

                {/* Products */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Products Stocked</label>
                  <div className="flex gap-2 mb-2">
                    <input type="text" placeholder="Add product tag..." value={form.productInput}
                      onChange={(e) => setForm({ ...form, productInput: e.target.value })}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddProduct(); } }}
                      className="flex-1 px-3 py-1.5 text-xs border border-border rounded-lg focus:outline-none" />
                    <button type="button" onClick={handleAddProduct}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg">
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {form.products.map((p) => (
                      <span key={p} className="bg-blue-50 text-blue-700 border border-blue-100 text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Tag className="w-3 h-3" /> {p}
                        <button type="button" onClick={() => handleRemoveProduct(p)} className="hover:text-red-600">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Photo upload (UI only) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Location Photos</label>
  <div
                    onClick={() => document.getElementById('location-photo-input')?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:bg-primary-50 hover:border-primary-300 transition-colors cursor-pointer"
                  >
                    <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                    <p className="text-xs text-slate-500 font-medium">Click to browse photos</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, WEBP supported</p>
                  </div>
                  <input
                    id="location-photo-input"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      files.forEach((f) => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setForm((prev) => ({
                            ...prev,
                            photoFiles: [...prev.photoFiles, f],
                            photoPreviews: [...prev.photoPreviews, reader.result as string],
                          }));
                        };
                        reader.readAsDataURL(f);
                      });
                    }}
                  />
                  {/* Photo Previews */}
                  {form.photoPreviews.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {form.photoPreviews.map((src, i) => (
                        <div key={i} className="relative group">
                          <img
                            src={src}
                            alt={`preview-${i}`}
                            className="w-20 h-20 object-cover rounded-lg border border-slate-200"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                photoFiles: prev.photoFiles.filter((_, j) => j !== i),
                                photoPreviews: prev.photoPreviews.filter((_, j) => j !== i),
                              }))
                            }
                            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {saveSuccess && (
                  <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl flex items-center gap-2">
                    <Check className="w-3.5 h-3.5" /> Location saved successfully!
                  </p>
                )}
                {saveError && (
                  <p className="text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5" /> {saveError}
                  </p>
                )}

                <div className="pt-4 border-t border-border flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
                    Cancel
                  </button>
                  <button type="submit" disabled={saveLoading}
                    className="px-5 py-2 text-sm bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white rounded-lg font-medium flex items-center gap-1.5">
                    {saveLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : (editingLocation ? "Save Changes" : "Create Location")}
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
