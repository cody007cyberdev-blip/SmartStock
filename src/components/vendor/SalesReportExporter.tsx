import { useTranslation } from "react-i18next";
import { Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Sale } from "@/types/shopping-list";
import * as XLSX from "xlsx";

interface SalesReportExporterProps {
  sales: Sale[];
  filename?: string;
}

export function SalesReportExporter({ sales, filename = "relatorio-vendas" }: SalesReportExporterProps) {
  const { t } = useTranslation();

  const handleExportExcel = () => {
    try {
      // Prepare data for export
      const data = sales.map((sale) => ({
        "ID da Venda": sale.id,
        "Data": new Date(sale.createdAt).toLocaleString("pt-BR"),
        "ID do Cliente": sale.customerId,
        "Quantidade de Itens": sale.items.length,
        "Subtotal": `R$ ${sale.subtotal.toFixed(2)}`,
        "Imposto": `R$ ${sale.tax.toFixed(2)}`,
        "Total": `R$ ${sale.total.toFixed(2)}`,
        "Método de Pagamento": sale.paymentMethod,
        "Status": sale.status,
      }));

      // Create workbook
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Vendas");

      // Set column widths
      ws["!cols"] = [
        { wch: 15 },
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 20 },
        { wch: 15 },
      ];

      // Generate filename with date
      const date = new Date().toISOString().split("T")[0];
      const fullFilename = `${filename}-${date}.xlsx`;

      // Write file
      XLSX.writeFile(wb, fullFilename);
      toast.success(t("common.saved"));
    } catch (error) {
      toast.error(t("common.failed"));
    }
  };

  return (
    <Button
      onClick={handleExportExcel}
      disabled={sales.length === 0}
      variant="outline"
      className="gap-2 border-orange-200 text-orange-600 hover:bg-orange-50"
    >
      <FileSpreadsheet className="h-4 w-4" />
      {t("common.print")}
    </Button>
  );
}
