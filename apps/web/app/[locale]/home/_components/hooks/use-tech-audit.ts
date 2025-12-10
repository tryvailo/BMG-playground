'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface AuditMetric {
  category: string;
  score: number;
  description: string;
}

export interface AuditResult {
  url: string;
  overallScore: number;
  metrics: AuditMetric[];
  issues: string[];
}

export function useTechAudit(url?: string) {
  return useQuery<AuditResult>({
    queryKey: ['tech-audit', url],
    queryFn: async () => {
      const apiUrl = url 
        ? `/api/tech-audit?url=${encodeURIComponent(url)}`
        : '/api/tech-audit';
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch tech audit data');
      }
      return response.json();
    },
    enabled: !!url,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useRunAudit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (url: string) => {
      const response = await fetch('/api/tech-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!response.ok) {
        throw new Error('Failed to run audit');
      }
      return response.json();
    },
    onSuccess: (_, url) => {
      // Refetch data after successful audit
      queryClient.invalidateQueries({ queryKey: ['tech-audit', url] });
    },
  });
}

