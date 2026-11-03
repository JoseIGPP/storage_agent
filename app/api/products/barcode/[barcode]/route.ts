import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

interface BarcodeRouteParams {
  params: Promise<{ barcode: string }>;
}

/**
 * GET /api/products/barcode/[barcode]
 * Busca un producto directamente por su codigo de barras (EAN-13 u otro formato registrado).
 * Utilizado por el componente de escaneo del punto de venta (POS).
 */
export async function GET(_req: NextRequest, { params }: BarcodeRouteParams) {
  try {
    const { barcode } = await params;

    if (!barcode) {
      return NextResponse.json(
        { error: "El codigo de barras es requerido." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("products")
      .select(
        `
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
      `
      )
      .eq("barcode", barcode)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: `Error al buscar codigo de barras: ${error.message}` },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Codigo de barras no registrado en el sistema." },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Error interno al buscar codigo de barras: ${message}` },
      { status: 500 }
    );
  }
}
