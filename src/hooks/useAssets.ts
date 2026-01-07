import { useState, useEffect } from 'react';
import { assetService } from '../services/assetService';
import type { Asset } from '../types';

export const useAssets = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const data = await assetService.getAll();
      setAssets(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const addAsset = async (asset: Omit<Asset, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newAsset = await assetService.create(asset);
      setAssets(prev => [newAsset, ...prev]);
      return newAsset;
    } catch (err) {
      throw err;
    }
  };

  const updateAsset = async (id: string, updates: Partial<Asset>) => {
    try {
      const updatedAsset = await assetService.update(id, updates);
      setAssets(prev => prev.map(a => a.id === id ? updatedAsset : a));
      return updatedAsset;
    } catch (err) {
      throw err;
    }
  };

  const deleteAsset = async (id: string) => {
    try {
      await assetService.delete(id);
      setAssets(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      throw err;
    }
  };

  const uploadImage = async (file: File, assetId: string) => {
    try {
      return await assetService.uploadImage(file, assetId);
    } catch (err) {
      throw err;
    }
  };

  return {
    assets,
    loading,
    error,
    fetchAssets,
    addAsset,
    updateAsset,
    deleteAsset,
    uploadImage
  };
};
