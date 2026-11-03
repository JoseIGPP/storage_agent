# 03-agent-tools / tasks.md — Tareas de Implementación de Herramientas del Agente

## Checklist de Tareas

- [x] **T-03-1**: Crear el directorio `agent/tools/`.
- [x] **T-03-2**: Implementar `agent/tools/consultar_ventas.ts` con validación Zod y query agregada a Supabase.
- [x] **T-03-3**: Implementar `agent/tools/consultar_inventario.ts` con soporte para filtro `solo_bajo_minimo`.
- [x] **T-03-4**: Implementar `agent/tools/consultar_gastos.ts` con agrupación por categoría.
- [x] **T-03-5**: Implementar `agent/tools/calcular_forecast.ts` con el cálculo matemático de promedio móvil y factor de tendencia suavizada.
- [x] **T-03-6**: Implementar `agent/tools/detectar_inconsistencias.ts` comparando stock real vs. balance compras-ventas.
- [x] **T-03-7**: Implementar `agent/tools/crear_orden_compra.ts` forzando inserción con estado `pending`.
- [x] **T-03-8**: Implementar `agent/tools/generar_reporte_ganancias.ts` calculando margen bruto y neto exactos.
- [x] **T-03-9**: Crear tests unitarios en Vitest para validar los contratos de entrada/salida de cada una de las 7 herramientas.
