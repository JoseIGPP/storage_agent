"use client";

/**
 * Encabezado superior del Dashboard.
 * Proporciona información contextual de la vista, fecha actual y botón para invocar al Agente de IA.
 */

import React from "react";
import { Bot, Sparkles } from "lucide-react";

interface HeaderProps {
  onToggleChat: () => void;
  isChatOpen: boolean;
}

export function Header({ onToggleChat, isChatOpen }: HeaderProps): React.ReactElement {
  const todayFormatted = new Date().toLocaleDateString("es-PE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="h-16 bg-slate-900/50 backdrop-blur-sm border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
          Sistema Operativo
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-xs text-slate-400 capitalize">{todayFormatted}</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Botón de acceso directo al Agente de IA */}
        <button
          onClick={onToggleChat}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border shadow-sm ${
            isChatOpen
              ? "bg-emerald-500 text-slate-950 border-emerald-400 ring-2 ring-emerald-500/30"
              : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white"
          }`}
          title="Abrir asistente de IA Eve"
        >
          <Bot className="w-4 h-4 text-emerald-400" />
          <span>Agente Bodega</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
        </button>
      </div>
    </header>
  );
}
