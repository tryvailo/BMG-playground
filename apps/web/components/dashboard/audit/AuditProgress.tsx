'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@kit/ui/card';
import { cn } from '@kit/ui/utils';

/**
 * AuditProgress Component
 * 
 * Displays a "Scanning..." state while the audit is running.
 * The parent component should handle polling logic.
 */
interface AuditProgressProps {
  className?: string;
}

export function AuditProgress({ className }: AuditProgressProps) {
  return (
    <Card className={cn(className)}>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600 dark:text-emerald-400 mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Scanning...
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 text-center max-w-md">
          The technical audit is in progress. This may take a few moments while we analyze your site's performance, security, and optimization.
        </p>
      </CardContent>
    </Card>
  );
}

