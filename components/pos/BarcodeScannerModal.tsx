"use client";

/**
 * Modal de escaneo de códigos de barras mediante cámara web o dispositivo móvil.
 * Utiliza Quagga2 (@ericblade/quagga2) para procesar secuencias de video en tiempo real.
 * Incorpora debounce de 1500ms, feedback sonoro (bip) y liberación limpia del hardware de cámara.
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import Quagga, { QuaggaJSResultObject } from "@ericblade/quagga2";
import { X, Camera, AlertCircle, RefreshCw } from "lucide-react";
import { playScannerBeep } from "@/lib/utils/audio";

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (barcode: string) => void;
}

export function BarcodeScannerModal({
  isOpen,
  onClose,
  onDetected,
}: BarcodeScannerModalProps): React.ReactElement | null {
  const scannerRef = useRef<HTMLDivElement>(null);
  const lastScanTimeRef = useRef<number>(0);
  const lastBarcodeRef = useRef<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  const handleDetected = useCallback(
    (result: QuaggaJSResultObject): void => {
      const code = result.codeResult?.code;
      if (!code) return;

      const now = Date.now();
      // Debounce: Evita re-escanear el mismo código en menos de 1500ms
      if (code === lastBarcodeRef.current && now - lastScanTimeRef.current < 1500) {
        return;
      }

      lastScanTimeRef.current = now;
      lastBarcodeRef.current = code;

      // Emite sonido 'bip' de confirmación
      playScannerBeep();

      // Notifica al componente padre
      onDetected(code);
    },
    [onDetected]
  );

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsInitializing(true);
    setError(null);

    // Timeout breve para asegurar que el elemento DOM del modal ya está montado
    const timer = setTimeout(() => {
      if (!scannerRef.current) return;

      Quagga.init(
        {
          inputStream: {
            type: "LiveStream",
            target: scannerRef.current,
            constraints: {
              width: { min: 480, ideal: 640, max: 1280 },
              height: { min: 360, ideal: 480, max: 720 },
              facingMode: "environment", // Prioriza la cámara trasera en smartphones/tablets
            },
          },
          locator: {
            patchSize: "medium",
            halfSample: true,
          },
          numOfWorkers: 2,
          decoder: {
            readers: [
              "ean_reader",
              "ean_8_reader",
              "upc_reader",
              "upc_e_reader",
              "code_128_reader",
            ],
          },
          locate: true,
        },
        (err) => {
          if (!isMounted) return;
          setIsInitializing(false);

          if (err) {
            console.error("Error al inicializar Quagga2:", err);
            setError(
              "No se pudo acceder a la cámara. Verifica los permisos del navegador o usa el buscador manual."
            );
            return;
          }

          Quagga.start();
          Quagga.onDetected(handleDetected);
        }
      );
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      try {
        Quagga.offDetected(handleDetected);
        Quagga.stop();
      } catch {
        // Ignorar si Quagga ya fue detenido
      }
    };
  }, [isOpen, handleDetected]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Cabecera */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-medium text-sm">
            <Camera className="w-4 h-4 text-emerald-400" />
            <span>Escáner de Código de Barras</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visor de video */}
        <div className="relative bg-black min-h-[320px] flex items-center justify-center overflow-hidden">
          <div
            ref={scannerRef}
            className="w-full h-full flex items-center justify-center [&>video]:w-full [&>video]:h-full [&>video]:object-cover"
          />

          {/* Guía visual con láser de escaneo */}
          {!isInitializing && !error && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="w-64 h-36 border-2 border-dashed border-emerald-400/80 rounded-lg relative">
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
              </div>
              <p className="mt-4 text-xs font-medium text-white/90 bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">
                Apunta el código de barras dentro del marco
              </p>
            </div>
          )}

          {/* Estado de carga */}
          {isInitializing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950 text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
              <span>Iniciando cámara y reconocedor...</span>
            </div>
          )}

          {/* Mensaje de error */}
          {error && (
            <div className="absolute inset-0 p-6 flex flex-col items-center justify-center gap-3 bg-slate-950 text-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <p className="text-sm text-red-300">{error}</p>
              <button
                onClick={onClose}
                className="mt-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-medium hover:bg-slate-700"
              >
                Cerrar y usar teclado
              </button>
            </div>
          )}
        </div>

        {/* Pie con indicaciones */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Compatible con EAN-13, EAN-8 y UPC</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
