-- =============================================================================
-- Migración Inicial: Esquema de Base de Datos para Agente Bodega
-- Archivo: supabase/migrations/001_initial_schema.sql
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Tabla: suppliers (Proveedores opcionales)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS suppliers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  phone       text,
  email       text,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 2. Tabla: products (Catálogo de productos e inventario)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  barcode         text UNIQUE,
  category        text NOT NULL DEFAULT 'Abarrotes',
  cost_price      numeric(10,2) NOT NULL CHECK (cost_price >= 0),
  sale_price      numeric(10,2) NOT NULL CHECK (sale_price >= 0),
  stock_quantity  integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  min_stock       integer NOT NULL DEFAULT 5 CHECK (min_stock >= 0),
  supplier_id     uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_low_stock ON products(stock_quantity) WHERE stock_quantity <= min_stock;

-- -----------------------------------------------------------------------------
-- 3. Tabla: sales (Registro de transacciones de salida)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sales (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity    integer NOT NULL CHECK (quantity > 0),
  unit_price  numeric(10,2) NOT NULL CHECK (unit_price >= 0),
  total       numeric(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  sold_at     timestamptz NOT NULL DEFAULT now(),
  notes       text
);

CREATE INDEX IF NOT EXISTS idx_sales_product_id ON sales(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_sold_at ON sales(sold_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_sold_at_product ON sales(sold_at DESC, product_id);

-- -----------------------------------------------------------------------------
-- 4. Tabla: purchases (Registro de compras de reabastecimiento)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchases (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  supplier_id   uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  quantity      integer NOT NULL CHECK (quantity > 0),
  unit_cost     numeric(10,2) NOT NULL CHECK (unit_cost >= 0),
  total         numeric(10,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  purchased_at  timestamptz NOT NULL DEFAULT now(),
  notes         text
);

CREATE INDEX IF NOT EXISTS idx_purchases_product_id ON purchases(product_id);
CREATE INDEX IF NOT EXISTS idx_purchases_purchased_at ON purchases(purchased_at DESC);

-- -----------------------------------------------------------------------------
-- 5. Tabla: expenses (Gastos operativos generales)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS expenses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category      text NOT NULL,
  description   text NOT NULL,
  amount        numeric(10,2) NOT NULL CHECK (amount > 0),
  expense_date  date NOT NULL DEFAULT CURRENT_DATE,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- -----------------------------------------------------------------------------
-- 6. Tabla: purchase_orders (Órdenes de compra con flujo de aprobación)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchase_orders (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  items         jsonb NOT NULL,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  suggested_by  text NOT NULL DEFAULT 'agent',
  supplier_id   uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  approved_at   timestamptz,
  rejected_at   timestamptz
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_created_at ON purchase_orders(created_at DESC);

-- -----------------------------------------------------------------------------
-- 7. Funciones y Triggers de Actualización Automática
-- -----------------------------------------------------------------------------

-- Trigger para updated_at en products
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Trigger: Reducir stock al registrar venta
CREATE OR REPLACE FUNCTION fn_reduce_stock_sale()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET stock_quantity = stock_quantity - NEW.quantity
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sales_reduce_stock ON sales;
CREATE TRIGGER trg_sales_reduce_stock
  AFTER INSERT ON sales
  FOR EACH ROW EXECUTE FUNCTION fn_reduce_stock_sale();

-- Trigger: Aumentar stock al registrar compra
CREATE OR REPLACE FUNCTION fn_increase_stock_purchase()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET stock_quantity = stock_quantity + NEW.quantity
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_purchases_increase_stock ON purchases;
CREATE TRIGGER trg_purchases_increase_stock
  AFTER INSERT ON purchases
  FOR EACH ROW EXECUTE FUNCTION fn_increase_stock_purchase();

-- -----------------------------------------------------------------------------
-- 8. Row Level Security (RLS)
-- -----------------------------------------------------------------------------
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_suppliers" ON suppliers;
CREATE POLICY "auth_suppliers" ON suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_products" ON products;
CREATE POLICY "auth_products" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_sales" ON sales;
CREATE POLICY "auth_sales" ON sales FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_purchases" ON purchases;
CREATE POLICY "auth_purchases" ON purchases FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_expenses" ON expenses;
CREATE POLICY "auth_expenses" ON expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_orders" ON purchase_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
