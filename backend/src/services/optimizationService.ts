import axios from 'axios';
import { prisma } from '../config/db.js';

export const optimizeRoute = async (routeId: string) => {
  const route = await prisma.route.findUnique({
    where: { id: routeId },
    include: { routestop: { include: { location: true } } }
  });
  if (!route || route.routestop.length < 2) return;

  // Format coordinates for OSRM: {longitude},{latitude}
  const coordinates = route.routestop.map(s => `${s.location.longitude},${s.location.latitude}`).join(';');
  
  try {
    const osrmUrl = `http://router.project-osrm.org/trip/v1/driving/${coordinates}?source=first&roundtrip=false`;
    const { data } = await axios.get(osrmUrl);

    if (data.code === 'Ok' && data.waypoints) {
      // Waypoints return the optimal order
      const optimizedStops = data.waypoints.sort((a: any, b: any) => a.waypoint_index - b.waypoint_index);
      
      // Update stops in the database
      for (let i = 0; i < optimizedStops.length; i++) {
        const originalIndex = optimizedStops[i].waypoint_index;
        const stopId = route.routestop[originalIndex].id;
        
        await prisma.routestop.update({
          where: { id: stopId },
          data: {  stopOrder: i + 1 }
        });
      }

      // Update total distance (meters to km) and duration (seconds to minutes)
      const trip = data.trips[0];
      await prisma.route.update({
        where: { id: routeId },
        data: { 
          plannedDistance: trip.distance / 1000,
          totalDistance: trip.distance / 1000, // Sync legacy field
          plannedDuration: Math.round(trip.duration / 60),
          estimatedTime: Math.round(trip.duration / 60) // Sync legacy field
        }
      });
      return true;
    }
  } catch (error) {
    console.error('OSRM Optimization failed', error);
  }
  return false;
};
