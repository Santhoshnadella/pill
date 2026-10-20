# pill — Product Workflows Specification

> **Capture once. Continue anywhere.**  
> *Your context, across devices, apps and identities.*

![pill Product Workflows](../assets/pill-product-workflows.png)

---

## Overview

Modern digital work is fragmented across tabs, tools, AI models, and devices. Users waste valuable time finding old links, re-explaining context to LLMs, and piecing together notes. **pill** acts as an intelligent, persistent context layer that captures knowledge with a single stroke and makes it seamlessly available wherever you work.

---

## Workflow Details

### 01 Research → Build
*From scattered tabs to a focused workflow.*

- **Flow**: `Browser → Pill → IDE`
- **Use Case**: An engineer or researcher browsing documentation, GitHub repos, and StackOverflow can bundle relevant findings and immediately open them in their code editor or workspace.

| The Hassle | With pill |
| :--- | :--- |
| • Multiple tabs and apps open simultaneously | • Capture with a global hotkey (`⌘/Ctrl + Shift + C`) |
| • Lost context when moving between devices | • Context is compiled and saved as a discrete **Pill** |
| • Repeatedly re-explaining context to assistants | • Instantly resume on any device with one click |

---

### 02 Shared Devices
*Your context. Not someone else's.*

- **Flow**: `Switch Identity → Work → Logout`
- **Use Case**: Working on shared workstations, lab computers, or co-working machines without exposing personal notes, credentials, or private project memory.

| The Hassle | With pill |
| :--- | :--- |
| • High risk of cross-account data leaks | • One-tap identity switch (e.g. Alice / Bob / Work / Personal) |
| • Tedious manual session cleanup | • Cryptographically isolated vaults per identity |
| • Ambiguous or lingering session states | • Safe, zero-leak auto-logout and vault locking |

---

### 03 From YouTube to Code
*Learn in one place. Build in another.*

- **Flow**: `YouTube → Pill → IDE / AI`
- **Use Case**: Following software tutorials, conference talks, or design workshops on video platforms, linking timestamps, code snippets, and summaries directly into your development environment.

| The Hassle | With pill |
| :--- | :--- |
| • Constantly pausing and hunting for referenced resources | • Capture video timestamp, documentation, and code in one go |
| • Forgetting implementation nuances later | • Seamlessly links everything together into a context graph |
| • Distracting context-switching between tools | • Delivers a ready-to-use context package to your IDE |

---

### 04 AI Assistant, Your Way
*Change the tool. Keep your memory.*

- **Flow**: `Any AI → Pill → Context`
- **Use Case**: Not being locked into a single AI provider (switching between ChatGPT, Claude, Gemini, local Ollama models) while keeping project context, history, and decisions intact.

| The Hassle | With pill |
| :--- | :--- |
| • Locked into one proprietary AI vendor ecosystem | • Freedom to use any AI model or local LLM |
| • Re-explaining project background from scratch | • Granular sharing: share only what you allow per prompt |
| • Complete loss of memory when switching assistants | • Your memory stays with you, universally portable |

---

### 05 Offline to Online
*Work anywhere. Sync later.*

- **Flow**: `Local → Sync → All Devices`
- **Use Case**: Capturing ideas, code notes, and files while flying, commuting, or in low-connectivity areas without data loss or synchronization conflicts.

| The Hassle | With pill |
| :--- | :--- |
| • Unsaved changes get lost during connectivity drops | • Saves locally and instantly to your device first |
| • Messy, destructive sync conflict dialogues | • Smart sync with deterministic conflict resolution & merge |
| • Inability to access previous context offline | • Local-first architecture: always functional offline |

---

### 06 Project with Full Context
*Not just what you built, but why.*

- **Flow**: `Search → Connect → Build`
- **Use Case**: Re-entering a project months later or handing it over to a teammate with full visibility into rationale, discarded options, references, and milestones.

| The Hassle | With pill |
| :--- | :--- |
| • Endless searching for buried notes and bookmarks | • Semantic & full-text search across your entire context |
| • Re-debating settled decisions without rationale | • Review full timeline: Documents, Code, Notes, Decisions, Links, Video |
| • Fragmented pieces that must be manually reconstructed | • Continue building immediately with total confidence |

---

## 🛡️ Core Guarantees

| Guarantee | Description |
| :--- | :--- |
| **🔒 Secure** | Encrypted & isolated vaults using zero-trust architecture. |
| **🔄 Persistent** | Always available across app sessions, reboots, and offline modes. |
| **📱 Cross-Platform** | Seamless experience on Desktop (Win/macOS/Linux), Web, and Mobile. |
| **👤 Identity-Aware** | Strict separation between accounts, vaults, and projects. No leaks. |
