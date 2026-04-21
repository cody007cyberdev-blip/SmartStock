import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDemo } from "@/hooks/useDemo";
import { RequestStatus, MovementType } from "@/types/inventory";
import type { InventoryRequest, Item, StockMovement } from "@/types/inventory";

type DialogType = "approve" | "partial" | "decline" | null;

function buildMovements(
  request: InventoryRequest,
  qtys?: Record<string, number>,
): StockMovement[] {
  const now = new Date().toISOString();
  return request.items
    .filter((li) => {
      const q = qtys ? (qtys[li.id] ?? 0) : li.quantity;
      return q > 0;
    })
    .map((li) => ({
      id: crypto.randomUUID(),
      itemId: li.itemId,
      type: MovementType.Shipped,
      quantity: qtys ? (qtys[li.id] ?? li.quantity) : li.quantity,
      fromLocationId: null,
      toLocationId: null,
      reference: request.requestNumber,
      notes: `Auto-generated from request ${request.requestNumber}`,
      performedBy: "demo-admin",
      createdAt: now,
    }));
}

export function useApprovalActions({ items }: { items: Item[] }) {
  const { t } = useTranslation();
  const { isDemo, demoStore, bumpVersion } = useDemo();
  const [dialog, setDialog] = useState<DialogType>(null);
  const [activeRequest, setActiveRequest] = useState<InventoryRequest | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [partialQtys, setPartialQtys] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);

  const itemMap = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const checkStock = (
    reqItems: InventoryRequest["items"],
    qtys?: Record<string, number>,
  ): string | null => {
    for (const li of reqItems) {
      const qty = qtys ? (qtys[li.id] ?? 0) : li.quantity;
      if (qty === 0) continue;
      const item = itemMap.get(li.itemId);
      if (!item) continue;
      if (qty > item.currentStock) {
        return t("requests.approval.insufficientStock", { name: item.name, available: item.currentStock, requested: qty });
      }
    }
    return null;
  };

  function openApprove(req: InventoryRequest) {
    setActiveRequest(req);
    setDialog("approve");
  }

  function openDecline(req: InventoryRequest) {
    setActiveRequest(req);
    setDeclineReason("");
    setDialog("decline");
  }

  function openPartial(req: InventoryRequest) {
    setActiveRequest(req);
    const initial: Record<string, number> = {};
    for (const li of req.items) {
      initial[li.id] = li.quantity;
    }
    setPartialQtys(initial);
    setDialog("partial");
  }

  function confirmApprove() {
    if (!activeRequest || !isDemo || !demoStore) return;
    const err = checkStock(activeRequest.items);
    if (err) { toast.error(err); return; }

    const now = new Date().toISOString();
    const movements = buildMovements(activeRequest);
    setIsLoading(true);
    try {
      for (const m of movements) demoStore.createMovement(m);
      demoStore.updateRequest(activeRequest.id, {
        status: RequestStatus.Approved,
        approvedBy: "demo-admin",
        updatedAt: now,
      });
      bumpVersion();
      toast.success(t("requests.approval.approved", { number: activeRequest.requestNumber }));
      setDialog(null);
      setActiveRequest(null);
    } finally {
      setIsLoading(false);
    }
  }

  function confirmDecline() {
    if (!activeRequest || !declineReason.trim() || !isDemo || !demoStore) return;
    const now = new Date().toISOString();
    setIsLoading(true);
    try {
      demoStore.updateRequest(activeRequest.id, {
        status: RequestStatus.Declined,
        approvedBy: "demo-admin",
        declineReason: declineReason.trim(),
        updatedAt: now,
      });
      bumpVersion();
      toast.success(t("requests.approval.declined", { number: activeRequest.requestNumber }));
      setDialog(null);
      setActiveRequest(null);
    } finally {
      setIsLoading(false);
    }
  }

  function confirmPartial() {
    if (!activeRequest || !isDemo || !demoStore) return;
    const allZero = activeRequest.items.every((li) => (partialQtys[li.id] ?? 0) === 0);
    if (allZero) { toast.error(t("requests.approval.approveAtLeastOne")); return; }

    const err = checkStock(activeRequest.items, partialQtys);
    if (err) { toast.error(err); return; }

    const allFull = activeRequest.items.every((li) => (partialQtys[li.id] ?? 0) >= li.quantity);
    const newStatus = allFull ? RequestStatus.Approved : RequestStatus.PartiallyFulfilled;
    const now = new Date().toISOString();
    const movements = buildMovements(activeRequest, partialQtys);

    setIsLoading(true);
    try {
      for (const m of movements) demoStore.createMovement(m);
      demoStore.updateRequest(activeRequest.id, {
        status: newStatus,
        approvedBy: "demo-admin",
        updatedAt: now,
      });
      bumpVersion();
      toast.success(
        allFull
          ? t("requests.approval.approved", { number: activeRequest.requestNumber })
          : t("requests.approval.partiallyFulfilled", { number: activeRequest.requestNumber }),
      );
      setDialog(null);
      setActiveRequest(null);
    } finally {
      setIsLoading(false);
    }
  }

  function renderDialogs() {
    return (
      <>
        <AlertDialog open={dialog === "approve"} onOpenChange={(o) => !o && setDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("requests.approval.approveTitle", { number: activeRequest?.requestNumber ?? "" })}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("requests.approval.approveDesc")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmApprove}>
                {t("requests.approval.confirmApprove")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={dialog === "decline"} onOpenChange={(o) => !o && setDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("requests.approval.declineTitle", { number: activeRequest?.requestNumber ?? "" })}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("requests.approval.declineDesc")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-2">
              <Label htmlFor="decline-reason">{t("requests.approval.reasonLabel")}</Label>
              <Textarea
                id="decline-reason"
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder={t("requests.approval.reasonPlaceholder")}
                rows={3}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={confirmDecline}
                disabled={!declineReason.trim()}
              >
                {t("requests.approval.confirmDecline")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={dialog === "partial"} onOpenChange={(o) => !o && setDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("requests.approval.partialTitle", { number: activeRequest?.requestNumber ?? "" })}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("requests.approval.partialDesc")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-3 py-2">
              {activeRequest?.items.map((li) => {
                const item = itemMap.get(li.itemId);
                return (
                  <div key={li.id} className="flex items-center gap-3">
                    <span className="flex-1 text-sm font-medium">
                      {item?.name ?? li.itemId}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t("requests.approval.partialOf", { qty: li.quantity, available: item?.currentStock ?? 0 })}
                    </span>
                    <Input
                      type="number"
                      min={0}
                      max={li.quantity}
                      value={partialQtys[li.id] ?? 0}
                      onChange={(e) =>
                        setPartialQtys((prev) => ({
                          ...prev,
                          [li.id]: Math.max(0, Math.min(li.quantity, Number(e.target.value))),
                        }))
                      }
                      className="w-20 font-mono"
                    />
                  </div>
                );
              })}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmPartial}>
                {t("common.confirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return { openApprove, openDecline, openPartial, renderDialogs, isLoading };
}
