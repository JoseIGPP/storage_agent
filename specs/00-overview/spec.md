# 00-overview / spec.md — Especificación de Visión y Requisitos Globales

## 1. Propósito del Producto
**Agente Bodega** es una solución integral diseñada para tiendas de conveniencia de barrio, permitiendo al dueño gestionar inventario, ventas, gastos y compras de manera intuitiva y conversacional mediante un agente de IA en español.

## 2. Requisitos de Negocio
- **Operación Simple**: La interfaz debe estar adaptada para el trabajo de mostrador, donde el dueño necesita registrar ventas rápidamente y revisar el estado del negocio sin fricciones.
- **Transparencia Financiera**: Generar reportes exactos de ingresos, costos de mercancía vendida, gastos fijos/variables y márgenes de ganancia neta.
- **Control de Abastecimiento Proactivo**: El sistema debe detectar qué productos están por agotarse y generar propuestas de órdenes de compra automáticas basadas en la demanda reciente.
- **Supervisión Humana Obligatoria**: Cualquier orden de compra generada por el agente debe permanecer en estado pendiente hasta ser aprobada explícitamente por el dueño.
- **Detección de Mermas/Anomalías**: Identificar inconsistencias entre el stock teórico calculado por compras/ventas y el inventario real.

## 3. Alcance del MVP

### 3.1 Dentro del Alcance (In-Scope)
- Monousuario: Diseñado para el dueño o administrador de la tienda.
- Catálogo de productos con soporte para código de barras (EAN-13) o código manual.
- Punto de venta (POS) web con soporte de escaneo vía cámara y entrada manual.
- Registro de compras de reabastecimiento y gastos generales.
- Agente conversacional inteligente en español con 7 herramientas especializadas.
- Estimación de ganancias futuras mediante promedio móvil de los últimos N meses.
- Dashboard con indicadores clave (KPIs), gráficas interactivas y exportación de reportes a PDF y Excel.
- Autenticación protegida por correo y contraseña.

### 3.2 Fuera del Alcance (Out-of-Scope para este MVP)
- Múltiples sucursales o roles de empleados con permisos granulares.
- Envío automático de pedidos por WhatsApp o correo electrónico a proveedores.
- Integración con hardware POS fiscal o impresoras de tickets físicas.
- Aplicación móvil nativa (se utiliza web responsive).
- Algoritmos complejos de estacionalidad multianual o machine learning pesado.

## 4. Casos de Uso Globales
- **CU-01 (Registro de Venta Rápida)**: El cliente compra un producto; el dueño escanea el código de barras o lo busca por nombre, confirma cantidad y se registra la venta actualizando el stock.
- **CU-02 (Consulta Financiera)**: El dueño pregunta al agente: *"¿Cuánto vendí y cuánto gané la semana pasada?"* y recibe un resumen estructurado.
- **CU-03 (Generación de Órdenes de Compra)**: El dueño consulta: *"¿Qué necesito comprar esta semana?"*; el agente analiza stock bajo mínimo y ventas del mes, y crea una orden de compra pendiente.
- **CU-04 (Aprobación de Órdenes)**: El dueño revisa la orden propuesta en el dashboard y la aprueba o rechaza.
- **CU-05 (Auditoría de Inconsistencias)**: El dueño pide revisar el inventario; el agente detecta divergencias entre compras, ventas y stock registrado.
