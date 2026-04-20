import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCreateSupplier, useUpdateSupplier } from "@/hooks/useInventoryMutations";
import type { Supplier } from "@/types/inventory";

interface SupplierFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier | null;
}

export function SupplierFormSheet({ open, onOpenChange, supplier }: SupplierFormSheetProps) {
  const { t } = useTranslation();
  const isEdit = !!supplier;
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();

  const schema = z.object({
    name: z.string().min(1, t("suppliers.form.nameRequired")),
    contactName: z.string(),
    email: z.string().email(t("suppliers.form.invalidEmail")).or(z.literal("")),
    phone: z.string(),
    address: z.string(),
    notes: z.string(),
    paymentTerms: z.string(),
    leadTimeDays: z.coerce.number().int().min(0, t("suppliers.form.mustBeNonNeg")),
    minOrderQuantity: z.coerce.number().int().min(0, t("suppliers.form.mustBeNonNeg")),
  });

  type FormValues = z.infer<typeof schema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      contactName: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
      paymentTerms: "",
      leadTimeDays: 0,
      minOrderQuantity: 0,
    },
  });

  useEffect(() => {
    if (open) {
      if (supplier) {
        form.reset({
          name: supplier.name,
          contactName: supplier.contactName ?? "",
          email: supplier.email ?? "",
          phone: supplier.phone ?? "",
          address: supplier.address ?? "",
          notes: supplier.notes ?? "",
          paymentTerms: "",
          leadTimeDays: supplier.leadTimeDays ?? 0,
          minOrderQuantity: 0,
        });
      } else {
        form.reset();
      }
    }
  }, [open, supplier, form]);

  function onSubmit(values: FormValues) {
    const now = new Date().toISOString();

    if (isEdit && supplier) {
      updateSupplier.mutate(
        {
          id: supplier.id,
          updates: {
            name: values.name,
            contactName: values.contactName ?? "",
            email: values.email ?? "",
            phone: values.phone ?? "",
            address: values.address ?? "",
            notes: values.notes ?? "",
            leadTimeDays: values.leadTimeDays ?? 0,
            updatedAt: now,
          },
        },
        {
          onSuccess: () => {
            toast.success(t("suppliers.form.updated"));
            onOpenChange(false);
          },
          onError: (e) => toast.error(e.message || t("suppliers.form.updateFailed")),
        },
      );
    } else {
      const newSupplier: Supplier = {
        id: crypto.randomUUID(),
        name: values.name,
        contactName: values.contactName ?? "",
        email: values.email ?? "",
        phone: values.phone ?? "",
        address: values.address ?? "",
        notes: values.notes ?? "",
        leadTimeDays: values.leadTimeDays ?? 0,
        rating: 0,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      createSupplier.mutate(newSupplier, {
        onSuccess: () => {
          toast.success(t("suppliers.form.created"));
          onOpenChange(false);
        },
        onError: (e) => toast.error(e.message || t("suppliers.form.createFailed")),
      });
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? t("suppliers.form.titleEdit") : t("suppliers.form.titleNew")}</SheetTitle>
          <SheetDescription>
            {isEdit ? t("suppliers.form.descEdit") : t("suppliers.form.descNew")}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("suppliers.form.nameLabel")}</FormLabel>
                  <FormControl><Input {...field} placeholder={t("suppliers.form.namePh")} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("suppliers.form.contactLabel")}</FormLabel>
                  <FormControl><Input {...field} placeholder={t("suppliers.form.contactPh")} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("suppliers.form.emailLabel")}</FormLabel>
                    <FormControl><Input type="email" {...field} placeholder={t("suppliers.form.emailPh")} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("suppliers.form.phoneLabel")}</FormLabel>
                    <FormControl><Input {...field} placeholder={t("suppliers.form.phonePh")} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("suppliers.form.addressLabel")}</FormLabel>
                  <FormControl><Textarea {...field} rows={2} placeholder={t("suppliers.form.addressPh")} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="leadTimeDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("suppliers.form.leadTimeLabel")}</FormLabel>
                    <FormControl><Input type="number" min={0} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="minOrderQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("suppliers.form.minOrderLabel")}</FormLabel>
                    <FormControl><Input type="number" min={0} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="paymentTerms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("suppliers.form.paymentTermsLabel")}</FormLabel>
                  <FormControl><Input {...field} placeholder={t("suppliers.form.paymentTermsPh")} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("suppliers.form.notesLabel")}</FormLabel>
                  <FormControl><Textarea {...field} rows={3} placeholder={t("suppliers.form.notesPh")} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
              <Button type="submit">{isEdit ? t("suppliers.form.submitEdit") : t("suppliers.form.submitNew")}</Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
