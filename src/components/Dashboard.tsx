"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { BUSINESS_ID } from "@/lib/constants";
import {
  getTodaySummary,
  getTopExpenseThisWeek,
  getWeeklyCashflow,
  type DayCashflow,
  type TopExpense,
} from "@/lib/queries";
import type { Transaction } from "@/lib/types";
import { capitalize, formatNaira } from "@/lib/format";
import { SummaryCard } from "@/components/SummaryCard";
import { TransactionList } from "@/components/TransactionList";
import { CashflowChart } from "@/components/CashflowChart";
import { WeeklySummary } from "@/components/WeeklySummary";

const MAX_ROWS = 20;
const HIGHLIGHT_MS = 1500;

export function Dashboard({
  initialSalesToday,
  initialProfitToday,
  initialTopExpense,
  initialTransactions,
  initialCashflow,
  initialSummaryText,
}: {
  initialSalesToday: number;
  initialProfitToday: number;
  initialTopExpense: TopExpense | null;
  initialTransactions: Transaction[];
  initialCashflow: DayCashflow[];
  initialSummaryText: string;
}) {
  const [salesToday, setSalesToday] = useState(initialSalesToday);
  const [profitToday, setProfitToday] = useState(initialProfitToday);
  const [topExpense, setTopExpense] = useState<TopExpense | null>(initialTopExpense);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [cashflow, setCashflow] = useState<DayCashflow[]>(initialCashflow);
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());

  const seenIds = useRef<Set<string>>(new Set(initialTransactions.map((tx) => tx.id)));

  useEffect(() => {
    const channel = supabase
      .channel(`transactions-${BUSINESS_ID}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "transactions",
          filter: `business_id=eq.${BUSINESS_ID}`,
        },
        (payload) => {
          const row = payload.new as Transaction;

          if (seenIds.current.has(row.id)) return;
          seenIds.current.add(row.id);

          setTransactions((prev) => [row, ...prev].slice(0, MAX_ROWS));

          setHighlightedIds((prev) => new Set(prev).add(row.id));
          setTimeout(() => {
            setHighlightedIds((prev) => {
              const next = new Set(prev);
              next.delete(row.id);
              return next;
            });
          }, HIGHLIGHT_MS);

          Promise.all([
            getTodaySummary(),
            getTopExpenseThisWeek(),
            getWeeklyCashflow(),
          ]).then(([{ data: summary }, { data: expense }, { data: weekly }]) => {
            setSalesToday(summary?.total_sales ?? 0);
            setProfitToday(summary?.profit ?? 0);
            setTopExpense(expense);
            setCashflow(weekly);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800">
        <SummaryCard label="Sales today" value={formatNaira(salesToday)} />
        <SummaryCard label="Profit today" value={formatNaira(profitToday)} />
        <SummaryCard
          label="Top expense this week"
          value={topExpense ? formatNaira(topExpense.amount) : formatNaira(0)}
          detail={topExpense ? capitalize(topExpense.category) : "No expenses"}
        />
      </div>

      <div className="mt-10">
        <WeeklySummary initialText={initialSummaryText} />
      </div>

      <div className="mt-16">
        <CashflowChart data={cashflow} />
      </div>

      <div className="mt-16">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
          Recent transactions
        </h2>
        <TransactionList transactions={transactions} highlightedIds={highlightedIds} />
      </div>
    </>
  );
}
