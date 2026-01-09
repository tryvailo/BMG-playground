'use client';

import { useQuery } from '@tanstack/react-query';
import { getProjectSettings, type ProjectSettings } from '~/lib/actions/project';

export function useProjectSettings() {
    return useQuery<ProjectSettings | null>({
        queryKey: ['project-settings'],
        queryFn: async () => {
            const response = await getProjectSettings({}) as { success: boolean; error?: string; data?: ProjectSettings | null };
            if (!response.success) {
                throw new Error(response.error || 'Failed to fetch project settings');
            }
            return response.data ?? null;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}
