# PILL — Threat Model & Security Boundaries

---

## 1. Trust Boundaries & Assumptions

1. **Host Device Assumption:** The user's operating system is assumed to have basic physical security. A compromised root/kernel environment can inspect memory and defeating software-level protections.
2. **Untrusted Input Assumption:** All web clippings, pasted notes, YouTube metadata, model outputs, and MCP requests are treated as **untrusted user input**. They must never be executed as shell commands, scripts, or allowed to manipulate application permissions.
3. **Multi-Tenant Separation:** When multiple identities exist on a single machine or server database, they are strictly separated by cryptographic boundaries and database partitions.

---

## 2. Threat Analysis Matrix

| Threat Category | Potential Vector | Mitigation in PILL Architecture | Residual Risk |
| :--- | :--- | :--- | :--- |
| **Cross-Account Leakage** | Shared computer session persistence or cached memory leaks | Vault locks on logout; explicit in-memory cache purge; database separation by `ownerId`. | OS disk recovery if physical disk is unencrypted (mitigated by BitLocker/FileVault). |
| **Prompt Injection** | Malicious text in clipped webpage instructing LLM to exfiltrate context | Untrusted label attached to all external clippings; Context Compiler isolates data from system prompts; size limits. | LLM model susceptibility to novel zero-day prompt injection. |
| **Credential Exfiltration** | Unintentional capture of passwords, API keys, or session cookies | Client-side pattern matcher warns on credential-like strings (API keys, private keys); exclusions for password inputs. | User override of security warning. |
| **Sync Spoofing / Tampering** | Replay of sync requests or forging another user's device changes | Per-device enrollment with cryptographic signatures; idempotency keys; server-side token validation. | Stolen registered device before revocation. |
| **Denial of Service / Quota Drain** | Malicious upload of huge attachments draining free tier storage | Hard 5MB limit per attachment ticket; rate limiting on Worker endpoints; user-level quotas. | Cloudflare account DDOS mitigation policies. |
