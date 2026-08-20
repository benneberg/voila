# ARCHITECTURE.md

## System Architecture

---

## 1. COMPONENTS

### Frontend (React/TypeScript)

| Component | Responsibility | Location | Status |
|-----------|----------------|----------|--------|
| `App.tsx` | Main application shell, state management | `src/App.tsx` | ACTIVE |
| `OmniDrop.tsx` | File upload dropzone | `src/components/` | ACTIVE |
| `FileRenderer.tsx` | Dynamic file preview (12 types) | `src/components/` | ACTIVE |
| `Model3DViewer.tsx` | Three.js 3D rendering | `src/components/` | ACTIVE |
| `ExpertPanel.tsx` | Metadata display | `src/components/` | ACTIVE |
| `PipelineVisualizer.tsx` | Processing status | `src/components/` | ACTIVE |
| `ArchitectureDiagram.tsx` | System diagram | `src/components/` | ACTIVE |
| `preflight.ts` | Magic number detection | `src/lib/` | ACTIVE |
| `fileProcessor.ts` | File processing pipeline | `src/lib/` | ACTIVE |
| `spellChecker.ts` | Filename validation | `src/lib/` | ACTIVE |
| `api.ts` | Backend API client | `src/lib/` | ACTIVE |

### Backend (Python/FastAPI)

| Component | Responsibility | Location | Status |
|-----------|----------------|----------|--------|
| `main.py` | API endpoints, CORS, middleware | `backend/main.py` | ACTIVE |
| `llm_cache.py` | AI response caching | `backend/engines/` | DEMO_MODE |
| `corruption.py` | File integrity checks | `backend/engines/` | ACTIVE |
| `rate_limiter.py` | Cost tracking, rate limits | `backend/middleware/` | ACTIVE |

### Infrastructure (Docker)

| Service | Purpose | Port | Status |
|---------|---------|------|--------|
| voila-api | FastAPI application | 8000 | ACTIVE |
| redis | Caching, rate limiting | 6379 | ACTIVE |
| tika | Deep metadata extraction | 9998 | DEMO_MODE |
| prometheus | Metrics collection | 9090 | CONFIGURED |
| grafana | Dashboards | 3000 | CONFIGURED |

---

## 2. DATA FLOW

### Primary Flow: File Upload

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                            │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     TIER 0: PRE-FLIGHT (Client)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │ Spell Check │→ │ Magic Num   │→ │ Tier Router │→ │ Validation  │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ TIER 1        │     │ TIER 2        │     │ TIER 3        │
│ (Browser)     │     │ (Docker)      │     │ (Firecracker) │
│ - Images      │     │ - Archives    │     │ - Executables │
│ - Video       │     │ - Large files │     │ - ELF/DLL     │
│ - Audio       │     │ - Documents   │     │ - Unknown     │
│ - Code        │     │ - Data        │     │               │
│ - PDF         │     │               │     │               │
└───────────────┘     └───────┬───────┘     └───────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND (FastAPI)                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐│
│  │ Rate Limit  │→ │ Validation  │→ │ Processing  │→ │ Response    ││
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘│
└─────────────────────────────┬───────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│    Redis      │     │    Tika       │     │    OpenAI     │
│ (Caching)     │     │ (Metadata)    │     │ (LLM Cache)   │
└───────────────┘     └───────────────┘     └───────────────┘
```

**Source of Truth:** File content (processed), Magic numbers (detected)

### Secondary Flow: AI Code Analysis

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ Frontend      │────▶│ FastAPI       │────▶│ OpenAI        │
│ (User Code)   │     │ (Validation)  │     │ (gpt-4o-mini) │
└───────────────┘     └───────┬───────┘     └───────────────┘
                              │
                              ▼
                      ┌───────────────┐
                      │ Redis         │
                      │ (SHA-256 Hash)│
                      └───────────────┘
```

**Source of Truth:** Code hash (deterministic)

---

## 3. INTEGRATIONS

### External Services

| Service | Integration | Status | Config |
|---------|-------------|--------|--------|
| OpenAI | Code explanation | DEMO_MODE | `OPENAI_API_KEY` env |
| Redis | Caching, rate limits | DEMO_MODE | `REDIS_URL` env |
| S3 | File storage | NOT_IMPLEMENTED | Planned |
| AWS Firecracker | VM execution | STUB | Planned |

### CDN Dependencies

| Library | Purpose | Version | Loading |
|---------|---------|---------|---------|
| Monaco Editor | Code editing | 0.45.0 | CDN |
| PDF.js | PDF rendering | 4.0.379 | CDN |
| Pyodide | Python runtime | 0.24.1 | CDN |
| WaveSurfer.js | Audio waveforms | 7 | CDN |
| Three.js | 3D rendering | 0.162 | Bundled |
| Framer Motion | Animations | 11 | Bundled |

---

## 4. DEPLOYMENT MODEL

### Current (Demo Mode)

