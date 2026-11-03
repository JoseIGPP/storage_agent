import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Esquema para crear orden de compra manual.
 */
const createOrderSchema = z.object({
  items: z.array(z.record(z.unknown())).min(1, "Debe incluir al menos un producto"),
  supplier_id: z.string().uuid().optional().nullable(),
  suggested_by: z.enum(["agent", "manual"]).default("manual"),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/orders
 * Lista ordenes de compra filtrando por estado (pending, approved, rejected, completed).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from("purchase_orders")
      .select(
        `
        id,
        items,
        status,
        suggested_by,
        supplier_id,
        notes,
        created_at,
        approved_at,
        rejected_at,
        suppliers (
          id,
          name,
          phone
        )
      `,
        { count: "exact" }
      );

    if (status) {
      query = query.eq("status", status);
    }

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { error: `Error al consultar ordenes de compra: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Error interno al consultar ordenes: ${message}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders
 * Crea una nueva orden de compra manual en estado pending.
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

    const parseResult = createOrderSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Datos de orden invalidos",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const orderInput = parseResult.data;

    const newOrder = {
      items: orderInput.items,
      status: "pending",
      suggested_by: orderInput.suggested_by,
      supplier_id: orderInput.supplier_id || null,
      notes: orderInput.notes || null,
    };

    const { data, error } = await supabaseAdmin
      .from("purchase_orders")
      .insert(newOrder)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: `Error al registrar orden de compra: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Error interno al crear orden: ${message}` },
      { status: 500 }
    );
  }
}
