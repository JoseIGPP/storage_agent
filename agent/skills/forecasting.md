# Playbook: Estimación de Ganancias Futuras (Forecasting)

Este playbook describe el procedimiento para proyectar resultados financieros futuros mediante el método de promedio móvil suavizado.

## 1. Disparadores
Se activa cuando el usuario pregunta:
- *"¿Cuánto voy a ganar el próximo mes?"*
- *"¿Cuál es la proyección de ventas o utilidades?"*
- *"¿Cómo viene la tendencia de ganancias?"*

## 2. Metodología de Cálculo
El agente delega el procesamiento matemático en la herramienta `calcular_forecast(n_meses=3)`:
1. Extrae los resultados netos de los últimos $N$ meses cerrados ($m-1, m-2, \dots, m-N$).
2. Para cada mes:
   $$\text{Ganancia Neta} = \text{Ventas} - \text{Costo Mercancía Vendida} - \text{Gastos Operativos}$$
3. Calcula el promedio móvil aritmético simple:
   $$\text{Promedio Móvil} = \frac{1}{N} \sum_{i=1}^N \text{Ganancia Neta}_i$$
4. Detecta la pendiente de variación (tendencia) entre el mes más antiguo analizado y el más reciente:
   $$\text{Tendencia \%} = \frac{\text{Ganancia Reciente} - \text{Ganancia Inicial}}{\text{Ganancia Inicial}} \times 100$$
5. Modela una proyección amortiguada para evitar sobrerreacciones a picos estacionales:
   $$\text{Estimación Próximo Mes} = \text{Promedio Móvil} \times \left(1 + \frac{\text{Tendencia \%}}{100} \times 0.5\right)$$

## 3. Formato de Comunicación al Usuario
Presenta la respuesta dividida en tres bloques:
1. **Historial Base**: Tabla con las ganancias de los últimos $N$ meses analizados.
2. **Resultado de la Proyección**:
   - Promedio móvil calculado: `$X,XXX.XX`
   - Tendencia observada: `+X.X%` (o `-X.X%`)
   - **Ganancia Neta Estimada para el Próximo Mes**: `$X,XXX.XX`
   - Nivel de confiabilidad de la estimación (`alta`, `media`, `baja` según la cantidad y consistencia de datos históricos).
3. **Advertencia de Responsabilidad**:
   *"Nota: Este cálculo es una estimación estadística basada exclusivamente en el comportamiento de los últimos N meses. Factores externos imprevistos (días festivos, competencia, clima, variaciones de precios de proveedores) pueden modificar el resultado real."*
