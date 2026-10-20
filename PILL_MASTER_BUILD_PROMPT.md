# PILL --- Master Build Prompt for Antigravity

**Product:** Portable context continuity platform\
**Goal:** Build a local-first, privacy-conscious, cross-platform MVP for
Android, iOS, Windows, Linux, browser extension, and a limited MCP
integration.\
**Important:** PILL is a concept until implementation and tests prove
otherwise. Never claim a feature is complete, secure, audited,
store-approved, or production-ready without evidence.

## 1. Role and working rules

Act as lead product architect, full-stack engineer, UX engineer,
security-minded systems designer, and DevOps/test engineer.

Before editing: 1. Inspect the repository, Git status, OS, installed
tools, existing code, and build constraints. 2. Report existing
functionality, missing pieces, risks, and platform/account requirements.
3. Propose a final folder structure, architecture decisions,
dependencies, milestones, and acceptance criteria. 4. Implement only the
first milestone, run actual checks, report results, and update
`docs/STATUS.md`.

Never generate the entire application in one unreviewable burst.
Preserve useful existing code. Do not invent test results or claim
external services are configured. Never commit secrets. Use maintained
libraries; do not implement custom cryptography. No dead buttons, fake
production data, arbitrary shell access, or unbounded AI calls. Keep
development, staging, and production separate. Use Git commits before
risky changes.

Maintain: - `docs/STATUS.md`: implemented / partial / planned / blocked
/ tested / untested - `docs/DECISIONS.md`: architecture decisions and
trade-offs - `docs/THREATS.md`: threat model and residual risks -
`docs/RELEASE.md`: release and rollback instructions -
`docs/FREE_TIER_BUDGET.md`: current quotas, limits, costs, and alerts

## 2. Product definition

**PILL** is a user-controlled context layer that captures, organizes,
retrieves, and reuses digital context across supported apps, AI
assistants, browsers, and devices.

Problem: useful information is fragmented across notes, browser tabs,
documents, code, AI conversations, screenshots, and devices. Users
repeatedly reconstruct context when switching tools.

Core principles: - Local-first: save, edit, browse, and search locally
when offline. - Explicit capture: no continuous recording or
surveillance by default. - Identity isolation: separate data namespace
and key boundary per account. - Privacy by design, minimum permissions,
clear retention. - Portability: documented export/import. -
Interoperability: versioned APIs and adapters. - Explainability: show
what context will be shared and where. - Graceful degradation: cloud or
AI outages must not destroy local work. - No silent data loss; preserve
conflicting edits. - Never label a planned feature as implemented.

MVP: 1. Signup/login, logout, expiry, account switching. 2. Local vault
and identity separation. 3. Create, edit, archive, link, tag, search,
export Pills. 4. Topic panel for explicit capture, search, and
selection. 5. Basic encrypted synchronization. 6. Context Compiler with
preview and provenance. 7. Android and iOS apps. 8. Windows and Linux
desktop apps. 9. Browser extension for explicit capture. 10. Narrow,
permission-controlled MCP integration. 11. Free tier plus one paid tier
and server-verified entitlements. 12. Automated tests, monitoring,
backup/restore, release instructions.

Defer broad integrations, automatic background capture, autonomous
actions, advanced knowledge graphs, and costly cloud AI until the core
is reliable.

## 3. Product vocabulary and data model

### Pill

A versioned, user-owned context object. Types may include note, link,
selected text, code snippet, reference, summary, or encrypted
attachment.

Fields: - Stable UUID, owner/account ID, schema version, type - Title
and optional description - Content or encrypted payload reference -
Source provenance, capture timestamp - Created/updated/archived
timestamps - Tags and collection memberships - Typed relationships to
other Pills - Revision metadata - Permission/sharing scope -
Retention/deletion state - Integrity metadata where useful

Illustrative logical object:

