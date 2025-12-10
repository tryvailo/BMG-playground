'use client';

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Play } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { TechAuditOverview } from '~/components/dashboard/audit/TechAuditOverview';
import { AuditProgress } from '~/components/dashboard/audit/AuditProgress';
import {
  getLatestProjectAudit,
  triggerTechAudit,
} from '~/lib/actions/tech-audit-actions';
import type { TechAudit } from '~/lib/modules/audit/tech-audit-service';

/**
 * Audit Page Component
 * 
 * Displays technical audit results for a project.
 * Supports running new audits and auto-refreshing when status is 'running'.
 */
export default function AuditPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  
  const [auditData, setAuditData] = useState<TechAudit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [isPolling, setIsPolling] = useState(false);

  // Fetch latest audit data
  const fetchAuditData = useCallback(async () => {
    try {
      const data = await getLatestProjectAudit({ projectId });
      setAuditData(data);
      
      // If audit is running, start polling
      if (data?.status === 'running') {
        setIsPolling(true);
      } else {
        setIsPolling(false);
      }
    } catch (error) {
      console.error('[AuditPage] Error fetching audit data:', error);
      toast.error('Failed to load audit data');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Initial fetch on mount
  useEffect(() => {
    if (projectId) {
      fetchAuditData();
    }
  }, [projectId, fetchAuditData]);

  // Polling effect: re-fetch every 5 seconds when status is 'running'
  useEffect(() => {
    if (!isPolling || !projectId) {
      return;
    }

    const intervalId = setInterval(() => {
      getLatestProjectAudit({ projectId })
        .then((data) => {
          setAuditData(data);
          
          // Stop polling if audit is no longer running
          if (data?.status !== 'running') {
            setIsPolling(false);
            
            // Show success/error toast based on final status
            if (data?.status === 'completed') {
              toast.success('Audit completed successfully');
            } else if (data?.status === 'failed') {
              toast.error('Audit failed. Please try again.');
            }
          }
        })
        .catch((error) => {
          console.error('[AuditPage] Error polling audit data:', error);
          // Don't show toast on polling errors to avoid spam
        });
    }, 5000); // Poll every 5 seconds

    return () => {
      clearInterval(intervalId);
    };
  }, [isPolling, projectId]);

  // Handle trigger audit action
  const handleRunAudit = () => {
    startTransition(async () => {
      try {
        const result = await triggerTechAudit({ projectId });
        
        if (result.success) {
          toast.success(result.message);
          
          // Start polling immediately after triggering
          setIsPolling(true);
          
          // Fetch initial data after a short delay
          setTimeout(() => {
            fetchAuditData();
          }, 1000);
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        console.error('[AuditPage] Error triggering audit:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast.error(`Failed to start audit: ${errorMessage}`);
      }
    });
  };

  // Show loading state on initial load
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6 max-w-7xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Technical Audit
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Analyze your site's performance, security, and optimization
          </p>
        </div>
        
        <Button
          onClick={handleRunAudit}
          disabled={isPending || isPolling}
          size="lg"
        >
          {isPending || isPolling ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isPolling ? 'Audit Running...' : 'Starting...'}
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Run New Audit
            </>
          )}
        </Button>
      </div>

      {/* Content */}
      {isPolling && auditData?.status === 'running' ? (
        <AuditProgress />
      ) : (
        <TechAuditOverview
          auditData={auditData}
          onRunAudit={handleRunAudit}
        />
      )}
    </div>
  );
}

