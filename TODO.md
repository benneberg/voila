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

PHASE 8: Review Findings & Product Integrity

P0 - Critical

ID	Task	Owner	Files	Evidence	Done
REVIEW-001	Fix OpenAI demo-mode contradiction	Dev	backend/main.py, .env.example	OPENAI_API_KEY is documented as optional but startup validation currently treats it as required	[ ]
REVIEW-002	Remove public access to cost tracking endpoint	Dev	backend/main.py	/api/v1/cost/{ip_address} accepts arbitrary IPs and exposes operational/cost data	[ ]
REVIEW-003	Restrict operational statistics endpoint	Dev	backend/main.py	/api/v1/stats should be admin/authenticated only	[ ]
REVIEW-004	Make upload processing memory-safe	Dev	backend/main.py, upload pipeline	await file.read() can load up to the full 500 MB request into memory	[ ]
REVIEW-005	Add upload concurrency, timeout, quota, and storage limits	Dev	backend/, middleware	Large/concurrent uploads can exhaust server resources	[ ]
REVIEW-006	Make product claims match implemented capabilities	Dev	README.md, UI, API docs	Tika, Firecracker, S3/TTL and deep analysis are currently partially simulated or not implemented	[ ]

P1 - High

ID	Task	Owner	Files	Evidence	Done
REVIEW-007	Replace simulated metadata extraction with real file-backed extraction	Dev	backend/main.py, backend/engines/	Metadata endpoint currently operates from supplied metadata rather than inspecting uploaded bytes	[ ]
REVIEW-008	Replace simulated corruption detection with byte-level validation	Dev	backend/engines/corruption.py, API	Current corruption result can be based on file type rather than actual file contents	[ ]
REVIEW-009	Implement real S3 upload and lifecycle/TTL deletion	Dev	backend/, docker-compose.yml	Upload endpoint currently does not persist files to production storage	[ ]
REVIEW-010	Implement real sandbox execution pipeline before advertising Firecracker	Dev	backend/engines/, Firecracker infrastructure	Tier 3 currently detects executable formats but does not provide the promised isolated execution pipeline	[ ]
REVIEW-011	Clearly distinguish verified, inferred, and simulated metadata in the UI	Dev	src/components/, src/lib/fileProcessor.ts	Several displayed properties are inferred from extensions/headers rather than actually parsed	[ ]
REVIEW-012	Replace heuristic PDF metadata parsing with PDF.js-backed parsing	Dev	src/lib/fileProcessor.ts, PDFViewer	/Count search and first-2KB inspection are not reliable PDF parsing	[ ]
REVIEW-013	Replace hand-written CSV parser with standards-compliant parser	Dev	src/lib/fileProcessor.ts	line.split(',') fails quoted fields, escaped quotes, embedded commas and multiline records	[ ]
REVIEW-014	Replace toy YAML parser with standards-compliant YAML parser	Dev	src/lib/fileProcessor.ts	Current parser only handles simple key: value lines	[ ]
REVIEW-015	Add authoritative parsing for core supported formats	Dev	src/lib/, backend/engines/	Prioritize 10–15 common formats with real parsers instead of broad but shallow format coverage	[ ]
REVIEW-016	Add integration tests for actual file bytes through the complete pipeline	Dev	backend/tests/, src/tests/	Existing coverage does not adequately verify upload → detection → processing → result	[ ]
REVIEW-017	Add adversarial/malformed-file test corpus	Dev	tests/fixtures/	Universal file handling needs malformed, truncated, mislabeled and polyglot file cases	[ ]
REVIEW-018	Add security tests for executable and malicious file handling	Dev	backend/tests/, tests/fixtures/	Tier 3 and virus-scanning claims require tested hostile inputs	[ ]

P2 - Medium

