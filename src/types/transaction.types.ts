export interface InkTransaction {
  id: string;
  transaction_type: 'รายรับ' | 'รายจ่าย';
  amount: number;
  description: string;
  transaction_date: string;
  created_at: string;
}

export interface InkBudgetSummary {
  total_income: number;
  total_expense: number;
  net_amount: number;
}

export interface InkItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  created_at: string;
}