``` json
{
  "id": "uuid",
  "schemaVersion": 1,
  "ownerId": "account-id",
  "type": "note",
  "title": "Project architecture",
  "payload": {"format": "text/markdown", "content": "User-authored content"},
  "source": {"kind": "manual", "url": null, "capturedAt": "ISO-8601"},
  "tags": ["architecture"],
  "collectionIds": [],
  "relationships": [],
  "revision": 1,
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601",
  "archivedAt": null
}
```

This is a logical model, not necessarily the server representation. If
end-to-end encryption is selected, do not send plaintext payloads to the
server.

Other concepts: - **Account / Session / Device:** identity,
authorization lifetime, registered installation. - **Vault:** local
encrypted store bound to one identity. - **Collection:** user-defined
group of Pills. - **Context Bundle:** reviewed destination-specific
package of selected context. - **Entitlement:** server-verified
subscription access. - **Topic:** floating/persistent context assistant
UI. - **Context Compiler:** deterministic retrieval, filtering, and
packaging pipeline.

## 4. Architecture and stack

Use a TypeScript monorepo and modular-monolith backend. Share domain
rules, schemas, API contracts, and design tokens; use
platform-appropriate UI interactions.

Proposed stack (verify current compatibility, maintenance, licensing,
and quotas before committing): - Mobile: Expo + React Native +
TypeScript. - Desktop: Tauri + React; Rust only for necessary OS
integration. - Web/extension: React + TypeScript. - Monorepo: pnpm
workspaces; Turborepo if useful, not mandatory. - Local persistence:
SQLite, with maintained platform-compatible bindings. - Local search:
SQLite FTS5 where supported. - Backend: Cloudflare Workers. -
Metadata/sync records: Cloudflare D1. - Encrypted attachments:
Cloudflare R2. - Authentication: managed identity provider supporting
mobile/desktop OAuth/OIDC flows. - Mobile billing: RevenueCat or
equivalent where supported. - Eligible web/desktop billing: Stripe or a
permitted provider. - CI: GitHub Actions. - Mobile builds: EAS Build or
a verified alternative. - Monitoring: Sentry or equivalent with
privacy-safe redaction.

Do not introduce Kubernetes, microservices, vector DBs, or GPUs without
evidence they are needed. Basic capture/search/sync must not require a
paid AI model.

### Logical architecture

``` text
Mobile / Desktop / Web / Extension
               |
     Shared Domain + API Client
               |
       +-------+--------+
       |                |
 Local Vault       Authenticated API
 SQLite/Search     AuthN/AuthZ/Rate limits
       |                |
       |          Modular Services
       |       Pills / Sync / Devices /
       |       Blobs / Entitlements /
       |       Webhooks / MCP / Health
       |                |
       |             D1 + R2
       |
 Context Compiler -> Preview -> User-approved destination
```

The local vault is the working copy. The server should store only
necessary metadata and encrypted content as required by the chosen
design. Do not claim end-to-end encryption until key generation,
exchange, recovery, rotation, device enrollment/revocation, and metadata
exposure have been designed and tested.

## 5. Folder structure

Use this as a target, not a reason to create empty modules:

