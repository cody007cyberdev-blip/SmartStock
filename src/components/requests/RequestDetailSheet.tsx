import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusStepper } from "@/components/requests/StatusStepper";
import { RequestStatus } from "@/types/inventory";
import type { InventoryRequest, Item } from "@/types/inventory";

const STATUS_KEY: Record<RequestStatus, "pending" | "approved" | "partial" | "fulfilled" | "declined" | "cancelled"> = {
  [RequestStatus.Pending]: "pending",
  [RequestStatus.Approved]: "approved",
  [RequestStatus.PartiallyFulfilled]: "partial",
  [RequestStatus.Fulfilled]: "fulfilled",
  [RequestStatus.Declined]: "declined",
  [RequestStatus.Cancelled]: "cancelled",
};

const STATUS_CLASS: Record<RequestStatus, string> = {
  [RequestStatus.Pending]: "bg-primary/15 text-primary border-primary/20",
  [RequestStatus.Approved]: "bg-stock-healthy/15 text-stock-healthy border-stock-healthy/20",
  [RequestStatus.PartiallyFulfilled]: "bg-amber-accent/15 text-amber-accent border-amber-accent/20",
  [RequestStatus.Fulfilled]: "bg-stock-healthy/15 text-stock-healthy border-stock-healthy/20",
  [RequestStatus.Declined]: "bg-destructive/15 text-destructive border-destructive/20",
  [RequestStatus.Cancelled]: "bg-muted text-muted-foreground",
};

interface RequestDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: InventoryRequest | null;
  items: Item[];
  canApprove: boolean;
  onApprove?: (req: InventoryRequest) => void;
  onDecline?: (req: InventoryRequest) => void;
  onPartial?: (req: InventoryRequest) => void;
  onCancel?: (req: InventoryRequest) => void;
}

export function RequestDetailSheet({
  open,
  onOpenChange,
  request,
  items,
  canApprove,
  onApprove,
  onDecline,
  onPartial,
  onCancel,
}: RequestDetailSheetProps) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language.startsWith("pt") ? ptBR : enUS;
  const itemMap = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  if (!request) return null;

  const isPending = request.status === RequestStatus.Pending;
  const statusLabel = t(`requests.status.${STATUS_KEY[request.status]}` as const);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-[560px]">
        <SheetHeader>
          <SheetTitle>{request.requestNumber}</SheetTitle>
          <SheetDescription>{t("requests.detail.title")}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          <StatusStepper status={request.status} />

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={STATUS_CLASS[request.status]}>
              {statusLabel}
            </Badge>
            {request.priority === "urgent" && (
              <Badge variant="outline" className="bg-amber-accent/15 text-amber-accent border-amber-accent/20">
                {t("requests.priority.urgent")}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">{t("requests.detail.submittedBy")}</p>
              <p className="text-sm text-foreground">{request.requestedBy}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">{t("requests.detail.date")}</p>
              <p className="text-sm text-foreground">
                {format(new Date(request.createdAt), "MMM d, yyyy", { locale: dateLocale })}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground">{t("requests.detail.titleLabel")}</p>
            <p className="text-sm font-medium text-foreground">{request.title}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">{t("requests.detail.reasonLabel")}</p>
            <p className="text-sm text-foreground">{request.reason}</p>
          </div>

          {request.declineReason && (
            <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3">
              <p className="text-xs font-medium text-destructive">{t("requests.detail.declineReason")}</p>
              <p className="text-sm text-foreground">{request.declineReason}</p>
            </div>
          )}

          <Separator />

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">
              {t("requests.detail.lineItems", { count: request.items.length })}
            </p>
            <div className="overflow-x-auto rounded-md border border-border bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common.item")}</TableHead>
                    <TableHead className="w-[60px] text-right">{t("requests.detail.requested")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {request.items.map((li) => {
                    const item = itemMap.get(li.itemId);
                    return (
                      <TableRow key={li.id}>
                        <TableCell>
                          <p className="text-sm font-medium">{item?.name ?? li.itemId}</p>
                          <p className="font-mono text-xs text-muted-foreground">{item?.sku ?? "—"}</p>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {li.quantity}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          <Separator />

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">{t("requests.detail.timeline")}</p>
            <div className="space-y-2">
              <TimelineEntry label={t("requests.detail.submitted")} date={request.createdAt} by={request.requestedBy} byLabel={t("requests.detail.by")} dateLocale={dateLocale} />
              {request.status !== RequestStatus.Pending &&
                request.status !== RequestStatus.Cancelled && (
                  <TimelineEntry
                    label={statusLabel}
                    date={request.updatedAt}
                    by={request.approvedBy ?? undefined}
                    byLabel={t("requests.detail.by")}
                    dateLocale={dateLocale}
                  />
                )}
              {request.status === RequestStatus.Cancelled && (
                <TimelineEntry label={t("requests.detail.cancelled")} date={request.updatedAt} by={request.requestedBy} byLabel={t("requests.detail.by")} dateLocale={dateLocale} />
              )}
            </div>
          </div>

          {isPending && canApprove && (
            <>
              <Separator />
              <div className="flex flex-wrap gap-2">
                {onApprove && (
                  <Button size="sm" onClick={() => onApprove(request)}>{t("requests.detail.approve")}</Button>
                )}
                {onPartial && (
                  <Button size="sm" variant="outline" onClick={() => onPartial(request)}>{t("requests.detail.partialFulfill")}</Button>
                )}
                {onDecline && (
                  <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => onDecline(request)}>{t("requests.detail.decline")}</Button>
                )}
              </div>
            </>
          )}

          {isPending && !canApprove && onCancel && (
            <>
              <Separator />
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => onCancel(request)}
              >
                {t("requests.detail.cancelRequest")}
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function TimelineEntry({ label, date, by, byLabel, dateLocale }: { label: string; date: string; by?: string; byLabel: string; dateLocale: Locale }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="h-2 w-2 shrink-0 rounded-full bg-primary" />
      <span className="font-medium text-foreground">{label}</span>
      <span className="text-muted-foreground">{format(new Date(date), "MMM d, yyyy", { locale: dateLocale })}</span>
      {by && <span className="text-muted-foreground">{byLabel} {by}</span>}
    </div>
  );
}

type Locale = typeof ptBR;
