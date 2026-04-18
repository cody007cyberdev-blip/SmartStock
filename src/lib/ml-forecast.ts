// Statistical ML forecasting engine — runs entirely client-side.
// Methods: simple moving average, double exponential smoothing (Holt's),
// and triple exponential smoothing (Holt-Winters additive) with weekly
// seasonality. Selects the best method per series via in-sample MAPE.

import type { Item, StockMovement } from "@/types/inventory";
import { MovementType } from "@/types/inventory";

export type ForecastMethod = "moving_avg" | "holt" | "holt_winters";

export interface ForecastPoint {
  day: number; // 1-indexed days from "today"
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
  mape: number; // mean absolute % error on in-sample fit (0-1)
  trend: number; // units/day change
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

// ─── Helpers ───────────────────────────────────────────────

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
  return buckets; // index 0 = oldest, last = today
}

function mean(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(mean(arr.map((v) => (v - m) ** 2)));
}

function mape(actual: number[], predicted: number[]): number {
  let sum = 0;
  let n = 0;
  for (let i = 0; i < actual.length; i++) {
    const a = actual[i];
    const p = predicted[i];
    if (a > 0) {
      sum += Math.abs((a - p) / a);
      n++;
    } else if (p > 0) {
      // penalize over-prediction on zero days
      sum += 1;
      n++;
    }
  }
  return n === 0 ? 1 : Math.min(1, sum / n);
}

// ─── Methods ──────────────────────────────────────────────

function movingAverageForecast(series: number[], horizon: number) {
  const window = Math.min(14, Math.max(3, Math.floor(series.length / 4)));
  const recent = series.slice(-window);
  const avg = mean(recent);
  const fitted = series.map((_, i) => {
    const start = Math.max(0, i - window);
    return mean(series.slice(start, i + 1));
  });
  const forecast = new Array<number>(horizon).fill(avg);
  return { fitted, forecast, trend: 0, seasonality: false };
}

function holtForecast(series: number[], horizon: number) {
  const alpha = 0.4;
  const beta = 0.1;
  if (series.length < 4) return movingAverageForecast(series, horizon);

  let level = series[0];
  let trend = series[1] - series[0];
  const fitted: number[] = [level];

  for (let i = 1; i < series.length; i++) {
    const prevLevel = level;
    level = alpha * series[i] + (1 - alpha) * (prevLevel + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
    fitted.push(level);
  }

  const forecast: number[] = [];
  for (let h = 1; h <= horizon; h++) {
    forecast.push(Math.max(0, level + h * trend));
  }
  return { fitted, forecast, trend, seasonality: false };
}

function holtWintersForecast(series: number[], horizon: number, period = 7) {
  if (series.length < period * 2) return holtForecast(series, horizon);

  const alpha = 0.3;
  const beta = 0.05;
  const gamma = 0.2;

  // Initial seasonal indices (additive): average per position - global mean
  const globalMean = mean(series);
  const seasonal = new Array<number>(period).fill(0);
  const counts = new Array<number>(period).fill(0);
  for (let i = 0; i < series.length; i++) {
    seasonal[i % period] += series[i];
    counts[i % period]++;
  }
  for (let i = 0; i < period; i++) {
    seasonal[i] = counts[i] ? seasonal[i] / counts[i] - globalMean : 0;
  }

  let level = globalMean;
  let trend = (mean(series.slice(-period)) - mean(series.slice(0, period))) / series.length;
  const fitted: number[] = [];

  for (let i = 0; i < series.length; i++) {
    const s = seasonal[i % period];
    const prevLevel = level;
    const observed = series[i];
    fitted.push(Math.max(0, level + trend + s));
    level = alpha * (observed - s) + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
    seasonal[i % period] = gamma * (observed - level) + (1 - gamma) * s;
  }

  const forecast: number[] = [];
  for (let h = 1; h <= horizon; h++) {
    const s = seasonal[(series.length + h - 1) % period];
    forecast.push(Math.max(0, level + h * trend + s));
  }
  return { fitted, forecast, trend, seasonality: true };
}

// ─── Selection & confidence intervals ─────────────────────

interface MethodResult {
  fitted: number[];
  forecast: number[];
  trend: number;
  seasonality: boolean;
}

function selectBestMethod(series: number[], horizon: number): {
  method: ForecastMethod;
  result: MethodResult;
  mapeScore: number;
} {
  const candidates: Array<{ name: ForecastMethod; result: MethodResult }> = [
    { name: "moving_avg", result: movingAverageForecast(series, horizon) },
  ];
  if (series.length >= 8) candidates.push({ name: "holt", result: holtForecast(series, horizon) });
  if (series.length >= 14)
    candidates.push({ name: "holt_winters", result: holtWintersForecast(series, horizon) });

  let best = candidates[0];
  let bestMape = mape(series, best.result.fitted);
  for (const c of candidates.slice(1)) {
    const m = mape(series, c.result.fitted);
    if (m < bestMape) {
      best = c;
      bestMape = m;
    }
  }
  return { method: best.name, result: best.result, mapeScore: bestMape };
}

// ─── Public API ──────────────────────────────────────────

export function forecastItem(item: Item, movements: StockMovement[], horizon = 90): ItemForecast {
  const itemMoves = movements.filter((m) => m.itemId === item.id);
  const oldestTs = itemMoves.length
    ? Math.min(...itemMoves.map((m) => new Date(m.createdAt).getTime()))
    : Date.now();
  const historyDays = Math.max(
    7,
    Math.ceil((Date.now() - oldestTs) / 86_400_000),
  );
  const windowDays = Math.min(historyDays + 1, 365 * 3);
  const series = dailyDemandSeries(itemMoves, windowDays);
  const observations = series.filter((v) => v > 0).length;

  // Not enough signal — return zero forecast
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

  const { method, result, mapeScore } = selectBestMethod(series, horizon);
  const sd = stdDev(series);
  // 95% CI ≈ ±1.96 σ, scaled by √h for cumulative uncertainty
  const forecast: ForecastPoint[] = result.forecast.map((value, i) => {
    const margin = 1.96 * sd * Math.sqrt(Math.max(1, (i + 1) / 7));
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
    avgDailyDemand > 0 ? Math.max(0, Math.floor(item.currentStock / avgDailyDemand)) : null;

  // Recommended reorder point: forecast over typical lead time + safety
  const leadTime = 7;
  const leadDemand = sumWindow(leadTime);
  const safety = Math.ceil(1.65 * sd * Math.sqrt(leadTime)); // 95% service level
  const recommendedReorderPoint = leadDemand + safety;
  const recommendedReorderQuantity = Math.max(1, sumWindow(30));

  let confidence: "high" | "medium" | "low" = "low";
  if (mapeScore < 0.25 && historyDays >= 60) confidence = "high";
  else if (mapeScore < 0.5 && historyDays >= 30) confidence = "medium";

  return {
    itemId: item.id,
    itemName: item.name,
    sku: item.sku,
    currentStock: item.currentStock,
    historyDays,
    observationsUsed: observations,
    method,
    mape: mapeScore,
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

export function forecastAllItems(items: Item[], movements: StockMovement[]): ItemForecast[] {
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
  holt: "Holt (trend)",
  holt_winters: "Holt-Winters (trend + weekly seasonality)",
};
