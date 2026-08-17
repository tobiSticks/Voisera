export function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="bg-white dark:bg-black p-8">
      <p className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-4 text-5xl font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
        {value}
      </p>
      {detail && (
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{detail}</p>
      )}
    </div>
  );
}
