import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart,
  ResponsiveContainer,
} from "recharts";
import { Brain, TrendingUp, AlertTriangle, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDemo } from "@/hooks/useDemo";
import { useUpdateItem } from "@/hooks/useInventoryMutations";
import { useReplenishmentMode } from "@/hooks/useReplenishmentMode";
import { forecastAllItems, METHOD_LABELS, type ItemForecast } from "@/lib/ml-forecast";
import { toast } from "sonner";

export const Route = createFileRoute("/app/ml-forecast")({
  component: MLForecastPage,
  head: () => ({
    meta: [
      { title: "ML Forecast — Stackwise" },
      {
        name: "description",
        content:
          "Statistical machine-learning forecast of inventory demand using Holt-Winters seasonality detection.",
      },
    ],
  }),
});

type Horizon = 30 | 60 | 90;

function MLForecastPage() {
  const { demoStore } = useDemo();
  const updateItem = useUpdateItem();
  const [mode] = useReplenishmentMode();
  const [horizon, setHorizon] = useState<Horizon>(30);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const items = demoStore?.getItems() ?? [];
  const movements = demoStore?.getMovements() ?? [];

  const forecasts = useMemo(() => forecastAllItems(items, movements), [items, movements]);
  const usable = forecasts.filter((f) => f.observationsUsed >= 3);

  const selected = useMemo(
    () => usable.find((f) => f.itemId === selectedId) ?? usable[0] ?? null,
    [usable, selectedId],
  );

  const totals = useMemo(() => {
    const sum = (key: "totalForecast30d" | "totalForecast60d" | "totalForecast90d") =>
      usable.reduce((acc, f) => acc + f[key], 0);
    return {
      d30: sum("totalForecast30d"),
      d60: sum("totalForecast60d"),
      d90: sum("totalForecast90d"),
      seasonal: usable.filter((f) => f.seasonality).length,
      high: usable.filter((f) => f.confidence === "high").length,
      stockout: usable.filter((f) => f.daysUntilStockout !== null && f.daysUntilStockout <= 14)
        .length,
    };
  }, [usable]);

  const applyForecast = (f: ItemForecast) => {
    updateItem.mutate(
      {
        id: f.itemId,
        updates: {
          reorderPoint: f.recommendedReorderPoint,
          reorderQuantity: f.recommendedReorderQuantity,
        },
      },
      {
        onSuccess: () =>
          toast.success(`Applied ML forecast to ${f.itemName}`, {
            description: `RP=${f.recommendedReorderPoint} · RQ=${f.recommendedReorderQuantity}`,
          }),
      },
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Brain className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">ML Demand Forecast</h1>
            <p className="text-sm text-muted-foreground">
              Holt-Winters seasonality detection over your full sales history.
            </p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1 px-2.5 py-1 font-mono text-[11px] uppercase">
          <Zap className="h-3 w-3" /> Mode: {mode}
        </Badge>
      </header>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryCard label="Forecast 30d" value={totals.d30.toLocaleString()} suffix="units" />
        <SummaryCard label="Forecast 90d" value={totals.d90.toLocaleString()} suffix="units" />
        <SummaryCard
          label="Seasonal items"
          value={totals.seasonal.toString()}
          icon={TrendingUp}
        />
        <SummaryCard
          label="Stockout ≤14d"
          value={totals.stockout.toString()}
          icon={AlertTriangle}
          danger={totals.stockout > 0}
        />
      </div>

      {usable.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Not enough movement history yet — log a few stock movements to enable forecasting.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Item list */}
          <Card className="lg:max-h-[640px] lg:overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Items ({usable.length})</CardTitle>
              <CardDescription className="text-xs">Sorted by stockout urgency</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1.5 lg:overflow-y-auto">
              {usable.map((f) => {
                const active = selected?.itemId === f.itemId;
                return (
                  <button
                    key={f.itemId}
                    onClick={() => setSelectedId(f.itemId)}
                    className={`flex w-full items-start justify-between gap-2 rounded-md border p-2.5 text-left transition ${
                      active
                        ? "border-primary bg-primary/5"
                        : "border-transparent hover:border-border hover:bg-muted/40"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{f.itemName}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">{f.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm tabular-nums">
                        {f.daysUntilStockout === null ? "—" : `${f.daysUntilStockout}d`}
                      </p>
                      <Badge
                        variant={f.confidence === "high" ? "default" : "outline"}
                        className="text-[9px]"
                      >
                        {f.confidence}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Detail */}
          {selected ? <DetailPanel f={selected} horizon={horizon} setHorizon={setHorizon} onApply={applyForecast} /> : null}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  suffix,
  icon: Icon,
  danger,
}: {
  label: string;
  value: string;
  suffix?: string;
  icon?: typeof TrendingUp;
  danger?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
          {Icon ? <Icon className="h-3 w-3" /> : null}
          {label}
        </p>
        <p
          className={`mt-1 font-mono text-2xl font-semibold tabular-nums ${
            danger ? "text-destructive" : "text-foreground"
          }`}
        >
          {value}
          {suffix ? <span className="ml-1 text-xs font-normal text-muted-foreground">{suffix}</span> : null}
        </p>
      </CardContent>
    </Card>
  );
}

function DetailPanel({
  f,
  horizon,
  setHorizon,
  onApply,
}: {
  f: ItemForecast;
  horizon: 30 | 60 | 90;
  setHorizon: (h: 30 | 60 | 90) => void;
  onApply: (f: ItemForecast) => void;
}) {
  const data = f.forecast.slice(0, horizon).map((p) => ({
    day: `D+${p.day}`,
    forecast: p.value,
    lower: p.lower,
    upper: p.upper,
    range: [p.lower, p.upper],
  }));

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{f.itemName}</CardTitle>
            <CardDescription className="font-mono text-xs">{f.sku}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={String(horizon)} onValueChange={(v) => setHorizon(Number(v) as 30 | 60 | 90)}>
              <TabsList className="h-8">
                <TabsTrigger value="30" className="px-3 text-xs">30d</TabsTrigger>
                <TabsTrigger value="60" className="px-3 text-xs">60d</TabsTrigger>
                <TabsTrigger value="90" className="px-3 text-xs">90d</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
          <Meta label="Method" value={METHOD_LABELS[f.method]} />
          <Meta label="Fit error (MAPE)" value={`${(f.mape * 100).toFixed(1)}%`} />
          <Meta label="Trend" value={`${f.trend > 0 ? "+" : ""}${f.trend.toFixed(2)}/d`} />
          <Meta label="History" value={`${f.historyDays}d`} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="ci" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} interval="preserveStartEnd" />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="upper"
                stroke="none"
                fill="url(#ci)"
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-muted/30 p-4 md:grid-cols-3">
          <Recommendation label="Forecast (selected horizon)" value={`${data.reduce((s, d) => s + d.forecast, 0).toFixed(0)} units`} />
          <Recommendation label="Recommended reorder point" value={f.recommendedReorderPoint.toString()} />
          <Recommendation label="Recommended order qty" value={f.recommendedReorderQuantity.toString()} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            Current settings — RP <span className="font-mono">{f.currentStock}</span> · stock{" "}
            <span className="font-mono">{f.currentStock}</span>
            {f.daysUntilStockout !== null ? (
              <> · stockout in <span className="font-mono">{f.daysUntilStockout}d</span></>
            ) : null}
          </p>
          <Button size="sm" onClick={() => onApply(f)}>
            Apply ML recommendation
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/30 px-2.5 py-1.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-mono text-xs text-foreground">{value}</p>
    </div>
  );
}

function Recommendation({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
