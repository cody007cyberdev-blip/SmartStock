import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { useMovements } from "@/hooks/useInventoryData";
import { forecastItem, METHOD_LABELS } from "@/lib/ml-forecast";
import type { Item } from "@/types/inventory";

interface Props {
  item: Item;
  horizon?: number;
}

const CONFIDENCE_STYLES = {
  high: "bg-stock-healthy/15 text-stock-healthy border-stock-healthy/30",
  medium: "bg-stock-low/15 text-stock-low border-stock-low/30",
  low: "bg-stock-out/15 text-stock-out border-stock-out/30",
} as const;

const CONFIDENCE_LABEL = { high: "Alta", medium: "Média", low: "Baixa" } as const;

export function ItemForecastPanel({ item, horizon = 30 }: Props) {
  const { data: movements } = useMovements();

  const fc = useMemo(() => forecastItem(item, movements, horizon), [item, movements, horizon]);

  const chartData = useMemo(
    () =>
      fc.forecast.slice(0, horizon).map((p) => ({
        day: `D+${p.day}`,
        value: p.value,
        range: [p.lower, p.upper] as [number, number],
      })),
    [fc, horizon],
  );

  const TrendIcon = fc.trend > 0.05 ? TrendingUp : fc.trend < -0.05 ? TrendingDown : Minus;
  const trendColor =
    fc.trend > 0.05 ? "text-stock-out" : fc.trend < -0.05 ? "text-stock-healthy" : "text-muted-foreground";

  if (fc.observationsUsed < 3) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div>
          <p className="font-medium text-foreground">Dados insuficientes</p>
          <p className="text-muted-foreground">
            Registre mais movimentações para gerar previsão (mínimo 3 dias com saídas).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-xs">{METHOD_LABELS[fc.method]}</Badge>
        <Badge className={`text-xs border ${CONFIDENCE_STYLES[fc.confidence]}`}>
          Confiança: {CONFIDENCE_LABEL[fc.confidence]}
        </Badge>
        <span className={`inline-flex items-center gap-1 text-xs ${trendColor}`}>
          <TrendIcon className="h-3.5 w-3.5" />
          Tendência {fc.trend > 0 ? "+" : ""}{fc.trend.toFixed(2)}/dia
        </span>
        {fc.seasonality && <Badge variant="secondary" className="text-xs">Sazonalidade semanal</Badge>}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Demanda diária" value={fc.avgDailyDemand.toFixed(1)} />
        <Metric label="Próximos 30d" value={String(fc.totalForecast30d)} />
        <Metric
          label="Stockout em"
          value={fc.daysUntilStockout != null ? `${fc.daysUntilStockout}d` : "—"}
          danger={fc.daysUntilStockout != null && fc.daysUntilStockout <= 7}
        />
        <Metric label="sMAPE" value={`${(fc.mape * 100).toFixed(0)}%`} />
      </div>

      <div className="h-56 w-full rounded-lg border border-border bg-card p-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={Math.floor(horizon / 6)} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(val: number | number[], name: string) => {
                if (Array.isArray(val)) return [`${val[0]} – ${val[1]}`, "Intervalo 95%"];
                return [val, name === "value" ? "Previsto" : name];
              }}
            />
            <Area
              dataKey="range"
              stroke="none"
              fill="hsl(var(--primary))"
              fillOpacity={0.15}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Dia</th>
              <th className="px-3 py-2 text-right font-medium">Previsto</th>
              <th className="px-3 py-2 text-right font-medium">Mín</th>
              <th className="px-3 py-2 text-right font-medium">Máx</th>
            </tr>
          </thead>
          <tbody>
            {fc.forecast.slice(0, 7).map((p) => (
              <tr key={p.day} className="border-t border-border">
                <td className="px-3 py-1.5">D+{p.day}</td>
                <td className="px-3 py-1.5 text-right font-mono">{p.value.toFixed(1)}</td>
                <td className="px-3 py-1.5 text-right font-mono text-muted-foreground">{p.lower.toFixed(1)}</td>
                <td className="px-3 py-1.5 text-right font-mono text-muted-foreground">{p.upper.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Metric({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-0.5 font-mono text-base font-semibold ${danger ? "text-stock-out" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}
