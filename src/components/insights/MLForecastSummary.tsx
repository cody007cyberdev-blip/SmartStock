import { useMemo } from "react";
import { Brain, Sparkles, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useReplenishmentMode } from "@/hooks/useReplenishmentMode";
import { forecastAllItems } from "@/lib/ml-forecast";
import type { Item, StockMovement } from "@/types/inventory";
import { Link } from "@tanstack/react-router";

interface Props {
  items: Item[];
  movements: StockMovement[];
}

export function MLForecastSummary({ items, movements }: Props) {
  const [mode] = useReplenishmentMode();

  const forecasts = useMemo(() => forecastAllItems(items, movements), [items, movements]);

  const stats = useMemo(() => {
    const usable = forecasts.filter((f) => f.observationsUsed >= 3);
    const high = usable.filter((f) => f.confidence === "high").length;
    const seasonal = usable.filter((f) => f.seasonality).length;
    const stockoutSoon = usable.filter(
      (f) => f.daysUntilStockout !== null && f.daysUntilStockout <= 14,
    ).length;
    const totalDemand30d = usable.reduce((s, f) => s + f.totalForecast30d, 0);
    return { usable: usable.length, high, seasonal, stockoutSoon, totalDemand30d };
  }, [forecasts]);

  const modeDescription =
    mode === "ai"
      ? "AI mode is active. Reorder suggestions use ML forecasts."
      : mode === "mixed"
        ? "Mixed mode. ML forecasts run alongside your manual settings."
        : "Manual mode. ML forecasts shown for reference only.";

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Brain className="h-5 w-5" />
          </span>
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              ML Forecasting
              <Badge variant="outline" className="font-mono text-[10px] uppercase">
                {mode}
              </Badge>
            </CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">{modeDescription}</p>
          </div>
        </div>
        <Link
          to="/app/ml-forecast"
          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition hover:border-primary/40 hover:text-primary"
        >
          <Sparkles className="h-3 w-3" /> Open dashboard
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Items modeled" value={stats.usable} />
          <Stat label="High confidence" value={stats.high} />
          <Stat label="Seasonal patterns" value={stats.seasonal} icon={TrendingUp} />
          <Stat label="Stockout ≤14d" value={stats.stockoutSoon} highlight={stats.stockoutSoon > 0} />
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  highlight,
  icon: Icon,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  icon?: typeof TrendingUp;
}) {
  return (
    <div className="rounded-lg border border-border bg-background/60 p-3">
      <p className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
        {Icon ? <Icon className="h-3 w-3" /> : null}
        {label}
      </p>
      <p
        className={`mt-1 font-mono text-2xl font-semibold ${
          highlight ? "text-destructive" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
