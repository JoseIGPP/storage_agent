# Playbook: Generación de Reportes Financieros y Análisis de Ventas

Este playbook guía al agente para responder cuando el dueño solicita balances, reportes de ventas, gastos o productos más/menos vendidos.

## 1. Identificación del Período
- Si el usuario dice "hoy", calcula el inicio del día actual (00:00:00) y el final (23:59:59).
- Si el usuario dice "esta semana", toma desde el lunes de la semana en curso hasta hoy.
- Si dice "la semana pasada", toma desde el lunes hasta el domingo de la semana anterior.
- Si dice "este mes", toma desde el día 1 del mes actual hasta la fecha actual.
- Si dice "el mes pasado", toma el rango completo del mes calendario anterior.
- Si no especifica período, pregunta amablemente el rango antes de invocar herramientas con fechas incorrectas.

## 2. Reporte de Ventas (`consultar_ventas`)
Presenta los datos con la siguiente estructura:
- **Resumen Ejecutivo**:
  - Total Vendido: `$X,XXX.XX`
  - Transacciones Realizadas: `N`
  - Ticket Promedio: `$XX.XX` (`total_ventas / num_transacciones`)
- **Top 5 Productos Más Vendidos**:
  Tabla con: Posición, Producto, Unidades Vendidas, Ingresos y % de Aporte a la Venta Total.
- **Productos con Menor Rotación**: Menciona brevemente los 3 productos con menos ventas en el período para alertar sobre posible sobrestock.

## 3. Reporte de Ganancias (`generar_reporte_ganancias`)
Presenta el balance consolidado:
```
📊 Balance Financiero: [Fecha Inicio] al [Fecha Fin]

(+) Ingresos por Ventas:                 $XX,XXX.XX
(-) Costo de Mercancía Vendida (COGS):    $XX,XXX.XX
────────────────────────────────────────────────────
(=) Ganancia Bruta:                       $XX,XXX.XX  (Margen Bruto: XX.X%)
(-) Gastos Operativos Generales:          $X,XXX.XX
────────────────────────────────────────────────────
(=) Ganancia Neta:                        $X,XXX.XX  (Margen Neto: XX.X%)
```
Añade un breve análisis cualitativo indicando qué categoría de gastos tuvo mayor impacto o si el margen bruto se encuentra en un nivel saludable para comercio minorista (generalmente entre 25% y 35%).
