# E-PAY Deployment

## Local development

```bash
# Install dependencies
bun install

# Copy and edit environment
cp .env.example .env

# Start dev server
bun run dev
# http://localhost:5173
```

All modes default to `demo` — no external services required.

---

## Environment variables

| Variable | Required for live | Description |
|----------|------------------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | Supabase service-role key — bypasses RLS |
| `VITE_PAYMENT_PROVIDER_MODE` | Yes | `demo` / `midtrans` / `xendit` |
| `VITE_QUOTE_PROVIDER_MODE` | Yes | `demo` / `coingecko` / `binance` |
| `VITE_FULFILLMENT_PROVIDER_MODE` | Yes | `demo` / `hot_wallet` |
| `VITE_ARC_NETWORK_MODE` | Yes | `demo` / `live` |
| `VITE_ARC_CHAIN_ID` | Yes | Arc chain ID (5042002 = testnet) |
| `VITE_ARC_RPC_URL` | Live only | Arc RPC URL |
| `VITE_ARC_EXPLORER_URL` | Live only | Arc explorer URL |
| `VITE_ARC_USDC_CONTRACT_ADDRESS` | Live only | Arc USDC ERC-20 address |
| `VITE_ARC_REQUIRED_CONFIRMATIONS` | Live only | Block confirmations required |
| `PAYMENT_PROVIDER_API_KEY` | Live only | Provider API key |
| `PAYMENT_PROVIDER_API_SECRET` | Server-only | Provider secret |
| `PAYMENT_PROVIDER_WEBHOOK_SECRET` | Server-only | Webhook signature secret |
| `PAYMENT_PROVIDER_MIDTRANS_IS_PRODUCTION` | Live only | `true` for Midtrans production |
| `PAYMENT_PROVIDER_XENDIT_CALLBACK_TOKEN` | Server-only | Xendit webhook token |
| `QUOTE_PROVIDER_API_KEY` | Live only | CoinGecko / Binance API key |
| `FULFILLMENT_HOT_WALLET_PRIVATE_KEY` | Server-only | Hot wallet private key |

---

## Supabase setup

```bash
# 1. Create a Supabase project at https://supabase.com
# 2. Apply migrations in the SQL editor:
#    - supabase/migrations/0001_initial_schema.sql
#    - supabase/migrations/0002_security_hardening.sql

# Or using Supabase CLI:
supabase db push
```

After applying migrations, copy `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from
**Project Settings → API** in the Supabase dashboard.

---

## Building for production

```bash
bun run build
# Output in dist/
```

The output is a static SPA — deploy to any static host (Netlify, Vercel, Cloudflare Pages).

---

## Deployment to Netlify

1. Connect your Git repository in the Netlify dashboard
2. Set build command: `bun run build`
3. Set publish directory: `dist`
4. Add all `VITE_*` env vars in **Site configuration → Environment variables**
5. Add a `netlify.toml` redirect rule:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

6. Add HTTP headers in `netlify.toml`:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=(), payment=()"
```

---

## Deployment to Vercel

1. Import the repository in Vercel
2. Set framework preset to **Vite**
3. Add all `VITE_*` env vars in project settings
4. Add a `vercel.json` for SPA routing and headers:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

---

## Running tests

```bash
# Lint + TypeScript
bun run check

# Unit tests
bun run test

# E2E tests (requires dev server on :5173)
bun run dev &   # in one terminal
bun run test:e2e
```

---

## Pre-launch checklist

Before enabling real-money flows, all of the following must be complete:

- [ ] Supabase project created and migrations applied
- [ ] All `VITE_*` variables set to production values
- [ ] Server-side secrets (`SERVICE_ROLE_KEY`, `WEBHOOK_SECRET`, `HOT_WALLET_PRIVATE_KEY`) stored in a secrets manager, not in `.env`
- [ ] Payment provider integration implemented and tested on testnet
- [ ] Webhook endpoint deployed with signature verification
- [ ] Hot wallet fulfillment moved to server-side function
- [ ] Quote provider fetched server-side
- [ ] Rate limiting deployed at the edge
- [ ] CSP headers deployed via CDN
- [ ] Admin access verified via Supabase `is_admin()` policy
- [ ] Full test suite passes (lint, typecheck, unit, E2E)
- [ ] Independent security review completed
- [ ] Indonesian regulatory requirements confirmed with legal counsel
- [ ] Database backup schedule configured (Supabase automatic daily backups enabled)
- [ ] Monitoring and alerting configured (e.g. Supabase logs, Sentry, Uptime robot)

---

## Database backup and recovery

Supabase automatically backs up all projects on Pro plan and above. For self-hosted Supabase:

```bash
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

Keep at least 30 days of daily backups. Test restoration quarterly.

---

## Monitoring and incident response

**Key metrics to monitor:**
- FULFILLMENT_FAILED intents (should be 0 in normal operation)
- REQUIRES_REVIEW invoices (manual review needed)
- Payment webhook delivery failures
- Unusual volume spikes

**Incident procedure:**
1. Set `VITE_PAYMENT_PROVIDER_MODE=demo` and redeploy to halt live intake
2. Review `audit_logs` and `provider_events` tables for the affected time range
3. For each `REQUIRES_REVIEW` record, verify onchain and manually update status with the service-role client
4. Log all manual interventions in `audit_logs` with actor ID and timestamp
5. Communicate to affected users per your privacy policy and applicable regulations
