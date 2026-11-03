import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Esquema de validacion para la creacion de productos.
 */
const createProductSchema = z.object({
  name: z.string().min(1, "El nombre del producto es obligatorio"),
  barcode: z.string().optional().nullable(),
  category: z.string().default("Abarrotes"),
  cost_price: z.number().min(0, "El precio de costo no puede ser negativo"),
  sale_price: z.number().min(0, "El precio de venta no puede ser negativo"),
  stock_quantity: z.number().int().min(0, "El stock no puede ser negativo").default(0),
  min_stock: z.number().int().min(0, "El stock minimo no puede ser negativo").default(5),
  supplier_id: z.string().uuid("ID de proveedor invalido").optional().nullable(),
});

/**
 * GET /api/products
 * Lista los productos con filtros opcionales de busqueda, categoria, bajo minimo y paginacion.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("q");
    const category = searchParams.get("categoria");
    const lowStockOnly = searchParams.get("bajo_minimo") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
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
          name
        )
      `,
        { count: "exact" }
      );

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    if (category) {
      query = query.ilike("category", `%${category}%`);
    }

    const { data, count, error } = await query
      .order("name", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { error: `Error al consultar productos: ${error.message}` },
        { status: 500 }
      );
    }

    let products = data || [];

    // Filtrar en memoria para bajo_minimo si se solicito (stock_quantity <= min_stock)
    if (lowStockOnly) {
      products = products.filter((p) => (p.stock_quantity ?? 0) <= (p.min_stock ?? 5));
    }

    return NextResponse.json({
      data: products,
      total: lowStockOnly ? products.length : count || 0,
      page,
      limit,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Error interno al obtener productos: ${message}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products
 * Registra un nuevo producto en el catalogo.
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

    const parseResult = createProductSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Datos de producto invalidos",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const productData = parseResult.data;

    // Si se especifico codigo de barras, verificar unicidad
    if (productData.barcode) {
      const { data: existingProduct } = await supabaseAdmin
        .from("products")
        .select("id")
        .eq("barcode", productData.barcode)
        .maybeSingle();

      if (existingProduct) {
        return NextResponse.json(
          { error: "Ya existe un producto registrado con ese codigo de barras." },
          { status: 409 }
        );
      }
    }

    const { data, error } = await supabaseAdmin
      .from("products")
      .insert({
        name: productData.name,
        barcode: productData.barcode || null,
        category: productData.category,
        cost_price: productData.cost_price,
        sale_price: productData.sale_price,
        stock_quantity: productData.stock_quantity,
        min_stock: productData.min_stock,
        supplier_id: productData.supplier_id || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: `Error al crear el producto: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Error interno al crear producto: ${message}` },
      { status: 500 }
    );
  }
}
