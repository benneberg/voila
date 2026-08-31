# ARCHITECTURE.md — Voila!

This document describes the current implemented architecture.
Planned features are tracked as GitHub issues, not documented here.

---

## Components

### Frontend (`src/`)

| Module | Responsibility | Notes |
|---|---|---|
| `App.tsx` | Application shell, file-drop state machine | Owns `ProcessingResult`, tier badge, expert mode toggle |
| `OmniDrop.tsx` | Drag-and-drop zone, file validation | Calls `preflight.ts` before accepting a file |
| `FileRenderer.tsx` | Dispatches to 12 preview sub-renderers | Image, video, audio, code, PDF, 3D, data, binary, executable, text, archive, document |
| `Model3DViewer.tsx` | Three.js 3D rendering | OBJ, STL, GLTF/GLB — falls back to placeholder on load failure |
| `ExpertPanel.tsx` | Deep metadata display | Toggle-able; shows magic bytes, MIME, tier, processing time |
| `PipelineVisualizer.tsx` | Processing stage animation | Visual only — not a real pipeline observable |
| `ErrorBoundary.tsx` | React error boundary | Catches render errors; dev mode shows stack trace |
| `lib/preflight.ts` | Magic number detection and tier routing | Reads 512-byte file header; matches against `file-signatures.json` |
| `lib/fileProcessor.ts` | Per-type processing pipeline | Returns `ProcessingResult` with type, content, metadata, processingTime |
| `lib/spellChecker.ts` | Filename extension spell-checker | Levenshtein distance; `SpellChecker` class + `checkFilenameSpelling` function |
| `lib/api.ts` | FastAPI client | Wraps fetch; handles demo-mode fallback |
| `data/file-signatures.json` | Magic-byte signature database | 46 signatures, 9 categories, textPatterns, corruptionRules |

### Backend (`backend/`)

| Module | Responsibility | Notes |
|---|---|---|
| `main.py` | FastAPI app, all endpoints, middleware | CORS, security headers, rate limiting, demo-mode fallback |
| `engines/llm_cache.py` | AI response cache | SHA-256 hash → Redis → OpenAI; 30-day TTL |
| `engines/corruption.py` | File integrity checks | JPEG SOI/EOI, PDF header, binary signature checks |
| `middleware/rate_limiter.py` | Per-IP rate limiting and cost tracking | Redis with in-memory fallback |

### Infrastructure

| Service | Purpose | Port | Required |
|---|---|---|---|
| nginx | Frontend serving + API proxy | 80 | Production |
| FastAPI (uvicorn) | Backend API | 8000 | Optional (demo mode works without) |
| Redis | Caching + rate limiting | 6379 | Optional (in-memory fallback) |
| Apache Tika | Deep metadata extraction | 9998 | Optional (demo mode) |
| Prometheus | Metrics scraping | 9090 | Optional |
| Grafana | Dashboards | 3000 | Optional |

---

## Data flow

### Tier 0 — Pre-flight (always runs, client-side)

Every file passes through this before anything else:

```
File object
    │
    ├─ checkFilenameSpelling()      # Levenshtein check on extension
    │
    ├─ detectTrueFileType()         # Read 512-byte header
    │   ├─ Match against file-signatures.json
    │   ├─ Set isSuspicious if ext ≠ detected type
    │   └─ Run corruption check (JPEG / PDF)
    │
    └─ determineTier()              # Route to tier1 / tier2 / tier3
```

### Tier 1 — Browser processing

Runs entirely in the browser, no network required:

```
processFile(file, category)
    │
    ├─ image     → processImage()    # URL.createObjectURL + EXIF extraction
    ├─ video     → processVideo()    # createObjectURL + thumbnail
    ├─ audio     → processAudio()    # createObjectURL + WaveSurfer
    ├─ pdf       → processPDF()      # PDF.js CDN
    ├─ code      → processCode()     # Monaco CDN + optional Pyodide execution
    ├─ model3d   → process3DModel()  # Three.js
    ├─ data      → processData()     # CSV/JSON/XML table rendering
    ├─ archive   → processArchive()  # TOC extraction from magic bytes
    └─ *         → processUnknown()  # Hex dump + binary stats
```

