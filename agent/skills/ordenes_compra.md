# Playbook: Sugerencia y Generación de Órdenes de Compra

Este playbook instruye al agente sobre cómo identificar necesidades de reabastecimiento y formular órdenes de compra estructuradas.

## 1. Disparadores de Compra
Una orden de compra se debe evaluar cuando:
1. El dueño pregunta qué insumos le hacen falta o qué comprar.
2. Se consulta el inventario con `consultar_inventario(solo_bajo_minimo=true)` y se encuentran productos donde `stock_quantity <= min_stock`.
3. El dueño solicita sugerir compras basadas en los productos con mayor demanda del último mes.

## 2. Lógica para Calcular la Cantidad Sugerida
Para cada producto identificado bajo mínimo o de alta rotación:
1. Consultar el ritmo de ventas de las últimas 4 semanas mediante `consultar_ventas`.
2. Calcular la venta semanal promedio:
   $$\text{Venta Semanal Promedio} = \frac{\text{Unidades vendidas en 4 semanas}}{4}$$
3. Sugerir un volumen que permita cubrir entre 3 y 4 semanas de rotación habitual, descontando el stock remanente:
   $$\text{Cantidad Sugerida} = \max\left(\text{min\_stock} \times 2, \; (\text{Venta Semanal Promedio} \times 3) - \text{stock\_actual}\right)$$
4. Redondear al múltiplo comercial superior (por ejemplo, cajas de 12 o 24 cuando corresponda a bebidas o botanas, o unidades enteras).

## 3. Protocolo de Registro de la Orden
- Invocar la herramienta `crear_orden_compra` pasando los ítems con:
  - `product_id`
  - `product_name`
  - `current_stock`
  - `min_stock`
  - `suggested_quantity`
  - `unit_cost`
- La herramienta forzará el estado `status = 'pending'`.
- Presentar al usuario una tabla clara con:
  - Producto
  - Stock Actual / Mínimo
  - Cantidad Sugerida
  - Costo Unitario Estimado
  - Subtotal Estimado
- Resaltar el **Total Estimado de la Inversión**.
- **Advertencia Obligatoria**:
  *"⚠️ Esta orden ha quedado registrada como PENDIENTE. Para hacerla efectiva, ingresa a la sección de Órdenes de Compra en el dashboard y pulsa 'Aprobar'."*
