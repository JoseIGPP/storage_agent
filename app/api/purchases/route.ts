import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Esquema de validacion para compras de reposicion.
 */
const createPurchaseSchema = z.object({
  product_id: z.string().uuid("ID de producto invalido"),
  supplier_id: z.string().uuid("ID de proveedor invalido").optional().nullable(),
  quantity: z.number().int().min(1, "La cantidad minima a ingresar es 1"),
  unit_cost: z.number().min(0, "El costo unitario no puede ser negativo"),
  purchased_at: z.string().optional(),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/purchases
 * Lista el historial de compras de reabastecimiento con filtros y paginacion.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("fecha_inicio");
    const endDate = searchParams.get("fecha_fin");
    const productId = searchParams.get("product_id");
    const supplierId = searchParams.get("supplier_id");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from("purchases")
      .select(
        `
        id,
        product_id,
        supplier_id,
        quantity,
        unit_cost,
        total,
        purchased_at,
        notes,
        products (
          id,
          name,
          category
        ),
        suppliers (
          id,
          name
        )
      `,
        { count: "exact" }
      );

    if (startDate) {
      query = query.gte("purchased_at", `${startDate}T00:00:00.000Z`);
    }

    if (endDate) {
      query = query.lte("purchased_at", `${endDate}T23:59:59.999Z`);
    }

    if (productId) {
      query = query.eq("product_id", productId);
    }

    if (supplierId) {
      query = query.eq("supplier_id", supplierId);
    }

    const { data, count, error } = await query
      .order("purchased_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { error: `Error al consultar compras: ${error.message}` },
        { status: 500 }
      );
    }

    const purchaseList = data || [];
    const totalAmount = purchaseList.reduce(
      (acc, p) => acc + (Number(p.total) || 0),
      0
    );

    return NextResponse.json({
      data: purchaseList,
      total: count || 0,
      total_monto: Number(totalAmount.toFixed(2)),
      page,
      limit,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Error interno al consultar compras: ${message}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/purchases
 * Registra una nueva compra e incrementa el stock del producto mediante trigger.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Cuerpo de solicitud invalido o ausente." },
        { status: 400 }
      );
    }

    const parseResult = createPurchaseSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Datos de compra invalidos",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const purchaseInput = parseResult.data;

    // Verificar existencia del producto
    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("id")
      .eq("id", purchaseInput.product_id)
      .maybeSingle();

    if (productError || !product) {
      return NextResponse.json(
        { error: "El producto especificado no existe." },
        { status: 404 }
      );
    }

    const newPurchase = {
      product_id: purchaseInput.product_id,
      supplier_id: purchaseInput.supplier_id || null,
      quantity: purchaseInput.quantity,
      unit_cost: purchaseInput.unit_cost,
      purchased_at: purchaseInput.purchased_at || new Date().toISOString(),
      notes: purchaseInput.notes || null,
    };

    const { data, error } = await supabaseAdmin
      .from("purchases")
      .insert(newPurchase)
      .select(
        `
        id,
        product_id,
        supplier_id,
        quantity,
        unit_cost,
        total,
        purchased_at,
        notes,
        products (
          id,
          name
        )
      `
      )
      .single();

    if (error) {
      return NextResponse.json(
        { error: `Error al registrar la compra: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Error interno al registrar compra: ${message}` },
      { status: 500 }
    );
  }
}
