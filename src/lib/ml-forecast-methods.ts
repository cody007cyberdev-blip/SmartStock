// Forecast method implementations + selection helpers.
// Kept separate from ml-forecast.ts to respect the 250-line file budget.

export type ForecastMethod = "moving_avg" | "holt" | "holt_winters";

export interface MethodResult {
  fitted: number[];
  forecast: number[];
  trend: number;
  seasonality: boolean;
}

// ─── Stats helpers ────────────────────────────────────────

export function mean(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(mean(arr.map((v) => (v - m) ** 2)));
}

/** RMSE of residuals — preferred over stdDev(series) for prediction intervals. */
export function rmse(actual: number[], predicted: number[]): number {
  const n = Math.min(actual.length, predicted.length);
  if (n === 0) return 0;
  let s = 0;
  for (let i = 0; i < n; i++) s += (actual[i] - predicted[i]) ** 2;
  return Math.sqrt(s / n);
}

/** sMAPE (symmetric) — bounded in [0,1], stable when actuals are zero. */
export function smape(actual: number[], predicted: number[]): number {
  const n = Math.min(actual.length, predicted.length);
  if (n === 0) return 1;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const a = actual[i];
    const p = predicted[i];
    const denom = Math.abs(a) + Math.abs(p);
    if (denom === 0) continue;
    sum += Math.abs(a - p) / denom;
  }
  return Math.min(1, sum / n);
}

/** Autocorrelation at given lag — used to detect weekly seasonality. */
export function autocorrelation(series: number[], lag: number): number {
  if (series.length <= lag) return 0;
  const m = mean(series);
  let num = 0;
  let den = 0;
  for (let i = 0; i < series.length; i++) {
    den += (series[i] - m) ** 2;
    if (i >= lag) num += (series[i] - m) * (series[i - lag] - m);
  }
  return den === 0 ? 0 : num / den;
}

// ─── Methods ──────────────────────────────────────────────

export function movingAverageForecast(series: number[], horizon: number): MethodResult {
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

/** Holt's linear with damped trend (φ < 1) to keep long horizons stable. */
export function holtForecast(
  series: number[],
  horizon: number,
  alpha = 0.4,
  beta = 0.1,
  phi = 0.98,
): MethodResult {
  if (series.length < 4) return movingAverageForecast(series, horizon);

  let level = series[0];
  let trend = series[1] - series[0];
  const fitted: number[] = [level];

  for (let i = 1; i < series.length; i++) {
    const prevLevel = level;
    level = alpha * series[i] + (1 - alpha) * (prevLevel + phi * trend);
    trend = beta * (level - prevLevel) + (1 - beta) * phi * trend;
    fitted.push(level);
  }

  const forecast: number[] = [];
  let dampedSum = 0;
  for (let h = 1; h <= horizon; h++) {
    dampedSum += Math.pow(phi, h);
    forecast.push(Math.max(0, level + dampedSum * trend));
  }
  return { fitted, forecast, trend, seasonality: false };
}

export function holtWintersForecast(
  series: number[],
  horizon: number,
  period = 7,
  alpha = 0.3,
  beta = 0.05,
  gamma = 0.2,
): MethodResult {
  if (series.length < period * 2) return holtForecast(series, horizon);

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
  let trend =
    (mean(series.slice(-period)) - mean(series.slice(0, period))) / series.length;
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

// ─── Selection with hold-out validation + grid search ─────

const ALPHA_GRID = [0.2, 0.4, 0.6];
const BETA_GRID = [0.05, 0.15];
const GAMMA_GRID = [0.1, 0.3];

/** Try a small parameter grid; pick the best fit on a validation tail. */
function tuneHolt(train: number[], val: number[], horizon: number): MethodResult {
  let best: { res: MethodResult; score: number } | null = null;
  for (const a of ALPHA_GRID) {
    for (const b of BETA_GRID) {
      const res = holtForecast(train, val.length, a, b);
      const score = smape(val, res.forecast);
      if (!best || score < best.score) {
        best = { res: holtForecast([...train, ...val], horizon, a, b), score };
      }
    }
  }
  return best!.res;
}

function tuneHoltWinters(train: number[], val: number[], horizon: number): MethodResult {
  let best: { res: MethodResult; score: number } | null = null;
  for (const a of ALPHA_GRID) {
    for (const b of BETA_GRID) {
      for (const g of GAMMA_GRID) {
        const res = holtWintersForecast(train, val.length, 7, a, b, g);
        const score = smape(val, res.forecast);
        if (!best || score < best.score) {
          best = {
            res: holtWintersForecast([...train, ...val], horizon, 7, a, b, g),
            score,
          };
        }
      }
    }
  }
  return best!.res;
}

export interface SelectionResult {
  method: ForecastMethod;
  result: MethodResult;
  smapeScore: number;
}

export function selectBestMethod(series: number[], horizon: number): SelectionResult {
  // Hold-out: last min(14, 20%) days for validation when possible.
  const valSize = Math.min(14, Math.floor(series.length * 0.2));
  const useHoldOut = valSize >= 4 && series.length - valSize >= 8;
  const train = useHoldOut ? series.slice(0, -valSize) : series;
  const val = useHoldOut ? series.slice(-valSize) : series;

  const candidates: Array<{ name: ForecastMethod; result: MethodResult }> = [
    { name: "moving_avg", result: movingAverageForecast(series, horizon) },
  ];

  if (train.length >= 8) {
    candidates.push({
      name: "holt",
      result: useHoldOut ? tuneHolt(train, val, horizon) : holtForecast(series, horizon),
    });
  }

  // Only consider Holt-Winters when weekly seasonality is actually present.
  const hasWeeklySignal = series.length >= 14 && autocorrelation(series, 7) > 0.25;
  if (train.length >= 14 && hasWeeklySignal) {
    candidates.push({
      name: "holt_winters",
      result: useHoldOut
        ? tuneHoltWinters(train, val, horizon)
        : holtWintersForecast(series, horizon),
    });
  }

  let best = candidates[0];
  let bestScore = useHoldOut
    ? smape(val, best.result.forecast.slice(0, val.length))
    : smape(series, best.result.fitted);
  for (const c of candidates.slice(1)) {
    const score = useHoldOut
      ? smape(val, c.result.forecast.slice(0, val.length))
      : smape(series, c.result.fitted);
    if (score < bestScore) {
      best = c;
      bestScore = score;
    }
  }
  return { method: best.name, result: best.result, smapeScore: bestScore };
}
