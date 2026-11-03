"use client";

/**
 * Página de Reportes Financieros y Exportación (/dashboard/reportes).
 * Permite filtrar por rango de fechas, consultar balances consolidados
 * y exportar a PDF estructurado y Excel (.xlsx) directamente en el navegador.
 */

import React, { useState, useEffect, useCallback } from "react";
import { formatCurrency, formatPercent, formatDate } from "@/lib/utils/formatters";
import {
  exportReportToPDF,
  exportReportToExcel,
  FinancialSummaryData,
  ProductReportRow,
  ExpenseReportRow,
} from "@/lib/utils/export";
import {
  BarChart3,
  Calendar,
  FileText,
  FileSpreadsheet,
  DollarSign,
  TrendingUp,
  CreditCard,
  Percent,
  RefreshCw,
} from "lucide-react";

export default function ReportsPage(): React.ReactElement {
  // Rango de fechas por defecto: Primer día del mes actual hasta hoy
  const today = new Date().toISOString().split("T")[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split("T")[0];

  const [dateRange, setDateRange] = useState({
    from: firstDayOfMonth,
    to: today,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<FinancialSummaryData>({
    periodLabel: "",
    totalSales: 0,
    totalExpenses: 0,
    grossProfit: 0,
    netProfit: 0,
    profitMarginPercent: 0,
    salesCount: 0,
  });
  const [topProducts, setTopProducts] = useState<ProductReportRow[]>([]);
  const [expenses, setExpenses] = useState<ExpenseReportRow[]>([]);

  const fetchFinancialData = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const [salesRes, expensesRes, productsRes] = await Promise.all([
        fetch(`/api/sales?fecha_desde=${dateRange.from}&fecha_hasta=${dateRange.to}&limit=500`),
        fetch(`/api/expenses?fecha_desde=${dateRange.from}&fecha_hasta=${dateRange.to}&limit=500`),
        fetch("/api/products?limit=100"),
      ]);

      const salesJson = salesRes.ok ? await salesRes.json() : { data: [] };
      const expensesJson = expensesRes.ok ? await expensesRes.json() : { data: [] };
      const productsJson = productsRes.ok ? await productsRes.json() : { data: [] };

      const salesList = salesJson.data || [];
      const expensesList = expensesJson.data || [];
      const productsCatalog = productsJson.data || [];

      // Mapeo de costos de productos
      const costMap = new Map<string, number>();
      const stockMap = new Map<string, { name: string; category: string; stock: number }>();
      productsCatalog.forEach(
        (p: {
          id: string;
          nombre: string;
          categoria: string;
          precio_costo: number;
          stock_actual: number;
        }) => {
          costMap.set(p.id, Number(p.precio_costo) || 0);
          stockMap.set(p.id, {
            name: p.nombre,
            category: p.categoria,
            stock: p.stock_actual,
          });
        }
      );

      // Agregación de ventas y costo de mercancía vendida
      let totalSales = 0;
      let totalCostOfGoodsSold = 0;
      const productSalesAgg = new Map<
        string,
        { name: string; category: string; units: number; revenue: number; stock: number }
      >();

      salesList.forEach(
        (s: {
          producto_id: string;
          cantidad: number;
          precio_unitario: number;
          total: number;
          products?: { nombre: string; categoria: string };
        }) => {
          const qty = Number(s.cantidad) || 0;
          const unitPrice = Number(s.precio_unitario) || 0;
          const lineTotal = Number(s.total) || qty * unitPrice;
          const unitCost = costMap.get(s.producto_id) || 0;

          totalSales += lineTotal;
          totalCostOfGoodsSold += unitCost * qty;

          const prodInfo = stockMap.get(s.producto_id);
          const name = prodInfo?.name || s.products?.nombre || "Producto";
          const category = prodInfo?.category || s.products?.categoria || "General";
          const currentStock = prodInfo?.stock || 0;

          const existing = productSalesAgg.get(s.producto_id);
          if (existing) {
            existing.units += qty;
            existing.revenue += lineTotal;
          } else {
            productSalesAgg.set(s.producto_id, {
              name,
              category,
              units: qty,
              revenue: lineTotal,
              stock: currentStock,
            });
          }
        }
      );

      // Gastos
      let totalExpenses = 0;
      const formattedExpenses: ExpenseReportRow[] = expensesList.map(
        (e: { fecha: string; descripcion: string; categoria: string; monto: number }) => {
          const amt = Number(e.monto) || 0;
          totalExpenses += amt;
          return {
            date: e.fecha || "",
            description: e.descripcion || "Gasto",
            category: e.categoria || "Operativo",
            amount: amt,
          };
        }
      );

      const grossProfit = totalSales - totalCostOfGoodsSold;
      const netProfit = grossProfit - totalExpenses;
      const profitMarginPercent = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

      const topProductsList: ProductReportRow[] = Array.from(productSalesAgg.values())
        .sort((a, b) => b.units - a.units)
        .slice(0, 15)
        .map((p) => ({
          name: p.name,
          category: p.category,
          unitsSold: p.units,
          totalRevenue: p.revenue,
          currentStock: p.stock,
        }));

      setSummary({
        periodLabel: `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`,
        totalSales,
        totalExpenses,
        grossProfit,
        netProfit,
        profitMarginPercent,
        salesCount: salesList.length,
      });

      setTopProducts(topProductsList);
      setExpenses(formattedExpenses);
    } catch (err) {
      console.error("Error al generar reporte financiero:", err);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    void fetchFinancialData();
  }, [fetchFinancialData]);

  return (
    <div className="space-y-6">
      {/* Cabecera y Botones de Exportación */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-emerald-400" />
            Reportes Financieros
          </h1>
          <p className="text-sm text-slate-400">
            Análisis de ingresos, egresos operativos, rentabilidad neta y exportación de balances.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Botón Exportar PDF */}
          <button
            onClick={() => exportReportToPDF(summary, topProducts, expenses)}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors disabled:opacity-50"
            title="Descargar informe en PDF"
          >
            <FileText className="w-4 h-4 text-rose-400" />
            <span>Exportar PDF</span>
          </button>

          {/* Botón Exportar Excel */}
          <button
            onClick={() => exportReportToExcel(summary, topProducts, expenses)}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors disabled:opacity-50"
            title="Descargar libro en Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>

      {/* Selector de Rango de Fechas */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>Rango de consulta:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Desde:</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="bg-slate-950 text-white px-3 py-1.5 rounded-lg border border-slate-800 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Hasta:</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="bg-slate-950 text-white px-3 py-1.5 rounded-lg border border-slate-800 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            onClick={() => void fetchFinancialData()}
            className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30"
            title="Actualizar reporte"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Tarjetas de Balance Financiero */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Ventas Totales</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">
            {formatCurrency(summary.totalSales)}
          </p>
          <p className="text-xs text-slate-400 mt-1">{summary.salesCount} transacciones</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Gastos Operativos</span>
            <CreditCard className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">
            {formatCurrency(summary.totalExpenses)}
          </p>
          <p className="text-xs text-slate-400 mt-1">{expenses.length} gastos registrados</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Ganancia Neta</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p
            className={`text-2xl font-bold mt-2 ${
              summary.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {formatCurrency(summary.netProfit)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Margen final descontando egresos</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Margen Neto</span>
            <Percent className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-blue-400 mt-2">
            {formatPercent(summary.profitMarginPercent)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Porcentaje de rentabilidad sobre venta</p>
        </div>
      </div>

      {/* Tablas Detalladas: Productos y Gastos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tabla Productos */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="p-4 bg-slate-950 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-white">Productos Más Vendidos en el Período</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3 text-center">Unidades</th>
                  <th className="px-4 py-3 text-right">Total Generado</th>
                  <th className="px-4 py-3 text-center">Stock Actual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {topProducts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                      No hay ventas registradas en el período seleccionado.
                    </td>
                  </tr>
                ) : (
                  topProducts.map((p, i) => (
                    <tr key={i} className="hover:bg-slate-800/40">
                      <td className="px-4 py-2.5 font-medium text-white">{p.name}</td>
                      <td className="px-4 py-2.5 text-center font-bold text-emerald-400">
                        {p.unitsSold}
                      </td>
                      <td className="px-4 py-2.5 text-right">{formatCurrency(p.totalRevenue)}</td>
                      <td className="px-4 py-2.5 text-center text-slate-400">{p.currentStock}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabla Gastos */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="p-4 bg-slate-950 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-white">Gastos Operativos en el Período</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Descripción</th>
                  <th className="px-4 py-3 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                      No hay gastos registrados en el período seleccionado.
                    </td>
                  </tr>
                ) : (
                  expenses.slice(0, 10).map((e, i) => (
                    <tr key={i} className="hover:bg-slate-800/40">
                      <td className="px-4 py-2.5 text-slate-400">{formatDate(e.date)}</td>
                      <td className="px-4 py-2.5 text-slate-300">{e.category}</td>
                      <td className="px-4 py-2.5 font-medium text-white truncate max-w-[150px]">
                        {e.description}
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-rose-400">
                        {formatCurrency(e.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
