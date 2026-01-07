import { supabase } from './supabaseClient';
import type { InkTransaction, InkBudgetSummary } from '../types';

export const transactionService = {
  async getAll(): Promise<InkTransaction[]> {
    const { data, error } = await supabase
      .from('ink_transactions')
      .select('*')
      .order('transaction_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getByMonth(year: number, month: number): Promise<InkTransaction[]> {
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0).toISOString();

    const { data, error } = await supabase
      .from('ink_transactions')
      .select('*')
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .order('transaction_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getSummary(): Promise<InkBudgetSummary> {
    const { data, error } = await supabase
      .from('ink_transactions')
      .select('transaction_type, amount');

    if (error) throw error;

    const summary = (data || []).reduce(
      (acc, tx) => {
        if (tx.transaction_type === 'รายรับ') {
          acc.total_income += tx.amount;
        } else {
          acc.total_expense += tx.amount;
        }
        return acc;
      },
      { total_income: 0, total_expense: 0, net_amount: 0 }
    );

    summary.net_amount = summary.total_income - summary.total_expense;
    return summary;
  },

  async create(transaction: Omit<InkTransaction, 'id' | 'created_at'>): Promise<InkTransaction> {
    const { data, error } = await supabase
      .from('ink_transactions')
      .insert([transaction])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('ink_transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
