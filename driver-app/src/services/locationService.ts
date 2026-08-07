import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { getSocket } from './socket';

const LOCATION_TASK_NAME = 'background-location-task';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error) {
    console.error(error);
    return;
  }
  if (data) {
    const { locations } = data as any;
    const loc = locations[0];
    const socket = getSocket();
    socket.emit('driver:location_update', {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      speed: loc.coords.speed,
      heading: loc.coords.heading,
      accuracy: loc.coords.accuracy,
    });
  }
});

export const startLocationTracking = async () => {
  const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
  if (fgStatus === 'granted') {
    const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
    if (bgStatus === 'granted') {
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 15000,
        distanceInterval: 10,
        deferredUpdatesInterval: 15000,
        foregroundService: {
          notificationTitle: "VendRoute Tracking",
          notificationBody: "Your location is being tracked for routing.",
        },
      });
    }
  }
};
