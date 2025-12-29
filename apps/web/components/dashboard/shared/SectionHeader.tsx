'use client';

import React from 'react';

// Horizon UI Design Tokens
const HORIZON = {
  primary: '#4318FF',
  primaryLight: '#4318FF15',
  textPrimary: '#1B2559',
  textSecondary: '#A3AED0',
};

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  action?: React.ReactNode;
}

/**
 * Section Header Component - Horizon UI Style
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  action
}) => {
  return (
    <div className="flex items-center justify-between mb-6 mt-8 first:mt-0">
      <div className="flex items-center gap-4">
        {/* Icon Container */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: HORIZON.primaryLight }}
        >
          <Icon className="h-6 w-6" style={{ color: HORIZON.primary }} />
        </div>

        {/* Text */}
        <div>
          <h2
            className="text-xl font-bold"
            style={{ color: HORIZON.textPrimary }}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className="text-sm mt-0.5"
              style={{ color: HORIZON.textSecondary }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Optional Action */}
      {action && <div>{action}</div>}
    </div>
  );
};
