# ✅ WEEK 1: VERIFICATION & TESTING GUIDE

## 🧪 HOW TO VERIFY THE IMPLEMENTATION

### 1. TypeScript Compilation
```bash
cd apps/web

# Check TypeScript with skipLibCheck (existing issues in other files)
npx tsc --noEmit --skipLibCheck lib/modules/dashboard/

# Should return: NO ERRORS
```

### 2. Test Metrics Calculator Functions
```bash
# Run unit tests for metrics calculator
npm test -- lib/modules/dashboard/__tests__/metrics-calculator.test.ts

# Expected output:
# ✓ calculateClinicAIScore - 5 tests passing
# ✓ calculateAIVScore - 4 tests passing
# ✓ Position/Visibility/Trend/Format - 12+ tests passing
# TOTAL: 25+ TESTS PASSING
```

### 3. Test Dashboard Integration
```bash
# Run integration tests
npm test -- lib/actions/__tests__/dashboard.integration.test.ts

# Expected output:
# ✓ Weekly stats calculation
# ✓ Perfect scores
# ✓ Zero scores
# ✓ Value clamping
# ✓ API response format
# ✓ Decimal precision
# TOTAL: 15+ TESTS PASSING
```

### 4. Manual API Testing
```bash
# Start dev server
pnpm dev

# In another terminal:
# Test the API with your project ID
curl -X GET "http://localhost:3000/api/dashboard?projectId=<your-project-id>" \
  -H "Authorization: Bearer <your-token>"

# Expected response structure:
# {
#   "kpis": {
#     "avgAivScore": { "value": number, "change": number, "isPositive": boolean },
#     "visibleKeywords": { "value": number, "change": number, "isPositive": boolean },
#     "avgPosition": { "value": number, "change": number, "isPositive": boolean },
#     "competitorGap": { "value": number, "change": number, "isPositive": boolean },
#     "clinicAIScore": { "value": number, "change": number, "isPositive": boolean }
#   },
#   "history": [{ "date": string, "aivScore": number, ... }],
#   "competitors": [...],
#   "lastUpdated": string,
#   "projectId": string
# }
```

### 5. Component Integration Test
```bash
# Navigate to dashboard in your browser
# http://localhost:3000/[locale]/home

# Verify:
# ✓ DashboardView component loads
# ✓ KPI cards display real data
# ✓ Charts render correctly
# ✓ No console errors
# ✓ Data updates on page refresh
```

---

## 🔍 CODE VERIFICATION CHECKLIST

### metrics-calculator.ts
```bash
# Verify file exists and is importable
node -e "require('./apps/web/lib/modules/dashboard/metrics-calculator.ts')" 2>&1

# Check exports
grep -E "export (function|interface|type)" apps/web/lib/modules/dashboard/metrics-calculator.ts

# Expected exports:
# - calculateClinicAIScore
# - calculateAIVScore
# - calculatePositionScore
# - calculateVisibilityScore
# - calculateTrend
# - getScoreBadgeVariant
# - formatScore
# - calculateDashboardMetrics
# - ClinicAIScoreComponents (interface)
# - ClinicAIScoreResult (interface)
```

### clinic-service.ts
```bash
# Verify file exists
test -f apps/web/lib/modules/dashboard/clinic-service.ts && echo "✓ File exists" || echo "✗ File missing"

# Check exports
grep -E "export (function|const)" apps/web/lib/modules/dashboard/clinic-service.ts

# Expected exports:
# - getSupabaseClient
# - getSupabaseServerClient
# - getProjectDashboardData
# - getUserProjectDashboardData
# - getProjectCompetitors
# - aggregateWeeklyStats
# - transformServices
```

### API Route
```bash
# Check dashboard API exists
test -f apps/web/app/api/dashboard/route.ts && echo "✓ File exists" || echo "✗ File missing"

# Verify GET handler
grep "export const GET" apps/web/app/api/dashboard/route.ts && echo "✓ GET handler defined" || echo "✗ GET handler missing"
```

### Server Action
```bash
# Verify dashboard.ts updated
grep "calculateClinicAIScoreNew" apps/web/lib/actions/dashboard.ts && echo "✓ New calculator imported" || echo "✗ Not integrated"
```

---

## 📊 FORMULA VERIFICATION

### Test ClinicAI Score Calculation
```typescript
// Open browser console or Node REPL
const { calculateClinicAIScore } = require('./lib/modules/dashboard/metrics-calculator');

// Test case 1: All 80
const result1 = calculateClinicAIScore({
  visibility: 80,
  techOptimization: 80,
  contentOptimization: 80,
  eeatSignals: 80,
  localSignals: 80
});
console.assert(result1.score === 80, "All 80 should equal 80");

// Test case 2: Mixed scores
const result2 = calculateClinicAIScore({
  visibility: 75,
  techOptimization: 80,
  contentOptimization: 70,
  eeatSignals: 85,
  localSignals: 60
});
console.assert(result2.score === 67.5, "Mixed scores should equal 67.5");
// Calculation: 75×0.25 + 80×0.2 + 70×0.2 + 85×0.15 + 60×0.1
//            = 18.75 + 16 + 14 + 12.75 + 6 = 67.5

// Test case 3: Perfect scores
const result3 = calculateClinicAIScore({
  visibility: 100,
  techOptimization: 100,
  contentOptimization: 100,
  eeatSignals: 100,
  localSignals: 100
});
console.assert(result3.score === 100, "Perfect scores should equal 100");
```

---

## 🐛 DEBUGGING

