export function formatNaira(amount: number): string {
  return `₦${Math.round(amount).toLocaleString("en-NG")}`;
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const LAGOS_TZ = "Africa/Lagos";

export function formatTransactionTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  const today = new Date().toLocaleDateString("en-CA", { timeZone: LAGOS_TZ });
  const dateInLagos = date.toLocaleDateString("en-CA", { timeZone: LAGOS_TZ });

  if (dateInLagos === today) {
    return date.toLocaleTimeString("en-US", {
      timeZone: LAGOS_TZ,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  return date.toLocaleDateString("en-US", {
    timeZone: LAGOS_TZ,
    month: "short",
    day: "numeric",
  });
}

export function formatWeekday(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00Z`);
  return date.toLocaleDateString("en-US", { weekday: "short", timeZone: LAGOS_TZ });
}

function trimTrailingZero(value: string): string {
  return value.replace(/\.0$/, "");
}

export function formatNairaShort(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) {
    return `₦${trimTrailingZero((amount / 1_000_000).toFixed(1))}M`;
  }
  if (abs >= 1_000) {
    return `₦${trimTrailingZero((amount / 1_000).toFixed(1))}k`;
  }
  return `₦${Math.round(amount)}`;
}
