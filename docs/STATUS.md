# PILL — Project Status & Verification Register

> **System Status Tracker**  
> *Rules: Never mark a planned feature as implemented. Update actual test results with dates and command output.*

**Last Updated:** 2026-10-20  
**Current Milestone:** Milestone 1 — Local Foundation & Core Domain Engine

---

## 1. Feature Matrix

| Domain | Feature | Status | Verification / Evidence | Blockers / Dependencies |
| :--- | :--- | :--- | :--- | :--- |
| **Foundation** | Monorepo layout & pnpm workspace | **IMPLEMENTED** | `pnpm-workspace.yaml`, 4 packages configured & building | None |
| **Domain** | Pill Schema (UUID, revision, provenance, tags) | **IMPLEMENTED** | `packages/schemas/src/pill.ts`, validated in `schemas.test.ts` (4 passed) | None |
| **Domain** | Collection & Relationship schemas | **IMPLEMENTED** | `packages/schemas/src/collection.ts`, Zod validation | None |
| **Design** | Design Tokens (`--pill-bg`, `--pill-primary`) | **IMPLEMENTED** | `packages/design-tokens/src/index.ts` & `tokens.css` (2 passed) | None |
| **Domain Logic** | Pill ops (build, revision bump, archive, link) | **IMPLEMENTED** | `packages/domain/src/pill-ops.ts` (5 passed) | None |
| **Domain Logic** | Secret pattern detection & untrusted labeling | **IMPLEMENTED** | `packages/domain/src/security-ops.ts`, credential warning test | None |
| **Local Store** | Local Vault & Identity Isolation Engine | **IMPLEMENTED** | `packages/local-store/src/store.ts` (5 passed: Alice/Bob isolation, search, lock, wipe) | None |
| **Local Store** | SQLite + FTS5 DDL & Triggers | **IMPLEMENTED** | `packages/local-store/src/sqlite-schema.sql` ready for SQLite | Native SQLite driver for Tauri/Expo |
| **UI** | Topic Panel (Capture Overlay) | **IMPLEMENTED** | Verified in browser test (`Ctrl+Shift+C`, modal capture, credential scan) | None |
| **Compiler** | Context Compiler Pipeline | **IMPLEMENTED** | `packages/context-compiler` (5 passed), Studio UI verified | None |
| **Desktop App**| Local-First Web/Desktop Client | **IMPLEMENTED** | `apps/desktop` (Vite + React 19), live on `localhost:3000` | None |
| **Security** | Identity Isolation & Multi-account switcher | **IMPLEMENTED** | Verified in browser (Alice ⇄ Bob vault locking and cache purge) | None |
| **Sync** | Sync Engine & Offline Queue | **IMPLEMENTED** | `packages/sync-engine` (4 passed: offline queue, idempotency, backoff, conflicts) | None |
| **Cloud/API** | Cloudflare Workers API & D1 Sync Relay | **IMPLEMENTED** | `services/api` (6 passed: enroll, revoke, cursor pull, push idempotency) | None |
| **Cloud/R2** | Encrypted Blob Tickets & 5MB Free-Tier Ceiling | **IMPLEMENTED** | `services/api` (upload/download tickets, 413 ceiling enforcement) | None |
| **Billing** | SaaS Entitlements (Free vs Plus) | **PLANNED** | Server-verified rule defined | Deferred to Milestone 6 |
| **Extension** | Chromium Manifest V3 Extension | **PLANNED** | Architecture approved | Deferred to Milestone 5 |
| **Mobile** | Expo React Native Client | **PLANNED** | Architecture approved | Deferred to Milestone 5 |
| **Interoperability**| Read-only MCP Server | **PLANNED** | Protocol design approved | Deferred to Milestone 6 |

---

## 2. Test Execution Log

| Date | Suite | Command | Result | Notes |
| :--- | :--- | :--- | :--- | :--- |
| 2026-10-20 | Tooling Inspection | `node -v`, `npm -v`, `cargo -v` | **PASS** | Node v22.19.0, npm 10.9.1, cargo 1.98.0, pnpm 12.14.0 |
| 2026-10-20 | Design Tokens Test | `pnpm --filter @pill/design-tokens test` | **PASS** | 2/2 tests passed (colors, radii, shadows) |
| 2026-10-20 | Entity Schemas Test | `pnpm --filter @pill/schemas test` | **PASS** | 4/4 tests passed (Pill, Collection, Bundle validation, ownerId isolation) |
| 2026-10-20 | Domain Logic Test | `pnpm --filter @pill/domain test` | **PASS** | 5/5 tests passed (build, revision bumping, archive, typed links, credential detection) |
| 2026-10-20 | Local Vault Store Test | `pnpm --filter @pill/local-store test` | **PASS** | 5/5 tests passed (Alice/Bob identity isolation, lexical search, vault locking, memory wiping) |
| 2026-10-20 | Context Compiler Test | `pnpm --filter @pill/context-compiler test` | **PASS** | 5/5 tests passed (provenance, budget truncation, cross-account security rejection) |
| 2026-10-20 | Desktop App Build | `pnpm --filter @pill/desktop build` | **PASS** | Vite production bundle generated in 5.99s with zero errors |
| 2026-10-20 | Browser Subagent E2E | Browser verification on `localhost:3000` | **PASS** | Verified Topic Modal, Context Studio, Alice ⇄ Bob identity isolation |
| 2026-10-20 | Sync Engine Test | `pnpm --filter @pill/sync-engine test` | **PASS** | 4/4 tests passed (offline queue, idempotency, backoff, conflict preservation) |
| 2026-10-20 | Cloudflare Workers API Test | `pnpm --filter @pill/api test` | **PASS** | 6/6 tests passed (device enrollment, revocation, push/pull, 5MB quota ceiling) |
