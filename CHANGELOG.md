# CHANGELOG

## 0.2.0 (2025-02-24)

- Updated dependencies
- Updated EsLint configuration to v9
- Updated TailwindCSS to v4
- Updated dark theme colors to a less contrasting color palette
- Updated the UI components to use the new spacing system in TailwindCSS v4
- Minor bug fixes ported from the full kit

## 0.3.0 (2026-01-09) — LLMS.txt analysis, UI & audit fixes

- llms.txt analysis resiliency:
	- Added a deterministic heuristic fallback for `llms.txt` analysis when the OpenAI call fails (network/API key/timeout). See `apps/web/lib/modules/audit/utils/llms-analyzer.ts` (`heuristicLlmsAnalysis`) — returns `score`, `missing_sections`, `recommendations`, `analysisMethod`, and `fallbackReason`.
	- AI results are now marked with `analysisMethod: 'ai'`; heuristic results are marked with `analysisMethod: 'heuristic'` to allow UI to surface the source of the analysis.

- UI improvements (Tech Audit — LLMS dialog):
	- Translated/clarified llms details headings: `Missing Sections` → `ПРОБЛЕМИ`, `Recommendations` → `РЕКОМЕНДАЦІЇ` in `apps/web/components/dashboard/audit/TechAuditOverview.tsx`.
	- Added badges and short fallback reason display when heuristic fallback is used or AI error occurred.

- Audit pipeline & persistence changes:
	- `checkAndAnalyzeLlmsTxt` (in `apps/web/lib/modules/audit/ephemeral-audit.ts`) now returns richer `data` including `summary`, `missing_sections`, `recommendations`, `analysisMethod`, and `fallbackReason` so UI and DB persisted `llms_txt_data` contain actionable info rather than only a numeric score.
	- When AI analysis fails, the ephemeral audit attempts the local heuristic and persists that result so users still see clear PROBLEMS and actionable RECOMMENDATIONS.

- Tests & validation:
	- Added unit tests for the heuristic analyzer: `apps/web/lib/modules/audit/utils/__tests__/llms-analyzer.test.ts` (Vitest).
	- Ran TypeScript typecheck for `apps/web` to validate changes.

- Logging & supportability:
	- Audit code logs fallback events and stores `fallbackReason` in the `llms_txt_data` object for easier triage by support.

Files touched (non-exhaustive):

- `apps/web/lib/modules/audit/utils/llms-analyzer.ts` — added heuristic fallback, exported for tests, added analysisMethod/fallbackReason fields.
- `apps/web/lib/modules/audit/ephemeral-audit.ts` — updated `checkAndAnalyzeLlmsTxt` to return richer `data` and to use heuristic fallback when AI fails.
- `apps/web/components/dashboard/audit/TechAuditOverview.tsx` — UI labels and fallback badges.
- `apps/web/lib/modules/audit/utils/__tests__/llms-analyzer.test.ts` — new unit tests.

Notes / recommended next steps:

- Surface `fallbackReason` in admin/support dashboards to monitor frequency of AI failures.
- Add CI step to execute the new Vitest unit tests (add `vitest` to devDependencies and run `pnpm --filter web test`).
- Consider translating the remaining llms dialog microcopy fully into Ukrainian if consistent localization is desired.

## 0.1.0

- Initial release of the Next.js Supabase SaaS Kit Lite template