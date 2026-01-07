/**
 * PreferencesPanel Component
 * Week 4, Day 3: Dashboard personalization panel
 */

'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@kit/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { Button } from '@kit/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';

import { Checkbox } from '@kit/ui/checkbox';
import { Label } from '@kit/ui/label';

import { RotateCcw, Check } from 'lucide-react';
import {
  DashboardPreferences,
  defaultPreferences,
  getVisibleWidgetsCount,
} from '~/lib/modules/dashboard/user-preferences';

export interface PreferencesPanelProps {
  preferences: DashboardPreferences;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSave?: (preferences: DashboardPreferences) => void;
}

export function PreferencesPanel({
  preferences,
  open = false,
  onOpenChange,
  onSave,
}: PreferencesPanelProps) {
  const [tempPrefs, setTempPrefs] = useState(preferences);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave?.(tempPrefs);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setTempPrefs({
      ...preferences,
      ...defaultPreferences,
    });
  };

  const toggleWidget = (widget: keyof DashboardPreferences['widgetsVisible']) => {
    setTempPrefs({
      ...tempPrefs,
      widgetsVisible: {
        ...tempPrefs.widgetsVisible,
        [widget]: !tempPrefs.widgetsVisible[widget],
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dashboard Preferences</DialogTitle>
          <DialogDescription>Customize your dashboard experience</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Widgets Visibility */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Visible Widgets</CardTitle>
              <CardDescription>
                {getVisibleWidgetsCount(tempPrefs)} of 8 widgets visible
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(
                [
                  { key: 'clinicScore', label: 'Clinic AI Score' },
                  { key: 'servicesOverview', label: 'Services Overview' },
                  { key: 'pageSpeedMetrics', label: 'PageSpeed Metrics' },
                  { key: 'schemaValidation', label: 'Schema Validation' },
                  { key: 'metaTags', label: 'Meta Tags' },
                  { key: 'weeklyStats', label: 'Weekly Stats' },
                  { key: 'topServices', label: 'Top Services' },
                  { key: 'recommendations', label: 'Recommendations' },
                ] as const
              ).map(({ key, label }) => (
                <div key={key} className="flex items-center space-x-3">
                  <Checkbox
                    id={key}
                    checked={tempPrefs.widgetsVisible[key]}
                    onCheckedChange={() => toggleWidget(key)}
                  />
                  <Label htmlFor={key} className="text-sm font-medium cursor-pointer flex-1">
                    {label}
                  </Label>
                  {tempPrefs.widgetsVisible[key] && (
                    <Check className="w-4 h-4 text-green-600" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Display Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Display Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Theme */}
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={tempPrefs.theme}
                  onValueChange={(value: 'light' | 'dark' | 'auto') =>
                    setTempPrefs({ ...tempPrefs, theme: value })
                  }
                >
                  <SelectTrigger id="theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="auto">Auto (System)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Layout */}
              <div className="space-y-2">
                <Label htmlFor="layout">Layout</Label>
                <Select
                  value={tempPrefs.layout}
                  onValueChange={(value: 'compact' | 'normal' | 'expanded') =>
                    setTempPrefs({ ...tempPrefs, layout: value })
                  }
                >
                  <SelectTrigger id="layout">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="expanded">Expanded</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <Label htmlFor="sortBy">Default Sort</Label>
                <Select
                  value={tempPrefs.sortBy}
                  onValueChange={(value: 'aivScore' | 'visibility' | 'pagespeed' | 'schema' | 'recent') =>
                    setTempPrefs({ ...tempPrefs, sortBy: value })
                  }
                >
                  <SelectTrigger id="sortBy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aivScore">AIV Score</SelectItem>
                    <SelectItem value="visibility">Visibility</SelectItem>
                    <SelectItem value="pagespeed">PageSpeed</SelectItem>
                    <SelectItem value="schema">Schema</SelectItem>
                    <SelectItem value="recent">Most Recent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Data Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Data Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Minimum Visibility */}
              <div className="space-y-2">
                <Label>
                  Minimum Visibility: {tempPrefs.dataFilters.minVisibility}%
                </Label>
                <input
                  type="range"
                  value={tempPrefs.dataFilters.minVisibility}
                  onChange={(e) =>
                    setTempPrefs({
                      ...tempPrefs,
                      dataFilters: {
                        ...tempPrefs.dataFilters,
                        minVisibility: Number(e.target.value),
                      },
                    })
                  }
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* Include Hidden Services */}
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="includeHidden"
                  checked={tempPrefs.dataFilters.includeHiddenServices}
                  onCheckedChange={(checked) =>
                    setTempPrefs({
                      ...tempPrefs,
                      dataFilters: {
                        ...tempPrefs.dataFilters,
                        includeHiddenServices: !!checked,
                      },
                    })
                  }
                />
                <Label
                  htmlFor="includeHidden"
                  className="text-sm font-medium cursor-pointer flex-1"
                >
                  Show hidden services
                </Label>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label htmlFor="dateRange">Date Range</Label>
                <Select
                  value={tempPrefs.dataFilters.dateRange}
                  onValueChange={(value: 'week' | 'month' | 'quarter' | 'year') =>
                    setTempPrefs({
                      ...tempPrefs,
                      dataFilters: {
                        ...tempPrefs.dataFilters,
                        dateRange: value,
                      },
                    })
                  }
                >
                  <SelectTrigger id="dateRange">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Last 7 days</SelectItem>
                    <SelectItem value="month">Last 30 days</SelectItem>
                    <SelectItem value="quarter">Last 90 days</SelectItem>
                    <SelectItem value="year">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">
                Last updated: {new Date(tempPrefs.updatedAt).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={handleReset}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Defaults
            </Button>
            <Button onClick={handleSave} className="gap-2">
              {saved && <Check className="w-4 h-4" />}
              {saved ? 'Saved!' : 'Save Preferences'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
