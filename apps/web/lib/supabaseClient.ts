"use client";

// Use the shared universal client which is typed with the Database interface
import { createClient as createSharedClient } from '@shared/database/universalClient';
import type { Database } from '@shared/types/types'
import type { SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// createSharedClient returns SupabaseClient<Database>
const supabase = createSharedClient(supabaseUrl, supabaseKey) as SupabaseClient<Database>;

export default supabase;
