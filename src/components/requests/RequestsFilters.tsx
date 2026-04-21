import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RequestStatus } from "@/types/inventory";
import type { RequestFilters } from "./request-filter-types";
import { EMPTY_REQUEST_FILTERS } from "./request-filter-types";

const STATUS_KEYS: { value: RequestStatus; key: "pending" | "approved" | "partial" | "fulfilled" | "declined" | "cancelled" }[] = [
  { value: RequestStatus.Pending, key: "pending" },
  { value: RequestStatus.Approved, key: "approved" },
  { value: RequestStatus.PartiallyFulfilled, key: "partial" },
  { value: RequestStatus.Fulfilled, key: "fulfilled" },
  { value: RequestStatus.Declined, key: "declined" },
  { value: RequestStatus.Cancelled, key: "cancelled" },
];

interface RequestsFiltersProps {
  filters: RequestFilters;
  onChange: (filters: RequestFilters) => void;
}

export function RequestsFilters({ filters, onChange }: RequestsFiltersProps) {
  const { t } = useTranslation();
  const hasFilters =
    filters.statuses.length > 0 || filters.requestor || filters.dateFrom || filters.dateTo;

  function toggleStatus(status: RequestStatus) {
    const next = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onChange({ ...filters, statuses: next });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {STATUS_KEYS.map((s) => (
        <Badge
          key={s.value}
          variant={filters.statuses.includes(s.value) ? "default" : "outline"}
          className="cursor-pointer select-none"
          onClick={() => toggleStatus(s.value)}
        >
          {t(`requests.status.${s.key}` as const)}
        </Badge>
      ))}
      <Input
        placeholder={t("requests.filters.requestor")}
        value={filters.requestor}
        onChange={(e) => onChange({ ...filters, requestor: e.target.value })}
        className="h-8 w-32"
      />
      <Input
        type="date"
        value={filters.dateFrom}
        onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
        className="h-8 w-36"
        aria-label={t("requests.filters.fromDate")}
      />
      <Input
        type="date"
        value={filters.dateTo}
        onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
        className="h-8 w-36"
        aria-label={t("requests.filters.toDate")}
      />
      {hasFilters && (
        <Button
          size="sm"
          variant="ghost"
          className="h-8 gap-1 text-xs"
          onClick={() => onChange(EMPTY_REQUEST_FILTERS)}
        >
          <X className="h-3 w-3" />
          {t("requests.filters.clear")}
        </Button>
      )}
    </div>
  );
}
