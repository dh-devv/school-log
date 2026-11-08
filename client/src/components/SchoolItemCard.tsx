import { CalendarDays, ChevronRight, Clock3 } from "lucide-react";
import type { SchoolItem } from "../../../drizzle/schema";
import { CATEGORY_LABELS } from "@/lib/categories";
import { formatDateParts, formatDateRange, getItemStatus } from "@/lib/school-items";

const STATUS_LABELS = {
  current: "진행 중",
  upcoming: "예정",
  past: "지난 기록",
} as const;

export default function SchoolItemCard({ item }: { item: SchoolItem }) {
  const status = getItemStatus(item);
  const parts = formatDateParts(item.startDate);

  return (
    <article className={`item-card item-card-${status}`}>
      <div className="item-date-rail" aria-label={`${item.startDate} 시작`}>
        <span className="item-month">{parts.month}</span>
        <strong>{parts.day}</strong>
        <span className="item-weekday">{parts.weekday}</span>
      </div>
      <div className="item-card-body">
        <div className="item-card-meta">
          <span className={`category-pill category-${item.category}`}>{CATEGORY_LABELS[item.category]}</span>
          <span className={`status-label status-${status}`}>
            <span className="status-dot" aria-hidden="true" />
            {STATUS_LABELS[status]}
          </span>
        </div>
        <h3>{item.title}</h3>
        {item.description && <p>{item.description}</p>}
        <div className="item-card-footer">
          <span><CalendarDays size={15} aria-hidden="true" /> {formatDateRange(item.startDate, item.endDate)}</span>
          {status === "current" && <span className="item-live-note"><Clock3 size={14} aria-hidden="true" /> 오늘 확인</span>}
          {status !== "current" && <ChevronRight size={17} aria-hidden="true" className="card-arrow" />}
        </div>
      </div>
    </article>
  );
}
