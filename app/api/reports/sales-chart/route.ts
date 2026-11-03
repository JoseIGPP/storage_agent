import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Genera un arreglo de fechas en formato YYYY-MM-DD para los ultimos N dias.
 */
function getLastNDaysList(daysCount: number): string[] {
  const days: string[] = [];
  const now = new Date();

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  return days;
}

/**
 * GET /api/reports/sales-chart
 * Genera series temporales diarias de ventas y ganancias para componentes graficos (Recharts).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("periodo") || "30d";

    let daysCount = 30;
    if (period === "7d") daysCount = 7;
    if (period === "14d") daysCount = 14;
    if (period === "90d") daysCount = 90;

    const daysList = getLastNDaysList(daysCount);
    const startDate = `${daysList[0]}T00:00:00.000Z`;
    const endDate = `${daysList[daysList.length - 1]}T23:59:59.999Z`;

    // 1. Consultar ventas y costo de adquisicion por fecha
    const { data: salesData, error: salesError } = await supabaseAdmin
      .from("sales")
      .select(
        `
        quantity,
        total,
        sold_at,
        products (
          cost_price
        )
      `
      )
      .gte("sold_at", startDate)
      .lte("sold_at", endDate);

    if (salesError) {
      return NextResponse.json(
        { error: `Error al consultar datos de ventas para grafica: ${salesError.message}` },
        { status: 500 }
      );
    }

    // Mapa para acumular ventas y costos por dia (YYYY-MM-DD)
    const dailyMap = new Map<string, { sales: number; cogs: number }>();
    for (const d of daysList) {
      dailyMap.set(d, { sales: 0, cogs: 0 });
    }

    for (const s of salesData || []) {
      const dateKey = s.sold_at.slice(0, 10);
      const existing = dailyMap.get(dateKey);
      if (existing) {
        const total = Number(s.total) || 0;
        const qty = Number(s.quantity) || 0;
        const product = Array.isArray(s.products) ? s.products[0] : s.products;
        const costPrice = Number(product?.cost_price) || 0;

        existing.sales += total;
        existing.cogs += qty * costPrice;
      }
    }

    // Formatear datos para Recharts
    const chartData = daysList.map((dayStr) => {
      const stats = dailyMap.get(dayStr) || { sales: 0, cogs: 0 };
      const profit = Math.max(0, stats.sales - stats.cogs);

      return {
        fecha: dayStr,
        ventas: Number(stats.sales.toFixed(2)),
        ganancias: Number(profit.toFixed(2)),
      };
    });

    return NextResponse.json({
      periodo: period,
      dias: daysCount,
      data: chartData,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Error interno al generar datos para grafica: ${message}` },
      { status: 500 }
    );
  }
}
