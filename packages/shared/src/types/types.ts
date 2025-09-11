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
      // ... other tables
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row']