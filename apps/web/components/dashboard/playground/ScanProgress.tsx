'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@kit/ui/utils';

/**
 * Scan Progress Component
 * 
 * Displays a vertical list of scan steps with animated progress.
 * Automatically advances through steps, or jumps to completion when isFinished is true.
 */
interface ScanProgressProps {
  isFinished: boolean;
}

const SCAN_STEPS = [
  'Initializing AI Agents...',
  'Scanning ChatGPT & Perplexity...',
  'Analyzing Trust & Local Signals...',
  'Finalizing Report...',
] as const;

// Step durations in milliseconds
const STEP_DURATIONS = [2000, 3000, 2000, 2000] as const;

export function ScanProgress({ isFinished }: ScanProgressProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    // If finished, immediately show all steps as completed
    if (isFinished) {
      setCurrentStepIndex(SCAN_STEPS.length);
      return;
    }

    // Reset to first step when starting
    setCurrentStepIndex(0);

    // Advance through steps automatically
    const timers: NodeJS.Timeout[] = [];
    let accumulatedDelay = 0;

    for (let i = 0; i < SCAN_STEPS.length; i++) {
      accumulatedDelay += STEP_DURATIONS[i] || 2000;
      
      timers.push(
        setTimeout(() => {
          setCurrentStepIndex(i + 1);
        }, accumulatedDelay),
      );
    }

    // Cleanup timers on unmount or when isFinished changes
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [isFinished]);

  // If finished, show all steps as completed
  const allCompleted = isFinished && currentStepIndex >= SCAN_STEPS.length;

  return (
    <div className="space-y-4">
      {SCAN_STEPS.map((step, index) => {
        const isCompleted = index < currentStepIndex || allCompleted;
        const isCurrent = index === currentStepIndex && !allCompleted;

        return (
          <div
            key={index}
            className={cn(
              'flex items-center gap-3 transition-all duration-300',
              isCompleted && 'opacity-100',
              !isCompleted && !isCurrent && 'opacity-60',
            )}
          >
            {/* Icon */}
            <div className="flex-shrink-0">
              {isCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              ) : isCurrent ? (
                <Loader2 className="h-5 w-5 animate-spin text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>

            {/* Step Text */}
            <span
              className={cn(
                'text-sm transition-colors duration-300',
                isCompleted
                  ? 'text-muted-foreground line-through'
                  : isCurrent
                    ? 'font-semibold text-foreground'
                    : 'text-muted-foreground',
              )}
            >
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
}

