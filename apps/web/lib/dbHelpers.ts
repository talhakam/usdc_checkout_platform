import supabase from './supabaseClient'
import type { Database } from '@shared/types/types'

export async function insertMerchants(rows: Database['public']['Tables']['merchants']['Insert'][]) {
  return supabase.from('merchants').insert(rows as any) // eslint-disable-line @typescript-eslint/no-explicit-any -- intentional: supabase typing mismatch workaround for insert payload
}

export async function insertOrders(rows: Database['public']['Tables']['orders']['Insert'][]) {
  return supabase.from('orders').insert(rows as any) // eslint-disable-line @typescript-eslint/no-explicit-any -- intentional: supabase typing mismatch workaround for insert payload
}

const dbHelpers = {
  insertMerchants,
  insertOrders,
}

export default dbHelpers
