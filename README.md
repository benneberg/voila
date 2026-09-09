<div align="center">

# Voila!

### Drop any file. Understand it instantly.

[![CI](https://github.com/benneberg/voila/actions/workflows/ci.yml/badge.svg)](https://github.com/benneberg/voila/actions/workflows/ci.yml)
[![Frontend Tests](https://img.shields.io/badge/frontend%20tests-108%20passing-brightgreen)](https://github.com/benneberg/voila/actions/workflows/ci.yml)
[![Backend Tests](https://img.shields.io/badge/backend%20tests-42%20passing-brightgreen)](https://github.com/benneberg/voila/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow)](LICENSE)

[![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python%203.11-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Three.js](https://img.shields.io/badge/Three.js-3D%20viewer-black?logo=threedotjs&logoColor=white)](https://threejs.org)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ed?logo=docker&logoColor=white)](docker-compose.yml)

<br/>

*Super minimalism meets extreme capability.*

<br/>

[Live Demo](https://benneberg.github.io/voila) · [Architecture](ARCHITECTURE.md) · [Changelog](CHANGELOG.md)

</div>

---

## What it does

Voila! identifies files by their **actual content** (magic bytes, not the extension), routes them to the right processing tier, and renders a contextual preview — from images and 3D models to executables and data files.

Everything the browser can handle stays in the browser. Nothing leaves your device unless you configure and deploy the backend.

---

## Capabilities

| Feature | Status |
|---|---|
| Magic number detection · 46 formats · 9 categories | ✅ |
| Extension / content mismatch warning | ✅ |
| File corruption checks (JPEG, PDF, PNG, ZIP, ELF) | ✅ |
| Image preview — zoom, fullscreen, EXIF metadata | ✅ |
| Code editor — Monaco, syntax highlighting, 20+ languages | ✅ |
| Python execution in the browser (Pyodide WASM) | ✅ |
| PDF rendering (PDF.js) | ✅ |
| 3D model viewer — OBJ, STL, GLTF/GLB (Three.js, lazy-loaded) | ✅ |
| Audio waveform preview (WaveSurfer.js) | ✅ |
| Video preview with thumbnail extraction | ✅ |
| RFC 4180-compliant CSV parsing (papaparse) | ✅ |
| Standards-compliant YAML parsing (js-yaml) | ✅ |
| Expert metadata panel with provenance labels | ✅ |
| Privacy-aware tier indicator (browser / cloud / VM) | ✅ |
| Filename spell-checker | ✅ |
| AI code explanations (GPT-4o-mini, Redis-cached) | ⚙️ Requires `OPENAI_API_KEY` |
| Deep metadata extraction (Apache Tika) | ⚙️ Requires deployed Tika |
| Sandboxed execution (Firecracker VMs) | 🗺️ Roadmap |

---

## Architecture

Three processing tiers based on file type and size:

```
File dropped
     │
     ▼
┌──────────────────────────────────┐
│  Tier 0 — Pre-flight (always)    │
│  Magic bytes · tier routing      │
│  Corruption check · spell check  │
└──────────┬───────────────────────┘
           │
     ┌─────┴────────┬──────────────────┐
     ▼              ▼                  ▼
  Tier 1         Tier 2            Tier 3
  Browser        Docker/API        Roadmap
  ≤ 50 MB        ≤ 500 MB          ≤ 2 GB
  WASM           Tika              Firecracker
  Images         Archives          Executables
  Code           Documents         ELF / DLL
  Audio/Video    Data files
  PDF / 3D
```

Full component breakdown, data flow, and invariants → **[ARCHITECTURE.md](ARCHITECTURE.md)**

---

## Getting started

### Prerequisites

- Node.js 20+
- Python 3.11+ *(backend only)*
- Docker + Docker Compose *(full stack only)*

### Frontend only — no backend needed

```bash
git clone https://github.com/benneberg/voila
cd voila
npm install --legacy-peer-deps
npm run dev
# → http://localhost:5173
```

The frontend runs in full demo mode without the backend. All processing happens locally in the browser via WASM.

### Full stack

```bash
# Copy and fill in the environment template
cp .env.production.template .env
# Required: SECRET_KEY, CORS_ORIGINS
# Optional: OPENAI_API_KEY, REDIS_URL

docker-compose up -d
```

| Service | URL |
|---|---|
| Frontend (nginx) | http://localhost:80 |
| Backend API | http://localhost:8000 |
| API docs (Swagger) | http://localhost:8000/docs |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3000 |

### Backend only (development)

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt

# Optional Redis
docker run -d -p 6379:6379 redis:alpine

uvicorn main:app --reload --port 8000
```

---

## Configuration

Copy `.env.production.template` → `.env`. The backend starts in demo mode with no configuration.

| Variable | Required | Description |
|---|---|---|
| `SECRET_KEY` | Production | `openssl rand -hex 32` |
| `OPENAI_API_KEY` | Optional | Enables AI code explanations |
| `REDIS_URL` | Optional | Caching + rate limiting |
| `CORS_ORIGINS` | Production | Comma-separated allowed origins |
| `VITE_API_URL` | Optional | Backend URL for frontend (default: `/api`) |
| `ADMIN_API_KEY` | Optional | Protects `/cost` and `/stats` endpoints |
| `RATELIMIT_ENABLED` | Optional | Set `0` to disable (e.g. in tests) |

---

## Testing

```bash
# Frontend — 108 tests
npm test

# Frontend with coverage report
npm run test:coverage

# Backend — 42 tests
cd backend && pytest tests/ -v

# Type-check only
npm run typecheck
```

Coverage is enforced in CI (60% branches / 65% functions / 70% lines on `src/lib/`).

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, TailwindCSS |
| Animation | Framer Motion |
| 3D viewer | Three.js (lazy-loaded) |
| Code editor | Monaco Editor (CDN) |
| PDF | PDF.js (CDN) |
| Python runtime | Pyodide (CDN) |
| Audio | WaveSurfer.js (CDN) |
| CSV parsing | papaparse (RFC 4180) |
| YAML parsing | js-yaml |
| Backend | FastAPI, Python 3.11 |
| Caching | Redis (optional) |
| Metadata | Apache Tika (optional) |
| Observability | Prometheus + Grafana |
| CI/CD | GitHub Actions |
| Serving | nginx (production) |

---

## Project structure

```
voila/
├── src/
│   ├── components/
│   │   ├── FileRenderer.tsx          # Dispatcher → 12 preview types
│   │   ├── renderers/                # Extracted sub-renderers (QUAL-001)
│   │   │   ├── AudioPreview.tsx
│   │   │   ├── VideoPreview.tsx
│   │   │   ├── DocumentPreview.tsx
│   │   │   ├── DataPreview.tsx
│   │   │   ├── SmallPreviews.tsx
│   │   │   └── shared.tsx
│   │   ├── OmniDrop.tsx              # Drop zone with privacy + tier UX
│   │   ├── Model3DViewer.tsx         # Three.js (lazy-loaded)
│   │   └── ExpertPanel.tsx           # Deep metadata panel
│   ├── lib/
│   │   ├── preflight.ts              # Magic number detection + tier routing
│   │   ├── fileProcessor.ts          # Per-type processing pipeline
│   │   ├── spellChecker.ts           # Filename extension checker
│   │   └── api.ts                    # Backend API client
│   ├── constants/index.ts            # TIERS, FILE_CATEGORIES, PROVENANCE
│   ├── utils/format.ts               # formatBytes, formatDuration
│   └── data/file-signatures.json     # 46 magic-byte signatures
├── backend/
│   ├── engines/
│   │   ├── corruption.py             # Real byte-level corruption checks
│   │   └── llm_cache.py              # AI response caching
│   ├── middleware/rate_limiter.py    # Per-IP rate limiting
│   ├── tests/                        # 42 pytest tests
│   └── main.py                       # FastAPI app
├── monitoring/
│   ├── prometheus.yml                # Scrape config
│   ├── alerts.yml                    # 9 alerting rules
│   └── grafana/                      # Auto-provisioned dashboard
├── deploy/
│   ├── nginx.conf                    # SPA routing + API proxy
│   └── start.sh                      # Combined entrypoint
├── .github/workflows/ci.yml          # CI pipeline
├── docker-compose.yml
├── Dockerfile
└── .env.production.template
```

---

## API

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | — | Service health + dependency status |
| `POST` | `/api/v1/file/upload` | — | Upload file; returns SHA-256 + detected type |
| `POST` | `/api/v1/metadata/extract` | — | Deep metadata from file hash |
| `POST` | `/api/v1/analyze/code` | — | AI code explanation (demo mode if no key) |
| `POST` | `/api/v1/diagnostics/corruption` | — | Real byte-level corruption check |
| `GET` | `/api/v1/cost/{ip}` | `X-Admin-Key` | Accumulated cost for an IP |
| `GET` | `/api/v1/stats` | `X-Admin-Key` | Usage statistics |

Interactive docs at `http://localhost:8000/docs` when the backend is running.

---

## License

MIT — see [LICENSE](LICENSE)
