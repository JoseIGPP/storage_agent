import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Esquema de validacion para registrar un gasto operativo.
 */
const createExpenseSchema = z.object({
  category: z.string().min(1, "La categoria es obligatoria"),
  description: z.string().min(1, "La descripcion es obligatoria"),
  amount: z.number().positive("El monto debe ser un numero positivo"),
  expense_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato YYYY-MM-DD")
    .optional(),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/expenses
 * Lista gastos operativos con filtros por fecha, categoria y paginacion.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("fecha_inicio");
    const endDate = searchParams.get("fecha_fin");
    const category = searchParams.get("categoria");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from("expenses")
      .select("id, category, description, amount, expense_date, notes, created_at", {
        count: "exact",
      });

    if (startDate) {
      query = query.gte("expense_date", startDate);
    }

    if (endDate) {
      query = query.lte("expense_date", endDate);
    }

    if (category) {
      query = query.ilike("category", `%${category}%`);
    }

    const { data, count, error } = await query
      .order("expense_date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { error: `Error al consultar gastos: ${error.message}` },
        { status: 500 }
      );
    }

    const expensesList = data || [];
    const totalAmount = expensesList.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

    return NextResponse.json({
      data: expensesList,
      total: count || 0,
      total_monto: Number(totalAmount.toFixed(2)),
      page,
      limit,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Error interno al consultar gastos: ${message}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/expenses
 * Registra un nuevo gasto operativo general.
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

    const parseResult = createExpenseSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Datos de gasto invalidos",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const expenseInput = parseResult.data;
    const today = new Date().toISOString().slice(0, 10);

    const newExpense = {
      category: expenseInput.category,
      description: expenseInput.description,
      amount: expenseInput.amount,
      expense_date: expenseInput.expense_date || today,
      notes: expenseInput.notes || null,
    };

    const { data, error } = await supabaseAdmin
      .from("expenses")
      .insert(newExpense)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: `Error al registrar el gasto: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Error interno al registrar gasto: ${message}` },
      { status: 500 }
    );
  }
}
