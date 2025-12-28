import { useCallback } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useSupabase } from '@kit/supabase/hooks/use-supabase';

export function usePersonalAccountData(
  userId: string,
  partialAccount?: {
    id: string | null;
    name: string | null;
    picture_url: string | null;
  },
) {
  const client = useSupabase();
  const queryKey = ['account:data', userId];

  const queryFn = async () => {
    if (!userId) {
      return null;
    }

    try {
      const response = await client
        .from('accounts')
        .select(
          `
        id,
        name,
        picture_url
    `,
        )
        .eq('id', userId)
        .single();

      if (response.error) {
        // If table doesn't exist (404) or other non-critical errors, return null instead of throwing
        if (response.error.code === 'PGRST116' || response.status === 404) {
          console.warn('[usePersonalAccountData] Accounts table not found or user account not found:', response.error.message);
          return null;
        }
        // For other errors, still throw to maintain error visibility
        throw response.error;
      }

      return response.data;
    } catch (error) {
      // Handle network errors or other unexpected errors gracefully
      console.warn('[usePersonalAccountData] Error fetching account data:', error);
      return null;
    }
  };

  return useQuery({
    queryKey,
    queryFn,
    enabled: !!userId,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: false, // Don't retry on 404 errors
    initialData: partialAccount?.id
      ? {
          id: partialAccount.id,
          name: partialAccount.name,
          picture_url: partialAccount.picture_url,
        }
      : undefined,
  });
}

export function useRevalidatePersonalAccountDataQuery() {
  const queryClient = useQueryClient();

  return useCallback(
    (userId: string) =>
      queryClient.invalidateQueries({
        queryKey: ['account:data', userId],
      }),
    [queryClient],
  );
}
