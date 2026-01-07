/**
 * Tests for User Preferences
 * Dashboard personalization settings
 */

import {
  getUserPreferences,
  saveUserPreferences,
  updateUserPreferences,
  resetPreferences,
  toggleWidget,
  updateDataFilters,
  getVisibleWidgetsCount,
  isWidgetVisible,
  defaultPreferences,
} from '../user-preferences';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('User Preferences', () => {
  const userId = 'test-user-123';

  beforeEach(() => {
    localStorage.clear();
  });

  describe('getUserPreferences', () => {
    it('should return default preferences when not stored', () => {
      const prefs = getUserPreferences(userId);
      expect(prefs.userId).toBe(userId);
      expect(prefs.widgetsVisible.clinicScore).toBe(true);
      expect(prefs.theme).toBe('auto');
      expect(prefs.layout).toBe('normal');
    });

    it('should return stored preferences', () => {
      const custom = {
        userId,
        ...defaultPreferences,
        theme: 'dark' as const,
      };
      saveUserPreferences(custom);

      const retrieved = getUserPreferences(userId);
      expect(retrieved.theme).toBe('dark');
    });
  });

  describe('saveUserPreferences', () => {
    it('should save preferences to localStorage', () => {
      const prefs = {
        userId,
        ...defaultPreferences,
        theme: 'dark' as const,
      };

      saveUserPreferences(prefs);
      const stored = localStorage.getItem(`prefs:${userId}`);
      expect(stored).toBeDefined();
    });

    it('should update timestamp on save', () => {
      const prefs = {
        userId,
        ...defaultPreferences,
      };

      const before = new Date().getTime();
      saveUserPreferences(prefs);
      const after = new Date().getTime();

      const retrieved = getUserPreferences(userId);
      const savedTime = new Date(retrieved.updatedAt).getTime();

      expect(savedTime).toBeGreaterThanOrEqual(before);
      expect(savedTime).toBeLessThanOrEqual(after);
    });
  });

  describe('updateUserPreferences', () => {
    it('should update specific preferences', () => {
      const prefs = getUserPreferences(userId);
      expect(prefs.theme).toBe('auto');

      updateUserPreferences(userId, { theme: 'dark' });
      const updated = getUserPreferences(userId);

      expect(updated.theme).toBe('dark');
    });

    it('should preserve other preferences', () => {
      saveUserPreferences({
        userId,
        ...defaultPreferences,
        theme: 'light' as const,
        layout: 'compact' as const,
      });

      updateUserPreferences(userId, { theme: 'dark' });
      const updated = getUserPreferences(userId);

      expect(updated.theme).toBe('dark');
      expect(updated.layout).toBe('compact');
    });
  });

  describe('resetPreferences', () => {
    it('should reset to defaults', () => {
      const custom = {
        userId,
        ...defaultPreferences,
        theme: 'dark' as const,
        layout: 'expanded' as const,
      };

      saveUserPreferences(custom);
      const reset = resetPreferences(userId);

      expect(reset.theme).toBe('auto');
      expect(reset.layout).toBe('normal');
    });
  });

  describe('toggleWidget', () => {
    it('should toggle widget visibility', () => {
      const prefs = getUserPreferences(userId);
      expect(prefs.widgetsVisible.clinicScore).toBe(true);

      const result = toggleWidget(userId, 'clinicScore');
      expect(result).toBe(false);

      const updated = getUserPreferences(userId);
      expect(updated.widgetsVisible.clinicScore).toBe(false);
    });

    it('should toggle back to original state', () => {
      toggleWidget(userId, 'clinicScore');
      const result = toggleWidget(userId, 'clinicScore');
      expect(result).toBe(true);

      const updated = getUserPreferences(userId);
      expect(updated.widgetsVisible.clinicScore).toBe(true);
    });
  });

  describe('updateDataFilters', () => {
    it('should update data filters', () => {
      updateDataFilters(userId, {
        minVisibility: 50,
        dateRange: 'year',
      });

      const prefs = getUserPreferences(userId);
      expect(prefs.dataFilters.minVisibility).toBe(50);
      expect(prefs.dataFilters.dateRange).toBe('year');
    });

    it('should preserve other filters', () => {
      updateDataFilters(userId, {
        minVisibility: 30,
        dateRange: 'month',
      });

      updateDataFilters(userId, {
        minVisibility: 60,
      });

      const prefs = getUserPreferences(userId);
      expect(prefs.dataFilters.minVisibility).toBe(60);
      expect(prefs.dataFilters.dateRange).toBe('month');
    });
  });

  describe('getVisibleWidgetsCount', () => {
    it('should count visible widgets', () => {
      const prefs = getUserPreferences(userId);
      const count = getVisibleWidgetsCount(prefs);
      expect(count).toBe(8); // All 8 visible by default
    });

    it('should update count when widget hidden', () => {
      const prefs = {
        userId,
        ...defaultPreferences,
        widgetsVisible: {
          ...defaultPreferences.widgetsVisible,
          clinicScore: false,
          servicesOverview: false,
        },
      };

      const count = getVisibleWidgetsCount(prefs);
      expect(count).toBe(6);
    });

    it('should return 0 when all widgets hidden', () => {
      const prefs = {
        userId,
        ...defaultPreferences,
        widgetsVisible: {
          clinicScore: false,
          servicesOverview: false,
          pageSpeedMetrics: false,
          schemaValidation: false,
          metaTags: false,
          weeklyStats: false,
          topServices: false,
          recommendations: false,
        },
      };

      const count = getVisibleWidgetsCount(prefs);
      expect(count).toBe(0);
    });
  });

  describe('isWidgetVisible', () => {
    it('should check widget visibility', () => {
      const prefs = getUserPreferences(userId);
      expect(isWidgetVisible(prefs, 'clinicScore')).toBe(true);
      expect(isWidgetVisible(prefs, 'servicesOverview')).toBe(true);
    });

    it('should return false for hidden widget', () => {
      const prefs = {
        userId,
        ...defaultPreferences,
        widgetsVisible: {
          ...defaultPreferences.widgetsVisible,
          clinicScore: false,
        },
      };

      expect(isWidgetVisible(prefs, 'clinicScore')).toBe(false);
      expect(isWidgetVisible(prefs, 'servicesOverview')).toBe(true);
    });
  });

  describe('Multiple users', () => {
    it('should maintain separate preferences for different users', () => {
      const user1 = 'user-1';
      const user2 = 'user-2';

      updateUserPreferences(user1, { theme: 'dark' });
      updateUserPreferences(user2, { theme: 'light' });

      const prefs1 = getUserPreferences(user1);
      const prefs2 = getUserPreferences(user2);

      expect(prefs1.theme).toBe('dark');
      expect(prefs2.theme).toBe('light');
    });
  });

  describe('Data persistence', () => {
    it('should persist changes across multiple accesses', () => {
      const changes = { theme: 'dark' as const, layout: 'expanded' as const };
      updateUserPreferences(userId, changes);

      // Simulate page reload
      const retrieved1 = getUserPreferences(userId);
      expect(retrieved1.theme).toBe('dark');
      expect(retrieved1.layout).toBe('expanded');

      // Another access should return same data
      const retrieved2 = getUserPreferences(userId);
      expect(retrieved2.theme).toBe('dark');
      expect(retrieved2.layout).toBe('expanded');
    });
  });
});
