// Supabase client setup for Next.js application
// Goal: to handle client-side, server-side, and API route database interactions
// using Supabase with type safety via a Database type definition.
// Will handle auth state via cookies in server and API contexts.

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@shared/types/types'

// Client-side usage (React components)
export const createClient = () => 
  createClientComponentClient<Database>()

// Server components
export const createServerClient = () => 
  createServerComponentClient<Database>({ cookies })

// API routes
export const createApiClient = () => 
  createRouteHandlerClient<Database>({ cookies })

export type SupabaseClient = ReturnType<typeof createClient>