/**
 * Utilidades para exportación de reportes y balances en el cliente.
 * Soporta generación de PDF estructurado (jsPDF) y libros de cálculo Excel (XLSX).
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export interface FinancialSummaryData {
  periodLabel: string;
  totalSales: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
  profitMarginPercent: number;
  salesCount: number;
}

export interface ProductReportRow {
  name: string;
  category: string;
  unitsSold: number;
  totalRevenue: number;
  currentStock: number;
}

export interface ExpenseReportRow {
  date: string;
  description: string;
  category: string;
  amount: number;
}

/**
 * Genera y descarga un informe financiero en formato PDF listo para impresión
 */
export function exportReportToPDF(
  summary: FinancialSummaryData,
  topProducts: ProductReportRow[],
  expenses: ExpenseReportRow[]
): void {
  const doc = new jsPDF();

  // Encabezado institucional
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.text("Agente Bodega - Informe Financiero", 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text(`Período: ${summary.periodLabel}`, 14, 27);
  doc.text(`Fecha de emisión: ${new Date().toLocaleDateString("es-PE")}`, 14, 32);

  // Línea separadora
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 36, 196, 36);

  // Tabla de Resumen Ejecutivo
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text("Resumen Financiero", 14, 44);

  const summaryRows = [
    ["Ventas Totales", `S/ ${summary.totalSales.toFixed(2)}`],
    ["Gastos Operativos", `S/ ${summary.totalExpenses.toFixed(2)}`],
    ["Ganancia Neta Estimada", `S/ ${summary.netProfit.toFixed(2)}`],
    ["Margen Neto", `${summary.profitMarginPercent.toFixed(1)}%`],
    ["Transacciones Registradas", `${summary.salesCount}`],
  ];

  autoTable(doc, {
    startY: 48,
    head: [["Métrica", "Valor"]],
    body: summaryRows,
    theme: "striped",
    headStyles: { fillColor: [16, 185, 129] }, // Emerald-500
    styles: { fontSize: 10, cellPadding: 3 },
  });

  // Tabla de Productos Más Vendidos
  const currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text("Productos Destacados", 14, currentY);

  const productRows = topProducts.map((p) => [
    p.name,
    p.category,
    `${p.unitsSold}`,
    `S/ ${p.totalRevenue.toFixed(2)}`,
    `${p.currentStock}`,
  ]);

  autoTable(doc, {
    startY: currentY + 4,
    head: [["Producto", "Categoría", "Unidades", "Ingresos", "Stock"]],
    body: productRows,
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246] }, // Blue-500
    styles: { fontSize: 9, cellPadding: 2.5 },
  });

  // Si hay gastos, agregar tabla de gastos
  if (expenses.length > 0) {
    const expensesY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
    if (expensesY < 250) {
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text("Desglose de Gastos Operativos", 14, expensesY);

      const expenseTableRows = expenses.slice(0, 10).map((e) => [
        e.date,
        e.category,
        e.description,
        `S/ ${e.amount.toFixed(2)}`,
      ]);

      autoTable(doc, {
        startY: expensesY + 4,
        head: [["Fecha", "Categoría", "Descripción", "Monto"]],
        body: expenseTableRows,
        theme: "striped",
        headStyles: { fillColor: [239, 68, 68] }, // Red-500
        styles: { fontSize: 9, cellPadding: 2.5 },
      });
    }
  }

  // Descarga del documento en el navegador
  const fileName = `informe-bodega-${Date.now()}.pdf`;
  doc.save(fileName);
}

/**
 * Genera y descarga un libro de cálculo Excel (.xlsx) con pestañas separadas
 */
export function exportReportToExcel(
  summary: FinancialSummaryData,
  topProducts: ProductReportRow[],
  expenses: ExpenseReportRow[]
): void {
  const workbook = XLSX.utils.book_new();

  // Hoja 1: Resumen General
  const summarySheetData = [
    ["AGENTE BODEGA - REPORTE GENERAL"],
    ["Período", summary.periodLabel],
    ["Fecha de Generación", new Date().toLocaleString("es-PE")],
    [],
    ["Métrica", "Monto / Cantidad"],
    ["Ventas Totales (S/)", summary.totalSales],
    ["Gastos Operativos (S/)", summary.totalExpenses],
    ["Ganancia Neta (S/)", summary.netProfit],
    ["Margen de Ganancia (%)", summary.profitMarginPercent],
    ["Número de Ventas", summary.salesCount],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summarySheetData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumen");

  // Hoja 2: Productos
  const productsSheetData = [
    ["Producto", "Categoría", "Unidades Vendidas", "Ingresos Totales (S/)", "Stock Actual"],
    ...topProducts.map((p) => [p.name, p.category, p.unitsSold, p.totalRevenue, p.currentStock]),
  ];
  const productsSheet = XLSX.utils.aoa_to_sheet(productsSheetData);
  XLSX.utils.book_append_sheet(workbook, productsSheet, "Productos");

  // Hoja 3: Gastos
  if (expenses.length > 0) {
    const expensesSheetData = [
      ["Fecha", "Categoría", "Descripción", "Monto (S/)"],
      ...expenses.map((e) => [e.date, e.category, e.description, e.amount]),
    ];
    const expensesSheet = XLSX.utils.aoa_to_sheet(expensesSheetData);
    XLSX.utils.book_append_sheet(workbook, expensesSheet, "Gastos");
  }

  // Descargar archivo
  const fileName = `balance-bodega-${Date.now()}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
