# 05-ui-dashboard / tasks.md — Tareas de Construcción de Interfaz de Usuario

## Checklist de Tareas

- [x] **T-05-1**: Configurar componentes base de Tailwind CSS y utilidades de estilo (`cn`).
- [x] **T-05-2**: Construir layout maestro en `app/dashboard/layout.tsx` con navegación lateral y botón de apertura de chat.
- [x] **T-05-3**: Implementar componentes de métricas:
  - `components/dashboard/KPICard.tsx` con estados de carga y tendencias.
  - `components/dashboard/SalesChart.tsx` con Recharts.
  - `components/dashboard/TopProductsChart.tsx`.
- [x] **T-05-4**: Implementar módulo POS en `app/dashboard/ventas/page.tsx`:
  - `components/pos/BarcodeScanner.tsx` con soporte Quagga2 y fallback manual.
  - `components/pos/SaleForm.tsx` con autocompletado y validación de stock.
- [x] **T-05-5**: Implementar módulo de inventario en `app/dashboard/inventario/page.tsx` con semáforo de stock (verde, amarillo, rojo) y modal de creación/edición.
- [x] **T-05-6**: Implementar módulo de reportes y utilidades de exportación:
  - `lib/utils/export.ts` con generación de PDF (jsPDF) y Excel (XLSX).
  - `app/dashboard/reportes/page.tsx` con selector de fechas y disparadores de descarga.
- [x] **T-05-7**: Implementar gestión de órdenes de compra en `app/dashboard/ordenes/page.tsx`:
  - `components/orders/PurchaseOrderCard.tsx` con botones de aprobación y rechazo en un clic.
- [x] **T-05-8**: Implementar el panel de chat flotante `components/chat/ChatPanel.tsx` con `useChat` y chips de sugerencias rápidas.
