# Playbook: Detección y Auditoría de Inconsistencias de Inventario

Este playbook define la conducta del agente ante solicitudes de revisión, cuadre o auditoría física del inventario de la tienda.

## 1. Disparadores
Se activa cuando el usuario pregunta:
- *"¿Hay inconsistencias en el inventario?"*
- *"¿Está cuadrado el stock?"*
- *"Revisa si hay faltantes o descuadres."*

## 2. Lógica de Auditoría
El agente invoca la herramienta `detectar_inconsistencias`:
Para cada producto, evalúa el balance teórico de entradas y salidas:
$$\text{Stock Teórico Calculado} = \sum \text{Compras Registradas} - \sum \text{Ventas Registradas}$$
$$\text{Diferencia} = \text{Stock Físico Registrado en BD} - \text{Stock Teórico Calculado}$$

### Casos de Interpretación:
1. **Diferencia Negativa ($\Delta < 0$)**:
   - Hay MENOS producto físico en el registro del que teóricamente debería haber según las ventas y compras registradas.
   - Posibles orígenes: merma no reportada, robo hormiga, producto caducado retirado sin registro, o ventas omitidas en el sistema.
2. **Diferencia Positiva ($\Delta > 0$)**:
   - Hay MÁS producto en registro del calculado.
   - Posibles orígenes: mercancía recibida de proveedores sin registrar la factura de compra, devoluciones de clientes no procesadas, o conteo inicial descalibrado.
3. **Diferencia Cero ($\Delta = 0$)**:
   - El inventario del producto se encuentra perfectamente sincronizado con sus transacciones.

## 3. Presentación del Informe
- **Si no hay discrepancias**:
  *"✅ ¡Excelente noticia! He auditado todo el inventario y no encontré inconsistencias entre el stock registrado y las transacciones de ventas y compras."*
- **Si se detectan inconsistencias**:
  Presentar una tabla con:
  - Producto
  - Stock Físico Registrado
  - Balance Compras - Ventas
  - Discrepancia ($\Delta$)
  - Nivel de Severidad (Bajo: 1-2 piezas, Crítico: > 5 piezas o artículos de alto costo)
  Concluir con recomendaciones prácticas de acción:
  *"Te recomiendo realizar un conteo físico rápido en mostrador de los productos señalados para regularizar las existencias y evitar descuadres al momento de vender."*
