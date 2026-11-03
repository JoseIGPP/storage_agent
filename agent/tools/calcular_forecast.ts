import { defineTool } from "eve/tools";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Esquema de entrada para el calculo de pronostico de ganancias.
 */
const calculateForecastInputSchema = z.object({
  n_meses: z
    .number()
    .int()
    .min(1)
    .max(12)
    .default(3)
    .describe("Numero de meses pasados a considerar para el promedio movil (1 a 12, default 3)"),
  producto_id: z
    .string()
    .uuid()
    .optional()
    .describe("UUID opcional de producto si se desea pronostico individual"),
});

export type CalculateForecastInput = z.infer<typeof calculateForecastInputSchema>;

export interface MonthlyFinancialRecord {
  mes: string; // Formato YYYY-MM
  ingresos: number;
  costo_mercancia: number;
  gastos: number;
  ganancia_neta: number;
}

export interface CalculateForecastOutput {
  historico: MonthlyFinancialRecord[];
  promedio_movil: {
    ingresos: number;
    gastos: number;
    ganancia_neta: number;
  };
  estimacion_proximo_mes: {
    mes: string;
    ganancia_estimada: number;
    tendencia_porcentaje: number;
    confiabilidad: "baja" | "media" | "alta";
  };
  n_meses_usados: number;
}

/**
 * Obtiene los limites de fecha (inicio y fin) para los ultimos N meses cerrados.
 */
function getHistoricalMonthRanges(monthCount: number): Array<{
  key: string;
  startDate: string;
  endDate: string;
}> {
  const ranges: Array<{ key: string; startDate: string; endDate: string }> = [];
  const currentDate = new Date();

  for (let i = monthCount; i >= 1; i--) {
    const targetDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - i,
      1
    );
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, "0");
    const monthKey = `${year}-${month}`;

    const start = `${year}-${month}-01T00:00:00.000Z`;
    // Ultimo dia del mes
    const lastDayNumber = new Date(year, targetDate.getMonth() + 1, 0).getDate();
    const end = `${year}-${month}-${String(lastDayNumber).padStart(2, "0")}T23:59:59.999Z`;

    ranges.push({
      key: monthKey,
      startDate: start,
      endDate: end,
    });
  }

  return ranges;
}

/**
 * Calcula el siguiente mes en formato YYYY-MM.
 */
