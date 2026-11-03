# 02-agent-core / plan.md — Plan Técnico del Agente Eve y Playbooks

## 1. Configuración de Runtime (`agent/agent.ts`)

Se utiliza la función `defineAgent` del framework Eve sobre Vercel AI SDK:

```typescript
import { defineAgent } from "eve";

export default defineAgent({
  model: "openai/gpt-4o-mini",
  temperature: 0.15, // Baja temperatura para consistencia analítica
  maxTokens: 2500,
});
```

## 2. Prompt del Sistema Base (`agent/instructions.md`)

Estructura del prompt continuo que define la identidad:
- Rol y misión del Agente Bodega.
- Regla inquebrantable de respuesta en español.
- Guías de presentación (uso de viñetas, tablas Markdown y emojis clave como 📊, 🛒, ⚠️, ✅).
- Reglas de verificación de rangos temporales.
- Restricción de permisos: sólo crear órdenes en estado `pending`.

## 3. Playbooks Dinámicos (`agent/skills/`)

Los skills en Eve permiten cargar instrucciones procedimentales bajo demanda según el contexto de la consulta del usuario:

1. **`agent/skills/reportes.md`**:
   - Cómo interpretar períodos relativos ("la semana pasada", "el mes anterior", "el trimestre").
   - Cómo formatear la tabla de balance: Ingresos, Costo de Ventas, Gastos Operativos, Ganancia Neta y Margen %.
2. **`agent/skills/ordenes_compra.md`**:
   - Criterio de reorden: si $\text{stock\_quantity} \le \text{min\_stock}$, calcular ventas semanales promedio y sugerir comprar suficiente para cubrir 3 a 4 semanas de rotación habitual.
   - Instrucción estricta de invocar `crear_orden_compra` con status `pending` y notificar al usuario el ID generado.
3. **`agent/skills/forecasting.md`**:
   - Protocolo para explicar la estimación de ganancias al usuario: mostrar el historial de los últimos N meses (por defecto 3), el promedio simple y el porcentaje de variación reciente.
4. **`agent/skills/inconsistencias.md`**:
   - Flujo de análisis: invocar `detectar_inconsistencias`, clasificar diferencias en positivas (sobrante no registrado) o negativas (merma/fuga potencial) y sugerir acciones de verificación física.
