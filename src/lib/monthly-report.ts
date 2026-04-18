// Aggregates last-30-days data for the monthly report exporters.
import { subDays, format } from "date-fns";
import type {
  Item,
  Category,
  Supplier,
  StockMovement,
  PurchaseOrder,
} from "@/types/inventory";
import { MovementType, OrderStatus } from "@/types/inventory";
import { forecastAllItems, type ItemForecast } from "@/lib/ml-forecast";

export type ReportSection =
  | "summary"
  | "movements"
  | "suppliers"
  | "forecast";

export const SECTION_LABELS: Record<ReportSection, string> = {
  summary: "Resumo executivo + KPIs",
  movements: "Top movimentações e itens críticos",
  suppliers: "Performance de fornecedores",
  forecast: "Previsões ML + recomendações",
};

export interface MonthlyReportInput {
  items: Item[];
  categories: Category[];
  suppliers: Supplier[];
  movements: StockMovement[];
  purchaseOrders: PurchaseOrder[];
  sections: ReportSection[];
  windowDays?: number;
}

export interface KPI { label: string; value: string }
export interface TableSection {
  title: string;
  headers: string[];
  rows: (string | number)[][];
}
export interface ChartData {
  title: string;
  type: "line" | "bar";
  labels: string[];
  series: { label: string; values: number[]; color: string }[];
}

export interface ReportData {
  generatedAt: Date;
  periodLabel: string;
  windowDays: number;
  kpis: KPI[];
  tables: TableSection[];
  charts: ChartData[];
}

export function buildMonthlyReport(input: MonthlyReportInput): ReportData {
  const windowDays = input.windowDays ?? 30;
  const now = new Date();
  const cutoff = subDays(now, windowDays);
  const recentMoves = input.movements.filter(
    (m) => new Date(m.createdAt) >= cutoff,
  );
  const itemMap = new Map(input.items.map((i) => [i.id, i]));
  const supplierMap = new Map(input.suppliers.map((s) => [s.id, s]));

  const kpis: KPI[] = [];
  const tables: TableSection[] = [];

  if (input.sections.includes("summary")) {
    const totalValue = input.items.reduce(
      (acc, i) => acc + i.currentStock * i.costPrice,
      0,
    );
    const lowStock = input.items.filter(
      (i) => i.currentStock > 0 && i.currentStock <= i.reorderPoint,
    ).length;
    const zeroStock = input.items.filter((i) => i.currentStock === 0).length;
    const openPOs = input.purchaseOrders.filter(
      (p) =>
        p.status === OrderStatus.Submitted || p.status === OrderStatus.Partial,
    ).length;
    const inbound = recentMoves
      .filter((m) => m.type === MovementType.Received)
      .reduce((a, m) => a + m.quantity, 0);
    const outbound = recentMoves
      .filter((m) => m.type === MovementType.Shipped)
      .reduce((a, m) => a + m.quantity, 0);

    kpis.push(
      { label: "Total de itens", value: input.items.length.toString() },
      { label: "Valor de estoque", value: formatMoney(totalValue) },
      { label: "Itens com estoque baixo", value: lowStock.toString() },
      { label: "Itens sem estoque", value: zeroStock.toString() },
      { label: "POs em aberto", value: openPOs.toString() },
      { label: "Entradas (30d)", value: inbound.toString() },
      { label: "Saídas (30d)", value: outbound.toString() },
    );
  }

  if (input.sections.includes("movements")) {
    const totalsByItem = new Map<string, { inn: number; out: number }>();
    for (const m of recentMoves) {
      const e = totalsByItem.get(m.itemId) ?? { inn: 0, out: 0 };
      if (m.type === MovementType.Received) e.inn += m.quantity;
      else if (m.type === MovementType.Shipped) e.out += m.quantity;
      totalsByItem.set(m.itemId, e);
    }
    const topOut = [...totalsByItem.entries()]
      .sort((a, b) => b[1].out - a[1].out)
      .slice(0, 10)
      .map(([id, v]) => {
        const it = itemMap.get(id);
        return [it?.name ?? id, it?.sku ?? "—", v.inn, v.out];
      });
    tables.push({
      title: "Top 10 itens por movimentação (30d)",
      headers: ["Item", "SKU", "Entradas", "Saídas"],
      rows: topOut,
    });

    const critical = input.items
      .filter((i) => i.currentStock <= i.reorderPoint)
      .sort((a, b) => a.currentStock - b.currentStock)
      .slice(0, 15)
      .map((i) => [i.name, i.sku, i.currentStock, i.reorderPoint, i.reorderQuantity]);
    tables.push({
      title: "Itens críticos / em risco de ruptura",
      headers: ["Item", "SKU", "Estoque", "Ponto de pedido", "Qtd. sugerida"],
      rows: critical,
    });
  }

  if (input.sections.includes("suppliers")) {
    const rows = input.suppliers
      .map((s) => {
        const sPOs = input.purchaseOrders.filter((p) => p.supplierId === s.id);
        if (sPOs.length === 0) return null;
        const received = sPOs.filter(
          (p) =>
            p.status === OrderStatus.Received || p.status === OrderStatus.Partial,
        );
        const leadTimes = received.map(
          (p) =>
            (new Date(p.updatedAt).getTime() - new Date(p.createdAt).getTime()) /
            86_400_000,
        );
        const avgLead = leadTimes.length
          ? leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length
          : 0;
        const onTime = received.filter((p) => {
          if (!p.expectedDelivery) return true;
          return new Date(p.updatedAt) <= new Date(p.expectedDelivery);
        }).length;
        const onTimeRate = received.length
          ? (onTime / received.length) * 100
          : 0;
        const totalSpend = sPOs.reduce((a, p) => a + p.totalCost, 0);
        return [
          s.name,
          sPOs.length,
          avgLead.toFixed(1),
          `${onTimeRate.toFixed(0)}%`,
          formatMoney(totalSpend),
        ];
      })
      .filter((r): r is (string | number)[] => r !== null)
      .sort((a, b) => Number(b[1]) - Number(a[1]));
    tables.push({
      title: "Performance de fornecedores",
      headers: ["Fornecedor", "POs", "Lead time (d)", "On-time", "Gasto total"],
      rows,
    });
  }

  if (input.sections.includes("forecast")) {
    const forecasts = forecastAllItems(input.items, input.movements);
    const top: ItemForecast[] = forecasts
      .filter((f) => f.observationsUsed >= 3)
      .slice(0, 20);
    tables.push({
      title: "Previsões ML — itens em maior risco",
      headers: [
        "Item",
        "SKU",
        "Estoque",
        "Demanda/dia",
        "Dias p/ ruptura",
        "Reposição sugerida",
        "MAPE",
        "Confiança",
      ],
      rows: top.map((f) => [
        f.itemName,
        f.sku,
        f.currentStock,
        f.avgDailyDemand.toFixed(2),
        f.daysUntilStockout ?? "—",
        f.recommendedReorderQuantity,
        `${(f.mape * 100).toFixed(0)}%`,
        f.confidence,
      ]),
    });
  }

  // silence unused warnings from helpers we may need later
  void supplierMap;

  return {
    generatedAt: now,
    periodLabel: `${format(cutoff, "dd/MM/yyyy")} – ${format(now, "dd/MM/yyyy")}`,
    windowDays,
    kpis,
    tables,
  };
}

export function formatMoney(n: number): string {
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

export function reportFilename(ext: string): string {
  return `relatorio-mensal-stackwise-${format(new Date(), "yyyy-MM-dd")}.${ext}`;
}
