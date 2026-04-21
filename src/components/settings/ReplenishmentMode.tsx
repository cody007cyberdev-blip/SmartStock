import { useTranslation } from "react-i18next";
import { Brain, Hand, Layers } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useReplenishmentMode } from "@/hooks/useReplenishmentMode";
import {
  REPLENISHMENT_MODE_DESCRIPTIONS,
  type ReplenishmentMode,
} from "@/lib/replenishment-settings";
import { toast } from "sonner";

const OPTIONS: Array<{
  value: ReplenishmentMode;
  icon: typeof Hand;
}> = [
  { value: "manual", icon: Hand },
  { value: "mixed", icon: Layers },
  { value: "ai", icon: Brain },
];

export function ReplenishmentModeSettings() {
  const { t } = useTranslation();
  const [mode, setMode] = useReplenishmentMode();

  const handleChange = (next: string) => {
    setMode(next as ReplenishmentMode);
    toast.success(t("settings.replenishment.changed", { mode: t(`settings.replenishment.modes.${next}` as const) }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.replenishment.title")}</CardTitle>
        <CardDescription>{t("settings.replenishment.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={mode} onValueChange={handleChange} className="space-y-3">
          {OPTIONS.map(({ value, icon: Icon }) => {
            const active = mode === value;
            return (
              <Label
                key={value}
                htmlFor={`mode-${value}`}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
                  active
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <RadioGroupItem value={value} id={`mode-${value}`} className="mt-1" />
                <div className="flex flex-1 items-start gap-3">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
                      active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">{t(`settings.replenishment.modes.${value}` as const)}</p>
                    <p className="text-xs text-muted-foreground">
                      {REPLENISHMENT_MODE_DESCRIPTIONS[value]}
                    </p>
                  </div>
                </div>
              </Label>
            );
          })}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
