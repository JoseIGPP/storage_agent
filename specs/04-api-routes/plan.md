# 04-api-routes / plan.md — Plan Técnico de Endpoints REST y Streaming

## 1. Convenciones Globales
- Todas las rutas residen en `app/api/**/route.ts`.
- Validación de sesiones requerida en middleware antes de alcanzar handlers de negocio.
- Manejo uniforme de errores en JSON: `{ "error": string, "code"?: string }`.
- Métodos HTTP estándar: `GET` (lectura), `POST` (creación), `PATCH` (modificación parcial), `DELETE` (eliminación).

## 2. Mapa Detallado de Rutas

| Método | Endpoint | Parámetros / Body | Respuesta Exitosa | Códigos Error |
|---|---|---|---|---|
| `POST` | `/api/agent` | `{ messages: Message[] }` | SSE Stream (`toDataStreamResponse`) | 500 |
| `GET` | `/api/products` | `?q=&categoria=&bajo_minimo=&page=1&limit=20` | `{ data: Product[], total: number }` | 400, 500 |
| `GET` | `/api/products/barcode/[code]` | — | `Product` | 404, 500 |
| `POST` | `/api/products` | `{ name, barcode?, category, cost_price, sale_price, stock_quantity, min_stock, supplier_id? }` | `Product` (201 Created) | 400, 409 |
| `PATCH`| `/api/products/[id]` | Campos parciales a modificar | `Product` | 404, 400 |
| `DELETE`| `/api/products/[id]`| — | `{ message: "Eliminado" }` | 409 (FK restrict) |
| `GET` | `/api/sales` | `?fecha_inicio=&fecha_fin=&page=1&limit=20` | `{ data: Sale[], total_monto: number }` | 400, 500 |
| `POST` | `/api/sales` | `{ product_id, quantity, unit_price, notes? }` | `Sale` (201 Created) | 400 (Stock insuficiente) |
| `GET` | `/api/purchases` | `?fecha_inicio=&fecha_fin=&supplier_id=` | `{ data: Purchase[] }` | 500 |
| `POST` | `/api/purchases` | `{ product_id, supplier_id?, quantity, unit_cost }` | `Purchase` (201 Created) | 400, 500 |
| `GET` | `/api/expenses` | `?fecha_inicio=&fecha_fin=&categoria=` | `{ data: Expense[] }` | 500 |
| `POST` | `/api/expenses` | `{ category, description, amount, expense_date? }` | `Expense` (201 Created) | 400, 500 |
| `GET` | `/api/orders` | `?status=pending\|approved\|rejected` | `{ data: PurchaseOrder[] }` | 500 |
| `PATCH`| `/api/orders/[id]/approve` | — | `PurchaseOrder` (status: 'approved') | 404, 409 |
| `PATCH`| `/api/orders/[id]/reject` | — | `PurchaseOrder` (status: 'rejected') | 404, 409 |
| `GET` | `/api/reports/dashboard`| — | Resumen de KPIs en JSON | 500 |
| `GET` | `/api/reports/sales-chart`| `?periodo=30d` | `{ labels: string[], series: number[] }` | 500 |

## 3. Ejemplo de Implementación del Streaming (`app/api/agent/route.ts`)

```typescript
import { createAgent } from "eve";

export async function POST(req: Request) {
  const { messages } = await req.json();
  const agent = createAgent({ dir: "./agent" });
  const result = await agent.stream(messages);
  return result.toDataStreamResponse();
}
```
