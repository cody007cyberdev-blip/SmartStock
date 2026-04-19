import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { createFileRoute } from "@tanstack/react-router";
import { Package, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { NeedsAttention } from "@/components/dashboard/NeedsAttention";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { DashboardReorderSection } from "@/components/insights/DashboardReorderSection";
import { DashboardAnomalySection } from "@/components/insights/DashboardAnomalySection";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";

import { useStockSummary } from "@/hooks/useInventoryData";
import { useAlertGenerator } from "@/hooks/useStockAlertGenerator";
import { useDemo } from "@/hooks/useDemo";
import { useOnboarding, type TourStep } from "@/hooks/useOnboarding";

export const Route = createFileRoute("/app/dashboard")({
  component: DashboardPage,
  head: () => ({ meta: [{ title: "Painel — StockMind" }] }),
});

function DashboardPage() {
  const { t } = useTranslation();
  const { data: summary } = useStockSummary();
  const { demoStore, isDemo } = useDemo();
  useAlertGenerator();

  const items = demoStore?.getItems() ?? [];
  const movements = demoStore?.getMovements() ?? [];
  const suppliers = demoStore?.getSuppliers() ?? [];

  const tour = useOnboarding("dashboard");

  const TOUR_STEPS: TourStep[] = [
    { title: t("dashboard.tour.welcomeTitle"), description: t("dashboard.tour.welcomeDesc") },
    { target: "sidebar", title: t("dashboard.tour.navTitle"), description: t("dashboard.tour.navDesc") },
    { target: "metrics", title: t("dashboard.tour.stockTitle"), description: t("dashboard.tour.stockDesc") },
    { target: "needs-attention", title: t("dashboard.tour.attentionTitle"), description: t("dashboard.tour.attentionDesc") },
    { target: "search", title: t("dashboard.tour.paletteTitle"), description: t("dashboard.tour.paletteDesc") },
    { title: t("dashboard.tour.doneTitle"), description: t("dashboard.tour.doneDesc") },
  ];

  // Auto-start tour on first demo visit
  useEffect(() => {
    if (isDemo && !tour.hasCompleted) {
      const timer = setTimeout(() => tour.startTour(), 500);
      return () => clearTimeout(timer);
    }
  }, [isDemo, tour.hasCompleted]);

  const handleTourComplete = () => {
    tour.completeTour();
    toast.success(t("dashboard.tour.complete"));
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t("dashboard.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("dashboard.welcome")}</p>
      </div>

      <div data-tour="metrics" className="rounded-xl border border-border bg-card p-3 shadow-xs">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label={t("dashboard.metrics.totalSkus")} value={summary.total} accentColor="neutral" icon={Package} />
          <MetricCard label={t("dashboard.metrics.inStock")} value={summary.inStock} accentColor="healthy" icon={CheckCircle2} />
          <MetricCard label={t("dashboard.metrics.lowStock")} value={summary.lowStock} accentColor="warning" icon={AlertTriangle} />
          <MetricCard label={t("dashboard.metrics.outOfStock")} value={summary.outOfStock} accentColor="danger" icon={XCircle} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr]">
        <div data-tour="needs-attention" className="min-h-0"><NeedsAttention /></div>
        <div className="min-h-0"><RecentActivity /></div>
      </div>

      <DashboardAnomalySection movements={movements} items={items} />
      <DashboardReorderSection items={items} movements={movements} suppliers={suppliers} />

      <OnboardingTour
        steps={TOUR_STEPS}
        currentStep={tour.currentStep}
        isActive={tour.isActive}
        onNext={tour.next}
        onBack={tour.back}
        onSkip={tour.skipTour}
        onComplete={handleTourComplete}
      />
    </div>
  );
}
