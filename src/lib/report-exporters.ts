// Per-format exporters for the monthly report. Lazy-imports heavy libs.
import { saveAs } from "file-saver";
import { format } from "date-fns";
import type { ReportData } from "@/lib/monthly-report";
import { reportFilename } from "@/lib/monthly-report";

export async function exportReportPdf(data: ReportData): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Relatório Mensal — Stackwise", 40, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Período: ${data.periodLabel}`, 40, 68);
  doc.text(
    `Gerado em ${format(data.generatedAt, "dd/MM/yyyy HH:mm")}`,
    40,
    82,
  );
  doc.setTextColor(0);

  let y = 110;
  if (data.kpis.length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Resumo executivo", 40, y);
    y += 10;
    autoTable(doc, {
      startY: y,
      head: [["Indicador", "Valor"]],
      body: data.kpis.map((k) => [k.label, k.value]),
      theme: "striped",
      headStyles: { fillColor: [40, 90, 80] },
      margin: { left: 40, right: 40 },
      styles: { fontSize: 10 },
    });
    y =
      (doc as unknown as { lastAutoTable: { finalY: number } })
        .lastAutoTable.finalY + 24;
  }

  for (const t of data.tables) {
    if (y > 720) {
      doc.addPage();
      y = 50;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(t.title, 40, y);
    y += 6;
    autoTable(doc, {
      startY: y + 4,
      head: [t.headers],
      body: t.rows.map((r) => r.map((v) => String(v))),
      theme: "grid",
      headStyles: { fillColor: [40, 90, 80] },
      margin: { left: 40, right: 40 },
      styles: { fontSize: 9, cellPadding: 4 },
    });
    y =
      (doc as unknown as { lastAutoTable: { finalY: number } })
        .lastAutoTable.finalY + 24;
  }

  // footer page numbers
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Stackwise · página ${i}/${pages}`,
      pageW - 40,
      doc.internal.pageSize.getHeight() - 20,
      { align: "right" },
    );
  }

  doc.save(reportFilename("pdf"));
}

export async function exportReportXlsx(data: ReportData): Promise<void> {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Stackwise";
  wb.created = data.generatedAt;

  if (data.kpis.length) {
    const ws = wb.addWorksheet("Resumo");
    ws.addRow(["Relatório Mensal — Stackwise"]);
    ws.getCell("A1").font = { bold: true, size: 14 };
    ws.addRow([`Período: ${data.periodLabel}`]);
    ws.addRow([]);
    ws.addRow(["Indicador", "Valor"]).font = { bold: true };
    data.kpis.forEach((k) => ws.addRow([k.label, k.value]));
    ws.columns = [{ width: 30 }, { width: 22 }];
  }

  for (const t of data.tables) {
    const ws = wb.addWorksheet(t.title.slice(0, 31));
    const header = ws.addRow(t.headers);
    header.font = { bold: true, color: { argb: "FFFFFFFF" } };
    header.eachCell((c) => {
      c.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF285A50" },
      };
    });
    t.rows.forEach((r) => ws.addRow(r));
    ws.columns = t.headers.map(() => ({ width: 22 }));
  }

  const buf = await wb.xlsx.writeBuffer();
  saveAs(
    new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    reportFilename("xlsx"),
  );
}

export async function exportReportDocx(data: ReportData): Promise<void> {
  const docx = await import("docx");
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    Table,
    TableRow,
    TableCell,
    WidthType,
    AlignmentType,
  } = docx;

  const headerCell = (text: string) =>
    new TableCell({
      width: { size: 100 / 8, type: WidthType.PERCENTAGE },
      shading: { fill: "285A50", type: "clear", color: "auto" },
      children: [
        new Paragraph({
          children: [
            new TextRun({ text, bold: true, color: "FFFFFF", size: 20 }),
          ],
        }),
      ],
    });

  const bodyCell = (text: string) =>
    new TableCell({
      children: [
        new Paragraph({ children: [new TextRun({ text, size: 20 })] }),
      ],
    });

  const buildTable = (headers: string[], rows: (string | number)[][]) =>
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: headers.map(headerCell) }),
        ...rows.map(
          (r) =>
            new TableRow({ children: r.map((c) => bodyCell(String(c))) }),
        ),
      ],
    });

  const children: InstanceType<typeof Paragraph>[] | unknown[] = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.LEFT,
      children: [new TextRun({ text: "Relatório Mensal — Stackwise" })],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Período: ${data.periodLabel}`,
          italics: true,
          color: "666666",
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Gerado em ${format(data.generatedAt, "dd/MM/yyyy HH:mm")}`,
          italics: true,
          color: "666666",
        }),
      ],
    }),
    new Paragraph({ text: "" }),
  ];

  if (data.kpis.length) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: "Resumo executivo" })],
      }),
      buildTable(
        ["Indicador", "Valor"],
        data.kpis.map((k) => [k.label, k.value]),
      ),
      new Paragraph({ text: "" }),
    );
  }

  for (const t of data.tables) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: t.title })],
      }),
      buildTable(t.headers, t.rows),
      new Paragraph({ text: "" }),
    );
  }

  const doc = new Document({
    creator: "Stackwise",
    title: "Relatório Mensal",
    sections: [{ children: children as InstanceType<typeof Paragraph>[] }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, reportFilename("docx"));
}
