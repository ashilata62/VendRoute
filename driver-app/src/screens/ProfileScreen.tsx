import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput, Alert } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { authApi, stopsApi } from '../services/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LogOut, Clock } from 'lucide-react-native';

const formatTime = (dateInput: string | Date): string => {
  const utcMilliseconds = new Date(dateInput).getTime();
  // IST offset is +5.5 hours (+19800000 milliseconds)
  const istDate = new Date(utcMilliseconds + 19800000);
  
  let hours = istDate.getUTCHours();
  const minutes = istDate.getUTCMinutes();
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${minutesStr} ${ampm}`;
};

export default function ProfileScreen() {
  const { user, logout, isOnline, toggleOnline, updateUser } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  const queryClient = useQueryClient();
  const [punching, setPunching] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  
  const [editPhone, setEditPhone] = React.useState(user?.phone || '');
  const [editEmergency, setEditEmergency] = React.useState(user?.emergencyContact || '');
  const [editAddress, setEditAddress] = React.useState(user?.address || '');

  React.useEffect(() => {
    setEditPhone(user?.phone || '');
    setEditEmergency(user?.emergencyContact || '');
    setEditAddress(user?.address || '');
  }, [user]);

  // Load routes to find active vehicle plate
  const { data: routesResponse } = useQuery({
    queryKey: ['routes', user?.id],
    queryFn: () => stopsApi.getDriverRoutes(user?.id!),
    enabled: !!user?.id,
  });

  const assignedVehicle = React.useMemo(() => {
    if ((user as any)?.vehicle && (user as any).vehicle.length > 0) {
      return (user as any).vehicle[0].plateNumber || (user as any).vehicle[0].model;
    }
    if (routesResponse?.data?.data) {
      const activeRoute = routesResponse.data.data.find((r: any) => r.vehicle);
      if (activeRoute?.vehicle?.plateNumber) {
        return activeRoute.vehicle.plateNumber;
      }
    }
    return 'Unassigned';
  }, [routesResponse, user]);

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
      Alert.alert('Success', 'Punched in successfully!');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to punch in');
    } finally {
      setPunching(false);
    }
  };

  const handlePunchOut = async () => {
    setPunching(true);
    try {
      await authApi.punchOut();
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      Alert.alert('Success', 'Punched out successfully!');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to punch out');
    } finally {
      setPunching(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setPunching(true);
    try {
      const res = await authApi.updateProfile(user.id, {
        phone: editPhone,
        emergencyContact: editEmergency,
        address: editAddress
      });
      if (res.data?.success) {
        updateUser({
          phone: editPhone,
          emergencyContact: editEmergency,
          address: editAddress
        });
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        Alert.alert('Error', 'Failed to update profile.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update profile.');
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

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Role & Vehicle Cards */}
        <View style={styles.topCardsRow}>
          <View style={styles.miniCard}>
            <Text style={styles.miniCardLabel}>ACCOUNT ROLE</Text>
            <Text style={styles.miniCardValueGreen}>{user?.role || 'driver'}</Text>
          </View>
          <View style={styles.miniCard}>
            <Text style={styles.miniCardLabel}>ASSIGNED VEHICLE</Text>
            <Text style={styles.miniCardValueDark} numberOfLines={1}>{assignedVehicle}</Text>
          </View>
        </View>

        {/* Contact & Account Details */}
        <View style={styles.sectionCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>CONTACT & ACCOUNT DETAILS</Text>
            {!isEditing ? (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#2563eb' }}>[ Edit ]</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={handleSave} disabled={punching}>
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#10b981' }}>[ Save ]</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsEditing(false)} disabled={punching}>
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#ef4444' }}>[ Cancel ]</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email Address</Text>
            <Text style={styles.detailValue}>{user?.email || 'N/A'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phone Number</Text>
            {isEditing ? (
              <TextInput
                style={styles.detailInput}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Phone Number"
                placeholderTextColor="#94a3b8"
              />
            ) : (
              <Text style={styles.detailValue}>{user?.phone || 'Not Provided'}</Text>
            )}
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Emergency Contact</Text>
            {isEditing ? (
              <TextInput
                style={styles.detailInput}
                value={editEmergency}
                onChangeText={setEditEmergency}
                placeholder="Emergency Contact"
                placeholderTextColor="#94a3b8"
              />
            ) : (
              <Text style={user?.emergencyContact ? styles.detailValue : styles.detailValueRed}>
                {user?.emergencyContact || 'Not Provided'}
              </Text>
            )}
          </View>
          
          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.detailLabel}>Residential Address</Text>
            {isEditing ? (
              <TextInput
                style={styles.detailInput}
                value={editAddress}
                onChangeText={setEditAddress}
                placeholder="Residential Address"
                placeholderTextColor="#94a3b8"
              />
            ) : (
              <Text style={styles.detailValueDark}>{user?.address || 'Not Provided'}</Text>
            )}
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
              const punchInTime = formatTime(log.punchIn);
              const punchOutTime = log.punchOut ? formatTime(log.punchOut) : null;
              
              const dateStr = new Date(log.punchIn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
              const isToday = new Date(log.punchIn).toDateString() === new Date().toDateString();
              const isYesterday = new Date(log.punchIn).toDateString() === new Date(Date.now() - 86400000).toDateString();
              
              const displayDate = isToday ? `Today (${dateStr})` : isYesterday ? `Yesterday (${dateStr})` : dateStr;
              
              return (
                <View key={log.id} style={[styles.attendanceRow, index === attendanceLogs.slice(0, 5).length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.attendanceDate}>{displayDate}</Text>
                    <Text style={styles.attendanceTime}>
                      In: {punchInTime} {punchOutTime ? `| Out: ${punchOutTime}` : ''}
                    </Text>
                  </View>
                  <View style={[styles.noDutyBadge, { backgroundColor: punchOutTime ? '#f1f5f9' : '#ecfdf5', borderColor: punchOutTime ? '#e2e8f0' : '#10b981' }]}>
                    <Text style={[styles.noDutyText, { color: punchOutTime ? '#64748b' : '#10b981' }]} numberOfLines={1}>
                      {punchOutTime ? 'Duty Ended' : 'On Duty'}
                    </Text>
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
  
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  detailLabel: { fontSize: 13, color: '#64748b' },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  detailValueRed: { fontSize: 13, fontWeight: 'bold', color: '#ef4444' },
  detailValueDark: { fontSize: 13, fontWeight: 'bold', color: '#334155' },
  detailInput: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f8fafc',
    minWidth: 165,
    textAlign: 'right',
  },

  attendanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  attendanceDate: { fontSize: 13, fontWeight: 'bold', color: '#334155' },
  attendanceTime: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  noDutyBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', minWidth: 95, alignItems: 'center' },
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
