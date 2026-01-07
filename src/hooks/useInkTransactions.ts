import { useState, useEffect } from 'react';
import { transactionService } from '../services/transactionService';
import type { InkTransaction, InkBudgetSummary } from '../types';

export const useInkTransactions = () => {
  const [transactions, setTransactions] = useState<InkTransaction[]>([]);
  const [summary, setSummary] = useState<InkBudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await transactionService.getAll();
      setTransactions(data);

      const summaryData = await transactionService.getSummary();
      setSummary(summaryData);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const addTransaction = async (transaction: Omit<InkTransaction, 'id' | 'created_at'>) => {
    try {
      const newTx = await transactionService.create(transaction);
      setTransactions(prev => [newTx, ...prev]);
      await fetchTransactions(); // Refresh summary
      return newTx;
    } catch (err) {
      throw err;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await transactionService.delete(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
      await fetchTransactions(); // Refresh summary
    } catch (err) {
      throw err;
    }
  };

  const getMonthlyTransactions = (year: number, month: number) => {
    return transactions.filter(tx => {
      const txDate = new Date(tx.transaction_date);
      return txDate.getFullYear() === year && txDate.getMonth() === month - 1;
    });
  };

  return {
    transactions,
    summary,
    loading,
    fetchTransactions,
    addTransaction,
    deleteTransaction,
    getMonthlyTransactions
  };
};
