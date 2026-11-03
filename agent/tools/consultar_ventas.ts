import { defineTool } from "eve/tools";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Esquema de entrada para la consulta de ventas.
 */
const querySalesInputSchema = z.object({
  fecha_inicio: z
    .string()
    .describe("Fecha inicial en formato ISO YYYY-MM-DD (ej: 2026-10-01)"),
  fecha_fin: z
    .string()
    .describe("Fecha final en formato ISO YYYY-MM-DD (ej: 2026-10-31)"),
  producto_id: z
    .string()
    .uuid()
    .optional()
    .describe("UUID opcional de un producto para filtrar la busqueda"),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(50)
    .describe("Limite maximo de productos en el ranking (1-100)"),
});

export type QuerySalesInput = z.infer<typeof querySalesInputSchema>;

export interface ProductSalesSummary {
  product_id: string;
  product_name: string;
  unidades_vendidas: number;
  ingresos: number;
  porcentaje_del_total: number;
}

export interface QuerySalesOutput {
  total_ventas: number;
  total_unidades: number;
  num_transacciones: number;
  por_producto: ProductSalesSummary[];
  periodo: {
    inicio: string;
    fin: string;
  };
}

/**
 * Herramienta: consultar_ventas
 * Extrae y consolida las ventas registradas en un periodo determinado.
 */
export default defineTool({
  description:
    "Consulta ventas en un rango de fechas con desglose por producto, unidades vendidas y montos totales.",
  inputSchema: querySalesInputSchema,
  async execute(input: QuerySalesInput): Promise<QuerySalesOutput | { error: string }> {
    try {
      const startDate = `${input.fecha_inicio}T00:00:00.000Z`;
      const endDate = `${input.fecha_fin}T23:59:59.999Z`;

      let query = supabaseAdmin
        .from("sales")
        .select(
          `
          id,
          quantity,
          unit_price,
          total,
          sold_at,
          product_id,
          products (
            id,
            name
          )
        `
        )
        .gte("sold_at", startDate)
        .lte("sold_at", endDate);

      if (input.producto_id) {
        query = query.eq("product_id", input.producto_id);
      }

      const { data, error } = await query;

      if (error) {
        return { error: `Error al consultar ventas en la base de datos: ${error.message}` };
      }

      if (!data || data.length === 0) {
        return {
          total_ventas: 0,
          total_unidades: 0,
          num_transacciones: 0,
          por_producto: [],
          periodo: {
            inicio: input.fecha_inicio,
            fin: input.fecha_fin,
          },
        };
      }

      // Agregacion por producto en memoria
      const productMap = new Map<
        string,
        {
          name: string;
          units: number;
          revenue: number;
        }
      >();

      let totalSalesAmount = 0;
      let totalUnitsCount = 0;

      for (const sale of data) {
        const units = Number(sale.quantity) || 0;
        const total = Number(sale.total) || units * Number(sale.unit_price) || 0;
        const productId = sale.product_id;
        // Supabase join may return object or array depending on relation
        const productRelation = Array.isArray(sale.products)
          ? sale.products[0]
          : sale.products;
        const productName = productRelation?.name || "Producto no especificado";

        totalSalesAmount += total;
        totalUnitsCount += units;

        const existing = productMap.get(productId);
        if (existing) {
          existing.units += units;
          existing.revenue += total;
        } else {
          productMap.set(productId, {
            name: productName,
            units,
            revenue: total,
          });
        }
      }

      const productSummaries: ProductSalesSummary[] = Array.from(productMap.entries())
        .map(([productId, info]) => {
          const percentage =
            totalSalesAmount > 0
              ? Number(((info.revenue / totalSalesAmount) * 100).toFixed(2))
              : 0;

          return {
            product_id: productId,
            product_name: info.name,
            unidades_vendidas: info.units,
            ingresos: Number(info.revenue.toFixed(2)),
            porcentaje_del_total: percentage,
          };
        })
        .sort((a, b) => b.ingresos - a.ingresos)
        .slice(0, input.limit);

      return {
        total_ventas: Number(totalSalesAmount.toFixed(2)),
        total_unidades: totalUnitsCount,
        num_transacciones: data.length,
        por_producto: productSummaries,
        periodo: {
          inicio: input.fecha_inicio,
          fin: input.fecha_fin,
        },
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { error: `Excepcion no controlada en consultar_ventas: ${message}` };
    }
  },
});
