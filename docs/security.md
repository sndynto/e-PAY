# E-PAY Security

## Architecture model

E-PAY v1 is a **client-side SPA**. This simplifies development but means all TypeScript in `src/server/` runs in the browser. Before handling real money, the following must be true:

| Requirement | Demo status | Live requirement |
|-------------|-------------|-----------------|
| Provider secrets server-side | N/A (demo) | Move to server runtime |
| Webhook signature verification | Demo returns `true` | Implement per provider |
| Atomic state transitions | In-memory Map | Supabase + DB transactions |
| Rate limiting | In-memory counter | Redis or Supabase table |
| Admin access check | UI-only badge | Supabase `is_admin()` RLS |
| Hot wallet key isolated | N/A (demo) | Server-only env var |
| CSP headers | Dev server headers | CDN / edge config |

---

## Payment safety guarantees

### No USDC before confirmed IDR payment

The fulfillment adapter is only called from `checkPaymentStatus` when the payment provider confirms `CONFIRMED`. In demo mode this requires explicitly clicking "Simulate Payment". In live mode it requires a valid webhook from the provider with a verified signature.

### No duplicate fulfillment

`checkPaymentStatus` guards against re-dispatching fulfillment:

```typescript
if (!intent.fulfillmentTxHash) {
  // Only dispatch if no tx hash recorded
}
```

In live mode this must be an atomic DB update (`UPDATE … WHERE status = 'PAYMENT_CONFIRMED' AND fulfillment_tx_hash IS NULL`).

### No double-credit of a transaction hash

`markInvoicePaymentPending` scans all invoices for the submitted txHash before accepting it. `verifyInvoicePayment` adds the hash to `usedTxHashes` after crediting. The `blockchain_transactions` table has a unique constraint on `(chain_id, tx_hash)`.

### Invoice payment verification

`verifyInvoicePayment` checks all of:
1. Correct recipient address (from the invoice)
2. Correct token contract (from `onchain-facts` registry — never hardcoded)
3. Sufficient amount (underpayment → `UNDERPAID`; overpayment → `OVERPAID`)
4. Successful transaction status (confirmed onchain)
5. Not previously credited (replay prevention)

---

## Secrets and credentials

- `SUPABASE_SERVICE_ROLE_KEY` — server-only. Never set as `VITE_*`.
- `FULFILLMENT_HOT_WALLET_PRIVATE_KEY` — server-only. Never in the browser bundle.
- `PAYMENT_PROVIDER_API_SECRET` — server-only.
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — browser-safe. The anon key is scoped to RLS-enforced operations only.

Verify `.gitignore` excludes `.env` and `recovery_file*` before committing.

---

## Row Level Security (RLS)

All Supabase tables have RLS enabled. Key policies:

- `profiles_self_read/update` — users read/update their own row; `role` column cannot be changed by the user
- `wallets_self` — users own their wallets
- `intents_self` / `quotes_self` / `tx_records_self` — per-user access
- `invoices_public_read` — only `OPEN` and `PAYMENT_PENDING` invoices are readable without auth
- `provider_events_none`, `fulfillment_jobs_none`, `audit_logs_none` — service-role only (admins use `is_admin()` policy from migration 0002)
- `blockchain_txs_none` — service-role only

---

## Input validation

All service functions validate inputs with Zod schemas before processing. Key checks:

- IDR amounts: integer, 10,000–100,000,000
- USDC units: positive integer, ≤ 100,000 USDC (100,000,000,000 base units)
- Wallet addresses: `/^0x[0-9a-fA-F]{40}$/`
- Transaction hashes: `/^0x[0-9a-fA-F]{64}$/` (or `0xDEMO*` in demo mode)
- Redirect paths: relative paths only, no `//`, no protocol characters

---

## Rate limiting

Demo rate limits (in-memory, reset on reload):

| Endpoint | Limit |
|----------|-------|
| Create purchase intent | 10 per user per 5 minutes |
| Create invoice | 50 per merchant per hour |

In live mode, implement rate limiting at the network edge (Cloudflare, AWS WAF, or nginx) and in the server function.

---

## Security headers

Configured in `vite.config.ts` for development. For production CDN/proxy config:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
Content-Security-Policy: <see src/lib/security-headers.ts>
```

---

## Known limitations (demo mode)

1. No real webhook signature verification (demo adapter always returns `true`)
2. In-memory rate limiter resets on page reload
3. In-memory `usedTxHashes` resets on page reload — cross-session replay is not prevented
4. Admin access is UI-only (no server-side enforcement until Supabase is live)
5. All state is in-memory — no persistence across browser sessions

These are acceptable for demo mode only. Every item must be resolved before handling real money.

---

## Regulatory notice

Before operating with real IDR payments in Indonesia, confirm:
- Bank Indonesia QRIS merchant/aggregator licensing requirements
- OJK (Financial Services Authority) requirements for virtual asset services
- AML/KYC requirements applicable to your user base and transaction volumes
- PDPA (Personal Data Protection Act) requirements for user data

E-PAY does not provide legal, compliance, or financial advice. Obtain independent professional guidance before commercial operation.
