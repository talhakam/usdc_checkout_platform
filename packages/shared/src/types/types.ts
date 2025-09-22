// Typescript types for Supabase database schema
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'consumer' | 'merchant' | 'admin'
          wallet_address: string | null
          display_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'consumer' | 'merchant' | 'admin'
          wallet_address?: string | null
          display_name?: string | null
        }
        Update: {
          email?: string
          role?: 'consumer' | 'merchant' | 'admin'
          wallet_address?: string | null
          display_name?: string | null
        }
      }
      merchants: {
        Row: {
          id: string
          name: string
          wallet: string
          store_url: string | null
          kyc_url: string | null
          isRegistered: boolean
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          wallet: string
          store_url?: string | null
          kyc_url?: string | null
          isRegistered?: boolean
        }
        Update: {
          name?: string
          wallet?: string
          store_url?: string | null
          kyc_url?: string | null
          isRegistered?: boolean
        }
      }
      orders: {
        Row: {
          id: string
          payment_id: string
          consumer_wallet: string
          merchant_wallet: string
          total_amount: number
          status: string
          created_at: string | null
        }
        Insert: {
          payment_id: string
          consumer_wallet: string
          merchant_wallet: string
          total_amount: number
          status?: string
        }
        Update: {
          status?: string
        }
      }
      refund_requests: {
        Row: {
          id: string
          payment_id: string
          consumer_wallet: string
          refund_amount: number
          status: string
          created_at: string | null
        }
        Insert: {
          payment_id: string
          consumer_wallet: string
          refund_amount: number
          status?: string
        }
        Update: {
          status?: string
        }
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row']