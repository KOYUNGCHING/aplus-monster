/**
 * Supabase browser client.
 *
 * Reads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from the environment.
 * These are the ONLY Supabase values that may be VITE_-prefixed (they are
 * public by design — the anon key is safe to expose in the browser).
 *
 * When the env vars are absent (local demo mode), all Supabase calls will
 * fail gracefully and the app falls back to IndexedDB.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured =
  !!supabaseUrl &&
  supabaseUrl !== 'your-project-url' &&
  !!supabaseAnonKey &&
  supabaseAnonKey !== 'your-public-anon-key'

// Create a real client when configured, or a no-op stub when not.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : createClient('https://placeholder.supabase.co', 'placeholder-anon-key')
