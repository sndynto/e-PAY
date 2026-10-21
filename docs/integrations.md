# E-PAY Integrations

## Payment providers (QRIS)

E-PAY is designed to work with Indonesian QRIS payment providers. The `PaymentProviderAdapter` interface in `src/server/types.ts` defines the contract.

### Adding Midtrans

1. Set env vars: `PAYMENT_PROVIDER_API_KEY`, `PAYMENT_PROVIDER_API_SECRET`, `PAYMENT_PROVIDER_MIDTRANS_IS_PRODUCTION`
2. Set `VITE_PAYMENT_PROVIDER_MODE=midtrans`
3. Implement `src/server/adapters/midtransPaymentAdapter.ts` following the `PaymentProviderAdapter` interface
4. Register in `src/server/providerRegistry.ts`

**Webhook signature verification:** Midtrans signs webhook payloads with SHA-512 of `order_id + status_code + gross_amount + server_key`. Implement `verifyWebhookSignature` using this method. Never accept a payment status from a client redirect.

### Adding Xendit

1. Set env vars: `PAYMENT_PROVIDER_API_KEY`, `PAYMENT_PROVIDER_XENDIT_CALLBACK_TOKEN`
2. Set `VITE_PAYMENT_PROVIDER_MODE=xendit`
3. Implement `src/server/adapters/xenditPaymentAdapter.ts`
4. Xendit uses an `x-callback-token` header for webhook verification

**Important:** Verify the provider's signature in `verifyWebhookSignature` before parsing the payload. Do not rely on IP allowlisting alone.

### Pre-launch requirements

Before enabling live QRIS:
- Confirm QRIS merchant registration with Bank Indonesia requirements
- Confirm payment provider's merchant agreement and compliance terms
- Confirm applicable KYC/AML requirements for your user base
- Confirm transaction limits and velocity rules

---

## Quote providers (FX rate)

The `QuoteProviderAdapter` provides IDR/USDC exchange rates.

### CoinGecko

Set `VITE_QUOTE_PROVIDER_MODE=coingecko` and `QUOTE_PROVIDER_API_KEY`.
Fetch `https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=idr`.
Cache responses for 60 seconds; apply the spread/fee on top.

### Binance

Set `VITE_QUOTE_PROVIDER_MODE=binance`.
Use the `USDCIDR` trading pair or a USD/IDR proxy with USDC/USD.

**Warning:** Do not fetch FX rates directly from the browser in production — rate data exposes your pricing logic. Move `src/server/routes/quoteService.ts` to a server function.

---

## USDC fulfillment (outbound USDC delivery)

When an IDR payment is confirmed, E-PAY sends USDC to the user's wallet.

### Hot wallet (live mode)

Set `VITE_FULFILLMENT_PROVIDER_MODE=hot_wallet` and `FULFILLMENT_HOT_WALLET_PRIVATE_KEY`.

Implement `src/server/adapters/hotWalletFulfillmentAdapter.ts` using viem's `walletClient.writeContract` with the USDC ERC-20 `transfer` function.

**Security:** The hot wallet private key must never be in browser-accessible code or the frontend bundle. Move fulfillment to a server-side function before enabling live mode.

---

## Arc network and USDC

Arc Testnet:
- Chain ID: `5042002`
- RPC: `https://rpc.testnet.arc.io`
- USDC contract: `0x3600000000000000000000000000000000000000`
- Explorer: `https://explorer.testnet.arc.io`

These values are imported from `src/onchain-facts.ts` — never hardcode them.

For Arc Mainnet, confirm the contract address and chain ID from the Arc official documentation and update `VITE_ARC_CHAIN_ID` and `VITE_ARC_USDC_CONTRACT_ADDRESS`.

---

## Supabase

1. Create a Supabase project at https://supabase.com
2. Run `supabase/migrations/0001_initial_schema.sql` and `0002_security_hardening.sql` in the Supabase SQL editor
3. Copy `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your project's API settings
4. Set `SUPABASE_SERVICE_ROLE_KEY` in server-side environment only (never in the browser)

### Webhook setup

For receiving payment provider webhooks in production, you need a server endpoint that:
1. Reads the raw request body
2. Verifies the provider signature
3. Calls `processPaymentWebhook` from `purchaseService.ts`
4. Returns HTTP 200 immediately (process asynchronously)

Options: Supabase Edge Functions, a Bun/Express server, or a Cloudflare Worker.

---

## Webhook local testing

Use a tunnel tool (e.g. ngrok or Cloudflare Tunnel) to expose your local dev server:

```bash
ngrok http 5173
```

Point the payment provider's webhook URL to `https://<your-tunnel-id>.ngrok.io/api/webhooks/payment`.

Note: A Vite SPA cannot natively receive POST requests. Implement a thin server (e.g. `server/webhook.ts`) and add a Vite proxy entry in `vite.config.ts` to forward the `/api/webhooks` prefix.
