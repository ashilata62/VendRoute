import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Save, Loader2, RefreshCw } from "lucide-react";
import { useRouteStore } from "../store/routeStore";
import { usersApi, vehiclesApi, locationsApi } from "../services/api";
import PageHeader from "../components/shared/PageHeader";

export default function RouteCreatePage() {
  const navigate = useNavigate();
  const { createRoute } = useRouteStore();
  const [saving, setSaving] = useState(false);
  const [calculatingRoute, setCalculatingRoute] = useState(false);

  // Real API data
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [form, setForm] = useState({
    name: "",
    date: new Date().toISOString().split("T")[0],
    driverId: "",
    vehicleId: "",
    stops: [] as string[],
    totalDistance: 0,
    estimatedTime: 0,
  });

  // Load dropdowns from real API on mount
  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        const [driversRes, vehiclesRes, locationsRes] = await Promise.all([
          usersApi.getAll("driver"),
          vehiclesApi.getAll(),
          locationsApi.getAll(),
        ]);
        if (driversRes.success) setDrivers(driversRes.data);
        if (vehiclesRes.success) setVehicles(vehiclesRes.data);
        if (locationsRes.success) setLocations(locationsRes.data);
      } catch (err) {
        console.error("Failed to load form data:", err);
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, []);

  const fetchOSRMRoute = async (stops: string[]) => {
    if (stops.length < 2) {
      setForm(f => ({ ...f, totalDistance: 0, estimatedTime: 0 }));
      return;
    }
    setCalculatingRoute(true);
    try {
      const coords = stops.map(stopId => {
        const loc = locations.find((l: any) => l.id === stopId);
        return loc ? `${loc.lng},${loc.lat}` : null;
      }).filter(Boolean).join(";");

      const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=false`);
      const data = await response.json();
      if (data.code === "Ok" && data.routes && data.routes[0]) {
        const route = data.routes[0];
        const distanceKm = parseFloat((route.distance / 1000).toFixed(1));
        const durationMin = Math.round(route.duration / 60);
        setForm(f => ({
          ...f,
          totalDistance: distanceKm,
          estimatedTime: durationMin
        }));
      }
    } catch (err) {
      console.error("OSRM Route API fetch error:", err);
    } finally {
      setCalculatingRoute(false);
    }
  };

  useEffect(() => {
    if (locations.length > 0) fetchOSRMRoute(form.stops);
  }, [form.stops, locations]);

  const toggleStop = (locId: string) => {
    setForm((f) => ({
      ...f,
      stops: f.stops.includes(locId) ? f.stops.filter((s) => s !== locId) : [...f.stops, locId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.driverId) { alert("Please select a driver."); return; }
    if (form.stops.length === 0) { alert("Please select at least one stop."); return; }
    setSaving(true);
    const success = await createRoute({
      ...form,
      status: "PENDING" as any,
      actualTime: null,
      startTime: null,
      endTime: null,
    });
    setSaving(false);
    if (success) navigate("/routes");
  };

  const selectedDriver = drivers.find((d: any) => d.id === form.driverId);

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
          <span className="text-sm font-medium">Loading drivers, vehicles and locations...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Create New Route"
        description="Build a new field service route and assign stops."
        breadcrumbs={[{ label: "Routes", path: "/routes" }, { label: "Create" }]}
        action={
          <button onClick={() => navigate("/routes")} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 px-3 py-2 border border-border rounded-lg hover:bg-slate-50 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card rounded-lg border border-border shadow-sm p-6 space-y-4">
              <h3 className="font-semibold text-slate-900 text-sm border-b border-border pb-3">Route Details</h3>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Route Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. North Mumbai Morning"
                  className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Date *</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Est. Distance (km)</label>
                  <input
                    type="number"
                    value={form.totalDistance}
                    onChange={(e) => setForm({ ...form, totalDistance: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Assign Driver *</label>
                  <select
                    required
                    value={form.driverId}
                    onChange={(e) => setForm({ ...form, driverId: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 bg-white"
                  >
                    <option value="">Select driver...</option>
                    {drivers.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  {drivers.length === 0 && (
                    <p className="text-[10px] text-amber-600 mt-1">No drivers found. <a href="/users" className="underline">Add a driver first.</a></p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Assign Vehicle *</label>
                  <select
                    required
                    value={form.vehicleId}
                    onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 bg-white"
                  >
                    <option value="">Select vehicle (optional)...</option>
                    {vehicles.map((v: any) => (
                      <option key={v.id} value={v.id}>{v.model} – {v.plateNumber}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Estimated Time (min)</label>
                <input
                  type="number"
                  value={form.estimatedTime}
                  onChange={(e) => setForm({ ...form, estimatedTime: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
                />
              </div>
            </div>

            {/* Stop Selector */}
            <div className="bg-card rounded-lg border border-border shadow-sm p-6">
              <h3 className="font-semibold text-slate-900 text-sm border-b border-border pb-3 mb-4">
                Select Stops <span className="text-slate-400 font-normal">({form.stops.length} selected)</span>
              </h3>
              {locations.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No locations found. <a href="/locations" className="text-primary-600 underline">Add locations first.</a></p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {locations.map((loc: any) => {
                    const selected = form.stops.includes(loc.id);
                    const displayName = loc.customer?.companyName || loc.customerName || loc.name || "Unknown";
                    return (
                      <div
                        key={loc.id}
                        onClick={() => toggleStop(loc.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selected ? "border-primary-600 bg-primary-50" : "border-border hover:bg-slate-50"}`}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${selected ? "bg-primary-600 border-primary-600" : "border-slate-300"}`}>
                          {selected && <Plus className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{displayName}</p>
                          <p className="text-xs text-slate-400 truncate">{loc.address}</p>
                        </div>
                        <span className="text-xs text-slate-500 flex-shrink-0">{loc.machineType || loc.type || ""}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-4">
            <div className="bg-card rounded-lg border border-border shadow-sm p-6">
              <h3 className="font-semibold text-slate-900 text-sm mb-4">Route Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Route Name</span>
                  <span className="font-medium text-slate-900 text-right max-w-[60%] truncate">{form.name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date</span>
                  <span className="font-medium text-slate-900">{form.date || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Driver</span>
                  <span className="font-medium text-slate-900">{selectedDriver?.name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Stops</span>
                  <span className="font-medium text-slate-900">{form.stops.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Distance</span>
                  <span className="font-medium text-slate-900 flex items-center gap-1">
                    {calculatingRoute ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" /> : `${form.totalDistance} km`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Est. Time</span>
                  <span className="font-medium text-slate-900 flex items-center gap-1">
                    {calculatingRoute ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" /> : `${form.estimatedTime} min`}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full mt-5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Save className="w-4 h-4" /> Create Route</>}
              </button>
              {(form.stops.length === 0 || !form.driverId) && (
                <p className="text-[10px] text-slate-400 text-center mt-2">Select a driver and at least 1 stop</p>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
