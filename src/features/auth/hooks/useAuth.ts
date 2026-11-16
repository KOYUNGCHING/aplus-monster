import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import type { AuthMode, AuthUser } from '../types'

interface AuthState {
  user: AuthUser | null
  mode: AuthMode
  loading: boolean
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    mode: isSupabaseConfigured ? 'cloud' : 'local-demo',
    loading: isSupabaseConfigured,
  })

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setState({ user: { id: 'local-demo', displayName: '示範使用者' }, mode: 'local-demo', loading: false })
      return
    }

    // Initial session
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session
      setState({
        user: session?.user
          ? { id: session.user.id, email: session.user.email, displayName: session.user.user_metadata?.display_name }
          : null,
        mode: 'cloud',
        loading: false,
      })
    })

    // Subscribe to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        user: session?.user
          ? { id: session.user.id, email: session.user.email, displayName: session.user.user_metadata?.display_name }
          : null,
        mode: 'cloud',
        loading: false,
      })
    })

    return () => subscription.unsubscribe()
  }, [])

  return state
}

export async function signInWithEmail(email: string, password: string) {
  if (!isSupabaseConfigured) throw new Error('Supabase 尚未設定，請使用本機示範模式。')
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
}

export async function signUpWithEmail(email: string, password: string, displayName?: string) {
  if (!isSupabaseConfigured) throw new Error('Supabase 尚未設定，請使用本機示範模式。')
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName ?? '' } },
  })
  if (error) throw new Error(error.message)
}

export async function signOut() {
  if (!isSupabaseConfigured) return
  await supabase.auth.signOut()
}
