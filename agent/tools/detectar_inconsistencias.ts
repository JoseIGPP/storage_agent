import { defineTool } from "eve/tools";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Esquema de entrada para la deteccion de inconsistencias de stock.
 */
const detectInconsistenciesInputSchema = z.object({
  umbral_diferencia: z
    .number()
    .int()
    .min(0)
    .default(0)
    .describe("Diferencia minima absoluta de unidades para reportar una inconsistencia (0 reporta todo)"),
});

export type DetectInconsistenciesInput = z.infer<typeof detectInconsistenciesInputSchema>;

export interface StockDiscrepancyItem {
  product_id: string;
  product_name: string;
  stock_actual: number;
  total_compras: number;
  total_ventas: number;
  stock_teorico: number;
  diferencia: number;
  porcentaje_diferencia: number;
}

export interface DetectInconsistenciesOutput {
  total_productos_revisados: number;
  inconsistencias_encontradas: number;
  inconsistencias: StockDiscrepancyItem[];
  sin_inconsistencias: boolean;
}

/**
 * Herramienta: detectar_inconsistencias
 * Audita las discrepancias entre el stock actual en tabla y el balance teorico acumulado (compras - ventas).
 */
export default defineTool({
  description:
    "Audita el inventario comparando el stock actual registrado contra el acumulado de compras y ventas de cada producto para detectar anomalias.",
  inputSchema: detectInconsistenciesInputSchema,
  async execute(input: DetectInconsistenciesInput): Promise<DetectInconsistenciesOutput | { error: string }> {
    try {
      // 1. Obtener todos los productos
      const { data: products, error: productsError } = await supabaseAdmin
        .from("products")
        .select("id, name, stock_quantity");

      if (productsError) {
        return { error: `Error al consultar catalogo de productos: ${productsError.message}` };
      }

      if (!products || products.length === 0) {
        return {
          total_productos_revisados: 0,
          inconsistencias_encontradas: 0,
          inconsistencias: [],
          sin_inconsistencias: true,
        };
      }

      // 2. Obtener acumulado de compras por producto
      const { data: purchasesData, error: purchasesError } = await supabaseAdmin
        .from("purchases")
        .select("product_id, quantity");

      if (purchasesError) {
        return { error: `Error al consultar historial de compras: ${purchasesError.message}` };
      }

      // 3. Obtener acumulado de ventas por producto
      const { data: salesData, error: salesError } = await supabaseAdmin
        .from("sales")
        .select("product_id, quantity");

      if (salesError) {
        return { error: `Error al consultar historial de ventas: ${salesError.message}` };
      }

      // Mapear totales de compras
      const purchaseTotals = new Map<string, number>();
      for (const p of purchasesData || []) {
        const qty = Number(p.quantity) || 0;
        purchaseTotals.set(p.product_id, (purchaseTotals.get(p.product_id) || 0) + qty);
      }

      // Mapear totales de ventas
      const saleTotals = new Map<string, number>();
      for (const s of salesData || []) {
        const qty = Number(s.quantity) || 0;
        saleTotals.set(s.product_id, (saleTotals.get(s.product_id) || 0) + qty);
      }

      const discrepancies: StockDiscrepancyItem[] = [];

      for (const product of products) {
        const actualStock = Number(product.stock_quantity) || 0;
        const totalPurchased = purchaseTotals.get(product.id) || 0;
        const totalSold = saleTotals.get(product.id) || 0;

        // Balance teorico basado en transacciones
        const theoreticalBalance = totalPurchased - totalSold;
        const difference = actualStock - theoreticalBalance;

        if (Math.abs(difference) > input.umbral_diferencia) {
          const denominator = theoreticalBalance === 0 ? actualStock || 1 : Math.abs(theoreticalBalance);
          const percentDiff = Number(((difference / denominator) * 100).toFixed(2));

          discrepancies.push({
            product_id: product.id,
            product_name: product.name,
            stock_actual: actualStock,
            total_compras: totalPurchased,
            total_ventas: totalSold,
            stock_teorico: theoreticalBalance,
            diferencia: difference,
            porcentaje_diferencia: percentDiff,
          });
        }
      }

      return {
        total_productos_revisados: products.length,
        inconsistencias_encontradas: discrepancies.length,
        inconsistencias: discrepancies,
        sin_inconsistencias: discrepancies.length === 0,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { error: `Excepcion no controlada en detectar_inconsistencias: ${message}` };
    }
  },
});
