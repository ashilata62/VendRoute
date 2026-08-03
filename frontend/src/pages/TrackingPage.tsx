import { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Navigation, Wifi, MapPin,
  RefreshCw, Focus
} from "lucide-react";

import { useTrackingStore } from "../store/trackingStore";
import { routesApi, locationsApi } from "../services/api";
import StatusBadge from "../components/shared/StatusBadge";
import type { Driver } from "../types";

// Leaflet default icon fix
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
    map.flyTo(center, zoom || 13, { animate: true, duration: 1.2 });
  }, [center, zoom, map]);
  return null;
}

// Custom Driver Icon Generator
const createDriverIcon = (color: string, name: string) => {
  return L.divIcon({
    html: `<div style="background:${color};width:36px;height:36px;border-radius:50%;border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;position:relative;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
      <div style="position:absolute;bottom:-18px;background:rgba(15,23,42,0.85);color:white;font-size:9px;font-weight:600;padding:1px 5px;border-radius:4px;white-space:nowrap;">${name.split(" ")[0]}</div>
    </div>`,
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

// Custom Stop Markers
const createStopIcon = (status: "completed" | "current" | "pending") => {
  let bg = "#64748B";
  let content = "•";
  if (status === "completed") { bg = "#10B981"; content = "✓"; }
  if (status === "current") { bg = "#2563EB"; content = "▶"; }

  return L.divIcon({
    html: `<div style="background:${bg};width:22px;height:22px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:bold;">${content}</div>`,
    className: "",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
};

const driverColors: Record<string, string> = {
  d1: "#2563EB",
  d2: "#10B981",
  d3: "#F59E0B",
  d4: "#8B5CF6",
  d5: "#EC4899",
  d6: "#64748B",
};

export default function TrackingPage() {
  const {
    drivers,
    selectedDriver,
    liveLocations,
    setSelectedDriver,
    updateLocation,
  } = useTrackingStore();

  const [mapCenter, setMapCenter] = useState<[number, number]>([19.0760, 72.8777]);
  const [mapZoom, setMapZoom] = useState<number>(12);
  const [refreshing, setRefreshing] = useState(false);
  const [realRoutes, setRealRoutes] = useState<any[]>([]);
  const [realLocations, setRealLocations] = useState<any[]>([]);

  useEffect(() => {
    routesApi.getAll().then(res => { if (res.success) setRealRoutes(res.data); }).catch(() => {});
    locationsApi.getAll().then(res => { if (res.success) setRealLocations(res.data); }).catch(() => {});
  }, []);

  const activeDrivers = useMemo(() => {
    return (drivers || []).filter((d) => d.liveStatus !== "offline");
  }, [drivers]);

  const focusDriver = (driver: Driver) => {
    setSelectedDriver(driver);
    const loc = (liveLocations || []).find((l) => l.driverId === driver.id);
    if (loc) {
      setMapCenter([loc.lat, loc.lng]);
      setMapZoom(15);
    }
  };

  const handleManualRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const driverRoutes = useMemo(() => {
    return activeDrivers.map((driver) => {
      const route = realRoutes.find((r: any) => r.driverId === driver.id && (r.status === "IN_PROGRESS" || r.status === "PENDING")) || realRoutes[0];
      const locs = realLocations.slice(0, 4);
      const coords: [number, number][] = locs.map((l: any) => [l.lat, l.lng]);
      return {
        driverId: driver.id,
        routeName: route?.name || "Active Route",
        color: driverColors[driver.id] || "#2563EB",
        coords,
        stops: locs,
      };
    });
  }, [activeDrivers, realRoutes, realLocations]);

  const currentSelectedDriver = selectedDriver || activeDrivers[0] || drivers[0];
  const currentSelectedRouteInfo = driverRoutes.find((r) => r.driverId === currentSelectedDriver?.id);

  return (
    <div className="-m-3 sm:-m-4 md:-m-6 flex flex-col lg:flex-row min-h-[calc(100vh-64px)] overflow-x-hidden bg-background">
      {/* 70% MAP AREA */}
      <div className="w-full lg:w-[70%] relative h-[380px] sm:h-[480px] lg:h-[calc(100vh-64px)] flex-shrink-0">
        <MapContainer center={mapCenter} zoom={mapZoom} className="h-full w-full">
          <MapFocusController center={mapCenter} zoom={mapZoom} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Draw Driver Routes & Polylines */}
          {driverRoutes.map((r) => (
            <Polyline
              key={r.driverId}
              positions={r.coords}
              color={r.color}
              weight={4}
              opacity={0.7}
              dashArray="6 6"
            />
          ))}

          {/* Draw Stop Markers */}
          {currentSelectedRouteInfo?.stops.map((stopLoc, idx) => {
            const status: "completed" | "current" | "pending" = idx === 0 ? "completed" : idx === 1 ? "current" : "pending";
            return (
              <Marker
                key={stopLoc.id}
                position={[stopLoc.lat, stopLoc.lng]}
                icon={createStopIcon(status)}
              >
                <Popup>
                  <div className="p-1 text-xs">
                    <p className="font-bold text-slate-900">{stopLoc.customerName}</p>
                    <p className="text-slate-500">{stopLoc.address}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 capitalize">
                      {status}
                    </span>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Active Driver Markers */}
          {(liveLocations || []).map((loc) => {
            const driver = drivers.find((d) => d.id === loc.driverId);
            if (!driver || driver.liveStatus === "offline") return null;
            const color = driverColors[loc.driverId] || "#2563EB";

            return (
              <Marker
                key={loc.driverId}
                position={[loc.lat, loc.lng]}
                icon={createDriverIcon(color, driver.name)}
                eventHandlers={{
                  click: () => focusDriver(driver),
                }}
              >
                <Popup>
                  <div className="p-1 text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <img src={driver.photo} alt={driver.name} className="w-7 h-7 rounded-full object-cover" />
                      <div>
                        <p className="font-bold text-slate-900">{driver.name}</p>
                        <p className="text-[10px] text-slate-400">{driver.phone}</p>
                      </div>
                    </div>
                    <div className="border-t border-slate-100 pt-1 mt-1 flex justify-between text-[10px] text-slate-600">
                      <span>Speed: <strong className="text-emerald-600">{loc.speed} km/h</strong></span>
                      <span>Heading: <strong>{loc.heading}°</strong></span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Live Indicator Pill overlay */}
        <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-md border border-border shadow-md rounded-full px-3 py-1.5 flex items-center gap-2 text-xs font-semibold text-slate-800">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
          <span>Live Tracking</span>
          <span className="text-[10px] font-normal text-slate-400">({activeDrivers.length} Online)</span>
        </div>

        {/* Recenter / Refresh Control Button */}
        <div className="absolute top-4 right-4 z-[1000] flex gap-2">
          <button
            onClick={handleManualRefresh}
            className="bg-white/90 backdrop-blur-md hover:bg-white border border-border shadow-md p-2 rounded-xl text-slate-700 transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-blue-600" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* 30% DRIVER SIDEBAR PANEL */}
      <div className="w-full lg:w-[30%] bg-white border-t lg:border-t-0 lg:border-l border-border flex flex-col h-auto lg:h-[calc(100vh-64px)] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-slate-50/50 sticky top-0 z-10">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Active Fleet</h3>
            <p className="text-xs text-slate-400">{activeDrivers.length} of {drivers.length} drivers online</p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1">
            <Wifi className="w-3 h-3" /> Live
          </span>
        </div>

        {/* Drivers List */}
        <div className="p-3 space-y-2.5">
          {drivers.map((driver) => {
            const loc = (liveLocations || []).find((l) => l.driverId === driver.id);
            const isSelected = currentSelectedDriver?.id === driver.id;
            const isOnline = driver.liveStatus !== "offline";

            return (
              <div
                key={driver.id}
                onClick={() => focusDriver(driver)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/50 shadow-sm"
                    : "border-border hover:border-slate-300 hover:bg-slate-50/80"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={driver.photo}
                        alt={driver.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                          isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                        }`}
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{driver.name}</h4>
                      <p className="text-[11px] text-slate-500">{driver.phone}</p>
                    </div>
                  </div>
                  <StatusBadge status={driver.liveStatus} />
                </div>

                {/* Speed & Live stats */}
                {isOnline && loc && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <div className="flex items-center gap-1">
                      <Navigation className="w-3.5 h-3.5 text-blue-600" />
                      <span className="font-semibold text-slate-800">{loc.speed} km/h</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Updated 2s ago</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); focusDriver(driver); }}
                      className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Focus className="w-3 h-3" /> Focus
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Driver Route Timeline */}
        {currentSelectedDriver && (
          <div className="p-4 border-t border-border bg-slate-50/50 mt-auto">
            <h4 className="font-bold text-slate-900 text-xs mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              Route Timeline — {currentSelectedDriver.name.split(" ")[0]}
            </h4>

            <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {[
                { time: "09:00 AM", name: "RCF Colony Complex", status: "completed" },
                { time: "10:15 AM", name: "Nesco IT Park Tower B", status: "current" },
                { time: "11:45 AM", name: "Hiranandani Business Park", status: "pending" },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 pl-6 relative">
                  <span
                    className={`absolute left-0.5 top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                      item.status === "completed"
                        ? "bg-emerald-500"
                        : item.status === "current"
                        ? "bg-blue-600 animate-ping"
                        : "bg-slate-300"
                    }`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{item.name}</span>
                      <span className="text-[10px] text-slate-400">{item.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
