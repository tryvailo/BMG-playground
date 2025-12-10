'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface KeywordScanResult {
  id: string;
  keyword: string;
  aiResponseSource: string;
  aivScore: number;
  status: 'VISIBLE' | 'PARTIAL' | 'NOT_VISIBLE';
  rank: number;
  topCompetitor: string;
  date: string;
}

interface VisibilityMonitorData {
  results: KeywordScanResult[];
}

export function useVisibilityMonitor() {
  return useQuery<VisibilityMonitorData>({
    queryKey: ['visibility-monitor'],
    queryFn: async () => {
      const response = await fetch('/api/visibility-monitor');
      if (!response.ok) {
        throw new Error('Failed to fetch visibility monitor data');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useRunScan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (keywords?: string[]) => {
      const response = await fetch('/api/visibility-monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords }),
      });
      if (!response.ok) {
        throw new Error('Failed to run scan');
      }
      return response.json();
    },
    onSuccess: () => {
      // Refetch data after successful scan
      queryClient.invalidateQueries({ queryKey: ['visibility-monitor'] });
    },
  });
}

