import { createClient } from "@supabase/supabase-js";
import type { Business, Transaction, DailySummary } from "./types";

export interface Database {
  public: {
    Tables: {
      businesses: {
        Row: Business;
        Insert: Business;
        Update: Partial<Business>;
      };
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Transaction>;
      };
    };
    Views: {
      daily_summaries: {
        Row: DailySummary;
      };
    };
  };
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
