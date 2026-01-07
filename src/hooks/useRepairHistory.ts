import { useState, useEffect } from 'react';
import { repairService } from '../services/repairService';
import type { RepairHistory } from '../types';

export const useRepairHistory = (assetId?: string) => {
  const [repairs, setRepairs] = useState<RepairHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRepairs = async () => {
    try {
      setLoading(true);
      const data = assetId 
        ? await repairService.getByAssetId(assetId)
        : await repairService.getAll();
      setRepairs(data);
    } catch (err) {
      console.error('Failed to fetch repairs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepairs();
  }, [assetId]);

  const addRepair = async (repair: Omit<RepairHistory, 'id' | 'created_at'>) => {
    try {
      const newRepair = await repairService.create(repair);
      setRepairs(prev => [newRepair, ...prev]);
      return newRepair;
    } catch (err) {
      throw err;
    }
  };

  const updateRepair = async (id: string, updates: Partial<RepairHistory>) => {
    try {
      const updated = await repairService.update(id, updates);
      setRepairs(prev => prev.map(r => r.id === id ? updated : r));
      return updated;
    } catch (err) {
      throw err;
    }
  };

  const deleteRepair = async (id: string) => {
    try {
      await repairService.delete(id);
      setRepairs(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      throw err;
    }
  };

  return {
    repairs,
    loading,
    fetchRepairs,
    addRepair,
    updateRepair,
    deleteRepair
  };
};
