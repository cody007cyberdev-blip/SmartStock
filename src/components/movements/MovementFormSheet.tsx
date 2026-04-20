import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { MovementType } from "@/types/inventory";
import type { Item, Location, StockMovement } from "@/types/inventory";
import { useCreateMovement } from "@/hooks/useInventoryMutations";
import { BarcodeScannerButton } from "@/components/shared/BarcodeScannerButton";

interface MovementFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: Item[];
  locations: Location[];
  preSelectedItemId?: string | null;
}

function directionForType(type: MovementType): "in" | "out" | "configurable" {
  if (type === MovementType.Received) return "in";
  if (type === MovementType.Shipped) return "out";
  if (type === MovementType.Transferred) return "out";
  return "configurable";
}

export function MovementFormSheet({
  open,
  onOpenChange,
  items,
  locations,
  preSelectedItemId,
}: MovementFormSheetProps) {
  const { t } = useTranslation();
  const { mutate, isLoading } = useCreateMovement();

  const [itemId, setItemId] = useState("");
  const [type, setType] = useState<MovementType>(MovementType.Received);
  const [quantity, setQuantity] = useState("");
  const [direction, setDirection] = useState<"in" | "out">("in");
  const [reference, setReference] = useState("");
  const [fromLocationId, setFromLocationId] = useState("");
  const [toLocationId, setToLocationId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const TYPE_OPTIONS = [
    { value: MovementType.Received, label: t("movements.types.received") },
    { value: MovementType.Shipped, label: t("movements.types.shipped") },
    { value: MovementType.Adjusted, label: t("movements.types.adjusted") },
    { value: MovementType.Transferred, label: t("movements.types.transferred") },
  ];

  const typeLabel = (mt: MovementType): string => {
    return TYPE_OPTIONS.find((o) => o.value === mt)?.label ?? mt;
  };

  useEffect(() => {
    if (open) {
      setItemId(preSelectedItemId ?? "");
      setType(MovementType.Received);
      setQuantity("");
      setDirection("in");
      setReference("");
      setFromLocationId("");
      setToLocationId("");
      setErrors({});
    }
  }, [open, preSelectedItemId]);

  useEffect(() => {
    const dir = directionForType(type);
    if (dir !== "configurable") setDirection(dir);
  }, [type]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!itemId) errs.itemId = t("movements.form.itemRequired");

    const num = Number(quantity);
    const qty = parseInt(quantity, 10);
    if (!quantity || isNaN(qty) || qty <= 0 || !Number.isInteger(num)) {
      errs.quantity = t("movements.form.qtyInvalid");
    }

    const selectedItem = items.find((i) => i.id === itemId);

    if (!errs.quantity && selectedItem && (type === MovementType.Shipped || type === MovementType.Transferred)) {
      if (qty > selectedItem.currentStock) {
        errs.quantity = t("movements.form.insufficientStock", { qty: selectedItem.currentStock });
      }
    }

    if (!errs.quantity && selectedItem && type === MovementType.Adjusted && direction === "out") {
      if (qty > selectedItem.currentStock) {
        errs.quantity = t("movements.form.insufficientStock", { qty: selectedItem.currentStock });
      }
    }

    if (type === MovementType.Adjusted && !reference.trim()) {
      errs.reference = t("movements.form.reasonRequired");
    }

    if (type === MovementType.Transferred) {
      if (!fromLocationId) errs.fromLocationId = t("movements.form.fromRequired");
      if (!toLocationId) errs.toLocationId = t("movements.form.toRequired");
      if (fromLocationId && toLocationId && fromLocationId === toLocationId) {
        errs.toLocationId = t("movements.form.sameLocation");
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const qty = parseInt(quantity, 10);
    const selectedItem = items.find((i) => i.id === itemId);
    const signedQty = direction === "in" ? qty : -qty;

    const movement: StockMovement = {
      id: crypto.randomUUID(),
      itemId,
      type,
      quantity: signedQty,
      fromLocationId: type === MovementType.Transferred ? fromLocationId || null : null,
      toLocationId: type === MovementType.Transferred ? toLocationId || null : null,
      reference,
      notes: reference,
      performedBy: "Demo User",
      createdAt: new Date().toISOString(),
    };

    mutate(movement, {
      onSuccess: () => {
        const label = selectedItem?.name ?? itemId;
        const sign = direction === "in" ? "+" : "−";
        toast.success(t("movements.form.success", { sign, qty, name: label, type: typeLabel(type) }), {
          duration: 5000,
        });
        onOpenChange(false);
      },
      onError: (e) => toast.error(e.message || t("movements.form.failed")),
    });
  };

  const handleScan = (code: string) => {
    const trimmed = code.trim().toLowerCase();
    const found = items.find(
      (i) => i.sku.toLowerCase() === trimmed || (i.barcode ?? "").toLowerCase() === trimmed,
    );
    if (found) {
      setItemId(found.id);
      toast.success(found.name);
    } else {
      toast.error(t("common.noResults"));
    }
  };

  const isTransfer = type === MovementType.Transferred;
  const isAdjusted = type === MovementType.Adjusted;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:max-w-[440px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("movements.form.title")}</SheetTitle>
          <SheetDescription>{t("movements.form.description")}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div>
            <Label className="mb-1.5 block text-sm">{t("movements.form.itemLabel")}</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Select
                  value={itemId || "__none__"}
                  onValueChange={(v) => setItemId(v === "__none__" ? "" : v)}
                  disabled={!!preSelectedItemId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("movements.form.itemPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__" disabled>{t("movements.form.itemPlaceholder")}</SelectItem>
                    {items.map((i) => (
                      <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!preSelectedItemId && <BarcodeScannerButton onDetected={handleScan} />}
            </div>
            {errors.itemId && <p className="mt-1 text-xs text-destructive">{errors.itemId}</p>}
          </div>

          <div>
            <Label className="mb-1.5 block text-sm">{t("movements.form.typeLabel")}</Label>
            <Select value={type} onValueChange={(v) => setType(v as MovementType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-1.5 block text-sm">{t("movements.form.quantityLabel")}</Label>
            <Input
              type="number"
              min={1}
              step={1}
              placeholder={t("movements.form.quantityPlaceholder")}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            {errors.quantity && <p className="mt-1 text-xs text-destructive">{errors.quantity}</p>}
          </div>

          {isAdjusted && (
            <div>
              <Label className="mb-1.5 block text-sm">{t("movements.form.directionLabel")}</Label>
              <Select value={direction} onValueChange={(v) => setDirection(v as "in" | "out")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">{t("movements.form.directionIn")}</SelectItem>
                  <SelectItem value="out">{t("movements.form.directionOut")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {isTransfer && (
            <>
              <div>
                <Label className="mb-1.5 block text-sm">{t("movements.form.fromLocation")}</Label>
                <Select value={fromLocationId || "__none__"} onValueChange={(v) => setFromLocationId(v === "__none__" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("movements.form.locationPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__" disabled>{t("movements.form.locationPlaceholder")}</SelectItem>
                    {locations.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.fromLocationId && <p className="mt-1 text-xs text-destructive">{errors.fromLocationId}</p>}
              </div>
              <div>
                <Label className="mb-1.5 block text-sm">{t("movements.form.toLocation")}</Label>
                <Select value={toLocationId || "__none__"} onValueChange={(v) => setToLocationId(v === "__none__" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("movements.form.locationPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__" disabled>{t("movements.form.locationPlaceholder")}</SelectItem>
                    {locations.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.toLocationId && <p className="mt-1 text-xs text-destructive">{errors.toLocationId}</p>}
              </div>
            </>
          )}

          <div>
            <Label className="mb-1.5 block text-sm">
              {isAdjusted ? t("movements.form.referenceLabelRequired") : t("movements.form.referenceLabel")}
            </Label>
            <Textarea
              placeholder={isAdjusted ? t("movements.form.referencePlaceholderRequired") : t("movements.form.referencePlaceholderOptional")}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              rows={3}
            />
            {errors.reference && <p className="mt-1 text-xs text-destructive">{errors.reference}</p>}
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={isLoading} className="flex-1">
              {isLoading ? t("common.saving") : t("movements.form.save")}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
