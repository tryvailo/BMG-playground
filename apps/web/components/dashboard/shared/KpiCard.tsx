'use client';

import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { cn } from '@kit/ui/utils';
import { getMetricColorVariant, type MetricColorVariant } from '~/lib/design/metric-colors';

interface KpiCardProps {
  title: string;
  value: string;
  trend?: number;
  icon: React.ElementType;
  color: string;
  note?: string;
  subtext?: string;
}

/**
 * Standardized KPI Card Component
 * Follows Dashboard Brandbook 2026 standards
 */
export const KpiCard: React.FC<KpiCardProps> = ({ 
  title, 
  value, 
  trend, 
  icon: Icon, 
  color, 
  note, 
  subtext 
}) => {
  const colorMap: Record<string, MetricColorVariant> = {
    emerald: 'success',
    green: 'success',
    cyan: 'cyan',
    orange: 'warning',
    blue: 'info',
    purple: 'purple',
  };

  const variant = colorMap[color] || 'primary';
  const colors = getMetricColorVariant(variant);

  const isPositive = trend !== undefined && trend >= 0;
  const trendAbs = trend !== undefined ? Math.abs(trend) : 0;
  const trendDisplay = trendAbs > 0 && trend !== undefined ? `${isPositive ? '+' : ''}${trend.toFixed(1)}%` : null;

  return (
    <Card className={cn(
      "relative group overflow-hidden transition-all duration-700 rounded-[24px] border-none",
      "bg-white/40 dark:bg-slate-950/40 backdrop-blur-2xl",
      "shadow-[0_4px_24px_rgba(0,0,0,0.04)]",
      "hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1 hover:bg-white/60 dark:hover:bg-slate-950/60"
    )}>
      {/* Dynamic Glow */}
      <div className={cn(
        "absolute -right-6 -top-6 w-24 h-24 blur-[40px] opacity-0 group-hover:opacity-30 transition-all duration-1000 rounded-full",
        colors.bg
      )} />

      <div className="absolute inset-0 border border-white/50 dark:border-white/5 rounded-[24px] pointer-events-none" />

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 relative z-10 p-4">
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
          {title}
        </CardTitle>
        <div className={cn(
          'p-1.5 rounded-xl transition-all duration-700 group-hover:scale-110 group-hover:rotate-6 shadow-sm border border-white/60 dark:border-white/10',
          colors.bg,
          "group-hover:shadow-[0_0_20px_rgba(0,0,0,0.05)]"
        )}>
          <Icon className={cn('h-3.5 w-3.5', colors.icon)} />
        </div>
      </CardHeader>
      <CardContent className="relative z-10 p-4 pt-0">
        <div className="text-2xl font-black italic tracking-tighter text-slate-900 dark:text-white group-hover:scale-[1.02] origin-left transition-all duration-700">
          {value}
        </div>

        {trendDisplay && (
          <div className="flex items-center mt-2 text-[10px] font-black italic uppercase tracking-widest">
            <div className={cn(
              "flex items-center px-2 py-0.5 rounded-full border shadow-sm transition-all duration-700 group-hover:scale-110",
              isPositive
                ? "bg-emerald-50/50 border-emerald-100 text-emerald-600 dark:bg-emerald-950/10 dark:border-emerald-900/40 dark:text-emerald-400"
                : "bg-red-50/50 border-red-100 text-red-600 dark:bg-red-950/10 dark:border-red-900/40 dark:text-red-400"
            )}>
              {isPositive ? <ArrowUp className="h-2.5 w-2.5 mr-0.5" /> : <ArrowDown className="h-2.5 w-2.5 mr-0.5" />}
              {trendDisplay}
            </div>
          </div>
        )}

        {(subtext || note) && !trendDisplay && (
          <p className="text-[10px] font-black text-muted-foreground mt-2 opacity-40 uppercase tracking-widest italic">{subtext || note}</p>
        )}
      </CardContent>
    </Card>
  );
};


