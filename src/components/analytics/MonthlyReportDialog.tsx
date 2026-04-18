import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  buildMonthlyReport,
  SECTION_LABELS,
  type ReportSection,
} from "@/lib/monthly-report";
import {
  exportReportPdf,
  exportReportXlsx,
  exportReportDocx,
  exportReportTex,
} from "@/lib/report-exporters";
import type {
  Item,
  Category,
  Supplier,
  StockMovement,
  PurchaseOrder,
} from "@/types/inventory";

type Format = "pdf" | "xlsx" | "docx" | "tex";

interface Props {
  items: Item[];
  categories: Category[];
  suppliers: Supplier[];
  movements: StockMovement[];
  purchaseOrders: PurchaseOrder[];
  /** When this number changes, the dialog auto-opens. */
  openSignal?: number;
}

const ALL_SECTIONS: ReportSection[] = [
  "summary",
  "movements",
  "suppliers",
  "forecast",
];

export function MonthlyReportDialog(props: Props) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<Format>("pdf");
  const [sections, setSections] = useState<Set<ReportSection>>(
    new Set(ALL_SECTIONS),
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (props.openSignal !== undefined && props.openSignal > 0) setOpen(true);
  }, [props.openSignal]);

  const toggle = (s: ReportSection) => {
    setSections((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  const handleGenerate = async () => {
    if (sections.size === 0) {
      toast.error("Selecione pelo menos uma seção");
      return;
    }
    setBusy(true);
    try {
      const data = buildMonthlyReport({
        items: props.items,
        categories: props.categories,
        suppliers: props.suppliers,
        movements: props.movements,
        purchaseOrders: props.purchaseOrders,
        sections: [...sections],
      });
      if (format === "pdf") await exportReportPdf(data);
      else if (format === "xlsx") await exportReportXlsx(data);
      else if (format === "docx") await exportReportDocx(data);
      else await exportReportTex(data);
      toast.success("Relatório gerado");
      setOpen(false);
    } catch (e) {
      console.error(e);
      toast.error("Falha ao gerar relatório");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default">
          <FileText className="mr-1.5 h-4 w-4" /> Relatório mensal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Relatório mensal</DialogTitle>
          <DialogDescription>
            Últimos 30 dias. Escolha o formato e as seções a incluir.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Formato</Label>
            <RadioGroup
              value={format}
              onValueChange={(v) => setFormat(v as Format)}
              className="grid grid-cols-4 gap-2"
            >
              {(["pdf", "xlsx", "docx", "tex"] as const).map((f) => (
                <Label
                  key={f}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-2 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <RadioGroupItem value={f} />
                  <span className="text-sm uppercase">{f}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Seções</Label>
            <div className="space-y-2">
              {ALL_SECTIONS.map((s) => (
                <Label
                  key={s}
                  className="flex cursor-pointer items-start gap-2 rounded-md border border-border p-2 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <Checkbox
                    checked={sections.has(s)}
                    onCheckedChange={() => toggle(s)}
                    className="mt-0.5"
                  />
                  <span className="text-sm">{SECTION_LABELS[s]}</span>
                </Label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={handleGenerate} disabled={busy}>
            {busy ? "Gerando…" : "Gerar relatório"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
