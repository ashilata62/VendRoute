import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { stopsApi } from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, Navigation, Clock } from 'lucide-react-native';

export default function RouteScreen() {
  const { user } = useAuthStore();
  const navigation = useNavigation<any>();
  const { data: routesResponse, isLoading: loading } = useQuery({
    queryKey: ['routes', user?.id],
    queryFn: () => stopsApi.getDriverRoutes(user?.id!),
    enabled: !!user?.id,
    refetchInterval: 30000 // auto refresh every 30 seconds
  });
  
  const [isRouteStarted, setIsRouteStarted] = useState(false);

  const stops = useMemo(() => {
    if (!routesResponse?.data?.data) return [];
    // Flatten stops from all routes today
    return routesResponse.data.data.flatMap((r: any) => r.routestop || []);
  }, [routesResponse]);

  const pendingStops = useMemo(() => stops.filter((s: any) => s.status !== 'COMPLETED'), [stops]);

  const startRoute = () => {
    setIsRouteStarted(true);
    Alert.alert('Route Started! 🚀', 'Live tracking is now active. Tap "Check-In Now" on your first stop.');
  };

  const handleCheckIn = (stopId: string, stopDetails: any) => {
    navigation.navigate('StopDetails', { stopId, stop: stopDetails });
  };

  if (loading && stops.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Loading Route...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Route</Text>
        <Text style={styles.headerSubtitle}>Active Stops & Navigation</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* START ROUTE BUTTON — no LinearGradient to avoid Android touch block */}
        {!isRouteStarted && pendingStops.length > 0 && (
          <TouchableOpacity
            style={styles.startBtn}
            onPress={startRoute}
            activeOpacity={0.7}
          >
            <Navigation size={22} color="#fff" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.startBtnTitle}>Start Today's Route</Text>
              <Text style={styles.startBtnSub}>Begin tracking & navigation</Text>
            </View>
          </TouchableOpacity>
        )}

        {isRouteStarted && pendingStops.length > 0 && (
          <View style={styles.activeRouteBanner}>
            <View style={styles.pulsingDot} />
            <Text style={styles.activeRouteText}>Live Tracking Active</Text>
          </View>
        )}

        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Up Next</Text>
          <Text style={styles.sectionCount}>{pendingStops.length} stops left</Text>
        </View>

        {pendingStops.length === 0 ? (
          <View style={styles.emptyState}>
            <CheckCircle size={48} color="#10b981" />
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySubtitle}>You have completed all assigned stops for today.</Text>
          </View>
        ) : (
          pendingStops.map((stop, index) => {
            const locName = stop.location?.name || stop.location?.customer?.companyName || 'Unknown Location';
            const locAddress = stop.location?.address || '';

            return (
              <View key={stop.id} style={styles.stopCard}>
                <View style={styles.stopCardHeader}>
                  <View style={styles.stopNumberBadge}>
                    <Text style={styles.stopNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.stopInfo}>
                    <Text style={styles.stopName} numberOfLines={1}>{locName}</Text>
                    <Text style={styles.stopAddress} numberOfLines={1}>{locAddress}</Text>
                  </View>
                  <View style={styles.timeInfo}>
                    <Clock size={12} color="#64748b" />
                    <Text style={styles.timeText}>ETA: 15m</Text>
                  </View>
                </View>

                <View style={styles.stopCardFooter}>
                  {isRouteStarted && stop.status === 'PENDING' ? (
                    <TouchableOpacity
                      style={styles.checkInBtn}
                      onPress={() => handleCheckIn(stop.id, stop)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.checkInText}>Check-In Now</Text>
                    </TouchableOpacity>
                  ) : stop.status === 'REACHED' ? (
                    <View style={styles.statusBadge}>
                      <CheckCircle size={14} color="#059669" />
                      <Text style={styles.statusBadgeText}>Reached - Complete Service</Text>
                    </View>
                  ) : (
                    <Text style={styles.startRouteHint}>Start route to check-in</Text>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#475569', fontWeight: '500' },

  header: { padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  headerSubtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },

  content: { flex: 1, padding: 20 },

  // Simple solid button — no LinearGradient (avoids Android touch blocking)
  startBtn: {
    backgroundColor: '#4f46e5',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  startBtnTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  startBtnSub: { fontSize: 13, color: '#c7d2fe', marginTop: 2 },

  activeRouteBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#dcfce7', padding: 12, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#bbf7d0' },
  pulsingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#16a34a', marginRight: 8 },
  activeRouteText: { color: '#166534', fontWeight: '700', fontSize: 14 },

  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  sectionCount: { fontSize: 13, fontWeight: '600', color: '#64748b' },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 8, paddingHorizontal: 20 },

  stopCard: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, borderWidth: 1, borderColor: '#f1f5f9' },
  stopCardHeader: { flexDirection: 'row', alignItems: 'center' },
  stopNumberBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  stopNumberText: { fontSize: 14, fontWeight: 'bold', color: '#475569' },
  stopInfo: { flex: 1 },
  stopName: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  stopAddress: { fontSize: 12, color: '#64748b', marginTop: 2 },
  timeInfo: { alignItems: 'flex-end' },
  timeText: { fontSize: 11, fontWeight: '600', color: '#64748b', marginTop: 2 },

  stopCardFooter: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  checkInBtn: { backgroundColor: '#4f46e5', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  checkInText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  startRouteHint: { textAlign: 'center', fontSize: 13, color: '#94a3b8', fontStyle: 'italic' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#dcfce7', paddingVertical: 10, borderRadius: 10 },
  statusBadgeText: { color: '#065f46', fontSize: 13, fontWeight: '600', marginLeft: 6 },
});
