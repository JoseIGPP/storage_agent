# 01-database / tasks.md — Tareas de Base de Datos y Persistencia

## Checklist de Tareas

- [x] **T-01-1**: Crear la estructura de carpetas `supabase/migrations/` y `supabase/seed/`.
- [x] **T-01-2**: Escribir la migración inicial completa en `supabase/migrations/001_initial_schema.sql` con DDL, constraints, índices y funciones trigger.
- [x] **T-01-3**: Escribir el script de seed en `supabase/seed/seed_data.sql` que contenga:
  - 2 proveedores (Distribuidora Bebidas del Norte, Comercializadora Abarrotes Central).
  - 20 productos representativos de abarrotes con código de barras y niveles de stock variados.
  - 90 días de historial simulado de ventas.
  - 5 compras de reabastecimiento.
  - 6 gastos operativos recurrentes (luz, bolsas, renta).
- [x] **T-01-4**: Probar manualmente la migración en Supabase o contenedor PostgreSQL local.
- [x] **T-01-5**: Verificar mediante inserciones de prueba que `trg_sales_reduce_stock` descuenta el stock correctamente y `trg_purchases_increase_stock` lo incrementa.
- [ ] **T-01-6**: Validar que las políticas RLS bloquean accesos anónimos no autorizados.
