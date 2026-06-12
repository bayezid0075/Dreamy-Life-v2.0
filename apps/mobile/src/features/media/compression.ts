import * as ImageManipulator from 'expo-image-manipulator';

export const compressImage = async (
  uri: string,
  maxWidth = 1920,
  quality = 0.8
): Promise<string> => {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: maxWidth } }],
    { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
  );

  return result.uri;
};
