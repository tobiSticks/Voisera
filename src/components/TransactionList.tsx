"use client";

import type { Transaction } from "@/lib/types";
import { capitalize, formatNaira, formatTransactionTime } from "@/lib/format";

export function TransactionList({
  transactions,
  highlightedIds,
}: {
  transactions: Transaction[];
  highlightedIds?: Set<string>;
}) {
  if (transactions.length === 0) {
    return (
      <p className="text-zinc-500 dark:text-zinc-400 text-sm py-8">
        No transactions yet.
      </p>
    );
  }

  return (
    <div className="border-t border-zinc-200 dark:border-zinc-800">
      {transactions.map((tx) => {
        const isSale = tx.type === "sale";
        const isHighlighted = highlightedIds?.has(tx.id) ?? false;
        return (
          <div
            key={tx.id}
            className={`grid grid-cols-[6rem_1fr_10rem_9rem] items-center gap-6 border-b border-zinc-200 dark:border-zinc-800 py-4 transition-colors duration-[1500ms] ${
              isHighlighted ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-transparent"
            }`}
          >
            <span className="text-sm text-zinc-500 dark:text-zinc-400 tabular-nums">
              {formatTransactionTime(tx.created_at)}
            </span>

            <span className="text-base text-zinc-950 dark:text-zinc-50 truncate">
              {tx.item ?? "—"}
              <span className="ml-3 text-xs uppercase tracking-wide text-zinc-400 dark:text-zinc-600 align-middle">
                {tx.source}
              </span>
            </span>

            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {tx.category ? capitalize(tx.category) : "—"}
            </span>

            <span
              className={`text-base font-semibold tabular-nums text-right ${
                isSale
                  ? "text-zinc-950 dark:text-zinc-50"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              {isSale ? "+ " : "− "}
              {formatNaira(tx.amount)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
