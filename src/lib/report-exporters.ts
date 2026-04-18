// Per-format exporters for the monthly report. Lazy-imports heavy libs.
import { saveAs } from "file-saver";
import { format } from "date-fns";
import type { ReportData } from "@/lib/monthly-report";
import { reportFilename } from "@/lib/monthly-report";
import { renderChartPng } from "@/lib/chart-renderer";

// Stackwise brand (teal primary, derived from oklch(0.55 0.17 162))
const BRAND = {
  rgb: [31, 140, 115] as [number, number, number],
  hex: "1F8C73",
  hexLight: "E8F5F1",
  hexDark: "0F4A3D",
};

function drawPdfHeader(doc: any, data: ReportData, pageW: number) {
  // Teal band
  doc.setFillColor(...BRAND.rgb);
  doc.rect(0, 0, pageW, 70, "F");
  // Wordmark — bold STACKWISE in white
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("STACKWISE", 40, 38);
  // Tagline
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(220, 240, 235);
  doc.text("Inventory Command Center", 40, 54);
  // Right-side document label
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("RELATÓRIO MENSAL", pageW - 40, 38, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(220, 240, 235);
  doc.text(data.periodLabel, pageW - 40, 52, { align: "right" });
  doc.setTextColor(0, 0, 0);
}

export async function exportReportPdf(data: ReportData): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  drawPdfHeader(doc, data, pageW);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(
    `Gerado em ${format(data.generatedAt, "dd/MM/yyyy HH:mm")}`,
    40,
    90,
  );
  doc.setTextColor(0);

  let y = 120;
  if (data.kpis.length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...BRAND.rgb.map((c) => Math.round(c * 0.6)) as [number, number, number]);
    doc.text("Resumo executivo", 40, y);
    doc.setTextColor(0);
    y += 10;
    autoTable(doc, {
      startY: y,
      head: [["Indicador", "Valor"]],
      body: data.kpis.map((k) => [k.label, k.value]),
      theme: "striped",
      headStyles: { fillColor: BRAND.rgb },
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
      drawPdfHeader(doc, data, pageW);
      y = 100;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...BRAND.rgb.map((c) => Math.round(c * 0.6)) as [number, number, number]);
    doc.text(t.title, 40, y);
    doc.setTextColor(0);
    y += 6;
    autoTable(doc, {
      startY: y + 4,
      head: [t.headers],
      body: t.rows.map((r) => r.map((v) => String(v))),
      theme: "grid",
      headStyles: { fillColor: BRAND.rgb },
      margin: { left: 40, right: 40 },
      styles: { fontSize: 9, cellPadding: 4 },
    });
    y =
      (doc as unknown as { lastAutoTable: { finalY: number } })
        .lastAutoTable.finalY + 24;
  }

  for (const c of data.charts) {
    const png = renderChartPng(c);
    const imgW = pageW - 80;
    const imgH = imgW * 0.4;
    if (y + imgH > 780) {
      doc.addPage();
      drawPdfHeader(doc, data, pageW);
      y = 100;
    }
    doc.addImage(png, "PNG", 40, y, imgW, imgH);
    y += imgH + 20;
  }

  // Footer with brand on every page
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    const ph = doc.internal.pageSize.getHeight();
    doc.setDrawColor(...BRAND.rgb);
    doc.setLineWidth(1);
    doc.line(40, ph - 28, pageW - 40, ph - 28);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text("Stackwise · Inventory Report", 40, ph - 16);
    doc.text(`página ${i}/${pages}`, pageW - 40, ph - 16, { align: "right" });
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
    ws.mergeCells("A1:B1");
    const title = ws.getCell("A1");
    title.value = "STACKWISE — Relatório Mensal";
    title.font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
    title.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: `FF${BRAND.hex}` },
    };
    title.alignment = { vertical: "middle", horizontal: "left" };
    ws.getRow(1).height = 28;
    ws.addRow([`Período: ${data.periodLabel}`]);
    ws.addRow([]);
    const head = ws.addRow(["Indicador", "Valor"]);
    head.font = { bold: true, color: { argb: "FFFFFFFF" } };
    head.eachCell((c) => {
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${BRAND.hex}` } };
    });
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
        fgColor: { argb: `FF${BRAND.hex}` },
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
    BorderStyle,
    ShadingType,
  } = docx;

  const headerCell = (text: string) =>
    new TableCell({
      shading: { fill: BRAND.hex, type: ShadingType.CLEAR, color: "auto" },
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

  // Branded banner table (1 row, full width, teal background)
  const brandBanner = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: BRAND.hex, type: ShadingType.CLEAR, color: "auto" },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "STACKWISE", bold: true, color: "FFFFFF", size: 40 }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Inventory Command Center · Relatório Mensal",
                    color: "DCF0EB",
                    size: 18,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const heading = (text: string) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text, color: BRAND.hexDark, bold: true })],
    });

  const children: Array<InstanceType<typeof Paragraph> | InstanceType<typeof Table>> = [
    brandBanner,
    new Paragraph({ text: "" }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
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
      heading("Resumo executivo"),
      buildTable(
        ["Indicador", "Valor"],
        data.kpis.map((k) => [k.label, k.value]),
      ),
      new Paragraph({ text: "" }),
    );
  }

  for (const t of data.tables) {
    children.push(
      heading(t.title),
      buildTable(t.headers, t.rows),
      new Paragraph({ text: "" }),
    );
  }

  const doc = new Document({
    creator: "Stackwise",
    title: "Relatório Mensal",
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, reportFilename("docx"));
}

// ============================================================
// LaTeX exporter — produces a standalone .tex source file.
// Uses article class + a teal-themed titlepage. Compiles with
// pdflatex on Overleaf or any local TeX distribution.
// ============================================================

function escapeTex(input: string | number): string {
  const s = String(input);
  return s
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

function texTable(headers: string[], rows: (string | number)[][]): string {
  const colSpec = headers.map(() => "l").join(" | ");
  const headerRow = headers.map((h) => `\\textbf{${escapeTex(h)}}`).join(" & ");
  const bodyRows = rows
    .map((r) => r.map((c) => escapeTex(c)).join(" & ") + " \\\\")
    .join("\n  \\hline\n  ");
  return [
    "\\begin{center}",
    `\\begin{tabular}{| ${colSpec} |}`,
    "  \\hline",
    `  \\rowcolor{stackwiseLight} ${headerRow} \\\\`,
    "  \\hline",
    `  ${bodyRows}`,
    "  \\hline",
    "\\end{tabular}",
    "\\end{center}",
  ].join("\n");
}

export async function exportReportTex(data: ReportData): Promise<void> {
  const lines: string[] = [];
  lines.push("\\documentclass[11pt,a4paper]{article}");
  lines.push("\\usepackage[utf8]{inputenc}");
  lines.push("\\usepackage[T1]{fontenc}");
  lines.push("\\usepackage[margin=2.2cm]{geometry}");
  lines.push("\\usepackage{xcolor}");
  lines.push("\\usepackage{colortbl}");
  lines.push("\\usepackage{tabularx}");
  lines.push("\\usepackage{fancyhdr}");
  lines.push("\\usepackage{titling}");
  lines.push("\\usepackage{helvet}");
  lines.push("\\renewcommand{\\familydefault}{\\sfdefault}");
  lines.push(`\\definecolor{stackwiseTeal}{RGB}{${BRAND.rgb.join(",")}}`);
  lines.push("\\definecolor{stackwiseLight}{RGB}{232,245,241}");
  lines.push("\\definecolor{stackwiseDark}{RGB}{15,74,61}");
  lines.push("\\pagestyle{fancy}");
  lines.push("\\fancyhf{}");
  lines.push(
    "\\fancyhead[L]{\\textcolor{stackwiseTeal}{\\textbf{STACKWISE}} \\textcolor{gray}{\\small Relatório Mensal}}",
  );
  lines.push("\\fancyhead[R]{\\textcolor{gray}{\\small \\thepage}}");
  lines.push("\\renewcommand{\\headrulewidth}{0.6pt}");
  lines.push("\\renewcommand{\\headrule}{\\hbox to\\headwidth{\\color{stackwiseTeal}\\leaders\\hrule height \\headrulewidth\\hfill}}");
  lines.push("\\begin{document}");

  // Title block (teal banner)
  lines.push("\\begin{center}");
  lines.push("\\colorbox{stackwiseTeal}{");
  lines.push("  \\begin{minipage}{0.96\\textwidth}");
  lines.push("    \\vspace{0.4cm}");
  lines.push("    \\color{white}");
  lines.push("    {\\Huge \\textbf{STACKWISE}}\\\\[2pt]");
  lines.push("    {\\small Inventory Command Center · Relatório Mensal}\\\\[6pt]");
  lines.push(`    {\\small Período: ${escapeTex(data.periodLabel)}}\\\\`);
  lines.push(
    `    {\\small Gerado em ${escapeTex(format(data.generatedAt, "dd/MM/yyyy HH:mm"))}}`,
  );
  lines.push("    \\vspace{0.4cm}");
  lines.push("  \\end{minipage}");
  lines.push("}");
  lines.push("\\end{center}");
  lines.push("\\vspace{0.6cm}");

  if (data.kpis.length) {
    lines.push("\\section*{\\textcolor{stackwiseDark}{Resumo executivo}}");
    lines.push(
      texTable(["Indicador", "Valor"], data.kpis.map((k) => [k.label, k.value])),
    );
  }

  for (const t of data.tables) {
    lines.push(`\\section*{\\textcolor{stackwiseDark}{${escapeTex(t.title)}}}`);
    lines.push(texTable(t.headers, t.rows));
  }

  if (data.charts.length) {
    lines.push("\\section*{\\textcolor{stackwiseDark}{Gráficos}}");
    lines.push(
      "\\textit{Os gráficos do relatório (tendências de estoque e movimentações diárias) estão disponíveis nas versões PDF, XLSX e DOCX. Esta versão LaTeX é editável — adicione \\texttt{\\textbackslash{}includegraphics} aqui se quiser embedar PNGs próprios.}",
    );
  }

  lines.push("\\end{document}");

  const tex = lines.join("\n");
  saveAs(
    new Blob([tex], { type: "application/x-tex;charset=utf-8" }),
    reportFilename("tex"),
  );
}
