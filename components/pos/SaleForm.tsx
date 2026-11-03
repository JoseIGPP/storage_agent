"use client";

/**
 * Formulario interactivo del Punto de Venta (POS).
 * Gestiona el carrito de compras en mostrador, búsqueda manual reactiva,
 * captura de lectores físicos USB y apertura del escáner Quagga2 con cámara.
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Camera,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  AlertCircle,
  Loader2,
  ShoppingBag,
} from "lucide-react";
import { BarcodeScannerModal } from "@/components/pos/BarcodeScannerModal";
import { formatCurrency } from "@/lib/utils/formatters";
import { playScannerBeep } from "@/lib/utils/audio";

export interface Product {
  id: string;
  nombre: string;
  codigo_barras: string | null;
  categoria: string;
  precio_venta: number;
  stock_actual: number;
  stock_minimo: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

interface SaleFormProps {
  onSaleCompleted: () => void;
}

export function SaleForm({ onSaleCompleted }: SaleFormProps): React.ReactElement {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [cashReceived, setCashReceived] = useState<string>("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Mantener el foco en el input al cargar para que las pistolas USB funcionen de inmediato
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Búsqueda en vivo de productos por texto o código de barras
  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(trimmed)}&limit=6`);
        if (res.ok) {
          const json = await res.json();
          setSearchResults(json.data || []);
        }
      } catch (err) {
        console.error("Error al buscar productos:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Agrega un producto al carrito respetando el límite de stock físico disponible
  const addProductToCart = (product: Product): void => {
    if (product.stock_actual <= 0) {
      setMessage({
        type: "error",
        text: `El producto "${product.nombre}" no tiene stock disponible.`,
      });
      return;
    }

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_actual) {
          setMessage({
            type: "error",
            text: `No puedes agregar más unidades. Stock disponible: ${product.stock_actual}`,
          });
          return prevCart;
        }
        return prevCart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });

    setMessage(null);
    setSearchTerm("");
    setSearchResults([]);
    searchInputRef.current?.focus();
  };

  // Manejo de lectura de código de barras desde Quagga2 o pistola USB
  const handleBarcodeLookup = async (barcode: string): Promise<void> => {
    try {
      const res = await fetch(`/api/products/barcode/${encodeURIComponent(barcode)}`);
      if (res.ok) {
        const product: Product = await res.json();
        addProductToCart(product);
        playScannerBeep();
      } else {
        setMessage({
          type: "error",
          text: `No se encontró ningún producto con el código "${barcode}".`,
        });
      }
    } catch {
      setMessage({
        type: "error",
        text: "Error de red al consultar el código de barras.",
      });
    }
  };

  // Modificación de cantidad de un ítem en el carrito
  const updateQuantity = (productId: string, delta: number): void => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stock_actual) {
              setMessage({
                type: "error",
                text: `Stock máximo alcanzado (${item.product.stock_actual} unidades).`,
              });
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const removeFromCart = (productId: string): void => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  // Totales
  const totalAmount = cart.reduce(
    (sum, item) => sum + item.product.precio_venta * item.quantity,
    0
  );
  const cashNumber = parseFloat(cashReceived) || 0;
  const changeAmount = cashNumber >= totalAmount ? cashNumber - totalAmount : 0;

  // Registrar la venta en la base de datos
  const handleConfirmSale = async (): Promise<void> => {
    if (cart.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      // Registrar cada venta de los ítems del carrito
      for (const item of cart) {
        const response = await fetch("/api/sales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            producto_id: item.product.id,
            cantidad: item.quantity,
            precio_unitario: item.product.precio_venta,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || "Error al procesar el registro de venta.");
        }
      }

      // Éxito
      setMessage({
        type: "success",
        text: `¡Venta por ${formatCurrency(totalAmount)} completada con éxito!`,
      });
      setCart([]);
      setCashReceived("");
      onSaleCompleted();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setMessage({ type: "error", text: msg });
    } finally {
      setIsSubmitting(false);
      searchInputRef.current?.focus();
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col lg:flex-row gap-6">
      {/* Columna Izquierda: Búsqueda y Carrito */}
      <div className="flex-1 space-y-4">
        {/* Barra de Búsqueda con soporte para pistola física y botón de cámara */}
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchTerm.trim()) {
                    e.preventDefault();
                    // Si el texto parece un código de barras (solo dígitos de 8 a 14 caracteres), buscarlo por código
                    if (/^\d{8,14}$/.test(searchTerm.trim())) {
                      void handleBarcodeLookup(searchTerm.trim());
                      setSearchTerm("");
                    } else if (searchResults.length > 0) {
                      addProductToCart(searchResults[0]);
                    }
                  }
                }}
                placeholder="Escanear código de barras o escribir nombre del producto..."
                className="w-full bg-slate-950 text-white placeholder-slate-500 pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
              />
              {isSearching && (
                <Loader2 className="w-4 h-4 text-emerald-400 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
              )}
            </div>

            {/* Botón para abrir escáner de cámara Quagga2 */}
            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-medium text-xs transition-colors shrink-0"
              title="Abrir escáner con cámara web"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Cámara</span>
            </button>
          </div>

          {/* Menú de resultados de búsqueda en vivo */}
          {searchResults.length > 0 && (
            <div className="absolute z-20 left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto divide-y divide-slate-800">
              {searchResults.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addProductToCart(product)}
                  className="w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-slate-800/80 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{product.nombre}</p>
                    <p className="text-xs text-slate-400">
                      {product.categoria} • Stock: {product.stock_actual}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-emerald-400">
                    {formatCurrency(product.precio_venta)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mensajes de notificación */}
        {message && (
          <div
            className={`p-3 rounded-xl flex items-center gap-2 text-xs font-medium ${
              message.type === "success"
                ? "bg-emerald-950/40 border border-emerald-500/40 text-emerald-300"
                : "bg-red-950/40 border border-red-500/40 text-red-300"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Tabla de Artículos en el Carrito */}
        <div className="border border-slate-800 rounded-xl overflow-hidden">
          <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Productos en Carrito ({cart.length})</span>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-red-400 hover:text-red-300 text-xs lowercase font-normal"
              >
                vaciar carrito
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
              <ShoppingBag className="w-8 h-8 text-slate-600" />
              <p className="text-xs">El carrito está vacío. Escanea o busca un producto arriba.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800 max-h-72 overflow-y-auto">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="px-4 py-3 flex items-center justify-between gap-3 bg-slate-900/50 hover:bg-slate-850 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {item.product.nombre}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatCurrency(item.product.precio_venta)} c/u
                    </p>
                  </div>

                  {/* Controles de cantidad */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Subtotal del ítem */}
                  <div className="text-right w-20 shrink-0">
                    <p className="text-sm font-bold text-white">
                      {formatCurrency(item.product.precio_venta * item.quantity)}
                    </p>
                  </div>

                  {/* Botón eliminar */}
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 transition-colors shrink-0"
                    title="Quitar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Columna Derecha: Panel de Cobro y Confirmación */}
      <div className="w-full lg:w-80 bg-slate-950 rounded-xl p-5 border border-slate-800 flex flex-col justify-between shrink-0">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white border-b border-slate-800 pb-3">
            Detalle de Pago
          </h3>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-400 text-xs">
              <span>Subtotal</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-400 text-xs">
              <span>Impuestos (IGV incluido)</span>
              <span>S/ 0.00</span>
            </div>
            <div className="flex justify-between text-white text-base font-bold pt-2 border-t border-slate-800">
              <span>Total a Pagar</span>
              <span className="text-emerald-400 text-lg">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          {/* Calculadora de Vuelto */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <label className="block text-xs font-medium text-slate-400">
              Efectivo Recibido (S/)
            </label>
            <input
              type="number"
              step="0.10"
              value={cashReceived}
              onChange={(e) => setCashReceived(e.target.value)}
              placeholder="0.00"
              className="w-full bg-slate-900 text-white px-3 py-2 rounded-lg border border-slate-800 text-sm focus:outline-none focus:border-emerald-500"
            />

            {cashNumber > 0 && (
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Vuelto a entregar:</span>
                <span
                  className={`font-bold ${
                    cashNumber >= totalAmount ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {cashNumber >= totalAmount
                    ? formatCurrency(changeAmount)
                    : `Faltan ${formatCurrency(totalAmount - cashNumber)}`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Botón de Confirmación de Venta */}
        <div className="mt-6">
          <button
            onClick={() => void handleConfirmSale()}
            disabled={cart.length === 0 || isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:hover:bg-emerald-500 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Registrando...</span>
              </>
            ) : (
              <span>Confirmar Venta</span>
            )}
          </button>
        </div>
      </div>

      {/* Modal de Escáner Quagga2 */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onDetected={(code) => {
          void handleBarcodeLookup(code);
        }}
      />
    </div>
  );
}
