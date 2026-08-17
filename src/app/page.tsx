import {
  getTodaySummary,
  getTopExpenseThisWeek,
  getRecentTransactions,
  getWeeklyCashflow,
  getWeeklySummaryData,
} from "@/lib/queries";
import { buildFallbackSummary } from "@/lib/weeklySummary";
import { Dashboard } from "@/components/Dashboard";

export default async function Home() {
  const [
    { data: summary },
    { data: topExpense },
    { data: transactions },
    { data: cashflow },
    { data: weeklySummaryData },
  ] = await Promise.all([
    getTodaySummary(),
    getTopExpenseThisWeek(),
    getRecentTransactions(),
    getWeeklyCashflow(),
    getWeeklySummaryData(),
  ]);

  const initialSummaryText = weeklySummaryData
    ? buildFallbackSummary(weeklySummaryData)
    : "Your books are up to date — check back after your next sale.";

  return (
    <div className="min-h-full bg-white dark:bg-black px-16 py-20">
      <h1 className="text-lg font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-500 mb-10">
        Voisera
      </h1>
      <Dashboard
        initialSalesToday={summary?.total_sales ?? 0}
        initialProfitToday={summary?.profit ?? 0}
        initialTopExpense={topExpense}
        initialTransactions={transactions}
        initialCashflow={cashflow}
        initialSummaryText={initialSummaryText}
      />
    </div>
  );
}
