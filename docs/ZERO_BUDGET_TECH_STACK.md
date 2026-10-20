# pill — Zero-Budget Technology Stack & Strategy

> *"You don't need a big budget to build a powerful product. You need the right architecture."*  
> **PILL → Open Source → Built for Everyone**

---

## Architecture Selection Matrix

The recommended zero-budget stack leverages industry-standard open-source libraries and generous perpetual free tiers to minimize initial infrastructure overhead.

| Component | Selected Technology | Why Chosen? | Free Tier / Cost Model |
| :--- | :--- | :--- | :--- |
| **Desktop App** | **Tauri + React** | Tiny binary size (~15MB vs ~150MB Electron), native performance, memory-efficient Rust core. | 100% Free & Open Source |
| **Browser Extension** | **WebExtensions API** (TypeScript + React) | Cross-browser compatibility across Chrome, Firefox, Edge, Brave with single codebase. | 100% Free & Open Source |
| **Mobile App** | **React Native (Expo)** | Code sharing with React web/desktop, fast iteration, native performance. | 100% Free & Open Source |
| **Backend API** | **Node.js + Express** (or **FastAPI**) | High async I/O throughput, vast ecosystem, easy to write and maintain. | 100% Free & Open Source |
| **Database** | **PostgreSQL** (or **SQLite** for local-first) | Robust JSONB support, pgvector extension for embeddings, rock-solid ACID transactions. | Supabase / Neon / Local SQLite (Free) |
| **Object Storage** | **Cloudflare R2** | S3-compatible API, **zero egress bandwidth fees**, 10 GB free storage. | Cloudflare R2 Free Tier |
| **Sync & Realtime** | **Supabase Realtime** / **WebSockets** | Instant pub/sub channels, presence tracking, automatic reconnects. | Supabase Free Tier or self-hosted WS |
| **Authentication** | **Auth.js** / **Supabase Auth** | Built-in Passkeys (WebAuthn), OAuth providers (GitHub, Google), session token security. | Generous Free Tier |
| **Deployment** | **Vercel** / **Render** | Automatic CI/CD git pushes, edge network distribution, free SSL certificates. | Free Tiers |

---

## 🎯 Zero-Budget Strategy

1. **Leverage Generous Free Tiers**:
   - Cloudflare R2: 10 GB storage and 0 egress fees (ideal for user media and pill snapshots).
   - Supabase / Neon: Free managed Postgres instances with pgvector support for semantic search.
   - Vercel / Render: Free hosting for backend services and web frontends with auto SSL.

2. **Self-Host When Needed**:
   - Local-first architecture stores primary vaults on user devices (SQLite + local file system).
   - Cloud sync serves only as an encrypted relay and backup, drastically reducing server load.

3. **100% Open Source Tools**:
   - Zero vendor lock-in or recurring licensing costs.
   - Transparent auditing of encryption and security primitives.

4. **Start Minimal, Scale Deterministically**:
   - Phase 1: Local-first desktop app + browser extension with SQLite vault.
   - Phase 2: Peer-to-peer or lightweight cloud sync with E2E encrypted blobs.
   - Phase 3: Multi-device sync, shared collections, and cloud AI orchestrator.

---

## 📁 Repository Directory Structure

```text
pill.so/
├── assets/
│   ├── pill-product-workflows.png    # Product features & workflow showcase
│   └── pill-system-architecture.png  # High-level architecture & zero budget stack
├── docs/
│   ├── images/
│   │   ├── pill-product-workflows.png
│   │   └── pill-system-architecture.png
│   ├── ARCHITECTURE.md              # Detailed architecture & component breakdown
│   ├── PRODUCT_WORKFLOWS.md         # 6 core workflows and user problem/solution specs
│   └── ZERO_BUDGET_TECH_STACK.md    # Technology choices & zero budget scaling plan
└── README.md                        # Project root documentation & quick start
```
