import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ArrowLeft, MapPin, Phone, Package, Image as ImageIcon,
  Clock, Upload, ShieldCheck, X, Route as RouteIcon, Loader2, AlertCircle
} from "lucide-react";

import StatusBadge from "../components/shared/StatusBadge";
import PageHeader from "../components/shared/PageHeader";
import { formatDate } from "../lib/utils";
import { locationsApi, stopsApi } from "../services/api";

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const detailTabs = [
  { id: "overview", label: "Overview", icon: Clock },
  { id: "products", label: "Products & Inventory", icon: Package },
  { id: "location", label: "Location & GPS", icon: MapPin },
  { id: "gallery", label: "Gallery", icon: ImageIcon },
  { id: "service", label: "Service History", icon: ShieldCheck },
  { id: "route", label: "Route History", icon: RouteIcon },
];

export default function LocationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // State for fetched data
  const [loc, setLoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState("overview");
  const [locationStops, setLocationStops] = useState<any[]>([]);

  // Gallery Tab & Lightbox State
  const [galleryTab, setGalleryTab] = useState<"all" | "compare">("all");
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [comparePos, setComparePos] = useState(50); // Slider % position

  // Notes state
  const [notesList, setNotesList] = useState<any[]>([
    { id: "n1", text: "Machine in good operational condition.", date: "31 Jul 2026", author: "Rohit Kapoor" },
  ]);
  const [newNoteInput, setNewNoteInput] = useState("");

  // Fetch location data on mount
  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await locationsApi.getById(id);
        if (res.success) {
          setLoc(res.data);
          // Try to get stops for this location from API
          try {
            const stopsRes = await stopsApi.getAll();
            if (stopsRes.success) {
              setLocationStops(stopsRes.data.filter((s: any) => s.locationId === id));
            } else if (res.data.stops) {
              setLocationStops(res.data.stops);
            }
          } catch {
            // Fallback to embedded stops in location data
            if (res.data.stops) setLocationStops(res.data.stops);
          }
        } else {
          setError("Failed to load location data.");
        }
      } catch (err: any) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleAddNote = () => {
    if (newNoteInput.trim()) {
      setNotesList([
        { id: `n${Date.now()}`, text: newNoteInput.trim(), date: "Today", author: "Admin User" },
        ...notesList,
      ]);
      setNewNoteInput("");
    }
  };

  // Data parsing
  const customer = loc?.customer || {};
  const firstMachine = loc?.machines?.[0] || {};
  const photoGallery = loc?.imageUrl ? [loc.imageUrl] : ["https://picsum.photos/800/600", "https://picsum.photos/800/601"];
  const products = ["Coca-Cola", "Lay's Chips", "Oreo", "Water Bottle"]; // Mocked since DB doesn't have products yet

  // Next service countdown calculation (mocked for now)
  const daysUntilNextService = 5;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <span className="ml-3 text-slate-500 text-sm">Loading location details...</span>
      </div>
    );
  }

  if (error || !loc) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <p className="text-sm text-slate-600">{error || "Location not found"}</p>
        <button onClick={() => navigate("/locations")} className="text-xs text-primary-600 font-semibold hover:underline">
          Go Back
        </button>
      </div>
    );
  }


  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={loc.name}
        description={`Customer: ${customer.companyName || "N/A"} | ${loc.address}, ${loc.city}`}
        breadcrumbs={[{ label: "Vending Machines", path: "/locations" }, { label: loc.name }]}
        action={
          <button
            onClick={() => navigate("/locations")}
            className="flex items-center gap-2 text-sm text-slate-600 bg-white border border-border px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Vending Machines
          </button>
        }
      />

      {/* Tabs Switcher Navigation */}
      <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-none whitespace-nowrap bg-white p-2 rounded-xl shadow-sm border">
        {detailTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        
        {/* T1: OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-6 lg:col-span-2">
              {/* Vending Specs Info */}
              <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
                <h3 className="font-bold text-slate-900 text-sm border-b border-border pb-3">Vending Machine Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-border">
                    <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Machine ID</p>
                    <p className="font-bold text-slate-900 font-mono text-sm mt-1">{firstMachine.machineCode || "N/A"}</p>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-border">
                    <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Machine Model</p>
                    <p className="font-bold text-slate-900 text-sm mt-1">{firstMachine.model || "Standard Vending Unit"}</p>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-border">
                    <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Current Fill Level</p>
                    <p className="font-bold text-slate-900 text-sm mt-1">{firstMachine.fillLevel ?? 0}%</p>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-border">
                    <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Serial Number</p>
                    <p className="font-bold text-slate-900 font-mono text-sm mt-1">{firstMachine.id ? firstMachine.id.split('-')[0].toUpperCase() : "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Quick stats row */}
              <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
                <h3 className="font-bold text-slate-900 text-sm border-b border-border pb-3">Operational Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-slate-50 p-4 rounded-xl border border-border">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Service Visits</p>
                    <p className="text-xl font-extrabold text-slate-900 mt-1">24</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-border">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Avg Service Duration</p>
                    <p className="text-xl font-extrabold text-slate-900 mt-1">25m</p>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                    <p className="text-[10px] text-emerald-500 uppercase font-bold tracking-wider font-medium">Last Cash Collected</p>
                    <p className="text-xl font-extrabold text-emerald-700 mt-1">₹3,200</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side Overview Column */}
            <div className="space-y-6">
              {/* Account Information */}
              <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="font-bold text-slate-900 text-sm">Customer Info</h3>
                  <StatusBadge status={loc.status} withDot />
                </div>
                <div className="space-y-3 text-xs">
                  <div>
                    <p className="text-slate-450 font-bold uppercase tracking-wider text-[9px]">Account Client</p>
                    <p className="font-extrabold text-slate-900 text-sm mt-0.5">{customer.companyName || "N/A"}</p>
                  </div>
                  <div className="flex items-start gap-2 text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-450 flex-shrink-0 mt-0.5" />
                    <span>{loc.address}, {loc.city}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-4 h-4 text-slate-450 flex-shrink-0" />
                    <span>{customer.contactPerson || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Service Frequency Tracker */}
              <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
                <h3 className="font-bold text-slate-900 text-sm border-b border-border pb-3">Visit Schedule</h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-450 font-semibold">Frequency:</span>
                    <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full font-bold">Weekly (Mock)</span>
                  </div>
                  <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">Next Service Date</p>
                      <p className="text-sm font-bold text-amber-950 mt-1">10 Aug 2026</p>
                    </div>
                    <span className="bg-amber-500 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full shadow-sm">
                      In {daysUntilNextService} days
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* T2: PRODUCTS & INVENTORY TAB */}
        {activeTab === "products" && (
          <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-6">
            <h3 className="font-bold text-slate-900 text-sm border-b border-border pb-3">Products Stock Capacity</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-border text-slate-450 font-bold uppercase">
                  <tr>
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-4 py-3">Current Stock</th>
                    <th className="px-4 py-3">Low Level Target</th>
                    <th className="px-4 py-3">Stock Status</th>
                    <th className="px-4 py-3">Capacity</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((prodName, idx) => {
                    const capacity = 20;
                    const stock = idx % 2 === 0 ? 12 : 3;
                    const isLow = stock <= 5;
                    return (
                      <tr key={prodName} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3.5 font-bold text-slate-900">{prodName}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${isLow ? "text-amber-600" : "text-slate-800"}`}>{stock} / {capacity}</span>
                            <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div className={`h-full rounded-full ${isLow ? "bg-amber-500" : "bg-blue-600"}`} style={{ width: `${(stock / capacity) * 100}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-450 font-semibold">5 units</td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase border ${
                            isLow 
                              ? "bg-amber-50 text-amber-700 border-amber-200" 
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}>
                            {isLow ? "Low Stock" : "Good Stock"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-500">{capacity} max</td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => alert(`Showing refill logs for product: ${prodName}. Last restocked 12 units on 28 Jul.`)}
                            className="text-[10px] text-blue-600 hover:underline font-bold"
                          >
                            [ Refill History ]
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* T3: LOCATION & GPS TAB */}
        {activeTab === "location" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* GPS Metrics */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-slate-900 text-sm border-b border-border pb-3">GPS Coordinates</h3>
              <div className="space-y-3.5 text-xs">
                <div>
                  <p className="text-slate-450 font-bold uppercase tracking-wider text-[9px]">Location Address</p>
                  <p className="font-semibold text-slate-800 leading-relaxed mt-1">{loc.address}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-50 p-3 rounded-lg border border-border">
                    <p className="text-slate-400 font-bold text-[9px]">Latitude</p>
                    <p className="font-bold text-slate-950 font-mono text-[11px] mt-0.5">{loc.latitude}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-border">
                    <p className="text-slate-400 font-bold text-[9px]">Longitude</p>
                    <p className="font-bold text-slate-950 font-mono text-[11px] mt-0.5">{loc.longitude}</p>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-3 text-[10px] font-medium leading-relaxed">
                  📍 Verified geofence active within 50 meters of coordinates for automatic check-in logs.
                </div>
              </div>
            </div>

            {/* Interactive Map */}
            <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-sm overflow-hidden h-[400px]">
              <MapContainer center={[loc.latitude || 19.076, loc.longitude || 72.877]} zoom={14} className="h-full w-full">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[loc.latitude || 19.076, loc.longitude || 72.877]}>
                  <Popup>
                    <div className="p-1 text-xs">
                      <p className="font-bold text-slate-900">{customer.companyName || loc.name}</p>
                      <p className="text-slate-500 font-mono text-[10px]">{firstMachine.machineCode || "N/A"}</p>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>
        )}

        {/* T4: GALLERY & COMPARE TAB */}
        {activeTab === "gallery" && (
          <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div className="flex bg-slate-150 p-0.5 rounded-lg text-xs font-bold">
                <button
                  onClick={() => setGalleryTab("all")}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    galleryTab === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                  }`}
                >
                  All Photos
                </button>
                <button
                  onClick={() => setGalleryTab("compare")}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    galleryTab === "compare" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                  }`}
                >
                  Before/After Compare
                </button>
              </div>

              <button
                onClick={() => alert("Upload photo dialogue opened")}
                className="text-xs bg-primary-600 hover:bg-primary-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" /> Upload Photo
              </button>
            </div>

            {/* Gallery Grid */}
            {galleryTab === "all" ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {photoGallery.map((imgUrl, i) => (
                  <div
                    key={i}
                    onClick={() => setLightboxImg(imgUrl)}
                    className="aspect-square rounded-xl overflow-hidden bg-slate-100 cursor-pointer group relative border border-border"
                  >
                    <img src={imgUrl} alt={`Photo ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                    <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Split handle slider */
              <div className="space-y-3">
                <p className="text-xs text-slate-450 font-medium">Drag slider horizontally to compare before refill vs after service</p>
                <div className="relative h-[380px] rounded-xl overflow-hidden border border-border select-none max-w-2xl mx-auto">
                  <img src={photoGallery[1] || photoGallery[0]} alt="After Service" className="absolute inset-0 w-full h-full object-cover" />
                  <span className="absolute top-3 right-3 bg-emerald-600 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full shadow z-10 uppercase">AFTER REFILL</span>

                  <div className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-white shadow-2xl" style={{ width: `${comparePos}%` }}>
                    <img src={photoGallery[0]} alt="Before Service" className="absolute inset-0 w-full h-full object-cover" style={{ width: "672px", maxWidth: "none" }} />
                    <span className="absolute top-3 left-3 bg-amber-600 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full shadow z-10 uppercase">BEFORE SERVICE</span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={comparePos}
                    onChange={(e) => setComparePos(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* T5: SERVICE HISTORY TAB */}
        {activeTab === "service" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Note Add */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-slate-900 text-sm border-b border-border pb-3">Field Notes Log</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Technician observation..."
                  value={newNoteInput}
                  onChange={(e) => setNewNoteInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddNote(); }}
                  className="flex-1 px-3 py-2 text-xs border border-border rounded-lg focus:outline-none"
                />
                <button onClick={handleAddNote} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer">
                  Add
                </button>
              </div>

              <div className="space-y-3">
                {notesList.map((note) => (
                  <div key={note.id} className="p-3 rounded-xl bg-slate-50 border border-border text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="font-bold text-slate-700">{note.author}</span>
                      <span>{note.date}</span>
                    </div>
                    <p className="text-slate-600">{note.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Service Timeline Stops */}
            <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-slate-900 text-sm border-b border-border pb-3">Detailed Service Visits</h3>
              
              <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {locationStops.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <p className="text-xs">No service visits recorded for this location yet.</p>
                  </div>
                ) : locationStops.map((stop) => {
                  const driverName = stop.route?.driver?.name || stop.driverName || "Driver";
                  return (
                    <div key={stop.id} className="relative bg-slate-50 p-4 rounded-xl border border-border space-y-3 text-xs">
                      <span className="absolute -left-6.5 top-4 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white shadow-sm" />
                      
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">Restock & Cash Collection</span>
                          <StatusBadge status={stop.status} />
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold">{formatDate("2026-07-28")}</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px] text-slate-600">
                        <div>
                          <p className="text-slate-400 font-bold uppercase text-[9px]">Driver</p>
                          <p className="font-bold text-slate-800 mt-0.5">{driverName}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-bold uppercase text-[9px]">Check-in/out</p>
                          <p className="font-bold text-slate-800 mt-0.5">10:15 AM - 10:42 AM</p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-bold uppercase text-[9px]">GPS Status</p>
                          <p className="font-bold text-emerald-600 mt-0.5">✓ GPS Verified Proximity</p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-bold uppercase text-[9px]">Cash Collected</p>
                          <p className="font-bold text-slate-800 mt-0.5">₹3,200</p>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-2 flex justify-between items-center text-[11px]">
                        <div>
                          <span className="text-slate-400 font-bold uppercase text-[9px] block">Refilled Inventory</span>
                          <span className="font-medium text-slate-700">Coca-Cola (12), Lay's Chips (8)</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold uppercase text-[9px] block text-right">Signature</span>
                          <span className="text-emerald-600 font-bold">✓ Captured digitally</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* T6: ROUTE HISTORY TAB */}
        {activeTab === "route" && (
          <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-border pb-3">Machine Route History</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-border text-slate-450 font-bold uppercase">
                  <tr>
                    <th className="px-4 py-3">Route ID</th>
                    <th className="px-4 py-3">Assignment Date</th>
                    <th className="px-4 py-3">Assigned Driver</th>
                    <th className="px-4 py-3">Stop Index</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Arrival Time</th>
                    <th className="px-4 py-3">Departure Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {locationStops.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-6 text-slate-400 text-xs">No route history found.</td></tr>
                  ) : locationStops.map((stop) => {
                    const driverName = stop.route?.driver?.name || stop.driverName || "Driver";
                    return (
                      <tr key={stop.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-bold text-slate-900 font-mono">#{stop.routeId || "101"}</td>
                        <td className="px-4 py-3 text-slate-650">{formatDate("2026-07-28")}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{driverName}</td>
                        <td className="px-4 py-3 text-slate-500">Stop #{stop.sequenceNumber || "2"}</td>
                        <td className="px-4 py-3"><StatusBadge status={stop.status} /></td>
                        <td className="px-4 py-3 text-slate-600 font-mono">10:15 AM</td>
                        <td className="px-4 py-3 text-slate-600 font-mono">10:42 AM</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxImg && (
          <div
            onClick={() => setLightboxImg(null)}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl max-h-[85vh] rounded-xl overflow-hidden shadow-2xl"
            >
              <img src={lightboxImg} alt="Lightbox view" className="w-full h-full object-contain" />
              <button
                onClick={() => setLightboxImg(null)}
                className="absolute top-4 right-4 bg-slate-900/80 text-white p-2 rounded-full hover:bg-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
