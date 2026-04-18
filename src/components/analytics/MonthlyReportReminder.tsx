import { useEffect, useState } from "react";
import { CalendarClock, X } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "stackwise.monthly-report.dismissed";

interface Props {
  onGenerate: () => void;
}

/**
 * Shows a soft reminder during the first 3 days of each month suggesting
 * that the user generate the previous month's report. Dismissable per-month.
 * (Demo-only — no real backend scheduling.)
 */
export function MonthlyReportReminder({ onGenerate }: Props) {
  const [visible, setVisible] = useState(false);
  const monthKey = format(new Date(), "yyyy-MM");

  useEffect(() => {
    const day = new Date().getDate();
    if (day > 3) return;
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY) === monthKey) return;
    setVisible(true);
  }, [monthKey]);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, monthKey);
    setVisible(false);
  };

  return (
    <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
      <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="flex-1">
        <p className="font-medium text-foreground">
          Hora do relatório mensal
        </p>
        <p className="text-xs text-muted-foreground">
          Início de mês — gere o relatório dos últimos 30 dias para arquivar
          ou enviar à equipe.
        </p>
      </div>
      <Button size="sm" variant="default" onClick={() => { onGenerate(); dismiss(); }}>
        Gerar agora
      </Button>
      <button
        type="button"
        onClick={dismiss}
        className="rounded-md p-1 text-muted-foreground hover:bg-muted"
        aria-label="Dispensar"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
