import { supabase } from './supabaseClient';
import type { AssetCategory } from '../types';

export const categoryService = {
  async getAll(): Promise<AssetCategory[]> {
    const { data, error } = await supabase
      .from('asset_categories')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async create(name: string): Promise<AssetCategory> {
    const { data, error } = await supabase
      .from('asset_categories')
      .insert([{ name }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('asset_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