``` text
pill/
├── apps/
│   ├── mobile/                 # Expo Android/iOS
│   │   ├── app/
│   │   └── src/features/{auth,vault,pills,collections,search,topic,compiler,sync,settings,billing}/
│   ├── desktop/                # Tauri Windows/Linux
│   │   ├── src/
│   │   └── src-tauri/{src,capabilities}/
│   ├── web/                    # Optional account/billing pages
│   └── extension/              # Browser extension, manifest v3 where supported
│       └── src/{background,content,popup,options,shared}/
├── services/
│   └── api/
│       ├── src/{router,middleware,db,security,observability,config}/
│       ├── src/modules/{auth,accounts,devices,pills,collections,sync,blobs,entitlements,webhooks,mcp,health}/
│       ├── migrations/
│       ├── test/
│       └── wrangler.toml
├── packages/
│   ├── domain/
│   ├── schemas/
│   ├── api-client/
│   ├── local-store/
│   ├── crypto/
│   ├── sync-engine/
│   ├── context-compiler/
│   ├── topic-core/
│   ├── permissions/
│   ├── billing/
│   ├── design-tokens/
│   ├── ui/
│   ├── telemetry/
│   └── test-utils/
├── infra/{environments,scripts,monitoring,backup-restore}/
├── docs/{ARCHITECTURE,DECISIONS,API,DATA_MODEL,THREATS,PRIVACY,BILLING,RELEASE,FREE_TIER_BUDGET,STATUS}.md
├── tests/{integration,contract,security,end-to-end}/
├── .github/workflows/
├── .env.example
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

## 6. Frontend and visual philosophy

Design a premium, minimal, calm interface consistent across mobile,
desktop, web, and extension.

Visual language: - Near-black / deep charcoal background. - Dark
blue-green raised surfaces. - Teal/mint primary accents and restrained
cyan. - White primary text and muted cool-gray secondary text. - Thin
borders, purposeful spacing, crisp typography, subtle motion. - No
clutter, excessive neon, heavy gradients, noisy glass effects, or
decorative charts without value. - Use semantic design tokens and
accessible contrast. - Support a light theme if practical without
changing the visual identity.

Suggested tokens:

``` css
:root {
  --bg: #0B1012;
  --surface: #111A1D;
  --surface-raised: #172326;
  --border: #26383B;
  --text: #F1F7F7;
  --text-muted: #9AAEB0;
  --primary: #2DD4BF;
  --primary-hover: #5EEAD4;
  --cyan: #67E8F9;
  --danger: #F87171;
  --warning: #FBBF24;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;
}
```

UI rules: - Responsive layout, keyboard navigation, focus indicators,
reduced motion. - Loading, empty, error, offline, syncing, conflict,
locked, expired-session and permission-denied states. - No dead buttons.
Mark genuinely unavailable features clearly. - Show sync state
unobtrusively. - Show exactly what context is being shared and with
which destination. - Confirm irreversible deletion, key reset, device
revocation, or external data transfer. - No dark patterns, fake urgency,
fake metrics, or deceptive subscription UI. - Mobile uses
platform-appropriate navigation; desktop gets shortcuts and command
palette; extension stays compact.

Core screens: 1. Welcome/onboarding 2. Signup/login/recovery 3.
Home/recent Pills 4. Search 5. Pill detail/editor 6. Create/capture 7.
Collections/relationships 8. Topic panel 9. Context Compiler preview 10.
Sync/device status 11. Privacy/permissions 12. Account/identity switcher
13. Subscription/usage 14. Import/export 15. Settings/diagnostics 16.
Account deletion 17. Offline/error recovery

## 7. Topic agent

Topic is a user-controlled assistant UI and orchestration layer, not an
unrestricted autonomous agent.

MVP actions: - Open by button or keyboard shortcut. - Capture selected
text, URL, or explicit user note. - Search Pills and collections. -
Suggest related context with provenance. - Let users choose context for
a task. - Preview a Context Bundle before sending it. - Show source,
timestamp, and sync state. - Provide visible capture state, excluded
domains, and revocable permissions.

Use a typed, permissioned action registry: - `capture_selection` -
`capture_url` - `create_note` - `search_context` - `get_pill_metadata` -
`get_pill_content` (requires explicit scope) - `list_collections` -
`create_context_bundle` - `export_selected` - `get_sync_status`

Each action must define input/output schema, capability, data
classification, confirmation requirement, audit event, timeout, quota,
and network access. Never allow arbitrary shell commands or unrestricted
filesystem access. Treat retrieved text and model output as untrusted.

AI policy: - Save/search/edit/sync/compile must work without paid AI. -
AI summaries and semantic search are optional adapters. - Disclose
external model processing and obtain appropriate consent. - Apply
redaction, limits, timeouts, quotas, and provider-retention checks. -
Never send the whole vault silently. - Never claim local inference
unless a local model is actually running.

## 8. Context Compiler

Purpose: prepare relevant, permission-checked, size-bounded context for
a specific task/destination. Never concatenate the whole vault by
default.

Pipeline: 1. Intake task, destination, selected sources, and size
budget. 2. Bind to authenticated account, session, and active vault. 3.
Validate input and destination. 4. Retrieve candidates from selected
Pills/tags/collections/relationships. 5. Enforce permissions,
exclusions, deletion, and sensitivity policy. 6. Rank relevance
deterministically first; optional model/embedding adapter later. 7.
Deduplicate while retaining source references. 8. Surface stale or
conflicting information. 9. Enforce context budget without misleading
truncation. 10. Mark source content as untrusted data; do not let it
override policy or tool permissions. 11. Preserve provenance: source
IDs, title, timestamps, links where available. 12. Show an exact
preview. 13. Require confirmation before external transfer unless the
user explicitly configured a narrow recurring permission. 14. Deliver
only through a specific destination adapter. 15. Record a minimal audit
event without private payload. 16. Define expiry and deletion for
temporary bundles.

Bundle fields: ID, schema version, task, destination, created/expiry
timestamps, selected items with provenance and trust labels, conflicts,
warnings, budget, consent record, and optional integrity metadata.

Initial modes: Quick Context, Research Context, Coding Context, Writing
Context, Personal Continuity. These are templates over one pipeline, not
separate hidden data stores.

Tests: no cross-account data; exclude revoked/deleted sources; obey size
budget; preserve provenance; surface conflicts; block unauthorized
export; resist prompt-injection payloads; no private content in logs.

## 9. Login, logout, and identity isolation

Use managed authentication and standard secure flows. Use PKCE for
public-client OAuth/OIDC where applicable. Store tokens in platform
secure storage. Never build a custom password system or use a raw
password directly as an encryption key.

Login: - Establish the authenticated account. - Unlock only that
account's vault. - Use a documented key-management design. - Handle
recovery, expiry, offline errors, and revoked sessions clearly.

Identity boundaries: - Scope every local query and API operation to the
active identity. - Use separate vault keys/namespaces. - Clear decrypted
caches on switch/logout. - Bind background jobs and queued writes to the
identity that created them. - Revalidate identity/session before
applying queued changes. - Fail closed if the correct vault cannot be
unlocked.

Logout must: 1. Stop new actions under the session. 2. Cancel or
quarantine in-flight/background work for that identity. 3. Flush only
safe, already-encrypted queued changes under a documented policy. 4.
Clear tokens from secure storage. 5. Clear active identity and decrypted
memory caches. 6. Lock vault and close handles where appropriate. 7.
Clear temporary context previews and session-owned buffers where
feasible. 8. Return to signed-out/account chooser. 9. Revoke server
session when supported; queue revocation if offline. 10. Preserve
persistent encrypted vault data.

Do not promise that logout erases screenshots, clipboard history, OS
caches, compromised devices, backups, or copies already sent elsewhere.
Account deletion is separate and must define export, sync tombstones,
blob cleanup, backup retention, and legal exceptions.

Release-blocking tests: - Account A cannot read Account B. - Switching
accounts clears previous UI and decrypted cache. - Old queued writes
cannot run as a new identity. - Revoked devices cannot sync. - Expired
sessions fail closed. - Guessing IDs does not bypass authorization. -
Client cannot forge paid entitlements.

## 10. Context moderation and privacy

Moderation means safe handling and user control---not silently censoring
normal notes.

Suggested labels: - General - Potentially sensitive - Credential-like -
External/untrusted source - User-marked confidential

Classifiers are fallible. Treat them as warnings, not guarantees.

Rules: - Warn about apparent passwords, API keys, recovery codes,
payment data, or private keys. - Offer cancel, redact, or
protected-local-save options where appropriate. - Never auto-upload
credentials or store raw auth tokens in a Pill. - Support excluded
domains and source types. - Avoid password fields and sensitive browser
surfaces. - Respect private/incognito modes and platform limitations. -
Show where content is stored and whether it syncs. - Provide correction
for false positives. - Do not send content to a moderation service
without disclosure and consent. - Sanitize HTML/Markdown and prohibit
unsafe scripts. - Treat pages, documents, snippets, model outputs, and
MCP results as untrusted. - Block SSRF: reject prohibited
schemes/private IPs and validate redirects if server fetching is
implemented. - Permissions, billing, identity, and tools must never be
changed by retrieved content.

## 11. Sync engine

Requirements: - Durable offline queue. - Idempotency keys. -
Cursor-based incremental pull. - Bounded exponential backoff with
jitter. - Timeouts and retry policies. - Tombstones and revision
tracking. - Conflict preservation and user-facing resolution. - Device
revocation. - Schema compatibility. - Quota checks and resumable
encrypted blob upload where supported.

Conflict rules: - Merge independent metadata only when deterministic. -
Preserve concurrent note edits or ask the user to resolve. - Do not
silently resurrect deleted data. - Treat permissions and identity
changes as security-sensitive. - Preserve conflicts until
resolved/dismissed.

Tests: offline edits, duplicate pushes, lost response/retry, two-device
conflict, delete while offline, revoked device with queued writes,
expired session, account switch mid-sync, quota reached, partial blob
upload.

## 12. Backend API

Use versioned `/v1` REST endpoints with runtime validation, stable error
codes, pagination, rate limits, idempotency, and contract tests.

Health: - `GET /v1/health` - `GET /v1/version`

Account/devices: - `GET /v1/me` - `GET /v1/me/entitlements` -
`POST /v1/devices/enroll` - `GET /v1/devices` -
`POST /v1/devices/:deviceId/revoke` - `POST /v1/account/export` -
`POST /v1/account/deletion-request`

Pills: - `POST /v1/pills` - `GET /v1/pills` - `GET /v1/pills/:pillId` -
`PATCH /v1/pills/:pillId` - `DELETE /v1/pills/:pillId` -
`POST /v1/pills/:pillId/relationships` -
`DELETE /v1/pills/:pillId/relationships/:relationshipId`

Collections: - `POST /v1/collections` - `GET /v1/collections` -
`PATCH /v1/collections/:collectionId` -
`DELETE /v1/collections/:collectionId`

Sync: - `POST /v1/sync/push` - `GET /v1/sync/pull?cursor=...` -
`GET /v1/sync/status`

Encrypted blobs: - `POST /v1/blobs/upload-ticket` -
`POST /v1/blobs/:blobId/complete` -
`POST /v1/blobs/:blobId/download-ticket` - `DELETE /v1/blobs/:blobId`

Context: - `POST /v1/context/preview` - `POST /v1/context/bundles` -
`GET /v1/context/bundles/:bundleId` -
`DELETE /v1/context/bundles/:bundleId`

Billing: - `GET /v1/me/entitlements` - `POST /v1/webhooks/revenuecat` -
`POST /v1/webhooks/stripe`

MCP: - Implement only after core permissions work. - Expose narrow,
scoped tools, read-only by default. - Confirm current official MCP
specification and SDK instead of inventing protocol details.

API rules: - Authenticate private routes and authorize each resource. -
Validate all inputs and size limits. - Rate-limit expensive and
sensitive routes. - Never return stack traces or secrets. - Do not log
private request bodies. - Verify webhook signatures and process events
idempotently. - Configure CORS narrowly; use a deliberate
extension-origin policy. - Use HTTPS in production and document breaking
API changes. - If server-side compilation sees plaintext, disclose that
and do not call it end-to-end encrypted.

## 13. Browser extension

Start with a Chromium-based browser using Manifest V3 where supported;
add other browsers only after compatibility tests.

MVP: - Explicit capture of selected text and current URL/title. -
Optional note and collection choice. - Save through authenticated API or
an authenticated local desktop bridge. - Visible success/failure
state. - Excluded domains and private browsing controls. - Search recent
Pills only if permissions and implementation justify it.

Security: - Prefer `activeTab` and user gestures over broad host
permissions. - Never continuously capture all pages or keystrokes. - Do
not inject into password fields. - Validate extension messages and
payload size. - Never expose session tokens to page scripts. - No remote
executable code. - Use least permissions and explain them. - Treat page
content as untrusted. - Extension storage is not automatically
equivalent to OS secure storage. - Do not collect browsing history by
default.

## 14. MCP integration

MCP is an interoperability layer, not unrestricted access to the vault.

Initial tools: - `pill_search` - `pill_get_metadata` -
`pill_get_content` (explicit scope) - `pill_create_draft` -
`pill_list_collections` - `pill_context_preview`

Start read-only. Writes and external actions require explicit
grants/confirmation.

Each client has a distinct grant. Scope by account, tool, and data
class. Support revocation, rate limits, size caps, audit events, and
least privilege. Never expose raw keys, credentials, arbitrary
shell/filesystem tools, or a vault-dump tool. Use the current official
MCP specification and maintained SDK. Document local versus remote
transport and test malformed calls, unauthorized tools, oversized
inputs, revoked grants, and injection payloads.

## 15. Windows and Linux desktop

Use Tauri with React/TypeScript; Rust only for narrowly scoped OS
integration.

Features: - Home, recent context, search, collections, editor. - Topic
panel and configurable keyboard shortcut. - Optional system tray and
opt-in start-on-login. - Local vault, offline queue, device/sync
settings. - Export/import, account switcher, secure logout. - Updates
and release notes.

Security: - Restrict Tauri capabilities and IPC commands. - No arbitrary
shell commands from the webview. - Avoid broad filesystem access. -
Validate IPC inputs. - Use OS keyring/credential store through
maintained libraries. - Set a strict CSP and avoid remote content in
privileged webviews. - Verify update signing and deep-link handling.

Packaging: - Windows installer, signed when signing credentials are
available. - Linux AppImage and/or `.deb` first; support only tested
distributions. - Provide version, architecture, checksums, release
notes, and install/upgrade/uninstall tests. - Do not claim universal
Linux compatibility.

## 16. Android APK and iOS builds

"APK manufacturing" means reproducible, signed builds---not a claim that
one file works on every Android device.

Android: - Configure application ID, version, icon, splash, permissions,
deep links, and network security. - Produce debug APK for internal
testing. - Produce signed release APK only with secure signing and
update procedures. - Produce AAB for Google Play when required. - Keep
signing keys out of Git and logs; document secure backup. - Test on a
physical device: clean install, upgrade, logout, offline operation, sync
recovery, account switch. - Use separate preview/production profiles and
endpoints. - Example commands must be verified against actual scripts
and tools:
`bash   pnpm install   pnpm --filter mobile lint   pnpm --filter mobile typecheck   pnpm --filter mobile test   eas build --platform android --profile preview   eas build --platform android --profile production` -
Configure `eas.json`; use provider secret storage.

iOS: - Confirm Apple Developer account, signing, provisioning, bundle
ID, entitlements, privacy disclosures, icons, and store metadata. - Use
a supported cloud build or macOS environment. - Test on a physical
device. - Verify login, restore purchases, cancellation, account
deletion, and offline behavior. - Store approval timelines are outside
the code agent's control.

Do not ship debug endpoints or development secrets. Do not claim store
approval before it is confirmed.

## 17. Dynamic frontend state

Separate: - Server state: account metadata, devices, entitlements, sync
cursor. - Local persistent state: Pills, collections, preferences,
search index. - Ephemeral UI state: panels, selection, unsaved input. -
Security state: active identity, vault lock, permissions, session. -
Sync state: pending operations, conflicts, retry state. - Feature flags:
validated, safe by default, used for staged rollout.

Handle stale responses, canceled requests, offline state, sync races,
and logout invalidation. Use pagination/virtualization for large
collections. Debounce search accessibly. Do not execute arbitrary remote
UI code. Keep local state versioned and avoid duplicate sources of
truth.

## 18. Subscription SaaS

Proposed prices to validate: - **Free --- ₹0:** local vault, basic
capture, collections, local search, manual export. - **Plus ---
₹199/month:** encrypted multi-device sync, higher quota, advanced
retrieval. - **Pro --- ₹499/month later:** advanced compiler and
integrations. - **Developer --- ₹999/month later:** API/MCP access and
higher usage caps.

Launch with Free and one paid tier if possible. Do not promise unlimited
AI or storage.

Rules: - Server is the authority for entitlements. - Never trust a
client-only `isPro` flag. - Verify provider-signed webhook events. -
Make webhook processing idempotent and replay-resistant. - Handle
renewal, cancellation, refunds, chargebacks, grace periods, expiration,
and provider outages. - Preserve user data when a subscription
expires. - Support purchase restoration where required. - Follow current
store billing policies; do not route users around them. - Meter storage,
transfer, sync, AI tokens, compilation size, API requests, and MCP
calls. - Make limits clear and prevent surprise overages.

## 19. Free-tier infrastructure and configs

Proposed low-cost starting point: - Cloudflare Workers for API. - D1 for
metadata/sync records. - R2 for encrypted attachments. - Managed
identity provider. - GitHub for source/CI within current quota. - EAS or
alternative for builds. - Sentry/equivalent within current allowance. -
Optional email service. - No paid AI required for core save/search/sync.

Free tiers change. Verify current quotas, overage prices, regions,
terms, retention, data-processing terms, and availability. Record the
findings and review monthly.

Environments must be distinct: development, staging, production. Use
separate databases, buckets, auth clients, webhook secrets, allowed
origins, and monitoring.

Example `.env.example` --- placeholders only:

``` dotenv
APP_ENV=development
APP_NAME=PILL
APP_BASE_URL=http://localhost:3000
API_BASE_URL=http://localhost:8787

