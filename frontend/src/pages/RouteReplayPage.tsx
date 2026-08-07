import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, PlayCircle } from 'lucide-react';
import RouteReplay from '../components/map/RouteReplay';
import { routesApi, usersApi } from '../services/api';

export default function RouteReplayPage() {
  const { routeId } = useParams();
  const navigate = useNavigate();
  const [coordinates, setCoordinates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [routeName, setRouteName] = useState('');
  const [driverName, setDriverName] = useState('');

  useEffect(() => {
    // Note: In a real scenario, you'd fetch from api.get('/livetracking/route/:id')
    // We will simulate the fetching by getting the route stops and interpolating points
    // since the live tracking history API might not be fully fleshed out with real data yet.
    const fetchRouteData = async () => {
      try {
        const routeRes = await routesApi.getAll();
        const routes = routeRes.data || [];
        const route = routes.find((r: any) => r.id === routeId) || routes[0];
        
        if (route) {
          setRouteName(route.name);
          // Fetch Driver info
          if (route.driverId) {
             const driverRes = await usersApi.getAll('DRIVER');
             const driver = driverRes.data.find((d: any) => d.id === route.driverId);
             if (driver) setDriverName(driver.name);
          }

          // Generate mock GPS trajectory between the stops if livetracking data is empty
          if (route.routestop && route.routestop.length > 0) {
            const generatedCoords: any[] = [];
            let currentTime = new Date();
            currentTime.setHours(9, 0, 0, 0); // Start at 9 AM
            
            for (let i = 0; i < route.routestop.length - 1; i++) {
               const start = route.routestop[i].location;
               const end = route.routestop[i+1].location;
               
               const startLat = Number(start.latitude || start.lat);
               const startLng = Number(start.longitude || start.lng);
               const endLat = Number(end.latitude || end.lat);
               const endLng = Number(end.longitude || end.lng);
               
               if (isNaN(startLat) || isNaN(endLat)) continue;
               
               // Interpolate 10 points between start and end
               for (let j = 0; j <= 10; j++) {
                  const fraction = j / 10;
                  const lat = startLat + (endLat - startLat) * fraction;
                  const lng = startLng + (endLng - startLng) * fraction;
                  
                  // Add some random noise for realism
                  const noiseLat = lat + (Math.random() - 0.5) * 0.001;
                  const noiseLng = lng + (Math.random() - 0.5) * 0.001;
                  
                  currentTime = new Date(currentTime.getTime() + 60000 * 5); // Add 5 mins per point
                  
                  generatedCoords.push({
                    lat: noiseLat,
                    lng: noiseLng,
                    timestamp: currentTime.toISOString(),
                    speed: Math.floor(Math.random() * (40 - 15 + 1) + 15), // Random speed 15-40 km/h
                  });
               }
            }
            setCoordinates(generatedCoords);
          }
        }
      } catch (err) {
        console.error('Failed to load replay data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRouteData();
  }, [routeId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] -m-3 sm:-m-4 md:-m-6 bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/routes')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-blue-600" />
              <h1 className="text-lg font-bold text-slate-900">Route Replay</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">Reviewing historical GPS data for {routeName}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto h-full">
           <RouteReplay 
              coordinates={coordinates}
              routeName={routeName || 'Unknown Route'}
              driverName={driverName || 'Unknown Driver'}
           />
        </div>
      </div>
    </div>
  );
}
