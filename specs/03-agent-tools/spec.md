# 03-agent-tools / spec.md — Especificación Funcional de Herramientas del Agente

## 1. Catálogo de Herramientas Requeridas

El agente debe contar con 7 herramientas ejecutables autónomamente mediante function calling:

### 1. `consultar_ventas`
- **Objetivo**: Extraer el resumen y detalle de ventas realizadas en un intervalo de tiempo específico (fechas ISO).
- **Filtros requeridos**: Rango de fechas obligatorio (`fecha_inicio`, `fecha_fin`), filtro opcional por ID de producto y límite de registros.
- **Resultado esperado**: Total monetario vendido, unidades totales vendidas y desglose de los productos más vendidos en el intervalo.

### 2. `consultar_inventario`
- **Objetivo**: Consultar el estado en tiempo real del catálogo de productos y sus existencias.
- **Filtros requeridos**: Opción booleana `solo_bajo_minimo` (para listar únicamente los que requieren reposición), filtro por categoría y por ID individual.
- **Resultado esperado**: Lista de productos con stock actual, stock mínimo, precio y advertencia de bajo mínimo.

### 3. `consultar_gastos`
- **Objetivo**: Consultar los egresos operativos (servicios, mantenimiento, sueldos, suministros) dentro de un rango de fechas.
- **Filtros requeridos**: Rango de fechas y filtro opcional por categoría de gasto.
- **Resultado esperado**: Total gastado y agrupación porcentual por categoría.

### 4. `calcular_forecast`
- **Objetivo**: Estimar ingresos y ganancias netas futuras para el siguiente mes mediante un modelo de promedio móvil.
- **Parámetros**: Número de meses pasados a considerar ($N \in [1, 12]$, por defecto 3) y filtro opcional por producto.
- **Resultado esperado**: Serie histórica de los últimos N meses, promedio calculado, proyección del siguiente mes y nivel de confianza.

### 5. `detectar_inconsistencias`
- **Objetivo**: Auditar el inventario calculando la discrepancia entre las transacciones (compras - ventas) y el stock físico registrado.
- **Parámetros**: Umbral numérico mínimo para filtrar pequeñas diferencias tolerables.
- **Resultado esperado**: Lista de productos con stock esperado vs. stock actual registrado y delta correspondiente.

### 6. `crear_orden_compra`
- **Objetivo**: Generar un nuevo registro de orden de compra en la base de datos con estatus `pending`.
- **Parámetros**: Lista de ítems (con ID, nombre, stock actual, cantidad sugerida y costo unitario), ID de proveedor opcional y notas explicativas.
- **Resultado esperado**: ID de la orden creada, estatus confirmado `pending`, total estimado y mensaje de instrucción para el usuario.

### 7. `generar_reporte_ganancias`
- **Objetivo**: Generar una síntesis consolidada de desempeño económico.
- **Parámetros**: Rango de fechas.
- **Resultado esperado**: Ingresos totales, costo de adquisición de la mercancía vendida (COGS), gastos operativos, ganancia bruta, ganancia neta y márgenes porcentuales.
