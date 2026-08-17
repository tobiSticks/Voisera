"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipContentProps } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import type { DayCashflow } from "@/lib/queries";
import { formatNaira, formatNairaShort, formatWeekday } from "@/lib/format";

const SALES_FILL = "#059669";
const EXPENSE_STROKE = "#71717a";
const AXIS_COLOR = "#71717a";
const HATCH_ID = "expense-hatch";

function CashflowTooltip({ active, payload, label }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length || typeof label !== "string") return null;

  const sales = Number(payload.find((p) => p.dataKey === "sales")?.value ?? 0);
  const expenses = Number(payload.find((p) => p.dataKey === "expenses")?.value ?? 0);

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black px-4 py-3 text-sm">
      <p className="text-zinc-500 dark:text-zinc-400 mb-1">{formatWeekday(label)}</p>
      <p className="text-zinc-950 dark:text-zinc-50 tabular-nums">
        Sales {formatNaira(sales)}
      </p>
      <p className="text-zinc-500 dark:text-zinc-400 tabular-nums">
        Expenses {formatNaira(expenses)}
      </p>
    </div>
  );
}

export function CashflowChart({ data }: { data: DayCashflow[] }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Cashflow, last 7 days
        </h2>
        <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5"
              style={{ backgroundColor: SALES_FILL }}
            />
            Sales
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 border"
              style={{
                borderColor: EXPENSE_STROKE,
                backgroundImage: `repeating-linear-gradient(45deg, ${EXPENSE_STROKE} 0, ${EXPENSE_STROKE} 1px, transparent 1px, transparent 4px)`,
              }}
            />
            Expenses
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barGap={4} barCategoryGap="28%">
          <defs>
            <pattern
              id={HATCH_ID}
              width="6"
              height="6"
              patternTransform="rotate(45)"
              patternUnits="userSpaceOnUse"
            >
              <line x1="0" y1="0" x2="0" y2="6" stroke={EXPENSE_STROKE} strokeWidth="2" />
            </pattern>
          </defs>
          <XAxis
            dataKey="date"
            tickFormatter={formatWeekday}
            tickLine={false}
            axisLine={{ stroke: "#3f3f46" }}
            tick={{ fill: AXIS_COLOR, fontSize: 12 }}
          />
          <YAxis
            tickFormatter={formatNairaShort}
            tickLine={false}
            axisLine={false}
            tick={{ fill: AXIS_COLOR, fontSize: 12 }}
            width={48}
          />
          <Tooltip content={CashflowTooltip} cursor={{ fill: "transparent" }} />
          <Bar dataKey="sales" fill={SALES_FILL} radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar
            dataKey="expenses"
            fill={`url(#${HATCH_ID})`}
            stroke={EXPENSE_STROKE}
            strokeWidth={1}
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
