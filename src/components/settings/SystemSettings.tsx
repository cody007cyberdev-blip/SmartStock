import { useState } from "react";
import { useTranslation } from "react-i18next";
import { RotateCcw, Info, Play } from "lucide-react";
import { toast } from "sonner";
import { useDemo } from "@/hooks/useDemo";
import { DemoWalkthrough } from "@/components/onboarding/DemoWalkthrough";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function SystemSettings() {
  const { t } = useTranslation();
  const { isDemo, demoStore, resetDemoData } = useDemo();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [walkthroughActive, setWalkthroughActive] = useState(false);

  const items = demoStore?.getItems()?.length ?? 0;
  const suppliers = demoStore?.getSuppliers()?.length ?? 0;
  const locations = demoStore?.getLocations()?.length ?? 0;

  const handleReset = () => {
    resetDemoData();
    setConfirmOpen(false);
    toast.success(t("settings.system.demoData.resetSuccess"));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.system.demoData.title")}</CardTitle>
          <CardDescription>{t("settings.system.demoData.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDemo ? (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg border border-border p-3 text-center">
                  <p className="text-2xl font-semibold text-foreground">{items}</p>
                  <p className="text-xs text-muted-foreground">{t("settings.system.demoData.items")}</p>
                </div>
                <div className="rounded-lg border border-border p-3 text-center">
                  <p className="text-2xl font-semibold text-foreground">{suppliers}</p>
                  <p className="text-xs text-muted-foreground">{t("settings.system.demoData.suppliers")}</p>
                </div>
                <div className="rounded-lg border border-border p-3 text-center">
                  <p className="text-2xl font-semibold text-foreground">{locations}</p>
                  <p className="text-xs text-muted-foreground">{t("settings.system.demoData.locations")}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setWalkthroughActive(true)} className="gap-1.5">
                  <Play className="h-4 w-4" /> {t("settings.system.demoData.startWalkthrough")}
                </Button>
                <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
                  <RotateCcw className="mr-1.5 h-4 w-4" /> {t("settings.system.demoData.resetData")}
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{t("settings.system.demoData.notAvailable")}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Info className="h-4 w-4" />{t("settings.system.about.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted-foreground">{t("settings.system.about.version")}</dt><dd className="font-medium">1.0.0</dd>
            <dt className="text-muted-foreground">{t("settings.system.about.platform")}</dt><dd className="font-medium">{t("settings.system.about.platformValue")}</dd>
          </dl>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("settings.system.demoData.confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("settings.system.demoData.confirmDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("settings.system.demoData.reset")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DemoWalkthrough active={walkthroughActive} onClose={() => setWalkthroughActive(false)} />
    </div>
  );
}
