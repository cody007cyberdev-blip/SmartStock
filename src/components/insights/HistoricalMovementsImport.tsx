import { useCallback, useMemo } from "react";
import { CSVImportSheet, type ImportField } from "@/components/data/CSVImportSheet";
import { MovementType, type StockMovement } from "@/types/inventory";
import { useDemo } from "@/hooks/useDemo";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FIELDS: ImportField[] = [
  { key: "sku", label: "SKU", required: true },
  { key: "date", label: "Date", required: true },
  { key: "quantity", label: "Quantity", required: true, numeric: true },
  { key: "type", label: "Type" },
  { key: "reference", label: "Reference" },
  { key: "notes", label: "Notes" },
];

const VALID_TYPES = new Set(["received", "shipped", "adjusted", "transferred"]);

function parseDate(input: string): Date | null {
  const s = input.trim();
  if (!s) return null;
  // Accept ISO (YYYY-MM-DD), US (MM/DD/YYYY), and EU (DD/MM/YYYY) when unambiguous.
  // ISO first
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  if (iso) {
    const d = new Date(`${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}T12:00:00Z`);
    return isNaN(d.getTime()) ? null : d;
  }
  // Slash format
  const slash = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(s);
  if (slash) {
    let [_, a, b, y] = slash;
    if (y.length === 2) y = (Number(y) > 50 ? "19" : "20") + y;
    // Heuristic: if first part > 12, assume DD/MM. Otherwise MM/DD.
    const aNum = Number(a);
    const bNum = Number(b);
    const month = aNum > 12 ? bNum : aNum;
    const day = aNum > 12 ? aNum : bNum;
    const d = new Date(`${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T12:00:00Z`);
    return isNaN(d.getTime()) ? null : d;
  }
  // Fallback to Date.parse
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export function HistoricalMovementsImport({ open, onOpenChange }: Props) {
  const { demoStore, bumpVersion } = useDemo();

  const skuMap = useMemo(() => {
    const m = new Map<string, string>(); // sku lowercase → itemId
    demoStore?.getItems().forEach((i) => m.set(i.sku.toLowerCase(), i.id));
    return m;
  }, [demoStore]);

  const existingSkus = useMemo(() => Array.from(skuMap.keys()), [skuMap]);

  const handleImport = useCallback(
    async (rows: Record<string, string>[]): Promise<{ created: number; failed: number }> => {
      if (!demoStore) return { created: 0, failed: rows.length };

      const movements: StockMovement[] = [];
      let failed = 0;

      for (const row of rows) {
        const sku = (row.sku ?? "").trim().toLowerCase();
        const itemId = skuMap.get(sku);
        const date = parseDate(row.date ?? "");
        const quantityRaw = Number(row.quantity);

        if (!itemId || !date || !Number.isFinite(quantityRaw)) {
          failed++;
          continue;
        }

        const typeStr = (row.type ?? "shipped").trim().toLowerCase();
        const type = (VALID_TYPES.has(typeStr) ? typeStr : "shipped") as MovementType;

        movements.push({
          id: `hist-${date.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
          itemId,
          type,
          quantity: Math.abs(quantityRaw),
          fromLocationId: null,
          toLocationId: null,
          reference: (row.reference ?? "").slice(0, 100) || "Historical import",
          notes: (row.notes ?? "").slice(0, 500),
          performedBy: "Historical Import",
          createdAt: date.toISOString(),
        });
      }

      const result = demoStore.importHistoricalMovements(movements);
      bumpVersion();

      if (result.inserted > 0) {
        toast.success(`Imported ${result.inserted} historical movement(s)`, {
          description: "Forecasts will refresh with the new training data.",
        });
      }
      if (failed > 0) {
        toast.warning(`${failed} row(s) skipped — unknown SKU or invalid date`);
      }

      return { created: result.inserted, failed };
    },
    [demoStore, skuMap, bumpVersion],
  );

  return (
    <CSVImportSheet
      open={open}
      onOpenChange={onOpenChange}
      fields={FIELDS}
      onImport={handleImport}
      entityName="historical movements"
      existingSkus={existingSkus}
    />
  );
}

/**
 * Build a sample CSV template for historical movements.
 * Uses real SKUs from the demo when available so users can immediately test.
 */
export function buildHistoricalTemplateCSV(sampleSkus: string[]): string {
  const skus = sampleSkus.length > 0 ? sampleSkus.slice(0, 3) : ["SKU-001", "SKU-002"];
  const today = new Date();
  const headers = ["sku", "date", "quantity", "type", "reference", "notes"];
  const rows: string[][] = [];
  for (let i = 0; i < skus.length; i++) {
    const d = new Date(today);
    d.setMonth(d.getMonth() - (i + 1) * 6);
    rows.push([
      skus[i],
      d.toISOString().slice(0, 10),
      String(10 + i * 5),
      "shipped",
      "SO-EXAMPLE",
      "Sample historical sale",
    ]);
  }
  return [headers, ...rows].map((r) => r.join(",")).join("\n");
}