```
┌─────────────────────────────────────────────────────────────┐
│                     CLOUD (Vercel/Netlify)                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                 Frontend (Static)                   │    │
│  │  React + TypeScript + TailwindCSS                    │    │
│  │  - OmniDrop                                          │    │
│  │  - FileRenderer                                      │    │
│  │  - WASM Processing (Pyodide, PDF.js)                │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────┬───────────────────────────────┘
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  LOCAL (Docker Compose)                     │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ voila-api  │  │   redis    │  │    tika    │            │
│  │  FastAPI   │  │   Cache    │  │  Metadata  │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

**Evidence:** `docker-compose.yml` defines all services

### Target (Production)

```
┌─────────────────────────────────────────────────────────────┐
│                     CDN (CloudFront)                        │
│  Static assets, Monaco CDN, PDF.js CDN                      │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────┐
│                  ECS Fargate (Auto-scaling)                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              voila-api (FastAPI)                     │    │
│  │  - Auto-scaling (2-10 instances)                    │    │
│  │  - 512MB RAM limit                                  │    │
│  │  - Health checks                                     │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────┬───────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  ElastiCache  │     │      S3       │     │  EC2 Spot     │
│  (Redis)      │     │ (File Store)  │     │ (Firecracker) │
│  $12/mo       │     │ $0.46/mo     │     │ $45/mo       │
└───────────────┘     └───────────────┘     └───────────────┘
```

---

## 5. OBSERVABILITY

### Logging

| Component | Implementation | Level |
|-----------|----------------|-------|
| Frontend | `console.error` | ERROR |
| Backend | Python `logging` module | INFO |
| API | Structured JSON logs | INFO |

### Metrics

| Metric | Collection | Dashboard |
|--------|------------|-----------|
| Request count | Prometheus counter | Grafana |
| Latency | Prometheus histogram | Grafana |
| Error rate | Prometheus counter | Grafana |
| Cost accumulation | Redis | Custom |
| Rate limit hits | Redis | Custom |

**Evidence:** `prometheus.yml` configured, `docker-compose.yml` includes prometheus/grafana

### Health Checks

| Endpoint | Purpose | Response |
|----------|---------|----------|
| `GET /health` | Service health | `{status, redis, openai, tika}` |
| `GET /` | API info | `{name, version}` |

---

## 6. RISKS

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| CSP blocks Monaco CDN | LOW | HIGH | Review unsafe-eval necessity |
| Redis unavailable | MEDIUM | MEDIUM | In-memory fallback implemented |
| LLM API costs explode | MEDIUM | HIGH | Redis caching, 30-day TTL |
| Tika memory leak | MEDIUM | MEDIUM | 1GB hard limit in Docker |
| Firecracker complexity | HIGH | HIGH | Not implemented yet |

### Security Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Malicious file upload | HIGH | HIGH | Sandboxing, tier 3 routing |
| Path traversal | LOW | HIGH | Input validation (Pydantic) |
| XSS via file content | MEDIUM | HIGH | CSP, sanitization |
| Rate limit bypass | MEDIUM | MEDIUM | IP validation |
| API key exposure | LOW | CRITICAL | Environment variables |

### Operational Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| CDN dependency failure | LOW | MEDIUM | Bundled fallbacks exist |
| AWS costs exceed budget | MEDIUM | HIGH | Cost alerts, tier limits |
| Data privacy (GDPR) | LOW | HIGH | No persistent storage |

---

## 7. IMPROVEMENTS

### Short-term (1-4 weeks)

| Improvement | Priority | Effort |
|-------------|----------|--------|
| Fix CSP unsafe-eval | P0 | 1 hour |
| Add component tests | P1 | 1 week |
| Lazy-load Three.js | P1 | 2 hours |
| Set up CI/CD pipeline | P1 | 1 week |

### Medium-term (1-3 months)

| Improvement | Priority | Effort |
|-------------|----------|--------|
| Implement Firecracker VMs | P1 | 2 months |
| Add Tika integration | P1 | 1 week |
| Set up S3 storage | P2 | 1 week |
| Add E2E tests | P2 | 1 week |

### Long-term (3+ months)

| Improvement | Priority | Effort |
|-------------|----------|--------|
| Mobile app | P3 | 3 months |
| Browser extension | P3 | 2 months |
| Real-time collaboration | P3 | 2 months |
| File conversion API | P3 | 1 month |

---

## 8. ARCHITECTURE CONFIDENCE

| Section | Confidence | Evidence |
|---------|------------|----------|
| Components | HIGH | All listed components exist in code |
| Data flow | HIGH | Traced through code execution |
| Integrations | HIGH | CDN URLs verified, APIs defined |
| Deployment | MEDIUM | Docker configured, not production-tested |
| Observability | MEDIUM | Prometheus/Grafana configured, not deployed |
| Risks | MEDIUM | Based on architecture review, no penetration test |
| Improvements | LOW | Inferred from gaps, no user feedback |

---

**Generated by:** MiniMax Agent Audit Engine
**Analysis Type:** Phase 2 - Architecture
**Confidence:** MEDIUM-HIGH
