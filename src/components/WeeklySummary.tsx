"use client";

import { useEffect, useState } from "react";

export function WeeklySummary({ initialText }: { initialText: string }) {
  const [text, setText] = useState(initialText);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchSummary() {
    try {
      const res = await fetch("/api/summary");
      const data = await res.json();
      if (data?.summary) setText(data.summary);
    } catch {
      // keep whatever is currently displayed
    }
  }

  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchSummary();
    setRefreshing(false);
  }

  return (
    <div className="flex items-start justify-between gap-6">
      <p className="text-lg leading-relaxed text-zinc-700 dark:text-zinc-300 max-w-3xl">
        {text}
      </p>
      <button
        type="button"
        onClick={handleRefresh}
        disabled={refreshing}
        className="shrink-0 text-xs uppercase tracking-wide text-zinc-400 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400 disabled:opacity-50 mt-1"
      >
        {refreshing ? "Refreshing…" : "Refresh"}
      </button>
    </div>
  );
}
