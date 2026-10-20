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
| **UI** | Topic Panel (Capture Overlay) | **PLANNED** | Ready for Milestone 2 implementation | None |
| **Compiler** | Context Compiler Pipeline | **PLANNED** | Ready for Milestone 2 implementation | None |
| **Security** | Identity Isolation & Multi-account switcher | **PARTIAL** | Memory boundaries verified; OS auth pending | Milestone 3 |
| **Sync** | Sync Engine & Offline Queue | **PLANNED** | Protocol defined | Dependent on Cloudflare Worker & D1 |
| **Cloud/R2** | Encrypted Blob Tickets | **PLANNED** | Ticket flow designed | Cloudflare R2 credentials needed |
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
| 2026-10-20 | Full Workspace Build | `pnpm build` | **PASS** | TypeScript compilation succeeded across all 4 packages |
