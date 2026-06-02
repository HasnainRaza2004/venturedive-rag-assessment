# VentureDive RAG Wikipedia Chat

Containerized RAG chat application over a single Wikipedia article, using a local LLM (Ollama) and ChromaDB.

## Planning artefacts

| File | Purpose |
|------|---------|
| [REQUIREMENTS.md](./REQUIREMENTS.md) | Scope, assumptions, in/out of scope |
| [DESIGN.md](./DESIGN.md) | Architecture, data flow, technology choices |
| [TASKS.md](./TASKS.md) | Granular execution checklist |

## Prerequisites

- Docker Desktop (or Docker Engine + Compose v2)
- Node.js 20+ (for local development without Docker)
- ~4 GB free disk for Ollama models (`llama3.2:3b`, `nomic-embed-text`)

## Quick start (after implementation)

```bash
cp .env.example .env
docker compose up --build
```

Open http://localhost:3000 — paste a Wikipedia URL, wait for summary, then chat.

> **Note:** First startup may take several minutes while Ollama pulls models.

## Local development (after implementation)

See `TASKS.md` Phase 2+ for backend/frontend setup.

## Test coverage

```bash
cd backend && npm test -- --coverage
```

Target: **≥85% line coverage** on application code (see `jest.config.js`).

## License

Take-home submission — VentureDive.
