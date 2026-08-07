import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Image, Linking, Platform } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Camera, CheckCircle, Package, DollarSign, X, ScanLine, Navigation } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { stopsApi } from '../services/api';

export default function StopDetailsScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const stop = route.params?.stop;
  
  const [cashCollected, setCashCollected] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const [products, setProducts] = useState<{ id: string; name: string; added: string }[]>(
    Array.isArray(stop?.location?.products) && stop.location.products.length > 0 
      ? stop.location.products.map((p: string, idx: number) => ({ id: String(idx + 1), name: p, added: '' }))
      : []
  );

  if (!stop) {
    return (
      <View style={styles.container}>
        <Text>Error: Stop details not found.</Text>
      </View>
    );
  }

  const handleProductChange = (index: number, val: string) => {
    const newProds = [...products];
    newProds[index].added = val;
    setProducts(newProds);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera permission is required to take photo proof.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.3, // compress heavily to save data
      base64: true,
    });

    if (!result.canceled) {
      // Create a data URI for the base64 string
      setPhotoUri(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleCompleteService = async () => {
    try {
      setLoading(true);
      
      const inventoryChanges = products.filter(p => p.added !== '').map(p => ({
        productId: p.id,
        quantityAdded: parseInt(p.added, 10) || 0
      }));

      const payload = {
        cashCollected: parseFloat(cashCollected) || 0,
        productsRefilled: inventoryChanges,
        notes,
        signatureUrl: photoUri // send photo URI (acting as signature/proof)
      };

      const response = await stopsApi.completeService(stop.id, payload);
      
      if (response.data.success) {
        Alert.alert('Success', 'Stop service completed successfully!');
        navigation.navigate('DashboardList');
      } else {
        Alert.alert('Error', response.data.message || 'Failed to complete service.');
      }
    } catch (error: any) {
      console.log(error);
      Alert.alert('Error', error.response?.data?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const openNavigation = () => {
    if (!stop.location?.latitude || !stop.location?.longitude) {
      Alert.alert('Error', 'Location coordinates missing.');
      return;
    }
    const lat = stop.location.latitude;
    const lng = stop.location.longitude;
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${lat},${lng}`;
    const label = stop.location.name;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });

    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Could not open maps application.');
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>{stop.location?.name || 'Stop Details'}</Text>
          <Text style={styles.headerSubtitle}>{stop.location?.address}</Text>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity style={[styles.qrBtn, { marginRight: 8 }]} onPress={openNavigation}>
            <Navigation size={24} color="#0f172a" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.qrBtn} onPress={() => navigation.navigate('QRScanner')}>
            <ScanLine size={24} color="#0f172a" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Camera Verification Placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photo Verification</Text>
          
          {!photoUri ? (
            <TouchableOpacity style={styles.cameraBtn} onPress={takePhoto}>
              <Camera size={24} color="#0f172a" />
              <Text style={styles.cameraBtnText}>Take Machine Photo</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.photoContainer}>
              <Image source={{ uri: photoUri }} style={styles.previewImage} />
              <TouchableOpacity style={styles.removePhotoBtn} onPress={() => setPhotoUri(null)}>
                <X size={20} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.photoSuccessText}>Photo attached successfully!</Text>
            </View>
          )}
        </View>

        {/* Refill Form */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Package size={20} color="#0f172a" />
            <Text style={styles.sectionTitle}>Inventory Refill</Text>
          </View>
          
          {products.map((item, index) => (
            <View key={item.id} style={styles.productRow}>
              <Text style={styles.productName}>{item.name}</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Qty added"
                keyboardType="numeric"
                value={item.added}
                onChangeText={(val) => handleProductChange(index, val)}
              />
            </View>
          ))}
        </View>

        {/* Cash Collection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <DollarSign size={20} color="#0f172a" />
            <Text style={styles.sectionTitle}>Cash Collection</Text>
          </View>
          <TextInput 
            style={styles.fullInput} 
            placeholder="Enter amount collected (₹)"
            keyboardType="numeric"
            value={cashCollected}
            onChangeText={setCashCollected}
          />
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Notes</Text>
          <TextInput 
            style={[styles.fullInput, { height: 80 }]} 
            placeholder="Any issues or remarks?"
            multiline
            value={notes}
            onChangeText={setNotes}
          />
        </View>

      </ScrollView>

      {/* Footer Action */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.submitBtn, loading && { opacity: 0.7 }]} 
          onPress={handleCompleteService}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <CheckCircle size={20} color="#fff" />
              <Text style={styles.submitText}>Complete Service</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 20, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  headerSubtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  qrBtn: { padding: 10, backgroundColor: '#f1f5f9', borderRadius: 8 },
  content: { flex: 1, padding: 16 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#334155', marginLeft: 8 },
  cameraBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', borderStyle: 'dashed', marginTop: 12 },
  cameraBtnText: { marginLeft: 12, fontSize: 16, fontWeight: '600', color: '#0f172a' },
  photoContainer: { marginTop: 12, alignItems: 'center', position: 'relative' },
  previewImage: { width: '100%', height: 200, borderRadius: 8 },
  removePhotoBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 20 },
  photoSuccessText: { color: '#16a34a', fontWeight: 'bold', marginTop: 8 },
  productRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  productName: { fontSize: 16, color: '#1e293b', flex: 1 },
  input: { width: 100, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 6, padding: 8, textAlign: 'center' },
  fullInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 6, padding: 12, fontSize: 16 },
  footer: { backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  submitBtn: { backgroundColor: '#16a34a', padding: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 8 }
});
