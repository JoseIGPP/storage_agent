import { defineTool } from "eve/tools";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Esquema de cada item dentro de una orden de compra.
 */
const purchaseOrderItemSchema = z.object({
  product_id: z.string().uuid().describe("UUID del producto a reabastecer"),
  product_name: z.string().describe("Nombre comercial del producto"),
  current_stock: z.number().int().describe("Stock registrado actual"),
  min_stock: z.number().int().describe("Umbral de stock minimo configurado"),
  suggested_quantity: z
    .number()
    .int()
    .min(1)
    .describe("Cantidad sugerida de unidades a comprar (minimo 1)"),
  unit_cost: z
    .number()
    .min(0)
    .describe("Costo unitario estimado de adquisicion"),
});

/**
 * Esquema de entrada para crear una orden de compra.
 */
const createPurchaseOrderInputSchema = z.object({
  items: z
    .array(purchaseOrderItemSchema)
    .min(1)
    .describe("Lista de productos recomendados para la orden de compra"),
  supplier_id: z
    .string()
    .uuid()
    .optional()
    .describe("UUID opcional del proveedor asignado"),
  notes: z
    .string()
    .optional()
    .describe("Notas de justificacion o instrucciones para la compra"),
});

export type PurchaseOrderItem = z.infer<typeof purchaseOrderItemSchema>;
export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderInputSchema>;

export interface CreatePurchaseOrderOutput {
  order_id: string;
  status: "pending";
  total_estimado: number;
  num_productos: number;
  created_at: string;
  mensaje: string;
}

/**
 * Herramienta: crear_orden_compra
 * Registra una propuesta de orden de compra en estado PENDIENTE en la base de datos.
 * El agente nunca puede transicionar la orden a 'approved' de manera autonoma.
 */
export default defineTool({
  description:
    "Crea un borrador de orden de compra en estado 'pending' con productos que requieren reabastecimiento para que el dueno la apruebe.",
  inputSchema: createPurchaseOrderInputSchema,
  async execute(input: CreatePurchaseOrderInput): Promise<CreatePurchaseOrderOutput | { error: string }> {
    try {
      let estimatedTotal = 0;
      for (const item of input.items) {
        estimatedTotal += item.suggested_quantity * item.unit_cost;
      }

      const newOrderPayload = {
        items: input.items,
        status: "pending" as const, // Forzado por regla de negocio estricta
        suggested_by: "agent",
        supplier_id: input.supplier_id || null,
        notes: input.notes || "Orden generada automaticamente por Agente Bodega",
      };

      const { data, error } = await supabaseAdmin
        .from("purchase_orders")
        .insert(newOrderPayload)
        .select("id, status, created_at")
        .single();

      if (error) {
        return { error: `Error al registrar orden de compra en Supabase: ${error.message}` };
      }

      return {
        order_id: data.id,
        status: "pending",
        total_estimado: Number(estimatedTotal.toFixed(2)),
        num_productos: input.items.length,
        created_at: data.created_at,
        mensaje:
          "La orden de compra ha sido creada con exito en estado PENDIENTE. Recuerda que el dueno debe aprobarla en el dashboard.",
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { error: `Excepcion no controlada en crear_orden_compra: ${message}` };
    }
  },
});
