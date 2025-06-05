-- Execute this SQL in your Supabase SQL Editor to fix the sales table schema

-- First, create the exec_sql function if it doesn't exist
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  EXECUTE sql;
  result := '{"success": true}'::JSONB;
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  result := jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
  RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;

-- Now fix the sales table schema
-- Add missing discount column
ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount DECIMAL(10,2) DEFAULT 0;

-- Ensure all required columns exist with proper case
ALTER TABLE sales ADD COLUMN IF NOT EXISTS "transactionId" TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS "cashAmount" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS "upiAmount" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS "changeAmount" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS tax DECIMAL(10,2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS "originalTotal" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT DEFAULT 'cash';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS "receivedAmount" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Drop old lowercase columns if they exist (be careful with this if you have data)
-- Uncomment these lines only if you're sure you want to remove the old columns
-- ALTER TABLE sales DROP COLUMN IF EXISTS cashamount;
-- ALTER TABLE sales DROP COLUMN IF EXISTS upiamount;
-- ALTER TABLE sales DROP COLUMN IF EXISTS changeamount;
-- ALTER TABLE sales DROP COLUMN IF EXISTS transactionid;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_transaction_id ON sales("transactionId");
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON sales("paymentMethod");

-- Verify the schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'sales' 
AND table_schema = 'public'
ORDER BY ordinal_position;