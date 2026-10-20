# PILL — Free-Tier Budget & Quota Register

> **Zero-Budget Cost Controls & Operational Quotas**  
> *Monitored and reviewed monthly.*

---

## 1. Provider Allowances & Hard Limits

| Provider / Service | Free Tier Allowance | PILL Hard Safety Ceiling | Strategy When Limit Reached |
| :--- | :--- | :--- | :--- |
| **Cloudflare Workers** | 100,000 requests/day | 80,000 requests/day | Throttle background polling; increase client sync debounce interval. |
| **Cloudflare D1** | 5,000,000 row reads / day<br/>100,000 row writes / day | 50,000 row writes / day | Rely more heavily on local client SQLite; batch remote sync commits. |
| **Cloudflare R2** | 10 GB storage<br/>1M Class A operations<br/>10M Class B operations<br/>**$0 Egress Fees** | 8 GB stored volume | Enforce 5MB max attachment limit per user on free tier; client-side image compression. |
| **Supabase Auth** | 50,000 Monthly Active Users (MAU) | 40,000 MAU | Standard session tokens stored in OS secure credential store. |
| **GitHub Actions** | 2,000 build minutes / month | 1,500 build minutes | Run full integration suites on `main` branch merges only; PRs run fast linter & unit tests. |
| **Sentry** | 5,000 error events / month | 3,000 events | Aggressive client-side sampling (10%) and deduplication of network retry errors. |

---

## 2. Emergency Cost-Control Switch

In the event of unexpected usage spikes:
1. `EMERGENCY_SYNC_DEGRADE=true`: Temporarily reduces background sync frequency from 30s to 5 minutes.
2. `ATTACHMENTS_ENABLED=false`: Pauses new binary media uploads while keeping text/context pills fully operational.
3. Local-First Guarantee: Local capture, searching, and exporting **never** stop functioning even if all cloud sync is suspended.
