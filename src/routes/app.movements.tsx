import { useState, useMemo, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Plus, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MovementsTable } from "@/components/movements/MovementsTable";
import { MovementsFilters } from "@/components/movements/MovementsFilters";
import { MovementStats } from "@/components/movements/MovementStats";
import { MovementFormSheet } from "@/components/movements/MovementFormSheet";
import { CSVExportButton, type CSVColumn } from "@/components/data/CSVExportButton";
import { EMPTY_MOVEMENT_FILTERS } from "@/components/movements/movement-filter-types";
import type { MovementFilters } from "@/components/movements/movement-filter-types";
import { useMovements, useItems, useLocations } from "@/hooks/useInventoryData";
import { PermissionGate } from "@/hooks/usePermissions";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { i18n } from "@/i18n";
import type { StockMovement } from "@/types/inventory";

export const Route = createFileRoute("/app/movements")({
  component: MovementsPage,
  head: () => ({ meta: [{ title: i18n.t("movements.pageTitle") }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    item: typeof search.item === "string" ? search.item : undefined,
  }),
});

function applyFilters(movements: StockMovement[], f: MovementFilters): StockMovement[] {
  let result = movements;
  if (f.types.length > 0) result = result.filter((m) => f.types.includes(m.type));
  if (f.itemId) result = result.filter((m) => m.itemId === f.itemId);
  if (f.performedBy) result = result.filter((m) => m.performedBy === f.performedBy);
  if (f.dateFrom) {
    const from = new Date(f.dateFrom);
    from.setHours(0, 0, 0, 0);
    result = result.filter((m) => new Date(m.createdAt) >= from);
  }
  if (f.dateTo) {
    const to = new Date(f.dateTo);
    to.setHours(23, 59, 59, 999);
    result = result.filter((m) => new Date(m.createdAt) <= to);
  }
  return result;
}

function MovementsPage() {
  const { t } = useTranslation();
  const { item: itemParam } = Route.useSearch();
  const [filters, setFilters] = useState<MovementFilters>(EMPTY_MOVEMENT_FILTERS);
  const [formOpen, setFormOpen] = useState(false);
  const { data: movements } = useMovements();
  const { data: items } = useItems();
  const { data: locations } = useLocations();

  useEffect(() => {
    if (itemParam) {
      setFilters((prev) => ({ ...prev, itemId: itemParam }));
    }
  }, [itemParam]);

  const itemNameMap = useMemo(
    () => new Map(items.map((i) => [i.id, i.name])),
    [items],
  );

  const locationNameMap = useMemo(
    () => new Map(locations.map((l) => [l.id, l.name])),
    [locations],
  );

  const performers = useMemo(
    () => [...new Set(movements.map((m) => m.performedBy))].sort(),
    [movements],
  );

  const filtered = useMemo(() => applyFilters(movements, filters), [movements, filters]);

  const movementCsvColumns = useMemo<CSVColumn<StockMovement>[]>(() => [
    { header: t("movements.csv.headers.date"), accessor: (m) => new Date(m.createdAt).toLocaleDateString() },
    { header: t("movements.csv.headers.type"), accessor: (m) => m.type },
    { header: t("movements.csv.headers.itemName"), accessor: (m) => itemNameMap.get(m.itemId) ?? "" },
    { header: t("movements.csv.headers.sku"), accessor: (m) => items.find((i) => i.id === m.itemId)?.sku ?? "" },
    { header: t("movements.csv.headers.quantity"), accessor: (m) => m.quantity },
    { header: t("movements.csv.headers.performedBy"), accessor: (m) => m.performedBy },
    { header: t("movements.csv.headers.reference"), accessor: (m) => m.reference },
    { header: t("movements.csv.headers.notes"), accessor: (m) => m.notes },
  ], [itemNameMap, items, t]);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t("movements.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("movements.countLabel", { count: filtered.length })}</p>
        </div>
        <div className="flex items-center gap-2">
          <CSVExportButton
            data={filtered}
            columns={movementCsvColumns}
            filename={t("movements.csv.filename")}
          />
          <PermissionGate permission="log_movement">
            <Button onClick={() => setFormOpen(true)} className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white">
              <Plus className="h-4 w-4" />
              {t("movements.log")}
            </Button>
          </PermissionGate>
        </div>
      </div>

      <MovementsFilters
        filters={filters}
        onChange={setFilters}
        items={items}
        performers={performers}
      />

      <MovementStats movements={filtered} />

      <ErrorBoundary>
      {movements.length === 0 ? (
        <EmptyState
          icon={ArrowUpDown}
          title={t("movements.empty.title")}
          description={t("movements.empty.description")}
          actionLabel={t("movements.log")}
          onAction={() => setFormOpen(true)}
        />
      ) : (
        <MovementsTable movements={filtered} itemNameMap={itemNameMap} locationNameMap={locationNameMap} />
      )}
      </ErrorBoundary>

      <MovementFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        items={items}
        locations={locations}
      />
    </div>
  );
}
