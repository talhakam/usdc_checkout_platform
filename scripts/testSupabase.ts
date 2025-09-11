import { createClient } from '../packages/shared/src/database/universalClient'
import * as dotenv from 'dotenv'
dotenv.config({ path: './.env.local' })
import type { Database } from '../packages/shared/src/types/types'

// You may need to load env vars manually for scripts
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  // Try to fetch something simple, e.g. a table called 'users'
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Supabase connection failed:', error)
    process.exit(1)
  } else {
    console.log('Supabase connection succeeded! Sample data:', data)
    process.exit(0)
  }
}

testConnection()