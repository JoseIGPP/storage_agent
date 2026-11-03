import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Esquema de validacion para registrar una venta en mostrador o POS.
 */
const createSaleSchema = z.object({
  product_id: z.string().uuid("ID de producto invalido"),
  quantity: z.number().int().min(1, "La cantidad minima a vender es 1"),
  unit_price: z.number().min(0, "El precio unitario no puede ser negativo"),
  sold_at: z.string().optional(),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/sales
 * Consulta el listado de ventas paginado con filtros de fecha y producto.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("fecha_inicio");
    const endDate = searchParams.get("fecha_fin");
    const productId = searchParams.get("product_id");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from("sales")
      .select(
        `
        id,
        product_id,
        quantity,
        unit_price,
        total,
        sold_at,
        notes,
        products (
          id,
          name,
          category,
          barcode
        )
      `,
        { count: "exact" }
      );

    if (startDate) {
      query = query.gte("sold_at", `${startDate}T00:00:00.000Z`);
    }

    if (endDate) {
      query = query.lte("sold_at", `${endDate}T23:59:59.999Z`);
    }

    if (productId) {
      query = query.eq("product_id", productId);
    }

    const { data, count, error } = await query
      .order("sold_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { error: `Error al consultar historial de ventas: ${error.message}` },
        { status: 500 }
      );
    }

    const salesList = data || [];
    const totalAmount = salesList.reduce((acc, s) => acc + (Number(s.total) || 0), 0);

    return NextResponse.json({
      data: salesList,
      total: count || 0,
      total_monto: Number(totalAmount.toFixed(2)),
      page,
      limit,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Error interno al consultar ventas: ${message}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sales
 * Registra una nueva transaccion de venta previa verificacion de stock disponible.
 * El trigger de base de datos trg_sales_reduce_stock decrementa el stock automaticamente.
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

    const parseResult = createSaleSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Datos de venta invalidos",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const saleInput = parseResult.data;

    // 1. Obtener producto y verificar disponibilidad de stock
    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("id, name, stock_quantity")
      .eq("id", saleInput.product_id)
      .maybeSingle();

    if (productError || !product) {
      return NextResponse.json(
        { error: "El producto seleccionado no existe en el catalogo." },
        { status: 404 }
      );
    }

    const availableStock = Number(product.stock_quantity) || 0;
    if (saleInput.quantity > availableStock) {
      return NextResponse.json(
        {
          error: `Stock insuficiente para "${product.name}". Solicitado: ${saleInput.quantity}, disponible en anaquel: ${availableStock}.`,
          available_stock: availableStock,
        },
        { status: 400 }
      );
    }

    // 2. Registrar venta
    const newSaleRecord = {
      product_id: saleInput.product_id,
      quantity: saleInput.quantity,
      unit_price: saleInput.unit_price,
      sold_at: saleInput.sold_at || new Date().toISOString(),
      notes: saleInput.notes || null,
    };

    const { data, error } = await supabaseAdmin
      .from("sales")
      .insert(newSaleRecord)
      .select(
        `
        id,
        product_id,
        quantity,
        unit_price,
        total,
        sold_at,
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
        { error: `Error al registrar la venta: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Error interno al registrar venta: ${message}` },
      { status: 500 }
    );
  }
}
