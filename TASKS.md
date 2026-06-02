# Execution Log — VentureDive RAG Wikipedia Chat

Granular, sequenced task list for Phase 2+ implementation. Update checkboxes as work completes. **Phase 1 (planning + scaffold only) is in progress.**

Legend: `[ ]` todo · `[x]` done · `[-]` skipped/cancelled

---

## Phase 0 — Planning Artefacts (Current)

- [ ] **0.1** Finalize `REQUIREMENTS.md` (user draft → review against official brief)
- [x] **0.2** Author `DESIGN.md` (architecture, data flow, diagrams)
- [x] **0.3** Author `TASKS.md` (this file)
- [ ] **0.4** Review planning trio with human partner; resolve open questions before any app code

---

## Phase 1 — Repository Scaffold (No Application Logic)

- [x] **1.1** Initialize git repository and `.gitignore` (node_modules, .env, coverage, dist)
- [x] **1.2** Create `backend/` and `frontend/` directory trees (empty `src/` placeholders only)
- [x] **1.3** `npm init` backend with `package.json` scripts stubs (`test`, `start`, `dev`) — **no feature code**
- [ ] **1.4** `npm create vite@latest` frontend (React) — default template only, no custom features yet
- [x] **1.5** Add root `README.md` skeleton (prerequisites, compose command placeholders)
- [x] **1.6** Add `.env.example` at repo root (and document per-service vars)
- [x] **1.7** Add skeleton `docker-compose.yml` + service Dockerfiles (stub commands)
- [ ] **1.8** Add `NOTES.md` optional stub for blockers / AI corrections

---

## Phase 2 — Backend Foundation (TDD)

### 2.A Tooling and Config

- [x] **2.1** Install backend dev dependencies: `jest`, `supertest`, `nodemon`, `eslint` (optional)
- [x] **2.2** Configure `jest.config.js` with coverage thresholds (85% lines), exclusions for `index.js`
- [x] **2.3** Implement `src/config/env.js` + unit tests for required env validation
- [x] **2.4** Create `src/app.js` Express app factory (no routes yet) + Supertest smoke test
- [x] **2.5** Create `src/index.js` server entry (listen only when not imported by tests)

### 2.B Health Route

- [x] **2.6** Write failing test: `GET /api/health` returns 200 with shape `{ status }`
- [x] **2.7** Implement `routes/health.js` with mocked downstream checks interface
- [x] **2.8** Wire health route in `app.js`; achieve coverage on health module

---

## Phase 3 — Wikipedia Scraper (TDD)

- [x] **3.1** Add HTML fixtures under `tests/fixtures/` (valid article, disambiguation, empty body)
- [x] **3.2** Write unit tests for URL validation helper (wikipedia host, https)
- [x] **3.3** Implement URL validator in `src/scraper/validateUrl.js`
- [x] **3.4** Write failing tests for `wikipediaScraper.parse(html)` → title, sections, plain text
- [x] **3.5** Implement Cheerio parser (`#mw-content-text`, headings, paragraph extraction)
- [x] **3.6** Write failing tests for `fetchAndParse(url)` with HTTP mocked (`axios`/`nock`)
- [x] **3.7** Implement fetch layer with timeout and error mapping
- [x] **3.8** Add `normalize.js` tests + implementation (whitespace, empty section drop)

---

## Phase 4 — Text Chunking (TDD)

- [x] **4.1** Write chunker unit tests: section boundaries respected
- [x] **4.2** Write chunker tests: target size ~600, overlap ~100
- [x] **4.3** Implement `src/text/chunker.js` (section-aware recursive split)
- [x] **4.4** Write tests for chunk metadata fields (`sectionTitle`, `chunkIndex`, etc.)
- [x] **4.5** Refactor chunker constants to env-configurable defaults

---

## Phase 5 — Client Adapters (TDD, Mocked)

### 5.A Ollama Client

- [x] **5.1** Define `LlmClient` / `Embedder` interface documentation in code
- [x] **5.2** Write unit tests for `ollamaClient.summarize` (mock `fetch`)
- [x] **5.3** Write unit tests for `ollamaClient.embed` batching
- [x] **5.4** Write unit tests for `ollamaClient.answer` / generate
- [x] **5.5** Implement `src/clients/ollamaClient.js`
- [x] **5.6** Add error handling tests (timeout, 5xx, malformed JSON)

### 5.B Chroma Client

