import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useDemo } from "@/hooks/useDemo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const FACTORY = { reorderPoint: 10, leadTimeDays: 7, safetyMultiplier: 1.5, orderQuantity: 25 };

export function ReorderDefaults() {
  const { t } = useTranslation();
  const { demoStore, bumpVersion } = useDemo();
  const stored = demoStore?.getReorderDefaults() ?? FACTORY;

  const [values, setValues] = useState(stored);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setValues(stored); }, [demoStore]);

  const set = (key: keyof typeof values, v: string) => {
    setValues((prev) => ({ ...prev, [key]: Number(v) || 0 }));
  };

  const handleSave = () => {
    if (values.reorderPoint < 0 || values.leadTimeDays < 1 || values.safetyMultiplier < 1 || values.orderQuantity < 1) {
      toast.error(t("validation.fixErrors")); return;
    }
    setSaving(true);
    demoStore?.setReorderDefaults(values);
    bumpVersion();
    setTimeout(() => { setSaving(false); toast.success(t("settings.reorderDefaults.saved")); }, 300);
  };

  const handleReset = () => {
    setValues(FACTORY);
    demoStore?.setReorderDefaults(FACTORY);
    bumpVersion();
    toast.success(t("settings.reorderDefaults.restored"));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.reorderDefaults.title")}</CardTitle>
        <CardDescription>{t("settings.reorderDefaults.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t("settings.reorderDefaults.reorderPoint")}</Label>
            <Input type="number" min={0} value={values.reorderPoint} onChange={(e) => set("reorderPoint", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("settings.reorderDefaults.leadTime")}</Label>
            <Input type="number" min={1} value={values.leadTimeDays} onChange={(e) => set("leadTimeDays", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("settings.reorderDefaults.safetyMultiplier")}</Label>
            <Input type="number" min={1} step={0.1} value={values.safetyMultiplier} onChange={(e) => set("safetyMultiplier", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("settings.reorderDefaults.orderQuantity")}</Label>
            <Input type="number" min={1} value={values.orderQuantity} onChange={(e) => set("orderQuantity", e.target.value)} />
          </div>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} disabled={saving}>{saving ? t("settings.reorderDefaults.saving") : t("settings.reorderDefaults.save")}</Button>
          <Button variant="ghost" onClick={handleReset}>{t("settings.reorderDefaults.reset")}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
