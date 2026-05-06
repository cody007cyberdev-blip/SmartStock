import { useState, useMemo, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, Upload, Package } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CSVExportButton, type CSVColumn } from "@/components/data/CSVExportButton";
import { CSVImportSheet, type ImportField } from "@/components/data/CSVImportSheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CatalogTable, type SortState } from "@/components/catalog/CatalogTable";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { ItemFormSheet } from "@/components/catalog/ItemFormSheet";
import { BulkActionBar } from "@/components/catalog/BulkActionBar";
import { ItemDetailSheet } from "@/components/catalog/ItemDetailSheet";
import { RowActionsMenu } from "@/components/catalog/RowActionsMenu";
import { MovementFormSheet } from "@/components/movements/MovementFormSheet";
import { printBarcodeLabels } from "@/components/catalog/PrintBarcodeLabel";
import { useItems, useCategories, useSuppliers, useLocations } from "@/hooks/useInventoryData";
import { useCreateItem, useUpdateItem, useDeleteItem } from "@/hooks/useInventoryMutations";
import { PermissionGate, usePermissions } from "@/hooks/usePermissions";
import { useRole } from "@/hooks/useRole";
import type { Item } from "@/types/inventory";
import { ItemStatus } from "@/types/inventory";
import type { ItemFilters } from "@/lib/demo-store";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

interface CatalogSearch {
  item?: string;
  newItem?: string;
}

export const Route = createFileRoute("/app/catalog")({
  component: CatalogPage,
  head: () => ({ meta: [{ title: "Catálogo — StockMind" }] }),
  validateSearch: (search: Record<string, unknown>): CatalogSearch => ({
    item: typeof search.item === "string" ? search.item : undefined,
    newItem: typeof search.newItem === "string" ? search.newItem : undefined,
  }),
});

