// Statistical ML forecasting engine — runs entirely client-side.
// Methods: moving average, damped Holt's linear, Holt-Winters additive
// (weekly). Selection uses hold-out validation + light grid search and
// only enables seasonality when ACF(7) shows a real weekly signal.

import type { Item, StockMovement } from "@/types/inventory";
import { MovementType } from "@/types/inventory";
import {
  mean,
  rmse,
  selectBestMethod,
  type ForecastMethod,
} from "./ml-forecast-methods";

export type { ForecastMethod };

export interface ForecastPoint {
  day: number;
  value: number;
  lower: number;
  upper: number;
}

export interface ItemForecast {
  itemId: string;
  itemName: string;
  sku: string;
  currentStock: number;
  historyDays: number;
  observationsUsed: number;
  method: ForecastMethod;
  mape: number; // sMAPE on validation tail (0-1) — kept name for API compat
  trend: number;
  seasonality: boolean;
  avgDailyDemand: number;
  forecast: ForecastPoint[];
  totalForecast30d: number;
  totalForecast60d: number;
  totalForecast90d: number;
  daysUntilStockout: number | null;
  recommendedReorderPoint: number;
  recommendedReorderQuantity: number;
  confidence: "high" | "medium" | "low";
}

function dailyDemandSeries(movements: StockMovement[], windowDays: number): number[] {
  const now = new Date();
  const cutoff = new Date(now.getTime() - windowDays * 86_400_000);
  const buckets = new Array<number>(windowDays).fill(0);

  for (const m of movements) {
    const isOut =
      m.type === MovementType.Shipped ||
      (m.type === MovementType.Adjusted && m.quantity < 0);
    if (!isOut) continue;
    const d = new Date(m.createdAt);
    if (d < cutoff) continue;
    const dayOffset = Math.floor((d.getTime() - cutoff.getTime()) / 86_400_000);
    if (dayOffset >= 0 && dayOffset < windowDays) {
      buckets[dayOffset] += Math.abs(m.quantity);
    }
  }
  return buckets;
}

export function forecastItem(
  item: Item,
  movements: StockMovement[],
  horizon = 90,
): ItemForecast {
  const itemMoves = movements.filter((m) => m.itemId === item.id);
  const oldestTs = itemMoves.length
    ? Math.min(...itemMoves.map((m) => new Date(m.createdAt).getTime()))
    : Date.now();
  const historyDays = Math.max(7, Math.ceil((Date.now() - oldestTs) / 86_400_000));
  const windowDays = Math.min(historyDays + 1, 365 * 3);
  const series = dailyDemandSeries(itemMoves, windowDays);
  const observations = series.filter((v) => v > 0).length;

  if (observations < 3) {
    return {
      itemId: item.id,
      itemName: item.name,
      sku: item.sku,
      currentStock: item.currentStock,
      historyDays,
      observationsUsed: observations,
      method: "moving_avg",
      mape: 1,
      trend: 0,
      seasonality: false,
      avgDailyDemand: 0,
      forecast: Array.from({ length: horizon }, (_, i) => ({
        day: i + 1,
        value: 0,
        lower: 0,
        upper: 0,
      })),
      totalForecast30d: 0,
      totalForecast60d: 0,
      totalForecast90d: 0,
      daysUntilStockout: null,
      recommendedReorderPoint: item.reorderPoint,
      recommendedReorderQuantity: item.reorderQuantity,
      confidence: "low",
    };
  }

  const { method, result, smapeScore } = selectBestMethod(series, horizon);

  // Prediction interval based on residual RMSE (not raw series stddev) —
  // this measures how wrong the model actually is, not how noisy demand is.
  const residualRmse = rmse(series, result.fitted);
  const forecast: ForecastPoint[] = result.forecast.map((value, i) => {
    // Variance grows ~√h with horizon for cumulative uncertainty.
    const margin = 1.96 * residualRmse * Math.sqrt(Math.max(1, (i + 1) / 7));
    return {
      day: i + 1,
      value: Math.round(value * 100) / 100,
      lower: Math.max(0, Math.round((value - margin) * 100) / 100),
      upper: Math.round((value + margin) * 100) / 100,
    };
  });

  const sumWindow = (n: number) =>
    Math.round(forecast.slice(0, n).reduce((a, p) => a + p.value, 0));

  const avgDailyDemand = mean(result.forecast.slice(0, 30));
  const daysUntilStockout =
    avgDailyDemand > 0
      ? Math.max(0, Math.floor(item.currentStock / avgDailyDemand))
      : null;

  const leadTime = 7;
  const leadDemand = sumWindow(leadTime);
  const safety = Math.ceil(1.65 * residualRmse * Math.sqrt(leadTime));
  const recommendedReorderPoint = leadDemand + safety;
  const recommendedReorderQuantity = Math.max(1, sumWindow(30));

  let confidence: "high" | "medium" | "low" = "low";
  if (smapeScore < 0.25 && historyDays >= 60) confidence = "high";
  else if (smapeScore < 0.5 && historyDays >= 30) confidence = "medium";

  return {
    itemId: item.id,
    itemName: item.name,
    sku: item.sku,
    currentStock: item.currentStock,
    historyDays,
    observationsUsed: observations,
    method,
    mape: smapeScore,
    trend: result.trend,
    seasonality: result.seasonality,
    avgDailyDemand,
    forecast,
    totalForecast30d: sumWindow(30),
    totalForecast60d: sumWindow(60),
    totalForecast90d: sumWindow(90),
    daysUntilStockout,
    recommendedReorderPoint,
    recommendedReorderQuantity,
    confidence,
  };
}

export function forecastAllItems(
  items: Item[],
  movements: StockMovement[],
): ItemForecast[] {
  return items
    .filter((i) => i.status === "active")
    .map((i) => forecastItem(i, movements))
    .sort((a, b) => {
      const aD = a.daysUntilStockout ?? Infinity;
      const bD = b.daysUntilStockout ?? Infinity;
      return aD - bD;
    });
}

export const METHOD_LABELS: Record<ForecastMethod, string> = {
  moving_avg: "Moving Average",
  holt: "Holt (damped trend)",
  holt_winters: "Holt-Winters (trend + weekly seasonality)",
};
