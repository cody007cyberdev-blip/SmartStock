import { useEffect, useState } from "react";
import {
  getReplenishmentMode,
  setReplenishmentMode as persist,
  type ReplenishmentMode,
} from "@/lib/replenishment-settings";

export function useReplenishmentMode(): [ReplenishmentMode, (m: ReplenishmentMode) => void] {
  const [mode, setMode] = useState<ReplenishmentMode>(() => getReplenishmentMode());

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as ReplenishmentMode | undefined;
      if (detail) setMode(detail);
    };
    window.addEventListener("replenishment-mode-changed", handler);
    return () => window.removeEventListener("replenishment-mode-changed", handler);
  }, []);

  const update = (m: ReplenishmentMode) => {
    persist(m);
    setMode(m);
  };

  return [mode, update];
}
