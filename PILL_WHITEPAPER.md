# PILL

## Portable Intelligence, Linked Locally

### Product, Architecture, Security, and Operating Model Whitepaper

**Version:** 1.0 --- Concept and implementation blueprint\
**Status:** Proposed design; implementation and security claims require
verification\
**Audience:** Founders, engineers, design partners, investors, and
integration developers

------------------------------------------------------------------------

## Executive Summary

PILL is a proposed cross-platform context-continuity system. It helps
people capture useful information from their digital work, organize it
into portable context objects called **Pills**, and intentionally reuse
selected context across supported devices, applications, and AI tools.

Today, context is scattered across browser tabs, documents, code,
screenshots, notes, and AI conversations. When people switch devices or
tools, they often have to reconstruct what they were doing, repeat
instructions, and search for information they already found. PILL aims
to reduce that friction without requiring users to surrender control of
their personal context.

PILL combines five main ideas:

1.  **Pills:** versioned, source-aware context objects.
2.  **Topic:** a user-controlled capture and retrieval interface.
3.  **Vault:** a local store separated by identity.
4.  **Context Compiler:** a permission-aware pipeline that assembles
    task-specific context.
5.  **Sync and integrations:** controlled continuity across devices,
    browsers, and supported AI tools.

The proposed product is local-first: core capture, editing, and local
search should remain useful offline. Cloud services provide optional
synchronization, account coordination, encrypted attachment storage, and
subscription entitlements. AI features are optional adapters, not a
requirement for basic storage and retrieval.

This document describes a proposed architecture, product behavior,
security objectives, risks, and staged delivery plan. It is not proof
that any feature is already implemented, audited, or approved by an app
store. Security and performance claims must be validated by testing and
independent review.

## 1. Problem Statement

Digital work is fragmented across tools and devices. A person may
research a subject in a browser, save a document, discuss it with an AI
assistant, edit code on a desktop, and later continue on a phone. Each
environment has only part of the story.

Common consequences include: - Repeated searches and repeated
explanations. - Lost source links and provenance. - Inconsistent notes
across devices. - Context copied into tools without clear scope or
review. - Difficulty separating work, personal, and shared-computer
identities. - Dependence on individual applications' closed memory and
export formats.

PILL proposes a portable context layer that lets users capture what
matters, decide how it is organized, and choose what context to reuse.

## 2. Vision and Product Principles

### Vision

**Capture anywhere. Continue everywhere. Keep every identity separate.**

### Principles

-   **User control:** the user chooses what is captured, retained,
    shared, or deleted.
-   **Local-first:** basic storage and search do not depend on cloud
    availability.
-   **Identity isolation:** one account must never access another
    account's vault.
-   **Explicit capture:** no always-on recording or hidden collection by
    default.
-   **Portable data:** documented export and import paths.
-   **Source awareness:** retain provenance where available.
-   **Least privilege:** integrations receive only the access they need.
-   **Graceful degradation:** network or AI failure should not destroy
    local work.
-   **Honest security:** disclose limitations and avoid claims
    unsupported by tests.
-   **Interoperability:** versioned schemas and adapters rather than a
    single-provider lock-in.

## 3. Product Scope

### Core concepts

**Pill** --- A user-owned, versioned context object. It may contain a
note, link, selected text, code snippet, source reference, user-reviewed
summary, or reference to an encrypted attachment.

**Topic** --- A compact interface for explicit capture, search,
related-context discovery, and review of context before it is used
elsewhere. Topic is not an unrestricted autonomous agent.

**Vault** --- The local store for a user's context. Each identity has
its own namespace and key boundary.

**Context Bundle** --- A task-specific package of selected Pills and
provenance, prepared for a particular destination or workflow.

**Context Compiler** --- The deterministic pipeline that validates,
retrieves, filters, ranks, deduplicates, and packages context under
permission and size constraints.

**Sync Engine** --- A local queue and server protocol for propagating
changes, preserving revisions, and handling conflicts.

**Integration adapter** --- A bounded interface to a browser, AI
assistant, MCP client, or other approved destination.

### Initial target users

Potential early users include developers, researchers, students,
knowledge workers, founders, and frequent AI-tool users who regularly
move between devices and applications. These are hypotheses for customer
discovery, not validated market findings.

### MVP scope

