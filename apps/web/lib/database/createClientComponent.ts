// Client-only Supabase factory. This file must NOT import next/headers or any
// server-only helpers so it can be imported from client components.
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@shared/types/types'

export const createClient = () => createClientComponentClient<Database>()

export type SupabaseClient = ReturnType<typeof createClient>
