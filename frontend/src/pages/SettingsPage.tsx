import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Save, Globe, CheckCircle2, Sliders, Clock, Camera, Key, Loader2 } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import { useAuthStore } from "../store/authStore";
import { settingsApi } from "../services/api";

const tabs = [
  { id: "company", label: "General & Company", icon: Globe },
  { id: "routing", label: "Route & Hours", icon: Sliders },
  { id: "gps_photos", label: "GPS & Photo Storage", icon: Camera },
  { id: "rules", label: "Rules & Inventory", icon: Clock },
  { id: "api_matrix", label: "APIs & Permissions", icon: Key },
];

export default function SettingsPage() {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("company");
  const [saved, setSaved] = useState(false);

  // Sync tab with URL query parameter
  useEffect(() => {
    if (location.search.includes("profile=true")) {
      setActiveTab("company");
    }
  }, [location.search]);

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    if (location.search.includes("profile=true")) {
      navigate("/settings", { replace: true });
    }
  };

  const [companyForm, setCompanyForm] = useState({
    orgName: "Maryland Vending Service",
    timezone: "Asia/Kolkata (IST, UTC+5:30)",
    currency: "INR (₹)",
    language: "English",
    theme: (localStorage.getItem("app-theme") === "Dark" ? "Dark" : "Light") as "Light" | "Dark",
    logo: localStorage.getItem("company-logo") || "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [routeHoursForm, setRouteHoursForm] = useState({
    autoOptimize: true, maxStops: 15, startTime: "08:00", endTime: "18:00",
    priority: "Medium", distanceLimit: 120, shiftType: "Day Shift (08:00 - 17:00)",
    breakTime: 60, weekendSat: true, weekendSun: true, holidays: "New Year, Independence Day, Diwali",
  });

  const [gpsPhotoForm, setGpsPhotoForm] = useState({
    gpsAccuracy: "High (GPS + Network)", gpsInterval: 10, geofenceRadius: 50,
    backgroundTracking: true, mandatoryCheckin: true, maxPhotos: 4, maxImageSize: 5,
    compression: "80% (Optimized)", allowedJPG: true, allowedPNG: true,
    allowedWEBP: true, cloudProvider: "Firebase Storage",
  });

  const [settingsLoading, setSettingsLoading] = useState(true);

  // Load settings from backend on mount
  useEffect(() => {
    settingsApi.get().then((res) => {
      if (res.success && res.data) {
        const d = res.data;
        if (d.company) setCompanyForm((prev) => ({ ...prev, ...d.company, theme: d.company.theme || prev.theme, logo: d.company.logo || localStorage.getItem("company-logo") || "" }));
        if (d.routing) setRouteHoursForm((prev) => ({ ...prev, ...d.routing }));
        if (d.gps) setGpsPhotoForm((prev) => ({ ...prev, ...d.gps }));
        if (d.permissions) setPermissions((prev: any) => ({ ...prev, ...d.permissions }));
        if (d.machineTypes) setMachineTypes(d.machineTypes);
        if (d.productCategories) setProductCategories(d.productCategories);
        if (d.inventoryRules) setInventoryRules((prev) => ({ ...prev, ...d.inventoryRules }));
        if (d.attendanceRules) setAttendanceRules((prev) => ({ ...prev, ...d.attendanceRules }));
        if (d.apiForm) setApiForm((prev) => ({ ...prev, ...d.apiForm }));
      }
    }).catch(() => {}).finally(() => setSettingsLoading(false));
  }, []);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setCompanyForm((prev: any) => ({ ...prev, logo: base64 }));
        localStorage.setItem("company-logo", base64);
        window.dispatchEvent(new Event("storage"));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSave = async () => {
    try {
      // Apply theme locally (browser-side)
      try {
        localStorage.setItem("app-theme", companyForm.theme);
        localStorage.setItem("company-logo", companyForm.logo);
      } catch (storageErr) {
        console.warn("Could not save to localStorage (might be too large)", storageErr);
      }
      
      const root = document.documentElement;
      if (companyForm.theme === "Dark") {
        root.classList.add("dark");
      } else if (companyForm.theme === "Light") {
        root.classList.remove("dark");
      } else {
        const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        if (systemPrefersDark) root.classList.add("dark");
        else root.classList.remove("dark");
      }
      window.dispatchEvent(new Event("storage"));

      // Save everything to backend DB
      await settingsApi.save({
        company: companyForm,
        routing: routeHoursForm,
        gps: gpsPhotoForm,
        permissions,
        machineTypes,
        productCategories,
        inventoryRules,
        attendanceRules,
        apiForm,
      });
      
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      console.error("Failed to save settings to backend", err);
      alert("Error saving settings: " + (err.message || "Unknown error"));
    }
  };

  const [machineTypes, setMachineTypes] = useState<string[]>([]);
  const [productCategories, setProductCategories] = useState<string[]>([]);
  const [newMachineType, setNewMachineType] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("");
  const [inventoryRules, setInventoryRules] = useState({
    minStock: 20,
    maxStock: 100,
    refillAlert: true,
  });
  const [attendanceRules, setAttendanceRules] = useState({
    startGrace: 15,
    lateThreshold: 30,
    absentHours: 4,
  });

  // 5. API Settings & Permissions Matrix
  const [apiForm, setApiForm] = useState({
    googleMapsKey: "AIzaSyD-mock_google_maps_sdk_key_value",
    firebaseConfig: '{\n  "apiKey": "AIzaSy...",\n  "authDomain": "vendroute.firebaseapp.com"\n}',
    storageBucket: "gs://vendroute-ops-storage.appspot.com",
    enablePush: true,
    enableEmail: true,
    enableSMS: false,
    recipients: "ops-alerts@vendroute.in, supervisor@vendroute.in",
  });

  type PermissionsType = {
    superadmin: Record<string, boolean>;
    supervisor: Record<string, boolean>;
    driver: Record<string, boolean>;
  };

  // User Roles Permission Matrix state
  const [permissions, setPermissions] = useState<PermissionsType>(() => {
    const savedPerms = localStorage.getItem("role-permissions");
    if (savedPerms) {
      try { return JSON.parse(savedPerms) as PermissionsType; } catch {}
    }
    return {
      superadmin: { regions: true, users: true, routes: true, reports: true },
      supervisor: { regions: true, users: false, routes: true, reports: true },
      driver: { regions: false, users: false, routes: false, reports: false },
    };
  });

  const togglePermission = (role: "superadmin" | "supervisor" | "driver", module: string) => {
    setPermissions((prev: PermissionsType) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [module]: !prev[role][module],
      },
    }));
  };



  return (
    <div className="space-y-6 pb-12">
      <PageHeader title="Settings" description="Configure company parameters, route rules, GPS geofencing, photo sizes, and role permission matrices." />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tab Navigation Sidebar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 h-fit space-y-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleTabClick(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === id
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon className="w-4.5 h-4.5 flex-shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Form Panel */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          {/* TAB 1: COMPANY & GENERAL */}
          {activeTab === "company" && (
            <div className="space-y-5">
              <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3">Company & Business Settings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Organization / Company Name</label>
                  <input
                    type="text"
                    value={companyForm.orgName}
                    onChange={(e) => setCompanyForm({ ...companyForm, orgName: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-slate-50 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Company Logo</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleLogoChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <div 
                      onClick={handleUploadClick}
                      className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-blue-600/25 cursor-pointer overflow-hidden relative group"
                      title="Click to upload logo"
                    >
                      {companyForm.logo ? (
                        <img src={companyForm.logo} alt="Company Logo" className="w-full h-full object-cover" />
                      ) : (
                        "VR"
                      )}
                      <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        type="button" 
                        onClick={handleUploadClick}
                        className="px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-[10px] font-bold text-slate-700 cursor-pointer"
                      >
                        Upload Logo
                      </button>
                      {companyForm.logo && (
                        <button 
                          type="button" 
                          onClick={() => setCompanyForm((prev) => ({ ...prev, logo: "" }))}
                          className="px-3 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-[10px] font-bold cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Time Zone</label>
                  <select
                    value={companyForm.timezone}
                    onChange={(e) => setCompanyForm({ ...companyForm, timezone: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-medium"
                  >
                    <option>Asia/Kolkata (IST, UTC+5:30)</option>
                    <option>America/New_York (EST, UTC-5:00)</option>
                    <option>Europe/London (GMT, UTC+0:00)</option>
                    <option>Asia/Dubai (GST, UTC+4:00)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Default Currency</label>
                  <select
                    value={companyForm.currency}
                    onChange={(e) => setCompanyForm({ ...companyForm, currency: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-medium"
                  >
                    <option>INR (₹)</option>
                    <option>USD ($)</option>
                    <option>EUR (€)</option>
                    <option>AED (د.إ)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Default Language</label>
                  <select
                    value={companyForm.language}
                    onChange={(e) => setCompanyForm({ ...companyForm, language: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-medium"
                  >
                    <option>English</option>
                    <option>Hindi (हिंदी)</option>
                    <option>Spanish (Español)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Theme Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["Light", "Dark"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setCompanyForm({ ...companyForm, theme: t });
                          localStorage.setItem("app-theme", t);
                          const root = document.documentElement;
                          if (t === "Dark") {
                            root.classList.add("dark");
                          } else {
                            root.classList.remove("dark");
                          }
                          window.dispatchEvent(new Event("storage"));
                        }}
                        className={`py-2 text-[10px] font-bold rounded-lg border text-center cursor-pointer transition-colors ${
                          companyForm.theme === t
                            ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ROUTE & HOURS PREFERENCES */}
          {activeTab === "routing" && (
            <div className="space-y-6">
              <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3">Route Preferences & Optimization</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-150">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">AI Route Optimization</span>
                    <span className="text-[10px] text-slate-400">Minimize travel distance between stops automatically</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRouteHoursForm({ ...routeHoursForm, autoOptimize: !routeHoursForm.autoOptimize })}
                    className={`relative w-10 h-5.5 rounded-full transition-colors cursor-pointer ${routeHoursForm.autoOptimize ? "bg-blue-600" : "bg-slate-300"}`}
                  >
                    <span className={`absolute top-0.75 w-4 h-4 bg-white rounded-full transition-all ${routeHoursForm.autoOptimize ? "left-5.25" : "left-0.75"}`} />
                  </button>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Max Stops Per Route</label>
                  <input
                    type="number"
                    value={routeHoursForm.maxStops}
                    onChange={(e) => setRouteHoursForm({ ...routeHoursForm, maxStops: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Route Shift Start Time</label>
                  <input
                    type="time"
                    value={routeHoursForm.startTime}
                    onChange={(e) => setRouteHoursForm({ ...routeHoursForm, startTime: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Route Shift End Time</label>
                  <input
                    type="time"
                    value={routeHoursForm.endTime}
                    onChange={(e) => setRouteHoursForm({ ...routeHoursForm, endTime: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Route Priority Defaults</label>
                  <select
                    value={routeHoursForm.priority}
                    onChange={(e) => setRouteHoursForm({ ...routeHoursForm, priority: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none"
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Distance Limit Per Driver (km)</label>
                  <input
                    type="number"
                    value={routeHoursForm.distanceLimit}
                    onChange={(e) => setRouteHoursForm({ ...routeHoursForm, distanceLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pt-2 pb-3">Working Hours & shifts</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Driver Shift Categories</label>
                  <select
                    value={routeHoursForm.shiftType}
                    onChange={(e) => setRouteHoursForm({ ...routeHoursForm, shiftType: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none"
                  >
                    <option>Day Shift (08:00 - 17:00)</option>
                    <option>Night Shift (20:00 - 05:00)</option>
                    <option>Split Shift Rotation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Shift Break Allowance (mins)</label>
                  <input
                    type="number"
                    value={routeHoursForm.breakTime}
                    onChange={(e) => setRouteHoursForm({ ...routeHoursForm, breakTime: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Active Weekend Days</label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={routeHoursForm.weekendSat}
                        onChange={(e) => setRouteHoursForm({ ...routeHoursForm, weekendSat: e.target.checked })}
                      />
                      Saturday Shift
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={routeHoursForm.weekendSun}
                        onChange={(e) => setRouteHoursForm({ ...routeHoursForm, weekendSun: e.target.checked })}
                      />
                      Sunday Shift
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Official Holidays Log</label>
                  <input
                    type="text"
                    value={routeHoursForm.holidays}
                    onChange={(e) => setRouteHoursForm({ ...routeHoursForm, holidays: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none bg-slate-50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GPS & PHOTO STORAGE */}
          {activeTab === "gps_photos" && (
            <div className="space-y-6">
              <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3">GPS Tracking configuration</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">GPS Accuracy Target</label>
                  <select
                    value={gpsPhotoForm.gpsAccuracy}
                    onChange={(e) => setGpsPhotoForm({ ...gpsPhotoForm, gpsAccuracy: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none"
                  >
                    <option>High (GPS + Network)</option>
                    <option>Medium (Cell Tower Only)</option>
                    <option>Power Saving (Coarse GPS)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Update Interval (seconds)</label>
                  <input
                    type="number"
                    value={gpsPhotoForm.gpsInterval}
                    onChange={(e) => setGpsPhotoForm({ ...gpsPhotoForm, gpsInterval: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Geofence Proximity Radius (meters)</label>
                  <input
                    type="number"
                    value={gpsPhotoForm.geofenceRadius}
                    onChange={(e) => setGpsPhotoForm({ ...gpsPhotoForm, geofenceRadius: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div className="flex flex-col justify-center space-y-2 mt-4 sm:mt-0">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gpsPhotoForm.backgroundTracking}
                      onChange={(e) => setGpsPhotoForm({ ...gpsPhotoForm, backgroundTracking: e.target.checked })}
                    />
                    Enable Background Tracking on driver app
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gpsPhotoForm.mandatoryCheckin}
                      onChange={(e) => setGpsPhotoForm({ ...gpsPhotoForm, mandatoryCheckin: e.target.checked })}
                    />
                    GPS Mandatory for stop check-in check
                  </label>
                </div>
              </div>

              <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pt-2 pb-3">Photo Upload & Cloud Storage limits</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Max Photos Allowed Per Stop</label>
                  <input
                    type="number"
                    value={gpsPhotoForm.maxPhotos}
                    onChange={(e) => setGpsPhotoForm({ ...gpsPhotoForm, maxPhotos: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Max Image File Size (MB)</label>
                  <input
                    type="number"
                    value={gpsPhotoForm.maxImageSize}
                    onChange={(e) => setGpsPhotoForm({ ...gpsPhotoForm, maxImageSize: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Image Compression Quality</label>
                  <select
                    value={gpsPhotoForm.compression}
                    onChange={(e) => setGpsPhotoForm({ ...gpsPhotoForm, compression: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none"
                  >
                    <option>80% (Optimized)</option>
                    <option>90% (High Quality)</option>
                    <option>No Compression (Raw)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Cloud Storage Provider</label>
                  <select
                    value={gpsPhotoForm.cloudProvider}
                    onChange={(e) => setGpsPhotoForm({ ...gpsPhotoForm, cloudProvider: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none"
                  >
                    <option>Firebase Storage</option>
                    <option>AWS S3 Bucket Link</option>
                    <option>Google Cloud Storage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Allowed Image Formats</label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={gpsPhotoForm.allowedJPG}
                        onChange={(e) => setGpsPhotoForm({ ...gpsPhotoForm, allowedJPG: e.target.checked })}
                      />
                      JPG
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={gpsPhotoForm.allowedPNG}
                        onChange={(e) => setGpsPhotoForm({ ...gpsPhotoForm, allowedPNG: e.target.checked })}
                      />
                      PNG
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={gpsPhotoForm.allowedWEBP}
                        onChange={(e) => setGpsPhotoForm({ ...gpsPhotoForm, allowedWEBP: e.target.checked })}
                      />
                      WebP
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RULES, INVENTORY & WORK categories */}
          {activeTab === "rules" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3">Machine Categories</h3>
                <div className="flex flex-wrap gap-2 my-3">
                  {machineTypes.map((cat, i) => (
                    <span key={i} className="flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-lg">
                      {cat}
                      <button type="button" onClick={() => setMachineTypes(machineTypes.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700 cursor-pointer ml-1 font-extrabold">✕</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 max-w-md">
                  <input
                    type="text"
                    placeholder="Add category (e.g. Snack Station)..."
                    value={newMachineType}
                    onChange={(e) => setNewMachineType(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newMachineType) return;
                      setMachineTypes([...machineTypes, newMachineType]);
                      setNewMachineType("");
                    }}
                    className="px-3 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-bold cursor-pointer hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3">Product Categories</h3>
                <div className="flex flex-wrap gap-2 my-3">
                  {productCategories.map((cat, i) => (
                    <span key={i} className="flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-lg">
                      {cat}
                      <button type="button" onClick={() => setProductCategories(productCategories.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700 cursor-pointer ml-1 font-extrabold">✕</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 max-w-md">
                  <input
                    type="text"
                    placeholder="Add category (e.g. Protein Bars)..."
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newProductCategory) return;
                      setProductCategories([...productCategories, newProductCategory]);
                      setNewProductCategory("");
                    }}
                    className="px-3 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-bold cursor-pointer hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3 mb-3">Inventory Threshold Rules</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Minimum Stock Trigger (%)</label>
                      <input
                        type="number"
                        value={inventoryRules.minStock}
                        onChange={(e) => setInventoryRules({ ...inventoryRules, minStock: Number(e.target.value) })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Max Stock Target Limit</label>
                      <input
                        type="number"
                        value={inventoryRules.maxStock}
                        onChange={(e) => setInventoryRules({ ...inventoryRules, maxStock: Number(e.target.value) })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                      />
                    </div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={inventoryRules.refillAlert}
                        onChange={(e) => setInventoryRules({ ...inventoryRules, refillAlert: e.target.checked })}
                      />
                      Generate dashboard refill warnings
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3 mb-3">Driver Attendance Rules</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Grace Period For Late Sign-In (mins)</label>
                      <input
                        type="number"
                        value={attendanceRules.startGrace}
                        onChange={(e) => setAttendanceRules({ ...attendanceRules, startGrace: Number(e.target.value) })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Late Threshold Warnings Trigger (mins)</label>
                      <input
                        type="number"
                        value={attendanceRules.lateThreshold}
                        onChange={(e) => setAttendanceRules({ ...attendanceRules, lateThreshold: Number(e.target.value) })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Absent Threshold (shift idle hours)</label>
                      <input
                        type="number"
                        value={attendanceRules.absentHours}
                        onChange={(e) => setAttendanceRules({ ...attendanceRules, absentHours: Number(e.target.value) })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: APIS & ROLE PERMISSIONS MATRIX */}
          {activeTab === "api_matrix" && (
            <div className="space-y-6">
              <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3">API SDK Credentials</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Google Maps Web SDK Key</label>
                  <input
                    type="password"
                    value={apiForm.googleMapsKey}
                    onChange={(e) => setApiForm({ ...apiForm, googleMapsKey: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50 font-mono"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Firebase Database Config JSON</label>
                    <textarea
                      rows={3}
                      value={apiForm.firebaseConfig}
                      onChange={(e) => setApiForm({ ...apiForm, firebaseConfig: e.target.value })}
                      className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Cloud Storage Bucket URI</label>
                    <input
                      type="text"
                      value={apiForm.storageBucket}
                      onChange={(e) => setApiForm({ ...apiForm, storageBucket: e.target.value })}
                      className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50 font-mono"
                    />
                  </div>
                </div>
              </div>

              <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pt-2 pb-3">Dynamic Notification Dispatches</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 mt-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={apiForm.enablePush}
                      onChange={(e) => setApiForm({ ...apiForm, enablePush: e.target.checked })}
                    />
                    Enable FCM Push Notifications
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={apiForm.enableEmail}
                      onChange={(e) => setApiForm({ ...apiForm, enableEmail: e.target.checked })}
                    />
                    Enable Automated Email Dispatches
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={apiForm.enableSMS}
                      onChange={(e) => setApiForm({ ...apiForm, enableSMS: e.target.checked })}
                    />
                    Enable Twilio SMS Alert Notifications
                  </label>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Notification Alert Recipients</label>
                  <input
                    type="text"
                    value={apiForm.recipients}
                    onChange={(e) => setApiForm({ ...apiForm, recipients: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none text-slate-600"
                  />
                </div>
              </div>

              <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pt-2 pb-3">Configure Role Permissions Matrix</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase">
                      <th className="py-2.5">User Role</th>
                      <th className="py-2.5 text-center">Manage Regions</th>
                      <th className="py-2.5 text-center">Manage Users</th>
                      <th className="py-2.5 text-center">Manage Routes</th>
                      <th className="py-2.5 text-center">Audits & Reports</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Object.keys(permissions) as Array<"superadmin" | "supervisor" | "driver">).map((role) => (
                      <tr key={role} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                        <td className="py-3 font-extrabold capitalize text-slate-700">{role}</td>
                        {["regions", "users", "routes", "reports"].map((module) => {
                          const val = permissions[role][module as keyof typeof permissions[typeof role]];
                          return (
                            <td key={module} className="py-3 text-center">
                              <input
                                type="checkbox"
                                checked={val}
                                onChange={() => togglePermission(role, module)}
                                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Save Bar */}
          <div className="mt-8 border-t border-slate-150 pt-5 flex justify-end">
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 text-xs font-extrabold px-6 py-3 rounded-xl transition-all cursor-pointer shadow-sm ${
                saved
                  ? "bg-emerald-500 text-white shadow-emerald-500/30"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/25"
              }`}
            >
              {saved ? (
                <><CheckCircle2 className="w-4 h-4" /> Changes Applied Successfully!</>
              ) : (
                <><Save className="w-4 h-4" /> Save Business Configuration</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
