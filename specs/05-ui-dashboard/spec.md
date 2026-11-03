# 05-ui-dashboard / spec.md — Especificación de Interfaz de Usuario y Experiencia

## 1. Principios de Experiencia de Usuario (UX)
- **Velocidad de Mostrador**: El registro de una venta física no debe requerir más de 2 interacciones (escanear/seleccionar y presionar "Registrar").
- **Claridad de Estados**: Indicadores visuales inmediatos para stock en peligro (verde: adecuado, amarillo: justo en el mínimo, rojo: bajo el mínimo).
- **Asistencia Ubicua**: El agente conversacional debe estar siempre accesible en un panel lateral flotante o deslizable sin bloquear la vista de trabajo del dashboard.
- **Acceso Directo a Aprobación**: Si existen órdenes de compra pendientes generadas por el agente, debe mostrarse una notificación destacada (badge) invitando al dueño a revisarlas y aprobarlas.

## 2. Requerimientos de Vistas

### 2.1 Dashboard Principal (`/dashboard`)
- 4 tarjetas KPI superiores:
  1. *Ventas de Hoy* ($ y cantidad de transacciones).
  2. *Ventas del Mes* ($ acumulado).
  3. *Ganancia Neta Estimada* ($ y margen %).
  4. *Alertas de Stock* (cantidad de productos bajo mínimo).
- Gráfica interactiva de evolución de ventas diarias de los últimos 30 días.
- Top 5 de productos más vendidos en la semana.
- Notificación de órdenes de compra pendientes si las hay.

### 2.2 Punto de Venta (POS) y Registro Rápido (`/dashboard/ventas`)
- Integración de escáner de código de barras mediante cámara web usando la librería Quagga2.
- Input manual con autocompletado rápido para productos sin código de barras.
- Selector de cantidad con límite superior dinámico al stock físico disponible.
- Tabla inferior con las últimas 15 ventas del día.

### 2.3 Inventario y Catálogo (`/dashboard/inventario`)
- Tabla completa de productos con búsqueda por nombre, filtro por categoría y filtro *"Solo productos bajo mínimo"*.
- Modal para agregar y editar productos con campos de código, categoría, costo, precio de venta y stock mínimo.

### 2.4 Reportes Financieros y Exportación (`/dashboard/reportes`)
- Selector de rango de fechas personalizado.
- Gráficas de ventas, egresos y utilidad neta.
- Botones de exportación:
  - **Exportar PDF**: Documento formateado con logotipo, período, resumen ejecutivo y tabla detallada.
  - **Exportar Excel (XLSX)**: Libro de cálculo con hojas de Ventas, Gastos e Inventario.

### 2.5 Aprobación de Órdenes de Compra (`/dashboard/ordenes`)
- Pestañas: *Pendientes*, *Aprobadas*, *Rechazadas*.
- Tarjetas de orden mostrando ítems sugeridos, cantidad, costo estimado y botón de aprobación directa con un clic.

### 2.6 Panel de Chat del Agente Bodega
- Panel lateral retráctil accesible desde cualquier página del dashboard.
- Streaming de respuestas carácter por carácter con renderizado de Markdown.
- Botones de preguntas frecuentes rápidas (chips: *"¿Qué necesito comprar?"*, *"Ventas de hoy"*, *"Revisar inconsistencias"*).
