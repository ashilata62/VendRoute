import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Linking, Platform } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { stopsApi } from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { Navigation as NavIcon, Play } from 'lucide-react-native';

export default function RouteScreen() {
  const { user, isRouteStarted, startRoute: setGlobalRouteStarted } = useAuthStore();
  const navigation = useNavigation<any>();
  
  const { data: routesResponse, isLoading: loading, refetch } = useQuery({
    queryKey: ['routes', user?.id],
    queryFn: () => stopsApi.getDriverRoutes(user?.id!),
    enabled: !!user?.id,
    refetchInterval: 30000
  });

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  useEffect(() => {
    if (routesResponse?.data?.data) {
      const hasInProgressRoute = routesResponse.data.data.some((r: any) => r.status === 'IN_PROGRESS');
      if (hasInProgressRoute && !isRouteStarted) {
        setGlobalRouteStarted();
      }
    }
  }, [routesResponse, isRouteStarted, setGlobalRouteStarted]);

  const stopsList = useMemo(() => {
    if (!routesResponse?.data?.data) return [];
    return routesResponse.data.data.flatMap((r: any) => r.routestop || []);
  }, [routesResponse]);

  const completedCount = useMemo(() => stopsList.filter((s: any) => s.status === 'COMPLETED').length, [stopsList]);

  const startRoute = () => {
    setGlobalRouteStarted();
    Alert.alert('Route Started!', 'Live tracking is now active.');
  };

  const handleStopPress = (stop: any) => {
    if (isRouteStarted) {
      navigation.navigate('StopDetails', { stopId: stop.id, stop });
    } else {
      Alert.alert('Route Not Started', 'Please start the route from the Home dashboard first.');
    }
  };

  const openNavAll = () => {
    Alert.alert('Navigate All', 'Launching external navigation mapping...');
  };

  if (loading && stopsList.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Route</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        <View style={styles.topRow}>
          <Text style={styles.sectionTitle}>Assigned Route Stop Sequence</Text>
          <TouchableOpacity style={styles.navAllBtn} onPress={openNavAll}>
            <NavIcon size={14} color="#2563eb" />
            <Text style={styles.navAllText}>Navigate All</Text>
          </TouchableOpacity>
        </View>

        {!isRouteStarted && stopsList.length > 0 && (
          <TouchableOpacity style={styles.startBtn} onPress={startRoute}>
            <Play size={16} color="#fff" fill="#fff" />
            <Text style={styles.startBtnText}>START ROUTE</Text>
          </TouchableOpacity>
        )}

        <View style={styles.timelineContainer}>
          <View style={styles.timelineLine} />
          
          {stopsList.map((stop: any, index: number) => {
            const isCompleted = stop.status === 'COMPLETED';
            const isActive = stop.status === 'REACHED' || (stop.status === 'PENDING' && index === completedCount);
            const isPending = !isCompleted && !isActive;

            return (
              <TouchableOpacity
                key={stop.id}
                onPress={() => handleStopPress(stop)}
                activeOpacity={0.8}
                style={[
                  styles.stopCard,
                  isCompleted ? styles.cardCompleted : isActive ? styles.cardActive : styles.cardPending
                ]}
              >
                {/* Timeline Bullet */}
                <View style={[
                  styles.bullet,
                  isCompleted ? styles.bulletCompleted : isActive ? styles.bulletActive : styles.bulletPending
                ]}>
                  <Text style={[
                    styles.bulletText,
                    (isCompleted || isActive) ? styles.bulletTextWhite : styles.bulletTextGray
                  ]}>
                    {isCompleted ? '✓' : (index + 1)}
                  </Text>
                </View>

                <View style={styles.cardHeader}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={[
                      styles.stopName,
                      isCompleted && styles.stopNameCompleted
                    ]} numberOfLines={1}>
                      {stop.location?.customer?.companyName || stop.location?.name || 'Unknown Location'}
                    </Text>
                    <Text style={styles.stopAddress} numberOfLines={2}>
                      {stop.location?.address || 'No address provided'}
                    </Text>
                  </View>
                  
                  <View style={[
                    styles.badge,
                    isCompleted ? styles.badgeCompleted : isActive ? styles.badgeActive : styles.badgePending
                  ]}>
                    <Text style={[
                      styles.badgeText,
                      isCompleted ? styles.badgeTextCompleted : isActive ? styles.badgeTextActive : styles.badgeTextPending
                    ]}>
                      {isCompleted ? 'Done' : isActive ? 'Current' : 'Pending'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {stopsList.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No stops assigned for today.</Text>
            </View>
          )}

        </View>

      </ScrollView>
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
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  
  content: { flex: 1, padding: 16 },
  
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  navAllBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', borderColor: '#dbeafe', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  navAllText: { color: '#2563eb', fontSize: 10, fontWeight: 'bold', marginLeft: 6 },

  startBtn: { backgroundColor: '#2563eb', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 5, marginBottom: 24 },
  startBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 8 },

  timelineContainer: { paddingLeft: 16, position: 'relative' },
  timelineLine: { position: 'absolute', left: 24, top: 20, bottom: 20, width: 2, backgroundColor: '#e2e8f0' },

  stopCard: { marginLeft: 24, padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16, position: 'relative' },
  cardCompleted: { backgroundColor: 'rgba(236, 253, 245, 0.5)', borderColor: '#a7f3d0' },
  cardActive: { backgroundColor: 'rgba(239, 246, 255, 0.7)', borderColor: '#bfdbfe', shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2 },
  cardPending: { backgroundColor: '#fff', borderColor: '#e2e8f0' },

  bullet: { position: 'absolute', left: -36, top: 24, width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  bulletCompleted: { backgroundColor: '#10b981', borderColor: '#10b981' },
  bulletActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  bulletPending: { backgroundColor: '#fff', borderColor: '#cbd5e1' },
  
  bulletText: { fontSize: 10, fontWeight: 'bold' },
  bulletTextWhite: { color: '#fff' },
  bulletTextGray: { color: '#94a3b8' },

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  stopName: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  stopNameCompleted: { textDecorationLine: 'line-through', color: '#94a3b8' },
  stopAddress: { fontSize: 10, color: '#94a3b8', marginTop: 4, lineHeight: 14 },

  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  badgeCompleted: { backgroundColor: '#ecfdf5', borderColor: '#d1fae5' },
  badgeActive: { backgroundColor: '#dbeafe', borderColor: '#bfdbfe' },
  badgePending: { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' },

  badgeText: { fontSize: 9, fontWeight: 'bold' },
  badgeTextCompleted: { color: '#047857' },
  badgeTextActive: { color: '#1e40af' },
  badgeTextPending: { color: '#64748b' },

  emptyState: { padding: 32, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 12, fontWeight: '500' }
});
