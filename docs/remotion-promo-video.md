# E-PAY Promo Video with Remotion

## Status: Setup path documented

Remotion is not installed in this project. It requires a **separate bundler setup** (webpack-based) that conflicts with the existing Vite configuration. Installing Remotion into the main Vite project would either break the production build or require significant bundler configuration changes.

**Safe approach: create a separate Remotion project alongside this one.**

---

## Setup path

```bash
# In the parent directory (not inside this project)
bunx create-video@latest epay-promo
cd epay-promo

# Choose: TypeScript, blank template
# Then install E-PAY brand dependencies:
bun add tailwindcss framer-motion
```

---

## Composition specification

**File:** `epay-promo/src/EPayPromo.tsx`
**Composition ID:** `EPayPromo`
**Resolution:** 1920 × 1080
**Frame rate:** 30 fps
**Duration:** 45 seconds (1350 frames)

---

## Storyboard

| Time | Frames | Scene |
|------|--------|-------|
| 0–5s | 0–150 | E-PAY logo reveal on `#090B0A` background; tagline "Pay smarter. Move onchain." fades in with spring animation |
| 5–13s | 150–390 | Dashboard mockup: wallet address, USDC balance, quick action grid; demo badge clearly visible |
| 13–22s | 390–660 | Buy USDC flow: IDR amount input → DEMO quote → QRIS checkout screen (placeholder QR pattern, labeled "DEMO — Not a real QR code") |
| 22–31s | 660–930 | Hosted invoice page: invoice amount, recipient, "Connect Wallet" → USDC transfer → "PAID" state |
| 31–39s | 930–1170 | Merchant dashboard: invoice list, transaction history; demo data labeled throughout |
| 39–45s | 1170–1350 | E-PAY logo + tagline "The USDC-first payment platform on Arc" + "Product preview — demo mode" watermark |

---

## Design tokens to reuse

```typescript
const BRAND = {
  bg: '#090B0A',
  surface: '#111413',
  elevated: '#181c1b',
  border: '#222827',
  accent: '#C7FF4A',
  accentDim: '#a8d93e',
  textPrimary: '#f4f7f5',
  textSecondary: '#9ba89f',
  success: '#34d399',
  warning: '#f59e0b',
  danger: '#f87171',
}
```

---

## Important constraints

- Show a **"DEMO MODE — Product Preview"** watermark on every frame that depicts a payment or balance.
- The QRIS code area must be labeled **"DEMO — Not a real QRIS code"** — never show a scannable pattern implied to be real.
- Transaction hashes shown must start with `0xDEMO…` — never invent real-looking hashes.
- Balances must be labeled **[DEMO]** — do not imply a real USDC balance.
- Do not imply confirmed partnerships with Midtrans, Xendit, Bank Indonesia, or any other institution.
- Do not claim specific transaction speeds, volumes, or uptime figures.

---

## Rendering

```bash
cd epay-promo
bunx remotion render EPayPromo out/epay-promo.mp4
# or for preview:
bunx remotion preview
```

---

## Why not integrated into the main project

Remotion uses webpack internally. Adding it to a Vite project requires:
1. Running Remotion's own dev server on a separate port
2. Sharing component code via symlink or a monorepo workspace
3. Careful deduplication of React instances

A clean monorepo structure keeps the production build safe:

```
/
├── epay-app/          ← this project (Vite + React SPA)
└── epay-promo/        ← Remotion project (separate bundler)
```

If a monorepo is preferred, use Bun workspaces and isolate bundler configs per package.