AUTH_ISSUER_URL=
AUTH_CLIENT_ID=
AUTH_AUDIENCE=

CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_DATABASE_ID=
CLOUDFLARE_R2_BUCKET=

REVENUECAT_PUBLIC_SDK_KEY=
REVENUECAT_WEBHOOK_SECRET=
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

SENTRY_DSN=
AI_PROVIDER=
AI_API_KEY=
AI_MODEL=
```

Remove unused variables after selecting providers. Only embed keys the
provider explicitly documents as public. Never bundle secret keys in
apps or extensions. Use provider-managed secrets for Workers, CI, and
build services.

Cost controls: - Set usage alerts and quotas where available. - Limit AI
requests, input size, and retries. - Rate-limit by account/device. -
Monitor Worker requests/CPU, D1 operations, R2
storage/operations/egress, email, AI cost, and build minutes. - Create
monthly cost reports and an emergency cost-control switch. - If a quota
is exhausted, fail gracefully and preserve local work. Never silently
weaken encryption/privacy.

## 20. Data lifecycle

Logical tables/records may include accounts/provider references,
devices, Pill metadata/revisions, collections, relationships, sync
operations/cursors, tombstones, blob metadata, entitlements, webhook
events, integration grants, and audit events.

Requirements: - Schema migrations, indexes, constraints, and
compatibility rules. - Retention/deletion policy. - Data export and
account deletion. - Backup/restore tests. - Idempotent webhook
handling. - Minimal metadata exposure. - No plaintext context in logs. -
If payloads are end-to-end encrypted, acknowledge metadata leakage such
as sizes, timing, account relationships, and access patterns unless
mitigated.

## 21. Reliability and deployment

Do not promise zero downtime. Engineer for graceful degradation: - Local
capture/search works during API outages. - Failed sync is queued and
retried idempotently. - Database changes are backward-compatible and
deploy in safe order. - Backups are restored in tests, not merely
scheduled. - Keep a tested rollback path. - Monitor API errors/latency,
sync failure/queue age, webhook failures, storage, client crashes, and
AI cost. - Never log context, passwords, tokens, keys, or sensitive URLs
by default.

CI/release: 1. Format/lint/typecheck/unit tests/secret scan/dependency
audit. 2. Build preview artifacts. 3. Deploy to staging. 4. Apply
backward-compatible migrations. 5. Run integration/smoke/security tests.
6. Deploy backend with rollback. 7. Build signed platform artifacts. 8.
Test real devices and supported OS targets. 9. Release to a small pilot
group. 10. Monitor and expand only after gates pass.

## 22. Testing and release gates

Unit tests: schemas, ranking/budget, permissions, entitlements, sync
conflicts, account transitions.

Integration tests: migrations, API authorization, sync, blob tickets,
webhook verification, device revocation, export/deletion, MCP
permissions.

Cross-identity tests are release-blocking: - Account A cannot read
Account B's data. - Account switch clears decrypted cache/UI. - Old
queued writes cannot run under a new identity. - Revoked devices cannot
sync. - Expired sessions fail closed. - Guessed IDs do not bypass
authorization. - Client cannot forge entitlements.

End-to-end tests: - Sign up/login/create/edit/search/logout/login. -
Offline edits and sync recovery. - Two-device conflict. -
Shared-computer identity switch. - Context preview/consent/export. -
Purchase/restore/cancel/expire/refund sandbox events. - Browser
capture. - MCP read-only scope. - Upgrade from previous release. -
Export and delete account.

Release gates: - Critical flows work on real target platforms. - No
unresolved critical/high severity security issues. - Identity isolation
tests pass. - Migration and backup/restore tested. - Billing lifecycle
tested in sandbox. - Production secrets handled correctly. - Privacy
disclosures match actual data flows. - Monitoring and rollback
available. - No production path relies on mock data.

Independent security review is recommended before strong public security
claims.

## 23. 15-day execution plan

This is an aggressive release-candidate plan, not a guarantee of store
approval or a fully audited production launch.

-   **Day 1:** inspect repository/environment; verify stack;
    architecture, risks, Git, CI.
-   **Day 2:** design tokens, Pill schema, validation, DB migration
    plan.
-   **Days 3--4:** local vault, capture/edit/search/archive,
    collections, UI states.
-   **Days 5--6:** API, authorization, sync queue, cursors, idempotency,
    encrypted blob flow.
-   **Days 7--8:** logout, identity switch, device revocation,
    cross-account security tests.
-   **Days 9--10:** Topic and Context Compiler
    preview/provenance/permission pipeline.
-   **Day 11:** browser extension; MCP only if permissions are ready.
-   **Day 12:** sandbox billing, webhooks, entitlements, quotas.
-   **Days 13--14:** real-device/platform testing, monitoring,
    backup/restore, privacy/account deletion.
-   **Day 15:** release gate review; ship only platforms that pass,
    leave others in beta.

If time is insufficient, reduce feature scope instead of skipping
security, data integrity, or tests.

## 24. Required deliverables

-   Working monorepo and README.
-   Architecture diagram and decision log.
-   Pill and Context Bundle schemas.
-   API contract docs and DB migrations.
-   `.env.example` with placeholders only.
-   Separate environment configs.
-   CI workflows and test suites.
-   Android build profiles and reproducible build instructions.
-   iOS signing/build instructions.
-   Windows/Linux packaging instructions.
-   Extension source and permission rationale.
-   MCP tools/scopes documentation.
-   Billing lifecycle and entitlement documentation.
-   Threat model, privacy/data-flow docs.
-   Backup/restore and rollback runbook.
-   Free-tier budget/limit register.
-   `docs/STATUS.md` with actual test results and remaining work.

## 25. Final instruction

Do not implement everything at once. Inspect first and report: 1. What
exists. 2. What is missing. 3. Stack compatibility with this machine and
available accounts. 4. Final folder structure. 5. Dependencies and
free-tier limits to verify. 6. Risks around encryption, auth, sync,
billing, mobile builds, and store policy. 7. Milestones and acceptance
criteria. 8. The first small implementation task.

Then implement only the first milestone, run real checks, report
failures honestly, update `docs/STATUS.md`, and wait before broad
architectural changes.

**Definition of success:** Users can reliably save, find, protect,
synchronize, and intentionally reuse their context across supported
platforms, with transparent permissions and no cross-identity data
leakage.

**Design philosophy:** Minimal. Calm. Precise. Privacy-conscious.
Consistent. Fast. Useful. No clutter, no deceptive behavior, no fake
functionality.