-   Account login/logout and identity switching.
-   Local vault, notes/context objects, tags, collections, and local
    search.
-   Explicit capture from supported sources.
-   Topic panel.
-   Context Compiler preview with provenance.
-   Encrypted synchronization, if the key-management design is complete.
-   Android and iOS clients.
-   Windows and Linux desktop clients.
-   A narrow browser extension.
-   A limited, permission-controlled MCP integration.
-   Free tier and one paid subscription tier.
-   Import/export, account deletion, monitoring, backup/restore, and
    security tests.

Advanced automatic capture, broad integrations, autonomous actions, and
costly hosted AI should be deferred until the core system is reliable.

## 4. System Architecture

### Logical overview

``` text
Mobile App / Desktop App / Browser Extension
                     |
             Shared Domain Contracts
                     |
       +-------------+----------------+
       |                              |
 Local Vault                     Authenticated API
 SQLite + local search           Authentication/Authorization
       |                              |
       |                       Modular Backend
       |                Pills / Sync / Devices / Blobs
       |                Entitlements / Webhooks / MCP
       |                              |
       |                         D1 + R2 (proposed)
       |
 Context Compiler
       |
 Context Bundle Preview
       |
 Explicit user approval and destination adapter
```

### Proposed implementation stack

The following is a candidate stack, subject to a compatibility and
licensing check before implementation:

-   **Mobile:** Expo, React Native, TypeScript.
-   **Desktop:** Tauri, React, TypeScript, narrowly scoped Rust
    integrations.
-   **Browser extension:** TypeScript and a browser extension manifest
    supported by the target browsers.
-   **Monorepo:** pnpm workspaces; optional Turborepo.
-   **Local storage:** SQLite and FTS5 where supported.
-   **Backend:** Cloudflare Workers.
-   **Metadata/sync database:** Cloudflare D1.
-   **Encrypted attachments:** Cloudflare R2.
-   **Authentication:** maintained identity provider supporting suitable
    OAuth/OIDC flows.
-   **Billing:** a provider appropriate to each platform and its current
    store rules.
-   **CI/CD:** GitHub Actions.
-   **Builds:** EAS or another verified mobile build workflow.
-   **Monitoring:** a privacy-configured crash/error service.

Do not introduce Kubernetes, multiple microservices, a vector database,
or paid inference infrastructure until measured needs justify them.

### Local-first behavior

Local operations should include creating, editing, organizing, and
searching saved context. When offline, changes enter a durable local
queue. Synchronization resumes after connectivity returns. If the server
is unavailable, the application should show the state clearly rather
than discard user work.

### Backend shape

Prefer a modular monolith with clear module boundaries: - Accounts and
sessions - Device enrollment and revocation - Pills and collections -
Sync and conflict management - Encrypted attachment tickets -
Subscription entitlements - Billing webhooks - Integration grants -
Context Bundle metadata - Health and observability

This structure keeps deployment simpler for a small team while retaining
separable domain boundaries.

## 5. Pill Data Model

A logical Pill schema could include:

``` json
{
  "id": "uuid",
  "schemaVersion": 1,
  "ownerId": "account-id",
  "type": "note",
  "title": "Project architecture",
  "payload": {
    "format": "text/markdown",
    "content": "Example user-authored content"
  },
  "source": {
    "kind": "manual",
    "url": null,
    "capturedAt": "ISO-8601 timestamp"
  },
  "tags": ["architecture"],
  "collectionIds": [],
  "relationships": [],
  "revision": 1,
  "createdAt": "ISO-8601 timestamp",
  "updatedAt": "ISO-8601 timestamp",
  "archivedAt": null
}
```

This is a logical illustration, not a final database schema. If
end-to-end encryption is adopted, payloads should be encrypted on the
client before upload. The server representation may contain ciphertext
and the minimum metadata needed for synchronization.

### Relationships and revisions

Pills may link to other Pills using typed relationships such as
"supports," "derived from," "related to," or "supersedes." Relationship
operations should be validated and versioned. Concurrent edits must not
silently overwrite each other.

### Provenance

Where available, record source type, URL, title, capture time, and user
attribution. Preserve the difference between original source material,
user-authored content, and AI-generated summaries.

## 6. Topic: User-Controlled Context Interface

Topic should provide a consistent way to capture and retrieve context
without behaving like a hidden surveillance agent.

