import { NextRequest, NextResponse } from "next/server";
import { streamText, tool } from "ai";
import { google } from "@ai-sdk/google";
import fs from "fs";
import path from "path";

// Importacion de las 7 herramientas del agente
import consultarVentasTool from "@/agent/tools/consultar_ventas";
import consultarInventarioTool from "@/agent/tools/consultar_inventario";
import consultarGastosTool from "@/agent/tools/consultar_gastos";
import calcularForecastTool from "@/agent/tools/calcular_forecast";
import detectarInconsistenciasTool from "@/agent/tools/detectar_inconsistencias";
import crearOrdenCompraTool from "@/agent/tools/crear_orden_compra";
import generarReporteGananciasTool from "@/agent/tools/generar_reporte_ganancias";

/**
 * Carga las instrucciones del sistema desde agent/instructions.md.
 */
function loadSystemInstructions(): string {
  try {
    const instructionsPath = path.join(process.cwd(), "agent", "instructions.md");
    if (fs.existsSync(instructionsPath)) {
      return fs.readFileSync(instructionsPath, "utf-8");
    }
  } catch {
    // Si ocurre un error al leer del disco, se utiliza el fallback base
  }

  return `Eres el Agente Bodega, asistente de inteligencia artificial para una tienda de conveniencia.
Responde SIEMPRE en español. Eres preciso con los numeros, utilizas formato de moneda $1,234.50.
Nunca apruebes ordenes de compra por ti mismo; solo dejalas en estado pending.`;
}

interface GenericTool {
  description: string;
  inputSchema: unknown;
  execute: unknown;
}

/**
 * Adaptador de herramientas de Eve a herramientas ejecutables de Vercel AI SDK.
 */
function adaptEveTool(eveTool: GenericTool) {
  return tool({
    description: eveTool.description,
    inputSchema: eveTool.inputSchema as Parameters<typeof tool>[0]["inputSchema"],
    execute: async (input: unknown) => {
      const execFn = eveTool.execute as (input: unknown, ctx?: unknown) => Promise<unknown>;
      return execFn(input, {});
    },
  });
}

/**
 * POST /api/agent
 * Handler principal para streaming conversacional del Agente Bodega.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "El cuerpo de la peticion debe contener un arreglo de 'messages'." },
        { status: 400 }
      );
    }

    const systemPrompt = loadSystemInstructions();

    const result = streamText({
      model: google("gemini-3.1-flash-lite"),
      system: systemPrompt,
      messages,
      tools: {
        consultar_ventas: adaptEveTool(consultarVentasTool as unknown as GenericTool),
        consultar_inventario: adaptEveTool(consultarInventarioTool as unknown as GenericTool),
        consultar_gastos: adaptEveTool(consultarGastosTool as unknown as GenericTool),
        calcular_forecast: adaptEveTool(calcularForecastTool as unknown as GenericTool),
        detectar_inconsistencias: adaptEveTool(detectarInconsistenciasTool as unknown as GenericTool),
        crear_orden_compra: adaptEveTool(crearOrdenCompraTool as unknown as GenericTool),
        generar_reporte_ganancias: adaptEveTool(generarReporteGananciasTool as unknown as GenericTool),
      },
    });

    // Detectar si el cliente solicita formato de texto plano o stream de UI/SSE
    const acceptHeader = req.headers.get("accept") || "";
    if (acceptHeader.includes("text/plain")) {
      return result.toTextStreamResponse();
    }

    return result.toUIMessageStreamResponse();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Error al procesar la solicitud del agente: ${message}` },
      { status: 500 }
    );
  }
}
