# PILL — Architecture Decisions & Trade-Offs (ADR)

---

## ADR-001: Local-First Core with Zero Paid AI Requirement
- **Status:** Accepted (2026-10-20)
- **Context:** Many AI productivity tools fail when offline or require continuous expensive LLM tokens, creating high friction and unsustainable unit economics.
- **Decision:** All primary capture, local organization, relationship linking, and search operations must be 100% functional locally using SQLite and SQLite FTS5 (BM25 lexical search). AI summaries, embeddings, and generative synthesis are purely optional adapters (user BYOK or local Ollama).
- **Consequences:** Free tier has ₹0 infrastructure inference cost. The app functions reliably on airplanes, commutes, and during cloud outages.

---

## ADR-002: Identity Isolation as a First-Class Security Boundary
- **Status:** Accepted (2026-10-20)
- **Context:** Users frequently use shared computers (work laptops, lab PCs, family tablets). Data leaks between accounts (e.g. Alice and Bob) are unacceptable.
- **Decision:** Every local database query and remote sync payload must be strictly scoped to `ownerId`. Logging out or switching accounts locks the active vault, invalidates authentication tokens, flushes decrypted in-memory caches, and resets all ephemeral UI buffers.
- **Consequences:** No shared in-memory state. Cross-account access attempts fail closed by default.

---

## ADR-003: Monorepo Architecture with pnpm Workspaces
- **Status:** Accepted (2026-10-20)
- **Context:** Multiple client targets (Desktop Tauri, Browser Extension, Mobile Expo) and shared backend services need synchronized domain types, validation schemas, and design tokens.
- **Decision:** Use a TypeScript monorepo with `pnpm workspaces`. Shared packages live under `packages/` (`@pill/domain`, `@pill/schemas`, `@pill/local-store`, `@pill/design-tokens`), consumed directly by `apps/` and `services/`.
- **Consequences:** Eliminates schema drift, enables shared unit testing, and ensures contract consistency across all clients.

---

## ADR-004: Cloudflare Free Tier for Remote Sync Relay and Attachment Storage
- **Status:** Accepted (2026-10-20)
- **Context:** Traditional cloud backends (AWS RDS, S3 with egress fees, ECS) introduce recurring costs that threaten a zero-budget strategy.
- **Decision:** Standardize remote sync on Cloudflare Workers (API), Cloudflare D1 (Serverless SQLite metadata), and Cloudflare R2 (Object storage with zero egress fees).
- **Consequences:** Stays 100% within perpetual free tiers for early users while providing global low-latency edge performance.
