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


// NOTE: Do NOT create a service client at module scope. Creating the
// admin/service-role client during module initialization will run during
// Next/Vercel build-time and can fail when environment variables are not
// available. Call `createServiceClient()` inside a request handler (or
// server-only function) instead.