// ─────────────────────────────────────────────────────────────────────────────
// E-PAY Security Headers (meta-tag and Vite dev plugin approach)
//
// In production, security headers should be set by the CDN / reverse proxy
// (Vercel, Netlify, nginx, Cloudflare Workers).  For local dev and static
// Netlify/Vercel deployments we inject them via HTML meta tags where possible
// and document the edge-config equivalents.
//
// NOTE: X-Frame-Options, X-Content-Type-Options, and Referrer-Policy cannot be
// set via <meta> in all browsers; they are documented below for the infra team.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Recommended HTTP response headers for E-PAY.
 * Apply at the CDN / proxy layer; these values are for documentation and
 * the Vite dev-server middleware (configured in vite.config.ts).
 */
export const SECURITY_HEADERS: Record<string, string> = {
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  // Prevent MIME-type sniffing
  'X-Content-Type-Options': 'nosniff',
  // Limit referrer to same-origin only
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Permissions policy — deny unused powerful features
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  // CSP — restrict resource origins
  // Supabase, wagmi RPC, and ConnectKit require 'self' + specific connect-src
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",   // unsafe-inline needed for Vite HMR in dev; remove in prod
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    // Supabase, Arc RPC, wagmi, ConnectKit API endpoints
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://rpc.testnet.arc.io https://rpc.arc.io https://api.walletconnect.org https://relay.walletconnect.org wss://relay.walletconnect.org",
    "font-src 'self' data:",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
  ].join('; '),
}
