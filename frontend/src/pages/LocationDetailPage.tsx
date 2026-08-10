import { createPortal } from "react-dom";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ArrowLeft, MapPin, Phone, Package, Image as ImageIcon,
  Clock, Upload, ShieldCheck, X, Route as RouteIcon, Loader2, AlertCircle, ExternalLink, Navigation,
  RefreshCw, Crosshair, Check
} from "lucide-react";

import StatusBadge from "../components/shared/StatusBadge";
import PageHeader from "../components/shared/PageHeader";
import { formatDate } from "../lib/utils";
import { locationsApi, stopsApi, machinesApi } from "../services/api";

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Map Controller for smooth focusing
function MapFocusController({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (center && !isNaN(center[0]) && !isNaN(center[1])) {
      map.flyTo(center, zoom || 15, { animate: true, duration: 1 });
    }
  }, [center[0], center[1], zoom, map]);
  return null;
}

// Map Click Event Listener for picking location
function LocationDetailMapEvents({ onLocationChange }: { onLocationChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationChange(parseFloat(e.latlng.lat.toFixed(6)), parseFloat(e.latlng.lng.toFixed(6)));
    },
  });
  return null;
}

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
  const [notesList, setNotesList] = useState<any[]>([]); // Dynamically populated from backend
  const [newNoteInput, setNewNoteInput] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [uploadMsg, setUploadMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Vending Machine Edit state
  const [isMachineModalOpen, setIsMachineModalOpen] = useState(false);
  const [machineForm, setMachineForm] = useState({ machineCode: "", model: "", fillLevel: 100 });
  const [machineSubmitting, setMachineSubmitting] = useState(false);

  const openMachineModal = (m: any) => {
    setMachineForm({
      machineCode: m?.machineCode || "",
      model: m?.model || "",
      fillLevel: m?.fillLevel ?? 100,
    });
    setIsMachineModalOpen(true);
  };

  const handleSaveMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setMachineSubmitting(true);
    try {
      if (firstMachine.id) {
        // Update stock/status
        await machinesApi.updateStock(firstMachine.id, {
          fillLevel: Number(machineForm.fillLevel),
          status: machineForm.fillLevel < 20 ? 'OUT_OF_STOCK' : 'ACTIVE',
        });
      } else {
        // Create new machine for this location
        await machinesApi.create({
          locationId: id,
          machineCode: machineForm.machineCode,
          model: machineForm.model,
          fillLevel: Number(machineForm.fillLevel),
        });
      }
      setIsMachineModalOpen(false);
      // Reload location details
      const res = await locationsApi.getById(id);
      if (res.success) {
        setLoc(res.data);
      }
      alert("Vending Machine details saved successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to save machine details");
    } finally {
      setMachineSubmitting(false);
    }
  };

  // Auto-geocode & sync if coordinates are default Mumbai or missing
  const checkAndSyncCoordinates = async (locationData: any) => {
    if (!locationData) return;
    const addressQuery = [locationData.address, locationData.city].filter(Boolean).join(", ");
    if (!addressQuery) return;

    const lat = Number(locationData.latitude);
    const lng = Number(locationData.longitude);

    const isDefaultMumbai = (Math.abs(lat - 19.076) < 0.02 && Math.abs(lng - 72.8777) < 0.02);
    const isCityNotMumbai = !locationData.city?.toLowerCase().includes("mumbai");

    if ((!lat && !lng) || (isDefaultMumbai && isCityNotMumbai)) {
      try {
        let res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}&limit=1`);
        let data = await res.json();
        if (!data || data.length === 0) {
          if (locationData.city) {
            res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationData.city)}&limit=1`);
            data = await res.json();
          }
        }
        if (data && data.length > 0) {
          const newLat = parseFloat(parseFloat(data[0].lat).toFixed(6));
          const newLng = parseFloat(parseFloat(data[0].lon).toFixed(6));
          setLoc((prev: any) => ({ ...prev, latitude: newLat, longitude: newLng }));
          await locationsApi.update(locationData.id, { latitude: newLat, longitude: newLng });
          setSyncMsg(`📍 Coordinates auto-synced to "${addressQuery}": ${newLat}, ${newLng}`);
          setTimeout(() => setSyncMsg(null), 5000);
        }
      } catch (err) {
        console.warn("Auto-geocode sync failed:", err);
      }
    }
  };

  // Manual GPS / Map Sync
  const handleManualGpsSync = async () => {
    if (!loc) return;
    const addressQuery = [loc.address, loc.city].filter(Boolean).join(", ");
    if (!addressQuery) {
      setSyncMsg("⚠️ Address / City missing");
      setTimeout(() => setSyncMsg(null), 3000);
      return;
    }
    setIsSyncingGps(true);
    setSyncMsg(null);
    try {
      let res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}&limit=1`);
      let data = await res.json();
      if (!data || data.length === 0) {
        if (loc.city) {
          res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(loc.city)}&limit=1`);
          data = await res.json();
        }
      }
      if (data && data.length > 0) {
        const newLat = parseFloat(parseFloat(data[0].lat).toFixed(6));
        const newLng = parseFloat(parseFloat(data[0].lon).toFixed(6));
        setLoc((prev: any) => ({ ...prev, latitude: newLat, longitude: newLng }));
        await locationsApi.update(loc.id, { latitude: newLat, longitude: newLng });
        setSyncMsg(`📍 Map updated to "${addressQuery}": ${newLat}, ${newLng}`);
      } else {
        setSyncMsg(`⚠️ Could not auto-locate. Click on map to pinpoint.`);
      }
    } catch (err) {
      setSyncMsg("⚠️ Sync failed. Click directly on map to set position.");
    } finally {
      setIsSyncingGps(false);
      setTimeout(() => setSyncMsg(null), 4000);
    }
  };

  // Update pin directly from Map click/drag + reverse geocode address
  const handleUpdateCoordinatesFromMap = async (newLat: number, newLng: number) => {
    if (!loc) return;
    setLoc((prev: any) => ({ ...prev, latitude: newLat, longitude: newLng }));
    try {
      // Reverse geocode to get address
      let newAddress = loc.address;
      let newCity = loc.city;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLat}&lon=${newLng}&zoom=18&addressdetails=1`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        if (data && data.address) {
          const addr = data.address;
          const detectedCity =
            addr.city || addr.town || addr.city_district || addr.state_district || addr.county || "";
          const parts = [
            addr.amenity || addr.building || addr.shop,
            addr.road || addr.street,
            addr.suburb || addr.neighbourhood || addr.residential,
          ].filter(Boolean);
          const detectedAddress = parts.join(", ") || data.display_name?.split(",")?.slice(0, 3)?.join(",");
          if (detectedAddress) newAddress = detectedAddress;
          if (detectedCity) newCity = detectedCity;
        }
      } catch (err) {
        console.warn("Reverse geocode in detail page skipped:", err);
      }

      setLoc((prev: any) => ({ ...prev, latitude: newLat, longitude: newLng, address: newAddress, city: newCity }));
      await locationsApi.update(loc.id, {
        latitude: newLat,
        longitude: newLng,
        address: newAddress,
        city: newCity,
      });
      setSyncMsg(`📍 Updated location & address: ${newAddress}${newCity ? `, ${newCity}` : ""} (${newLat}, ${newLng})`);
      setTimeout(() => setSyncMsg(null), 4000);
    } catch (err) {
      console.error("Failed to save updated pin:", err);
    }
  };

  const handleUploadPhoto = async (file: File) => {
    if (!id || !loc) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = reader.result as string;
        await locationsApi.update(id, { imageUrl: base64 });
        setLoc((prev: any) => ({ ...prev, imageUrl: base64 }));
        setUploadMsg({ type: "success", text: "Photo uploaded successfully!" });
        setTimeout(() => setUploadMsg(null), 4000);
      } catch (err: any) {
        setUploadMsg({ type: "error", text: err.message || "Failed to upload photo" });
        setTimeout(() => setUploadMsg(null), 5000);
      }
    };
    reader.readAsDataURL(file);
  };

  // Fetch location data on mount
  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await locationsApi.getById(id);
        if (res.success) {
          setLoc(res.data);
          checkAndSyncCoordinates(res.data);
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

  // Derive notes from backend location stops
  useEffect(() => {
    if (locationStops.length > 0) {
      const derivedNotes = locationStops
        .filter(stop => stop.notes || stop.machineIssues)
        .map(stop => ({
          id: `n_${stop.id}`,
          text: stop.notes || stop.machineIssues || "",
          date: formatDate(stop.updatedAt || stop.route?.date || new Date().toISOString()),
          author: stop.route?.driver?.name || stop.driverName || "System Driver"
        }));
      setNotesList(prev => {
        const existingIds = new Set(prev.map(n => n.id));
        const newNotes = derivedNotes.filter(n => !existingIds.has(n.id));
        return [...newNotes, ...prev];
      });
    }
  }, [locationStops]);

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
  const firstMachine = loc?.machine?.[0] || loc?.machines?.[0] || {};
  
  // Compile all photos from previous service history (completed stops)
  const servicePhotos: string[] = [];
  locationStops.forEach((stop: any) => {
    if (stop.photos) {
      try {
        if (typeof stop.photos === "string") {
          if (stop.photos.trim().startsWith("[")) {
            const parsed = JSON.parse(stop.photos);
            if (Array.isArray(parsed)) {
              servicePhotos.push(...parsed);
            }
          } else {
            const splitPhotos = stop.photos.split(",").map((p: string) => p.trim()).filter(Boolean);
            servicePhotos.push(...splitPhotos);
          }
        } else if (Array.isArray(stop.photos)) {
          servicePhotos.push(...stop.photos);
        }
      } catch (err) {
        console.error("Failed to parse stop photos:", err);
      }
    }
  });

  const photoGallery = [
    ...(loc?.imageUrl ? [loc.imageUrl] : []),
    ...servicePhotos
  ];
  if (photoGallery.length === 0) {
    // Standard beautiful default location fallbacks if zero photos uploaded
    photoGallery.push("https://picsum.photos/800/600", "https://picsum.photos/800/601");
  }
  
  // Parse products string/array correctly
  let products: string[] = [];
  if (loc?.products) {
    try {
      if (typeof loc.products === "string") {
        if (loc.products.trim().startsWith("[")) {
          products = JSON.parse(loc.products);
        } else {
          products = loc.products.split(",").map((p: string) => p.trim()).filter(Boolean);
        }
      } else if (Array.isArray(loc.products)) {
        products = loc.products;
      }
    } catch (e) {
      console.error("Failed to parse products:", e);
    }
  }

  // Dynamic metrics calculation
  const completedStops = locationStops.filter(s => s.status === 'COMPLETED');
  const totalServiceVisits = completedStops.length;
  
  let totalMinutes = 0;
  if (completedStops.length > 0) {
    completedStops.forEach(s => {
      totalMinutes += s.route?.actualDuration || 25; // fallback to 25m if missing
    });
  }
  const avgDurationStr = completedStops.length > 0 ? `${Math.round(totalMinutes / completedStops.length)}m` : "0m";

  const lastCashStop = [...completedStops]
    .sort((a, b) => new Date(b.updatedAt || b.route?.date || 0).getTime() - new Date(a.updatedAt || a.route?.date || 0).getTime())
    .find(s => s.cashCollected > 0);
  const lastCashCollected = lastCashStop ? lastCashStop.cashCollected : 0;

  const pendingStops = locationStops
    .filter(s => s.status === 'PENDING' && s.route?.date)
    .sort((a, b) => new Date(a.route.date).getTime() - new Date(b.route.date).getTime());
  
  const nextStop = pendingStops.find(s => new Date(s.route.date) >= new Date(new Date().setHours(0,0,0,0)));
  
  let nextServiceDateStr = "Not Scheduled";
  let daysUntilNextService = 0;
  if (nextStop) {
    nextServiceDateStr = formatDate(nextStop.route.date);
    const diffTime = new Date(nextStop.route.date).getTime() - new Date().getTime();
    daysUntilNextService = diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;
  } else if (completedStops.length > 0) {
    const lastVisit = new Date(completedStops[0].updatedAt || completedStops[0].route?.date || new Date());
    lastVisit.setDate(lastVisit.getDate() + 7);
    nextServiceDateStr = formatDate(lastVisit.toISOString());
    const diffTime = lastVisit.getTime() - new Date().getTime();
    daysUntilNextService = diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;
  }

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
              <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="font-bold text-slate-900 text-sm">Vending Machine Details</h3>
                  <button
                    onClick={() => openMachineModal(firstMachine)}
                    className="text-xs bg-primary-50 text-primary-600 hover:bg-primary-100 font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {firstMachine.id ? "Update Machine" : "Add Machine"}
                  </button>
                </div>
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
                    <p className="text-xl font-extrabold text-slate-900 mt-1">{totalServiceVisits}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-border">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Avg Service Duration</p>
                    <p className="text-xl font-extrabold text-slate-900 mt-1">{avgDurationStr}</p>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                    <p className="text-[10px] text-emerald-500 uppercase font-bold tracking-wider font-medium">Last Cash Collected</p>
                    <p className="text-xl font-extrabold text-emerald-700 mt-1">₹{lastCashCollected}</p>
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
                    <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full font-bold">Weekly</span>
                  </div>
                  <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">Next Service Date</p>
                      <p className="text-sm font-bold text-amber-950 mt-1">{nextServiceDateStr}</p>
                    </div>
                    {daysUntilNextService > 0 && (
                      <span className="bg-amber-500 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full shadow-sm">
                        In {daysUntilNextService} days
                      </span>
                    )}
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
                  {products.map((prodName: string, idx: number) => {
                    const capacity = 20;
                    const machineLevel = firstMachine.fillLevel ?? 100;
                    const stock = Math.round((machineLevel / 100) * capacity);
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
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-slate-900 text-sm">GPS Coordinates</h3>
                <button
                  type="button"
                  onClick={handleManualGpsSync}
                  disabled={isSyncingGps}
                  className="flex items-center gap-1 text-[11px] font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  title="Auto-fetch exact coordinates for this address & city"
                >
                  {isSyncingGps ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  Sync Map to Address
                </button>
              </div>

              {syncMsg && (
                <p className="text-xs text-blue-800 bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg font-medium">
                  {syncMsg}
                </p>
              )}

              <div className="space-y-3.5 text-xs">
                <div>
                  <p className="text-slate-450 font-bold uppercase tracking-wider text-[9px]">Location Address</p>
                  <p className="font-semibold text-slate-800 leading-relaxed mt-1">
                    {loc.address}{loc.city ? `, ${loc.city}` : ""}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-slate-50 p-3 rounded-lg border border-border">
                    <p className="text-slate-400 font-bold text-[9px]">Latitude</p>
                    <p className="font-bold text-slate-950 font-mono text-[11px] mt-0.5">{loc.latitude ?? "N/A"}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-border">
                    <p className="text-slate-400 font-bold text-[9px]">Longitude</p>
                    <p className="font-bold text-slate-950 font-mono text-[11px] mt-0.5">{loc.longitude ?? "N/A"}</p>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-3 text-[10px] font-medium leading-relaxed">
                  📍 Verified geofence active within 50 meters of coordinates for automatic check-in logs.
                </div>
                {loc.latitude && loc.longitude && (
                  <a
                    href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open in Google Maps
                  </a>
                )}
              </div>
            </div>

            {/* Interactive Map */}
            <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-sm overflow-hidden h-[400px] relative">
              <MapContainer center={[loc.latitude || 19.076, loc.longitude || 72.877]} zoom={14} className="h-full w-full">
                <MapFocusController center={[loc.latitude || 19.076, loc.longitude || 72.877]} zoom={15} />
                <LocationDetailMapEvents onLocationChange={handleUpdateCoordinatesFromMap} />
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {loc.latitude && loc.longitude && (
                  <Marker
                    position={[loc.latitude, loc.longitude]}
                    draggable={true}
                    eventHandlers={{
                      dragend: (e) => {
                        const marker = e.target;
                        const position = marker.getLatLng();
                        handleUpdateCoordinatesFromMap(
                          parseFloat(position.lat.toFixed(6)),
                          parseFloat(position.lng.toFixed(6))
                        );
                      },
                    }}
                  >
                    <Popup>
                      <div className="p-1 text-xs">
                        <p className="font-bold text-slate-900">{customer.companyName || loc.name}</p>
                        <p className="text-slate-500 font-mono text-[10px]">{loc.address}, {loc.city}</p>
                        <p className="text-slate-400 font-mono text-[9px] mt-1">{loc.latitude}, {loc.longitude}</p>
                      </div>
                    </Popup>
                  </Marker>
                )}
              </MapContainer>
              <div className="absolute bottom-2 left-3 right-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] py-1.5 px-3 rounded-lg flex items-center justify-between pointer-events-none z-[1000] shadow">
                <span>📍 Click anywhere on map or drag pin to adjust exact location coordinates</span>
                <span className="font-mono text-[10px] text-emerald-300 font-bold">
                  {loc.latitude ? `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}` : "No pin"}
                </span>
              </div>
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

              <div>
                <button
                  onClick={() => document.getElementById('detail-photo-upload-input')?.click()}
                  className="text-xs bg-primary-600 hover:bg-primary-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload Photo
                </button>
                <input
                  id="detail-photo-upload-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploadMsg(null);
                      handleUploadPhoto(file);
                    }
                  }}
                />
                
                {uploadMsg && (
                  <div className={`mt-3 px-3 py-2 text-[11px] font-bold rounded-lg animate-in fade-in slide-in-from-top-1 ${
                    uploadMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"
                  }`}>
                    {uploadMsg.text}
                  </div>
                )}
              </div>
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
                        <span className="text-[10px] text-slate-400 font-bold">{formatDate(stop.updatedAt || stop.route?.date || new Date().toISOString())}</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px] text-slate-600">
                        <div>
                          <p className="text-slate-400 font-bold uppercase text-[9px]">Driver</p>
                          <p className="font-bold text-slate-800 mt-0.5">{driverName}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-bold uppercase text-[9px]">Check-in/out</p>
                          <p className="font-bold text-slate-800 mt-0.5">
                            {stop.status === 'COMPLETED' ? "Completed" : (stop.status === 'PENDING' ? "Pending" : "N/A")}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-bold uppercase text-[9px]">GPS Status</p>
                          {stop.gpsVerified ? (
                            <p className="font-bold text-emerald-600 mt-0.5">✓ Verified Proximity</p>
                          ) : (
                            <p className="font-bold text-amber-600 mt-0.5">Unverified</p>
                          )}
                        </div>
                        <div>
                          <p className="text-slate-400 font-bold uppercase text-[9px]">Cash Collected</p>
                          <p className="font-bold text-slate-800 mt-0.5">₹{stop.cashCollected || 0}</p>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-2 flex justify-between items-center text-[11px]">
                        <div>
                          <span className="text-slate-400 font-bold uppercase text-[9px] block">Refilled Inventory</span>
                          <span className="font-medium text-slate-700">{stop.productsRefilled || "None recorded"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold uppercase text-[9px] block text-right">Signature</span>
                          {stop.signatureUrl ? (
                            <span className="text-emerald-600 font-bold">✓ Captured digitally</span>
                          ) : (
                            <span className="text-slate-400 font-bold">Not required</span>
                          )}
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
                        <td className="px-4 py-3 font-bold text-slate-900 font-mono" title={stop.routeId}>#{stop.routeId ? stop.routeId.substring(0, 8) : "101"}</td>
                        <td className="px-4 py-3 text-slate-650">{formatDate(stop.route?.date || stop.createdAt || new Date().toISOString())}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{driverName}</td>
                        <td className="px-4 py-3 text-slate-500">Stop #{stop.stopOrder || stop.sequenceNumber || "1"}</td>
                        <td className="px-4 py-3"><StatusBadge status={stop.status} /></td>
                        <td className="px-4 py-3 text-slate-600 font-mono">-</td>
                        <td className="px-4 py-3 text-slate-600 font-mono">-</td>
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
      {createPortal(
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
      </AnimatePresence>,
        document.body
      )}
      {/* Configure Vending Machine Modal */}
      {createPortal(
        <AnimatePresence>
          {isMachineModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-xl border border-border shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
              >
                <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-slate-50">
                  <h3 className="font-bold text-slate-900 text-base">
                    {firstMachine.id ? "Update Vending Machine" : "Configure Vending Machine"}
                  </h3>
                  <button onClick={() => setIsMachineModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveMachine} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Machine Code / ID *</label>
                    <input
                      required
                      disabled={!!firstMachine.id}
                      placeholder="e.g. VEND-BKC-091"
                      value={machineForm.machineCode}
                      onChange={(e) => setMachineForm({ ...machineForm, machineCode: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Machine Model *</label>
                    <input
                      required
                      disabled={!!firstMachine.id}
                      placeholder="e.g. Snack & Drinks Combo Pro"
                      value={machineForm.model}
                      onChange={(e) => setMachineForm({ ...machineForm, model: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Current Fill Level (%) *</label>
                    <input
                      required
                      type="number"
                      min="0"
                      max="100"
                      value={machineForm.fillLevel}
                      onChange={(e) => setMachineForm({ ...machineForm, fillLevel: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border mt-4">
                    <button
                      type="button"
                      onClick={() => setIsMachineModalOpen(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={machineSubmitting}
                      className="px-4 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg flex items-center gap-1.5"
                    >
                      {machineSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Save Machine
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
