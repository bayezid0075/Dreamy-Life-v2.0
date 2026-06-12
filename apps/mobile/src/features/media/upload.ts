import * as ImagePicker from 'expo-image-picker';
import api from '@dreamy-life/api-client';

export interface UploadResult {
  url: string;
  publicId: string;
  format: string;
  size: number;
}

export const pickAndUploadImage = async (): Promise<UploadResult | null> => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
  });

  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  const formData = new FormData();
  formData.append('file', {
    uri: asset.uri,
    type: asset.type || 'image/jpeg',
    name: asset.fileName || 'photo.jpg',
  } as any);

  const response = await api.post('/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
};