### MVP interactions

-   Open by button or configured keyboard shortcut.
-   Capture selected text or a page URL after a user action.
-   Create a note.
-   Search saved context.
-   Show related context with source links.
-   Select Pills for a task.
-   Preview the context that would be sent to a destination.
-   Display sync state and relevant permission status.

### Action model

Every integration action should have a declared input schema, output
schema, permission scope, data classification, timeout, quota,
confirmation rule, and audit event.

Example action names: - `capture_selection` - `capture_url` -
`create_note` - `search_context` - `get_pill_metadata` -
`get_pill_content` - `list_collections` - `create_context_bundle` -
`get_sync_status`

Do not permit arbitrary shell execution, unrestricted filesystem access,
or unrestricted vault export. Treat content retrieved from webpages,
files, and models as untrusted input.

## 7. Context Compiler

The Context Compiler is the central policy boundary for context reuse.

### Pipeline

1.  Accept a task, target destination, selected sources, and a size
    budget.
2.  Bind the operation to the current account, session, and vault.
3.  Validate the task and destination.
4.  Retrieve candidate Pills from user-selected items, collections,
    tags, or relationships.
5.  Apply permissions, exclusions, deletion state, and sensitivity
    rules.
6.  Rank candidates using deterministic signals first; optional
    model-based ranking can be added later.
7.  Deduplicate while retaining provenance.
8.  Identify stale or contradictory material.
9.  Enforce the destination's context budget.
10. Label retrieved content as untrusted data; do not allow it to
    override system policy or tool permissions.
11. Generate a preview with source references and warnings.
12. Require approval before external transfer unless a narrow, explicit
    user-configured permission applies.
13. Deliver through the selected destination adapter.
14. Record minimal operational metadata without storing private payloads
    in logs.
15. Apply the defined expiry and deletion policy to temporary bundles.

### Bundle contents

A Context Bundle should identify its schema version, task, destination,
creation and expiry times, selected sources, provenance, trust labels,
warnings, conflicts, budget, and consent state.

### Non-goals

The compiler should not silently send the entire vault, hide sources,
invent missing facts, or let retrieved text grant itself new
permissions.

### Testable properties

-   No cross-account retrieval.
-   Deleted or revoked content is excluded.
-   Context budget is enforced.
-   Provenance survives ranking and deduplication.
-   Conflicts are surfaced.
-   External transfer requires authorization.
-   Prompt-injection content cannot change permission policy.
-   Logs do not contain private context.

## 8. Login, Logout, and Identity Isolation

Identity isolation is a core product requirement, especially for shared
computers and devices.

### Login

-   Use a maintained identity provider and standard authentication
    flows.
-   Use PKCE for public OAuth/OIDC clients where applicable.
-   Store tokens in OS/platform secure storage.
-   Unlock only the vault belonging to the authenticated identity.
-   Apply a documented key creation, recovery, rotation, and device
    enrollment design.
-   Handle expired sessions and offline errors explicitly.

### Account switching

-   Stop actions associated with the prior identity.
-   Clear previous identity's UI state and decrypted caches.
-   Ensure queued operations remain bound to their originating account.
-   Unlock the next identity only after its own authentication and
    vault-unlock process succeeds.
-   Fail closed if identity or key state is ambiguous.

### Logout

Logout should: 1. Stop accepting new work under the current session. 2.
Cancel or quarantine in-flight work for that identity. 3. Flush only
safe encrypted pending writes under a documented policy. 4. Clear
session tokens from secure storage. 5. Clear the active identity and
decrypted in-memory caches. 6. Lock the vault and close local handles
where possible. 7. Clear temporary context previews and session-owned
buffers where feasible. 8. Return to the signed-out or account chooser
screen. 9. Revoke the server session when supported, queueing revocation
safely if offline. 10. Preserve the user's persistent encrypted vault.

Logout cannot guarantee erasure of screenshots, clipboard history,
operating-system caches, backups, compromised-device copies, or context
already sent to another service. Account deletion is a separate
lifecycle operation.

### Required security tests

-   Account A cannot read Account B's context.
-   Switching accounts clears prior decrypted state.
-   Old queued writes cannot run as a different identity.
-   Revoked devices cannot sync.
-   Expired sessions fail closed.
-   Guessing a resource ID does not bypass authorization.
-   A client cannot grant itself paid entitlements.

