import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AuroraBackground from '@/shared/components/AuroraBackground';
import TopBar from '@/shared/components/TopBar';
import GlassPanel from '@/shared/components/GlassPanel';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

export default function CreatePostScreen() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [selectedUri, setSelectedUri] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedUri(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
    if (!content.trim() && !selectedUri) return;
    setPosting(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return;

      let mediaIds: string[] = [];
      if (selectedUri) {
        const formData = new FormData();
        formData.append('file', {
          uri: selectedUri,
          type: 'image/jpeg',
          name: 'photo.jpg',
        } as any);
        const uploadRes = await fetch(`${API_URL}/media/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok) mediaIds = [uploadData.url];
      }

      const res = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content, mediaIds }),
      });

      if (res.ok) {
        router.back();
      } else {
        Alert.alert('Error', 'Failed to create post');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to create post');
    } finally {
      setPosting(false);
    }
  };

  return (
    <View style={styles.container}>
      <AuroraBackground />
      <TopBar title="New Post" showBack />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <GlassPanel borderRadius={12} style={styles.composer}>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="What's on your mind?"
            placeholderTextColor="#45474b80"
            multiline
            style={styles.input}
            autoFocus
          />

          {selectedUri && (
            <View style={styles.imagePreview}>
              <Image source={{ uri: selectedUri }} style={styles.previewImage} resizeMode="cover" />
              <TouchableOpacity style={styles.removeImage} onPress={() => setSelectedUri(null)}>
                <Text style={styles.removeText}>X</Text>
              </TouchableOpacity>
            </View>
          )}
        </GlassPanel>

        <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
          <Text style={styles.photoBtnText}>Add Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.postBtn, (!content.trim() && !selectedUri) && styles.postBtnDisabled]}
          onPress={handlePost}
          disabled={posting || (!content.trim() && !selectedUri)}
        >
          {posting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.postBtnText}>Post</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcf9f8' },
  scroll: { flex: 1 },
  content: { paddingTop: 110, paddingHorizontal: 16, paddingBottom: 40 },
  composer: { padding: 16, marginBottom: 16 },
  input: { fontSize: 16, color: '#1c1b1b', minHeight: 120, textAlignVertical: 'top' },
  imagePreview: { marginTop: 12, position: 'relative' },
  previewImage: { width: '100%', height: 200, borderRadius: 12 },
  removeImage: {
    position: 'absolute', top: 8, right: 8,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  removeText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  photoBtn: {
    backgroundColor: '#e9fdff', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16,
  },
  photoBtnText: { color: '#2d666d', fontWeight: '700', fontSize: 15 },
  postBtn: {
    backgroundColor: '#2d666d', borderRadius: 12, padding: 16, alignItems: 'center',
  },
  postBtnDisabled: { opacity: 0.5 },
  postBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
