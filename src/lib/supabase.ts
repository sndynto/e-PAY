// ─────────────────────────────────────────────────────────────────────────────
// Supabase client helpers
// The anon client is safe for browser use.
// The service-role client is for server-side logic only — it bypasses RLS.
// ─────────────────────────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

function assertConfigured(val: string | undefined, name: string): string {
  if (!val) {
    console.warn(
      `[E-PAY] ${name} is not set. Supabase features will not work. ` +
      'Set it in .env (copy from .env.example) and restart the dev server.',
    )
    return ''
  }
  return val
}

/**
 * Anon / public client — safe to use in browser code.
 * Uses Row Level Security to enforce per-user access.
 */
let _anonClient: SupabaseClient | null = null
export function getSupabaseClient(): SupabaseClient {
  if (_anonClient) return _anonClient
  const url = assertConfigured(supabaseUrl, 'VITE_SUPABASE_URL')
  const key = assertConfigured(supabaseAnonKey, 'VITE_SUPABASE_ANON_KEY')
  if (!url || !key) {
    // Return a stub that fails gracefully
    _anonClient = createClient('https://placeholder.supabase.co', 'placeholder-key')
    return _anonClient
  }
  _anonClient = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true },
  })
  return _anonClient
}

/** Whether Supabase is fully configured and usable */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey)
}
