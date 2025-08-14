export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          email: string
          full_name: string
          role: 'Admin' | 'Manager' | 'Chef Teller' | 'Teller'
          is_active: boolean
          created_at: string
          last_login: string | null
        }
        Insert: {
          id?: string
          username: string
          email: string
          full_name: string
          role?: 'Admin' | 'Manager' | 'Chef Teller' | 'Teller'
          is_active?: boolean
          created_at?: string
          last_login?: string | null
        }
        Update: {
          id?: string
          username?: string
          email?: string
          full_name?: string
          role?: 'Admin' | 'Manager' | 'Chef Teller' | 'Teller'
          is_active?: boolean
          created_at?: string
          last_login?: string | null
        }
      }
      sales_records: {
        Row: {
          id: string
          product_code: string
          product_name: string
          quantity: number
          unit_price: number
          total_amount: number
          customer_name: string
          scan_type: 'qr' | 'barcode' | 'manual'
          scanned_data: string | null
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          product_code: string
          product_name: string
          quantity: number
          unit_price: number
          total_amount: number
          customer_name: string
          scan_type?: 'qr' | 'barcode' | 'manual'
          scanned_data?: string | null
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          product_code?: string
          product_name?: string
          quantity?: number
          unit_price?: number
          total_amount?: number
          customer_name?: string
          scan_type?: 'qr' | 'barcode' | 'manual'
          scanned_data?: string | null
          user_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'Admin' | 'Manager' | 'Chef Teller' | 'Teller'
      scan_type: 'qr' | 'barcode' | 'manual'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}