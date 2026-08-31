# Voila! — Universal File Inspector

Drop any file. Understand it instantly.

Voila! identifies files by their content (magic bytes, not extensions), routes them to the appropriate processing tier, and renders a contextual preview — from images and 3D models to executables and data files.

---

## What it does

| Capability | Status |
|---|---|
| Magic number detection — 46+ formats, 9 categories | ✅ Implemented |
| Extension / content mismatch detection | ✅ Implemented |
| File corruption checks (JPEG, PDF) | ✅ Implemented |
| Image preview — zoom, fullscreen, EXIF metadata | ✅ Implemented |
| Code preview — Monaco editor, syntax highlighting, 20+ languages | ✅ Implemented |
| Python execution in the browser (Pyodide WASM) | ✅ Implemented |
| PDF rendering (PDF.js) | ✅ Implemented |
| 3D model viewer — OBJ, STL, GLTF/GLB (Three.js) | ✅ Implemented |
| Audio waveform preview (WaveSurfer.js) | ✅ Implemented |
| Video preview | ✅ Implemented |
| Expert metadata panel | ✅ Implemented |
| Filename spell-checking | ✅ Implemented |
| AI code explanations (GPT-4o-mini) | ⚙️ Demo mode — requires `OPENAI_API_KEY` |
| Tier 2 deep extraction (Apache Tika) | ⚙️ Demo mode — requires deployed Tika |
| Tier 3 sandboxed execution (Firecracker) | 🗺️ Roadmap — routing exists, VMs not yet implemented |

Files are processed locally in the browser (Tier 1) for most formats. Nothing leaves your machine unless you configure and deploy the backend.

---

## Architecture overview

Three processing tiers based on file type and size:

```
File dropped
     │
     ▼
┌─────────────────────────────────┐
│  Tier 0 — Pre-flight (always)   │
│  Magic bytes · tier routing     │
│  Corruption check · spell check │
└──────────┬──────────────────────┘
           │
     ┌─────┴──────┬───────────────┐
     ▼            ▼               ▼
  Tier 1       Tier 2          Tier 3
  Browser      Docker/API      Roadmap
  ≤ 50 MB      ≤ 500 MB        ≤ 2 GB
  WASM         Tika            Firecracker
  Images       Archives        Executables
  Code         Documents       ELF/DLL
  Audio/Video  Data files
  PDF / 3D
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for component details, data flow, and security boundaries.

---

## Getting started

### Prerequisites

- Node.js 20+
- Python 3.11+ (backend only)
- Docker & Docker Compose (full stack only)

### Frontend only (no backend needed)

```bash
git clone https://github.com/benneberg/voila
cd voila
npm install --legacy-peer-deps
npm run dev
# Open http://localhost:5173
```

The frontend runs fully in demo mode without the backend. File processing happens in the browser via WASM.

### Full stack (with backend)

```bash
# Copy and fill in the environment template
cp .env.production.template .env
# Edit .env — at minimum set SECRET_KEY and CORS_ORIGINS

# Start all services
docker-compose up -d

# Services:
#   Frontend (via nginx):  http://localhost:80
#   Backend API:           http://localhost:8000
#   API docs:              http://localhost:8000/docs
#   Prometheus:            http://localhost:9090
#   Grafana:               http://localhost:3000
```

### Backend only (development)

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt

# Optional: start Redis for caching
docker run -d -p 6379:6379 redis:alpine

# Start server (demo mode works without any env vars)
uvicorn main:app --reload --port 8000
```

---

## Configuration

Copy `.env.production.template` to `.env` and fill in values. The only required variable for local development is none — the backend starts in demo mode without any configuration.

Key variables:

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `SECRET_KEY` | Production | — | Signs URLs; generate with `openssl rand -hex 32` |
| `OPENAI_API_KEY` | Optional | — | Enables AI code explanations |
| `REDIS_URL` | Optional | in-memory | Caching and rate limiting |
| `CORS_ORIGINS` | Production | — | Comma-separated allowed origins |
| `VITE_API_URL` | Optional | `http://localhost:8000` | Backend URL for frontend |

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite 8, TailwindCSS |
| 3D | Three.js (bundled) |
| Code editor | Monaco Editor (CDN) |
| PDF | PDF.js (CDN) |
| Python runtime | Pyodide (CDN) |
| Audio | WaveSurfer.js (CDN) |
| Backend | FastAPI, Python 3.11 |
| Caching | Redis (optional) |
| Metadata | Apache Tika (optional) |
| Observability | Prometheus, Grafana |
| CI/CD | GitHub Actions |
| Serving | nginx (production) |

---

## Testing

```bash
# Frontend unit tests (81 tests)
npm test

# Frontend with coverage
npm run test:coverage

# Backend tests (27 tests)
cd backend && pytest tests/ -v
```

CI runs on every push and pull request. See `.github/workflows/ci.yml`.

---

## Project structure

```
voila/
├── src/
│   ├── components/           # React components
│   │   ├── OmniDrop.tsx      # File drop zone
│   │   ├── FileRenderer.tsx  # 12-type preview renderer
│   │   ├── Model3DViewer.tsx # Three.js 3D viewer
│   │   ├── ExpertPanel.tsx   # Deep metadata panel
│   │   ├── ErrorBoundary.tsx # React error boundary
│   │   └── PipelineVisualizer.tsx
│   ├── lib/
│   │   ├── preflight.ts      # Magic number detection + tier routing
│   │   ├── fileProcessor.ts  # Per-type processing pipeline
│   │   ├── spellChecker.ts   # Filename spell-checker
│   │   └── api.ts            # Backend API client
│   ├── data/
│   │   └── file-signatures.json  # 46 magic-byte signatures
│   └── tests/                # Jest unit tests
├── backend/
│   ├── engines/
│   │   ├── llm_cache.py      # AI response caching (Redis)
│   │   └── corruption.py     # File integrity checks
│   ├── middleware/
│   │   └── rate_limiter.py   # Rate limiting and cost tracking
│   ├── tests/                # pytest suite
│   └── main.py               # FastAPI application
├── monitoring/
│   ├── prometheus.yml         # Scrape config
│   ├── alerts.yml             # 9 alerting rules
│   └── grafana/               # Provisioned dashboards
├── deploy/
│   ├── nginx.conf             # SPA routing + API proxy
│   └── start.sh               # Combined entrypoint
├── .github/workflows/ci.yml   # CI/CD pipeline
├── docker-compose.yml          # Full production stack
├── Dockerfile                  # Multi-stage build
├── .env.production.template    # Environment reference
└── ARCHITECTURE.md
```

---

## API endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | API version info |
| `GET` | `/health` | Service health (includes Redis/OpenAI/Tika status) |
| `POST` | `/api/v1/file/upload` | Upload file, get hash + metadata |
| `POST` | `/api/v1/metadata/extract` | Extract metadata from file hash |
| `POST` | `/api/v1/analyze/code` | AI code explanation (requires API key) |
| `POST` | `/api/v1/diagnostics/corruption` | Corruption check |

Full interactive docs at `http://localhost:8000/docs` when the backend is running.

---

## Contributing

1. Fork and clone
2. Create a feature branch
3. Run `npm test` and `cd backend && pytest` — both must pass
4. Open a pull request

---

## License

MIT — see [LICENSE](./LICENSE)
