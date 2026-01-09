'use client';

import { useQuery } from '@tanstack/react-query';
import { getServices } from '~/lib/actions/services';

export function useServices(projectId: string) {
    return useQuery({
        queryKey: ['services', projectId],
        queryFn: async () => {
            if (!projectId) return [];
            const dbServices = await getServices({ projectId });
            return dbServices || [];
        },
        enabled: !!projectId,
        staleTime: 60 * 1000,
    });
}
