'use client';

import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon: React.ElementType;
}

/**
 * Standardized Section Header Component
 * Follows Dashboard Brandbook 2026 standards
 * 
 * H2 - Заголовок секции
 * text-2xl font-black flex items-center gap-2 text-slate-900
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({ 
  title, 
  subtitle, 
  icon: Icon 
}) => {
  return (
    <div className="flex items-center justify-between mb-4 mt-6 first:mt-0 animate-in fade-in slide-in-from-left duration-1000">
      <div>
        <h2 className="text-2xl font-black flex items-center gap-2 text-slate-900">
          <div className="p-1.5 rounded-xl bg-primary/10 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)] backdrop-blur-md border border-primary/20">
            <Icon className="h-3.5 w-3.5 text-primary" />
          </div>
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm font-medium text-slate-700 mt-1">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};