function CatalogPage() {
  const { t } = useTranslation();
  const { item: itemId, newItem } = Route.useSearch();
  const navigate = useNavigate();

  const [filters, setFilters] = useState<ItemFilters>({});
  const [sort, setSort] = useState<SortState>({ key: "name", dir: "asc" });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
  const [movementItemId, setMovementItemId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  // Auto-open create form when navigated with newItem param
  useEffect(() => {
    if (newItem) {
      setSheetOpen(true);
      navigate({ to: "/app/catalog", search: {}, replace: true });
    }
  }, [newItem, navigate]);

  const importFields = useMemo<ImportField[]>(() => [
    { key: "name", label: t("common.name"), required: true },
    { key: "sku", label: "SKU", required: true },
    { key: "description", label: t("common.description") },
    { key: "category", label: t("common.category") },
    { key: "supplier", label: t("catalog.table.supplier") },
    { key: "location", label: t("catalog.table.location") },
    { key: "quantity", label: t("catalog.csv.headers.quantity"), numeric: true },
    { key: "reorderPoint", label: t("catalog.form.reorderPoint"), numeric: true },
    { key: "unit", label: t("catalog.form.uomLabel") },
    { key: "costPrice", label: t("catalog.form.costPrice"), numeric: true },
    { key: "sellingPrice", label: t("catalog.form.sellingPrice"), numeric: true },
    { key: "barcode", label: "Barcode" },
  ], [t]);

  // Strip stock-level status before passing to store
  const storeFilters = useMemo(() => {
    const { status: _status, ...rest } = filters;
    return rest;
  }, [filters]);

  const { data: allItems } = useItems(storeFilters);
  const { data: categories } = useCategories();
  const { data: suppliers } = useSuppliers();
  const { data: locations } = useLocations();
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();
  const { can } = usePermissions();
  const { isAdmin } = useRole();

  // Derive detail item from URL search param
  const detailItem = useMemo(() => {
    if (!itemId) return null;
    return allItems.find((i) => i.id === itemId) ?? null;
  }, [itemId, allItems]);

  const openDetail = useCallback((item: Item) => {
    navigate({ to: "/app/catalog", search: { item: item.id } });
  }, [navigate]);

  const closeDetail = useCallback(() => {
    navigate({ to: "/app/catalog", search: {} });
  }, [navigate]);

  const items = useMemo(() => {
    let result = allItems.filter((i) => i.status !== ItemStatus.Archived);
    if (filters.status === "in-stock") result = result.filter((i) => i.currentStock > i.reorderPoint);
    else if (filters.status === "low-stock") result = result.filter((i) => i.currentStock > 0 && i.currentStock <= i.reorderPoint);
    else if (filters.status === "out-of-stock") result = result.filter((i) => i.currentStock === 0);
    return result;
  }, [allItems, filters.status]);

  const existingSkus = useMemo(() => allItems.map((i) => i.sku), [allItems]);

  const csvColumns = useMemo<CSVColumn<Item>[]>(() => [
    { header: t("catalog.csv.headers.name"), accessor: (i) => i.name },
    { header: t("catalog.csv.headers.sku"), accessor: (i) => i.sku },
    { header: t("catalog.csv.headers.category"), accessor: (i) => categories.find((c) => c.id === i.categoryId)?.name ?? "" },
    { header: t("catalog.csv.headers.supplier"), accessor: (i) => suppliers.find((s) => s.id === i.supplierId)?.name ?? "" },
    { header: t("catalog.csv.headers.location"), accessor: (i) => locations.find((l) => l.id === i.locationId)?.name ?? "" },
    { header: t("catalog.csv.headers.quantity"), accessor: (i) => i.currentStock },
    { header: t("catalog.csv.headers.reorderPoint"), accessor: (i) => i.reorderPoint },
    { header: t("catalog.csv.headers.unitCost"), accessor: (i) => i.costPrice },
    { header: t("catalog.csv.headers.price"), accessor: (i) => i.sellingPrice },
    { header: t("catalog.csv.headers.status"), accessor: (i) => i.status },
  ], [categories, suppliers, locations, t]);

  const handleSave = useCallback((data: Partial<Item>) => {
    if (editItem) {
      updateItem.mutate({ id: editItem.id, updates: data }, {
        onSuccess: () => { toast.success(t("catalog.form.updated")); setSheetOpen(false); setEditItem(null); },
        onError: (e) => toast.error(e.message || t("catalog.form.updateFailed")),
      });
    } else {
      const created: Item = {
        id: `item-${Date.now()}`,
        sku: data.sku ?? "",
        barcode: data.barcode ?? null,
        name: data.name ?? "",
        description: data.description ?? "",
        categoryId: data.categoryId ?? null,
        status: data.status ?? ItemStatus.Active,
        unit: data.unit ?? "each",
        currentStock: data.currentStock ?? 0,
        reorderPoint: data.reorderPoint ?? 0,
        reorderQuantity: data.reorderQuantity ?? 0,
        costPrice: data.costPrice ?? 0,
        sellingPrice: data.sellingPrice ?? 0,
        locationId: data.locationId ?? null,
        supplierId: data.supplierId ?? null,
        imageUrl: null,
        customFields: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      createItem.mutate(created, {
        onSuccess: () => {
          toast.success(t("catalog.form.created"), {
            action: { label: t("catalog.form.undo"), onClick: () => { deleteItem.mutate(created.id, { onSuccess: () => toast.success(t("catalog.form.undone")) }); } },
            duration: 5000,
          });
          setSheetOpen(false);
        },
        onError: (e) => toast.error(e.message || t("catalog.form.createFailed")),
      });
    }
  }, [editItem, createItem, updateItem, deleteItem, t]);

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    if (isAdmin) {
      deleteItem.mutate(deleteTarget.id, {
        onSuccess: () => { toast.success(t("catalog.delete.success", { name: deleteTarget.name, action: t("catalog.delete.deleted") })); setDeleteTarget(null); },
        onError: (e) => toast.error(e.message || t("catalog.delete.failedDelete")),
      });
    } else {
      updateItem.mutate({ id: deleteTarget.id, updates: { status: ItemStatus.Archived } }, {
        onSuccess: () => { toast.success(t("catalog.delete.success", { name: deleteTarget.name, action: t("catalog.delete.archived") })); setDeleteTarget(null); },
        onError: (e) => toast.error(e.message || t("catalog.delete.failedArchive")),
      });
    }
  }, [deleteTarget, isAdmin, deleteItem, updateItem, t]);

  const openEdit = (item: Item) => { setEditItem(item); setSheetOpen(true); };
  const openCreate = () => { setEditItem(null); setSheetOpen(true); };

  const handleBulkUpdate = useCallback((updates: Partial<Item>) => {
    const ids = Array.from(selected);
    const count = ids.length;
    ids.forEach((id) => {
      updateItem.mutate({ id, updates });
    });
    toast.success(t("catalog.bulk.updated", { count }));
    setSelected(new Set());
  }, [selected, updateItem, t]);

  const actionRenderer = (item: Item) => (
    <RowActionsMenu
      item={item}
      onViewDetails={(i) => openDetail(i)}
      onEdit={(i) => openEdit(i)}
      onLogMovement={(i) => setMovementItemId(i.id)}
      onDelete={(i) => setDeleteTarget(i)}
    />
  );

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{t("catalog.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("catalog.countLabel", { count: items.length })}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CSVExportButton data={items} columns={csvColumns} filename={t("catalog.csv.filename")} />
          <PermissionGate permission="create_item">
            <Button variant="outline" size="sm" className="hidden gap-1.5 sm:inline-flex" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4" />{t("catalog.importBtn")}
            </Button>
          </PermissionGate>
          <PermissionGate permission="create_item">
            <Button onClick={openCreate} className="hidden gap-1.5 sm:inline-flex">
              <Plus className="h-4 w-4" />{t("catalog.newItem")}
            </Button>
          </PermissionGate>
        </div>
      </div>

      <Card className="p-4">
        <CatalogFilters filters={filters} onChange={setFilters} categories={categories} suppliers={suppliers} locations={locations} />
      </Card>

      <ErrorBoundary>
      {allItems.length === 0 ? (
        <EmptyState
          icon={Package}
          title={t("catalog.empty.title")}
          description={t("catalog.empty.description")}
          actionLabel={can("create_item") ? t("catalog.empty.action") : undefined}
          onAction={can("create_item") ? openCreate : undefined}
        />
      ) : (
        <CatalogTable
          items={items}
          categories={categories}
          suppliers={suppliers}
          locations={locations}
          sort={sort}
          onSortChange={setSort}
          selected={selected}
          onSelectedChange={setSelected}
          onRowClick={(item) => openDetail(item)}
          actionRenderer={actionRenderer}
          showCheckboxes={can("edit_item")}
        />
      )}
      </ErrorBoundary>

      <ItemFormSheet
        open={sheetOpen}
        onOpenChange={(v) => { setSheetOpen(v); if (!v) setEditItem(null); }}
        item={editItem}
        categories={categories}
        suppliers={suppliers}
        locations={locations}
        existingSkus={existingSkus}
        onSave={handleSave}
        loading={createItem.isLoading || updateItem.isLoading}
      />

      <ItemDetailSheet
        open={!!detailItem}
        onOpenChange={(v) => { if (!v) closeDetail(); }}
        item={detailItem}
        categories={categories}
        suppliers={suppliers}
        locations={locations}
        onEdit={(item) => { closeDetail(); openEdit(item); }}
        onArchive={(item) => { closeDetail(); setDeleteTarget(item); }}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isAdmin
                ? t("catalog.delete.titleDelete", { name: deleteTarget?.name })
                : t("catalog.delete.titleArchive", { name: deleteTarget?.name })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isAdmin ? t("catalog.delete.descDelete") : t("catalog.delete.descArchive")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {isAdmin ? t("common.delete") : t("common.archive")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PermissionGate permission="create_item">
        <button
          type="button"
          onClick={openCreate}
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-amber-accent shadow-lg transition-transform hover:scale-105 sm:hidden"
          aria-label={t("catalog.newItem")}
        >
          <Plus className="h-6 w-6" />
        </button>
      </PermissionGate>

      <PermissionGate permission="edit_item">
        <BulkActionBar
          selectedCount={selected.size}
          categories={categories}
          suppliers={suppliers}
          locations={locations}
          onUpdateCategory={(id) => handleBulkUpdate({ categoryId: id })}
          onUpdateSupplier={(id) => handleBulkUpdate({ supplierId: id })}
          onUpdateLocation={(id) => handleBulkUpdate({ locationId: id })}
          onUpdateStatus={(s) => handleBulkUpdate({ status: s })}
          onDeselectAll={() => setSelected(new Set())}
          onPrintLabels={() => {
            const selectedItems = allItems.filter((i) => selected.has(i.id));
            const locMap = new Map(locations.map((l) => [l.id, l.name]));
            printBarcodeLabels(selectedItems, locMap);
          }}
        />
      </PermissionGate>

      <MovementFormSheet
        open={!!movementItemId}
        onOpenChange={(v) => { if (!v) setMovementItemId(null); }}
        items={allItems}
        locations={locations}
        preSelectedItemId={movementItemId}
      />

      <CSVImportSheet
        open={importOpen}
        onOpenChange={setImportOpen}
        fields={importFields}
        entityName="items"
        existingSkus={existingSkus}
        knownCategories={categories.map((c) => c.name)}
        knownSuppliers={suppliers.map((s) => s.name)}
        onImport={async (rows) => {
          let created = 0;
          let failed = 0;
          for (const row of rows) {
            try {
              const newItem: Item = {
                id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                sku: row.sku ?? "",
                barcode: row.barcode ?? null,
                name: row.name ?? "",
                description: row.description ?? "",
                categoryId: categories.find((c) => c.name.toLowerCase() === row.category?.toLowerCase())?.id ?? null,
                status: ItemStatus.Active,
                unit: row.unit || "each",
                currentStock: Number(row.quantity) || 0,
                reorderPoint: Number(row.reorderPoint) || 0,
                reorderQuantity: 0,
                costPrice: Number(row.costPrice) || 0,
                sellingPrice: Number(row.sellingPrice) || 0,
                locationId: locations.find((l) => l.name.toLowerCase() === row.location?.toLowerCase())?.id ?? null,
                supplierId: suppliers.find((s) => s.name.toLowerCase() === row.supplier?.toLowerCase())?.id ?? null,
                imageUrl: null,
                customFields: {},
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              createItem.mutate(newItem);
              created++;
            } catch {
              failed++;
            }
          }
          toast.success(`Imported ${created} items${failed > 0 ? `, ${failed} failed` : ""}`);
          return { created, failed };
        }}
      />
    </div>
  );
}
