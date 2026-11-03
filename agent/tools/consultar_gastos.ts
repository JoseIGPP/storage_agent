import { defineTool } from "eve/tools";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Esquema de entrada para consultar los gastos operativos.
 */
const queryExpensesInputSchema = z.object({
  fecha_inicio: z
    .string()
    .describe("Fecha inicial en formato ISO YYYY-MM-DD (ej: 2026-10-01)"),
  fecha_fin: z
    .string()
    .describe("Fecha final en formato ISO YYYY-MM-DD (ej: 2026-10-31)"),
  categoria: z
    .string()
    .optional()
    .describe("Categoria opcional de gasto (ej: Servicios, Renta, Suministros, Limpieza)"),
});

export type QueryExpensesInput = z.infer<typeof queryExpensesInputSchema>;

export interface ExpenseCategorySummary {
  categoria: string;
  total: number;
  num_registros: number;
  porcentaje_del_total: number;
}

export interface ExpenseItem {
  id: string;
  categoria: string;
  description: string;
  amount: number;
  expense_date: string;
}

export interface QueryExpensesOutput {
  total_gastos: number;
  por_categoria: ExpenseCategorySummary[];
  detalle: ExpenseItem[];
  periodo: {
    inicio: string;
    fin: string;
  };
}

/**
 * Herramienta: consultar_gastos
 * Extrae y agrupa por categoria los egresos operativos en el rango de fechas solicitado.
 */
export default defineTool({
  description:
    "Consulta gastos operativos generales (luz, agua, renta, mantenimiento) en un rango de fechas con desglose por categoria.",
  inputSchema: queryExpensesInputSchema,
  async execute(input: QueryExpensesInput): Promise<QueryExpensesOutput | { error: string }> {
    try {
      let query = supabaseAdmin
        .from("expenses")
        .select("id, category, description, amount, expense_date")
        .gte("expense_date", input.fecha_inicio)
        .lte("expense_date", input.fecha_fin);

      if (input.categoria) {
        query = query.ilike("category", `%${input.categoria}%`);
      }

      const { data, error } = await query.order("expense_date", { ascending: false });

      if (error) {
        return { error: `Error al consultar gastos en Supabase: ${error.message}` };
      }

      if (!data || data.length === 0) {
        return {
          total_gastos: 0,
          por_categoria: [],
          detalle: [],
          periodo: {
            inicio: input.fecha_inicio,
            fin: input.fecha_fin,
          },
        };
      }

      const categoryMap = new Map<
        string,
        {
          total: number;
          count: number;
        }
      >();

      let overallExpenseTotal = 0;
      const detailItems: ExpenseItem[] = [];

      for (const row of data) {
        const amount = Number(row.amount) || 0;
        overallExpenseTotal += amount;

        const categoryKey = row.category || "Otros";
        const existing = categoryMap.get(categoryKey);

        if (existing) {
          existing.total += amount;
          existing.count += 1;
        } else {
          categoryMap.set(categoryKey, {
            total: amount,
            count: 1,
          });
        }

        detailItems.push({
          id: row.id,
          categoria: row.category,
          description: row.description,
          amount: Number(amount.toFixed(2)),
          expense_date: row.expense_date,
        });
      }

      const categorySummaries: ExpenseCategorySummary[] = Array.from(
        categoryMap.entries()
      ).map(([category, stats]) => {
        const pct =
          overallExpenseTotal > 0
            ? Number(((stats.total / overallExpenseTotal) * 100).toFixed(2))
            : 0;

        return {
          categoria: category,
          total: Number(stats.total.toFixed(2)),
          num_registros: stats.count,
          porcentaje_del_total: pct,
        };
      });

      return {
        total_gastos: Number(overallExpenseTotal.toFixed(2)),
        por_categoria: categorySummaries.sort((a, b) => b.total - a.total),
        detalle: detailItems,
        periodo: {
          inicio: input.fecha_inicio,
          fin: input.fecha_fin,
        },
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { error: `Excepcion no controlada en consultar_gastos: ${message}` };
    }
  },
});
