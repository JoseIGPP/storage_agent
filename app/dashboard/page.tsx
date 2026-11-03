"use client";

/**
 * Página principal del Dashboard (/dashboard).
 * Agrupa los 4 KPIs financieros principales, banner de notificación de órdenes pendientes
 * y gráficas de tendencias de ventas y productos más vendidos.
 */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { KPICard } from "@/components/dashboard/KPICard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { TopProductsChart } from "@/components/dashboard/TopProductsChart";
import { formatCurrency, formatPercent } from "@/lib/utils/formatters";
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ShoppingBag,
  Bell,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

interface DashboardData {
  ventas_hoy: { total: number; cantidad: number };
  ventas_mes: { total: number };
  gastos_mes: { total: number };
  ganancia_mes: { bruta: number; neta: number; margen_porcentaje: number };
  productos_bajo_minimo: number;
  ordenes_pendientes: number;
  top_productos_semana: Array<{ nombre: string; unidades: number; total_generado: number }>;
}

interface SalesChartDataPoint {
  date: string;
  total: number;
  count: number;
}

export default function DashboardPage(): React.ReactElement {
  const [data, setData] = useState<DashboardData | null>(null);
  const [chartData, setChartData] = useState<SalesChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const [resDashboard, resChart] = await Promise.all([
        fetch("/api/reports/dashboard"),
        fetch("/api/reports/sales-chart?dias=30"),
      ]);

      if (!resDashboard.ok || !resChart.ok) {
        throw new Error("No se pudo cargar la información del dashboard.");
      }

      const dashJson = await resDashboard.json();
      const chartJson = await resChart.json();

      setData(dashJson);
      setChartData(chartJson.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Título de sección y botón de refresco */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Resumen General</h1>
          <p className="text-sm text-slate-400">
            Monitoreo en tiempo real de ventas, inventario y finanzas de tu bodega.
          </p>
        </div>

        <button
          onClick={() => void fetchDashboardData()}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-medium border border-slate-700 transition-colors disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Actualizar datos</span>
        </button>
      </div>

      {/* Alerta de error si falla la carga */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => void fetchDashboardData()}
            className="underline text-xs hover:text-white"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Banner destacado: Órdenes de compra pendientes generadas por IA */}
      {data && data.ordenes_pendientes > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-200">
                {data.ordenes_pendientes === 1
                  ? "Tienes 1 orden de compra pendiente de aprobación"
                  : `Tienes ${data.ordenes_pendientes} órdenes de compra pendientes de aprobación`}
              </p>
              <p className="text-xs text-amber-400/80">
                El Agente Bodega ha sugerido reabastecer productos agotados. Revisa y aprueba la orden.
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/ordenes"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-semibold text-xs hover:bg-amber-400 transition-colors shrink-0 self-start sm:self-auto"
          >
            <span>Ver Órdenes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Ventas de Hoy"
          value={data ? formatCurrency(data.ventas_hoy.total) : "S/ 0.00"}
          subtitle={
            data ? `${data.ventas_hoy.cantidad} ventas registradas` : "Cargando..."
          }
          icon={DollarSign}
          variant="emerald"
          isLoading={isLoading}
        />

        <KPICard
          title="Ventas del Mes"
          value={data ? formatCurrency(data.ventas_mes.total) : "S/ 0.00"}
          subtitle="Acumulado mes en curso"
          icon={ShoppingBag}
          variant="blue"
          isLoading={isLoading}
        />

        <KPICard
          title="Ganancia Neta Estimada"
          value={data ? formatCurrency(data.ganancia_mes.neta) : "S/ 0.00"}
          subtitle={
            data
              ? `Margen neto: ${formatPercent(data.ganancia_mes.margen_porcentaje)}`
              : "Cargando..."
          }
          icon={TrendingUp}
          variant="emerald"
          isLoading={isLoading}
        />

        <KPICard
          title="Alertas de Inventario"
          value={data ? `${data.productos_bajo_minimo}` : "0"}
          subtitle={
            data && data.productos_bajo_minimo > 0
              ? "Productos bajo stock mínimo"
              : "Stock en niveles óptimos"
          }
          icon={AlertTriangle}
          variant={data && data.productos_bajo_minimo > 0 ? "red" : "default"}
          isLoading={isLoading}
        />
      </div>

      {/* Sección de Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfica de evolución de ventas diarias (ocupa 2 columnas en pantallas grandes) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-white">Evolución de Ventas Diarias</h2>
            <p className="text-xs text-slate-400">Comportamiento en los últimos 30 días</p>
          </div>
          <SalesChart data={chartData} isLoading={isLoading} />
        </div>

        {/* Gráfica de Top Productos de la Semana */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-white">Más Vendidos (Semana)</h2>
            <p className="text-xs text-slate-400">Top 5 productos de mayor rotación</p>
          </div>
          <TopProductsChart
            data={data?.top_productos_semana || []}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
