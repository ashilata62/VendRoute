import { useState, useEffect, useMemo } from "react";
import { 
  MapPin, Play, CheckCircle2, Clock 
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { stopsApi, authApi, attendanceApi, routesApi } from "../../services/api";

export default function DriverDashboardView() {
  const { user } = useAuthStore();
  const [routesResponse, setRoutesResponse] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [punching, setPunching] = useState(false);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  
  // Modal state
  const [isRouteStarted, setIsRouteStarted] = useState(false);
  const [selectedStopModal, setSelectedStopModal] = useState<any | null>(null);

  const loadData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // API call to fetch routes. Assuming stopsApi has getDriverRoutes or we can just fetch all and filter.
      // Assuming stopsApi doesn't have getDriverRoutes directly, let's use routesApi or just fetch stops
      const res = await stopsApi.getAll(); 
      if (res.success) {
        // filter stops assigned to this driver
        const myStops = res.data.filter((s: any) => s.route?.driver?.id === user.id);
        
        // Reconstruct routes for driver All Routes format
        const routesMap = new Map();
        myStops.forEach((stop: any) => {
          if (!routesMap.has(stop.routeId)) {
            routesMap.set(stop.routeId, { ...stop.route, routestop: [] });
          }
          routesMap.get(stop.routeId).routestop.push(stop);
        });
        
        setRoutesResponse(Array.from(routesMap.values()));
      }
    } catch (e) {
      console.error(e);
    }
    
    fetchAttendance();
    setLoading(false);
  };

  const fetchAttendance = async () => {
    try {
      const attRes = await attendanceApi.getDriverHistory(user!.id);
      if (attRes.success) {
        setAttendanceLogs(attRes.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const { driverAllRoutes, stopsList, completedCount, pendingCount, currentStop } = useMemo(() => {
    const allRoutes = routesResponse || [];
    
    const stops = allRoutes.flatMap((r: any) => 
      (r.routestop || []).map((s: any) => ({ ...s, route: r }))
    );
    const completed = stops.filter((s: any) => s.status === 'COMPLETED').length;
    const pending = stops.length - completed;
    
    let current = stops.find((s: any) => s.status === 'PENDING' || s.status === 'REACHED' || s.status === 'IN_PROGRESS');
    if (!current && stops.length > 0 && pending > 0) {
      current = stops[stops.length - 1];
    }
    
    return { 
      driverAllRoutes: allRoutes, 
      stopsList: stops,
      completedCount: completed,
      pendingCount: pending,
      currentStop: current
    };
  }, [routesResponse]);

  const todaysRoutes = useMemo(() => {
    return driverAllRoutes.filter((r: any) => {
      const d = new Date(r.createdAt || r.date);
      const today = new Date();
      return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    });
  }, [driverAllRoutes]);

  const todaysRoutesCompleted = todaysRoutes.filter((r: any) => r.status === 'COMPLETED').length;
  const todaysRoutesPending = todaysRoutes.length - todaysRoutesCompleted;

  const handlePunchIn = async () => {
    setPunching(true);
    try {
      await authApi.punchIn();
      await fetchAttendance();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to punch in');
    } finally {
      setPunching(false);
    }
  };

  const handlePunchOut = async () => {
    setPunching(true);
    try {
      await authApi.punchOut();
      await fetchAttendance();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to punch out');
    } finally {
      setPunching(false);
    }
  };

  const handleStartRoute = () => {
    setIsRouteStarted(true);
    if (currentStop) {
      setSelectedStopModal(currentStop);
    }
  };

  const markStopCompleted = async (stopId: string) => {
    try {
      await routesApi.updateStopStatus(stopId, "COMPLETED");
      setSelectedStopModal(null);
      loadData();
    } catch (e) {
      console.error("Failed to mark completed");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 pt-4">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-6 text-white shadow-lg flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Hello, {user?.name}!</h1>
          <p className="text-blue-200 text-sm mt-1">Driver Dashboard &middot; Stay safe on the road.</p>
        </div>
        <div className="bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/30 text-right">
          <p className="text-[10px] text-blue-100 uppercase font-bold tracking-wider mb-1">ASSIGNED VEHICLE</p>
          <p className="text-sm font-semibold">{(user as any)?.assignedVehicle?.model || 'No Vehicle Assigned'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Today's Shift Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex justify-between items-center">
              <span>Today's Shift</span>
              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded border border-slate-200">
                {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
                <p className="text-3xl font-black text-slate-800">{todaysRoutes.length}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Total Routes</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-100">
                <p className="text-3xl font-black text-emerald-600">{todaysRoutesCompleted}</p>
                <p className="text-[10px] font-bold text-emerald-600 mt-1 uppercase">Completed</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-100">
                <p className="text-3xl font-black text-amber-600">{todaysRoutesPending}</p>
                <p className="text-[10px] font-bold text-amber-600 mt-1 uppercase">Pending</p>
              </div>
            </div>
          </div>

          {/* Current Route Progress */}
          {stopsList.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-base font-bold text-slate-800">Current Route Progress</h2>
                <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-100">
                  {currentStop?.route?.name || 'Assigned Route'}
                </span>
              </div>
              
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-slate-600">Stops Completion</span>
                <span className="text-sm font-bold text-blue-600">
                  {completedCount} / {stopsList.length}
                </span>
              </div>
              
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((completedCount / (stopsList.length || 1)) * 100)}%` }}
                />
              </div>
              <p className="text-right text-xs text-slate-400 font-medium mt-2">
                {Math.round((completedCount / (stopsList.length || 1)) * 100)}% Completed
              </p>
            </div>
          )}

          {/* Next Stop Card */}
          {currentStop ? (
            <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10" />
              <h2 className="text-xs font-bold text-blue-600 tracking-wider mb-4">NEXT ASSIGNED STOP</h2>
              
              <div className="flex items-start gap-4 mb-6">
                <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {currentStop.location?.name || currentStop.location?.customer?.companyName || 'Unknown Location'}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">{currentStop.location?.address}</p>
                  
                  <div className="flex items-center gap-4 mt-3 text-sm font-medium">
                    <span className="flex items-center gap-1 text-slate-600">
                      <span className="text-blue-500">📍</span> {currentStop?.route?.totalDistance ? (currentStop.route.totalDistance / Math.max(currentStop.route.routestop?.length || 1, 1)).toFixed(1) : "0"} km away
                    </span>
                    <span className="flex items-center gap-1 text-slate-600">
                      <span className="text-amber-500">⏱️</span> ETA: {currentStop?.route?.estimatedTime ? Math.round(currentStop.route.estimatedTime / Math.max(currentStop.route.routestop?.length || 1, 1)) : 10} mins
                    </span>
                  </div>
                </div>
              </div>

              {!isRouteStarted ? (
                <button 
                  onClick={handleStartRoute}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Play size={18} fill="currentColor" />
                  START ROUTE
                </button>
              ) : (
                <button 
                  onClick={() => setSelectedStopModal(currentStop)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <MapPin size={18} />
                  VIEW STOP DETAILS
                </button>
              )}
            </div>
          ) : (
            <div className="bg-emerald-50 rounded-xl shadow-sm border border-emerald-100 p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">All Caught Up!</h2>
              <p className="text-slate-500">You have no pending routes assigned for today.</p>
            </div>
          )}

        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Attendance Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-base font-bold text-slate-800 mb-4">Attendance</h2>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button 
                onClick={handlePunchIn}
                disabled={punching}
                className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold py-3 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50"
              >
                <Clock size={18} />
                <span className="text-xs">Punch In</span>
              </button>
              <button 
                onClick={handlePunchOut}
                disabled={punching}
                className="bg-red-100 hover:bg-red-200 text-red-700 font-bold py-3 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50"
              >
                <Clock size={18} />
                <span className="text-xs">Punch Out</span>
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Recent Logs</h3>
              
              {attendanceLogs.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No recent attendance found.</p>
              ) : (
                attendanceLogs.slice(0, 5).map((log: any) => {
                  const punchInTime = new Date(log.punchIn).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
                  const punchOutTime = log.punchOut ? new Date(log.punchOut).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase() : null;
                  const dateStr = new Date(log.punchIn || log.date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' });
                  
                  return (
                    <div key={log.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <div>
                        <p className="text-xs font-bold text-slate-700">{dateStr}</p>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                          In: {punchInTime} {punchOutTime && `| Out: ${punchOutTime}`}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded text-[10px] font-bold ${punchOutTime ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-700'}`}>
                        {punchOutTime ? 'Duty Ended' : 'On Duty'}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Stop Details Modal */}
      {selectedStopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Stop Details</h3>
                <p className="text-xs text-slate-500 font-mono mt-1">ID: {selectedStopModal.id}</p>
              </div>
              <button 
                onClick={() => setSelectedStopModal(null)}
                className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="mb-6">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Location Information</h4>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="font-bold text-slate-800">{selectedStopModal.location?.name || 'Unknown'}</p>
                  <p className="text-sm text-slate-600 mt-1">{selectedStopModal.location?.address}</p>
                  {selectedStopModal.location?.contactPhone && (
                    <p className="text-sm text-blue-600 mt-2 font-medium">📞 {selectedStopModal.location.contactPhone}</p>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Stop Requirements</h4>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-amber-800 text-sm">
                  {selectedStopModal.tasks || 'Standard restocking procedure.'}
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => markStopCompleted(selectedStopModal.id)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  Mark Completed
                </button>
                <button 
                  onClick={() => setSelectedStopModal(null)}
                  className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold py-3 rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
