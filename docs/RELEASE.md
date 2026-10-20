# PILL — Release & Rollback Runbook

---

## 1. Release Verification Gates

Before tagging any release candidate (RC):
1. **Lint & Typecheck:** `pnpm lint` and `pnpm typecheck` must pass with zero errors.
2. **Unit & Domain Tests:** `pnpm test` passes across all workspace packages.
3. **Cross-Identity Isolation Gate:**
   - Account A cannot query Account B's local or remote records.
   - Account switch clears in-memory caches and UI context buffers.
4. **Offline Resilience Gate:**
   - App can create, edit, and search Pills while network is completely disconnected.
   - Reconnecting initiates idempotent sync without duplications.
5. **No Fake Data / No Dead Buttons:** All visible UI actions must perform real logic or show an honest "Planned for Milestone X" indicator.

---

## 2. Rollback Procedure

- **Frontend / Desktop:** Tauri auto-updater points to stable release manifest. If a bad version is deployed, revert manifest pointer to previous stable release tag.
- **Backend / Workers:** Cloudflare Workers supports instant rollback to any previous version deployment with a single click or `wrangler rollback [deployment-id]`.
- **Database Migrations:** All schema changes must be backward-compatible (expand before contract). Dropping columns is never done in the same release as schema introduction.
