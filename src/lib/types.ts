export type TransactionType = "sale" | "expense";
export type TransactionSource = "voice" | "photo" | "text";

export interface Business {
  id: string;
  telegram_user_id: number;
  name: string | null;
  phone: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  business_id: string;
  type: TransactionType;
  item: string | null;
  amount: number;
  category: string | null;
  raw_text: string | null;
  source: TransactionSource;
  confidence: number | null;
  created_at: string;
}

export interface DailySummary {
  business_id: string;
  date: string;
  total_sales: number | null;
  total_expenses: number | null;
  profit: number;
  transaction_count: number;
}