### Tier 2 — Backend processing (requires deployed backend)

```
Frontend  →  POST /api/v1/file/upload         # multipart, returns hash
          →  POST /api/v1/metadata/extract    # hash + type → metadata
          →  POST /api/v1/analyze/code        # hash → cached LLM response
```

Backend in demo mode (no Redis, no OpenAI, no Tika) returns plausible placeholder responses.

### Tier 3 — Sandboxed execution (roadmap)

Routing exists: `determineTier()` returns `'tier3'` for ELF, PE, DLL, and related formats. No VM execution is implemented.

---

## State management

No external state library. `App.tsx` owns all state via `useState`:

| State | Type | Purpose |
|---|---|---|
| `result` | `ProcessingResult \| null` | Current file's processing output |
| `isProcessing` | `boolean` | Loading indicator |
| `expertMode` | `boolean` | Shows/hides ExpertPanel |
| `error` | `string \| null` | User-visible error message |

`ProcessingResult` is the single output type from the processing pipeline:

```typescript
interface ProcessingResult {
  type: string;             // 'image' | 'video' | 'audio' | 'code' | ...
  content: string;          // URL or text content
  metadata: Record<string, string | number | boolean>;
  processingTime: number;   // ms
  warnings?: string[];      // isSuspicious warnings, corruption issues
}
```

---

## Security boundaries

| Boundary | Implementation |
|---|---|
| CORS | Explicit `CORS_ALLOWED_ORIGINS` env var; no wildcard in production |
| Security headers | X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy, CSP (no unsafe-eval) |
| Input validation | Pydantic models on all POST bodies; SHA-256 hash format enforced |
| Rate limiting | Per-IP, Redis-backed with in-memory fallback |
| File size | 50 MB (Tier 1), 500 MB (Tier 2) enforced at upload |
| Executable files | Routed to Tier 3 — currently rejected with a warning (no execution) |

**Known limitations:**
- `/api/v1/cost/{ip}` and `/api/v1/stats` are unauthenticated — do not expose publicly without authentication
- Upload handler buffers the full file in memory (`await file.read()`) — risk for large Tier 2 files
- No virus scanning in the upload pipeline

---

## Observability

**Implemented:**
- `GET /health` — returns `{status, redis, openai, tika}` with live service checks
- Prometheus scrape config (`monitoring/prometheus.yml`)
- 9 alerting rules (`monitoring/alerts.yml`) — API health, processing failures, memory, disk, queue depth
- Grafana dashboard provisioned (`monitoring/grafana/`) — 8 panels

**Not verified as deployed:** Prometheus and Grafana are configured for Docker Compose but not confirmed running in any production environment.

---

## Build and bundle

```
dist/
├── vendor-react.js      132 KB gzip: 43 KB   # React + ReactDOM
├── vendor-motion.js     113 KB gzip: 37 KB   # Framer Motion
├── vendor-three.js      477 KB gzip: 120 KB  # Three.js
├── vendor-icons.js       19 KB gzip:  7 KB   # Lucide React
├── rolldown-runtime.js    1 KB gzip:  1 KB
└── index.js             138 KB gzip: 36 KB   # Application code
```

CDN-loaded (not in bundle): Monaco Editor, PDF.js, Pyodide, WaveSurfer.js.

---

## Architectural invariants

These must hold across changes:

1. **Tier 0 always runs.** Magic number detection and tier routing happen before any preview or backend call.
2. **Tier 1 requires no network.** All browser-tier processing must work offline.
3. **Backend is always optional.** The frontend degrades gracefully when the backend is unreachable.
4. **`ProcessingResult` is the single output type.** All processing paths return this shape or throw.
5. **No secrets in the frontend bundle.** API keys exist only in backend environment variables.

---

## Testing boundaries

| Layer | Framework | What is tested |
|---|---|---|
| `src/lib/` | Jest + ts-jest | Magic number detection, tier routing, spell-checking, file categorisation |
| `backend/` | pytest | All API endpoints, input validation, security headers, CORS, demo-mode fallback |
| Components | Not tested | No React Testing Library tests exist yet |
| Integration | Not tested | No end-to-end tests with real file bytes |
