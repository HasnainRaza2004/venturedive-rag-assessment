# VentureDive RAG Wikipedia Chat

Single-article Wikipedia RAG: scrape → summarize (Ollama) → chunk/embed → Chroma → grounded chat. Full stack via Docker Compose; no hosted LLM APIs.

Design detail: [DESIGN.md](./DESIGN.md) · Scope: [REQUIREMENTS.md](./REQUIREMENTS.md)

## Architecture

```text
Frontend (React/Vite, nginx :3000)
    → Backend (Express :4000)
        → Cheerio scraper (in-process)
        → Ollama (:11434) — llama3.2:3b (summary + chat), nomic-embed-text (embeddings)
        → ChromaDB (:8000) — per-article collection, cosine retrieval
```

| Flow | Path |
|------|------|
| Ingest | `POST /api/ingest` → fetch/parse → summarize → chunk → embed → upsert |
| Chat | `POST /api/chat` → embed query → top-k retrieval (min score filter) → RAG prompt → generate |

In-memory article state (one URL per process). Unit tests mock Ollama/Chroma; integration test hits real services (`tests/integration/rag.e2e.test.js`, Wikipedia HTTP nocked).

## Docker Compose

**Prerequisites:** Docker Compose v2, ~4 GB disk for Ollama models.

```bash
git clone https://github.com/HasnainRaza2004/venturedive-rag-assessment.git
cd venturedive-rag-assessment
cp .env.example .env          # Windows: Copy-Item .env.example .env
docker compose up --build
```

| Service | URL |
|---------|-----|
| UI | http://localhost:3000 |
| API | http://localhost:4000 |
| Chroma | http://localhost:8000 |
| Ollama | http://localhost:11434 |

Compose sets `OLLAMA_BASE_URL=http://ollama:11434` and `CHROMA_URL=http://chroma:8000`. First start: entrypoint pulls `llama3.2:3b` + `nomic-embed-text` (~5–15 min) — `docker compose logs -f ollama`.

## Tests

```bash
cd backend && npm test                    # unit, mocked deps, ≥85% line threshold
docker compose up -d ollama chroma
cd backend && npm run test:integration    # jest.integration.config.js
```

| Metric | Coverage |
|--------|----------|
| Statements | 93.89% |
| Branches | 76.80% |
| Functions | 97.50% |
| Lines | 93.80% |

**75** tests · **15** suites (unit + integration). HTML report: `backend/coverage/` (gitignored). Submission screenshot: `docs/coverage/`.

## Local development

```bash
docker compose up -d ollama chroma
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```

Requires localhost URLs in `.env`. Free ports **3000** / **4000** before full Compose.

## Troubleshooting

| Issue | Action |
|-------|--------|
| Missing `.env` | `cp .env.example .env` before `docker compose up` |
| Ports 3000/4000 in use | Stop host dev servers or override `*_HOST_PORT` in `.env` |
| `rag-ollama` blocks startup | Wait for model pull; `docker compose logs ollama` |
| `rag-chroma` unhealthy | `docker compose up -d chroma --force-recreate` |
| Ingest timeout | Confirm `ollama list`; tune `OLLAMA_TIMEOUT_MS` / `SUMMARIZE_MAX_CHARS` |
