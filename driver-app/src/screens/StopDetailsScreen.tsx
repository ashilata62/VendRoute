import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image, ActivityIndicator, Platform } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Camera, QrCode, Trash2, MapPin, ShieldCheck, FileText, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { stopsApi, routesApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useQueryClient } from '@tanstack/react-query';

export default function StopDetailsScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const stop = route.params?.stop;
  
  const [activeTab, setActiveTab] = useState<'service' | 'machine'>('service');
  const [isCheckedIn, setIsCheckedIn] = useState(stop.status === 'REACHED' || stop.status === 'COMPLETED');
  const [cashCollected, setCashCollected] = useState('');
  const [stopNotes, setStopNotes] = useState('');
  const [reportedIssue, setReportedIssue] = useState('None');
  const [isSigned, setIsSigned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [beforePhotos, setBeforePhotos] = useState<string[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<string[]>([]);
  
  const [newRefillProduct, setNewRefillProduct] = useState('');
  const [newRefillQty, setNewRefillQty] = useState('5');
  const [refillItems, setRefillItems] = useState<{ product: string; qty: number }[]>([]);

  if (!stop) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Error: Stop details not found.</Text>
      </View>
    );
  }

  const handleAddRefill = () => {
    if (!newRefillProduct) return;
    setRefillItems([...refillItems, { product: newRefillProduct, qty: parseInt(newRefillQty, 10) || 1 }]);
    setNewRefillProduct('');
  };

  const handleRemoveRefill = (index: number) => {
    setRefillItems(refillItems.filter((_, i) => i !== index));
  };

  const takeBeforePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera permission is required.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.2,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setBeforePhotos([...beforePhotos, `data:image/jpeg;base64,${result.assets[0].base64}`]);
    }
  };

  const takeAfterPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera permission is required.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.2,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setAfterPhotos([...afterPhotos, `data:image/jpeg;base64,${result.assets[0].base64}`]);
    }
  };

  const handleCheckIn = async () => {
    try {
      setLoading(true);
      const response = await routesApi.updateStopStatus(stop.id, "REACHED", stop.route?.name, stop.location?.name);
      if (response.data?.success) {
        setIsCheckedIn(true);
      } else {
        Alert.alert('Error', 'Failed to check in.');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to check in.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteService = async () => {
    if (!isCheckedIn) {
      Alert.alert('Check-In Required', 'Please check-in before completing the service.');
      return;
    }
    try {
      setLoading(true);
      const inventoryChanges = refillItems.map((p, idx) => ({
        productId: String(idx + 1), // Dummy ID
        product: p.product,
        quantityAdded: p.qty
      }));

      const realSignatureUrl = isSigned 
        ? `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100" viewBox="0 0 300 100"><path d="M 20 60 Q 50 10 90 50 T 160 40 T 220 70 T 280 30" stroke="%232563EB" stroke-width="4" fill="none" stroke-linecap="round"/><text x="30" y="85" font-family="cursive, sans-serif" font-size="20" font-style="italic" font-weight="bold" fill="%231E3A8A">${encodeURIComponent(user?.name || "Driver Signature")}</text></svg>`
        : null;

      const payload = {
        cashCollected: parseFloat(cashCollected) || 0,
        productsRefilled: JSON.stringify(inventoryChanges),
        notes: stopNotes + (reportedIssue !== 'None' ? ` [Issue: ${reportedIssue}]` : ''),
        signatureUrl: realSignatureUrl,
        photos: { before: beforePhotos, after: afterPhotos }
      };

      const response = await stopsApi.completeService(stop.id, payload);
      
      if (response.data?.success) {
        await queryClient.invalidateQueries({ queryKey: ['routes'] });
        await queryClient.invalidateQueries({ queryKey: ['stops'] });
        await queryClient.invalidateQueries({ queryKey: ['attendance'] });
        Alert.alert('Success', 'Stop completed successfully!');
        navigation.goBack();
      } else {
        Alert.alert('Error', response.data?.message || 'Failed to complete service.');
      }
    } catch (error: any) {
      console.log('API Error:', error.response?.data || error.message);
      const errMessage = error.response?.data?.message || error.message || 'Network error';
      Alert.alert('Error', typeof errMessage === 'string' ? errMessage : JSON.stringify(errMessage));
    } finally {
      setLoading(false);
    }
  };

  const handleSkipStop = async () => {
    Alert.alert(
      'Skip Stop',
      'Are you sure you want to SKIP this stop? A notification will be sent to the admin.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Skip Stop', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await routesApi.updateStopStatus(stop.id, "SKIPPED", stop.route?.name, stop.location?.name);
              if (response.data?.success) {
                Alert.alert('Stop Skipped', 'You have skipped this stop.');
                navigation.goBack();
              }
            } catch (err: any) {
              Alert.alert('Error', 'Failed to skip stop.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back to Route Sequence</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Machine Info Card */}
        <View style={styles.machineCard}>
          <View style={styles.machineHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.machineName}>{stop.location?.customer?.companyName || stop.location?.name}</Text>
              <Text style={styles.machineAddress}>{stop.location?.address}</Text>
            </View>
            <View style={styles.vehicleTag}>
              <Text style={styles.vehicleTagText}>{stop.route?.vehicle?.plateNumber || 'MH-01-AB-1234'}</Text>
            </View>
          </View>

          <View style={styles.checkInRow}>
            {!isCheckedIn ? (
              <View style={styles.checkInActionsRow}>
                <Text style={styles.notCheckedText}>Not Checked In</Text>
                 <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity style={styles.checkInBtn} onPress={handleCheckIn}>
                    <Text style={styles.checkInBtnText}>[ Check In ]</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.scanBtn} onPress={() => navigation.navigate('QRScanner', { setQrScanned: handleCheckIn })}>
                    <QrCode size={14} color="#2563eb" />
                    <Text style={styles.scanBtnText}>[ Scan QR ]</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.checkedInBadge}>
                <ShieldCheck size={16} color="#059669" style={{ marginRight: 6 }} />
                <Text style={styles.checkedInText}>Checked In</Text>
              </View>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsRow}>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'service' ? styles.tabBtnActive : styles.tabBtnInactive]}
            onPress={() => setActiveTab('service')}
          >
            <Text style={[styles.tabText, activeTab === 'service' ? styles.tabTextActive : styles.tabTextInactive]}>Servicing Form</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'machine' ? styles.tabBtnActive : styles.tabBtnInactive]}
            onPress={() => setActiveTab('machine')}
          >
            <Text style={[styles.tabText, activeTab === 'machine' ? styles.tabTextActive : styles.tabTextInactive]}>🥤 Machine Details</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'service' ? (
          <View style={styles.formSection}>
            <View style={styles.formCard}>
              <Text style={styles.cardTitle}>Previous Service Photos (Before Refill)</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {beforePhotos.map((uri, idx) => (
                  <View key={idx} style={styles.photoBox}>
                    <Image source={{ uri }} style={styles.photoImg} />
                    <TouchableOpacity style={styles.deletePhotoBtn} onPress={() => setBeforePhotos(beforePhotos.filter((_, i) => i !== idx))}>
                      <Text style={styles.deletePhotoText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {beforePhotos.length < 2 && (
                  <TouchableOpacity style={styles.uploadBtn} onPress={takeBeforePhoto}>
                    <Camera size={20} color="#94a3b8" />
                    <Text style={styles.uploadText}>[ Upload ]</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.cardTitle}>Service Visual Confirmation (After Refill)</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {afterPhotos.map((uri, idx) => (
                  <View key={idx} style={styles.photoBox}>
                    <Image source={{ uri }} style={styles.photoImg} />
                    <TouchableOpacity style={styles.deletePhotoBtn} onPress={() => setAfterPhotos(afterPhotos.filter((_, i) => i !== idx))}>
                      <Text style={styles.deletePhotoText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {afterPhotos.length < 3 && (
                  <TouchableOpacity style={styles.uploadBtn} onPress={takeAfterPhoto}>
                    <Camera size={20} color="#94a3b8" />
                    <Text style={styles.uploadText}>[ Upload ]</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Inventory */}
            <View style={styles.formCard}>
              <Text style={styles.cardTitle}>Inventory Refilled Checklist</Text>
              <View style={{ gap: 8, marginTop: 8 }}>
                {refillItems.map((item, idx) => (
                  <View key={idx} style={styles.refillListItem}>
                    <Text style={styles.refillItemName}>{item.product}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Text style={styles.refillItemQty}>Qty: {item.qty}</Text>
                      <TouchableOpacity onPress={() => handleRemoveRefill(idx)}>
                        <Trash2 size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.addRefillRow}>
                <TextInput 
                  style={[styles.input, { flex: 1 }]} 
                  placeholder="Product Name" 
                  value={newRefillProduct} 
                  onChangeText={setNewRefillProduct} 
                />
                <TextInput 
                  style={[styles.input, { width: 60 }]} 
                  placeholder="Qty" 
                  keyboardType="numeric" 
                  value={newRefillQty} 
                  onChangeText={setNewRefillQty} 
                />
                <TouchableOpacity style={styles.addBtn} onPress={handleAddRefill}>
                  <Text style={styles.addBtnText}>[ Add ]</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Financial & Notes */}
            <View style={styles.formCard}>
              <Text style={styles.cardTitle}>Cash Collected (₹)</Text>
              <TextInput 
                style={styles.inputLarge} 
                placeholder="e.g. 4500" 
                keyboardType="numeric" 
                value={cashCollected} 
                onChangeText={setCashCollected} 
              />
              
              <Text style={[styles.cardTitle, { marginTop: 12 }]}>Service Notes</Text>
              <TextInput 
                style={styles.textarea} 
                placeholder="Add machine notes, stock remarks, or cleaning updates..." 
                multiline 
                numberOfLines={3} 
                value={stopNotes} 
                onChangeText={setStopNotes} 
                textAlignVertical="top"
              />
            </View>

            {/* Issues & Signature */}
            <View style={styles.formCard}>
              <Text style={styles.cardTitle}>Operational Issues</Text>
              <View style={styles.issuesRow}>
                {['None', 'Coin Jam', 'Cooler Issue', 'Offline'].map((issue) => (
                  <TouchableOpacity 
                    key={issue} 
                    style={[styles.issuePill, reportedIssue === issue ? styles.issuePillActive : styles.issuePillInactive]}
                    onPress={() => setReportedIssue(issue)}
                  >
                    <Text style={[styles.issueText, reportedIssue === issue ? styles.issueTextActive : styles.issueTextInactive]}>
                      {issue}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.divider} />
              
              <Text style={styles.cardTitle}>Digital Signature Confirmation</Text>
              <TouchableOpacity 
                style={styles.signatureBox} 
                activeOpacity={0.8}
                onPress={() => setIsSigned(!isSigned)}
              >
                {isSigned ? (
                  <Text style={styles.signedText}>{user?.name || 'Driver Signature'} ✓</Text>
                ) : (
                  <Text style={styles.signPromptText}>[ Click to sign digitally ]</Text>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.completeBtn, !isCheckedIn && styles.completeBtnDisabled]} 
              disabled={!isCheckedIn || loading}
              onPress={handleCompleteService}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.completeBtnText}>[ Mark Stop Complete ]</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipBtn} onPress={handleSkipStop} disabled={loading}>
              <Text style={styles.skipBtnText}>[ Skip This Stop ]</Text>
            </TouchableOpacity>

          </View>
        ) : (
          <View style={styles.formSection}>
            <View style={styles.formCard}>
              <Text style={styles.cardSectionLabel}>Machine Profile Specs</Text>
              
              {(() => {
                const loc = stop.location;
                const machine = loc?.machine?.[0] || loc?.machines?.[0];
                const fillLevel = machine?.fillLevel ?? 100;

                const snacksPct = Math.round(fillLevel * 0.8);
                const beveragesPct = Math.round(fillLevel);
                const chocolatesPct = Math.round(fillLevel * 0.9);

                return (
                  <>
                    <View style={styles.specsGrid}>
                      <View style={styles.specBox}>
                        <Text style={styles.specLabel}>Machine Code</Text>
                        <Text style={styles.specValue}>{machine?.machineCode || machine?.id || 'N/A'}</Text>
                      </View>
                      <View style={styles.specBox}>
                        <Text style={styles.specLabel}>Model</Text>
                        <Text style={styles.specValue}>{machine?.model || 'N/A'}</Text>
                      </View>
                      <View style={styles.specBox}>
                        <Text style={styles.specLabel}>Last Refill</Text>
                        <Text style={styles.specValue}>{machine?.lastRefill ? new Date(machine.lastRefill).toLocaleDateString("en-IN") : 'N/A'}</Text>
                      </View>
                      <View style={styles.specBox}>
                        <Text style={styles.specLabel}>Frequency</Text>
                        <Text style={styles.specValue}>Weekly</Text>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.cardSectionLabel}>Refill Stock Levels</Text>
                    <View style={{ gap: 12, marginTop: 8 }}>
                      {[
                        { name: 'Snacks / Chips', pct: snacksPct, color: '#ef4444' },
                        { name: 'Beverages / Sodas', pct: beveragesPct, color: '#10b981' },
                        { name: 'Chocolates / Candies', pct: chocolatesPct, color: '#f59e0b' }
                      ].map((s) => (
                        <View key={s.name}>
                          <View style={styles.stockLabelRow}>
                            <Text style={styles.stockLabel}>{s.name}</Text>
                            <Text style={styles.stockPct}>{s.pct}%</Text>
                          </View>
                          <View style={styles.stockBg}>
                            <View style={[styles.stockFill, { backgroundColor: s.color, width: `${s.pct}%` }]} />
                          </View>
                        </View>
                      ))}
                    </View>
                  </>
                );
              })()}

              <View style={styles.divider} />

              <View style={{ marginTop: 8 }}>
                <Text style={[styles.cardTitle, { color: '#0f172a' }]}>📍 Live Navigation Coordinates</Text>
                <Text style={styles.monoText}>LAT: {stop.location?.latitude?.toFixed(6) || '—'} · LNG: {stop.location?.longitude?.toFixed(6) || '—'}</Text>
                <Text style={styles.metaDescText}>ETA: {stop?.route?.estimatedTime ? Math.round(stop.route.estimatedTime / Math.max(stop.route.routestop?.length || 1, 1)) : 10} mins · Distance: {stop?.route?.totalDistance ? (stop.route.totalDistance / Math.max(stop.route.routestop?.length || 1, 1)).toFixed(1) : "0"} km to Next stop</Text>
              </View>
            </View>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { 
    backgroundColor: '#0B1536', 
    paddingTop: 60, 
    paddingBottom: 16, 
    paddingHorizontal: 20 
  },
  backBtnText: { color: '#ef4444', fontSize: 14, fontWeight: 'bold' },
  
  content: { flex: 1, padding: 16 },

  machineCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, marginBottom: 16 },
  machineHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  machineName: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  machineAddress: { fontSize: 12, color: '#64748b', marginTop: 4 },
  vehicleTag: { backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#dbeafe' },
  vehicleTagText: { color: '#2563eb', fontSize: 10, fontWeight: 'bold' },

  checkInRow: { marginTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16 },
  checkInActionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notCheckedText: { color: '#64748b', fontSize: 12, fontWeight: 'bold' },
  checkInBtn: { backgroundColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  checkInBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  scanBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  scanBtnText: { color: '#334155', fontSize: 11, fontWeight: 'bold', marginLeft: 4 },
  
  checkedInBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#ecfdf5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#a7f3d0' },
  checkedInText: { color: '#047857', fontSize: 12, fontWeight: 'bold' },

  tabsRow: { flexDirection: 'row', gap: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 12, marginBottom: 16 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#e2e8f0' },
  tabBtnInactive: { backgroundColor: 'transparent' },
  tabText: { fontSize: 12, fontWeight: 'bold' },
  tabTextActive: { color: '#1e293b' },
  tabTextInactive: { color: '#64748b' },

  formSection: { gap: 16 },
  formCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 12, fontWeight: 'bold', color: '#334155', marginBottom: 6 },
  viewLinkText: { color: '#2563eb', fontSize: 10, fontWeight: 'bold' },

  photoBox: { width: 60, height: 60, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0', position: 'relative' },
  photoBoxDashed: { borderStyle: 'dashed', backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  plusCount: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold' },
  photoImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  deletePhotoBtn: { position: 'absolute', top: 2, right: 2, backgroundColor: '#ef4444', width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  deletePhotoText: { color: '#fff', fontSize: 8, fontWeight: 'bold' },
  uploadBtn: { width: 60, height: 60, borderRadius: 12, borderStyle: 'dashed', borderWidth: 2, borderColor: '#cbd5e1', backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  uploadText: { color: '#94a3b8', fontSize: 9, fontWeight: 'bold', marginTop: 4 },

  refillListItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#f1f5f9' },
  refillItemName: { fontSize: 12, fontWeight: '600', color: '#334155' },
  refillItemQty: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  addRefillRow: { flexDirection: 'row', gap: 8, marginTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, color: '#334155' },
  addBtn: { backgroundColor: '#2563eb', paddingHorizontal: 12, borderRadius: 8, justifyContent: 'center' },
  addBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  inputLarge: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: '#334155' },
  textarea: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 12, color: '#334155', minHeight: 80 },

  issuesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  issuePill: { flex: 1, minWidth: '45%', paddingVertical: 8, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  issuePillActive: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  issuePillInactive: { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' },
  issueText: { fontSize: 11, fontWeight: 'bold' },
  issueTextActive: { color: '#b91c1c' },
  issueTextInactive: { color: '#64748b' },

  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 16 },

  signatureBox: { height: 80, backgroundColor: '#f8fafc', borderStyle: 'dashed', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  signPromptText: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold' },
  signedText: { color: '#dc2626', fontSize: 18, fontWeight: '900', fontStyle: 'italic', letterSpacing: 2 },

  completeBtn: { backgroundColor: '#059669', paddingVertical: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#059669', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 5 },
  completeBtnDisabled: { backgroundColor: '#cbd5e1', shadowOpacity: 0 },
  completeBtnText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  skipBtn: { backgroundColor: '#fef2f2', paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#fecaca', marginTop: 12 },
  skipBtnText: { color: '#dc2626', fontSize: 12, fontWeight: 'bold' },

  cardSectionLabel: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 },
  specsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  specBox: { width: '48%', backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#f1f5f9' },
  specLabel: { fontSize: 10, color: '#94a3b8', marginBottom: 2 },
  specValue: { fontSize: 12, fontWeight: 'bold', color: '#1e293b' },

  stockLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  stockLabel: { fontSize: 12, color: '#64748b' },
  stockPct: { fontSize: 12, fontWeight: 'bold', color: '#334155' },
  stockBg: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
  stockFill: { height: '100%', borderRadius: 3 },

  monoText: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 10, color: '#64748b', marginTop: 4 },
  metaDescText: { fontSize: 10, color: '#94a3b8', marginTop: 2 }
});
