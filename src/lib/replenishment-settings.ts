// Replenishment mode setting — controls how reorder suggestions are computed.
// Stored in localStorage for the demo; in a backend version this would live in
// a settings table.

export type ReplenishmentMode = "manual" | "mixed" | "ai";

const STORAGE_KEY = "stackwise.replenishment-mode";
const DEFAULT_MODE: ReplenishmentMode = "mixed";

const VALID: ReplenishmentMode[] = ["manual", "mixed", "ai"];

export function getReplenishmentMode(): ReplenishmentMode {
  if (typeof window === "undefined") return DEFAULT_MODE;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v && (VALID as string[]).includes(v)) return v as ReplenishmentMode;
  } catch {
    /* ignore */
  }
  return DEFAULT_MODE;
}

export function setReplenishmentMode(mode: ReplenishmentMode): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
    window.dispatchEvent(new CustomEvent("replenishment-mode-changed", { detail: mode }));
  } catch {
    /* ignore */
  }
}

export const REPLENISHMENT_MODE_DESCRIPTIONS: Record<ReplenishmentMode, string> = {
  manual:
    "Use the reorder point and quantity you set on each item. No automatic suggestions.",
  mixed:
    "Combine your manual values with statistical suggestions. The system flags discrepancies but never overrides your choices.",
  ai: "Apply ML-based forecasting (Holt-Winters with seasonality) to drive suggested reorder points and replenishment quantities automatically.",
};
