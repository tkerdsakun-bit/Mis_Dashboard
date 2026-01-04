import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Asset = {
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
  image_url?: string;
  created_at?: string;
  updated_at?: string;
};

export type InkItem = {
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
};

export type Department = {
  id: number;
  name: string;
  created_at?: string;
};

export type AssetCategory = {
  id: number;
  name: string;
  icon: string;
  created_at?: string;
};

export type InkBudgetSummary = {
  id: number;
  month: string;
  total_spent: number;
  budget_limit: number;
  created_at?: string;
  updated_at?: string;
};

export type RepairHistory = {
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
  updated_at?: string;
};
