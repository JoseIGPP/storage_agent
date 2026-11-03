"use client";

/**
 * Página de Gestión de Órdenes de Compra (/dashboard/ordenes).
 * Permite filtrar órdenes por estado (pendientes, aprobadas, rechazadas)
 * y ejecutar aprobaciones directas respetando la regla Human-in-the-Loop.
 */

import React, { useState, useEffect, useCallback } from "react";
import { PurchaseOrderCard, PurchaseOrder } from "@/components/orders/PurchaseOrderCard";
import { ClipboardList, Clock, CheckCircle2, XCircle, RefreshCw } from "lucide-react";

type OrderTab = "pending" | "approved" | "rejected" | "all";

export default function OrdersPage(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<OrderTab>("pending");
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchOrders = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const url =
        activeTab === "all" ? "/api/orders" : `/api/orders?status=${encodeURIComponent(activeTab)}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setOrders(Array.isArray(json) ? json : json.data || []);
      }
    } catch (err) {
      console.error("Error al cargar órdenes de compra:", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const tabs: Array<{ id: OrderTab; label: string; icon: React.ElementType }> = [
    { id: "pending", label: "Pendientes", icon: Clock },
    { id: "approved", label: "Aprobadas", icon: CheckCircle2 },
    { id: "rejected", label: "Rechazadas", icon: XCircle },
    { id: "all", label: "Todas", icon: ClipboardList },
  ];

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <ClipboardList className="w-6 h-6 text-emerald-400" />
            Órdenes de Compra
          </h1>
          <p className="text-sm text-slate-400">
            Revisa y autoriza los pedidos de reabastecimiento generados por el Agente Bodega o
            manualmente.
          </p>
        </div>

        <button
          onClick={() => void fetchOrders()}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-medium border border-slate-700 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Pestañas de navegación por estado */}
      <div className="flex border-b border-slate-800 space-x-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                isActive
                  ? "border-emerald-400 text-emerald-400 bg-emerald-500/5"
                  : "border-transparent text-slate-400 hover:text-white hover:border-slate-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Lista de tarjetas de órdenes */}
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
          <p className="text-xs">Cargando órdenes de compra...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
          <ClipboardList className="w-10 h-10 text-slate-600" />
          <p className="text-sm font-medium text-slate-400">No hay órdenes en esta categoría.</p>
          <p className="text-xs">
            {activeTab === "pending"
              ? "Cuando el Agente Bodega detecte productos bajos de stock, generará aquí órdenes pendientes para tu aprobación."
              : "Las órdenes que proceses se archivarán en esta sección."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orders.map((order) => (
            <PurchaseOrderCard
              key={order.id}
              order={order}
              onStatusUpdated={() => void fetchOrders()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
