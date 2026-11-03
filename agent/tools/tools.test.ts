import { describe, it, expect } from "vitest";

// Importacion de las 7 herramientas del agente
import consultarVentasTool from "./consultar_ventas";
import consultarInventarioTool from "./consultar_inventario";
import consultarGastosTool from "./consultar_gastos";
import calcularForecastTool from "./calcular_forecast";
import detectarInconsistenciasTool from "./detectar_inconsistencias";
import crearOrdenCompraTool from "./crear_orden_compra";
import generarReporteGananciasTool from "./generar_reporte_ganancias";

interface SafeParseable {
  safeParse: (data: unknown) => {
    success: boolean;
    data?: Record<string, unknown>;
    error?: unknown;
  };
}

function getToolSchema(tool: { inputSchema: unknown }): SafeParseable {
  return tool.inputSchema as unknown as SafeParseable;
}

/**
 * Suite de pruebas unitarias para validar contratos de entrada,
 * esquemas Zod y descripciones de las herramientas del Agente Bodega.
 */
describe("Agent Tools - Contracts & Schema Validation", () => {
  // ---------------------------------------------------------------------------
  // 1. Tool: consultar_ventas
  // ---------------------------------------------------------------------------
  describe("consultar_ventas", () => {
    it("should expose a valid description and input schema", () => {
      expect(consultarVentasTool.description).toBeDefined();
      expect(typeof consultarVentasTool.description).toBe("string");
      expect(consultarVentasTool.inputSchema).toBeDefined();
    });

    it("should accept valid input parameters", () => {
      const validInput = {
        fecha_inicio: "2026-10-01",
        fecha_fin: "2026-10-31",
        limit: 25,
      };
      const schema = getToolSchema(consultarVentasTool);
      const parseResult = schema.safeParse(validInput);
      expect(parseResult.success).toBe(true);
      expect(parseResult.data?.limit).toBe(25);
    });

    it("should reject invalid limit or missing dates", () => {
      const invalidInput = {
        fecha_inicio: "invalid-date",
        limit: 500, // max is 100
      };
      const schema = getToolSchema(consultarVentasTool);
      const parseResult = schema.safeParse(invalidInput);
      expect(parseResult.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Tool: consultar_inventario
  // ---------------------------------------------------------------------------
  describe("consultar_inventario", () => {
    it("should expose a valid description and default values", () => {
      expect(consultarInventarioTool.description).toBeDefined();
      const schema = getToolSchema(consultarInventarioTool);
      const parseResult = schema.safeParse({});
      expect(parseResult.success).toBe(true);
      expect(parseResult.data?.solo_bajo_minimo).toBe(false);
    });

    it("should accept optional filters like categoria and producto_id", () => {
      const inputWithFilter = {
        solo_bajo_minimo: true,
        categoria: "Bebidas",
        producto_id: "a0000000-0000-0000-0000-000000000001",
      };
      const schema = getToolSchema(consultarInventarioTool);
      const parseResult = schema.safeParse(inputWithFilter);
      expect(parseResult.success).toBe(true);
      expect(parseResult.data?.categoria).toBe("Bebidas");
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Tool: consultar_gastos
  // ---------------------------------------------------------------------------
  describe("consultar_gastos", () => {
    it("should require fecha_inicio and fecha_fin", () => {
      const schema = getToolSchema(consultarGastosTool);
      const parseResult = schema.safeParse({});
      expect(parseResult.success).toBe(false);
    });

    it("should accept valid date range and optional categoria", () => {
      const validInput = {
        fecha_inicio: "2026-09-01",
        fecha_fin: "2026-09-30",
        categoria: "Servicios",
      };
      const schema = getToolSchema(consultarGastosTool);
      const parseResult = schema.safeParse(validInput);
      expect(parseResult.success).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Tool: calcular_forecast
  // ---------------------------------------------------------------------------
  describe("calcular_forecast", () => {
    it("should use default n_meses = 3 when no parameters provided", () => {
      const schema = getToolSchema(calcularForecastTool);
      const parseResult = schema.safeParse({});
      expect(parseResult.success).toBe(true);
      expect(parseResult.data?.n_meses).toBe(3);
    });

    it("should enforce boundaries on n_meses (1 to 12)", () => {
      const schema = getToolSchema(calcularForecastTool);
      const tooHigh = { n_meses: 24 };
      const parseResultHigh = schema.safeParse(tooHigh);
      expect(parseResultHigh.success).toBe(false);

      const tooLow = { n_meses: 0 };
      const parseResultLow = schema.safeParse(tooLow);
      expect(parseResultLow.success).toBe(false);

      const valid = { n_meses: 6 };
      const parseResultValid = schema.safeParse(valid);
      expect(parseResultValid.success).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Tool: detectar_inconsistencias
  // ---------------------------------------------------------------------------
  describe("detectar_inconsistencias", () => {
    it("should accept default umbral_diferencia = 0", () => {
      const schema = getToolSchema(detectarInconsistenciasTool);
      const parseResult = schema.safeParse({});
      expect(parseResult.success).toBe(true);
      expect(parseResult.data?.umbral_diferencia).toBe(0);
    });

    it("should reject negative threshold", () => {
      const schema = getToolSchema(detectarInconsistenciasTool);
      const negativeThreshold = { umbral_diferencia: -5 };
      const parseResult = schema.safeParse(negativeThreshold);
      expect(parseResult.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Tool: crear_orden_compra
  // ---------------------------------------------------------------------------
  describe("crear_orden_compra", () => {
    it("should reject empty items array", () => {
      const schema = getToolSchema(crearOrdenCompraTool);
      const emptyOrder = {
        items: [],
      };
      const parseResult = schema.safeParse(emptyOrder);
      expect(parseResult.success).toBe(false);
    });

    it("should validate required item attributes and positive quantities", () => {
      const schema = getToolSchema(crearOrdenCompraTool);
      const validOrder = {
        items: [
          {
            product_id: "b0000000-0000-0000-0000-000000000001",
            product_name: "Coca-Cola 600ml",
            current_stock: 4,
            min_stock: 12,
            suggested_quantity: 24,
            unit_cost: 12.0,
          },
        ],
        notes: "Urgente para fin de semana",
      };
      const parseResult = schema.safeParse(validOrder);
      expect(parseResult.success).toBe(true);
      const items = parseResult.data?.items as Array<Record<string, unknown>>;
      expect(items[0]?.suggested_quantity).toBe(24);
    });

    it("should reject items with suggested_quantity < 1 or negative unit_cost", () => {
      const schema = getToolSchema(crearOrdenCompraTool);
      const invalidOrder = {
        items: [
          {
            product_id: "b0000000-0000-0000-0000-000000000001",
            product_name: "Coca-Cola 600ml",
            current_stock: 4,
            min_stock: 12,
            suggested_quantity: 0, // Invalido: min es 1
            unit_cost: -10, // Invalido: min es 0
          },
        ],
      };
      const parseResult = schema.safeParse(invalidOrder);
      expect(parseResult.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Tool: generar_reporte_ganancias
  // ---------------------------------------------------------------------------
  describe("generar_reporte_ganancias", () => {
    it("should require both fecha_inicio and fecha_fin", () => {
      const schema = getToolSchema(generarReporteGananciasTool);
      const missingEnd = { fecha_inicio: "2026-10-01" };
      const parseResult = schema.safeParse(missingEnd);
      expect(parseResult.success).toBe(false);

      const complete = {
        fecha_inicio: "2026-10-01",
        fecha_fin: "2026-10-31",
      };
      const parseResultComplete = schema.safeParse(complete);
      expect(parseResultComplete.success).toBe(true);
    });
  });
});
