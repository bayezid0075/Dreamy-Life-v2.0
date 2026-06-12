import { Alert } from 'react-native';

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AppError) return error.message;
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
};

export const showErrorAlert = (error: unknown, title = 'Error'): void => {
  const message = getErrorMessage(error);
  Alert.alert(title, message);
};

export const handleApiError = (error: unknown): never => {
  if (error && typeof error === 'object' && 'response' in error) {
    const apiError = error as { response: { data?: { message?: string }; status?: number } };
    const message = apiError.response?.data?.message || 'API request failed';
    throw new AppError(message, 'API_ERROR', apiError.response?.status);
  }
  throw new AppError(getErrorMessage(error));
};
