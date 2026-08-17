import { NextResponse } from "next/server";
import { getWeeklySummaryData } from "@/lib/queries";
import { buildFallbackSummary } from "@/lib/weeklySummary";
import { generateSummary } from "@/lib/llm";

export async function GET() {
  const { data, error } = await getWeeklySummaryData();

  if (error || !data) {
    return NextResponse.json({
      summary: "Your books are up to date — check back after your next sale.",
    });
  }

  const fallback = buildFallbackSummary(data);

  try {
    const prompt = JSON.stringify({
      thisWeekTransactions: data.transactions,
      previousWeekTotals: data.previousWeek,
    });
    const text = await generateSummary(prompt);
    return NextResponse.json({ summary: text || fallback });
  } catch {
    return NextResponse.json({ summary: fallback });
  }
}
