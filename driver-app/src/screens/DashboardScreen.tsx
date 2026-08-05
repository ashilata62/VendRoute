import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle, Route } from 'lucide-react-native';
import { stopsApi } from '../services/api';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { user, isOnline, toggleOnline } = useAuthStore();
  const navigation = useNavigation();
  const [stops, setStops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStops = async () => {
      try {
        setLoading(true);
        const response = await stopsApi.getDriverStops();
        if (response.data.success) {
          setStops(response.data.data);
        }
      } catch (error) {
        console.log('Fetch stops error in Dashboard', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStops();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchStops();
    });
    return unsubscribe;
  }, [navigation]);

  const pendingStops = useMemo(() => stops.filter(s => s.status !== 'COMPLETED'), [stops]);

  return (
    <View style={styles.container}>
      {/* Dark Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>MV</Text>
            </View>
            <Text style={styles.headerTitle}>Maryland <Text style={styles.headerTitleRed}>Driver</Text></Text>
          </View>
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

      <View style={styles.content}>
        {/* Hello Banner */}
        <LinearGradient 
          colors={['#e11d48', '#4338ca']} 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 1 }} 
          style={styles.greetingBanner}
        >
          <View style={styles.greetingRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{user?.name?.substring(0, 2).toUpperCase() || 'AS'}</Text>
            </View>
            <View style={styles.greetingInfo}>
              <Text style={styles.greetingTitle}>Hello, {user?.name || 'Arjun Sharma'}! 👋</Text>
              <Text style={styles.greetingSubtitle}>Vehicle: <Text style={{fontWeight: 'bold'}}>Unassigned</Text></Text>
            </View>
            <View style={styles.dutyBadge}>
              <View style={styles.dutyDot} />
              <Text style={styles.dutyText}>Duty Active</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Dynamic Card based on Backend Data */}
        {loading ? (
           <ActivityIndicator size="large" color="#4338ca" style={{ marginTop: 40 }} />
        ) : pendingStops.length === 0 ? (
          <View style={styles.caughtUpCard}>
            <View style={styles.iconCircle}>
              <CheckCircle size={24} color="#059669" />
            </View>
            <Text style={styles.caughtUpTitle}>All Caught Up!</Text>
            <Text style={styles.caughtUpSubtitle}>You have no pending routes assigned for today.</Text>
          </View>
        ) : (
          <View style={[styles.caughtUpCard, { backgroundColor: '#eff6ff', borderColor: '#dbeafe' }]}>
            <View style={[styles.iconCircle, { backgroundColor: '#dbeafe' }]}>
              <Route size={24} color="#2563eb" />
            </View>
            <Text style={[styles.caughtUpTitle, { color: '#1e3a8a' }]}>You have active routes!</Text>
            <Text style={[styles.caughtUpSubtitle, { color: '#1d4ed8' }]}>
              You have {pendingStops.length} pending stops for today. Go to the 'My Route' tab to start!
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { 
    backgroundColor: '#0f172a', 
    paddingTop: 60, 
    paddingBottom: 20, 
    paddingHorizontal: 20 
  },
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
  headerTitleRed: { color: '#ef4444' },
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

  content: { padding: 20 },
  greetingBanner: {
    borderRadius: 16, padding: 20, marginBottom: 20,
    shadowColor: '#4338ca', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8
  },
  greetingRow: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: {
    width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center', alignItems: 'center', marginRight: 12
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  greetingInfo: { flex: 1 },
  greetingTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 2 },
  greetingSubtitle: { color: '#e2e8f0', fontSize: 12 },
  dutyBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)'
  },
  dutyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#34d399', marginRight: 6 },
  dutyText: { color: '#fff', fontWeight: '600', fontSize: 11 },

  caughtUpCard: {
    backgroundColor: '#f0fdf4', borderRadius: 16, padding: 30, alignItems: 'center',
    borderWidth: 1, borderColor: '#dcfce7', marginTop: 10
  },
  iconCircle: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#d1fae5',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16
  },
  caughtUpTitle: { fontSize: 20, fontWeight: 'bold', color: '#064e3b', marginBottom: 8 },
  caughtUpSubtitle: { fontSize: 14, color: '#047857', textAlign: 'center' }
});
