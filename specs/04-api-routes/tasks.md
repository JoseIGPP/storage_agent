# 04-api-routes / tasks.md — Tareas de Endpoints y Servicios

## Checklist de Tareas

- [x] **T-04-1**: Crear handler de streaming `app/api/agent/route.ts` conectando con el runtime de Eve.
- [x] **T-04-2**: Implementar endpoints de productos:
  - `app/api/products/route.ts` (GET y POST).
  - `app/api/products/[id]/route.ts` (GET, PATCH, DELETE).
  - `app/api/products/barcode/[barcode]/route.ts` (búsqueda por código).
- [x] **T-04-3**: Implementar endpoint de ventas en `app/api/sales/route.ts` validando stock antes de inserción.
- [x] **T-04-4**: Implementar endpoint de compras en `app/api/purchases/route.ts`.
- [x] **T-04-5**: Implementar endpoint de gastos operativos en `app/api/expenses/route.ts`.
- [x] **T-04-6**: Implementar endpoints de órdenes de compra:
  - `app/api/orders/route.ts` (GET listado).
  - `app/api/orders/[id]/approve/route.ts` (PATCH aprobación).
  - `app/api/orders/[id]/reject/route.ts` (PATCH rechazo).
- [x] **T-04-7**: Implementar endpoints analíticos:
  - `app/api/reports/dashboard/route.ts` (KPIs principales).
  - `app/api/reports/sales-chart/route.ts` (series temporales para Recharts).
- [x] **T-04-8**: Probar endpoints mediante requests HTTP automatizados con validación de códigos de estado.
