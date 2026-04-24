import { X, Filter } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MovementType } from "@/types/inventory";
import type { Item } from "@/types/inventory";
import { useIsMobile } from "@/hooks/use-mobile";
import type { MovementFilters } from "./movement-filter-types";
import { EMPTY_MOVEMENT_FILTERS, isFiltersActive, activeFilterCount } from "./movement-filter-types";

interface MovementsFiltersProps {
  filters: MovementFilters;
  onChange: (f: MovementFilters) => void;
  items: Item[];
  performers: string[];
}

function FilterControls({ filters, onChange, items, performers }: MovementsFiltersProps) {
  const { t } = useTranslation();
  const TYPE_OPTIONS = [
    { value: MovementType.Received, label: t("movements.types.received") },
    { value: MovementType.Shipped, label: t("movements.types.shipped") },
    { value: MovementType.Adjusted, label: t("movements.types.adjusted") },
    { value: MovementType.Transferred, label: t("movements.types.transferred") },
  ];

  const toggleType = (mt: MovementType) => {
    const next = filters.types.includes(mt)
      ? filters.types.filter((v) => v !== mt)
      : [...filters.types, mt];
    onChange({ ...filters, types: next });
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <Label className="mb-1.5 block text-xs text-muted-foreground">{t("movements.filters.type")}</Label>
        <div className="flex flex-wrap gap-2">
          {TYPE_OPTIONS.map((o) => (
            <label key={o.value} className="flex items-center gap-1.5 text-sm">
              <Checkbox
                checked={filters.types.includes(o.value)}
                onCheckedChange={() => toggleType(o.value)}
              />
              {o.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label className="mb-1.5 block text-xs text-muted-foreground">{t("movements.filters.item")}</Label>
        <Select
          value={filters.itemId ?? "__all__"}
          onValueChange={(v) => onChange({ ...filters, itemId: v === "__all__" ? null : v })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder={t("movements.filters.allItems")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t("movements.filters.allItems")}</SelectItem>
            {items.map((i) => (
              <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <Label className="mb-1.5 block text-xs text-muted-foreground">{t("movements.filters.from")}</Label>
          <Input
            type="date"
            className="h-8 text-xs"
            value={filters.dateFrom ?? ""}
            onChange={(e) => onChange({ ...filters, dateFrom: e.target.value || null })}
          />
        </div>
        <div className="flex-1">
          <Label className="mb-1.5 block text-xs text-muted-foreground">{t("movements.filters.to")}</Label>
          <Input
            type="date"
            className="h-8 text-xs"
            value={filters.dateTo ?? ""}
            onChange={(e) => onChange({ ...filters, dateTo: e.target.value || null })}
          />
        </div>
      </div>

      <div>
        <Label className="mb-1.5 block text-xs text-muted-foreground">{t("movements.filters.performedBy")}</Label>
        <Select
          value={filters.performedBy ?? "__all__"}
          onValueChange={(v) => onChange({ ...filters, performedBy: v === "__all__" ? null : v })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder={t("movements.filters.all")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t("movements.filters.all")}</SelectItem>
            {performers.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isFiltersActive(filters) && (
        <Button variant="ghost" size="sm" className="w-fit gap-1 text-xs" onClick={() => onChange(EMPTY_MOVEMENT_FILTERS)}>
          <X className="h-3 w-3" />{t("movements.filters.clear")}
        </Button>
      )}
    </div>
  );
}

export function MovementsFilters(props: MovementsFiltersProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const count = activeFilterCount(props.filters);

  const TYPE_OPTIONS = [
    { value: MovementType.Received, label: t("movements.types.received") },
    { value: MovementType.Shipped, label: t("movements.types.shipped") },
    { value: MovementType.Adjusted, label: t("movements.types.adjusted") },
    { value: MovementType.Transferred, label: t("movements.types.transferred") },
  ];

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Filter className="h-4 w-4" />
            {t("common.filters")}
            {count > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{count}</Badge>}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px]">
          <SheetHeader>
            <SheetTitle>{t("common.filters")}</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <FilterControls {...props} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-4">
        <div>
          <Label className="mb-1.5 block text-xs text-muted-foreground">{t("movements.filters.type")}</Label>
          <div className="flex flex-wrap gap-2">
            {TYPE_OPTIONS.map((o) => (
              <label key={o.value} className="flex items-center gap-1.5 text-sm">
                <Checkbox
                  checked={props.filters.types.includes(o.value)}
                  onCheckedChange={() => {
                    const next = props.filters.types.includes(o.value)
                      ? props.filters.types.filter((v) => v !== o.value)
                      : [...props.filters.types, o.value];
                    props.onChange({ ...props.filters, types: next });
                  }}
                />
                {o.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label className="mb-1.5 block text-xs text-muted-foreground">{t("movements.filters.item")}</Label>
          <Select
            value={props.filters.itemId ?? "__all__"}
            onValueChange={(v) => props.onChange({ ...props.filters, itemId: v === "__all__" ? null : v })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder={t("movements.filters.allItems")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">{t("movements.filters.allItems")}</SelectItem>
              {props.items.map((i) => (
                <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-1.5 block text-xs text-muted-foreground">{t("movements.filters.dateRange")}</Label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Input
              type="date"
              className="h-8 text-xs"
              value={props.filters.dateFrom ?? ""}
              onChange={(e) => props.onChange({ ...props.filters, dateFrom: e.target.value || null })}
            />
            <Input
              type="date"
              className="h-8 text-xs"
              value={props.filters.dateTo ?? ""}
              onChange={(e) => props.onChange({ ...props.filters, dateTo: e.target.value || null })}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <Label className="mb-1.5 block text-xs text-muted-foreground">{t("movements.filters.performedBy")}</Label>
            <Select
              value={props.filters.performedBy ?? "__all__"}
              onValueChange={(v) => props.onChange({ ...props.filters, performedBy: v === "__all__" ? null : v })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder={t("movements.filters.all")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t("movements.filters.all")}</SelectItem>
                {props.performers.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isFiltersActive(props.filters) && (
            <Button variant="ghost" size="sm" className="h-8 justify-start gap-1 text-xs sm:justify-center" onClick={() => props.onChange(EMPTY_MOVEMENT_FILTERS)}>
              <X className="h-3 w-3" />{t("movements.filters.clear")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
