# 04-api-routes / spec.md — Especificación de Endpoints y Servicios HTTP

## 1. Objetivos de la API
Proporcionar una interfaz HTTP segura, consistente y estructurada entre el cliente web (Next.js) y los servicios de base de datos e inteligencia artificial.

## 2. Requisitos de Endpoints

### 2.1 Streaming del Agente (`/api/agent`)
- Recibir el historial de conversación en curso del cliente (`useChat`).
- Ejecutar el bucle de agente de Eve con invocación automática de herramientas (`agent/tools`).
- Emitir la respuesta en tiempo real mediante Server-Sent Events (SSE) en formato Data Stream estándar.

### 2.2 Gestión de Productos e Inventario (`/api/products`)
- Listar productos con búsqueda textual por nombre o filtrado por código de barras (`/api/products/barcode/[code]`).
- Registrar nuevos productos validando unicidad de código de barras.
- Actualizar precios, categorías o umbral de stock mínimo.
- Eliminar productos siempre que no posean ventas o compras vinculadas.

### 2.3 Registro y Consulta de Ventas (`/api/sales`)
- Registrar una venta deduciendo stock automáticamente por trigger.
- Rechazar la venta con error HTTP 400 si la cantidad solicitada supera el stock disponible.
- Listar historial de ventas con paginación y filtros por rango de fechas.

### 2.4 Registro de Compras (`/api/purchases`)
- Registrar compra de reabastecimiento incrementando stock automáticamente por trigger.

### 2.5 Registro de Gastos (`/api/expenses`)
- Registrar egresos operativos con descripción, categoría y monto positivo.

### 2.6 Aprobación y Ciclo de Órdenes de Compra (`/api/orders`)
- Listar órdenes generadas (filtrando por `status`: `pending`, `approved`, `rejected`).
- Endpoint de aprobación (`PATCH /api/orders/[id]/approve`): cambia el estado a `approved` y marca la fecha/hora de confirmación.
- Endpoint de rechazo (`PATCH /api/orders/[id]/reject`): cambia el estado a `rejected`.

### 2.7 Analítica para Dashboard (`/api/reports`)
- `/api/reports/dashboard`: Métricas consolidadas (ventas del día, ventas del mes, ganancia estimada del mes, cantidad de productos bajo mínimo y órdenes pendientes).
- `/api/reports/sales-chart`: Datos estructurados para alimentar gráficas Recharts por día o semana.
