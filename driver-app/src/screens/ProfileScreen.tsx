import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../services/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LogOut, Clock } from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, logout, isOnline, toggleOnline } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  const queryClient = useQueryClient();
  const [punching, setPunching] = React.useState(false);

  const { data: historyRes, isLoading: historyLoading } = useQuery({
    queryKey: ['attendance', user?.id],
    queryFn: () => authApi.getHistory(),
    enabled: !!user?.id,
  });

  const attendanceLogs = historyRes?.data?.data || [];

  const handlePunchIn = async () => {
    setPunching(true);
    try {
      await authApi.punchIn();
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      alert('Punched in successfully!');
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to punch in');
    } finally {
      setPunching(false);
    }
  };

  const handlePunchOut = async () => {
    setPunching(true);
    try {
      await authApi.punchOut();
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      alert('Punched out successfully!');
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to punch out');
    } finally {
      setPunching(false);
    }
  };

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

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Role & Vehicle Cards */}
        <View style={styles.topCardsRow}>
          <View style={styles.miniCard}>
            <Text style={styles.miniCardLabel}>ACCOUNT ROLE</Text>
            <Text style={styles.miniCardValueGreen}>{user?.role || 'driver'}</Text>
          </View>
          <View style={styles.miniCard}>
            <Text style={styles.miniCardLabel}>ASSIGNED VEHICLE</Text>
            <Text style={styles.miniCardValueDark}>Unassigned</Text>
          </View>
        </View>

        {/* Contact & Account Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>CONTACT & ACCOUNT DETAILS</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email Address</Text>
            <Text style={styles.detailValue}>{user?.email || 'driver@vendroute.in'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phone Number</Text>
            <Text style={styles.detailValue}>+919876500003</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Emergency Contact</Text>
            <Text style={styles.detailValueRed}>Not Provided</Text>
          </View>
          
          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.detailLabel}>Residential Address</Text>
            <Text style={styles.detailValueDark}>Not Provided</Text>
          </View>
        </View>

        {/* Attendance Logs */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>ATTENDANCE LOGS (REAL BACKEND CHECK-INS)</Text>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
            <TouchableOpacity style={[styles.punchBtn, { backgroundColor: '#10b981' }]} onPress={handlePunchIn} disabled={punching}>
              <Clock size={16} color="#fff" />
              <Text style={styles.punchText}>Punch In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.punchBtn, { backgroundColor: '#ef4444' }]} onPress={handlePunchOut} disabled={punching}>
              <Clock size={16} color="#fff" />
              <Text style={styles.punchText}>Punch Out</Text>
            </TouchableOpacity>
          </View>
          
          {historyLoading ? (
            <Text style={{ textAlign: 'center', marginVertical: 20, color: '#64748b' }}>Loading logs...</Text>
          ) : attendanceLogs.length === 0 ? (
            <Text style={{ textAlign: 'center', marginVertical: 20, color: '#64748b' }}>No attendance history found</Text>
          ) : (
            attendanceLogs.slice(0, 5).map((log: any, index: number) => {
              const punchInTime = new Date(log.punchIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
              const punchOutTime = log.punchOut ? new Date(log.punchOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : null;
              
              const dateStr = new Date(log.punchIn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
              const isToday = new Date(log.punchIn).toDateString() === new Date().toDateString();
              const isYesterday = new Date(log.punchIn).toDateString() === new Date(Date.now() - 86400000).toDateString();
              
              const displayDate = isToday ? `Today (${dateStr})` : isYesterday ? `Yesterday (${dateStr})` : dateStr;
              
              return (
                <View key={log.id} style={[styles.attendanceRow, index === attendanceLogs.slice(0, 5).length - 1 && { borderBottomWidth: 0 }]}>
                  <Text style={styles.attendanceDate}>{displayDate}</Text>
                  <View style={styles.attendanceRight}>
                    <Text style={styles.attendanceTime}>
                      In: {punchInTime} {punchOutTime ? `| Out: ${punchOutTime}` : ''}
                    </Text>
                    <View style={[styles.noDutyBadge, { backgroundColor: punchOutTime ? '#f1f5f9' : '#ecfdf5', borderColor: punchOutTime ? '#e2e8f0' : '#10b981' }]}>
                      <Text style={[styles.noDutyText, { color: punchOutTime ? '#64748b' : '#10b981' }]}>{punchOutTime ? 'Duty Ended' : 'On Duty'}</Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={20} color="#fff" />
          <Text style={styles.logoutText}>Log Out App</Text>
        </TouchableOpacity>
      </ScrollView>
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

  content: { padding: 16 },
  
  topCardsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  miniCard: { 
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center',
    marginHorizontal: 4, borderWidth: 1, borderColor: '#e2e8f0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1
  },
  miniCardLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', marginBottom: 6 },
  miniCardValueGreen: { fontSize: 14, fontWeight: 'bold', color: '#10b981' },
  miniCardValueDark: { fontSize: 14, fontWeight: 'bold', color: '#334155' },

  sectionCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20,
    borderWidth: 1, borderColor: '#e2e8f0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
  },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8', marginBottom: 16 },
  
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  detailLabel: { fontSize: 13, color: '#64748b' },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  detailValueRed: { fontSize: 13, fontWeight: 'bold', color: '#ef4444' },
  detailValueDark: { fontSize: 13, fontWeight: 'bold', color: '#334155' },

  attendanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  attendanceDate: { fontSize: 13, fontWeight: 'bold', color: '#334155' },
  attendanceRight: { flexDirection: 'row', alignItems: 'center' },
  attendanceTime: { fontSize: 12, color: '#94a3b8', marginRight: 12 },
  noDutyBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  noDutyText: { fontSize: 11, fontWeight: '600', color: '#64748b' },

  punchBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, marginHorizontal: 4 },
  punchText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },

  logoutBtn: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    backgroundColor: '#dc2626', padding: 16, borderRadius: 12, marginTop: 10,
    shadowColor: '#dc2626', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4
  },
  logoutText: { marginLeft: 10, fontSize: 16, fontWeight: 'bold', color: '#fff' }
});
