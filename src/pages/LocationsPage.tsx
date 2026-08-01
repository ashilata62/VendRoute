import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Search, Grid, List, Map as MapIcon, Plus, Eye, Edit, MapPin,
  Wrench, X, Upload, Tag, Trash2
} from "lucide-react";

import { useLocationStore } from "../store/locationStore";
import StatusBadge from "../components/shared/StatusBadge";
import PageHeader from "../components/shared/PageHeader";
import { formatDate } from "../lib/utils";
import type { VendingLocation, MachineType, LocationStatus, VisitFrequency } from "../types";

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const machineTypes: (MachineType | "all")[] = ["all", "Snack", "Beverage", "Combo", "Coffee"];
const statusOptions: (LocationStatus | "all")[] = ["all", "operational", "needs-service", "offline"];

export default function LocationsPage() {
  const navigate = useNavigate();
  const { locations, filteredLocations, filters, setFilter, addLocation, updateLocation, deleteLocation } = useLocationStore();
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<VendingLocation | null>(null);

  // Form State
  const [form, setForm] = useState({
    customerName: "",
    address: "",
    lat: 19.0760,
    lng: 72.8777,
    contactPerson: "",
    contactPhone: "",
    machineId: "",
    machineType: "Combo" as MachineType,
    products: ["Lays", "Pepsi", "Water"],
    productInput: "",
    visitFrequency: "Weekly" as VisitFrequency,
    notes: "",
    photos: [] as string[],
  });

  const displayedLocations = filteredLocations();

  const openAddModal = () => {
    setEditingLocation(null);
    setForm({
      customerName: "",
      address: "",
      lat: 19.0760,
      lng: 72.8777,
      contactPerson: "",
      contactPhone: "",
      machineId: `M-0${locations.length + 1}`,
      machineType: "Combo",
      products: ["Lays", "Pepsi", "Water"],
      productInput: "",
      visitFrequency: "Weekly",
      notes: "",
      photos: ["https://picsum.photos/seed/locnew/400/300"],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (loc: VendingLocation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLocation(loc);
    setForm({
      customerName: loc.customerName,
      address: loc.address,
      lat: loc.lat,
      lng: loc.lng,
      contactPerson: loc.contactPerson,
      contactPhone: loc.contactPhone,
      machineId: loc.machineId,
      machineType: loc.machineType,
      products: [...loc.products],
      productInput: "",
      visitFrequency: loc.visitFrequency,
      notes: loc.notes,
      photos: [...loc.photoGallery],
    });
    setIsModalOpen(true);
  };

  const handleAddProduct = () => {
    if (form.productInput.trim() && !form.products.includes(form.productInput.trim())) {
      setForm({ ...form, products: [...form.products, form.productInput.trim()], productInput: "" });
    }
  };

  const handleRemoveProduct = (p: string) => {
    setForm({ ...form, products: form.products.filter((item) => item !== p) });
  };

  const handleDelete = (id: string, machineId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete Vending Machine ${machineId}?`)) {
      deleteLocation(id);
      alert(`Vending Machine ${machineId} deleted successfully.`);
    }
  };

  const handleMaintenance = (id: string, machineId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    updateLocation(id, { status: "needs-service" });
    alert(`Vending Machine ${machineId} status set to Maintenance (Needs Service).`);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLocation) {
      updateLocation(editingLocation.id, {
        customerName: form.customerName,
        address: form.address,
        lat: form.lat,
        lng: form.lng,
        contactPerson: form.contactPerson,
        contactPhone: form.contactPhone,
        machineId: form.machineId,
        machineType: form.machineType,
        products: form.products,
        visitFrequency: form.visitFrequency,
        notes: form.notes,
        photoGallery: form.photos,
      });
      alert(`Vending machine ${form.machineId} updated successfully.`);
    } else {
      const newLoc = {
        id: `loc-${Date.now()}`,
        customerName: form.customerName,
        address: form.address,
        lat: form.lat,
        lng: form.lng,
        contactPerson: form.contactPerson,
        contactPhone: form.contactPhone,
        machineId: form.machineId,
        machineType: form.machineType,
        products: form.products,
        visitFrequency: form.visitFrequency,
        notes: form.notes,
        photoGallery: form.photos,
        customerId: `cust-${Date.now()}`,
        lastServiceDate: new Date().toISOString().split("T")[0],
        nextServiceDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        status: "operational" as const,
        revenue: 0,
      };
      addLocation(newLoc);
      alert(`New vending machine ${form.machineId} added successfully.`);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Vending Machines"
        description={`Managing ${displayedLocations.length} enterprise vending machine units.`}
        action={
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Vending Machine
          </button>
        }
      />

      {/* Vending Machines Statistics Row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-center">
          <p className="text-2xl font-extrabold text-slate-900">{locations.length}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Total Machines</p>
        </div>
        <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-4 text-center">
          <p className="text-2xl font-extrabold text-emerald-700">{locations.filter(l => l.status === 'operational').length}</p>
          <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider mt-0.5">Active</p>
        </div>
        <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4 text-center">
          <p className="text-2xl font-extrabold text-amber-700">{locations.filter(l => l.status === 'needs-service').length}</p>
          <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider mt-0.5">Low Stock</p>
        </div>
        <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4 text-center">
          <p className="text-2xl font-extrabold text-blue-700">1</p>
          <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider mt-0.5">Maintenance</p>
        </div>
        <div className="bg-red-50 rounded-2xl border border-red-100 p-4 text-center">
          <p className="text-2xl font-extrabold text-red-700">{locations.filter(l => l.status === 'offline').length}</p>
          <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-0.5">Issues</p>
        </div>
        <div className="bg-slate-100 rounded-2xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-extrabold text-slate-600">0</p>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Out of Service</p>
        </div>
      </div>

      {/* Filters & View Controls */}
      <div className="bg-card rounded-lg border border-border p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer, address, or machine ID..."
            value={filters.search}
            onChange={(e) => setFilter("search", e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilter("status", e.target.value as any)}
            className="px-3 py-2 text-xs border border-border rounded-lg bg-white text-slate-700 focus:outline-none"
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1).replace("-", " ")}
              </option>
            ))}
          </select>

          {/* Machine Type Filter */}
          <select
            value={filters.machineType}
            onChange={(e) => setFilter("machineType", e.target.value as any)}
            className="px-3 py-2 text-xs border border-border rounded-lg bg-white text-slate-700 focus:outline-none"
          >
            {machineTypes.map((t) => (
              <option key={t} value={t}>
                {t === "all" ? "All Machine Types" : t}
              </option>
            ))}
          </select>

          {/* View Toggle */}
          <div className="flex border border-border rounded-lg overflow-hidden bg-slate-50 p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors ${
                viewMode === "grid" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Grid className="w-3.5 h-3.5" /> Grid
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors ${
                viewMode === "list" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <List className="w-3.5 h-3.5" /> List
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors ${
                viewMode === "map" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" /> Map
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: GRID VIEW */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedLocations.map((loc) => (
            <div
              key={loc.id}
              onClick={() => navigate(`/locations/${loc.id}`)}
              className="bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group flex flex-col justify-between"
            >
              <div className="relative h-44 overflow-hidden bg-slate-100">
                <img
                  src={loc.photoGallery[0] || "https://picsum.photos/400/300"}
                  alt={loc.customerName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3">
                  <StatusBadge status={loc.status} withDot />
                </div>
                <div className="absolute bottom-2 left-3 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded font-mono">
                  {loc.machineId}
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                  <button
                    onClick={() => navigate(`/locations/${loc.id}`)}
                    className="p-2 bg-white text-slate-800 rounded-lg hover:bg-slate-100 shadow transition-colors"
                    title="View Machine"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => openEditModal(loc, e)}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow transition-colors"
                    title="Edit Machine"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleMaintenance(loc.id, loc.machineId, e)}
                    className="p-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 shadow transition-colors"
                    title="Mark Maintenance"
                  >
                    <Wrench className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(loc.id, loc.machineId, e)}
                    className="p-2 bg-red-650 text-white rounded-lg hover:bg-red-750 shadow transition-colors"
                    title="Delete Machine"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-primary-600 transition-colors">
                    {loc.customerName}
                  </h3>
                  <div className="flex items-start gap-1.5 mt-1 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{loc.address}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-slate-500">
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium text-[11px]">
                    {loc.machineType}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Wrench className="w-3 h-3" /> Last: {formatDate(loc.lastServiceDate)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 2: LIST VIEW */}
      {viewMode === "list" && (
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-border text-xs text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Customer / Location</th>
                <th className="px-4 py-3">Machine ID</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Frequency</th>
                <th className="px-4 py-3">Last Service</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayedLocations.map((loc) => (
                <tr
                  key={loc.id}
                  onClick={() => navigate(`/locations/${loc.id}`)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{loc.customerName}</p>
                    <p className="text-xs text-slate-400 truncate max-w-[240px]">{loc.address}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600 font-semibold">{loc.machineId}</td>
                  <td className="px-4 py-3 text-xs"><span className="bg-slate-100 px-2 py-0.5 rounded-full text-slate-700">{loc.machineType}</span></td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    <p className="font-medium text-slate-800">{loc.contactPerson}</p>
                    <p className="text-slate-400">{loc.contactPhone}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{loc.visitFrequency}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{formatDate(loc.lastServiceDate)}</td>
                  <td className="px-4 py-3"><StatusBadge status={loc.status} withDot /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/locations/${loc.id}`); }}
                        className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-md cursor-pointer"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => openEditModal(loc, e)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md cursor-pointer"
                        title="Edit Location"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleMaintenance(loc.id, loc.machineId, e)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md cursor-pointer"
                        title="Mark Maintenance"
                      >
                        <Wrench className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(loc.id, loc.machineId, e)}
                        className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-md cursor-pointer"
                        title="Delete Location"
                      >
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

      {/* VIEW 3: MAP VIEW */}
      {viewMode === "map" && (
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden h-[550px]">
          <MapContainer center={[19.0760, 72.8777]} zoom={11} className="h-full w-full">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {displayedLocations.map((loc) => (
              <Marker key={loc.id} position={[loc.lat, loc.lng]}>
                <Popup>
                  <div className="p-1 text-xs space-y-1">
                    <p className="font-bold text-slate-900">{loc.customerName}</p>
                    <p className="text-slate-500">{loc.address}</p>
                    <p className="text-slate-600 font-semibold">{loc.machineType} ({loc.machineId})</p>
                    <button
                      onClick={() => navigate(`/locations/${loc.id}`)}
                      className="mt-2 w-full bg-primary-600 text-white py-1 text-[10px] rounded font-semibold text-center"
                    >
                      View Details
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      {/* ADD / EDIT LOCATION MODAL */}
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
                  {editingLocation ? "Edit Vending Location" : "Add New Vending Location"}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Customer / Location Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hiranandani Tech Park"
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="Building, Street, Landmark, City"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={form.lat}
                      onChange={(e) => setForm({ ...form, lat: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={form.lng}
                      onChange={(e) => setForm({ ...form, lng: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => alert("Map Pin Selector active. Drag marker to set exact GPS.")}
                      className="w-full px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1"
                    >
                      <MapPin className="w-3.5 h-3.5 text-primary-600" /> Pick on Map
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
                    <input
                      type="text"
                      placeholder="Name"
                      value={form.contactPerson}
                      onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                    <input
                      type="text"
                      placeholder="+91 98200 00000"
                      value={form.contactPhone}
                      onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Machine ID</label>
                    <input
                      type="text"
                      value={form.machineId}
                      onChange={(e) => setForm({ ...form, machineId: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Machine Type</label>
                    <select
                      value={form.machineType}
                      onChange={(e) => setForm({ ...form, machineType: e.target.value as any })}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none"
                    >
                      <option value="Combo">Combo</option>
                      <option value="Snack">Snack</option>
                      <option value="Beverage">Beverage</option>
                      <option value="Coffee">Coffee</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Visit Frequency</label>
                    <select
                      value={form.visitFrequency}
                      onChange={(e) => setForm({ ...form, visitFrequency: e.target.value as any })}
                      className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none"
                    >
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Bi-weekly">Bi-weekly</option>
                      <option value="Monthly">Monthly</option>
                    </select>
                  </div>
                </div>

                {/* Products Tag Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Products Stocked</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Add product tag (e.g. KitKat)..."
                      value={form.productInput}
                      onChange={(e) => setForm({ ...form, productInput: e.target.value })}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddProduct(); } }}
                      className="flex-1 px-3 py-1.5 text-xs border border-border rounded-lg focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddProduct}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg"
                    >
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

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Access code, floor instructions..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none"
                  />
                </div>

                {/* Photo Upload Area */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Location Photos</label>
                  <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:bg-slate-50 transition-colors cursor-pointer">
                    <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                    <p className="text-xs text-slate-500 font-medium">Drag & drop machine photos here or click to browse</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium"
                  >
                    {editingLocation ? "Save Changes" : "Create Location"}
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
