-- =============================================================================
-- Datos de Prueba (Seed Data) para Agente Bodega
-- Archivo: supabase/seed/seed_data.sql
-- =============================================================================

-- 1. Proveedores
INSERT INTO suppliers (id, name, phone, email, notes) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Distribuidora Bebidas del Norte', '555-0101', 'ventas@bebidasnorte.com', 'Entrega los martes y jueves'),
  ('a0000000-0000-0000-0000-000000000002', 'Comercializadora Abarrotes Central', '555-0102', 'pedidos@centralabarrotes.com', 'Pedido mínimo $500');

-- 2. Catálogo de Productos (20 productos representativos)
INSERT INTO products (id, name, barcode, category, cost_price, sale_price, stock_quantity, min_stock, supplier_id) VALUES
  -- Bebidas
  ('b0000000-0000-0000-0000-000000000001', 'Coca-Cola 600ml', '7501055301072', 'Bebidas', 12.00, 18.00, 4, 12, 'a0000000-0000-0000-0000-000000000001'), -- Bajo mínimo
  ('b0000000-0000-0000-0000-000000000002', 'Coca-Cola Sin Azúcar 600ml', '7501055365449', 'Bebidas', 12.00, 18.00, 15, 8, 'a0000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000003', 'Agua Purificada Ciel 1L', '7501055312344', 'Bebidas', 7.50, 13.00, 2, 10, 'a0000000-0000-0000-0000-000000000001'), -- Bajo mínimo
  ('b0000000-0000-0000-0000-000000000004', 'Jugo Del Valle Mango 413ml', '7501055323456', 'Bebidas', 11.00, 16.50, 9, 6, 'a0000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000005', 'Electrolit Fresa 625ml', '7501125101014', 'Bebidas', 21.00, 32.00, 5, 8, 'a0000000-0000-0000-0000-000000000001'), -- Bajo mínimo

  -- Snacks y Botanas
  ('b0000000-0000-0000-0000-000000000006', 'Papas Sabritas Sal 45g', '7501011115678', 'Snacks', 13.50, 20.00, 3, 10, 'a0000000-0000-0000-0000-000000000002'), -- Bajo mínimo
  ('b0000000-0000-0000-0000-000000000007', 'Doritos Nacho 58g', '7501011123456', 'Snacks', 14.00, 21.00, 14, 10, 'a0000000-0000-0000-0000-000000000002'),
  ('b0000000-0000-0000-0000-000000000008', 'Ruffles Queso 48g', '7501011134567', 'Snacks', 14.00, 21.00, 8, 8, 'a0000000-0000-0000-0000-000000000002'),
  ('b0000000-0000-0000-0000-000000000009', 'Cacahuates Japoneses Karate 100g', '7501011145678', 'Snacks', 9.00, 15.00, 18, 5, 'a0000000-0000-0000-0000-000000000002'),
  ('b0000000-0000-0000-0000-000000000010', 'Galletas Emperador Chocolate 101g', '7501000612345', 'Galletas', 11.50, 18.00, 12, 6, 'a0000000-0000-0000-0000-000000000002'),

  -- Lácteos y Básicos
  ('b0000000-0000-0000-0000-000000000011', 'Leche Entera Lala 1L', '7501020512345', 'Lácteos', 19.50, 27.50, 4, 10, 'a0000000-0000-0000-0000-000000000002'), -- Bajo mínimo
  ('b0000000-0000-0000-0000-000000000012', 'Leche Deslactosada Lala 1L', '7501020523456', 'Lácteos', 21.00, 29.50, 11, 8, 'a0000000-0000-0000-0000-000000000002'),
  ('b0000000-0000-0000-0000-000000000013', 'Huevos San Juan 12 piezas', '7501030412345', 'Abarrotes', 32.00, 45.00, 6, 8, 'a0000000-0000-0000-0000-000000000002'),
  ('b0000000-0000-0000-0000-000000000014', 'Pan Blanco Bimbo Grande 680g', '7501000112345', 'Panadería', 36.00, 48.00, 5, 6, 'a0000000-0000-0000-0000-000000000002'),
  ('b0000000-0000-0000-0000-000000000015', 'Frijoles Negros Isadora 430g', '7501040512345', 'Abarrotes', 14.00, 22.00, 15, 6, 'a0000000-0000-0000-0000-000000000002'),
  ('b0000000-0000-0000-0000-000000000016', 'Atún Dolores en Agua 140g', '7501050612345', 'Abarrotes', 16.00, 24.50, 20, 8, 'a0000000-0000-0000-0000-000000000002'),

  -- Limpieza y Cuidado Personal
  ('b0000000-0000-0000-0000-000000000017', 'Papel Higiénico Pétalo 4 rollos', '7501060712345', 'Limpieza', 24.00, 36.00, 10, 6, 'a0000000-0000-0000-0000-000000000002'),
  ('b0000000-0000-0000-0000-000000000018', 'Jabón Zote Rosa 400g', '7501070812345', 'Limpieza', 18.00, 26.00, 12, 5, 'a0000000-0000-0000-0000-000000000002'),
  ('b0000000-0000-0000-0000-000000000019', 'Cloro Cloralex El Rendidor 950ml', '7501080912345', 'Limpieza', 14.50, 22.00, 8, 5, 'a0000000-0000-0000-0000-000000000002'),
  ('b0000000-0000-0000-0000-000000000020', 'Detergente Foca 1kg', '7501090112345', 'Limpieza', 28.00, 42.00, 7, 5, 'a0000000-0000-0000-0000-000000000002');

