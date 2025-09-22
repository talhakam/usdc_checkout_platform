"use client";

// Ensure the path is correct and the module exists
import { createClient as createSharedClient } from '@shared/database/universalClient';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// createSharedClient returns a typed client; we keep the type loose here for simplicity
const supabase = createSharedClient(supabaseUrl, supabaseKey) as any;

export default supabase;
