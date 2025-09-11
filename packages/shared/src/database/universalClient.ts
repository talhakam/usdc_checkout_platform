// Universal Supabase client for both server and client environments

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/types'

export function createClient(
  supabaseUrl: string,
  supabaseKey: string
) {
  return createSupabaseClient<Database>(supabaseUrl, supabaseKey)
}