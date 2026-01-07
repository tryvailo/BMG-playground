/**
 * useServiceDetails Hook
 * Manage service details modal state and data fetching
 */

'use client';

import { useState, useCallback } from 'react';

export interface ServiceDetailsData {
  id: string;
  serviceName: string;
  targetPage: string;
  country?: string;
  city?: string;
  visibility_score?: number;
  position?: number;
  aiv_score?: number;
  pagespeed_score?: number;
  pagespeed_metrics?: {
    lcp: number;
    fcp: number;
    cls: number;
    fid: number;
    ttfb: number;
    tti: number;
  };
  schema_score?: number;
  schema_issues?: number;
  createdAt?: string;
  updatedAt?: string;
}

export function useServiceDetails() {
  const [open, setOpen] = useState(false);
  const [service, setService] = useState<ServiceDetailsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const openService = useCallback((serviceData: ServiceDetailsData) => {
    setService(serviceData);
    setOpen(true);
  }, []);

  const closeService = useCallback(() => {
    setOpen(false);
    setTimeout(() => setService(null), 300); // Wait for animation
  }, []);

  const fetchServiceDetails = useCallback(
    async (serviceId: string) => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/services/${serviceId}`);
        if (!response.ok) throw new Error('Failed to fetch service');

        const data = await response.json();
        setService(data.data);
        setOpen(true);
      } catch (error) {
        console.error('Error fetching service details:', error);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const refetchService = useCallback(async () => {
    if (!service?.id) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/services/${service.id}`);
      if (!response.ok) throw new Error('Failed to fetch service');

      const data = await response.json();
      setService(data.data);
    } catch (error) {
      console.error('Error refetching service:', error);
    } finally {
      setIsLoading(false);
    }
  }, [service?.id]);

  return {
    open,
    service,
    isLoading,
    openService,
    closeService,
    fetchServiceDetails,
    refetchService,
  };
}
