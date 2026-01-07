import { supabase } from './supabaseClient';
import type { Asset } from '../types';

export const assetService = {
  // Get all assets
  async getAll(): Promise<Asset[]> {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get asset by ID
  async getById(id: string): Promise<Asset | null> {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create new asset
  async create(asset: Omit<Asset, 'id' | 'created_at' | 'updated_at'>): Promise<Asset> {
    const { data, error } = await supabase
      .from('assets')
      .insert([asset])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update asset
  async update(id: string, updates: Partial<Asset>): Promise<Asset> {
    const { data, error } = await supabase
      .from('assets')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete asset
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Upload asset image
  async uploadImage(file: File, assetId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${assetId}_${Date.now()}.${fileExt}`;
    const filePath = `assets/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('asset-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('asset-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }
};
