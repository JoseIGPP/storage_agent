# 03-agent-tools / plan.md — Plan Técnico y Esquemas de Herramientas (Zod)

## 1. Patrón de Implementación

Cada herramienta se implementa como un archivo independiente en `agent/tools/<nombre_tool>.ts` exportando la definición de `defineTool` de Eve/Vercel AI SDK. Las consultas a la base de datos se ejecutan en el servidor mediante el cliente administrador (`lib/supabase/admin.ts`), garantizando acceso íntegro sin depender del contexto de sesión del navegador.

## 2. Definición Técnica de Esquemas Zod y Contratos

### 2.1 `consultar_ventas.ts`
```typescript
import { defineTool } from "eve/tools";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default defineTool({
  description: "Consulta ventas en un rango de fechas con desglose por producto y totales.",
  inputSchema: z.object({
    fecha_inicio: z.string().describe("Fecha inicial en formato YYYY-MM-DD"),
    fecha_fin: z.string().describe("Fecha final en formato YYYY-MM-DD"),
    producto_id: z.string().uuid().optional().describe("UUID opcional del producto"),
    limit: z.number().int().min(1).max(100).default(50),
  }),
  async execute({ fecha_inicio, fecha_fin, producto_id, limit }) {
    // Consulta SQL estructurada agregando por producto
  }
});
```

### 2.2 `consultar_inventario.ts`
```typescript
export const ConsultarInventarioInput = z.object({
  solo_bajo_minimo: z.boolean().default(false).describe("Filtrar solo productos donde stock <= min_stock"),
  categoria: z.string().optional(),
  producto_id: z.string().uuid().optional(),
});
```

### 2.3 `consultar_gastos.ts`
```typescript
export const ConsultarGastosInput = z.object({
  fecha_inicio: z.string().describe("Fecha inicial YYYY-MM-DD"),
  fecha_fin: z.string().describe("Fecha final YYYY-MM-DD"),
  categoria: z.string().optional(),
});
```

### 2.4 `calcular_forecast.ts`
```typescript
export const CalcularForecastInput = z.object({
  n_meses: z.number().int().min(1).max(12).default(3).describe("Número de meses históricos a promediar"),
  producto_id: z.string().uuid().optional(),
});
```
**Algoritmo**:
$$\text{Ganancia Mes}_m = \text{Ventas}_m - \text{Costo Mercancía Vendida}_m - \text{Gastos}_m$$
$$\text{Promedio Móvil} = \frac{1}{N} \sum_{i=1}^{N} \text{Ganancia Mes}_{m-i}$$
$$\text{Tendencia} = \frac{\text{Mes}_1 - \text{Mes}_N}{\text{Mes}_N}$$
$$\text{Proyección} = \text{Promedio Móvil} \times (1 + \text{Tendencia} \times 0.5)$$

### 2.5 `detectar_inconsistencias.ts`
```typescript
export const DetectarInconsistenciasInput = z.object({
  umbral_diferencia: z.number().int().min(0).default(0),
});
```
Compara para cada producto:
$$\text{Stock Teórico} = \sum \text{Compras} - \sum \text{Ventas}$$
$$\Delta = \text{Stock Actual Registrado} - \text{Stock Teórico}$$

### 2.6 `crear_orden_compra.ts`
```typescript
export const CrearOrdenCompraInput = z.object({
  items: z.array(z.object({
    product_id: z.string().uuid(),
    product_name: z.string(),
    current_stock: z.number().int(),
    min_stock: z.number().int(),
    suggested_quantity: z.number().int().min(1),
    unit_cost: z.number().min(0),
  })).min(1),
  supplier_id: z.string().uuid().optional(),
  notes: z.string().optional(),
});
```
Inserta en `purchase_orders` con columna fija: `status = 'pending'`.

### 2.7 `generar_reporte_ganancias.ts`
```typescript
export const GenerarReporteGananciasInput = z.object({
  fecha_inicio: z.string().describe("Fecha inicial YYYY-MM-DD"),
  fecha_fin: z.string().describe("Fecha final YYYY-MM-DD"),
});
```
Retorna ingresos totales, costo de adquisición, gastos de operación, ganancia bruta, ganancia neta y margen operativo %.
