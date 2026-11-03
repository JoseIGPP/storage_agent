"use client";

/**
 * Tarjeta de visualización y gestión de Órdenes de Compra.
 * Permite al dueño de la bodega revisar el desglose de productos sugeridos
 * y aprobar o rechazar la orden en un clic (Human-in-the-Loop).
 */

import React, { useState } from "react";
import { formatCurrency, formatDateTime } from "@/lib/utils/formatters";
import {
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Loader2,
  Calendar,
  AlertCircle,
} from "lucide-react";

export interface OrderItem {
  producto_id: string;
  nombre?: string;
  cantidad: number;
  precio_costo_unitario: number;
  subtotal?: number;
}

export interface PurchaseOrder {
  id: string;
  proveedor_id: string | null;
  items: OrderItem[];
  costo_total_estimado: number;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  approved_at: string | null;
  suppliers?: {
    nombre: string;
    contacto?: string;
    telefono?: string;
  };
}

interface PurchaseOrderCardProps {
  order: PurchaseOrder;
  onStatusUpdated: () => void;
}

export function PurchaseOrderCard({
  order,
  onStatusUpdated,
}: PurchaseOrderCardProps): React.ReactElement {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (action: "approve" | "reject"): Promise<void> => {
    setIsProcessing(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/${action}`, {
        method: "PATCH",
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `Error al ${action === "approve" ? "aprobar" : "rechazar"} la orden.`);
      }

      onStatusUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const isPending = order.status === "pending";
  const isApproved = order.status === "approved";
  const isRejected = order.status === "rejected";

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 hover:border-slate-700 transition-colors">
      {/* Cabecera de la tarjeta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="text-sm font-semibold text-white">
              {order.suppliers?.nombre || "Proveedor General"}
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">ID: {order.id.slice(0, 8)}...</p>
          </div>
        </div>

        {/* Badge de estado */}
        <div>
          {isPending && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Clock className="w-3.5 h-3.5 animate-pulse" />
              Pendiente de Aprobación
            </span>
          )}
          {isApproved && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <CheckCircle className="w-3.5 h-3.5" />
              Aprobada
            </span>
          )}
          {isRejected && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
              <XCircle className="w-3.5 h-3.5" />
              Rechazada
            </span>
          )}
        </div>
      </div>

      {/* Mensaje de error si la acción falla */}
      {error && (
        <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Lista de productos solicitados */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          Productos Sugeridos ({order.items.length})
        </p>
        <div className="bg-slate-950 rounded-xl p-3 divide-y divide-slate-800/80 text-xs">
          {order.items.map((item, idx) => (
            <div key={idx} className="py-1.5 flex items-center justify-between first:pt-0 last:pb-0">
              <span className="text-white font-medium">
                {item.nombre || `Producto ${item.producto_id.slice(0, 6)}`}
              </span>
              <div className="flex items-center gap-4 text-slate-400">
                <span>{item.cantidad} unidades</span>
                <span className="text-slate-300 font-semibold w-16 text-right">
                  {formatCurrency(item.cantidad * item.precio_costo_unitario)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Metadatos y Total */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>Creada: {formatDateTime(order.created_at)}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Costo Estimado:</span>
          <span className="text-base font-bold text-emerald-400">
            {formatCurrency(order.costo_total_estimado)}
          </span>
        </div>
      </div>

      {/* Botones de acción Human-in-the-Loop */}
      {isPending && (
        <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={() => void handleAction("reject")}
            disabled={isProcessing}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Rechazar
          </button>

          <button
            onClick={() => void handleAction("approve")}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isProcessing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle className="w-3.5 h-3.5" />
            )}
            <span>Aprobar Orden</span>
          </button>
        </div>
      )}

      {/* Info de fecha de aprobación si ya fue procesada */}
      {isApproved && order.approved_at && (
        <div className="pt-2 border-t border-slate-800 text-right text-[11px] text-emerald-400/80">
          Aprobada el {formatDateTime(order.approved_at)}
        </div>
      )}
    </div>
  );
}
