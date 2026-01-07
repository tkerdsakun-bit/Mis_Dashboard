import { supabase } from './supabaseClient';
import type { RepairHistory } from '../types';

export const repairService = {
  async getAll(): Promise<RepairHistory[]> {
    const { data, error } = await supabase
      .from('repair_history')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getByAssetId(assetId: string): Promise<RepairHistory[]> {
    const { data, error } = await supabase
      .from('repair_history')
      .select('*')
      .eq('asset_id', assetId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(repair: Omit<RepairHistory, 'id' | 'created_at'>): Promise<RepairHistory> {
    const { data, error } = await supabase
      .from('repair_history')
      .insert([repair])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<RepairHistory>): Promise<RepairHistory> {
    const { data, error } = await supabase
      .from('repair_history')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('repair_history')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
