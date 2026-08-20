# Voila! - Universal File Handler

> "One input, infinite understanding"

A universal file handler that masks a massively complex, multi-modal distributed system behind a single, ultra-minimalist user interface.

## Features

- **Magic Number Detection** - Identifies file types by content, not extension
- **Corruption Detection** - Warns about damaged files before opening
- **Tiered Processing** - Routes files to appropriate processing environment:
  - **Tier 1 (Browser)** - WASM-based processing (images, video, audio, code)
  - **Tier 2 (Docker)** - Heavy lifting (archives, documents, data)
  - **Tier 3 (Firecracker)** - Sandboxed execution for executables
- **AI Code Explanations** - GPT-powered code analysis with Redis caching
- **Expert Panel** - Toggle deep technical metadata for power users
- **Multi-format Support** - 100+ file formats via magic number signatures

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS |
| Animation | Framer Motion |
| 3D Rendering | Three.js |
| Code Editor | Monaco Editor (CDN) |
| PDF Rendering | PDF.js (CDN) |
| Python Runtime | Pyodide (CDN) |
| Backend | FastAPI, Python 3.11+ |
| Caching | Redis |
| Metadata | Apache Tika |
| Monitoring | Prometheus, Grafana |

## Installation

### Prerequisites

- Node.js 18+
- Python 3.11+
- Docker & Docker Compose (for backend)

### Frontend Setup

```bash
# Clone and install
cd voila-demo
npm install

# Start development server
npm run dev
```

### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Start Redis (for caching)
docker run -d -p 6379:6379 redis:alpine

# Run development server
uvicorn main:app --reload --port 8000
```

### Full Stack (Docker Compose)

```bash
# Start all services
docker-compose up -d

# Services:
# - voila-api: http://localhost:8000
# - redis: localhost:6379
# - tika: http://localhost:9998
# - prometheus: http://localhost:9090
# - grafana: http://localhost:3000
```

## Usage

### Development

```bash
# Frontend (port 5173)
npm run dev

# Backend (port 8000)
cd backend && uvicorn main:app --reload

# Backend API docs
# http://localhost:8000/docs
```

### Production Build

```bash
npm run build
npm run preview
```

## Testing

### Frontend Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# CI mode (with thresholds)
npm run test:ci
```

### Backend Tests

```bash
cd backend

# Run all tests
pytest

# With coverage
pytest --cov=. --cov-report=html

# Specific test file
pytest tests/test_api.py -v
```

## Project Structure

```
voila-demo/
├── src/
│   ├── components/          # React components
│   │   ├── OmniDrop.tsx     # File upload dropzone
│   │   ├── FileRenderer.tsx  # Dynamic file preview
│   │   ├── Model3DViewer.tsx # Three.js 3D viewer
│   │   ├── ExpertPanel.tsx   # Metadata panel
│   │   └── PipelineVisualizer.tsx
│   ├── lib/
│   │   ├── preflight.ts      # Magic number detection
│   │   ├── fileProcessor.ts  # File processing
│   │   ├── spellChecker.ts    # Filename validation
│   │   └── api.ts            # Backend API client
│   ├── data/
│   │   └── file-signatures.json  # Magic number database
│   └── tests/                # Jest unit tests
├── backend/
│   ├── engines/
│   │   ├── llm_cache.py      # AI response caching
│   │   └── corruption.py      # File integrity checks
│   ├── middleware/
│   │   └── rate_limiter.py    # Rate limiting & cost tracking
│   ├── tests/                # pytest tests
│   ├── main.py               # FastAPI application
│   └── requirements.txt       # Python dependencies
├── docker-compose.yml         # Full stack deployment
└── package.json
```

## Configuration

### Environment Variables

**Frontend** (optional):
```
VITE_API_URL=http://localhost:8000
```

**Backend**:
```
PORT=8000
DEBUG=false
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=your-api-key  # Optional for demo mode
CORS_ALLOWED_ORIGINS=https://voila.app,https://www.voila.app
```

### Tier Limits

| Tier | Size Limit | Processing |
|------|------------|------------|
| Tier 1 (Browser) | 50 MB | WASM in browser |
| Tier 2 (Docker) | 500 MB | Cloud processing |
| Tier 3 (Firecracker) | 2 GB | Sandboxed VMs |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API info |
| GET | `/health` | Health check |
| POST | `/api/v1/file/upload` | File upload |
| POST | `/api/v1/metadata/extract` | Extract metadata |
| POST | `/api/v1/analyze/code` | AI code analysis |
| POST | `/api/v1/diagnostics/corruption` | Check file corruption |
| GET | `/api/v1/cost/{ip}` | Get cost for IP |

## Deployment

### Vercel (Frontend)

```bash
npm run build
vercel --prod
```

### AWS ECS (Backend)

1. Build Docker image:
   ```bash
   docker build -t voila-api ./backend
   ```

2. Push to ECR:
   ```bash
   aws ecr get-login-password | docker login --username AWS --password-stdin $ACCOUNT.dkr.ecr.$REGION.amazonaws.com
   docker tag voila-api:latest $ACCOUNT.dkr.ecr.$REGION.amazonaws.com/voila-api:latest
   docker push $ACCOUNT.dkr.ecr.$REGION.amazonaws.com/voila-api:latest
   ```

3. Deploy via ECS or Docker Compose

## Cost Estimation

| Service | Configuration | Monthly Cost |
|---------|---------------|--------------|
| CloudFront | 100GB transfer | ~$8.50 |
| S3 | 20GB storage | $0.46 |
| ECS Fargate | 2 vCPU, 4GB RAM | $60.00 |
| ElastiCache | t4g.micro | $12.00 |
| EC2 Spot | VM pool | ~$45.00 |
| OpenAI | 50K cached requests | $10.00 |
| Misc | CloudWatch, Route 53 | $5.50 |
| **Total** | | **~$123.00/month** |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - See LICENSE file for details

## Acknowledgments

- [Apache Tika](https://tika.apache.org/) - Deep metadata extraction
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Code editing
- [Pyodide](https://pyodide.org/) - Python in the browser
- [Three.js](https://threejs.org/) - 3D rendering

---

**Built with the philosophy:** *Super minimalism meets extreme capability.*