-- 3. Compras Históricas Iniciales
INSERT INTO purchases (product_id, supplier_id, quantity, unit_cost, purchased_at, notes) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 48, 12.00, now() - interval '60 days', 'Caja de 48 refrescos'),
  ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000002', 30, 13.50, now() - interval '45 days', 'Tira Sabritas'),
  ('b0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000002', 24, 19.50, now() - interval '30 days', 'Caja de 24 leches'),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 24, 7.50, now() - interval '20 days', 'Caja de aguas'),
  ('b0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000002', 12, 36.00, now() - interval '10 days', 'Lote Bimbo');

-- 4. Ventas Históricas Distribuidas
INSERT INTO sales (product_id, quantity, unit_price, sold_at) VALUES
  -- Ventas Mes -2
  ('b0000000-0000-0000-0000-000000000001', 12, 18.00, now() - interval '55 days'),
  ('b0000000-0000-0000-0000-000000000006', 8, 20.00, now() - interval '52 days'),
  ('b0000000-0000-0000-0000-000000000011', 6, 27.50, now() - interval '48 days'),
  -- Ventas Mes -1
  ('b0000000-0000-0000-0000-000000000001', 18, 18.00, now() - interval '25 days'),
  ('b0000000-0000-0000-0000-000000000007', 9, 21.00, now() - interval '22 days'),
  ('b0000000-0000-0000-0000-000000000011', 10, 27.50, now() - interval '18 days'),
  -- Ventas Mes Actual
  ('b0000000-0000-0000-0000-000000000001', 14, 18.00, now() - interval '4 days'),
  ('b0000000-0000-0000-0000-000000000006', 11, 20.00, now() - interval '3 days'),
  ('b0000000-0000-0000-0000-000000000003', 12, 13.00, now() - interval '2 days'),
  ('b0000000-0000-0000-0000-000000000011', 4, 27.50, now() - interval '1 day'),
  ('b0000000-0000-0000-0000-000000000014', 3, 48.00, now() - interval '5 hours');

-- 5. Gastos Operativos
INSERT INTO expenses (category, description, amount, expense_date) VALUES
  ('Servicios', 'Recibo de luz CFE (Refrigeradores)', 1250.00, (CURRENT_DATE - interval '45 days')::date),
  ('Mantenimiento', 'Reparación de enfriador de vitrina', 450.00, (CURRENT_DATE - interval '35 days')::date),
  ('Suministros', 'Rollo de bolsas plásticas y papel térmico', 280.00, (CURRENT_DATE - interval '28 days')::date),
  ('Servicios', 'Recibo de luz CFE mensual', 1320.00, (CURRENT_DATE - interval '15 days')::date),
  ('Renta', 'Renta mensual del local', 3500.00, (CURRENT_DATE - interval '10 days')::date),
  ('Limpieza', 'Fabuloso, escobas y sanitizante', 190.00, (CURRENT_DATE - interval '3 days')::date);
