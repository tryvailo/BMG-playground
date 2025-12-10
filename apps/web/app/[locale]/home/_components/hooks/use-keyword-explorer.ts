'use client';

import { useQuery } from '@tanstack/react-query';

export interface KeywordOpportunity {
  id: string;
  prompt: string;
  volume: number;
  difficulty: number;
  potentialImpact: 'High' | 'Medium' | 'Low';
}

interface KeywordExplorerData {
  opportunities: KeywordOpportunity[];
  searchTerm?: string;
}

export function useKeywordExplorer(searchTerm?: string) {
  return useQuery<KeywordExplorerData>({
    queryKey: ['keyword-explorer', searchTerm],
    queryFn: async () => {
      const url = searchTerm 
        ? `/api/keyword-explorer?search=${encodeURIComponent(searchTerm)}`
        : '/api/keyword-explorer';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch keyword explorer data');
      }
      return response.json();
    },
    enabled: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

