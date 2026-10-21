// ─────────────────────────────────────────────────────────────────────────────
// useAuth hook
// Provides the current Supabase user, loading state, and auth actions.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { getCurrentSession, onAuthStateChange, signOut } from '@/lib/auth'
import { isSupabaseConfigured } from '@/lib/supabase'

export interface UseAuthReturn {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  isDemoMode: boolean
  logout: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const isDemoMode = !isSupabaseConfigured()

  useEffect(() => {
    if (isDemoMode) {
      queueMicrotask(() => setLoading(false))
      return
    }
    // Get initial session
    void getCurrentSession().then(({ user: u }) => {
      // queueMicrotask defers the state batch out of the effect tick
      queueMicrotask(() => {
        setUser(u)
        setLoading(false)
      })
    })
    // Subscribe to auth changes
    const unsub = onAuthStateChange((u) => setUser(u))
    return unsub
  }, [isDemoMode])

  const logout = useCallback(async () => {
    if (isDemoMode) return
    await signOut()
    setUser(null)
  }, [isDemoMode])

  return {
    user,
    loading,
    isAuthenticated: isDemoMode ? true : user !== null,
    isDemoMode,
    logout,
  }
}
