import type { SchoolItemCategory } from "../../../drizzle/schema";

export const CATEGORY_OPTIONS: Array<{ value: SchoolItemCategory; label: string; shortLabel: string }> = [
  { value: "school-event", label: "학교 행사", shortLabel: "행사" },
  { value: "exam", label: "시험", shortLabel: "시험" },
  { value: "holiday", label: "휴일", shortLabel: "휴일" },
  { value: "school-anniversary", label: "학교 기념일", shortLabel: "기념일" },
  { value: "notice", label: "공지", shortLabel: "공지" },
  { value: "other", label: "기타", shortLabel: "기타" },
];

export const CATEGORY_LABELS = Object.fromEntries(
  CATEGORY_OPTIONS.map(option => [option.value, option.label]),
) as Record<SchoolItemCategory, string>;
