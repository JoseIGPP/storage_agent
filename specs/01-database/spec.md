# 01-database / spec.md — Especificación del Modelo de Datos e Integridad

## 1. Entidades del Negocio

El modelo de datos refleja fielmente la operativa de una tienda de conveniencia:

1. **Proveedores (`suppliers`)**:
   - Registro opcional de distribuidores o marcas (ej. Coca-Cola FEMSA, Bimbo, Sabritas).
   - Datos de contacto básicos (teléfono, email, notas de entrega).
2. **Productos (`products`)**:
   - Cada artículo en inventario con su nombre comercial, código de barras (opcional pero único si existe), categoría, precio de costo y precio de venta.
   - Cuenta con un nivel de `stock_quantity` actual y un umbral `min_stock` de alerta.
3. **Ventas (`sales`)**:
   - Transacción de salida de mercancía.
   - Asocia producto, cantidad vendida, precio unitario aplicado al momento de la venta y total generado.
4. **Compras (`purchases`)**:
   - Transacción de reabastecimiento de producto.
   - Asocia producto, proveedor opcional, cantidad recibida, costo unitario de adquisición y total pagado.
5. **Gastos Operativos (`expenses`)**:
   - Egresos independientes de la compra de inventario (ej. recibo de luz de refrigeradores, renta del local, bolsas plásticas, mantenimiento).
   - Categorizados para permitir análisis de margen neto.
6. **Órdenes de Compra (`purchase_orders`)**:
   - Sugerencias generadas automáticamente por el agente o creadas por el dueño.
   - Contienen una lista de ítems propuestos, cantidad sugerida, costo unitario estimado y estado del flujo (`pending`, `approved`, `rejected`, `completed`).

## 2. Reglas de Negocio e Integridad

- **Regla de Oro del Inventario**: 
  El stock actual de cualquier producto debe reflejar matemáticamente:
  $$\text{Stock Actual} = \text{Stock Inicial} + \sum \text{Compras} - \sum \text{Ventas}$$
- **Actualización Automática**: El stock registrado en la tabla `products` debe actualizarse inmediatamente tras cada inserción de venta (decremento) o compra (incremento).
- **Protección contra Eliminación Accidental**: No se puede eliminar físicamente un producto que ya cuenta con historial de ventas o compras (`RESTRICT`).
- **Control de Decimales**: Toda magnitud monetaria debe almacenarse con precisión de dos decimales usando tipos numéricos exactos (`numeric(10,2)`).
- **Aprobación de Órdenes**: Toda orden propuesta por el agente nace en estado `pending`. Solo el dueño puede transicionarla a `approved` o `rejected`.
