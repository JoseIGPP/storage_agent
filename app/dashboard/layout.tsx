"use client";

/**
 * Layout maestro para todas las vistas del Dashboard de Agente Bodega.
 * Integra la navegación lateral (Sidebar), el encabezado superior (Header),
 * el área principal de contenido y el panel de chat con IA flotante/retráctil.
 */

import React, { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { Bot } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Barra lateral de navegación */}
      <Sidebar />

      {/* Contenedor central */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onToggleChat={() => setIsChatOpen(!isChatOpen)} isChatOpen={isChatOpen} />

        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>

      {/* Botón flotante para abrir chat en caso de que esté cerrado */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-emerald-500 text-slate-950 font-semibold shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 hover:scale-105 transition-all"
          title="Hablar con el Agente Bodega"
        >
          <Bot className="w-5 h-5" />
          <span className="text-sm">Agente IA</span>
        </button>
      )}

      {/* Panel de chat lateral */}
      <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
