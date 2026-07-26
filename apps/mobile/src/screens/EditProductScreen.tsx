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
import { useAuthStore } from '@/shared/stores/authStore';
import { authFetch } from '@/shared/api';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
  existing?: boolean;
}

export default function EditProductScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated, accessToken } = useAuthStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [actualPrice, setActualPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [stock, setStock] = useState('');
  const [deliveryChargeInside, setDeliveryChargeInside] = useState('');
  const [deliveryChargeOutside, setDeliveryChargeOutside] = useState('');
  const [colors, setColors] = useState('');
  const [sizes, setSizes] = useState('');
  const [images, setImages] = useState<LocalImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !id) return;
    (async () => {
      if (!accessToken) { router.replace('/login'); return; }
      loadProduct(accessToken);
    })();
  }, [id, isAuthenticated]);

  const loadProduct = async (token: string) => {
    try {
      const res = await authFetch(`${API_URL}/vendor/products/detail/${id}`);
      if (res.ok) {
        const data = await res.json();
        const p = data.data;
        setName(p.name || '');
        setDescription(p.description || '');
        setCategory(p.category || '');
        setSubcategory(p.subcategory || '');
        setActualPrice(String(p.actualPrice || ''));
        setDiscountPrice(String(p.discountPrice || ''));
        setStock(String(p.stock || ''));
        setDeliveryChargeInside(String(p.deliveryChargeInside || ''));
        setDeliveryChargeOutside(String(p.deliveryChargeOutside || ''));
        setColors(Array.isArray(p.colors) ? p.colors.join(', ') : '');
        setSizes(Array.isArray(p.sizes) ? p.sizes.join(', ') : '');
        const existingImages: LocalImage[] = (p.imageUrls || []).map((url: string) => ({
          uri: url,
          uploading: false,
          url,
          existing: true,
        }));
        setImages(existingImages);
      }
    } catch { /* error */ }
    finally { setLoading(false); }
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
        name: asset.fileName || `product_${Date.now()}_${i}.jpg`,
      } as any);

      try {
        const res = await fetch(`${API_URL}/media/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
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
    if (!name.trim() || !category || !actualPrice || !stock) {
      setError('Please fill all required fields');
      return;
    }
    const uploading = images.some(img => img.uploading);
    if (uploading) {
      setError('Please wait for all images to finish uploading');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const uploadedUrls = images.filter(img => img.url).map(img => img.url!);
      const body: any = {
        name: name.trim(),
        category,
        actualPrice: parseFloat(actualPrice),
        stock: parseInt(stock),
      };
      if (discountPrice.trim()) body.discountPrice = parseFloat(discountPrice);
      if (subcategory.trim()) body.subcategory = subcategory.trim();
      if (description.trim()) body.description = description.trim();
      if (deliveryChargeInside.trim()) body.deliveryChargeInside = parseFloat(deliveryChargeInside);
      if (deliveryChargeOutside.trim()) body.deliveryChargeOutside = parseFloat(deliveryChargeOutside);
      if (colors.trim()) body.colors = colors.split(',').map((c: string) => c.trim()).filter(Boolean);
      if (sizes.trim()) body.sizes = sizes.split(',').map((s: string) => s.trim()).filter(Boolean);
      if (uploadedUrls.length > 0) body.imageUrls = uploadedUrls;
      const res = await authFetch(`${API_URL}/vendor/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.message || 'Failed to update product');
        return;
      }
      Alert.alert('Success', 'Product updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      setError('Connection failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <AuroraBackground />
        <ActivityIndicator size="large" color="#5d5e64" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AuroraBackground />
      <TopBar showBack title="Edit Product" showNotification={false} showSearch={false} />

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
                  {(img.url || img.existing) && !img.uploading && (
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

          {/* Actual Price & Discount Price */}
          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Actual Price *</Text>
              <View style={styles.inputRow}>
                <Text style={styles.inputPrefix}>৳</Text>
                <TextInput
                  style={[styles.input, { paddingLeft: 28 }]}
                  value={actualPrice}
                  onChangeText={setActualPrice}
                  placeholder="0.00"
                  placeholderTextColor="rgba(69,71,75,0.4)"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Discount Price</Text>
              <View style={styles.inputRow}>
                <Text style={styles.inputPrefix}>৳</Text>
                <TextInput
                  style={[styles.input, { paddingLeft: 28 }]}
                  value={discountPrice}
                  onChangeText={setDiscountPrice}
                  placeholder="0.00"
                  placeholderTextColor="rgba(69,71,75,0.4)"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>

          {/* Stock & Subcategory */}
          <View style={styles.row}>
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
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Subcategory</Text>
              <TextInput
                style={styles.input}
                value={subcategory}
                onChangeText={setSubcategory}
                placeholder="e.g. ceramic, wooden"
                placeholderTextColor="rgba(69,71,75,0.4)"
              />
            </View>
          </View>

          {/* Delivery Charges */}
          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Delivery (Inside)</Text>
              <View style={styles.inputRow}>
                <Text style={styles.inputPrefix}>৳</Text>
                <TextInput
                  style={[styles.input, { paddingLeft: 28 }]}
                  value={deliveryChargeInside}
                  onChangeText={setDeliveryChargeInside}
                  placeholder="0"
                  placeholderTextColor="rgba(69,71,75,0.4)"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Delivery (Outside)</Text>
              <View style={styles.inputRow}>
                <Text style={styles.inputPrefix}>৳</Text>
                <TextInput
                  style={[styles.input, { paddingLeft: 28 }]}
                  value={deliveryChargeOutside}
                  onChangeText={setDeliveryChargeOutside}
                  placeholder="0"
                  placeholderTextColor="rgba(69,71,75,0.4)"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>

          {/* Colors & Sizes */}
          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Colors (comma sep.)</Text>
              <TextInput
                style={styles.input}
                value={colors}
                onChangeText={setColors}
                placeholder="red, blue, green"
                placeholderTextColor="rgba(69,71,75,0.4)"
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Sizes (comma sep.)</Text>
              <TextInput
                style={styles.input}
                value={sizes}
                onChangeText={setSizes}
                placeholder="S, M, L, XL"
                placeholderTextColor="rgba(69,71,75,0.4)"
              />
            </View>
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
              style={[styles.submitBtn, saving && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Update Product</Text>
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f8ff' },
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
