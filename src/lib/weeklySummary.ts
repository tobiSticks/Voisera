import type { WeeklySummaryData } from "./queries";
import { capitalize, formatNaira } from "./format";

export function buildFallbackSummary({
  thisWeek,
  previousWeek,
  topExpense,
}: WeeklySummaryData): string {
  const diff = thisWeek.profit - previousWeek.profit;
  const comparison =
    diff > 0
      ? `up ${formatNaira(diff)} from last week`
      : diff < 0
        ? `down ${formatNaira(Math.abs(diff))} from last week`
        : "unchanged from last week";

  const expenseClause = topExpense
    ? `Most of your spending this week went to ${capitalize(topExpense.category)}, at ${formatNaira(topExpense.amount)}.`
    : "You had no recorded expenses this week.";

  return `${expenseClause} Your profit this week is ${formatNaira(thisWeek.profit)}, ${comparison}.`;
}