### Enable Detailed Logging
```typescript
// In your server action or API route
console.log('[Dashboard] Fetching data for project:', projectId);
console.log('[Dashboard] Using stored clinic_ai_score from DB:', avgAivScore);
console.log('[Dashboard] Calculated ClinicAI Score:', avgAivScore);
```

### Check Browser Console
```bash
# Open Developer Tools (F12)
# Look for messages like:
# [Dashboard Component] Data loaded: {...}
# [Dashboard Component] Loading...
# [Dashboard Component] Error: ...
```

### Check Server Logs
```bash
# In terminal where `pnpm dev` is running
# Look for lines starting with [Dashboard]
# These indicate which path the code took
```

### Verify Database Data
```sql
-- Check if weekly_stats exist
SELECT * FROM weekly_stats 
WHERE project_id = 'your-project-id'
ORDER BY created_at DESC
LIMIT 1;

-- Check calculated scores
SELECT 
  week_start,
  clinic_ai_score,
  visability_score,
  tech_score,
  content_score,
  eeat_score,
  local_score
FROM weekly_stats
WHERE project_id = 'your-project-id'
ORDER BY week_start DESC;
```

---

## ✅ SUCCESS CRITERIA

### All these should be TRUE:

1. **TypeScript Compilation**
   - [ ] No TypeScript errors in dashboard module
   - [ ] All imports resolve correctly
   - [ ] No `any` types in new code

2. **Unit Tests**
   - [ ] All 25+ metrics calculator tests passing
   - [ ] All 15+ integration tests passing
   - [ ] 0 test failures

3. **API Functionality**
   - [ ] `/api/dashboard` returns HTTP 200
   - [ ] Response has correct JSON structure
   - [ ] All KPI fields present
   - [ ] Historical data included

4. **Database Integration**
   - [ ] Queries return data from Supabase
   - [ ] No SQL errors in console
   - [ ] Data aggregation working

5. **Component Display**
   - [ ] DashboardView renders without errors
   - [ ] KPI cards show real values (not all zeros)
   - [ ] Charts display correctly
   - [ ] No visual glitches

6. **Data Accuracy**
   - [ ] ClinicAI Score formula correct
   - [ ] Component weights applied correctly
   - [ ] Scores between 0-100
   - [ ] Trends calculated properly

---

## 🚨 COMMON ISSUES & FIXES

### Issue: "Cannot find module 'metrics-calculator'"
**Solution:** Verify path alias `~` is configured in `tsconfig.json`
```json
{
  "compilerOptions": {
    "paths": {
      "~/*": ["./"]
    }
  }
}
```

### Issue: Supabase client returns null
**Solution:** Check environment variables
```bash
# .env.local should have:
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

### Issue: API returns all zeros
**Solution:** Check weekly_stats table has data
```sql
SELECT COUNT(*) FROM weekly_stats WHERE project_id = 'your-id';
-- Should return > 0
```

### Issue: Tests failing with "calculateClinicAIScore is not a function"
**Solution:** Ensure you're importing from correct path
```typescript
// ✓ CORRECT
import { calculateClinicAIScore } from '~/lib/modules/dashboard/metrics-calculator';

// ✗ WRONG
import { calculateClinicAIScore } from '~/lib/modules/analytics/calculator';
```

---

## 📋 MANUAL TESTING CHECKLIST

```
Day 1-2: API & Real Data
- [ ] metrics-calculator.ts created
- [ ] clinic-service.ts created
- [ ] API dashboard returns real data
- [ ] Error handling works

Day 3-4: ClinicAI Score Formula
- [ ] Formula: 0.25V + 0.2T + 0.2C + 0.15E + 0.1L
- [ ] Unit tests all passing
- [ ] Integration tests all passing
- [ ] Scores between 0-100

Day 5: Component Integration
- [ ] DashboardView component loads
- [ ] useDashboardData hook works
- [ ] Server action calls metrics calculator
- [ ] Real data displays in UI

Overall
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] No unhandled rejections
- [ ] Responsive on mobile
- [ ] Fast performance
```

---

## 🎯 PERFORMANCE BENCHMARKS

### Expected Performance
```
API Response Time:        < 500ms
Database Query Time:      < 200ms
Metric Calculation:       < 50ms
Component Render Time:    < 100ms
Total Dashboard Load:     < 1000ms (including network)
```

### Profiling
```bash
# In browser DevTools:
# 1. Open Performance tab
# 2. Click Record
# 3. Navigate to dashboard
# 4. Stop recording
# 5. Check flame chart for bottlenecks
```

---

## 🔗 USEFUL COMMANDS

```bash
# Build the project
pnpm build

# Run dev server with logging
pnpm dev

# Run TypeScript check
pnpm typecheck

# Run linter
pnpm lint

# Format code
pnpm format

# Run all tests
pnpm test

# Run specific test file
pnpm test -- path/to/test.ts

# Check file syntax
npm run lint -- path/to/file.ts
```

---

## 📚 REFERENCE DOCUMENTATION

- [Dashboard Roadmap](./DEVELOPMENT_ROADMAP.md)
- [Week 1 Complete Summary](./WEEK1_COMPLETE.md)
- [Comprehensive Audit](./COMPREHENSIVE_FUNCTIONALITY_AUDIT.md)
- [Metrics Calculator](./apps/web/lib/modules/dashboard/metrics-calculator.ts)
- [Clinic Service](./apps/web/lib/modules/dashboard/clinic-service.ts)

---

**All verification complete? Ready for Week 2!** 🚀
