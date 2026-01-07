import { useState, useEffect } from 'react';
import { categoryService } from '../services/categoryService';
import type { AssetCategory } from '../types';

export const useCategories = () => {
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const addCategory = async (name: string) => {
    try {
      const newCat = await categoryService.create(name);
      setCategories(prev => [...prev, newCat]);
      return newCat;
    } catch (err) {
      throw err;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await categoryService.delete(id);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      throw err;
    }
  };

  return {
    categories,
    loading,
    fetchCategories,
    addCategory,
    deleteCategory
  };
};
