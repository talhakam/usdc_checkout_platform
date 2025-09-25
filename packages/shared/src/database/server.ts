import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/types'

// Server-only client with service role key (for admin operations)
export const createServiceClient = () => {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// Admin operations that bypass RLS (instance for performing admin tasks)
// NOTE: do NOT create an admin client at module load time here. Consumers should
// call `createServiceClient()` at request time to avoid executing network/credential
// logic during build-time (Next.js collects routes at build). Exporting the factory
// avoids accidental side-effects.