-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       VARCHAR(20) UNIQUE NOT NULL,
  name        VARCHAR(120) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 VARCHAR(120) NOT NULL,
  price                NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  stock                INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  low_stock_threshold  INT NOT NULL DEFAULT 5,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id           UUID PRIMARY KEY,
  client_id    UUID UNIQUE NOT NULL,
  customer_id  UUID REFERENCES customers(id) ON DELETE SET NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','paid','delivered','cancelled')),
  total        NUMERIC(10,2) NOT NULL CHECK (total >= 0),
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL,
  synced_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id) ON DELETE SET NULL,
  name        VARCHAR(120) NOT NULL,
  price       NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  quantity    INT NOT NULL CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Sync log for idempotency
CREATE TABLE IF NOT EXISTS sync_log (
  client_id    UUID PRIMARY KEY,
  entity_type  VARCHAR(30) NOT NULL,
  resolved_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
