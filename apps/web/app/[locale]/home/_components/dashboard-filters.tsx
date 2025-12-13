'use client';

import React from 'react';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { Button } from '@kit/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@kit/ui/popover';
import { Calendar } from '@kit/ui/calendar';
import { cn } from '@kit/ui/utils';

import type { DashboardFilters } from '~/lib/actions/dashboard.types';

interface DashboardFiltersProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
}

const AI_ENGINE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'perplexity', label: 'Perplexity' },
  { value: 'claude', label: 'Claude' },
] as const;

export function DashboardFilters({ filters, onFiltersChange }: DashboardFiltersProps) {
  const handleDateRangeChange = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range.to) {
      onFiltersChange({
        ...filters,
        dateRange: {
          from: range.from,
          to: range.to,
        },
      });
    }
  };

  const handleAiEngineChange = (value: string) => {
    onFiltersChange({
      ...filters,
      aiEngine: (value as DashboardFilters['aiEngine']) || 'all',
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-muted rounded-lg border border-border">
      {/* Date Range Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-[280px] justify-start text-left font-normal',
              !filters.dateRange?.from && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {filters.dateRange?.from ? (
              filters.dateRange.to ? (
                <>
                  {format(filters.dateRange.from, 'MMM dd, yyyy')} -{' '}
                  {format(filters.dateRange.to, 'MMM dd, yyyy')}
                </>
              ) : (
                format(filters.dateRange.from, 'MMM dd, yyyy')
              )
            ) : (
              <span>Select date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={filters.dateRange?.from}
            selected={{
              from: filters.dateRange?.from,
              to: filters.dateRange?.to,
            }}
            onSelect={(range) => {
              handleDateRangeChange(range as { from?: Date; to?: Date } | undefined);
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      {/* AI Engine Select */}
      <Select
        value={filters.aiEngine || 'all'}
        onValueChange={handleAiEngineChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="AI Engine" />
        </SelectTrigger>
        <SelectContent>
          {AI_ENGINE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

