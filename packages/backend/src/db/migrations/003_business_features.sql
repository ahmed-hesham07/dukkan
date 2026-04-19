-- ─── Payment method + discount on orders ──────────────────────────────────────
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_method  VARCHAR(30)    NOT NULL DEFAULT 'cash'
    CHECK (payment_method IN ('cash','card','vodafone_cash','instapay','credit')),
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2)  NOT NULL DEFAULT 0
    CHECK (discount_amount >= 0),
  ADD COLUMN IF NOT EXISTS discount_reason VARCHAR(120);

-- ─── Cost price on products ────────────────────────────────────────────────────
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10,2) CHECK (cost_price >= 0);

-- ─── Customer credit ledger ────────────────────────────────────────────────────
-- debit  = customer received goods on credit (owes money to the shop)
-- payment = customer paid off some or all of their debt
CREATE TABLE IF NOT EXISTS customer_credit_events (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID         NOT NULL REFERENCES tenants(id)   ON DELETE CASCADE,
  customer_id UUID         NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  amount      NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  type        VARCHAR(20)  NOT NULL CHECK (type IN ('debit', 'payment')),
  order_id    UUID         REFERENCES orders(id) ON DELETE SET NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_credit_events_customer
  ON customer_credit_events(customer_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_credit_events_tenant
  ON customer_credit_events(tenant_id);

-- ─── Returns ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS returns (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID         NOT NULL REFERENCES tenants(id)  ON DELETE CASCADE,
  order_id      UUID         NOT NULL REFERENCES orders(id),
  total         NUMERIC(10,2) NOT NULL CHECK (total >= 0),
  refund_method VARCHAR(30)  NOT NULL DEFAULT 'cash'
    CHECK (refund_method IN ('cash','card','vodafone_cash','instapay','credit_note')),
  notes         TEXT,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_returns_order  ON returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_tenant ON returns(tenant_id);

CREATE TABLE IF NOT EXISTS return_items (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id     UUID         NOT NULL REFERENCES returns(id)      ON DELETE CASCADE,
  order_item_id UUID         REFERENCES order_items(id)           ON DELETE SET NULL,
  product_id    UUID         REFERENCES products(id)              ON DELETE SET NULL,
  name          VARCHAR(120) NOT NULL,
  price         NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  quantity      INT          NOT NULL CHECK (quantity > 0)
);
CREATE INDEX IF NOT EXISTS idx_return_items_return ON return_items(return_id);
