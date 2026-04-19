import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { HelpTooltip } from "@/components/shared/HelpTooltip";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarcodeScannerButton } from "@/components/shared/BarcodeScannerButton";
import type { Item, Category, Supplier, Location } from "@/types/inventory";
import { ItemStatus } from "@/types/inventory";

const buildSchema = (t: (k: string) => string) =>
  z.object({
    name: z.string().min(1, t("catalog.form.nameRequired")),
    sku: z.string().min(1, t("catalog.form.skuRequired")),
    barcode: z.string(),
    description: z.string(),
    categoryId: z.string(),
    supplierId: z.string(),
    locationId: z.string(),
    unit: z.string(),
    currentStock: z.coerce.number().min(0, t("catalog.form.mustBeNonNeg")),
    reorderPoint: z.coerce.number().min(0, t("catalog.form.mustBeNonNeg")),
    reorderQuantity: z.coerce.number().min(0, t("catalog.form.mustBeNonNeg")),
    costPrice: z.coerce.number().min(0, t("catalog.form.mustBeNonNeg")),
    sellingPrice: z.coerce.number().min(0, t("catalog.form.mustBeNonNeg")),
    status: z.nativeEnum(ItemStatus),
  });

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

interface ItemFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: Item | null;
  categories: Category[];
  suppliers: Supplier[];
  locations: Location[];
  existingSkus: string[];
  onSave: (data: Partial<Item>) => void;
  loading?: boolean;
}

