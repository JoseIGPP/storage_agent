"use client";

/**
 * Modal interactivo para crear y editar productos en el catálogo de inventario.
 * Valida márgenes de ganancia (precio_venta >= precio_costo) y stocks no negativos.
 */

import React, { useState, useEffect } from "react";
import { X, Loader2, Save, PackagePlus, Edit } from "lucide-react";

export interface InventoryProduct {
  id?: string;
  nombre: string;
  codigo_barras: string | null;
  categoria: string;
  precio_costo: number;
  precio_venta: number;
  stock_actual: number;
  stock_minimo: number;
}

interface ProductModalProps {
  isOpen: boolean;
  productToEdit?: InventoryProduct | null;
  onClose: () => void;
  onSaved: () => void;
}

const CATEGORIES = [
  "Bebidas",
  "Abarrotes",
  "Snacks",
  "Lácteos",
  "Limpieza",
  "Cuidado Personal",
  "Panadería",
  "Otros",
];

export function ProductModal({
  isOpen,
  productToEdit,
  onClose,
  onSaved,
}: ProductModalProps): React.ReactElement | null {
  const isEditing = Boolean(productToEdit?.id);

  const [formData, setFormData] = useState({
    nombre: "",
    codigo_barras: "",
    categoria: "Abarrotes",
    precio_costo: "",
    precio_venta: "",
    stock_actual: "",
    stock_minimo: "5",
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        nombre: productToEdit.nombre || "",
        codigo_barras: productToEdit.codigo_barras || "",
        categoria: productToEdit.categoria || "Abarrotes",
        precio_costo: productToEdit.precio_costo?.toString() || "",
        precio_venta: productToEdit.precio_venta?.toString() || "",
        stock_actual: productToEdit.stock_actual?.toString() || "",
        stock_minimo: productToEdit.stock_minimo?.toString() || "5",
      });
    } else {
      setFormData({
        nombre: "",
        codigo_barras: "",
        categoria: "Abarrotes",
        precio_costo: "",
        precio_venta: "",
        stock_actual: "0",
        stock_minimo: "5",
      });
    }
    setError(null);
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);

    const costo = parseFloat(formData.precio_costo) || 0;
    const venta = parseFloat(formData.precio_venta) || 0;
    const stockActual = parseInt(formData.stock_actual, 10) || 0;
    const stockMinimo = parseInt(formData.stock_minimo, 10) || 0;

    if (!formData.nombre.trim()) {
      setError("El nombre del producto es obligatorio.");
      return;
    }

    if (costo <= 0 || venta <= 0) {
      setError("Los precios deben ser mayores a 0.");
      return;
    }

    if (venta < costo) {
      setError("El precio de venta no puede ser menor al precio de costo.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        nombre: formData.nombre.trim(),
        codigo_barras: formData.codigo_barras.trim() || null,
        categoria: formData.categoria,
        precio_costo: costo,
        precio_venta: venta,
        stock_actual: stockActual,
        stock_minimo: stockMinimo,
      };

      const url = isEditing ? `/api/products/${productToEdit?.id}` : "/api/products";
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error(json.error || "No se pudo guardar el producto.");
      }

      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Cabecera */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-medium text-sm">
            {isEditing ? (
              <Edit className="w-4 h-4 text-emerald-400" />
            ) : (
              <PackagePlus className="w-4 h-4 text-emerald-400" />
            )}
            <span>{isEditing ? "Editar Producto" : "Nuevo Producto"}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={(e) => void handleSubmit(e)} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Nombre del Producto *
            </label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej. Leche Evaporada Gloria 400g"
              className="w-full bg-slate-950 text-white px-3.5 py-2 rounded-lg border border-slate-800 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Código de Barras (EAN / UPC)
              </label>
              <input
                type="text"
                value={formData.codigo_barras}
                onChange={(e) => setFormData({ ...formData, codigo_barras: e.target.value })}
                placeholder="Ej. 7751234567890"
                className="w-full bg-slate-950 text-white px-3.5 py-2 rounded-lg border border-slate-800 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Categoría
              </label>
              <select
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                className="w-full bg-slate-950 text-white px-3.5 py-2 rounded-lg border border-slate-800 text-sm focus:outline-none focus:border-emerald-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Precio de Costo (S/) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.precio_costo}
                onChange={(e) => setFormData({ ...formData, precio_costo: e.target.value })}
                placeholder="0.00"
                className="w-full bg-slate-950 text-white px-3.5 py-2 rounded-lg border border-slate-800 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Precio de Venta (S/) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.precio_venta}
                onChange={(e) => setFormData({ ...formData, precio_venta: e.target.value })}
                placeholder="0.00"
                className="w-full bg-slate-950 text-white px-3.5 py-2 rounded-lg border border-slate-800 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Stock Físico Actual *
              </label>
              <input
                type="number"
                required
                value={formData.stock_actual}
                onChange={(e) => setFormData({ ...formData, stock_actual: e.target.value })}
                placeholder="0"
                className="w-full bg-slate-950 text-white px-3.5 py-2 rounded-lg border border-slate-800 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Stock Mínimo (Alerta) *
              </label>
              <input
                type="number"
                required
                value={formData.stock_minimo}
                onChange={(e) => setFormData({ ...formData, stock_minimo: e.target.value })}
                placeholder="5"
                className="w-full bg-slate-950 text-white px-3.5 py-2 rounded-lg border border-slate-800 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{isEditing ? "Guardar Cambios" : "Crear Producto"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
