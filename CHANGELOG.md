# Changelog

All notable changes to Voila! are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] — v1.1.0

### Added
- `src/utils/format.ts` — shared `formatBytes`, `formatDuration`, `truncate` (QUAL-002)
- `src/constants/index.ts` — `TIERS`, `FILE_CATEGORIES`, `PROVENANCE`, `FORMAT_QUALITY`, `API_ENDPOINTS` (QUAL-005)
- `src/components/renderers/` — 6 extracted sub-renderer files; FileRenderer.tsx shrunk from 1577 → 719 lines (QUAL-001)
- `src/components/renderers/shared.tsx` — `MetadataRow`, `MetadataSection`, `ProvenanceBadge`, `highlightSyntax` (REVIEW-011)
- `eslint.config.mjs` + `.prettierrc` — ESLint and Prettier config (QUAL-006)
- `src/tests/OmniDrop.test.tsx` — 12 RTL component tests (TEST-002)
- `src/tests/api.test.ts` — 14 API client tests across all methods (TEST-003)
- `backend/tests/test_api.py` — 15 new backend tests: upload with real bytes, corruption detection, rate limiter load, admin endpoint protection (TEST-004/005)
- `backend/engines/corruption.py` — `check_bytes()` method for real byte-level validation (REVIEW-008)
- `CorruptionDetector.check_bytes()` — JPEG SOI, PDF header/EOF, PNG signature, ZIP magic, ELF magic (REVIEW-008)
- `_detect_type_from_bytes()` in backend — 16-entry magic byte table for upload metadata (REVIEW-007)
- OmniDrop privacy notice — tier-specific disclosure with toggle (UX-001)
- OmniDrop tier indicator — always-visible badge showing Browser/Cloud/VM (UX-002)
- Build size report step in CI via `$GITHUB_STEP_SUMMARY` (PERF-004)
- JSDoc on all public lib functions: `detectTrueFileType`, `determineTier`, `SpellChecker`, `checkFilenameSpelling`, `processFile`, `getFileCategory` (QUAL-003)

### Changed
- `src/lib/fileProcessor.ts` — CSV now uses **papaparse** (RFC 4180-compliant); YAML uses **js-yaml** (REVIEW-013/014)
- `src/lib/api.ts` — `AbortSignal.timeout()` wrapped for Node.js compatibility; `import.meta.env` replaced with `process.env`
- `src/components/OmniDrop.tsx` — rewritten with privacy/tier UX improvements
- `vite.config.ts` — papaparse+js-yaml vendor chunk; `chunkSizeWarningLimit` raised
- `jest.config.cjs` — coverage thresholds raised to 60/65/70/70 (TEST-006)
- `backend/main.py` — `OPENAI_API_KEY` no longer required on startup (REVIEW-001)
- `backend/main.py` — `/api/v1/cost/{ip}` and `/api/v1/stats` now gated by `X-Admin-Key` header (REVIEW-002/003)
- `backend/main.py` — upload size enforced server-side before full read (REVIEW-004)
- `backend/main.py` — rate limiter respects `RATELIMIT_ENABLED=0` for test environments
- `backend/tests/conftest.py` — rate limiting disabled in all tests; corruption tests updated to use real bytes

### Fixed
- Three.js now lazy-loaded via `React.lazy()` + `Suspense` — only downloads when a 3D file is dropped (PERF-001)
- Upload endpoint `/api/v1/diagnostics/corruption` now accepts `UploadFile` instead of `file_type` query param (REVIEW-008)
- All TypeScript strict-mode errors in renderer sub-files resolved

---

## [1.0.0]

### Added
- `ErrorBoundary` React component with dev-only stack traces, inline variant, and `withErrorBoundary` HOC
- `SpellChecker` class API in `spellChecker.ts` — Levenshtein-based suggestions, custom dictionary, batch checking
- `FileProcessor` class export in `fileProcessor.ts`
- `src/lib/__mocks__/preflight.ts` — manual Jest mock for reliable test isolation
- `src/data/file-signatures.json` — 46 magic-byte signatures across 9 categories with `textPatterns` and `corruptionRules`
- `.github/workflows/ci.yml` — full CI/CD pipeline (lint → typecheck → tests → build → Docker → deploy)
- `Dockerfile` — multi-stage build (Node frontend builder + Python/nginx runtime)
- `docker-compose.yml` — full production stack (app, Redis, Tika, Prometheus, Grafana)
- `deploy/nginx.conf` — SPA routing, API proxy, security headers, gzip, long-cache assets
- `deploy/start.sh` — combined nginx + uvicorn entrypoint
- `monitoring/prometheus.yml` — scrape config for backend, Redis, and Prometheus self-monitoring
- `monitoring/alerts.yml` — alerting rules for API health, processing failures, infrastructure
- `monitoring/grafana/` — provisioned Grafana datasource + dashboard (request rate, error rate, latency, queue depth, memory)
- `.env.production.template` — documented environment variable reference
- `tsconfig.jest.json` — Jest-specific TypeScript config (`isolatedModules: false`, CJS resolution)
- `CHANGELOG.md` (this file)

### Fixed
- `src/data/file-signatures.json` was empty (1 byte) — populated with full signature database
- `jest.config.cjs` — resolved dual-config conflict (`package.json` vs file), fixed `resetMocks` clearing mock implementations
- `tsconfig.jest.json` — `isolatedModules: false` to allow JSON module imports in ts-jest
- `@types/jest` — was missing, causing `jest` namespace errors in strict TS mode
- `src/tests/setup.ts` — `Performance` type cast, `Blob.prototype.arrayBuffer` polyfill for jsdom
- ZIP signature ordering — ZIP bytes (`PK\x03\x04`) now matched before DOCX (same magic, different format)
- Corruption detection — now fires on declared file extension when no magic-byte match, not only on detected type
- `spellChecker.ts` — single-char extensions (`c`, `h`, `r`) added to dictionary
- `backend/tests/conftest.py` — env vars now set before app import to prevent `OPENAI_API_KEY` startup crash
- `backend/main.py` — replaced deprecated `datetime.utcnow()` with `datetime.now(timezone.utc)`
- `httpx` pinned to `0.27.2` for starlette `TestClient` compatibility
- npm audit — 0 vulnerabilities (was 3 high, 1 moderate)

### Changed
- Coverage collection scoped to `src/lib/**` and `src/utils/**` (components excluded — no component tests yet)
- Jest `clearMocks`/`resetMocks` set to `false` — mock implementations persist across test cases as intended

---

## [1.0.0] — Initial scaffold (MiniMax)

### Added
- Core frontend: `App.tsx`, `OmniDrop.tsx`, `FileRenderer.tsx`, `PipelineVisualizer.tsx`
- UI components: `About.tsx`, `ArchitectureDiagram.tsx`, `ExpertPanel.tsx`
- Library modules: `preflight.ts`, `fileProcessor.ts`, `spellChecker.ts`, `api.ts`
- Backend: FastAPI gateway (`main.py`) with metadata extraction, code analysis, file upload, CORS, rate limiting
- Test scaffolds: `preflight.test.ts`, `spellChecker.test.ts`, `fileProcessor.test.ts`, `test_api.py`
- Architecture and project documentation