export function ItemFormSheet({
  open,
  onOpenChange,
  item,
  categories,
  suppliers,
  locations,
  existingSkus,
  onSave,
  loading,
}: ItemFormSheetProps) {
  const { t } = useTranslation();
  const isEdit = !!item;

  const { register, handleSubmit, reset, setValue, watch, formState: { errors }, setError } = useForm<FormValues>({
    resolver: zodResolver(buildSchema(t)),
    defaultValues: {
      name: "",
      sku: "",
      barcode: "",
      description: "",
      categoryId: "",
      supplierId: "",
      locationId: "",
      unit: "each",
      currentStock: 0,
      reorderPoint: 0,
      reorderQuantity: 0,
      costPrice: 0,
      sellingPrice: 0,
      status: ItemStatus.Active,
    },
  });

  useEffect(() => {
    if (open && item) {
      reset({
        name: item.name,
        sku: item.sku,
        barcode: item.barcode ?? "",
        description: item.description,
        categoryId: item.categoryId ?? "",
        supplierId: item.supplierId ?? "",
        locationId: item.locationId ?? "",
        unit: item.unit,
        currentStock: item.currentStock,
        reorderPoint: item.reorderPoint,
        reorderQuantity: item.reorderQuantity,
        costPrice: item.costPrice,
        sellingPrice: item.sellingPrice,
        status: item.status,
      });
    } else if (open) {
      reset();
    }
  }, [open, item, reset]);

  const onSubmit = (data: FormValues) => {
    const skuConflict = existingSkus.filter((s) => s === data.sku);
    const allowed = isEdit && item?.sku === data.sku ? 1 : 0;
    if (skuConflict.length > allowed) {
      setError("sku", { message: t("catalog.form.skuExists") });
      return;
    }
    onSave({
      ...data,
      barcode: data.barcode || null,
      categoryId: data.categoryId || null,
      supplierId: data.supplierId || null,
      locationId: data.locationId || null,
    });
  };

  const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary";
  const labelCls = "text-sm font-medium";
  const errCls = "text-xs text-destructive";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[480px] overflow-y-auto">
        <SheetTitle>{isEdit ? t("catalog.form.titleEdit") : t("catalog.form.titleNew")}</SheetTitle>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
          <fieldset className="space-y-3">
            <legend className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("catalog.form.sectionBasic")}</legend>
            <div>
              <label className={labelCls}>{t("catalog.form.nameLabel")}</label>
              <input {...register("name")} className={inputCls} />
              {errors.name && <p className={errCls}>{errors.name.message}</p>}
            </div>
            <div>
              <label className={`${labelCls} flex items-center gap-1`}>
                {t("catalog.form.skuLabel")} <HelpTooltip text={t("catalog.form.skuHelp")} />
              </label>
              <div className="flex gap-2">
                <input {...register("sku")} className={inputCls} placeholder="STK-XXXX" />
                <BarcodeScannerButton
                  onDetected={(code) => setValue("sku", code, { shouldValidate: true })}
                  size="icon"
                  className="h-9 w-9 shrink-0"
                />
              </div>
              {errors.sku && <p className={errCls}>{errors.sku.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Barcode</label>
              <div className="flex gap-2">
                <input {...register("barcode")} className={inputCls} placeholder="EAN, Code128, QR…" />
                <BarcodeScannerButton
                  onDetected={(code) => setValue("barcode", code)}
                  size="icon"
                  className="h-9 w-9 shrink-0"
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>{t("catalog.form.descriptionLabel")}</label>
              <textarea {...register("description")} rows={2} className={`${inputCls} h-auto py-2`} />
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("catalog.form.sectionClassification")}</legend>
            <div>
              <label className={labelCls}>{t("catalog.form.categoryLabel")}</label>
              <Select value={watch("categoryId") ?? ""} onValueChange={(v) => setValue("categoryId", v || "")}>
                <SelectTrigger className="h-9"><SelectValue placeholder={t("catalog.form.categoryPlaceholder")} /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className={labelCls}>{t("catalog.form.uomLabel")}</label>
              <input {...register("unit")} className={inputCls} placeholder="each, kg, box…" />
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("catalog.form.sectionStock")}</legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>{t("catalog.form.currentStock")}</label>
                <input type="number" {...register("currentStock")} className={inputCls} />
              </div>
              <div>
                <label className={`${labelCls} flex items-center gap-1`}>
                  {t("catalog.form.reorderPoint")} <HelpTooltip text={t("catalog.form.reorderHelp")} />
                </label>
                <input type="number" {...register("reorderPoint")} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>{t("catalog.form.reorderQty")}</label>
              <input type="number" {...register("reorderQuantity")} className={inputCls} />
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("catalog.form.sectionPricing")}</legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>{t("catalog.form.costPrice")}</label>
                <input type="number" step="0.01" {...register("costPrice")} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{t("catalog.form.sellingPrice")}</label>
                <input type="number" step="0.01" {...register("sellingPrice")} className={inputCls} />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("catalog.form.sectionAssignment")}</legend>
            <div>
              <label className={labelCls}>{t("catalog.form.supplierLabel")}</label>
              <Select value={watch("supplierId") ?? ""} onValueChange={(v) => setValue("supplierId", v || "")}>
                <SelectTrigger className="h-9"><SelectValue placeholder={t("catalog.form.supplierPlaceholder")} /></SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className={labelCls}>{t("catalog.form.locationLabel")}</label>
              <Select value={watch("locationId") ?? ""} onValueChange={(v) => setValue("locationId", v || "")}>
                <SelectTrigger className="h-9"><SelectValue placeholder={t("catalog.form.locationPlaceholder")} /></SelectTrigger>
                <SelectContent>
                  {locations.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("catalog.form.sectionStatus")}</legend>
            <Select value={watch("status")} onValueChange={(v) => setValue("status", v as ItemStatus)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ItemStatus.Active}>{t("catalog.form.statusActive")}</SelectItem>
                <SelectItem value={ItemStatus.Discontinued}>{t("catalog.form.statusDiscontinued")}</SelectItem>
                <SelectItem value={ItemStatus.Archived}>{t("catalog.form.statusArchived")}</SelectItem>
              </SelectContent>
            </Select>
          </fieldset>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? t("common.saving") : t("common.save")}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              {t("common.cancel")}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
