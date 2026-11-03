import { defineTool } from "eve/tools";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Esquema de entrada para el reporte consolidado de ganancias.
 */
const generateProfitReportInputSchema = z.object({
  fecha_inicio: z
    .string()
    .describe("Fecha inicial en formato ISO YYYY-MM-DD (ej: 2026-10-01)"),
  fecha_fin: z
    .string()
    .describe("Fecha final en formato ISO YYYY-MM-DD (ej: 2026-10-31)"),
});

export type GenerateProfitReportInput = z.infer<typeof generateProfitReportInputSchema>;

export interface GenerateProfitReportOutput {
  periodo: {
    inicio: string;
    fin: string;
  };
  ingresos_totales: number;
  costo_productos_vendidos: number;
  gastos_generales: number;
  ganancia_bruta: number;
  ganancia_neta: number;
  margen_bruto_pct: number;
  margen_neto_pct: number;
}

/**
 * Herramienta: generar_reporte_ganancias
 * Consolida ventas, costo de adquisicion de mercancia (COGS) y gastos operativos
 * para calcular los margenes de utilidad bruta y neta de la tienda.
 */
export default defineTool({
  description:
    "Genera un reporte financiero consolidado de ingresos, costos de mercancia, gastos y ganancias netas con porcentajes de margen.",
  inputSchema: generateProfitReportInputSchema,
  async execute(input: GenerateProfitReportInput): Promise<GenerateProfitReportOutput | { error: string }> {
    try {
      const startDateTime = `${input.fecha_inicio}T00:00:00.000Z`;
      const endDateTime = `${input.fecha_fin}T23:59:59.999Z`;

      // 1. Consultar ventas y costo de adquisicion asociado
      const { data: salesData, error: salesError } = await supabaseAdmin
        .from("sales")
        .select(
          `
          quantity,
          unit_price,
          total,
          products (
            cost_price
          )
        `
        )
        .gte("sold_at", startDateTime)
        .lte("sold_at", endDateTime);

      if (salesError) {
        return { error: `Error al consultar ventas para el balance: ${salesError.message}` };
      }

      let totalRevenue = 0;
      let totalCogs = 0;

      for (const sale of salesData || []) {
        const total = Number(sale.total) || 0;
        const quantity = Number(sale.quantity) || 0;
        const product = Array.isArray(sale.products) ? sale.products[0] : sale.products;
        const costPrice = Number(product?.cost_price) || 0;

        totalRevenue += total;
        totalCogs += quantity * costPrice;
      }

      // 2. Consultar gastos operativos del periodo
      const { data: expensesData, error: expensesError } = await supabaseAdmin
        .from("expenses")
        .select("amount")
        .gte("expense_date", input.fecha_inicio)
        .lte("expense_date", input.fecha_fin);

      if (expensesError) {
        return { error: `Error al consultar gastos para el balance: ${expensesError.message}` };
      }

      let totalExpenses = 0;
      for (const exp of expensesData || []) {
        totalExpenses += Number(exp.amount) || 0;
      }

      // 3. Calculos financieros
      const grossProfit = totalRevenue - totalCogs;
      const netProfit = grossProfit - totalExpenses;

      const grossMarginPct =
        totalRevenue > 0 ? Number(((grossProfit / totalRevenue) * 100).toFixed(2)) : 0;
      const netMarginPct =
        totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(2)) : 0;

      return {
        periodo: {
          inicio: input.fecha_inicio,
          fin: input.fecha_fin,
        },
        ingresos_totales: Number(totalRevenue.toFixed(2)),
        costo_productos_vendidos: Number(totalCogs.toFixed(2)),
        gastos_generales: Number(totalExpenses.toFixed(2)),
        ganancia_bruta: Number(grossProfit.toFixed(2)),
        ganancia_neta: Number(netProfit.toFixed(2)),
        margen_bruto_pct: grossMarginPct,
        margen_neto_pct: netMarginPct,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { error: `Excepcion no controlada en generar_reporte_ganancias: ${message}` };
    }
  },
});
