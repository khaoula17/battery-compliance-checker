# Battery Compliance Checker — full SaaS

A pre-flight **lithium-battery shipping compliance checker** for air freight
(IATA DGR / 49 CFR), built as a complete SaaS: auth, billing, a usage-gated
checker, an AI datasheet reader, DGD-style PDF export, a dashboard, a white-label
3PL portal, an admin panel, and a REST API.

> **Positioning.** A pre-validation assistant for **trained shippers and
> forwarders** — not a tool that lets untrained users ship batteries. A DG
> declaration must be signed by someone with current DG training (recurrent
> every 24 months). Full market analysis: `../DGJSON_roadmap.md`.

---

## Features

| Module | Route(s) | Notes |
|---|---|---|
| **Compliance engine** | `lib/compliance/*` | Wh/Li-content → Section II/IB/IA, PI 965–970, marks/labels, DGD-required, carrier variations. Versioned ruleset JSON. |
| **Pre-flight checker** | `/check` | Form → pass/fail + classification + fixes + citations. |
| **AI SDS reader** | `POST /api/ai/sds` | Upload a datasheet/SDS (PDF/image) → auto-fills the form. Anthropic or OpenAI. |
| **DGD PDF + QR** | `POST /api/pdf` | pdf-lib summary/declaration draft with QR code. Plan-gated. |
| **Auth** | `/login`, `/auth/*` | Supabase magic-link + Google OAuth. |
| **Billing** | `/api/stripe/*` | Stripe Checkout, webhook (plan sync), billing portal. |
| **Plans & usage gating** | `lib/plans.ts` | Free (5/mo, no PDF/API), Pay-as-you-go, Pro, White-label. |
| **Dashboard** | `/dashboard` | Usage, plan, saved checks, billing. |
| **White-label portal** | `/<slug>` | Branded checker per 3PL (`domains` table). |
| **Admin** | `/admin` | Ruleset version + user list (gated by `ADMIN_EMAILS`). |
| **REST API** | `POST /api/v1/labels` | Batch checks for forwarders; DB-backed API keys. |
| **Reg version** | `GET /api/reg-version` | Active ruleset version for integrators / change alerts. |

**Graceful degradation:** the app runs with **zero** external services — the
checker, AI-stub messaging, and PDF all work locally. Auth/billing/white-label/
admin activate automatically when their env vars are present.

---

## Quick start

```bash
npm install
cp .env.example .env.local     # optional — nothing required for the core checker
npm run dev                    # http://localhost:3000
npm test                       # 37 tests (engine, API handlers, PDF, plan gating)
npx tsc --noEmit               # type-check
npm run build                  # production build (runs on normal hardware)
```

---

## Enable each service

### Supabase (auth, saved checks, white-label, API keys)
1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor (tables + RLS policies).
3. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`.
4. (Optional) Enable the Google provider in Supabase Auth for Google sign-in.

### Stripe (billing)
1. Create three prices in Stripe (PAYG one-time, Pro + White-label recurring).
2. Set `STRIPE_SECRET_KEY`, `STRIPE_PRICE_PAYG`, `STRIPE_PRICE_PRO`,
   `STRIPE_PRICE_WHITELABEL`.
3. Add a webhook to `/api/stripe/webhook` and set `STRIPE_WEBHOOK_SECRET`
   (events: `checkout.session.completed`, `customer.subscription.*`).

### AI SDS reader
- Set `ANTHROPIC_API_KEY` (recommended — supports PDFs) or `OPENAI_API_KEY`
  (images only). Optional `AI_MODEL` to override the default.

### Admin
- Set `ADMIN_EMAILS=you@example.com` (comma-separated) to access `/admin`.

### White-label portal
- Insert a row into `domains` (`slug`, `display_name`, `brand_color`). Then
  `/<slug>` renders the branded checker.

---

## Architecture notes

- **Engine is framework-free** (`lib/compliance`) and fully unit-tested — the
  defensible core. Update regulations by editing
  `lib/compliance/rules/li-rules.json` and bumping `version` (no code change).
- **No "Q-value"** — that applies to mixed DG in one box, not lithium batteries.
  Batteries are classified by watt-hours / lithium content. See the engine.
- **Plan gating** lives in `lib/plans.ts`; `/api/check` enforces the monthly
  limit and saves history when a user is signed in.
- **Security:** API keys are stored as SHA-256 hashes; the Stripe webhook and
  key lookups use the service-role client (keep that key server-side only).

---

## Try the APIs

```bash
# Single check
curl -X POST localhost:3000/api/check -H "Content-Type: application/json" \
  -d '{"chemistry":"ion","configuration":"standalone","itemType":"battery","whPerUnit":50,"operator":"FEDEX","stateOfChargePct":25,"un38_3TestSummaryAvailable":true,"whMarkedOnCase":true}'

# Compliance PDF (saves to file)
curl -X POST localhost:3000/api/pdf -H "Content-Type: application/json" \
  -d '{"chemistry":"ion","configuration":"standalone","itemType":"battery","whPerUnit":50}' -o compliance.pdf

# Batch (forwarder API)
curl -X POST localhost:3000/api/v1/labels -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_INTERNAL_KEY" \
  -d '{"shipments":[{"chemistry":"ion","configuration":"standalone","itemType":"battery","whPerUnit":200}]}'

# Ruleset version
curl localhost:3000/api/reg-version
```

---

## Deploy to Vercel
1. Push to Git, import in Vercel (Next.js auto-detected).
2. Add the env vars for the services you enabled.
3. Add the Stripe webhook URL after the first deploy.
4. Pin `next` to the latest patched `14.2.x` (`npm install next@^14.2`).

---

## Roadmap (next)
- Multi-page PDF for long findings; carrier-accepted DGD form templates.
- API key management UI in the dashboard.
- "Regulation changed" email when `/api/reg-version` changes (Supabase cron/edge).
- Quantity tables per packing instruction (replace the Section II quantity flag).
- **Validate carrier acceptance** of the output before relying on it commercially.

---

## ⚠️ Compliance disclaimer
Pre-flight checking only; **not legal advice** and **not a carrier-certified
Shipper's Declaration**. The ruleset is simplified and may not reflect every
provision, operator/state variation, or quantity limit. Always verify against
the current full **IATA DGR / 49 CFR** and carrier rules, and have a trained,
certified shipper review and sign the final declaration.