- [x] **5.7** Write unit tests for `chromaClient.resetCollection`
- [x] **5.8** Write unit tests for `chromaClient.upsert` with metadata
- [x] **5.9** Write unit tests for `chromaClient.query` returning scored chunks
- [x] **5.10** Implement `src/clients/chromaClient.js` using official JS SDK
- [x] **5.11** Create test doubles: `__mocks__/ollamaClient.js`, `__mocks__/chromaClient.js` if needed

---

## Phase 6 — Prompts and RAG Service (TDD)

- [ ] **6.1** Write tests for `prompts/summarize.js` template structure
- [ ] **6.2** Write tests for `prompts/ragAnswer.js` (context injection, refusal instruction)
- [ ] **6.3** Implement prompt builders
- [ ] **6.4** Write `ragService` tests with mocked embedder, vector store, LLM
- [ ] **6.5** Implement `ragService.answer(question)` → `{ answer, sources }`
- [ ] **6.6** Write tests for low-confidence retrieval (empty/low score → not found message)
- [ ] **6.7** Write `ingestService` tests (full pipeline mocked)
- [ ] **6.8** Implement `ingestService.ingest(url)` orchestration

---

## Phase 7 — HTTP Routes (TDD)

- [ ] **7.1** Write Supertest: `POST /api/ingest` happy path (mocked services)
- [ ] **7.2** Write Supertest: ingest validation errors (`400`, `422`)
- [ ] **7.3** Implement `routes/ingest.js`
- [ ] **7.4** Write Supertest: `POST /api/chat` happy path
- [ ] **7.5** Write Supertest: chat `409` when no article indexed
- [ ] **7.6** Implement `routes/chat.js`
- [ ] **7.7** Add Express error middleware + consistent JSON error shape
- [ ] **7.8** Add request logging middleware (dev only)

---

## Phase 8 — Frontend (Minimal UI)

- [ ] **8.1** Configure Vite proxy to backend for local dev
- [ ] **8.2** Build `UrlForm` component (submit URL, loading, error display)
- [ ] **8.3** Build `SummaryPanel` component
- [ ] **8.4** Build `ChatBox` component (message list, input, loading state)
- [ ] **8.5** Wire `api/ingest` and `api/chat` client functions
- [ ] **8.6** Disable chat until successful ingest
- [ ] **8.7** Display source excerpts under assistant messages (optional collapsible)
- [ ] **8.8** Basic responsive layout and accessible form labels

---

## Phase 9 — Docker and Compose

- [ ] **9.1** Finalize `docker-compose.yml` (ollama, chroma, backend, frontend)
- [ ] **9.2** Backend `Dockerfile` multi-stage (prod deps only in final)
- [ ] **9.3** Frontend `Dockerfile` (build + nginx)
- [ ] **9.4** Ollama init: pull `llama3.2:3b` and `nomic-embed-text` on startup
- [ ] **9.5** Chroma volume persistence and healthcheck
- [ ] **9.6** Wire env vars from `.env.example` into compose
- [ ] **9.7** Verify `docker compose up --build` end-to-end on clean machine
- [ ] **9.8** Document first-run model download time in README

---

## Phase 10 — Integration Testing and Coverage

- [ ] **10.1** Add `tests/integration/rag.e2e.test.js` (tagged; runs against real Ollama+Chroma)
- [ ] **10.2** Document how to run integration tests locally vs. CI skip
- [ ] **10.3** Run coverage report; close gaps to ≥85% line coverage
- [ ] **10.4** Commit `coverage/` report or screenshot per submission requirements
- [ ] **10.5** Review tests for meaningful assertions (no padding)

---

## Phase 11 — Documentation and Submission

- [ ] **11.1** Complete `README.md` (clone, compose up, env copy, troubleshooting)
- [ ] **11.2** Sync `TASKS.md` checkboxes with actual repo history
- [ ] **11.3** Record 2–4 min demo (scrape → summary → chat) or screenshots
- [ ] **11.4** Optional `NOTES.md`: AI mistakes corrected, future improvements
- [ ] **11.5** Final review against brief hard requirements checklist
- [ ] **11.6** Push public repo and submit link

---

## Delegation Notes (AI vs. Human)

| Area | Planned delegation |
|------|-------------------|
| Planning docs | AI draft → human review (this phase) |
| Scraper edge cases | Human review of fixture selection |
| Prompt wording | AI draft → human tune for grounding |
| Docker model init | AI scaffold → human verify on target machine |
| Coverage gaps | Human prioritizes high-risk modules first |

---

## Commit Convention (Suggested)

`feat:`, `test:`, `docs:`, `chore:`, `fix:` — one logical TASK id per commit where practical (e.g. `feat(scraper): implement cheerio parser (task 3.5)`).
