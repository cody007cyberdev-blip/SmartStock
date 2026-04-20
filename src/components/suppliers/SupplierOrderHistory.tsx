import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PurchaseOrder } from "@/types/inventory";

interface SupplierOrderHistoryProps {
  purchaseOrders: PurchaseOrder[];
  supplierId: string;
}

const MAX_ORDERS = 10;

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-blue-500/10 text-blue-600",
  partial: "bg-amber-500/10 text-amber-600",
  received: "bg-emerald-500/10 text-emerald-600",
  cancelled: "bg-destructive/10 text-destructive",
};

export function SupplierOrderHistory({ purchaseOrders, supplierId }: SupplierOrderHistoryProps) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.resolvedLanguage === "pt" ? ptBR : enUS;

  const filtered = useMemo(() => {
    return purchaseOrders
      .filter((po) => po.supplierId === supplierId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [purchaseOrders, supplierId]);

  const displayed = filtered.slice(0, MAX_ORDERS);

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">
          {t("suppliers.detail.orderHistory", { count: filtered.length })}
        </h3>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">
          {t("suppliers.detail.noOrders")}
        </p>
      ) : (
        <div className="space-y-2">
          <div className="overflow-x-auto rounded-md border border-border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">{t("suppliers.detail.poNumber")}</TableHead>
                  <TableHead className="text-xs">{t("common.status")}</TableHead>
                  <TableHead className="text-xs w-[60px]">{t("suppliers.table.items")}</TableHead>
                  <TableHead className="text-xs">{t("suppliers.detail.total")}</TableHead>
                  <TableHead className="text-xs">{t("suppliers.detail.expected")}</TableHead>
                  <TableHead className="text-xs">{t("suppliers.detail.created")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayed.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell className="font-mono text-xs">{po.orderNumber}</TableCell>
                    <TableCell>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[po.status] ?? "bg-muted text-muted-foreground"}`}>
                        {po.status}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{po.items.length}</TableCell>
                    <TableCell className="font-mono text-xs">
                      ${po.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {po.expectedDelivery ? format(new Date(po.expectedDelivery), "PP", { locale: dateLocale }) : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(po.createdAt), "PP", { locale: dateLocale })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filtered.length > MAX_ORDERS && (
            <p className="text-xs text-muted-foreground">
              {t("suppliers.detail.showingCount", { shown: MAX_ORDERS, total: filtered.length })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