Any cross-account data leak is a release-blocking defect.

## 9. Security and Privacy Model

### Security objectives

-   Confidentiality of saved content.
-   Integrity and revision consistency.
-   Authentication and per-resource authorization.
-   Identity and device isolation.
-   Controlled sharing with integrations.
-   Data export and deletion.
-   Minimal data collection and transparent retention.

### Proposed cryptographic direction

Use maintained, audited cryptographic libraries. Consider authenticated
encryption such as AES-GCM or ChaCha20-Poly1305, with key management
appropriate to each platform. Use OS secure storage for device-held
secrets. Argon2id may be appropriate in a carefully designed
password-derived-key flow, but passwords must not be used directly as
encryption keys.

Before claiming end-to-end encryption, design and test: - Client-side
key generation and encryption. - Device key enrollment and exchange. -
Recovery and lost-device behavior. - Rotation and revocation. - Key
backup policy. - Multi-device synchronization. - Metadata exposed to the
service. - What happens to existing devices after account recovery.

If the server can decrypt content for search, moderation, or
compilation, the product must accurately disclose that architecture and
must not call it end-to-end encrypted.

### Threats

Relevant threats include: - Cross-account authorization mistakes. -
Stolen unlocked devices. - Malicious or compromised extensions. - Prompt
injection in captured content. - Malicious MCP clients. - Token leakage
and insecure local storage. - Subscription entitlement spoofing. -
Malicious uploads and oversized requests. - Webhook replay. - Data loss
from sync conflicts. - Secrets accidentally included in logs or
builds. - Cloud provider outage or quota exhaustion.

### Residual risks

Even with a strong design, a compromised operating system, screenshots,
clipboard managers, external providers, and previously exported data can
defeat some privacy expectations. Metadata such as timing, size, and
access patterns may remain visible to infrastructure providers unless
explicitly mitigated.

Independent security review should precede strong public security
claims.

## 10. Context Moderation and Content Handling

Moderation should help users handle sensitive or untrusted content, not
silently censor ordinary personal notes.

Potential labels: - General - Potentially sensitive - Credential-like -
External/untrusted source - User-marked confidential

Rules: - Warn about apparent passwords, API keys, recovery codes,
payment data, and private keys. - Offer cancel, redact, or
protected-local-save options where appropriate. - Never automatically
upload credentials. - Support excluded domains and source types. -
Respect private browsing and sensitive browser surfaces within platform
capabilities. - Show whether a capture is local-only or will sync. -
Allow users to correct false positives. - Do not send content to
external moderation services without disclosure and consent. - Sanitize
rendered Markdown/HTML and prohibit unsafe scripts. - Validate URLs and
redirects if server-side fetching is implemented. - Treat external
content and model output as untrusted. - Do not let retrieved content
change authentication, billing, or permissions.

## 11. Synchronization and Data Consistency

### Requirements

-   Durable offline queue.
-   Idempotency keys.
-   Cursor-based incremental pull.
-   Bounded exponential backoff with jitter.
-   Request timeouts and retry policies.
-   Revision tracking and deletion tombstones.
-   Device revocation.
-   Schema compatibility.
-   Resumable encrypted attachment transfer where supported.
-   User-visible sync status and conflict resolution.

### Conflict policy

Merge only fields whose semantics make deterministic merging safe.
Preserve concurrent note edits or ask the user to resolve them. Do not
silently resurrect deleted data. Permission changes and identity changes
must be treated as security-sensitive operations.

### Failure cases to test

-   Offline edits followed by reconnect.
-   Duplicate sync pushes.
-   Request timeout after the server accepted a change.
-   Two-device concurrent edits.
-   Delete while offline.
-   Revoked device with queued changes.
-   Account switch during sync.
-   Quota exhaustion.
-   Partial attachment upload.

## 12. API Design

The API should use a versioned `/v1` prefix, runtime validation, stable
error codes, pagination, idempotency, and contract tests.

### Example endpoint groups

**Health** - `GET /v1/health` - `GET /v1/version`

**Account and devices** - `GET /v1/me` - `GET /v1/me/entitlements` -
`POST /v1/devices/enroll` - `GET /v1/devices` -
`POST /v1/devices/:deviceId/revoke` - `POST /v1/account/export` -
`POST /v1/account/deletion-request`

