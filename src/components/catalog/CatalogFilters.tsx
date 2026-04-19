import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { BarcodeScannerButton } from "@/components/shared/BarcodeScannerButton";
import type { Category, Supplier, Location } from "@/types/inventory";
import type { ItemFilters } from "@/lib/demo-store";

interface CatalogFiltersProps {
  filters: ItemFilters;
  onChange: (f: ItemFilters) => void;
  categories: Category[];
  suppliers: Supplier[];
  locations: Location[];
}

export function CatalogFilters({ filters, onChange, categories, suppliers, locations }: CatalogFiltersProps) {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const STATUS_OPTIONS = [
    { value: "all", label: t("catalog.statusFilter.all") },
    { value: "in-stock", label: t("catalog.statusFilter.inStock") },
    { value: "low-stock", label: t("catalog.statusFilter.lowStock") },
    { value: "out-of-stock", label: t("catalog.statusFilter.outOfStock") },
  ];

  const activeCount = [filters.categoryId, filters.supplierId, filters.status, filters.locationId, filters.search].filter(Boolean).length;

  const update = (patch: Partial<ItemFilters>) => onChange({ ...filters, ...patch });
  const clear = () => onChange({});

  const filterControls = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
      <div className="flex w-full items-center gap-2 sm:w-auto">
        <input
          type="text"
          placeholder={t("catalog.searchPlaceholder")}
          value={filters.search ?? ""}
          onChange={(e) => update({ search: e.target.value || undefined })}
          className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-primary sm:w-48"
        />
        <BarcodeScannerButton
          onDetected={(code) => update({ search: code })}
          size="icon"
          className="h-9 w-9 shrink-0"
          ariaLabel={t("common.scanWithCamera")}
        />
      </div>

      <Select value={filters.categoryId ?? "all"} onValueChange={(v) => update({ categoryId: v === "all" ? undefined : v })}>
        <SelectTrigger className="h-9 w-full sm:w-40"><SelectValue placeholder={t("common.category")} /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("catalog.categoryAll")}</SelectItem>
          {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={filters.supplierId ?? "all"} onValueChange={(v) => update({ supplierId: v === "all" ? undefined : v })}>
        <SelectTrigger className="h-9 w-full sm:w-40"><SelectValue placeholder={t("catalog.table.supplier")} /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("catalog.supplierAll")}</SelectItem>
          {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={filters.status ?? "all"} onValueChange={(v) => update({ status: v === "all" ? undefined : v })}>
        <SelectTrigger className="h-9 w-full sm:w-36"><SelectValue placeholder={t("common.status")} /></SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={filters.locationId ?? "all"} onValueChange={(v) => update({ locationId: v === "all" ? undefined : v })}>
        <SelectTrigger className="h-9 w-full sm:w-40"><SelectValue placeholder={t("catalog.table.location")} /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("catalog.locationAll")}</SelectItem>
          {locations.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
        </SelectContent>
      </Select>

      {activeCount > 0 && (
        <Button variant="ghost" size="sm" onClick={clear} className="gap-1 text-muted-foreground">
          <X className="h-3 w-3" />{t("common.clearFilters")}
        </Button>
      )}
    </div>
  );

  return (
    <>
      <div className="hidden sm:block">{filterControls}</div>

      <div className="sm:hidden">
        <Button variant="outline" size="sm" onClick={() => setMobileOpen(true)} className="gap-2">
          <Filter className="h-4 w-4" />
          {t("common.filters")}
          {activeCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{activeCount}</span>
          )}
        </Button>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="bottom" className="max-h-[80vh]">
            <SheetTitle>{t("common.filters")}</SheetTitle>
            <div className="mt-4">{filterControls}</div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
