# Changelog

All notable changes to Voila! are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

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
