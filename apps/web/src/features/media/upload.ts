import api from '@dreamy-life/api-client';

export interface UploadResult {
  url: string;
  publicId: string;
  format: string;
  size: number;
}

export const uploadMedia = async (file: File): Promise<UploadResult> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
};

export const uploadMultipleMedia = async (files: File[]): Promise<UploadResult[]> => {
  const results: UploadResult[] = [];
  for (const file of files) {
    const result = await uploadMedia(file);
    results.push(result);
  }
  return results;
};
