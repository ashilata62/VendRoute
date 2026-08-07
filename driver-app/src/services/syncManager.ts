import NetInfo from '@react-native-community/netinfo';
import api from './api';

// In-memory sync queue (avoids AsyncStorage native module crash)
const syncQueue: any[] = [];

export const addToSyncQueue = async (operation: any) => {
  try {
    syncQueue.push({ ...operation, timestamp: new Date().toISOString() });
    console.log(`Added to sync queue. Queue size: ${syncQueue.length}`);
  } catch (err) {
    console.error('Failed to add to sync queue', err);
  }
};

export const processSyncQueue = async () => {
  try {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) return;
    if (syncQueue.length === 0) return;

    console.log(`Syncing ${syncQueue.length} offline operations...`);
    const response = await api.post('/sync', { syncPayload: [...syncQueue] });

    if (response.data.success) {
      syncQueue.length = 0; // clear array
      console.log('Sync complete');
    }
  } catch (err) {
    console.error('Sync failed, will retry later', err);
  }
};

// Listen to network changes
NetInfo.addEventListener(state => {
  if (state.isConnected) {
    processSyncQueue();
  }
});
