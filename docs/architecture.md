# E-PAY Architecture

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vite + React 18 + TypeScript |
| Styling | Tailwind CSS v3 with custom design tokens |
| Routing | React Router v7 |
| Wallet | wagmi v2 + ConnectKit |
| Auth | Supabase Auth (optional; app runs in demo mode without it) |
| Database | Supabase (Postgres + Row Level Security) |
| Onchain | Arc Testnet (chain ID 5042002) — USDC ERC-20 |

## Deployment model

E-PAY is a **single-page application (SPA)** with no server-side runtime. All "backend" logic is implemented as TypeScript modules (`src/server/`) that run in the browser. This makes local development simple and the architecture straightforward, but has important security implications documented in [`docs/security.md`](security.md).

For production with live money, the `src/server/` logic must be moved behind a trusted server runtime (e.g. Supabase Edge Functions, a Next.js API route, or a Bun/Node server) so that:

- Provider secrets are never sent to the browser.
- Webhook signature verification happens server-side.
- State transitions are atomic (database transactions).
- Rate limiting is enforced at the network edge.

## Core data flows

### Buy USDC (IDR → USDC)

```
User browser
  │  1. Enter IDR amount
  │  2. Request quote  ──►  QuoteAdapter  ──►  Exchange rate provider
  │  3. Confirm
  │  4. Create purchase intent  ──►  PaymentAdapter  ──►  QRIS provider
  │  5. Display QRIS code to user
  │  6. Poll payment status
  │  7. On PAYMENT_CONFIRMED  ──►  FulfillmentAdapter  ──►  Hot wallet / USDC sender
  │  8. Poll fulfilment status
  │  9. On FULFILLMENT_CONFIRMED  ──►  BlockchainAdapter  ──►  Arc RPC
  │ 10. Display receipt
```

### Invoice payment (USDC → merchant)

```
Merchant browser
  │  1. Create invoice (amount, recipient address)
  │  2. Share /invoice/:id link

Customer browser
  │  3. Load hosted invoice page (public read)
  │  4. Connect wallet
  │  5. Send USDC transfer (wagmi writeContract)
  │  6. Submit txHash to markInvoicePaymentPending
  │  7. verifyInvoicePayment  ──►  BlockchainAdapter  ──►  Arc RPC
  │  8. Display paid receipt
```

## State machines

### Purchase intent statuses

```
CREATED → QUOTED → PAYMENT_PENDING
  → PAYMENT_CONFIRMED → FULFILLMENT_PENDING → FULFILLMENT_SUBMITTED
    → FULFILLMENT_CONFIRMED → COMPLETED
  → PAYMENT_FAILED | EXPIRED | FULFILLMENT_FAILED | REQUIRES_REVIEW
```

### Invoice statuses

```
DRAFT → OPEN → PAYMENT_PENDING → PAYMENT_CONFIRMED → PAID
                                                    → UNDERPAID | OVERPAID | REQUIRES_REVIEW
  → EXPIRED | CANCELLED
```

## Database schema

See `supabase/migrations/0001_initial_schema.sql` for the full schema.

Key tables:
- `purchase_intents` — one row per buy-USDC attempt, with state and amounts
- `invoices` — one row per merchant invoice
- `blockchain_transactions` — verified onchain transactions; unique on (chain_id, tx_hash) to prevent replay
- `provider_events` — raw inbound webhook log; unique on (provider, external_ref, event_type) for deduplication
- `fulfillment_jobs` — one row per USDC delivery attempt
- `audit_logs` — append-only audit trail

## Adapter interfaces

The four adapter interfaces in `src/server/types.ts` are the extension points:

| Interface | Purpose | Demo impl | Live impl |
|-----------|---------|-----------|-----------|
| `QuoteProviderAdapter` | FX rate | Static 16,200 IDR/USDC | CoinGecko / Binance |
| `PaymentProviderAdapter` | QRIS session | In-memory simulation | Midtrans / Xendit |
| `FulfillmentProviderAdapter` | USDC delivery | Simulated tx hash | Hot wallet signer |
| `BlockchainAdapterInterface` | Onchain verification | Accepts `0xDEMO*` hashes | viem publicClient |
