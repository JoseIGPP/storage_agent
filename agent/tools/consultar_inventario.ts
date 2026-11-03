import { defineTool } from "eve/tools";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Esquema de entrada para consultar el inventario.
 */
const queryInventoryInputSchema = z.object({
  producto_id: z
    .string()
    .uuid()
    .optional()
    .describe("UUID especifico de un producto para consultar su estado"),
  solo_bajo_minimo: z
    .boolean()
    .default(false)
    .describe("Si es true, devuelve unicamente productos con stock menor o igual al minimo"),
  categoria: z
    .string()
    .optional()
    .describe("Categoria de productos a filtrar (ej: Bebidas, Snacks, Lacteos)"),
});

export type QueryInventoryInput = z.infer<typeof queryInventoryInputSchema>;

export interface InventoryItem {
  product_id: string;
  name: string;
  category: string;
  stock_quantity: number;
  min_stock: number;
  sale_price: number;
  cost_price: number;
  bajo_minimo: boolean;
  supplier_name: string | null;
}

export interface QueryInventoryOutput {
  total_productos: number;
  productos_bajo_minimo: number;
  productos: InventoryItem[];
}

/**
 * Herramienta: consultar_inventario
 * Recupera el catalogo de productos y evalua el nivel de existencias contra el stock minimo.
 */
export default defineTool({
  description:
    "Consulta el estado actual del inventario, con soporte para filtrar solo articulos con stock bajo minimo o por categoria.",
  inputSchema: queryInventoryInputSchema,
  async execute(input: QueryInventoryInput): Promise<QueryInventoryOutput | { error: string }> {
    try {
      let query = supabaseAdmin.from("products").select(`
          id,
          name,
          barcode,
          category,
          cost_price,
          sale_price,
          stock_quantity,
          min_stock,
          supplier_id,
          suppliers (
            id,
            name
          )
        `);

      if (input.producto_id) {
        query = query.eq("id", input.producto_id);
      }

      if (input.categoria) {
        query = query.ilike("category", `%${input.categoria}%`);
      }

      const { data, error } = await query.order("name", { ascending: true });

      if (error) {
        return { error: `Error al consultar inventario en Supabase: ${error.message}` };
      }

      if (!data) {
        return {
          total_productos: 0,
          productos_bajo_minimo: 0,
          productos: [],
        };
      }

      let lowStockCount = 0;
      const items: InventoryItem[] = [];

      for (const row of data) {
        const stockQuantity = Number(row.stock_quantity) || 0;
        const minStock = Number(row.min_stock) || 0;
        const isLowStock = stockQuantity <= minStock;

        if (isLowStock) {
          lowStockCount++;
        }

        if (input.solo_bajo_minimo && !isLowStock) {
          continue;
        }

        const supplierRelation = Array.isArray(row.suppliers)
          ? row.suppliers[0]
          : row.suppliers;
        const supplierName = supplierRelation?.name || null;

        items.push({
          product_id: row.id,
          name: row.name,
          category: row.category,
          stock_quantity: stockQuantity,
          min_stock: minStock,
          sale_price: Number(row.sale_price) || 0,
          cost_price: Number(row.cost_price) || 0,
          bajo_minimo: isLowStock,
          supplier_name: supplierName,
        });
      }

      return {
        total_productos: data.length,
        productos_bajo_minimo: lowStockCount,
        productos: items,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { error: `Excepcion no controlada en consultar_inventario: ${message}` };
    }
  },
});
