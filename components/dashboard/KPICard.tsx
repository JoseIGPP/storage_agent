"use client";

/**
 * Componente KPICard para mostrar métricas clave de desempeño en el Dashboard.
 * Soporta estados de carga (skeleton), iconos contextuales y estilos de advertencia.
 */

import React from "react";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "default" | "emerald" | "amber" | "red" | "blue";
  isLoading?: boolean;
}

const VARIANT_STYLES = {
  default: "bg-slate-850 border-slate-800 text-slate-400",
  emerald: "bg-emerald-950/20 border-emerald-500/30 text-emerald-400",
  amber: "bg-amber-950/20 border-amber-500/30 text-amber-400",
  red: "bg-red-950/20 border-red-500/30 text-red-400",
  blue: "bg-blue-950/20 border-blue-500/30 text-blue-400",
};

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
  isLoading = false,
}: KPICardProps): React.ReactElement {
  const variantClass = VARIANT_STYLES[variant] || VARIANT_STYLES.default;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div className={`p-2 rounded-lg border ${variantClass}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3">
        {isLoading ? (
          <div className="h-8 w-28 bg-slate-800 rounded animate-pulse" />
        ) : (
          <p className="text-2xl font-bold tracking-tight text-white">{value}</p>
        )}

        {subtitle && (
          <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
