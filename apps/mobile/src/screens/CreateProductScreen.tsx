import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import TopBar from '@/shared/components/TopBar';
import AuroraBackground from '@/shared/components/AuroraBackground';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

const CATEGORIES = [
  { value: 'home_decor', label: 'Home Decor' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'textiles', label: 'Textiles' },
];

interface LocalImage {
  uri: string;
  uploading: boolean;
  url?: string;
}

export default function CreateProductScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [sku, setSku] = useState('');
  const [images, setImages] = useState<LocalImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) router.replace('/login');
    })();
  }, []);

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
        name: asset.fileName || `product_${Date.now()}_${i}.jpg`,
      } as any);

      try {
        const token = await AsyncStorage.getItem('accessToken');
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

  const handleSubmit = async () => {
    if (!name.trim() || !category || !price || !stock) {
      setError('Please fill all required fields');
      return;
    }
    const uploading = images.some(img => img.uploading);
    if (uploading) {
      setError('Please wait for all images to finish uploading');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const uploadedUrls = images.filter(img => img.url).map(img => img.url!);
      const body: any = {
        name: name.trim(),
        category,
        price: parseFloat(price),
        stock: parseInt(stock),
      };
      if (description.trim()) body.description = description.trim();
      if (sku.trim()) body.sku = sku.trim();
      if (uploadedUrls.length > 0) body.imageUrls = uploadedUrls;
      const res = await fetch(`${API_URL}/vendor/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || 'Failed to create product');
        return;
      }
      Alert.alert('Success', 'Product created successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AuroraBackground />
      <TopBar showBack title="Add Product" showNotification={false} showSearch={false} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Image Upload Zone */}
          <View style={styles.field}>
            <Text style={styles.label}>Product Images (max 5)</Text>
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
                    <Text style={styles.imageRemoveText}>✕</Text>
                  </TouchableOpacity>
                  {img.url && (
                    <View style={styles.imageDoneBadge}>
                      <Text style={styles.imageDoneText}>✓</Text>
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
          </View>

          {/* Product Name */}
          <View style={styles.field}>
            <Text style={styles.label}>Product Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Minimalist Ceramic Vase"
              placeholderTextColor="rgba(69,71,75,0.4)"
            />
          </View>

          {/* Category */}
          <View style={styles.field}>
            <Text style={styles.label}>Category *</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.value}
                  style={[styles.categoryChip, category === cat.value && styles.categoryChipActive]}
                  onPress={() => setCategory(cat.value)}
                >
                  <Text style={[styles.categoryChipText, category === cat.value && styles.categoryChipTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Price & Stock */}
          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Price *</Text>
              <View style={styles.inputRow}>
                <Text style={styles.inputPrefix}>৳</Text>
                <TextInput
                  style={[styles.input, { paddingLeft: 28 }]}
                  value={price}
                  onChangeText={setPrice}
                  placeholder="0.00"
                  placeholderTextColor="rgba(69,71,75,0.4)"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Stock *</Text>
              <TextInput
                style={styles.input}
                value={stock}
                onChangeText={setStock}
                placeholder="Available units"
                placeholderTextColor="rgba(69,71,75,0.4)"
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* SKU */}
          <View style={styles.field}>
            <Text style={styles.label}>SKU (optional)</Text>
            <TextInput
              style={styles.input}
              value={sku}
              onChangeText={setSku}
              placeholder="Auto-generated if empty"
              placeholderTextColor="rgba(69,71,75,0.4)"
            />
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the product details, materials, and care..."
              placeholderTextColor="rgba(69,71,75,0.4)"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Save Product</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8ff' },
  scroll: { flex: 1 },
  content: { paddingTop: 100, paddingHorizontal: 20, paddingBottom: 40 },

  field: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5d5e64',
    marginBottom: 8,
    paddingLeft: 4,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1c1b1b',
  },
  inputRow: { position: 'relative' },
  inputPrefix: {
    position: 'absolute',
    left: 16,
    top: 14,
    fontSize: 15,
    fontWeight: '600',
    color: '#45474b',
    zIndex: 1,
  },
  textArea: {
    borderRadius: 16,
    paddingTop: 14,
    minHeight: 100,
  },

  row: { flexDirection: 'row', gap: 12 },

  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  imageThumb: {
    width: 90,
    height: 90,
    borderRadius: 14,
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
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(186,26,26,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageRemoveText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  imageDoneBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(45,102,109,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageDoneText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  imageAddBtn: {
    width: 90,
    height: 90,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageAddIcon: { fontSize: 24, color: '#5d5e64', fontWeight: '300' },
  imageAddText: { fontSize: 11, color: '#5d5e64', fontWeight: '600', marginTop: 2 },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  categoryChipActive: {
    backgroundColor: '#2d666d',
    borderColor: '#2d666d',
  },
  categoryChipText: { fontSize: 13, fontWeight: '600', color: '#5d5e64' },
  categoryChipTextActive: { color: '#fff' },

  errorBox: {
    backgroundColor: 'rgba(255,218,214,0.5)',
    borderWidth: 1,
    borderColor: '#ffdad6',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  errorText: { fontSize: 13, color: '#93000a' },

  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#1c1b1b' },
  submitBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 999,
    backgroundColor: '#1c1b1b',
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
