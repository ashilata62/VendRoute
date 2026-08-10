import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, TouchableOpacity, ScrollView, Linking, Platform, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle, MapPin, Navigation as NavIcon, Play, Bell } from 'lucide-react-native';
import { stopsApi, authApi, notificationsApi } from '../services/api';
import { useQuery } from '@tanstack/react-query';
import NotificationsModal from '../components/NotificationsModal';

export default function DashboardScreen() {
  const { user, isOnline, toggleOnline, isRouteStarted, startRoute } = useAuthStore();
  const navigation = useNavigation<any>();
  const [showNotifModal, setShowNotifModal] = useState(false);

  const { data: notifRes } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => notificationsApi.getNotifications(user?.id!),
    enabled: !!user?.id,
    refetchInterval: 15000
  });

  const unreadCount = (notifRes?.data?.data || []).filter((n: any) => !n.read).length;

  useEffect(() => {
    if (!user?.id) return;
    authApi.getProfile()
      .then((res: any) => {
        if (res.data && res.data.data) {
          useAuthStore.setState({ user: res.data.data });
        }
      })
      .catch((err: any) => console.warn('Failed to refresh profile:', err));
  }, [user?.id]);
  
  const { data: routesResponse, isLoading: loading } = useQuery({
    queryKey: ['routes', user?.id],
    queryFn: () => stopsApi.getDriverRoutes(user?.id!),
    enabled: !!user?.id,
    refetchInterval: 30000 
  });

  const { driverAllRoutes, stopsList, completedCount, pendingCount, currentStop } = useMemo(() => {
    const allRoutes = routesResponse?.data?.data || [];
    
    // Only get stops for active (not completed) routes to match web simulator
    const activeRoutes = allRoutes.filter((r: any) => r.status !== 'COMPLETED');
    const stops = activeRoutes.flatMap((r: any) => 
      (r.routestop || []).map((s: any) => ({ ...s, route: r }))
    );
    stops.sort((a: any, b: any) => (a.stopOrder || 0) - (b.stopOrder || 0));
    
    const completed = stops.filter((s: any) => s.status === 'COMPLETED').length;
    const pending = stops.length - completed;
    
    // Find current stop
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

  const assignedVehicle = useMemo(() => {
    if ((user as any)?.vehicle && (user as any).vehicle.length > 0) {
      const v = (user as any).vehicle[0];
      return v.plateNumber ? `${v.model} (${v.plateNumber})` : v.model;
    }
    if (currentStop?.route?.vehicle?.plateNumber || currentStop?.route?.vehicle?.model) {
      const v = currentStop.route.vehicle;
      return v.plateNumber ? `${v.model} (${v.plateNumber})` : v.model;
    }
    const routesWithVehicle = driverAllRoutes.filter((r: any) => r.vehicle);
    if (routesWithVehicle.length > 0) {
      const sorted = [...routesWithVehicle].sort((a: any, b: any) => {
        return new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime();
      });
      const v = sorted[0].vehicle;
      return v.plateNumber ? `${v.model} (${v.plateNumber})` : v.model;
    }
    return "Unassigned";
  }, [user, currentStop, driverAllRoutes]);

  const handleStartRoute = () => {
    startRoute();
    if (currentStop) {
      navigation.navigate('My Route', {
        screen: 'StopDetails',
        params: { stopId: currentStop.id, stop: currentStop }
      });
    } else {
      navigation.navigate('My Route');
    }
  };

  const openNavigation = (lat: number, lng: number, label: string) => {
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${lat},${lng}`;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });
    if (url) Linking.openURL(url);
  };

  const todayDisplay = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  
  const todaysRoutes = useMemo(() => {
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const isToday = (r: any) => {
      const dateToUse = r.endTime || r.date || r.createdAt;
      if (!dateToUse) return false;
      
      // Get today's date in IST
      const nowIST = new Date(Date.now() + IST_OFFSET_MS);
      const todayStr = nowIST.toISOString().slice(0, 10);

      if (typeof dateToUse === 'string' && dateToUse.length === 10 && dateToUse.includes('-')) {
        return dateToUse === todayStr;
      }
      const d = new Date(dateToUse);
      if (isNaN(d.getTime())) return false;
      const istDate = new Date(d.getTime() + IST_OFFSET_MS);
      return istDate.toISOString().slice(0, 10) === todayStr;
    };

    return driverAllRoutes.filter(isToday);
  }, [driverAllRoutes]);

  const todaysRoutesCompleted = todaysRoutes.filter((r: any) => r.status === 'COMPLETED').length;
  const todaysRoutesPending = todaysRoutes.length - todaysRoutesCompleted;

  return (
    <View style={styles.container}>
      {/* Dark Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.logoContainer}>
            <View style={[styles.logoCircle, { overflow: 'hidden' }]}>
              <Image 
                source={require('../../assets/icon.png')} 
                style={{ width: '100%', height: '100%', resizeMode: 'cover' }} 
              />
            </View>
            <Text style={styles.headerTitle}>Maryland <Text style={styles.headerTitleRed}>Driver</Text></Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity style={styles.bellBtn} onPress={() => setShowNotifModal(true)} activeOpacity={0.7}>
              <Bell size={22} color="#fff" />
              {unreadCount > 0 && <View style={styles.bellDot} />}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.onlineBadge, !isOnline && styles.offlineBadge]} 
              onPress={toggleOnline}
              activeOpacity={0.7}
            >
              <View style={[styles.onlineDot, !isOnline && styles.offlineDot]} />
              <Text style={[styles.onlineText, !isOnline && styles.offlineText]}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Driver Greeting Card */}
        <LinearGradient 
          colors={['#2563eb', '#4f46e5', '#0f172a']} 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 1 }} 
          style={styles.greetingBanner}
        >
          <View style={styles.greetingRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{user?.name?.substring(0, 2).toUpperCase() || 'DR'}</Text>
            </View>
            <View style={styles.greetingInfo}>
              <Text style={styles.greetingTitle}>Hello, {user?.name || 'Driver'}! 👋</Text>
              <Text style={styles.greetingSubtitle}>Vehicle: <Text style={{fontWeight: 'bold'}}>{assignedVehicle}</Text></Text>
            </View>
            <View style={styles.dutyBadge}>
              <View style={styles.dutyDot} />
              <Text style={styles.dutyText}>Duty Active</Text>
            </View>
          </View>
        </LinearGradient>

        {loading ? (
           <ActivityIndicator size="large" color="#4338ca" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Today's Shift (Routes) */}
            {todaysRoutes.length > 0 && (
              <View style={styles.statsCard}>
                <View style={styles.statsHeader}>
                  <Text style={styles.statsTitle}>Today's Shift (Routes)</Text>
                  <View style={styles.dateBadge}>
                    <Text style={styles.dateBadgeText}>{todayDisplay}</Text>
                  </View>
                </View>
                
                <View style={styles.gridRow}>
                  <View style={[styles.gridBox, { backgroundColor: '#f8fafc', borderColor: '#f1f5f9' }]}>
                    <Text style={[styles.gridNum, { color: '#0f172a' }]}>{todaysRoutes.length}</Text>
                    <Text style={[styles.gridLabel, { color: '#94a3b8' }]}>TOTAL ROUTES</Text>
                  </View>
                  <View style={[styles.gridBox, { backgroundColor: '#ecfdf5', borderColor: '#d1fae5' }]}>
                    <Text style={[styles.gridNum, { color: '#047857' }]}>{todaysRoutesCompleted}</Text>
                    <Text style={[styles.gridLabel, { color: '#10b981' }]}>COMPLETED</Text>
                  </View>
                  <View style={[styles.gridBox, { backgroundColor: '#fffbeb', borderColor: '#fef3c7' }]}>
                    <Text style={[styles.gridNum, { color: '#b45309' }]}>{todaysRoutesPending}</Text>
                    <Text style={[styles.gridLabel, { color: '#f59e0b' }]}>PENDING</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Current Route (Stops) */}
            {stopsList.length > 0 && (
              <View style={styles.statsCard}>
                <View style={styles.statsHeader}>
                  <Text style={styles.statsTitle}>Current Route (Stops)</Text>
                  <View style={styles.routeBadge}>
                    <Text style={styles.routeBadgeText}>{currentStop?.route?.name || 'Assigned Route'}</Text>
                  </View>
                </View>
                
                <View style={styles.gridRow}>
                  <View style={[styles.gridBox, { backgroundColor: '#f8fafc', borderColor: '#f1f5f9' }]}>
                    <Text style={[styles.gridNum, { color: '#0f172a' }]}>{stopsList.length}</Text>
                    <Text style={[styles.gridLabel, { color: '#94a3b8' }]}>TOTAL STOPS</Text>
                  </View>
                  <View style={[styles.gridBox, { backgroundColor: '#ecfdf5', borderColor: '#d1fae5' }]}>
                    <Text style={[styles.gridNum, { color: '#047857' }]}>{completedCount}</Text>
                    <Text style={[styles.gridLabel, { color: '#10b981' }]}>COMPLETED</Text>
                  </View>
                  <View style={[styles.gridBox, { backgroundColor: '#fffbeb', borderColor: '#fef3c7' }]}>
                    <Text style={[styles.gridNum, { color: '#b45309' }]}>{pendingCount}</Text>
                    <Text style={[styles.gridLabel, { color: '#f59e0b' }]}>PENDING</Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${Math.round((completedCount / (stopsList.length || 1)) * 100)}%` }]} />
                  </View>
                  <Text style={styles.progressText}>{Math.round((completedCount / (stopsList.length || 1)) * 100)}% Completed</Text>
                </View>
              </View>
            )}

            {/* All Caught Up */}
            {stopsList.length === 0 && (
              <View style={styles.caughtUpCard}>
                <View style={styles.iconCircle}>
                  <CheckCircle size={24} color="#059669" />
                </View>
                <Text style={styles.caughtUpTitle}>All Caught Up!</Text>
                <Text style={styles.caughtUpSubtitle}>You have no pending routes assigned for today.</Text>
              </View>
            )}

            {/* Next Stop Card */}
            {currentStop && (
              <View style={styles.statsCard}>
                <Text style={styles.nextStopLabel}>NEXT ASSIGNED STOP</Text>
                <View style={styles.nextStopInfo}>
                  <View style={styles.pinIconBox}>
                    <MapPin size={16} color="#2563eb" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nextStopName}>{currentStop.location?.customer?.companyName || currentStop.location?.name || 'Unknown'}</Text>
                    <Text style={styles.nextStopAddress}>{currentStop.location?.address}</Text>
                    <View style={styles.nextStopMeta}>
                      <Text style={styles.metaText}>📍 {currentStop?.route?.totalDistance ? (currentStop.route.totalDistance / Math.max(currentStop.route.routestop?.length || 1, 1)).toFixed(1) : "0"} km away</Text>
                      <Text style={styles.metaText}>⏱️ ETA: {currentStop?.route?.estimatedTime ? Math.round(currentStop.route.estimatedTime / Math.max(currentStop.route.routestop?.length || 1, 1)) : 10} mins</Text>
                    </View>
                  </View>
                </View>

                {!isRouteStarted ? (
                  <TouchableOpacity style={styles.startBtn} onPress={handleStartRoute}>
                    <Play size={16} color="#fff" fill="#fff" />
                    <Text style={styles.startBtnText}>START ROUTE</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity 
                      style={styles.viewDetailsBtn} 
                      onPress={() => {
                        navigation.navigate('My Route', {
                          screen: 'StopDetails',
                          params: { stopId: currentStop.id, stop: currentStop }
                        });
                      }}
                    >
                      <MapPin size={16} color="#fff" />
                      <Text style={styles.viewDetailsText}>VIEW STOP DETAILS</Text>
                    </TouchableOpacity>
                    
                    <View style={styles.navButtonsRow}>
                      <TouchableOpacity 
                        style={styles.navBtn} 
                        onPress={() => openNavigation(currentStop.location?.latitude || 0, currentStop.location?.longitude || 0, currentStop.location?.name)}
                      >
                        <NavIcon size={12} color="#2563eb" />
                        <Text style={styles.navBtnText}>Google Maps</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.navBtn} onPress={() => {}}>
                        <Text style={styles.navBtnText}>🚙 Navigate Waze</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            )}
            
            <View style={{ height: 40 }} />
          </>
        )}
      </ScrollView>

      <NotificationsModal visible={showNotifModal} onClose={() => setShowNotifModal(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { 
    backgroundColor: '#0B1536', 
    paddingTop: 60, 
    paddingBottom: 20, 
    paddingHorizontal: 20 
  },
  bellBtn: { position: 'relative', padding: 4 },
  bellDot: { position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },
  headerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  logoContainer: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  logoCircle: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', 
    justifyContent: 'center', alignItems: 'center', marginRight: 10
  },
  logoText: { color: '#e11d48', fontWeight: '900', fontSize: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerTitleRed: { color: '#60a5fa' },
  onlineBadge: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.15)', 
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)'
  },
  offlineBadge: {
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
    borderColor: 'rgba(100, 116, 139, 0.3)'
  },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981', marginRight: 6 },
  offlineDot: { backgroundColor: '#64748b' },
  onlineText: { color: '#10b981', fontWeight: 'bold', fontSize: 12 },
  offlineText: { color: '#94a3b8' },

  content: { padding: 16, flex: 1 },
  greetingBanner: {
    borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#4338ca', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8
  },
  greetingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatarCircle: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
    marginRight: 12
  },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 18 },
  greetingInfo: { flex: 1 },
  greetingTitle: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  greetingSubtitle: { fontSize: 11, color: '#e2e8f0', marginTop: 2 },
  dutyBadge: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.3)', 
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.4)'
  },
  dutyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#34d399', marginRight: 4 },
  dutyText: { color: '#a7f3d0', fontWeight: 'bold', fontSize: 10 },

  statsCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  statsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 8, marginBottom: 12 },
  statsTitle: { fontSize: 12, fontWeight: 'bold', color: '#1e293b' },
  dateBadge: { backgroundColor: '#f3e8ff', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 12, borderWidth: 1, borderColor: '#e9d5ff' },
  dateBadgeText: { color: '#7e22ce', fontSize: 10, fontWeight: 'bold' },
  routeBadge: { backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 12, borderWidth: 1, borderColor: '#dbeafe' },
  routeBadgeText: { color: '#1d4ed8', fontSize: 10, fontWeight: 'bold' },
  
  gridRow: { flexDirection: 'row', justifyContent: 'space-between' },
  gridBox: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1, marginHorizontal: 4 },
  gridNum: { fontSize: 18, fontWeight: '900', marginBottom: 2 },
  gridLabel: { fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },

  progressContainer: { marginTop: 12 },
  progressBarBg: { height: 10, backgroundColor: '#f1f5f9', borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#2563eb', borderRadius: 5 },
  progressText: { textAlign: 'right', fontSize: 10, color: '#94a3b8', fontWeight: 'bold', marginTop: 4 },

  nextStopLabel: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8', marginBottom: 12 },
  nextStopInfo: { flexDirection: 'row', backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 12 },
  pinIconBox: { width: 32, height: 32, backgroundColor: '#dbeafe', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  nextStopName: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  nextStopAddress: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  nextStopMeta: { flexDirection: 'row', marginTop: 8, gap: 16 },
  metaText: { fontSize: 10, color: '#64748b', fontWeight: 'bold', marginRight: 16 },

  startBtn: { backgroundColor: '#2563eb', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 5 },
  startBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 8 },
  viewDetailsBtn: { backgroundColor: '#059669', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, shadowColor: '#059669', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 5, marginBottom: 8 },
  viewDetailsText: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 8 },

  navButtonsRow: { flexDirection: 'row', gap: 8 },
  navBtn: { flex: 1, backgroundColor: '#f1f5f9', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 8, marginRight: 8 },
  navBtnText: { color: '#334155', fontSize: 10, fontWeight: 'bold', marginLeft: 4 },

  caughtUpCard: { backgroundColor: '#ecfdf5', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#d1fae5', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, marginBottom: 20 },
  iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#d1fae5', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: '#a7f3d0' },
  caughtUpTitle: { fontSize: 14, fontWeight: 'bold', color: '#064e3b', marginBottom: 8 },
  caughtUpSubtitle: { fontSize: 12, color: '#047857', textAlign: 'center' },
});
