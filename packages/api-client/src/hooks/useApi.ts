import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
  QueryClient,
} from '@tanstack/react-query';
import api from '../index';

export function useApiQuery<T>(
  key: string[],
  url: string,
  options?: UseQueryOptions<T>
) {
  return useQuery<T>({
    queryKey: key,
    queryFn: async () => {
      const response = await api.get(url);
      return response.data;
    },
    ...options,
  });
}

export function useApiMutation<TData, TVariables = void>(
  url: string,
  method: 'post' | 'put' | 'patch' | 'delete' = 'post',
  options?: UseMutationOptions<TData, Error, TVariables>
) {
  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables) => {
      const response =
        method === 'delete'
          ? await api.delete(url)
          : method === 'put'
          ? await api.put(url, variables)
          : method === 'patch'
          ? await api.patch(url, variables)
          : await api.post(url, variables);
      return response.data;
    },
    ...options,
  });
}
