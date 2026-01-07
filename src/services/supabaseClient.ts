import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type Definitions
export interface Asset {
  id: number;
  name: string;
  tag: string;
  asset_code?: string; // NEW FIELD
  serial: string;
  category: string;
  location: string;
  price: string;
  purchase_date: string;
  warranty_expiry: string;
  icon: string;
  status: string;
  warranty_days: number;
  image_url?: string;
  created_at?: string;
  assigned_user?: string;
}

export interface InkItem {
  id: number;
  name: string;
  model: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  supplier: string;
  purchase_date: string;
  category: string;
  status: string;
  created_at?: string;
}

export interface Department {
  id: number;
  name: string;
  created_at?: string;
}

export interface AssetCategory {
  id: number;
  name: string;
  icon: string;
  created_at?: string;
}

export interface InkBudgetSummary {
  id: number;
  month: string;
  total_income: number;
  total_expense: number;
  net_amount: number;
  created_at?: string;
}

export interface RepairHistory {
  id: number;
  asset_id: number;
  asset_name: string;
  asset_tag: string;
  issue_description: string;
  repair_status: string;
  repair_cost: number;
  start_date: string;
  end_date?: string;
  technician?: string;
  notes?: string;
  created_at?: string;
}

export interface InkTransaction {
  id: number;
  transaction_type: string; // 'รายรับ' or 'รายจ่าย'
  description: string;
  amount: number;
  transaction_date: string;
  month: string;
  category?: string;
  created_at?: string;
}
