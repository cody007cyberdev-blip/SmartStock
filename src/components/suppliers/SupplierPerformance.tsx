import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { BarChart3 } from "lucide-react";
import type { PurchaseOrder } from "@/types/inventory";
import { OrderStatus } from "@/types/inventory";

interface SupplierPerformanceProps {
  purchaseOrders: PurchaseOrder[];
  supplierId: string;
}

interface Metrics {
  avgLeadTime: number | null;
  fulfillmentAccuracy: number | null;
  totalOrders: number;
  onTimeRate: number | null;
}

const MIN_POS = 3;

function computeMetrics(pos: PurchaseOrder[]): Metrics {
  const total = pos.length;
  const received = pos.filter((po) => po.status === OrderStatus.Received);

  if (received.length < MIN_POS) {
    return { avgLeadTime: null, fulfillmentAccuracy: null, totalOrders: total, onTimeRate: null };
  }

  const leadTimes = received.map((po) => {
    const created = new Date(po.createdAt).getTime();
    const updated = new Date(po.updatedAt).getTime();
    return Math.max(1, Math.round((updated - created) / (1000 * 60 * 60 * 24)));
  });
  const avgLeadTime = leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length;

  let totalLines = 0;
  let fulfilledLines = 0;
  for (const po of received) {
    for (const line of po.items) {
      totalLines++;
      if (line.quantityReceived >= line.quantityOrdered) fulfilledLines++;
    }
  }
  const fulfillmentAccuracy = totalLines > 0 ? (fulfilledLines / totalLines) * 100 : 100;

  const withExpected = received.filter((po) => po.expectedDelivery);
  let onTime = 0;
  for (const po of withExpected) {
    const expected = new Date(po.expectedDelivery!).getTime();
    const actual = new Date(po.updatedAt).getTime();
    if (actual <= expected) onTime++;
  }
  const onTimeRate = withExpected.length > 0 ? (onTime / withExpected.length) * 100 : null;

  return { avgLeadTime, fulfillmentAccuracy, totalOrders: total, onTimeRate };
}

export function SupplierPerformance({ purchaseOrders, supplierId }: SupplierPerformanceProps) {
  const { t } = useTranslation();
  const supplierPOs = useMemo(
    () => purchaseOrders.filter((po) => po.supplierId === supplierId),
    [purchaseOrders, supplierId],
  );

  const metrics = useMemo(() => computeMetrics(supplierPOs), [supplierPOs]);

  return (
    <div className="mt-8" data-testid="supplier-performance">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">{t("suppliers.detail.performance")}</h3>
      </div>

      {metrics.avgLeadTime === null ? (
        <p className="text-sm text-muted-foreground py-4">
          {t("suppliers.detail.notEnoughData")}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label={t("suppliers.detail.avgLeadTime")} value={t("suppliers.detail.days", { count: Math.round(metrics.avgLeadTime) })} />
          <MetricCard
            label={t("suppliers.detail.fulfillmentAccuracy")}
            value={metrics.fulfillmentAccuracy !== null ? `${metrics.fulfillmentAccuracy.toFixed(1)}%` : "—"}
          />
          <MetricCard label={t("suppliers.detail.totalOrders")} value={String(metrics.totalOrders)} />
          <MetricCard
            label={t("suppliers.detail.onTimeDelivery")}
            value={metrics.onTimeRate !== null ? `${metrics.onTimeRate.toFixed(1)}%` : "—"}
          />
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold font-mono text-foreground">{value}</div>
    </div>
  );
}
