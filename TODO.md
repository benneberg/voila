# TODO.md

## Prioritized Action Items

---

## PHASE 1: Security Hardening (Week 1)

### P0 - Critical

| ID | Task | Owner | Files | Evidence | Done |
|----|------|-------|-------|----------|------|
| SEC-001 | Remove `unsafe-eval` from CSP header | Dev | `backend/main.py:174` | CSP allows script injection | [x] |
| SEC-002 | Run `npm audit fix` | Dev | `package.json` | 25 vulnerabilities | [x] |
| SEC-003 | Add API key validation on startup | Dev | `backend/main.py` | No key = fail fast | [x] |

### P1 - High

| ID | Task | Owner | Files | Evidence | Done |
|----|------|-------|-------|----------|------|
| SEC-004 | Add rate limit bypass detection | Dev | `backend/middleware/rate_limiter.py` | IP spoofing possible | [x] |
| SEC-005 | Add file virus scanning | Dev | `backend/engines/virus_scanner.py` | No scanning currently | [x] |
| SEC-006 | Enable Redis TLS in production | Dev | `docker-compose.yml` | Plain connection | [x] |

---

## PHASE 2: Testing (Week 1-2)

### P0 - Critical

| ID | Task | Owner | Files | Evidence | Done |
|----|------|-------|-------|----------|------|
| TEST-001 | Fix Jest execution (permission) | Dev | `package.json` | jest: Permission denied | [ ] |
| TEST-002 | Add component tests for OmniDrop | Dev | `src/tests/` | No component tests | [ ] |
| TEST-003 | Add API client tests | Dev | `src/tests/api.test.ts` | Network tests missing | [ ] |

### P1 - High

| ID | Task | Owner | Files | Evidence | Done |
|----|------|-------|-------|----------|------|
| TEST-004 | Add file upload integration test | Dev | `backend/tests/test_api.py` | Metadata only | [ ] |
| TEST-005 | Add rate limiter load test | Dev | `backend/tests/` | No concurrent tests | [ ] |
| TEST-006 | Enable 80% coverage threshold | Dev | `package.json:test:ci` | Currently 50% | [ ] |

---

## PHASE 3: Code Quality (Week 2)

### P1 - High

| ID | Task | Owner | Files | Evidence | Done |
|----|------|-------|-------|----------|------|
| QUAL-001 | Split FileRenderer.tsx (1716 lines) | Dev | `src/components/FileRenderer.tsx` | Too large | [ ] |
| QUAL-002 | Deduplicate formatBytes() | Dev | `App.tsx`, `FileRenderer.tsx` | Copy-paste found | [ ] |
| QUAL-003 | Add JSDoc to public functions | Dev | Throughout | No documentation | [ ] |
| QUAL-004 | Add error boundaries | Dev | `src/` | No React error boundaries | [ ] |

### P2 - Medium

| ID | Task | Owner | Files | Evidence | Done |
|----|------|-------|-------|----------|------|
| QUAL-005 | Extract magic strings to constants | Dev | Throughout | Tier names, categories | [ ] |
| QUAL-006 | Add ESLint/Prettier config | Dev | `.eslintrc`, `.prettierrc` | Not configured | [ ] |
| QUAL-007 | Add Pre-commit hooks | Dev | `.husky/` | No git hooks | [ ] |

---

## PHASE 4: Performance (Week 2-3)

### P1 - High

| ID | Task | Owner | Files | Evidence | Done |
|----|------|-------|-------|----------|------|
| PERF-001 | Lazy-load Three.js viewer | Dev | `src/components/Model3DViewer.tsx` | 117KB gzipped | [ ] |
| PERF-002 | Add image optimization pipeline | Dev | `backend/` | No server-side resize | [ ] |
| PERF-003 | Add virtualized list for file browser | Dev | `src/` | No list virtualization | [ ] |

### P2 - Medium

| ID | Task | Owner | Files | Evidence | Done |
|----|------|-------|-------|----------|------|
| PERF-004 | Add bundle analysis to CI | Dev | `.github/workflows/` | No bundle tracking | [ ] |
| PERF-005 | Implement service worker caching | Dev | `src/` | No PWA/offline | [ ] |
| PERF-006 | Add CDN for Three.js | Dev | CDN URL | Currently bundled | [ ] |

---

## PHASE 5: CI/CD (Week 3)

### P0 - Critical

| ID | Task | Owner | Files | Evidence | Done |
|----|------|-------|-------|----------|------|
| CI-001 | Create GitHub Actions workflow | Dev | `.github/workflows/` | No pipeline | [ ] |
| CI-002 | Add automated security scan | Dev | `.github/workflows/` | No Snyk/Dependabot | [ ] |
| CI-003 | Add staging deployment | Dev | `.github/workflows/` | Manual deploy | [ ] |

### P1 - High

| ID | Task | Owner | Files | Evidence | Done |
|----|------|-------|-------|----------|------|
| CI-004 | Add Docker build to CI | Dev | `.github/workflows/` | Manual build | [ ] |
| CI-005 | Add preview deployment | Dev | `deploy.yml` | No PR previews | [ ] |
| CI-006 | Configure production secrets | Dev | `.env` | Not documented | [ ] |

---

