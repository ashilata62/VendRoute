import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';

interface Coordinate {
  lat: number;
  lng: number;
  timestamp: string;
  speed?: number;
}

interface RouteReplayProps {
  coordinates: Coordinate[];
  routeName: string;
  driverName: string;
}

const driverIcon = L.divIcon({
  html: `<div style="background:#2563EB;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function ReplayFocusController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.panTo(center, { animate: true, duration: 0.5 });
  }, [center, map]);
  return null;
}

export default function RouteReplay({ coordinates, routeName, driverName }: RouteReplayProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const playIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= coordinates.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / speedMultiplier);
    } else {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    }
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, speedMultiplier, coordinates.length]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentIndex(Number(e.target.value));
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsPlaying(true);
  };

  if (!coordinates || coordinates.length === 0) {
    return (
      <div className="flex items-center justify-center h-[500px] w-full bg-slate-50 border border-slate-200 rounded-xl p-8">
        <p className="text-slate-500 font-medium">No GPS data available for this route.</p>
      </div>
    );
  }

  const currentCoord = coordinates[currentIndex];
  const polylineCoords: [number, number][] = coordinates.map((c) => [c.lat, c.lng]);

  return (
    <div className="relative w-full h-[550px] rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white flex flex-col">
      {/* Map Area */}
      <div className="flex-1 relative">
        <MapContainer 
          center={[coordinates[0].lat, coordinates[0].lng]} 
          zoom={14} 
          className="h-full w-full z-0"
        >
          <ReplayFocusController center={[currentCoord.lat, currentCoord.lng]} />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          {/* Entire Trajectory */}
          <Polyline positions={polylineCoords} color="#CBD5E1" weight={6} opacity={0.6} />
          {/* Completed Trajectory */}
          <Polyline positions={polylineCoords.slice(0, currentIndex + 1)} color="#3B82F6" weight={6} />
          
          {/* Current Driver Position */}
          <Marker position={[currentCoord.lat, currentCoord.lng]} icon={driverIcon}>
            <Popup>
              <div className="p-1 text-xs">
                <p className="font-bold">{driverName}</p>
                <p>Speed: {currentCoord.speed || 0} km/h</p>
                <p className="text-slate-400">{new Date(currentCoord.timestamp).toLocaleTimeString()}</p>
              </div>
            </Popup>
          </Marker>

          {/* Start and End Markers */}
          <Circle center={[coordinates[0].lat, coordinates[0].lng]} radius={30} pathOptions={{ color: '#10B981', fillColor: '#10B981' }} />
          <Circle center={[coordinates[coordinates.length - 1].lat, coordinates[coordinates.length - 1].lng]} radius={30} pathOptions={{ color: '#EF4444', fillColor: '#EF4444' }} />
        </MapContainer>
        
        {/* Live Stats Overlay */}
        <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-md border border-slate-100 w-64">
          <h3 className="font-bold text-slate-800 text-sm mb-1">{routeName}</h3>
          <p className="text-xs text-slate-500 mb-3">{driverName}</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 p-2 rounded-lg">
              <p className="text-slate-400 mb-1">Time</p>
              <p className="font-bold text-slate-700">{new Date(currentCoord.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg">
              <p className="text-slate-400 mb-1">Speed</p>
              <p className="font-bold text-blue-600">{currentCoord.speed || 0} km/h</p>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel Area */}
      <div className="bg-white border-t border-slate-200 p-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Play/Pause Buttons */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors shadow-sm"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
            </button>
            <button onClick={handleRestart} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          {/* Timeline Slider */}
          <div className="flex-1 w-full px-2">
            <div className="flex justify-between text-[10px] text-slate-400 font-medium mb-2 uppercase tracking-wider">
              <span>Start</span>
              <span>Progress ({Math.round((currentIndex / (coordinates.length - 1 || 1)) * 100)}%)</span>
              <span>End</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max={coordinates.length - 1} 
              value={currentIndex}
              onChange={handleSliderChange}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Speed Controls */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            {[1, 2, 4, 8].map((speed) => (
              <button
                key={speed}
                onClick={() => setSpeedMultiplier(speed)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${speedMultiplier === speed ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
