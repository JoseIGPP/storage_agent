"use client";

/**
 * Página de Catálogo e Inventario (/dashboard/inventario).
 * Permite buscar, filtrar por categoría, activar el semáforo tricolor de stock
 * y gestionar productos (creación, edición y eliminación).
 */

import React, { useState, useEffect, useCallback } from "react";
import { ProductModal, InventoryProduct } from "@/components/inventory/ProductModal";
import { formatCurrency } from "@/lib/utils/formatters";
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Edit2,
  Trash2,
  RefreshCw,
} from "lucide-react";

const CATEGORIES = [
  "Todas",
  "Bebidas",
  "Abarrotes",
  "Snacks",
  "Lácteos",
  "Limpieza",
  "Cuidado Personal",
  "Panadería",
];

export default function InventoryPage(): React.ReactElement {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [onlyUnderMinimum, setOnlyUnderMinimum] = useState<boolean>(false);

  // Estados del modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [productToEdit, setProductToEdit] = useState<InventoryProduct | null>(null);

  const fetchProducts = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append("q", searchTerm.trim());
      if (selectedCategory !== "Todas") params.append("categoria", selectedCategory);
      if (onlyUnderMinimum) params.append("bajo_minimo", "true");
      params.append("limit", "100");

      const response = await fetch(`/api/products?${params.toString()}`);
      if (response.ok) {
        const json = await response.json();
        setProducts(json.data || []);
      }
    } catch (err) {
      console.error("Error al cargar inventario:", err);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedCategory, onlyUnderMinimum]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchProducts();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const handleDelete = async (id?: string, name?: string): Promise<void> => {
    if (!id) return;
    const confirmDelete = window.confirm(
      `¿Estás seguro de eliminar el producto "${name}"? Esta acción no se puede deshacer.`
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        void fetchProducts();
      } else {
        const json = await res.json().catch(() => ({}));
        alert(json.error || "No se pudo eliminar el producto.");
      }
    } catch {
      alert("Error de red al intentar eliminar el producto.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Package className="w-6 h-6 text-emerald-400" />
            Catálogo e Inventario
          </h1>
          <p className="text-sm text-slate-400">
            Control de existencias, semáforo de reposición y precios de compra y venta.
          </p>
        </div>

        <button
          onClick={() => {
            setProductToEdit(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Producto</span>
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full">
          {/* Búsqueda */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre o código de barras..."
              className="w-full bg-slate-950 text-white placeholder-slate-500 pl-10 pr-4 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 text-xs"
            />
          </div>

          {/* Selector de Categoría */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 text-white px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 text-xs"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Toggle de Alerta de Stock Bajo Mínimo */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setOnlyUnderMinimum(!onlyUnderMinimum)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              onlyUnderMinimum
                ? "bg-red-500/20 text-red-300 border-red-500/40 ring-1 ring-red-500/30"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span>Solo Bajo Mínimo</span>
          </button>

          <button
            onClick={() => void fetchProducts()}
            className="p-2 rounded-xl bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            title="Refrescar catálogo"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Tabla de Productos con Semáforo */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Producto</th>
                <th className="px-4 py-3.5">Código de Barras</th>
                <th className="px-4 py-3.5">Categoría</th>
                <th className="px-4 py-3.5 text-right">P. Costo</th>
                <th className="px-4 py-3.5 text-right">P. Venta</th>
                <th className="px-4 py-3.5 text-center">Stock Actual</th>
                <th className="px-4 py-3.5 text-center">Stock Mínimo</th>
                <th className="px-4 py-3.5 text-center">Estado de Stock</th>
                <th className="px-4 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    {isLoading ? "Cargando catálogo..." : "No se encontraron productos."}
                  </td>
                </tr>
              ) : (
                products.map((prod) => {
                  // Lógica del semáforo tricolor
                  const isUnder = prod.stock_actual < prod.stock_minimo;
                  const isExact = prod.stock_actual === prod.stock_minimo;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-medium text-white">{prod.nombre}</td>
                      <td className="px-4 py-3 font-mono text-slate-400">
                        {prod.codigo_barras || "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-400">{prod.categoria}</td>
                      <td className="px-4 py-3 text-right text-slate-400">
                        {formatCurrency(prod.precio_costo)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-white">
                        {formatCurrency(prod.precio_venta)}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-white">
                        {prod.stock_actual}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-400">
                        {prod.stock_minimo}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isUnder ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/20 text-red-300 border border-red-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            Bajo Mínimo
                          </span>
                        ) : isExact ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            En el Mínimo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Óptimo
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setProductToEdit(prod);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => void handleDelete(prod.id, prod.nombre)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Crear / Editar Producto */}
      <ProductModal
        isOpen={isModalOpen}
        productToEdit={productToEdit}
        onClose={() => setIsModalOpen(false)}
        onSaved={() => void fetchProducts()}
      />
    </div>
  );
}
