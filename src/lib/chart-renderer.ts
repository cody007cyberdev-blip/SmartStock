// Renders simple bar/line charts to a PNG data URL using canvas.
// No external dependencies — works in browser only.

export interface ChartSeries {
  label: string;
  values: number[];
  color: string; // hex
}

export interface ChartSpec {
  title: string;
  labels: string[]; // x-axis labels
  series: ChartSeries[];
  type: "line" | "bar";
  width?: number;
  height?: number;
}

const DEFAULT_W = 800;
const DEFAULT_H = 320;

export function renderChartPng(spec: ChartSpec): string {
  const w = spec.width ?? DEFAULT_W;
  const h = spec.height ?? DEFAULT_H;
  const canvas = document.createElement("canvas");
  // Hi-DPI for crisp PDF embed
  const scale = 2;
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);

  // Title
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 16px system-ui, sans-serif";
  ctx.fillText(spec.title, 16, 24);

  const padding = { top: 44, right: 16, bottom: 40, left: 48 };
  const plotW = w - padding.left - padding.right;
  const plotH = h - padding.top - padding.bottom;

  const allVals = spec.series.flatMap((s) => s.values);
  const max = Math.max(1, ...allVals);
  const min = Math.min(0, ...allVals);
  const range = max - min || 1;

  // Y gridlines
  ctx.strokeStyle = "#e2e8f0";
  ctx.fillStyle = "#64748b";
  ctx.font = "10px system-ui, sans-serif";
  ctx.lineWidth = 1;
  const ticks = 4;
  for (let i = 0; i <= ticks; i++) {
    const y = padding.top + (plotH * i) / ticks;
    const val = max - (range * i) / ticks;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + plotW, y);
    ctx.stroke();
    ctx.fillText(formatTick(val), 6, y + 3);
  }

  const n = spec.labels.length;
  const xStep = n > 1 ? plotW / (n - 1) : plotW;

  // X labels (sparse)
  const labelEvery = Math.max(1, Math.ceil(n / 8));
  ctx.fillStyle = "#64748b";
  for (let i = 0; i < n; i += labelEvery) {
    const x = padding.left + i * xStep;
    ctx.fillText(spec.labels[i], x - 12, h - padding.bottom + 16);
  }

  // Series
  if (spec.type === "line") {
    spec.series.forEach((s) => {
      ctx.strokeStyle = s.color;
      ctx.fillStyle = s.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      s.values.forEach((v, i) => {
        const x = padding.left + i * xStep;
        const y = padding.top + plotH - ((v - min) / range) * plotH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });
  } else {
    const groupW = plotW / n;
    const barW = Math.max(2, (groupW / spec.series.length) * 0.8);
    spec.series.forEach((s, sIdx) => {
      ctx.fillStyle = s.color;
      s.values.forEach((v, i) => {
        const x =
          padding.left + i * groupW + sIdx * barW + (groupW - barW * spec.series.length) / 2;
        const y = padding.top + plotH - ((v - min) / range) * plotH;
        const barH = padding.top + plotH - y;
        ctx.fillRect(x, y, barW, barH);
      });
    });
  }

  // Legend
  let lx = padding.left;
  const ly = h - 12;
  ctx.font = "11px system-ui, sans-serif";
  spec.series.forEach((s) => {
    ctx.fillStyle = s.color;
    ctx.fillRect(lx, ly - 8, 10, 10);
    ctx.fillStyle = "#334155";
    ctx.fillText(s.label, lx + 14, ly);
    lx += 14 + ctx.measureText(s.label).width + 16;
  });

  return canvas.toDataURL("image/png");
}

function formatTick(v: number): string {
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return v.toFixed(0);
}