ID	Task	Owner	Files	Evidence	Done
REVIEW-019	Improve image metadata extraction accuracy	Dev	src/lib/fileProcessor.ts, image engines	Current image properties such as alpha/color/bit-depth can be inferred rather than verified	[ ]
REVIEW-020	Add explicit metadata provenance to API responses	Dev	backend/, API schemas	Consumers need to know whether a value was detected, parsed, inferred or simulated	[ ]
REVIEW-021	Add first-time-user value proposition to OmniDrop	Dev	src/components/OmniDrop.tsx	Current UI is elegant but does not immediately explain why users should upload a file	[ ]
REVIEW-022	Add Expert Mode for deep technical metadata	Dev	src/components/, src/lib/	Expert users need hashes, MIME, magic bytes, parser, container, compression, EXIF and security details	[ ]
REVIEW-023	Split processing states into explicit authoritative pipeline stages	Dev	src/App.tsx, src/lib/fileProcessor.ts	Preserve Preflight → Magic → Routing → Processing → Complete architecture while making each stage observable and accurate	[ ]
REVIEW-024	Add confidence/status indicators for analysis results	Dev	src/components/, API schemas	Surface confidence and parser status instead of presenting heuristics as facts	[ ]
REVIEW-025	Establish supported-format quality tiers	Dev	README.md, src/lib/, tests	Define which formats are fully parsed, partially inspected, or signature-only	[ ]
REVIEW-026	Update audit documentation to reflect verified implementation state	Dev	AUDIT.md, TESTING_DELTA.md	Audit currently contains claims stronger than the implementation; reconcile audit evidence with actual behavior	[ ]
REVIEW-027	Add end-to-end production smoke tests	Dev	.github/workflows/, backend/tests/, src/tests/	Verify deployed upload, processing, metadata and failure paths rather than only unit behavior	[ ]
REVIEW-028	Add observability for processing failures by file type and engine	Dev	backend/, Prometheus/Grafana	Need visibility into parser failures, timeouts, rejected files and engine reliability	[ ]
REVIEW-029	Document security boundaries for every processing tier	Dev	README.md, docs/	Users and operators need explicit guarantees about browser, container and VM isolation	[ ]
REVIEW-030	Add regression tests for mislabeled and extensionless files	Dev	tests/fixtures/, backend/tests/, src/tests/	Magic-number detection is a core product capability and needs systematic regression coverage	[ ]

⸻

PHASE 9: Trust & UX

P1 - High

ID	Task	Owner	Files	Evidence	Done
UX-001	Add clear “what happens to my file?” explanation	Dev	src/components/, landing UI	File upload requires a clear privacy/storage/processing explanation	[ ]
UX-002	Show whether a file leaves the browser	Dev	src/components/, processing pipeline	Users need to know when processing is local versus server-side	[ ]
UX-003	Show automatic deletion/storage policy in results	Dev	src/components/, backend	Storage and TTL behavior must be visible once implemented	[ ]
UX-004	Add processing provenance panel	Dev	src/components/	Show engine, parser, tier, verification status and confidence for each result	[ ]
UX-005	Add graceful unsupported-file experience	Dev	src/components/, src/lib/	Unsupported formats should explain what was detected and what can/cannot be analyzed	[ ]

⸻

PHASE 10: Product Definition

P0 - Critical

ID	Task	Owner	Files	Evidence	Done
PROD-012	Define the authoritative Voila processing contract	Dev	docs/, README.md, API schemas	Explicitly define what “identify”, “inspect”, “analyze”, “convert” and “execute” mean	[ ]
PROD-013	Define minimum production-quality format matrix	Dev	docs/supported-formats.md	Establish fully supported vs partial vs detection-only formats	[ ]

P1 - High

ID	Task	Owner	Files	Evidence	Done
PROD-014	Make 10–15 priority formats production-grade before expanding format count	Dev	src/lib/, backend/engines/, tests	Favor correctness and trust over breadth	[ ]
PROD-015	Define measurable processing correctness criteria	Dev	docs/, tests	Every supported format needs objective parsing/validation expectations	[ ]
PROD-016	Define sandbox threat model	Dev	docs/security/	Specify attacker capabilities, isolation guarantees, escape assumptions and resource limits	[ ]
PROD-017	Define file-processing resource policy	Dev	docs/, backend config	Establish maximum size, CPU, memory, execution time, recursion depth and decompression limits	[ ]

⸻

REVIEW PRIORITY

The review findings should be worked in this order:

1. Correct misleading production/security claims
2. Make upload handling resource-safe
3. Protect operational/admin endpoints
4. Make core metadata and corruption analysis real
5. Make PDF/CSV/YAML parsing authoritative
6. Build end-to-end and adversarial test coverage
7. Implement the real sandbox/storage architecture
8. Add provenance/confidence information to the UI
9. Make the 10–15 highest-value formats production-grade
10. Only then expand breadth and add major features

Recommended definition of “production ready”

Voila should not be considered production-ready until:

* Demo-mode behavior is genuinely optional and documented correctly
* No public endpoint exposes internal cost/statistics data
* Large uploads are streamed and resource-limited
* Uploaded files have defined storage/deletion guarantees
* Metadata results are derived from actual file contents
* Corruption detection validates actual file contents
* PDF/CSV/YAML processing uses real parsers
* Executable handling has a real, tested isolation boundary
* Core formats have end-to-end tests
* Malformed/adversarial files are covered by regression tests
* UI distinguishes verified, inferred and simulated results
* Documentation and audit reports match the implementation
* Processing behavior is observable in production
* The supported-format matrix has explicit quality levels