function getNextMonthKey(): string {
  const nextDate = new Date();
  nextDate.setMonth(nextDate.getMonth() + 1);
  const year = nextDate.getFullYear();
  const month = String(nextDate.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Herramienta: calcular_forecast
 * Calcula el promedio movil de ingresos, costos y ganancias de los ultimos N meses
 * y proyecta el resultado para el siguiente mes con un modelo suavizado de tendencia.
 */
export default defineTool({
  description:
    "Estima ganancias futuras del proximo mes basandose en el promedio movil y tendencia de los ultimos N meses cerrados.",
  inputSchema: calculateForecastInputSchema,
  async execute(input: CalculateForecastInput): Promise<CalculateForecastOutput | { error: string }> {
    try {
      const monthRanges = getHistoricalMonthRanges(input.n_meses);
      const monthlyRecords: MonthlyFinancialRecord[] = [];

      for (const range of monthRanges) {
        // 1. Consultar ventas y costo de mercancia del mes
        let salesQuery = supabaseAdmin
          .from("sales")
          .select(
            `
            quantity,
            total,
            products (
              cost_price
            )
          `
          )
          .gte("sold_at", range.startDate)
          .lte("sold_at", range.endDate);

        if (input.producto_id) {
          salesQuery = salesQuery.eq("product_id", input.producto_id);
        }

        const { data: salesData, error: salesError } = await salesQuery;

        if (salesError) {
          return { error: `Error al consultar ventas para el mes ${range.key}: ${salesError.message}` };
        }

        let monthRevenue = 0;
        let monthCogs = 0;

        if (salesData) {
          for (const s of salesData) {
            const total = Number(s.total) || 0;
            const quantity = Number(s.quantity) || 0;
            const product = Array.isArray(s.products) ? s.products[0] : s.products;
            const costPrice = Number(product?.cost_price) || 0;

            monthRevenue += total;
            monthCogs += quantity * costPrice;
          }
        }

        // 2. Consultar gastos operativos del mes (solo aplicable al total de la tienda)
        let monthExpenses = 0;
        if (!input.producto_id) {
          const dateOnlyStart = range.startDate.slice(0, 10);
          const dateOnlyEnd = range.endDate.slice(0, 10);

          const { data: expensesData, error: expensesError } = await supabaseAdmin
            .from("expenses")
            .select("amount")
            .gte("expense_date", dateOnlyStart)
            .lte("expense_date", dateOnlyEnd);

          if (expensesError) {
            return { error: `Error al consultar gastos para el mes ${range.key}: ${expensesError.message}` };
          }

          if (expensesData) {
            for (const exp of expensesData) {
              monthExpenses += Number(exp.amount) || 0;
            }
          }
        }

        const netProfit = monthRevenue - monthCogs - monthExpenses;

        monthlyRecords.push({
          mes: range.key,
          ingresos: Number(monthRevenue.toFixed(2)),
          costo_mercancia: Number(monthCogs.toFixed(2)),
          gastos: Number(monthExpenses.toFixed(2)),
          ganancia_neta: Number(netProfit.toFixed(2)),
        });
      }

      // 3. Calculo del promedio movil
      const totalRevenueSum = monthlyRecords.reduce((acc, r) => acc + r.ingresos, 0);
      const totalExpensesSum = monthlyRecords.reduce(
        (acc, r) => acc + r.costo_mercancia + r.gastos,
        0
      );
      const totalNetProfitSum = monthlyRecords.reduce((acc, r) => acc + r.ganancia_neta, 0);
      const monthsCount = monthlyRecords.length || 1;

      const avgRevenue = totalRevenueSum / monthsCount;
      const avgExpenses = totalExpensesSum / monthsCount;
      const avgNetProfit = totalNetProfitSum / monthsCount;

      // 4. Calculo de tendencia porcentual
      const firstMonth = monthlyRecords[0];
      const lastMonth = monthlyRecords[monthlyRecords.length - 1];
      let trendPercentage = 0;

      if (firstMonth && lastMonth && firstMonth.ganancia_neta !== 0) {
        trendPercentage =
          ((lastMonth.ganancia_neta - firstMonth.ganancia_neta) /
            Math.abs(firstMonth.ganancia_neta)) *
          100;
      }

      // Proyeccion suavizada (50% de la tendencia aplicada)
      const smoothedMultiplier = 1 + (trendPercentage / 100) * 0.5;
      const projectedProfit = avgNetProfit * smoothedMultiplier;

      // Determinacion de confiabilidad
      let reliability: "baja" | "media" | "alta" = "media";
      if (monthlyRecords.length >= 3 && Math.abs(trendPercentage) <= 25) {
        reliability = "alta";
      } else if (monthlyRecords.length < 2 || Math.abs(trendPercentage) > 50) {
        reliability = "baja";
      }

      return {
        historico: monthlyRecords,
        promedio_movil: {
          ingresos: Number(avgRevenue.toFixed(2)),
          gastos: Number(avgExpenses.toFixed(2)),
          ganancia_neta: Number(avgNetProfit.toFixed(2)),
        },
        estimacion_proximo_mes: {
          mes: getNextMonthKey(),
          ganancia_estimada: Number(projectedProfit.toFixed(2)),
          tendencia_porcentaje: Number(trendPercentage.toFixed(2)),
          confiabilidad: reliability,
        },
        n_meses_usados: monthsCount,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { error: `Excepcion no controlada en calcular_forecast: ${message}` };
    }
  },
});
