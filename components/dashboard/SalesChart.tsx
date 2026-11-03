"use client";

/**
 * Gráfica de evolución de ventas diarias utilizando Recharts.
 * Visualiza la tendencia de los últimos 30 días con tooltips formateados en moneda local.
 */

import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface DailySalesDataPoint {
  date: string;
  total: number;
  count: number;
}

interface SalesChartProps {
  data: DailySalesDataPoint[];
  isLoading?: boolean;
}

interface TooltipPayloadItem {
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps): React.ReactElement | null {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    return (
      <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg shadow-lg text-xs">
        <p className="text-slate-400 font-medium">{label}</p>
        <p className="text-emerald-400 font-bold mt-0.5">S/ {value.toFixed(2)}</p>
      </div>
    );
  }
  return null;
}

export function SalesChart({ data, isLoading = false }: SalesChartProps): React.ReactElement {
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || isLoading) {
    return (
      <div className="h-64 flex items-center justify-center bg-slate-900/40 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span>Cargando datos de ventas...</span>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-slate-900/40 rounded-xl border border-slate-800 text-slate-500 text-sm">
        No se registran ventas en los últimos 30 días.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
          <XAxis
            dataKey="date"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            tickFormatter={(val: string) => {
              const parts = val.split("-");
              return parts.length >= 3 ? `${parts[2]}/${parts[1]}` : val;
            }}
          />
          <YAxis
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            tickFormatter={(val: number) => `S/ ${val}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#10b981"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#10b981" }}
            activeDot={{ r: 6, fill: "#34d399" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
