import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import AuroraBackground from '@/shared/components/AuroraBackground';
import TopBar from '@/shared/components/TopBar';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

interface LocalImage {
  uri: string;
  uploading: boolean;
  url?: string;
}

export default function PostJobScreen() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [unitPay, setUnitPay] = useState('');
  const [totalUnits, setTotalUnits] = useState('');
  const [link, setLink] = useState('');
  const [images, setImages] = useState<LocalImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [fundsBalance, setFundsBalance] = useState(0);
  const [platformFeePercent, setPlatformFeePercent] = useState(5);

  const unitPayNum = parseFloat(unitPay) || 0;
  const totalUnitsNum = parseInt(totalUnits) || 0;
  const baseAmount = unitPayNum * totalUnitsNum;
  const feeAmount = baseAmount * (platformFeePercent / 100);
  const totalCost = baseAmount + feeAmount;

  useEffect(() => {
    AsyncStorage.getItem('accessToken').then((t) => {
      setToken(t);
      if (t) {
        fetchWallet(t);
        fetchSettings();
      }
    });
  }, []);

  const fetchWallet = async (t: string) => {
    try {
      const res = await fetch(`${API_URL}/wallet`, { headers: { Authorization: `Bearer ${t}` } });
      if (res.ok) {
        const data = await res.json();
        setFundsBalance(data.data?.wallet?.fundsBalance || 0);
      }
    } catch (err) {
      console.error('Failed to fetch wallet', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/marketplace/settings`);
      if (res.ok) {
        const data = await res.json();
        setPlatformFeePercent(Number(data.platformFeePercent) || 5);
      }
    } catch (err) {
      console.error('Failed to fetch settings', err);
    }
  };

  const pickImages = async () => {
    const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permResult.granted) {
      Alert.alert('Permission needed', 'Please grant photo library access to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 5 - images.length,
    });

    if (result.canceled || !result.assets.length) return;

    const newImages: LocalImage[] = result.assets.map(asset => ({
      uri: asset.uri,
      uploading: true,
    }));

    setImages(prev => [...prev, ...newImages]);

    for (let i = 0; i < newImages.length; i++) {
      const asset = result.assets[i];
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || `job_${Date.now()}_${i}.jpg`,
      } as any);

      try {
        const res = await fetch(`${API_URL}/media/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.url) {
          setImages(prev => prev.map((img, idx) => {
            const globalIdx = prev.length - (newImages.length - i);
            if (idx === globalIdx) return { ...img, uploading: false, url: data.url };
            return img;
          }));
        } else {
          setImages(prev => prev.map((img, idx) => {
            const globalIdx = prev.length - (newImages.length - i);
            if (idx === globalIdx) return { ...img, uploading: false };
            return img;
          }));
        }
      } catch {
        setImages(prev => prev.map((img, idx) => {
          const globalIdx = prev.length - (newImages.length - i);
          if (idx === globalIdx) return { ...img, uploading: false };
          return img;
        }));
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (!token) return;
    if (!title.trim()) return Alert.alert('Error', 'Title is required');
    if (!description.trim()) return Alert.alert('Error', 'Description is required');
    if (!unitPay || unitPayNum <= 0) return Alert.alert('Error', 'Valid per unit price is required');
    if (!totalUnits || totalUnitsNum <= 0) return Alert.alert('Error', 'Valid unit count is required');

    if (images.some(img => img.uploading)) {
      return Alert.alert('Error', 'Please wait for all images to finish uploading');
    }

    if (totalCost > fundsBalance) {
      return Alert.alert('Error', `Insufficient funds. Required: ৳${totalCost.toFixed(2)}`);
    }

    setLoading(true);
    try {
      const mediaUrls = images.filter(img => img.url).map(img => img.url!);
      const res = await fetch(`${API_URL}/marketplace/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          unitPay: unitPayNum,
          totalUnits: totalUnitsNum,
          mediaUrls,
          link: link.trim() || undefined,
        }),
      });

      if (res.ok) {
        Alert.alert('Success', 'Job posted successfully! Waiting for admin approval.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        const err = await res.json();
        Alert.alert('Error', err.message || 'Failed to post job');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AuroraBackground />
      <TopBar title="Post a Job" showBack showSearch={false} showNotification={false} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Funds</Text>
          <Text style={styles.balanceAmount}>৳{fundsBalance.toFixed(2)}</Text>
        </View>

        {/* Image Upload Zone */}
        <Text style={styles.label}>Job Images (max 5)</Text>
        <View style={styles.imageGrid}>
          {images.map((img, index) => (
            <View key={index} style={styles.imageThumb}>
              <Image source={{ uri: img.uri }} style={styles.imageThumbImg} />
              {img.uploading && (
                <View style={styles.imageUploading}>
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              )}
              <TouchableOpacity style={styles.imageRemoveBtn} onPress={() => removeImage(index)}>
                <Text style={styles.imageRemoveText}>x</Text>
              </TouchableOpacity>
              {img.url && (
                <View style={styles.imageDoneBadge}>
                  <Text style={styles.imageDoneText}>done</Text>
                </View>
              )}
            </View>
          ))}
          {images.length < 5 && (
            <TouchableOpacity style={styles.imageAddBtn} onPress={pickImages}>
              <Text style={styles.imageAddIcon}>+</Text>
              <Text style={styles.imageAddText}>Add</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.label}>Job Title</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Design a logo for my brand"
          placeholderTextColor="#76777b"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe the job requirements..."
          placeholderTextColor="#76777b"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Link (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="https://example.com"
          placeholderTextColor="#76777b"
          value={link}
          onChangeText={setLink}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        <Text style={styles.label}>Per Unit Price (৳)</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          placeholderTextColor="#76777b"
          value={unitPay}
          onChangeText={setUnitPay}
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Unit Count</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 50"
          placeholderTextColor="#76777b"
          value={totalUnits}
          onChangeText={setTotalUnits}
          keyboardType="number-pad"
        />

        {unitPayNum > 0 && totalUnitsNum > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Cost Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Per Unit:</Text>
              <Text style={styles.summaryValue}>৳{unitPayNum.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Units:</Text>
              <Text style={styles.summaryValue}>{totalUnitsNum}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal:</Text>
              <Text style={styles.summaryValue}>৳{baseAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Platform Fee ({platformFeePercent}%):</Text>
              <Text style={[styles.summaryValue, { color: '#76777b' }]}>৳{feeAmount.toFixed(2)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text style={styles.summaryTotalLabel}>Total:</Text>
              <Text style={styles.summaryTotalValue}>৳{totalCost.toFixed(2)}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.disabledBtn]}
          onPress={handlePost}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitBtnText}>Post Job</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8ff' },
  content: { padding: 16, paddingTop: 110, paddingBottom: 40 },
  balanceCard: {
    backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 16, padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center',
  },
  balanceLabel: { fontSize: 13, color: '#76777b', marginBottom: 4 },
  balanceAmount: { fontSize: 24, fontWeight: '700', color: '#1c1b1b' },
  label: { fontSize: 14, fontWeight: '600', color: '#1c1b1b', marginBottom: 8, marginTop: 12 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 12, paddingHorizontal: 16,
    paddingVertical: 14, fontSize: 15, color: '#1c1b1b', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  textArea: { height: 100, textAlignVertical: 'top' },

  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  imageThumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  imageThumbImg: {
    width: '100%',
    height: '100%',
  },
  imageUploading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageRemoveBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(186,26,26,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageRemoveText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  imageDoneBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(45,102,109,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageDoneText: { color: '#fff', fontSize: 8, fontWeight: '700' },
  imageAddBtn: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageAddIcon: { fontSize: 22, color: '#5d5e64', fontWeight: '300' },
  imageAddText: { fontSize: 10, color: '#5d5e64', fontWeight: '600', marginTop: 2 },

  summaryCard: {
    backgroundColor: 'rgba(233,253,255,0.4)', borderRadius: 12, padding: 16, marginTop: 16,
    borderWidth: 1, borderColor: 'rgba(233,253,255,0.3)',
  },
  summaryTitle: { fontSize: 14, fontWeight: '600', color: '#2d666d', marginBottom: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  summaryLabel: { fontSize: 13, color: '#45474b' },
  summaryValue: { fontSize: 13, fontWeight: '600', color: '#1c1b1b' },
  summaryTotal: { borderTopWidth: 1, borderTopColor: 'rgba(45,102,109,0.2)', paddingTop: 8, marginTop: 4 },
  summaryTotalLabel: { fontSize: 14, fontWeight: '700', color: '#1c1b1b' },
  summaryTotalValue: { fontSize: 14, fontWeight: '700', color: '#2d666d' },

  submitBtn: {
    backgroundColor: '#2d666d', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 24,
  },
  disabledBtn: { opacity: 0.6 },
  submitBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});
