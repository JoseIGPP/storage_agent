"use client";

/**
 * Gráfica de barras horizontales para visualizar los productos más vendidos.
 * Utiliza Recharts (BarChart, Bar, XAxis, YAxis, Tooltip).
 */

import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface TopProductItem {
  nombre: string;
  unidades: number;
  total_generado?: number;
}

interface TopProductsChartProps {
  data: TopProductItem[];
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

function CustomBarTooltip({ active, payload, label }: CustomTooltipProps): React.ReactElement | null {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    return (
      <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg shadow-lg text-xs">
        <p className="text-slate-300 font-medium">{label}</p>
        <p className="text-blue-400 font-bold mt-0.5">{value} unidades vendidas</p>
      </div>
    );
  }
  return null;
}

export function TopProductsChart({
  data,
  isLoading = false,
}: TopProductsChartProps): React.ReactElement {
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || isLoading) {
    return (
      <div className="h-64 flex items-center justify-center bg-slate-900/40 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Cargando top productos...</span>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-slate-900/40 rounded-xl border border-slate-800 text-slate-500 text-sm">
        No hay datos de productos vendidos esta semana.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} horizontal={false} />
          <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} />
          <YAxis
            type="category"
            dataKey="nombre"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            width={100}
            tickFormatter={(val: string) => (val.length > 14 ? `${val.slice(0, 14)}...` : val)}
          />
          <Tooltip content={<CustomBarTooltip />} />
          <Bar dataKey="unidades" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
