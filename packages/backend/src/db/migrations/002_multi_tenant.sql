-- Tenants (one row per business)
CREATE TABLE IF NOT EXISTS tenants (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Users (owners and cashiers belong to a tenant)
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  username      VARCHAR(60) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'owner'
                  CHECK (role IN ('owner', 'cashier')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_username  ON users(username);

-- Add tenant_id to all data tables
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE products  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE orders    ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Replace global phone uniqueness with per-tenant uniqueness
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'customers_phone_key'
  ) THEN
    ALTER TABLE customers DROP CONSTRAINT customers_phone_key;
  END IF;
END$$;

ALTER TABLE customers
  DROP CONSTRAINT IF EXISTS customers_phone_tenant_unique;
ALTER TABLE customers
  ADD  CONSTRAINT customers_phone_tenant_unique UNIQUE (tenant_id, phone);

-- Indexes for tenant-scoped lookups
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant_id  ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_tenant_id    ON orders(tenant_id);
