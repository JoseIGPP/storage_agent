import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Esquema de validacion para actualizar un producto existente.
 */
const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  barcode: z.string().optional().nullable(),
  category: z.string().optional(),
  cost_price: z.number().min(0).optional(),
  sale_price: z.number().min(0).optional(),
  stock_quantity: z.number().int().min(0).optional(),
  min_stock: z.number().int().min(0).optional(),
  supplier_id: z.string().uuid().optional().nullable(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/products/[id]
 * Obtiene el detalle de un producto por su UUID.
 */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

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
        created_at,
        updated_at,
        suppliers (
          id,
          name,
          phone,
          email
        )
      `
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: `Error al buscar producto: ${error.message}` },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Producto no encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Error interno al consultar producto: ${message}` },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/products/[id]
 * Actualiza campos individuales de un producto.
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { error: "Cuerpo de solicitud invalido o ausente." },
        { status: 400 }
      );
    }

    const parseResult = updateProductSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Campos de actualizacion invalidos",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const updates = parseResult.data;

    // Si se modifica el codigo de barras, verificar que no colisione con otro producto
    if (updates.barcode) {
      const { data: existingProduct } = await supabaseAdmin
        .from("products")
        .select("id")
        .eq("barcode", updates.barcode)
        .neq("id", id)
        .maybeSingle();

      if (existingProduct) {
        return NextResponse.json(
          { error: "El codigo de barras ya pertenece a otro producto registrado." },
          { status: 409 }
        );
      }
    }

    const { data, error } = await supabaseAdmin
      .from("products")
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: `Error al actualizar producto: ${error.message}` },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Producto no encontrado para actualizar." },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Error interno al actualizar producto: ${message}` },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/products/[id]
 * Elimina un producto si no cuenta con ventas ni compras asociadas.
 */
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // 1. Verificar si existen ventas vinculadas
    const { count: salesCount } = await supabaseAdmin
      .from("sales")
      .select("id", { count: "exact", head: true })
      .eq("product_id", id);

    if (salesCount && salesCount > 0) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar el producto porque tiene transacciones de ventas asociadas.",
        },
        { status: 409 }
      );
    }

    // 2. Verificar si existen compras vinculadas
    const { count: purchasesCount } = await supabaseAdmin
      .from("purchases")
      .select("id", { count: "exact", head: true })
      .eq("product_id", id);

    if (purchasesCount && purchasesCount > 0) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar el producto porque tiene transacciones de compras asociadas.",
        },
        { status: 409 }
      );
    }

    // 3. Ejecutar eliminacion
    const { error } = await supabaseAdmin.from("products").delete().eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: `Error al eliminar producto: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Producto eliminado exitosamente." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Error interno al eliminar producto: ${message}` },
      { status: 500 }
    );
  }
}
