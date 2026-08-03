import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Route, History, User, LogOut, CheckCircle2,
  Play, MapPin, Camera, Trash2,
  Navigation, ShieldCheck, QrCode
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { stopsApi } from "../../services/api";
import { mockRoutes, mockLocations } from "../../data/mockData";
import { cn } from "../../lib/utils";
import brandLogo from "../../assets/maryland-logo.png";

export default function DriverMobileLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"home" | "route" | "history" | "profile">("home");

  // Driver states
  const [isRouteStarted, setIsRouteStarted] = useState(false);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [showMachineDetails, setShowMachineDetails] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [, setGpsVerified] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showScanner, setShowScanner] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      const cached = localStorage.getItem("pending_stops_sync");
      if (cached) {
        setSyncing(true);
        setTimeout(() => {
          setSyncing(false);
          localStorage.removeItem("pending_stops_sync");
          alert("Offline changes synced successfully!");
        }, 1500);
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  const [cashCollected, setCashCollected] = useState("");
  const [stopNotes, setStopNotes] = useState("");
  const [reportedIssue, setReportedIssue] = useState("");
  const [isSigned, setIsSigned] = useState(false);
  const [refillItems, setRefillItems] = useState<{ product: string; qty: number }[]>([
    { product: "Coca-Cola 330ml", qty: 12 },
    { product: "Lay's Salted Chips", qty: 8 },
  ]);
  const [newRefillProduct, setNewRefillProduct] = useState("");
  const [newRefillQty, setNewRefillQty] = useState("5");
  const [stopPhotos, setStopPhotos] = useState<string[]>([
    "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300&auto=format&fit=crop&q=60"
  ]);

  // History list
  const [historyRecords] = useState([
    { date: "2026-07-30", route: "Western Express Hospital Run", stops: 12, cash: 18500, photos: 4, notes: "All machines restocked. Minor cooler noise at Lifeline Hosp." },
    { date: "2026-07-29", route: "Central Corporate Sweep", stops: 10, cash: 15400, photos: 2, notes: "Refilled combo machine. Cash collection complete." },
    { date: "2026-07-28", route: "South Zone Hub Route", stops: 8, cash: 12000, photos: 3, notes: "Cleaned coin slot of VM-104." }
  ]);

  // Driver route stops
  const [stopsList, setStopsList] = useState<any[]>([]);
  const [historyRoutes, setHistoryRoutes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStops = async () => {
    try {
      const res = await stopsApi.getAll();
      if (res.success) {
        // Find stops assigned to the current driver
        const allDriverStops = res.data.filter((s: any) => s.route?.driver?.id === user?.id);
        
        // Active stops are for routes that are NOT completed
        const activeStops = allDriverStops.filter((s: any) => s.route?.status !== "COMPLETED");
        setStopsList(activeStops);

        // Extract unique completed routes for history
        const completedStops = allDriverStops.filter((s: any) => s.route?.status === "COMPLETED");
        const uniqueRoutesMap = new Map();
        completedStops.forEach((s: any) => {
          if (s.route && !uniqueRoutesMap.has(s.route.id)) {
            uniqueRoutesMap.set(s.route.id, s.route);
          }
        });
        setHistoryRoutes(Array.from(uniqueRoutesMap.values()));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStops();
  }, [user]);

  const completedCount = stopsList.filter(s => s.status === "COMPLETED").length;
  const pendingCount = stopsList.length - completedCount;
  const currentStop = stopsList.find(s => s.status === "PENDING" || s.status === "REACHED") || (stopsList.length > 0 && pendingCount > 0 ? stopsList[stopsList.length - 1] : undefined);
  const currentLocation = currentStop?.location;
  const driverRoute = currentStop?.route || (stopsList.length > 0 ? stopsList[0].route : null) || { name: "No Active Route" };

  const handleStartRoute = () => {
    setIsRouteStarted(true);
    // Auto check-in next stop
    if (currentStop) {
      setStopsList(prev => prev.map(s => s.id === currentStop.id ? { ...s, status: "in-progress" } : s));
    }
  };

  const handleCheckIn = () => {
    setIsCheckedIn(true);
    setGpsVerified(true);
  };

  const handleAddRefill = () => {
    if (!newRefillProduct) return;
    setRefillItems([...refillItems, { product: newRefillProduct, qty: parseInt(newRefillQty) || 1 }]);
    setNewRefillProduct("");
  };

  const handleRemoveRefill = (index: number) => {
    setRefillItems(refillItems.filter((_, i) => i !== index));
  };

  const handlePhotoUpload = () => {
    // Simulate photo add
    setStopPhotos([...stopPhotos, "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=300&auto=format&fit=crop&q=60"]);
  };

  const handleCompleteStop = async () => {
    if (!isCheckedIn || !currentStop) return;
    
    const checkInData = {
      gpsVerified: true,
      cashCollected: Number(cashCollected) || 0,
      notes: stopNotes,
      machineIssues: reportedIssue,
      productsRefilled: refillItems,
      signatureUrl: isSigned ? "https://example.com/signature.png" : null,
    };

    // If offline, cache the completed stop locally for sync
    if (!isOnline) {
      const cached = JSON.parse(localStorage.getItem("pending_stops_sync") || "[]");
      cached.push({
        stopId: currentStop.id,
        ...checkInData,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem("pending_stops_sync", JSON.stringify(cached));
      alert("Offline Mode: Data saved locally. It will auto-sync when you go back online!");
      
      // Optimistic update
      setStopsList(prev => prev.map(s => s.id === currentStop.id ? { ...s, status: "COMPLETED" } : s));
    } else {
      // Online: call API
      try {
        setSyncing(true);
        const res = await stopsApi.checkIn(currentStop.id, checkInData);
        if (res.success) {
          // Update active stop status
          setStopsList(prev => prev.map(s => s.id === currentStop.id ? { ...s, ...res.data, status: "COMPLETED" } : s));
        }
      } catch (err) {
        alert("Failed to submit check-in");
      } finally {
        setSyncing(false);
      }
    }
    
    // Reset inputs
    setIsCheckedIn(false);
    setGpsVerified(false);
    setCashCollected("");
    setStopNotes("");
    setReportedIssue("");
    setIsSigned(false);
    setRefillItems([
      { product: "Coca-Cola 330ml", qty: 10 },
      { product: "Lay's Salted Chips", qty: 5 },
    ]);
    setSelectedStopId(null);
    setShowMachineDetails(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-0 sm:p-4 font-sans text-slate-800">
      {/* Mobile Frame Container */}
      <div className="w-full sm:max-w-[420px] h-screen sm:h-[840px] bg-slate-50 sm:rounded-[36px] sm:shadow-2xl sm:border-[8px] border-slate-950 overflow-hidden flex flex-col relative">
        
        {/* Device Status Bar */}
        <div className="bg-[#0B1536] text-white px-6 py-2 flex justify-between items-center text-xs font-semibold select-none flex-shrink-0">
          <span>10:45 AM</span>
          <div className="w-24 h-4 bg-slate-950 rounded-full mx-auto hidden sm:block shadow-inner" />
          <div className="flex items-center gap-1">
            <span>5G</span>
            <div className="w-5 h-2.5 bg-white/20 rounded-sm p-[1px]">
              <div className="w-full h-full bg-emerald-400 rounded-sm" />
            </div>
          </div>
        </div>

        {/* Mobile App Header */}
        <header className="bg-[#0B1536] text-white px-4 py-4 flex items-center justify-between shadow-md flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-white shadow-lg shadow-red-600/30 flex items-center justify-center overflow-hidden border border-white/20 flex-shrink-0">
              <img src={brandLogo} alt="Maryland Driver Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-extrabold text-sm tracking-tight">Maryland <span className="text-blue-400">Driver</span></span>
          </div>
          <div className="flex items-center gap-2">
            <span
              onClick={() => {
                const newOnline = !isOnline;
                setIsOnline(newOnline);
                if (newOnline) {
                  const cached = localStorage.getItem("pending_stops_sync");
                  if (cached) {
                    setSyncing(true);
                    setTimeout(() => {
                      setSyncing(false);
                      localStorage.removeItem("pending_stops_sync");
                      alert("Offline changes synced successfully!");
                    }, 1200);
                  }
                }
              }}
              className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer select-none",
                isOnline
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 animate-pulse"
                  : "bg-red-500/20 text-red-300 border-red-500/30"
              )}
            >
              ● {isOnline ? "Online" : "Offline (Tap to toggle)"}
            </span>
          </div>
        </header>

        {/* Offline & Sync Notification Banners */}
        {!isOnline && (
          <div className="bg-red-600 text-white text-center py-1.5 px-2 text-[10px] font-extrabold flex items-center justify-center gap-1.5 animate-pulse flex-shrink-0">
            ⚠️ OFFLINE MODE ACTIVE · DATA WILL CACHE LOCALLY
          </div>
        )}
        {syncing && (
          <div className="bg-blue-600 text-white text-center py-1.5 px-2 text-[10px] font-extrabold flex items-center justify-center gap-1.5 flex-shrink-0">
            🔄 SYNCHRONIZING LOCAL DATA ENTRIES TO CLOUD STORE...
          </div>
        )}

        {/* Screen Content Window */}
        <div className="flex-1 overflow-y-auto pb-20 relative bg-slate-50">
          <AnimatePresence mode="wait">
            {/* ── SCREEN 1: HOME ── */}
            {activeTab === "home" && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 space-y-4"
              >
                {/* Driver Greeting Card */}
                <div className="bg-gradient-to-br from-[#ff3b3b] to-[#4f46e5] text-white rounded-2xl p-4 shadow-lg flex items-center gap-3">
                  <img src={user?.avatar} alt="" className="w-12 h-12 rounded-full border-2 border-white/30" />
                  <div>
                    <h3 className="font-bold text-sm">Hello, {user?.name}!</h3>
                    <p className="text-[10px] opacity-80 font-medium">Assigned Vehicle: Tata Ace (MH-03-GH-3456)</p>
                  </div>
                </div>

                {/* Today's Route Summary - only when active stops exist */}
                {stopsList.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-800">Today's Route Progress</span>
                    <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                      {driverRoute?.name || "Route"}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <p className="text-lg font-black text-slate-900">{stopsList.length}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Stops</p>
                    </div>
                    <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                      <p className="text-lg font-black text-emerald-700">{completedCount}</p>
                      <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider">Completed</p>
                    </div>
                    <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100">
                      <p className="text-lg font-black text-amber-700">{pendingCount}</p>
                      <p className="text-[9px] text-amber-500 font-bold uppercase tracking-wider">Pending</p>
                    </div>
                  </div>

                  {/* Horizontal Progress */}
                  <div className="space-y-1 pt-1">
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${Math.round((completedCount / stopsList.length) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[9px] text-slate-400 text-right font-semibold">
                      {Math.round((completedCount / stopsList.length) * 100)}% Completed
                    </p>
                  </div>
                </div>
                )}

                {/* If no active routes */}
                {stopsList.length === 0 && (
                  <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-6 text-center space-y-3 shadow-sm">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h3 className="text-sm font-bold text-emerald-800">All Caught Up!</h3>
                    <p className="text-xs text-emerald-600">You have no pending routes assigned for today.</p>
                  </div>
                )}

                {/* Next Stop Card */}
                {currentStop && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Next Assigned Stop</h4>
                    
                    <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{currentLocation?.customer?.companyName || currentLocation?.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{currentLocation?.address}</p>
                        <div className="flex gap-4 mt-2 text-[10px] text-slate-500 font-bold">
                          <span>📍 2.4 km away</span>
                          <span>⏱️ ETA: 10 mins</span>
                        </div>
                      </div>
                    </div>

                    {!isRouteStarted ? (
                      <button
                        onClick={handleStartRoute}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                      >
                        <Play className="w-4 h-4 fill-white" /> START ROUTE
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <button
                          onClick={() => { setActiveTab("route"); setSelectedStopId(currentStop.id); }}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                        >
                          <MapPin className="w-4 h-4" /> VIEW STOP DETAILS
                        </button>
                        
                        <div className="flex gap-2">
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${currentLocation?.lat || 19.0760},${currentLocation?.lng || 72.8777}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-center rounded-lg font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          >
                            <Navigation className="w-3 h-3 text-blue-600" /> Google Maps
                          </a>
                          <a
                            href={`https://waze.com/ul?ll=${currentLocation?.lat || 19.0760},${currentLocation?.lng || 72.8777}&navigate=yes`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-center rounded-lg font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          >
                            🚙 Navigate Waze
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── SCREEN 2: MY ROUTE ── */}
            {activeTab === "route" && !selectedStopId && (
              <motion.div
                key="route-list"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 space-y-4"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-slate-900">Assigned Route Stop Sequence</h3>
                  <button 
                    onClick={() => alert("Launching external navigation mapping...")} 
                    className="p-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl flex items-center gap-1.5 text-[10px] font-bold cursor-pointer hover:bg-blue-100"
                  >
                    <Navigation className="w-3.5 h-3.5" /> Navigate All
                  </button>
                </div>

                {/* Stops Checklist Sequence */}
                <div className="space-y-4 relative pl-4 border-l border-slate-200 ml-3">
                  {stopsList.map((stop, index) => {
                    const loc = mockLocations.find(l => l.id === stop.locationId);
                    const isCompleted = stop.status === "COMPLETED";
                    const isActive = stop.status === "REACHED" || (stop.status === "PENDING" && index === completedCount);

                    return (
                      <div
                        key={stop.id}
                        onClick={() => {
                          if (isRouteStarted) {
                            setSelectedStopId(stop.id);
                          } else {
                            alert("Please start the route from the Home page first.");
                          }
                        }}
                        className={`relative p-3.5 rounded-xl border transition-all cursor-pointer ${
                          isCompleted
                            ? "bg-emerald-50/50 border-emerald-200 text-slate-500"
                            : isActive
                            ? "bg-blue-50/70 border-blue-200 ring-2 ring-blue-500/20"
                            : "bg-white border-slate-200"
                        }`}
                      >
                        {/* Bullet indicators */}
                        <div
                          className={`absolute -left-[27px] top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center border-2 text-[10px] font-bold ${
                            isCompleted
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : isActive
                              ? "bg-blue-600 border-blue-600 text-white animate-pulse"
                              : "bg-white border-slate-300 text-slate-400"
                          }`}
                        >
                          {isCompleted ? "✓" : index + 1}
                        </div>

                        <div className="flex justify-between items-start">
                          <div>
                            <p className={`text-xs font-bold ${isCompleted ? "line-through text-slate-400" : "text-slate-900"}`}>
                              {stop.location?.customer?.companyName || stop.location?.name}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[240px]">{stop.location?.address}</p>
                          </div>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                              isCompleted
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : isActive
                                ? "bg-blue-100 text-blue-800 border-blue-200"
                                : "bg-slate-100 text-slate-500 border-slate-200"
                            }`}
                          >
                            {isCompleted ? "Done" : isActive ? "Current" : "Pending"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ── SUB SCREEN: STOP DETAILS (Working Form) ── */}
            {activeTab === "route" && selectedStopId && (
              <motion.div
                key="stop-detail"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 space-y-4"
              >
                {/* Back Link */}
                <button
                  onClick={() => { setSelectedStopId(null); setShowMachineDetails(false); }}
                  className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  ← Back to Route Sequence
                </button>

                {/* Stop Header info */}
                {(() => {
                  const stop = stopsList.find(s => s.id === selectedStopId)!;
                  const loc = stop.location || mockLocations[0];
                  return (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-900">{loc.customer?.companyName || loc.name}</h3>
                          <p className="text-[10px] text-slate-400 mt-0.5">{loc.address}</p>
                        </div>
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold px-2.5 py-0.5 rounded-full">
                          {stop.route?.vehicle?.plateNumber || "VH-Unknown"}
                        </span>
                      </div>

                      {/* GPS Verification Badge */}
                      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className={isCheckedIn ? "text-emerald-600 font-bold" : "text-slate-400 font-medium"}>
                            {isCheckedIn ? "✓ GPS Verified Location" : "Not Checked In"}
                          </span>
                        </div>
                        {!isCheckedIn ? (
                          <div className="flex gap-1.5">
                            <button
                              onClick={handleCheckIn}
                              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                            >
                              [ Check In ]
                            </button>
                            <button
                              onClick={() => { setShowScanner(true); setIsScanning(true); }}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer flex items-center gap-1 transition-colors"
                            >
                              <QrCode className="w-3.5 h-3.5 text-blue-600" /> [ Scan QR ]
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> Checked In
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Tabs for Stop Work: Task Form vs Machine Specs */}
                <div className="flex gap-2 border-b border-slate-200 pb-2">
                  <button
                    onClick={() => setShowMachineDetails(false)}
                    className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg ${
                      !showMachineDetails ? "bg-slate-200 text-slate-800" : "text-slate-500"
                    }`}
                  >
                    Servicing Form
                  </button>
                  <button
                    onClick={() => setShowMachineDetails(true)}
                    className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg ${
                      showMachineDetails ? "bg-slate-200 text-slate-800" : "text-slate-500"
                    }`}
                  >
                    🥤 Machine Details
                  </button>
                </div>

                {!showMachineDetails ? (
                  /* SERVICING FORM MODULES */
                  <div className="space-y-4">
                    {/* Previous Photos */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-700">Previous Service Photos</span>
                        <button
                          onClick={() => alert("Showing historical photos for this machine: Clean trays, fully restocked snacks.")}
                          className="text-[10px] text-blue-600 font-bold hover:underline"
                        >
                          [ View ]
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <img
                          src="https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=100&auto=format&fit=crop&q=60"
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                        />
                        <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 border-dashed flex items-center justify-center text-[10px] text-slate-400 font-bold">
                          +3
                        </div>
                      </div>
                    </div>

                    {/* Upload Current Photo */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
                      <span className="text-xs font-bold text-slate-700 block">Service Visual Confirmation</span>
                      <div className="flex flex-wrap gap-2">
                        {stopPhotos.map((photo, i) => (
                          <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200">
                            <img src={photo} alt="" className="w-full h-full object-cover" />
                            <button
                              onClick={() => setStopPhotos(stopPhotos.filter((_, idx) => idx !== i))}
                              className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-600 rounded-full text-white text-[8px] flex items-center justify-center"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={handlePhotoUpload}
                          className="w-14 h-14 rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 flex flex-col items-center justify-center text-slate-400 cursor-pointer"
                        >
                          <Camera className="w-5 h-5 text-slate-400" />
                          <span className="text-[8px] font-bold mt-1">[ Upload ]</span>
                        </button>
                      </div>
                    </div>

                    {/* Inventory Refilled List */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
                      <span className="text-xs font-bold text-slate-700 block">Inventory Refilled Checklist</span>
                      
                      {/* Refill List */}
                      <div className="space-y-2">
                        {refillItems.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 text-xs">
                            <span className="font-medium text-slate-700">{item.product}</span>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-slate-900">Qty: {item.qty}</span>
                              <button onClick={() => handleRemoveRefill(idx)} className="text-red-500 hover:text-red-700">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add Item form */}
                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <input
                          placeholder="Product Name"
                          value={newRefillProduct}
                          onChange={(e) => setNewRefillProduct(e.target.value)}
                          className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50"
                        />
                        <input
                          type="number"
                          placeholder="Qty"
                          value={newRefillQty}
                          onChange={(e) => setNewRefillQty(e.target.value)}
                          className="w-14 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50"
                        />
                        <button
                          onClick={handleAddRefill}
                          className="px-3 bg-blue-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          [ Add ]
                        </button>
                      </div>
                    </div>

                    {/* Cash Collected & Notes */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Cash Collected (₹)</label>
                        <input
                          type="number"
                          placeholder="e.g. 4500"
                          value={cashCollected}
                          onChange={(e) => setCashCollected(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-slate-50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Service Notes</label>
                        <textarea
                          placeholder="Add machine notes, stock remarks, or cleaning updates..."
                          value={stopNotes}
                          onChange={(e) => setStopNotes(e.target.value)}
                          rows={2}
                          className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-slate-50 resize-none"
                        />
                      </div>
                    </div>

                    {/* Report Issue & Signature */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
                      <div>
                        <span className="text-xs font-bold text-slate-700 block mb-1">Operational Issues</span>
                        <div className="flex gap-2">
                          {["None", "Coin Jam", "Cooler Issue", "Offline"].map((issue) => (
                            <button
                              key={issue}
                              onClick={() => setReportedIssue(issue)}
                              className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                                reportedIssue === issue
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : "bg-slate-50 text-slate-600 border-slate-200"
                              }`}
                            >
                              {issue}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Signature simulation */}
                      <div className="border-t border-slate-100 pt-3">
                        <span className="text-xs font-bold text-slate-700 block mb-1">Digital Signature Confirmation</span>
                        <div
                          onClick={() => setIsSigned(!isSigned)}
                          className="h-20 bg-slate-50 border border-slate-200 border-dashed rounded-xl flex items-center justify-center text-xs text-slate-400 cursor-pointer select-none"
                        >
                          {isSigned ? (
                            <span className="text-blue-600 font-extrabold italic tracking-widest text-lg">Arjun Sharma ✓</span>
                          ) : (
                            <span>[ Click to sign digitally ]</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action button */}
                    <button
                      onClick={handleCompleteStop}
                      disabled={!isCheckedIn}
                      className={`w-full py-3 text-white rounded-xl font-extrabold text-xs shadow-md transition-colors cursor-pointer ${
                        isCheckedIn
                          ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25"
                          : "bg-slate-300 text-slate-500 shadow-none cursor-not-allowed"
                      }`}
                    >
                      [ Mark Stop Complete ]
                    </button>
                  </div>
                ) : (
                  /* MACHINE DETAILS SUB-VIEW */
                  <div className="space-y-4">
                    {(() => {
                      const stop = stopsList.find(s => s.id === selectedStopId)!;
                      const loc = mockLocations.find(l => l.id === stop.locationId)!;
                      return (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Machine Profile Specs</h4>
                          
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <p className="text-slate-400 text-[10px]">Machine ID</p>
                              <p className="font-bold text-slate-800">{loc.machineId}</p>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <p className="text-slate-400 text-[10px]">Type</p>
                              <p className="font-bold text-slate-800">{loc.machineType}</p>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <p className="text-slate-400 text-[10px]">Last Visit</p>
                              <p className="font-bold text-slate-800">{loc.lastServiceDate}</p>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <p className="text-slate-400 text-[10px]">Visit Frequency</p>
                              <p className="font-bold text-slate-800">{loc.visitFrequency}</p>
                            </div>
                          </div>

                          {/* Stock Levels */}
                          <div className="border-t border-slate-100 pt-3">
                            <span className="text-xs font-bold text-slate-700 block mb-2">Refill Stock Levels</span>
                            <div className="space-y-2">
                              {[
                                { name: "Snacks / Chips", pct: 20, color: "bg-red-500" },
                                { name: "Beverages / Sodas", pct: 85, color: "bg-emerald-500" },
                                { name: "Chocolates / Candies", pct: 45, color: "bg-amber-500" }
                              ].map((stock) => (
                                <div key={stock.name} className="text-xs">
                                  <div className="flex justify-between text-slate-500 mb-1">
                                    <span>{stock.name}</span>
                                    <span className="font-bold text-slate-700">{stock.pct}%</span>
                                  </div>
                                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div className={`h-full rounded-full ${stock.color}`} style={{ width: `${stock.pct}%` }} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Machine Coordinates */}
                          <div className="border-t border-slate-100 pt-3 text-xs space-y-1.5">
                            <p className="font-bold text-slate-700">📍 Live Navigation Coordinates</p>
                            <p className="font-mono text-[10px] text-slate-500">LAT: {loc.lat} · LNG: {loc.lng}</p>
                            <p className="text-[10px] text-slate-400">ETA: 10 mins · Distance: 2.4 km to Next stop</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── SCREEN 3: HISTORY ── */}
            {activeTab === "history" && (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 space-y-4"
              >
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex justify-between items-center">
                  <div>
                    <h2 className="font-bold text-slate-900 text-sm">Route History</h2>
                    <p className="text-[10px] text-slate-500">Your past completed routes</p>
                  </div>
                  <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center">
                    <History className="w-5 h-5 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-3">
                  {historyRoutes.length === 0 ? (
                    <div className="text-center p-6 text-slate-400 text-xs">No completed routes yet.</div>
                  ) : (
                    historyRoutes.map((route, idx) => (
                      <div key={idx} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{route.name}</p>
                            <p className="text-[10px] text-slate-500">{new Date(route.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">COMPLETED</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* ── SCREEN 4: PROFILE ── */}
            {activeTab === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 space-y-4"
              >
                {/* Personal Profile Details */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col items-center text-center space-y-3">
                  <img src={user?.avatar} alt="" className="w-20 h-20 rounded-full border-4 border-blue-50 object-cover shadow-inner" />
                  <div>
                    <h3 className="font-black text-slate-900 text-base">{user?.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Field Operations Officer</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">License: DL-04202412983</p>
                  </div>
                  <div className="flex gap-2 w-full pt-2 border-t border-slate-100 text-xs">
                    <div className="flex-1 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold">ATTENDANCE</p>
                      <p className="font-bold text-slate-800 mt-0.5">98.2%</p>
                    </div>
                    <div className="flex-1 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold">VEHICLE ID</p>
                      <p className="font-bold text-slate-800 mt-0.5">V-102</p>
                    </div>
                  </div>
                </div>

                {/* Attendance Records */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attendance Logs (Latest)</h4>
                  <div className="space-y-2">
                    {[
                      { day: "Today (31 July)", status: "Present", signin: "07:30 AM", class: "text-emerald-700 bg-emerald-50 border-emerald-100" },
                      { day: "Yesterday (30 July)", status: "Present", signin: "07:45 AM", class: "text-emerald-700 bg-emerald-50 border-emerald-100" },
                      { day: "29 July", status: "Present", signin: "07:32 AM", class: "text-emerald-700 bg-emerald-50 border-emerald-100" },
                      { day: "28 July", status: "Present", signin: "07:30 AM", class: "text-emerald-700 bg-emerald-50 border-emerald-100" },
                    ].map((att, i) => (
                      <div key={i} className="flex justify-between items-center text-xs p-2 rounded-lg border border-slate-100 bg-slate-50">
                        <span className="font-bold text-slate-700">{att.day}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-slate-400">In: {att.signin}</span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${att.class}`}>
                            {att.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-md shadow-red-600/25 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <LogOut className="w-4.5 h-4.5" /> Log Out App
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="absolute bottom-0 left-0 right-0 h-16 bg-[#0B1536] border-t border-slate-800 flex items-center justify-around z-40 select-none">
          {[
            { id: "home", icon: Home, label: "Home", emoji: "🏠" },
            { id: "route", icon: Route, label: "My Route", emoji: "🗺️" },
            { id: "history", icon: History, label: "History", emoji: "📋" },
            { id: "profile", icon: User, label: "Profile", emoji: "👤" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setSelectedStopId(null); }}
                className="flex flex-col items-center justify-center gap-1 cursor-pointer transition-all duration-150"
              >
                <div className={`p-1.5 rounded-full transition-all duration-200 ${
                  isActive ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-110" : "text-slate-400 hover:text-white"
                }`}>
                  <tab.icon className="w-5 h-5" />
                </div>
                <span className={`text-[9px] font-extrabold transition-colors ${
                  isActive ? "text-blue-400" : "text-slate-400"
                }`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* MOCK CAMERA SCANNER MODAL */}
      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 flex flex-col items-center text-center space-y-5 text-white">
            <div className="flex justify-between items-center w-full border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-blue-400">
                <QrCode className="w-4 h-4" /> Machine QR Barcode Scanner
              </h3>
              <button
                onClick={() => { setShowScanner(false); setIsScanning(false); }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Mock Camera Viewfinder View */}
            <div className="relative w-64 h-64 bg-black border-2 border-blue-500 rounded-2xl overflow-hidden flex flex-col items-center justify-center shadow-inner shadow-blue-500/10">
              {isScanning ? (
                <>
                  {/* Camera simulated scan lines */}
                  <div className="absolute inset-x-0 h-[3px] bg-blue-500 shadow-md shadow-blue-400/50 animate-bounce" style={{ animationDuration: "2.5s" }} />
                  {/* Corner brackets */}
                  <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-sm" />
                  <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-sm" />
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-sm" />
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-sm" />
                  <p className="text-[10px] text-slate-400 font-medium animate-pulse">Align QR Code inside brackets...</p>
                </>
              ) : (
                <div className="p-4 space-y-2 text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <p className="text-xs font-bold">Vending Machine Verified</p>
                  <p className="text-[10px] text-slate-400">VM ID: {currentLocation?.machineId || "VM-102"}</p>
                </div>
              )}
            </div>

            {/* Quick Actions to trigger validation */}
            {isScanning && (
              <div className="w-full space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsScanning(false);
                    setTimeout(() => {
                      setIsCheckedIn(true);
                      setGpsVerified(true);
                      setShowScanner(false);
                      alert(`Successfully Scanned QR Code! Machine ${currentLocation?.machineId || "VM-102"} verified successfully.`);
                    }, 1200);
                  }}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/20 cursor-pointer transition-colors"
                >
                  [ Simulate Scan: Machine QR Label ]
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert("Invalid scan code. Please scan the QR label located on the top right panel of the vending machine.");
                  }}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-[10px] cursor-pointer transition-colors"
                >
                  [ Simulate Scan: Invalid Code ]
                </button>
              </div>
            )}

            <button
              onClick={() => { setShowScanner(false); setIsScanning(false); }}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
            >
              Cancel Scan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
