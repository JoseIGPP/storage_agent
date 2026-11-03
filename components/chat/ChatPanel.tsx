"use client";

/**
 * Panel de chat lateral flotante con el Agente Bodega (Eve / GPT-4o-mini).
 * Soporta streaming en tiempo real, renderizado de respuestas con markdown simplificado,
 * scroll automático y chips de sugerencias rápidas orientadas al negocio.
 */

import React, { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User, Sparkles, Loader2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_SUGGESTIONS = [
  "¿Qué productos están bajos de stock?",
  "Genera una orden de compra sugerida",
  "¿Cuáles son las ganancias de este mes?",
  "Revisar inconsistencias en el inventario",
  "Proyecta las ventas del próximo mes",
];

export function ChatPanel({ isOpen, onClose }: ChatPanelProps): React.ReactElement | null {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content:
        "¡Hola! Soy tu Agente Bodega con IA. Puedo generar reportes financieros, analizar qué productos se están agotando, proyectar ventas o crear órdenes de compra para reabastecer tu tienda. ¿En qué te ayudo hoy?",
    },
  ]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al recibir o escribir mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const sendMessage = async (textToSend?: string): Promise<void> => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    const assistantMessageId = `assistant-${Date.now()}`;
    const initialAssistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
    };

    setMessages([...newMessages, initialAssistantMessage]);

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/plain",
        },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Error en el servidor: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error("No se recibió flujo de datos.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedContent += chunk;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: accumulatedContent }
              : msg
          )
        );
      }
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : "Error desconocido";
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: `⚠️ Ocurrió un error al consultar al agente: ${errMessage}. Verifica tu conexión o intenta nuevamente.`,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  return (
    <aside className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col transition-all">
      {/* Cabecera del chat */}
      <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-1.5">
              Agente Bodega
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            </h2>
            <p className="text-xs text-slate-400">Modelo GPT-4o-mini con Eve</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Cerrar chat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Lista de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isUser = message.role === "user";

          return (
            <div
              key={message.id}
              className={`flex gap-3 text-sm ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs ${
                  isUser
                    ? "bg-blue-600 text-white"
                    : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`px-3.5 py-2.5 rounded-2xl max-w-[85%] whitespace-pre-wrap leading-relaxed ${
                  isUser
                    ? "bg-blue-600 text-white rounded-tr-none shadow-sm"
                    : "bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/60 shadow-sm"
                }`}
              >
                {message.content ? (
                  message.content
                ) : (
                  <span className="flex items-center gap-2 text-slate-400 text-xs">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    Consultando inventario y datos...
                  </span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Sugerencias rápidas */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/50">
        <p className="text-[11px] font-medium text-slate-400 mb-2">Preguntas sugeridas:</p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_SUGGESTIONS.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => void sendMessage(suggestion)}
              disabled={isLoading}
              className="text-xs px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors disabled:opacity-50 text-left"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Input de texto */}
      <div className="p-3 border-t border-slate-800 bg-slate-950">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pregunta sobre ventas, stock o compras..."
            disabled={isLoading}
            className="flex-1 bg-slate-900 text-sm text-white placeholder-slate-500 px-3.5 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
          />
          <button
            onClick={() => void sendMessage()}
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors disabled:opacity-40 disabled:hover:bg-emerald-500"
            title="Enviar mensaje"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
