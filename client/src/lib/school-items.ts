import type { SchoolItem } from "../../../drizzle/schema";

export function todayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function effectiveEndDate(item: Pick<SchoolItem, "startDate" | "endDate">) {
  return item.endDate || item.startDate;
}

export function isPastItem(item: Pick<SchoolItem, "startDate" | "endDate">, today = todayString()) {
  return effectiveEndDate(item) < today;
}

export function isCurrentItem(item: Pick<SchoolItem, "startDate" | "endDate">, today = todayString()) {
  return item.startDate <= today && effectiveEndDate(item) >= today;
}

export function formatDate(date: string, options: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    ...options,
  }).format(new Date(`${date}T00:00:00`));
}

export function formatDateRange(startDate: string, endDate?: string | null) {
  if (!endDate || endDate === startDate) return formatDate(startDate);
  return `${formatDate(startDate)} — ${formatDate(endDate)}`;
}

export function formatDateParts(date: string) {
  const value = new Date(`${date}T00:00:00`);
  return {
    month: new Intl.DateTimeFormat("en-US", { month: "short" }).format(value).toUpperCase(),
    day: new Intl.DateTimeFormat("ko-KR", { day: "2-digit" }).format(value),
    weekday: new Intl.DateTimeFormat("ko-KR", { weekday: "short" }).format(value),
  };
}

export function getItemStatus(item: Pick<SchoolItem, "startDate" | "endDate">, today = todayString()) {
  if (isPastItem(item, today)) return "past" as const;
  if (isCurrentItem(item, today)) return "current" as const;
  return "upcoming" as const;
}
