<div align="center">

<br/>

<img src="https://raw.githubusercontent.com/benneberg/voila/main/src/assets/logotype-voila.jpg" alt="Voila!" width="72" height="72" />

# Voila!

**Drop any file. Understand it instantly.**

<br/>

[![CI](https://github.com/benneberg/voila/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/benneberg/voila/actions/workflows/ci.yml)
[![Deploy Demo](https://github.com/benneberg/voila/actions/workflows/pages.yml/badge.svg)](https://benneberg.github.io/voila)
[![Tests](https://img.shields.io/badge/tests-108%20passing-22c55e?logo=jest)](https://github.com/benneberg/voila/actions)
[![Backend](https://img.shields.io/badge/backend-42%20passing-22c55e?logo=pytest)](https://github.com/benneberg/voila/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-f59e0b)](LICENSE)

<br/>

[![React](https://img.shields.io/badge/React_18-61dafb?logo=react&logoColor=black)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Three.js](https://img.shields.io/badge/Three.js-black?logo=threedotjs)](https://threejs.org)
[![Vite](https://img.shields.io/badge/Vite_8-646cff?logo=vite&logoColor=white)](https://vitejs.dev)
[![Docker](https://img.shields.io/badge/Docker-2496ed?logo=docker&logoColor=white)](docker-compose.yml)

<br/>

**[→ Live Demo](https://benneberg.github.io/voila)** &nbsp;·&nbsp; [Architecture](ARCHITECTURE.md) &nbsp;·&nbsp; [Changelog](CHANGELOG.md)

<br/>

</div>

---

Voila! identifies files by their **actual content** — reading magic bytes, not trusting extensions. Drop any file and get a contextual preview: images, 3D models, code with execution, audio waveforms, data tables, executables. Everything the browser can handle stays in the browser. Nothing leaves your device unless you explicitly deploy the backend.

---

## Features

| | Feature |
|---|---|
| ✅ | **Magic number detection** — 46 formats, 9 categories |
| ✅ | **Extension/content mismatch warnings** — detects renamed files |
| ✅ | **File corruption checks** — JPEG SOI, PDF header/EOF, PNG sig, ZIP magic, ELF |
| ✅ | **Image preview** — zoom, fullscreen, rotation, EXIF metadata |
| ✅ | **Code editor** — Monaco, syntax highlighting, 20+ languages |
| ✅ | **Python execution in-browser** — Pyodide WASM, no server |
| ✅ | **PDF rendering** — PDF.js, page navigation, zoom |
| ✅ | **3D model viewer** — OBJ, STL, GLTF/GLB via Three.js (lazy-loaded) |
| ✅ | **Audio waveform** — WaveSurfer.js visualisation |
| ✅ | **Video preview** — thumbnail extraction |
| ✅ | **Tabular data** — RFC 4180 CSV (papaparse), JSON, XML |
| ✅ | **Expert metadata panel** — provenance-labelled, tier-aware |
| ✅ | **Privacy indicator** — always shows whether file stays local or goes to server |
| ✅ | **Filename spell-checker** — Levenshtein correction for extensions |
| ⚙️ | **AI code explanations** — GPT-4o-mini, Redis-cached · needs `OPENAI_API_KEY` |
| ⚙️ | **Deep metadata extraction** — Apache Tika · needs deployed Tika |
| 🗺️ | **Sandboxed execution** — Firecracker VMs · roadmap |

---

## How it works

```
File dropped
     │
     ▼
┌──────────────────────────────────┐
│  Pre-flight (always, in-browser) │
│  Magic bytes · tier routing      │
│  Corruption check · spell check  │
└──────────┬───────────────────────┘
           │
     ┌─────┴──────────┬──────────────────┐
     ▼                ▼                  ▼
  Tier 1           Tier 2            Tier 3
  Browser WASM     Backend API       Roadmap
  ≤ 50 MB          ≤ 500 MB          ≤ 2 GB
  Images · Code    Archives          Executables
  Audio · Video    Documents         ELF · DLL
  PDF · 3D         Data files
```

Full component breakdown → **[ARCHITECTURE.md](ARCHITECTURE.md)**

---

## Quick start

### Frontend only — zero config, runs in-browser

```bash
git clone https://github.com/benneberg/voila
cd voila
npm install --legacy-peer-deps
npm run dev
```

Open **http://localhost:5173** — works fully offline, no backend needed.

### Full stack with Docker

```bash
cp .env.production.template .env   # fill in SECRET_KEY and CORS_ORIGINS
docker-compose up -d
```

| Service | URL |
|---|---|
| App (nginx) | http://localhost |
| Backend API | http://localhost:8000 |
| API docs | http://localhost:8000/docs |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3000 |

### Backend only (dev)

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
uvicorn main:app --reload --port 8000
```

---

## Configuration

Copy `.env.production.template` to `.env`. The backend starts in demo mode with no config required.

| Variable | When needed | Description |
|---|---|---|
| `SECRET_KEY` | Production | `openssl rand -hex 32` |
| `OPENAI_API_KEY` | Optional | Enables AI code explanations |
| `REDIS_URL` | Optional | Caching + rate limiting (falls back to in-memory) |
| `CORS_ORIGINS` | Production | Comma-separated allowed origins |
| `ADMIN_API_KEY` | Production | Protects `/cost` and `/stats` endpoints |
| `VITE_API_URL` | Optional | Backend URL (default: same origin `/api`) |
| `RATELIMIT_ENABLED` | Testing | Set `0` to disable rate limiting |

---

## Development

```bash
# Frontend tests (108)
npm test

# Frontend tests with coverage report
npm run test:coverage

# Type-check
npm run typecheck

# Backend tests (42)
cd backend && pytest tests/ -v

# Format code
npm run format

# Production build
npm run build

# Demo build (GitHub Pages, client-side only)
VITE_DEMO_MODE=true npm run build
```

CI runs on every push and pull request. See **[.github/workflows/ci.yml](.github/workflows/ci.yml)**.

---

## Project layout

```
voila/
├── src/
│   ├── components/
│   │   ├── OmniDrop.tsx              # Drop zone · privacy indicator · tier badge
│   │   ├── FileRenderer.tsx          # Dispatcher → 12 preview types
│   │   ├── renderers/                # Sub-renderers (Audio, Video, Document, Data…)
│   │   ├── Model3DViewer.tsx         # Three.js — lazy-loaded
│   │   ├── ExpertPanel.tsx           # Deep metadata with provenance labels
│   │   └── ErrorBoundary.tsx
│   ├── lib/
│   │   ├── preflight.ts              # Magic byte detection + tier routing
│   │   ├── fileProcessor.ts          # Per-type processing pipeline
│   │   ├── spellChecker.ts           # Extension spell-checker
│   │   └── api.ts                    # Backend client with graceful fallback
│   ├── constants/index.ts            # TIERS · FILE_CATEGORIES · PROVENANCE
│   ├── utils/format.ts               # formatBytes · formatDuration
│   └── data/file-signatures.json     # 46 magic-byte signatures
├── backend/
│   ├── main.py                       # FastAPI app · all endpoints · middleware
│   ├── engines/
│   │   ├── corruption.py             # Real byte-level corruption checks
│   │   └── llm_cache.py              # AI response caching (Redis-backed)
│   ├── middleware/rate_limiter.py     # Per-IP rate limiting
│   └── tests/                        # 42 pytest tests
├── monitoring/
│   ├── prometheus.yml                # Scrape config
│   ├── alerts.yml                    # 9 alerting rules
│   └── grafana/                      # Auto-provisioned dashboards
├── .github/workflows/
│   ├── ci.yml                        # typecheck · tests · build · audit
│   └── pages.yml                     # Demo → GitHub Pages
├── deploy/nginx.conf
├── docker-compose.yml
└── .env.production.template
```

---

## API reference

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | — | Service health + dependency status |
| `POST` | `/api/v1/file/upload` | — | Upload file; returns hash + detected MIME |
| `POST` | `/api/v1/metadata/extract` | — | Deep metadata from file hash |
| `POST` | `/api/v1/analyze/code` | — | AI explanation (falls back in demo mode) |
| `POST` | `/api/v1/diagnostics/corruption` | — | Byte-level corruption analysis |
| `GET` | `/api/v1/cost/{ip}` | `X-Admin-Key` | Accumulated cost for an IP address |
| `GET` | `/api/v1/stats` | `X-Admin-Key` | Usage statistics |

Interactive docs at `http://localhost:8000/docs`.

---

## Tech stack

**Frontend** — React 18, TypeScript (strict), Vite 8, TailwindCSS, Framer Motion  
**Viewers** — Three.js (lazy), Monaco Editor, PDF.js, Pyodide, WaveSurfer.js (all CDN, not bundled)  
**Parsers** — papaparse (RFC 4180 CSV), js-yaml  
**Backend** — FastAPI, Python 3.11, Pydantic v2  
**Storage** — Redis (optional), Apache Tika (optional)  
**Observability** — Prometheus + Grafana (pre-configured, optional)  
**CI/CD** — GitHub Actions · Docker · nginx

---

## Contributing

1. Fork → feature branch → PR against `main`
2. `npm test` and `cd backend && pytest` must pass
3. `npm run typecheck` must exit 0

---

## License

MIT — see [LICENSE](LICENSE)
