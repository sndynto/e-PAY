// ─────────────────────────────────────────────────────────────────────────────
// Auth helpers
// Wraps Supabase Auth for sign-in, sign-up, sign-out, and session access.
// ─────────────────────────────────────────────────────────────────────────────
import { getSupabaseClient } from './supabase'
import type { User, Session, AuthError } from '@supabase/supabase-js'

export interface AuthResult {
  user: User | null
  session: Session | null
  error: AuthError | null
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { user: data.user, session: data.session, error }
}

export async function signUp(email: string, password: string, fullName: string): Promise<AuthResult> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })
  return { user: data.user, session: data.session, error }
}

export async function signOut(): Promise<{ error: AuthError | null }> {
  const supabase = getSupabaseClient()
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function resetPassword(email: string): Promise<{ error: AuthError | null }> {
  const supabase = getSupabaseClient()
  const redirectTo = `${window.location.origin}/reset-password`
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
  return { error }
}

export async function getCurrentSession(): Promise<{ user: User | null; session: Session | null }> {
  const supabase = getSupabaseClient()
  const { data } = await supabase.auth.getSession()
  return { user: data.session?.user ?? null, session: data.session }
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  const supabase = getSupabaseClient()
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null)
  })
  return () => subscription.unsubscribe()
}
