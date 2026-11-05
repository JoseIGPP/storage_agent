import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/reports/dashboard
 * Retorna las metricas financieras y operativas consolidadas para el dashboard principal.
 */
export async function GET() {
  try {
    const now = new Date();

    // Rango del dia de hoy
    const todayStr = now.toISOString().slice(0, 10);
    const startOfToday = `${todayStr}T00:00:00.000Z`;
    const endOfToday = `${todayStr}T23:59:59.999Z`;

    // Rango del mes actual
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const startOfMonth = `${year}-${month}-01T00:00:00.000Z`;
    const lastDayOfMonth = new Date(year, now.getMonth() + 1, 0).getDate();
    const endOfMonth = `${year}-${month}-${String(lastDayOfMonth).padStart(2, "0")}T23:59:59.999Z`;

    // Rango de la ultima semana (ultimos 7 dias)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    const startOfWeek = sevenDaysAgo.toISOString();

    // 1. Ventas de hoy
    const { data: todaySales } = await supabaseAdmin
      .from("sales")
      .select("total")
      .gte("sold_at", startOfToday)
      .lte("sold_at", endOfToday);

    const salesToday = (todaySales || []).reduce(
      (acc, s) => acc + (Number(s.total) || 0),
      0
    );

    // 2. Ventas y costo de mercancia del mes actual
    const { data: monthSales } = await supabaseAdmin
      .from("sales")
      .select(
        `
        quantity,
        total,
        products (
          cost_price
        )
      `
      )
      .gte("sold_at", startOfMonth)
      .lte("sold_at", endOfMonth);

    let salesMonth = 0;
    let cogsMonth = 0;

    for (const sale of monthSales || []) {
      salesMonth += Number(sale.total) || 0;
      const qty = Number(sale.quantity) || 0;
      const product = Array.isArray(sale.products) ? sale.products[0] : sale.products;
      const costPrice = Number(product?.cost_price) || 0;
      cogsMonth += qty * costPrice;
    }

    // 3. Gastos del mes actual
    const { data: monthExpensesData } = await supabaseAdmin
      .from("expenses")
      .select("amount")
      .gte("expense_date", `${year}-${month}-01`)
      .lte("expense_date", `${year}-${month}-${String(lastDayOfMonth).padStart(2, "0")}`);

    const expensesMonth = (monthExpensesData || []).reduce(
      (acc, e) => acc + (Number(e.amount) || 0),
      0
    );

    // Ganancia neta del mes
    const netProfitMonth = salesMonth - cogsMonth - expensesMonth;

    // 4. Conteo de productos bajo stock minimo
    const { data: allProducts } = await supabaseAdmin
      .from("products")
      .select("stock_quantity, min_stock");

    const lowStockCount = (allProducts || []).filter(
      (p) => (p.stock_quantity ?? 0) <= (p.min_stock ?? 5)
    ).length;

    // 5. Conteo de ordenes de compra pendientes
    const { count: pendingOrdersCount } = await supabaseAdmin
      .from("purchase_orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");

    // 6. Top productos de los ultimos 7 dias
    const { data: weekSales } = await supabaseAdmin
      .from("sales")
      .select(
        `
        quantity,
        total,
        product_id,
        products (
          name
        )
      `
      )
      .gte("sold_at", startOfWeek);

    const productRankingMap = new Map<string, { name: string; units: number; revenue: number }>();
    for (const sale of weekSales || []) {
      const pid = sale.product_id;
      const product = Array.isArray(sale.products) ? sale.products[0] : sale.products;
      const name = product?.name || "Producto";
      const units = Number(sale.quantity) || 0;
      const total = Number(sale.total) || 0;

      const existing = productRankingMap.get(pid);
      if (existing) {
        existing.units += units;
        existing.revenue += total;
      } else {
        productRankingMap.set(pid, { name, units, revenue: total });
      }
    }

    const topProductsWeek = Array.from(productRankingMap.values())
      .sort((a, b) => b.units - a.units)
      .slice(0, 5)
      .map((item) => ({
        nombre: item.name,
        unidades: item.units,
        total_generado: Number(item.revenue.toFixed(2)),
      }));

    const grossProfitMonth = salesMonth - cogsMonth;
    const profitMarginPercent = salesMonth > 0 ? (netProfitMonth / salesMonth) * 100 : 0;

    return NextResponse.json({
      ventas_hoy: {
        total: Number(salesToday.toFixed(2)),
        cantidad: (todaySales || []).length,
      },
      ventas_mes: {
        total: Number(salesMonth.toFixed(2)),
      },
      ganancia_mes: {
        bruta: Number(grossProfitMonth.toFixed(2)),
        neta: Number(netProfitMonth.toFixed(2)),
        margen_porcentaje: Number(profitMarginPercent.toFixed(1)),
      },
      gastos_mes: {
        total: Number(expensesMonth.toFixed(2)),
      },
      productos_bajo_minimo: lowStockCount,
      ordenes_pendientes: pendingOrdersCount || 0,
      top_productos_semana: topProductsWeek,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Error interno al generar KPIs del dashboard: ${message}` },
      { status: 500 }
    );
  }
}
