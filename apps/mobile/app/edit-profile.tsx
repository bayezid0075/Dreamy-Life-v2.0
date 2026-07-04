import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AuroraBackground from '@/shared/components/AuroraBackground';
import TopBar from '@/shared/components/TopBar';
import { useI18n } from '@/shared/i18n';
import { resolveMediaUrl } from '@/shared/utils/resolveMediaUrl';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

export default function EditProfileScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('female');
  const [address, setAddress] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) { router.replace('/login'); return; }
      try {
        const res = await fetch(`${API_URL}/auth/profile`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.status === 401) { await AsyncStorage.removeItem('accessToken'); router.replace('/login'); return; }
        if (res.ok) {
          const data = await res.json();
          const u = data.data.user;
          setUser(u);
          const info = u.info || {};
          const nameParts = (info.fullName || '').split(' ');
          setFirstName(nameParts[0] || '');
          setLastName(nameParts.slice(1).join(' ') || '');
          setDateOfBirth(info.dateOfBirth ? info.dateOfBirth.split('T')[0] : '');
          setGender(info.gender || 'female');
          setAddress(info.address || '');
          setFatherName(info.fatherName || '');
          setMotherName(info.motherName || '');
        }
      } catch (err) { console.error('Failed to load profile', err); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleAvatarUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    const token = await AsyncStorage.getItem('accessToken');
    if (!token) return;

    const formData = new FormData();
    const uri = result.assets[0].uri;
    const filename = uri.split('/').pop() || 'avatar.jpg';
    const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

    formData.append('file', {
      uri,
      name: filename,
      type: mimeType,
    } as any);

    try {
      const uploadRes = await fetch(`${API_URL}/media/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        const avatarUrl = uploadData.url;
        await fetch(`${API_URL}/auth/profile`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatarUrl }),
        });
        setUser((prev: any) => ({ ...prev, info: { ...prev.info, avatarUrl } }));
        Alert.alert(t('success'), t('profileSaved'));
      }
    } catch (err) {
      console.error('Avatar upload failed', err);
      Alert.alert(t('error'), t('profileSaveError'));
    }
  };

  const handleSave = async () => {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) return;
    setSaving(true);
    try {
      const fullName = [firstName, lastName].filter(Boolean).join(' ');
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          dateOfBirth: dateOfBirth || undefined,
          gender,
          address,
          fatherName,
          motherName,
        }),
      });
      if (res.ok) {
        Alert.alert(t('success'), t('profileSaved'));
        router.back();
      } else {
        Alert.alert(t('error'), t('profileSaveError'));
      }
    } catch (err) {
      Alert.alert(t('error'), t('profileSaveError'));
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <AuroraBackground />
        <ActivityIndicator size="large" color="#5d5e64" />
      </View>
    );
  }

  const avatarUrl = user?.info?.avatarUrl;

  const completeness = (() => {
    let filled = 0;
    let total = 8;
    if (avatarUrl) filled++;
    if (firstName) filled++;
    if (lastName) filled++;
    if (dateOfBirth) filled++;
    if (address) filled++;
    if (fatherName) filled++;
    if (motherName) filled++;
    if (user?.info?.email) filled++;
    return Math.round((filled / total) * 100);
  })();

  return (
    <View style={styles.container}>
      <AuroraBackground />
      <TopBar showMenu={false} showBack />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Avatar */}
        <TouchableOpacity style={styles.avatarSection} onPress={handleAvatarUpload}>
          <View style={styles.avatarWrap}>
            {avatarUrl ? (
              <Image source={{ uri: resolveMediaUrl(avatarUrl) }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarFallbackText}>{user?.username?.[0]?.toUpperCase() || '👤'}</Text>
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Text style={styles.cameraIcon}>📷</Text>
            </View>
          </View>
          <Text style={styles.uploadText}>{t('editProfile')}</Text>
        </TouchableOpacity>

        {/* Profile Completeness */}
        <View style={styles.completenessCard}>
          <View style={styles.completenessHeader}>
            <Text style={styles.completenessLabel}>Profile Completeness</Text>
            <Text style={[styles.completenessPercent, completeness === 100 && { color: '#2d666d' }]}>{completeness}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${completeness}%` }, completeness === 100 && { backgroundColor: '#2d666d' }]} />
          </View>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('basicInfo')}</Text>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>{t('firstName')}</Text>
              <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>{t('lastName')}</Text>
              <TextInput style={styles.input} value={lastName} onChangeText={setLastName} />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('dateOfBirth')}</Text>
            <TextInput style={styles.input} value={dateOfBirth} onChangeText={setDateOfBirth} placeholder="YYYY-MM-DD" placeholderTextColor="#999" />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('gender')}</Text>
            <View style={styles.genderRow}>
              {[
                { value: 'female', label: t('female') },
                { value: 'male', label: t('male') },
                { value: 'non-binary', label: t('nonBinary') },
              ].map((g) => (
                <TouchableOpacity
                  key={g.value}
                  style={[styles.genderBtn, gender === g.value && styles.genderBtnActive]}
                  onPress={() => setGender(g.value)}
                >
                  <Text style={[styles.genderBtnText, gender === g.value && styles.genderBtnTextActive]}>{g.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('address')}</Text>
            <TextInput style={[styles.input, styles.textArea]} value={address} onChangeText={setAddress} multiline numberOfLines={3} />
          </View>
        </View>

        {/* Parent Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('parentInfo')}</Text>

          <View style={styles.field}>
            <Text style={styles.label}>{t('fatherName')}</Text>
            <TextInput style={styles.input} value={fatherName} onChangeText={setFatherName} placeholder={t('fatherNamePlaceholder')} placeholderTextColor="#999" />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('motherName')}</Text>
            <TextInput style={styles.input} value={motherName} onChangeText={setMotherName} placeholder={t('motherNamePlaceholder')} placeholderTextColor="#999" />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
            <Text style={styles.cancelBtnText}>{t('cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveBtnText}>{saving ? t('loading') : t('save')}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8ff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f8ff' },
  scroll: { flex: 1 },
  content: { paddingTop: 110, paddingHorizontal: 24, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginBottom: 32 },
  avatarWrap: { width: 120, height: 120, marginBottom: 12, position: 'relative' },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: 'white' },
  avatarFallback: { backgroundColor: '#e5e2e1', alignItems: 'center', justifyContent: 'center' },
  avatarFallbackText: { fontSize: 48 },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#2d666d', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'white' },
  cameraIcon: { fontSize: 16 },
  uploadText: { fontSize: 14, fontWeight: '600', color: '#2d666d' },
  completenessCard: { backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  completenessHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  completenessLabel: { fontSize: 14, fontWeight: '600', color: '#45474b' },
  completenessPercent: { fontSize: 14, fontWeight: '700', color: '#5d5e64' },
  progressBar: { height: 8, backgroundColor: '#e5e2e1', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#5d5e64', borderRadius: 4 },
  section: { backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1c1b1b', marginBottom: 16 },
  row: { flexDirection: 'row', gap: 12 },
  field: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: '#45474b', letterSpacing: 0.5, marginBottom: 6, marginLeft: 4 },
  input: { backgroundColor: 'rgba(240,240,245,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', borderRadius: 9999, paddingHorizontal: 20, paddingVertical: 14, fontSize: 14, color: '#1c1b1b' },
  textArea: { borderRadius: 20, textAlignVertical: 'top' },
  genderRow: { flexDirection: 'row', gap: 8 },
  genderBtn: { flex: 1, paddingVertical: 12, borderRadius: 9999, backgroundColor: 'rgba(240,240,245,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', alignItems: 'center' },
  genderBtnActive: { backgroundColor: '#5d5e64', borderColor: '#5d5e64' },
  genderBtnText: { fontSize: 12, fontWeight: '600', color: '#45474b' },
  genderBtnTextActive: { color: 'white' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  cancelBtn: { paddingVertical: 14, paddingHorizontal: 32, borderRadius: 9999, borderWidth: 1, borderColor: 'rgba(118,119,123,0.3)' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#1c1b1b' },
  saveBtn: { paddingVertical: 14, paddingHorizontal: 32, borderRadius: 9999, backgroundColor: '#1A1A1A' },
  saveBtnText: { fontSize: 14, fontWeight: '600', color: 'white' },
});
