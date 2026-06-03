# VentureDive RAG Wikipedia Chat

Containerized RAG chat application over a single Wikipedia article, using a local LLM (Ollama) and ChromaDB.

## Planning artefacts

| File | Purpose |
|------|---------|
| [REQUIREMENTS.md](./REQUIREMENTS.md) | Scope, assumptions, in/out of scope |
| [DESIGN.md](./DESIGN.md) | Architecture, data flow, technology choices |
| [TASKS.md](./TASKS.md) | Granular execution checklist |

## Repository layout

```text
backend/          Express API, scraper, RAG services, Jest tests
frontend/         React (Vite) UI, nginx in Docker
docker-compose.yml
scripts/          Ollama model pull entrypoint
.env.example      Copy to .env (never commit .env)
```

## Prerequisites

- **Docker Desktop** (Windows/macOS) or Docker Engine + Compose v2 (Linux)
- **Git** (for clone)
- Node.js 20+ (optional — local dev/tests only)
- ~4 GB free disk for Ollama models (`llama3.2:3b`, `nomic-embed-text`)

> **Windows:** Use **PowerShell** or **Git Bash** from the repo root. `cp` and `&&` are Unix shell syntax and fail in classic **cmd.exe** and older PowerShell.

## Quick start (Docker — full stack)

**1. Clone and enter the repo**

```bash
git clone https://github.com/HasnainRaza2004/venturedive-rag-assessment.git
cd venturedive-rag-assessment
```

**2. Create `.env` from the example** (required — Compose loads `env_file: .env`)

<details>
<summary>Windows (PowerShell)</summary>

```powershell
Copy-Item .env.example .env
```

</details>

<details>
<summary>Windows (Command Prompt)</summary>

```bat
copy .env.example .env
```

</details>

<details>
<summary>macOS / Linux / Git Bash</summary>

```bash
cp .env.example .env
```

</details>

**3. Start the stack**

```bash
docker compose up --build
```

If `docker compose` is not found, try `docker-compose up --build` (older installs).

Open **http://localhost:3000** — paste a Wikipedia URL (HTTPS `en.wikipedia.org`), wait for the summary, then chat.

| Service | URL |
|---------|-----|
| App (UI) | http://localhost:3000 |
| API (direct) | http://localhost:4000 |
| Chroma | http://localhost:8000 |
| Ollama | http://localhost:11434 |

**API:** `GET /api/health` · `POST /api/ingest` `{ "url": "..." }` · `POST /api/chat` `{ "message": "..." }`

> **First run:** Ollama pulls `llama3.2:3b` and `nomic-embed-text` automatically (often **5–15 minutes**). Watch: `docker compose logs -f ollama` until you see `Ollama ready with required models`.

> **Large articles:** Ingest can take 1–3+ minutes (summarize + embeddings).

## Environment variables

Create `.env` from `.env.example` (see commands above — do not use `cp` on Windows cmd). Compose overrides `OLLAMA_BASE_URL` and `CHROMA_URL` to internal service names (`http://ollama:11434`, `http://chroma:8000`). For **local** backend/frontend dev, keep localhost URLs as in the example.

Key vars: `OLLAMA_MODEL`, `EMBEDDING_MODEL`, `CHROMA_COLLECTION_PREFIX`, `SUMMARIZE_MAX_CHARS`, `RAG_TOP_K`, `RAG_MIN_SCORE`.

## Local development (hybrid)

Run Ollama + Chroma in Docker; run app code on the host for faster iteration.

```bash
docker compose up -d ollama chroma
```

**Backend** (terminal 1):

```powershell
cd backend
npm install
npm run dev
```

**Frontend** (terminal 2 — proxies `/api` to :4000):

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

Stop local servers before a full Docker stack on the same machine (ports **3000** and **4000** conflict with Compose).

## Tests and coverage

**Unit tests** (mocked Ollama/Chroma; enforces ≥85% line coverage):

```powershell
cd backend
npm test
```

**Integration test** (real Ollama + Chroma):

```powershell
docker compose up -d ollama chroma
cd backend
npm run test:integration
```

Integration spec: `tests/integration/rag.e2e.test.js` (Wikipedia HTTP mocked with nock; LLM + vector DB are real).

**Coverage for submission:** add a screenshot under `docs/coverage/` (HTML report in `backend/coverage/` is gitignored).

Last verified: **~94% lines**, 74 unit tests; 2 integration tests when Ollama + Chroma are up.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `'cp' is not recognized` (Windows) | Use `Copy-Item .env.example .env` (PowerShell) or `copy .env.example .env` (cmd). |
| `The token '&&' is not a valid statement separator` | Run commands on separate lines (see hybrid dev above), or use PowerShell 7+, or Git Bash. |
| `env file .env not found` / Compose warnings | Create `.env` from `.env.example` before `docker compose up`. |
| `bind: port 3000/4000 already in use` | Stop local `npm run dev` / `node src/index.js`, or change `FRONTEND_HOST_PORT` / `BACKEND_HOST_PORT` in `.env`. |
| `rag-chroma is unhealthy` | Chroma slim image has no `python3`/curl; compose uses a bash TCP healthcheck. Recreate: `docker compose up -d chroma --force-recreate`. |
| `rag-ollama` slow / backend not starting | First pull downloads ~2 GB; wait for `Finished pulling` in `docker compose logs ollama` (up to ~15 min). |
| Ollama 502 / timeout on ingest | Ensure models exist: `docker exec rag-ollama ollama list`. Match `OLLAMA_MODEL` in `.env`. Increase `OLLAMA_TIMEOUT_MS` for long articles. |
| Chroma connection refused (local dev) | `docker compose up -d chroma` and `CHROMA_URL=http://localhost:8000`. |
| Chat says info not in article | Try a specific question; retrieval uses top chunks from Chroma. Re-ingest if you changed article URL. |
| Integration tests fail immediately | Start `ollama` + `chroma`; confirm `llama3.2:3b` and `nomic-embed-text` in `ollama list`. |

## License

Take-home submission — VentureDive.
