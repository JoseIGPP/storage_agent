"use client";

/**
 * Página del Punto de Venta (POS) (/dashboard/ventas).
 * Combina el formulario de venta con lector de código de barras Quagga2
 * y una tabla con el historial de las últimas ventas registradas hoy.
 */

import React, { useState, useEffect, useCallback } from "react";
import { SaleForm } from "@/components/pos/SaleForm";
import { formatCurrency, formatDateTime } from "@/lib/utils/formatters";
import { ShoppingCart, Clock, RefreshCw } from "lucide-react";

interface SaleRecord {
  id: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
  created_at: string;
  products?: {
    nombre: string;
    categoria: string;
  };
}

export default function SalesPage(): React.ReactElement {
  const [recentSales, setRecentSales] = useState<SaleRecord[]>([]);
  const [isLoadingSales, setIsLoadingSales] = useState<boolean>(true);

  const fetchRecentSales = useCallback(async (): Promise<void> => {
    setIsLoadingSales(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch(`/api/sales?fecha_desde=${today}&limit=10`);
      if (res.ok) {
        const json = await res.json();
        setRecentSales(json.data || []);
      }
    } catch (err) {
      console.error("Error al cargar ventas recientes:", err);
    } finally {
      setIsLoadingSales(false);
    }
  }, []);

  useEffect(() => {
    void fetchRecentSales();
  }, [fetchRecentSales]);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <ShoppingCart className="w-6 h-6 text-emerald-400" />
          Punto de Venta (POS)
        </h1>
        <p className="text-sm text-slate-400">
          Escanea códigos de barras con la cámara o pistola USB, o busca productos manualmente para
          registrar ventas al instante.
        </p>
      </div>

      {/* Formulario principal del POS */}
      <SaleForm onSaleCompleted={() => void fetchRecentSales()} />

      {/* Tabla de últimas ventas registradas hoy */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-medium text-sm">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Últimas Ventas Registradas Hoy</span>
          </div>

          <button
            onClick={() => void fetchRecentSales()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Refrescar ventas"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSales ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Fecha y Hora</th>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3 text-center">Cantidad</th>
                <th className="px-4 py-3 text-right">Precio Unitario</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {recentSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    {isLoadingSales ? "Cargando ventas..." : "No hay ventas registradas aún hoy."}
                  </td>
                </tr>
              ) : (
                recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 text-slate-400">{formatDateTime(sale.created_at)}</td>
                    <td className="px-4 py-3 font-medium text-white">
                      {sale.products?.nombre || "Producto sin nombre"}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {sale.products?.categoria || "-"}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-white">
                      {sale.cantidad}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400">
                      {formatCurrency(sale.precio_unitario)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-400">
                      {formatCurrency(sale.total)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
