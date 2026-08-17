import { supabase } from "./supabase";
import { BUSINESS_ID } from "./constants";
import type { DailySummary, Transaction } from "./types";

const LAGOS_TZ = "Africa/Lagos";

function todayInLagos(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: LAGOS_TZ });
}

function lastNDatesInLagos(count: number): string[] {
  const [y, m, d] = todayInLagos().split("-").map(Number);
  const todayUtcMidnight = Date.UTC(y, m - 1, d);

  const dates: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    dates.push(new Date(todayUtcMidnight - i * 86_400_000).toISOString().slice(0, 10));
  }
  return dates;
}

export async function getTodaySummary(): Promise<{
  data: DailySummary | null;
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("daily_summaries")
    .select("*")
    .eq("business_id", BUSINESS_ID)
    .eq("date", todayInLagos())
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export interface TopExpense {
  category: string;
  amount: number;
}

export async function getTopExpenseThisWeek(): Promise<{
  data: TopExpense | null;
  error: string | null;
}> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("transactions")
    .select("category, amount")
    .eq("business_id", BUSINESS_ID)
    .eq("type", "expense")
    .gte("created_at", sevenDaysAgo)
    .returns<Pick<Transaction, "category" | "amount">[]>();

  if (error) return { data: null, error: error.message };

  const totals = new Map<string, number>();
  for (const row of data ?? []) {
    const category = row.category ?? "Uncategorized";
    totals.set(category, (totals.get(category) ?? 0) + row.amount);
  }

  let top: TopExpense | null = null;
  for (const [category, amount] of totals) {
    if (!top || amount > top.amount) top = { category, amount };
  }

  return { data: top, error: null };
}

export async function getRecentTransactions(): Promise<{
  data: Transaction[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("business_id", BUSINESS_ID)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return { data: [], error: error.message };
  return { data: data ?? [], error: null };
}

export interface DayCashflow {
  date: string;
  sales: number;
  expenses: number;
}

export async function getWeeklyCashflow(): Promise<{
  data: DayCashflow[];
  error: string | null;
}> {
  const dates = lastNDatesInLagos(7);

  const { data, error } = await supabase
    .from("daily_summaries")
    .select("date, total_sales, total_expenses")
    .eq("business_id", BUSINESS_ID)
    .gte("date", dates[0])
    .returns<Pick<DailySummary, "date" | "total_sales" | "total_expenses">[]>();

  if (error) return { data: [], error: error.message };

  const byDate = new Map(data?.map((row) => [row.date, row]));

  const result: DayCashflow[] = dates.map((date) => ({
    date,
    sales: byDate.get(date)?.total_sales ?? 0,
    expenses: byDate.get(date)?.total_expenses ?? 0,
  }));

  return { data: result, error: null };
}

export interface WeekTotals {
  sales: number;
  expenses: number;
  profit: number;
}

export interface WeeklySummaryData {
  transactions: Array<Pick<Transaction, "type" | "amount" | "category" | "item">>;
  thisWeek: WeekTotals;
  previousWeek: WeekTotals;
  topExpense: TopExpense | null;
}

export async function getWeeklySummaryData(): Promise<{
  data: WeeklySummaryData | null;
  error: string | null;
}> {
  const dates = lastNDatesInLagos(14);
  const thisWeekDates = new Set(dates.slice(7));
  const previousWeekDates = new Set(dates.slice(0, 7));
  const thisWeekStart = dates[7];

  const [summariesResult, transactionsResult, topExpenseResult] = await Promise.all([
    supabase
      .from("daily_summaries")
      .select("date, total_sales, total_expenses, profit")
      .eq("business_id", BUSINESS_ID)
      .gte("date", dates[0])
      .returns<Pick<DailySummary, "date" | "total_sales" | "total_expenses" | "profit">[]>(),
    supabase
      .from("transactions")
      .select("type, amount, category, item")
      .eq("business_id", BUSINESS_ID)
      .gte("created_at", `${thisWeekStart}T00:00:00+01:00`)
      .returns<Array<Pick<Transaction, "type" | "amount" | "category" | "item">>>(),
    getTopExpenseThisWeek(),
  ]);

  if (summariesResult.error) return { data: null, error: summariesResult.error.message };
  if (transactionsResult.error) return { data: null, error: transactionsResult.error.message };

  const thisWeek: WeekTotals = { sales: 0, expenses: 0, profit: 0 };
  const previousWeek: WeekTotals = { sales: 0, expenses: 0, profit: 0 };

  for (const row of summariesResult.data ?? []) {
    const bucket = thisWeekDates.has(row.date)
      ? thisWeek
      : previousWeekDates.has(row.date)
        ? previousWeek
        : null;
    if (!bucket) continue;
    bucket.sales += row.total_sales ?? 0;
    bucket.expenses += row.total_expenses ?? 0;
    bucket.profit += row.profit;
  }

  return {
    data: {
      transactions: transactionsResult.data ?? [],
      thisWeek,
      previousWeek,
      topExpense: topExpenseResult.data,
    },
    error: null,
  };
}
