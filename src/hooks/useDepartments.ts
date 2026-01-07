import { useState, useEffect } from 'react';
import { departmentService } from '../services/departmentService';
import type { Department } from '../types';

export const useDepartments = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const data = await departmentService.getAll();
      setDepartments(data);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const addDepartment = async (name: string) => {
    try {
      const newDept = await departmentService.create(name);
      setDepartments(prev => [...prev, newDept]);
      return newDept;
    } catch (err) {
      throw err;
    }
  };

  const deleteDepartment = async (id: string) => {
    try {
      await departmentService.delete(id);
      setDepartments(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      throw err;
    }
  };

  return {
    departments,
    loading,
    fetchDepartments,
    addDepartment,
    deleteDepartment
  };
};
