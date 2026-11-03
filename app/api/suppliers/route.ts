import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Esquema de validacion para registrar proveedores.
 */
const createSupplierSchema = z.object({
  name: z.string().min(1, "El nombre del proveedor es obligatorio"),
  phone: z.string().optional().nullable(),
  email: z.string().email("Formato de correo electronico invalido").optional().nullable(),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/suppliers
 * Lista todos los proveedores registrados en el sistema.
 */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("suppliers")
      .select("id, name, phone, email, notes, created_at")
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: `Error al consultar proveedores: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Error interno al consultar proveedores: ${message}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/suppliers
 * Registra un nuevo proveedor.
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

    const parseResult = createSupplierSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Datos de proveedor invalidos",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("suppliers")
      .insert(parseResult.data)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: `Error al crear proveedor: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Error interno al registrar proveedor: ${message}` },
      { status: 500 }
    );
  }
}
