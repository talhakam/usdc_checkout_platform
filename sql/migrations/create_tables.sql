-- SQL migration for Supabase / Postgres
-- Run this in your Supabase SQL editor or via psql

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price_usdc numeric(18,6) NOT NULL,
  sku text,
  created_at timestamptz DEFAULT now()
);

CREATE TYPE order_status AS ENUM ('pending', 'paid', 'refunded');

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id text NOT NULL UNIQUE,
  consumer_wallet text NOT NULL,
  merchant_wallet text NOT NULL,
  total_amount numeric(18,6) NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

CREATE TYPE refund_status AS ENUM ('requested', 'approved', 'rejected', 'refunded');

CREATE TABLE IF NOT EXISTS refund_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id text NOT NULL REFERENCES orders(payment_id) ON DELETE CASCADE,
  refund_amount numeric(18,6) NOT NULL,
  consumer_wallet text NOT NULL,
  merchant_wallet text NOT NULL,
  reason text,
  status refund_status NOT NULL DEFAULT 'requested',
  created_at timestamptz DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_products_merchant ON products(merchant_id);
CREATE INDEX IF NOT EXISTS idx_orders_consumer ON orders(consumer_wallet);
CREATE INDEX IF NOT EXISTS idx_refunds_consumer ON refund_requests(consumer_wallet);