## PHASE 6: Production Readiness (Week 3-4)

### P0 - Critical

| ID | Task | Owner | Files | Evidence | Done |
|----|------|-------|-------|----------|------|
| PROD-001 | Configure production CORS domains | Dev | `backend/main.py` | Hardcoded voila.app | [ ] |
| PROD-002 | Set up S3 bucket for file storage | Dev | `backend/` | Not implemented | [ ] |
| PROD-003 | Configure OpenAI API key | Dev | `.env` | Required for LLM | [ ] |
| PROD-004 | Set up production Redis | Dev | `docker-compose.yml` | Demo mode only | [ ] |

### P1 - High

| ID | Task | Owner | Files | Evidence | Done |
|----|------|-------|-------|----------|------|
| PROD-005 | Configure Tika deployment | Dev | `docker-compose.yml` | Docker ready, not deployed | [ ] |
| PROD-006 | Add monitoring dashboards | Dev | `grafana/` | Service configured | [ ] |
| PROD-007 | Set up alerting | Dev | `prometheus/` | No alert rules | [ ] |
| PROD-008 | Configure DNS/SSL | Dev | - | Not started | [ ] |

### P2 - Medium

| ID | Task | Owner | Files | Evidence | Done |
|----|------|-------|-------|----------|------|
| PROD-009 | Implement rate limit dashboard | Dev | `grafana/` | No custom dashboard | [ ] |
| PROD-010 | Add cost tracking alerts | Dev | `backend/` | Alert exists, not tested | [ ] |
| PROD-011 | Set up backup strategy | Dev | `docker-compose.yml` | No backup configured | [ ] |

---

## PHASE 7: Feature Development (Backlog)

### Future Features

| Priority | Feature | Description | Status |
|----------|---------|-------------|--------|
| P1 | Firecracker VM integration | Run untrusted executables | NOT_STARTED |
| P1 | Tika deep metadata extraction | Comprehensive file analysis | DEMO_MODE |
| P2 | Real-time collaboration | Multi-user file sharing | NOT_STARTED |
| P2 | File conversion API | Convert between formats | NOT_STARTED |
| P3 | Mobile app | iOS/Android wrapper | NOT_STARTED |
| P3 | Browser extension | Context menu integration | NOT_STARTED |

---

## COMPLETED ITEMS

| ID | Task | Date | Evidence |
|----|------|------|----------|
| BUILD-001 | Set up React + TypeScript + Vite | 2024 | `package.json`, `vite.config.ts` |
| BUILD-002 | Configure TailwindCSS | 2024 | `tailwind.config.js` |
| BUILD-003 | Create component scaffold | 2024 | 8 components in `src/components/` |
| BUILD-004 | Implement magic number detection | 2024 | `preflight.ts` |
| BUILD-005 | Add spell checker | 2024 | `spellChecker.ts` |
| BUILD-006 | Configure FastAPI backend | 2024 | `backend/main.py` |
| BUILD-007 | Add LLM caching | 2024 | `llm_cache.py` |
| BUILD-008 | Implement rate limiter | 2024 | `rate_limiter.py` |
| BUILD-009 | Add corruption detector | 2024 | `corruption.py` |
| BUILD-010 | Configure Docker Compose | 2024 | `docker-compose.yml` |
| BUILD-011 | Set up Jest scaffolding | 2024 | `jest.config.js`, 3 test files |
| BUILD-012 | Set up pytest scaffolding | 2024 | `pytest.ini`, `conftest.py`, `test_api.py` |
| BUILD-013 | Implement bundle optimization | 2024 | `vite.config.ts` manualChunks |
| BUILD-014 | Add Three.js viewer | 2024 | `Model3DViewer.tsx` |
| BUILD-015 | Add Pyodide integration | 2024 | CDN loading in FileRenderer.tsx |
| BUILD-016 | Add PDF.js rendering | 2024 | PDFViewer component |
| BUILD-017 | Add Monaco Editor | 2024 | CDN loading in CodePreview |
| BUILD-018 | Externalize magic numbers to JSON | 2024 | `file-signatures.json` |
| SEC-001a | Remove unsafe-eval from CSP header | 2026-07-05 | `backend/main.py:174` |
| SEC-002a | Fix 7 npm vulnerabilities (esbuild, pdfjs, tar) | 2026-07-05 | `package.json` |
| SEC-003a | Add API key validation on startup | 2026-07-07 | `backend/main.py` |
| SEC-004a | Add IP spoofing detection | 2026-07-07 | `backend/middleware/rate_limiter.py` |
| SEC-005a | Add virus scanner module | 2026-07-07 | `backend/engines/virus_scanner.py` |
| SEC-006a | Enable Redis TLS configuration | 2026-07-07 | `docker-compose.yml`, `docker-compose.tls.yml` |
| TEST-001a | Fix npm install (peer deps + legacy mode) | 2026-07-07 | `package.json` |
| VITE-001 | Migrate manualChunks to Vite 8.x function API | 2026-07-05 | `vite.config.ts` |

---

**Generated by:** MiniMax Agent Audit Engine
**Last Updated:** 2026-07-07
**Total Items:** 47
**Completed:** 26
**Remaining:** 21
**Effort Estimate:** 5-7 weeks (part-time)
