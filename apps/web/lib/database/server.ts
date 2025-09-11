import { createClient } from '@supabase/supabase-js'
import type { Database } from '@shared/types/types'

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
export const adminClient = createServiceClient()