import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Image } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { stopsApi } from '../services/api';
import { History, CheckCircle2, Calendar } from 'lucide-react-native';

export default function HistoryScreen() {
  const { user, isOnline, toggleOnline } = useAuthStore();
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    try {
      if (!user?.id) return;
      const res = await stopsApi.getDriverRoutes(user.id);
      if (res.data.success) {
        const completedRoutes = res.data.data.filter((r: any) => r.status === 'COMPLETED');
        setRoutes(completedRoutes);
      }
    } catch (error) {
      console.log('Error fetching history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user?.id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHistory();
  }, [user?.id]);

  const renderRoute = ({ item }: { item: any }) => {
    return (
      <View style={styles.historyCard}>
        <View style={styles.cardLeft}>
          <View style={styles.iconCircle}>
            <CheckCircle2 size={24} color="#10b981" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.routeName}>{item.name}</Text>
            <View style={styles.dateRow}>
              <Calendar size={12} color="#64748b" />
              <Text style={styles.dateText}>{item.date} • {item.endTime ? new Date(item.endTime).toLocaleTimeString('en-IN', {hour: '2-digit', minute:'2-digit'}) : item.createdAt ? new Date(item.createdAt).toLocaleTimeString('en-IN', {hour: '2-digit', minute:'2-digit'}) : '05:00 pm'}</Text>
            </View>
          </View>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>COMPLETED</Text>
        </View>
      </View>
    );
  };

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
        {/* Title Card */}
        <View style={styles.titleCard}>
          <View>
            <Text style={styles.titleText}>Route History</Text>
            <Text style={styles.subtitleText}>Your past completed routes</Text>
          </View>
          <View style={styles.historyIconBox}>
            <History size={20} color="#94a3b8" />
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#0f172a" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={routes} // For real UI, maybe filter to only COMPLETED
            keyExtractor={(item) => item.id}
            renderItem={renderRoute}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <Text style={{ textAlign: 'center', marginTop: 40, color: '#94a3b8' }}>No routes found in your history.</Text>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { 
    backgroundColor: '#0f172a', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  logoText: { color: '#e11d48', fontWeight: '900', fontSize: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerTitleRed: { color: '#ef4444' },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' },
  offlineBadge: { backgroundColor: 'rgba(100, 116, 139, 0.15)', borderColor: 'rgba(100, 116, 139, 0.3)' },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981', marginRight: 6 },
  offlineDot: { backgroundColor: '#64748b' },
  onlineText: { color: '#10b981', fontWeight: 'bold', fontSize: 12 },
  offlineText: { color: '#94a3b8' },

  content: { flex: 1, padding: 16 },
  titleCard: { 
    backgroundColor: '#fff', borderRadius: 16, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
  },
  titleText: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  subtitleText: { fontSize: 13, color: '#64748b', marginTop: 4 },
  historyIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },

  list: { paddingBottom: 40 },
  historyCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: '#dcfce7' },
  cardInfo: { flex: 1 },
  routeName: { fontSize: 15, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  dateText: { fontSize: 12, color: '#64748b', marginLeft: 6 },
  statusBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#bbf7d0' },
  statusText: { color: '#059669', fontSize: 10, fontWeight: 'bold' }
});
