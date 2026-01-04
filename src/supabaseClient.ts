import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export interface Asset {
  id: number;
  icon: string;
  name: string;
  tag: string;
  serial: string;
  category: string;
  location: string;
  status: string;
  purchase_date: string;
  warranty_expiry: string;
  price: string;
  warranty_days: number;
  created_at?: string;
  updated_at?: string;
}

export interface InkItem {
  id: number;
  printer_name: string;
  printer_tag: string;
  ink_type: string;
  current_level: number;
  min_level: number;
  max_level: number;
  unit_price: number;
  last_refill: string;
  estimated_days_left: number;
  monthly_usage: number;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface Department {
  id: number;
  name: string;
  created_at?: string;
}
