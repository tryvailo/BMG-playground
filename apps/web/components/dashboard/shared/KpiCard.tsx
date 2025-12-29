'use client';

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@kit/ui/card';
import { cn } from '@kit/ui/utils';

// Horizon UI Design Tokens
const HORIZON = {
  primary: '#4318FF',
  primaryLight: '#4318FF15',
  secondary: '#A3AED0',
  secondaryLight: '#A3AED015',
  success: '#01B574',
  successLight: '#01B57415',
  warning: '#FFB547',
  warningLight: '#FFB54715',
  error: '#EE5D50',
  errorLight: '#EE5D5015',
  info: '#2B77E5',
  infoLight: '#2B77E515',
  background: '#F4F7FE',
  textPrimary: '#1B2559',
  textSecondary: '#A3AED0',
  shadow: '0 18px 40px rgba(112, 144, 176, 0.12)',
  shadowSm: '0 4px 12px rgba(112, 144, 176, 0.1)',
};

// Color mapping for different metric types
const colorConfig: Record<string, { bg: string; icon: string; text: string }> = {
  emerald: { bg: HORIZON.successLight, icon: HORIZON.success, text: HORIZON.success },
  green: { bg: HORIZON.successLight, icon: HORIZON.success, text: HORIZON.success },
  success: { bg: HORIZON.successLight, icon: HORIZON.success, text: HORIZON.success },
  cyan: { bg: HORIZON.infoLight, icon: HORIZON.info, text: HORIZON.info },
  blue: { bg: HORIZON.infoLight, icon: HORIZON.info, text: HORIZON.info },
  info: { bg: HORIZON.infoLight, icon: HORIZON.info, text: HORIZON.info },
  orange: { bg: HORIZON.warningLight, icon: HORIZON.warning, text: HORIZON.warning },
  warning: { bg: HORIZON.warningLight, icon: HORIZON.warning, text: HORIZON.warning },
  purple: { bg: HORIZON.primaryLight, icon: HORIZON.primary, text: HORIZON.primary },
  primary: { bg: HORIZON.primaryLight, icon: HORIZON.primary, text: HORIZON.primary },
  error: { bg: HORIZON.errorLight, icon: HORIZON.error, text: HORIZON.error },
  red: { bg: HORIZON.errorLight, icon: HORIZON.error, text: HORIZON.error },
};

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
 * KPI Card Component - Horizon UI Style
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
  const colors = colorConfig[color] ?? colorConfig.primary ?? { bg: HORIZON.primaryLight, icon: HORIZON.primary, text: HORIZON.primary };
  const isPositive = trend !== undefined && trend >= 0;
  const trendAbs = trend !== undefined ? Math.abs(trend) : 0;
  const trendDisplay = trendAbs > 0 && trend !== undefined ? `${isPositive ? '+' : ''}${trend.toFixed(1)}%` : null;

  return (
    <Card
      className={cn(
        "relative group overflow-hidden transition-all duration-300 rounded-[20px] border-none bg-white",
        "hover:-translate-y-1"
      )}
      style={{ boxShadow: HORIZON.shadowSm }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-5">
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
          style={{ backgroundColor: colors.bg }}
        >
          <Icon className="h-6 w-6" style={{ color: colors.icon }} />
        </div>

        {/* Trend Badge */}
        {trendDisplay && (
          <div
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
            )}
            style={{
              backgroundColor: isPositive ? HORIZON.successLight : HORIZON.errorLight,
              color: isPositive ? HORIZON.success : HORIZON.error
            }}
          >
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trendDisplay}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-5 pt-0">
        {/* Title */}
        <p
          className="text-sm font-medium mb-1"
          style={{ color: HORIZON.textSecondary }}
        >
          {title}
        </p>

        {/* Value */}
        <div
          className="text-2xl font-bold"
          style={{ color: HORIZON.textPrimary }}
        >
          {value}
        </div>

        {/* Subtext/Note */}
        {(subtext || note) && !trendDisplay && (
          <p
            className="text-xs font-medium mt-2"
            style={{ color: HORIZON.textSecondary }}
          >
            {subtext || note}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