**Pills and collections** - `POST /v1/pills` - `GET /v1/pills` -
`GET /v1/pills/:pillId` - `PATCH /v1/pills/:pillId` -
`DELETE /v1/pills/:pillId` - `POST /v1/collections` -
`GET /v1/collections` - `PATCH /v1/collections/:collectionId` -
`DELETE /v1/collections/:collectionId`

**Sync and blobs** - `POST /v1/sync/push` -
`GET /v1/sync/pull?cursor=...` - `GET /v1/sync/status` -
`POST /v1/blobs/upload-ticket` - `POST /v1/blobs/:blobId/complete` -
`POST /v1/blobs/:blobId/download-ticket` - `DELETE /v1/blobs/:blobId`

**Context** - `POST /v1/context/preview` - `POST /v1/context/bundles` -
`GET /v1/context/bundles/:bundleId` -
`DELETE /v1/context/bundles/:bundleId`

**Billing** - `GET /v1/me/entitlements` -
`POST /v1/webhooks/revenuecat` - `POST /v1/webhooks/stripe`

### API security

-   Authenticate private routes and authorize every resource.
-   Validate input and payload size.
-   Rate-limit sensitive and expensive routes.
-   Never return stack traces or secrets.
-   Do not log private request bodies.
-   Verify webhook signatures and process events idempotently.
-   Configure CORS narrowly and define an explicit extension-origin
    policy.
-   Use HTTPS in production.
-   Document API compatibility and migration strategy.

These endpoints are a proposal; implement only those supported by the
actual product.

## 13. Browser Extension

Start with one browser family and add others after compatibility tests.

MVP: - Explicit capture of selected text and current URL/title. -
Optional note and collection. - Visible success/failure feedback. -
Excluded domains and private browsing controls. - Optional recent-Pill
search with clear permissions.

Security requirements: - Prefer user-gesture permissions such as
`activeTab` over broad host access. - Never capture keystrokes or all
pages continuously. - Do not inject into password fields. - Validate
messages and payload size. - Never expose session tokens to page
scripts. - Do not load remote executable code. - Explain permissions in
plain language. - Do not assume extension storage is equivalent to OS
secure storage.

## 14. MCP Integration

MCP should provide a narrow interoperability surface, not unrestricted
vault access.

Initial tools: - `pill_search` - `pill_get_metadata` -
`pill_get_content` with explicit scope - `pill_create_draft` -
`pill_list_collections` - `pill_context_preview`

Begin read-only. Writes and external actions require explicit grants or
confirmation. Give each client its own grant, scoped by account, tool,
and data class. Support revocation, rate limits, size limits, and
minimal audit events. Never expose raw encryption keys, credentials,
arbitrary shell access, or a vault-dump tool.

Use the current official MCP specification and a maintained SDK. Test
malformed requests, unauthorized tools, oversized inputs, revoked
grants, and prompt-injection payloads.

## 15. Cross-Platform Product Design

### Shared design language

-   Deep charcoal and blue-green surfaces.
-   Teal/mint primary accent and restrained cyan.
-   Clear typography and generous spacing.
-   Thin borders, rounded surfaces, subtle motion.
-   Accessible contrast and keyboard focus.
-   Responsive layouts and reduced-motion support.
-   Calm, uncluttered information hierarchy.

