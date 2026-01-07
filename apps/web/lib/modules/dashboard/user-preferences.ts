/**
 * User Preferences Service
 * Week 4, Day 3: Store and manage user dashboard preferences
 */

export interface DashboardPreferences {
  userId: string;
  widgetsVisible: {
    clinicScore: boolean;
    servicesOverview: boolean;
    pageSpeedMetrics: boolean;
    schemaValidation: boolean;
    metaTags: boolean;
    weeklyStats: boolean;
    topServices: boolean;
    recommendations: boolean;
  };
  dataFilters: {
    minVisibility: number; // 0-100
    includeHiddenServices: boolean;
    dateRange: 'week' | 'month' | 'quarter' | 'year';
  };
  theme: 'light' | 'dark' | 'auto';
  layout: 'compact' | 'normal' | 'expanded';
  sortBy: 'aivScore' | 'visibility' | 'pagespeed' | 'schema' | 'recent';
  updatedAt: string;
}

/**
 * Default preferences
 */
export const defaultPreferences: Omit<DashboardPreferences, 'userId'> = {
  widgetsVisible: {
    clinicScore: true,
    servicesOverview: true,
    pageSpeedMetrics: true,
    schemaValidation: true,
    metaTags: true,
    weeklyStats: true,
    topServices: true,
    recommendations: true,
  },
  dataFilters: {
    minVisibility: 0,
    includeHiddenServices: true,
    dateRange: 'month',
  },
  theme: 'auto',
  layout: 'normal',
  sortBy: 'aivScore',
  updatedAt: new Date().toISOString(),
};

/**
 * Get user preferences from localStorage
 */
export function getUserPreferences(userId: string): DashboardPreferences {
  if (typeof window === 'undefined') {
    return {
      userId,
      ...defaultPreferences,
    };
  }

  const stored = localStorage.getItem(`prefs:${userId}`);
  if (!stored) {
    return {
      userId,
      ...defaultPreferences,
    };
  }

  try {
    return JSON.parse(stored);
  } catch {
    return {
      userId,
      ...defaultPreferences,
    };
  }
}

/**
 * Save user preferences
 */
export function saveUserPreferences(prefs: DashboardPreferences): void {
  if (typeof window === 'undefined') return;

  const updated = {
    ...prefs,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(`prefs:${prefs.userId}`, JSON.stringify(updated));
}

/**
 * Update specific preferences
 */
export function updateUserPreferences(
  userId: string,
  updates: Partial<DashboardPreferences>
): DashboardPreferences {
  const current = getUserPreferences(userId);
  const updated = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  saveUserPreferences(updated);
  return updated;
}

/**
 * Reset to defaults
 */
export function resetPreferences(userId: string): DashboardPreferences {
  const prefs: DashboardPreferences = {
    userId,
    ...defaultPreferences,
  };

  saveUserPreferences(prefs);
  return prefs;
}

/**
 * Toggle widget visibility
 */
export function toggleWidget(
  userId: string,
  widget: keyof DashboardPreferences['widgetsVisible']
): boolean {
  const prefs = getUserPreferences(userId);
  const newValue = !prefs.widgetsVisible[widget];

  updateUserPreferences(userId, {
    widgetsVisible: {
      ...prefs.widgetsVisible,
      [widget]: newValue,
    },
  });

  return newValue;
}

/**
 * Update data filters
 */
export function updateDataFilters(
  userId: string,
  filters: Partial<DashboardPreferences['dataFilters']>
): DashboardPreferences {
  const prefs = getUserPreferences(userId);
  return updateUserPreferences(userId, {
    dataFilters: {
      ...prefs.dataFilters,
      ...filters,
    },
  });
}

/**
 * Get visible widgets count
 */
export function getVisibleWidgetsCount(prefs: DashboardPreferences): number {
  return Object.values(prefs.widgetsVisible).filter((v) => v).length;
}

/**
 * Check if widget is visible
 */
export function isWidgetVisible(
  prefs: DashboardPreferences,
  widget: keyof DashboardPreferences['widgetsVisible']
): boolean {
  return prefs.widgetsVisible[widget];
}
