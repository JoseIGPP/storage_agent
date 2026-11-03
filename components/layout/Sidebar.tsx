"use client";

/**
 * Componente Sidebar de navegación principal del Dashboard.
 * Muestra accesos directos, contador reactivo de órdenes pendientes y botón de salida.
 */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  BarChart3,
  ClipboardList,
  LogOut,
  Store,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

export function Sidebar(): React.ReactElement {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);
  const supabase = createClient();

  // Consulta la cantidad de órdenes de compra en estado pending para mostrar badge
  useEffect(() => {
    async function fetchPendingOrders(): Promise<void> {
      try {
        const response = await fetch("/api/orders?status=pending");
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            setPendingOrdersCount(data.length);
          }
        }
      } catch (err) {
        console.error("Error al consultar órdenes pendientes:", err);
      }
    }

    void fetchPendingOrders();
    // Actualizar periódicamente cada 30 segundos
    const interval = setInterval(fetchPendingOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = async (): Promise<void> => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navItems: NavItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Punto de Venta (POS)", href: "/dashboard/ventas", icon: ShoppingCart },
    { label: "Inventario", href: "/dashboard/inventario", icon: Package },
    { label: "Reportes", href: "/dashboard/reportes", icon: BarChart3 },
    {
      label: "Órdenes de Compra",
      href: "/dashboard/ordenes",
      icon: ClipboardList,
      badge: pendingOrdersCount,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen border-r border-slate-800 shrink-0">
      {/* Cabecera institucional */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
          <Store className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-wide text-white">Agente Bodega</h1>
          <p className="text-xs text-slate-400">Administración IA</p>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && item.badge > 0 ? (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {item.badge}
                </span>
              ) : isActive ? (
                <ChevronRight className="w-4 h-4 text-emerald-400/60" />
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Pie con usuario y botón de cerrar sesión */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
