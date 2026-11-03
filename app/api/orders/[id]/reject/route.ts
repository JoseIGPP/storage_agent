import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/orders/[id]/reject
 * Rechaza una orden de compra pendiente.
 */
export async function PATCH(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const { data: order, error: fetchError } = await supabaseAdmin
      .from("purchase_orders")
      .select("id, status")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !order) {
      return NextResponse.json(
        { error: "Orden de compra no encontrada." },
        { status: 404 }
      );
    }

    if (order.status !== "pending") {
      return NextResponse.json(
        {
          error: `No se puede rechazar la orden porque se encuentra en estado "${order.status}". Solo se pueden rechazar ordenes pendientes.`,
        },
        { status: 409 }
      );
    }

    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from("purchase_orders")
      .update({
        status: "rejected",
        rejected_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: `Error al rechazar orden: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedOrder);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Error interno al rechazar orden: ${message}` },
      { status: 500 }
    );
  }
}
