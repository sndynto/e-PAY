# E-PAY

**E-PAY** is a USDC payment platform built on Arc — an EVM blockchain where USDC is the native gas token. It lets users buy USDC with Indonesian Rupiah (IDR) via QRIS, pay with USDC on Arc, and create hosted payment invoices.

> **Status:** Demo mode. All payment flows use simulated adapters. No real funds are moved until live provider credentials are configured.

---

## Quick start

**Requirements:**
- Bun 1.x (`curl -fsSL https://bun.sh/install | bash`)
- Node.js 20+ (for Playwright E2E)
- Git

```bash
# 1. Clone and install
git clone <repo>
cd <repo>
bun install

# 2. Configure environment
cp .env.example .env
# Edit .env — Supabase credentials are optional for demo mode

# 3. Start the dev server
bun run dev
# App available at http://localhost:5173
```

All four provider modes default to `demo` — no external credentials required to run locally.

---

## Running checks

```bash
# Lint + TypeScript
bun run check

# Unit tests (Vitest)
bun run test

# E2E tests (Playwright) — requires dev server running
bun run test:e2e
```

---

## Environment variables

See [`.env.example`](.env.example) for all variables with descriptions.

The minimum set for demo mode is:

```
VITE_PAYMENT_PROVIDER_MODE=demo
VITE_QUOTE_PROVIDER_MODE=demo
VITE_FULFILLMENT_PROVIDER_MODE=demo
VITE_ARC_NETWORK_MODE=demo
VITE_ARC_CHAIN_ID=5042002
```

---

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — system design and data flow
- [`docs/integrations.md`](docs/integrations.md) — payment, quote, and blockchain providers
- [`docs/security.md`](docs/security.md) — security model and considerations
- [`docs/deployment.md`](docs/deployment.md) — production deployment guide

---

## ⚠ Before handling real money

Obtain independent legal and compliance advice for Indonesian payment regulations (Bank Indonesia QRIS licensing, VASP requirements). Configure live provider credentials and run the full test suite against testnet before mainnet.

See [`docs/deployment.md`](docs/deployment.md) for the full pre-launch checklist.