Example design tokens:

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
}
```

### Mobile

Core screens: onboarding, login, home, search, Pill editor, collections,
Topic, compiler preview, sync/devices, privacy, account switching,
subscription, import/export, settings, and deletion.

### Windows and Linux

Core screens plus keyboard shortcuts, optional tray behavior, local
vault management, update flow, and platform-specific secure storage.
Restrict desktop IPC permissions, use a strict Content Security Policy,
avoid arbitrary shell execution, and verify update signatures.

### Android and iOS builds

Android needs a reproducible build process, application ID, signing key
management, privacy disclosures, upgrade tests, and device testing.
Produce APKs for appropriate direct testing and AABs when required by
the distribution channel.

iOS needs suitable Apple signing, provisioning, bundle configuration,
device testing, privacy disclosures, and store metadata. A supported
macOS or cloud-build environment and appropriate developer account may
be required.

Store approval and external account setup cannot be guaranteed by the
code agent.

## 16. Subscription Model

Illustrative prices to validate with users and unit economics:

  ------------------------------------------------------------------------
  Plan                            Illustrative price Potential scope
  --------------------- ---------------------------- ---------------------
  Free                                            ₹0 Local vault, basic
                                                     capture, collections,
                                                     local search, manual
                                                     export

  Plus                                    ₹199/month Encrypted sync, more
                                                     devices, higher
                                                     quotas, advanced
                                                     retrieval

  Pro                                     ₹499/month Advanced compiler
                                                     features and
                                                     integrations

  Developer                               ₹999/month API/MCP access and
                                                     higher usage limits
  ------------------------------------------------------------------------

Launch with fewer plans if operationally simpler. Do not promise
unlimited storage or AI.

### Billing rules

-   The server is authoritative for entitlements.
-   A client-side flag cannot grant paid access.
-   Verify signed provider webhooks.
-   Make webhook processing idempotent.
-   Handle renewal, cancellation, refund, chargeback, grace period, and
    expiration.
-   Preserve user data when a subscription expires.
-   Support purchase restoration where required.
-   Follow the current billing policies for each store and distribution
    route.
-   Meter storage, transfer, sync, AI tokens, compiler size, API
    requests, and MCP calls.
-   Explain quotas and overage behavior before purchase.

Revenue and profitability depend on conversion, churn, taxes, payment
fees, support, infrastructure, AI costs, and acquisition costs;
subscription prices alone do not establish a viable business.

## 17. Infrastructure and Free-Tier Strategy

### Proposed starting infrastructure

-   Cloudflare Workers for API.
-   Cloudflare D1 for metadata and sync records.
-   Cloudflare R2 for encrypted attachments.
-   Managed authentication provider.
-   GitHub for source and CI.
-   EAS or an alternative for mobile builds.
-   Privacy-configured error monitoring.
-   Optional email provider.
-   No paid AI inference required for basic capture, local search, or
    synchronization.

Free-tier quotas, prices, data regions, terms, and overage rules change.
Verify them against current provider documentation before deployment and
review monthly. "Free tier" does not mean unlimited, permanent, or
production-SLA-backed.

### Environment separation

Create separate development, staging, and production environments with
distinct: - Databases and buckets. - Authentication clients and redirect
URIs. - Webhook secrets. - Allowed origins. - Monitoring projects. -
Build profiles. - API endpoints.

### Cost controls

-   Configure usage alerts where available.
-   Limit AI requests, input sizes, and retries.
-   Rate-limit by account and device.
-   Monitor request/CPU use, database operations, storage, transfer,
    email, AI costs, and build minutes.
-   Maintain a monthly cost register.
-   Provide an emergency cost-control switch.
-   Preserve local work if quotas are exhausted.
-   Never silently weaken privacy or encryption to reduce costs.

## 18. Reliability and Operations

Zero downtime cannot be guaranteed. The system should instead be
designed to minimize user impact and recover safely.

-   Keep local capture and search available during cloud outages.
-   Queue sync durably and retry idempotently.
-   Use backward-compatible database migrations.
-   Test restore from backups.
-   Maintain a rollback procedure.
-   Monitor API error rates and latency, sync queue age, webhook
    failures, storage, client crashes, and AI cost.
-   Keep private content, passwords, tokens, keys, and sensitive URLs
    out of logs by default.
-   Document incident response, credential rotation, and user
    communication.

### Release process

1.  Format, lint, type-check, unit tests, secret scan, dependency audit.
2.  Build preview artifacts.
3.  Deploy to staging.
4.  Apply backward-compatible migrations.
5.  Run integration, smoke, and security tests.
6.  Deploy backend with rollback available.
7.  Build signed platform artifacts.
8.  Test real devices and supported operating systems.
9.  Release to a small pilot group.
10. Expand only after monitoring and release gates pass.

## 19. Testing and Acceptance Criteria

### Functional

-   Create, edit, tag, search, archive, link, and export Pills.
-   Work offline and recover synchronization.
-   Preview context with provenance.
-   Respect explicit destination approval.
-   Login, logout, and account switching work reliably.

### Security

-   Cross-account isolation tests pass.
-   Expired sessions fail closed.
-   Revoked devices cannot sync.
-   Resource IDs do not bypass authorization.
-   Client cannot forge subscription entitlements.
-   No sensitive context appears in logs.
-   Integration grants are scoped and revocable.

### Reliability

-   Duplicate sync requests are idempotent.
-   Conflicts are preserved.
-   Deletions do not silently resurrect.
-   Backup restoration is demonstrated.
-   Failed requests do not destroy local edits.
-   Rollback instructions are tested.

### Platform

-   Real-device Android and iOS tests.
-   Windows and supported Linux distribution tests.
-   Browser extension permission and capture tests.
-   MCP scope and revocation tests.
-   Upgrade and uninstall/reinstall behavior documented.

No release should be called production-ready merely because it builds.
Record actual test results and known limitations.

## 20. Delivery Roadmap

### Phase 1 --- Local foundation

-   Monorepo and design tokens.
-   Pill schema and migrations.
-   Local vault, collections, editor, search, export.
-   Offline and empty/error states.

### Phase 2 --- Identity and security

-   Authentication integration.
-   Vault separation and account switching.
-   Logout, cache clearing, session expiry.
-   Cross-identity security tests.

### Phase 3 --- Sync

-   Device enrollment.
-   Durable queue, cursors, idempotency.
-   Conflict preservation, tombstones, revocation.
-   Encrypted attachments if the key design is ready.

### Phase 4 --- Topic and Context Compiler

-   Explicit capture and search.
-   Permission-aware retrieval.
-   Provenance and context preview.
-   Consent-gated destination adapters.

### Phase 5 --- Platform clients

-   Mobile packaging and real-device tests.
-   Windows/Linux packaging.
-   Browser extension.
-   Narrow MCP tools after permission tests.

### Phase 6 --- SaaS and operations

-   Sandbox billing and webhooks.
-   Entitlements and quotas.
-   Monitoring, backup/restore, deletion, incident procedures.
-   Pilot, feedback, and staged release.

A 15-day effort may produce a limited release candidate if the
environment and external accounts are ready, but cannot guarantee full
production readiness, independent security review, or app-store approval
across all platforms. Cut scope rather than bypass security or data
integrity.

## 21. Business and Product Validation

The core hypotheses to validate are: - Users experience repeated context
loss across tools. - A portable context layer is more useful than
existing notes/bookmarks or built-in AI memory. - Users trust the
identity isolation and privacy model. - Cross-device sync is worth
paying for. - The Context Compiler saves meaningful time in recurring
workflows. - Developers and other early users will install a browser
extension and desktop/mobile apps.

Validate through interviews, prototype testing, retention cohorts,
capture-to-reuse rate, successful context retrieval, weekly active use,
sync reliability, paid conversion, churn, support load, and cost per
active user.

Market size and revenue forecasts should be separately researched and
labeled as estimates. Do not treat illustrative prices or target user
counts as validated demand.

## 22. Risks and Open Questions

1.  **Key recovery:** how does a user regain access after losing all
    devices without giving the service plaintext access?
2.  **Search under encryption:** which searches run locally, and what
    trade-offs are acceptable for remote search?
3.  **Metadata leakage:** which account, size, timing, relationship, and
    access metadata are visible to providers?
4.  **Mobile restrictions:** which background tasks and cross-app
    interactions are allowed on each OS?
5.  **Browser scope:** which browser permissions are truly necessary?
6.  **MCP trust:** how are clients enrolled, scoped, audited, and
    revoked?
7.  **Billing rules:** which provider and purchase route are permitted
    for each platform?
8.  **Free-tier sustainability:** how will quotas and pricing evolve
    with real usage?
9.  **Deletion:** how are synced copies, blobs, tombstones, backups, and
    legal retention handled?
10. **Scope:** which platforms are genuinely supported at first release?

These questions must be resolved through implementation decisions and
tests, not hidden behind marketing language.

## Conclusion

PILL proposes a practical continuity layer for digital context: capture
useful information into portable Pills, organize it in an
identity-isolated vault, retrieve relevant context through Topic, and
assemble task-specific bundles with the Context Compiler. Its
differentiator is not simply saving more notes; it is making context
portable, source-aware, permission-controlled, and reusable across
supported workflows.

The trust promise depends on execution. Local-first behavior, identity
isolation, transparent context transfer, reliable synchronization, clear
deletion semantics, and honest operational limits must be built and
tested before PILL makes strong production or security claims.

**PILL --- Your context. Everywhere.**
