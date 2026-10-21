import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/__tests__/**/*.test.ts'],
    // Coverage is opt-in; run with `bun run test:coverage`
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/server/**/*.ts'],
    },
    // Suppress console noise in tests
    silent: false,
    // Each test file gets a fresh module registry
    isolate: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Minimal env so import.meta.env works in non-browser tests
  define: {
    'import.meta.env.VITE_PAYMENT_PROVIDER_MODE': JSON.stringify('demo'),
    'import.meta.env.VITE_QUOTE_PROVIDER_MODE': JSON.stringify('demo'),
    'import.meta.env.VITE_FULFILLMENT_PROVIDER_MODE': JSON.stringify('demo'),
    'import.meta.env.VITE_ARC_NETWORK_MODE': JSON.stringify('demo'),
    'import.meta.env.VITE_ARC_CHAIN_ID': JSON.stringify('5042002'),
    'import.meta.env.VITE_ARC_RPC_URL': JSON.stringify(''),
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(''),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(''),
  },
})
